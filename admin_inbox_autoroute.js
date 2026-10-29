/* AURA STUDY — auto-route approved INBOX files without Google Picker */
(function(){
  if(!document.body.classList.contains('admin-shell'))return;
  const CFG=window.AURA_GOOGLE_DRIVE_CONFIG||{};
  const FOLDER_KEY='aura_drive_inbox_folder_v1';
  const QUEUE_KEY='aura_inbox_queue_v1';
  const SUBJECT_ALIASES={
    TOAN:['01_TOAN','TOAN'],NGUVAN:['02_NGU_VAN','NGU_VAN','NGUVAN'],TIENGANH:['03_TIENG_ANH','TIENG_ANH','ENGLISH'],
    KHTN:['04_KHTN','KHTN'],LSDL:['05_LSDL','05_LICH_SU_DIA_LY','LSDL','LICH_SU_DIA_LY'],GDCD:['06_GDCD','GDCD'],TINHOC:['07_TIN_HOC','TIN_HOC','TINHOC'],CONGNGHE:['08_CONG_NGHE','CONG_NGHE','CONGNGHE']
  };
  const TYPE_ALIASES={
    exam:['DE_KIEM_TRA','DE_THI','KIEM_TRA'],practice:['ON_TAP','BAI_TAP','LUYEN_TAP'],lesson:['KIEN_THUC','BAI_HOC'],
    solution:['LOI_GIAI','BAI_GIAI','GIAI_CHI_TIET'],answer_key:['DAP_AN','ANSWER_KEY'],formula:['CONG_THUC','GHI_NHO'],reference:['THAM_KHAO','TAI_LIEU']
  };
  let token='',tokenExpiresAt=0,tokenClient=null,tokenPromise=null;
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(_){return f}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const queue=()=>{const q=read(QUEUE_KEY,[]);return Array.isArray(q)?q:[]};
  const saveQueue=q=>write(QUEUE_KEY,(Array.isArray(q)?q:[]).slice(0,300));
  const now=()=>new Date().toISOString();
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/Đ/g,'D').replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'');
  function ensureGsi(){if(window.google?.accounts?.oauth2)return Promise.resolve();return new Promise((resolve,reject)=>{let s=document.getElementById('aura-google-gsi');if(s){s.addEventListener('load',resolve,{once:true});s.addEventListener('error',reject,{once:true});return}s=document.createElement('script');s.id='aura-google-gsi';s.src='https://accounts.google.com/gsi/client';s.async=true;s.defer=true;s.onload=resolve;s.onerror=()=>reject(new Error('Không tải được Google Identity Services.'));document.head.appendChild(s)})}
  async function accessToken(){if(token&&Date.now()<tokenExpiresAt-30000)return token;if(tokenPromise)return tokenPromise;await ensureGsi();if(!CFG.clientId)throw new Error('Thiếu Google OAuth Client ID.');if(!tokenClient)tokenClient=google.accounts.oauth2.initTokenClient({client_id:CFG.clientId,scope:CFG.scope||'https://www.googleapis.com/auth/drive.file',callback:()=>{}});tokenPromise=new Promise((resolve,reject)=>{tokenClient.callback=r=>{if(r?.error)return reject(new Error(r.error_description||r.error));token=r.access_token||'';tokenExpiresAt=Date.now()+Math.max(60,Number(r.expires_in||3600)-60)*1000;resolve(token)};tokenClient.error_callback=e=>reject(new Error(e?.message||e?.type||'Không thể lấy quyền Google Drive.'));tokenClient.requestAccessToken({prompt:''})}).finally(()=>{tokenPromise=null});return tokenPromise}
  async function driveJson(url,options={}){const t=await accessToken(),headers=new Headers(options.headers||{});headers.set('Authorization',`Bearer ${t}`);const res=await fetch(url,{...options,headers});if(!res.ok){let msg=`Google Drive trả lỗi ${res.status}`;try{const d=await res.json();msg=d?.error?.message||msg}catch(_){ }throw new Error(msg)}return res.status===204?{}:res.json()}
  async function children(parentId){const q=`'${String(parentId).replace(/'/g,"\\'")}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;const fields='files(id,name,parents)';const d=await driveJson(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=1000&fields=${encodeURIComponent(fields)}`);return d.files||[]}
  function bestFolder(files,aliases){const scored=[];for(const f of files){const n=norm(f.name);for(let i=0;i<aliases.length;i++){const a=norm(aliases[i]);if(n===a||n.endsWith('_'+a)||n.includes(a)){scored.push({f,score:(n===a?100:0)+(n.endsWith('_'+a)?50:0)+(aliases.length-i)})}}}scored.sort((a,b)=>b.score-a.score);return scored[0]?.f||null}
  async function resolveDestination(inboxId,subject,docType){const roots=await children(inboxId);const root=bestFolder(roots,SUBJECT_ALIASES[subject]||[subject]);if(!root)throw new Error(`Chưa có thư mục môn ${subject} trong 00_INBOX.`);const subAliases=TYPE_ALIASES[docType]||[];if(!subAliases.length)return {...root,routeLevel:'subject'};const subs=await children(root.id);const sub=bestFolder(subs,subAliases);return sub?{...sub,routeLevel:'type',subjectRootId:root.id,subjectRootName:root.name}:{...root,routeLevel:'subject_fallback'} }
  function payload(fileId){const card=document.querySelector(`.inbox-review-item[data-drive-id="${CSS.escape(fileId)}"]`);if(!card)return null;return {subject:card.querySelector('.inbox-subject')?.value||'',docType:card.querySelector('.inbox-doctype')?.value||'',period:card.querySelector('.inbox-period')?.value||'',adminNote:card.querySelector('.inbox-admin-note')?.value?.trim()||''}}
  function patchQueue(fileId,patch){const rows=queue(),i=rows.findIndex(x=>x.driveFileId===fileId);if(i<0)return null;rows[i]={...rows[i],...patch};saveQueue(rows);return rows[i]}
  async function currentProps(fileId){const d=await driveJson(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=appProperties,parents`);return d}
  window.auraApproveInboxFile=async function(fileId){
    const item=queue().find(x=>x.driveFileId===fileId);if(!item)return;
    const p=payload(fileId);if(!p)return;
    if(!p.subject){alert('Hãy chọn môn trước khi duyệt.');return}if(!p.docType){alert('Hãy chọn loại tài liệu trước khi duyệt.');return}
    const inbox=read(FOLDER_KEY,null);if(!inbox?.id){alert('Chưa có 00_INBOX đã xác nhận.');return}
    try{
      const dest=await resolveDestination(inbox.id,p.subject,p.docType);
      if(dest.id===inbox.id)throw new Error('Không xác định được thư mục đích an toàn.');
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
    if(document.body.dataset.auraPage!=='inbox')return;
    document.querySelectorAll('.inbox-review-item[data-drive-id]').forEach(card=>{
      const btn=[...card.querySelectorAll('.inbox-review-actions button')].find(b=>(b.getAttribute('onclick')||'').includes('auraApproveInboxFile'));
      if(btn&&btn.textContent!=='Duyệt & tự chuyển')btn.textContent='Duyệt & tự chuyển';
    });
  }
  const observer=new MutationObserver(decorate);observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});setTimeout(decorate,0);
})();
