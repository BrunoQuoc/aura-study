/* AURA Admin metadata V2: isolated synthetic browser acceptance.
   No Supabase/Drive calls; use empty browser and localhost files only. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';

const origin='http://127.0.0.1:8765';
const path='test-results/admin-metadata-v2';
mkdirSync(path,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
  for(const viewport of [
    {label:'ipad',width:820,height:1180},
    {label:'phone',width:390,height:844},
    {label:'desktop',width:1366,height:900}
  ]){
    const context=await browser.newContext({
      viewport:{width:viewport.width,height:viewport.height},
      hasTouch:viewport.label!=='desktop',isMobile:viewport.label!=='desktop',
      locale:'vi-VN'
    });
    await context.route('**/*',route=>{
      const url=route.request().url();
      return url.startsWith(origin+'/')?route.continue():route.abort();
    });
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',err=>errors.push(err.message));
    page.on('dialog',dlg=>dlg.accept());
    await page.goto(origin+'/admin-direct.html',{waitUntil:'load'});
    await page.locator('[data-admin-action="metadata"]').first().click();
    await page.locator('.period-v2-hero h1').waitFor({timeout:15000});
    assert.match(await page.locator('.period-v2-hero h1').innerText(),/Phân kỳ ôn tập/);
    assert.equal(await page.locator('.period-v2-stats').count(),1);
    assert.equal(await page.locator('.period-v2-item').count(),7);
    let overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert.ok(overflow<=3,'Horizontal overflow '+viewport.label+': '+overflow);
    await page.screenshot({path:path+'/'+viewport.label+'-all.png',fullPage:true});

    await page.locator('[data-filter="subject"]').selectOption('KHTN');
    assert.equal(await page.locator('.period-v2-item').count(),0);
    assert.match(await page.locator('.period-v2-empty').innerText(),/chưa có tài liệu\/ngân hàng/);

    await page.locator('[data-filter="subject"]').selectOption('NGUVAN');
    assert.equal(await page.locator('.period-v2-item').count(),3);
    const blocked=page.locator('.period-v2-item[data-key="NGUVAN:reviews"]');
    assert.match(await blocked.locator('.period-v2-blocked').innerText(),/Cần tách ngân hàng nguồn/);
    assert.equal(await blocked.locator('.period-v2-editor').count(),0);

    await page.locator('[data-filter="subject"]').selectOption('TOAN');
    assert.equal(await page.locator('.period-v2-item').count(),2);
    const item=page.locator('.period-v2-item[data-key="review:TOAN:toan_gk1_thucte"]');
    await item.locator('.period-v2-editor summary').click();
    await item.locator('select[data-mode]').selectOption('add');
    await item.locator('input[data-period="GK2"]').check();
    await item.locator('[data-reason]').fill('Ôn nền tảng HK2 — kiểm thử giả lập');
    await item.locator('[data-ack]').check();
    await item.locator('[data-action="save"]').click();
    const ov=await page.evaluate(()=>JSON.parse(localStorage.getItem('aura_metadata_overrides_v1')||'{}'));
    assert.equal(ov.resources['review:TOAN:toan_gk1_thucte'].mode,'add');
    assert.ok(ov.resources['review:TOAN:toan_gk1_thucte'].periods.includes('GK2'));
    const source=await page.evaluate(()=>window.AURA_EXAM_METADATA.resources['review:TOAN:toan_gk1_thucte'].sourcePeriods);
    assert.deepEqual(source,['GK1']);
    await page.locator('[data-filter="view"]').selectOption('manual');
    assert.equal(await page.locator('.period-v2-item').count(),1);
    await page.screenshot({path:path+'/'+viewport.label+'-manual.png',fullPage:true});

    const manual=page.locator('.period-v2-item[data-key="review:TOAN:toan_gk1_thucte"]');
    await manual.locator('.period-v2-editor summary').click();
    await manual.locator('[data-action="reset"]').click();
    const cleaned=await page.evaluate(()=>JSON.parse(localStorage.getItem('aura_metadata_overrides_v1')||'{}'));
    assert.equal(cleaned.resources['review:TOAN:toan_gk1_thucte'],undefined);
    assert.equal(await page.locator('.period-v2-item').count(),0,'manual filter should now show no rows');
    assert.deepEqual(errors.filter(x=>/metadata|period-v2/i.test(x)),[]);
    console.log('PASS '+viewport.label+' metadata UI + guard + manual override + reset');
    await context.close();
  }
}finally{await browser.close();}
