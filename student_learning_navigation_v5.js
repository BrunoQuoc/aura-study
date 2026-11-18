/* AURA STUDY V5 — preserve original Student navigation; add useful Missions and Journey only.
 * Existing Home / Ôn thi / Bài học / Luyện nhanh / Kết quả stay unchanged.
 * Official examinations and unverified exercises are never enabled here.
 */
(function(){
"use strict";
if(!document.body.classList.contains("student-shell"))return;
const app=document.getElementById("app");if(!app)return;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const json=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||"null")??f}catch{return f}};
const today=()=>new Date().toLocaleDateString("sv-SE");
const attempts=()=>{const a=json("aura_attempts",[]);return Array.isArray(a)?a:[]};
const wrong=()=>{const w=json("aura_wrong_book_v1",{});return w&&typeof w==="object"?Object.values(w):[]};
const progress=()=>{
 const state=json("aura_lesson_state",{});let done=0,total=0;
 const maps=Array.isArray(window.AURA_LESSON_MAPS)?window.AURA_LESSON_MAPS:[];
 for(const map of maps)for(const node of map.nodes||[]){
  total++;
  if(state?.[map.id]?.done?.[node.id])done++;
 }
 return {done,total,pct:total?Math.round(done*100/total):0};
};
const stat=()=>{
 const a=attempts(),w=wrong().filter(x=>(x?.consecutiveCorrect||0)<2);
 const recent=a.filter(x=>{const dt=Date.parse(x?.time||"");return Number.isFinite(dt)&&Date.now()-dt<7*86400000});
 const todayAttempts=a.filter(x=>{const t=Date.parse(x?.time||"");return Number.isFinite(t)&&new Date(t).toLocaleDateString("sv-SE")===today()});
 return {attempts:a.length,recent:recent.length,today:todayAttempts.length,
  wrong:w.length,progress:progress()};
};
function active(page){
 if(typeof window.setActive==="function")window.setActive(page);
 document.body.dataset.studentMainView=page;
 for(const b of document.querySelectorAll(".mobilebar button[data-v5-page]")){
  b.classList.toggle("active",b.dataset.v5Page===page);
 }
}
function action(title,desc,actionName,tag=""){
 return '<article class="aura-v5-task"><div class="aura-v5-task-body">'+
  '<h3>'+esc(title)+'</h3><p>'+esc(desc)+'</p>'+
  (tag?'<small>'+esc(tag)+'</small>':'')+'</div>'+
  '<button type="button" class="btn primary" data-student-route="'+esc(actionName)+'">Mở</button></article>';
}
function missions(){
 active("missions");
 const s=stat();
 app.innerHTML='<section class="aura-v5-screen"><div class="small">AURA STUDY · HỌC THEO NGÀY</div>'+
 '<h1>Nhiệm vụ học tập</h1>'+
 '<p class="aura-v5-lead">Bài tập và nhiệm vụ được lấy từ kho học liệu hiện có; không tự mở câu chưa đạt kiểm định.</p>'+
 '<div class="aura-v5-statgrid">'+
 '<article><strong>'+s.today+'</strong><span>Lượt luyện hôm nay</span></article>'+
 '<article><strong>'+s.wrong+'</strong><span>Câu sai cần ôn lại</span></article>'+
 '<article><strong>'+s.progress.pct+'%</strong><span>Bài học đã ghi nhận</span></article></div>'+
 '<div class="aura-v5-tasklist">'+
 action("Học một bài","Mở bài giảng, đọc kiến thức và luyện theo bài đã có nội dung.","lessons","Bài học")+
 action("Luyện nhanh 10–20 câu","Luyện với ngân hàng hiện có; những câu thiếu dữ kiện vẫn bị khóa.","generator",
  s.today?"Đã có "+s.today+" lượt luyện hôm nay":"Chưa có lượt luyện hôm nay")+
 action("Ôn các câu thường sai","Xem lại những câu làm sai và tiếp tục luyện điểm yếu.","weak",
  s.wrong?s.wrong+" câu đang theo dõi":"Chưa có câu sai cần ôn")+
 action("Xem học liệu tự ôn tập","Xem đề luyện và tài liệu bổ sung đã đủ điều kiện.","library",
 "Không phải kỳ thi chính thức")+'</div>'+
 '<p class="aura-v5-note">Kết quả luyện được ghi theo học sinh đã đăng nhập trên trình duyệt này. Kỳ thi chính thức chưa được bật; nhiệm vụ không phát hành điểm thi chính thức.</p></section>';
}
function journey(){
 active("journey");
 const s=stat();
 const a=attempts(),last=a.slice(-5).reverse();
 const avg=a.length?a.reduce((sum,x)=>sum+(Number(x?.score)||0),0)/a.length:null;
 app.innerHTML='<section class="aura-v5-screen"><div class="small">AURA STUDY · TIẾN ĐỘ HỌC SINH</div>'+
 '<h1>Hành trình học tập</h1>'+
 '<p class="aura-v5-lead">Theo dõi những gì bạn đã học và luyện; dữ liệu chỉ phản ánh các lượt đã ghi nhận.</p>'+
 '<div class="aura-v5-statgrid">'+
 '<article><strong>'+s.progress.done+'/'+s.progress.total+'</strong><span>Bài học đã hoàn thành</span></article>'+
 '<article><strong>'+s.recent+'</strong><span>Lượt làm bài trong 7 ngày</span></article>'+
 '<article><strong>'+(avg===null?"—":avg.toFixed(1))+'</strong><span>Điểm TB bài luyện đã lưu</span></article></div>'+
 '<section class="card"><h2>Tiến độ bài học</h2>'+
 '<div class="aura-v5-track"><div style="width:'+s.progress.pct+'%"></div></div>'+
 '<p class="meta">'+s.progress.pct+'% số mục học đang có dấu hoàn thành. Dữ liệu không bao gồm học liệu chưa cấp quyền.</p>'+
 '<div class="aura-v5-actions"><button class="btn primary" data-student-route="lessons">Tiếp tục học</button>'+
 '<button class="btn soft" data-student-route="history">Xem kết quả chi tiết</button></div></section>'+
 '<section class="card"><h2>Điểm cần củng cố</h2>'+
 '<p class="meta">'+(s.wrong?s.wrong+" câu trong sổ câu sai còn cần ôn lại.":"Chưa có câu sai cần luyện lại theo dữ liệu đã lưu.")+'</p>'+
 '<button class="btn soft" data-student-route="weak">Xem sổ câu sai</button></section>'+
 '<section class="card"><h2>Hoạt động gần đây</h2>'+
 (last.length?'<div class="aura-v5-activities">'+last.map(x=>{
  const d=new Date(x.time||0),date=Number.isFinite(d.getTime())?d.toLocaleDateString("vi-VN"):"Chưa có ngày";
  const score=Number(x.score);return '<p><b>'+esc(date)+'</b><span>'+
   (Number.isFinite(score)?"Điểm luyện "+score.toFixed(1):"Lượt làm bài đã ghi nhận")+'</span></p>';
 }).join("")+'</div>':'<p class="meta">Chưa có lượt làm bài nào được lưu trên thiết bị này.</p>')+
 '</section><p class="aura-v5-note">Hành trình sử dụng tiến độ cục bộ theo tài khoản đã kích hoạt. Chưa hỗ trợ tự đồng bộ toàn bộ đáp án/lịch sử giữa nhiều thiết bị; quyền học liệu lấy từ máy chủ.</p></section>';
}
function route(key){
 if(key==="missions")return missions();
 if(key==="journey")return journey();
 if(key==="weak"){
  if(typeof window.auraDashboardWeak==="function")return window.auraDashboardWeak();
  return typeof window.history==="function"?window.history():undefined;
 }
 const fn=window[key];
 if(typeof fn==="function")return fn();
}
app.addEventListener("click",e=>{
 const button=e.target.closest("[data-student-route]");
 if(!button||!app.contains(button))return;
 route(button.dataset.studentRoute);
});
function homeShortcuts(){
 const node=document.createElement("section");
 node.className="aura-v5-home-shortcuts";
 node.innerHTML='<div class="sectionhead"><div><h2>Khám phá thêm</h2>'+
 '<span>Các chức năng bổ sung cho việc học</span></div></div>'+
 '<div class="aura-v5-home-grid">'+
 '<button type="button" data-student-route="missions"><span>☑</span><strong>Nhiệm vụ học tập</strong>'+
 '<small>Học theo bài · luyện câu sai · tự ôn</small></button>'+
 '<button type="button" data-student-route="journey"><span>◷</span><strong>Hành trình học tập</strong>'+
 '<small>Tiến độ · kết quả · điểm cần củng cố</small></button></div>';
 app.append(node);
}
function wrap(key,view){
 const fn=window[key];if(typeof fn!=="function")return;
 window[key]=function(...args){
  const result=fn.apply(this,args);
  document.body.dataset.studentMainView=view;
  if(view==="home"&&app){
   // Other learning modules add their own panels after rendering. These content
   // panels remain available only in the appropriate study sections.
   homeShortcuts();
  }
  return result;
 };
}
wrap("home","home");
wrap("library","library");
wrap("lessons","lessons");
wrap("generator","generator");
wrap("history","history");
wrap("lessonSubject","lessons");
wrap("studentReviewHub","library");
wrap("studentExamSubject","library");
window.auraStudentTasksV5=missions;
window.auraStudentJourneyV5=journey;
if(document.body.dataset.auraPage==="home"&&
   !document.querySelector(".aura-v5-home-shortcuts"))homeShortcuts();
})();
