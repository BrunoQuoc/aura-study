import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {createHash,generateKeyPairSync} from 'node:crypto';
import {contentSnapshot,createReleasePayload,signRelease} from '../scripts/knowledge-release-core.mjs';

const root='http://127.0.0.1:8765';
const source=readFileSync('aura_data/knowledge_math6_kntt_volume1_v2.json');
const reviews=readFileSync('aura_data/knowledge_math6_kntt_v2_chapter_reviews.json');
const snapshot=contentSnapshot(source,reviews);
const sha=v=>createHash('sha256').update(v).digest('hex');
const {publicKey,privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1',
 publicKeyEncoding:{type:'spki',format:'der'},
 privateKeyEncoding:{type:'pkcs8',format:'pem'}});
const kid=sha(publicKey).slice(0,24);
const trust={schemaVersion:1,activeKeyId:kid,publicKeys:[{kid,spkiBase64:publicKey.toString('base64')}]};
const policy={schemaVersion:1,libraryId:'AURA-KNTT6-MATH-VOLUME1',
 batchReview:{status:'APPROVED_BY_QUALIFIED_REVIEWER',
 educatorName:'Synthetic Educator - CI Only',evidenceReference:'SYNTHETIC-EVIDENCE-NOT-PRODUCTION',
 reviewedSourceSha256:snapshot.sourceSha256},exclusions:[]};
const approval={environment:'aura-learning-approval',decision:'approved',
 reviewerLogin:'synthetic-reviewer',initiatorLogin:'synthetic-operator',runId:'12345'};
const payload=createReleasePayload(snapshot,policy,approval,
 {version:'v1.0.0',issuedAt:'2026-11-13T01:00:00Z',runId:'12345'});
const release=signRelease(payload,privateKey,trust);
const releasePath='aura_data/approved_knowledge/releases/math6-v2-v1.0.0.json';
const out='test-results/knowledge-approval-signed';
mkdirSync(out,{recursive:true});
function resource(published){
 if(published==='missing')return {
  pointer:{schemaVersion:1,kind:'aura_knowledge_release_pointer_v1',
   status:'NO_APPROVED_RELEASE',version:null,signedReleasePath:null,releaseSha256:null},
  trust,release
 };
 const altered=structuredClone(release);
 if(published==='tampered'){
  altered.payload.items[0].stem+=' FALSIFIED';
 }
 if(published==='itemhash'){
  altered.payload.items[0].stem+=' HACKED';
  // Re-sign payload with private key to test per-item content digest separately.
  const resigned=signRelease(altered.payload,privateKey,trust);
  return {
   pointer:pointerFor(resigned),trust,release:resigned
  };
 }
 return {pointer:pointerFor(altered),trust,release:altered};
}
function pointerFor(releaseData){
 const raw=JSON.stringify(releaseData,null,2)+'\n';
 return {schemaVersion:1,kind:'aura_knowledge_release_pointer_v1',
  status:'SIGNED_ACTIVE',version:'v1.0.0',signedReleasePath:releasePath,
  releaseSha256:sha(raw),approvedCount:96};
}
async function scenario(browser,name,mode,view){
 const ctx=await browser.newContext({viewport:view,hasTouch:name!=='desktop',
  isMobile:name==='phone',locale:'vi-VN'});
 const fixture=resource(mode),errors=[],external=[];
 const route=async r=>{
  const url=new URL(r.request().url());
  if(url.origin!==root){external.push(url.toString());await r.abort();return;}
  const p=url.pathname.slice(1);
  if(p==='aura_data/approved_knowledge/active.json'){
   await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixture.pointer)});return;
  }
  if(p==='aura_data/approved_knowledge/trust.json'){
   await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixture.trust)});return;
  }
  if(p===releasePath){
   await r.fulfill({status:200,contentType:'application/json',
    body:JSON.stringify(fixture.release,null,2)+'\n'});return;
  }
  if(mode==='sourcechanged'&&p==='aura_data/knowledge_math6_kntt_volume1_v2.json'){
   await r.fulfill({status:200,contentType:'application/json',
    body:source.toString('utf8')+'\n'});return;
  }
  await r.continue();
 };
 await ctx.route('**/*',route);
 const page=await ctx.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(root+'/tests/fixtures/approved-knowledge-sandbox.html',{waitUntil:'load'});
 const ready=await page.evaluate(async()=>{
  await window.auraApprovedKnowledgeReady;
  const state=window.auraKnowledgeApprovalStatus();
  const n=window.AURA_APPROVED_KNOWLEDGE_MC.length;
  const pool=auraMathSourcePool();
  return {state,approved:n,approvedSourcePool:pool.filter(q=>q.approvedLearning===true).length};
 });
 if(mode==='valid'){
  assert.equal(ready.state.state,'SIGNED_ACTIVE');
  assert.equal(ready.approved,96);
  assert.equal(ready.approvedSourcePool,96);
  const exercise=await page.evaluate(()=>{
   const pool=auraMathCandidatePool(auraRng('AURA-approved-test'),'',15);
   const q=pool.find(x=>x.approvedLearning===true);
   if(!q)throw Error('No signed approved item in smart pool');
   if(!q.skill||!q.itemSha256||!q.contentVersion)throw Error('Lost provenance/skill in generator');
   const wrong='ABCD'.split('').find(x=>x!==q.answer);
   localStorage.setItem('aura_generated_exam',JSON.stringify({
    id:'aura-synthetic-123',subject:'TOAN',engineVersion:'2.4.0',
    mc:[q],written:[]
   }));
   localStorage.setItem('aura_generated_draft',JSON.stringify({mc:[wrong],written:[]}));
   auraRecordSmartResult();
   const stats=JSON.parse(localStorage.getItem('aura_smart_stats')||'{}');
   return {itemId:q.id,skill:q.skill,release:q.contentVersion,hash:q.itemSha256,
    seen:stats.TOAN?.[q.skill]?.seen,wrong:stats.TOAN?.[q.skill]?.wrong};
  });
  assert.equal(exercise.seen,1);
  assert.equal(exercise.wrong,1);
  assert.equal(exercise.release,'v1.0.0');
  assert.equal(exercise.hash.length,64);
  assert.ok(exercise.itemId.startsWith('KNTT6')||exercise.itemId.startsWith('C'));
 }else if(mode==='missing'){
  assert.equal(ready.state.state,'NO_APPROVED_RELEASE');
  assert.equal(ready.approved,0);
  assert.equal(ready.approvedSourcePool,0);
 }else{
  assert.equal(ready.state.state,'BLOCKED');
  assert.equal(ready.approved,0);
  assert.equal(ready.approvedSourcePool,0);
 }
 assert.deepEqual(errors,[],'No JavaScript crashes: '+name+mode);
 assert.deepEqual(external,[],'No external traffic: '+name+mode);
 await page.screenshot({path:out+'/'+name+'-'+mode+'.png'});
 await ctx.close();
 console.log('PASS '+name+': '+mode+' signed validation, generator and weakness gates');
}
const browser=await chromium.launch({headless:true});
try{
 await scenario(browser,'ipad','valid',{width:820,height:1180});
 await scenario(browser,'phone','missing',{width:390,height:844});
 await scenario(browser,'desktop','tampered',{width:1366,height:900});
 await scenario(browser,'desktop','itemhash',{width:1366,height:900});
 await scenario(browser,'desktop','sourcechanged',{width:1366,height:900});
}finally{await browser.close();}
