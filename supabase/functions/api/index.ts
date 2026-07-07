// Supabase Edge Function – Blood Bank API (v5)
// Admin-approval flow — no OTP. Admin credentials are hardcoded.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SVC_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// ── Hardcoded admin credentials ──────────────────────────────
const ADMIN_EMAIL = "snigx@bloodbank.in";
const ADMIN_PASSWORD = "Snigx0207";

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

// ── REST helpers (service role) ──────────────────────────────
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

async function dbDelete(table: string, filter: string) {
  const res = await fetch(SUPABASE_URL + "/rest/v1/" + table + "?" + filter, {
    method: "DELETE",
    headers: {
      "Authorization": "Bearer " + SVC_KEY,
      "apikey": SVC_KEY,
    },
  });
  return { ok: res.ok, status: res.status };
}

// ── HEALTH ───────────────────────────────────────────────────
function health(): Response {
  return json({ status: "ok", timestamp: new Date().toISOString() });
}

// ──────────────────────────────────────────────────────────
// REGISTER  (no OTP — account pending admin approval)
// ──────────────────────────────────────────────────────────
async function register(req: Request): Promise<Response> {
  const { name, email, password, role } = await req.json();
  if (!name || !email || !password) {
    return json({ success: false, message: "name, email and password are required" }, 400);
  }

  // Admin account cannot be registered through the form
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return json({ success: false, message: "This email is reserved." }, 400);
  }

  const allowedRoles = ["bloodbank", "hospital", "donor"];
  const userRole = allowedRoles.includes(role) ? role : "bloodbank";

  // Create user via admin API (email auto-confirmed so Supabase allows password sign-in)
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
      email_confirm: true,           // confirm email so token login works
      user_metadata: { name, role: userRole },
    })
  });

  const signupData = await signupRes.json() as Record<string, unknown>;

  if (!signupRes.ok) {
    const msg = String(signupData.msg ?? signupData.message ?? signupData.error_description ?? "Registration failed");
    return json({ success: false, message: msg }, 400);
  }

  const userId = (signupData.user as Record<string, string> | undefined)?.id
    ?? (signupData as Record<string, string>).id
    ?? null;

  if (!userId) {
    return json({ success: false, message: "User created but ID not returned. Please contact support." }, 500);
  }

  // Create profile with is_approved = false (pending admin approval)
  await dbUpsert("profiles", {
    id: userId,
    name,
    email,
    role: userRole,
    is_email_verified: true,
    is_approved: false,
  });

  return json({
    success: true,
    message: "Account created! Your account is pending admin approval. You will be able to login once approved.",
    pendingApproval: true,
  }, 201);
}

