import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const origin='http://127.0.0.1:8765';
const folder='test-results/knowledge-math6-chapter-review';
mkdirSync(folder,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const viewport of [
  {name:'ipad',width:820,height:1180},
  {name:'phone',width:390,height:844},
  {name:'desktop',width:1366,height:900}
 ]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},
   hasTouch:viewport.name!=='desktop',isMobile:viewport.name!=='desktop',locale:'vi-VN'});
  const page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>requests.push(r.url()));
  await context.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
  await page.goto(origin+'/knowledge-math6-chapters.html',{waitUntil:'load'});
  await page.locator('.review-chapter-button').first().waitFor({timeout:10000});
  assert.equal(await page.locator('.review-chapter-button').count(),5);
  assert.equal(await page.locator('.quiz-card').count(),6);
  assert.equal((await page.locator('#totalQuestions').innerText()).trim(),'30');
  assert.match(await page.locator('.visual-result').innerText(),/Liền trước/);
  const slider=page.locator('.visual-controls input[type=range]');
  await slider.evaluate(e=>{e.value='0';e.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.match(await page.locator('.visual-result').innerText(),/không có/);
  await page.screenshot({path:folder+'/'+viewport.name+'-numberline.png',fullPage:true});

  await page.locator('.review-chapter-button').nth(1).click();
  assert.equal(await page.locator('.quiz-card').count(),6);
  assert.equal(await page.locator('.visual-grid span.multiple').count(),20);
  await page.locator('.visual-controls select').selectOption('9');
  assert.equal(await page.locator('.visual-grid span.multiple').count(),6);
  assert.match(await page.locator('.visual-result').innerText(),/chia hết/);

  await page.locator('.review-chapter-button').nth(2).click();
  assert.equal(await page.locator('.visual-controls input[type=range]').count(),2);
  assert.match(await page.locator('.visual-result').innerText(),/Kết quả nằm/);

  await page.locator('.review-chapter-button').nth(3).click();
  const sliders=page.locator('.visual-controls input[type=range]');
  await sliders.nth(0).evaluate(e=>{e.value='7';e.dispatchEvent(new Event('input',{bubbles:true}));});
  await sliders.nth(1).evaluate(e=>{e.value='3';e.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.match(await page.locator('.visual-result').innerText(),/7 × 3 = 21/);

  await page.locator('.review-chapter-button').nth(4).click();
  await page.locator('.visual-controls select').first().selectOption('triangle');
  assert.match(await page.locator('.visual-result').innerText(),/Hai hình trùng nhau/);
  await page.locator('.visual-controls select').nth(1).selectOption('rotate');
  assert.match(await page.locator('.visual-result').innerText(),/Hai hình chưa trùng nhau/);
  await page.screenshot({path:folder+'/'+viewport.name+'-symmetry.png',fullPage:true});

  const answers=[0,2,2,2,3,0]; // intentionally wrong first question, rest correct
  for(let i=0;i<answers.length;i++){
   await page.locator('.quiz-card').nth(i).locator('input[value="'+answers[i]+'"]').check();
  }
  await page.locator('.submit-button').click();
  await page.locator('#chapterResult').waitFor();
  assert.match(await page.locator('#chapterResult').innerText(),/5\/6/);
  assert.match(await page.locator('#chapterResult').innerText(),/Ôn lại Bài 21/);
  const key='aura_kntt_math6_v2_chapter_review_v1';
  const local=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  assert.equal(local.chapters['5'].score,5);
  assert.equal(local.chapters['5'].missed.length,1);
  assert.equal((await page.locator('#doneChapters').innerText()).trim(),'1');
  assert.equal(await page.locator('#chapterResult a').first().getAttribute('href'),
   'knowledge-math6-v2.html#bai-21');
  await page.screenshot({path:folder+'/'+viewport.name+'-remediation.png',fullPage:true});

  await page.reload({waitUntil:'load'});
  await page.locator('.review-chapter-button').first().waitFor({timeout:10000});
  assert.match(await page.locator('#chapterResult').innerText(),/5\/6/);
  const keys=await page.evaluate(()=>Object.keys(localStorage));
  assert.deepEqual(keys,[key],'should never mutate official Exam Engine, Generator or Weakness Map keys');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3,'horizontal overflow '+viewport.name+': '+overflow);
  assert.ok(requests.every(x=>x.startsWith(origin+'/')),'no external request allowed');
  assert.deepEqual(errors,[],'no browser error '+viewport.name);
  console.log('PASS '+viewport.name+': chapter review, 5 visuals, local remediation, no official writes');
  await context.close();
 }
}finally{await browser.close();}
