/* AURA STUDY — isolated browser UI smoke, no real users or external network. */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';

const origin = 'http://127.0.0.1:8765';
const output = 'test-results/admin-mvp';
mkdirSync(output, {recursive:true});

const browser = await chromium.launch({headless:true});
let checks=0;
try {
  for (const screen of [
    {label:'ipad-portrait',width:820,height:1180,touch:true},
    {label:'iphone-narrow',width:390,height:844,touch:true},
    {label:'desktop',width:1366,height:900,touch:false}
  ]) {
    const context = await browser.newContext({
      viewport:{width:screen.width,height:screen.height},
      deviceScaleFactor:1, hasTouch:screen.touch, isMobile:screen.touch,
      locale:'vi-VN'
    });
    await context.route('**/*', route => {
      const url = route.request().url();
      if (url.startsWith(origin + '/')) return route.continue();
      return route.abort();
    });
    const page = await context.newPage();
    const errors=[];
    page.on('pageerror',e => errors.push(e.message));
    await page.goto(origin+'/admin-direct.html',{waitUntil:'load',timeout:30000});
    await page.locator('#adm2-title').waitFor({state:'visible',timeout:30000});
    assert.match(await page.locator('#adm2-title').innerText(), /Tài liệu, đề thi và học sinh/);
    assert.equal(await page.locator('.adm2-metric').count(),4);
    assert.equal(await page.locator('.adm2-subject').count(),8);
    assert.match(await page.locator('.adm2').innerText(),/Chờ tài liệu/);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    assert.ok(overflow<=3,screen.label+' overflow '+overflow);
    await page.screenshot({path:output+'/'+screen.label+'-dashboard.png',fullPage:true});

    // Touchable, real click path to existing Admin INBOX module.
    await page.locator('[data-admin-action="inbox"]').first().click();
    await page.getByRole('heading',{name:'INBOX tài liệu'}).waitFor({timeout:15000});
    assert.match(await page.locator('#app').innerText(),/Google Drive/i);
    checks++;

    await page.locator('.brand').click();
    await page.locator('#adm2-title').waitFor({timeout:15000});
    await page.locator('[data-admin-action="students"]').first().click();
    await page.locator('#app h2').filter({hasText:'Học sinh'}).first().waitFor({timeout:15000});
    checks++;

    await page.locator('.brand').click();
    await page.locator('#adm2-title').waitFor({timeout:15000});
    await page.locator('[data-admin-action="metadata"]').first().click();
    assert.match(await page.locator('#app').innerText(),/Phân kỳ|Metadata|Kỳ thi/i);
    checks++;

    // No JS exception from new cockpit; third party auth failures are blocked by design.
    const newModuleErrors=errors.filter(e=>/admin_mvp_v2|adm2/i.test(e));
    assert.deepEqual(newModuleErrors,[],screen.label+' admin cockpit JS errors');
    await context.close();
    console.log('PASS '+screen.label+' dashboard/inbox/students/metadata, no horizontal overflow');
  }
  console.log('PASS browser cockpit smoke: '+checks+' navigation journeys');
} finally { await browser.close(); }
