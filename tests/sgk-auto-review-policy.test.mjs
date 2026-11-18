import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const ROOT=path.resolve(import.meta.dirname,'..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const id='1234567890abcdefABCDEFGH';
function adminDocs(rows){
 const store=new Map([['aura_library_index_v1',JSON.stringify(rows)]]);
 const window={library(){},addEventListener(){}};
 const document={
  body:{classList:{contains:x=>x==='admin-shell'}},
  getElementById(){return null}
 };
 vm.runInNewContext(read('admin_legacy_cloud_sync.js'),{
  window,document,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
  setTimeout(){},Date,URL,console,fetch(){throw Error('unexpected network')}
 });
 return window.AURA_LEGACY_CLOUD_ADMIN.localApproved();
}
const row=(fields={})=>({
 driveFileId:id+Math.random().toString(36).slice(2,13),
 name:'Đề thi giữa kỳ I',status:'ACTIVE',
 subject:'TOAN',docType:'exam',source:'ADMIN_APPROVED_INBOX',...fields
});
test('Only approved exam/test sets appear in the Admin manual-publish list',()=>{
 const rows=[
  row({name:'Đề thi Toán 6',docType:'exam'}),
  row({name:'Bài kiểm tra 45 phút',docType:'practice'}),
  row({name:'Bài học SGK Toán 6',docType:'lesson'}),
  row({name:'Công thức Toán',docType:'formula'}),
  row({name:'Luyện tập số tự nhiên',docType:'practice'}),
  row({name:'Đề thi chưa duyệt',docType:'exam',source:'DRIVE_DISCOVERY_METADATA_ONLY'}),
  row({name:'Đề kiểm tra trả lời',docType:'answer_key'})
 ];
 const result=adminDocs(rows);
 assert.equal(result.length,2);
 assert.deepEqual(Array.from(result,x=>x.name),['Đề thi Toán 6','Bài kiểm tra 45 phút']);
});
test('External sample papers are manually approved while official lessons remain automatic',()=>{
 const rows=[
  row({name:'Bài mẫu hình thoi',docType:'practice'}),
  row({name:'Bài giải mẫu chương 2',docType:'reference'}),
  row({name:'Bài mẫu chưa duyệt',docType:'practice',source:'DRIVE_DISCOVERY_METADATA_ONLY'}),
  row({name:'Bài tập SGK chuẩn',docType:'practice'})
 ];
 assert.deepEqual(Array.from(adminDocs(rows),x=>x.name),
  ['Bài mẫu hình thoi','Bài giải mẫu chương 2']);
});
test('Final Admin-approved source is recognized for an exam set',()=>{
 const result=adminDocs([row({source:'ADMIN_APPROVED_FINAL'})]);
 assert.equal(result.length,1);
});
test('The SGK catalog loads without approval buttons and from verified NXB links',()=>{
 const student=read('student_sgk_auto_catalog.js');
 const admin=read('admin_legacy_cloud_sync.js');
 const edge=read('supabase/functions/aura-legacy-content-sync-v1/index.ts');
 const migration=read('supabase/migrations/20261118071050_aura_sgk_auto_catalog_no_approval_exam_gate_20261118.sql');
 assert.doesNotThrow(()=>new vm.Script(student));
 assert.doesNotThrow(()=>new vm.Script(admin));
 assert.match(student,/action:"sgk_auto_catalog"/);
 assert.match(student,/Mở SGK trên NXB/);
 assert.match(student,/không cần Admin duyệt/);
 assert.match(admin,/SGK & bài tập tự động · Đề thi & bài mẫu cần duyệt/);
 assert.match(edge,/input\.action==="sgk_auto_catalog"/);
 assert.match(edge,/manualContentKind\(title,doc_type\)/);
 assert.match(migration,/publisher_primary_verified=true/);
 assert.match(migration,/publisher_toc_directly_inspected=true/);
 assert.match(migration,/d\.revoked_at is null/);
 assert.match(migration,/revoke all on function public\.aura_sgk_auto_catalog_v1/);
 assert.doesNotMatch(migration,/answer_key|question_revisions|question_bank|GRADING_FINAL/i);
});
test('Student rejects unverified or non-publisher URLs',()=>{
 const src=read('student_sgk_auto_catalog.js');
 const injected=src.replace('window.AURA_SGK_AUTO_CATALOG={',
 'window.AURA_SGK_AUTO_CATALOG={filterBooks,');
 const window={home(){},lessons(){},library(){},lessonSubject(){},studentReviewHub(){},studentExamSubject(){},addEventListener(){}};
 const document={body:{classList:{contains:x=>x==='student-shell'}},getElementById(){return null}};
 vm.runInNewContext(injected,{window,document,setTimeout(){},URL,Date,console});
 const filter=window.AURA_SGK_AUTO_CATALOG.filterBooks;
 const valid={toc_verified:true,review_required:false,full_textbook_verified:false,
 source_url:'https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-6-tap-mot.4699854777',
 sections:[{heading:'Bài 1',start_page:8}]};
 assert.equal(filter([valid], '').length,1);
 assert.equal(filter([valid], 'TOAN').length,1);
 assert.equal(filter([valid], 'TIENGANH').length,0);
 assert.equal(filter([{...valid,review_required:true}], '').length,0);
 assert.equal(filter([{...valid,toc_verified:false}], '').length,0);
 assert.equal(filter([{...valid,source_url:'https://fake.example/sgk'}], '').length,0);
 assert.equal(filter([{...valid,source_url:'javascript:alert(1)'}], '').length,0);
});
test('The old Student page remains intact and loads the SGK module',()=>{
 const html=read('student-direct.html');
 assert.match(html,/student_sgk_auto_catalog\.js\?v=sgk-auto-20261118/);
 assert.match(html,/<nav class="mobilebar">/);
 assert.match(html,/student_legacy_cloud_sync\.js/);
 assert.match(html,/student_legacy_asset_sync\.js/);
});
