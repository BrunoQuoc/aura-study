/* AURA STUDY: synthetic browser and mocked Google APIs. No live Drive. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';

const origin='http://127.0.0.1:8765',root='INBOXROOT1000';
const output='test-results/drive-source-ui';
mkdirSync(output,{recursive:true});
const folder=(id,name)=>({id,name,mimeType:'application/vnd.google-apps.folder'});
const file=(id,name,modifiedTime='2026-10-27T07:49:00.000Z')=>({
  id,name,mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  size:'2048',modifiedTime,md5Checksum:modifiedTime,trashed:false,
  webViewLink:'https://drive.google.com/file/d/'+id+'/view'
});
const gsiScript=[
  'window.google=window.google||{};',
  'window.google.accounts={oauth2:{initTokenClient:function(config){',
  'return {callback:config.callback||function(){},error_callback:null,requestAccessToken:function(){',
  'const client=this; queueMicrotask(function(){client.callback({',
  'access_token:"SYNTHETIC_ONLY_TOKEN",scope:config.scope,expires_in:3600',
  '});});}};}}};'
].join('\n');
const browser=await chromium.launch({headless:true});
try{
  for(const viewport of [
    {label:'ipad',width:820,height:1180},
    {label:'phone',width:390,height:844},
    {label:'desktop',width:1366,height:900}
  ]){
    let revision=1;
    const context=await browser.newContext({
      viewport:{width:viewport.width,height:viewport.height},
      hasTouch:viewport.label!=='desktop',
      isMobile:viewport.label!=='desktop',locale:'vi-VN'
    });
    const requests=[];
    await context.route('**/*',async route=>{
      const url=route.request().url(),method=route.request().method();
      if(url.startsWith('https://accounts.google.com/gsi/client'))
        return route.fulfill({status:200,contentType:'application/javascript',body:gsiScript});
      if(url.startsWith('https://www.googleapis.com/drive/v3/files')){
        assert.equal(method,'GET','Drive discovery must not modify files');
        assert.equal(route.request().headers().authorization,'Bearer SYNTHETIC_ONLY_TOKEN');
        const u=new URL(url);
        let body;
        if(u.pathname.endsWith('/files/'+root)){
          body={id:root,name:'00_INBOX',mimeType:'application/vnd.google-apps.folder',trashed:false};
        }else{
          const parent=(u.searchParams.get('q')||'').match(/^'([^']+)' in parents/);
          const folderId=parent?.[1],token=u.searchParams.get('pageToken');
          if(folderId===root){
            body=token?{files:[folder('ENGLISHFOLDER1000','03_TIENG_ANH')]}:
              {files:[folder('MATHFOLDER1000','01_TOAN')],nextPageToken:'p2'};
          }else if(folderId==='MATHFOLDER1000'){
            body={files:[
              file('SOURCE0000001','L6_TOAN_GK1_DE_01_20261027.docx'),
              file('SOURCE0000002','L6_TOAN_GK1_ON_TAP_20261027.docx',
                revision===1?'2026-10-27T07:49:25.000Z':'2026-11-12T08:00:00.000Z')
            ]};
          }else if(folderId==='ENGLISHFOLDER1000'){
            body={files:[file('SOURCE0000003','L6_TIENGANH_GLOBAL_SUCCESS_KHONG_DAP_AN.docx')]};
          }else return route.fulfill({status:404,contentType:'application/json',body:'{}'});
        }
        requests.push({url,method});
        return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
      }
      if(url===origin+'/aura_data/processed_sources.json'){
        return route.fulfill({status:200,contentType:'application/json',
          body:JSON.stringify({schemaVersion:1,sources:[{
            provider:'google_drive',driveFileId:'SOURCE0000001',
            modifiedTime:'2026-10-27T07:49:00.000Z',
            status:'blocked_incomplete_source_extraction',reason:'Thiếu hình học trong đề.'
          }]})});
      }
      if(url.startsWith(origin+'/'))return route.continue();
      return route.abort();
    });
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/admin-direct.html',{waitUntil:'load'});
    await page.locator('[data-admin-action="driveSources"]').first().click();
    await page.locator('.aura-source-hero h1').waitFor({timeout:15000});
    assert.match(await page.locator('.aura-source-hero h1').innerText(),/Google Drive/);
    assert.equal(await page.locator('.aura-source-card').count(),0);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert.ok(overflow<=3,'horizontal overflow in '+viewport.label+': '+overflow);
    await page.screenshot({path:output+'/'+viewport.label+'-initial.png',fullPage:true});

    await page.locator('[data-source-action="connect"]').click();
    await page.locator('.aura-source-connect .aura-source-pill.reviewed').waitFor({timeout:10000});
    assert.equal(await page.evaluate(()=>localStorage.getItem('aura_drive_source_review_queue_v1')),null);
    await page.locator('#auraDriveSourceRoot').fill(root);
    await page.locator('[data-source-action="scan"]').click();
    await page.getByRole('status').filter({hasText:'Đã quét 3 file'}).waitFor({timeout:15000});
    assert.equal(requests.filter(x=>x.url.includes('googleapis.com')).length,5, 'root check + 2 root pages + 2 child folders');
    const queue=await page.evaluate(()=>JSON.parse(localStorage.getItem('aura_drive_source_review_queue_v1')));
    assert.equal(queue.length,3);
    assert.equal(queue.filter(x=>x.sourceGate.startsWith('BLOCKED_')).length,2);
    assert.equal(await page.locator('.aura-source-card').count(),1);
    assert.ok(queue.every(x=>x.eligibleForAutoPublish===false));
    assert.equal(await page.evaluate(()=>localStorage.getItem('aura_inbox_queue_v1')),null);
    assert.ok(!JSON.stringify(await page.evaluate(()=>Object.entries(localStorage))).includes('SYNTHETIC_ONLY_TOKEN'));

    // The status summary is now a real, accessible button, not a static count.
    await page.locator('button[data-source-metric="blocked"]').click();
    assert.equal(await page.locator('[data-source-filter="status"]').inputValue(),'blocked');
    assert.equal(await page.locator('button[data-source-metric="blocked"]').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('.aura-source-card').count(),2);
    assert.ok(await page.locator('#aura-source-review-results').count()===1);
    await page.screenshot({path:output+'/'+viewport.label+'-blocked.png',fullPage:true});
    const blocked=page.locator('.aura-source-card[data-source-id="SOURCE0000001"]');
    assert.equal(await blocked.locator('[data-source-action="review"]').count(),0);
    await blocked.locator('[data-source-field="note"]').fill('Cần bổ sung hình gốc.');
    await blocked.locator('[data-source-action="note"]').click();
    assert.match(await page.locator('.aura-source-card[data-source-id="SOURCE0000001"]').innerText(),/Thiếu hình/);

    await page.locator('button[data-source-metric="pending"]').click();
    assert.equal(await page.locator('[data-source-filter="status"]').inputValue(),'pending');
    const candidate=page.locator('.aura-source-card[data-source-id="SOURCE0000002"]');
    assert.equal(await candidate.count(),1);
    await candidate.locator('[data-source-field="note"]').fill('Đã kiểm tra tên file, môn và loại tài liệu.');
    await candidate.locator('[data-source-field="ack"]').check();
    await candidate.locator('[data-source-action="review"]').click();
    assert.equal(await page.locator('.aura-source-card').count(),0);
    await page.locator('[data-source-filter="status"]').selectOption('reviewed');
    assert.equal(await page.locator('.aura-source-card[data-source-id="SOURCE0000002"]').count(),1);
    await page.screenshot({path:output+'/'+viewport.label+'-reviewed.png',fullPage:true});

    await page.locator('[data-source-action="scan"]').click();
    await page.getByRole('status').filter({hasText:'Đã quét 3 file'}).waitFor({timeout:15000});
    const unchanged=await page.evaluate(()=>JSON.parse(localStorage.getItem('aura_drive_source_review_queue_v1')));
    assert.equal(unchanged.find(x=>x.driveFileId==='SOURCE0000002').reviewStatus,'METADATA_REVIEWED');
    revision=2;
    await page.locator('[data-source-action="scan"]').click();
    await page.getByRole('status').filter({hasText:'cần kiểm tra lại: 1'}).waitFor({timeout:15000});
    assert.equal(await page.locator('.aura-source-card').count(),1);
    const changed=await page.evaluate(()=>JSON.parse(localStorage.getItem('aura_drive_source_review_queue_v1')));
    assert.equal(changed.find(x=>x.driveFileId==='SOURCE0000002').reviewStatus,'WAITING_REVIEW');
    assert.deepEqual(errors.filter(x=>/aura_drive_source|source-ui|drive-source/i.test(x)),[]);
    console.log('PASS '+viewport.label+': OAuth, recursive scan, source blocks, review, idempotence, reset');
    await context.close();
  }
}finally{await browser.close();}
