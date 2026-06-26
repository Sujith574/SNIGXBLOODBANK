// Supabase Edge Function – Blood Bank API (v4)
// Formatted to match Axios response parsing in the React frontend.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SVC_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") ?? "http://localhost:5173";
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY") ?? "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "no-reply@example.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function sha256hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomHex(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}

// REST call to Supabase (service role)
async function svcFetch(path: string, method: string, body?: unknown) {
  const res = await fetch(SUPABASE_URL + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + SVC_KEY,
      "apikey": SVC_KEY,
      "Prefer": "return=representation",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

// REST query on a table
async function dbSelect(table: string, filter: string) {
  const res = await fetch(SUPABASE_URL + "/rest/v1/" + table + "?" + filter, {
    headers: {
      "Authorization": "Bearer " + SVC_KEY,
      "apikey": SVC_KEY,
    },
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

async function dbUpsert(table: string, row: unknown) {
  const res = await fetch(SUPABASE_URL + "/rest/v1/" + table, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + SVC_KEY,
      "apikey": SVC_KEY,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(row),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function dbPatch(table: string, filter: string, patch: unknown) {
  const res = await fetch(SUPABASE_URL + "/rest/v1/" + table + "?" + filter, {
    method: "PATCH",
    headers: {
      "Authorization": "Bearer " + SVC_KEY,
      "apikey": SVC_KEY,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify(patch),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

// ──────────────────────────────────────────────────────────
// REGISTER
// ──────────────────────────────────────────────────────────
async function register(req: Request): Promise<Response> {
  const { name, email, password, role } = await req.json();
  if (!name || !email || !password) {
    return json({ success: false, message: "name, email and password are required" }, 400);
  }

  const allowedRoles = ["admin", "donor", "hospital"];
  const userRole = allowedRoles.includes(role) ? role : "donor";

  // Create auth user (email_confirm = false)
  const createRes = await svcFetch("/auth/v1/admin/users", "POST", {
    email,
    password,
    email_confirm: false,
    user_metadata: { name, role: userRole },
  });

  if (!createRes.ok) {
    const e = createRes.data as Record<string, unknown>;
    return json({ success: false, message: String(e.msg ?? e.message ?? "Registration failed") }, 400);
  }

  const authUser = createRes.data as Record<string, unknown>;
  const userId = authUser.id as string;

  // Generate verification token
  const rawToken = randomHex();
  const tokenHash = await sha256hex(rawToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const profileRes = await dbUpsert("profiles", {
    id: userId,
    name,
    email,
    role: userRole,
    is_email_verified: false,
    email_verification_token: tokenHash,
    email_verification_expires_at: expiresAt,
  });

  if (!profileRes.ok) {
    const e = profileRes.data as Record<string, unknown>;
    return json({ success: false, message: String(e.message ?? "Profile creation failed") }, 400);
  }

  const verifyLink = APP_BASE_URL + "/verify-email?token=" + rawToken;

  if (SENDGRID_API_KEY) {
    await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + SENDGRID_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: FROM_EMAIL },
        subject: "Verify your email - Snigx Blood Bank",
        content: [
          { type: "text/plain", value: "Verify your account: " + verifyLink },
          { type: "text/html", value: "<p>Click to verify your email:</p><a href='" + verifyLink + "'>Verify Email</a>" },
        ],
      }),
    });
  }

  return json({
    success: true,
    message: "Registered! Please verify your email.",
    verifyLink: SENDGRID_API_KEY ? undefined : verifyLink,
  }, 201);
}

// ──────────────────────────────────────────────────────────
// VERIFY EMAIL
// ──────────────────────────────────────────────────────────
async function verifyEmail(req: Request): Promise<Response> {
  const { token } = await req.json();
  if (!token) return json({ success: false, message: "token is required" }, 400);

  const tokenHash = await sha256hex(token);

  const profileRes = await dbSelect(
    "profiles",
    "email_verification_token=eq." + encodeURIComponent(tokenHash) +
    "&select=id,is_email_verified,email_verification_expires_at&limit=1"
  );

  if (!profileRes.ok || !Array.isArray(profileRes.data) || profileRes.data.length === 0) {
    return json({ success: false, message: "Invalid or expired token" }, 400);
  }

  const profile = profileRes.data[0] as Record<string, unknown>;

  if (profile.is_email_verified) return json({ success: true, message: "Email already verified" });

  if (new Date(profile.email_verification_expires_at as string) < new Date()) {
    return json({ success: false, message: "Token has expired. Please register again." }, 400);
  }

  // 1. Mark verified in profiles table
  await dbPatch("profiles", "id=eq." + (profile.id as string), {
    is_email_verified: true,
    email_verification_token: null,
    email_verification_expires_at: null,
  });

  // 2. Confirm email in Supabase Auth
  await svcFetch("/auth/v1/admin/users/" + (profile.id as string), "PUT", {
    email_confirm: true,
  });

  return json({ success: true, message: "Email verified successfully! You can now log in." });
}

// ──────────────────────────────────────────────────────────
// LOGIN
// ──────────────────────────────────────────────────────────
async function login(req: Request): Promise<Response> {
  const { email, password } = await req.json();
  if (!email || !password) return json({ success: false, message: "email and password are required" }, 400);

  // Sign in via Supabase Auth password flow
  const signInRes = await fetch(SUPABASE_URL + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
    },
    body: JSON.stringify({ email, password }),
  });

  const signInData = await signInRes.json() as Record<string, unknown>;

  if (!signInRes.ok) {
    const msg = String(signInData.error_description ?? signInData.msg ?? signInData.error ?? "Invalid credentials");
    return json({ success: false, message: msg }, 401);
  }

  const userId = (signInData.user as Record<string, string>).id;
  const accessToken = signInData.access_token as string;
  const refreshToken = signInData.refresh_token as string;

  // Fetch profile info
  const pRes = await dbSelect("profiles", "id=eq." + userId + "&select=is_email_verified,name,role&limit=1");
  const profiles = Array.isArray(pRes.data) ? pRes.data : [];
  const profile = profiles[0] as Record<string, unknown> | undefined;

  if (!profile || !profile.is_email_verified) {
    return json({ success: false, message: "Email not verified. Please check your inbox." }, 403);
  }

  return json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email: (signInData.user as Record<string, string>).email,
        name: profile.name,
        role: profile.role,
      },
    },
  });
}

// ──────────────────────────────────────────────────────────
// HEALTH
// ──────────────────────────────────────────────────────────
function health(): Response {
  return json({ status: "ok", timestamp: new Date().toISOString() });
}

// ──────────────────────────────────────────────────────────
// ROUTER
// ──────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  const url = new URL(req.url);
  const path = url.pathname
    .replace(/^\/functions\/v1\/api/, "")
    .replace(/^\/api/, "")
    .replace(/^\/auth/, "") || "/";

  try {
    if (req.method === "GET" && path === "/health") return health();
    if (req.method === "POST" && path === "/register") return await register(req);
    if (req.method === "POST" && path === "/verify-email") return await verifyEmail(req);
    if (req.method === "POST" && path === "/login") return await login(req);
    return json({
      success: false,
      message: "Route not found: " + path,
      available: ["GET /health", "POST /register", "POST /verify-email", "POST /login"],
    }, 404);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Unhandled:", msg);
    return json({ success: false, message: "Internal server error", detail: msg }, 500);
  }
});
