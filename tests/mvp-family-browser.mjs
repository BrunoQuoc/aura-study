/**
 * AURA STUDY family MVP — real Chromium localhost smoke.
 * Synthetic local profiles ONLY. Third-party requests blocked.
 * No Supabase, Drive, external accounts or learner data affected.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

const BASE='http://127.0.0.1:8765', origin=new URL(BASE).origin;
async function isolated(browser){
  const context=await browser.newContext({acceptDownloads:true});
  await context.route('**/*',route=>{
    try{if(new URL(route.request().url()).origin===origin)return route.continue();}
    catch(_){}
    return route.abort('blockedbyclient');
  });
  const page=await context.newPage();
  page.on('dialog',dialog=>dialog.accept());
  return {context,page};
}
async function addStudent(page,name,username,pin){
  await page.waitForFunction(()=>typeof window.auraStudentUsers==='function');
  await page.evaluate(()=>window.auraStudentUsers());
  await page.locator('#studentName').fill(name);
  await page.locator('#studentUsername').fill(username);
  await page.locator('#studentPin').fill(pin);
  await page.getByRole('button',{name:'Tạo user học sinh'}).click();
  await page.waitForFunction(un=>JSON.parse(localStorage.getItem('aura_local_students_v1')||'[]').some(x=>x.username===un),username);
  return page.evaluate(un=>JSON.parse(localStorage.getItem('aura_local_students_v1')).find(x=>x.username===un).id,username);
}
async function login(page,id,pin){
  await page.waitForSelector('#auraLoginStudent');
  await page.locator('#auraLoginStudent').selectOption(id);
  await page.locator('#auraLoginPin').fill(pin);
  await page.getByRole('button',{name:'Vào học'}).click();
  await page.waitForFunction(()=>!document.querySelector('.aura-login-overlay'),null,{timeout:25000});
}
async function main(){
 const browser=await chromium.launch({headless:true});
 const first=await isolated(browser);
 let second;
 try{
  const page=first.page;
  await page.goto(BASE+'/admin-direct.html',{waitUntil:'load'});
  assert.equal(await page.title(),'AURA STUDY · Admin');
  const firstId=await addStudent(page,'Synthetic Student A','synthetic-mvp-a','6542');
  assert.ok(firstId);
  await page.goto(BASE+'/student-direct.html',{waitUntil:'load'});
  await page.waitForSelector('#auraLoginStudent');
  await page.locator('#auraLoginStudent').selectOption(firstId);
  await page.locator('#auraLoginPin').fill('0000');
  await page.getByRole('button',{name:'Vào học'}).click();
  await page.waitForFunction(()=>document.querySelector('.aura-login-error')?.textContent.includes('PIN không đúng'));
  assert.equal(await page.locator('.aura-login-overlay').count(),1);
  await login(page,firstId,'6542');

  const sel=await page.evaluate(()=>{
    const e=(window.AURA_MATH_EXAMS||[]).find(x=>x.ready&&(x.mc||[]).some(q=>q.answer&&Array.isArray(q.options)&&(!q.needsImage||q.image)));
    if(!e)return null;
    const index=e.mc.findIndex(q=>q.answer&&Array.isArray(q.options)&&(!q.needsImage||q.image));
    const wrong='ABCD'.split('').find(c=>c!==e.mc[index].answer);
    return {id:e.id,index,wrong};
  });
  assert.ok(sel,'No ready auto-gradable Math exam');
  await page.evaluate(id=>window.exam(id),sel.id);
  await page.locator('input[name="mc'+sel.index+'"][value="'+sel.wrong+'"]').check();
  if(await page.locator('#es0').count())await page.locator('#es0').fill('Synthetic essay for QA only');
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(()=>typeof window.exam==='function');
  assert.equal(await page.locator('.aura-login-overlay').count(),0);
  const draft=await page.evaluate(id=>JSON.parse(localStorage.getItem('exam_'+id)||'{}'),sel.id);
  assert.equal(draft.mc[sel.index],sel.wrong);
  await page.evaluate(id=>window.exam(id),sel.id);
  await page.getByRole('button',{name:/Nộp phần trắc nghiệm/}).click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('aura_attempts')||'[]').length===1);
  const outcome=await page.evaluate(()=>({
    attempts:JSON.parse(localStorage.getItem('aura_attempts')||'[]'),
    wrong:JSON.parse(localStorage.getItem('aura_wrong_book_v1')||'{}')
  }));
  assert.equal(outcome.attempts.length,1);
  assert.ok(outcome.attempts[0].total>0);
  assert.ok(Object.keys(outcome.wrong).length>=1,'Wrong book not updated by the Math submit');
  await page.evaluate(()=>window.openWrongBook());
  assert.match(await page.locator('#app').innerText(),/Sổ câu sai/);
  await page.evaluate(()=>window.openWrongPractice());
  assert.match(await page.locator('#app').innerText(),/Luyện lại/i);
  await page.evaluate(()=>window.history());
  assert.match(await page.locator('#app').innerText(),/Kết quả học tập/);

  // Second local profile must not inherit first learner's grades.
  await page.goto(BASE+'/admin-direct.html',{waitUntil:'load'});
  const secondId=await addStudent(page,'Synthetic Student B','synthetic-mvp-b','7529');
  await page.goto(BASE+'/student-direct.html',{waitUntil:'load'});
  await page.waitForFunction(()=>typeof window.auraStudentLogout==='function');
  await page.evaluate(()=>window.auraStudentLogout());
  await login(page,secondId,'7529');
  const secondCounts=await page.evaluate(()=>({
    attempts:JSON.parse(localStorage.getItem('aura_attempts')||'[]').length,
    wrong:Object.keys(JSON.parse(localStorage.getItem('aura_wrong_book_v1')||'{}')).length
  }));
  assert.equal(secondCounts.attempts,0);
  assert.equal(secondCounts.wrong,0);
  await page.evaluate(()=>window.auraStudentLogout());
  await login(page,firstId,'6542');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('aura_attempts')||'[]').length),1);

  // Real browser download and separate-context restore, both synthetic.
  await page.goto(BASE+'/admin-direct.html',{waitUntil:'load'});
  await page.waitForFunction(()=>typeof window.backup==='function');
  const [download]=await Promise.all([page.waitForEvent('download'),page.evaluate(()=>window.backup())]);
  const payload=JSON.parse(readFileSync(await download.path(),'utf8'));
  assert.equal(payload.schema,'aura-study-backup');
  assert.ok(payload.storage['aura_student_profile_v1:'+firstId]);
  assert.ok(payload.storage.aura_attempts);
  second=await isolated(browser);
  await second.page.goto(BASE+'/admin-direct.html',{waitUntil:'load'});
  await second.page.waitForFunction(()=>typeof window.restoreBackup==='function');
  const [chooser]=await Promise.all([second.page.waitForEvent('filechooser'),second.page.evaluate(()=>window.restoreBackup())]);
  await chooser.setFiles({name:'synthetic-aura-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(payload))});
  await second.page.waitForFunction(()=>localStorage.getItem('aura_attempts')!==null);
  assert.equal(await second.page.evaluate(()=>JSON.parse(localStorage.getItem('aura_attempts')).length),1);
  console.log('MVP BROWSER PASS: synthetic Admin and PIN, Math draft/reload/grade, wrong book/retry, two-profile isolation and backup restore');
 }finally{
   await second?.context.close().catch(()=>{});
   await first.context.close().catch(()=>{});
   await browser.close();
 }
}
await main();
