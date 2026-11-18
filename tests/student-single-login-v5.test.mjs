import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
const root=path.resolve(import.meta.dirname,"..");
const read=(pathName)=>fs.readFileSync(path.join(root,pathName),"utf8");
const files=["student_cloud_access_v5.js","student_learning_navigation_v5.js",
 "admin_cloud_students_v5.js","aura-simple-access.js"];
test("The original 5 Student actions stay, and only Tasks/Journey are added on the sidebar",()=>{
 const html=read("student-direct.html");
 assert.equal((html.match(/class="navbtn/g)||[]).length,7);
 for(const name of ["Hôm nay","Ôn thi","Bài học","Luyện nhanh","Kết quả",
  "Nhiệm vụ","Hành trình"])assert.match(html,new RegExp(name));
 assert.equal((html.match(/<nav class="mobilebar">[\s\S]*?<\/nav>/)?.[0].match(/<button /g)||[]).length,5);
 assert.match(html,/student_learning_navigation_v5\.js/);
 assert.match(html,/student_cloud_access_v5\.js/);
 assert.doesNotMatch(html,/src="local_accounts_v3\.js/);
 assert.doesNotMatch(html,/src="local_accounts_loader\.js/);
 assert.doesNotMatch(html,/src="student_login_direct_fix\\.js/);
 assert.match(read("aura_pro_2026.js"),/student_cloud_access_v5[.]css/);
});
test("One real Student activation opens existing Student UI; account management can stay on portal",()=>{
 const html=read("aura-student.html"),portal=read("aura-simple-access.js");
 assert.match(html,/href="\.\/student-direct\.html"/);
 assert.doesNotMatch(html,/aura-student-math6\.html/);
 assert.match(portal,/new URLSearchParams\(location\.search\)\.get\("manage"\)/);
 assert.match(portal,/location\.replace\("\.\/student-direct\.html"\)/);
 assert.doesNotMatch(portal,/location\.replace\("\.\/aura-student-math6\.html"\)/);
});
test("Admin V3 Student roster now uses server users, not local PIN creation",()=>{
 const admin=read("admin-direct.html");
 const list=read("admin_cloud_students_v5.js");
 const v3=read("admin_unified_v3.js");
 assert.match(admin,/admin_cloud_students_v5\.js/);
 assert.match(list,/api\("create_student",\{name\}\)/);
 assert.match(list,/api\("list_students"\)/);
 assert.match(list,/api\("issue_student_link"/);
 assert.match(list,/api\("revoke_student_devices"/);
 assert.match(list,/window\.auraStudentUsers=show/);
 assert.match(v3,/AURA_ADMIN_CLOUD_STUDENTS\?\.show/);
 assert.doesNotMatch(list,/pinHash|pinSalt|aura_local_students_v1/);
 for(const x of ["student_cloud_access_v5.js","student_learning_navigation_v5.js",
  "admin_cloud_students_v5.js"])assert.doesNotThrow(()=>new vm.Script(read(x)));
});
test("Server enforces verified paired learner identity, no browser-faked user authorization",()=>{
 const sql=read("supabase/migrations/20261118091500_aura_student_unified_profile_v5_20261118.sql");
 const edge=read("supabase/functions/aura-legacy-content-sync-v1/index.ts");
 assert.match(sql,/d\.auth_uid=p_student_uid and d\.revoked_at is null/);
 assert.match(sql,/l\.household_id=d\.household_id/);
 assert.match(sql,/ACTIVE_STUDENT_PAIRING_REQUIRED/);
 assert.match(sql,/revoke all on function public\.aura_student_unified_profile_v5/);
 assert.match(sql,/grant execute on function public\.aura_student_unified_profile_v5\(uuid\) to service_role/);
 assert.match(edge,/input\.action==="student_profile"/);
 assert.match(edge,/if\(!student\)return reply\(origin,403/);
 assert.match(edge,/auth\.getUser/);
 assert.doesNotMatch(sql,/insert into auth\.users|gen_random_bytes|raw_user_meta_data/);
});
test("Student learning sections do not display two cloud connection cards on Home",()=>{
 const legacy=read("student_legacy_cloud_sync.js");
 const draft=read("student_learning_pipeline_v4.js");
 const sgk=read("student_sgk_auto_catalog.js");
 const navCss=read("student_learning_navigation_v5.css");
 assert.match(legacy,/if\(next!=="all"&&next!=="period"\)return/);
 assert.match(legacy,/panel\.style\.display=shown\?"":"none"/);
 assert.match(draft,/for\(const \[name,subjectArg\] of \[\["lessons",false\]/);
 assert.match(sgk,/wrap\("lessons"\);wrap\("lessonSubject",true\)/);
 assert.match(navCss,/data-student-main-view="home"/);
 assert.doesNotMatch(read("student-direct.html"),/Lớp học tương tác/);
});
test("Task and Journey views derive from actual Student learning progress",()=>{
 const store=new Map([
  ["aura_attempts",JSON.stringify([{time:new Date().toISOString(),score:8}])],
  ["aura_wrong_book_v1",JSON.stringify({"q1":{consecutiveCorrect:1}})],
  ["aura_lesson_state",JSON.stringify({"map1":{done:{"n1":true}}})]
 ]);
 const app={innerHTML:"",addEventListener(){},append(node){this.innerHTML+=(node.innerHTML||"")}};
 const actions=[];
 const window={AURA_LESSON_MAPS:[{id:"map1",nodes:[{id:"n1"},{id:"n2"}]}],
  setActive:p=>actions.push(p),home(){},library(){},lessons(){},
  generator(){},history(){},addEventListener(){}};
 const document={
  body:{classList:{contains:x=>x==="student-shell"},dataset:{}},
  getElementById:id=>id==="app"?app:null,
  querySelectorAll:()=>[],querySelector:()=>null,
  createElement:()=>({innerHTML:"",className:""})
 };
 const ctx={window,document,localStorage:{getItem:k=>store.get(k)||null},Date,console};
 vm.runInNewContext(read("student_learning_navigation_v5.js"),ctx);
 window.auraStudentTasksV5();
 assert.match(app.innerHTML,/Nhiệm vụ học tập/);
 assert.match(app.innerHTML,/Luyện nhanh 10–20 câu/);
 assert.match(app.innerHTML,/Ôn các câu thường sai/);
 window.auraStudentJourneyV5();
 assert.match(app.innerHTML,/Hành trình học tập/);
 assert.match(app.innerHTML,/1\/2/);
 assert.match(app.innerHTML,/Điểm TB bài luyện đã lưu/);
 assert.ok(actions.includes("missions")&&actions.includes("journey"));
});
test("Student UI maintains one cloud Auth session and learner-scoped progress isolation",()=>{
 const script=read("student_cloud_access_v5.js");
 assert.match(script,/AURA_LEGACY_CLOUD_STUDENT/);
 assert.match(script,/action:"student_profile"/);
 assert.match(script,/profile\.learner_id|result\.learner_id/);
 assert.match(script,/aura_cloud_learning_v5:/);
 assert.match(script,/LEGACY_UNLINKED/);
 assert.match(script,/Storage\.prototype\.setItem/);
 assert.match(script,/document\.body\.classList\.add\("aura-cloud-ready"\)/);
 assert.match(script,/document\.body\.classList\.remove\("aura-cloud-ready"\)/);
 assert.match(script,/window\.AURA_STUDENT_ONE_LOGIN_V5/);
 assert.doesNotMatch(script,/pinSalt|pinHash|sessionStorage\.setItem/);
});
test("Official exams and unverified textbooks remain blocked by the existing server policy",()=>{
 const edge=read("supabase/functions/aura-legacy-content-sync-v1/index.ts");
 const ui=read("student_learning_navigation_v5.js");
 assert.match(edge,/manualContentKind\(title,doc_type\)/);
 assert.match(edge,/aura_legacy_content_admin_publish_v1/);
 assert.match(ui,/Kỳ thi chính thức chưa được bật/);
 assert.doesNotMatch(ui,/official_exam_enabled\s*:\s*true|admin_publish/);
});
