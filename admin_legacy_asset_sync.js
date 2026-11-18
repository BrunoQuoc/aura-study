/* AURA STUDY -- optional private server copy for a previously published Drive resource.
 * Preserves the old Admin interface; a file chosen here is uploaded only to a private bucket.
 * The Admin chooses the exact approved file when Drive read permission is unavailable.
 */
(function(){
"use strict";
if(!document.body.classList.contains("admin-shell"))return;
const BASE="https://ufqzuowjhdqpydqvcsob.supabase.co";
const KEY="sb_publishable_d7x2eMPcTVYwWQc1U3ic1Q_PEaTut1p";
const API=BASE+"/functions/v1/aura-legacy-content-asset-v2";
const LIMIT=6291456;
const MIME={
 pdf:"application/pdf",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
 doc:"application/msword",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",txt:"text/plain"
};
const DOC_MIME="application/vnd.google-apps.document";
const SHEET_MIME="application/vnd.google-apps.spreadsheet";
const SLIDE_MIME="application/vnd.google-apps.presentation";
let sending=false;
function status(message){
 const el=document.getElementById("auraCloudAdminStatus");
 if(el)el.textContent=message;
}
function nameMime(file){
 const ext=(file.name||"").split(".").pop().toLowerCase();
 const mime=MIME[ext];
 if(!mime)throw Error("Chỉ nhận PDF, Word, PNG, JPG và TXT (tối đa 6 MiB).");
 if(file.size<1||file.size>LIMIT)throw Error("Tệp phải có dung lượng từ 1 byte đến 6 MiB.");
 if(file.type && file.type!==mime && !(ext==="doc"&&file.type==="application/octet-stream"))
  throw Error("Định dạng tệp không khớp phần mở rộng.");
 return mime;
}
async function request(action,data){
 const cloud=window.AURA_LEGACY_CLOUD_ADMIN;
 if(!cloud?.getToken)throw Error("Chưa kết nối Admin máy chủ.");
 const token=await cloud.getToken();
 const response=await fetch(API,{
  method:"POST",cache:"no-store",
  headers:{"Content-Type":"application/json",apikey:KEY,Authorization:"Bearer "+token},
  body:JSON.stringify({action,...data})
 });
 let body={};try{body=await response.json()}catch{}
 if(!response.ok)throw Error(body.error||"Máy chủ chưa xác nhận thao tác tệp.");
 if(!body.staging_only||!body.asset_v2)throw Error("Máy chủ tệp không ở chế độ Staging.");
 return body;
}
async function send(fileId,file){
 if(sending)throw Error("Đang chuyển một tệp khác lên kho chung.");
 const mime=nameMime(file);
 sending=true;
 try{
  status("Đang cấp quyền tải bản sao lên kho riêng tư...");
  const ticket=await request("admin_upload_ticket",{file_id:fileId,mime,size:file.size});
  const uploadUrl=new URL(ticket.signed_upload_url);
  if(uploadUrl.origin!==BASE || !uploadUrl.pathname.startsWith("/storage/v1/object/upload/sign/"))
   throw Error("Đường dẫn tải tệp không hợp lệ.");
  status("Đang lưu tệp lên AURA ("+Math.round(file.size/1024)+" KB)...");
  const response=await fetch(uploadUrl.href,{method:"PUT",cache:"no-store",
   headers:{"Content-Type":mime,"cache-control":"max-age=3600","x-upsert":"false"},body:file});
  if(!response.ok)throw Error("Không lưu được tệp lên kho AURA (HTTP "+response.status+").");
  const done=await request("admin_attach_asset",{
   file_id:fileId,path:ticket.path,mime,size:file.size});
  if(!done.asset_ready)throw Error("Máy chủ chưa xác minh được bản sao.");
  status("Đã lưu bản sao riêng tư trên AURA. Student có thể mở từ thiết bị đã ghép.");
  window.AURA_LEGACY_CLOUD_ADMIN?.refresh?.();
  return true;
 }finally{sending=false}
}
function pickFile(){
 return new Promise(resolve=>{
  const input=document.createElement("input");
  input.type="file";input.accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt";
  input.style.cssText="position:fixed;left:-10000px;opacity:0";
  document.body.appendChild(input);
  input.addEventListener("change",()=>{const f=input.files?.[0]||null;input.remove();resolve(f)},{once:true});
  // Keep input open as long as the native picker is displayed; no artificial timeout.
  input.click();
 });
}
async function upload(fileId){
 const selected=pickFile(); // invoke inside the click's user activation
 const file=await selected;
 if(!file)return false;
 try{
  const choice=window.AURA_LEGACY_CLOUD_ADMIN?.localApproved?.().find(x=>x.driveFileId===fileId);
  if(choice && !confirm("Lưu tệp '"+file.name+"' làm bản sao của tài liệu đã duyệt '"+String(choice.name).slice(0,80)+"'?"))return false;
  return await send(fileId,file);
 }catch(e){status(e.message||"Không thể lưu tệp.");return false}
}
async function fromDrive(fileId){
 const cloud=window.AURA_LEGACY_CLOUD_ADMIN;
 const item=cloud?.localApproved?.().find(x=>x.driveFileId===fileId);
 // Never prompt for Drive OAuth after an explicit Admin publish; fallback to file picker.
 const token=window.AURA_DRIVE_AUTH?.token;
 if(!item||!token)return false;
 try{
  let mime=item.mimeType||"application/pdf",url;
  if([DOC_MIME,SHEET_MIME,SLIDE_MIME].includes(mime)){
   mime="application/pdf";
   url="https://www.googleapis.com/drive/v3/files/"+encodeURIComponent(fileId)+
    "/export?mimeType="+encodeURIComponent(mime);
  }else{
   url="https://www.googleapis.com/drive/v3/files/"+encodeURIComponent(fileId)+"?alt=media";
  }
  const ext=Object.entries(MIME).find(([,value])=>value===mime)?.[0]||"";
  if(!ext)return false;
  const response=await fetch(url,{headers:{Authorization:"Bearer "+token}});
  if(!response.ok)throw Error("Drive không cấp quyền đọc tệp. Hãy dùng nút Lưu tệp lên AURA.");
  const file=new File([await response.blob()],String(item.name||"tai-lieu").replace(/\.[^.]+$/,"")+"."+ext,{type:mime});
  await send(fileId,file);
  return true;
 }catch(e){status((e.message||"Không sao chép được từ Drive.")+" Bấm Lưu tệp lên AURA để chọn tệp từ máy.");return false}
}
window.AURA_LEGACY_ASSET_ADMIN=Object.freeze({upload,fromDrive});
})();