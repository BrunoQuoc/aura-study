/* AURA STUDY — pending-only INBOX queue behavior */
(function(){
  if(!document.body.classList.contains('admin-shell'))return;
  const CFG=window.AURA_GOOGLE_DRIVE_CONFIG||{};
  const FOLDER_KEY='aura_drive_inbox_folder_v1';
  const QUEUE_KEY='aura_inbox_queue_v1';
  const DECISION_KEY='aura_inbox_decisions_v1';
  const REJECTED_FOLDER_NAME='99_REJECTED';
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(_){return f}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const folder=()=>read(FOLDER_KEY,null);
  const queue=()=>{const q=read(QUEUE_KEY,[]);return Array.isArray(q)?q:[]};
  const saveQueue=q=>write(QUEUE_KEY,(Array.isArray(q)?q:[]).filter(x=>x&&x.status==='WAITING_REVIEW').slice(0,300));
  const now=()=>new Date().toISOString();
  let token='',tokenExpiresAt=0,tokenClient=null,tokenPromise=null;

  function recordDecision(item,status,extra={}){
    const rows=read(DECISION_KEY,[]),list=Array.isArray(rows)?rows:[];
    list.unshift({driveFileId:item.driveFileId,name:item.name||'',status,decidedAt:now(),subject:item.subject||'',docType:item.docType||'',period:item.period||'',...extra});
    write(DECISION_KEY,list.slice(0,200));
  }
  function removePending(fileId){saveQueue(queue().filter(x=>x.driveFileId!==fileId))}
  function migrate(){
    const before=queue(),pending=before.filter(x=>x&&x.status==='WAITING_REVIEW');
    if(pending.length!==before.length)write(QUEUE_KEY,pending.slice(0,300));
  }
  function clearUploadInput(){const input=document.getElementById('auraInboxFileInput');if(input)input.value=''}

  function ensureGsi(){
    if(window.google?.accounts?.oauth2)return Promise.resolve();
    return new Promise((resolve,reject)=>{
      let s=document.getElementById('aura-google-gsi');
      if(s){s.addEventListener('load',resolve,{once:true});s.addEventListener('error',reject,{once:true});return}
      s=document.createElement('script');s.id='aura-google-gsi';s.src='https://accounts.google.com/gsi/client';s.async=true;s.defer=true;s.onload=resolve;s.onerror=()=>reject(new Error('Không tải được Google Identity Services.'));document.head.appendChild(s);
    });
  }
  async function accessToken(){
    if(token&&Date.now()<tokenExpiresAt-30000)return token;
    if(tokenPromise)return tokenPromise;
    await ensureGsi();
    if(!CFG.clientId)throw new Error('Thiếu Google OAuth Client ID.');
    if(!tokenClient)tokenClient=google.accounts.oauth2.initTokenClient({client_id:CFG.clientId,scope:CFG.scope||'https://www.googleapis.com/auth/drive.file',callback:()=>{}});
    tokenPromise=new Promise((resolve,reject)=>{
      tokenClient.callback=r=>{if(r?.error)return reject(new Error(r.error_description||r.error));token=r.access_token||'';tokenExpiresAt=Date.now()+Math.max(60,Number(r.expires_in||3600)-60)*1000;resolve(token)};
      tokenClient.error_callback=e=>reject(new Error(e?.message||e?.type||'Không thể lấy quyền Google Drive.'));
      tokenClient.requestAccessToken({prompt:''});
    }).finally(()=>{tokenPromise=null});
    return tokenPromise;
  }
  async function driveJson(url,options={}){
    const t=await accessToken();
    const headers=new Headers(options.headers||{});headers.set('Authorization',`Bearer ${t}`);
    const res=await fetch(url,{...options,headers});
    if(!res.ok){let msg=`Google Drive trả lỗi ${res.status}`;try{const d=await res.json();msg=d?.error?.message||msg}catch(_){ }throw new Error(msg)}
    return res.status===204?{}:res.json();
  }
  async function ensureRejectedFolder(inboxId){
    const q=`name='${REJECTED_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and '${String(inboxId).replace(/'/g,"\\'")}' in parents and trashed=false`;
    const list=await driveJson(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=10&fields=${encodeURIComponent('files(id,name,parents)')}`);
    if(list.files?.[0])return list.files[0];
    return driveJson(`https://www.googleapis.com/drive/v3/files?fields=${encodeURIComponent('id,name,parents')}`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name:REJECTED_FOLDER_NAME,mimeType:'application/vnd.google-apps.folder',parents:[inboxId],appProperties:{auraRole:'REJECTED_ARCHIVE'}})
    });
  }
  async function markRejected(item,note){
    const inboxId=item.inboxFolderId||folder()?.id;if(!inboxId)throw new Error('Không xác định được thư mục 00_INBOX.');
    const rejectedFolder=await ensureRejectedFolder(inboxId),rejectedAt=now();
    const appProperties={auraState:'REJECTED',auraOrigin:'ADMIN_DEVICE_UPLOAD',auraUploadedAt:item.uploadedAt||'',auraRejectedAt:rejectedAt,auraAdminNote:String(note||'').slice(0,500),auraRejectedFolder:REJECTED_FOLDER_NAME};
    await driveJson(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(item.driveFileId)}?addParents=${encodeURIComponent(rejectedFolder.id)}&removeParents=${encodeURIComponent(inboxId)}&fields=${encodeURIComponent('id,parents,appProperties')}`,{
      method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({appProperties})
    });
    return {rejectedAt,rejectedFolderId:rejectedFolder.id,rejectedFolderName:rejectedFolder.name||REJECTED_FOLDER_NAME};
  }

  function decorate(){
    if(document.body.dataset.auraPage!=='inbox')return;
    const summary=document.querySelector('.inbox-summary article:last-child small');
    const summaryText='Chỉ hiển thị tài liệu đang chờ xử lý';
    if(summary&&summary.textContent!==summaryText)summary.textContent=summaryText;

    document.querySelectorAll('.inbox-review-item[data-drive-id]').forEach(card=>{
      const buttons=[...card.querySelectorAll('.inbox-review-actions button')];
      const keep=buttons.find(b=>(b.getAttribute('onclick')||'').includes('auraKeepInboxFile'));
      if(keep&&keep.dataset.auraRejectPatched!=='1'){
        keep.dataset.auraRejectPatched='1';
        keep.textContent='Từ chối';
        keep.classList.add('inbox-reject-btn');
        keep.setAttribute('onclick',`auraRejectInboxFile('${card.dataset.driveId}')`);
      }
      const help=card.querySelector('.inbox-review-help');
      const helpText=`Sau khi Duyệt hoặc Từ chối, tài liệu sẽ rời hàng chờ. File bị từ chối được chuyển vào ${REJECTED_FOLDER_NAME}, không nằm lẫn trong 00_INBOX.`;
      if(help&&help.textContent!==helpText)help.textContent=helpText;
    });

    const approved=document.querySelector('.inbox-approved-section');
    if(approved)approved.remove();
  }

  migrate();

  const baseUpload=window.auraUploadInboxFiles;
  if(baseUpload)window.auraUploadInboxFiles=async function(){
    const out=await baseUpload();clearUploadInput();
    setTimeout(()=>{clearUploadInput();decorate()},0);return out;
  };

  const baseApprove=window.auraApproveInboxFile;
  if(baseApprove)window.auraApproveInboxFile=async function(fileId){
    const before=queue().find(x=>x.driveFileId===fileId);const out=await baseApprove(fileId);
    const after=queue().find(x=>x.driveFileId===fileId);
    if(after?.status==='APPROVED'){
      recordDecision({...before,...after},'APPROVED',{destinationId:after.destinationId||'',destinationName:after.destinationName||''});
      removePending(fileId);if(typeof window.auraAdminInbox==='function')window.auraAdminInbox();
    }
    setTimeout(decorate,0);return out;
  };

  window.auraRejectInboxFile=async function(fileId){
    const item=queue().find(x=>x.driveFileId===fileId);if(!item)return;
    const card=document.querySelector(`.inbox-review-item[data-drive-id="${CSS.escape(fileId)}"]`);
    const note=card?.querySelector('.inbox-admin-note')?.value?.trim()||'';
    if(!confirm(`Từ chối “${item.name}”?\n\nTài liệu sẽ rời hàng chờ và được chuyển vào 00_INBOX/${REJECTED_FOLDER_NAME}. File gốc không bị xóa.`))return;
    try{
      const result=await markRejected(item,note);
      recordDecision(item,'REJECTED',{...result,adminNote:note});removePending(fileId);
      if(typeof window.auraAdminInbox==='function')window.auraAdminInbox();setTimeout(decorate,0);
    }catch(e){alert('Chưa thể từ chối tài liệu: '+(e?.message||e))}
  };

  const observer=new MutationObserver(decorate);
  observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  setTimeout(decorate,0);
})();
