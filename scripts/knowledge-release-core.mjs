/* AURA STUDY — hash-bound and signed Knowledge Library releases.
 * This code never elevates drafts; releases require a protected, independent review.
 */
import {createHash,createPrivateKey,createPublicKey,sign,verify} from 'node:crypto';
export const LIBRARY_ID='AURA-KNTT6-MATH-VOLUME1';
export const GATE_KIND='aura_knowledge_approved_release_v1';
export const RELEASES_DIR='aura_data/approved_knowledge/releases';
const sha=value=>createHash('sha256').update(value).digest('hex');
const clean=(value,max=4000)=>typeof value==='string'?value.trim().slice(0,max):'';
const fail=message=>{throw Error('AURA_APPROVAL_GATE: '+message)};

export function eligibleCandidates(lessons,reviews){
 if(lessons?.libraryId!==LIBRARY_ID||lessons?.schemaVersion!==2||
  reviews?.parentLibraryId!==LIBRARY_ID||reviews?.schemaVersion!==1)fail('wrong source library');
 if(lessons.rollout?.questionBankPromotionEnabled!==false||
   lessons.rollout?.teacherReviewed!==false||
   reviews.questionBankPromotionEnabled!==false||
   reviews.weaknessMapWriteEnabled!==false||
   reviews.teacherApproved!==false)fail('source promotion gates modified');
 if(lessons.lessons?.length!==22||reviews.chapters?.length!==5)fail('incomplete 22-lesson source');
 const seen=new Set(),items=[];
 function add(q,{itemId,chapter,lessonNumber,kind}){
  if(!/^KNTT6-MATH-V1-\d{2}-P[1-3]$/.test(itemId)&&!/^C[1-5]-0[1-6]$/.test(itemId))
   fail('unexpected item id '+itemId);
  if(seen.has(itemId))fail('duplicate item '+itemId);
  if(typeof q.prompt!=='string'||q.prompt.trim().length<8||
    !Array.isArray(q.choices)||q.choices.length!==4||
    q.choices.some(x=>typeof x!=='string'||!x.trim())||
    new Set(q.choices).size!==4||
    !Number.isInteger(q.correct)||q.correct<0||q.correct>3||
    typeof q.explanation!=='string'||q.explanation.trim().length<20||
    typeof q.skill!=='string'||!q.skill.trim())fail('invalid exercise '+itemId);
  const item={id:itemId,chapter,lessonNumber,kind,stem:clean(q.prompt),
    options:q.choices.map(x=>clean(x,1000)),answer:'ABCD'[q.correct],
    explanation:clean(q.explanation,2500),skill:clean(q.skill,90),
    subject:'TOAN',grade:6,series:'KNTT',volume:1};
  item.itemSha256=sha(JSON.stringify(item));
  seen.add(itemId);items.push(item);
 }
 for(let n=1;n<=22;n++){
  const l=lessons.lessons[n-1];
  if(l?.id!==('KNTT6-MATH-V1-'+String(n).padStart(2,'0'))||
    l.number!==n||l.status!=='DRAFT_ORIGINAL_AURA'||l.readyForQuestionBank!==false||
    l.requiresPedagogicalReview!==true||l.practice?.length!==3)fail('unreviewed lesson source '+n);
  for(let i=0;i<3;i++)add(l.practice[i],{
   itemId:l.id+'-P'+(i+1),chapter:l.chapter,lessonNumber:n,kind:'LESSON_PRACTICE'
  });
 }
 const covered=new Set();
 for(let n=1;n<=5;n++){
  const c=reviews.chapters[n-1];
  if(c?.number!==n||c.questions?.length!==6)fail('bad review chapter '+n);
  for(const q of c.questions){
   if(!q.id.startsWith('C'+n+'-')||q.eligibleForQuestionBank!==false||
    q.requiresPedagogicalReview!==true||!q.sourceLessons?.length)fail('review question gate '+q.id);
   const primary=q.sourceLessons[0];
   if(!Number.isInteger(primary)||primary<1||primary>22)fail('invalid source lesson');
   q.sourceLessons.forEach(k=>covered.add(k));
   add(q,{itemId:q.id,chapter:n,lessonNumber:primary,kind:'CHAPTER_REVIEW'});
  }
 }
 if(items.length!==96||covered.size!==22)fail('candidate count or coverage mismatch');
 return items;
}
export function contentSnapshot(lessonBytes,reviewBytes){
 const lessons=JSON.parse(lessonBytes.toString('utf8'));
 const reviews=JSON.parse(reviewBytes.toString('utf8'));
 const items=eligibleCandidates(lessons,reviews);
 return {schemaVersion:1,kind:'aura_math6_kntt_v2_release_candidate_snapshot',
  libraryId:LIBRARY_ID,sourceSha256:{
   lessonData:sha(lessonBytes.toString('utf8')),
   chapterData:sha(reviewBytes.toString('utf8'))
  },itemCount:96,candidates:items};
}
export function validateApprovalPolicy(policy,snapshot){
 if(policy?.schemaVersion!==1||policy?.libraryId!==LIBRARY_ID)fail('wrong approval policy');
 const p=policy.batchReview;
 if(p?.status!=='APPROVED_BY_QUALIFIED_REVIEWER'||
   clean(p.evidenceReference,350).length<12||
   clean(p.educatorName,100).length<3||
   p.reviewedSourceSha256?.lessonData!==snapshot.sourceSha256.lessonData||
   p.reviewedSourceSha256?.chapterData!==snapshot.sourceSha256.chapterData)
   fail('qualified teacher attestation missing or source revision changed');
 if(!Array.isArray(policy.exclusions))fail('missing exclusions');
 const byId=new Set(snapshot.candidates.map(x=>x.id)),ids=new Set();
 for(const x of policy.exclusions){
  if(!x||!byId.has(x.id)||ids.has(x.id)||clean(x.reason,500).length<15)
   fail('exclusion invalid or has no reason');
  ids.add(x.id);
 }
 return ids;
}
export function createReleasePayload(snapshot,policy,approval,{version,issuedAt,runId}){
 if(!/^v[1-9]\d*\.\d+\.\d+$/.test(version))fail('invalid semantic version');
 if(!/^\d{4}-\d\d-\d\dT/.test(issuedAt)||!Number.isFinite(Date.parse(issuedAt)))
  fail('invalid release timestamp');
 const excluded=validateApprovalPolicy(policy,snapshot);
 if(approval?.environment!=='aura-learning-approval'||approval?.decision!=='approved'||
   !approval?.reviewerLogin||approval?.runId!==runId||
   approval?.reviewerLogin===approval?.initiatorLogin)fail('no independent protected environment approval');
 const items=snapshot.candidates.filter(q=>!excluded.has(q.id));
 if(!items.length)fail('all questions excluded');
 return {
  schemaVersion:1,kind:GATE_KIND,libraryId:LIBRARY_ID,version,issuedAt,
  sourceSha256:snapshot.sourceSha256,
  evidenceReference:clean(policy.batchReview.evidenceReference,350),
  approvedBy:{educatorName:clean(policy.batchReview.educatorName,100),
   githubReviewerLogin:clean(approval.reviewerLogin,100),
   workflowRunId:clean(runId,64)},
  summary:{approved:items.length,excluded:excluded.size,totalCandidates:snapshot.candidates.length},
  promotion:{practiceGenerator:true,weaknessMapOnGradedAttemptOnly:true,
   examEngineOfficial:false,questionBankOfficial:false},
  items:items.map(q=>({...q,releaseVersion:version}))
 };
}
function ecPubKey(key){
 if(key.asymmetricKeyType!=='ec'||key.asymmetricKeyDetails?.namedCurve!=='prime256v1')
  fail('only ECDSA P-256 accepted');
 return key;
}
export function signRelease(payload,privatePem,trust){
 if(!privatePem||!trust?.publicKeys?.length)fail('protected key or pinned public trust absent');
 let privateKey;
 try{privateKey=createPrivateKey(privatePem)}catch{fail('invalid protected private key')}
 const publicKey=ecPubKey(createPublicKey(privateKey));
 const spki=publicKey.export({type:'spki',format:'der'});
 const kid=sha(spki).slice(0,24),b64=spki.toString('base64');
 const matched=trust.publicKeys.find(x=>x.kid===kid&&x.spkiBase64===b64);
 if(!matched||trust.activeKeyId!==kid)fail('protected key does not match pinned public trust');
 const signature=sign('sha256',Buffer.from(JSON.stringify(payload),'utf8'),
  {key:privateKey,dsaEncoding:'ieee-p1363'});
 return {schemaVersion:1,alg:'ECDSA_P256_SHA256',kid,
  payload,signatureBase64:signature.toString('base64')};
}
export function verifySignedRelease(release,trust){
 if(release?.schemaVersion!==1||release?.alg!=='ECDSA_P256_SHA256'||
  release.kid!==trust?.activeKeyId)return false;
 const k=trust.publicKeys?.find(x=>x.kid===release.kid);
 if(!k||!k.spkiBase64)return false;
 try{
  const pub=ecPubKey(createPublicKey({key:Buffer.from(k.spkiBase64,'base64'),
   type:'spki',format:'der'}));
  return verify('sha256',Buffer.from(JSON.stringify(release.payload),'utf8'),
   {key:pub,dsaEncoding:'ieee-p1363'},Buffer.from(release.signatureBase64,'base64'));
 }catch{return false}
}
export function toPublishedPool(release){
 if(release?.payload?.kind!==GATE_KIND||release.payload?.promotion?.practiceGenerator!==true)return [];
 return release.payload.items.map(q=>({
  id:q.id,stem:q.stem,options:q.options,answer:q.answer,
  skill:q.skill,source:'AURA KNTT Toán 6 · học liệu được duyệt',
  contentVersion:q.releaseVersion,approvedLearning:true,
  itemSha256:q.itemSha256,explanation:q.explanation,
  subject:'TOAN',chapter:q.chapter,lessonNumber:q.lessonNumber
 }));
}
