import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.102.0/+esm";
import { AURA_AUTH_SECURITY } from "./auth/phase3fa-security-config.js";
import { adminOtpOptions, anonymousAuthArgs } from "./auth/phase3fa-turnstile.js";

const role=document.body.dataset.role;
if(!["admin","student"].includes(role))throw Error("AURA_SIMPLE_ROLE_INVALID");
const SERVER="https://ufqzuowjhdqpydqvcsob.supabase.co";
const KEY="sb_publishable_d7x2eMPcTVYwWQc1U3ic1Q_PEaTut1p";
const PORTAL=SERVER+"/functions/v1/aura-portal-access-v1";
const IDENTITY=SERVER+"/functions/v1/aura-identity-pair";
const auth=createClient(SERVER,KEY,{auth:{
 storageKey:role==="admin"?"aura-stage-parent-v1":"aura-stage-student-v1",
 flowType:"pkce",detectSessionInUrl:false,persistSession:true,autoRefreshToken:true
}});
const $=id=>document.getElementById(id);
const set=(id,msg)=>{if($(id))$(id).textContent=msg;};
let turnstileId=null,challengeLoading=null,pendingJoin=null,issuedLink=null,authedAdmin=false;
let cooldown=0;
if(role==="student"){
 const h=location.hash.slice(1);
 const u=new URLSearchParams(h);
 const code=u.get("join");
 if(code&&/^[A-Za-z0-9_-]{32}$/.test(code))pendingJoin=code;
 if(location.hash)history.replaceState(null,"",location.pathname+location.search);
}
function show(id,visible){const node=$(id);if(node)node.hidden=!visible;}
function errorText(e){return e?.message||"Thao tác chưa thành công, vui lòng thử lại."}
async function captchaToken(requireResponse=true){
 if(AURA_AUTH_SECURITY.captchaMode!=="turnstile")return null;
 if(!challengeLoading){
  challengeLoading=(async()=>{
    if(!globalThis.turnstile?.render){
      await new Promise((ok,fail)=>{
       const s=document.createElement("script");
       s.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
       s.async=true;s.defer=true;s.onload=ok;s.onerror=()=>fail(Error("Không tải được bảo vệ đăng nhập."));
       document.head.appendChild(s);
      });
    }
    if(!globalThis.turnstile?.render)throw Error("Xác minh chống bot chưa sẵn sàng.");
    turnstileId=globalThis.turnstile.render("#captcha",{
     sitekey:AURA_AUTH_SECURITY.turnstileSiteKey,theme:"auto","response-field":false
    });
  })().catch(e=>{challengeLoading=null;throw e});
 }
 await challengeLoading;
 if(!requireResponse)return null;
 const value=globalThis.turnstile?.getResponse?.(turnstileId);
 if(typeof value!=="string"||value.length<10)throw Error("Vui lòng hoàn thành xác minh bên dưới nút đăng nhập.");
 return value;
}
function ensureCaptcha(){
 if(AURA_AUTH_SECURITY.captchaMode!=="turnstile")return;
 show("captchaBox",true);
 if(!challengeLoading)captchaToken(false).catch(e=>set("loginStatus",errorText(e)));
}
function resetChallenge(){
 if(turnstileId!==null)globalThis.turnstile?.reset?.(turnstileId);
}
async function session(){
 const {data,error}=await auth.auth.getSession();
 if(error)throw Error("Không kiểm tra được phiên đăng nhập.");
 return data?.session||null;
}
async function request(endpoint,action,params={}){
 const s=await session();
 if(!s?.access_token)throw Error("Cần đăng nhập trước khi thao tác.");
 const r=await fetch(endpoint,{method:"POST",cache:"no-store",
 headers:{"Content-Type":"application/json","apikey":KEY,"Authorization":"Bearer "+s.access_token},
 body:JSON.stringify({action,...params})});
 let data={};try{data=await r.json()}catch{}
 if(!r.ok)throw Error(data.error||([401,403].includes(r.status)?"Thiết bị hoặc tài khoản chưa được cấp quyền.":"Lỗi kết nối máy chủ."));
 return data;
}
async function roleInfo(){return request(PORTAL,"whoami");}
function busy(button,flag){if(button)button.disabled=flag;}
async function sendAdminEmail(){
 const button=$("sendEmail");
 busy(button,true);
 try{
  const email=$("email").value.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error("Vui lòng nhập email Admin hợp lệ.");
  if(Date.now()<cooldown)throw Error("Vừa gửi liên kết, vui lòng kiểm tra email trước.");
  const captcha=await captchaToken();
  const redirect=location.origin+location.pathname.replace(/\/[^/]+$/,"/aura-staging-login.html");
  const options=adminOtpOptions(AURA_AUTH_SECURITY,redirect,captcha);
  localStorage.setItem("aura-portal-intent-v1","admin");
  const {error}=await auth.auth.signInWithOtp({email,options});
  if(error)throw error;
  cooldown=Date.now()+AURA_AUTH_SECURITY.magicLinkCooldownMs;
  set("loginStatus","Đã gửi yêu cầu đăng nhập. Anh mở email và bấm liên kết AURA STUDY để quay lại trang Admin.");
 }catch(e){
  localStorage.removeItem("aura-portal-intent-v1");
  set("loginStatus",errorText(e));
 }finally{resetChallenge();busy(button,false)}
}
function linkForCode(code){return new URL("./aura-student.html#join="+code,location.href).href}
async function issueLink(studentId,studentName){
 const x=await request(IDENTITY,"issue_student_link",{student_id:studentId});
 if(!/^[A-Za-z0-9_-]{32}$/.test(x.activation_code||""))throw Error("Máy chủ chưa cấp liên kết hợp lệ.");
 issuedLink=linkForCode(x.activation_code);
 show("linkPanel",true);
 $("activationLink").value=issuedLink;
 set("linkStudent","Liên kết vào học cho "+studentName+" (dùng một lần, hiệu lực 48 giờ).");
 set("adminStatus","Đã tạo liên kết. Chọn “Sao chép liên kết” rồi gửi riêng cho thiết bị của học sinh.");
}
async function loadStudents(){
 const output=await request(IDENTITY,"list_students");
 const students=Array.isArray(output.students?.learners)?output.students.learners:[];
 const root=$("studentList");
 root.replaceChildren();
 if(students.length===0){root.append(document.createTextNode("Chưa có học sinh. Nhập tên rồi bấm Tạo học sinh."));return}
 for(const record of students){
  const row=document.createElement("div");row.className="student-row";
  const body=document.createElement("div"),title=document.createElement("strong"),info=document.createElement("small");
  title.textContent=record.name;info.textContent=Number(record.active_devices||0)+" thiết bị đang kết nối";
  body.append(title,info);
  const actions=document.createElement("div");actions.className="student-actions";
  const link=document.createElement("button");link.type="button";link.className="secondary";
  link.textContent="Lấy link học";
  link.addEventListener("click",async()=>{
   busy(link,true);
   try{await issueLink(record.id,record.name)}catch(e){set("adminStatus",errorText(e))}
   finally{busy(link,false)}
  });
  actions.append(link);
  if(Number(record.active_devices)>0){
   const more=document.createElement("details");more.className="manage-devices";
   const sum=document.createElement("summary");sum.textContent="Đổi thiết bị";
   const revoke=document.createElement("button");revoke.type="button";revoke.className="danger";
   revoke.textContent="Ngắt thiết bị cũ";
   revoke.addEventListener("click",async()=>{
    if(!confirm("Ngắt mọi thiết bị đã ghép của "+record.name+"? Sau đó cần cấp link học mới."))return;
    busy(revoke,true);
    try{await request(IDENTITY,"revoke_student_devices",{student_id:record.id});
      show("linkPanel",false);issuedLink=null;
      await loadStudents();set("adminStatus","Đã ngắt kết nối thiết bị cũ.");
    }catch(e){set("adminStatus",errorText(e))}
    finally{busy(revoke,false)}
   });
   more.append(sum,revoke);actions.append(more);
  }
  row.append(body,actions);root.append(row);
 }
}
async function createStudent(){
 const button=$("createStudent");busy(button,true);
 try{
  const name=$("studentName").value.trim().replace(/\s+/g," ");
  if(name.length<2||name.length>60)throw Error("Nhập tên học sinh 2–60 ký tự.");
  const x=await request(IDENTITY,"create_student",{name});
  if(!x.student?.student_id)throw Error("Không thể tạo học sinh.");
  $("studentName").value="";
  await loadStudents();
  await issueLink(x.student.student_id,name);
 }catch(e){set("adminStatus",errorText(e))}
 finally{busy(button,false)}
}
async function copyLink(){
 const button=$("copyLink");
 if(!issuedLink)return;
 busy(button,true);
 try{
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(issuedLink)}
  else{$("activationLink").focus();$("activationLink").select();document.execCommand("copy")}
  set("adminStatus","Đã sao chép. Anh gửi riêng link này cho học sinh; mở lần đầu trên đúng thiết bị dùng để học.");
 }catch{
  $("activationLink").focus();$("activationLink").select();
  set("adminStatus","Anh giữ vào ô liên kết và chọn Sao chép để gửi cho thiết bị học.");
 }finally{busy(button,false)}
}
async function adminStartup(){
 const s=await session();
 if(!s){show("loginPanel",true);show("adminWorkspace",false);ensureCaptcha();set("loginStatus","Admin đăng nhập bằng email đã được cấp quyền.");return}
 try{
  const info=await roleInfo();
  if(info.roles?.admin!==true)throw Error("Tài khoản này chưa có quyền Admin.");
  authedAdmin=true;show("loginPanel",false);show("adminWorkspace",true);
  set("adminStatus","Đã xác thực Admin. Anh có thể tạo học sinh và cấp liên kết học.");
  await loadStudents();
 }catch(e){
  show("loginPanel",true);show("adminWorkspace",false);
  set("loginStatus",errorText(e));ensureCaptcha();
 }
}
async function studentStartup(){
 show("studentReady",false);
 const s=await session();
 if(s){
  try{
   const info=await roleInfo();
   if(info.roles?.student===true){
    if(pendingJoin){
     set("loginStatus","Thiết bị này đang kết nối với một học sinh. Nếu muốn đổi, nhờ Admin ngắt thiết bị cũ và chọn Đổi thiết bị tại đây.");
     show("studentReady",true);set("studentReadyText","Đã có học sinh trên thiết bị này.");
     show("studentStartPanel",false);return;
    }
    if(new URLSearchParams(location.search).get("manage")==="1"){
     show("studentReady",true);
     show("studentStartPanel",false);show("studentNoLink",false);
     set("studentReadyText","Tài khoản Student đã kết nối");
     set("loginStatus","Tài khoản học đã được kích hoạt. Bạn có thể trở lại học hoặc chọn kết thúc phiên bên dưới.");
     return;
    }
    location.replace("./student-direct.html");
    return;
   }
   if(!s.user?.is_anonymous)throw Error("Đây không phải phiên Student. Hãy dùng thiết bị học riêng.");
  }catch(e){set("loginStatus",errorText(e));}
 }
 if(pendingJoin){
  show("studentStartPanel",true);show("studentNoLink",false);
  set("loginStatus","Admin đã gửi liên kết. Bấm nút dưới đây để kích hoạt và vào học.");
  if(!s)ensureCaptcha();
 }else{
  show("studentStartPanel",false);show("studentNoLink",true);
  set("loginStatus","Hãy mở liên kết học do Admin gửi. Nếu đã kích hoạt trên máy này, thử tải lại trang.");
 }
}
async function startStudent(){
 const btn=$("studentEnter");busy(btn,true);
 try{
  if(!pendingJoin)throw Error("Chưa có liên kết học. Nhờ Admin gửi một liên kết mới.");
  let s=await session();
  if(!s){
   const captcha=await captchaToken();
   const {data,error}=await auth.auth.signInAnonymously(anonymousAuthArgs(captcha));
   if(error||!data?.session?.user?.is_anonymous)throw error||Error("Không tạo được phiên Student.");
   s=data.session;
  }
  if(!s.user?.is_anonymous)throw Error("Thiết bị này có phiên không phải Student.");
  const info=await roleInfo();
  if(info.roles?.student)throw Error("Thiết bị đã ghép với học sinh khác. Hãy nhờ Admin đổi thiết bị.");
  const result=await request(IDENTITY,"redeem_pairing_code",{
   pairing_code:pendingJoin,device_label:"Thiết bị học AURA"
  });
  if(result.role!=="student")throw Error("Liên kết chưa được kích hoạt.");
  pendingJoin=null;resetChallenge();
  set("loginStatus","Kích hoạt thành công. Đang mở Toán 6...");
  location.replace("./student-direct.html");
 }catch(e){
  set("loginStatus",errorText(e)+" Nếu liên kết đã hết hạn, nhờ Admin bấm Lấy link học mới.");
 }finally{resetChallenge();busy(btn,false)}
}
async function resetStudentDevice(){
 if(!confirm("Xóa phiên Student trên trình duyệt này? Học sinh sẽ cần liên kết kích hoạt mới từ Admin."))return;
 try{await auth.auth.signOut();pendingJoin=null;show("studentReady",false);
 show("studentStartPanel",false);show("studentNoLink",true);
 set("loginStatus","Đã kết thúc phiên. Nhờ Admin cấp liên kết học mới.");
 }catch(e){set("loginStatus",errorText(e))}
}
function wire(id,fn){const node=$(id);if(node)node.addEventListener("click",fn)}
if(role==="admin"){
 wire("sendEmail",sendAdminEmail);
 wire("createStudent",createStudent);
 wire("copyLink",copyLink);
 wire("refreshStudents",async()=>{try{await loadStudents()}catch(e){set("adminStatus",errorText(e))}});
 wire("adminLogout",async()=>{try{await auth.auth.signOut();authedAdmin=false;
  show("adminWorkspace",false);show("loginPanel",true);show("linkPanel",false);issuedLink=null;
  ensureCaptcha();set("loginStatus","Đã đăng xuất Admin.");
 }catch(e){set("adminStatus",errorText(e))}});
 adminStartup().catch(e=>set("loginStatus",errorText(e)));
}else{
 wire("studentEnter",startStudent);
 wire("resetStudentDevice",resetStudentDevice);
 studentStartup().catch(e=>set("loginStatus",errorText(e)));
}
