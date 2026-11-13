import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const base='http://127.0.0.1:8765';
mkdirSync('test-results/knowledge-math6-yearend',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const v of [{name:'ipad',width:820,height:1180},{name:'phone',width:390,height:844},{name:'desktop',width:1366,height:900}]){
  const context=await browser.newContext({viewport:{width:v.width,height:v.height},hasTouch:v.name!=='desktop',isMobile:v.name==='phone',locale:'vi-VN'});
  const errors=[],external=[];
  await context.route('**/*',r=>{
   if(!r.request().url().startsWith(base+'/')){external.push(r.request().url());return r.abort();}
   return r.continue();
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/knowledge-math6-yearend.html',{waitUntil:'load'});
  await page.locator('.decimal-question').first().waitFor({timeout:12000});
  assert.equal(await page.locator('.decimal-question').count(),11,'6 MCQ + 5 rubric cards');
  assert.equal(await page.locator('#yearendWrittenItems details').count(),5);
  await page.locator('#yearendWrittenItems details').first().locator('summary').click();
  assert.match(await page.locator('#yearendWrittenItems details').first().innerText(),/ƯCLN = 12/);
  await page.locator('#yearendSubmit').click();
  assert.match(await page.locator('#yearendQuizResult').innerText(),/Vui lòng trả lời đủ/);
  const selected=[1,2,0,1,1,2];
  for(let i=0;i<selected.length;i++)
   await page.locator('#yearendQuizQuestions .decimal-question').nth(i)
    .locator('input[value="'+selected[i]+'"]').check();
  await page.locator('#yearendSubmit').click();
  assert.match(await page.locator('#yearendQuizResult').innerText(),/6\/6/);
  const key='aura_kntt_math6_yearend_quiz_v1_chapter6';
  const p=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  assert.equal(p.score,6);
  assert.equal(p.answers.length,6);
  assert.match(p.sha256,/^[0-9a-f]{64}$/);
  await page.reload({waitUntil:'load'});
  await page.locator('#yearendWrittenItems details').first().waitFor();
  assert.match(await page.locator('#yearendQuizResult').innerText(),/6\/6/);

  await page.locator('#yearendSet').selectOption('yearEnd');
  assert.equal(await page.locator('#yearendQuizQuestions .decimal-question').count(),12);
  const wrong=[0,2,2,1,2,0,2,1,1,1,1,2];
  for(let i=0;i<wrong.length;i++)
   await page.locator('#yearendQuizQuestions .decimal-question').nth(i)
    .locator('input[value="'+wrong[i]+'"]').check();
  await page.locator('#yearendSubmit').click();
  assert.match(await page.locator('#yearendQuizResult').innerText(),/11\/12/);
  assert.match(await page.locator('#yearendQuizResult').innerText(),/Bài 11/);
  const keys=await page.evaluate(()=>Object.keys(localStorage).sort());
  assert.deepEqual(keys,['aura_kntt_math6_yearend_quiz_v1_chapter6','aura_kntt_math6_yearend_quiz_v1_yearEnd'].sort());
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3,'Horizontal overflow '+v.name+': '+overflow);
  assert.deepEqual(errors,[],v.name+' JS errors');
  assert.deepEqual(external,[],v.name+' external traffic');
  await page.screenshot({path:'test-results/knowledge-math6-yearend/'+v.name+'-yearend.png',fullPage:true});
  await context.close();
  console.log('PASS '+v.name+': 6 Chapter VI MCQs, 12 cross-year MCQs, 5 human rubrics, local-only reloading');
 }
}finally{await browser.close();}
