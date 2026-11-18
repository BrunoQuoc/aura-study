/* AURA STUDY V6 — Supabase native password auth, not client-side PIN matching.
 * Username is mapped locally to a reserved internal Auth email; no child email
 * or activation link is necessary. Password is never stored by AURA UI.
 */
import {createClient} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.102.0/+esm";

const SERVER="https://ufqzuowjhdqpydqvcsob.supabase.co";
const KEY="sb_publishable_d7x2eMPcTVYwWQc1U3ic1Q_PEaTut1p";
const auth=createClient(SERVER,KEY,{auth:{
 storageKey:"aura-stage-student-v1",flowType:"pkce",detectSessionInUrl:false,
 persistSession:true,autoRefreshToken:true
}});
let busy=false;
const status=(message)=>{
 const el=document.getElementById("auraStudentLoginErrorV6");
 if(el)el.textContent=message||"";
};
function normalize(input){
 const username=String(input||"").trim().toLowerCase();
 if(!/^[a-z][a-z0-9._-]{2,29}$/.test(username))
  throw Error("Tên đăng nhập không hợp lệ. Hãy kiểm tra tài khoản Admin đã cấp.");
 return username;
}
async function login(username,password){
 if(busy)return false;
 busy=true;
 const button=document.getElementById("auraStudentLoginSubmitV6");
 if(button){button.disabled=true;button.textContent="Đang đăng nhập…"}
 status("");
 try{
  const loginName=normalize(username);
  if(typeof password!=="string"||password.length<8)
   throw Error("Kiểm tra lại mật khẩu.");
  const {data,error}=await auth.auth.signInWithPassword({
   email:loginName+"@students.aura-study.invalid",password
  });
  if(error||!data?.session?.access_token)
   throw Error("Tên đăng nhập hoặc mật khẩu không đúng.");
  // Never rely on successful Auth alone: active learner pairing must be verified
  // by the server before rendering any Student materials.
  const verified=await window.AURA_STUDENT_ONE_LOGIN_V5?.verify(true);
  if(!verified){
   await auth.auth.signOut();
   throw Error("Tài khoản chưa được Admin cấp quyền học hoặc đã bị khóa.");
  }
  return true;
 }catch(e){
  status(e?.message||"Không thể đăng nhập. Vui lòng thử lại.");
  return false;
 }finally{
  busy=false;
  const active=document.getElementById("auraStudentLoginSubmitV6");
  if(active){active.disabled=false;active.textContent="Đăng nhập và vào học"}
 }
}
async function logout(){
 try{
  const {error}=await auth.auth.signOut({scope:"local"});
  if(error)throw error;
  window.AURA_STUDENT_ONE_LOGIN_V5?.lock("Đã đăng xuất. Nhập tài khoản và mật khẩu để vào học.");
 }catch(e){
  window.alert("Chưa đăng xuất được. Vui lòng thử lại khi có kết nối.");
 }
}
document.addEventListener("submit",e=>{
 const form=e.target;
 if(form?.id!=="auraStudentPasswordFormV6")return;
 e.preventDefault();
 login(document.getElementById("auraStudentUsernameV6")?.value||"",
  document.getElementById("auraStudentPasswordV6")?.value||"");
});
window.AURA_STUDENT_PASSWORD_V6={login,logout};
