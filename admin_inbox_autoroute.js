/* AURA STUDY — fully automatic routing for approved INBOX files.
   Admin confirms metadata only; AURA resolves/creates destination folders and moves the file. */
(function(){
  if(!document.body.classList.contains('admin-shell'))return;
  const CFG=window.AURA_GOOGLE_DRIVE_CONFIG||{};
  const FOLDER_KEY='aura_drive_inbox_folder_v1';
  const QUEUE_KEY='aura_inbox_queue_v1';
  const MAP_KEY='aura_inbox_subject_routes_v1';
  const ROOT_KEY='aura_drive_library_root_v1';
  const LIBRARY_ROOT='AURA_STUDY_LIBRARY';

  const SUBJECT_LABEL={TOAN:'Toán',NGUVAN:'Ngữ văn',TIENGANH:'Tiếng Anh',KHTN:'KHTN',LSDL:'Lịch sử & Địa lý',GDCD:'GDCD',TINHOC:'Tin học',CONGNGHE:'Công nghệ',KHAC:'Khác'};
  const SUBJECT_FOLDER={TOAN:'01_TOAN',NGUVAN:'02_NGU_VAN',TIENGANH:'03_TIENG_ANH',KHTN:'04_KHTN',LSDL:'05_LSDL',GDCD:'06_GDCD',TINHOC:'07_TIN_HOC',CONGNGHE:'08_CONG_NGHE',KHAC:'99_KHAC'};
  const SUBJECT_ALIASES={
    TOAN:['01_TOAN','TOAN'],NGUVAN:['02_NGU_VAN','NGU_VAN','NGUVAN'],TIENGANH:['03_TIENG_ANH','TIENG_ANH','ENGLISH'],
    KHTN:['04_KHTN','KHTN'],LSDL:['05_LSDL','05_LICH_SU_DIA_LY','LSDL','LICH_SU_DIA_LY'],GDCD:['06_GDCD','GDCD'],TINHOC:['07_TIN_HOC','TIN_HOC','TINHOC'],CONGNGHE:['08_CONG_NGHE','CONG_NGHE','CONGNGHE'],KHAC:['99_KHAC','KHAC']
  };
  const TYPE_ALIASES={
    exam:['01_DE_KIEM_TRA','DE_KIEM_TRA','DE_THI','KIEM_TRA'],
    practice:['02_ON_TAP','ON_TAP','BAI_TAP','LUYEN_TAP'],
    lesson:['01_KIEN_THUC','KIEN_THUC','BAI_HOC'],
    solution:['04_LOI_GIAI','LOI_GIAI','BAI_GIAI','GIAI_CHI_TIET'],
    answer_key:['05_DAP_AN','DAP_AN','ANSWER_KEY'],
    formula:['03_CONG_THUC','CONG_THUC','GHI_NHO'],
    reference:['06_THAM_KHAO','THAM_KHAO','TAI_LIEU']
  };
  const TYPE_FOLDER={exam:'01_DE_KIEM_TRA',practice:'02_ON_TAP',lesson:'01_KIEN_THUC',solution:'04_LOI_GIAI',answer_key:'05_DAP_AN',formula:'03_CONG_THUC',reference:'06_THAM_KHAO'};
  const PERIOD_FOLDER={GK1:'GK1',CK1:'CK1',GK2:'GK2',CK2:'CK2'};

  let token='',tokenExpiresAt=0,tokenClient=null,tokenPromise=null,googlePromise=null;
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(_){return f}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const queue=()=>{const q=read(QUEUE_KEY,[]);return Array.isArray(q)?q:[]};
  const saveQueue=q=>write(QUEUE_KEY,(Array.isArray(q)?q:[]).slice(0,300));
  const routes=()=>{const x=read(MAP_KEY,{});return x&&typeof x==='object'?x:{}};
  const now=()=>new Date().toISOString();
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/Đ/g,'D').replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'');

  function loadScript(id,src){
    const cur=document.getElementById(id);
    if(cur?.dataset.loaded==='1'||(id==='aura-google-gsi'&&window.google?.accounts?.oauth2))return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const s=cur||document.createElement('script');
      const done=()=>{s.dataset.loaded='1';resolve()};
      if(cur){s.addEventListener('load',done,{once:true});s.addEventListener('error',reject,{once:true});setTimeout(()=>{if(window.google?.accounts?.oauth2)done()},0);return}
      s.id=id;s.src=src;s.async=true;s.defer=true;s.onload=done;s.onerror=()=>reject(new Error('Không tải được Google Identity Services.'));document.head.appendChild(s);
    });
  }
  async function ensureGoogle(){
    if(googlePromise)return googlePromise;
    googlePromise=loadScript('aura-google-gsi','https://accounts.google.com/gsi/client');
    return googlePromise;
  }
  async function accessToken(interactive=false){
    if(token&&Date.now()<tokenExpiresAt-30000)return token;
    if(window.AURA_DRIVE_AUTH?.hasToken?.()){token=window.AURA_DRIVE_AUTH.token;tokenExpiresAt=window.AURA_DRIVE_AUTH.status().expiresAt||Date.now()+300000;return token}
    if(tokenPromise)return tokenPromise;
    await ensureGoogle();
    if(!CFG.clientId)throw new Error('Thiếu Google OAuth Client ID.');
    if(!tokenClient)tokenClient=google.accounts.oauth2.initTokenClient({client_id:CFG.clientId,scope:CFG.scope||'https://www.googleapis.com/auth/drive.file',callback:()=>{}});
    tokenPromise=new Promise((resolve,reject)=>{
      tokenClient.callback=r=>{if(r?.error)return reject(new Error(r.error_description||r.error));token=r.access_token||'';tokenExpiresAt=Date.now()+Math.max(60,Number(r.expires_in||3600)-60)*1000;resolve(token)};
      tokenClient.error_callback=e=>reject(new Error(e?.message||e?.type||'Không thể lấy quyền Google Drive.'));
      tokenClient.requestAccessToken({prompt:interactive?'select_account':''});
    }).finally(()=>{tokenPromise=null});
    return tokenPromise;
  }
  async function driveJson(url,options={}){
    const t=await accessToken(false),headers=new Headers(options.headers||{});headers.set('Authorization',`Bearer ${t}`);
    const res=await fetch(url,{...options,headers});
    if(!res.ok){let msg=`Google Drive trả lỗi ${res.status}`;try{const d=await res.json();msg=d?.error?.message||msg}catch(_){ }throw new Error(msg)}
    return res.status===204?{}:res.json();
  }
  async function fileInfo(id){return driveJson(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?fields=${encodeURIComponent('id,name,mimeType,parents,capabilities(canAddChildren),appProperties')}`)}
  async function children(parentId){
    const q=`'${String(parentId).replace(/'/g,"\\'")}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const d=await driveJson(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=1000&fields=${encodeURIComponent('files(id,name,parents,appProperties,capabilities(canAddChildren))')}`);
    return d.files||[];
  }
  function bestFolder(files,aliases){
    const scored=[];for(const f of files){const n=norm(f.name);for(let i=0;i<aliases.length;i++){const a=norm(aliases[i]);if(n===a||n.endsWith('_'+a)||n.includes(a))scored.push({f,score:(n===a?100:0)+(n.endsWith('_'+a)?50:0)+(aliases.length-i)})}}
    scored.sort((a,b)=>b.score-a.score);return scored[0]?.f||null;
  }
  async function createFolder(name,parentId,role,extra={}){
    const body={name,mimeType:'application/vnd.google-apps.folder',appProperties:{auraManaged:'1',auraRole:role,...extra}};
    if(parentId)body.parents=[parentId];
    return driveJson(`https://www.googleapis.com/drive/v3/files?fields=${encodeURIComponent('id,name,parents,appProperties,capabilities(canAddChildren)')}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  }
  async function ensureLibraryRoot(){
    const saved=read(ROOT_KEY,null);
    if(saved?.id){try{const d=await fileInfo(saved.id);if(d.mimeType==='application/vnd.google-apps.folder')return {...saved,name:d.name||saved.name}}catch(_){localStorage.removeItem(ROOT_KEY)}}
    const q=`mimeType='application/vnd.google-apps.folder' and trashed=false and appProperties has { key='auraRole' and value='LIBRARY_ROOT' }`;
    try{const d=await driveJson(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=20&fields=${encodeURIComponent('files(id,name,parents,appProperties)')}`);if(d.files?.[0]){write(ROOT_KEY,d.files[0]);return d.files[0]}}catch(_){ }
    const created=await createFolder(LIBRARY_ROOT,'','LIBRARY_ROOT');write(ROOT_KEY,created);return created;
  }
  async function ensureChild(parentId,aliases,canonical,role,extra={}){
    const list=await children(parentId);const found=bestFolder(list,aliases||[canonical]);if(found)return found;
    return createFolder(canonical,parentId,role,extra);
  }
  async function ensureSubjectRoute(subject){
    const all=routes(),saved=all[subject];
    if(saved?.id){
      try{const d=await fileInfo(saved.id);if(d.mimeType==='application/vnd.google-apps.folder'&&(!d.capabilities||d.capabilities.canAddChildren!==false))return {...saved,name:d.name||saved.name}}catch(_){delete all[subject];write(MAP_KEY,all)}
    }
    const root=await ensureLibraryRoot();
    const canonical=SUBJECT_FOLDER[subject]||subject||'99_KHAC';
    const folder=await ensureChild(root.id,SUBJECT_ALIASES[subject]||[canonical],canonical,'SUBJECT',{auraSubject:subject||'KHAC'});
    all[subject]={id:folder.id,name:folder.name,authorizedAt:now(),source:'AUTO_MANAGED',libraryRootId:root.id};write(MAP_KEY,all);return all[subject];
  }
  async function resolveDestination(subject,docType,period){
    const subjectRoot=await ensureSubjectRoute(subject);
    const typeCanonical=TYPE_FOLDER[docType]||'06_THAM_KHAO';
    const typeFolder=await ensureChild(subjectRoot.id,TYPE_ALIASES[docType]||[typeCanonical],typeCanonical,'DOC_TYPE',{auraSubject:subject,auraDocType:docType||'reference'});
    if(period&&PERIOD_FOLDER[period]){
      const periodName=PERIOD_FOLDER[period];
      const periodFolder=await ensureChild(typeFolder.id,[periodName],periodName,'PERIOD',{auraSubject:subject,auraDocType:docType||'reference',auraPeriod:period});
      return {...periodFolder,routeLevel:'period',subjectRootId:subjectRoot.id,subjectRootName:subjectRoot.name,typeFolderId:typeFolder.id,typeFolderName:typeFolder.name};
    }
    return {...typeFolder,routeLevel:'type',subjectRootId:subjectRoot.id,subjectRootName:subjectRoot.name};
  }
  function payload(fileId){const card=document.querySelector(`.inbox-review-item[data-drive-id="${CSS.escape(fileId)}"]`);if(!card)return null;return {subject:card.querySelector('.inbox-subject')?.value||'',docType:card.querySelector('.inbox-doctype')?.value||'',period:card.querySelector('.inbox-period')?.value||'',adminNote:card.querySelector('.inbox-admin-note')?.value?.trim()||''}}
  function patchQueue(fileId,patch){const rows=queue(),i=rows.findIndex(x=>x.driveFileId===fileId);if(i<0)return null;rows[i]={...rows[i],...patch};saveQueue(rows);return rows[i]}
  async function currentProps(fileId){return driveJson(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=${encodeURIComponent('appProperties,parents')}`)}

  // Optional manual override remains available for maintenance, but approval never calls it.
  window.auraMapSubjectFolder=async function(subject){alert(`AURA đang tự quản lý route cho ${SUBJECT_LABEL[subject]||subject}. Không cần chọn thư mục khi duyệt.`)};

  window.auraApproveInboxFile=async function(fileId){
    const item=queue().find(x=>x.driveFileId===fileId);if(!item)return;const p=payload(fileId);if(!p)return;
    if(!p.subject){alert('Hãy chọn môn trước khi duyệt.');return}if(!p.docType){alert('Hãy chọn loại tài liệu trước khi duyệt.');return}
    const inbox=read(FOLDER_KEY,null);if(!inbox?.id){alert('Chưa có 00_INBOX đã xác nhận.');return}
    try{
      const dest=await resolveDestination(p.subject,p.docType,p.period);
      const approvedAt=now(),cur=await currentProps(fileId);
      const routePath=[dest.subjectRootName,dest.typeFolderName,dest.routeLevel==='period'?dest.name:''].filter(Boolean).join(' / ');
      const appProperties={...(cur.appProperties||{}),auraState:'APPROVED',auraOrigin:'ADMIN_DEVICE_UPLOAD',auraUploadedAt:item.uploadedAt||cur.appProperties?.auraUploadedAt||'',auraApprovedAt:approvedAt,auraAssignedSubject:p.subject,auraAssignedDocType:p.docType,auraAssignedPeriod:p.period||'',auraAdminNote:p.adminNote.slice(0,500),auraDestinationName:(dest.name||'').slice(0,120),auraDestinationPath:routePath.slice(0,240),auraDestinationAuto:'1',auraRouteLevel:dest.routeLevel||''};
      const parents=Array.isArray(cur.parents)?cur.parents:[];const remove=parents.includes(inbox.id)?inbox.id:(item.inboxFolderId||inbox.id);
      const query=`addParents=${encodeURIComponent(dest.id)}&removeParents=${encodeURIComponent(remove)}&fields=${encodeURIComponent('id,name,mimeType,size,webViewLink,parents,appProperties')}`;
      const data=await driveJson(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?${query}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({appProperties})});
      patchQueue(fileId,{...p,status:'APPROVED',approvedAt,destinationId:dest.id,destinationName:dest.name||'',destinationPath:routePath,routeLevel:dest.routeLevel||'',webViewLink:data.webViewLink||item.webViewLink||'',parents:data.parents||[dest.id]});
      if(typeof window.auraAdminInbox==='function')window.auraAdminInbox();
    }catch(e){alert('Chưa thể tự duyệt & chuyển file: '+(e?.message||e))}
  };

  function decorate(){
    if(document.body.dataset.auraPage!=='inbox')return;
    document.querySelectorAll('.inbox-review-item[data-drive-id]').forEach(card=>{
      const btn=[...card.querySelectorAll('.inbox-review-actions button')].find(b=>(b.getAttribute('onclick')||'').includes('auraApproveInboxFile'));
      if(btn&&btn.textContent!=='Duyệt & tự chuyển')btn.textContent='Duyệt & tự chuyển';
      const help=card.querySelector('.inbox-review-help');
      const text='Sau khi Admin duyệt, AURA tự chuyển file theo Môn → Loại tài liệu → Kỳ sử dụng. Không cần chọn thư mục đích.';
      if(help&&help.textContent!==text)help.textContent=text;
    });
  }
  const observer=new MutationObserver(decorate);observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});document.addEventListener('change',e=>{if(e.target?.classList?.contains('inbox-subject')||e.target?.classList?.contains('inbox-doctype')||e.target?.classList?.contains('inbox-period'))setTimeout(decorate,0)});setTimeout(decorate,0);
})();