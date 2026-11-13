import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const base='http://127.0.0.1:8765';
const expected={
 lessonData:createHash('sha256').update(readFileSync('aura_data/knowledge_math6_kntt_volume1_v2.json')).digest('hex'),
 chapterData:createHash('sha256').update(readFileSync('aura_data/knowledge_math6_kntt_v2_chapter_reviews.json')).digest('hex')
};
const browser=await chromium.launch({headless:true});
try{
 for(const viewport of [
  {name:'ipad',width:820,height:1180},
  {name:'phone',width:390,height:844},
  {name:'desktop',width:1366,height:900}
 ]){
  const context=await browser.newContext({
   viewport:{width:viewport.width,height:viewport.height},
   hasTouch:viewport.name!=='desktop',
   isMobile:viewport.name==='phone',
   acceptDownloads:true,locale:'vi-VN'
  });
  await context.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/knowledge-review-packet.html',{waitUntil:'load'});
  await page.locator('.packet-item').first().waitFor({timeout:15000});
  assert.equal((await page.locator('#packetCount').innerText()).trim(),'96');
  assert.equal((await page.locator('#packetLessons').innerText()).trim(),'22');
  assert.equal((await page.locator('#packetChapters').innerText()).trim(),'5');
  assert.equal(await page.locator('.packet-item').count(),27);
  assert.equal((await page.locator('#packetLessonSha').innerText()).trim(),expected.lessonData);
  assert.equal((await page.locator('#packetReviewSha').innerText()).trim(),expected.chapterData);
  await page.locator('#packetChapter').selectOption('all');
  assert.equal(await page.locator('.packet-item').count(),96);
  await page.locator('#packetKind').selectOption('CHAPTER_REVIEW');
  assert.equal(await page.locator('.packet-item').count(),30);
  await page.locator('#packetKind').selectOption('all');
  await page.locator('#packetSearch').fill('C4-05');
  assert.equal(await page.locator('.packet-item').count(),1);
  assert.match(await page.locator('.packet-item .packet-prompt').innerText(),/Hình thang/);
  assert.match(await page.locator('.packet-item .packet-options .answer').innerText(),/72 cm²/);
  assert.match(await page.locator('.packet-item .packet-explain').innerText(),/72 cm²/);
  await page.locator('.packet-flag input[type=checkbox]').check();
  assert.equal((await page.locator('#packetExceptions').innerText()).trim(),'1');

  const invalid=page.waitForEvent('download',{timeout:1800}).then(()=>false,()=>true);
  await page.locator('#packetExport').click();
  assert.equal(await invalid,true,'An incomplete exception may not download');
  assert.match(await page.locator('#packetAlert').innerText(),/thiếu lý do/);
  const reason='Cần giáo viên kiểm tra lại cách dùng công thức và đơn vị diện tích.';
  await page.locator('.packet-flag textarea').fill(reason);
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#packetExport').click();
  const download=await downloadPromise;
  const fs=await import('node:fs');
  const draft=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
  assert.equal(draft.reviewDecision,'NOT_AN_APPROVAL');
  assert.equal(draft.reviewerAuthenticated,false);
  assert.equal(draft.educatorSignoffPresent,false);
  assert.equal(draft.totalQuestions,96);
  assert.deepEqual(draft.sourceSha256,expected);
  assert.deepEqual(draft.exclusions,[{id:'C4-05',reason}]);
  assert.equal((await page.locator('#packetExceptions').innerText()).trim(),'1');
  const keys=await page.evaluate(()=>Object.keys(localStorage));
  assert.deepEqual(keys,[],'review form must not modify student progress or approval markers');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3,'Horizontal overflow '+viewport.name+': '+overflow);
  assert.deepEqual(errors,[],viewport.name+' browser errors');
  console.log('PASS '+viewport.name+': 96 source items, correct SHA, exception draft, no approval/mutation');
  await context.close();
 }
}finally{await browser.close();}
