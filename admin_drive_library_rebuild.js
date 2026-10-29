/* AURA STUDY — rebuild local approved-library index from Drive appProperties */
(function(){
  if(!document.body.classList.contains('admin-shell'))return;
  const CFG=window.AURA_GOOGLE_DRIVE_CONFIG||{};
  const LIBRARY_KEY='aura_library_index_v1';
  const DECISION_KEY='aura_inbox_decisions_v1';
  const VERSION='drive-rebuild-r1';
  let accessToken='',expiresAt=0,tokenClient=null,tokenPromise=null;
  const parse=(k,f)=>{try{const x=JSON.parse(localStorage.getItem(k)||JSON.stringify(f));return x??f}catch(_){return f}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const now=()=>new Date().toISOString();
  const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));

  function loadGsi(){
    if(window.google?.accounts?.oauth2)return Promise.resolve();
    const existing=document.getElementById('aura-google-gsi');
    if(existing)return new Promise((resolve,reject)=>{const ok=()=>resolve();existing.addEventListener('load',ok,{once:true});existing.addEventListener('error',reject,{once:true});setTimeout(()=>{if(window.google?.accounts?.oauth2)resolve()},0)});
    return new Promise((resolve,reject)=>{const s=document.createElement('script');s.id='aura-google-gsi';s.src='https://accounts.google.com/gsi/client';s.async=true;s.defer=true;s.onload=resolve;s.onerror=()=>reject(new Error('Không tải được Google Identity Services.'));document.head.appendChild(s)});
  }
  function tokenValid(){return accessToken&&Date.now()<expiresAt-30000}
  async function getToken(interactive=true){
    if(tokenValid())return accessToken;if(tokenPromise)return tokenPromise;await loadGsi();
    if(!CFG.clientId)throw new Error('Thiếu Google OAuth Client ID.');
    if(!tokenClient)tokenClient=google.accounts.oauth2.initTokenClient({client_id:CFG.clientId,scope:CFG.scope||'https://www.googleapis.com/auth/drive.file',callback:()=>{}});
    tokenPromise=new Promise((resolve,reject)=>{tokenClient.callback=r=>{if(r?.error)return reject(new Error(r.error_description||r.error));accessToken=r.access_token||'';expiresAt=Date.now()+Math.max(60,Number(r.expires_in||3600)-60)*1000;resolve(accessToken)};tokenClient.error_callback=e=>reject(new Error(e?.message||e?.type||'Không thể xác thực Google Drive.'));tokenClient.requestAccessToken({prompt:interactive?'select_account':''})}).finally(()=>{tokenPromise=null});
    return tokenPromise;
  }
  async function driveJson(url,interactive=false){
    const token=await getToken(interactive),res=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});
    if(res.status===401){accessToken='';expiresAt=0;return driveJson(url,true)}
    if(!res.ok){let msg=`Google Drive trả lỗi ${res.status}`;try{const d=await res.json();msg=d?.error?.message||msg}catch(_){ }throw new Error(msg)}
    return res.json();
  }
  async function approvedFiles(){
    const out=[];let pageToken='';
    do{
      const q="trashed=false and appProperties has { key='auraState' and value='APPROVED' }";
      const fields='nextPageToken,files(id,name,mimeType,size,webViewLink,modifiedTime,parents,appProperties)';
      const params=new URLSearchParams({q,spaces:'drive',pageSize:'1000',fields});if(pageToken)params.set('pageToken',pageToken);
      const d=await driveJson(`https://www.googleapis.com/drive/v3/files?${params.toString()}`,out.length===0);
      out.push(...(d.files||[]));pageToken=d.nextPageToken||'';
    }while(pageToken);
    return out;
  }
  function entryFromDrive(f){
    const p=f.appProperties||{},subject=p.auraAssignedSubject||p.auraAdminSubject||'',docType=p.auraAssignedDocType||p.auraAdminDocType||'',period=p.auraAssignedPeriod||p.auraAdminPeriod||'';
    if(!f.id||!subject||!docType)return null;
    return {driveFileId:f.id,name:f.name||'Tài liệu',mimeType:f.mimeType||'',size:Number(f.size||0),webViewLink:f.webViewLink||`https://drive.google.com/open?id=${encodeURIComponent(f.id)}`,subject,docType,period,adminNote:p.auraAdminNote||'',destinationId:Array.isArray(f.parents)?(f.parents[0]||''):'',destinationName:p.auraDestinationName||'',approvedAt:p.auraApprovedAt||f.modifiedTime||'',publishedAt:now(),status:'ACTIVE',source:'DRIVE_APPROVED_REBUILD',sha256:p.auraSha256||'',qualityAudit:p.auraQualityStatus?{status:p.auraQualityStatus,version:p.auraQualityVersion||''}:null,driveMetadataVersion:VERSION};
  }
  function mergeDecision(entry){
    const ds=parse(DECISION_KEY,[]);if(!Array.isArray(ds))return entry;const d=ds.find(x=>x?.driveFileId===entry.driveFileId&&x.status==='APPROVED');
    if(!d)return entry;return {...entry,auraSuggestion:d.auraSuggestion||null,adminConfirmation:d.adminConfirmation||null,qualityAudit:d.qualityAudit||entry.qualityAudit||null,duplicateAudit:d.duplicateAudit||null,sha256:d.sha256||entry.sha256||''};
  }
  function rebuildLocal(files){
    const existing=parse(LIBRARY_KEY,[]),rows=Array.isArray(existing)?existing:[],byId=new Map(rows.filter(x=>x?.driveFileId).map(x=>[x.driveFileId,x]));let imported=0,updated=0,skipped=0;
    for(const f of files){let e=entryFromDrive(f);if(!e){skipped++;continue}e=mergeDecision(e);const old=byId.get(e.driveFileId);if(old){byId.set(e.driveFileId,{...old,...e,status:'ACTIVE'});updated++}else{byId.set(e.driveFileId,e);imported++}}
    const next=[...byId.values()].filter(x=>x&&x.status!=='REMOVED').sort((a,b)=>String(b.approvedAt||b.publishedAt||'').localeCompare(String(a.approvedAt||a.publishedAt||''))).slice(0,1000);write(LIBRARY_KEY,next);write('aura_library_rebuild_last_v1',{at:now(),found:files.length,imported,updated,skipped,version:VERSION});return {found:files.length,imported,updated,skipped,total:next.length};
  }
  function button(){
    if(document.body.dataset.auraPage!=='inbox')return;const head=document.querySelector('.inbox-admin-head');if(!head||head.querySelector('[data-drive-rebuild]'))return;
    const b=document.createElement('button');b.type='button';b.className='btn soft';b.dataset.driveRebuild='1';b.textContent='Đồng bộ thư viện từ Drive';b.onclick=window.auraRebuildLibraryFromDrive;head.appendChild(b);
  }
  function toast(text,ok=true){const n=document.createElement('div');n.style.cssText='position:fixed;right:18px;bottom:18px;z-index:99999;max-width:420px;padding:13px 16px;border-radius:12px;background:'+(ok?'#173b2f':'#7a271a')+';color:#fff;font-weight:700;box-shadow:0 12px 35px rgba(0,0,0,.2)';n.textContent=text;document.body.appendChild(n);setTimeout(()=>n.remove(),5000)}
  window.auraRebuildLibraryFromDrive=async function(){
    const btn=document.querySelector('[data-drive-rebuild]');if(btn?.disabled)return;if(btn){btn.disabled=true;btn.textContent='Đang đồng bộ…'}
    try{const files=await approvedFiles(),r=rebuildLocal(files);toast(`Đã đồng bộ ${r.found} file APPROVED từ Drive · thêm ${r.imported} · cập nhật ${r.updated}${r.skipped?` · bỏ qua ${r.skipped} file thiếu metadata`:''}.`);if(typeof window.AURA_LIBRARY_INDEX?.recover==='function')window.AURA_LIBRARY_INDEX.recover()}
    catch(e){toast('Chưa thể đồng bộ thư viện: '+(e?.message||e),false)}
    finally{if(btn?.isConnected){btn.disabled=false;btn.textContent='Đồng bộ thư viện từ Drive'}}
  };
  function init(){button();const app=document.getElementById('app');if(app)new MutationObserver(()=>{if(document.body.dataset.auraPage==='inbox')button()}).observe(app,{childList:true,subtree:false})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
