/* AURA Math6 KNTT V2: isolated Chromium acceptance on touch + desktop. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const origin='http://127.0.0.1:8765';
const out='test-results/knowledge-math6-volume1';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const viewport of [
  {name:'ipad',width:820,height:1180},
  {name:'phone',width:390,height:844},
  {name:'desktop',width:1366,height:900}
 ]){
  const ctx=await browser.newContext({
   viewport:{width:viewport.width,height:viewport.height},
   hasTouch:viewport.name!=='desktop',
   isMobile:viewport.name!=='desktop',
   locale:'vi-VN'
  });
  await ctx.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/knowledge-math6-v2.html',{waitUntil:'load'});
  await page.locator('.chapter-button').first().waitFor({timeout:15000});
  assert.equal(await page.locator('.chapter-button').count(),5);
  assert.equal(await page.locator('.lesson-button').count(),7);
  assert.equal((await page.locator('#countLessons').innerText()).trim(),'22');
  assert.equal((await page.locator('#countQuestions').innerText()).trim(),'66');
  assert.equal(await page.locator('.quiz-card').count(),3);
  assert.match(await page.locator('.knowledge-warning').innerText(),/nháp/i);
  let overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3,'horizontal overflow at launch '+viewport.name+': '+overflow);
  await page.screenshot({path:out+'/'+viewport.name+'-home.png',fullPage:true});

  await page.locator('.chapter-button').nth(2).click();
  assert.equal(await page.locator('.lesson-button').count(),5);
  await page.locator('.lesson-button[data-lesson="14"]').click();
  assert.match(await page.locator('.lesson-title h2').innerText(),/Phép cộng và phép trừ số nguyên/);
  assert.equal(await page.locator('.quiz-card').count(),3);
  const choices=[2,2,2];
  for(let i=0;i<3;i++){
   await page.locator('.quiz-card').nth(i).locator('input[value="'+choices[i]+'"]').check();
  }
  await page.locator('.submit-button').click();
  await page.locator('#quizResult').waitFor();
  assert.match(await page.locator('#quizResult').innerText(),/3\/3/);
  let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('aura_kntt_math6_v2_progress_v1')));
  assert.equal(saved.lessons['bai-14'].score,3);
  assert.equal(saved.lessons['bai-14'].submitted,true);
  assert.equal((await page.locator('#countCompleted').innerText()).trim(),'1');
  await page.screenshot({path:out+'/'+viewport.name+'-quiz.png',fullPage:true});

  await page.reload({waitUntil:'load'});
  await page.locator('.chapter-button').first().waitFor({timeout:15000});
  assert.match(await page.locator('.lesson-title h2').innerText(),/Phép cộng và phép trừ số nguyên/);
  assert.match(await page.locator('#quizResult').innerText(),/3\/3/);
  await page.locator('#lessonSearch').fill('đối xứng');
  assert.ok(await page.locator('.lesson-button').count()>=2);
  await page.locator('.lesson-button[data-lesson="22"]').click();
  assert.match(await page.locator('.lesson-title h2').innerText(),/tâm đối xứng/);
  assert.equal(await page.locator('.quiz-card').count(),3);
  assert.equal(await page.locator('a.back-link').getAttribute('href'),'student-direct.html');
  overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3,'horizontal overflow on lesson '+viewport.name+': '+overflow);
  assert.deepEqual(errors,[],viewport.name+' JS page errors');
  const keys=await page.evaluate(()=>Object.keys(localStorage));
  assert.ok(keys.every(k=>k==='aura_kntt_math6_v2_progress_v1'),'Unexpected legacy-data mutation');
  await page.screenshot({path:out+'/'+viewport.name+'-geometry.png',fullPage:true});
  console.log('PASS '+viewport.name+': 5 chapters, 22 lessons, 66 quizzes, scoped persistence, geometry search');
  await ctx.close();
 }
}finally{await browser.close();}
