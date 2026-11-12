/* AURA STUDY — read-only Google Drive source inventory and local review queue.
 * Pure functions; no Google auth and NO publish/approve/move operations.
 * Separate from the legacy aura_inbox_queue_v1 upload/auto-route queue.
 */
(function(root){
  'use strict';
  const FOLDER_MIME='application/vnd.google-apps.folder';
  const SUBJECTS={TOAN:'Toán',NGUVAN:'Ngữ văn',TIENGANH:'Tiếng Anh',KHTN:'KHTN',
    LSDL:'Lịch sử & Địa lý',GDCD:'GDCD',TINHOC:'Tin học',CONGNGHE:'Công nghệ'};
  const TYPES={exam:'Đề kiểm tra',practice:'Bài tập / ôn tập',lesson:'Kiến thức',
    answer_key:'Đáp án',formula:'Công thức',solution:'Lời giải',reference:'Tham khảo'};
  const VALID_ID=/^[A-Za-z0-9_-]{10,200}$/;
  const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[Đđ]/g,'d').toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'');
  const text=x=>String(x||'').slice(0,255);
  const validId=id=>typeof id==='string'&&VALID_ID.test(id);
  const isBlocked=gate=>['BLOCKED_SOURCE','BLOCKED_NO_ANSWER'].includes(gate);
  const present=status=>status==='MISSING_FROM_INBOX'?false:true;
  const canonicalDate=value=>{
    const t=Date.parse(String(value||''));
    return Number.isFinite(t)?new Date(t).toISOString():'';
  };
  function folderId(input){
    const value=String(input||'').trim();
    if(validId(value))return value;
    const patterns=[
      /^https:\/\/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([A-Za-z0-9_-]{10,200})(?:[?#].*)?$/,
      /^https:\/\/drive\.google\.com\/open\?id=([A-Za-z0-9_-]{10,200})(?:&.*)?$/
    ];
    for(const p of patterns){const match=p.exec(value);if(match)return match[1];}
    throw new Error('Hãy dán ID hoặc đường dẫn Google Drive của thư mục 00_INBOX hợp lệ.');
  }
  function hints(path,name){
    const p=(Array.isArray(path)?path:[]).map(norm);
    const n=norm(name);
    const subjectContext=p.slice(1,3).concat(n).join('_');
    const subject=Object.keys(SUBJECTS).find(s=>
      new RegExp('(^|_)'+s+'(_|$)').test(subjectContext) ||
      (s==='NGUVAN'&&subjectContext.includes('NGU_VAN')) ||
      (s==='TIENGANH'&&subjectContext.includes('TIENG_ANH')) ||
      (s==='LSDL'&&subjectContext.includes('LICH_SU')) ||
      (s==='TINHOC'&&subjectContext.includes('TIN_HOC')) ||
      (s==='CONGNGHE'&&subjectContext.includes('CONG_NGHE'))
    )||'';
    const dirs=p.slice(2).join('_');
    let type='';
    if(/DE_KIEM_TRA|DE_THI/.test(dirs))type='exam';
    else if(/ON_TAP|LUYEN_TAP/.test(dirs))type='practice';
    else if(/KIEN_THUC|BAI_HOC/.test(dirs))type='lesson';
    else if(/CONG_THUC/.test(dirs))type='formula';
    if(!type){
      if(/(^|_)KHONG_DAP_AN(_|$)/.test(n))type='practice';
      else if(/(^|_)DAP_AN(_|$)|ANSWER_KEY/.test(n))type='answer_key';
      else if(/(^|_)DE(_|$)|DE_KIEM_TRA/.test(n))type='exam';
      else if(/ON_TAP|REVIEW/.test(n))type='practice';
    }
    const period=['GK1','CK1','GK2','CK2'].find(k=>new RegExp('(^|_)'+k+'(_|$)').test(n))||'';
    return {suggestedSubject:subject,suggestedDocType:type,suggestedPeriod:period};
  }
  function gate(file,registry){
    const filename=norm(file.name);
    const old=(Array.isArray(registry)?registry:[]).find(x=>x?.driveFileId===file.id);
    if(/(^|_)KHONG_DAP_AN(_|$)|WITHOUT_ANSWERS/.test(filename))
      return {sourceGate:'BLOCKED_NO_ANSWER',reason:'Tên file ghi rõ không có đáp án; không được dùng để chấm tự động.'};
    if(!old)return {sourceGate:'NEW_NEEDS_REVIEW',reason:'Chưa có trong registry; cần kiểm tra nguồn.'};
    if(!file.modifiedTime||!old.modifiedTime||canonicalDate(file.modifiedTime)!==canonicalDate(old.modifiedTime))
      return {sourceGate:'CHANGED_NEEDS_REVIEW',reason:'Nguồn thay đổi; cần trích xuất và duyệt lại.'};
    if(String(old.status||'').startsWith('blocked'))
      return {sourceGate:'BLOCKED_SOURCE',reason:old.reason||'Nguồn trích xuất còn thiếu dữ kiện.'};
    if(old.representation)return {sourceGate:'SOURCE_REPRESENTED',reason:'Đã có cấu trúc nguồn, chưa đồng nghĩa đã sẵn sàng xuất bản đề.'};
    return {sourceGate:'KNOWN_NEEDS_REVIEW',reason:'Nguồn đã ghi nhận, chưa xác nhận đưa vào Question Bank.'};
  }
  function normalizeSource(file,path,registry,rootId,seenAt){
    if(!validId(file?.id)||file.mimeType===FOLDER_MIME||file.trashed)return null;
    const decision=gate(file,registry);
    return {
      driveFileId:file.id,rootId,source:'DRIVE_DISCOVERY_METADATA_ONLY',
      name:text(file.name),mimeType:text(file.mimeType),modifiedTime:canonicalDate(file.modifiedTime),
      md5Checksum:text(file.md5Checksum),sizeBytes:Math.max(0,Number(file.size)||0),
      sourcePath:path.map(text),webViewLink:
        typeof file.webViewLink==='string'&&/^https:\/\/drive\.google\.com\//.test(file.webViewLink)?
        file.webViewLink.slice(0,1200):'',
      ...hints(path,file.name),...decision,
      eligibleForAutoPublish:false,firstSeenAt:seenAt,lastSeenAt:seenAt,
      reviewStatus:isBlocked(decision.sourceGate)?'BLOCKED_SOURCE':'WAITING_REVIEW',
      reviewNote:'',reviewedAt:''
    };
  }
  function reconcile(existing,scanned,{registry=[],rootId,now=new Date().toISOString()}={}){
    if(!validId(rootId))throw new Error('Thư mục 00_INBOX không hợp lệ.');
    if(!Array.isArray(scanned))throw new Error('Kết quả quét nguồn không hợp lệ.');
    const previous=Array.isArray(existing)?existing.filter(x=>x&&x.rootId===rootId&&validId(x.driveFileId)):[];
    const byId=new Map(previous.map(x=>[x.driveFileId,x]));
    const seen=new Set();
    const output=[];
    const summary={added:0,changed:0,unchanged:0,missing:0,blocked:0};
    for(const entry of scanned){
      const candidate=normalizeSource(entry.file,entry.path,registry,rootId,now);
      if(!candidate||seen.has(candidate.driveFileId))continue;
      seen.add(candidate.driveFileId);
      const last=byId.get(candidate.driveFileId);
      const changed=!!last && (last.modifiedTime!==candidate.modifiedTime ||
        last.md5Checksum!==candidate.md5Checksum ||
        last.sizeBytes!==candidate.sizeBytes ||
        JSON.stringify(last.sourcePath)!==JSON.stringify(candidate.sourcePath)||
        last.sourceGate!==candidate.sourceGate ||
        last.reviewStatus==='MISSING_FROM_INBOX');
      if(!last)summary.added++;
      else if(changed)summary.changed++;
      else summary.unchanged++;
      if(isBlocked(candidate.sourceGate))summary.blocked++;
      if(last){
        candidate.firstSeenAt=last.firstSeenAt||now;
        if(!changed&&!isBlocked(candidate.sourceGate)){
          candidate.reviewStatus=last.reviewStatus==='METADATA_REVIEWED'?'METADATA_REVIEWED':'WAITING_REVIEW';
          candidate.reviewNote=String(last.reviewNote||'').slice(0,600);
          candidate.reviewedAt=String(last.reviewedAt||'');
          candidate.confirmedSubject=String(last.confirmedSubject||'');
          candidate.confirmedDocType=String(last.confirmedDocType||'');
          candidate.confirmedPeriod=String(last.confirmedPeriod||'');
        }else if(!changed&&isBlocked(candidate.sourceGate)){
          candidate.reviewNote=String(last.reviewNote||'').slice(0,600);
        }
      }
      output.push(candidate);
    }
    for(const last of previous){
      if(!seen.has(last.driveFileId)){
        summary.missing++;
        output.push({...last,reviewStatus:'MISSING_FROM_INBOX',lastSeenAt:last.lastSeenAt||now});
      }
    }
    return {queue:output.sort((a,b)=>a.sourcePath.join('/').localeCompare(b.sourcePath.join('/')) ||
      a.name.localeCompare(b.name)),summary};
  }
  async function scanTree({folderInfo,listChildren},rootId,{maxDepth=8,maxFolders=250,maxFiles=2000,maxPages=100}={}){
    if(!validId(rootId))throw new Error('ID thư mục nguồn không hợp lệ.');
    const root=await folderInfo(rootId);
    if(root?.name!=='00_INBOX'||root?.mimeType!==FOLDER_MIME||root?.trashed)
      throw new Error('Thư mục chọn không phải 00_INBOX; đã dừng quét.');
    const pending=[{id:rootId,path:['00_INBOX'],depth:0}];
    const folders=new Set(),ids=new Set(),files=[];
    while(pending.length){
      const cursor=pending.shift();
      if(folders.has(cursor.id))continue;
      folders.add(cursor.id);
      if(folders.size>maxFolders)throw new Error('Đã vượt giới hạn thư mục an toàn.');
      let token='',page=0;
      const tokens=new Set();
      do{
        if(++page>maxPages)throw new Error('Đã vượt giới hạn số trang Drive.');
        const result=await listChildren(cursor.id,token);
        if(!Array.isArray(result?.files))throw new Error('Google Drive trả dữ liệu không hợp lệ.');
        for(const f of result.files){
          if(!validId(f?.id)||f.trashed)continue;
          if(f.mimeType===FOLDER_MIME){
            if(cursor.depth>=maxDepth)throw new Error('Đã vượt giới hạn độ sâu 00_INBOX.');
            if(!folders.has(f.id))pending.push({id:f.id,path:[...cursor.path,text(f.name)],depth:cursor.depth+1});
          }else if(!ids.has(f.id)){
            ids.add(f.id);files.push({file:f,path:cursor.path});
            if(files.length>maxFiles)throw new Error('Quá nhiều tài liệu; dừng quét an toàn.');
          }
        }
        token=String(result.nextPageToken||'');
        if(token&&tokens.has(token))throw new Error('Google Drive phân trang lặp; dừng để tránh dữ liệu thiếu.');
        if(token)tokens.add(token);
      }while(token);
    }
    return {folderCount:folders.size,files};
  }

  root.AURA_DRIVE_SOURCE_CORE=Object.freeze({
    FOLDER_MIME,SUBJECTS,TYPES,folderId,hints,gate,isBlocked,reconcile,scanTree,validId
  });
})(typeof window!=='undefined'?window:globalThis);
