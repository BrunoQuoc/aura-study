/**
 * AURA STUDY — family MVP offline contract/behavior checks.
 * All test data and storage are synthetic and in memory.
 * No browser profile, Google Drive, Supabase, network, account creation or write.
 * This is NOT a real browser E2E or a production security certification.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {runInContext, createContext} from 'node:vm';

const file=path=>new URL('../'+path,import.meta.url);
const source=path=>readFileSync(file(path),'utf8');

function storage(initial={}){
  const data=new Map(Object.entries(initial).map(([k,v])=>[k,String(v)]));
  return {
    data,
    get length(){return data.size},
    key:i=>[...data.keys()][i]??null,
    getItem:k=>data.has(k)?data.get(k):null,
    setItem:(k,v)=>data.set(k,String(v)),
    removeItem:k=>data.delete(k),
    clear:()=>data.clear()
  };
}

function harness(sharedStorage=storage()){
  const answers={};
  const elems={
    '#app':{innerHTML:''},
    '#netText':{textContent:''},
    '#netDot':{classList:{toggle(){}}},
    '#es0':{value:''}
  };
  const downloads=[],alerts=[];
  let fileInput;
  const document={
    querySelector(selector){
      const match=selector.match(/^input\[name="mc(\d+)"\]:checked$/);
      if(match)return answers[+match[1]]?{value:answers[+match[1]]}:null;
      return elems[selector]||null;
    },
    querySelectorAll(){return []},
    createElement(tag){
      if(tag==='a')return {href:'',download:'',click(){}};
      if(tag==='input'){fileInput={type:'',files:[],click(){}};return fileInput;}
      throw new Error('Unexpected element '+tag);
    }
  };
  class FakeFileReader {
    readAsText(file){this.result=file.content;this.onload?.()}
  }
  const ctx={
    AURA_SUBJECTS:[['TOAN','Toán','∑','Bài kiểm tra']],
    AURA_MATH_EXAMS:[{
      id:'synthetic_math_1',title:'Đề mô phỏng (không ghi dữ liệu thật)',
      desc:'Sử dụng cho kiểm thử offline',ready:true,
      mc:[
        {stem:'Hai cộng hai?',options:['4','5','6','7'],answer:'A'},
        {stem:'Câu thiếu hình gốc',options:['a','b','c','d'],answer:'B',needsImage:true,image:null},
        {stem:'Ba cộng ba?',options:['5','6','7','8'],answer:'B'}
      ],
      essay:[{prompt:'Bài tự luận mô phỏng',solution:'Nội dung kiểm thử'}]
    }],
    AURA_REVIEWS:{},
    localStorage:sharedStorage,
    document,
    navigator:{onLine:true},
    addEventListener(){},
    scrollTo(){},
    setTimeout(){},  // suppress blob URL cleanup only
    Blob,
    FileReader:FakeFileReader,
    URL:{
      createObjectURL(blob){downloads.push(blob);return 'blob:test-only'},
      revokeObjectURL(){}
    },
    alert(message){alerts.push(message)},
    confirm(){return true}
  };
  ctx.window=ctx;
  createContext(ctx);
  runInContext(source('app.js'),ctx,{filename:'app.js'});
  return {ctx,answers,elems,downloads,alerts,sharedStorage,get fileInput(){return fileInput}};
}

test('Student and Admin entry points reference existing local assets',()=>{
  for(const entry of ['student-direct.html','admin-direct.html']){
    const html=source(entry);
    assert.match(html,/<main[^>]*id="app"/);
    const urls=[...html.matchAll(/<(?:script|link|img)\b[^>]*\b(?:src|href)=["']([^"']+)["']/g)]
      .map(m=>m[1].split('?')[0].split('#')[0])
      .filter(s=>s&&!/^(?:https?:|data:|\/)/.test(s));
    assert.ok(urls.length>=20, entry+' missing assets');
    for(const path of urls)assert.ok(existsSync(file(path)),entry+' missing '+path);
  }
});

test('Entry points retain expected family features, without implying server auth',()=>{
  const student=source('student-direct.html');
  const admin=source('admin-direct.html');
  assert.match(student,/student-shell/);
  assert.match(student,/learner_tools\.js\?/);
  assert.match(student,/local_accounts_v3\.js\?/);
  assert.match(student,/multisubject_results\.js\?/);
  assert.match(admin,/admin-shell/);
  assert.match(admin,/backup\.js\?/);
  assert.match(admin,/local_accounts_v3\.js\?/);
  assert.match(admin,/restoreBackup\(\)/);
  const accounts=source('local_accounts_v3.js');
  assert.match(accounts,/aura_local_students_v1/);
  assert.match(accounts,/pinSalt/);
  assert.match(accounts,/pinHash/);
  assert.match(accounts,/crypto\.subtle\.digest/);
  assert.match(accounts,/student-shell/);
  assert.match(accounts,/admin-shell/);
  const doc=source('README.md');
  assert.match(doc,/PIN/);
  assert.match(doc,/không.*Supabase Auth/i);
});

test('Synthetic Math exam saves a draft and grades only eligible MC questions',()=>{
  const {ctx,answers,elems,sharedStorage}=harness();
  ctx.exam('synthetic_math_1');
  assert.match(elems['#app'].innerHTML,/Nộp phần trắc nghiệm/);
  answers[0]='A';answers[1]='B';answers[2]='D';
  elems['#es0'].value='Bài tự luận vẫn phải được lưu';
  ctx.gradeExam('synthetic_math_1');
  const history=JSON.parse(sharedStorage.getItem('aura_attempts'));
  assert.equal(history.length,1);
  assert.equal(history[0].ok,1);
  assert.equal(history[0].total,2); // image-less question excluded
  assert.equal(history[0].score,5);
  const draft=JSON.parse(sharedStorage.getItem('exam_synthetic_math_1'));
  assert.deepEqual(JSON.parse(JSON.stringify(draft.mc)),['A','B','D']);
  assert.equal(draft.es[0],'Bài tự luận vẫn phải được lưu');
  assert.match(elems['#app'].innerHTML,/Câu 3/);
  assert.doesNotMatch(elems['#app'].innerHTML,/Câu 2: /);
  ctx.history();
  assert.match(elems['#app'].innerHTML,/5\/10/);
});

test('Synthetic Math draft survives a same-browser reload',()=>{
  const shared=storage();
  const first=harness(shared);
  first.answers[0]='A';first.answers[2]='B';
  first.elems['#es0'].value='Nháp tự luận';
  first.ctx.saveExam('synthetic_math_1');
  const second=harness(shared);
  second.ctx.exam('synthetic_math_1');
  const html=second.elems['#app'].innerHTML;
  assert.match(html,/<textarea id="es0"[^>]*>Nháp tự luận<\/textarea>/);
  assert.match(html,/<input type="radio" name="mc0" value="A" checked/);
});

test('Admin backup exports and restores synthetic history, drafts and wrong notebook',async()=>{
  const h=harness();
  h.sharedStorage.setItem('aura_attempts',JSON.stringify([{title:'Synthetic',score:5,total:2,time:'2026-11-12T00:00:00Z'}]));
  h.sharedStorage.setItem('exam_synthetic_math_1',JSON.stringify({mc:['A','B','D'],es:['Essay']}));
  h.sharedStorage.setItem('aura_wrong_book_v1',JSON.stringify({'synthetic':{wrongCount:1}}));
  h.sharedStorage.setItem('aura_student_profile_v1:synthetic',JSON.stringify({data:{aura_attempts:'[]'}}));
  runInContext(source('backup.js'),h.ctx,{filename:'backup.js'});
  h.ctx.backup();
  assert.equal(h.downloads.length,1);
  const payload=JSON.parse(await h.downloads[0].text());
  assert.equal(payload.schema,'aura-study-backup');
  assert.equal(JSON.parse(payload.storage.aura_attempts)[0].score,5);
  assert.ok(payload.storage.exam_synthetic_math_1);
  assert.ok(payload.storage.aura_wrong_book_v1);
  assert.ok(payload.storage['aura_student_profile_v1:synthetic']);
  h.sharedStorage.clear();
  h.ctx.restoreBackup();
  h.fileInput.files=[{content:JSON.stringify(payload)}];
  h.fileInput.onchange();
  assert.equal(JSON.parse(h.sharedStorage.getItem('aura_attempts'))[0].score,5);
  assert.equal(JSON.parse(h.sharedStorage.getItem('aura_wrong_book_v1')).synthetic.wrongCount,1);
  assert.ok(h.alerts.some(s=>String(s).includes('thành công')));
});

test('Wrong-answer notebook has an executable dynamic loader and grading hook',()=>{
  const student=source('student-direct.html');
  assert.match(student,/aura_pro_2026\.js\?/);
  const pro=source('aura_pro_2026.js');
  assert.match(pro,/exam_timer\.js\?/); // dynamic script, intentionally not in HTML
  const timer=source('exam_timer.js');
  assert.match(timer,/auraRecordExamLearning/);
  assert.match(timer,/window\.gradeExam\s*=\s*function/);
  const wrongBook=source('learner_tools.js');
  assert.match(wrongBook,/window\.auraRecordExamLearning\s*=/);
  assert.match(wrongBook,/window\.openWrongBook\s*=/);
  assert.match(wrongBook,/window\.openWrongPractice\s*=/);
  assert.match(wrongBook,/window\.gradeWrongPractice\s*=/);
  // Static wiring check only. Real navigation/submit still requires browser QA.
});

test('Generated practice, weakness report and history modules are wired',()=>{
  const student=source('student-direct.html');
  for(const js of ['generator.js','smart_engine.js','exam_year_flow.js','multisubject_results.js']){
    assert.ok(student.includes(js+'?'),js+' not loaded');
  }
  assert.match(source('generator.js'),/function gradeAuraGenerated/);
  assert.match(source('smart_engine.js'),/function auraRecordSmartResult/);
  assert.match(source('multisubject_results.js'),/window\.history\s*=\s*multiHistory/);
});
