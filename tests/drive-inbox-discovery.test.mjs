import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MIME_FOLDER, GATE_STATUS, deriveHints, compareSource, buildInventory,
  makeDriveClient, scanFolderTree
} from '../scripts/drive-inbox-discovery.mjs';

const root='INBOXROOT1000';
const folderA='FOLDERTOAN1000',folderB='FOLDERVAN10000',folderC='FOLDERENG10000';
const exam='FOLDEREXAM1000',practice='FOLDERPRACT100';
const docId=n=>'DRIVEFILE'+String(n).padStart(6,'0');
const file=(n,name,modifiedTime='2026-10-27T07:48:55.341Z')=>({
  id:docId(n),name,mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  modifiedTime,size:'2048',md5Checksum:'abc',trashed:false
});
const folder=(id,name)=>({id,name,mimeType:MIME_FOLDER,trashed:false});
function fakeApi({badRoot=false,deny=false,loop=false}={}){
  const pages={
    [root]:[
      {files:[folder(folderA,'01_TOAN'),folder(folderB,'02_NGU_VAN')],nextPageToken:'next'},
      {files:[folder(folderC,'03_TIENG_ANH')],nextPageToken:''}
    ],
    [folderA]:[{files:[folder(exam,'01_DE_KIEM_TRA'),folder(practice,'02_ON_TAP')]}],
    [folderB]:[{files:[file(7,'L6_NGUVAN_TIENG_VIET.docx'),file(8,'L6_NGUVAN_NLXH.docx'),file(9,'L6_NGUVAN_ON_TAP_TIENG_VIET.docx')]}],
    [folderC]:[{files:[file(10,'L6_TIENGANH_GLOBAL_SUCCESS_REVIEW_UNIT_01_02_03_KHONG_DAP_AN.docx')]}],
    [exam]:[{files:[1,2,3,4,5].map(i=>file(i,'L6_TOAN_GK1_DE_0'+i+'_20261027.docx'))}],
    [practice]:[{files:[file(6,'L6_TOAN_GK1_ON_TAP_BAI_TOAN_THUC_TE_20261027.docx')]}]
  };
  const calls=[];
  const fetchImpl=async (url,options)=>{
    const u=new URL(url),id=decodeURIComponent(u.pathname.split('/').at(-1));
    calls.push({url:u.toString(),method:options.method,authorization:options.headers.Authorization});
    if(deny)return {status:403,ok:false,json:async()=>({})};
    if(u.pathname.endsWith('/files/'+root))return {
      ok:true,status:200,json:async()=>({id:root,name:badRoot?'PERSONAL':'00_INBOX',mimeType:MIME_FOLDER})
    };
    if(u.pathname.endsWith('/files')) {
      const q=u.searchParams.get('q')||'';
      const match=q.match(/^'([^']+)' in parents and trashed = false$/);
      const key=match?.[1];
      if(!key)return {status:400,ok:false,json:async()=>({})};
      const idx=u.searchParams.get('pageToken')?1:0;
      let body=pages[key]?.[idx]||{files:[]};
      if(loop&&key===root&&idx===1)body={...body,nextPageToken:'next'};
      return {ok:true,status:200,json:async()=>body};
    }
    return {ok:false,status:404,json:async()=>({})};
  };
  return {fetchImpl,calls};
}

test('Recursively discovers 10 synthetic files across nested subject folders and pagination',async()=>{
  const api=fakeApi();
  const client=await makeDriveClient('secret-not-to-log',{fetchImpl:api.fetchImpl,retries:0});
  const scan=await scanFolderTree({client,rootId:root});
  assert.equal(scan.folderCount,6);
  assert.equal(scan.files.length,10);
  assert.equal(new Set(scan.files.map(x=>x.file.id)).size,10);
  assert.equal(scan.files.filter(x=>x.path.includes('01_DE_KIEM_TRA')).length,5);
  assert.equal(scan.files.filter(x=>x.path.includes('02_ON_TAP')).length,1);
  assert.ok(api.calls.every(c=>c.method==='GET'));
  assert.ok(api.calls.every(c=>c.authorization==='Bearer secret-not-to-log'));
  assert.ok(api.calls.every(c=>c.url.startsWith('https://www.googleapis.com/drive/v3/')));
});

test('Rejects unauthorized or wrong-root scanning, never falls back to wider Drive',async()=>{
  const api=fakeApi({badRoot:true});
  await assert.rejects(scanFolderTree({
    client:await makeDriveClient('t',{fetchImpl:api.fetchImpl,retries:0}),rootId:root
  }),/không phải 00_INBOX/);
  const denied=fakeApi({deny:true});
  await assert.rejects(scanFolderTree({
    client:await makeDriveClient('t',{fetchImpl:denied.fetchImpl,retries:0}),rootId:root
  }),/từ chối quyền đọc metadata/);
  assert.ok(denied.calls.length<=1);
  await assert.rejects(scanFolderTree({client:{folderInfo:()=>null},rootId:'bad'}),/ID thư mục/);
});

