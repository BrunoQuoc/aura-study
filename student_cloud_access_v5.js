/* AURA STUDY V5 — one cloud Student login, Admin-created account.
 * Auth source = verified Supabase JWT + active paired learner, never browser PIN.
 * Existing local learning answers remain local and are isolated by verified learner id.
 */
(function(){
"use strict";
if(!document.body.classList.contains("student-shell"))return;
const API="https://ufqzuowjhdqpydqvcsob.supabase.co/functions/v1/aura-legacy-content-sync-v1";
const KEY="sb_publishable_d7x2eMPcTVYwWQc1U3ic1Q_PEaTut1p";
const CURRENT="aura_cloud_active_learner_v5";
const PREFIX="aura_cloud_learning_v5:";
const LEGACY="aura_cloud_legacy_learning_backup_v5";
const escape=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let verified=null,checkTask=null,hooked=false,activeLearner="";
const nativeGet=Storage.prototype.getItem,nativeSet=Storage.prototype.setItem,nativeRemove=Storage.prototype.removeItem;
const originalClear=Storage.prototype.clear;
const readJson=(k,fallback)=>{try{return JSON.parse(nativeGet.call(localStorage,k)||"null")??fallback}catch{return fallback}};
const learningKey=value=>{
 const k=String(value??"");
 return /^(exam_|review_|aura_wrong|aura_smart)/.test(k)||
  ["aura_attempts","aura_recent_questions","aura_generated_exam",
   "aura_generated_draft","aura_exam_period","aura_lesson_state",
   "aura_last_subject","aura_report_reset_at"].includes(k);
};
function keys(){
 const result=[];
 for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(learningKey(k))result.push(k)}
 return result;
}
function capture(){
 const data={};
 for(const k of keys()){const v=nativeGet.call(localStorage,k);if(v!==null)data[k]=v}
 return data;
}
function store(key,value){nativeSet.call(localStorage,key,JSON.stringify(value))}
function snapshot(id){
 if(!id)return;
 store(PREFIX+id,{data:capture(),savedAt:new Date().toISOString()});
}
function clearLearning(){for(const k of keys())nativeRemove.call(localStorage,k)}
function isolate(learnerId){
 const previous=nativeGet.call(localStorage,CURRENT);
 if(previous===learnerId){activeLearner=learnerId;return}
 if(previous)snapshot(previous);
 else if(keys().length&&!nativeGet.call(localStorage,LEGACY)){
  // Preserve old PIN-era progress without guessing which cloud learner owns it.
  store(LEGACY,{data:capture(),savedAt:new Date().toISOString(),origin:"LEGACY_UNLINKED"});
 }
 clearLearning();
 const saved=readJson(PREFIX+learnerId,{});
 for(const [key,value] of Object.entries(saved.data||{})){
  if(learningKey(key)&&typeof value==="string")nativeSet.call(localStorage,key,value);
 }
 nativeSet.call(localStorage,CURRENT,learnerId);
 activeLearner=learnerId;
}
function installMirror(){
 if(hooked)return;
 hooked=true;
 let busy=false;
 function mirror(key,value,remove){
  if(busy||!verified||!activeLearner||!learningKey(key))return;
  busy=true;
  try{
   const saved=readJson(PREFIX+activeLearner,{}),data={...(saved.data||{})};
   if(remove)delete data[key];else data[key]=String(value);
   store(PREFIX+activeLearner,{data,savedAt:new Date().toISOString()});
  }finally{busy=false}
 }
 Storage.prototype.setItem=function(k,v){
  const result=nativeSet.call(this,k,v);
  if(this===localStorage)mirror(String(k),v,false);
  return result;
 };
 Storage.prototype.removeItem=function(k){
  const result=nativeRemove.call(this,k);
  if(this===localStorage)mirror(String(k),null,true);
  return result;
 };
 Storage.prototype.clear=function(){
  if(this!==localStorage)return originalClear.call(this);
  for(const key of keys())nativeRemove.call(this,key);
  if(verified&&activeLearner)store(PREFIX+activeLearner,{data:{},savedAt:new Date().toISOString()});
 };
}
function overlay(message){
 let root=document.getElementById("auraStudentOneLoginV5");
 if(!root){
  root=document.createElement("div");root.id="auraStudentOneLoginV5";
  root.className="aura-student-gate";
  root.setAttribute("role","dialog");
  root.setAttribute("aria-modal","true");
  root.setAttribute("aria-label","Đăng nhập AURA STUDY");
  document.body.append(root);
 }
 root.innerHTML='<section class="aura-student-gate-card">'+
  '<span class="small">AURA STUDY · HỌC SINH</span>'+
  '<h1>Một tài khoản để học đầy đủ</h1>'+
  '<p>'+escape(message||"Admin cấp một liên kết học. Kích hoạt một lần trên thiết bị này và dùng luôn các chức năng học tập.")+'</p>'+
  '<a class="btn primary" href="./aura-student.html">Đăng nhập / Kích hoạt tài khoản</a>'+
  '<small>Không cần mã PIN riêng hoặc kết nối thêm trong trang học.</small></section>';
}
function gate(message){
 if(verified&&activeLearner)snapshot(activeLearner);
 verified=null;activeLearner="";
 document.body.classList.remove("aura-cloud-ready");
 overlay(message);
}
function setAccount(profile){
 const name=String(profile.name||"Học sinh").slice(0,60);
 const box=document.querySelector(".aura-account");
 if(!box)return;
 box.replaceChildren();
 const strong=document.createElement("b");strong.textContent=name;
 const link=document.createElement("a");
 link.href="./aura-student.html?manage=1";
 link.className="aura-role";
 link.textContent="Student · Tài khoản";
 link.setAttribute("aria-label","Quản lý phiên Student");
 box.append(strong,link);
}
async function verify(force=false){
 if(checkTask)return checkTask;
 if(verified&&!force)return verified;
 checkTask=(async()=>{
  try{
   const auth=window.AURA_LEGACY_CLOUD_STUDENT;
   if(typeof auth?.getToken!=="function")throw Error("Chưa sẵn sàng đăng nhập trên máy chủ.");
   const jwt=await auth.getToken();
   const r=await fetch(API,{method:"POST",cache:"no-store",
    headers:{"Content-Type":"application/json",apikey:KEY,Authorization:"Bearer "+jwt},
    body:JSON.stringify({action:"student_profile"})});
   let result={};try{result=await r.json()}catch{}
   if(!r.ok||result.role!=="STUDENT"||result.paired!==true||
      result.staging_only!==true||!/^[-a-f0-9]{36}$/i.test(String(result.learner_id||""))){
    throw Error(r.status===403?"Tài khoản Student đã bị thu hồi hoặc chưa kích hoạt. Hãy nhờ Admin cấp lại liên kết.":"Chưa có tài khoản Student được kích hoạt trên thiết bị này.");
   }
   if(!verified||activeLearner!==result.learner_id)isolate(result.learner_id);
   verified={learnerId:result.learner_id,name:result.name};
   installMirror();
   setAccount(result);
   document.getElementById("auraStudentOneLoginV5")?.remove();
   document.body.classList.add("aura-cloud-ready");
   return verified;
  }catch(e){
   gate(String(e?.message||"Hãy sử dụng liên kết học do Admin cung cấp."));
   return null;
  }finally{checkTask=null}
 })();
 return checkTask;
}
window.AURA_STUDENT_ONE_LOGIN_V5={verify,isReady:()=>!!verified,learner:()=>verified,
 snapshot:()=>snapshot(activeLearner)};
gate("Đang xác minh tài khoản học sinh do Admin tạo…");
verify(true).then(v=>{
 if(v&&typeof window.home==="function")window.home();
});
window.addEventListener("focus",()=>{if(verified)verify(true)});
document.addEventListener("visibilitychange",()=>{
 if(document.visibilityState==="hidden"&&activeLearner)snapshot(activeLearner);
 else if(document.visibilityState==="visible"&&verified)verify(true);
});
window.addEventListener("beforeunload",()=>{if(activeLearner)snapshot(activeLearner)});
})();
