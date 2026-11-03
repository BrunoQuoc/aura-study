/* AURA STUDY — final Admin library publish guard.
   Ensures every successful APPROVED decision is present in the shared local library index. */
(function(){
  if(!document.body.classList.contains('admin-shell'))return;
  const QUEUE_KEY='aura_inbox_queue_v1',DECISION_KEY='aura_inbox_decisions_v1',LIBRARY_KEY='aura_library_index_v1';
  const read=(k,f)=>{try{const x=JSON.parse(localStorage.getItem(k)||JSON.stringify(f));return x??f}catch(_){return f}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const now=()=>new Date().toISOString();
  const queue=()=>{const x=read(QUEUE_KEY,[]);return Array.isArray(x)?x:[]};
  const decisions=()=>{const x=read(DECISION_KEY,[]);return Array.isArray(x)?x:[]};
  const library=()=>{const x=read(LIBRARY_KEY,[]);return Array.isArray(x)?x:[]};
  function snapshot(fileId){
    const card=document.querySelector(`.inbox-review-item[data-drive-id="${CSS.escape(fileId)}"]`);
    return {subject:card?.querySelector('.inbox-subject')?.value||'',docType:card?.querySelector('.inbox-doctype')?.value||'',period:card?.querySelector('.inbox-period')?.value||'',note:card?.querySelector('.inbox-admin-note')?.value?.trim()||''};
  }
  function normalize(src={},admin={}){
    const c=src.adminConfirmation||{};
    return {driveFileId:src.driveFileId||'',name:src.name||'Tài liệu',mimeType:src.mimeType||'',size:Number(src.size||0),webViewLink:src.webViewLink||'',subject:admin.subject||c.subject||src.subject||'',docType:admin.docType||c.docType||src.docType||'',period:admin.period||c.period||src.period||'',adminNote:admin.note||c.note||src.adminNote||'',destinationId:src.destinationId||'',destinationName:src.destinationName||'',destinationPath:src.destinationPath||'',approvedAt:src.decidedAt||src.approvedAt||now(),publishedAt:now(),status:'ACTIVE',source:'ADMIN_APPROVED_FINAL',auraSuggestion:src.auraSuggestion||null,adminConfirmation:src.adminConfirmation||{status:'APPROVED',subject:admin.subject||src.subject||'',docType:admin.docType||src.docType||'',period:admin.period||src.period||'',note:admin.note||src.adminNote||''},qualityAudit:src.qualityAudit||null,duplicateAudit:src.duplicateAudit||null,sha256:src.sha256||''};
  }
  function publish(src,admin={}){
    const entry=normalize(src,admin);if(!entry.driveFileId||!entry.subject||!entry.docType)return false;
    const rows=library(),i=rows.findIndex(x=>x?.driveFileId===entry.driveFileId);
    if(i>=0)rows[i]={...rows[i],...entry,status:'ACTIVE'};else rows.unshift(entry);
    write(LIBRARY_KEY,rows.filter(x=>x&&x.status!=='REMOVED').slice(0,1000));return true;
  }
  function recover(){
    const rows=library(),known=new Set(rows.map(x=>x?.driveFileId).filter(Boolean));
    let changed=false;
    decisions().filter(x=>x?.status==='APPROVED'&&x.driveFileId).forEach(d=>{if(!known.has(d.driveFileId)){if(publish(d,{})){known.add(d.driveFileId);changed=true}}});
    return changed;
  }
  function install(){
    if(window.__auraFinalLibraryPublishPatchInstalled)return;
    const base=window.auraApproveInboxFile;if(typeof base!=='function'){setTimeout(install,100);return}
    window.__auraFinalLibraryPublishPatchInstalled=true;
    window.auraApproveInboxFile=async function(fileId){
      const before=queue().find(x=>x?.driveFileId===fileId)||{};const admin=snapshot(fileId);
      const out=await base.apply(this,arguments);
      const decision=decisions().find(x=>x?.driveFileId===fileId&&x.status==='APPROVED');
      if(decision)publish({...before,...decision},admin);
      else if(before.driveFileId&&!queue().some(x=>x?.driveFileId===fileId))publish(before,admin);
      return out;
    };
    recover();
    window.AURA_LIBRARY_INDEX=window.AURA_LIBRARY_INDEX||{};
    window.AURA_LIBRARY_INDEX.read=library;window.AURA_LIBRARY_INDEX.recover=recover;window.AURA_LIBRARY_INDEX.key=LIBRARY_KEY;
  }
  if(document.readyState==='complete')install();else window.addEventListener('load',install,{once:true});
  window.addEventListener('focus',recover);
})();