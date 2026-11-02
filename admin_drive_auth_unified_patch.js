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

  function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}
  function decorate(){
    if(document.body.dataset.auraPage!=='inbox')return;
    const auth=window.AURA_DRIVE_AUTH?.status?.()||{connected:false};
    const summary=document.querySelector('.inbox-summary article:first-child');
    setText(summary?.querySelector('strong'),auth.connected?'ĐÃ KẾT NỐI':'CHƯA KẾT NỐI');
    setText(summary?.querySelector('small'),auth.connected?'Phiên Google Drive đang hoạt động':'OAuth scope: drive.file');

    const connect=[...document.querySelectorAll('.inbox-step .inbox-actions button')].find(b=>(b.getAttribute('onclick')||'').includes('auraConnectDrive'));
    if(connect){
      const label=auth.connected?'Đổi / kết nối lại Google':'Kết nối Google';
      if(connect.textContent!==label)connect.textContent=label;
      if(connect.classList.contains('primary')===auth.connected)connect.classList.toggle('primary',!auth.connected);
      if(connect.classList.contains('soft')!==auth.connected)connect.classList.toggle('soft',auth.connected);
    }
  }

  window.addEventListener('aura-drive-auth-change',decorate);
  const timer=setInterval(()=>{if(document.body.dataset.auraPage==='inbox')decorate()},1200);
  window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
  setTimeout(decorate,0);
})();