test('Stops pagination loops and bounds folder depth and number of files',async()=>{
  const api=fakeApi({loop:true});
  await assert.rejects(scanFolderTree({
    client:await makeDriveClient('t',{fetchImpl:api.fetchImpl,retries:0}),rootId:root
  }),/phân trang không tiến lên/);
  const valid=fakeApi();
  await assert.rejects(scanFolderTree({
    client:await makeDriveClient('t',{fetchImpl:valid.fetchImpl,retries:0}),rootId:root,
    maxDepth:1
  }),/Quá độ sâu/);
  await assert.rejects(scanFolderTree({
    client:await makeDriveClient('t',{fetchImpl:valid.fetchImpl,retries:0}),rootId:root,
    maxFiles:3
  }),/Quá giới hạn số nguồn/);
});

test('Classifies from folder + filename but does not infer missing periods',()=>{
  assert.deepEqual(deriveHints(['00_INBOX','01_TOAN','01_DE_KIEM_TRA'],'L6_TOAN_GK1_DE_05.docx'),{
    subject:'TOAN',docType:'exam',period:'GK1',
    classificationBasis:'folder_and_filename_only',confidence:'needs_review'
  });
  const eng=deriveHints(['00_INBOX','03_TIENG_ANH','01_ON_TAP'],'L6_TIENGANH_REVIEW_UNIT_01_02_03_KHONG_DAP_AN.docx');
  assert.equal(eng.subject,'TIENGANH');
  assert.equal(eng.period,'');
  assert.equal(eng.docType,'practice');
});

test('Source gates preserve blocked status and never promote to question bank',()=>{
  const source=file(1,'L6_TOAN_GK1_DE_01_20261027.docx');
  const existing=[
    {driveFileId:source.id,modifiedTime:source.modifiedTime,
     status:'blocked_incomplete_source_extraction',representation:null},
    {driveFileId:docId(6),modifiedTime:'2026-10-27T07:48:55.341Z',
     representation:'aura_data/math6/gk1_bai_toan_thuc_te_review.json'}
  ];
  const rows=[
    {file:source,path:['00_INBOX','01_TOAN','01_DE_KIEM_TRA']},
    {file:file(6,'L6_TOAN_GK1_ON_TAP_BAI_TOAN_THUC_TE_20261027.docx'),
     path:['00_INBOX','01_TOAN','02_ON_TAP']},
    {file:file(10,'L6_TIENGANH_GLOBAL_SUCCESS_REVIEW_UNIT_01_02_03_KHONG_DAP_AN.docx'),
     path:['00_INBOX','03_TIENG_ANH','01_ON_TAP']},
    {file:file(7,'new.docx'),path:['00_INBOX','02_NGU_VAN']}
  ];
  const manifest=buildInventory(rows,existing,'2026-11-12T00:00:00.000Z');
  assert.equal(manifest.fileCount,4);
  assert.equal(manifest.gateCounts[GATE_STATUS.BLOCKED],1);
  assert.equal(manifest.gateCounts[GATE_STATUS.REPRESENTED],1);
  assert.equal(manifest.gateCounts[GATE_STATUS.NO_ANSWER],1);
  assert.equal(manifest.gateCounts[GATE_STATUS.NEW],1);
  assert.ok(manifest.files.every(x=>x.eligibleForAutoPublish===false));
  assert.equal(manifest.safety.sourceWrite,false);
  assert.equal(manifest.safety.contentDownloaded,false);
  assert.equal(manifest.safety.autoPublish,false);
  const changed=compareSource({...source,modifiedTime:'2026-11-12T00:00:00Z'},existing);
  assert.equal(changed.gate,GATE_STATUS.CHANGED);
});

test('No shared Drive IDs, tokens or credentials are hardcoded in script',async()=>{
  const {readFileSync}=await import('node:fs');
  const source=readFileSync('scripts/drive-inbox-discovery.mjs','utf8');
  assert.doesNotMatch(source,/1efdGfFM4bXrnNrIPuvEFRhyX9M5rUkBZ/);
  assert.doesNotMatch(source,/704823170664-vkldvvlh4qp4jrkhg630tnaea6riv8vk/);
  assert.doesNotMatch(source,/AURA_DRIVE_ACCESS_TOKEN=eyJ/);
});
