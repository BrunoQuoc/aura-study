/* AURA STUDY -- open a short-lived private server document on a paired Student device.
 * No private object path or service key is exposed in the legacy Student UI.
 */
(function(){
"use strict";
if(!document.body.classList.contains("student-shell"))return;
const BASE="https://ufqzuowjhdqpydqvcsob.supabase.co";
const KEY="sb_publishable_d7x2eMPcTVYwWQc1U3ic1Q_PEaTut1p";
const API=BASE+"/functions/v1/aura-legacy-content-asset-v2";
const uuid=id=>typeof id==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
async function openAsset(resourceId){
 if(!uuid(resourceId))return;
 // Open synchronously to preserve user gesture on iPhone/Safari.
 const tab=window.open("about:blank","_blank");
 const status=document.getElementById("auraCloudStudentStatus");
 if(status)status.textContent="Đang tạo liên kết đọc tài liệu riêng tư...";
 try{
  const cloud=window.AURA_LEGACY_CLOUD_STUDENT;
  if(!cloud?.getToken)throw Error("Chưa kích hoạt kết nối Student.");
  const response=await fetch(API,{method:"POST",cache:"no-store",
   headers:{"Content-Type":"application/json",apikey:KEY,Authorization:"Bearer "+await cloud.getToken()},
   body:JSON.stringify({action:"student_open_asset",resource_id:resourceId})});
  let data={};try{data=await response.json()}catch{}
  if(!response.ok)throw Error(data.error||"Chưa tải được tệp từ AURA.");
  const address=new URL(data.url||"");
  if(!data.staging_only||!data.asset_v2||address.origin!==BASE ||
     !address.pathname.startsWith("/storage/v1/object/sign/"))
   throw Error("Máy chủ không cấp liên kết đọc tệp hợp lệ.");
  if(tab){tab.location.replace(address.href)}
  else{window.location.assign(address.href)}
  if(status)status.textContent="Đã mở tệp từ kho AURA. Liên kết đọc chỉ có hiệu lực ngắn.";
 }catch(e){
  if(tab)tab.close();
  if(status)status.textContent=(e.message||"Không mở được tài liệu.")+" Hãy bấm Làm mới hoặc nhờ Admin kiểm tra.";
 }
}
document.addEventListener("click",e=>{
 const el=e.target.closest("[data-aura-cloud-open]");
 if(!el)return;
 e.preventDefault();
 openAsset(el.getAttribute("data-aura-cloud-open"));
});
window.AURA_LEGACY_ASSET_STUDENT=Object.freeze({open:openAsset});
})();