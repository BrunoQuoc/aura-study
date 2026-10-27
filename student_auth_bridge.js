/* AURA STUDY — student username/password bridge. Student accounts are Admin-created. */
(function(){
  const SESSION_KEY='aura_student_session_v1';
  let studentCtx=null;
  const q=s=>document.querySelector(s);

  function client(){return window.AURA_SUPABASE}
  function learningKeys(){return Object.keys(localStorage).filter(k=>/^(aura_|exam_|review_)/.test(k)&&!k.startsWith('aura_userstore_')&&!['aura_active_uid',SESSION_KEY].includes(k))}
  function snapshotLearning(){const out={};learningKeys().forEach(k=>out[k]=localStorage.getItem(k));return out}
  function saveLearning(uid){if(uid)localStorage.setItem(`aura_userstore_${uid}`,JSON.stringify(snapshotLearning()))}
  function clearLearning(){learningKeys().forEach(k=>localStorage.removeItem(k))}
  function restoreLearning(uid){const raw=localStorage.getItem(`aura_userstore_${uid}`);if(!raw)return;try{const d=JSON.parse(raw)||{};clearLearning();Object.entries(d).forEach(([k,v])=>{if(typeof v==='string')localStorage.setItem(k,v)})}catch{}}
  function switchLearning(uid){const prev=localStorage.getItem('aura_active_uid');if(prev&&prev!==uid)saveLearning(prev);clearLearning();restoreLearning(uid);localStorage.setItem('aura_active_uid',uid)}

  function setMessage(text,type=''){const el=q('#authMessage');if(!el)return;el.textContent=text;el.className='auth-message'+(type?' '+type:'')}
  function friendly(err=''){const x=String(err).toLowerCase();if(x.includes('invalid_credentials'))return 'Tài khoản hoặc mật khẩu chưa đúng.';if(x.includes('account_disabled'))return 'Tài khoản này đang bị khóa. Hãy liên hệ Admin.';if(x.includes('account_temp_locked'))return 'Đăng nhập sai quá nhiều lần. Tài khoản tạm khóa 10 phút.';return 'Không thể đăng nhập tài khoản học sinh lúc này.'}

  function simplifyAuthScreen(){
    const screen=q('#authScreen');if(!screen)return;
    const signup=screen.querySelector('.auth-tab[data-mode="signup"]');if(signup)signup.remove();
    screen.querySelectorAll('.signup-only').forEach(x=>x.remove());
    const tabs=screen.querySelector('.auth-tabs');if(tabs)tabs.classList.add('student-login-only');
    const email=q('#authEmail');if(email){email.type='text';email.autocomplete='username';email.placeholder='Ví dụ: sonic hoặc email Admin';const label=email.closest('.auth-field')?.querySelector('label');if(label)label.textContent='Tài khoản'}
    const pass=q('#authPassword');if(pass){pass.placeholder='Mật khẩu';pass.minLength=6}
    if(!screen.querySelector('.student-auth-note'))screen.querySelector('.auth-form')?.insertAdjacentHTML('afterbegin','<div class="student-auth-note">Tài khoản học sinh do Admin tạo. Học sinh đăng nhập bằng tên tài khoản; Admin đăng nhập bằng email.</div>');
    const form=q('#authForm');if(form&&!form.dataset.studentBridge){form.dataset.studentBridge='1';form.dataset.mode='login';form.addEventListener('submit',studentSubmit,true)}
    const forgot=q('#forgotBtn');if(forgot)forgot.hidden=!(email?.value||'').includes('@');
    email?.addEventListener('input',()=>{const f=q('#forgotBtn');if(f)f.hidden=!email.value.includes('@')});
  }

  async function studentSubmit(e){
    const user=q('#authEmail')?.value.trim()||'';
    if(!user||user.includes('@'))return;
    e.preventDefault();e.stopImmediatePropagation();
    const password=q('#authPassword')?.value||'';if(!password)return setMessage('Vui lòng nhập mật khẩu.','error');
    const btn=q('#authSubmit');if(btn)btn.disabled=true;setMessage('Đang đăng nhập…');
    try{
      const c=client();if(!c)throw new Error('NO_CLIENT');
      const {data,error}=await c.rpc('student_login',{p_username:user,p_password:password});
      if(error)throw error;
      const row=Array.isArray(data)?data[0]:data;if(!row?.student_id||!row?.session_token)throw new Error('INVALID_RESPONSE');
      const session={student_id:row.student_id,username:row.username,display_name:row.display_name,token:row.session_token,expires_at:row.expires_at};
      localStorage.setItem(SESSION_KEY,JSON.stringify(session));activateStudent(session);
    }catch(err){setMessage(friendly(err?.message||err),'error')}finally{if(btn)btn.disabled=false}
  }

  function addStudentChip(session){
    q('.aura-account')?.remove();const host=q('.topin');if(!host)return;
    host.insertAdjacentHTML('beforeend',`<div class="aura-account"><b>${escapeHtml(session.display_name||session.username||'Học sinh')}</b><span class="aura-role">Học sinh</span><button class="aura-logout" type="button" title="Đăng xuất" aria-label="Đăng xuất">↪</button></div>`);
    q('.aura-logout').onclick=studentLogout;
  }
  function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

  function activateStudent(session){
    studentCtx=session;window.AURA_STUDENT_CONTEXT=session;
    const uid=`student_${session.student_id}`;switchLearning(uid);
    q('#authScreen')?.remove();document.body.classList.remove('auth-pending','admin-shell');document.body.classList.add('student-shell');
    document.querySelectorAll('.admin-only').forEach(x=>x.remove());addStudentChip(session);
    if(typeof home==='function')home();
  }

  async function studentLogout(){
    const s=studentCtx||readStored();if(s?.student_id)saveLearning(`student_${s.student_id}`);
    localStorage.removeItem(SESSION_KEY);localStorage.removeItem('aura_active_uid');studentCtx=null;window.AURA_STUDENT_CONTEXT=null;
    try{if(s?.token&&client())await client().rpc('student_logout',{p_token:s.token})}catch{}
    location.reload();
  }

  function readStored(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}}
  async function restoreStored(){
    const s=readStored();if(!s?.token||!s?.student_id)return;
    if(s.expires_at&&new Date(s.expires_at).getTime()<=Date.now()){localStorage.removeItem(SESSION_KEY);return}
    try{
      const c=client();if(!c)return;
      const {data,error}=await c.rpc('student_validate_session',{p_token:s.token});
      if(!error){const row=Array.isArray(data)?data[0]:data;if(row?.student_id){activateStudent({...s,...row});return}}
      if(error&&String(error.message||'').toLowerCase().includes('could not find the function'))activateStudent(s);
    }catch{}
  }

  function init(){simplifyAuthScreen();restoreStored();const obs=new MutationObserver(()=>simplifyAuthScreen());obs.observe(document.body,{childList:true,subtree:true});window.addEventListener('pagehide',()=>{if(studentCtx?.student_id)saveLearning(`student_${studentCtx.student_id}`)})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
