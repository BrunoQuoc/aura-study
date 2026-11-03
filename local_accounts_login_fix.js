/* AURA STUDY — robust local account login compatibility patch.
   Fixes Vietnamese username normalization and gives clear local-first diagnostics. */
(function(){
  if(window.__AURA_LOCAL_LOGIN_FIX__)return;
  window.__AURA_LOCAL_LOGIN_FIX__=true;
  const USERS_KEY='aura_local_students_v1';
  const normalize=s=>String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9._-]+/g,'').slice(0,32);
  const readUsers=()=>{try{const x=JSON.parse(localStorage.getItem(USERS_KEY)||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}};
  const activeUsers=()=>readUsers().filter(x=>x&&x.active!==false);

  window.AURA_ACCOUNT_DIAGNOSTICS=Object.freeze({
    normalizeLogin:normalize,
    users:readUsers,
    status(){const list=activeUsers();return{count:list.length,usernames:list.map(x=>x.username||'').filter(Boolean),origin:location.origin}}
  });

  function installStudent(){
    if(!document.body.classList.contains('student-shell'))return;
    const base=window.auraStudentLogin;
    if(typeof base!=='function'){setTimeout(installStudent,50);return}
    if(base.__auraLoginCompat)return;
    const wrapped=async function(e){
      e?.preventDefault?.();
      const input=document.getElementById('auraLoginUser');
      const typed=normalize(input?.value||'');
      const list=activeUsers();
      if(!list.length){
        const err=document.querySelector('.aura-login-error');
        if(err)err.textContent='Student chưa thấy tài khoản nào trên trình duyệt này. Hãy tạo user bằng Admin trong cùng trình duyệt/thiết bị.';
        return false;
      }
      const exact=list.find(x=>String(x.username||'')===typed);
      if(!exact&&typed){
        const aliases=list.filter(x=>normalize(x.name||'')===typed);
        if(aliases.length===1&&input)input.value=aliases[0].username||typed;
      }
      return base.apply(this,arguments);
    };
    wrapped.__auraLoginCompat=true;
    window.auraStudentLogin=wrapped;

    const note=()=>{
      const p=document.querySelector('.aura-login-card p');
      const n=document.querySelector('.aura-login-note');
      const count=activeUsers().length;
      if(p&&count)p.textContent=`Đã thấy ${count} tài khoản học sinh trên trình duyệt này. Nhập tên đăng nhập và PIN do Admin tạo.`;
      if(n)n.textContent=`Local-first · ${location.origin} · ${count} user khả dụng trên browser hiện tại.`;
    };
    setTimeout(note,0);
    const obs=new MutationObserver(()=>{if(document.querySelector('.aura-login-overlay'))note()});
    obs.observe(document.body,{childList:true,subtree:true});
  }

  function installAdmin(){
    if(!document.body.classList.contains('admin-shell'))return;
    const base=window.auraCreateStudent;
    if(typeof base!=='function'){setTimeout(installAdmin,50);return}
    if(base.__auraCreateCompat)return;
    const wrapped=async function(){
      const input=document.getElementById('studentUsername');
      if(input)input.value=normalize(input.value);
      const before=readUsers().length;
      const out=await base.apply(this,arguments);
      const after=readUsers();
      if(after.length>before){
        const u=after[after.length-1];
        setTimeout(()=>alert(`Đã tạo học sinh ${u?.name||''}.\n\nTên đăng nhập: ${u?.username||''}\n\nStudent phải mở bằng cùng trình duyệt/thiết bị nếu đang dùng chế độ local-first.`),0);
      }
      return out;
    };
    wrapped.__auraCreateCompat=true;
    window.auraCreateStudent=wrapped;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{installStudent();installAdmin()},{once:true});
  else{installStudent();installAdmin()}
})();