/* AURA STUDY — deterministic Student login handler for local-first accounts v3 */
(function(){
  if(!document.body.classList.contains('student-shell')||window.__AURA_STUDENT_LOGIN_DIRECT_FIX__)return;
  window.__AURA_STUDENT_LOGIN_DIRECT_FIX__='1.0.0';
  const USERS_KEY='aura_local_students_v1',SESSION_KEY='aura_student_session_v1';
  const read=(k,f)=>{try{const x=JSON.parse(localStorage.getItem(k)||'null');return x==null?f:x}catch(_){return f}};
  const bytesToHex=a=>[...a].map(b=>b.toString(16).padStart(2,'0')).join('');
  async function digest(text){
    if(!window.crypto?.subtle)throw new Error('Trình duyệt không hỗ trợ kiểm tra PIN an toàn.');
    const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(text)));
    return bytesToHex(new Uint8Array(d));
  }
  const setError=msg=>{const el=document.querySelector('.aura-login-error');if(el)el.textContent=msg||''};
  const setBusy=busy=>{const b=document.getElementById('auraLoginSubmit');if(!b)return;b.disabled=!!busy;b.textContent=busy?'Đang kiểm tra PIN…':'Vào học'};

  window.auraStudentLoginDirect=async function(){
    if(window.__AURA_LOGIN_BUSY__)return false;window.__AURA_LOGIN_BUSY__=true;setBusy(true);setError('');
    try{
      const id=document.getElementById('auraLoginStudent')?.value||'';
      const pin=String(document.getElementById('auraLoginPin')?.value||'');
      const list=read(USERS_KEY,[]),u=Array.isArray(list)?list.find(x=>x?.id===id&&x.active!==false):null;
      if(!u)throw new Error('Không tìm thấy học sinh này trong browser hiện tại.');
      if(!/^\d{4,8}$/.test(pin))throw new Error('PIN cần 4–8 chữ số.');
      if(!u.pinSalt||!u.pinHash)throw new Error('Tài khoản thiếu dữ liệu PIN. Admin hãy dùng “Đổi PIN”.');
      const h=await digest(`${u.pinSalt}|${pin}`);
      if(h!==u.pinHash)throw new Error('Mã PIN không đúng.');
      localStorage.setItem(SESSION_KEY,JSON.stringify({studentId:u.id,loggedInAt:new Date().toISOString()}));
      location.reload();
      return false;
    }catch(e){setError(e?.message||'Không thể đăng nhập.');setBusy(false);window.__AURA_LOGIN_BUSY__=false;return false}
  };

  function wire(){
    const form=document.querySelector('.aura-login-card');if(!form)return;
    form.onsubmit=e=>{e.preventDefault();window.auraStudentLoginDirect();return false};
    let b=form.querySelector('button.btn');if(b){b.type='button';b.id='auraLoginSubmit';b.onclick=()=>window.auraStudentLoginDirect()}
    const pin=document.getElementById('auraLoginPin');if(pin&&!pin.dataset.directLogin){pin.dataset.directLogin='1';pin.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();window.auraStudentLoginDirect()}})}
  }
  const obs=new MutationObserver(wire);obs.observe(document.body,{childList:true,subtree:true});wire();
})();