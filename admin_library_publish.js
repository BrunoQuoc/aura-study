/* AURA STUDY — publish approved INBOX files into shared web library index */
(function(){
  if(!document.body.classList.contains('admin-shell'))return;
  const QUEUE_KEY='aura_inbox_queue_v1',DECISION_KEY='aura_inbox_decisions_v1',LIBRARY_KEY='aura_library_index_v1';
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(_){return f}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const queue=()=>{const x=read(QUEUE_KEY,[]);return Array.isArray(x)?x:[]};
  const decisions=()=>{const x=read(DECISION_KEY,[]);return Array.isArray(x)?x:[]};
  const library=()=>{const x=read(LIBRARY_KEY,[]);return Array.isArray(x)?x:[]};
  const now=()=>new Date().toISOString();
  function adminSnapshot(fileId){const card=document.querySelector(`.inbox-review-item[data-drive-id="${CSS.escape(fileId)}"]`);return{subject:card?.querySelector('.inbox-subject')?.value||'',docType:card?.querySelector('.inbox-doctype')?.value||'',period:card?.querySelector('.inbox-period')?.value||'',note:card?.querySelector('.inbox-admin-note')?.value?.trim()||''}}
  function normalize(item={},admin={}){
    const c=item.adminConfirmation||{};
    return {driveFileId:item.driveFileId||'',name:item.name||'Tài liệu',mimeType:item.mimeType||'',size:Number(item.size||0),webViewLink:item.webViewLink||'',subject:admin.subject||c.subject||item.subject||'',docType:admin.docType||c.docType||item.docType||'',period:admin.period||c.period||item.period||'',adminNote:admin.note||c.note||item.adminNote||'',destinationId:item.destinationId||'',destinationName:item.destinationName||'',approvedAt:item.decidedAt||item.approvedAt||now(),publishedAt:now(),status:'ACTIVE',source:'ADMIN_APPROVED_INBOX',auraSuggestion:item.auraSuggestion||null,adminConfirmation:item.adminConfirmation||{status:'APPROVED',subject:admin.subject||item.subject||'',docType:admin.docType||item.docType||'',period:admin.period||item.period||'',note:admin.note||item.adminNote||''},qualityAudit:item.qualityAudit||null,sha256:item.sha256||''};
  }
  function publish(item,admin={}){const entry=normalize(item,admin);if(!entry.driveFileId||!entry.subject)return false;const rows=library(),i=rows.findIndex(x=>x.driveFileId===entry.driveFileId);if(i>=0)rows[i]={...rows[i],...entry};else rows.unshift(entry);write(LIBRARY_KEY,rows.filter(x=>x&&x.status!=='REMOVED').slice(0,1000));return true}
  function recover(){const known=new Set(library().map(x=>x.driveFileId));decisions().filter(x=>x?.status==='APPROVED'&&x.driveFileId&&!known.has(x.driveFileId)).forEach(x=>publish(x,{}))}
  function install(){
    if(window.__auraLibraryPublisherInstalled){recover();return}
    const base=window.auraApproveInboxFile;if(typeof base!=='function'){setTimeout(install,100);return}
    window.__auraLibraryPublisherInstalled=true;
    const wrapped=async function(fileId){const item=queue().find(x=>x.driveFileId===fileId)||{};const admin=adminSnapshot(fileId),out=await base.apply(this,arguments),decision=decisions().find(x=>x.driveFileId===fileId&&x.status==='APPROVED');if(decision)publish({...item,...decision},admin);return out};
    wrapped.__auraLibraryPublishWrapped=true;window.auraApproveInboxFile=wrapped;recover();window.AURA_LIBRARY_INDEX={key:LIBRARY_KEY,read:library,recover};
  }
  if(document.readyState==='complete')setTimeout(install,0);else window.addEventListener('load',()=>setTimeout(install,0),{once:true});
  window.addEventListener('focus',recover);
})();