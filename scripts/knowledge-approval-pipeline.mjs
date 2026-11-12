#!/usr/bin/env node
/* AURA STUDY — operator-only learning approval release.
 * Status/candidate mode is automatic and never upgrades review status.
 * Publish mode runs ONLY after a protected GitHub Actions environment review.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {contentSnapshot,validateApprovalPolicy,createReleasePayload,
 signRelease,verifySignedRelease,RELEASES_DIR} from './knowledge-release-core.mjs';

const root=process.cwd();
const paths={
 lessons:'aura_data/knowledge_math6_kntt_volume1_v2.json',
 reviews:'aura_data/knowledge_math6_kntt_v2_chapter_reviews.json',
 policy:'aura_data/knowledge_approval/math6_v2_policy.json',
 trust:'aura_data/approved_knowledge/trust.json',
 pointer:'aura_data/approved_knowledge/active.json'
};
const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
const option=(args,key)=>{
 const value=args.find(x=>x.startsWith('--'+key+'='));
 return value?.slice(key.length+3)||'';
};
function checkPath(out){
 const abs=path.resolve(root,out);
 if(!abs.startsWith(path.resolve(root,'aura_data/approved_knowledge')+path.sep))throw Error('Unsafe release path');
 return abs;
}
function sourceSnapshot(){
 return contentSnapshot(fs.readFileSync(paths.lessons),fs.readFileSync(paths.reviews));
}
function status(){
 const s=sourceSnapshot(),p=readJson(paths.policy),ptr=readJson(paths.pointer);
 const excluded=Array.isArray(p.exclusions)?p.exclusions.length:0;
 const output={
  schemaVersion:1,kind:'aura_knowledge_approval_status_v1',
  libraryId:s.libraryId,sourceSha256:s.sourceSha256,
  candidateCount:s.itemCount,
  machineQA:'PASS_ONLY_IF_PRECHECK_RUNS',
  teacherStatus:p.batchReview?.status||'UNKNOWN',
  batchEvidencePresent:!!p.batchReview?.evidenceReference,
  exclusions:excluded,
  sourceHashesMatchAttestation:
   p.batchReview?.reviewedSourceSha256?.lessonData===s.sourceSha256.lessonData&&
   p.batchReview?.reviewedSourceSha256?.chapterData===s.sourceSha256.chapterData,
  signedReleaseStatus:ptr.status,
  approvedCount:ptr.status==='SIGNED_ACTIVE'?(ptr.approvedCount||0):0,
  approvalOperations:{
   perQuestionReentryRequired:false,
   routineAutomated:true,
   exceptionOnlyReview:excluded>0,
   missingRequiredAction:ptr.status==='SIGNED_ACTIVE'?'none':'Qualified teacher evidence, protected GitHub environment + P-256 signing secret'
  },
  items:s.candidates.map(q=>({id:q.id,itemSha256:q.itemSha256,
   chapter:q.chapter,lessonNumber:q.lessonNumber,kind:q.kind,skill:q.skill,
   status:p.exclusions?.some(x=>x.id===q.id)?'EXCEPTION_NEEDS_CORRECTION':'AWAITING_BATCH_APPROVAL'}))
 };
 return output;
}
async function githubJson(url,token){
 const response=await fetch(url,{headers:{
  Authorization:'Bearer '+token,Accept:'application/vnd.github+json',
  'X-GitHub-Api-Version':'2022-11-28','User-Agent':'AURA-STUDY-knowledge-approval-gate'}});
 if(!response.ok)throw Error('GitHub approval verification unavailable: HTTP '+response.status);
 return response.json();
}
async function attestedGitHubApproval(){
 const env=process.env;
 if(env.GITHUB_REPOSITORY!=='BrunoQuoc/aura-study'||
   env.GITHUB_EVENT_NAME!=='workflow_dispatch'||
   env.GITHUB_REF!=='refs/heads/main'||
   !/^\d+$/.test(env.GITHUB_RUN_ID||'')||
   !env.GITHUB_TOKEN)throw Error('Publish requires authorized main-branch GitHub workflow_dispatch');
 const api='https://api.github.com/repos/'+env.GITHUB_REPOSITORY;
 const name='aura-learning-approval';
 const settings=await githubJson(api+'/environments/'+name,env.GITHUB_TOKEN);
 const rules=settings.protection_rules||[];
 const requiredReviewers=rules.find(r=>r.type==='required_reviewers'&&Array.isArray(r.reviewers)&&r.reviewers.length>0);
 if(!requiredReviewers)throw Error('Protected environment lacks required reviewer rule; FAIL CLOSED');
 const approvals=await githubJson(api+'/actions/runs/'+env.GITHUB_RUN_ID+'/approvals',env.GITHUB_TOKEN);
 const matched=Array.isArray(approvals)?
  approvals.find(a=>String(a.state).toLowerCase()==='approved'&&
   a.user?.login&&a.user.login!==env.GITHUB_ACTOR):null;
 if(!matched)throw Error('Independent GitHub approval not found in this workflow run');
 const reviewers=new Set(requiredReviewers.reviewers.filter(r=>r.type==='User')
  .map(r=>r.reviewer?.login||r.login).filter(Boolean));
 if(reviewers.size&& !reviewers.has(matched.user.login))
  throw Error('Approver not among configured required reviewer users');
 return {environment:name,decision:'approved',reviewerLogin:matched.user.login,
  initiatorLogin:env.GITHUB_ACTOR,runId:env.GITHUB_RUN_ID};
}
async function publish(args){
 const version=option(args,'version');
 if(!/^v[1-9]\d*\.\d+\.\d+$/.test(version))throw Error('Version must look like v1.0.0');
 const trust=readJson(paths.trust),snapshot=sourceSnapshot(),policy=readJson(paths.policy);
 // Validate source integrity before asking for a private signing key.
 validateApprovalPolicy(policy,snapshot);
 const approval=await attestedGitHubApproval();
 const key=process.env.AURA_KNOWLEDGE_P256_PRIVATE_KEY_PEM||'';
 if(!key)throw Error('Protected environment signing secret not configured');
 const payload=createReleasePayload(snapshot,policy,approval,{
  version,issuedAt:new Date().toISOString(),runId:process.env.GITHUB_RUN_ID
 });
 const release=signRelease(payload,key,trust);
 if(!verifySignedRelease(release,trust))throw Error('Self-verification of signed release failed');
 const safeVersion=version.replace(/[^a-z0-9.-]/gi,'');
 const releasePath=RELEASES_DIR+'/math6-v2-'+safeVersion+'.json';
 const target=checkPath(releasePath);
 if(fs.existsSync(target))throw Error('Immutable approved release already exists: '+releasePath);
 const content=JSON.stringify(release,null,2)+'\n';
 const pointer={schemaVersion:1,kind:'aura_knowledge_release_pointer_v1',
  status:'SIGNED_ACTIVE',version,
  signedReleasePath:releasePath,releaseSha256:sha(content),approvedCount:payload.items.length,
  approvedByGitHubRun:approval.runId};
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,content,{flag:'wx',mode:0o644});
 fs.writeFileSync(paths.pointer,JSON.stringify(pointer,null,2)+'\n');
 console.log('AURA signed content release '+version+'; approved='+payload.items.length+
  ', exclusions='+payload.summary.excluded+'; SHA='+pointer.releaseSha256+
  '; no official Exam Engine promotion.');
}
const [mode,...args]=process.argv.slice(2);
try{
 if(mode==='status'){
  const s=status(),outfile=option(args,'output');
  if(outfile){
   const target=path.resolve(outfile);fs.mkdirSync(path.dirname(target),{recursive:true});
   fs.writeFileSync(target,JSON.stringify(s,null,2)+'\n');
  }
  console.log(JSON.stringify({
   candidateCount:s.candidateCount,excluded:s.exclusions,teacherStatus:s.teacherStatus,
   sourceHashesMatchAttestation:s.sourceHashesMatchAttestation,
   signedReleaseStatus:s.signedReleaseStatus,approvedCount:s.approvedCount,
   sourceSha256:s.sourceSha256
  },null,2));
 }else if(mode==='publish')await publish(args);
 else throw Error('Expected status or publish mode');
}catch(error){console.error('AURA knowledge release blocked: '+String(error.message||error));process.exitCode=1;}
