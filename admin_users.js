/* AURA STUDY — Admin student account management */
(function(){
  const q=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const c=()=>window.AURA_SUPABASE;

  function errText(err){const x=String(err?.message||err||'').toLowerCase();if(x.includes('forbidden'))return 'Tài khoản hiện tại chưa có quyền Admin.';if(x.includes('username_exists'))return 'Tên đăng nhập này đã tồn tại.';if(x.includes('invalid_username'))return 'Tên đăng nhập chỉ dùng chữ, số, dấu chấm, gạch dưới hoặc gạch ngang (3–32 ký tự).';if(x.includes('weak_password'))return 'Mật khẩu cần ít nhất 8 ký tự, có chữ và số.';if(x.includes('could not find the function'))return 'Backend quản lý người dùng đang được hoàn tất. Vui lòng thử lại sau khi cấu hình RPC được bật.';return 'Không thể xử lý yêu cầu quản lý người dùng.'}

  async function rpc(name,args={}){const client=c();if(!client)throw new Error('NO_CLIENT');const {data,error}=await client.rpc(name,args);if(error)throw error;return data}

  window.usersAdmin=async function(){
    if(!document.body.classList.contains('admin-shell'))return;
    if(typeof setActive==='function')setActive('users');const app=q('#app');if(!app)return;
    app.innerHTML=`<div class="sectionhead" style="margin-top:0"><div><h2>Người dùng</h2><span>Chỉ quản lý tài khoản học sinh</span></div></div><div class="card"><h3>Tạo học sinh</h3><div class="user-admin-grid"><label><b>Tên hiển thị</b><input id="newStudentName" placeholder="Ví dụ: Sonic"></label><label><b>Tên đăng nhập</b><input id="newStudentUser" autocomplete="off" placeholder="Ví dụ: sonic"></label><label><b>Mật khẩu tạm</b><input id="newStudentPass" type="password" autocomplete="new-password" placeholder="Ít nhất 8 ký tự, có chữ và số"></label></div><div class="user-admin-actions"><button class="btn primary" id="createStudentBtn" type="button">Tạo học sinh</button></div><div class="small" id="userAdminMessage"></div></div><div class="card"><div class="user-list-head"><h3>Danh sách học sinh</h3><button class="btn soft" type="button" id="refreshStudentsBtn">Làm mới</button></div><div id="studentList"><div class="small">Đang tải…</div></div></div>`;
    q('#createStudentBtn').onclick=createStudent;q('#refreshStudentsBtn').onclick=loadStudents;await loadStudents();
  };

  async function createStudent(){
    const name=q('#newStudentName')?.value.trim()||'',username=q('#newStudentUser')?.value.trim()||'',password=q('#newStudentPass')?.value||'',msg=q('#userAdminMessage'),btn=q('#createStudentBtn');
    if(!name||!username||!password){if(msg)msg.textContent='Nhập đủ tên, tài khoản và mật khẩu.';return}
    if(btn)btn.disabled=true;if(msg)msg.textContent='Đang tạo tài khoản…';
    try{await rpc('admin_create_student',{p_username:username,p_display_name:name,p_password:password});if(msg)msg.textContent='Đã tạo tài khoản học sinh.';q('#newStudentName').value='';q('#newStudentUser').value='';q('#newStudentPass').value='';await loadStudents()}catch(err){if(msg)msg.textContent=errText(err)}finally{if(btn)btn.disabled=false}
  }

  async function loadStudents(){
    const host=q('#studentList');if(!host)return;host.innerHTML='<div class="small">Đang tải…</div>';
    try{const rows=await rpc('admin_list_students');const list=Array.isArray(rows)?rows:[];if(!list.length){host.innerHTML='<div class="small">Chưa có tài khoản học sinh.</div>';return}
      host.innerHTML=list.map(s=>`<div class="user-row" data-id="${esc(s.id)}"><div class="user-avatar">${esc((s.display_name||s.username||'?').slice(0,1).toUpperCase())}</div><div class="grow"><b>${esc(s.display_name||s.username)}</b><small>@${esc(s.username)} · ${s.active?'Đang hoạt động':'Đã khóa'}${s.last_login_at?' · Đăng nhập gần nhất '+new Date(s.last_login_at).toLocaleDateString('vi-VN'):''}</small></div><div class="user-row-actions"><button class="btn soft" type="button" data-action="password">Đổi mật khẩu</button><button class="btn soft" type="button" data-action="toggle">${s.active?'Khóa':'Mở'}</button><button class="btn soft danger-btn" type="button" data-action="delete">Xóa</button></div></div>`).join('');
      host.querySelectorAll('.user-row').forEach((row,i)=>{const s=list[i];row.querySelector('[data-action="password"]').onclick=()=>resetPassword(s);row.querySelector('[data-action="toggle"]').onclick=()=>toggleStudent(s);row.querySelector('[data-action="delete"]').onclick=()=>deleteStudent(s)})
    }catch(err){host.innerHTML=`<div class="note">${esc(errText(err))}</div>`}
  }

  async function resetPassword(s){const p=prompt(`Mật khẩu mới cho ${s.display_name||s.username}:`);if(!p)return;if(p.length<8||!/[A-Za-zÀ-ỹ]/.test(p)||!/[0-9]/.test(p)){alert('Mật khẩu cần ít nhất 8 ký tự, có chữ và số.');return}try{await rpc('admin_reset_student_password',{p_student_id:s.id,p_password:p});alert('Đã đổi mật khẩu. Học sinh cần đăng nhập lại.')}catch(err){alert(errText(err))}}
  async function toggleStudent(s){if(!confirm(`${s.active?'Khóa':'Mở'} tài khoản ${s.display_name||s.username}?`))return;try{await rpc('admin_set_student_active',{p_student_id:s.id,p_active:!s.active});await loadStudents()}catch(err){alert(errText(err))}}
  async function deleteStudent(s){if(!confirm(`Xóa tài khoản ${s.display_name||s.username}? Dữ liệu đăng nhập của tài khoản này sẽ bị xóa.`))return;try{await rpc('admin_delete_student',{p_student_id:s.id});await loadStudents()}catch(err){alert(errText(err))}}

  function mount(){if(!document.body.classList.contains('admin-shell'))return;const side=q('.side');if(side&&!side.querySelector('[data-page="users"]')){const guide=side.querySelector('[data-page="guide"]');const html='<button class="navbtn" data-page="users" onclick="usersAdmin()">♙ Người dùng</button>';guide?guide.insertAdjacentHTML('beforebegin',html):side.insertAdjacentHTML('beforeend',html)}const mob=q('.mobilebar');if(mob&&!mob.querySelector('[data-admin-users]')){const guide=mob.querySelector('[data-admin-guide]');const html='<button data-admin-users onclick="usersAdmin()">♙<br><small>Người dùng</small></button>';guide?guide.insertAdjacentHTML('beforebegin',html):mob.insertAdjacentHTML('beforeend',html);mob.style.gridTemplateColumns=`repeat(${mob.children.length},1fr)`}}
  const obs=new MutationObserver(mount);obs.observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:['class']});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
