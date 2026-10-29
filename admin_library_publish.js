/* AURA STUDY — publish approved INBOX files into shared web library index */
(function(){
  if(!document.body.classList.contains('admin-shell'))return;
  const QUEUE_KEY='aura_inbox_queue_v1';
  const DECISION_KEY='aura_inbox_decisions_v1';
  const LIBRARY_KEY='aura_library_index_v1';
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(_){return f}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const queue=()=>{const x=read(QUEUE_KEY,[]);return Array.isArray(x)?x:[]};
  const decisions=()=>{const x=read(DECISION_KEY,[]);return Array.isArray(x)?x:[]};
  const library=()=>{const x=read(LIBRARY_KEY,[]);return Array.isArray(x)?x:[]};
  const now=()=>new Date().toISOString();

  function adminSnapshot(fileId){
    const card=document.querySelector(`.inbox-review-item[data-drive-id="${CSS.escape(fileId)}"]`);
    return {
      subject:card?.querySelector('.inbox-subject')?.value||'',
      docType:card?.querySelector('.inbox-doctype')?.value||'',
      period:card?.querySelector('.inbox-period')?.value||'',
      note:card?.querySelector('.inbox-admin-note')?.value?.trim()||''
    };
  }
  function publish(item,admin){
    if(!item?.driveFileId||!admin?.subject)return;
    const decision=decisions().find(x=>x.driveFileId===item.driveFileId&&x.status==='APPROVED')||{};
    const rows=library(),i=rows.findIndex(x=>x.driveFileId===item.driveFileId);
    const entry={
      driveFileId:item.driveFileId,
      name:item.name||decision.name||'Tài liệu',
      mimeType:item.mimeType||'',size:Number(item.size||decision.size||0),
      webViewLink:item.webViewLink||decision.webViewLink||'',
      subject:admin.subject||decision.adminConfirmation?.subject||decision.subject||'',
      docType:admin.docType||decision.adminConfirmation?.docType||decision.docType||'',
      period:admin.period||decision.adminConfirmation?.period||decision.period||'',
      adminNote:admin.note||decision.adminConfirmation?.note||'',
      destinationId:decision.destinationId||item.destinationId||'',
      destinationName:decision.destinationName||item.destinationName||'',
      approvedAt:decision.decidedAt||item.approvedAt||now(),
      publishedAt:now(),status:'ACTIVE',source:'ADMIN_APPROVED_INBOX',
      auraSuggestion:decision.auraSuggestion||null,
      adminConfirmation:decision.adminConfirmation||{status:'APPROVED',subject:admin.subject,docType:admin.docType,period:admin.period,note:admin.note},
      qualityAudit:decision.qualityAudit||item.qualityAudit||null,
      sha256:decision.sha256||item.sha256||''
    };
    if(i>=0)rows[i]={...rows[i],...entry};else rows.unshift(entry);
    write(LIBRARY_KEY,rows.filter(x=>x&&x.status!=='REMOVED').slice(0,1000));
  }

  const base=window.auraApproveInboxFile;
  if(base)window.auraApproveInboxFile=async function(fileId){
    const item=queue().find(x=>x.driveFileId===fileId);if(!item)return base(fileId);
    const admin=adminSnapshot(fileId);
    const out=await base(fileId);
    const stillPending=queue().some(x=>x.driveFileId===fileId);
    const approved=decisions().some(x=>x.driveFileId===fileId&&x.status==='APPROVED');
    if(!stillPending&&approved)publish(item,admin);
    return out;
  };
  window.AURA_LIBRARY_INDEX={key:LIBRARY_KEY,read:library};
})();