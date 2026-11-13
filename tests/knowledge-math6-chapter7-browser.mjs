import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const origin='http://127.0.0.1:8765';
mkdirSync('test-results/knowledge-math6-chapter7-decimals',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const viewport of [
  {name:'ipad',width:820,height:1180},
  {name:'phone',width:390,height:844},
  {name:'desktop',width:1366,height:900}
 ]){
  const context=await browser.newContext({
   viewport:{width:viewport.width,height:viewport.height},
   hasTouch:viewport.name!=='desktop',isMobile:viewport.name==='phone',
   locale:'vi-VN'
  });
  const errors=[],external=[];
  await context.route('**/*',route=>{
   if(!route.request().url().startsWith(origin+'/')){
    external.push(route.request().url());return route.abort();
   }
   return route.continue();
  });
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/knowledge-math6-decimals-review.html',{waitUntil:'load'});
  await page.locator('.decimal-question').first().waitFor({timeout:15000});
  assert.equal(await page.locator('.decimal-question').count(),6);
  assert.equal(await page.locator('.percent-grid .cell').count(),20);
  assert.match(await page.locator('#roundResult').innerText(),/3,4 làm tròn đến hàng đơn vị là 3/);
  await page.locator('#roundSlider').evaluate(el=>{
   el.value='3.5';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.match(await page.locator('#roundResult').innerText(),/3,5 làm tròn đến hàng đơn vị là 4/);
  await page.locator('#roundSlider').evaluate(el=>{
   el.value='7.4';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.match(await page.locator('#roundResult').innerText(),/7,4 làm tròn đến hàng đơn vị là 7/);
  await page.locator('#percentSlider').evaluate(el=>{
   el.value='75';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.equal(await page.locator('.percent-grid .cell.filled').count(),15);
  assert.match(await page.locator('#percentResult').innerText(),/75% của 200 = 150/);
  await page.screenshot({path:'test-results/knowledge-math6-chapter7-decimals/'+viewport.name+'-visuals.png',fullPage:true});

  await page.locator('#decimalReviewSubmit').click();
  assert.match(await page.locator('#decimalReviewResult').innerText(),/Vui lòng trả lời đủ cả 6 câu/);
  const answers=[1,2,1,2,1,2]; // first wrong, other 5 correct -> remediation lesson 28
  for(let i=0;i<answers.length;i++){
   await page.locator('.decimal-question').nth(i)
    .locator('input[value="'+answers[i]+'"]').check();
  }
  await page.locator('#decimalReviewSubmit').click();
  assert.match(await page.locator('#decimalReviewResult').innerText(),/5\/6/);
  assert.match(await page.locator('#decimalReviewResult').innerText(),/Ôn lại Bài 28/);
  assert.equal(await page.locator('#decimalReviewResult a').first().getAttribute('href'),
   'knowledge-math6-volume2.html#bai-28');
  assert.equal(await page.locator('.decimal-question .decimal-feedback').count(),6);
  const entry=await page.evaluate(()=>JSON.parse(localStorage.getItem('aura_kntt_math6_volume2_ch7_review_v1')));
  assert.equal(entry.score,5);
  assert.equal(entry.answers[0],1);
  assert.match(entry.questionSha256,/^[a-f0-9]{64}$/);
  const keys=await page.evaluate(()=>Object.keys(localStorage));
  assert.deepEqual(keys,['aura_kntt_math6_volume2_ch7_review_v1'],
   'No official grading or old course keys may be touched');
  await page.screenshot({path:'test-results/knowledge-math6-chapter7-decimals/'+viewport.name+'-remediation.png',fullPage:true});

  await page.reload({waitUntil:'load'});
  await page.locator('.decimal-question').first().waitFor({timeout:15000});
  assert.match(await page.locator('#decimalReviewResult').innerText(),/5\/6/);
  assert.equal(await page.locator('#decimalReviewSubmit').isHidden(),true);
  assert.equal(await page.locator('#decimalReviewRetry').isVisible(),true);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3,'Horizontal overflow '+viewport.name+': '+overflow);
  assert.deepEqual(errors,[],viewport.name+' browser error');
  assert.deepEqual(external,[],viewport.name+' unexpected external requests');
  console.log('PASS '+viewport.name+': decimal rounding, % grid, 6-item quiz, wrong skill remediation and isolated persistence');
  await context.close();
 }
}finally{await browser.close();}
