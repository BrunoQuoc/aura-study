import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const coreCode=readFileSync('admin_drive_source_core.js','utf8');
const authCode=readFileSync('aura_drive_auth_core.js','utf8');
const html=readFileSync('admin-direct.html','utf8');
const root='INBOXROOT1000';
const folder=(id,name)=>({id,name,mimeType:'application/vnd.google-apps.folder'});
const file=(id,name,version='2026-10-27T07:49:00.000Z')=>({
 id,name,mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
 modifiedTime:version,size:'2048',md5Checksum:'checksum'+version,webViewLink:'https://drive.google.com/file/d/'+id+'/view'
});
function core(){
  const window={};
  vm.runInNewContext(coreCode,{window}, {timeout:3000});
  return window.AURA_DRIVE_SOURCE_CORE;
}
function source(path,original){return {file:original,path};}
function sample(){
  return [
   source(['00_INBOX','01_TOAN','01_DE_KIEM_TRA'],file('SOURCE0000001','L6_TOAN_GK1_DE_01.docx')),
   source(['00_INBOX','01_TOAN','02_ON_TAP'],file('SOURCE0000002','L6_TOAN_GK1_ON_TAP.docx')),
   source(['00_INBOX','02_NGU_VAN','01_KIEN_THUC'],file('SOURCE0000003','L6_NGUVAN_TIENG_VIET.docx')),
   source(['00_INBOX','03_TIENG_ANH','01_ON_TAP'],file('SOURCE0000004','L6_TIENGANH_KHONG_DAP_AN.docx'))
  ];
}
test('HTML exposes separate Drive sources, read-only module wiring and cache versions',()=>{
  assert.match(html,/auraDriveSourceInbox\(\)/);
  assert.match(html,/admin_drive_source_core\.js\?v=drive-review-/);
  assert.match(html,/admin_drive_source_ui\.js\?v=drive-review-/);
  assert.match(html,/admin_drive_source_ui\.css\?v=drive-review-/);
  assert.match(html,/aura_drive_auth_core\.js\?v=metadata-oauth-/);
  assert.doesNotMatch(readFileSync('admin_drive_source_ui.js','utf8'),/auraApproveInboxFile|auraSetMetadataOverride|aura_inbox_queue_v1/);
});
test('Only accepts exact Drive folder URLs or safe IDs',()=>{
  const c=core();
  assert.equal(c.folderId(root),root);
  assert.equal(c.folderId('https://drive.google.com/drive/folders/'+root),root);
  assert.equal(c.folderId('https://drive.google.com/open?id='+root),root);
  assert.throws(()=>c.folderId('https://evil.example/drive/folders/'+root),/Drive/);
  assert.throws(()=>c.folderId('javascript:evil'),/Drive/);
  assert.throws(()=>c.folderId('abc'),/Drive/);
});
test('Subject, type and period hints stay suggestions only',()=>{
  const c=core();
  const math=c.hints(['00_INBOX','01_TOAN','01_DE_KIEM_TRA'],'L6_TOAN_GK1_DE_01.docx');
  assert.equal(math.suggestedSubject,'TOAN');
  assert.equal(math.suggestedDocType,'exam');
  assert.equal(math.suggestedPeriod,'GK1');
  assert.equal(c.hints(['00_INBOX','02_NGU_VAN','01_KIEN_THUC'],'L6_NGUVAN.docx').suggestedSubject,'NGUVAN');
  const english=c.hints(['00_INBOX','03_TIENG_ANH','01_ON_TAP'],'L6_TIENGANH_KHONG_DAP_AN.docx');
  assert.equal(english.suggestedSubject,'TIENGANH');
  assert.equal(english.suggestedPeriod,'');
});
test('Known blocked source stays blocked; no-answer source never review-cleared',()=>{
  const c=core(),items=sample();
  const registry=[{driveFileId:'SOURCE0000001',modifiedTime:items[0].file.modifiedTime,
    status:'blocked_incomplete_source_extraction',reason:'Thiếu hình.'}];
  const result=c.reconcile([],items,{registry,rootId:root,now:'2026-11-12T08:00:00Z'});
  assert.equal(result.queue.length,4);
  assert.equal(result.summary.added,4);
  assert.equal(result.summary.blocked,2);
  assert.equal(result.queue.find(r=>r.driveFileId==='SOURCE0000001').reviewStatus,'BLOCKED_SOURCE');
  assert.equal(result.queue.find(r=>r.driveFileId==='SOURCE0000004').sourceGate,'BLOCKED_NO_ANSWER');
  assert.ok(result.queue.every(row=>row.eligibleForAutoPublish===false));
});
test('Idempotent rescans preserve reviewed metadata but modified files reopen',()=>{
  const c=core(),scan=sample();
  const one=c.reconcile([],scan,{rootId:root}).queue;
  const selected=one.find(x=>x.driveFileId==='SOURCE0000002');
  selected.reviewStatus='METADATA_REVIEWED';
  selected.confirmedSubject='TOAN';
  selected.confirmedDocType='practice';
  selected.reviewNote='Đã kiểm tra tên nguồn';
  const again=c.reconcile(one,scan,{rootId:root});
  assert.equal(again.summary.unchanged,4);
  assert.equal(again.queue.find(x=>x.driveFileId==='SOURCE0000002').reviewStatus,'METADATA_REVIEWED');
  const modified=scan.map(x=>x.file.id==='SOURCE0000002'?{...x,file:file('SOURCE0000002','L6_TOAN_GK1_ON_TAP.docx','2026-11-12T08:00:00Z')}:x);
  const changed=c.reconcile(again.queue,modified,{rootId:root});
  assert.equal(changed.summary.changed,1);
  assert.equal(changed.queue.find(x=>x.driveFileId==='SOURCE0000002').reviewStatus,'WAITING_REVIEW');
  assert.equal(changed.queue.find(x=>x.driveFileId==='SOURCE0000002').reviewNote,'');
});
test('Missing file is marked not present, never claimed deleted; restored file re-enters queue',()=>{
  const c=core(),first=c.reconcile([],sample(),{rootId:root}).queue;
  const missing=c.reconcile(first,sample().slice(1),{rootId:root});
  assert.equal(missing.summary.missing,1);
  assert.equal(missing.queue.find(x=>x.driveFileId==='SOURCE0000001').reviewStatus,'MISSING_FROM_INBOX');
  const found=c.reconcile(missing.queue,sample(),{rootId:root});
  assert.equal(found.queue.find(x=>x.driveFileId==='SOURCE0000001').reviewStatus,'WAITING_REVIEW');
});
test('Recursive scanner checks verified 00_INBOX, pagination, and folder bounds',async()=>{
  const c=core();const children={
    [root]:[{files:[folder('MATHFOLDER1000','01_TOAN'),folder('VANFOLDER10000','02_NGU_VAN')],nextPageToken:'p2'},{files:[folder('ENGFOLDER10000','03_TIENG_ANH')]}],
    MATHFOLDER1000:[{files:sample().slice(0,2).map(x=>x.file)}],
    VANFOLDER10000:[{files:[sample()[2].file]}],
    ENGFOLDER10000:[{files:[sample()[3].file]}]
  };
  const client={
    folderInfo:async id=>folder(id,'00_INBOX'),
    listChildren:async(id,token)=>children[id]?.[token?1:0]||{files:[]}
  };
  const result=await c.scanTree(client,root);
  assert.equal(result.folderCount,4);
  assert.equal(result.files.length,4);
  await assert.rejects(c.scanTree({...client,folderInfo:async id=>folder(id,'PERSONAL')},root),/00_INBOX/);
  await assert.rejects(c.scanTree(client,root,{maxFiles:2}),/Quá nhiều/);
  const looping={...client,listChildren:async()=>({files:[],nextPageToken:'repeat'})};
  await assert.rejects(c.scanTree(looping,root),/phân trang lặp/);
});
test('Metadata Google OAuth is separate from existing drive.file token',async()=>{
  const initializers=[],accesses=[];
  const originalInit=config=>{
    initializers.push(config);
    return {callback:null,error_callback:null,requestAccessToken(options){
      accesses.push({scope:config.scope,prompt:options.prompt});
      this.callback({access_token:'TOKEN_'+initializers.length,scope:config.scope,expires_in:3600});
    }};
  };
  const window={google:{accounts:{oauth2:{initTokenClient:originalInit}}},
    AURA_GOOGLE_DRIVE_CONFIG:{clientId:'synthetic-client',scope:'https://www.googleapis.com/auth/drive.file'},
    dispatchEvent(){}};
  const document={body:{classList:{contains:()=>true}},getElementById:()=>null};
  vm.runInNewContext(authCode,{window,document,CustomEvent:class {constructor(t){this.type=t}},
    Date,Promise,queueMicrotask,setInterval,clearInterval}, {timeout:3000});
  const auth=window.AURA_DRIVE_AUTH;
  assert.equal(await auth.connect(), 'TOKEN_1');
  assert.equal(await auth.connectMetadataRead(),'TOKEN_2');
  assert.equal(auth.hasMetadataToken(),true);
  assert.equal(auth.token,'TOKEN_1','upload session should remain drive.file');
  assert.equal(auth.metadataScope,'https://www.googleapis.com/auth/drive.metadata.readonly');
  assert.equal(initializers.length,2);
  assert.equal(accesses[1].prompt,'consent');
  assert.equal(initializers[1].include_granted_scopes,false);
  auth.clear();
  assert.equal(auth.hasMetadataToken(),false);
});
test('OAuth refuses a token without confirmed metadata.readonly grant',async()=>{
  const window={google:{accounts:{oauth2:{initTokenClient(config){
    return {callback:null,error_callback:null,requestAccessToken(){
      this.callback({access_token:'bad',scope:'https://www.googleapis.com/auth/drive.file',expires_in:3600});
    }};
  }}}},AURA_GOOGLE_DRIVE_CONFIG:{clientId:'synthetic'},dispatchEvent(){}};
  const document={body:{classList:{contains:()=>true}},getElementById:()=>null};
  vm.runInNewContext(authCode,{window,document,CustomEvent:class {constructor(t){this.type=t}},
    Date,Promise,queueMicrotask,setInterval,clearInterval},{timeout:3000});
  await assert.rejects(window.AURA_DRIVE_AUTH.connectMetadataRead(),/chưa xác nhận quyền/);
  assert.equal(window.AURA_DRIVE_AUTH.metadataToken,'');
});
