/* AURA STUDY — original Student shell: read only household-scoped published resources.
 * Requires an actively paired Student Auth session. Does not change old navigation.
 */
(function(){
"use strict";
if(!document.body.classList.contains("student-shell"))return;
const BASE="https://ufqzuowjhdqpydqvcsob.supabase.co";
const KEY="sb_publishable_d7x2eMPcTVYwWQc1U3ic1Q_PEaTut1p";
const STORE="aura-stage-student-v1";
const API=BASE+"/functions/v1/aura-legacy-content-sync-v1";
const SUBJECT={TOAN:"Toán",NGUVAN:"Ngữ văn",TIENGANH:"Tiếng Anh",KHTN:"KHTN",LSDL:"Lịch sử & Địa lý",GDCD:"GDCD",TINHOC:"Tin học",CONGNGHE:"Công nghệ",KHAC:"Khác"};
const DOC={lesson:"Bài học",practice:"Bài tập",exam:"Đề kiểm tra thử",reference:"Tài liệu tham khảo",formula:"Công thức"};
const PERIOD={GK1:"Giữa kỳ 1",CK1:"Cuối kỳ 1",GK2:"Giữa kỳ 2",CK2:"Cuối kỳ 2"};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const driveId=id=>typeof id==="string"&&/^[A-Za-z0-9_-]{10,180}$/.test(id);
let refreshTask=null;
function stored(){try{return JSON.parse(localStorage.getItem(STORE)||"null")}catch{return null}}
async function token(){
 const s=stored();
 if(!s?.access_token)throw Error("Thiết bị chưa kết nối tài khoản Student máy chủ.");
 if(!s.expires_at||s.expires_at*1000>Date.now()+65000)return s.access_token;
 if(!s.refresh_token)throw Error("Phiên Student đã hết hạn, cần kích hoạt lại.");
 if(!refreshTask)refreshTask=(async()=>{
  const r=await fetch(BASE+"/auth/v1/token?grant_type=refresh_token",{
   method:"POST",cache:"no-store",headers:{"Content-Type":"application/json",apikey:KEY},
   body:JSON.stringify({refresh_token:s.refresh_token})});
  if(!r.ok)throw Error("Phiên Student không gia hạn được; cần liên kết kích hoạt mới.");
  const v=await r.json();
  if(!v.access_token||!v.refresh_token)throw Error("Phiên Student không hợp lệ.");
  if(stored()?.access_token===s.access_token)localStorage.setItem(STORE,
   JSON.stringify({...s,...v,expires_at:Math.floor(Date.now()/1000)+(Number(v.expires_in)||3600)}));
  return stored()?.access_token||v.access_token;
 })().finally(()=>refreshTask=null);
 return refreshTask;
}
async function api(){
 const r=await fetch(API,{method:"POST",cache:"no-store",
 headers:{"Content-Type":"application/json",apikey:KEY,Authorization:"Bearer "+await token()},
 body:JSON.stringify({action:"student_list"})});
 let v={};try{v=await r.json()}catch{}
 if(!r.ok)throw Error(r.status===403?"Thiết bị Student chưa được ghép hoặc đã bị thu hồi quyền.":(v.error||"Không kết nối được kho tài liệu."));
 if(v.staging_only!==true||v.official_exam_enabled!==false||!Array.isArray(v.items))throw Error("Kho tài liệu chưa đủ điều kiện Staging.");
 return v.items.filter(x=>driveId(x.drive_file_id)&&DOC[x.doc_type]&&SUBJECT[x.subject]);
}
function html(){
 return '<section id="auraLegacyCloudStudent" class="card" style="margin-top:17px">'+
 '<div class="small">TÀI LIỆU ĐỒNG BỘ TỪ ADMIN</div>'+
 '<h2 style="margin:8px 0">Tài liệu mới từ Admin</h2>'+
 '<p class="meta">Được Admin xuất bản từ INBOX qua máy chủ. Đây là tài liệu học bổ sung, không phải bài thi hoặc điểm chính thức.</p>'+
 '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">'+
 '<p id="auraCloudStudentStatus" class="meta" role="status" style="flex:1;margin:0">Đang kết nối...</p>'+
 '<button type="button" class="btn soft" id="auraCloudStudentRefresh">Làm mới</button></div>'+
 '<div id="auraCloudStudentItems" style="margin-top:10px"></div></section>';
}
let active=null,mode="home",subject="",period="",fetchId=0;
function renderRows(rows,panel){
 const root=panel.querySelector("#auraCloudStudentItems");
 const filtered=rows.filter(r=>{
  if(mode==="subject"&&r.subject!==subject)return false;
  if(mode==="period"&&r.subject!==subject)return false;
  if(mode==="period"&&period&&r.period!==period)return false;
  if(mode==="lesson"&&r.doc_type!=="lesson"&&r.doc_type!=="formula"&&r.doc_type!=="reference")return false;
  return true;
 }).slice(0,mode==="home"?6:150);
 if(!filtered.length){
  root.innerHTML='<p class="meta">Chưa có tài liệu phù hợp được Admin xuất bản. Khi Admin đăng lên, bấm Làm mới hoặc mở lại mục này.</p>';
  return;
 }
 root.innerHTML=filtered.map(r=>
  '<article class="resource" style="display:flex;align-items:center;flex-wrap:wrap;gap:12px">'+
  '<div class="fileico">📘</div><div class="grow" style="min-width:180px">'+
  '<b>'+esc(r.title)+'</b><small style="display:block">'+esc(SUBJECT[r.subject])+
  ' · '+esc(DOC[r.doc_type])+(r.period?' · '+esc(PERIOD[r.period]||r.period):'')+'</small></div>'+
  '<a class="btn primary" target="_blank" rel="noopener noreferrer" href="https://drive.google.com/open?id='+
  encodeURIComponent(r.drive_file_id)+'">Mở tài liệu</a></article>').join("")+
  '<p class="meta">Nếu Drive báo chưa có quyền, cần Admin cấp quyền xem tệp gốc. Link từ AURA không tự mở quyền Drive.</p>';
}
async function load(panel,which,sub,per){
 const serial=++fetchId;
 const status=panel.querySelector("#auraCloudStudentStatus");
 if(!stored()?.access_token){
  status.textContent="Chưa kích hoạt kết nối Student trên máy chủ.";
  panel.querySelector("#auraCloudStudentItems").innerHTML=
   '<p class="meta">Học sinh cần mở liên kết kích hoạt riêng do Admin gửi một lần trên thiết bị này. '+
   'Sau khi kích hoạt, quay lại giao diện Student cũ và bấm Làm mới.</p>'+
   '<a class="btn soft" href="./aura-student.html">Mở trang kích hoạt Student</a>';
  return;
 }
 status.textContent="Đang lấy tài liệu đã xuất bản...";
 try{
  const rows=await api();
  if(serial!==fetchId||!panel.isConnected)return;
  renderRows(rows,panel);
  status.textContent=rows.length+" tài liệu đang chia sẻ trong kho của học sinh.";
 }catch(e){
  if(serial!==fetchId||!panel.isConnected)return;
  panel.querySelector("#auraCloudStudentItems").replaceChildren();
  status.textContent=e.message+" Nhờ Admin kiểm tra quyền ghép thiết bị.";
 }
}
function attach(next,sub="",per=""){
 const app=document.getElementById("app");
 if(!app)return;
 let panel=app.querySelector("#auraLegacyCloudStudent");
 if(!panel){
  app.insertAdjacentHTML("beforeend",html());
  panel=app.querySelector("#auraLegacyCloudStudent");
  panel.querySelector("#auraCloudStudentRefresh").addEventListener("click",()=>load(panel,mode,subject,period));
 }
 active=panel;mode=next;subject=sub;period=per;
 load(panel,next,sub,per);
}
function wrap(name,scope){
 const original=window[name];if(typeof original!=="function")return;
 window[name]=function(...args){
  const value=original.apply(this,args);
  setTimeout(()=>attach(scope,args[scope==="period"?1:0]||"",scope==="period"?args[0]||"":""),15);
  return value;
 };
}
wrap("home","home");
wrap("library","all");
wrap("studentReviewHub","all");
wrap("lessons","lesson");
wrap("lessonSubject","subject");
wrap("subject","subject");
wrap("studentExamSubject","period");
window.AURA_LEGACY_CLOUD_STUDENT={refresh:()=>{if(active?.isConnected)load(active,mode,subject,period)}};
window.addEventListener("focus",()=>{if(active?.isConnected)load(active,mode,subject,period)});
window.addEventListener("load",()=>{
 setTimeout(()=>{
  if(!active?.isConnected&&document.body.dataset.auraPage==="home")attach("home");
 },120);
},{once:true});
})();
