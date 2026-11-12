/* AURA STUDY — Stage 1 Drive INBOX source discovery (READ-ONLY).
 *
 * Usage:
 *   AURA_INBOX_FOLDER_ID=... AURA_DRIVE_ACCESS_TOKEN=... \
 *     node scripts/drive-inbox-discovery.mjs
 *   ... node scripts/drive-inbox-discovery.mjs --write-private
 *
 * Access: Drive metadata read permission for the selected 00_INBOX tree.
 * This script never moves, alters, downloads or publishes a file. No token
 * or file identifier is sent to GitHub. Never commit private snapshots.
 */
import {readFile, mkdir, writeFile, rename} from 'node:fs/promises';
import {resolve, dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

export const MIME_FOLDER='application/vnd.google-apps.folder';
export const GATE_STATUS=Object.freeze({
  NEW:'NEW_NEEDS_REVIEW',
  CHANGED:'CHANGED_NEEDS_REVIEW',
  BLOCKED:'BLOCKED_SOURCE',
  NO_ANSWER:'BLOCKED_NO_ANSWER',
  REPRESENTED:'SOURCE_REPRESENTED',
  KNOWN:'KNOWN_NEEDS_REVIEW'
});
const SAFE_ID=/^[A-Za-z0-9_-]{10,200}$/;
const FOLDER_TYPES=[
  ['01_DE_KIEM_TRA','exam'],['DE_THI','exam'],['02_ON_TAP','practice'],['01_ON_TAP','practice'],
  ['01_KIEN_THUC','lesson'],['03_CONG_THUC','formula'],['04_LOI_GIAI','solution'],
  ['05_DAP_AN','answer_key'],['06_THAM_KHAO','reference']
];
const SUBJECT_HINTS={
  TOAN:/(^|_)TOAN(_|$)/,
  NGUVAN:/(^|_)(NGU_VAN|NGUVAN)(_|$)/,
  TIENGANH:/(^|_)(TIENG_ANH|TIENGANH|ENGLISH)(_|$)/,
  KHTN:/(^|_)KHTN(_|$)/,
  LSDL:/(^|_)(LSDL|LICH_SU_DIA_LY)(_|$)/,
  GDCD:/(^|_)GDCD(_|$)/,
  TINHOC:/(^|_)(TIN_HOC|TINHOC)(_|$)/,
  CONGNGHE:/(^|_)(CONG_NGHE|CONGNGHE)(_|$)/
};
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/Đ/g,'D').replace(/đ/g,'d').toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'');
const cleanId=id=>{
  if(!SAFE_ID.test(String(id||'')))throw new Error('ID thư mục Drive không hợp lệ.');
  return String(id);
};
const utc=t=>{const stamp=Date.parse(String(t||''));return Number.isFinite(stamp)?new Date(stamp).toISOString():'';};
const toSize=n=>Math.max(0,Number(n)||0);
const safeName=n=>String(n||'').slice(0,255);

export function deriveHints(pathSegments, filename){
  const folder=pathSegments.map(normalize),name=normalize(filename);
  const subjectScope=folder.slice(1,3).concat(name);
  let subject='';
  for(const [id,regex] of Object.entries(SUBJECT_HINTS)){
    if(subjectScope.some(part=>regex.test(part))){subject=id;break;}
  }
  let docType='';
  for(const segment of folder.slice(2)){
    const hit=FOLDER_TYPES.find(([prefix])=>segment===prefix||segment.endsWith('_'+prefix));
    if(hit){docType=hit[1];break;}
  }
  if(!docType){
    if(/(^|_)DAP_AN(_|$)|ANSWER_KEY/.test(name))docType='answer_key';
    else if(/(^|_)DE(_|$)|DE_THI|DE_KIEM_TRA/.test(name))docType='exam';
    else if(/(^|_)ON_TAP(_|$)|REVIEW/.test(name))docType='practice';
  }
  const explicitPeriod=['GK1','CK1','GK2','CK2'].find(p=>new RegExp('(^|_)'+p+'(_|$)').test(name))||'';
  return {subject,docType,period:explicitPeriod,classificationBasis:'folder_and_filename_only',
    confidence:subject&&docType?'needs_review':'unclassified'};
}

