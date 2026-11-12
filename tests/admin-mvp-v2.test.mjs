import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import vm from 'node:vm';
import {join} from 'node:path';

const root = process.cwd();
const script = readFileSync(join(root,'admin_mvp_v2.js'),'utf8');
const html = readFileSync(join(root,'admin-direct.html'),'utf8');
const css = readFileSync(join(root,'admin_mvp_v2.css'),'utf8');
const manifest = JSON.parse(readFileSync(join(root,'aura_data/processed_sources.json'),'utf8'));

function harness() {
  const calls = [];
  const listeners = {};
  const store = {
    aura_inbox_queue_v1: JSON.stringify([
      {driveFileId:'file-test',status:'WAITING_REVIEW'},
      {driveFileId:'old-test',status:'APPROVED'}
    ])
  };
  const app = {
    innerHTML:'',
    handlers:{},
    contains:()=>true,
    addEventListener(name,fn){this.handlers[name]=fn;}
  };
  const snapshotNode={textContent:''};
  const document={
    body:{classList:{contains:name=>name==='admin-shell'},dataset:{}},
    getElementById:id=>id==='app'?app:null,
    querySelector:selector=>selector==='#adm2-source-snapshot'?snapshotNode:null
  };
  const subjects={
    TOAN:{label:'Toán',status:'ready',note:'Nguồn toán thử nghiệm'},
    TIENGANH:{label:'Tiếng Anh',status:'partial',note:'Units 1-3'},
    KHTN:{label:'KHTN',status:'awaiting_source',note:'Chờ học liệu'}
  };
  const window={
    AURA_EXAM_METADATA:{subjects},
    auraExamGeneratorReady:(id,p)=>id==='TOAN'&&p==='GK1',
    setActive:key=>calls.push('active:'+key),
    addEventListener(name,fn){listeners[name]=fn;},
    auraAdminInbox:()=>calls.push('inbox'),
    auraStudentUsers:()=>calls.push('students'),
    auraMetadataManager:()=>calls.push('metadata'),
    backup:()=>calls.push('backup'),
    restoreBackup:()=>calls.push('restore'),
    alert:msg=>calls.push('alert:'+msg)
  };
  const context={
    document,window,
    localStorage:{getItem:key=>store[key]||null},
    fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve(manifest)}),
    Date,console
  };
  vm.runInNewContext(script,context,{timeout:3000});
  return {app,window,calls,store,snapshotNode,listeners,subjects};
}

test('Admin direct page wires new assets after existing runtime',()=>{
  assert.match(html,/admin_mvp_v2\.css\?v=/);
  assert.match(html,/admin_mvp_v2\.js\?v=/);
  assert.ok(html.indexOf('admin_mvp_v2.js')>html.indexOf('admin_library_autopublish_patch.js'));
  assert.ok(existsSync(join(root,'admin_mvp_v2.js')));
  assert.ok(existsSync(join(root,'admin_mvp_v2.css')));
});

test('Dashboard exposes subject readiness without claiming all subjects pass',()=>{
  const t=harness();
  assert.match(t.app.innerHTML,/Tài liệu, đề thi và học sinh/);
  assert.match(t.app.innerHTML,/Môn đã có nội dung/);
  assert.match(t.app.innerHTML,/Môn đang chờ nguồn/);
  assert.match(t.app.innerHTML,/Chưa đầy đủ/);
  assert.match(t.app.innerHTML,/Chờ tài liệu/);
  assert.match(t.app.innerHTML,/BLOCKED BY CONTENT/);
  assert.match(t.app.innerHTML,/Không phải số file trực tiếp trên Drive/);
  assert.match(t.app.innerHTML,/Tạo đề theo: GK1/);
  assert.equal(t.calls.includes('active:home'),true);
  assert.equal(t.window.auraAdminHome,t.window.home);
});

test('Quick actions call existing runtime, including backup',()=>{
  const t=harness();
  const click=action=>t.app.handlers.click({
    target:{closest:()=>({getAttribute:()=>action})}
  });
  for(const a of ['inbox','students','metadata','backup','restore']) click(a);
  assert.deepEqual(t.calls.slice(1),['inbox','students','metadata','backup','restore']);
});

test('Displayed metadata is escaped and cannot inject markup',()=>{
  const t=harness();
  t.subjects.KHTN.label='<img src=x onerror=alert(1)>';
  t.window.home();
  assert.match(t.app.innerHTML,/&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.equal(t.app.innerHTML.includes('<img src=x onerror=alert(1)>'),false);
});

test('Committed registry snapshot is correctly labeled, not real-time Drive state', async ()=>{
  const t=harness();
  await new Promise(resolve=>setImmediate(resolve));
  const sources=manifest.sources;
  const processed=sources.filter(x=>x&&x.representation&&!String(x.status||'').startsWith('blocked')).length;
  const blocked=sources.filter(x=>x&&String(x.status||'').startsWith('blocked')).length;
  assert.match(t.snapshotNode.textContent,new RegExp(processed+' mục có bản chuẩn hóa'));
  assert.match(t.snapshotNode.textContent,new RegExp(blocked+' mục đang bị chặn'));
  assert.match(t.snapshotNode.textContent,/snapshot trong mã nguồn/);
  assert.match(t.app.innerHTML,/đồng bộ tự động mọi file anh thả trực tiếp lên Google Drive và xuất bản đề chưa được kích hoạt/);
});

test('Touch layout and focus visibility are explicitly styled',()=>{
  assert.match(css,/@media\(max-width:900px\)/);
  assert.match(css,/\.admin-shell \.mobilebar\{display:flex!important/);
  assert.match(css,/min-height:53px/);
  assert.match(css,/:focus-visible/);
});
