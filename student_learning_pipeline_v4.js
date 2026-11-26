/* AURA STUDY Student V4 — paired device receives server-side normalized AURA study drafts.
 * This supplements (never replaces) the existing Student layout, exam engine or NXB catalog.
 * Verified publisher TOC headings and AURA-authored lessons are displayed directly. AURA-authored SGK/practice content does not require Admin approval.
 */
(function(){
"use strict";
if(!document.body.classList.contains("student-shell"))return;
const API="https://ufqzuowjhdqpydqvcsob.supabase.co/functions/v1/aura-legacy-content-sync-v1";
const KEY="sb_publishable_d7x2eMPcTVYwWQc1U3ic1Q_PEaTut1p";
const state={data:null,request:null,updated:0,error:"",subject:"",shown:9,detail:"",detailId:"",serial:0};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function officialUrl(value){
 try{const u=new URL(String(value||""));return u.protocol==="https:"&&u.hostname==="taphuan.nxbgd.vn"?u.href:""}catch{return ""}
}
const panel=()=>document.getElementById("auraStudentLearningPipelineV4");
function lessons(){
 return Array.isArray(state.data?.items)?
  state.data.items.filter(x=>x.lane==="SGK"&&x.preview_ready===true&&
    (x.status==="AI_AUTO_STUDENT"||x.status==="AI_DRAFT_PREVIEW")&&x.content_origin==="AURA_AI_AUTHORED_DRAFT"&&
    x.subject==="Toán"&&officialUrl(x.source_url)):[];
}
async function api(action,more={}){
 const token=await window.AURA_LEGACY_CLOUD_STUDENT?.getToken?.();
 if(!token)throw Error("Hãy đăng nhập Student để xem bài học AURA.");
 const r=await fetch(API,{method:"POST",cache:"no-store",
  headers:{"Content-Type":"application/json",apikey:KEY,Authorization:"Bearer "+token},
  body:JSON.stringify({action,...more})});
 let data={};try{data=await r.json()}catch{}
 if(!r.ok)throw Error(r.status===403?"Thiết bị Student chưa được ghép hoặc đã thu hồi quyền.":(data.error||"Máy chủ học liệu chưa sẵn sàng."));
 if(data.staging_only!==true||data.student_auto_publish!==true||data.official_exam_enabled===true)
  throw Error("Máy chủ không xác nhận chế độ học thử an toàn.");
 return data;
}
function detailMarkup(d){
 if(d.content_origin!=="AURA_AI_AUTHORED_DRAFT"||d.student_auto_published!==true||
   d.auto_grading_enabled!==false||d.textbook_body_verified!==false)return "";
 const steps=[["Khởi động",d.opening],["Kiến thức AURA",d.concept],
  ["Ví dụ minh họa",d.worked_example],["Tự luyện (không chấm điểm)",d.practice_prompt],
  ["Vận dụng",d.application_prompt]];
 return '<div class="card" style="background:#f6f8ff;margin-top:12px;border-color:#dbe6ff">'+
 '<h3>'+esc(d.title)+'</h3>'+
 '<p class="meta" style="color:#946128"><b>AURA tự biên soạn.</b> Được đưa thẳng vào Student; chưa phải trang sách hoặc bài tập SGK nguyên văn và chưa được giáo viên chứng nhận. Không có chấm điểm tự động.</p>'+
 steps.map(([title,body],i)=>'<div style="margin:16px 0;padding-top:11px;border-top:1px solid #e0e8f4">'+
 '<div class="small">BƯỚC '+(i+1)+'</div><b>'+esc(title)+'</b>'+
 '<p style="white-space:pre-wrap;line-height:1.65;margin:8px 0">'+esc(body)+'</p></div>').join("")+
 '<button type="button" class="btn soft" data-aura-v4="close">Đóng bài học</button></div>';
}
function render(){
 const el=panel();if(!el||!el.isConnected)return;
 const rows=lessons();
 const totals=state.data?.totals;
 const status=el.querySelector("#auraStudentPipelineStatus");
 const list=el.querySelector("#auraStudentPipelineItems");
 if(!status||!list)return;
 if(state.error){status.textContent=state.error;list.innerHTML=
  '<p class="meta">Nếu chưa có tài khoản, hãy nhờ Admin tạo tên đăng nhập và mật khẩu.</p>';return}
 if(!state.data){status.textContent="Đang nhận danh mục bài học từ máy chủ…";list.replaceChildren();return}
 status.textContent=rows.length+" bài học AURA đang mở xem thử.";
 if(state.subject&&state.subject!=="TOAN"){
  list.innerHTML='<p class="meta">Chưa có bài học máy chủ cho môn này; AURA không tự suy đoán nội dung sách.</p>';return
 }
 list.innerHTML='<div style="display:grid;gap:7px;margin-top:12px">'+
 rows.slice(0,state.shown).map(u=>
  '<div class="resource" style="display:flex;align-items:center;flex-wrap:wrap;gap:9px">'+
  '<div class="fileico">📖</div><div class="grow" style="min-width:180px">'+
  '<b>'+esc(u.title)+'</b>'+
  '<small style="display:block">Toán 6 · Tập '+esc(u.volume)+' · tr. '+esc(u.printed_page)+
  ' · AURA tự biên soạn · vào Student tự động</small></div>'+
  '<button type="button" class="btn primary" data-aura-v4="open" data-id="'+esc(u.id)+'">Xem bài AURA</button>'+
  '</div>').join("")+'</div>'+
 (rows.length>state.shown?'<button class="btn soft" style="margin-top:12px" type="button" data-aura-v4="more">Xem thêm bài học</button>':'')+
 (state.detail?'<div id="auraStudentPipelineDetail" role="region" aria-label="Bài học AURA">'+state.detail+'</div>':'')+
 '<p class="meta" style="margin-top:10px">Mục lục có nguồn từ NXB. Nội dung bài học hiển thị do AURA biên soạn, được kiểm tra cấu trúc để xem thử, <b>chưa đạt kiểm định chuyên môn</b>. Không phát hành bài tập khóa QA, đáp án ngân hàng hoặc điểm thi.</p>';
}
async function load(force=false){
 if(state.request)return state.request;
 if(!force&&state.data&&Date.now()-state.updated<120000){render();return}
 state.error="";render();
 const seq=++state.serial;
 state.request=(async()=>{
  try{
   const data=await api("learning_pipeline_catalog");
   if(!Array.isArray(data.items)||!data.totals||
      data.copyright_scope!=="PUBLISHER_TOC_AND_AI_AUTHORED_DRAFTS_ONLY")
    throw Error("Danh mục nội dung không hợp lệ");
   if(seq!==state.serial)return;
   state.data=data;state.updated=Date.now();
  }catch(e){state.error=String(e?.message||e)}
  finally{state.request=null;render()}
 })();
 return state.request;
}
async function openLesson(id){
 const row=lessons().find(x=>x.id===id);
 if(!row)return;
 state.detailId=id;state.detail='<p class="meta">Đang tải nội dung AURA…</p>';render();
 try{
  const data=await api("learning_pipeline_lesson",{section_id:id});
  if(state.detailId!==id||!lessons().some(x=>x.id===id))return;
  state.detail=detailMarkup(data)||'<p class="meta">Bản nháp chưa đạt kiểm tra hiển thị.</p>';
 }catch(e){if(state.detailId===id)state.detail='<p role="alert">'+esc(e.message)+'</p>'}
 render();
 document.getElementById("auraStudentPipelineDetail")?.scrollIntoView({block:"nearest",behavior:"smooth"});
}
function attach(subject=""){
 if(subject&&subject!=="TOAN")return;
 state.subject=subject||"";
 const app=document.getElementById("app");if(!app)return;
 if(!panel()){
  const section=document.createElement("section");
  section.id="auraStudentLearningPipelineV4";
  section.className="card";
  section.style.marginTop="18px";
  section.innerHTML=
   '<div class="small">BÀI HỌC AURA · TOÁN 6</div>'+
   '<h2>Bài học AURA theo SGK</h2>'+
   '<p class="meta">Các bài AURA tự biên soạn theo chương trình SGK, được AURA tự động đưa vào Student; chưa được giáo viên chứng nhận.</p>'+
   '<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap">'+
   '<p id="auraStudentPipelineStatus" role="status" class="meta" style="flex:1;margin:0">Đang kết nối…</p>'+
   '<button type="button" class="btn soft" data-aura-v4="refresh">Làm mới</button></div>'+
   '<div id="auraStudentPipelineItems" style="margin-top:12px"></div>';
  app.append(section);
 }
 render();load();
}
document.addEventListener("click",e=>{
 const btn=e.target.closest("[data-aura-v4]");const root=panel();
 if(!btn||!root?.contains(btn))return;
 const action=btn.dataset.auraV4;
 if(action==="refresh"){state.data=null;state.updated=0;load(true)}
 if(action==="more"){state.shown+=12;render()}
 if(action==="open")openLesson(btn.dataset.id);
 if(action==="close"){state.detail="";state.detailId="";render()}
});
for(const [name,subjectArg] of [["lessons",false],["lessonSubject",true]]){
 const orig=window[name];if(typeof orig!=="function")continue;
 window[name]=function(...args){
  const value=orig.apply(this,args);
  setTimeout(()=>attach(subjectArg?String(args[0]||""):""),90);
  return value;
 };
}
window.AURA_STUDENT_LEARNING_PIPELINE={refresh:()=>load(true),getCached:()=>state.data};
window.addEventListener("load",()=>{
 setTimeout(()=>{
  if(!panel()&&document.body.dataset.auraPage==="lessons")attach();
 },160);
},{once:true});
})();
