import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT=path.resolve(import.meta.dirname,"..");
const read=(file)=>fs.readFileSync(path.join(ROOT,file),"utf8");

test("Admin V3 has exactly five main menus and preserves legacy functions",()=>{
 const html=read("admin-direct.html");
 assert.match(html,/<body class="admin-shell admin-v3">/);
 assert.equal((html.match(/class="navbtn/g)||[]).length,5);
 assert.match(html,/data-page="home"/);
 assert.match(html,/data-page="library"/);
 assert.match(html,/data-page="students"/);
 assert.match(html,/data-page="history"/);
 assert.match(html,/data-page="settings"/);
 assert.match(html,/admin_unified_v3\.css/);
 assert.match(html,/admin_unified_v3\.js/);
 assert.match(html,/admin_inbox\.js/);
 assert.match(html,/admin_legacy_cloud_sync\.js/);
 assert.match(html,/admin_legacy_asset_sync\.js/);
 assert.match(html,/admin_mvp_v2\.js/);
 assert.match(html,/aura_drive_auth_core\.js/);
 assert.doesNotMatch(html,/<button class="navbtn"[^>]+data-page="inbox"/);
 assert.doesNotMatch(html,/<button class="navbtn"[^>]+data-page="driveSources"/);
});
test("All three content lanes are user-facing and no official source needs approval",()=>{
 const js=read("admin_unified_v3.js");
 assert.doesNotThrow(()=>new vm.Script(js));
 assert.match(js,/sgk:"Sách giáo khoa",practice:"Bài tập",exam:"Kiểm tra"/);
 assert.match(js,/TỰ ĐỒNG BỘ/);
 assert.match(js,/YÊU CẦU DUYỆT/);
 assert.match(js,/Anh duyệt/);
 assert.match(js,/doc.*="exam"/);
 assert.match(js,/Máy chủ/);
 assert.match(read("admin_unified_v3.css"),/max-width:760px/);
});
test("Three-lane UI uses actual protected server data and routes to original tools",async()=>{
 const node={innerHTML:"",listeners:{},addEventListener(name,fn){this.listeners[name]=fn},contains:()=>true,insertAdjacentHTML(_where,html){this.innerHTML=html+this.innerHTML}};
 const buttons=[
  {dataset:{page:"home"},classList:{contains:()=>true}},
  {dataset:{page:"library"},classList:{contains:()=>false}},
  {dataset:{page:"settings"},classList:{contains:()=>false}}
 ];
 const mockDocument={
  body:{classList:{contains:v=>v==="admin-shell"},dataset:{}},
  getElementById:id=>id==="app"?node:null,
  querySelector:sel=>sel.includes('data-page="home"')?buttons[0]:buttons[1],
  querySelectorAll:()=>[]
 };
 const calls=[],localStorage={getItem:()=>null};
 const window={
  AURA_LEGACY_CLOUD_ADMIN:{async getToken(){return "mock-verified-admin-token"}},
  setActive(page){calls.push("nav:"+page)},
  library(){calls.push("legacy-library")},home(){},lessons(){calls.push("legacy-lessons")},
  auraAdminInbox(){calls.push("legacy-inbox")},
  auraDriveSourceInbox(){calls.push("legacy-sources")},
  auraStudentUsers(){calls.push("legacy-students")},
  history(){calls.push("legacy-results")},
  auraMetadataManager(){calls.push("legacy-metadata")},
  generator(){calls.push("legacy-generator")},
  guide(){calls.push("legacy-guide")},
  addEventListener(){}
 };
 const fetch=async(_url,opts)=>{
  assert.equal(JSON.parse(opts.body).action,"admin_content_overview");
  assert.match(opts.headers.Authorization,/^Bearer mock-verified-admin-token$/);
  return {ok:true,async json(){return {
   staging_only:true,manual_review_rule:"EXTERNAL_EXAM_AND_SAMPLE_ONLY",
   auto_sgk:true,auto_practice:true,official_exam_enabled:false,
   source_count:2,sgk_units:53,practice_units:25,
   guided_lesson_drafts:36,practice_module_drafts:15,
   verified_textbook_exercises:0,pending_manual_approvals:0,
   sources:[{title:"Toán 6 Tập 1",volume:1,grade:6,subject:"Toán",toc_count:40,
    url:"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-6-tap-mot.4699854777"}]
  }}}};
 };
 const context={window,document:mockDocument,URL,Date,fetch,localStorage,console,location:{href:""},setTimeout};
 vm.runInNewContext(read("admin_unified_v3.js"),context);
 await window.AURA_ADMIN_V3.refresh();
 assert.match(node.innerHTML,/Một kho tài liệu/);
 assert.match(node.innerHTML,/53/);
 window.AURA_ADMIN_V3.documents("sgk");
 assert.match(node.innerHTML,/Nguồn sách đang kết nối/);
 assert.match(node.innerHTML,/Mở NXB/);
 assert.doesNotMatch(node.innerHTML,/data-v3-action="inbox"/);
 window.AURA_ADMIN_V3.documents("practice");
 assert.match(node.innerHTML,/Mô-đun luyện AI hiện có/);
 assert.match(node.innerHTML,/Bài tập SGK nguyên gốc đã kiểm chứng/);
 window.AURA_ADMIN_V3.documents("exam");
 assert.match(node.innerHTML,/data-v3-action="inbox"/);
 assert.match(node.innerHTML,/data-v3-action="publish"/);
 assert.match(node.innerHTML,/data-v3-action="generator"/);
 const button={dataset:{v3Action:"inbox"}};
 node.listeners.click({target:{closest(){return button}}});
 assert.ok(calls.includes("legacy-inbox"));
 window.AURA_ADMIN_V3.settings();
 assert.match(node.innerHTML,/Nguồn Drive \(nâng cao\)/);
});
test("Server catalog is outline-only, privilege scoped and exam/sample publishing requires SQL approval",()=>{
 const sql=read("supabase/migrations/20261118073500_aura_admin_v3_three_content_lanes_manual_approval_20261118.sql");
 const gateway=read("supabase/functions/aura-legacy-content-sync-v1/index.ts");
 const admin=read("admin_legacy_cloud_sync.js");
 assert.match(sql,/standard_learning_units_v3/);
 assert.match(sql,/PUBLISHER_TOC_ONLY/);
 assert.match(sql,/OUTLINE_ONLY/);
 assert.match(sql,/create trigger aura_content_sgk_normalize_v3/);
 assert.match(sql,/manual_material_approvals_v3/);
 assert.match(sql,/MANUAL_APPROVAL_REQUIRED/);
 assert.match(sql,/revoke all on function public\.aura_manual_material_approve_v3/);
 assert.match(sql,/grant execute on function public\.aura_admin_content_overview_v3/);
 assert.match(gateway,/action==="admin_content_overview"/);
 assert.match(gateway,/action==="admin_manual_approve"/);
 assert.match(gateway,/manualContentKind\(title,doc_type\)/);
 assert.match(admin,/api\("admin_manual_approve"/);
 assert.match(admin,/api\("admin_publish"/);
 assert.ok(admin.indexOf('api("admin_manual_approve"')<admin.indexOf('api("admin_publish"'));
 assert.doesNotMatch(sql,/insert into aura_review\.question_revisions|insert into aura_review\.questions/i);
});
