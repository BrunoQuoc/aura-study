/* AURA STUDY Admin V3 — real Chromium smoke on three screen sizes.
 * All Supabase responses synthetic; no private credentials, no Google calls.
 */
import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdirSync} from "node:fs";
const origin="http://127.0.0.1:8765";
const output="test-results/admin-unified-v3";
mkdirSync(output,{recursive:true});
const catalog={
 staging_only:true,manual_review_rule:"EXTERNAL_EXAM_AND_SAMPLE_ONLY",
 auto_sgk:true,auto_practice:true,official_exam_enabled:false,
 source_count:2,sgk_units:53,practice_units:25,guided_lesson_drafts:36,
 practice_module_drafts:15,verified_textbook_exercises:0,pending_manual_approvals:0,
 sources:[{id:"SGK-M6-KNTT-T1",title:"Toán 6 — Tập 1",subject:"Toán",
  volume:1,grade:6,toc_count:40,
  url:"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-6-tap-mot.4699854777",
  verified_full_text:false,content_scope:"OFFICIAL_TOC_IMAGE_ONLY"},
  {id:"SGK-M6-KNTT-T2",title:"Toán 6 — Tập 2",subject:"Toán",
  volume:2,grade:6,toc_count:38,
  url:"https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-6-tap-hai.4699864675",
  verified_full_text:false,content_scope:"OFFICIAL_TOC_IMAGE_ONLY"}]
};
const browser=await chromium.launch({headless:true,channel:"chrome"});
let checks=0;
try{
 for(const screen of [
  {id:"phone",width:390,height:844,mobile:true},
  {id:"ipad",width:820,height:1180,mobile:true},
  {id:"desktop",width:1366,height:900,mobile:false}
 ]){
  const context=await browser.newContext({
   viewport:{width:screen.width,height:screen.height},
   hasTouch:screen.mobile,isMobile:screen.mobile,locale:"vi-VN"
  });
  await context.addInitScript(()=>{
   localStorage.setItem("aura-stage-parent-v1",JSON.stringify({
    access_token:"synthetic-admin-session",expires_at:4102444800
   }));
  });
  await context.route("**/*",async route=>{
   const req=route.request(),url=req.url();
   if(url.startsWith(origin+"/"))return route.continue();
   if(url.startsWith("https://ufqzuowjhdqpydqvcsob.supabase.co/")){
    const headers={"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Methods":"POST,OPTIONS",
     "Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info",
     "Content-Type":"application/json"};
    if(req.method()==="OPTIONS")return route.fulfill({status:200,headers,body:"{}"});
    let action="";try{action=JSON.parse(req.postData()||"{}").action}catch{}
    if(action==="admin_content_overview")return route.fulfill({status:200,headers,body:JSON.stringify(catalog)});
    if(action==="admin_list")return route.fulfill({status:200,headers,
     body:JSON.stringify({staging_only:true,items:[]})});
    return route.fulfill({status:403,headers,body:JSON.stringify({error:"synthetic source only"})});
   }
   return route.abort();
  });
  const page=await context.newPage(),jsErrors=[],network=[];
  page.on("pageerror",e=>jsErrors.push(e.message));
  page.on("request",req=>{if(req.url().includes("supabase"))network.push("REQ "+req.method()+" "+req.url())});
  page.on("response",r=>{if(r.url().includes("supabase"))network.push("RES "+r.status()+" "+r.url())});
  page.on("requestfailed",req=>network.push("FAILED "+req.url()+" "+req.failure()?.errorText));
  await page.goto(origin+"/admin-direct.html",{waitUntil:"load",timeout:45000});
  await page.locator(".av3-lane-card").first().waitFor({timeout:20000});
  try{
   await page.locator(".av3-live").first().waitFor({timeout:12000});
  }catch(error){
   console.log("ADMIN V3 DEBUG",screen.id,await page.locator(".av3-connect").innerText(),
    await page.evaluate(()=>({
      session:!!localStorage.getItem("aura-stage-parent-v1"),
      cloud:!!window.AURA_LEGACY_CLOUD_ADMIN,hub:!!window.AURA_ADMIN_V3
    })),network.slice(0,30),jsErrors.slice(0,12));
   await page.screenshot({path:output+"/"+screen.id+"-diagnostic.png",fullPage:true});
   throw error;
  }
  assert.equal(await page.locator(".side .navbtn").count(),5);
  assert.equal(await page.locator(".av3-lane-card").count(),3);
  assert.match(await page.locator("#app").innerText(),/Một kho tài liệu/);
  const pageOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(pageOverflow<=3,screen.id+" main dashboard overflow "+pageOverflow);
  await page.screenshot({path:output+"/"+screen.id+"-overview.png",fullPage:true});
  const nav=async k=>{
   const sel=(screen.width<=760?".mobilebar":".side")+' button[data-page="'+k+'"]';
   await page.locator(sel).click();
  };
  await nav("library");
  await page.locator('.av3-tabs [data-v3-action="tab-sgk"]').waitFor();
  assert.equal(await page.locator(".av3-tabs button").count(),3);
  assert.match(await page.locator("#app").innerText(),/Toán 6 — Tập 1/);
  assert.equal(await page.locator(".av3-source").count(),2);
  await page.screenshot({path:output+"/"+screen.id+"-three-lanes.png",fullPage:true});
  await page.locator('[data-v3-action="tab-practice"]').first().click();
  assert.match(await page.locator("#app").innerText(),/15/);
  assert.match(await page.locator("#app").innerText(),/bài tập SGK/i);
  await page.locator('[data-v3-action="tab-exam"]').first().click();
  assert.match(await page.locator("#app").innerText(),/Anh duyệt|Anh tự cung cấp/);
  assert.match(await page.locator("#app").innerText(),/bài mẫu/i);
  await page.locator('[data-v3-action="inbox"]').first().click();
  assert.match(await page.locator("#app").innerText(),/INBOX/i);
  checks+=4;
  await page.locator(".brand").click();
  await page.locator(".av3-lane-card").first().waitFor();
  await nav("students");
  assert.match(await page.locator("#app").innerText(),/Học sinh/i);
  await nav("settings");
  assert.match(await page.locator("#app").innerText(),/Nguồn Drive \(nâng cao\)/);
  checks+=2;
  const errors=jsErrors.filter(x=>/admin_unified_v3|Unexpected token|not defined/i.test(x));
  assert.deepEqual(errors,[],screen.id+" application errors");
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3,screen.id+" after navigation overflow "+overflow);
  await context.close();
  console.log("PASS "+screen.id+": overview, 3 document lanes, INBOX, students, settings");
 }
 console.log("PASS Admin V3 browser journeys: "+checks);
}finally{await browser.close()}
