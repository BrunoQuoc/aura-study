// AURA STUDY staging-only identity + device-pairing gateway.
// Never publish a service/secret key to client code. Only the Edge runtime holds it.
// Source deliberately contains NO email address or pairing token.
// npm package pinned: Supabase JS 2.102.0.
import { createClient } from "npm:@supabase/supabase-js@2.102.0";

const ALLOWED_ORIGINS = new Set([
  "https://brunoquoc.github.io",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  new URL(Deno.env.get("SUPABASE_URL") || "https://invalid.example").origin,
]);

function headers(origin: string | null) {
  const result: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin"
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    result["Access-Control-Allow-Origin"] = origin;
    result["Access-Control-Allow-Headers"] = "authorization, apikey, content-type, x-client-info";
    result["Access-Control-Allow-Methods"] = "POST, OPTIONS";
  }
  return result;
}
function answer(origin: string | null, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: headers(origin) });
}
function getKey(kind: "publishable" | "secret"): string {
  const jsonName = kind === "publishable"
    ? "SUPABASE_PUBLISHABLE_KEYS" : "SUPABASE_SECRET_KEYS";
  const legacyName = kind === "publishable"
    ? "SUPABASE_ANON_KEY" : "SUPABASE_SERVICE_ROLE_KEY";
  try {
    const names = JSON.parse(Deno.env.get(jsonName) || "{}");
    const configured = names.default;
    // Current hosted Supabase exposes the actual default key in this JSON;
    // older environments may expose the name of an env var instead.
    const expectedPrefix = kind === "publishable" ? "sb_publishable_" : "sb_secret_";
    if (typeof configured === "string" && configured.startsWith(expectedPrefix))
      return configured;
    const value = typeof configured === "string" ? Deno.env.get(configured) : null;
    if (value) return value;
  } catch (_) { /* fallback for legacy project configuration */ }
  const fallback = Deno.env.get(legacyName);
  if (!fallback) throw Error("Supabase runtime key unavailable");
  return fallback;
}
function makeServiceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  if (!url) throw Error("Supabase project URL missing");
  return createClient(url, getKey("secret"), {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
async function digest(value: string): Promise<string> {
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(raw), b => b.toString(16).padStart(2, "0")).join("");
}
function randomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24)); // 192-bit entropy.
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-")
    .replaceAll("/", "_").replace(/=+$/, "");
}
function uuidOrNull(value: unknown): string | null {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value : null;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return answer(null, 403, { error: "Origin is not authorized" });
  }
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: headers(origin) });
  if (req.method !== "POST") return answer(origin, 405, { error: "POST required" });

  const bearer = req.headers.get("authorization") || "";
  if (!/^Bearer\s+\S+$/i.test(bearer)) return answer(origin, 401, { error: "Sign-in required" });
  const jwt = bearer.replace(/^Bearer\s+/i, "");
  let input: Record<string, unknown>;
  try {
    const txt = await req.text();
    if (txt.length > 4096) return answer(origin, 413, { error: "Request too large" });
    input = JSON.parse(txt);
    if (!input || typeof input !== "object" || Array.isArray(input)) throw Error("bad input");
  } catch (_) {
    return answer(origin, 400, { error: "Invalid request" });
  }

  try {
    const service = makeServiceClient();
    // getUser hits Auth server: do not trust a JWT claim or a client-provided email.
    const { data: auth, error: authErr } = await service.auth.getUser(jwt);
    const user = auth?.user;
    if (authErr || !user) return answer(origin, 401, { error: "Authentication failed" });

    const isParent = user.is_anonymous === false &&
      typeof user.email === "string" && user.email_confirmed_at != null;
    const action = input.action;

    if (action === "bootstrap_parent") {
      if (!isParent) return answer(origin, 403, { error: "Verified parent login required" });
      const { data, error } = await service.rpc("aura_bootstrap_parent", { p_admin_uid: user.id });
      if (error) {
        if (error.code === "42501")
          return answer(origin, 403, { error: "Email đăng nhập chưa được phép kích hoạt Admin" });
        console.error("aura_bootstrap_parent failed", { code: error.code || "unknown" });
        return answer(origin, 500, { error: "Lỗi máy chủ khi khởi tạo hồ sơ Admin. Vui lòng thử lại." });
      }
      if (!Array.isArray(data) || data.length !== 1) {
        return answer(origin, 500, { error: "Phản hồi khởi tạo Admin không hợp lệ" });
      }
      return answer(origin, 200, {
        role: "admin", household_id: data[0].household_id,
        learner_id: data[0].learner_id
      });
    }

    if (action === "create_pairing_code" || action === "revoke_student_device") {
      if (!isParent) return answer(origin, 403, { error: "Parent login required" });
      const { data: household, error: he } = await service.from("aura_households")
        .select("id").eq("admin_uid", user.id).maybeSingle();
      if (he || !household) return answer(origin, 403, { error: "Admin not initialized" });

      if (action === "revoke_student_device") {
        const id = uuidOrNull(input.device_id);
        if (!id) return answer(origin, 400, { error: "Invalid device" });
        const { data, error } = await service.from("aura_student_devices")
          .update({ revoked_at: new Date().toISOString() })
          .eq("id", id).eq("household_id", household.id).is("revoked_at", null)
          .select("id").maybeSingle();
        if (error) return answer(origin, 500, { error: "Revocation failed" });
        return data ? answer(origin, 200, { revoked: true }) :
          answer(origin, 404, { error: "Active device not found" });
      }

      const { data: learner, error: le } = await service.from("aura_learners")
        .select("id").eq("household_id", household.id).maybeSingle();
      if (le || !learner) return answer(origin, 409, { error: "Learner not initialized" });

      // Revoke old unredeemed codes. Only the newest code remains valid.
      const { error: revokeError } = await service.from("aura_pairing_requests")
        .update({ revoked_at: new Date().toISOString() })
        .eq("household_id", household.id).is("redeemed_at", null).is("revoked_at", null);
      if (revokeError) return answer(origin, 500, { error: "Unable to rotate pairing code" });

      const code = randomCode();
      const token_sha256 = await digest(code);
      const { error: insertError } = await service.from("aura_pairing_requests").insert({
        household_id: household.id,
        learner_id: learner.id,
        issued_by: user.id,
        token_sha256,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      });
      if (insertError) return answer(origin, 500, { error: "Unable to issue pairing code" });
      return answer(origin, 200, { pairing_code: code, expires_in_seconds: 600 });
    }

    if (action === "redeem_pairing_code") {
      if (user.is_anonymous !== true) return answer(origin, 403, { error: "Student device login required" });
      const code = input.pairing_code;
      if (typeof code !== "string" || !/^[A-Za-z0-9_-]{32}$/.test(code)) {
        return answer(origin, 400, { error: "Invalid pairing code" });
      }
      const label = typeof input.device_label === "string" ? input.device_label.slice(0, 80) : "Thiết bị học";
      const { data, error } = await service.rpc("aura_redeem_device_pairing", {
        p_token_sha256: await digest(code),
        p_auth_uid: user.id,
        p_device_label: label
      });
      if (error || !Array.isArray(data) || data.length !== 1)
        return answer(origin, 403, { error: "Pairing code expired or invalid" });
      return answer(origin, 200, {
        role: "student", device_id: data[0].device_id,
        learner_id: data[0].learner_id
      });
    }

    if (action === "status") {
      if (isParent) {
        const { data } = await service.from("aura_households")
          .select("id").eq("admin_uid", user.id).maybeSingle();
        return answer(origin, 200, { role: data ? "admin" : "uninitialized" });
      }
      const { data } = await service.from("aura_student_devices")
        .select("id,learner_id").eq("auth_uid", user.id).is("revoked_at",null).maybeSingle();
      return answer(origin, 200, { role: data ? "student" : "unpaired",
        learner_id: data?.learner_id ?? null });
    }

    return answer(origin, 400, { error: "Unknown action" });
  } catch (_) {
    // Never disclose runtime secrets or child identifiers in errors/logs.
    return answer(origin, 500, { error: "AURA staging service unavailable" });
  }
});
