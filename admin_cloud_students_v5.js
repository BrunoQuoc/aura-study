/* AURA STUDY Admin V3 — one source of Student accounts on Supabase.
 * Replaces the visible local-PIN roster with the existing Admin-issued cloud learner list.
 * Legacy local profiles remain untouched for recovery; no new local/PIN user is created.
 */
(function(){
"use strict";
if(!document.body.classList.contains("admin-shell"))return;
const API="https://ufqzuowjhdqpydqvcsob.supabase.co/functions/v1/aura-identity-pair";
const KEY="sb_publishable_d7x2eMPcTVYwWQc1U3ic1Q_PEaTut1p";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const state={items:[],link:"",selected:"",error:"",busy:false,opened:false};
const app=()=>document.getElementById("app");
function status(message,error=false){
 const node=document.getElementById("auraCloudUsersStatus");
 if(node){node.textContent=message;node.style.color=error?"#a04b37":""}
}
async function api(action,fields={}){
 const token=await window.AURA_LEGACY_CLOUD_ADMIN?.getToken?.();
 if(!token)throw Error("Đăng nhập Admin máy chủ trước khi tạo tài khoản.");
 const r=await fetch(API,{method:"POST",cache:"no-store",
  headers:{"Content-Type":"application/json",apikey:KEY,Authorization:"Bearer "+token},
  body:JSON.stringify({action,...fields})});
 let obj={};try{obj=await r.json()}catch{}
 if(!r.ok)throw Error(obj.error||"Máy chủ học sinh chưa sẵn sàng.");
 return obj;
}
function shell(){
 return '<div class="av3" id="auraCloudStudentsV5">'+
 '<div class="av3-header"><div><span class="av3-eyebrow">TÀI KHOẢN HỌC SINH</span>'+
 '<h1>Admin tạo một tài khoản, Student vào học</h1>'+
 '<p>Tạo học sinh trên máy chủ, gửi một liên kết kích hoạt. Sau đó học sinh dùng mọi chức năng trên giao diện Student mà không cần PIN hoặc kết nối lần hai.</p></div></div>'+
 '<section class="av3-panel"><h3>Tạo học sinh mới</h3>'+
 '<div style="display:flex;align-items:end;gap:12px;flex-wrap:wrap">'+
 '<label style="display:grid;gap:7px;flex:1;min-width:210px;font-weight:700">Tên học sinh'+
 '<input id="auraCloudNewStudent" maxlength="60" autocomplete="off" placeholder="Tên học sinh" style="width:100%;padding:12px;border:1px solid #dce4f0;border-radius:12px"/></label>'+
 '<button type="button" class="av3-button solid" data-cloud-user="create">Tạo và cấp liên kết</button></div>'+
 '<p class="av3-muted">Liên kết kích hoạt dùng một lần, hết hạn sau 48 giờ. Chỉ gửi riêng cho học sinh. Tên và quyền được lưu ở máy chủ, không phụ thuộc trình duyệt Admin.</p></section>'+
 '<section class="av3-panel" id="auraCloudLinkPanel" hidden><h3>Liên kết học cho <span id="auraCloudLinkStudent"></span></h3>'+
 '<label style="display:block;margin-bottom:7px">Liên kết kích hoạt một lần</label>'+
 '<input id="auraCloudLinkValue" readonly spellcheck="false" autocomplete="off" style="width:100%;padding:12px;border:1px solid #dae4f4;border-radius:12px"/>'+
 '<div class="av3-actions"><button type="button" class="av3-button solid" data-cloud-user="copy">Sao chép liên kết</button></div></section>'+
 '<section class="av3-panel"><div class="av3-panel-head"><h3>Học sinh đã tạo</h3>'+
 '<button type="button" class="av3-button outline" data-cloud-user="refresh">Làm mới</button></div>'+
 '<p id="auraCloudUsersStatus" class="av3-muted" role="status">Đang đọc danh sách học sinh…</p>'+
 '<div id="auraCloudUsersList"></div></section>'+
 '<p class="av3-footnote">Hệ thống chỉ hiển thị học sinh có tài khoản máy chủ. Tài khoản PIN cục bộ đời cũ được giữ để sao lưu, không tự xem là tài khoản đã kết nối máy chủ.</p></div>';
}
function render(){
 const list=document.getElementById("auraCloudUsersList");if(!list)return;
 list.innerHTML=state.items.length?state.items.map(u=>{
  const id=String(u.id||"");
  if(!/^[0-9a-f-]{36}$/i.test(id))return "";
  return '<div class="resource" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">'+
   '<span style="font-size:23px">👤</span><div class="grow" style="flex:1;min-width:160px"><b>'+
   esc(u.name)+'</b><small style="display:block">'+Number(u.active_devices||0)+
   ' thiết bị đang kết nối</small></div>'+
   '<button type="button" class="av3-button outline" data-cloud-user="issue" data-learner="'+esc(id)+'">Lấy liên kết học</button>'+
   (Number(u.active_devices||0)>0?
   '<button type="button" class="av3-button subtle" data-cloud-user="revoke" data-learner="'+esc(id)+'">Đổi thiết bị</button>':'')+'</div>';
 }).join(""):'<p class="av3-muted">Chưa có học sinh máy chủ. Anh nhập tên và chọn “Tạo và cấp liên kết”.</p>';
}
async function refresh(){
 try{
  const data=await api("list_students");
  state.items=Array.isArray(data.students?.learners)?data.students.learners:[];
  render();
  status("Đã tải "+state.items.length+" học sinh từ máy chủ.");
 }catch(e){status(e.message,true)}
}
function showLink(code,name){
 if(!/^[A-Za-z0-9_-]{32}$/.test(code))throw Error("Mã kích hoạt không hợp lệ.");
 const target=new URL("./aura-student.html#join="+code,location.href);
 if(target.origin!==location.origin)throw Error("Đường dẫn kích hoạt không hợp lệ.");
 state.link=target.href;
 document.getElementById("auraCloudLinkPanel").hidden=false;
 document.getElementById("auraCloudLinkStudent").textContent=name||"học sinh";
 document.getElementById("auraCloudLinkValue").value=state.link;
 status("Đã cấp liên kết. Anh gửi riêng cho học sinh. Sau khi kích hoạt, Student vào giao diện học hiện tại.");
}
async function issue(id){
 const u=state.items.find(x=>x.id===id);
 if(!u)throw Error("Không tìm thấy học sinh trên máy chủ.");
 const data=await api("issue_student_link",{student_id:id});
 showLink(data.activation_code,u.name);
}
async function create(){
 const field=document.getElementById("auraCloudNewStudent");
 const name=String(field?.value||"").trim().replace(/\s+/g," ");
 if(name.length<2||name.length>60)throw Error("Tên học sinh cần 2–60 ký tự.");
 const result=await api("create_student",{name});
 const id=result.student?.student_id;
 if(!/^[0-9a-f-]{36}$/i.test(String(id||"")))throw Error("Máy chủ chưa xác nhận tài khoản.");
 field.value="";
 await refresh();
 await issue(id);
}
async function revoke(id){
 const u=state.items.find(x=>x.id===id);if(!u)return;
 if(!window.confirm("Ngắt thiết bị cũ của "+u.name+"? Học sinh cần kích hoạt lại bằng liên kết mới."))return;
 await api("revoke_student_devices",{student_id:id});
 await refresh();status("Đã ngắt thiết bị cũ của "+u.name+". Chọn “Lấy liên kết học” để cấp lại.");
}
async function copy(){
 if(!state.link)return;
 try{
  if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(state.link);
  else throw Error("Clipboard unavailable");
  status("Đã sao chép liên kết. Anh gửi riêng cho học sinh.");
 }catch{
  const input=document.getElementById("auraCloudLinkValue");
  input?.focus();input?.select();
  status("Hãy chọn nội dung ô liên kết rồi sao chép.");
 }
}
async function show(){
 const root=app();if(!root)return;
 state.opened=true;
 if(typeof window.setActive==="function")window.setActive("students");
 document.body.dataset.auraPage="students-cloud-v5";
 root.innerHTML=shell();
 await refresh();
}
app()?.addEventListener("click",async event=>{
 const button=event.target.closest("[data-cloud-user]");
 if(!button||!document.getElementById("auraCloudStudentsV5")?.contains(button)||state.busy)return;
 const action=button.dataset.cloudUser,id=button.dataset.learner||"";
 state.busy=true;button.disabled=true;
 try{
  if(action==="create")await create();
  else if(action==="refresh")await refresh();
  else if(action==="issue")await issue(id);
  else if(action==="revoke")await revoke(id);
  else if(action==="copy")await copy();
 }catch(e){status(e.message,true)}
 finally{state.busy=false;button.disabled=false}
});
window.AURA_ADMIN_CLOUD_STUDENTS={show,refresh};
window.auraStudentUsers=show;
})();
