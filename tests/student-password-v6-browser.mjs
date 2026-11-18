/* V6 browser smoke. Fake Supabase Auth + Edge replies; NO real credentials or students created. */
import {chromium} from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
const ROOT="http://127.0.0.1:8765",OUT="test-results/student-v6";
fs.mkdirSync(OUT,{recursive:true});
const uid="f0c38427-7566-4be6-8b7f-91c117123456";
const source="https://taphuan.nxbgd.vn/tap-huan/doc-sach/book";
const catalog={staging_only:true,preview_only:true,copyright_scope:"PUBLISHER_TOC_AND_AI_AUTHORED_DRAFTS_ONLY",
 official_exam_enabled:false,totals:{student_preview_drafts:1,locked_practice_modules:1},
 items:[{id:"SGK-M6-T1-L08",title:"Quan hệ chia hết",lane:"SGK",subject:"Toán",volume:1,printed_page:23,
  source_url:source,preview_ready:true,status:"AI_DRAFT_PREVIEW",content_origin:"AURA_AI_AUTHORED_DRAFT"}]};
const lesson={...catalog,content_origin:"AURA_AI_AUTHORED_DRAFT",title:"Quan hệ chia hết",
 opening:"Khởi động bằng 24 chiếc bút",concept:"Phép chia hết có số dư bằng 0.",
 worked_example:"24 chia 6 bằng 4.",practice_prompt:"Tự kiểm tra 42 có chia hết cho 7 không.",
 application_prompt:"Chia 35 nhãn vở thành 5 nhóm.",auto_grading_enabled:false,textbook_body_verified:false};
const book={staging_only:true,review_required:false,official_exam_enabled:false,sources:[
 {toc_verified:true,review_required:false,full_textbook_verified:false,
 source_url:source,title:"Toán 6",subject:"Toán",grade:6,volume:1,sections:[{heading:"Bài 1",start_page:8}]}]};
const overview={staging_only:true,manual_review_rule:"EXTERNAL_EXAM_AND_SAMPLE_ONLY",auto_sgk:true,auto_practice:true,
 official_exam_enabled:false,source_count:1,sgk_units:53,practice_units:25,
 guided_lesson_drafts:36,practice_module_drafts:15,verified_textbook_exercises:0,
 pending_manual_approvals:0,sources:[{title:"Toán 6",url:source,volume:1,subject:"Toán",grade:6,toc_count:40}]};
const mockModule='export function createClient(){return {auth:{'+
 'async signInWithPassword({email,password}){if(email!=="kid6@brunoquoc.github.io"||password!=="Example8ab")return {data:{session:null},error:{message:"Invalid"}};'+
 'const s={access_token:"synthetic-student-jwt",refresh_token:"synthetic-refresh",expires_at:4102444800,expires_in:3600};'+
 'localStorage.setItem("aura-stage-student-v1",JSON.stringify(s));return {data:{session:s},error:null};},'+
 'async signOut(){localStorage.removeItem("aura-stage-student-v1");return {error:null}}}}}';
