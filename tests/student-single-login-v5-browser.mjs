/* AURA STUDY V5 browser QA: single cloud login and original Student look.
 * Synthetic Admin/Student sessions only. No live accounts created. */
import {chromium} from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";

const origin="http://127.0.0.1:8765";
const out="test-results/student-v5";
fs.mkdirSync(out,{recursive:true});
const uid="f0c38427-7566-4be6-8b7f-91c117123456";
const sourceUrl="https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-6-tap-mot.4699854777";
const item={id:"SGK-M6-T1-L08",source_id:"SGK-M6-KNTT-T1",lane:"SGK",
 title:"Quan hệ chia hết và tính chất",subject:"Toán",grade:6,volume:1,
 printed_page:29,source_url:sourceUrl,status:"AI_DRAFT_PREVIEW",
 preview_ready:true,content_origin:"AURA_AI_AUTHORED_DRAFT",textbook_body_verified:false};
const content={
 staging_only:true,preview_only:true,copyright_scope:"PUBLISHER_TOC_AND_AI_AUTHORED_DRAFTS_ONLY",
 review_required_for_official_sgk:false,official_exam_enabled:false,
 totals:{total:3,sgk_outlines:2,practice_outlines:1,student_preview_drafts:1,
  locked_practice_modules:1,verified_publisher_bodies:0},
 items:[item]
};
const lesson={
 staging_only:true,preview_only:true,content_origin:"AURA_AI_AUTHORED_DRAFT",
 title:item.title,opening:"Có thể chia đều 24 chiếc bút vào 6 hộp không?",
 concept:"Một số tự nhiên chia hết cho số khác khi số dư bằng 0.",
 worked_example:"24 chia 6 được 4.",
 practice_prompt:"Tự kiểm tra 42 chia hết cho 7?",
 application_prompt:"Chia 35 nhãn vở thành 5 phần bằng nhau.",
 auto_grading_enabled:false,textbook_body_verified:false,official_exam_enabled:false
};
const book={
 staging_only:true,review_required:false,official_exam_enabled:false,
 sources:[{toc_verified:true,review_required:false,full_textbook_verified:false,
  source_url:sourceUrl,title:"SGK Toán 6 Tập 1",subject:"Toán",grade:6,volume:1,
  sections:[{heading:"Quan hệ chia hết",start_page:29}]}]
};
const overview={
 staging_only:true,manual_review_rule:"EXTERNAL_EXAM_AND_SAMPLE_ONLY",
 auto_sgk:true,auto_practice:true,official_exam_enabled:false,
 source_count:2,sgk_units:53,practice_units:25,guided_lesson_drafts:36,
 practice_module_drafts:15,verified_textbook_exercises:0,pending_manual_approvals:0,
 sources:[{title:"Toán 6 Tập 1",grade:6,volume:1,subject:"Toán",toc_count:40,url:sourceUrl}]
};
const run=async()=>{
 const browser=await chromium.launch({headless:true,channel:"chrome"});
 try{
  for(const screen of [{name:"phone",width:390,height:844},
   {name:"ipad",width:820,height:1180},{name:"desktop",width:1366,height:900}]){
   for(const role of ["student","admin"]){
    const context=await browser.newContext({viewport:{width:screen.width,height:screen.height},
     hasTouch:screen.width<1000,isMobile:screen.width<1000,locale:"vi-VN"});
    await context.addInitScript(role=>{
     const key=role==="student"?"aura-stage-student-v1":"aura-stage-parent-v1";
     localStorage.setItem(key,JSON.stringify({access_token:"synthetic-"+role+"-jwt",
      expires_at:4102444800}));
    },role);
    const calls=[];
    await context.route("**/*",async route=>{
     const req=route.request(),url=req.url();
     if(url.startsWith(origin+"/"))return route.continue();
     if(url.startsWith("https://ufqzuowjhdqpydqvcsob.supabase.co/")){
      const headers={"Access-Control-Allow-Origin":origin,
       "Access-Control-Allow-Methods":"POST,OPTIONS",
       "Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info",
       "Content-Type":"application/json"};
      if(req.method()==="OPTIONS")return route.fulfill({status:200,headers,body:"{}"});
      const payload=JSON.parse(req.postData()||"{}");calls.push(payload.action);
      let result={error:"mock rejects unknown action"};
      if(payload.action==="student_profile")result={staging_only:true,learner_id:uid,name:"Học sinh kiểm thử",
       paired:true,role:"STUDENT",official_exam_enabled:false};
      else if(payload.action==="student_list")result={staging_only:true,official_exam_enabled:false,items:[]};
      else if(payload.action==="learning_pipeline_catalog")result=content;
      else if(payload.action==="learning_pipeline_lesson")result=lesson;
      else if(payload.action==="sgk_auto_catalog")result=book;
      else if(payload.action==="admin_content_overview")result=overview;
      else if(payload.action==="admin_list")result={staging_only:true,items:[]};
      else if(payload.action==="list_students")result={students:{learners:[{id:uid,name:"Học sinh kiểm thử",active_devices:1}]}};
      else if(payload.action==="create_student")result={student:{student_id:uid}};
      else if(payload.action==="issue_student_link")result={activation_code:"ABCDEFGHIJKLMNOPQRSTUVWXYZ123456"};
      else if(payload.action==="revoke_student_devices")result={revoked:true};
      return route.fulfill({status:result.error?403:200,headers,body:JSON.stringify(result)});
     }
     return route.abort();
    });
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin+"/"+(role==="student"?"student-direct.html":"admin-direct.html"),{waitUntil:"load",timeout:35000});
    if(role==="student"){
     await page.locator("body.aura-cloud-ready").waitFor({timeout:15000});
     assert.equal(await page.locator(".aura-login-overlay").count(),0,"Old PIN login must be gone");
     assert.equal(await page.locator("#auraStudentOneLoginV5").count(),0);
     assert.equal(await page.locator(".side .navbtn").count(),7);
     assert.equal(await page.locator(".mobilebar button").count(),5);
     assert.match(await page.locator(".aura-account").innerText(),/Học sinh kiểm thử/);
     await page.locator(".aura-v5-home-shortcuts").first().waitFor();
     assert.equal(await page.locator("#auraLegacyCloudStudent:visible").count(),0);
     assert.equal(await page.locator("#auraStudentLearningPipelineV4:visible").count(),0);
     await page.evaluate(()=>window.auraStudentTasksV5());
     assert.match(await page.locator("#app").innerText(),/Nhiệm vụ học tập/);
     await page.evaluate(()=>window.auraStudentJourneyV5());
     assert.match(await page.locator("#app").innerText(),/Hành trình học tập/);
     await page.evaluate(()=>window.lessons());
     await page.locator("#auraStudentLearningPipelineV4 [data-aura-v4='open']").first().waitFor({timeout:15000});
     assert.equal(await page.locator("#auraLegacyCloudStudent:visible").count(),0);
     await page.locator("#auraStudentLearningPipelineV4 [data-aura-v4='open']").first().click();
     await page.getByText("Có thể chia đều 24 chiếc bút").waitFor();
     await page.screenshot({path:out+"/"+role+"-"+screen.name+".png",fullPage:true});
     assert.ok(calls.includes("student_profile"),"One login must validate paired identity");
     assert.ok(calls.includes("learning_pipeline_catalog"));
    }else{
     if(await page.locator('.side [data-page="students"]').isVisible())
      await page.locator('.side [data-page="students"]').click();
     else await page.locator('.mobilebar [data-page="students"]').click();
     await page.locator("#auraCloudStudentsV5").waitFor({timeout:15000});
     await page.getByText("Học sinh kiểm thử").first().waitFor({timeout:14000});
     assert.match(await page.locator("#app").innerText(),/Tạo học sinh mới/);
     assert.equal(await page.locator("#studentPin").count(),0);
     await page.locator("#auraCloudNewStudent").fill("Học sinh mới");
     await page.locator('[data-cloud-user="create"]').click();
     await page.locator("#auraCloudLinkValue").waitFor();
     const link=await page.locator("#auraCloudLinkValue").inputValue();
     assert.match(link,/aura-student\.html#join=/);
     assert.ok(calls.includes("create_student")&&calls.includes("issue_student_link"));
     await page.screenshot({path:out+"/"+role+"-"+screen.name+".png",fullPage:true});
    }
    const errorsFromV5=errors.filter(x=>/student_cloud_access_v5|student_learning_navigation_v5|admin_cloud_students_v5|SyntaxError/i.test(x));
    assert.deepEqual(errorsFromV5,[],role+" "+screen.name+" app errors");
    await context.close();
    console.log("PASS "+role+" "+screen.name+" one login, legacy navigation, cloud users");
   }
  }
 }finally{await browser.close()}
};
await run();
console.log("PASS Student V5: 6 synthetic browser roles and viewports");
