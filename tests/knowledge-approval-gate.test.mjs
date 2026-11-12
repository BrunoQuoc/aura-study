import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {generateKeyPairSync,createHash} from 'node:crypto';
import {
 contentSnapshot,validateApprovalPolicy,createReleasePayload,
 signRelease,verifySignedRelease,toPublishedPool,eligibleCandidates
} from '../scripts/knowledge-release-core.mjs';

const source=fs.readFileSync('aura_data/knowledge_math6_kntt_volume1_v2.json');
const reviews=fs.readFileSync('aura_data/knowledge_math6_kntt_v2_chapter_reviews.json');
const snapshot=contentSnapshot(source,reviews);
const digest=v=>createHash('sha256').update(v).digest('hex');
function acceptedPolicy(){
 return {schemaVersion:1,libraryId:snapshot.libraryId,batchReview:{
  status:'APPROVED_BY_QUALIFIED_REVIEWER',educatorName:'Synthetic Teacher For QA',
  evidenceReference:'EXAMPLE-QA-ONLY-this-is-not-a-real-approval',
  reviewedSourceSha256:{...snapshot.sourceSha256}},exclusions:[]};
}
function signed(){
 const {publicKey,privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1',
  publicKeyEncoding:{type:'spki',format:'der'},
  privateKeyEncoding:{type:'pkcs8',format:'pem'}});
 const kid=digest(publicKey).slice(0,24);
 const trust={schemaVersion:1,activeKeyId:kid,publicKeys:[{kid,spkiBase64:publicKey.toString('base64')}]};
 const approval={environment:'aura-learning-approval',decision:'approved',
  reviewerLogin:'independent-educator',initiatorLogin:'operator',runId:'40001'};
 const payload=createReleasePayload(snapshot,acceptedPolicy(),approval,
  {version:'v1.0.0',issuedAt:'2026-11-13T01:00:00Z',runId:'40001'});
 return {release:signRelease(payload,privateKey,trust),trust,privateKey,approval};
}
test('All 96 questions built automatically with SHA provenance; no answer reentry',()=>{
 assert.equal(snapshot.itemCount,96);
 assert.equal(snapshot.candidates.length,96);
 assert.equal(snapshot.candidates.filter(x=>x.kind==='LESSON_PRACTICE').length,66);
 assert.equal(snapshot.candidates.filter(x=>x.kind==='CHAPTER_REVIEW').length,30);
 assert.equal(new Set(snapshot.candidates.map(x=>x.id)).size,96);
 assert.ok(snapshot.candidates.every(x=>/^[a-f0-9]{64}$/.test(x.itemSha256)));
 assert.equal(snapshot.sourceSha256.lessonData,digest(source));
 assert.equal(snapshot.sourceSha256.chapterData,digest(reviews));
});
test('Initial policy is fail-closed and cannot publish based on machine QA alone',()=>{
 const pending=JSON.parse(fs.readFileSync('aura_data/knowledge_approval/math6_v2_policy.json'));
 assert.equal(pending.batchReview.status,'PENDING_QUALIFIED_REVIEW');
 assert.throws(()=>validateApprovalPolicy(pending,snapshot),/educator attestation/);
 const pointer=JSON.parse(fs.readFileSync('aura_data/approved_knowledge/active.json'));
 assert.equal(pointer.status,'NO_APPROVED_RELEASE');
 const trust=JSON.parse(fs.readFileSync('aura_data/approved_knowledge/trust.json'));
 assert.equal(trust.activeKeyId,null);
 assert.deepEqual(trust.publicKeys,[]);
});
test('Valid teacher evidence requires exact source file hashes; editing content revokes it',()=>{
 const wrong=acceptedPolicy();
 wrong.batchReview.reviewedSourceSha256.chapterData='b'.repeat(64);
 assert.throws(()=>validateApprovalPolicy(wrong,snapshot),/source revision changed/);
 const wrong2=acceptedPolicy();wrong2.batchReview.evidenceReference='none';
 assert.throws(()=>validateApprovalPolicy(wrong2,snapshot),/attestation/);
 const tampered=JSON.parse(source.toString());
 tampered.lessons[0].practice[0].choices[0]='TAMPERED OPTION';
 const next=contentSnapshot(Buffer.from(JSON.stringify(tampered)),reviews);
 assert.notEqual(next.sourceSha256.lessonData,snapshot.sourceSha256.lessonData);
 assert.throws(()=>validateApprovalPolicy(acceptedPolicy(),next),/source revision changed/);
});
test('No independent protected workflow approval = no payload',()=>{
 const p=acceptedPolicy(),a={environment:'aura-learning-approval',decision:'approved',
  reviewerLogin:'operator',initiatorLogin:'operator',runId:'40001'};
 assert.throws(()=>createReleasePayload(snapshot,p,a,
  {version:'v1.0.0',issuedAt:'2026-11-13T01:00:00Z',runId:'40001'}),/independent/);
 a.reviewerLogin='educator';
 a.runId='OTHER_RUN';
 assert.throws(()=>createReleasePayload(snapshot,p,a,
  {version:'v1.0.0',issuedAt:'2026-11-13T01:00:00Z',runId:'40001'}),/independent/);
});
test('Reviewer can exclude explicit exceptions once for entire batch, not re-enter answers',()=>{
 const {approval}=signed(),policy=acceptedPolicy();
 policy.exclusions=[{id:'C4-03',reason:'Review source shape definition before promotion'}];
 const p=createReleasePayload(snapshot,policy,approval,
  {version:'v2.0.0',issuedAt:'2026-11-13T01:00:00Z',runId:'40001'});
 assert.equal(p.items.length,95);
 assert.equal(p.summary.excluded,1);
 assert.equal(p.items.some(x=>x.id==='C4-03'),false);
 assert.equal(p.promotion.examEngineOfficial,false);
 assert.equal(p.promotion.questionBankOfficial,false);
});
test('Protected signed release cryptographically verifies; tamper or wrong key fails',()=>{
 const {release,trust,privateKey}=signed();
 assert.equal(verifySignedRelease(release,trust),true);
 assert.equal(toPublishedPool(release).length,96);
 assert.equal(toPublishedPool(release)[0].skill,snapshot.candidates[0].skill);
 const changed=structuredClone(release);
 changed.payload.items[0].stem+=' CORRUPT';
 assert.equal(verifySignedRelease(changed,trust),false);
 const wrong=structuredClone(trust);wrong.activeKeyId='bad';
 assert.equal(verifySignedRelease(release,wrong),false);
 assert.throws(()=>signRelease(release.payload,'',trust),/protected/);
 const newKey=generateKeyPairSync('ec',{namedCurve:'prime256v1',
  privateKeyEncoding:{type:'pkcs8',format:'pem'},
  publicKeyEncoding:{type:'spki',format:'pem'}});
 assert.throws(()=>signRelease(release.payload,newKey.privateKey,trust),/does not match/);
 assert.ok(privateKey.includes('BEGIN PRIVATE KEY'));
});
test('Invalid question duplicates, altered source flags, invalid exclusions block release',()=>{
 const l=JSON.parse(source.toString()),r=JSON.parse(reviews.toString());
 l.lessons[0].practice[0].choices[0]=l.lessons[0].practice[0].choices[1];
 assert.throws(()=>eligibleCandidates(l,r),/invalid exercise/);
 const l2=JSON.parse(source.toString());l2.rollout.teacherReviewed=true;
 assert.throws(()=>eligibleCandidates(l2,r),/source promotion gates/);
 const p=acceptedPolicy();p.exclusions=[{id:'fake-id',reason:'Not found in source questions'}];
 assert.throws(()=>validateApprovalPolicy(p,snapshot),/exclusion/);
});
