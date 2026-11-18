/* AURA STUDY V4 — multi-device browser smoke with SYNTHETIC private API replies.
 * No live Google Drive, no real Student, no production pedagogical signoff. */
import {chromium} from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
const origin="http://127.0.0.1:8765";
fs.mkdirSync("test-results/pipeline-v4",{recursive:true});
const url="https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-6-tap-mot.4699854777";
const items=[
 {id:"SGK-M6-T1-L08",title:"Quan hệ chia hết và tính chất",lane:"SGK",status:"AI_DRAFT_PREVIEW",
  source_id:"SGK-M6-KNTT-T1",subject:"Toán",volume:1,printed_page:29,source_url:url,
  preview_ready:true,content_origin:"AURA_AI_AUTHORED_DRAFT",textbook_body_verified:false},
 {id:"SGK-M6-T1-L07",title:"Thứ tự thực hiện phép tính",lane:"SGK",status:"OUTLINE_ONLY",
  source_id:"SGK-M6-KNTT-T1",subject:"Toán",volume:1,printed_page:26,source_url:url,
  preview_ready:false,content_origin:"VERIFIED_PUBLISHER_TOC_ONLY",textbook_body_verified:false},
 {id:"SGK-M6-T1-C01-COMMON-1",title:"Luyện tập chung",lane:"PRACTICE",status:"PRACTICE_QA_LOCKED",
  source_id:"SGK-M6-KNTT-T1",subject:"Toán",volume:1,printed_page:25,source_url:url,
  preview_ready:false,content_origin:"VERIFIED_PUBLISHER_TOC_ONLY",textbook_body_verified:false}
];
const totals={total:3,sgk_outlines:2,practice_outlines:1,student_preview_drafts:1,
 draft_missing_or_incomplete:1,locked_practice_modules:1,verified_publisher_bodies:0,official_exams:0};
const catalog={staging_only:true,preview_only:true,review_required_for_official_sgk:false,
 copyright_scope:"PUBLISHER_TOC_AND_AI_AUTHORED_DRAFTS_ONLY",
 official_exam_enabled:false,teacher_signed_off:false,totals,items};
const lesson={staging_only:true,preview_only:true,content_origin:"AURA_AI_AUTHORED_DRAFT",
 id:"SGK-M6-T1-L08",title:"Quan hệ chia hết và tính chất",opening:"Có thể chia đều 24 chiếc bút vào 6 hộp không?",
 concept:"Quan hệ chia hết là khi phép chia có số dư bằng 0.",
 worked_example:"24 chia 6 được 4, số dư bằng 0.",
 practice_prompt:"Xem 42 có chia hết cho 7 không.",
 application_prompt:"Tìm cách chia đều 35 nhãn vở cho 5 nhóm.",
 pedagogical_certified:false,textbook_body_verified:false,auto_grading_enabled:false,official_exam_enabled:false};
const overview={staging_only:true,manual_review_rule:"EXTERNAL_EXAM_AND_SAMPLE_ONLY",
 auto_sgk:true,auto_practice:true,official_exam_enabled:false,
 source_count:2,sgk_units:53,practice_units:25,guided_lesson_drafts:36,
 practice_module_drafts:15,verified_textbook_exercises:0,pending_manual_approvals:0,
 sources:[{title:"Toán 6 — Tập 1",subject:"Toán",grade:6,volume:1,url,toc_count:40}]};
const sgk={staging_only:true,review_required:false,official_exam_enabled:false,
 sources:[{toc_verified:true,review_required:false,full_textbook_verified:false,source_url:url,
 title:"Toán 6 — Tập 1",subject:"Toán",grade:6,volume:1,sections:[{heading:"Quan hệ chia hết",start_page:29}]}]};