export function compareSource(file, registryRows=[]){
  const known=(Array.isArray(registryRows)?registryRows:[]).find(row=>row?.driveFileId===file.id);
  const filename=normalize(file.name);
  const noAnswer=/(^|_)KHONG_DAP_AN(_|$)|WITHOUT_ANSWERS/.test(filename);
  if(noAnswer)return {gate:GATE_STATUS.NO_ANSWER,sourceRecord:!!known,reason:'Tên nguồn ghi rõ chưa có đáp án; không được dùng chấm tự động.'};
  if(!known)return {gate:GATE_STATUS.NEW,sourceRecord:false,reason:'Chưa có trong AURA source registry; yêu cầu kiểm tra nguồn.'};
  const observed=utc(file.modifiedTime),registered=utc(known.modifiedTime);
  if(!observed || !registered || observed!==registered){
    return {gate:GATE_STATUS.CHANGED,sourceRecord:true,
      reason:'Phiên bản nguồn thay đổi hoặc thiếu mốc thời gian; cần trích xuất/duyệt lại.'};
  }
  if(String(known.status||'').startsWith('blocked')){
    return {gate:GATE_STATUS.BLOCKED,sourceRecord:true,
      reason:'Nguồn đã bị chặn trong registry: thiếu hình, thiếu nội dung hoặc chưa đủ dữ kiện.'};
  }
  if(known.representation){
    return {gate:GATE_STATUS.REPRESENTED,sourceRecord:true,
      reason:'Đã có bản biểu diễn trong registry; chưa đồng nghĩa đã xuất bản đề thi.'};
  }
  return {gate:GATE_STATUS.KNOWN,sourceRecord:true,reason:'Đã ghi nhận nguồn; cần kiểm tra trạng thái xuất bản.'};
}

export function buildInventory(files,registryRows=[],scanAt=new Date().toISOString()){
  const data=(Array.isArray(files)?files:[]).map(({file,path})=>{
    const hints=deriveHints(path,file.name);
    const source=compareSource(file,registryRows);
    return {
      provider:'google_drive',driveFileId:file.id,sourceName:safeName(file.name),
      sourcePath:path.map(safeName),mimeType:String(file.mimeType||''),modifiedTime:utc(file.modifiedTime),
      sizeBytes:toSize(file.size),md5Checksum:String(file.md5Checksum||''),
      ...hints,...source,eligibleForAutoPublish:false
    };
  }).sort((a,b)=>a.sourcePath.join('/').localeCompare(b.sourcePath.join('/'))||a.sourceName.localeCompare(b.sourceName));
  const totals={};
  for(const row of data)totals[row.gate]=(totals[row.gate]||0)+1;
  return {schemaVersion:1,kind:'read_only_drive_source_inventory',createdAt:scanAt,
    safety:{sourceWrite:false,contentDownloaded:false,answerInferred:false,autoPublish:false,
      containsPrivateDriveMetadata:true},fileCount:data.length,gateCounts:totals,files:data};
}

