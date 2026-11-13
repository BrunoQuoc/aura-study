import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';

const origin='http://127.0.0.1:8765';
mkdirSync('test-results/knowledge-math6-chapter8-geometry',{recursive:true});
const browser=await chromium.launch({headless:true});
const checks=[
 {name:'ipad',width:820,height:1180},
 {name:'phone',width:390,height:844},
 {name:'desktop',width:1366,height:900}
];
try{
 for(const viewport of checks){
  const ctx=await browser.newContext({
   viewport:{width:viewport.width,height:viewport.height},
   isMobile:viewport.name==='phone',hasTouch:viewport.name!=='desktop',
   locale:'vi-VN'
  });
  const outside=[],errors=[];
  await ctx.route('**/*',route=>{
   const url=route.request().url();
   if(!url.startsWith(origin+'/')){outside.push(url);return route.abort();}
   return route.continue();
  });
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/knowledge-math6-volume2.html',{waitUntil:'load'});
  await page.locator('.chapter-button').first().waitFor({timeout:15000});
  assert.equal(await page.locator('.chapter-button').count(),4);
  assert.equal(await page.locator('.chapter-button:disabled').count(),1);
  assert.equal((await page.locator('#countLessons').innerText()).trim(),'15');
  assert.equal((await page.locator('#countQuestions').innerText()).trim(),'45');
  await page.locator('.chapter-button').nth(2).click();
  assert.equal(await page.locator('.lesson-button').count(),6);
  for(let lesson=32;lesson<=37;lesson++){
   await page.locator('.lesson-button[data-lesson="'+lesson+'"]').click();
   assert.equal(await page.locator('.aura-geometry-figure').count(),1);
   assert.equal(await page.locator('.aura-geometry-svg').count(),1);
   assert.ok((await page.locator('.aura-geometry-figure figcaption').innerText()).length>40);
   assert.equal(await page.locator('.quiz-card').count(),3);
   if(lesson===37)assert.equal(await page.locator('.aura-geometry-svg').getAttribute('data-angle-degrees'),'60');
  }
  await page.locator('.lesson-button[data-lesson="34"]').click();
  const answers=[1,2,1];
  for(let i=0;i<3;i++){
   await page.locator('.quiz-card').nth(i).locator('input[value="'+answers[i]+'"]').check();
  }
  await page.locator('.submit-button').click();
  assert.match(await page.locator('#quizResult').innerText(),/3\/3/);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('aura_kntt_math6_volume2_progress_v1')));
  assert.equal(saved.lessons['bai-34'].score,3);
  await page.screenshot({path:'test-results/knowledge-math6-chapter8-geometry/'+viewport.name+'-lesson34.png',fullPage:true});

  // Dedicated original dynamic SVG practice and original sourced Chapter VIII review.
  await page.goto(origin+'/knowledge-math6-geometry-review.html',{waitUntil:'load'});
  await page.locator('.geometry-quiz fieldset').first().waitFor({timeout:15000});
  assert.equal(await page.locator('.geometry-quiz fieldset').count(),6);
  assert.match(await page.locator('#segmentOutput').innerText(),/AM = 5 cm, MB = 7 cm/);
  await page.locator('#segmentSlider').evaluate(el=>{
   el.value='6';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.match(await page.locator('#segmentOutput').innerText(),/AM = 6 cm, MB = 6 cm/);
  assert.match(await page.locator('#segmentOutput').innerText(),/M là trung điểm/);
  await page.locator('#segmentSlider').evaluate(el=>{
   el.value='5.5';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.match(await page.locator('#segmentOutput').innerText(),/AM = 5,5 cm, MB = 6,5 cm/);
  assert.match(await page.locator('#segmentOutput').innerText(),/M chưa là trung điểm/);

  for(const [angle,label] of [
   [0,'góc 0°'],[45,'góc nhọn'],[90,'góc vuông'],
   [135,'góc tù'],[180,'góc bẹt']
  ]){
   await page.locator('#angleSlider').evaluate((el,degree)=>{
    el.value=String(degree);el.dispatchEvent(new Event('input',{bubbles:true}));
   },angle);
   assert.match(await page.locator('#angleOutput').innerText(),new RegExp(label));
  }
  await page.screenshot({path:'test-results/knowledge-math6-chapter8-geometry/'+viewport.name+'-manipulatives.png',fullPage:true});
  await page.locator('#geometrySubmit').click();
  assert.match(await page.locator('#geometryReviewResult').innerText(),/Trả lời đủ cả 6 câu/);
  // Only C8-01 wrong; the remaining five match the independent answer ledger.
  const picks=[0,0,2,0,2,1];
  for(let i=0;i<6;i++){
   await page.locator('.geometry-quiz fieldset').nth(i)
    .locator('input[value="'+picks[i]+'"]').check();
  }
  await page.locator('#geometrySubmit').click();
  assert.match(await page.locator('#geometryReviewResult').innerText(),/5\/6/);
  assert.match(await page.locator('#geometryReviewResult').innerText(),/Ôn Bài 32/);
  assert.equal(await page.locator('#geometryReviewResult a').first().getAttribute('href'),
   'knowledge-math6-volume2.html#bai-32');
  assert.equal(await page.locator('.geometry-feedback').count(),6);
  const result=await page.evaluate(()=>JSON.parse(localStorage.getItem('aura_kntt_math6_volume2_ch8_review_v1')));
  assert.equal(result.score,5);assert.equal(result.answers[0],0);
  assert.match(result.questionSha256,/^[0-9a-f]{64}$/);
  const storage=await page.evaluate(()=>Object.keys(localStorage).sort());
  assert.deepEqual(storage.sort(),[
   'aura_kntt_math6_volume2_ch8_review_v1','aura_kntt_math6_volume2_progress_v1'
  ].sort());
  await page.reload({waitUntil:'load'});
  await page.locator('.geometry-quiz fieldset').first().waitFor({timeout:15000});
  assert.match(await page.locator('#geometryReviewResult').innerText(),/5\/6/);
  assert.equal(await page.locator('#geometrySubmit').isHidden(),true);
  assert.equal(await page.locator('#geometryRetry').isVisible(),true);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3,'Horizontal overflow '+viewport.name+': '+overflow);
  assert.deepEqual(errors,[],viewport.name+' JS errors');
  assert.deepEqual(outside,[],viewport.name+' external requests');
  console.log('PASS '+viewport.name+': six SVG lessons, midpoint/angle model, 6 review answers and local-only recovery');
  await ctx.close();
 }
}finally{await browser.close();}
