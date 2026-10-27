/* AURA STUDY unified Supabase auth + role-based UI */
(function(){
  const cfg=window.AURA_AUTH_CONFIG||{};
  const q=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  if(!window.supabase?.createClient||!cfg.url||!cfg.publishableKey){document.body.insertAdjacentHTML('afterbegin','<div class="auth-screen"><section class="auth-card"><div class="auth-brand"><div class="auth-logo">A</div><div><b>AURA STUDY</b><span>Không thể khởi tạo đăng nhập</span></div></div><p class="auth-message error">Hệ thống đăng nhập chưa sẵn sàng. Phần học được khóa để bảo vệ dữ liệu người dùng.</p></section></div>');console.error('AURA Auth config missing');return}
  const client=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  window.AURA_SUPABASE=client;
  let currentUser=null,currentRoles=[],adminAssetsLoaded=false;

  const storeKey=uid=>`aura_userstore_${uid}`;
  function learningKeys(){return Object.keys(localStorage).filter(k=>/^(aura_|exam_|review_)/.test(k)&&!k.startsWith('aura_userstore_')&&k!=='aura_active_uid')}
  function snapshotLearning(){const out={};learningKeys().forEach(k=>out[k]=localStorage.getItem(k));return out}
  function saveLearning(uid){if(uid)localStorage.setItem(storeKey(uid),JSON.stringify(snapshotLearning()))}
  function clearLearning(){learningKeys().forEach(k=>localStorage.removeItem(k))}
  function restoreLearning(uid){const raw=localStorage.getItem(storeKey(uid));if(!raw)return false;try{const data=JSON.parse(raw)||{};clearLearning();Object.entries(data).forEach(([k,v])=>{if(typeof v==='string')localStorage.setItem(k,v)});return true}catch{return false}}
  function switchLearning(uid){const active=localStorage.getItem('aura_active_uid');if(active===uid){saveLearning(uid);return}if(active&&active!==uid)saveLearning(active);const restored=restoreLearning(uid);if(!restored&&active)clearLearning();if(!restored&&!active)saveLearning(uid);localStorage.setItem('aura_active_uid',uid)}
  function detachLearning(){const uid=currentUser?.id||localStorage.getItem('aura_active_uid');if(uid)saveLearning(uid);clearLearning();localStorage.removeItem('aura_active_uid')}

  function authMarkup(){return `<div class="auth-screen" id="authScreen"><section class="auth-card" aria-label="Đăng nhập AURA STUDY"><div class="auth-brand"><div class="auth-logo">A</div><div><b>AURA STUDY</b><span>Kho học tập lớp 6</span></div></div><div class="auth-tabs"><button class="auth-tab active" data-mode="login" type="button">Đăng nhập</button><button class="auth-tab" data-mode="signup" type="button">Tạo tài khoản</button></div><form class="auth-form" id="authForm" data-mode="login"><div class="auth-field signup-only" hidden><label for="authName">Tên hiển thị</label><input id="authName" autocomplete="name" maxlength="80" placeholder="Tên của bé"></div><div class="auth-field"><label for="authEmail">Email</label><input id="authEmail" type="email" autocomplete="email" required placeholder="email@example.com"></div><div class="auth-field"><label for="authPassword">Mật khẩu</label><input id="authPassword" type="password" autocomplete="current-password" minlength="8" required placeholder="Ít nhất 8 ký tự, gồm chữ và số"><div class="auth-password-hint signup-only" hidden>Ít nhất 8 ký tự, có chữ và số. Tránh mật khẩu quá phổ biến hoặc dễ đoán.</div></div><div class="auth-row"><button class="auth-link" id="forgotBtn" type="button">Quên mật khẩu?</button><span></span></div><button class="auth-submit" id="authSubmit" type="submit">Đăng nhập</button><p class="auth-message" id="authMessage" aria-live="polite"></p></form></section></div>`}
  function ensureAuthScreen(){if(!q('#authScreen'))document.body.insertAdjacentHTML('afterbegin',authMarkup());bindAuthUi()}
  function bindAuthUi(){document.querySelectorAll('.auth-tab').forEach(btn=>btn.onclick=()=>setMode(btn.dataset.mode||'login'));const f=q('#authForm');if(f)f.onsubmit=submitAuth;const forgot=q('#forgotBtn');if(forgot)forgot.onclick=forgotPassword}
  function setMode(mode){document.querySelectorAll('.auth-tab').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));document.querySelectorAll('.signup-only').forEach(x=>x.hidden=mode!=='signup');const p=q('#authPassword');if(p){p.autocomplete=mode==='signup'?'new-password':'current-password';p.minLength=mode==='signup'?8:6;p.placeholder=mode==='signup'?'Ít nhất 8 ký tự, gồm chữ và số':'Mật khẩu'}const s=q('#authSubmit');if(s)s.textContent=mode==='signup'?'Tạo tài khoản':'Đăng nhập';const f=q('#forgotBtn');if(f)f.hidden=mode==='signup';q('#authForm')?.setAttribute('data-mode',mode);message('')}
  function message(text,type=''){const el=q('#authMessage');if(!el)return;el.textContent=text;el.className='auth-message'+(type?' '+type:'')}
  function validateNewPassword(p=''){if(p.length<8)return 'Mật khẩu cần ít nhất 8 ký tự.';if(!/[A-Za-zÀ-ỹ]/.test(p)||!/[0-9]/.test(p))return 'Mật khẩu cần có ít nhất 1 chữ và 1 số.';return ''}
  function humanAuthError(m='',context='login'){
    const raw=String(m||'').trim(),x=raw.toLowerCase();
    if(x.includes('invalid login'))return 'Email hoặc mật khẩu chưa đúng.';
    if(x.includes('already registered')||x.includes('user already registered'))return 'Email này đã có tài khoản. Hãy chuyển sang Đăng nhập.';
    if(x.includes('weak')||x.includes('easy to guess')||x.includes('known to be'))return 'Mật khẩu quá dễ đoán. Hãy dùng mật khẩu mạnh hơn, ví dụ kết hợp chữ, số và ký tự đặc biệt.';
    if(x.includes('at least')&&x.includes('password'))return 'Mật khẩu chưa đủ độ dài theo yêu cầu của hệ thống.';
    if(x.includes('password')&&(x.includes('contain')||x.includes('character')))return 'Mật khẩu chưa đủ độ mạnh. Hãy dùng ít nhất 8 ký tự, có chữ và số; nên thêm ký tự đặc biệt.';
    if(x.includes('signup')&&x.includes('disabled'))return 'Hệ thống hiện đang tắt chức năng tạo tài khoản.';
    if(x.includes('rate limit')||x.includes('too many requests'))return 'Đã thử quá nhiều lần. Vui lòng đợi một lúc rồi thử lại.';
    if(x.includes('database error')||x.includes('saving new user'))return 'Không thể tạo hồ sơ người dùng trong cơ sở dữ liệu. Admin cần kiểm tra cấu hình tài khoản.';
    if(x.includes('email')&&(x.includes('invalid')||x.includes('not valid')))return 'Email chưa đúng định dạng.';
    if(x.includes('email')&&x.includes('confirm'))return 'Email chưa được xác nhận. Hãy kiểm tra hộp thư.';
    if(context==='signup'&&raw)return `Không thể tạo tài khoản: ${raw.slice(0,180)}`;
    return 'Không thể đăng nhập lúc này. Vui lòng thử lại.';
  }

  async function submitAuth(e){
    e.preventDefault();
    const form=e.currentTarget,mode=form.dataset.mode||'login',email=q('#authEmail')?.value.trim(),password=q('#authPassword')?.value||'',name=q('#authName')?.value.trim()||'';
    if(!email||!password)return message('Vui lòng nhập email và mật khẩu.','error');
    if(mode==='signup'){const pwError=validateNewPassword(password);if(pwError)return message(pwError,'error')}
    const btn=q('#authSubmit');if(btn)btn.disabled=true;message('Đang xử lý…');
    try{
      if(mode==='signup'){
        const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname,data:{display_name:name||email.split('@')[0]}}});
        if(error)throw error;
        if(data.user&&Array.isArray(data.user.identities)&&data.user.identities.length===0)return message('Email này đã có tài khoản. Hãy chuyển sang Đăng nhập.','error');
        if(data.session)await activateSession(data.session);else message('Tài khoản đã tạo. Hãy kiểm tra email để xác nhận rồi đăng nhập.','ok');
      }else{
        const {data,error}=await client.auth.signInWithPassword({email,password});if(error)throw error;await activateSession(data.session);
      }
    }catch(err){console.error('AURA auth error',err);message(humanAuthError(err?.message,mode),'error')}finally{if(btn)btn.disabled=false}
  }
  async function forgotPassword(){const email=q('#authEmail')?.value.trim();if(!email)return message('Nhập email trước, rồi bấm Quên mật khẩu.','error');const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)return message(humanAuthError(error.message,'recovery'),'error');message('Đã gửi hướng dẫn đặt lại mật khẩu vào email.','ok')}
  async function showRecovery(){document.body.classList.add('auth-pending');ensureAuthScreen();const tabs=q('.auth-tabs');if(tabs)tabs.hidden=true;const form=q('#authForm');if(!form)return;form.innerHTML=`<div class="auth-field"><label for="newPassword">Mật khẩu mới</label><input id="newPassword" type="password" autocomplete="new-password" minlength="8" required placeholder="Ít nhất 8 ký tự, gồm chữ và số"><div class="auth-password-hint">Ít nhất 8 ký tự, có chữ và số. Nên thêm ký tự đặc biệt.</div></div><div class="auth-field"><label for="newPassword2">Nhập lại mật khẩu</label><input id="newPassword2" type="password" autocomplete="new-password" minlength="8" required placeholder="Nhập lại mật khẩu"></div><button class="auth-submit" id="recoverySubmit" type="submit">Cập nhật mật khẩu</button><p class="auth-message" id="authMessage" aria-live="polite"></p>`;form.onsubmit=async e=>{e.preventDefault();const a=q('#newPassword')?.value||'',b=q('#newPassword2')?.value||'',pwError=validateNewPassword(a);if(pwError)return message(pwError,'error');if(a!==b)return message('Hai mật khẩu chưa trùng nhau.','error');const btn=q('#recoverySubmit');if(btn)btn.disabled=true;const {error}=await client.auth.updateUser({password:a});if(error){message(humanAuthError(error.message,'recovery'),'error');if(btn)btn.disabled=false;return}message('Đã đổi mật khẩu thành công.','ok');const {data}=await client.auth.getSession();setTimeout(()=>activateSession(data.session),500)}}

  async function loadIdentity(user){const [{data:roles},{data:profile}]=await Promise.all([client.from('user_roles').select('role').eq('user_id',user.id),client.from('profiles').select('display_name').eq('id',user.id).maybeSingle()]);currentRoles=(roles||[]).map(x=>x.role);const display=profile?.display_name||user.user_metadata?.display_name||user.email?.split('@')[0]||'AURA User';return{display,isAdmin:currentRoles.includes('admin')}}
  function addAccountChip(display,isAdmin){q('.aura-account')?.remove();const host=q('.topin');if(!host)return;host.insertAdjacentHTML('beforeend',`<div class="aura-account"><b>${esc(display)}</b><span class="aura-role">${isAdmin?'Admin':'Học sinh'}</span><button class="aura-logout" type="button" title="Đăng xuất" aria-label="Đăng xuất">↪</button></div>`);q('.aura-logout').onclick=logout}
  async function logout(){detachLearning();currentUser=null;currentRoles=[];await client.auth.signOut();showLoggedOut(false)}
  function loadCss(href){if(document.querySelector(`link[href="${href}"]`))return Promise.resolve();return new Promise((res,rej)=>{const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.onload=res;l.onerror=rej;document.head.appendChild(l)})}
  function loadScript(src){if(document.querySelector(`script[src="${src}"]`))return Promise.resolve();return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.body.appendChild(s)})}
  function mountAdminChrome(){const side=q('.side');if(side&&!side.querySelector('[data-page="guide"]'))side.insertAdjacentHTML('beforeend','<button class="navbtn" data-page="guide" onclick="guide()">? Hướng dẫn & Vận hành</button><div class="sidebox"><b>AURA Smart Practice</b><div class="small">Cân mức độ • giảm lặp • ưu tiên phần yếu.</div></div>');const mob=q('.mobilebar');if(mob&&!mob.querySelector('[data-admin-guide]')){mob.insertAdjacentHTML('beforeend','<button data-admin-guide onclick="guide()">?<br><small>Hướng dẫn</small></button>');mob.style.gridTemplateColumns='repeat(5,1fr)'}const top=q('.topin');if(top&&!top.querySelector('.admin-only')){const acct=q('.aura-account');acct?.insertAdjacentHTML('beforebegin','<button class="btn soft admin-only" type="button" onclick="backup()">Sao lưu</button><button class="btn soft admin-only" type="button" onclick="restoreBackup()">Khôi phục</button>')}}
  async function enableAdminUi(){document.body.classList.remove('student-shell');document.body.classList.add('admin-shell');if(!adminAssetsLoaded){await Promise.all([loadCss('sync_status.css'),loadCss('guide.css')]);await loadScript('guide.js');await loadScript('backup.js');await loadScript('sync_status.js');adminAssetsLoaded=true}mountAdminChrome();if(typeof auraInsertSourceSync==='function')auraInsertSourceSync()}
  function disableAdminUi(){document.body.classList.add('student-shell');document.body.classList.remove('admin-shell');document.querySelectorAll('.admin-only').forEach(x=>x.remove());q('.side [data-page="guide"]')?.remove();q('.side .sidebox')?.remove();q('.mobilebar [data-admin-guide]')?.remove();if(q('.mobilebar'))q('.mobilebar').style.gridTemplateColumns='repeat(4,1fr)';q('[data-aura-sync]')?.remove()}
  async function activateSession(session){const user=session?.user;if(!user)return showLoggedOut();switchLearning(user.id);currentUser=user;const {display,isAdmin}=await loadIdentity(user);q('#authScreen')?.remove();document.body.classList.remove('auth-pending');addAccountChip(display,isAdmin);if(isAdmin)await enableAdminUi();else disableAdminUi();if(new URLSearchParams(location.search).get('admin')==='1'&&isAdmin&&typeof guide==='function')guide();else if(typeof home==='function')home()}
  function showLoggedOut(persist=true){if(persist&&currentUser)detachLearning();currentUser=null;currentRoles=[];disableAdminUi();q('.aura-account')?.remove();document.body.classList.add('auth-pending');ensureAuthScreen();const tabs=q('.auth-tabs');if(tabs)tabs.hidden=false;setMode('login')}
  async function init(){ensureAuthScreen();const {data}=await client.auth.getSession();if(data.session)await activateSession(data.session);else{clearLearning();showLoggedOut(false)}client.auth.onAuthStateChange((event,session)=>{if(event==='PASSWORD_RECOVERY')showRecovery();else if(event==='SIGNED_OUT')showLoggedOut();else if(session&&session.user?.id!==currentUser?.id)activateSession(session)})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