export function diffInventories(previous,current){
  const valid=x=>x?.schemaVersion===1&&x?.kind==='read_only_drive_source_inventory'&&Array.isArray(x.files);
  if(!valid(current))throw new Error('Inventory mới không hợp lệ.');
  const prior=valid(previous)?previous.files:[];
  const byId=rows=>new Map(rows.filter(x=>typeof x?.driveFileId==='string').map(x=>[x.driveFileId,x]));
  const oldRows=byId(prior),newRows=byId(current.files);
  const delta={previousCount:oldRows.size,currentCount:newRows.size,
    added:0,modified:0,moved:0,unchanged:0,missing:0,baseline:!valid(previous)};
  if(delta.baseline)return delta;
  for(const [id,row] of newRows){
    const last=oldRows.get(id);
    if(!last){delta.added++;continue;}
    if(last.modifiedTime!==row.modifiedTime||last.md5Checksum!==row.md5Checksum||last.sizeBytes!==row.sizeBytes)
      delta.modified++;
    else if(JSON.stringify(last.sourcePath)!==JSON.stringify(row.sourcePath))delta.moved++;
    else delta.unchanged++;
  }
  for(const id of oldRows.keys())if(!newRows.has(id))delta.missing++;
  return delta;
}

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function driveError(status){
  if(status===401||status===403)return new Error('Google Drive từ chối quyền đọc metadata. Hãy cấp quyền đọc cho đúng cây 00_INBOX; không dùng token drive.file để khẳng định đã quét đầy đủ.');
  if(status===404)return new Error('Không tìm thấy thư mục nguồn hoặc tài khoản chưa được cấp quyền.');
  return new Error('Google Drive trả lỗi HTTP '+status+' khi quét nguồn.');
}
export async function makeDriveClient(accessToken,{fetchImpl=globalThis.fetch,baseUrl='https://www.googleapis.com/drive/v3',retries=2}={}){
  if(!accessToken || typeof accessToken!=='string')throw new Error('Thiếu AURA_DRIVE_ACCESS_TOKEN.');
  async function get(url){
    for(let attempt=0;attempt<=retries;attempt++){
      let response;
      try{
        response=await fetchImpl(url,{method:'GET',headers:{Authorization:'Bearer '+accessToken,Accept:'application/json'},signal:AbortSignal.timeout(20000)});
      }catch(error){
        if(attempt===retries)throw new Error('Không kết nối được Google Drive khi đọc metadata.');
        await sleep(150*(attempt+1));continue;
      }
      if([429,500,502,503,504].includes(response.status)&&attempt<retries){
        await sleep(150*(attempt+1));continue;
      }
      if(!response.ok)throw driveError(response.status);
      const data=await response.json();
      if(!data || typeof data!=='object')throw new Error('Dữ liệu Drive API trả về không hợp lệ.');
      return data;
    }
  }
  return {
    async folderInfo(id){
      cleanId(id);
      const fields='id,name,mimeType,trashed';
      const url=new URL(baseUrl+'/files/'+encodeURIComponent(id));
      url.searchParams.set('fields',fields);url.searchParams.set('supportsAllDrives','true');
      return get(url);
    },
    async listChildren(id,pageToken=''){
      cleanId(id);
      const url=new URL(baseUrl+'/files');
      url.searchParams.set('q',"'"+id+"' in parents and trashed = false");
      url.searchParams.set('fields','nextPageToken,files(id,name,mimeType,size,modifiedTime,md5Checksum,parents,trashed)');
      url.searchParams.set('pageSize','1000');url.searchParams.set('supportsAllDrives','true');
      url.searchParams.set('includeItemsFromAllDrives','true');
      if(pageToken)url.searchParams.set('pageToken',pageToken);
      const data=await get(url);
      if(!Array.isArray(data.files))throw new Error('Không có danh sách files trong Drive API.');
      return {files:data.files,nextPageToken:String(data.nextPageToken||'')};
    }
  };
}

