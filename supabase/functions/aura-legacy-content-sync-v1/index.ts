// AURA STUDY - Legacy Admin => Student shared-resource gateway.
// Supplements the original 2026 interfaces. Staging only; never approves pedagogy or exams.
import { createClient } from "npm:@supabase/supabase-js@2.102.0";
const URL=Deno.env.get("SUPABASE_URL")!;
const ORIGINS=new Set(["https://brunoquoc.github.io","http://localhost:4173","http://127.0.0.1:4173"]);
function secretKey():string{
 try{
  const v=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default;
  if(typeof v==="string"&&v.startsWith("sb_secret_"))return v;
  if(v&&Deno.env.get(v))return Deno.env.get(v)!;
 }catch{}
 const legacy=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!legacy)throw Error("Missing Supabase secret");
 return legacy;
}
function headers(origin:string|null){
 return {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Vary":"Origin",
 ...(origin&&ORIGINS.has(origin)?{
 "Access-Control-Allow-Origin":origin,
 "Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info",
 "Access-Control-Allow-Methods":"POST,OPTIONS"}:{})};
}
function reply(origin:string|null,status:number,data:unknown){
 return new Response(JSON.stringify(data),{status,headers:headers(origin)});
}
function isValidObject(input:unknown):input is Record<string,unknown>{
 return !!input&&typeof input==="object"&&!Array.isArray(input);
}
function isDriveId(s:unknown):s is string{
 return typeof s==="string"&&/^[A-Za-z0-9_-]{10,180}$/.test(s);
}
// Exam and test uploads are manually approved. SGK does not use this endpoint.
function needsExamReview(title:unknown,docType:unknown):boolean{
 if(docType==="exam")return true;
 if(docType!=="practice")return false;
 const v=String(title??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .replace(/đ/g,"d").replace(/Đ/g,"D").toLowerCase();
 return /\bde[\s._-]*(thi|kiem[\s._-]*tra|kt|giua[\s._-]*ky|cuoi[\s._-]*ky)\b/.test(v)
  || /\bbai[\s._-]*kiem[\s._-]*tra\b/.test(v);
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("Origin");
 if(origin&&!ORIGINS.has(origin))return reply(null,403,{error:"Origin not allowed"});
 if(req.method==="OPTIONS")return new Response("ok",{headers:headers(origin)});
 if(req.method!=="POST")return reply(origin,405,{error:"POST only"});
 const bearer=req.headers.get("Authorization")||"";
 if(!/^Bearer\s+\S+$/i.test(bearer))return reply(origin,401,{error:"Authenticated session required"});
 let input:Record<string,unknown>;
 try{
  const raw=await req.text();
  if(raw.length>4000)return reply(origin,413,{error:"Request too large"});
  const obj=JSON.parse(raw);
  if(!isValidObject(obj)||typeof obj.action!=="string")throw Error("Invalid payload");
  input=obj;
 }catch{return reply(origin,400,{error:"Invalid JSON"})}
 try{
  const service=createClient(URL,secretKey(),{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error}=await service.auth.getUser(bearer.replace(/^Bearer\s+/i,""));
  if(error||!user)return reply(origin,401,{error:"Session expired or invalid"});
  const {data:roles,error:roleError}=await service.rpc("aura_portal_access_v1",{p_user_id:user.id});
  if(roleError||!roles)return reply(origin,503,{error:"Identity service unavailable"});
  const admin=!user.is_anonymous&&!!user.email_confirmed_at&&roles.admin===true;
  const student=user.is_anonymous===true&&roles.student===true;
  // Official publisher SGK metadata is always pulled from server; NO Admin approval gate.
  // The separate admin_publish action remains for manually reviewed test/exam sets.
  if(input.action==="sgk_auto_catalog"){
   if(!admin&&!student)return reply(origin,403,{error:"Active Admin or paired Student required"});
   const {data,error:e}=await service.rpc("aura_sgk_auto_catalog_v1",{p_actor_uid:user.id});
   if(e||!data?.sources||data.review_required!==false)
    return reply(origin,503,{error:"Verified SGK catalog unavailable"});
   return reply(origin,200,{...data,staging_only:true,official_exam_enabled:false});
  }
  if(input.action==="admin_list"){
   if(!admin)return reply(origin,403,{error:"Verified ADMIN required"});
   const {data,error:e}=await service.rpc("aura_legacy_content_admin_list_v1",{p_admin_uid:user.id});
   if(e||data?.error)return reply(origin,409,{error:"Admin publishing inventory unavailable"});
   return reply(origin,200,{...data,staging_only:true});
  }
  if(input.action==="admin_publish"){
   if(!admin)return reply(origin,403,{error:"Verified ADMIN required"});
   const {file_id,title,subject,doc_type,period=""}=input;
   if(!isDriveId(file_id)||typeof title!=="string"||title.trim().length<2||title.trim().length>180
    ||!["TOAN","NGUVAN","TIENGANH","KHTN","LSDL","GDCD","TINHOC","CONGNGHE","KHAC"].includes(String(subject))
    ||!needsExamReview(title,doc_type)
    ||!["","GK1","CK1","GK2","CK2"].includes(String(period)))
    return reply(origin,400,{error:"Invalid or non-student resource. Answer keys are not publishable."});
   const {data,error:e}=await service.rpc("aura_legacy_content_admin_publish_v1",{
    p_admin_uid:user.id,p_drive_file_id:file_id,p_title:title.trim(),
    p_subject:subject,p_doc_type:doc_type,p_period:period});
   if(e)return reply(origin,409,{error:"Could not publish resource to this Admin household"});
   return reply(origin,200,{published:data,staging_only:true,official_exam_enabled:false});
  }
  if(input.action==="admin_withdraw"){
   if(!admin)return reply(origin,403,{error:"Verified ADMIN required"});
   if(!isDriveId(input.file_id))return reply(origin,400,{error:"Invalid resource ID"});
   const {data,error:e}=await service.rpc("aura_legacy_content_admin_withdraw_v1",
    {p_admin_uid:user.id,p_drive_file_id:input.file_id});
   if(e)return reply(origin,409,{error:"Published resource not found or already withdrawn"});
   return reply(origin,200,{withdrawn:data,staging_only:true});
  }
  if(input.action==="student_list"){
   if(!student)return reply(origin,403,{error:"Paired STUDENT device required"});
   const {data,error:e}=await service.rpc("aura_legacy_content_student_list_v1",{p_student_uid:user.id});
   if(e||!data)return reply(origin,403,{error:"Student pairing revoked or unavailable"});
   return reply(origin,200,{...data,staging_only:true,official_exam_enabled:false});
  }
  return reply(origin,400,{error:"Unsupported action"});
 }catch{
  console.error("AURA legacy sync gateway failed");
  return reply(origin,500,{error:"Shared library temporarily unavailable"});
 }
});
