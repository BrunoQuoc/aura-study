/* AURA STUDY — final bridge between explicit Admin connect action and shared Drive auth core. */
(function(){
  if(!document.body.classList.contains('admin-shell'))return;
  const baseConnect=window.auraConnectDrive;
  if(typeof baseConnect==='function'){
    window.auraConnectDrive=async function(){
      try{window.AURA_DRIVE_AUTH?.clear?.();await window.AURA_DRIVE_AUTH?.ensure?.()}catch(_){ }
      return baseConnect();
    };
  }
  function decorate(){
    if(document.body.dataset.auraPage!=='inbox')return;
    const auth=window.AURA_DRIVE_AUTH?.status?.();
    if(!auth?.connected)return;
    const summary=document.querySelector('.inbox-summary article:first-child strong');
    if(summary)summary.textContent='ĐÃ KẾT NỐI';
  }
  const app=document.getElementById('app');if(app)new MutationObserver(decorate).observe(app,{childList:true,subtree:true});
  setTimeout(decorate,0);
})();
