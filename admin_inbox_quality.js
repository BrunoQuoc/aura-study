/* AURA STUDY — quality audit, SHA-256 duplicate detection, AURA-vs-Admin snapshots */
(function(){
  if(!document.body.classList.contains('admin-shell'))return;
  const CFG=window.AURA_GOOGLE_DRIVE_CONFIG||{};
  const QUEUE_KEY='aura_inbox_queue_v1';
  const PRED_KEY='aura_inbox_predictions_v1';
  const DECISION_KEY='aura_inbox_decisions_v1';
  const INDEX_KEY='aura_inbox_file_index_v1';
  const VERSION='1.0.0';
  const state={files:[],audits:[],promise:null,current:-1};
  let token='',tokenExpiresAt=0,tokenClient=null,tokenPromise=null;

  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(_){return f}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const queue=()=>{const q=read(QUEUE_KEY,[]);return Array.isArray(q)?q:[]};
  const saveQueue=q=>write(QUEUE_KEY,(Array.isArray(q)?q:[]).slice(0,300));
  const decisions=()=>{const q=read(DECISION_KEY,[]);return Array.isArray(q)?q:[]};
  const index=()=>{const x=read(INDEX_KEY,{});return x&&typeof x==='object'?x:{}};
  const fp=f=>`${f.name}::${f.size}::${f.lastModified||0}`;
  const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const now=()=>new Date().toISOString();

  async function sha256(file){
    const buf=await file.arrayBuffer();
    const digest=await crypto.subtle.digest('SHA-256',buf);
    return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  async function imageMeta(file){
    if(!(file.type||'').startsWith('image/'))return null;
    try{const bmp=await createImageBitmap(file);const m={width:bmp.width,height:bmp.height};bmp.close?.();return m}catch(_){return null}
  }
  async function waitPrediction(file,timeout=60000){
    const key=fp(file),start=Date.now();
    while(Date.now()-start<timeout){
      const p=read(PRED_KEY,{})?.[key];if(p)return p;
      await new Promise(r=>setTimeout(r,250));
    }
    return null;
  }
  function localDuplicate(file,hash){
    const idx=index();if(idx[hash])return {kind:'exact',source:'local-index',match:idx[hash]};
    const q=queue().find(x=>x.sha256===hash);if(q)return {kind:'exact',source:'queue',match:q};
    const d=decisions().find(x=>x.sha256===hash);if(d)return {kind:'exact',source:'decision-history',match:d};
    const sameQ=queue().find(x=>String(x.name||'').toLowerCase()===file.name.toLowerCase()&&Number(x.size||0)===Number(file.size||0));
    if(sameQ)return {kind:'possible',source:'name-size',match:sameQ};
    const sameD=decisions().find(x=>String(x.name||'').toLowerCase()===file.name.toLowerCase()&&Number(x.size||0)===Number(file.size||0));
    if(sameD)return {kind:'possible',source:'name-size',match:sameD};
    return {kind:'none'};
  }
  function quality(file,p,img){
    const checks=[];const source=String(p?.analysisSource||'');const sample=String(p?.textSample||'');const body=norm(sample);const type=p?.docType||'';
    if(file.size===0)checks.push({level:'block',code:'EMPTY',text:'File rỗng (0 byte).'});
    else if(file.size<400)checks.push({level:'warn',code:'VERY_SMALL',text:'File rất nhỏ; cần kiểm tra có đầy đủ nội dung hay không.'});
    else checks.push({level:'pass',code:'HAS_DATA',text:'File có dữ liệu.'});

    const unreadable=/chua doc|khong doc|dung ten file|khong kha dung|chua ocr/i.test(norm(source));
    if(unreadable)checks.push({level:'warn',code:'CONTENT_WEAK',text:'AURA chưa đọc được nội dung đủ chắc; phân loại chủ yếu dựa trên tên file.'});
    else if(body.length>=80)checks.push({level:'pass',code:'CONTENT_READABLE',text:'AURA đọc được nội dung để đối chiếu.'});
    else checks.push({level:'warn',code:'CONTENT_SHORT',text:'Nội dung đọc được còn ít; cần Admin mở file kiểm tra.'});

    if(img){
      if(Math.min(img.width,img.height)<700)checks.push({level:'warn',code:'LOW_RES',text:`Ảnh ${img.width}×${img.height}px; độ phân giải có thể thấp cho OCR.`});
      else checks.push({level:'pass',code:'IMAGE_RES',text:`Ảnh ${img.width}×${img.height}px.`});
    }

    let answerStatus='not_applicable';
    if(type==='exam'||type==='practice'){
      const hasAnswer=/(dap an|loi giai|huong dan giai|answer key|solution)/.test(body);
      answerStatus=hasAnswer?'found':'not_seen';
      checks.push(hasAnswer?{level:'pass',code:'ANSWER_FOUND',text:'Có dấu hiệu đáp án/lời giải trong phần nội dung AURA đọc được.'}:{level:'warn',code:'ANSWER_NOT_SEEN',text:'Chưa thấy đáp án/lời giải trong phần nội dung AURA đọc được; chưa kết luận là tài liệu không có.'});
    }else if(type==='solution'||type==='answer_key')answerStatus='found';

    const status=checks.some(x=>x.level==='block')?'blocked':checks.some(x=>x.level==='warn')?'review':'good';
    return {version:VERSION,status,checks,answerStatus,image:img||null,source,textLength:sample.length,checkedAt:now()};
  }
  async function auditFile(file){
    state.current=state.files.indexOf(file);decorateSelected();
    const [hash,img,p]=await Promise.all([sha256(file),imageMeta(file),waitPrediction(file)]);
    const dup=localDuplicate(file,hash);const q=quality(file,p,img);
    return {fingerprint:fp(file),name:file.name,size:file.size,sha256:hash,prediction:p||null,quality:q,duplicate:dup};
  }
  async function auditFiles(files){const out=[];for(const f of files){out.push(await auditFile(f));decorateSelected()}state.current=-1;decorateSelected();return out}

  function ensureGsi(){
    if(window.google?.accounts?.oauth2)return Promise.resolve();
    return new Promise((resolve,reject)=>{let s=document.getElementById('aura-google-gsi');if(s){s.addEventListener('load',resolve,{once:true});s.addEventListener('error',reject,{once:true});return}s=document.createElement('script');s.id='aura-google-gsi';s.src='https://accounts.google.com/gsi/client';s.async=true;s.defer=true;s.onload=resolve;s.onerror=()=>reject(new Error('Không tải được Google Identity Services.'));document.head.appendChild(s)})
  }
  async function accessToken(){
    if(token&&Date.now()<tokenExpiresAt-30000)return token;if(tokenPromise)return tokenPromise;await ensureGsi();
    if(!CFG.clientId)throw new Error('Thiếu Google OAuth Client ID.');
    if(!tokenClient)tokenClient=google.accounts.oauth2.initTokenClient({client_id:CFG.clientId,scope:CFG.scope||'https://www.googleapis.com/auth/drive.file',callback:()=>{}});
    tokenPromise=new Promise((resolve,reject)=>{tokenClient.callback=r=>{if(r?.error)return reject(new Error(r.error_description||r.error));token=r.access_token||'';tokenExpiresAt=Date.now()+Math.max(60,Number(r.expires_in||3600)-60)*1000;resolve(token)};tokenClient.error_callback=e=>reject(new Error(e?.message||e?.type||'Không thể lấy quyền Google Drive.'));tokenClient.requestAccessToken({prompt:''})}).finally(()=>{tokenPromise=null});
    return tokenPromise;
  }
  async function driveJson(url,options={}){
    const t=await accessToken(),headers=new Headers(options.headers||{});headers.set('Authorization',`Bearer ${t}`);const res=await fetch(url,{...options,headers});
    if(!res.ok){let msg=`Google Drive trả lỗi ${res.status}`;try{const d=await res.json();msg=d?.error?.message||msg}catch(_){ }throw new Error(msg)}return res.status===204?{}:res.json();
  }
  async function driveDuplicate(hash){
    const q=`appProperties has { key='auraSha256' and value='${hash}' } and trashed = false`;
    const fields='files(id,name,size,webViewLink,appProperties,modifiedTime)';
    const d=await driveJson(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=10&fields=${encodeURIComponent(fields)}`);
    return (d.files||[])[0]||null;
  }
  async function mergeDriveProps(fileId,extra){
    const cur=await driveJson(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=appProperties`);
    const appProperties={...(cur.appProperties||{}),...extra};
    return driveJson(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,appProperties`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({appProperties})});
  }

  function qualityLabel(s){return s==='good'?'Đạt sơ bộ':s==='blocked'?'Có lỗi chặn':'Cần Admin kiểm tra'}
  function duplicateLabel(d){return d?.kind==='exact'?'Trùng chính xác':d?.kind==='possible'?'Có khả năng trùng':'Chưa thấy trùng'}
  function selectedAuditHTML(a,i){
    if(!a)return `<div class="aura-quality-row"><div><b>${esc(state.files[i]?.name||'')}</b><small>${state.current===i?'Đang kiểm tra SHA-256 và chất lượng…':'Đang chờ kiểm tra'}</small></div><div class="aq-badges"><span class="aq-badge pending">Đang kiểm tra</span></div></div>`;
    return `<div class="aura-quality-row"><div><b>${esc(a.name)}</b><small>SHA-256: ${esc(a.sha256.slice(0,12))}… · ${esc(a.quality.source||'')}</small></div><div class="aq-badges"><span class="aq-badge ${esc(a.quality.status)}">${esc(qualityLabel(a.quality.status))}</span><span class="aq-badge ${a.duplicate.kind==='exact'?'duplicate':a.duplicate.kind==='possible'?'review':'good'}">${esc(duplicateLabel(a.duplicate))}</span></div></div>`;
  }
  function decorateSelected(){
    if(document.body.dataset.auraPage!=='inbox')return;const anchor=document.querySelector('.aura-selected-analysis')||document.querySelector('.inbox-local-list');if(!anchor)return;
    let box=document.querySelector('.aura-quality-selected');if(!state.files.length){box?.remove();return}if(!box){box=document.createElement('div');box.className='aura-quality-selected';anchor.insertAdjacentElement('afterend',box)}
    const sig=JSON.stringify(state.audits.map(x=>x?`${x.sha256}:${x.quality.status}:${x.duplicate.kind}`:'-'))+`:${state.current}:${state.files.map(fp).join('|')}`;if(box.dataset.sig===sig)return;box.dataset.sig=sig;box.innerHTML=`<span>AURA KIỂM TRA CHẤT LƯỢNG & TRÙNG</span>${state.files.map((_,i)=>selectedAuditHTML(state.audits[i],i)).join('')}`;
  }
  function qualityCard(item){
    const q=item.qualityAudit;if(!q)return '';
    const checks=(q.checks||[]).map(x=>`<li class="${x.level==='block'?'block':x.level==='warn'?'warn':''}">${esc(x.text)}</li>`).join('');
    const dup=item.duplicateAudit||{kind:'none'};
    return `<div class="aura-quality-card ${esc(q.status||'review')}"><span class="aq-kicker">AURA KIỂM TRA CHẤT LƯỢNG</span><div class="aq-badges" style="justify-content:flex-start"><span class="aq-badge ${esc(q.status||'review')}">${esc(qualityLabel(q.status))}</span><span class="aq-badge ${dup.kind==='exact'?'duplicate':dup.kind==='possible'?'review':'good'}">${esc(duplicateLabel(dup))}</span>${q.answerStatus==='found'?'<span class="aq-badge good">Thấy dấu hiệu đáp án/lời giải</span>':q.answerStatus==='not_seen'?'<span class="aq-badge review">Chưa thấy đáp án/lời giải</span>':''}</div><ul class="aq-checks">${checks}</ul><div class="aq-meta">SHA-256: ${esc(String(item.sha256||'').slice(0,16))}${item.sha256?'…':''} · kiểm tra ${esc(q.checkedAt||'')}</div>${dup.kind!=='none'?`<div class="aq-duplicate-note">${dup.kind==='exact'?'Nội dung file trùng chính xác với tài liệu AURA đã biết.':'Tên và dung lượng trùng với tài liệu đã biết; cần Admin đối chiếu.'}</div>`:''}</div>`;
  }
  function decorateCards(){
    if(document.body.dataset.auraPage!=='inbox')return;const rows=queue();document.querySelectorAll('.inbox-review-item[data-drive-id]').forEach(card=>{const item=rows.find(x=>x.driveFileId===card.dataset.driveId);if(!item)return;const html=qualityCard(item);let box=card.querySelector(':scope > .aura-quality-card');if(!html){box?.remove();return}const sig=`${item.sha256}:${item.qualityAudit?.checkedAt}:${item.duplicateAudit?.kind}`;if(box?.dataset.sig===sig)return;if(!box){const classifier=card.querySelector(':scope > .aura-classifier');box=document.createElement('div');(classifier||card.querySelector('.inbox-file-head'))?.insertAdjacentElement('afterend',box)}box.outerHTML=html.replace('class="aura-quality-card','data-sig="'+esc(sig)+'" class="aura-quality-card')})
  }
  function decorate(){decorateSelected();decorateCards()}

  const baseChoose=window.auraInboxFilesChosen;
  if(baseChoose)window.auraInboxFilesChosen=function(fileList){state.files=Array.from(fileList||[]);state.audits=new Array(state.files.length).fill(null);baseChoose(fileList);state.promise=auditFiles(state.files).then(a=>{state.audits=a;decorate();return a}).catch(()=>[]);decorate()};

  const baseUpload=window.auraUploadInboxFiles;
  if(baseUpload)window.auraUploadInboxFiles=async function(){
    let audits=state.promise?await state.promise:await auditFiles(state.files);if(!state.files.length)return;
    for(const a of audits){if(a.duplicate.kind!=='exact'){try{const d=await driveDuplicate(a.sha256);if(d)a.duplicate={kind:'exact',source:'drive-hash',match:d}}catch(_){}}}
    state.audits=audits;decorate();const exact=audits.filter(a=>a.duplicate.kind==='exact');
    if(exact.length){const names=exact.slice(0,5).map(x=>`• ${x.name}`).join('\n');if(!confirm(`AURA phát hiện ${exact.length} file trùng chính xác theo SHA-256:\n${names}\n\nCác file trùng sẽ KHÔNG được upload. Tiếp tục với các file còn lại?`))return}
    const allowedPairs=state.files.map((f,i)=>({f,a:audits[i]})).filter(x=>x.a?.duplicate.kind!=='exact');if(!allowedPairs.length){alert('Không có file mới để upload sau khi loại các bản trùng chính xác.');return}
    const allowed=allowedPairs.map(x=>x.f),allowedAudits=allowedPairs.map(x=>x.a);if(allowed.length!==state.files.length)baseChoose(allowed);
    const beforeIds=new Set(queue().map(x=>x.driveFileId));const out=await baseUpload();let rows=queue();const fresh=rows.filter(x=>!beforeIds.has(x.driveFileId));const used=new Set(),synced=[];
    for(const a of allowedAudits){const i=fresh.findIndex((r,j)=>!used.has(j)&&r.name===a.name&&Number(r.size||0)===Number(a.size||0));if(i<0)continue;used.add(i);const row=fresh[i],ri=rows.findIndex(x=>x.driveFileId===row.driveFileId);if(ri<0)continue;rows[ri]={...rows[ri],sha256:a.sha256,qualityAudit:a.quality,duplicateAudit:a.duplicate,qualityVersion:VERSION};synced.push({item:rows[ri],audit:a})}
    saveQueue(rows);const idx=index();for(const {item,audit} of synced){idx[audit.sha256]={driveFileId:item.driveFileId,name:item.name,size:item.size,status:'WAITING_REVIEW',updatedAt:now()};try{await mergeDriveProps(item.driveFileId,{auraSha256:audit.sha256,auraQualityStatus:audit.quality.status,auraQualityVersion:VERSION})}catch(_){item.driveMetadataSync='FAILED'}}write(INDEX_KEY,idx);saveQueue(rows);
    const mapped=new Set(synced.map(x=>x.audit.sha256));const failedPairs=allowedPairs.filter(x=>!mapped.has(x.a.sha256));state.files=failedPairs.map(x=>x.f);state.audits=failedPairs.map(x=>x.a);state.promise=null;if(typeof window.auraAdminInbox==='function')window.auraAdminInbox();setTimeout(decorate,0);return out;
  };

  function adminSnapshot(fileId){const card=document.querySelector(`.inbox-review-item[data-drive-id="${CSS.escape(fileId)}"]`);return {subject:card?.querySelector('.inbox-subject')?.value||'',docType:card?.querySelector('.inbox-doctype')?.value||'',period:card?.querySelector('.inbox-period')?.value||'',note:card?.querySelector('.inbox-admin-note')?.value?.trim()||''}}
  function enrichDecision(fileId,status,item,admin,extra={}){const rows=decisions(),i=rows.findIndex(x=>x.driveFileId===fileId&&x.status===status);if(i<0)return;rows[i]={...rows[i],size:item.size||0,sha256:item.sha256||'',auraSuggestion:{subject:item.suggestedSubject||'',docType:item.suggestedDocType||'',period:item.suggestedPeriod||'',confidence:item.classificationConfidence||'',reasons:item.classificationReasons||[],classifierVersion:item.classifierVersion||''},adminConfirmation:{status,subject:admin.subject||'',docType:admin.docType||'',period:admin.period||'',note:admin.note||'',changedFromAura:Boolean((item.suggestedSubject&&admin.subject!==item.suggestedSubject)||(item.suggestedDocType&&admin.docType!==item.suggestedDocType)||(item.suggestedPeriod&&admin.period!==item.suggestedPeriod)),...extra},qualityAudit:item.qualityAudit||null,duplicateAudit:item.duplicateAudit||null,qualityVersion:VERSION};write(DECISION_KEY,rows)}
  async function syncFinalMetadata(fileId,item,admin,status){if(!item?.sha256)return;try{await mergeDriveProps(fileId,{auraSha256:item.sha256,auraQualityStatus:item.qualityAudit?.status||'',auraQualityVersion:VERSION,auraSuggestedSubject:item.suggestedSubject||'',auraSuggestedDocType:item.suggestedDocType||'',auraSuggestedPeriod:item.suggestedPeriod||'',auraAdminSubject:admin.subject||'',auraAdminDocType:admin.docType||'',auraAdminPeriod:admin.period||'',auraAdminDecision:status})}catch(_){}}

  const baseApprove=window.auraApproveInboxFile;
  if(baseApprove)window.auraApproveInboxFile=async function(fileId){const item=queue().find(x=>x.driveFileId===fileId);if(!item)return;const admin=adminSnapshot(fileId);if(item.qualityAudit?.status==='blocked'&&!confirm('AURA phát hiện lỗi chất lượng nghiêm trọng. Admin vẫn muốn duyệt tài liệu này?'))return;if(item.qualityAudit?.status==='review'&&!confirm('AURA đánh dấu tài liệu này cần kiểm tra thêm. Admin vẫn muốn tiếp tục duyệt?'))return;const out=await baseApprove(fileId);if(!queue().find(x=>x.driveFileId===fileId)){const idx=index();if(item.sha256)idx[item.sha256]={driveFileId:fileId,name:item.name,size:item.size,status:'APPROVED',updatedAt:now()};write(INDEX_KEY,idx);enrichDecision(fileId,'APPROVED',item,admin);await syncFinalMetadata(fileId,item,admin,'APPROVED')}return out};

  const baseReject=window.auraRejectInboxFile;
  if(baseReject)window.auraRejectInboxFile=async function(fileId){const item=queue().find(x=>x.driveFileId===fileId);if(!item)return;const admin=adminSnapshot(fileId),out=await baseReject(fileId);if(!queue().find(x=>x.driveFileId===fileId)){const idx=index();if(item.sha256)idx[item.sha256]={driveFileId:fileId,name:item.name,size:item.size,status:'REJECTED',updatedAt:now()};write(INDEX_KEY,idx);enrichDecision(fileId,'REJECTED',item,admin);await syncFinalMetadata(fileId,item,admin,'REJECTED')}return out};

  const observer=new MutationObserver(decorate);observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});setTimeout(decorate,0);
})();
