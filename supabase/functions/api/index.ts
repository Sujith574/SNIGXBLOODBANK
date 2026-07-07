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
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
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
async function register(req: Request): Promise<Response> {
  const { name, email, password, role } = await req.json();
  if (!name || !email || !password) {
    return json({ success: false, message: "name, email and password are required" }, 400);
  }

  const allowedRoles = ["bloodbank", "hospital", "donor"];
  const userRole = allowedRoles.includes(role) ? role : "bloodbank";

  // Step 1: Sign up the user via Supabase Auth admin endpoint (service role — no ANON_KEY needed)
  const signupRes = await fetch(SUPABASE_URL + "/auth/v1/admin/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + SVC_KEY,
      "apikey": SVC_KEY,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: false,
      user_metadata: { name, role: userRole },
    })
  });

  const signupData = await signupRes.json() as Record<string, unknown>;

  if (!signupRes.ok) {
    const msg = String(signupData.msg ?? signupData.message ?? signupData.error_description ?? "Registration failed");
    if (!msg.toLowerCase().includes("already")) {
      return json({ success: false, message: msg }, 400);
    }
  }

  const userId = signupData.user ? (signupData.user as Record<string, string>).id : null;

  // Step 2: Create/update profile row if user was created
  if (userId) {
    await dbUpsert("profiles", {
      id: userId,
      name,
      email,
      role: userRole,
      is_email_verified: false,
    });
  }

  // Step 3: Trigger OTP email via the public OTP endpoint (requires ANON_KEY, not service role)
  const otpRes = await fetch(SUPABASE_URL + "/auth/v1/otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
    },
    body: JSON.stringify({
      email,
      create_user: false,
    }),
  });

  if (!otpRes.ok) {
    const otpData = await otpRes.json() as Record<string, unknown>;
    const msg = String(otpData.msg ?? otpData.message ?? otpData.error_description ?? "Failed to send OTP email");
    return json({ success: false, message: msg }, 500);
  }

  return json({
    success: true,
    message: "Account created! Please enter the 6-digit OTP sent to your email address.",
    requireOtp: true,
  }, 201);
}

// ──────────────────────────────────────────────────────────
// VERIFY OTP  (Step 2: verify the 6-digit OTP)
// ──────────────────────────────────────────────────────────
async function verifyOtp(req: Request): Promise<Response> {
  const { email, token } = await req.json();
  if (!email || !token) {
    return json({ success: false, message: "email and OTP token are required" }, 400);
  }

  // Verify OTP with Supabase public verify endpoint (requires ANON_KEY)
  const verifyRes = await fetch(SUPABASE_URL + "/auth/v1/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
    },
    body: JSON.stringify({
      email,
      token,
      type: "email",
    }),
  });

  const verifyData = await verifyRes.json() as Record<string, unknown>;

  if (!verifyRes.ok) {
    const msg = String(
      verifyData.error_description ?? verifyData.msg ?? verifyData.message ?? verifyData.error ?? "Invalid or expired OTP"
    );
    return json({ success: false, message: msg }, 400);
  }

  // OTP verified — extract user ID from response
  const verifiedUser = verifyData.user as Record<string, unknown> | undefined;
  const userId = verifiedUser?.id as string | undefined;

  if (userId) {
    // Mark profile as email verified
    await dbPatch("profiles", "id=eq." + userId, {
      is_email_verified: true,
    });
  }

  // Return access token so user is auto-logged in right after verification
  const accessToken = verifyData.access_token as string | undefined;
  const refreshToken = verifyData.refresh_token as string | undefined;

  if (userId && accessToken) {
    const pRes = await dbSelect("profiles", "id=eq." + userId + "&select=name,role&limit=1");
    const profile = Array.isArray(pRes.data) && pRes.data.length > 0
      ? pRes.data[0] as Record<string, unknown>
      : null;

    return json({
      success: true,
      message: "Email verified successfully! You are now logged in.",
      data: {
        accessToken,
        refreshToken,
        user: {
          id: userId,
          email,
          name: profile?.name ?? "",
          role: profile?.role ?? "",
        },
      },
    });
  }

  // Verification succeeded but no session returned — ask user to log in
  return json({
    success: true,
    message: "Email verified successfully! Please log in to continue.",
  });
}

