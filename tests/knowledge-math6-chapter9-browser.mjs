import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const origin='http://127.0.0.1:8765';
mkdirSync('test-results/knowledge-math6-chapter9',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const v of [{name:'ipad',width:820,height:1180},{name:'phone',width:390,height:844},{name:'desktop',width:1366,height:900}]){
  const context=await browser.newContext({
   viewport:{width:v.width,height:v.height},hasTouch:v.name!=='desktop',
   isMobile:v.name==='phone',locale:'vi-VN'
  });
  const errors=[],outside=[];
  await context.route('**/*',route=>{
   if(!route.request().url().startsWith(origin+'/')){
    outside.push(route.request().url());return route.abort();
   }
   return route.continue();
  });
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/knowledge-math6-statistics-review.html',{waitUntil:'load'});
  await page.locator('.decimal-question').first().waitFor({timeout:12000});
  assert.equal(await page.locator('.decimal-question').count(),6);
  assert.equal(await page.locator('#statsBars rect').count(),3);
  assert.match(await page.locator('#statsBarResult').innerText(),/Nhóm A có 5 quyển/);
  await page.locator('#statsGroup').selectOption('B');
  assert.match(await page.locator('#statsBarResult').innerText(),/Nhóm B có 8 quyển/);
  assert.match(await page.locator('#statsBarResult').innerText(),/Chênh lệch: 3 quyển/);
  await page.locator('#statsFrequency').evaluate(el=>{
   el.value='15';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.equal(await page.locator('#statsTrialGrid .cell').count(),20);
  assert.equal(await page.locator('#statsTrialGrid .cell.filled').count(),15);
  assert.match(await page.locator('#statsProbabilityResult').innerText(),/15\/20 lần xuất hiện mặt 6 = 3\/4 = 75%/);
  await page.screenshot({path:'test-results/knowledge-math6-chapter9/'+v.name+'-visual.png',fullPage:true});
  await page.locator('#statsReviewSubmit').click();
  assert.match(await page.locator('#statsReviewResult').innerText(),/Vui lòng chọn đủ 6 đáp án/);
  const choices=[0,2,2,1,2,1]; // Question 1 deliberately wrong, rest correct -> source lesson 38.
  for(let i=0;i<6;i++){
   await page.locator('.decimal-question').nth(i).locator('input[value="'+choices[i]+'"]').check();
  }
  await page.locator('#statsReviewSubmit').click();
  assert.match(await page.locator('#statsReviewResult').innerText(),/5\/6/);
  assert.match(await page.locator('#statsReviewResult').innerText(),/Ôn lại Bài 38/);
  assert.equal(await page.locator('#statsReviewResult a').first().getAttribute('href'),'knowledge-math6-volume2.html#bai-38');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('aura_kntt_math6_volume2_ch9_review_v1')));
  assert.equal(saved.score,5);
  assert.match(saved.questionSha256,/^[0-9a-f]{64}$/);
  const all=await page.evaluate(()=>Object.keys(localStorage));
  assert.deepEqual(all,['aura_kntt_math6_volume2_ch9_review_v1']);
  await page.reload({waitUntil:'load'});
  await page.locator('.decimal-question').first().waitFor({timeout:12000});
  assert.match(await page.locator('#statsReviewResult').innerText(),/5\/6/);
  assert.equal(await page.locator('#statsReviewSubmit').isHidden(),true);
  assert.equal(await page.locator('#statsReviewRetry').isVisible(),true);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3,'Horizontal overflow '+v.name+': '+overflow);
  assert.deepEqual(errors,[],'Browser errors '+v.name);
  assert.deepEqual(outside,[],'Unexpected network requests '+v.name);
  console.log('PASS '+v.name+': original column chart, 20 trial frequency, chapter IX review, wrong lesson link and local-only save');
  await context.close();
 }
}finally{await browser.close();}
