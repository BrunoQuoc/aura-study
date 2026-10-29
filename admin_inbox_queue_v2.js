/* AURA STUDY — pending-only INBOX queue behavior */
(function(){
  if(!document.body.classList.contains('admin-shell'))return;
  const CFG=window.AURA_GOOGLE_DRIVE_CONFIG||{};
  const QUEUE_KEY='aura_inbox_queue_v1';
  const DECISION_KEY='aura_inbox_decisions_v1';
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(_){return f}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
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
  async function markRejected(item,note){
    const t=await accessToken(),rejectedAt=now();
    const appProperties={auraState:'REJECTED',auraOrigin:'ADMIN_DEVICE_UPLOAD',auraUploadedAt:item.uploadedAt||'',auraRejectedAt:rejectedAt,auraAdminNote:String(note||'').slice(0,500)};
    const res=await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(item.driveFileId)}?fields=id,appProperties`,{method:'PATCH',headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:JSON.stringify({appProperties})});
    if(!res.ok){let msg=`Google Drive trả lỗi ${res.status}`;try{const d=await res.json();msg=d?.error?.message||msg}catch(_){ }throw new Error(msg)}
    return rejectedAt;
  }

  function decorate(){
    if(document.body.dataset.auraPage!=='inbox')return;
    const summary=document.querySelector('.inbox-summary article:last-child small');if(summary)summary.textContent='Chỉ hiển thị tài liệu đang chờ xử lý';
    document.querySelectorAll('.inbox-review-item[data-drive-id]').forEach(card=>{
      const buttons=[...card.querySelectorAll('.inbox-review-actions button')];
      const keep=buttons.find(b=>(b.getAttribute('onclick')||'').includes('auraKeepInboxFile'));
      if(keep){keep.textContent='Từ chối';keep.classList.add('inbox-reject-btn');keep.setAttribute('onclick',`auraRejectInboxFile('${card.dataset.driveId}')`)}
      const help=card.querySelector('.inbox-review-help');if(help)help.textContent='Sau khi Duyệt hoặc Từ chối, tài liệu sẽ rời hàng chờ. Từ chối không xóa file gốc khỏi Google Drive.';
    });
    document.querySelector('.inbox-approved-section')?.remove();
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
    if(!confirm(`Từ chối “${item.name}”?\n\nTài liệu sẽ mất khỏi hàng chờ AURA nhưng file gốc vẫn được giữ trong 00_INBOX.`))return;
    try{
      const rejectedAt=await markRejected(item,note);
      recordDecision(item,'REJECTED',{rejectedAt,adminNote:note});removePending(fileId);
      if(typeof window.auraAdminInbox==='function')window.auraAdminInbox();setTimeout(decorate,0);
    }catch(e){alert('Chưa thể từ chối tài liệu: '+(e?.message||e))}
  };

  const observer=new MutationObserver(()=>decorate());observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  setTimeout(decorate,0);
})();
