/* AURA STUDY V4 — source -> verified outline -> AURA draft -> paired Student.
 * Admin monitor only, no textbook copying and no approval buttons for SGK/practice.
 */
(function(){
"use strict";
if(!document.body.classList.contains("admin-shell"))return;
const API="https://ufqzuowjhdqpydqvcsob.supabase.co/functions/v1/aura-legacy-content-sync-v1";
const KEY="sb_publishable_d7x2eMPcTVYwWQc1U3ic1Q_PEaTut1p";
const state={data:null,request:null,at:0,error:"",tab:"sgk",expanded:false,detail:"",detailId:"",serial:0};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const validOfficial=u=>{try{const x=new URL(u);return x.protocol==="https:"&&x.hostname==="taphuan.nxbgd.vn"?x.href:""}catch{return ""}};
const panel=()=>document.getElementById("auraLearningPipelineAdminV4");
const label={
 AI_DRAFT_PREVIEW:"Bản nháp AURA · Student xem thử",
 PRACTICE_QA_LOCKED:"Bài tập đang khóa QA",
 OUTLINE_ONLY:"Mới có mục lục nguồn"
};
function total(k){return Number(state.data?.totals?.[k]||0)}
async function api(action,extra={}){
 const token=await window.AURA_LEGACY_CLOUD_ADMIN?.getToken?.();
 if(!token)throw Error("Anh hãy kết nối tài khoản Admin máy chủ.");
 const r=await fetch(API,{method:"POST",cache:"no-store",
 headers:{"Content-Type":"application/json",apikey:KEY,Authorization:"Bearer "+token},
 body:JSON.stringify({action,...extra})});
 let data={};try{data=await r.json()}catch{}
 if(!r.ok)throw Error(data.error||"Không thể đọc dữ liệu máy chủ.");
 if(!data.staging_only||!data.preview_only)throw Error("Máy chủ chưa trả về học liệu thử nghiệm hợp lệ.");
 return data;
}
function currentItems(){
 const lane=state.tab==="practice"?"PRACTICE":"SGK";
 return Array.isArray(state.data?.items)?
  state.data.items.filter(x=>x.lane===lane&&validOfficial(x.source_url)):[];
}
function render(){
 const el=panel();if(!el||!el.isConnected)return;
 const cnt=state.data?.totals;
 const list=currentItems();
 const displayed=state.expanded?list:list.slice(0,12);
 el.innerHTML='<div class="av3-panel-head"><h3 style="margin:0">Dây chuyền nguồn → chuẩn hóa → Student</h3>'+
 '<button type="button" class="av3-button outline" data-pipe-admin="refresh">Làm mới</button></div>'+
 '<p class="av3-muted">Danh mục được cập nhật từ máy chủ. Nguồn NXB chỉ xác nhận mục lục; bản nháp AURA tự biên soạn là nội dung riêng, không phải nguyên văn SGK.</p>'+
 '<div class="av3-stats">'+
 '<div><strong>'+(cnt?(cnt.sgk_outlines||0):"—")+'</strong><small>Khung SGK chuẩn hóa</small></div>'+
 '<div><strong>'+(cnt?(cnt.student_preview_drafts||0):"—")+'</strong><small>Bài AURA có thể xem thử ở Student</small></div>'+
 '<div><strong>'+(cnt?(cnt.locked_practice_modules||0):"—")+'</strong><small>Mô-đun bài tập vẫn khóa QA</small></div></div>'+
 (state.error?'<p role="alert" class="av3-caution">'+esc(state.error)+'</p>':'')+
 (!state.data?'<p role="status" class="av3-muted">Đang kết nối kho chuẩn hóa…</p>':
  '<p class="av3-muted">'+list.length+' đơn vị '+(state.tab==="practice"?"bài tập / ôn tập":"SGK")+
  ' · '+total("verified_publisher_bodies")+' nội dung trang SGK được xác minh. '+
  'Bài tập chưa kiểm định không tự chuyển sang đề và không có chấm điểm.</p>'+
  '<div class="av4-admin-items">'+displayed.map(u=>{
   const official=validOfficial(u.source_url);
   return '<div class="av4-admin-row" style="border-top:1px solid #e7edf6;padding:13px 2px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">'+
   '<div style="flex:1;min-width:200px"><b>'+esc(u.title)+'</b>'+
   '<small style="display:block;color:#71819a;margin-top:5px">Tập '+esc(u.volume)+' · tr. '+esc(u.printed_page)+
   ' · '+esc(label[u.status]||"Chưa xác minh")+'</small></div>'+
   (u.preview_ready?'<button type="button" class="av3-button outline" data-pipe-admin="preview" data-id="'+esc(u.id)+'">Xem nháp</button>':'')+
   '<a class="av3-button outline" href="'+esc(official)+'" target="_blank" rel="noopener noreferrer">Nguồn NXB</a>'+
   '</div>';
  }).join("")+'</div>'+
  (list.length>12?'<button type="button" class="av3-button subtle" data-pipe-admin="more">'+
   (state.expanded?"Thu gọn":"Xem đủ "+list.length+" mục")+'</button>':'')+
  (state.detail?'<div class="av4-admin-preview" style="margin-top:16px;background:#f6f8ff;padding:17px;border-radius:14px">'+
   state.detail+'</div>':'')
 )+
 '<p class="av3-footnote">Chỉ Student có thiết bị được ghép mới xem bản nháp AURA; xác minh chuyên môn và bài tập gốc SGK vẫn là công việc chưa hoàn tất.</p>';
}
async function load(force=false){
 if(state.request)return state.request;
 if(!force&&state.data&&Date.now()-state.at<120000){render();return}
 const serial=++state.serial;
 state.error="";render();
 state.request=(async()=>{
  try{
   const data=await api("learning_pipeline_catalog");
   if(data.copyright_scope!=="PUBLISHER_TOC_AND_AI_AUTHORED_DRAFTS_ONLY"||
       !Array.isArray(data.items)||!data.totals||data.official_exam_enabled!==false)
    throw Error("Dữ liệu chuẩn hóa chưa đạt quy tắc nguồn.");
   if(serial!==state.serial)return;
   state.data=data;state.at=Date.now();
  }catch(e){state.error=String(e?.message||e)}
  finally{state.request=null;render()}
 })();
 return state.request;
}
function detailHtml(d){
 if(d.content_origin!=="AURA_AI_AUTHORED_DRAFT"||!d.preview_only)return "";
 const blocks=[["Khởi động",d.opening],["Giải thích khái niệm",d.concept],
  ["Ví dụ AURA",d.worked_example],["Luyện tập không chấm điểm",d.practice_prompt],
  ["Vận dụng",d.application_prompt]];
 return '<h3>'+esc(d.title)+'</h3><p class="av3-caution">Bản nháp do AURA biên soạn, mới kiểm tra cấu trúc. Chưa xác minh chuyên môn, chưa phải nội dung nguyên văn SGK.</p>'+
 blocks.map(([name,content])=>'<div style="margin:13px 0"><b>'+esc(name)+'</b>'+
 '<p style="white-space:pre-wrap;margin:6px 0">'+esc(content)+'</p></div>').join("");
}
async function open(id){
 const row=currentItems().find(x=>x.id===id&&x.preview_ready);
 if(!row)return;
 state.detail='<p class="av3-muted">Đang tải bản nháp…</p>';render();
 try{
  const d=await api("learning_pipeline_lesson",{section_id:id});
  if(panel()&&currentItems().some(x=>x.id===id))
   state.detail=detailHtml(d)||'<p>Chưa đọc được bản nháp.</p>';
 }catch(e){state.detail='<p role="alert">'+esc(e.message)+'</p>'}
 render();
}
function mount(tab){
 if(tab==="exam")return;
 state.tab=tab;
 state.expanded=false;state.detail="";
 const root=document.querySelector(".av3-document-body");
 if(!root)return;
 if(!panel()){
  const node=document.createElement("section");
  node.id="auraLearningPipelineAdminV4";
  node.className="av3-panel";
  node.setAttribute("aria-label","Dây chuyền chuẩn hóa nguồn học tập");
  root.append(node);
 }
 render();load();
}
document.getElementById("app")?.addEventListener("click",e=>{
 const b=e.target.closest("[data-pipe-admin]");
 if(!b||!panel()?.contains(b))return;
 if(b.dataset.pipeAdmin==="refresh"){state.data=null;state.at=0;load(true)}
 if(b.dataset.pipeAdmin==="more"){state.expanded=!state.expanded;render()}
 if(b.dataset.pipeAdmin==="preview")open(b.dataset.id);
});
window.AURA_LEARNING_PIPELINE_ADMIN={mount,refresh:()=>load(true)};
})();