async function run(screen){
 const browser=await chromium.launch({headless:true,channel:"chrome"});
 try{
  for(const role of ["admin","student"]){
   const ctx=await browser.newContext({
    viewport:{width:screen.width,height:screen.height},
    hasTouch:screen.width<1000,isMobile:screen.width<1000,locale:"vi-VN"
   });
   await ctx.addInitScript(role=>{
    const key=role==="admin"?"aura-stage-parent-v1":"aura-stage-student-v1";
    localStorage.setItem(key,JSON.stringify({access_token:"synthetic-"+role+"-jwt",expires_at:4102444800}));
   },role);
   const actions=[];
   await ctx.route("**/*",async route=>{
    const req=route.request(),uri=req.url();
    if(uri.startsWith(origin+"/"))return route.continue();
    if(uri.startsWith("https://ufqzuowjhdqpydqvcsob.supabase.co/")){
     const headers={"Access-Control-Allow-Origin":origin,
      "Access-Control-Allow-Methods":"POST,OPTIONS",
      "Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info",
      "Content-Type":"application/json"};
     if(req.method()==="OPTIONS")return route.fulfill({status:200,headers,body:"{}"});
     let action="";try{action=JSON.parse(req.postData()||"{}").action}catch{}
     actions.push(action);
     const result=action==="learning_pipeline_catalog"?catalog:
      action==="learning_pipeline_lesson"?lesson:
      action==="admin_content_overview"?overview:
      action==="sgk_auto_catalog"?sgk:
      action==="student_list"?{staging_only:true,official_exam_enabled:false,items:[]}:
      action==="admin_list"?{staging_only:true,items:[]}:
      {error:"Synthetic test blocked non-pipeline action"};
     const ok=!result.error;
     return route.fulfill({status:ok?200:403,headers,body:JSON.stringify(result)});
    }
    return route.abort();
   });
   const page=await ctx.newPage();const errors=[];
   page.on("pageerror",e=>errors.push(e.message));
   await page.goto(origin+"/"+(role==="admin"?"admin-direct.html":"student-direct.html"),{waitUntil:"load",timeout:45000});
   if(role==="admin"){
    const desktop=page.locator('.side button[data-page="library"]');
    if(await desktop.isVisible())await desktop.click();
    else await page.locator('.mobilebar button[data-page="library"]').click();
    const panel=page.locator("#auraLearningPipelineAdminV4");
    await panel.locator(".av4-admin-row").first().waitFor({timeout:20000});
    assert.equal(await panel.locator(".av4-admin-row").count(),2);
    assert.match(await panel.innerText(),/Student xem thử/);
    assert.match(await panel.innerText(),/Nguồn NXB/);
    await panel.locator('[data-pipe-admin="preview"]').click();
    await panel.getByText("Có thể chia đều 24 chiếc bút").waitFor();
    await page.locator('[data-v3-action="tab-practice"]').first().click();
    await panel.locator(".av4-admin-row").first().waitFor();
    assert.equal(await panel.locator('[data-pipe-admin="preview"]').count(),0);
    assert.match(await panel.innerText(),/đang khóa QA/i);
    assert.equal(actions.filter(x=>x==="learning_pipeline_catalog").length>=1,true);
   }else{
    await page.evaluate(()=>window.lessons());
    const panel=page.locator("#auraStudentLearningPipelineV4");
    await panel.locator('[data-aura-v4="open"]').first().waitFor({timeout:22000});
    assert.equal(await panel.locator('[data-aura-v4="open"]').count(),1);
    assert.match(await panel.innerText(),/chưa chứng nhận/i);
    await page.evaluate(()=>document.querySelector('#auraStudentLearningPipelineV4 [data-aura-v4="open"]').click());
    await panel.getByText("Tìm cách chia đều 35 nhãn vở").waitFor({timeout:15000});
    assert.match(await panel.innerText(),/Không có chấm điểm tự động/i);
    assert.doesNotMatch(await panel.innerText(),/Bài mẫu ngoài SGK được duyệt/);
    assert.ok(actions.includes("learning_pipeline_lesson"));
   }
   const fatal=errors.filter(x=>/learning_pipeline_v4|SyntaxError|Unexpected token/i.test(x));
   assert.deepEqual(fatal,[],role+" "+screen.name+" JavaScript errors");
   await page.screenshot({path:"test-results/pipeline-v4/"+role+"-"+screen.name+".png",fullPage:true});
   await ctx.close();
   console.log("PASS "+role+" "+screen.name+" pipeline source/drafts/locked/permissions mock");
  }
 }finally{await browser.close()}
}
for(const screen of [
 {name:"phone",width:390,height:844},
 {name:"ipad",width:820,height:1180},
 {name:"desktop",width:1366,height:900}
])await run(screen);
console.log("PASS 6 synthetic device views / Admin + Student V4 pipeline");
