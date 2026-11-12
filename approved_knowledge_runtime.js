/* AURA STUDY: fail-closed, browser-side verifier for published learning releases.
 * This is a consumer only: it CAN NEVER mark a source as pedagogically approved.
 * P-256 signature + SHA-256 item checks; no localStorage "approval" switches.
 */
(function(root){
'use strict';
const TRUST='aura_data/approved_knowledge/trust.json';
const POINTER='aura_data/approved_knowledge/active.json';
const SOURCE_LESSONS='aura_data/knowledge_math6_kntt_volume1_v2.json';
const SOURCE_REVIEWS='aura_data/knowledge_math6_kntt_v2_chapter_reviews.json';
const RELEASE_PATH=/^aura_data\/approved_knowledge\/releases\/math6-v2-v[1-9]\d*\.\d+\.\d+\.json$/;
const HEX=/^[0-9a-f]{64}$/i;
const encoder=new TextEncoder();
let status={state:'LOADING',approvedCount:0,version:null,reason:'Validating protected learning release'};
root.AURA_APPROVED_KNOWLEDGE_MC=Object.freeze([]);
root.auraKnowledgeApprovalStatus=()=>({...status});
function fail(message){throw Error('AURA_LEARNING_TRUST: '+message)}
function bytesBase64(v){
 if(typeof v!=='string'||v.length>1500||!/^[a-zA-Z0-9+/]+={0,2}$/.test(v))fail('bad signature or key encoding');
 const raw=atob(v),out=new Uint8Array(raw.length);
 for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
 return out;
}
function hex(bytes){return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function digest(input){
 return hex(await crypto.subtle.digest('SHA-256',typeof input==='string'?encoder.encode(input):input));
}
async function fetchText(path){
 const r=await fetch(path,{cache:'no-store',credentials:'omit'});
 if(!r.ok)fail('missing approved release resource '+r.status);
 const body=await r.text();
 if(body.length>500000)fail('learning source or release file too large');
 return body;
}
function validatePayload(p,pointer){
 if(p?.schemaVersion!==1||p.kind!=='aura_knowledge_approved_release_v1'||
  p.libraryId!=='AURA-KNTT6-MATH-VOLUME1'||
  p.version!==pointer.version||!/^v[1-9]\d*\.\d+\.\d+$/.test(p.version)||
  !p.approvedBy?.githubReviewerLogin||!p.approvedBy?.educatorName||
  !p.approvedBy?.workflowRunId||
  !HEX.test(p.sourceSha256?.lessonData||'')||!HEX.test(p.sourceSha256?.chapterData||'')||
  p.promotion?.practiceGenerator!==true||
  p.promotion?.questionBankOfficial!==false||
  p.promotion?.examEngineOfficial!==false||
  p.promotion?.weaknessMapOnGradedAttemptOnly!==true||
  !Array.isArray(p.items)||p.items.length===0||p.items.length>96||
  p.summary?.approved!==p.items.length||
  p.summary?.totalCandidates!==96||
  p.summary?.approved+p.summary?.excluded!==96)
  fail('signed payload scope or promotion gate invalid');
}
async function verifyItems(items,version){
 const out=[],ids=new Set();
 for(const q of items){
  if(!/^KNTT6-MATH-V1-\d{2}-P[1-3]$/.test(q.id)&&!/^C[1-5]-0[1-6]$/.test(q.id))
   fail('unknown question id');
  if(ids.has(q.id)||q.releaseVersion!==version||!HEX.test(q.itemSha256||'')||
   q.subject!=='TOAN'||q.grade!==6||q.volume!==1||
   !Array.isArray(q.options)||q.options.length!==4||new Set(q.options).size!==4||
   !/^[ABCD]$/.test(q.answer||'')||typeof q.stem!=='string'||
   typeof q.skill!=='string'||!q.skill||typeof q.explanation!=='string'||
   !Number.isInteger(q.chapter)||q.chapter<1||q.chapter>5||
   !Number.isInteger(q.lessonNumber)||q.lessonNumber<1||q.lessonNumber>22)
   fail('invalid or duplicate published item');
  const {itemSha256,releaseVersion,...content}=q;
  const expected=await digest(JSON.stringify(content));
  if(expected!==itemSha256.toLowerCase())fail('tampered approved question');
  ids.add(q.id);
  out.push(Object.freeze({id:q.id,stem:q.stem,options:[...q.options],
   answer:q.answer,skill:q.skill,source:'AURA KNTT Toán 6 · học liệu được duyệt',
   approvedLearning:true,contentVersion:q.releaseVersion,itemSha256:q.itemSha256,
   explanation:q.explanation,chapter:q.chapter,lessonNumber:q.lessonNumber}));
 }
 return Object.freeze(out);
}
async function load(){
 try{
  if(!globalThis.crypto?.subtle)fail('WebCrypto not available; signed contents disabled');
  const pointer=JSON.parse(await fetchText(POINTER));
  if(pointer?.schemaVersion!==1||pointer.kind!=='aura_knowledge_release_pointer_v1')
   fail('invalid release pointer');
  if(pointer.status!=='SIGNED_ACTIVE'){
   status={state:'NO_APPROVED_RELEASE',approvedCount:0,version:null,
    reason:'Awaiting qualified educator approval and server-protected signing'};
   return [];
  }
  if(!RELEASE_PATH.test(pointer.signedReleasePath||'')||!HEX.test(pointer.releaseSha256||''))
   fail('release pointer path or SHA invalid');
  const trust=JSON.parse(await fetchText(TRUST));
  if(trust?.schemaVersion!==1||typeof trust.activeKeyId!=='string'||
   !Array.isArray(trust.publicKeys)||trust.publicKeys.length===0)
   fail('trusted public signing key not configured');
  const body=await fetchText(pointer.signedReleasePath);
  if((await digest(body))!==pointer.releaseSha256.toLowerCase())fail('release SHA mismatch');
  const signed=JSON.parse(body);
  if(signed?.schemaVersion!==1||signed.alg!=='ECDSA_P256_SHA256'||
   signed.kid!==trust.activeKeyId)fail('untrusted release signature metadata');
  const trusted=trust.publicKeys.find(x=>x.kid===signed.kid);
  if(!trusted?.spkiBase64)fail('unknown signer');
  const publicDer=bytesBase64(trusted.spkiBase64);
  if((await digest(publicDer)).slice(0,24)!==signed.kid)fail('pinned key fingerprint mismatch');
  const key=await crypto.subtle.importKey('spki',publicDer,
   {name:'ECDSA',namedCurve:'P-256'},false,['verify']);
  const valid=await crypto.subtle.verify(
   {name:'ECDSA',hash:{name:'SHA-256'}},key,
   bytesBase64(signed.signatureBase64),
   encoder.encode(JSON.stringify(signed.payload))
  );
  if(!valid)fail('signature verification failed');
  validatePayload(signed.payload,pointer);
  // A teacher signature applies to an EXACT curriculum revision, not to future
  // edits. Any source change invalidates the active promotion automatically.
  const [sourceLessons,sourceReviews]=await Promise.all([
   fetchText(SOURCE_LESSONS),fetchText(SOURCE_REVIEWS)
  ]);
  if((await digest(sourceLessons))!==signed.payload.sourceSha256.lessonData.toLowerCase()||
     (await digest(sourceReviews))!==signed.payload.sourceSha256.chapterData.toLowerCase())
   fail('source revision changed since educator approval');
  const pool=await verifyItems(signed.payload.items,signed.payload.version);
  root.AURA_APPROVED_KNOWLEDGE_MC=pool;
  status={state:'SIGNED_ACTIVE',approvedCount:pool.length,version:signed.payload.version,
   reason:'Signed educator-attested release loaded; allowed for local practice only'};
  return pool;
 }catch(error){
  root.AURA_APPROVED_KNOWLEDGE_MC=Object.freeze([]);
  status={state:'BLOCKED',approvedCount:0,version:null,
   reason:String(error?.message||error).slice(0,240)};
  return [];
 }
}
root.auraApprovedKnowledgeReady=load();
})(typeof window!=='undefined'?window:globalThis);
