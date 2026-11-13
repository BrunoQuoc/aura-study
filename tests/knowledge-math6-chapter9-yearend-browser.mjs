import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';

const base='http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true});
mkdirSync('test-results/knowledge-math6-chapter9-yearend',{recursive:true});
const testViewports=[
 {name:'ipad',width:820,height:1180},
 {name:'phone',width:390,height:844},
 {name:'desktop',width:1366,height:900}
];
function ok(text,label){assert.match(text,new RegExp(label))}
try{
 for(const v of testViewports){
  const ctx=await browser.newContext({
   viewport:{width:v.width,height:v.height},hasTouch:v.name!=='desktop',
   isMobile:v.name==='phone',locale:'vi-VN'
  });
  const external=[],errors=[];
  await ctx.route('**/*',r=>{
   if(!r.request().url().startsWith(base+'/')){
    external.push(r.request().url());return r.abort();
   }
   return r.continue();
  });
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/knowledge-math6-volume2.html',{waitUntil:'load'});
  await page.locator('.chapter-button').first().waitFor({timeout:15000});
  assert.equal(await page.locator('.chapter-button').count(),4);
  assert.equal(await page.locator('.chapter-button:disabled').count(),0);
  assert.equal((await page.locator('#countLessons').innerText()).trim(),'21');
  assert.equal((await page.locator('#countQuestions').innerText()).trim(),'63');
  await page.locator('.chapter-button').nth(3).click();
  assert.equal(await page.locator('.lesson-button').count(),6);
  for(let n=38;n<=43;n++){
   await page.locator('.lesson-button[data-lesson="'+n+'"]').click();
   assert.equal(await page.locator('.aura-statistics-figure').count(),1);
   assert.equal(await page.locator('.aura-statistics-svg').count(),1);
   assert.ok((await page.locator('.aura-statistics-figure figcaption').innerText()).length>45);
   assert.equal(await page.locator('.quiz-card').count(),3);
  }
  assert.equal(await page.locator('.pager-button.primary').isDisabled(),true);
  await page.locator('.lesson-button[data-lesson="43"]').click();
  const ans=[1,1,2];
  for(let i=0;i<3;i++){
   await page.locator('.quiz-card').nth(i)
    .locator('input[value="'+ans[i]+'"]').check();
  }
  await page.locator('.submit-button').click();
  ok(await page.locator('#quizResult').innerText(),'3/3');
  await page.screenshot({path:'test-results/knowledge-math6-chapter9-yearend/'+v.name+'-lesson.png',fullPage:true});

  await page.goto(base+'/knowledge-math6-statistics-review.html',{waitUntil:'load'});
  await page.locator('.statistics-quiz fieldset').first().waitFor({timeout:15000});
  assert.equal(await page.locator('.statistics-quiz fieldset').count(),6);
  await page.locator('#fruitCamSlider').evaluate(el=>{
   el.value='11';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.match(await page.locator('#fruitOutput').innerText(),/Cam 11/);
  assert.match(await page.locator('#fruitOutput').innerText(),/Tổng = 22/);
  assert.match(await page.locator('#fruitOutput').innerText(),/hơn Chuối 6 bạn/);
  await page.locator('#coinTrialsSlider').evaluate(el=>{
   el.value='70';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  const coin=await page.locator('#coinOutput').innerText();
  const m=coin.match(/Ngửa (\d+)\/70.*Sấp (\d+)\/70/);
  assert.ok(m,'Missing explicit empirical numerators: '+coin);
  assert.equal(Number(m[1])+Number(m[2]),70);
  assert.ok(Number(m[1])>0&&Number(m[2])>0);
  await page.screenshot({path:'test-results/knowledge-math6-chapter9-yearend/'+v.name+'-statistics.png',fullPage:true});
  const picks=[0,1,2,1,1,2]; // Only first question is wrong.
  for(let i=0;i<6;i++)await page.locator('.statistics-quiz fieldset').nth(i)
    .locator('input[value="'+picks[i]+'"]').check();
  await page.locator('#extraSubmit').click();
  assert.match(await page.locator('#extraResult').innerText(),/5\/6/);
  assert.match(await page.locator('#extraResult').innerText(),/Bài 38/);
  assert.equal(await page.locator('#extraResult a').first().getAttribute('href'),
   'knowledge-math6-volume2.html#bai-38');
  const preview9=await page.evaluate(()=>JSON.parse(localStorage.getItem('aura_kntt_math6_volume2_ch9_review_v1')));
  assert.equal(preview9.score,5);
  await page.reload({waitUntil:'load'});
  await page.locator('.statistics-quiz fieldset').first().waitFor({timeout:15000});
  assert.match(await page.locator('#extraResult').innerText(),/5\/6/);

  await page.goto(base+'/knowledge-math6-fractions-review.html',{waitUntil:'load'});
  await page.locator('.statistics-quiz fieldset').first().waitFor({timeout:15000});
  const fractions=[1,2,0,0,2,2];
  for(let i=0;i<6;i++)await page.locator('.statistics-quiz fieldset').nth(i)
    .locator('input[value="'+fractions[i]+'"]').check();
  await page.locator('#extraSubmit').click();
  assert.match(await page.locator('#extraResult').innerText(),/6\/6/);
  assert.equal(await page.locator('#extraSubmit').isHidden(),true);
  assert.equal(await page.locator('#extraRetry').isVisible(),true);

  await page.goto(base+'/knowledge-math6-yearend.html',{waitUntil:'load'});
  await page.locator('.annual-quiz fieldset').first().waitFor({timeout:15000});
  assert.equal(await page.locator('.annual-quiz fieldset').count(),12);
  assert.equal(await page.locator('.annual-written').count(),6);
  assert.equal(await page.locator('.annual-written textarea').count(),6);
  await page.locator('.annual-written textarea').first().fill('Lời giải tự viết chỉ trong phiên làm bài');
  await page.locator('.annual-written details').first().locator('summary').click();
  assert.equal(await page.locator('.annual-written details').first().isOpen(),true);
  assert.match(await page.locator('.annual-written details').first().innerText(),/10/);
  const yearly=[0,0,2,1,3,2,1,2,1,1,2,2]; // Only first question wrong.
  for(let i=0;i<12;i++){
   await page.locator('.annual-quiz fieldset').nth(i)
    .locator('input[value="'+yearly[i]+'"]').check();
  }
  await page.locator('#annualSubmit').click();
  assert.match(await page.locator('#annualResult').innerText(),/11\/12/);
  assert.equal(await page.locator('#annualResult a').first().getAttribute('href'),
   'knowledge-math6-v2.html#bai-7');
  await page.screenshot({path:'test-results/knowledge-math6-chapter9-yearend/'+v.name+'-annual.png',fullPage:true});
  const storage=await page.evaluate(()=>Object.keys(localStorage).sort());
  assert.deepEqual(storage,[
   'aura_kntt_math6_volume2_progress_v1','aura_kntt_math6_volume2_ch9_review_v1',
   'aura_kntt_math6_volume2_ch6_review_v1','aura_kntt_math6_yearend_preview_v1'
  ].sort());
  await page.reload({waitUntil:'load'});
  await page.locator('.annual-quiz fieldset').first().waitFor({timeout:15000});
  assert.match(await page.locator('#annualResult').innerText(),/11\/12/);
  assert.equal(await page.locator('.annual-written textarea').first().inputValue(),'',
   'Open responses must not be persisted or auto-graded');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3,'Horizontal page overflow on '+v.name+': '+overflow);
  assert.deepEqual(errors,[],v.name+' unexpected Javascript errors');
  assert.deepEqual(external,[],v.name+' unexpected external traffic');
  console.log('PASS '+v.name+': six statistics lessons/figures, two models, ChVI and IX reviews and annual human-only rubric');
  await ctx.close();
 }
}finally{await browser.close();}