export async function scanFolderTree({client,rootId,maxDepth=8,maxFolders=250,maxFiles=12000,maxPagesPerFolder=100}){
  cleanId(rootId);
  const root=await client.folderInfo(rootId);
  if(root.mimeType!==MIME_FOLDER || root.name!=='00_INBOX' || root.trashed){
    throw new Error('Thư mục được chọn không phải 00_INBOX hợp lệ. Không quét sang thư mục khác.');
  }
  const queue=[{id:rootId,path:['00_INBOX'],depth:0}];
  const seenFolders=new Set(),seenFiles=new Set(),found=[];
  while(queue.length){
    const folder=queue.shift();
    if(seenFolders.has(folder.id))continue;
    seenFolders.add(folder.id);
    if(seenFolders.size>maxFolders)throw new Error('Quá giới hạn số thư mục. Dừng quét để tránh truy cập quá phạm vi.');
    let token='',page=0;
    do{
      page++;
      if(page>maxPagesPerFolder)throw new Error('Số trang Drive vượt giới hạn an toàn.');
      const data=await client.listChildren(folder.id,token);
      const uniqueTokens=new Set([token]); // guard against API returning non-advancing token
      for(const file of data.files){
        if(!file?.id||file.trashed)continue;
        cleanId(file.id);
        if(file.mimeType===MIME_FOLDER){
          if(folder.depth>=maxDepth)throw new Error('Quá độ sâu cây thư mục INBOX cho phép.');
          if(!seenFolders.has(file.id))queue.push({id:file.id,path:[...folder.path,safeName(file.name)],depth:folder.depth+1});
        }else if(!seenFiles.has(file.id)){
          seenFiles.add(file.id);
          found.push({file,path:folder.path});
          if(found.length>maxFiles)throw new Error('Quá giới hạn số nguồn. Dừng quét để rà soát.');
        }
      }
      if(data.nextPageToken===token && token)throw new Error('Google Drive phân trang không tiến lên; dừng để tránh quét vô hạn.');
      token=data.nextPageToken;
    }while(token);
  }
  return {rootName:root.name,folderCount:seenFolders.size,files:found};
}

async function readPreviousPrivate(){
  try{
    const value=JSON.parse(await readFile(join(resolve('.aura_private'),'drive-inbox-inventory.json'),'utf8'));
    if(value?.schemaVersion!==1||value?.kind!=='read_only_drive_source_inventory'||!Array.isArray(value.files))
      throw new Error('Snapshot lần trước không đúng định dạng; không ghi đè tự động.');
    return value;
  }catch(error){
    if(error.code==='ENOENT')return null;
    throw error;
  }
}

async function privateWrite(inventory){
  const folder=resolve('.aura_private');
  await mkdir(folder,{recursive:true,mode:0o700});
  const to=join(folder,'drive-inbox-inventory.json');
  const temp=join(folder,'drive-inbox-inventory.tmp-'+process.pid);
  await writeFile(temp,JSON.stringify(inventory,null,2)+'\n',{mode:0o600,flag:'wx'});
  await rename(temp,to);
  return to;
}

export async function main(env=process.env,args=process.argv.slice(2)){
  if(args.includes('--help')){
    console.log('Read-only Drive discovery. Required env: AURA_INBOX_FOLDER_ID, AURA_DRIVE_ACCESS_TOKEN (Drive metadata read scope). Optional: --write-private. No automatic publishing.');
    return 0;
  }
  const rootId=cleanId(env.AURA_INBOX_FOLDER_ID);
  if(!env.AURA_DRIVE_ACCESS_TOKEN)throw new Error('Thiếu AURA_DRIVE_ACCESS_TOKEN; không quét nguồn.');
  const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..');
  const registry=JSON.parse(await readFile(join(repo,'aura_data/processed_sources.json'),'utf8'));
  const client=await makeDriveClient(env.AURA_DRIVE_ACCESS_TOKEN);
  const scan=await scanFolderTree({client,rootId});
  const inventory=buildInventory(scan.files,registry.sources);
  const previous=await readPreviousPrivate();
  const delta=diffInventories(previous,inventory);
  console.log('AURA STUDY | Read-only source discovery');
  console.log('INBOX folders inspected: '+scan.folderCount+'; files: '+inventory.fileCount);
  for(const [gate,count] of Object.entries(inventory.gateCounts))console.log(gate+': '+count);
  if(delta.baseline)console.log('Delta: no prior private snapshot; this scan is the baseline.');
  else console.log('Delta: new='+delta.added+', modified='+delta.modified+
    ', moved='+delta.moved+', unchanged='+delta.unchanged+', missing-from-INBOX='+delta.missing);
  console.log('Auto-publish: DISABLED. Source content download: DISABLED. Drive writes: DISABLED.');
  if(args.includes('--write-private'))console.log('Private inventory saved at '+await privateWrite(inventory));
  return 0;
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main().catch(error=>{console.error('AURA discovery failed: '+error.message);process.exitCode=1;});
}