// ──────────────────────────────────────────────────────────
// RESEND OTP
// ──────────────────────────────────────────────────────────
async function resendOtp(req: Request): Promise<Response> {
  const { email } = await req.json();
  if (!email) return json({ success: false, message: "email is required" }, 400);

  const otpRes = await fetch(SUPABASE_URL + "/auth/v1/otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
    },
    body: JSON.stringify({
      email,
      create_user: false,
    }),
  });

  const otpData = await otpRes.json() as Record<string, unknown>;

  if (!otpRes.ok) {
    const msg = String(otpData.msg ?? otpData.message ?? otpData.error_description ?? "Failed to resend OTP");
    return json({ success: false, message: msg }, 500);
  }

  return json({ success: true, message: "Verification OTP resent successfully." });
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
    if (req.method === "POST" && path === "/verify-otp") return await verifyOtp(req);
    if (req.method === "POST" && path === "/resend-otp") return await resendOtp(req);
    if (req.method === "POST" && path === "/verify-email") return await verifyEmail(req);
    if (req.method === "POST" && path === "/login") return await login(req);

    // Get Auth Context (userId and role)
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return json({ success: false, message: "Unauthorized" }, 401);

    // Verify token & extract user profile information
    const userProfileRes = await fetch(SUPABASE_URL + "/auth/v1/user", {
      headers: {
        "Authorization": "Bearer " + token,
        "apikey": ANON_KEY,
      },
    });
    if (!userProfileRes.ok) return json({ success: false, message: "Invalid access token" }, 401);
    const userData = await userProfileRes.json();
    const userId = userData.id;

    // Fetch user profile role from DB
    const dbProfileRes = await dbSelect("profiles", "id=eq." + userId + "&select=role,name&limit=1");
    if (!dbProfileRes.ok || !Array.isArray(dbProfileRes.data) || dbProfileRes.data.length === 0) {
      return json({ success: false, message: "User profile not found" }, 404);
    }
    const userRole = dbProfileRes.data[0].role;
    const userName = dbProfileRes.data[0].name;

    // ─── DASHBOARD STATS ───
    if (req.method === "GET" && path === "/dashboard/stats") {
      if (userRole === "bloodbank") {
        const inv = await dbSelect("blood_inventory", "hospital_id=eq." + userId);
        const activeRequests = await dbSelect("blood_requests", "status=neq.completed&limit=15");
        const registeredDonors = await dbSelect("donors", "bloodbank_id=eq." + userId + "&limit=10");
        return json({
          success: true,
          stats: {
            inventory: inv.data ?? [],
            requests: activeRequests.data ?? [],
            donors: registeredDonors.data ?? [],
          }
        });
      } else if (userRole === "hospital") {
        const reqs = await dbSelect("blood_requests", "hospital_id=eq." + userId + "&limit=15");
        const hospProfile = await dbSelect("hospitals", "id=eq." + userId + "&limit=1");
        return json({
          success: true,
          stats: {
            requests: reqs.data ?? [],
            hospitalInfo: hospProfile.data?.[0] ?? { is_approved: false }
          }
        });
      } else if (userRole === "admin") {
        const totalUsers = await dbSelect("profiles", "select=id");
        const unapprovedHospitals = await dbSelect("hospitals", "is_approved=eq.false");
        const requests = await dbSelect("blood_requests", "select=id");
        return json({
          success: true,
          stats: {
            totalUsersCount: Array.isArray(totalUsers.data) ? totalUsers.data.length : 0,
            unapprovedHospitals: unapprovedHospitals.data ?? [],
            totalRequestsCount: Array.isArray(requests.data) ? requests.data.length : 0,
          }
        });
      }
    }

    // ─── BLOOD INVENTORY ───
    if (path === "/blood-inventory") {
      if (req.method === "GET") {
        const inv = await dbSelect("blood_inventory", "hospital_id=eq." + userId);
        return json({ success: true, data: inv.data ?? [] });
      }
      if (req.method === "POST" && userRole === "bloodbank") {
        const body = await req.json();
        // Use PATCH if record exists, otherwise INSERT
        const existingRes = await dbSelect("blood_inventory", "hospital_id=eq." + userId + "&blood_group=eq." + encodeURIComponent(body.bloodGroup) + "&limit=1");
        const existing = Array.isArray(existingRes.data) && existingRes.data.length > 0 ? existingRes.data[0] as { id: string } : null;
        let res;
        if (existing) {
          res = await dbPatch("blood_inventory", "id=eq." + existing.id, {
            units_available: Number(body.units),
            updated_at: new Date().toISOString()
          });
        } else {
          res = await dbUpsert("blood_inventory", {
            hospital_id: userId,
            blood_group: body.bloodGroup,
            units_available: Number(body.units),
            updated_at: new Date().toISOString()
          });
        }
        return json({ success: res.ok, message: res.ok ? "Inventory updated" : "Inventory update failed" });
      }
    }

    // ─── BLOOD REQUESTS ───
    if (path === "/blood-requests") {
      if (req.method === "GET") {
        const reqs = await dbSelect("blood_requests", "order=created_at.desc");
        return json({ success: true, data: reqs.data ?? [] });
      }
      if (req.method === "POST" && userRole === "hospital") {
        const body = await req.json();
        const res = await dbUpsert("blood_requests", {
          patient_name: body.patientName,
          age: Number(body.age),
          gender: body.gender,
          blood_group: body.bloodGroup,
          units_required: Number(body.unitsRequired),
          hospital_id: userId,
          doctor_name: body.doctorName,
          emergency_level: body.emergencyLevel,
          reason: body.reason,
          required_date: body.requiredDate,
          status: "pending"
        });
        return json({ success: res.ok, message: res.ok ? "Blood request published" : "Request creation failed" });
      }
    }

    // ─── GIVE / PROVIDE BLOOD UNITS ───
    if (path === "/blood-requests/fulfill" && req.method === "POST" && userRole === "bloodbank") {
      const body = await req.json();
      const { requestId, unitsProvided, bloodGroup } = body;

      // 1. Record fulfillment
      const fulfillmentRes = await dbUpsert("fulfillments", {
        request_id: requestId,
        bloodbank_id: userId,
        units_provided: Number(unitsProvided)
      });

      if (!fulfillmentRes.ok) return json({ success: false, message: "Failed to record fulfillment transaction" }, 500);

      // 2. Fetch original request details
      const reqDetails = await dbSelect("blood_requests", "id=eq." + requestId + "&limit=1");
      if (reqDetails.ok && Array.isArray(reqDetails.data) && reqDetails.data.length > 0) {
        const request = reqDetails.data[0];
        const remainingRequired = Math.max(0, request.units_required - Number(unitsProvided));
        
        // Update request status if completely fulfilled
        await dbPatch("blood_requests", "id=eq." + requestId, {
          units_required: remainingRequired,
          status: remainingRequired === 0 ? "completed" : "pending"
        });
      }

      // 3. Deduct units from inventory if exists
      const stockDetails = await dbSelect("blood_inventory", "hospital_id=eq." + userId + "&blood_group=eq." + bloodGroup + "&limit=1");
      if (stockDetails.ok && Array.isArray(stockDetails.data) && stockDetails.data.length > 0) {
        const currentUnits = stockDetails.data[0].units_available;
        await dbPatch("blood_inventory", "id=eq." + stockDetails.data[0].id, {
          units_available: Math.max(0, currentUnits - Number(unitsProvided)),
          updated_at: new Date().toISOString()
        });
      }

      return json({ success: true, message: "Units successfully provided to the hospital" });
    }

    // ─── REGISTER BLOOD DONOR RECORDS ───
    if (path === "/donors/create" && req.method === "POST" && userRole === "bloodbank") {
      const body = await req.json();
      const res = await dbUpsert("donors", {
        bloodbank_id: userId,
        phone: body.phone,
        gender: body.gender,
        weight_kg: Number(body.weightKg),
        blood_group: body.bloodGroup,
        date_of_birth: body.dateOfBirth,
        address: body.address,
        state: body.state,
        district: body.district,
        city: body.city,
        pincode: body.pincode,
        medical_history: body.medicalHistory
      });
      return json({ success: res.ok, message: res.ok ? "Donor record successfully added" : "Failed to record donor details" });
    }

    // ─── GET REGISTERED DONOR LIST ───
    if (path === "/donors" && req.method === "GET" && userRole === "bloodbank") {
      const res = await dbSelect("donors", "bloodbank_id=eq." + userId);
      return json({ success: true, data: res.data ?? [] });
    }

    // ─── HOSPITAL PROFILE REGISTRATION ───
    if (path === "/hospital/profile" && req.method === "POST" && userRole === "hospital") {
      const body = await req.json();
      const res = await dbUpsert("hospitals", {
        id: userId,
        registration_number: body.registrationNumber,
        license_number: body.licenseNumber,
        doctor_name: body.doctorName,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        is_approved: false
      });
      return json({ success: res.ok, message: res.ok ? "Profile submitted for review" : "Submission failed" });
    }

    // ─── HOSPITAL VERIFICATION (ADMIN ONLY) ───
    if (path === "/admin/approve-hospital" && req.method === "POST" && userRole === "admin") {
      const body = await req.json();
      const res = await dbPatch("hospitals", "id=eq." + body.hospitalId, { is_approved: true });
      return json({ success: res.ok, message: res.ok ? "Hospital approved successfully" : "Approval failed" });
    }

    // ─── BLOOD AVAILABILITY SEARCH (hospital authenticated) ───
    if (path === "/blood/availability" && req.method === "GET") {
      const url = new URL(req.url);
      const bloodGroup = url.searchParams.get("blood_group");
      const city = url.searchParams.get("city");
      const state = url.searchParams.get("state");

      let filter = "select=bloodbank_id,blood_group,units_available,profiles!inner(name,email)";
      const conditions: string[] = [];
      if (bloodGroup) conditions.push("blood_group=eq." + bloodGroup);
      if (city) conditions.push("city=eq." + city);
      // Join from blood_inventory → profile
      let inventoryFilter = "units_available=gt.0";
      if (bloodGroup) inventoryFilter += "&blood_group=eq." + bloodGroup;

      const invRes = await dbSelect("blood_inventory", inventoryFilter + "&select=bloodbank_id,blood_group,units_available");
      const profilesRes = await dbSelect("profiles", "role=eq.bloodbank&select=id,name,email,city,state");

      if (!invRes.ok || !profilesRes.ok) {
        return json({ success: false, message: "Failed to fetch availability" }, 500);
      }

      const profiles: Record<string, { name: string; email: string; city?: string; state?: string }> = {};
      if (Array.isArray(profilesRes.data)) {
        for (const p of profilesRes.data as { id: string; name: string; email: string; city?: string; state?: string }[]) {
          profiles[p.id] = p;
        }
      }

      let results: unknown[] = [];
      if (Array.isArray(invRes.data)) {
        results = (invRes.data as { bloodbank_id: string; blood_group: string; units_available: number }[])
          .filter((row) => profiles[row.bloodbank_id])
          .filter((row) => {
            const p = profiles[row.bloodbank_id];
            if (city && p.city?.toLowerCase() !== city.toLowerCase()) return false;
            if (state && p.state?.toLowerCase() !== state.toLowerCase()) return false;
            return true;
          })
          .map((row) => {
            const p = profiles[row.bloodbank_id];
            return {
              bloodbank_id: row.bloodbank_id,
              bloodbank_name: p.name,
              blood_group: row.blood_group,
              units: row.units_available,
              city: p.city,
              state: p.state,
            };
          });
      }
      return json({ success: true, data: results });
    }

    // ─── GET CURRENT USER PROFILE ───
    if (path === "/profile" && req.method === "GET") {
      const pRes = await dbSelect("profiles", "id=eq." + userId + "&select=id,name,email,role,city,state,is_email_verified,created_at&limit=1");
      const p = Array.isArray(pRes.data) && pRes.data.length > 0 ? pRes.data[0] : null;
      if (!p) return json({ success: false, message: "Profile not found" }, 404);
      return json({ success: true, data: p });
    }

    // ─── UPDATE CURRENT USER PROFILE ───
    if (path === "/profile" && req.method === "PATCH") {
      const body = await req.json();
      const allowed: Record<string, unknown> = {};
      if (body.name !== undefined) allowed.name = body.name;
      if (body.city !== undefined) allowed.city = body.city;
      if (body.state !== undefined) allowed.state = body.state;
      const pRes = await dbPatch("profiles", "id=eq." + userId, allowed);
      return json({ success: pRes.ok, message: pRes.ok ? "Profile updated" : "Update failed" });
    }

    // ─── GET HOSPITAL'S OWN PROFILE ───
    if (path === "/hospital/profile" && req.method === "GET" && userRole === "hospital") {
      const hospRes = await dbSelect("hospitals", "id=eq." + userId + "&limit=1");
      const hosp = Array.isArray(hospRes.data) && hospRes.data.length > 0 ? hospRes.data[0] : null;
      return json({ success: true, data: hosp });
    }

    // ─── HOSPITAL'S OWN BLOOD REQUESTS ───
    if (path === "/blood-requests/my" && req.method === "GET" && userRole === "hospital") {
      const res = await dbSelect("blood_requests", "hospital_id=eq." + userId + "&order=created_at.desc");
      return json({ success: true, data: res.data ?? [] });
    }

    // ─── ADMIN: LIST ALL BLOOD BANKS ───
    if (path === "/admin/bloodbanks" && req.method === "GET" && userRole === "admin") {
      const res = await dbSelect("profiles", "role=eq.bloodbank&select=id,name,email,city,state,is_email_verified,created_at&order=created_at.desc");
      return json({ success: true, data: res.data ?? [] });
    }

    // ─── ADMIN: LIST ALL HOSPITALS ───
    if (path === "/admin/hospitals" && req.method === "GET" && userRole === "admin") {
      const profilesRes = await dbSelect("profiles", "role=eq.hospital&select=id,name,email,city,state,created_at&order=created_at.desc");
      const hospitalsRes = await dbSelect("hospitals", "select=id,doctor_name,registration_number,is_approved");

      const hospitalDetails: Record<string, { doctor_name?: string; is_approved?: boolean }> = {};
      if (Array.isArray(hospitalsRes.data)) {
        for (const h of hospitalsRes.data as { id: string; doctor_name?: string; is_approved?: boolean }[]) {
          hospitalDetails[h.id] = h;
        }
      }

      const merged = Array.isArray(profilesRes.data)
        ? (profilesRes.data as { id: string; name: string; email: string; city?: string; state?: string; created_at: string }[]).map((p) => ({
            ...p,
            ...(hospitalDetails[p.id] || {}),
          }))
        : [];

      return json({ success: true, data: merged });
    }

    // ─── ADMIN: STATS ───
    if (path === "/admin/stats" && req.method === "GET" && userRole === "admin") {
      const [bbRes, hospRes, reqRes, donorsRes] = await Promise.all([
        dbSelect("profiles", "role=eq.bloodbank&select=id"),
        dbSelect("profiles", "role=eq.hospital&select=id"),
        dbSelect("blood_requests", "select=id,status"),
        dbSelect("donors", "select=id"),
      ]);

      const totalBB = Array.isArray(bbRes.data) ? bbRes.data.length : 0;
      const totalHosp = Array.isArray(hospRes.data) ? hospRes.data.length : 0;
      const allReqs = Array.isArray(reqRes.data) ? reqRes.data as { id: string; status: string }[] : [];
      const totalDonors = Array.isArray(donorsRes.data) ? donorsRes.data.length : 0;

      return json({
        success: true,
        data: {
          total_bloodbanks: totalBB,
          total_hospitals: totalHosp,
          total_requests: allReqs.length,
          pending_requests: allReqs.filter((r) => r.status === "pending").length,
          fulfilled_requests: allReqs.filter((r) => r.status === "fulfilled" || r.status === "completed" || r.status === "partially_fulfilled").length,
          total_donors: totalDonors,
        },
      });
    }

    return json({
      success: false,
      message: "Route not found: " + path,
    }, 404);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Unhandled:", msg);
    return json({ success: false, message: "Internal server error", detail: msg }, 500);
  }
});
