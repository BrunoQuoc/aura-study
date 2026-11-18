/* AURA STUDY learning pipeline V4: offline source/provenance/security regressions. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const read=p=>fs.readFileSync(path.resolve(import.meta.dirname,"..",p),"utf8");
const sql=read("supabase/migrations/20261118083500_aura_learning_pipeline_student_preview_v4_20261118.sql");
const edge=read("supabase/functions/aura-legacy-content-sync-v1/index.ts");
const admin=read("admin_learning_pipeline_v4.js");
const student=read("student_learning_pipeline_v4.js");

test("V4 original Admin/Student shells preserve existing menus and load pipeline adapters",()=>{
 const a=read("admin-direct.html"),s=read("student-direct.html");
 assert.match(a,/admin_unified_v3\.js/);
 assert.match(a,/admin_learning_pipeline_v4\.js/);
 assert.match(s,/student_sgk_auto_catalog\.js/);
 assert.match(s,/student_learning_pipeline_v4\.js/);
 assert.match(s,/student_legacy_cloud_sync\.js/);
 assert.match(s,/<nav class="mobilebar"/);
 assert.equal((a.match(/class="navbtn/g)||[]).length,5);
});
test("New adapters parse as JavaScript without third-party dependencies",()=>{
 assert.doesNotThrow(()=>new vm.Script(admin));
 assert.doesNotThrow(()=>new vm.Script(student));
});
test("Back-end derives previews from verified publisher headings and AI drafts, not textbook copies",()=>{
 assert.match(sql,/security_invoker=true/);
 assert.match(sql,/PUBLISHER_TOC_ONLY/);
 assert.match(sql,/OUTLINE_ONLY/);
 assert.match(sql,/src\.publisher_reader_url like 'https:\/\/taphuan\.nxbgd\.vn\/%'/);
 assert.match(sql,/toc_heading_verified=true/);
 assert.match(sql,/l\.source_kind='AI_ORIGINAL_STAGING'/);
 assert.match(sql,/STAGING_QA_LOCKED/);
 assert.match(sql,/STRUCTURE_PRESENT_ONLY/);
 assert.match(sql,/AURA_AI_AUTHORED_DRAFT/);
 assert.match(sql,/official_exam_enabled',false/);
 assert.match(sql,/auto_grading_enabled',false/);
 assert.doesNotMatch(sql,/insert into aura_review\.(questions|question_revisions)/i);
});
test("Paired Student and Admin server access is required on BOTH list and detail",()=>{
 assert.match(sql,/join public\.aura_learners l on l\.id=d\.learner_id/);
 assert.match(sql,/join public\.aura_learners learner on learner\.id=d\.learner_id/);
 assert.match(sql,/d\.revoked_at is null/g);
 assert.match(sql,/ACTIVE_ADMIN_OR_PAIRED_STUDENT_REQUIRED/g);
 assert.match(sql,/revoke all on function public\.aura_learning_pipeline_catalog_v4/);
 assert.match(sql,/revoke all on function public\.aura_learning_pipeline_lesson_v4/);
 assert.match(sql,/grant execute on function public\.aura_learning_pipeline_lesson_v4.*service_role/);
 assert.match(edge,/auth\.getUser/);
 assert.match(edge,/input\.action==="learning_pipeline_catalog"/);
 assert.match(edge,/input\.action==="learning_pipeline_lesson"/);
 assert.match(edge,/if\(!admin&&!student\)return reply\(origin,403/);
 assert.match(edge,/aura_learning_pipeline_lesson_v4/);
 assert.doesNotMatch(student,/sb_secret_|service_role|question_refs/);
});
test("Student accepts only TOC-aligned AURA drafts and only trusted NXB URLs",()=>{
 const injected=student.replace(
  "window.AURA_STUDENT_LEARNING_PIPELINE={refresh:",
  "window.AURA_STUDENT_LEARNING_PIPELINE={testSetData:(x)=>{state.data=x},testLessons:lessons,testDetail:detailMarkup,refresh:"
 );
 assert.notEqual(injected,student);
 const window={addEventListener(){}},document={
  body:{classList:{contains:x=>x==="student-shell"}},
  addEventListener(){},getElementById(){return null}
 };
 vm.runInNewContext(injected,{window,document,URL,Date,setTimeout(){},console});
 const module=window.AURA_STUDENT_LEARNING_PIPELINE;
 const safe={id:"SGK-M6-T1-L08",title:"Dấu hiệu chia hết",subject:"Toán",lane:"SGK",
  status:"AI_DRAFT_PREVIEW",content_origin:"AURA_AI_AUTHORED_DRAFT",
  preview_ready:true,source_url:"https://taphuan.nxbgd.vn/tap-huan/doc-sach/book"};
 const evil={...safe,id:"EVIL",source_url:"https://evil.example/steal"};
 const outline={...safe,id:"SIMPLE",preview_ready:false};
 const locked={...safe,id:"LOCKED",lane:"PRACTICE",status:"PRACTICE_QA_LOCKED"};
 module.testSetData({items:[safe,evil,outline,locked],totals:{}});
 assert.deepEqual(Array.from(module.testLessons(),x=>x.id),["SGK-M6-T1-L08"]);
});
test("Student draft viewer escapes untrusted text and never enables auto grading",()=>{
 const injected=student.replace(
  "window.AURA_STUDENT_LEARNING_PIPELINE={refresh:",
  "window.AURA_STUDENT_LEARNING_PIPELINE={testDetail:detailMarkup,refresh:"
 );
 const window={addEventListener(){}},document={
  body:{classList:{contains:x=>x==="student-shell"}},
  addEventListener(){},getElementById(){return null}
 };
 vm.runInNewContext(injected,{window,document,URL,Date,setTimeout(){},console});
 const viewer=window.AURA_STUDENT_LEARNING_PIPELINE.testDetail;
 const d={title:"Toán <script>alert(1)</script>",opening:"Khởi động",concept:"abc",
  worked_example:"x",practice_prompt:"<img src=x onerror=alert(1)>",
  application_prompt:"ghi nhớ",content_origin:"AURA_AI_AUTHORED_DRAFT",
  preview_only:true,auto_grading_enabled:false,textbook_body_verified:false};
 const html=viewer(d);
 assert.match(html,/&lt;script&gt;/);
 assert.match(html,/&lt;img /);
 assert.doesNotMatch(html,/<script>|<img src=x/);
 assert.match(html,/không chấm điểm/);
 assert.equal(viewer({...d,auto_grading_enabled:true}),"");
 assert.equal(viewer({...d,textbook_body_verified:true}),"");
});
test("Admin V3 tabs mount the pipeline without adding duplicate navigation or a manual SGK approval",()=>{
 const v3=read("admin_unified_v3.js");
 assert.match(v3,/AURA_LEARNING_PIPELINE_ADMIN\.mount\(state\.tab\)/);
 assert.match(admin,/function mount\(tab\)/);
 assert.match(admin,/if\(tab==="exam"\)return/);
 assert.match(admin,/data-pipe-admin="preview"/);
 assert.doesNotMatch(admin,/admin_manual_approve|admin_publish/);
});
