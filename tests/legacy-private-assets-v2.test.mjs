/* AURA STUDY private cloud assets -- no credentials, no network, no external dependencies. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT=path.resolve(import.meta.dirname,'..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const BASE='https://ufqzuowjhdqpydqvcsob.supabase.co';
const FILE_ID='thisIsAValidDriveFileID123';
const RID='12345678-1234-4234-8234-123456789abc';
function mockResponse(body,status=200){
  return {ok:status>=200&&status<300,status,async json(){return body}};
}

test('legacy HTML preserves old app and loads private sync adapters',()=>{
  for(const role of ['admin','student']){
    const markup=read(role+'-direct.html');
    assert.match(markup,/<main class="content" id="app">/);
    assert.match(markup,new RegExp(role+'_legacy_cloud_sync\\.js\\?v=sync-20261118-asset-v2'));
    assert.match(markup,new RegExp(role+'_legacy_asset_sync\\.js\\?v=asset-v2-20261118'));
    assert.match(markup,/<nav class="mobilebar"(?:\s[^>]*)?>/);
  }
  for(const file of ['admin_legacy_cloud_sync.js','student_legacy_cloud_sync.js',
                     'admin_legacy_asset_sync.js','student_legacy_asset_sync.js'])
    assert.doesNotThrow(()=>new vm.Script(read(file)),file);
});

function adminRuntime(inputFile){
  const calls=[];
  const status={textContent:''};
  const input={
    style:{}, files:inputFile?[inputFile]:[],
    handlers:{},
    addEventListener(name,fn){this.handlers[name]=fn},
    remove(){this.removed=true},
    click(){queueMicrotask(()=>this.handlers[inputFile?'change':'cancel']?.())}
  };
  const document={
    body:{classList:{contains:value=>value==='admin-shell'},appendChild:()=>{}},
    createElement:()=>input,
    getElementById:()=>status
  };
  let refresh=0;
  const window={
    AURA_LEGACY_CLOUD_ADMIN:{
      async getToken(){return 'test-admin-jwt'},
      localApproved(){return [{driveFileId:FILE_ID,name:'Bài Toán 6'}]},
      refresh(){refresh++}
    }
  };
  const fetch=async(url,init)=>{
    const action=init.method==='POST'?JSON.parse(init.body).action:'upload_file';
    calls.push({url,action,method:init.method,payload:action==='upload_file'?undefined:JSON.parse(init.body)});
    if(action==='admin_upload_ticket')return mockResponse({staging_only:true,asset_v2:true,
      path:RID+'/12345678-9999-4abc-8def-123456789abc.pdf',
      signed_upload_url:BASE+'/storage/v1/object/upload/sign/aura-legacy-approved-v2/'+RID+'/file.pdf?token=fake'});
    if(action==='admin_attach_asset')return mockResponse({staging_only:true,asset_v2:true,asset_ready:true});
    return mockResponse({});
  };
  const context={window,document,URL,fetch,confirm:()=>true,console,queueMicrotask};
  vm.runInNewContext(read('admin_legacy_asset_sync.js'),context);
  return {window,calls,status,get refresh(){return refresh}};
}

test('Admin uploads a confirmed private copy, then commits asset binding',async()=>{
  const rt=adminRuntime({name:'toan6.pdf',size:1024,type:'application/pdf'});
  assert.equal(await rt.window.AURA_LEGACY_ASSET_ADMIN.upload(FILE_ID),true);
  assert.deepEqual(rt.calls.map(x=>x.action),['admin_upload_ticket','upload_file','admin_attach_asset']);
  assert.equal(rt.calls[0].payload.file_id,FILE_ID);
  assert.equal(rt.calls[2].payload.mime,'application/pdf');
  assert.equal(rt.calls[2].payload.size,1024);
  assert.equal(rt.refresh,1);
  assert.match(rt.status.textContent,/Đã lưu bản sao/);
});
test('Admin rejects disallowed file formats before requesting upload ticket',async()=>{
  const rt=adminRuntime({name:'malicious.html',size:100,type:'text/html'});
  assert.equal(await rt.window.AURA_LEGACY_ASSET_ADMIN.upload(FILE_ID),false);
  assert.equal(rt.calls.length,0);
  assert.match(rt.status.textContent,/Chỉ nhận/);
});
test('Admin cancels native picker without a hanging upload',async()=>{
  const rt=adminRuntime(null);
  assert.equal(await rt.window.AURA_LEGACY_ASSET_ADMIN.upload(FILE_ID),false);
  assert.equal(rt.calls.length,0);
});

function studentRuntime({response,studentToken=true}={}){
  const tabs=[],calls=[];
  const status={textContent:''};
  const window={
    AURA_LEGACY_CLOUD_STUDENT:{async getToken(){
      if(!studentToken)throw new Error('Student not paired');
      return 'test-student-jwt';}},
    open(){
      const tab={location:{replace(url){this.value=url}},close(){this.closed=true}};
      tabs.push(tab);return tab;
    },
    location:{assign(url){this.value=url}}
  };
  const document={
    body:{classList:{contains:value=>value==='student-shell'}},
    getElementById:()=>status,
    addEventListener(){/* delegated click installed */}
  };
  const fetch=async(url,init)=>{
    calls.push({url,action:JSON.parse(init.body).action,authorization:init.headers.Authorization});
    return response||mockResponse({staging_only:true,asset_v2:true,
      url:BASE+'/storage/v1/object/sign/aura-legacy-approved-v2/a.pdf?token=short',
      expires_in:180});
  };
  vm.runInNewContext(read('student_legacy_asset_sync.js'),{window,document,URL,fetch,console});
  return {window,tabs,calls,status};
}
test('paired Student opens temporary signed storage link on other device',async()=>{
  const rt=studentRuntime();
  await rt.window.AURA_LEGACY_ASSET_STUDENT.open(RID);
  assert.equal(rt.calls.length,1);
  assert.equal(rt.calls[0].action,'student_open_asset');
  assert.equal(rt.calls[0].authorization,'Bearer test-student-jwt');
  assert.match(rt.tabs[0].location.value,/\/storage\/v1\/object\/sign\//);
});
test('unpaired Student cannot open private resource',async()=>{
  const rt=studentRuntime({studentToken:false});
  await rt.window.AURA_LEGACY_ASSET_STUDENT.open(RID);
  assert.equal(rt.calls.length,0);
  assert.equal(rt.tabs[0].closed,true);
  assert.match(rt.status.textContent,/not paired/);
});
test('Student rejects off-domain links even if response says staging',async()=>{
  const rt=studentRuntime({response:mockResponse({
    staging_only:true,asset_v2:true,url:'https://example.invalid/storage/v1/object/sign/file'
  })});
  await rt.window.AURA_LEGACY_ASSET_STUDENT.open(RID);
  assert.equal(rt.tabs[0].closed,true);
});

test('no unreviewed keys or solution types exposed by metadata sync',()=>{
  const admin=read('admin_legacy_cloud_sync.js');
  const student=read('student_legacy_cloud_sync.js');
  assert.match(admin,/ADMIN_APPROVED_INBOX/);
  assert.match(admin,/function manualKind\(r\)/);
  assert.match(admin,/MANUAL_SOURCE=new Set/);
  assert.match(student,/action:"student_list"/);
  assert.match(student,/r\.asset_ready/);
  assert.match(student,/data-aura-cloud-open/);
  assert.doesNotMatch(student,/service_role|sb_secret_/);
});

test('schema migration is private, signed, scoped and reproducible',()=>{
  const sql=read('supabase/migrations/20261118041949_aura_legacy_private_assets_v2_20261118.sql');
  assert.match(sql,/aura-legacy-approved-v2/,'aura-private-bucket');
  assert.match(sql,/false,6291456/);
  assert.match(sql,/content_version is distinct from old\.content_version/);
  assert.match(sql,/create trigger aura_legacy_reset_asset_v2/);
  assert.equal((sql.match(/\$function\$;/g)||[]).length,5);
  assert.match(sql,/revoke all on function public\.aura_legacy_content_attach_asset_v2/);
  assert.match(sql,/revoke all on function public\.aura_legacy_content_student_asset_v2/);
  assert.match(sql,/d\.revoked_at is null/);
  assert.match(sql,/r\.visibility='PUBLISHED_STAGING'/);
});
test('server gateway requires verified roles and never returns private path to Student',()=>{
  const edge=read('supabase/functions/aura-legacy-content-asset-v2/index.ts');
  assert.match(edge,/auth\.getUser/);
  assert.match(edge,/user\.email_confirmed_at/);
  assert.match(edge,/user\.is_anonymous/);
  assert.match(edge,/createSignedUploadUrl/);
  assert.match(edge,/createSignedUrl\(record\.path,180\)/);
  assert.match(edge,/STUDENT device required|Paired Student required/);
  assert.doesNotMatch(edge,/official_exam_enabled:\s*true/);
});
