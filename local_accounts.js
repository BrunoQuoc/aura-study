/* AURA STUDY — local-first student accounts + per-student learning profiles */
(function(){
  const USERS_KEY='aura_local_students_v1';
  const SESSION_KEY='aura_student_session_v1';
  const PROFILE_PREFIX='aura_student_profile_v1:';
  const nativeGet=Storage.prototype.getItem;
  const nativeSet=Storage.prototype.setItem;
  const nativeRemove=Storage.prototype.removeItem;
  const nativeClear=Storage.prototype.clear;
  const rawGet=k=>nativeGet.call(localStorage,k);
  const rawSet=(k,v)=>nativeSet.call(localStorage,k,v);
  const rawRemove=k=>nativeRemove.call(localStorage,k);
  const read=(k,f)=>{try{const v=JSON.parse(rawGet(k)||'null');return v==null?f:v}catch(_){return f}};
  const write=(k,v)=>rawSet(k,JSON.stringify(v));
  const now=()=>new Date().toISOString();
  const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  const users=()=>{const x=read(USERS_KEY,[]);return Array.isArray(x)?x:[]};
  const saveUsers=x=>write(USERS_KEY,Array.isArray(x)?x:[]);
  const profileKey=id=>PROFILE_PREFIX+id;
  const profile=id=>{const x=read(profileKey(id),{});return x&&typeof x==='object'?x:{}};
  const saveProfile=(id,x)=>write(profileKey(id),x&&typeof x==='object'?x:{});
  const username=s=>String(s||'').trim().toLowerCase().replace(/[^a-z0-9._-]+/g,'').slice(0,32);
  const randomId=()=>`stu_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
  const bytesToHex=a=>[...a].map(b=>b.toString(16).padStart(2,'0')).join('');
  const salt=()=>{const a=new Uint8Array(16);crypto.getRandomValues(a);return bytesToHex(a)};
  async function digest(text){const b=new TextEncoder().encode(String(text));const d=await crypto.subtle.digest('SHA-256',b);return bytesToHex(new Uint8Array(d))}
  async function pinHash(pin,s){return digest(`${s}|${pin}`)}

  function isLearningKey(k){
    k=String(k||'');
    if(/^exam_/.test(k)||/^review_/.test(k))return true;
    if(/^aura_wrong/.test(k)||/^aura_smart/.test(k))return true;
    return [
      'aura_attempts','aura_recent_questions','aura_generated_exam','aura_generated_draft','aura_exam_period',
      'aura_lesson_state','aura_last_subject','aura_report_reset_at'
    ].includes(k);
  }
  function learningKeys(){const out=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(isLearningKey(k))out.push(k)}return out}
  function snapshot(id){if(!id)return;const p={};learningKeys().forEach(k=>{const v=rawGet(k);if(v!=null)p[k]=v});saveProfile(id,{data:p,savedAt:now()})}
  function clearLearning(){learningKeys().forEach(rawRemove)}
  function restore(id){clearLearning();const p=profile(id);Object.entries(p.data||{}).forEach(([k,v])=>{if(isLearningKey(k)&&v!=null)rawSet(k,String(v))})}

  window.AURA_LOCAL_ACCOUNTS={users,profile,snapshot,restore,isLearningKey};

  if(document.body.classList.contains('student-shell')){
    let currentId='';
    let mirroring=false;
    function mirror(k,v,remove=false){
      if(mirroring||!currentId||!isLearningKey(k))return;
      mirroring=true;
      try{const p=profile(currentId),data={...(p.data||{})};if(remove)delete data[k];else data[k]=String(v);saveProfile(currentId,{data,savedAt:now()})}finally{mirroring=false}
    }
    Storage.prototype.setItem=function(k,v){const out=nativeSet.call(this,k,v);if(this===localStorage)mirror(String(k),v,false);return out};
    Storage.prototype.removeItem=function(k){const out=nativeRemove.call(this,k);if(this===localStorage)mirror(String(k),'',true);return out};
    Storage.prototype.clear=function(){if(this!==localStorage)return nativeClear.call(this);const keep=[];for(let i=0;i<this.length;i++){const k=this.key(i);if(!isLearningKey(k))keep.push([k,nativeGet.call(this,k)])}nativeClear.call(this);keep.forEach(([k,v])=>nativeSet.call(this,k,v));if(currentId)saveProfile(currentId,{data:{},savedAt:now()})};

    function activeUser(){const s=read(SESSION_KEY,null);if(!s?.studentId)return null;return users().find(x=>x.id===s.studentId&&x.active!==false)||null}
    function setHeader(u){const box=document.querySelector('.aura-account');if(!box)return;if(!u){box.innerHTML='<b>Học sinh</b><span class="aura-role">Chưa đăng nhập</span>';return}box.innerHTML=`<b>${esc(u.name)}</b><span class="aura-role">Student · <button type="button" onclick="auraStudentLogout()" style="border:0;background:none;padding:0;color:inherit;text-decoration:underline;cursor:pointer">Đăng xuất</button></span>`}
    function style(){if(document.getElementById('aura-local-login-style'))return;const s=document.createElement('style');s.id='aura-local-login-style';s.textContent=`.aura-login-overlay{position:fixed;inset:0;z-index:99999;background:rgba(245,247,252,.98);display:grid;place-items:center;padding:24px}.aura-login-card{width:min(430px,100%);background:#fff;border:1px solid #dfe5f3;border-radius:22px;padding:26px;box-shadow:0 24px 70px rgba(21,35,75,.16)}.aura-login-card h1{margin:0 0 6px}.aura-login-card p{color:#6b7694;margin:0 0 20px}.aura-login-card label{display:block;margin:12px 0 6px;font-weight:800}.aura-login-card input{width:100%;box-sizing:border-box;border:1px solid #d7deee;border-radius:12px;padding:12px 14px;font:inherit}.aura-login-card .btn{margin-top:16px;width:100%}.aura-login-error{color:#b42318;font-weight:700;margin-top:12px}.aura-login-note{font-size:12px;color:#8490aa;margin-top:12px}`;document.head.appendChild(s)}
    function showLogin(message=''){
      style();setHeader(null);let o=document.querySelector('.aura-login-overlay');if(!o){o=document.createElement('div');o.className='aura-login-overlay';document.body.appendChild(o)}
      const count=users().filter(x=>x.active!==false).length;
      o.innerHTML=`<form class="aura-login-card" onsubmit="return auraStudentLogin(event)"><div class="small">AURA STUDY · STUDENT</div><h1>Đăng nhập học sinh</h1><p>${count?'Nhập tài khoản do Admin tạo trên thiết bị này.':'Chưa có tài khoản học sinh. Admin cần tạo user trước.'}</p><label>Tên đăng nhập</label><input id="auraLoginUser" autocomplete="username" ${count?'':'disabled'}><label>Mã PIN</label><input id="auraLoginPin" type="password" inputmode="numeric" autocomplete="current-password" ${count?'':'disabled'}><button class="btn primary" ${count?'':'disabled'}>Vào học</button><div class="aura-login-error">${esc(message)}</div><div class="aura-login-note">Tài khoản này chỉ dùng cục bộ trên trình duyệt/thiết bị hiện tại.</div></form>`;
    }
    function hideLogin(){document.querySelector('.aura-login-overlay')?.remove()}
    window.auraStudentLogin=async function(e){e?.preventDefault();const uName=username(document.getElementById('auraLoginUser')?.value),pin=String(document.getElementById('auraLoginPin')?.value||'');const u=users().find(x=>x.username===uName&&x.active!==false);if(!u){showLogin('Sai tên đăng nhập hoặc tài khoản đã bị khóa.');return false}const h=await pinHash(pin,u.pinSalt);if(h!==u.pinHash){showLogin('Mã PIN không đúng.');return false}if(currentId&&currentId!==u.id)snapshot(currentId);restore(u.id);currentId=u.id;write(SESSION_KEY,{studentId:u.id,loggedInAt:now()});hideLogin();setHeader(u);setTimeout(()=>{if(typeof window.home==='function')window.home()},0);return false};
    window.auraStudentLogout=function(){if(currentId)snapshot(currentId);clearLearning();currentId='';rawRemove(SESSION_KEY);showLogin('')};
    const u=activeUser();if(u){currentId=u.id;restore(u.id);setTimeout(()=>{hideLogin();setHeader(u)},0)}else{rawRemove(SESSION_KEY);setTimeout(()=>showLogin(''),0)}
    addEventListener('beforeunload',()=>{if(currentId)snapshot(currentId)});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&currentId)snapshot(currentId)});
  }

  if(document.body.classList.contains('admin-shell')){
    function row(u){return `<div class="resource"><div class="fileico">👤</div><div class="grow"><b>${esc(u.name)}</b><small>@${esc(u.username)} · ${u.active===false?'Đã khóa':'Đang hoạt động'} · tạo ${esc(new Date(u.createdAt).toLocaleDateString('vi-VN'))}</small></div><button class="btn soft" onclick="auraToggleStudent('${esc(u.id)}')">${u.active===false?'Mở khóa':'Khóa'}</button><button class="btn soft" onclick="auraResetStudentPin('${esc(u.id)}')">Đổi PIN</button><button class="btn soft" onclick="auraDeleteStudent('${esc(u.id)}')">Xóa</button></div>`}
    window.auraStudentUsers=function(){if(typeof window.setActive==='function')window.setActive('students');document.body.dataset.auraPage='students';const app=document.getElementById('app');if(!app)return;const list=users();app.innerHTML=`<div class="sectionhead" style="margin-top:0"><div><h2>Học sinh</h2><span>Mỗi user là một hồ sơ học tập độc lập trên thiết bị này</span></div></div><section class="card"><div class="small">TẠO HỌC SINH MỚI</div><div class="generator-grid"><label><b>Tên học sinh</b><input id="studentName" placeholder="Ví dụ: Vi Khôi"></label><label><b>Tên đăng nhập</b><input id="studentUsername" placeholder="Ví dụ: vikhoi"></label><label><b>PIN 4–8 số</b><input id="studentPin" type="password" inputmode="numeric" placeholder="Ví dụ: 1234"></label></div><button class="btn primary" style="margin-top:14px" onclick="auraCreateStudent()">Tạo user học sinh</button><p class="meta">Local-first: user/PIN chỉ có hiệu lực trên trình duyệt này. PIN được lưu dạng hash.</p></section><div class="sectionhead"><div><h2>Danh sách học sinh</h2><span>${list.length} user</span></div></div><section class="card">${list.length?list.map(row).join(''):'<div class="meta">Chưa có học sinh. Tạo user đầu tiên ở phía trên.</div>'}</section>`};
    window.auraCreateStudent=async function(){const name=String(document.getElementById('studentName')?.value||'').trim(),un=username(document.getElementById('studentUsername')?.value),pin=String(document.getElementById('studentPin')?.value||'');if(!name)return alert('Hãy nhập tên học sinh.');if(un.length<3)return alert('Tên đăng nhập cần ít nhất 3 ký tự: a-z, 0-9, dấu chấm, gạch dưới hoặc gạch ngang.');if(!/^\d{4,8}$/.test(pin))return alert('PIN cần 4–8 chữ số.');const list=users();if(list.some(x=>x.username===un))return alert('Tên đăng nhập này đã tồn tại.');const s=salt(),h=await pinHash(pin,s);list.push({id:randomId(),name,username:un,pinSalt:s,pinHash:h,active:true,createdAt:now(),updatedAt:now()});saveUsers(list);window.auraStudentUsers()};
    window.auraToggleStudent=function(id){const list=users(),i=list.findIndex(x=>x.id===id);if(i<0)return;list[i]={...list[i],active:list[i].active===false,updatedAt:now()};saveUsers(list);window.auraStudentUsers()};
    window.auraResetStudentPin=async function(id){const list=users(),i=list.findIndex(x=>x.id===id);if(i<0)return;const pin=prompt(`Nhập PIN mới cho ${list[i].name} (4–8 số):`);if(pin==null)return;if(!/^\d{4,8}$/.test(pin))return alert('PIN cần 4–8 chữ số.');const s=salt(),h=await pinHash(pin,s);list[i]={...list[i],pinSalt:s,pinHash:h,updatedAt:now()};saveUsers(list);alert('Đã đổi PIN.')};
    window.auraDeleteStudent=function(id){const list=users(),u=list.find(x=>x.id===id);if(!u)return;if(!confirm(`Xóa user “${u.name}” và toàn bộ dữ liệu học tập cục bộ của user này?`))return;saveUsers(list.filter(x=>x.id!==id));rawRemove(profileKey(id));const sess=read(SESSION_KEY,null);if(sess?.studentId===id)rawRemove(SESSION_KEY);window.auraStudentUsers()};
  }
})();
