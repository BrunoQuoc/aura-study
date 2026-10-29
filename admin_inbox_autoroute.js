/* AURA STUDY — auto-route approved INBOX files with one-time subject folder mapping */
(function(){
  if(!document.body.classList.contains('admin-shell'))return;
  const CFG=window.AURA_GOOGLE_DRIVE_CONFIG||{};
  const FOLDER_KEY='aura_drive_inbox_folder_v1';
  const QUEUE_KEY='aura_inbox_queue_v1';
  const MAP_KEY='aura_inbox_subject_routes_v1';
  const SUBJECT_LABEL={TOAN:'Toán',NGUVAN:'Ngữ văn',TIENGANH:'Tiếng Anh',KHTN:'KHTN',LSDL:'Lịch sử & Địa lý',GDCD:'GDCD',TINHOC:'Tin học',CONGNGHE:'Công nghệ'};
  const SUBJECT_ALIASES={
    TOAN:['01_TOAN','TOAN'],NGUVAN:['02_NGU_VAN','NGU_VAN','NGUVAN'],TIENGANH:['03_TIENG_ANH','TIENG_ANH','ENGLISH'],
    KHTN:['04_KHTN','KHTN'],LSDL:['05_LSDL','05_LICH_SU_DIA_LY','LSDL','LICH_SU_DIA_LY'],GDCD:['06_GDCD','GDCD'],TINHOC:['07_TIN_HOC','TIN_HOC','TINHOC'],CONGNGHE:['08_CONG_NGHE','CONG_NGHE','CONGNGHE']
  };
  const TYPE_ALIASES={
    exam:['DE_KIEM_TRA','DE_THI','KIEM_TRA'],practice:['ON_TAP','BAI_TAP','LUYEN_TAP'],lesson:['KIEN_THUC','BAI_HOC'],
    solution:['LOI_GIAI','BAI_GIAI','GIAI_CHI_TIET'],answer_key:['DAP_AN','ANSWER_KEY'],formula:['CONG_THUC','GHI_NHO'],reference:['THAM_KHAO','TAI_LIEU']
  };
  let token='',tokenExpiresAt=0,tokenClient=null,tokenPromise=null,googlePromise=null;
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(_){return f}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const queue=()=>{const q=read(QUEUE_KEY,[]);return Array.isArray(q)?q:[]};
  const saveQueue=q=>write(QUEUE_KEY,(Array.isArray(q)?q:[]).slice(0,300));
  const routes=()=>{const x=read(MAP_KEY,{});return x&&typeof x==='object'?x:{}};
  const now=()=>new Date().toISOString();
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/Đ/g,'D').replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'');

  function loadScript(id,src){
    const cur=document.getElementById(id);if(cur?.dataset.loaded==='1'||(id==='aura-google-gsi'&&window.google?.accounts?.oauth2)||(id==='aura-google-api'&&window.gapi))return Promise.resolve();
    return new Promise((resolve,reject)=>{const s=cur||document.createElement('script');const done=()=>{s.dataset.loaded='1';resolve()};if(cur){s.addEventListener('load',done,{once:true});s.addEventListener('error',reject,{once:true});setTimeout(()=>{if((id==='aura-google-gsi'&&window.google?.accounts?.oauth2)||(id==='aura-google-api'&&window.gapi))done()},0);return}s.id=id;s.src=src;s.async=true;s.defer=true;s.onload=done;s.onerror=()=>reject(new Error('Không tải được thư viện Google.'));document.head.appendChild(s)})
  }
  async function ensureGoogle(){
    if(googlePromise)return googlePromise;
    googlePromise=Promise.all([loadScript('aura-google-gsi','https://accounts.google.com/gsi/client'),loadScript('aura-google-api','https://apis.google.com/js/api.js')]).then(()=>new Promise((resolve,reject)=>{
      if(!window.gapi)return reject(new Error('Google API chưa sẵn sàng.'));
      gapi.load('picker',{callback:resolve,onerror:()=>reject(new Error('Không tải được Google Picker.'))});
    }));
    return googlePromise;
  }
  async function accessToken(interactive=false){
    if(token&&Date.now()<tokenExpiresAt-30000)return token;if(tokenPromise)return tokenPromise;await ensureGoogle();
    if(!CFG.clientId)throw new Error('Thiếu Google OAuth Client ID.');
    if(!tokenClient)tokenClient=google.accounts.oauth2.initTokenClient({client_id:CFG.clientId,scope:CFG.scope||'https://www.googleapis.com/auth/drive.file',callback:()=>{}});
    tokenPromise=new Promise((resolve,reject)=>{tokenClient.callback=r=>{if(r?.error)return reject(new Error(r.error_description||r.error));token=r.access_token||'';tokenExpiresAt=Date.now()+Math.max(60,Number(r.expires_in||3600)-60)*1000;resolve(token)};tokenClient.error_callback=e=>reject(new Error(e?.message||e?.type||'Không thể lấy quyền Google Drive.'));tokenClient.requestAccessToken({prompt:interactive?'select_account':''})}).finally(()=>{tokenPromise=null});return tokenPromise;
  }
  async function driveJson(url,options={}){const t=await accessToken(false),headers=new Headers(options.headers||{});headers.set('Authorization',`Bearer ${t}`);const res=await fetch(url,{...options,headers});if(!res.ok){let msg=`Google Drive trả lỗi ${res.status}`;try{const d=await res.json();msg=d?.error?.message||msg}catch(_){ }throw new Error(msg)}return res.status===204?{}:res.json()}
  async function pickFolder(title){
    await ensureGoogle();const t=await accessToken(!token);
    return new Promise(resolve=>{
      const view=new google.picker.DocsView(google.picker.ViewId.DOCS).setIncludeFolders(true).setSelectFolderEnabled(true).setMimeTypes('application/vnd.google-apps.folder').setMode(google.picker.DocsViewMode.LIST);
      const picker=new google.picker.PickerBuilder().addView(view).setOAuthToken(t).setDeveloperKey(CFG.apiKey).setAppId(CFG.appId).setOrigin(window.location.origin).setTitle(title||'Chọn thư mục môn').setCallback(data=>{
        const action=data[google.picker.Response.ACTION];
        if(action===google.picker.Action.PICKED){const doc=data[google.picker.Response.DOCUMENTS]?.[0];resolve(doc?{id:doc[google.picker.Document.ID],name:doc[google.picker.Document.NAME]||''}:null)}
        else if(action===google.picker.Action.CANCEL)resolve(null);
      }).build();picker.setVisible(true);
    });
  }
  async function verifySubjectFolder(subject,f){
    if(!f?.id)throw new Error('Chưa chọn thư mục môn.');
    const d=await driveJson(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(f.id)}?fields=${encodeURIComponent('id,name,mimeType,capabilities(canAddChildren)')}`);
    if(d.mimeType!=='application/vnd.google-apps.folder')throw new Error('Mục đã chọn không phải thư mục.');
    const aliases=SUBJECT_ALIASES[subject]||[subject],n=norm(d.name),ok=aliases.some(a=>{const x=norm(a);return n===x||n.endsWith('_'+x)||n.includes(x)});
    if(!ok)throw new Error(`Hãy chọn đúng thư mục môn ${SUBJECT_LABEL[subject]||subject} (ví dụ ${aliases[0]}).`);
    if(d.capabilities&&d.capabilities.canAddChildren===false)throw new Error('Tài khoản hiện tại không có quyền thêm file vào thư mục môn này.');
    const all=routes();all[subject]={id:d.id,name:d.name,authorizedAt:now()};write(MAP_KEY,all);return all[subject];
  }
  async function ensureSubjectRoute(subject){
    const all=routes(),saved=all[subject];
    if(saved?.id){
      try{const d=await driveJson(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(saved.id)}?fields=${encodeURIComponent('id,name,mimeType,capabilities(canAddChildren)')}`);if(d.mimeType==='application/vnd.google-apps.folder'&&(!d.capabilities||d.capabilities.canAddChildren!==false))return {...saved,name:d.name||saved.name}}catch(_){delete all[subject];write(MAP_KEY,all)}
    }
    const picked=await pickFolder(`Thiết lập 1 lần: chọn thư mục ${SUBJECT_LABEL[subject]||subject} (${SUBJECT_ALIASES[subject]?.[0]||subject})`);
    if(!picked)return null;return verifySubjectFolder(subject,picked);
  }
  async function children(parentId){const q=`'${String(parentId).replace(/'/g,"\\'")}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;const fields='files(id,name,parents)';const d=await driveJson(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=1000&fields=${encodeURIComponent(fields)}`);return d.files||[]}
  function bestFolder(files,aliases){const scored=[];for(const f of files){const n=norm(f.name);for(let i=0;i<aliases.length;i++){const a=norm(aliases[i]);if(n===a||n.endsWith('_'+a)||n.includes(a))scored.push({f,score:(n===a?100:0)+(n.endsWith('_'+a)?50:0)+(aliases.length-i)})}scored.sort((a,b)=>b.score-a.score);return scored[0]?.f||null}
  async function resolveDestination(subject,docType){
    const root=await ensureSubjectRoute(subject);if(!root)return null;
    const subAliases=TYPE_ALIASES[docType]||[];if(!subAliases.length)return {...root,routeLevel:'subject_mapped'};
    try{const subs=await children(root.id),sub=bestFolder(subs,subAliases);if(sub)return {...sub,routeLevel:'type',subjectRootId:root.id,subjectRootName:root.name}}catch(_){ }
    return {...root,routeLevel:'subject_mapped_fallback'};
  }
  function payload(fileId){const card=document.querySelector(`.inbox-review-item[data-drive-id="${CSS.escape(fileId)}"]`);if(!card)return null;return {subject:card.querySelector('.inbox-subject')?.value||'',docType:card.querySelector('.inbox-doctype')?.value||'',period:card.querySelector('.inbox-period')?.value||'',adminNote:card.querySelector('.inbox-admin-note')?.value?.trim()||''}}
  function patchQueue(fileId,patch){const rows=queue(),i=rows.findIndex(x=>x.driveFileId===fileId);if(i<0)return null;rows[i]={...rows[i],...patch};saveQueue(rows);return rows[i]}
  async function currentProps(fileId){return driveJson(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=appProperties,parents`)}

  window.auraMapSubjectFolder=async function(subject){try{const picked=await pickFolder(`Chọn thư mục môn ${SUBJECT_LABEL[subject]||subject}`);if(!picked)return;await verifySubjectFolder(subject,picked);alert(`Đã ghi nhớ thư mục ${SUBJECT_LABEL[subject]||subject}. Từ giờ AURA sẽ tự chuyển file môn này.`);decorate()}catch(e){alert('Chưa thể ghi nhớ thư mục môn: '+(e?.message||e))}};

  window.auraApproveInboxFile=async function(fileId){
    const item=queue().find(x=>x.driveFileId===fileId);if(!item)return;const p=payload(fileId);if(!p)return;
    if(!p.subject){alert('Hãy chọn môn trước khi duyệt.');return}if(!p.docType){alert('Hãy chọn loại tài liệu trước khi duyệt.');return}
    const inbox=read(FOLDER_KEY,null);if(!inbox?.id){alert('Chưa có 00_INBOX đã xác nhận.');return}
    try{
      const dest=await resolveDestination(p.subject,p.docType);if(!dest)return;
      const approvedAt=now(),cur=await currentProps(fileId);
      const appProperties={...(cur.appProperties||{}),auraState:'APPROVED',auraOrigin:'ADMIN_DEVICE_UPLOAD',auraUploadedAt:item.uploadedAt||cur.appProperties?.auraUploadedAt||'',auraApprovedAt:approvedAt,auraAssignedSubject:p.subject,auraAssignedDocType:p.docType,auraAssignedPeriod:p.period||'',auraAdminNote:p.adminNote.slice(0,500),auraDestinationName:(dest.name||'').slice(0,120),auraDestinationAuto:'1',auraRouteLevel:dest.routeLevel||''};
      const parents=Array.isArray(cur.parents)?cur.parents:[];const remove=parents.includes(inbox.id)?inbox.id:(item.inboxFolderId||inbox.id);
      const query=`addParents=${encodeURIComponent(dest.id)}&removeParents=${encodeURIComponent(remove)}&fields=${encodeURIComponent('id,name,mimeType,size,webViewLink,parents,appProperties')}`;
      const data=await driveJson(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?${query}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({appProperties})});
      patchQueue(fileId,{...p,status:'APPROVED',approvedAt,destinationId:dest.id,destinationName:dest.name||'',routeLevel:dest.routeLevel||'',webViewLink:data.webViewLink||item.webViewLink||'',parents:data.parents||[dest.id]});
      if(typeof window.auraAdminInbox==='function')window.auraAdminInbox();
    }catch(e){alert('Chưa thể tự duyệt & chuyển file: '+(e?.message||e))}
  };

  function decorate(){
    if(document.body.dataset.auraPage!=='inbox')return;const mapped=routes();
    document.querySelectorAll('.inbox-review-item[data-drive-id]').forEach(card=>{
      const subject=card.querySelector('.inbox-subject')?.value||'';const btn=[...card.querySelectorAll('.inbox-review-actions button')].find(b=>(b.getAttribute('onclick')||'').includes('auraApproveInboxFile'));
      if(!btn)return;const text=subject&&!mapped[subject]?.id?`Thiết lập ${SUBJECT_LABEL[subject]||subject} & duyệt`:'Duyệt & tự chuyển';if(btn.textContent!==text)btn.textContent=text;
    });
  }
  const observer=new MutationObserver(decorate);observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});document.addEventListener('change',e=>{if(e.target?.classList?.contains('inbox-subject'))setTimeout(decorate,0)});setTimeout(decorate,0);
})();