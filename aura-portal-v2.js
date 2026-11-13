import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.102.0/+esm";
import { AURA_AUTH_SECURITY } from "./auth/phase3fa-security-config.js";
import { adminOtpOptions, anonymousAuthArgs } from "./auth/phase3fa-turnstile.js";

const role=document.body.dataset.role;
if(!["admin","parent","student"].includes(role))throw Error("Invalid portal role");
const cfg={
 url:"https://ufqzuowjhdqpydqvcsob.supabase.co",
 key:"sb_publishable_d7x2eMPcTVYwWQc1U3ic1Q_PEaTut1p",
 portal:"https://ufqzuowjhdqpydqvcsob.supabase.co/functions/v1/aura-portal-access-v1",
 identity:"https://ufqzuowjhdqpydqvcsob.supabase.co/functions/v1/aura-identity-pair"
};
const auth=createClient(cfg.url,cfg.key,{auth:{
 storageKey:role==="student"?"aura-stage-student-v1":"aura-stage-parent-v1",
 flowType:"pkce",detectSessionInUrl:false,persistSession:true,autoRefreshToken:true
}});
const $=id=>document.getElementById(id);
const status=(id,message)=>{$(id).textContent=message};
const note=message=>status("authStatus",message);
let cooldown=0;
let captchaWidget=null;
let captchaReady=AURA_AUTH_SECURITY.captchaMode!=="turnstile";
let captchaLoadError=null;
const challenge=role==="student"?"student":"admin";
function captchaValue(){
 if(AURA_AUTH_SECURITY.captchaMode!=="turnstile")return null;
 if(!captchaReady||!globalThis.turnstile||captchaWidget===null)throw Error("CAPTCHA chưa tải xong. Hãy kiểm tra kết nối rồi thử lại.");
 const token=globalThis.turnstile.getResponse(captchaWidget);
 if(typeof token!=="string"||token.length<10)throw Error("Vui lòng hoàn thành xác minh Cloudflare.");
 return token;
}
function resetChallenge(){
 if(captchaWidget!==null&&globalThis.turnstile?.reset)globalThis.turnstile.reset(captchaWidget);
}
async function initializeCaptcha(){
 if(AURA_AUTH_SECURITY.captchaMode!=="turnstile"){status("authStatus","Đang sử dụng chế độ thử nghiệm không có CAPTCHA.");return;}
 const script=document.createElement("script");
 script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
 script.async=true;script.defer=true;
 await new Promise((resolve,reject)=>{
  script.onload=resolve;script.onerror=()=>reject(Error("Không tải được Cloudflare Turnstile"));document.head.append(script);
 });
 if(!globalThis.turnstile?.render)throw Error("Không thể khởi tạo Cloudflare Turnstile");
 captchaWidget=globalThis.turnstile.render("#captcha",{sitekey:AURA_AUTH_SECURITY.turnstileSiteKey,theme:"auto","response-field":false});
 captchaReady=true;
}
async function currentSession(){
 const {data,error}=await auth.auth.getSession();
 if(error)throw Error("Không kiểm tra được phiên xác thực.");
 if(!data?.session?.access_token)throw Error("Chưa có phiên đăng nhập cho khu vực này.");
 return data.session;
}
async function gateway(url,action,params={}){
 const session=await currentSession();
 const response=await fetch(url,{method:"POST",cache:"no-store",headers:{
  "Content-Type":"application/json","apikey":cfg.key,"Authorization":"Bearer "+session.access_token
 },body:JSON.stringify({action,...params})});
 let data={};try{data=await response.json()}catch(_){}
 if(!response.ok){
  if(response.status===401)throw Error("Phiên đăng nhập đã hết hạn hoặc không hợp lệ.");
  if(response.status===403)throw Error(data.error||"Tài khoản chưa được cấp quyền cho khu vực này.");
  throw Error(data.error||"Máy chủ chưa sẵn sàng ("+response.status+").");
 }
 return data;
}
function setAuthorized(value){
 const panel=$("roleDetails");
 if(panel)panel.dataset.ready=value?"true":"false";
}
async function checkRole(){
 setAuthorized(false);
 status("roleStatus","Đang xác minh vai trò trên máy chủ…");
 try{
  const who=await gateway(cfg.portal,"whoami");
  if(who.roles?.[role]!==true)throw Error("Tài khoản hoặc thiết bị này chưa có quyền "+role.toUpperCase()+".");
  let details;
  if(role==="admin"){
   details=await gateway(cfg.portal,"admin_status");
   status("roleStatus",details.authorized?"Quyền Admin hợp lệ. Có thể mở công cụ quản trị.":"Quyền Admin chưa hợp lệ.");
  }else if(role==="parent"){
   details=await gateway(cfg.portal,"parent_summary");
   const list=$("learners");list.replaceChildren();
   const records=Array.isArray(details.summary?.learners)?details.summary.learners:[];
   if(!records.length){const p=document.createElement("p");p.className="muted";p.textContent="Chưa có hồ sơ học sinh được cấp cho tài khoản này.";list.append(p);}
   for(const child of records){
    const card=document.createElement("div");card.className="learner";
    const name=document.createElement("strong");name.textContent=child.name||"Học sinh";
    const p=document.createElement("p");p.className="muted small";p.textContent="Thiết bị đã ghép: "+Number(child.active_devices||0);
    card.append(name,p);list.append(card);
   }
   status("roleStatus","Quyền Parent hợp lệ. Chỉ hiển thị học sinh thuộc hộ gia đình được cấp.");
  }else{
   details=await gateway(cfg.portal,"student_summary");
   const records=Array.isArray(details.summary?.learners)?details.summary.learners:[];
   $("studentInfo").textContent=records.length?"Thiết bị đã liên kết với "+records.map(x=>x.name||"học sinh").join(", ")+".":"Thiết bị chưa được liên kết.";
   status("roleStatus",records.length?"Quyền Student hợp lệ. Gói học chính thức chưa kích hoạt.":"Thiết bị cần được liên kết với Parent.");
  }
  setAuthorized(true);
 }catch(e){
  status("roleStatus",e?.message||"Không thể xác minh quyền.");
 }
}
async function signIn(){
 const email=$("email").value.trim();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error("Nhập email hợp lệ.");
 if(Date.now()<cooldown)throw Error("Đã gửi yêu cầu gần đây; vui lòng đợi trước khi gửi lại.");
 const captcha=captchaValue();
 // This redirect is already used by the existing Staging login and is the only
 // origin/path currently accepted by adminOtpOptions. Bridge back after callback.
 const redirect=location.origin+location.pathname.replace(/\/[^/]+$/,"/aura-staging-login.html");
 const opts=adminOtpOptions(AURA_AUTH_SECURITY,redirect,captcha);
 localStorage.setItem("aura-portal-intent-v1",role);
 try{
  const {error}=await auth.auth.signInWithOtp({email,options:opts});
  if(error)throw error;
  cooldown=Date.now()+AURA_AUTH_SECURITY.magicLinkCooldownMs;
  note("Nếu email đã được cấp quyền, liên kết đăng nhập sẽ được gửi. Mở email trong cùng trình duyệt; hệ thống sẽ quay về khu vực "+role.toUpperCase()+".");
 }catch(e){
  localStorage.removeItem("aura-portal-intent-v1");
  throw e;
 }finally{resetChallenge();}
}
async function startStudent(){
 let {data:{session},error:e}=await auth.auth.getSession();
 if(e)throw Error("Không kiểm tra được phiên thiết bị.");
 if(session?.user?.is_anonymous){note("Đã có phiên thiết bị; dùng mã do phụ huynh cấp để liên kết.");await checkRole();return;}
 if(session)throw Error("Đây không phải phiên thiết bị Student. Vui lòng đăng xuất trước.");
 const captcha=captchaValue();
 try{
  const {data,error}=await auth.auth.signInAnonymously(anonymousAuthArgs(captcha));
  if(error||!data?.session)throw error||Error("Không tạo được phiên thiết bị.");
  note("Phiên Student đã được tạo. Tiếp theo nhập mã ghép đôi từ Parent.");
  await checkRole();
 }finally{resetChallenge();}
}
async function pairStudent(){
 const code=$("pairCode").value.trim();
 if(!/^[A-Za-z0-9_-]{32}$/.test(code))throw Error("Mã kết nối phải đủ 32 ký tự.");
 const session=await currentSession();
 if(session.user?.is_anonymous!==true)throw Error("Cần sử dụng phiên Student ẩn danh để ghép thiết bị.");
 const result=await gateway(cfg.identity,"redeem_pairing_code",{pairing_code:code,device_label:$("deviceLabel").value.trim().slice(0,80)||"Thiết bị học"});
 $("pairCode").value="";
 note(result.role==="student"?"Thiết bị đã ghép thành công.":"Chưa xác nhận được liên kết.");
 await checkRole();
}
async function issuePairCode(){
 const data=await gateway(cfg.identity,"create_pairing_code");
 if(!/^[A-Za-z0-9_-]{32}$/.test(data.pairing_code||""))throw Error("Máy chủ không trả mã hợp lệ.");
 const node=$("issuedCode");node.textContent=data.pairing_code;
 node.hidden=false;
 note("Mã ghép đôi mới có hiệu lực 10 phút. Chỉ chuyển cho thiết bị học của gia đình.");
}
async function signOut(){
 await auth.auth.signOut();
 setAuthorized(false);
 status("roleStatus","Đã đăng xuất. Không có nội dung nào được mở.");
 note("Đã kết thúc phiên trong trình duyệt.");
 const node=$("issuedCode");if(node){node.hidden=true;node.textContent="";}
}
function bind(id,fn){
 const b=$(id);if(!b)return;
 b.addEventListener("click",async()=>{
  b.disabled=true;try{await fn()}catch(e){note(e?.message||"Thao tác không thành công.");}finally{b.disabled=false;}
 });
}
bind("signIn",signIn);
bind("startStudent",startStudent);
bind("pairStudent",pairStudent);
bind("issuePairCode",issuePairCode);
bind("checkRole",checkRole);
bind("signOut",signOut);
initializeCaptcha().then(()=>checkRole()).catch(e=>{
 captchaLoadError=e;note("Không tải được CAPTCHA, chưa thể tạo phiên đăng nhập mới. "+e.message);
 checkRole();
});
