/* AURA STUDY -- SGK source catalog auto sync.
 * Trusted publisher references are fetched when Student opens the original study UI.
 * They do NOT require Admin approval, and are not imported as textbook exercises.
 */
(function(){
"use strict";
if(!document.body.classList.contains("student-shell"))return;
const BASE="https://ufqzuowjhdqpydqvcsob.supabase.co";
const KEY="sb_publishable_d7x2eMPcTVYwWQc1U3ic1Q_PEaTut1p";
const API=BASE+"/functions/v1/aura-legacy-content-sync-v1";
const CACHE_MS=300000;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let cached=null,expires=0,pending=null,drawSerial=0,currentSubject="";
function safePublisherUrl(value){
 try{
  const u=new URL(String(value||""));
  return u.protocol==="https:"&&u.hostname==="taphuan.nxbgd.vn"?u.href:"";
 }catch{return ""}
}
function filterBooks(books,subject){
 if(subject && subject!=="TOAN")return []; // Only the two verified Toán 6 publisher sources exist today.
 return books.filter(x=>
  x&&x.toc_verified===true&&x.review_required===false&&
  x.full_textbook_verified===false&&safePublisherUrl(x.source_url)&&Array.isArray(x.sections)
 );
}
function buildPanel(){
 return '<section class="card" id="auraSgkAutoCatalog" style="margin-top:18px">'+
 '<div class="small">SGK · TỰ ĐỒNG BỘ TỪ NGUỒN NHÀ XUẤT BẢN</div>'+
 '<h2>Thư viện SGK chính thức</h2>'+
 '<p class="meta">AURA tự nhận danh mục SGK từ nguồn đã đăng ký, không cần Admin duyệt. '+
 'Mở sách tại trang NXB để xem nội dung mới nhất; danh sách dưới đây chỉ là mục lục đã xác minh, không phải bản sao toàn bộ SGK.</p>'+
 '<div id="auraSgkAutoStatus" class="meta" role="status">Đang tải nguồn SGK...</div>'+
 '<div id="auraSgkAutoItems"></div></section>';
}
function ensurePanel(){
 const app=document.getElementById("app");
 if(!app)return null;
 let panel=app.querySelector("#auraSgkAutoCatalog");
 if(!panel){app.insertAdjacentHTML("beforeend",buildPanel());panel=app.querySelector("#auraSgkAutoCatalog")}
 return panel;
}
function render(panel,sources,subject=""){
 if(!panel?.isConnected)return;
 const root=panel.querySelector("#auraSgkAutoItems");
 const books=filterBooks(sources,subject);
 if(!books.length){
  root.innerHTML='<p class="meta">Chưa có nguồn SGK đã xác minh cho môn này. AURA không tự tạo dữ liệu nguồn.</p>';
  return;
 }
 root.innerHTML=books.map(book=>{
  const sections=book.sections.filter(it=>it&&typeof it.heading==="string"&&
    Number.isInteger(it.start_page)&&it.start_page>0).slice(0,150);
  const href=esc(safePublisherUrl(book.source_url));
  return '<article class="resource" style="display:block">'+
   '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">'+
   '<div class="fileico">📘</div><div class="grow" style="min-width:180px">'+
   '<b>'+esc(book.title)+'</b><small style="display:block">'+
   esc(book.subject)+' '+esc(book.grade)+' · Tập '+esc(book.volume)+
   ' · '+sections.length+' mục lục đã đối chiếu · không cần duyệt</small></div>'+
   '<a class="btn primary" target="_blank" rel="noopener noreferrer" href="'+href+'">Mở SGK trên NXB</a></div>'+
   '<details style="margin-top:10px"><summary style="cursor:pointer;font-weight:600">Xem mục lục SGK ('+
   sections.length+' mục)</summary><ol style="padding-left:24px">'+sections.map(it=>
    '<li>'+esc(it.heading)+' <small>· Trang '+esc(it.start_page)+'</small></li>').join("")+
   '</ol></details></article>';
 }).join("");
}
async function serverCatalog(){
 const cloud=window.AURA_LEGACY_CLOUD_STUDENT;
 if(!cloud?.getToken)throw Error("Cổng Student chưa kết nối.");
 const response=await fetch(API,{method:"POST",cache:"no-store",
  headers:{"Content-Type":"application/json",apikey:KEY,
    Authorization:"Bearer "+await cloud.getToken()},
  body:JSON.stringify({action:"sgk_auto_catalog"})});
 let data={};try{data=await response.json()}catch{}
 if(!response.ok)throw Error(response.status===403?
  "Thiết bị chưa được kích hoạt hoặc đã bị thu hồi quyền.":
  (data.error||"Không đọc được danh mục SGK trên máy chủ."));
 if(data.staging_only!==true||data.review_required!==false||
   data.official_exam_enabled!==false||!Array.isArray(data.sources))
  throw Error("Danh mục SGK máy chủ không hợp lệ.");
 return data.sources;
}
async function refresh(force=false){
 const panel=ensurePanel();if(!panel)return;
 const status=panel.querySelector("#auraSgkAutoStatus");
 const seq=++drawSerial;
 if(!force&&cached&&Date.now()<expires){
  render(panel,cached,currentSubject);
  status.textContent="SGK tự đồng bộ từ nguồn NXB · "+cached.length+" tập đã đăng ký.";
  return;
 }
 status.textContent="Đang cập nhật danh mục SGK tự động...";
 try{
  if(!pending)pending=serverCatalog().finally(()=>{pending=null});
  const books=await pending;
  cached=books;expires=Date.now()+CACHE_MS;
  if(seq!==drawSerial||!panel.isConnected)return;
  render(panel,books,currentSubject);
  status.textContent="Đã đồng bộ "+books.length+" tập từ nguồn SGK đã đăng ký. Không cần duyệt từng tài liệu.";
 }catch(error){
  if(seq!==drawSerial||!panel.isConnected)return;
  if(cached){render(panel,cached,currentSubject);status.textContent="Đang dùng danh mục gần nhất: "+error.message}
  else{
   panel.querySelector("#auraSgkAutoItems").innerHTML=
    '<p class="meta">Hãy kích hoạt Student qua liên kết Admin cấp để nhận SGK trên máy này.</p>'+
    '<a href="./aura-student.html" class="btn soft">Mở kết nối Student</a>';
   status.textContent=error.message;
  }
 }
}
function attach(subject=""){
 currentSubject=subject;
 setTimeout(()=>{if(document.body.dataset.auraPage==="home"||
  document.body.dataset.auraPage==="lessons"||
  document.body.dataset.auraPage==="library"||
  document.body.dataset.auraPage==="subject"||
  document.getElementById("app"))refresh(false);},35);
}
function wrap(name,subjectArg=false){
 const previous=window[name];if(typeof previous!=="function")return;
 window[name]=function(...args){
  const output=previous.apply(this,args);
  attach(subjectArg?String(args[0]||""):"");
  return output;
 };
}
wrap("home");wrap("lessons");wrap("library");wrap("lessonSubject",true);
wrap("studentReviewHub");wrap("studentExamSubject");
window.AURA_SGK_AUTO_CATALOG={refresh:()=>refresh(true),getCached:()=>cached};
if(typeof setInterval==="function")setInterval(()=>{
 if(document.visibilityState!=="hidden"&&document.getElementById("auraSgkAutoCatalog"))refresh(true);
},600000);
window.addEventListener("focus",()=>{if(document.getElementById("auraSgkAutoCatalog"))refresh(true)});
window.addEventListener("load",()=>{setTimeout(()=>{
 if(!document.getElementById("auraSgkAutoCatalog")&&
    (document.body.dataset.auraPage==="home"||document.body.dataset.auraPage==="lessons"))attach();
},100)},{once:true});
})();