/* AURA STUDY — legacy Admin approved materials -> cross-device Staging sync.
 * Original Admin shell/navigation unchanged. Explicit Admin publish is required.
 */
(function(){
"use strict";
if(!document.body.classList.contains("admin-shell"))return;
const BASE="https://ufqzuowjhdqpydqvcsob.supabase.co";
const KEY="sb_publishable_d7x2eMPcTVYwWQc1U3ic1Q_PEaTut1p";
const STORE="aura-stage-parent-v1",INDEX="aura_library_index_v1";
const API=BASE+"/functions/v1/aura-legacy-content-sync-v1";
// SGK official publisher sources are NOT part of this manual review list.
const MANUAL_SOURCE=new Set(["ADMIN_APPROVED_INBOX","ADMIN_APPROVED_RECOVERED","ADMIN_APPROVED_FINAL"]);
function isExamSet(r){
 if(r.docType==="exam")return true;
 if(r.docType!=="practice")return false;
 const title=String(r.name||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .replace(/đ/g,"d").replace(/Đ/g,"D").toLowerCase();
 return /\bde[\s._-]*(thi|kiem[\s._-]*tra|kt|giua[\s._-]*ky|cuoi[\s._-]*ky)\b/.test(title)
  || /\bbai[\s._-]*kiem[\s._-]*tra\b/.test(title);
}
const SUBJECT={TOAN:"Toán",NGUVAN:"Ngữ văn",TIENGANH:"Tiếng Anh",KHTN:"KHTN",LSDL:"Lịch sử & Địa lý",GDCD:"GDCD",TINHOC:"Tin học",CONGNGHE:"Công nghệ",KHAC:"Khác"};
const DOC={lesson:"Bài học",practice:"Bài tập",exam:"Đề kiểm tra thử",reference:"Tài liệu tham khảo",formula:"Công thức"};
const PERIOD={GK1:"Giữa kỳ 1",CK1:"Cuối kỳ 1",GK2:"Giữa kỳ 2",CK2:"Cuối kỳ 2"};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const driveId=id=>typeof id==="string"&&/^[A-Za-z0-9_-]{10,180}$/.test(id);
let refreshTask=null;
function storedSession(){try{return JSON.parse(localStorage.getItem(STORE)||"null")}catch{return null}}
function approvedDocs(){
 let rows=[];try{rows=JSON.parse(localStorage.getItem(INDEX)||"[]")}catch{}
 if(!Array.isArray(rows))return [];
 const seen=new Set();
 return rows.filter(r=>{
  if(!r||r.status!=="ACTIVE"||!driveId(r.driveFileId)||
   !SUBJECT[r.subject]||!isExamSet(r)||seen.has(r.driveFileId))return false;
  if(!MANUAL_SOURCE.has(r.source))return false;
  seen.add(r.driveFileId);return true;
 }).slice(0,200);
}
async function token(){
 const s=storedSession();
 if(!s?.access_token)throw Error("Chưa đăng nhập Admin máy chủ. Mở mục Đăng nhập Admin bên dưới.");
 if(!s.expires_at||s.expires_at*1000>Date.now()+65000)return s.access_token;
 if(!s.refresh_token)throw Error("Phiên Admin đã hết hạn. Hãy đăng nhập lại.");
 if(!refreshTask)refreshTask=(async()=>{
  const r=await fetch(BASE+"/auth/v1/token?grant_type=refresh_token",{
   method:"POST",cache:"no-store",headers:{"Content-Type":"application/json",apikey:KEY},
   body:JSON.stringify({refresh_token:s.refresh_token})});
  if(!r.ok)throw Error("Không gia hạn được phiên Admin. Hãy đăng nhập lại.");
  const v=await r.json();
  if(!v.access_token||!v.refresh_token)throw Error("Phiên Admin mới không hợp lệ.");
  if(storedSession()?.access_token===s.access_token)localStorage.setItem(STORE,
   JSON.stringify({...s,...v,expires_at:Math.floor(Date.now()/1000)+(Number(v.expires_in)||3600)}));
  return storedSession()?.access_token||v.access_token;
 })().finally(()=>refreshTask=null);
 return refreshTask;
}
async function api(action,data={}){
 const r=await fetch(API,{method:"POST",cache:"no-store",
  headers:{"Content-Type":"application/json",apikey:KEY,Authorization:"Bearer "+await token()},
  body:JSON.stringify({action,...data})});
 let v={};try{v=await r.json()}catch{}
 if(!r.ok)throw Error(r.status===403?"Tài khoản hiện tại chưa có quyền Admin trên máy chủ.":(v.error||"Không thể đồng bộ."));
 if(v.staging_only!==true)throw Error("Máy chủ không xác nhận Staging.");
 return v;
}
function panelHTML(){
 return '<section class="card aura-cloud-admin" id="auraLegacyCloudAdmin" style="margin-top:18px">'+
 '<div class="small">THƯ VIỆN CHUNG · GIAO DIỆN ADMIN CŨ</div>'+
 '<h2>SGK tự cập nhật · Đề thi cần duyệt</h2>'+
 '<p class="meta"><b>SGK chính thức:</b> AURA đồng bộ từ nguồn NXB đã đăng ký, không có bước duyệt từng tài liệu. '+
 '<b>Đề thi / đề kiểm tra anh đưa:</b> vẫn cần Admin duyệt ở INBOX trước khi xuất bản cho Student.</p>'+
 '<div id="auraSgkAutoAdmin" class="meta">Đang tải danh mục SGK tự động...</div>'+
 '<p class="meta">Riêng bộ đề đã duyệt: tệp gốc vẫn ở Drive. Có thể lưu bản sao lên AURA để Student không phải xin quyền xem Drive.</p>'+
 '<p class="meta"><a href="./aura-admin.html">Đăng nhập máy chủ / cấp liên kết kích hoạt Student</a> (chỉ cần khi kết nối lần đầu).</p>'+
 '<p id="auraCloudAdminStatus" role="status">Đang kiểm tra kết nối kho chung...</p>'+
 '<div id="auraCloudAdminItems"></div></section>';
}
let activePanel=null,loadCounter=0;
function printItems(items){
 const panel=document.getElementById("auraLegacyCloudAdmin");
 if(!panel||!panel.isConnected)return;
 const root=panel.querySelector("#auraCloudAdminItems");
 const local=approvedDocs();
 const byId=new Map(items.map(r=>[r.drive_file_id,r]));
 const rows=[];
 for(const r of local){
  const remote=byId.get(r.driveFileId),active=remote?.visibility==="PUBLISHED_STAGING";
  rows.push('<div class="resource" style="display:flex;align-items:center;flex-wrap:wrap;gap:9px">'+
   '<div class="grow" style="min-width:180px"><b>'+esc(r.name||"Tài liệu")+'</b><small style="display:block">'+
   esc(SUBJECT[r.subject])+' · '+esc(DOC[r.docType])+(r.period?" · "+esc(PERIOD[r.period]||r.period):"")+
   (active?(remote?.asset_ready?" · Đã có tệp trên AURA":" · Đang chia sẻ link, chưa lưu tệp"):" · Chưa xuất bản")+'</small></div>'+
   (active?'<button type="button" class="btn primary" data-cloud-action="asset" data-cloud-id="'+esc(r.driveFileId)+'">'+(remote?.asset_ready?"Thay bản sao":"Lưu tệp lên AURA")+'</button>'+
   '<button type="button" class="btn soft" data-cloud-action="withdraw" data-cloud-id="'+esc(r.driveFileId)+'">Thu hồi</button>':
   '<button type="button" class="btn primary" data-cloud-action="publish" data-cloud-id="'+esc(r.driveFileId)+'">Xuất bản</button>')+
   '</div>');
 }
 for(const r of items){
  if(!isExamSet({docType:r.doc_type,name:r.title}))continue;
  if(local.some(x=>x.driveFileId===r.drive_file_id))continue;
  if(r.visibility==="PUBLISHED_STAGING"){
   rows.push('<div class="resource" style="display:flex;gap:9px;align-items:center;flex-wrap:wrap">'+
   '<div class="grow" style="min-width:180px"><b>'+esc(r.title)+'</b><small style="display:block">'+
   esc(SUBJECT[r.subject]||r.subject)+(r.asset_ready?' · Đã có tệp AURA':' · Chưa có tệp AURA')+' · Từ lần đăng nhập khác</small></div>'+
   '<button class="btn primary" type="button" data-cloud-action="asset" data-cloud-id="'+esc(r.drive_file_id)+'">'+(r.asset_ready?'Thay bản sao':'Lưu tệp lên AURA')+'</button>'+
   '<button class="btn soft" type="button" data-cloud-action="withdraw" data-cloud-id="'+esc(r.drive_file_id)+'">Thu hồi</button></div>');
  }
 }
 root.innerHTML='<h3>Đề thi / đề kiểm tra đã được duyệt</h3>'+
 (rows.join("")||'<p class="meta">Chưa có bộ đề thi / kiểm tra được Admin duyệt. SGK không xuất hiện trong hàng chờ này.</p>');
}
function showSgk(panel,data,error){
 const root=panel.querySelector("#auraSgkAutoAdmin");
 if(!root)return;
 if(error){root.textContent="Chưa tải được nguồn SGK: "+error.message;return}
 const books=Array.isArray(data?.sources)?data.sources:[];
 const safe=u=>{try{const x=new URL(u);return x.protocol==="https:"&&x.hostname==="taphuan.nxbgd.vn"?x.href:""}catch{return ""}};
 root.innerHTML='<b>SGK tự đồng bộ: '+books.length+' tập · không yêu cầu duyệt</b>'+
 books.map(book=>{
  const url=safe(book.source_url);
  return '<div style="margin:7px 0"><span>'+esc(book.title)+' · '+esc(book.sections?.length||0)+' mục lục</span> '+
   (url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Mở nguồn NXB</a>':'')+'</div>';
 }).join("")+
 '<p class="meta">Mục lục đã đối chiếu với nhà xuất bản; nội dung trang sách và bài tập chưa được chứng nhận sao chép.</p>';
}
async function load(panel){
 const key=++loadCounter;
 const status=panel.querySelector("#auraCloudAdminStatus");
 if(!storedSession()?.access_token){
  status.innerHTML='Để đồng bộ giữa hai thiết bị, <a href="./aura-admin.html">đăng nhập Admin bằng email</a> một lần, sau đó trở lại trang Admin cũ này.';
  printItems([]);
  const root=panel.querySelector("#auraSgkAutoAdmin");
  if(root)root.textContent="Đăng nhập Admin máy chủ để xem trạng thái đồng bộ SGK. SGK không cần nút Duyệt.";
  return;
 }
 status.textContent="Đang tải các đề đã duyệt...";
 const sgk=api("sgk_auto_catalog").then(data=>({data}),error=>({error}));
 sgk.then(result=>{if(key===loadCounter&&panel.isConnected)showSgk(panel,result.data,result.error)});
 try{
  const result=await api("admin_list");
  if(key!==loadCounter||!panel.isConnected)return;
  const items=result.items||[];
  printItems(items);
  status.textContent=items.filter(x=>x.visibility==="PUBLISHED_STAGING"&&isExamSet({docType:x.doc_type,name:x.title})).length+
   " bộ đề đang chia sẻ qua máy chủ. Chỉ bộ đề đã được Admin duyệt mới sử dụng nút Xuất bản.";
 }catch(e){
  if(key!==loadCounter||!panel.isConnected)return;
  status.textContent=e.message;
  printItems([]);
 }
}
async function onClick(e){
 const el=e.target.closest("button[data-cloud-action]");if(!el)return;
 const id=el.dataset.cloudId,action=el.dataset.cloudAction;
 if(!driveId(id))return;
 const panel=document.getElementById("auraLegacyCloudAdmin");
 if(!panel)return;
 const status=panel.querySelector("#auraCloudAdminStatus");
 el.disabled=true;
 try{
  if(action==="asset"){
   if(!window.AURA_LEGACY_ASSET_ADMIN)throw Error("Mô-đun tệp AURA chưa tải.");
   await window.AURA_LEGACY_ASSET_ADMIN.upload(id);
  }else if(action==="publish"){
   const r=approvedDocs().find(x=>x.driveFileId===id);
   if(!r)throw Error("Tài liệu không còn trong danh sách đã duyệt. Vui lòng mở lại INBOX.");
   if(!confirm("Xuất bản bộ đề đã DUYỆT '"+String(r.name||"Tài liệu").slice(0,70)+"' cho Student đã ghép thiết bị? Đề này chỉ dùng ôn tập, không bật thi chính thức."))return;
   const out=await api("admin_publish",{
    file_id:r.driveFileId,title:String(r.name||"Tài liệu").slice(0,180),
    subject:r.subject,doc_type:r.docType,period:PERIOD[r.period]?r.period:""});
   if(out.published?.visibility!=="PUBLISHED_STAGING")throw Error("Máy chủ chưa ghi nhận xuất bản.");
   status.textContent="Đã xuất bản danh mục. Hãy lưu bản sao lên AURA để Student đọc mà không cần quyền Drive.";
   if(window.AURA_DRIVE_AUTH?.token&&window.AURA_LEGACY_ASSET_ADMIN)
    await window.AURA_LEGACY_ASSET_ADMIN.fromDrive(id);
  }else if(action==="withdraw"){
   if(!confirm("Thu hồi tài liệu này khỏi danh sách Student?"))return;
   const out=await api("admin_withdraw",{file_id:id});
   if(out.withdrawn?.visibility!=="WITHDRAWN")throw Error("Chưa xác nhận thu hồi.");
   status.textContent="Đã thu hồi. Student sẽ không còn thấy tài liệu khi tải danh sách mới.";
  }
  await load(panel);
 }catch(err){status.textContent=err.message}
 finally{el.disabled=false}
}
function attach(){
 const app=document.getElementById("app");
 if(!app)return;
 let panel=app.querySelector("#auraLegacyCloudAdmin");
 if(!panel){
  app.insertAdjacentHTML("beforeend",panelHTML());
  panel=app.querySelector("#auraLegacyCloudAdmin");
  panel.addEventListener("click",onClick);
 }
 activePanel=panel;
 load(panel);
}
function wrap(name){
 const original=window[name];if(typeof original!=="function")return;
 window[name]=function(){
  const out=original.apply(this,arguments);
  setTimeout(attach,30);
  return out;
 };
}
wrap("library");
window.AURA_LEGACY_CLOUD_ADMIN={refresh:()=>{if(activePanel?.isConnected)load(activePanel)},localApproved:approvedDocs,getToken:token};
window.addEventListener("focus",()=>{if(activePanel?.isConnected)load(activePanel)});
})();
