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

    const verifiedEmail = user.is_anonymous === false &&
      typeof user.email === "string" && user.email_confirmed_at != null;
    const {data:portalRoles,error:roleError}=await service.rpc("aura_portal_access_v1",{p_user_id:user.id});
    if(roleError||!portalRoles)return answer(origin,503,{error:"Role service unavailable"});
    const isParent=verifiedEmail&&portalRoles.parent===true;
    const isAdmin=verifiedEmail&&portalRoles.admin===true;
    const action = input.action;

    // V6: Admin provisions a username + password using Supabase Auth native GoTrue.
    // The client receives no service key, Auth UUID, internal email or password hash.
    // Password is sent only over HTTPS from Admin to Edge, then passed to GoTrue.
    if(action==="list_password_students" || action==="create_password_student" ||
       action==="enable_password_student" || action==="reset_password_student"){
      if(!isAdmin)return answer(origin,403,{error:"Admin access required"});
      if(action==="list_password_students"){
        const {data,error}=await service.rpc("aura_admin_password_students_v6",{p_admin_uid:user.id});
        if(error||!data)return answer(origin,503,{error:"Không đọc được danh sách học sinh."});
        return answer(origin,200,{students:data,staging_only:true});
      }
      const learnerId=uuidOrNull(input.student_id);
      const name=typeof input.name==="string"?input.name.trim().replace(/\s+/g," "):"";
      const username=typeof input.username==="string"?input.username.trim().toLowerCase():"";
      const password=typeof input.password==="string"?input.password:"";
      if(password.length<8||password.length>64||
         !/[a-zA-Z]/.test(password)||!/[0-9]/.test(password)||
         /[\u0000-\u001F\u007F]/.test(password)){
        return answer(origin,400,{error:"Mật khẩu cần 8–64 ký tự, gồm chữ và số."});
      }
      if(action==="reset_password_student"){
        if(!learnerId)return answer(origin,400,{error:"Học sinh không hợp lệ"});
        const {data:account,error:lookupError}=await service.rpc("aura_admin_password_account_v6",{
          p_admin_uid:user.id,p_student_id:learnerId
        });
        if(lookupError||!account?.auth_uid)return answer(origin,403,{error:"Không thể thay đổi tài khoản này"});
        const {error:updateError}=await service.auth.admin.updateUserById(account.auth_uid,{password});
        if(updateError)return answer(origin,500,{error:"Không thể đặt lại mật khẩu."});
        return answer(origin,200,{updated:true,username:account.username,staging_only:true});
      }
      if(!/^[a-z][a-z0-9._-]{2,29}$/.test(username))
        return answer(origin,400,{error:"Tên đăng nhập gồm 3–30 ký tự: chữ thường, số, dấu chấm, gạch."});
      if(password.toLowerCase().includes(username))
        return answer(origin,400,{error:"Không dùng tên đăng nhập trong mật khẩu."});
      if(action==="create_password_student"&&
         (name.length<2||name.length>60||/[<>\u0000-\u001f]/.test(name)))
        return answer(origin,400,{error:"Tên học sinh cần 2–60 ký tự."});
      if(action==="enable_password_student"&&!learnerId)
        return answer(origin,400,{error:"Học sinh không hợp lệ"});

      // The .invalid RFC-reserved domain is a private Auth identifier, not a mailbox.
      // Registration and password reset are Admin-only; no child email is required.
      const privateEmail=username+"@brunoquoc.github.io";
      const {data:created,error:createError}=await service.auth.admin.createUser({
        email:privateEmail,password,email_confirm:true,
        app_metadata:{aura_student_password_v6:true}
      });
      if(createError||!created?.user?.id)
        return answer(origin,409,{error:"Không thể cấp tên đăng nhập này. Hãy chọn tên khác."});
      const newUid=created.user.id;
      try{
        const rpcName=action==="create_password_student"?
          "aura_admin_create_student_password_v6":"aura_admin_bind_student_password_v6";
        const args=action==="create_password_student"?
          {p_admin_uid:user.id,p_name:name,p_auth_uid:newUid,p_username:username}:
          {p_admin_uid:user.id,p_student_id:learnerId,p_auth_uid:newUid,p_username:username};
        const {data:bound,error:bindError}=await service.rpc(rpcName,args);
        if(bindError||!bound?.login_ready)throw Error("STUDENT_BIND_FAILED");
        return answer(origin,200,{student:bound,staging_only:true});
      }catch(_){
        // User is new and not yet usable. Avoid leaving an unlinked Auth account.
        await service.auth.admin.deleteUser(newUid).catch(()=>{});
        return answer(origin,409,{error:"Không thể gắn tài khoản. Kiểm tra tên đăng nhập hoặc quyền học sinh."});
      }
    }

    // Simple 2-role experience: Admin creates a learner and issues a one-time
    // activation link. Existing Parent/pairing routes stay as legacy fallback.
    if (action === "list_students" || action === "create_student" ||
        action === "issue_student_link" || action === "revoke_student_devices") {
      if (!isAdmin) return answer(origin,403,{error:"Admin access required"});
      if (action === "list_students") {
        const {data,error}=await service.rpc("aura_admin_student_list_v1",{p_admin_uid:user.id});
        if(error)throw error;
        return answer(origin,200,{students:data,staging_only:true});
      }
      if (action === "create_student") {
        const name=typeof input.name==="string"?input.name.trim():"";
        if(name.length<2||name.length>60||/[<>\\x00-\\x1f]/.test(name))
          return answer(origin,400,{error:"Tên học sinh phải có 2–60 ký tự"});
        const {data,error}=await service.rpc("aura_admin_student_create_v1",
          {p_admin_uid:user.id,p_name:name});
        if(error){
          if(/STAGING_STUDENT_LIMIT/.test(error.message||""))
            return answer(origin,429,{error:"Staging hiện giới hạn tối đa 50 học sinh"});
          throw error;
        }
        return answer(origin,200,{student:data,staging_only:true});
      }
      const studentId=uuidOrNull(input.student_id);
      if(!studentId)return answer(origin,400,{error:"Học sinh không hợp lệ"});
      if(action === "revoke_student_devices"){
        const {data,error}=await service.rpc("aura_admin_student_revoke_devices_v1",
          {p_admin_uid:user.id,p_student_id:studentId});
        if(error)return answer(origin,403,{error:"Không thể ngắt thiết bị học sinh này"});
        return answer(origin,200,{result:data,staging_only:true});
      }
      const code=randomCode(); // 192-bit, one time and never written in cleartext.
      const {data,error}=await service.rpc("aura_admin_student_issue_link_v1",
        {p_admin_uid:user.id,p_student_id:studentId,p_token_sha256:await digest(code)});
      if(error){
        if(/LINK_RATE_LIMIT/.test(error.message||""))
          return answer(origin,429,{error:"Đã tạo quá nhiều liên kết. Hãy thử lại sau."});
        return answer(origin,403,{error:"Không thể tạo liên kết cho học sinh này"});
      }
      return answer(origin,200,{activation_code:code,expires_at:data.expires_at,
        student_id:studentId,student_name:data.student_name,staging_only:true});
    }

    if (action === "bootstrap_parent") {
      if (!verifiedEmail) return answer(origin, 403, { error: "Verified email login required" });
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
      const {error:registerError}=await service.rpc("aura_portal_register_legacy_household_v1",{p_user_id:user.id});
      if(registerError)return answer(origin,503,{error:"Role grant synchronization unavailable"});
      return answer(origin, 200, {
        role: "admin", household_id: data[0].household_id,
        learner_id: data[0].learner_id
      });
    }

    if (action === "create_pairing_code" || action === "revoke_student_device") {
      if (!isParent) return answer(origin, 403, { error: "Parent login required" });
      const {data:memberships,error:membershipError}=await service.rpc("aura_portal_parent_household_v1",{p_user_id:user.id});
      const member=Array.isArray(memberships)?memberships[0]:null;
      if(membershipError||!member)return answer(origin,403,{error:"Parent household permission required"});
      const household={id:member.household_id};

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

      const learner={id:member.learner_id};
      if(!learner.id)return answer(origin,409,{error:"Learner not initialized"});

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
      if (isAdmin||isParent) {
        return answer(origin,200,{role:isAdmin?"admin":"parent"});
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