// ──────────────────────────────────────────────────────────
// LOGIN  (admin hardcoded + approval check for others)
// ──────────────────────────────────────────────────────────
async function login(req: Request): Promise<Response> {
  const { email, password } = await req.json();
  if (!email || !password) return json({ success: false, message: "email and password are required" }, 400);

  // ── Hardcoded admin login ──
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    if (password !== ADMIN_PASSWORD) {
      return json({ success: false, message: "Invalid admin credentials" }, 401);
    }

    // Ensure admin user exists in Supabase Auth
    let adminUserId: string | null = null;

    // Try to find admin by email in profiles first
    const adminProfileRes = await dbSelect("profiles", "email=eq." + ADMIN_EMAIL + "&role=eq.admin&limit=1");
    if (Array.isArray(adminProfileRes.data) && adminProfileRes.data.length > 0) {
      adminUserId = (adminProfileRes.data[0] as Record<string, string>).id;
    }

    if (!adminUserId) {
      // Create admin user in Supabase Auth
      const createRes = await fetch(SUPABASE_URL + "/auth/v1/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + SVC_KEY,
          "apikey": SVC_KEY,
        },
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: { name: "Admin", role: "admin" },
        })
      });
      const createData = await createRes.json() as Record<string, unknown>;
      adminUserId = (createData.user as Record<string, string> | undefined)?.id
        ?? (createData as Record<string, string>).id
        ?? null;

      if (adminUserId) {
        await dbUpsert("profiles", {
          id: adminUserId,
          name: "Admin",
          email: ADMIN_EMAIL,
          role: "admin",
          is_email_verified: true,
          is_approved: true,
        });
      }
    }

    if (!adminUserId) {
      return json({ success: false, message: "Admin setup failed. Contact system owner." }, 500);
    }

    // Sign in admin via Supabase token
    const signInRes = await fetch(SUPABASE_URL + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": ANON_KEY },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    const signInData = await signInRes.json() as Record<string, unknown>;

    if (!signInRes.ok) {
      // Fallback: update admin password and retry
      await svcFetch("/auth/v1/admin/users/" + adminUserId, "PUT", { password: ADMIN_PASSWORD });
      const retryRes = await fetch(SUPABASE_URL + "/auth/v1/token?grant_type=password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": ANON_KEY },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      });
      const retryData = await retryRes.json() as Record<string, unknown>;
      if (!retryRes.ok) {
        return json({ success: false, message: "Admin login failed. Try again." }, 500);
      }
      return json({
        success: true,
        data: {
          accessToken: retryData.access_token,
          refreshToken: retryData.refresh_token,
          user: { id: adminUserId, email: ADMIN_EMAIL, name: "Admin", role: "admin" },
        },
      });
    }

    return json({
      success: true,
      data: {
        accessToken: signInData.access_token,
        refreshToken: signInData.refresh_token,
        user: { id: adminUserId, email: ADMIN_EMAIL, name: "Admin", role: "admin" },
      },
    });
  }

  // ── Regular user login ──
  const signInRes = await fetch(SUPABASE_URL + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": ANON_KEY },
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

  // Fetch profile and check approval status
  const pRes = await dbSelect("profiles", "id=eq." + userId + "&select=is_approved,name,role&limit=1");
  const profiles = Array.isArray(pRes.data) ? pRes.data : [];
  const profile = profiles[0] as Record<string, unknown> | undefined;

  if (!profile) {
    return json({ success: false, message: "Account not found. Please register first." }, 404);
  }

  if (!profile.is_approved) {
    return json({
      success: false,
      message: "Your account is pending admin approval. Please wait for the admin to approve your account before logging in.",
      pendingApproval: true,
    }, 403);
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
    if (req.method === "POST" && path === "/login") return await login(req);

    // ── Authenticated routes ────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return json({ success: false, message: "Unauthorized" }, 401);

    // Verify token & extract user info
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
    const dbProfileRes = await dbSelect("profiles", "id=eq." + userId + "&select=role,name,is_approved&limit=1");
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
        const registeredDonors = await dbSelect("donor_records", "bloodbank_id=eq." + userId + "&limit=10");
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
      } else if (userRole === "donor") {
        const donorProfile = await dbSelect("donors", "id=eq." + userId + "&limit=1");
        return json({
          success: true,
          stats: {
            donorInfo: donorProfile.data?.[0] ?? null,
          }
        });
      } else if (userRole === "admin") {
        const [bbRes, hospRes, reqRes, pendingRes] = await Promise.all([
          dbSelect("profiles", "role=eq.bloodbank&select=id"),
          dbSelect("profiles", "role=eq.hospital&select=id"),
          dbSelect("blood_requests", "select=id,status"),
          dbSelect("profiles", "is_approved=eq.false&role=neq.admin&select=id"),
        ]);
        return json({
          success: true,
          stats: {
            totalUsersCount: (Array.isArray(bbRes.data) ? bbRes.data.length : 0) + (Array.isArray(hospRes.data) ? hospRes.data.length : 0),
            pendingApprovals: Array.isArray(pendingRes.data) ? pendingRes.data.length : 0,
            totalRequestsCount: Array.isArray(reqRes.data) ? reqRes.data.length : 0,
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

      const fulfillmentRes = await dbUpsert("fulfillments", {
        request_id: requestId,
        bloodbank_id: userId,
        units_provided: Number(unitsProvided)
      });

      if (!fulfillmentRes.ok) return json({ success: false, message: "Failed to record fulfillment transaction" }, 500);

      const reqDetails = await dbSelect("blood_requests", "id=eq." + requestId + "&limit=1");
      if (reqDetails.ok && Array.isArray(reqDetails.data) && reqDetails.data.length > 0) {
        const request = reqDetails.data[0] as Record<string, number>;
        const remainingRequired = Math.max(0, request.units_required - Number(unitsProvided));
        await dbPatch("blood_requests", "id=eq." + requestId, {
          units_required: remainingRequired,
          status: remainingRequired === 0 ? "completed" : "pending"
        });
      }

      const stockDetails = await dbSelect("blood_inventory", "hospital_id=eq." + userId + "&blood_group=eq." + bloodGroup + "&limit=1");
      if (stockDetails.ok && Array.isArray(stockDetails.data) && stockDetails.data.length > 0) {
        const stock = stockDetails.data[0] as Record<string, number | string>;
        await dbPatch("blood_inventory", "id=eq." + stock.id, {
          units_available: Math.max(0, (stock.units_available as number) - Number(unitsProvided)),
          updated_at: new Date().toISOString()
        });
      }

      return json({ success: true, message: "Units successfully provided to the hospital" });
    }

    // ─── REGISTER BLOOD DONOR RECORDS (walk-in donors registered by blood bank) ───
    if (path === "/donors/create" && req.method === "POST" && userRole === "bloodbank") {
      const body = await req.json();
      const res = await dbUpsert("donor_records", {
        bloodbank_id: userId,
        name: body.name,
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
      const res = await dbSelect("donor_records", "bloodbank_id=eq." + userId);
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

    // ─── BLOOD AVAILABILITY SEARCH ───
    if (path === "/blood/availability" && req.method === "GET") {
      const searchParams = new URL(req.url).searchParams;
      const bloodGroup = searchParams.get("blood_group");
      const city = searchParams.get("city");
      const state = searchParams.get("state");

      let inventoryFilter = "units_available=gt.0";
      if (bloodGroup) inventoryFilter += "&blood_group=eq." + bloodGroup;

      const invRes = await dbSelect("blood_inventory", inventoryFilter + "&select=bloodbank_id,blood_group,units_available");
      const profilesRes = await dbSelect("profiles", "role=eq.bloodbank&is_approved=eq.true&select=id,name,email,city,state");

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
      const pRes = await dbSelect("profiles", "id=eq." + userId + "&select=id,name,email,role,city,state,is_email_verified,is_approved,created_at&limit=1");
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

    // ═══════════════════════════════════════════════════════
    // ADMIN ROUTES (require admin role)
    // ═══════════════════════════════════════════════════════

    // ─── ADMIN: PENDING APPROVALS ───
    if (path === "/admin/pending-users" && req.method === "GET" && userRole === "admin") {
      const res = await dbSelect("profiles", "is_approved=eq.false&role=neq.admin&select=id,name,email,role,created_at&order=created_at.asc");
      return json({ success: true, data: res.data ?? [] });
    }

    // ─── ADMIN: APPROVE USER ───
    if (path === "/admin/approve-user" && req.method === "POST" && userRole === "admin") {
      const body = await req.json();
      const res = await dbPatch("profiles", "id=eq." + body.userId, { is_approved: true });
      return json({ success: res.ok, message: res.ok ? "User approved successfully" : "Approval failed" });
    }

    // ─── ADMIN: REJECT / DELETE USER ───
    if (path === "/admin/reject-user" && req.method === "POST" && userRole === "admin") {
      const body = await req.json();
      // Delete profile
      await dbDelete("profiles", "id=eq." + body.userId);
      // Delete from Supabase Auth
      await svcFetch("/auth/v1/admin/users/" + body.userId, "DELETE");
      return json({ success: true, message: "User rejected and removed." });
    }

    // ─── ADMIN: LIST ALL BLOOD BANKS ───
    if (path === "/admin/bloodbanks" && req.method === "GET" && userRole === "admin") {
      const res = await dbSelect("profiles", "role=eq.bloodbank&select=id,name,email,city,state,is_approved,created_at&order=created_at.desc");
      return json({ success: true, data: res.data ?? [] });
    }

    // ─── ADMIN: LIST ALL HOSPITALS ───
    if (path === "/admin/hospitals" && req.method === "GET" && userRole === "admin") {
      const profilesRes = await dbSelect("profiles", "role=eq.hospital&select=id,name,email,city,state,is_approved,created_at&order=created_at.desc");
      const hospitalsRes = await dbSelect("hospitals", "select=id,doctor_name,registration_number,is_approved");

      const hospitalDetails: Record<string, { doctor_name?: string; is_approved?: boolean }> = {};
      if (Array.isArray(hospitalsRes.data)) {
        for (const h of hospitalsRes.data as { id: string; doctor_name?: string; is_approved?: boolean }[]) {
          hospitalDetails[h.id] = h;
        }
      }

      const merged = Array.isArray(profilesRes.data)
        ? (profilesRes.data as { id: string; name: string; email: string; city?: string; state?: string; created_at: string; is_approved: boolean }[]).map((p) => ({
            ...p,
            ...(hospitalDetails[p.id] || {}),
          }))
        : [];

      return json({ success: true, data: merged });
    }

    // ─── ADMIN: LIST ALL DONORS ───
    if (path === "/admin/donors" && req.method === "GET" && userRole === "admin") {
      const res = await dbSelect("profiles", "role=eq.donor&select=id,name,email,is_approved,created_at&order=created_at.desc");
      return json({ success: true, data: res.data ?? [] });
    }

    // ─── ADMIN: STATS ───
    if (path === "/admin/stats" && req.method === "GET" && userRole === "admin") {
      const [bbRes, hospRes, reqRes, donorsRes, pendingRes] = await Promise.all([
        dbSelect("profiles", "role=eq.bloodbank&select=id"),
        dbSelect("profiles", "role=eq.hospital&select=id"),
        dbSelect("blood_requests", "select=id,status"),
        dbSelect("donors", "select=id"),
        dbSelect("profiles", "is_approved=eq.false&role=neq.admin&select=id"),
      ]);

      const totalBB = Array.isArray(bbRes.data) ? bbRes.data.length : 0;
      const totalHosp = Array.isArray(hospRes.data) ? hospRes.data.length : 0;
      const allReqs = Array.isArray(reqRes.data) ? reqRes.data as { id: string; status: string }[] : [];
      const totalDonors = Array.isArray(donorsRes.data) ? donorsRes.data.length : 0;
      const pendingApprovals = Array.isArray(pendingRes.data) ? pendingRes.data.length : 0;

      return json({
        success: true,
        data: {
          total_bloodbanks: totalBB,
          total_hospitals: totalHosp,
          total_requests: allReqs.length,
          pending_requests: allReqs.filter((r) => r.status === "pending").length,
          fulfilled_requests: allReqs.filter((r) => r.status === "fulfilled" || r.status === "completed" || r.status === "partially_fulfilled").length,
          total_donors: totalDonors,
          pending_approvals: pendingApprovals,
        },
      });
    }

    // ─── ADMIN: APPROVE HOSPITAL (legacy) ───
    if (path === "/admin/approve-hospital" && req.method === "POST" && userRole === "admin") {
      const body = await req.json();
      const res = await dbPatch("hospitals", "id=eq." + body.hospitalId, { is_approved: true });
      return json({ success: res.ok, message: res.ok ? "Hospital approved successfully" : "Approval failed" });
    }

    return json({ success: false, message: "Route not found: " + path }, 404);

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Unhandled:", msg);
    return json({ success: false, message: "Internal server error", detail: msg }, 500);
  }
});
