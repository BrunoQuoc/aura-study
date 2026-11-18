// AURA STUDY -- STAGING private asset tickets and downloads, preserving legacy UI.
// This gateway never publishes pedagogical approval, exam results or answer keys.
import { createClient } from "npm:@supabase/supabase-js@2.102.0";
const BASE=Deno.env.get("SUPABASE_URL")!;
const BUCKET="aura-legacy-approved-v2", LIMIT=6291456;
const ORIGINS=new Set(["https://brunoquoc.github.io","http://localhost:4173","http://127.0.0.1:4173"]);
const EXT:Record<string,string>={
 "application/pdf":"pdf",
 "application/vnd.openxmlformats-officedocument.wordprocessingml.document":"docx",
 "application/msword":"doc",
 "image/jpeg":"jpg","image/png":"png","text/plain":"txt"
};
function secretKey():string{
 try{
  const v=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default;
  if(typeof v==="string"&&v.startsWith("sb_secret_"))return v;
  if(v&&Deno.env.get(v))return Deno.env.get(v)!;
 }catch{}
 const legacy=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!legacy)throw Error("Missing server-only key");
 return legacy;
}
function headers(origin:string|null):HeadersInit{
 return {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Vary":"Origin",
 ...(origin&&ORIGINS.has(origin)?{
 "Access-Control-Allow-Origin":origin,
 "Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info",
 "Access-Control-Allow-Methods":"POST,OPTIONS"}:{})};
}
function response(origin:string|null,status:number,data:unknown){
 return new Response(JSON.stringify(data),{status,headers:headers(origin)});
}
const driveId=(v:unknown):v is string=>typeof v==="string"&&/^[A-Za-z0-9_-]{10,180}$/.test(v);
const uuid=(v:unknown):v is string=>typeof v==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const validSize=(v:unknown):v is number=>typeof v==="number"&&Number.isInteger(v)&&v>0&&v<=LIMIT;
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("Origin");
 if(origin&&!ORIGINS.has(origin))return response(null,403,{error:"Origin not allowed"});
 if(req.method==="OPTIONS")return new Response("ok",{headers:headers(origin)});
 if(req.method!=="POST")return response(origin,405,{error:"POST only"});
 const bearer=req.headers.get("Authorization")||"";
 if(!/^Bearer\s+\S+$/i.test(bearer))return response(origin,401,{error:"Authentication required"});
 let input:Record<string,unknown>;
 try{
  const raw=await req.text();
  if(raw.length>4000) return response(origin,413,{error:"Payload too large"});
  const value=JSON.parse(raw);
  if(!value||Array.isArray(value)||typeof value!=="object"||typeof value.action!=="string")
   return response(origin,400,{error:"Invalid payload"});
  input=value;
 }catch{return response(origin,400,{error:"Invalid JSON"})}
 try{
  const service=createClient(BASE,secretKey(),{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:userError}=await service.auth.getUser(bearer.replace(/^Bearer\s+/i,""));
  if(userError||!user)return response(origin,401,{error:"Session expired or invalid"});
  const {data:roles,error:roleError}=await service.rpc("aura_portal_access_v1",{p_user_id:user.id});
  if(roleError||!roles)return response(origin,503,{error:"Identity service unavailable"});
  const admin=!user.is_anonymous&&!!user.email_confirmed_at&&roles.admin===true;
  const {data:passwordBound,error:passwordBoundError}=
    roles.student===true&&user.is_anonymous!==true&&!admin
    ?await service.rpc("aura_student_password_bound_v6",{p_auth_uid:user.id})
    :{data:false,error:null};
  const student=roles.student===true&&
    (user.is_anonymous===true||(!passwordBoundError&&passwordBound===true));

  if(input.action==="admin_upload_ticket"){
   if(!admin)return response(origin,403,{error:"Verified Admin required"});
   const mime=input.mime,size=input.size,fileId=input.file_id;
   if(!driveId(fileId)||typeof mime!=="string"||!EXT[mime]||!validSize(size))
    return response(origin,400,{error:"Unsupported file format or file size (max 6 MiB)"});
   const {data:inventory,error:inventoryError}=await service.rpc("aura_legacy_content_admin_list_v1",{p_admin_uid:user.id});
   if(inventoryError||!Array.isArray(inventory?.items))
    return response(origin,503,{error:"Publishing inventory unavailable"});
   const item=inventory.items.find((x:{drive_file_id:string})=>x.drive_file_id===fileId);
   if(!item||item.visibility!=="PUBLISHED_STAGING"||!uuid(item.id))
    return response(origin,403,{error:"Publish the approved item before uploading the file"});
   const path=item.id+"/"+crypto.randomUUID()+"."+EXT[mime];
   const {data:ticket,error:e}=await service.storage.from(BUCKET).createSignedUploadUrl(path);
   if(e||!ticket?.signedUrl)return response(origin,503,{error:"Cannot issue upload ticket"});
   return response(origin,200,{staging_only:true,asset_v2:true,path,
    signed_upload_url:ticket.signedUrl,max_bytes:LIMIT});
  }
  if(input.action==="admin_attach_asset"){
   if(!admin)return response(origin,403,{error:"Verified Admin required"});
   const {file_id,path,mime,size}=input;
   if(!driveId(file_id)||typeof path!=="string"||path.length>130||
    typeof mime!=="string"||!EXT[mime]||!validSize(size))
    return response(origin,400,{error:"Invalid asset confirmation"});
   const {data,error:e}=await service.rpc("aura_legacy_content_attach_asset_v2",{
    p_admin_uid:user.id,p_drive_file_id:file_id,p_asset_path:path,p_mime:mime,p_bytes:size});
   if(e||!data?.asset_ready)return response(origin,409,{error:"Uploaded file not verified or item withdrawn"});
   return response(origin,200,{...data,asset_v2:true,staging_only:true});
  }
  if(input.action==="student_open_asset"){
   if(!student)return response(origin,403,{error:"Paired Student required"});
   if(!uuid(input.resource_id))return response(origin,400,{error:"Invalid resource"});
   const {data:record,error:e}=await service.rpc("aura_legacy_content_student_asset_v2",{
    p_student_uid:user.id,p_resource_id:input.resource_id});
   if(e||!record?.path)return response(origin,403,{error:"Resource unavailable or device revoked"});
   const {data:link,error:linkError}=await service.storage.from(BUCKET).createSignedUrl(record.path,180);
   if(linkError||!link?.signedUrl)return response(origin,503,{error:"Cannot open private asset"});
   return response(origin,200,{staging_only:true,asset_v2:true,url:link.signedUrl,expires_in:180});
  }
  return response(origin,400,{error:"Unsupported action"});
 }catch{
  console.error("AURA private asset gateway failed");
  return response(origin,500,{error:"Private document store unavailable"});
 }
});