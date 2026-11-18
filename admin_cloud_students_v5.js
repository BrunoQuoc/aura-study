/* AURA STUDY V6 — Admin-only creation of Student login and password.
 * Keeps existing Admin V3 screen, supersedes one-time activation links.
 * Passwords flow directly over HTTPS to the Admin-authenticated Edge function
 * and GoTrue, never saved in localStorage, GitHub, logs or HTML.
 */
(function(){
"use strict";
if(!document.body.classList.contains("admin-shell"))return;
const API="https://ufqzuowjhdqpydqvcsob.supabase.co/functions/v1/aura-identity-pair";
const KEY="sb_publishable_d7x2eMPcTVYwWQc1U3ic1Q_PEaTut1p";
const state={items:[],busy:false,mode:"",selected:""};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const app=()=>document.getElementById("app");
function status(message,error=false){
 const el=document.getElementById("auraCloudUsersStatus");
 if(el){el.textContent=message;el.style.color=error?"#a53c32":"#617591"}
}
async function api(action,fields={}){
 const token=await window.AURA_LEGACY_CLOUD_ADMIN?.getToken?.();
 if(!token)throw Error("Anh cần đăng nhập tài khoản Admin trước khi quản lý học sinh.");
 const r=await fetch(API,{method:"POST",cache:"no-store",
  headers:{"Content-Type":"application/json",apikey:KEY,Authorization:"Bearer "+token},
  body:JSON.stringify({action,...fields})});
 let obj={};try{obj=await r.json()}catch{}
 if(!r.ok)throw Error(obj.error||"Không thể thực hiện trên máy chủ.");
 return obj;
}
function shell(){
 return '<div class="av3" id="auraCloudStudentsV5">'+
 '<div class="av3-header"><div><span class="av3-eyebrow">TÀI KHOẢN HỌC SINH</span>'+
 '<h1>Học sinh</h1>'+
 '<p>Admin tạo tài khoản; học sinh nhập tên đăng nhập và mật khẩu để vào Student. Không cần liên kết kích hoạt, mã ghép thiết bị hay PIN riêng.</p></div></div>'+
 '<section class="av3-panel"><h3>Tạo học sinh mới</h3>'+
 '<div class="aura-v6-account-grid" style="display:grid;grid-template-columns:repeat(3,minmax(160px,1fr));gap:12px;align-items:end">'+
 '<label style="display:grid;gap:7px;font-weight:700">Tên học sinh'+
 '<input id="auraCloudNewStudent" maxlength="60" autocomplete="off" placeholder="Tên học sinh" class="aura-v6-input" style="width:100%;padding:12px;border:1px solid #dce4f0;border-radius:12px"></label>'+
 '<label style="display:grid;gap:7px;font-weight:700">Tên đăng nhập'+
 '<input id="auraCloudNewUsername" maxlength="30" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Ví dụ: sonic6" class="aura-v6-input" style="width:100%;padding:12px;border:1px solid #dce4f0;border-radius:12px"></label>'+
 '<label style="display:grid;gap:7px;font-weight:700">Mật khẩu'+
 '<input id="auraCloudNewPassword" type="password" maxlength="64" minlength="8" autocomplete="new-password" placeholder="Từ 8 ký tự, gồm chữ và số" class="aura-v6-input" style="width:100%;padding:12px;border:1px solid #dce4f0;border-radius:12px"></label></div>'+
 '<div class="av3-actions"><button type="button" class="av3-button solid" data-cloud-user="create">Tạo học sinh</button></div>'+
 '<p class="av3-muted">Tên đăng nhập gồm 3–30 ký tự, bắt đầu bằng chữ thường; mật khẩu từ 8–64 ký tự, có chữ và số. Anh chuyển thông tin riêng cho học sinh. Mật khẩu không được lưu ở trình duyệt Admin.</p></section>'+
 '<section class="av3-panel" id="auraCloudExistingForm" hidden>'+
 '<h3 id="auraCloudExistingTitle">Thiết lập đăng nhập</h3>'+
 '<p id="auraCloudExistingInfo" class="av3-muted"></p>'+
 '<div class="aura-v6-account-grid" style="display:grid;grid-template-columns:repeat(2,minmax(180px,1fr));gap:12px">'+
 '<label id="auraCloudExistingUsernameWrap" style="display:grid;gap:7px;font-weight:700">Tên đăng nhập'+
 '<input id="auraCloudExistingUsername" maxlength="30" autocomplete="off" autocapitalize="none" placeholder="Ví dụ: toan6" class="aura-v6-input" style="width:100%;padding:12px;border:1px solid #dce4f0;border-radius:12px"></label>'+
 '<label style="display:grid;gap:7px;font-weight:700">Mật khẩu mới'+
 '<input id="auraCloudExistingPassword" type="password" maxlength="64" minlength="8" autocomplete="new-password" placeholder="Từ 8 ký tự, gồm chữ và số" class="aura-v6-input" style="width:100%;padding:12px;border:1px solid #dce4f0;border-radius:12px"></label></div>'+
 '<div class="av3-actions"><button type="button" class="av3-button solid" data-cloud-user="save-existing">Lưu tài khoản</button>'+
 '<button type="button" class="av3-button outline" data-cloud-user="cancel-existing">Hủy</button></div></section>'+
 '<section class="av3-panel"><div class="av3-panel-head"><h3>Học sinh đã tạo</h3>'+
 '<button type="button" class="av3-button outline" data-cloud-user="refresh">Làm mới</button></div>'+
 '<p id="auraCloudUsersStatus" class="av3-muted" role="status">Đang đọc danh sách học sinh…</p>'+
 '<div id="auraCloudUsersList"></div></section>'+
 '<p class="av3-footnote">Tài khoản cũ chưa có tên đăng nhập vẫn được giữ. Chọn “Thiết lập đăng nhập” một lần để dùng Student. Đặt lại mật khẩu không cần cấp link và không xóa lịch sử học tập.</p></div>';
}
function render(){
 const el=document.getElementById("auraCloudUsersList");if(!el)return;
 el.innerHTML=state.items.length?state.items.map(u=>{
  const id=String(u.id||"");
  if(!/^[0-9a-f-]{36}$/i.test(id))return "";
  const configured=u.login_ready===true&&typeof u.username==="string"&&u.username!=="";
  return '<div class="resource" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">'+
   '<span aria-hidden="true" style="font-size:23px">👤</span>'+
   '<div class="grow" style="flex:1;min-width:170px"><b>'+esc(u.name)+'</b>'+
   '<small style="display:block">'+(configured?'@'+esc(u.username)+' · Đăng nhập được':'Chưa thiết lập tài khoản')+'</small></div>'+
   '<button type="button" class="av3-button outline" data-cloud-user="'+
   (configured?'reset':'configure')+'" data-learner="'+esc(id)+'">'+
   (configured?'Đặt lại mật khẩu':'Thiết lập đăng nhập')+'</button></div>';
 }).join(""):'<p class="av3-muted">Chưa có học sinh nào. Anh nhập thông tin phía trên và chọn “Tạo học sinh”.</p>';
}
async function refresh(){
 const data=await api("list_password_students");
 if(data.students?.mode!=="PASSWORD_LOGIN"||!Array.isArray(data.students.learners))
  throw Error("Máy chủ chưa cung cấp tài khoản mật khẩu.");
 state.items=data.students.learners;
 render();
 status("Đã tải "+state.items.length+" học sinh từ máy chủ.");
}
function credentials(username,password){
 const u=String(username||"").trim().toLowerCase();
 const p=String(password||"");
 if(!/^[a-z][a-z0-9._-]{2,29}$/.test(u))
  throw Error("Tên đăng nhập từ 3–30 ký tự, bắt đầu bằng chữ thường, không có dấu hoặc khoảng trắng.");
 if(p.length<8||p.length>64||!/[a-zA-Z]/.test(p)||!/[0-9]/.test(p))
  throw Error("Mật khẩu cần 8–64 ký tự và gồm chữ, số.");
 if(p.toLowerCase().includes(u))
  throw Error("Không đặt mật khẩu chứa tên đăng nhập.");
 return {username:u,password:p};
}
async function create(){
 const name=String(document.getElementById("auraCloudNewStudent")?.value||"").trim().replace(/\s+/g," ");
 if(name.length<2||name.length>60)throw Error("Tên học sinh cần 2–60 ký tự.");
 const u=document.getElementById("auraCloudNewUsername"),p=document.getElementById("auraCloudNewPassword");
 const {username,password}=credentials(u?.value,p?.value);
 const result=await api("create_password_student",{name,username,password});
 if(!result.student?.login_ready)throw Error("Chưa tạo được tài khoản.");
 document.getElementById("auraCloudNewStudent").value="";u.value="";p.value="";
 await refresh();
 status("Đã tạo "+name+" (@"+username+"). Học sinh có thể đăng nhập trên Student bằng tên đăng nhập và mật khẩu vừa đặt.");
}
function configure(mode,id){
 const user=state.items.find(x=>x.id===id);
 if(!user)return;
 state.mode=mode;state.selected=id;
 const panel=document.getElementById("auraCloudExistingForm");
 const title=document.getElementById("auraCloudExistingTitle");
 const info=document.getElementById("auraCloudExistingInfo");
 const wrap=document.getElementById("auraCloudExistingUsernameWrap");
 const input=document.getElementById("auraCloudExistingUsername");
 const pass=document.getElementById("auraCloudExistingPassword");
 title.textContent=mode==="reset"?"Đặt lại mật khẩu":"Thiết lập tên đăng nhập và mật khẩu";
 info.textContent="Học sinh: "+user.name+(mode==="reset"?" · Tên đăng nhập: "+user.username:"");
 wrap.hidden=mode==="reset";
 input.value=mode==="reset"?user.username:"";pass.value="";
 panel.hidden=false;pass.focus();
 panel.scrollIntoView({block:"nearest",behavior:"smooth"});
}
function cancel(){
 state.mode="";state.selected="";
 const panel=document.getElementById("auraCloudExistingForm");
 if(panel)panel.hidden=true;
 const p=document.getElementById("auraCloudExistingPassword");if(p)p.value="";
}
async function save(){
 const user=state.items.find(x=>x.id===state.selected);if(!user)return;
 const pass=document.getElementById("auraCloudExistingPassword");
 if(state.mode==="reset"){
  // Existing email is immutable; only rotate native GoTrue password.
  credentials(user.username,pass.value);
  await api("reset_password_student",{student_id:user.id,password:pass.value});
  cancel();status("Đã đặt lại mật khẩu cho "+user.name+". Học sinh đăng nhập bằng mật khẩu mới.");
 }else{
  const input=document.getElementById("auraCloudExistingUsername");
  const {username,password}=credentials(input?.value,pass?.value);
  await api("enable_password_student",{student_id:user.id,username,password});
  cancel();await refresh();
  status("Đã thiết lập @"+username+" cho "+user.name+". Học sinh vào Student và đăng nhập trực tiếp.");
 }
}
async function show(){
 const root=app();if(!root)return;
 if(typeof window.setActive==="function")window.setActive("students");
 document.body.dataset.auraPage="students-cloud-v6";
 root.innerHTML=shell();
 await refresh().catch(e=>status(e.message,true));
}
app()?.addEventListener("click",async e=>{
 const b=e.target.closest("[data-cloud-user]");
 if(!b||!document.getElementById("auraCloudStudentsV5")?.contains(b)||state.busy)return;
 const action=b.dataset.cloudUser,id=b.dataset.learner||"";
 if(action==="cancel-existing"){cancel();return}
 if(action==="configure"||action==="reset"){configure(action,id);return}
 state.busy=true;b.disabled=true;
 try{
  if(action==="create")await create();
  else if(action==="refresh")await refresh();
  else if(action==="save-existing")await save();
 }catch(err){status(String(err?.message||"Thao tác chưa hoàn tất."),true)}
 finally{state.busy=false;b.disabled=false}
});
window.AURA_ADMIN_CLOUD_STUDENTS={show,refresh};
window.auraStudentUsers=show;
})();
