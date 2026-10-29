/* AURA STUDY — clarify lazy OAuth behavior in Admin INBOX */
(function(){
  if(!document.body.classList.contains('admin-shell'))return;
  const FOLDER_KEY='aura_drive_inbox_folder_v1';
  const readFolder=()=>{try{return JSON.parse(localStorage.getItem(FOLDER_KEY)||'null')}catch(_){return null}};
  function apply(){
    if(document.body.dataset.auraPage!=='inbox')return;
    const f=readFolder();
    const summary=document.querySelector('.inbox-summary article:first-child');
    const strong=summary?.querySelector('strong');
    const small=summary?.querySelector('small');
    if(f?.id){
      if(strong&&strong.textContent==='CHƯA KẾT NỐI')strong.textContent='SẴN SÀNG';
      const hint='Tự xác thực Google khi Upload / Duyệt / Đồng bộ';
      if(small&&small.textContent!==hint)small.textContent=hint;
      const connect=[...document.querySelectorAll('.inbox-step .inbox-actions button')].find(b=>(b.getAttribute('onclick')||'').includes('auraConnectDrive'));
      if(connect){
        const label='Đổi / xác thực tài khoản';
        if(connect.textContent!==label)connect.textContent=label;
        connect.classList.remove('primary');connect.classList.add('soft');
      }
      const firstStep=document.querySelector('.inbox-step');
      const p=firstStep?.querySelector('.inbox-step-head p');
      const text='00_INBOX đã được ghi nhớ trên thiết bị. Khi cần thao tác Drive, AURA tự yêu cầu quyền Google; chỉ hiện cửa sổ đăng nhập nếu Google cần xác nhận lại.';
      if(p&&p.textContent!==text)p.textContent=text;
    }else{
      const warning=document.querySelector('.inbox-warning');
      if(warning&&!warning.textContent.includes('Chỉ cần chọn một lần'))warning.textContent+=' Chỉ cần chọn một lần trên trình duyệt này.';
    }
  }
  const observer=new MutationObserver(apply);
  observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  setTimeout(apply,0);
})();
