/* AURA STUDY — Admin V3 unified workspace.
 * Keeps legacy functions/data intact, removes duplicative main-navigation items.
 * Official SGK + practice SOURCE CATALOG is automatic; external exams/sample papers
 * require an explicit recorded Admin approval before publishing.
 */
(function(){
"use strict";
if(!document.body.classList.contains("admin-shell"))return;
const app=document.getElementById("app");if(!app)return;
const BASE="https://ufqzuowjhdqpydqvcsob.supabase.co";
const KEY="sb_publishable_d7x2eMPcTVYwWQc1U3ic1Q_PEaTut1p";
const ENDPOINT=BASE+"/functions/v1/aura-legacy-content-sync-v1";
const legacy=Object.freeze({
 library:window.library,home:window.home,lessons:window.lessons,
 inbox:window.auraAdminInbox,sources:window.auraDriveSourceInbox,
 generator:window.generator,students:window.auraStudentUsers,
 history:window.history,metadata:window.auraMetadataManager,
 guide:window.guide,backup:window.backup,restore:window.restoreBackup
});
const state={view:"home",tab:"sgk",server:null,loading:false,error:"",fetchAt:0,request:null};
const names={sgk:"Sách giáo khoa",practice:"Bài tập",exam:"Kiểm tra"};
function navActive(page){
 const button=document.querySelector('.side .navbtn[data-page="'+page+'"]');
 if(button&&!button.classList.contains("active")&&typeof window.setActive==="function")
  window.setActive(page);
 document.querySelectorAll(".mobilebar [data-page]").forEach(b=>{
  b.classList.toggle("active",b.dataset.page===page);
 });
}
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const allowedOfficial=v=>{try{const u=new URL(v);return u.protocol==="https:"&&u.hostname==="taphuan.nxbgd.vn"?u.href:""}catch{return ""}};
function read(key,other){
 try{const x=JSON.parse(localStorage.getItem(key)||"null");return x??other}catch{return other}
}
function normalize(v){
 return String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .replace(/[Đđ]/g,"d").toLowerCase();
}
function externalKind(row){
 const doc=row?.adminConfirmation?.docType||row?.docType||row?.suggestedDocType||"";
 const title=normalize(row?.name);
 if(doc==="exam"||(doc==="practice"&&/\b(de\s*(thi|kiem\s*tra)|bai\s*kiem\s*tra)\b/.test(title)))return "EXAM";
 if(["practice","lesson","reference"].includes(doc)&&
   /\b(bai\s*mau|bai\s*giai\s*mau|vi\s*du\s*mau|sample\s*(paper|work))\b/.test(title))return "SAMPLE";
 return "";
}
function pending(){
 const queue=read("aura_inbox_queue_v1",[]);
 if(!Array.isArray(queue))return 0;
 return queue.filter(x=>x&&x.status==="WAITING_REVIEW"&&externalKind(x)).length;
}
const count=(key)=>state.server?state.server[key]:null;
const value=v=>typeof v==="number"&&Number.isFinite(v)?String(v):"—";
function loadingInfo(){
 if(state.loading)return '<span class="av3-sync"><i class="av3-spin"></i>Đang lấy dữ liệu trên máy chủ...</span>';
 if(state.error)return '<span class="av3-error">'+esc(state.error)+'</span>';
 if(state.server)return '<span class="av3-live">Đã kết nối Staging · danh mục nguồn đã đăng ký</span>';
 return '<span class="av3-sync">Đăng nhập Admin máy chủ để xem số liệu</span>';
}
function button(label,action,variant="outline",extra=""){
 return '<button type="button" class="av3-button '+variant+'" data-v3-action="'+esc(action)+'" '+extra+'>'+label+'</button>';
}
function header(eyebrow,title,lead,actions=""){
 return '<div class="av3-header"><div><span class="av3-eyebrow">'+eyebrow+'</span>'+
 '<h1>'+title+'</h1><p>'+lead+'</p></div>'+
 (actions?'<div class="av3-header-actions">'+actions+'</div>':'')+'</div>';
}
function shell(title){
 return '<div class="av3">'+title+
 '<div class="av3-connect" role="status">'+loadingInfo()+
 ' <a href="./aura-admin.html" class="av3-auth-link">Kết nối Admin</a>'+
 button('Làm mới','refresh','subtle')+'</div>';
}
function tile(kind,number,title,description,tag){
 return '<button type="button" class="av3-lane-card" data-v3-action="tab-'+kind+'">'+
 '<div class="av3-lane-icon">'+({sgk:'▤',practice:'✎',exam:'▣'}[kind])+'</div>'+
 '<span class="av3-lane-label">'+title+'</span>'+
 '<strong>'+number+'</strong>'+
 '<small>'+description+'</small><span class="av3-lane-tag">'+tag+'</span>'+
 '<span class="av3-lane-arrow">Xem chi tiết →</span></button>';
}
function overview(){
 state.view="home";
 navActive("home");
 document.body.dataset.auraPage="unified-home";
 const content=shell(header("TRUNG TÂM QUẢN TRỊ", "Một kho tài liệu. Ba quy trình rõ ràng.",
 "SGK và bài tập từ nguồn chuẩn được AURA tiếp nhận, chuẩn hóa. Chỉ bộ đề và bài mẫu anh đưa ngoài SGK cần anh duyệt.",
 button("Mở kho tài liệu","documents","solid")))+
 '<section class="av3-lanes" aria-label="Ba nhóm tài liệu">'+
 tile("sgk",value(count("sgk_units")),"Sách giáo khoa",
 "Khung nội dung liên kết nguồn NXB đã xác minh.","Tự động · Không duyệt")+
 tile("practice",value(count("practice_units")),"Bài tập",
 "Bài luyện và bộ ôn theo khung chương trình.","Tự động · Kiểm tra chất lượng")+
 tile("exam",String(pending()),"Kiểm tra",
 "Bộ đề và bài mẫu bên ngoài SGK do anh cung cấp.","Anh duyệt · Rồi xuất bản")+
 '</section>'+
 '<div class="av3-two">'+
 '<section class="av3-panel"><div class="av3-panel-head"><h2>Quy trình tài liệu</h2><span>Không lặp nhiều menu</span></div>'+
 '<div class="av3-flow"><div><b>01</b><strong>Tiếp nhận nguồn chuẩn</strong><small>Đối chiếu nguồn và quyền sử dụng</small></div>'+
 '<div><b>02</b><strong>Chuẩn hóa thành bài học / bài tập</strong><small>Gắn môn, lớp, chương, bài, nguồn và phiên bản</small></div>'+
 '<div><b>03</b><strong>Kiểm tra chất lượng kỹ thuật</strong><small>Không tự nhận AI là nguyên văn SGK, không công bố đáp án sai</small></div>'+
 '<div><b>04</b><strong>Đồng bộ sang Student</strong><small>Chỉ phần đã đủ điều kiện, không cần anh duyệt SGK</small></div></div>'+
 '</section>'+
 '<section class="av3-panel"><div class="av3-panel-head"><h2>Việc cần xử lý</h2></div>'+
 '<div class="av3-task"><span class="av3-task-icon">◎</span><div><b>Đề thi / bài mẫu ngoài SGK</b><small>'+
 pending()+' tệp được nhận diện đang chờ duyệt trong INBOX trên trình duyệt này.</small></div>'+
 button("Xem INBOX","inbox","outline")+'</div>'+
 '<div class="av3-task"><span class="av3-task-icon">◇</span><div><b>Học liệu từ nguồn chuẩn</b><small>'+
 value(count("verified_textbook_exercises"))+' bài tập gốc SGK xác minh từng trang; chưa đủ bằng chứng thì giữ nhãn nháp.</small></div>'+
 button("Kiểm tra","tab-practice","outline")+'</div>'+
 '<div class="av3-task"><span class="av3-task-icon">⇄</span><div><b>Đồng bộ Student</b><small>Thư viện dùng máy chủ. Kiểm thử cuối cùng trên hai thiết bị thật vẫn cần nghiệm thu.</small></div>'+
 button("Mở Student","student-link","outline")+'</div></section></div>'+
 '<p class="av3-footnote">Số liệu trong ba thẻ lấy từ Staging khi Admin đăng nhập, trừ số đề chờ duyệt đọc từ INBOX của trình duyệt hiện tại. Số mục lục không đồng nghĩa đã số hóa toàn bộ nội dung SGK.</p>';
 app.innerHTML=content+"</div>";
 loadOverview();
}
function tabstrip(){
 return '<div class="av3-tabs" role="tablist" aria-label="Nhóm tài liệu">'+
 Object.keys(names).map(k=>'<button type="button" role="tab" aria-selected="'+(state.tab===k)+
 '" class="'+(state.tab===k?"is-on":"")+'" data-v3-action="tab-'+k+'">'+
 '<span>'+({sgk:'▤',practice:'✎',exam:'▣'}[k])+'</span>'+names[k]+'</button>').join("")+'</div>';
}
function sourceList(){
 const items=state.server?.sources;
 if(!Array.isArray(items))return '<p class="av3-muted">Kết nối tài khoản Admin để đọc danh sách nguồn chuẩn đã đăng ký trên máy chủ.</p>';
 if(!items.length)return '<p class="av3-muted">Chưa có nguồn SGK chính thức được xác minh. Không tự lấy từ trang không rõ xuất xứ.</p>';
 return items.map(s=>{
  const href=allowedOfficial(s.url);
  return '<div class="av3-source"><div class="av3-source-mark">▤</div>'+
    '<div class="av3-source-main"><strong>'+esc(s.title)+'</strong>'+
    '<small>'+esc(s.subject)+' · Lớp '+esc(s.grade)+' · Tập '+esc(s.volume)+
    ' · '+value(s.toc_count)+' mục lục</small>'+
    '<small>Đã xác minh mục lục · nội dung trang và bài tập gốc chưa xác minh toàn bộ</small></div>'+
    (href?'<a href="'+esc(href)+'" target="_blank" rel="noopener noreferrer" class="av3-button outline">Mở NXB</a>':'')+
   '</div>';
 }).join("");
}
function docsSgk(){
 return '<div class="av3-section-heading"><div><h2>Sách giáo khoa</h2><p>Tự cập nhật nguồn chuẩn đã đăng ký. Anh không cần duyệt từng quyển hoặc bài.</p></div>'+
 '<span class="av3-state good">TỰ ĐỒNG BỘ</span></div>'+
 '<div class="av3-stats">'+
 '<div><strong>'+value(count("source_count"))+'</strong><small>Nguồn SGK đã xác minh</small></div>'+
 '<div><strong>'+value(count("sgk_units"))+'</strong><small>Khung đơn vị học theo mục lục</small></div>'+
 '<div><strong>'+value(count("guided_lesson_drafts"))+'</strong><small>Bản nháp bài học AI đang có</small></div>'+
 '</div>'+
 '<section class="av3-panel"><h3>Nguồn sách đang kết nối</h3>'+sourceList()+'</section>'+
 '<section class="av3-panel"><h3>Từ nguồn sách thành bài học</h3>'+
 '<div class="av3-steps"><span>Liên kết sách NXB</span><span>Chuẩn hóa môn · lớp · chương · bài</span><span>Trích xuất có quyền sử dụng</span><span>Đối chiếu và đưa vào Student</span></div>'+
 '<p class="av3-caution">AURA hiện đã chuẩn hóa <b>khung mục lục</b>; chưa tự trích xuất toàn văn từng trang SGK hoặc biến mọi bài thành bài học tương tác hoàn chỉnh. Khi chưa có nội dung đủ quyền sử dụng và kiểm chứng, không ghi nhận là đã hoàn tất.</p>'+
 '<div class="av3-actions">'+button("Xem cấu trúc bài học","lessons","solid")+
 '<a class="av3-button outline" href="./aura-math6-sgk-coverage.html">Kiểm tra độ phủ SGK</a></div></section>';
}
function docsPractice(){
 return '<div class="av3-section-heading"><div><h2>Bài tập</h2>'+
 '<p>AURA xây dựng bài luyện theo nguồn chuẩn và nội dung bài học, không cần anh duyệt từng bài tập SGK.</p></div>'+
 '<span class="av3-state good">TỰ ĐỘNG · QA</span></div>'+
 '<div class="av3-stats">'+
 '<div><strong>'+value(count("practice_units"))+'</strong><small>Mục luyện tập / ôn tập trong khung</small></div>'+
 '<div><strong>'+value(count("practice_module_drafts"))+'</strong><small>Mô-đun luyện AI hiện có</small></div>'+
 '<div><strong>'+value(count("verified_textbook_exercises"))+'</strong><small>Bài tập SGK nguyên gốc đã kiểm chứng</small></div></div>'+
 '<section class="av3-panel"><h3>Cơ chế chuẩn hóa bài tập</h3>'+
 '<div class="av3-steps"><span>Nhận diện bài học và dạng toán</span><span>Gắn nguồn · mức độ · đáp án</span><span>Kiểm tra toán · hình · dữ kiện</span><span>Bật luyện tập sau QA</span></div>'+
 '<p class="av3-caution">Các mô-đun luyện hiện tại có phần AURA tự biên soạn; chưa phải bản số hóa nguyên văn bài tập SGK. Các câu thiếu chứng cứ, hình hoặc kiểm định đáp án phải tiếp tục khóa, không tự chuyển thành đề thi chính thức.</p>'+
 '<div class="av3-actions">'+button("Xem bài học / ôn luyện","lessons","solid")+
 '<a class="av3-button outline" href="./aura-math6-math-audit.html">Kiểm định đáp án Toán</a>'+
 '<a class="av3-button outline" href="./aura-math6-readiness.html">Tình trạng sẵn sàng</a></div></section>';
}
function docsExam(){
 return '<div class="av3-section-heading"><div><h2>Kiểm tra & bài mẫu ngoài SGK</h2>'+
 '<p>Anh tự cung cấp đề thi, đề kiểm tra và bài mẫu; AURA phân loại, kiểm tra chất lượng, chờ anh duyệt rồi mới chia sẻ.</p></div>'+
 '<span class="av3-state review">YÊU CẦU DUYỆT</span></div>'+
 '<div class="av3-stats">'+
 '<div><strong>'+pending()+'</strong><small>Đề/bài mẫu chờ duyệt trên máy này</small></div>'+
 '<div><strong>'+value(count("pending_manual_approvals"))+'</strong><small>Lần duyệt đã ghi nhận ở máy chủ</small></div>'+
 '<div><strong>0</strong><small>Đề kiểm tra chính thức được bật</small></div></div>'+
 '<section class="av3-panel"><h3>Quy trình cho tài liệu anh đưa</h3>'+
 '<div class="av3-steps"><span>Nhập bộ đề / bài mẫu</span><span>Kiểm tra trùng · thiếu hình · đáp án</span><span>Anh duyệt</span><span>Xuất bản lên Student</span></div>'+
 '<div class="av3-actions">'+button("1. Đưa tài liệu vào INBOX","inbox","solid")+
 button("2. Duyệt & xuất bản","publish","outline")+
 button("Tạo đề từ ngân hàng","generator","outline")+'</div>'+
 '<p class="av3-muted">Chỉ những tài liệu đã có quyết định Admin APPROVED mới được đưa vào luồng Xuất bản. Hệ thống ghi nhận lại phê duyệt trên máy chủ, đồng thời kiểm tra quyền Admin. Bài mẫu ngoài SGK được xử lý cùng nhóm này, không lẫn với bài tập từ nguồn chuẩn.</p></section>';
}
function docs(tab){
 state.view="documents";
 if(names[tab])state.tab=tab;
 navActive("library");
 document.body.dataset.auraPage="unified-library";
 app.innerHTML=shell(header("QUẢN LÝ HỌC LIỆU","Kho tài liệu",
 "Ba nhóm tài liệu, hai cơ chế xử lý. Nội dung SGK và bài tập được AURA chuẩn hóa; bộ đề, bài mẫu bên ngoài phải có anh duyệt."))+
 tabstrip()+'<div class="av3-document-body">'+
 ({sgk:docsSgk,practice:docsPractice,exam:docsExam}[state.tab])()+
 '</div><p class="av3-footnote">Trạng thái chuẩn hóa là tình trạng dữ liệu thực tế, không phải chứng nhận chất lượng hay bản quyền toàn bộ nội dung. AURA vẫn giữ các nguồn gốc để đối chiếu.</p></div>';
 if(window.AURA_LEARNING_PIPELINE_ADMIN?.mount)window.AURA_LEARNING_PIPELINE_ADMIN.mount(state.tab);
 loadOverview();
}
function settings(){
 state.view="settings";
 navActive("settings");
 document.body.dataset.auraPage="unified-settings";
 app.innerHTML=shell(header("CẤU HÌNH & VẬN HÀNH","Hệ thống",
 "Các công cụ kỹ thuật và bảo trì nằm ở đây, không tạo thêm menu trùng với kho tài liệu."))+
 '<div class="av3-tool-grid">'+
 tool("Nguồn Drive (nâng cao)","Quét metadata INBOX trong Google Drive, không tự nhập nội dung SGK.","sources")+
 tool("Phân kỳ & môn học","Quy tắc kỳ kiểm tra, trạng thái môn và metadata.","metadata")+
 tool("Kiểm định câu hỏi","Bàn kỹ thuật kiểm tra chất lượng ngân hàng câu hỏi.","question-review")+
 tool("Liên kết máy chủ","Đăng nhập Admin, ghép Student trên thiết bị khác.","auth-link")+
 tool("Sao lưu dữ liệu cục bộ","Xuất bản sao dữ liệu cục bộ từ trình duyệt này.","backup")+
 tool("Khôi phục dữ liệu","Nhập tệp sao lưu đã kiểm tra.","restore")+
 tool("Hướng dẫn","Quy trình sử dụng các công cụ có sẵn.","guide")+
 '</div></div>';
 loadOverview();
}
function tool(title,desc,action){
 return '<button type="button" class="av3-tool" data-v3-action="'+esc(action)+'">'+
 '<strong>'+title+'</strong><small>'+desc+'</small><span>Mở công cụ →</span></button>';
}
async function loadOverview(force=false){
 if(state.request)return state.request;
 if(!force&&(state.server||state.error)&&Date.now()-state.fetchAt<120000)return;
 const cloud=window.AURA_LEGACY_CLOUD_ADMIN;
 if(!cloud?.getToken){state.error="Cần kết nối phiên Admin máy chủ.";return;}
 state.loading=true;state.error="";
 const task=(async()=>{
  try{
   const auth=await cloud.getToken();
   const response=await fetch(ENDPOINT,{method:"POST",cache:"no-store",
    headers:{"Content-Type":"application/json",apikey:KEY,Authorization:"Bearer "+auth},
    body:JSON.stringify({action:"admin_content_overview"})});
   const data=await response.json();
   if(!response.ok)throw Error(data.error||"Không thể lấy tổng quan nội dung");
   if(!data.staging_only||data.manual_review_rule!=="EXTERNAL_EXAM_AND_SAMPLE_ONLY"||
      data.auto_sgk!==true||data.auto_practice!==true||!Array.isArray(data.sources))
     throw Error("Máy chủ trả về chính sách nội dung chưa hợp lệ.");
   state.server=data;state.fetchAt=Date.now();
   state.error="";
  }catch(e){state.error=String(e?.message||e)}
  finally{
   state.loading=false;state.request=null;state.fetchAt=Date.now();
   // Older Admin addons also write body.dataset.auraPage while the V3 view is
   // mounted; rerender from the actual active V3 view, never from legacy tags.
   if(app.querySelector?.(".av3")||app.innerHTML.includes('class="av3"')){
    if(state.view==="home")overview();
    else if(state.view==="documents")docs(state.tab);
    else if(state.view==="settings")settings();
   }
  }
 })();
 state.request=task;return task;
}
function showLegacy(action){
 const targets={
  inbox:legacy.inbox,sources:legacy.sources,lessons:legacy.lessons,
  generator:legacy.generator,students:legacy.students,
  results:legacy.history,metadata:legacy.metadata,
  guide:legacy.guide,publish:legacy.library
 };
 const f=targets[action];
 if(typeof f!=="function"){window.alert("Công cụ chưa có trên phiên bản này.");return}
 f();
 state.view="legacy";
 const label=action==="publish"?"Kiểm tra → Duyệt & xuất bản":
   action==="inbox"?"Kiểm tra → Tài liệu anh đưa":action==="lessons"?"Kho tài liệu → Bài học":
   action==="sources"?"Hệ thống → Nguồn Drive":action==="generator"?"Kiểm tra → Tạo đề":
   action==="metadata"?"Hệ thống → Phân kỳ":action==="students"?"Học sinh":action==="results"?"Kết quả":"Hệ thống";
 const returnTo=["inbox","publish","generator"].includes(action)?"exam":
   action==="lessons"?"sgk":action==="sources"?"settings":
   action==="students"?"students":action==="results"?"results":"settings";
 const bar='<div class="av3-legacy-return"><button class="av3-button outline" type="button" data-v3-action="back-'+returnTo+'">← Quay lại</button>'+
 '<span>'+esc(label)+'</span></div>';
 app.insertAdjacentHTML("afterbegin",bar);
 const group=action==="students"?"students":action==="results"?"history":
   ["sources","metadata","guide"].includes(action)?"settings":"library";
 navActive(group);
}
function go(action){
 if(action==="documents"){docs("sgk");return}
 if(action==="overview"){overview();return}
 if(action==="settings"){settings();return}
 if(action==="refresh"){state.fetchAt=0;state.server=null;loadOverview(true);overview();return}
 if(action==="student-link"){location.href="./student-direct.html";return}
 if(action==="auth-link"){location.href="./aura-admin.html";return}
 if(action==="question-review"){location.href="./admin-ch08-review.html";return}
 if(action==="backup"){legacy.backup?.();return}
 if(action==="restore"){legacy.restore?.();return}
 if(action.startsWith("tab-")&&names[action.slice(4)]){docs(action.slice(4));return}
 if(action.startsWith("back-")){
  const target=action.slice(5);
  if(names[target])docs(target);
  else if(target==="settings")settings();
  else if(target==="students")showLegacy("students");
  else if(target==="results")showLegacy("results");
  else overview();
  return;
 }
 showLegacy(action);
}
app.addEventListener("click",e=>{
 const btn=e.target.closest("[data-v3-action]");
 if(!btn||!app.contains(btn))return;
 go(btn.dataset.v3Action||"");
});
window.AURA_ADMIN_V3={overview,documents:docs,settings,refresh:()=>loadOverview(true),
 status:()=>({view:state.view,loading:state.loading,error:state.error,
  hasData:!!state.server,hasRequest:!!state.request,fetchAt:state.fetchAt})};
window.home=overview;
window.library=()=>docs(state.tab);
window.auraAdminDocs=docs;
window.auraAdminSettings=settings;
window.addEventListener("focus",()=>{
 if(["unified-home","unified-library","unified-settings"].includes(document.body.dataset.auraPage))
  loadOverview(true);
});
window.addEventListener("storage",e=>{
 if(["aura_inbox_queue_v1","aura_inbox_decisions_v1"].includes(e.key)){
  if(document.body.dataset.auraPage==="unified-home")overview();
  else if(document.body.dataset.auraPage==="unified-library")docs(state.tab);
 }
});
overview();
})();