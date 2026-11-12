import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const origin='http://127.0.0.1:8765',outDir='test-results/question-review-stage2c';
mkdirSync(outDir,{recursive:true});
const tiny='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO9L9ncAAAAASUVORK5CYII=';
const packet={schemaVersion:1,kind:'aura_question_review_packet_v1',
 safety:{questionBankPublishEnabled:false},
 items:[{itemId:'M6-GK1-DE04-ESSAY06',sourceName:'Test_Exam_04.docx',
 sourceSha256:'a'.repeat(64),sourceLabel:'Bài 6',type:'ESSAY',
 textBlocks:['Cho hình vuông ABCD, AB = 8 cm và AC = 10 cm.'],options:[],
 images:[{sha256:'b'.repeat(64),assetName:'image4.png',sourceBlockIndex:23,dataUrl:tiny}],
 issueFlags:['CONTRADICTORY_SQUARE_SIDE_AND_DIAGONAL'],
 reviewedForBank:false,publishEnabled:false}]};
const browser=await chromium.launch({headless:true});
try{
 for(const size of [{name:'ipad',width:820,height:1180},{name:'phone',width:390,height:844},{name:'desktop',width:1366,height:900}]){
  const context=await browser.newContext({viewport:{width:size.width,height:size.height},
    hasTouch:size.name!=='desktop',isMobile:size.name!=='desktop',locale:'vi-VN'});
  const page=await context.newPage(),requests=[],errors=[];
  page.on('request',r=>requests.push(r.url()));
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/admin-question-review.html',{waitUntil:'load'});
  assert.equal(await page.locator('#qaContent').isVisible(),false);
  await page.locator('#packetFile').setInputFiles({name:'private_review.json',
    mimeType:'application/json',buffer:Buffer.from(JSON.stringify(packet))});
  await page.locator('#qaContent').waitFor({state:'visible'});
  assert.equal(await page.locator('.qa-qitem').count(),1);
  assert.equal(await page.locator('.qa-image img').count(),1);
  assert.match(await page.locator('#qaGate').innerText(),/Chưa đạt cổng kiểm định/);
  await page.screenshot({path:outDir+'/'+size.name+'-blocked.png',fullPage:true});
  await page.locator('[name=answer]').fill('Đề gốc mâu thuẫn: 8sqrt2 khác 10.');
  await page.locator('[name=answerEvidence]').fill('Định lý Pythagore: AC = 8sqrt2, không thể là 10.');
  await page.locator('[name=rubric]').fill('Giải thích sự mâu thuẫn: 0,5; tính đường chéo: 0,5.');
  await page.locator('[name=maxPoints]').fill('1');
  await page.locator('[name=rubricEvidence]').fill('Rubric thử nghiệm do người kiểm tra ghi, không phải thang điểm gốc.');
  await page.locator('[name=imageEvidence]').fill('Hình số 4 nằm đúng ở Bài 6 và có đủ bốn đỉnh.');
  await page.locator('[name=reviewerLabel]').fill('Reviewer manual');
  await page.locator('[name=checkImage]').check();
  await page.locator('[name=checkAnswer]').check();
  await page.locator('[name=checkRubric]').check();
  assert.match(await page.locator('#qaGate').innerText(),/CONTRADICTORY_SQUARE/);
  await page.locator('[data-qa-flag]').fill('Giữ nguyên câu ở trạng thái lỗi; chỉ ghi nhận kiểm tra, chưa xuất bản.');
  assert.match(await page.locator('#qaGate').innerText(),/Đã rà soát cục bộ/);
  assert.match(await page.locator('#qaGate').innerText(),/chưa được cấp quyền xuất bản/);
  assert.equal(await page.locator('button').filter({hasText:/Xuất bản|Publish/}).count(),0);
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#qaExport').click();
  const download=await downloadPromise;
  assert.match(download.suggestedFilename(),/AURA_STAGE2C_REVIEW_DECISIONS/);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<4, size.name+': horizontal overflow '+overflow);
  assert.ok(requests.every(u=>u.startsWith(origin+'/')||u===origin), 'No external connections');
  assert.deepEqual(errors,[],size.name+': script errors');
  await page.screenshot({path:outDir+'/'+size.name+'-reviewed.png',fullPage:true});
  console.log('PASS '+size.name+': private packet, source image, fail-closed issue, local QA, export');
  await context.close();
 }
}finally{await browser.close();}