const browser=await chromium.launch({headless:true,channel:"chrome"});
try{
 for(const screen of [{name:"phone",w:390,h:844},{name:"ipad",w:820,h:1180},{name:"desktop",w:1366,h:900}]){
  for(const role of ["student","admin"]){
   const ctx=await browser.newContext({viewport:{width:screen.w,height:screen.h},locale:"vi-VN",
    hasTouch:screen.w<1000,isMobile:screen.w<1000});
   if(role==="admin")await ctx.addInitScript(()=>
    localStorage.setItem("aura-stage-parent-v1",JSON.stringify({access_token:"synthetic-admin-jwt",expires_at:4102444800})));
   const calls=[];
   let users=[{id:uid,name:"Học sinh cũ",username:"",login_ready:false}];
   await ctx.route("**/*",async route=>{
    const req=route.request(),url=req.url();
    if(url.startsWith(ROOT+"/"))return route.continue();
    if(url.startsWith("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.102.0/+esm"))
     return route.fulfill({status:200,contentType:"application/javascript",headers:{"Access-Control-Allow-Origin":"*"},body:mockModule});
    if(url.startsWith("https://ufqzuowjhdqpydqvcsob.supabase.co/")){
     const headers={"Access-Control-Allow-Origin":ROOT,
      "Access-Control-Allow-Methods":"POST,OPTIONS",
      "Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info",
      "Content-Type":"application/json"};
     if(req.method()==="OPTIONS")return route.fulfill({status:200,headers,body:"{}"});
     let payload={};try{payload=JSON.parse(req.postData()||"{}")}catch{}
     calls.push(payload.action||"");
     let response={error:"Unknown synthetic API"};
     switch(payload.action){
      case "student_profile":response={learner_id:uid,role:"STUDENT",paired:true,name:"Học sinh mô phỏng",staging_only:true};break;
      case "student_list":response={staging_only:true,official_exam_enabled:false,items:[]};break;
      case "learning_pipeline_catalog":response=catalog;break;
      case "learning_pipeline_lesson":response=lesson;break;
      case "sgk_auto_catalog":response=book;break;
      case "admin_content_overview":response=overview;break;
      case "admin_list":response={staging_only:true,items:[]};break;
      case "list_password_students":response={students:{mode:"PASSWORD_LOGIN",learners:users}};break;
      case "create_password_student":
       users.push({id:"9eb9a427-83ad-4867-b178-cc3d3a782f9e",name:payload.name,
        username:payload.username,login_ready:true});
       response={student:{login_ready:true,username:payload.username}};break;
      case "enable_password_student":
       users=users.map(x=>x.id===payload.student_id?{...x,username:payload.username,login_ready:true}:x);
       response={student:{login_ready:true}};break;
      case "reset_password_student":response={updated:true,staging_only:true};break;
     }
     return route.fulfill({status:response.error?403:200,headers,body:JSON.stringify(response)});
    }
    return route.abort();
   });
   const page=await ctx.newPage(),errors=[];
   page.on("pageerror",e=>errors.push(e.message));
   await page.goto(ROOT+"/"+(role==="student"?"student-direct.html":"admin-direct.html"),
    {waitUntil:"load",timeout:40000});
   if(role==="student"){
    await page.locator("#auraStudentPasswordFormV6").waitFor({timeout:18000});
    assert.equal(await page.locator("body.aura-cloud-ready").count(),0);
    assert.equal(await page.locator(".aura-login-overlay").count(),0);
    await page.locator("#auraStudentUsernameV6").fill("kid6");
    await page.locator("#auraStudentPasswordV6").fill("invalid123");
    await page.locator("#auraStudentLoginSubmitV6").click();
    await page.getByText("Tên đăng nhập hoặc mật khẩu không đúng.").waitFor();
    assert.equal(await page.locator("body.aura-cloud-ready").count(),0);
    await page.locator("#auraStudentPasswordV6").fill("Example8ab");
    await page.locator("#auraStudentLoginSubmitV6").click();
    await page.locator("body.aura-cloud-ready").waitFor({timeout:18000});
    assert.equal(await page.locator("#auraStudentOneLoginV5").count(),0);
    assert.equal(await page.locator(".side .navbtn").count(),7);
    assert.equal(await page.locator(".mobilebar button").count(),5);
    assert.match(await page.locator(".aura-account").innerText(),/Học sinh mô phỏng/);
    assert.equal(await page.locator("#auraLegacyCloudStudent:visible").count(),0);
    await page.evaluate(()=>window.auraStudentTasksV5());
    assert.match(await page.locator("#app").innerText(),/Nhiệm vụ học tập/);
    await page.evaluate(()=>window.auraStudentJourneyV5());
    assert.match(await page.locator("#app").innerText(),/Hành trình học tập/);
    await page.evaluate(()=>window.lessons());
    await page.locator("#auraStudentLearningPipelineV4 [data-aura-v4='open']").first().waitFor({timeout:18000});
    await page.locator("#auraStudentLearningPipelineV4 [data-aura-v4='open']").first().click();
    await page.getByText("Khởi động bằng 24 chiếc bút").waitFor();
    await page.screenshot({path:OUT+"/"+role+"-"+screen.name+".png",fullPage:true});
    assert.ok(calls.includes("student_profile")&&calls.includes("learning_pipeline_lesson"));
    await page.locator(".aura-account button").click();
    await page.locator("#auraStudentPasswordFormV6").waitFor();
    assert.equal(await page.locator("body.aura-cloud-ready").count(),0);
   }else{
    const side=page.locator('.side button[data-page="students"]');
    if(await side.isVisible())await side.click();
    else await page.locator('.mobilebar button[data-page="students"]').click();
    await page.getByText("Học sinh cũ").first().waitFor({timeout:15000});
    assert.equal(await page.locator('[data-cloud-user="issue"]').count(),0);
    assert.equal(await page.locator("text=Lấy liên kết học").count(),0);
    assert.equal(await page.locator("#auraCloudLinkValue").count(),0);
    await page.locator("#auraCloudNewStudent").fill("Học sinh mới");
    await page.locator("#auraCloudNewUsername").fill("student6");
    await page.locator("#auraCloudNewPassword").fill("Example8ab");
    await page.locator('[data-cloud-user="create"]').click();
    await page.getByText("Đã tạo Học sinh mới").waitFor();
    await page.locator('[data-cloud-user="configure"]').first().click();
    await page.locator("#auraCloudExistingUsername").fill("oldstudent6");
    await page.locator("#auraCloudExistingPassword").fill("NewPassword567");
    await page.locator('[data-cloud-user="save-existing"]').click();
    await page.getByText("Đã thiết lập @oldstudent6").waitFor();
    await page.locator('[data-cloud-user="reset"]').first().click();
    await page.locator("#auraCloudExistingPassword").fill("ChangedPassword987");
    await page.locator('[data-cloud-user="save-existing"]').click();
    await page.getByText("Đã đặt lại mật khẩu cho").waitFor();
    assert.ok(calls.includes("create_password_student")&&calls.includes("enable_password_student")&&calls.includes("reset_password_student"));
    await page.screenshot({path:OUT+"/"+role+"-"+screen.name+".png",fullPage:true});
   }
   const relevantErrors=errors.filter(x=>/student_password_login_v6|student_cloud_access_v5|admin_cloud_students_v5|SyntaxError/i.test(x));
   assert.deepEqual(relevantErrors,[],role+" "+screen.name+" runtime errors");
   console.log("PASS "+role+" "+screen.name+" password-login path");
   await ctx.close();
  }
 }
}finally{await browser.close()}
console.log("PASS 6 synthetic Admin and Student password-login views");
