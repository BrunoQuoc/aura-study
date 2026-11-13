import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const base='http://127.0.0.1:8765';
mkdirSync('test-results/math6-yearend-bridge',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const v of [
  {name:'ipad',width:820,height:1180},
  {name:'phone',width:390,height:844},
  {name:'desktop',width:1366,height:900}
 ]){
  const ctx=await browser.newContext({
   viewport:{width:v.width,height:v.height},
   hasTouch:v.name!=='desktop',isMobile:v.name==='phone',locale:'vi-VN'
  });
  const external=[],errors=[];
  await ctx.route('**/*',r=>{
   if(!r.request().url().startsWith(base+'/')){external.push(r.request().url());return r.abort();}
   return r.continue();
  });
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/knowledge-math6-volume2.html',{waitUntil:'load'});
  assert.equal(await page.locator('a[href="knowledge-math6-fractions-review.html"]').count(),1);
  assert.equal(await page.locator('a[href="knowledge-math6-yearend.html"]').count(),1);
  assert.equal(await page.locator('a[href="knowledge-math6-statistics-review.html"]').count(),1);

  await page.goto(base+'/knowledge-math6-fractions-review.html',{waitUntil:'load'});
  await page.locator('#extraQuestions fieldset').first().waitFor({timeout:15000});
  assert.equal(await page.locator('#extraQuestions fieldset').count(),6);
  await page.locator('#extraSubmit').click();
  assert.match(await page.locator('#extraResult').innerText(),/Vui lòng trả lời đủ 6 câu/);
  const fractionKeys=[1,2,0,0,2,2];
  for(let i=0;i<6;i++)await page.locator('#extraQuestions fieldset').nth(i)
   .locator('input[value="'+fractionKeys[i]+'"]').check();
  await page.locator('#extraSubmit').click();
  assert.match(await page.locator('#extraResult').innerText(),/6\/6/);
  const six=await page.evaluate(()=>JSON.parse(localStorage.getItem('aura_kntt_math6_volume2_ch6_review_v1')));
  assert.equal(six.score,6);
  assert.match(six.questionSha256,/^[0-9a-f]{64}$/);
  await page.reload({waitUntil:'load'});
  await page.locator('#extraQuestions fieldset').first().waitFor({timeout:15000});
  assert.match(await page.locator('#extraResult').innerText(),/6\/6/);
  await page.screenshot({path:'test-results/math6-yearend-bridge/'+v.name+'-chapter6.png',fullPage:true});

  await page.goto(base+'/knowledge-math6-yearend.html',{waitUntil:'load'});
  await page.locator('#annualQuizQuestions fieldset').first().waitFor({timeout:15000});
  assert.equal(await page.locator('#annualQuizQuestions fieldset').count(),12);
  assert.equal(await page.locator('.annual-written').count(),6);
  assert.equal(await page.locator('.annual-written textarea').count(),6);
  await page.locator('.annual-written textarea').first().fill('Bài tự luận nháp, không được lưu');
  await page.locator('.annual-written summary').first().click();
  assert.equal(await page.locator('.annual-written details').first().evaluate(el=>el.open),true);
  assert.match(await page.locator('.annual-written details').first().innerText(),/Tổng tối đa/);
  const annualKeys=[0,0,2,1,3,2,1,2,1,1,2,2];
  for(let i=0;i<12;i++)await page.locator('#annualQuizQuestions fieldset').nth(i)
   .locator('input[value="'+annualKeys[i]+'"]').check();
  await page.locator('#annualSubmit').click();
  assert.match(await page.locator('#annualResult').innerText(),/11\/12/);
  assert.equal(await page.locator('#annualResult a').first().getAttribute('href'),
   'knowledge-math6-v2.html#bai-7');
  const record=await page.evaluate(()=>JSON.parse(localStorage.getItem('aura_kntt_math6_yearend_preview_v1')));
  assert.equal(record.score,11);
  const storage=await page.evaluate(()=>Object.keys(localStorage).sort());
  assert.deepEqual(storage,[
   'aura_kntt_math6_volume2_ch6_review_v1','aura_kntt_math6_yearend_preview_v1'
  ].sort(),'No official result keys or written submissions may be persisted');
  await page.screenshot({path:'test-results/math6-yearend-bridge/'+v.name+'-annual.png',fullPage:true});
  await page.reload({waitUntil:'load'});
  await page.locator('#annualQuizQuestions fieldset').first().waitFor({timeout:15000});
  assert.match(await page.locator('#annualResult').innerText(),/11\/12/);
  assert.equal(await page.locator('.annual-written textarea').first().inputValue(),'',
   'Essay responses must never be saved');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3,'Horizontal overflow '+v.name+': '+overflow);
  assert.deepEqual(errors,[],v.name+' JavaScript errors');
  assert.deepEqual(external,[],v.name+' unexpected outgoing request');
  console.log('PASS '+v.name+': ChVI review, annual MCQ, six manual rubrics and no official writes');
  await ctx.close();
 }
}finally{await browser.close();}
