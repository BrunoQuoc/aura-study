import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const origin='http://127.0.0.1:8765';
mkdirSync('test-results/knowledge-math6-volume2',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const v of [
  {name:'ipad',width:820,height:1180},
  {name:'phone',width:390,height:844},
  {name:'desktop',width:1366,height:900}
 ]){
  const ctx=await browser.newContext({
   viewport:{width:v.width,height:v.height},
   isMobile:v.name==='phone',hasTouch:v.name!=='desktop',locale:'vi-VN'
  });
  const outside=[],errors=[];
  await ctx.route('**/*',r=>{
   if(!r.request().url().startsWith(origin+'/')){outside.push(r.request().url());return r.abort();}
   return r.continue();
  });
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/knowledge-math6-volume2.html',{waitUntil:'load'});
  await page.locator('.chapter-button').first().waitFor({timeout:12000});
  assert.equal(await page.locator('.chapter-button').count(),4);
  assert.equal(await page.locator('.chapter-button:disabled').count(),2);
  assert.equal(await page.locator('.lesson-button').count(),5);
  assert.equal((await page.locator('#countLessons').innerText()).trim(),'9');
  assert.equal((await page.locator('#countQuestions').innerText()).trim(),'27');
  assert.match(await page.locator('.lesson-title h2').innerText(),/Mở rộng khái niệm phân số/);
  assert.equal(await page.locator('.quiz-card').count(),3);
  assert.match(await page.locator('.knowledge-warning').innerText(),/Chương VIII–IX chỉ có tên trong mục lục/);
  const current=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(current<=3,'overflow initial on '+v.name+': '+current);
  await page.screenshot({path:'test-results/knowledge-math6-volume2/'+v.name+'-home.png',fullPage:true});

  await page.locator('.lesson-button[data-lesson="25"]').click();
  assert.match(await page.locator('.lesson-title h2').innerText(),/Phép cộng và phép trừ phân số/);
  for(let i=0;i<3;i++){
   await page.locator('.quiz-card').nth(i).locator('input[value="1"]').check();
  }
  await page.locator('.submit-button').click();
  await page.locator('#quizResult').waitFor();
  assert.match(await page.locator('#quizResult').innerText(),/3\/3/);
  assert.equal((await page.locator('#countCompleted').innerText()).trim(),'1');
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('aura_kntt_math6_volume2_progress_v1')));
  assert.equal(state.libraryId,'AURA-KNTT6-MATH-VOLUME2');
  assert.equal(state.lessons['bai-25'].score,3);
  assert.equal(state.lessons['bai-25'].submitted,true);
  const keys=await page.evaluate(()=>Object.keys(localStorage));
  assert.deepEqual(keys,['aura_kntt_math6_volume2_progress_v1'],
   'No writing to official grades, volume 1 or Weakness Map');
  await page.reload({waitUntil:'load'});
  await page.locator('.chapter-button').first().waitFor({timeout:12000});
  assert.match(await page.locator('#quizResult').innerText(),/3\/3/);
  assert.equal((await page.locator('#countCompleted').innerText()).trim(),'1');

  await page.locator('.lesson-button[data-lesson="27"]').click();
  assert.match(await page.locator('.lesson-title h2').innerText(),/Hai bài toán về phân số/);
  assert.equal(await page.locator('.pager-button.primary').isDisabled(),false);
  await page.locator('.chapter-button').nth(1).click();
  assert.equal(await page.locator('.lesson-button').count(),4);
  await page.locator('.lesson-button[data-lesson="29"]').click();
  assert.match(await page.locator('.lesson-title h2').innerText(),/Tính toán với số thập phân/);
  const picks=[1,1,2];
  for(let i=0;i<3;i++){
   await page.locator('.quiz-card').nth(i).locator('input[value="'+picks[i]+'"]').check();
  }
  await page.locator('.submit-button').click();
  await page.locator('#quizResult').waitFor();
  assert.match(await page.locator('#quizResult').innerText(),/3\\/3/);
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('aura_kntt_math6_volume2_progress_v1')));
  assert.equal(after.lessons['bai-29'].score,3);
  assert.equal((await page.locator('#countCompleted').innerText()).trim(),'2');
  await page.locator('.lesson-button[data-lesson="31"]').click();
  assert.match(await page.locator('.lesson-title h2').innerText(),/tỉ số và tỉ số phần trăm/);
  assert.equal(await page.locator('.pager-button.primary').isDisabled(),true);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3,'overflow after interaction '+v.name+': '+overflow);
  assert.deepEqual(errors,[],'browser errors '+v.name);
  assert.deepEqual(outside,[],'Unexpected external requests '+v.name);
  await page.screenshot({path:'test-results/knowledge-math6-volume2/'+v.name+'-quiz.png',fullPage:true});
  await ctx.close();
  console.log('PASS '+v.name+': 9 Math6 authored fraction/decimal lessons, 27 items, 2 unbuilt chapters and local progress isolation');
 }
}finally{await browser.close();}
