import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
const read=f=>fs.readFileSync(path.resolve(import.meta.dirname,"..",f),"utf8");
const sql=read("supabase/migrations/20261118093000_aura_student_password_login_v6_20261118.sql");
const sqlAtomic=read("supabase/migrations/20261118093100_aura_atomic_admin_student_password_creation_v6_20261118.sql");
const identity=read("supabase/functions/aura-identity-pair/index.ts");
const cloud=read("supabase/functions/aura-legacy-content-sync-v1/index.ts");
const asset=read("supabase/functions/aura-legacy-content-asset-v2/index.ts");
const student=read("student_password_login_v6.js");
const gate=read("student_cloud_access_v5.js");
const admin=read("admin_cloud_students_v5.js");
test("Old Student shell stays while single username/password form replaces activation link",()=>{
 const html=read("student-direct.html");
 assert.match(html,/student_hybrid_v4\.css/);
 assert.match(html,/student_password_login_v6\.js/);
 assert.equal((html.match(/class="navbtn/g)||[]).length,7);
 assert.match(gate,/auraStudentPasswordFormV6/);
 assert.match(gate,/autocomplete="username"/);
 assert.match(gate,/autocomplete="current-password"/);
 assert.match(gate,/Đăng nhập và vào học/);
 assert.doesNotMatch(gate,/href="\.\/aura-student\.html"/);
 assert.doesNotMatch(html,/src="student_login_direct_fix\.js/);
});
test("Admin creates user with name username and secret password; link/paired-device actions removed",()=>{
 assert.match(admin,/auraCloudNewStudent/);
 assert.match(admin,/auraCloudNewUsername/);
 assert.match(admin,/auraCloudNewPassword/);
 assert.match(admin,/data-cloud-user="create"/);
 assert.match(admin,/data-cloud-user="configure"/);
 assert.match(admin,/data-cloud-user="reset"/);
 assert.match(admin,/api\("create_password_student"/);
 assert.match(admin,/api\("enable_password_student"/);
 assert.match(admin,/api\("reset_password_student"/);
 assert.doesNotMatch(admin,/Lấy liên kết học|Tạo và cấp liên kết|auraCloudLinkValue|Đổi thiết bị/);
 assert.doesNotMatch(admin,/pinSalt|pinHash|localStorage/);
 assert.doesNotThrow(()=>new vm.Script(admin));
});
test("Native GoTrue password login is bound to an active learner and student role",()=>{
 assert.match(student,/createClient/);
 assert.match(student,/signInWithPassword/);
 assert.match(student,/aura-stage-student-v1/);
 assert.match(student,/verify\(true\)/);
 assert.match(student,/if\(!verified\)/);
 assert.match(student,/auth\.auth\.signOut/);
 assert.doesNotMatch(student,/service_role|sb_secret_|localStorage\.setItem/);
 assert.match(cloud,/aura_student_password_bound_v6/);
 assert.match(asset,/aura_student_password_bound_v6/);
 assert.match(cloud,/aura_portal_access_v1/);
 assert.match(asset,/aura_portal_access_v1/);
});
test("Credential provisioning takes place on server with role checks and Auth Admin only",()=>{
 assert.match(identity,/if\(!isAdmin\)return answer\(origin,403/);
 assert.match(identity,/auth\.admin\.createUser/);
 assert.match(identity,/email_confirm:true/);
 assert.match(identity,/auth\.admin\.updateUserById/);
 assert.match(identity,/auth\.admin\.deleteUser/);
 assert.match(identity,/aura_admin_create_student_password_v6/);
 assert.match(identity,/aura_admin_bind_student_password_v6/);
 assert.match(identity,/aura_admin_password_students_v6/);
 assert.match(identity,/create_password_student/);
 assert.match(identity,/reset_password_student/);
 assert.match(identity,/password\.length<8/);
 assert.doesNotMatch(identity,/console\.log\([^)]*password/);
});
test("Username is unique and permanent, learner binding is household-scoped",()=>{
 assert.match(sql,/username text collate "C" not null unique/);
 assert.match(sql,/learner_id uuid primary key/);
 assert.match(sql,/auth_uid uuid not null unique/);
 assert.match(sql,/h\.admin_uid=p_admin_uid/);
 assert.match(sql,/STUDENT_NOT_OWNED/);
 assert.match(sql,/CANNOT_ATTACH_ADMIN/);
 assert.match(sql,/AUTH_USER_ALREADY_PAIRED/);
 assert.match(sql,/email_confirmed_at is not null/);
 assert.match(sql,/update public\.aura_student_devices set revoked_at=now\(\)/);
 assert.match(sql,/insert into public\.aura_student_devices/);
 assert.match(sqlAtomic,/public\.aura_admin_student_create_v1/);
 assert.match(sqlAtomic,/public\.aura_admin_bind_student_password_v6/);
});
test("No Student password stored in database or local profiles",()=>{
 assert.doesNotMatch(sql,/password_hash|pinHash|pinSalt|encrypted_password/);
 assert.doesNotMatch(sql,/insert into auth\.users/);
 assert.doesNotMatch(student,/password\s*:\s*localStorage/);
 assert.doesNotMatch(gate,/password\s*:\s*localStorage/);
 assert.match(gate,/clearLearning\(\)/);
 assert.match(gate,/aura_cloud_learning_v5:/);
});
test("Admin and Student RPCs are service-only, cannot be called by anon or authenticated",()=>{
 for(const name of ["aura_admin_password_students_v6","aura_admin_bind_student_password_v6",
  "aura_admin_password_account_v6","aura_student_password_bound_v6"])
  assert.match(sql,new RegExp("revoke all on function public\\."+name));
 assert.match(sql,/grant execute on function public\.aura_student_password_bound_v6\(uuid\) to service_role/);
 assert.match(sqlAtomic,/grant execute on function public\.aura_admin_create_student_password_v6/);
});
test("Legacy link page only exists as compatibility for previously issued links",()=>{
 const portal=read("aura-student.html");
 assert.match(portal,/if\(!\/\^#join=/);
 assert.match(portal,/location\.replace\("\.\/student-direct\.html"\)/);
 const main=read("aura-simple-access.js");
 assert.match(main,/location\.replace\("\.\/admin-direct\.html"\)/);
});
test("Official exam grading remains locked by server",()=>{
 assert.match(cloud,/official_exam_enabled:false/);
 assert.match(cloud,/manualContentKind\(title,doc_type\)/);
 assert.doesNotMatch(student,/official_exam_enabled:true/);
});
