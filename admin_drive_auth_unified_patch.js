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
    const auth=window.AURA_DRIVE_AUTH?.status?.()||{connected:false};
    const summary=document.querySelector('.inbox-summary article:first-child');
    const strong=summary?.querySelector('strong');
    const small=summary?.querySelector('small');
    if(strong)strong.textContent=auth.connected?'ĐÃ KẾT NỐI':'CHƯA KẾT NỐI';
    if(small)small.textContent=auth.connected?'Phiên Google Drive đang hoạt động':'OAuth scope: drive.file';

    const connect=[...document.querySelectorAll('.inbox-step .inbox-actions button')].find(b=>(b.getAttribute('onclick')||'').includes('auraConnectDrive'));
    if(connect){
      connect.textContent=auth.connected?'Đổi / kết nối lại Google':'Kết nối Google';
      connect.classList.toggle('primary',!auth.connected);
      connect.classList.toggle('soft',auth.connected);
    }
  }

  window.addEventListener('aura-drive-auth-change',decorate);
  const app=document.getElementById('app');
  if(app)new MutationObserver(decorate).observe(app,{childList:true,subtree:true,characterData:true});
  const timer=setInterval(()=>{if(document.body.dataset.auraPage==='inbox')decorate()},1000);
  window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
  setTimeout(decorate,0);
})();
