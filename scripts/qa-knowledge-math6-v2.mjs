#!/usr/bin/env node
/* AURA STUDY machine pedagogy preflight — NOT a teacher sign-off.
 * Independent, manually curated answer keys for 22 lessons and 5 chapter sets.
 * Emits JSON report only; does not alter lessons, bank, grades or progress.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
const lessonsPath='aura_data/knowledge_math6_kntt_volume1_v2.json';
const reviewsPath='aura_data/knowledge_math6_kntt_v2_chapter_reviews.json';
const lessonBytes=fs.readFileSync(lessonsPath),reviewBytes=fs.readFileSync(reviewsPath);
const lessons=JSON.parse(lessonBytes),reviews=JSON.parse(reviewBytes);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const errors=[],warnings=[],checks=[];
const lessonGolden=[
[1,1,2],[2,0,2],[0,1,2],[2,3,0],[0,2,2],[2,0,2],[1,0,1],
[1,1,1],[1,2,0],[2,1,3],[1,2,1],[2,2,1],[0,2,2],[2,2,2],
[0,1,2],[0,1,1],[0,0,1],[1,2,2],[2,2,2],[2,1,2],[2,2,2],[2,3,2]
];
const chapterGolden=[
[1,2,2,0,0,2],[1,0,2,0,1,2],[1,2,1,2,0,1],[2,1,1,2,2,1],[2,2,2,2,3,0]
];
function check(condition,id,message){
 if(condition)checks.push(id);else errors.push({id,message});
}
function inspectQuestion(q,key,id){
 check(q.correct===key,id+':answer-key','Answer key differs from independently prepared cross-check.');
 check(Array.isArray(q.choices)&&q.choices.length===4&&new Set(q.choices).size===4,
  id+':choices','Expected four distinct choices.');
 check(typeof q.explanation==='string'&&q.explanation.length>=20,
  id+':explanation','Missing explanatory feedback.');
 check(typeof q.skill==='string'&&q.skill.length>2,id+':skill','No targeted weakness skill.');
}
check(lessons.lessons.length===22,'lessons:count','Need all 22 lessons.');
check(reviews.chapters.length===5,'chapters:count','Need five chapter review sets.');
let covered=new Set();
let n=0;
for(const [i,l] of lessons.lessons.entries()){
 check(l.number===i+1,'lesson:'+l.number+':position','Wrong curriculum position.');
 check(l.status==='DRAFT_ORIGINAL_AURA'&&l.readyForQuestionBank===false&&l.requiresPedagogicalReview===true,
  'lesson:'+l.number+':gate','Lesson must remain blocked from central Question Bank.');
 check(l.concepts?.length>=2&&l.workedExample?.steps?.length>=2,
  'lesson:'+l.number+':pedagogy','Missing meaningful theory or worked steps.');
 if(l.practice?.length!==3)errors.push({id:'lesson:'+l.number,message:'Need 3 original practice items.'});
 for(const [j,q] of (l.practice||[]).entries()){
  inspectQuestion(q,lessonGolden[i]?.[j],'lesson:'+l.number+':q'+(j+1));n++;
 }
}
check(n===66,'questions:count','Need 66 original lesson exercises.');
let m=0;
for(const [i,c] of reviews.chapters.entries()){
 check(c.number===i+1,'chapter:'+c.number+':position','Chapter order differs.');
 check(c.questions?.length===6,'chapter:'+c.number+':six','Each chapter needs 6 items.');
 for(const [j,q] of (c.questions||[]).entries()){
  inspectQuestion(q,chapterGolden[i]?.[j],q.id);m++;
  check(q.requiresPedagogicalReview===true&&q.eligibleForQuestionBank===false,
   q.id+':gate','Chapter question auto-promotion must remain disabled.');
  for(const number of q.sourceLessons||[])covered.add(number);
 }
}
check(m===30,'chapter:questions','Need all 30 new chapter items.');
check(covered.size===22&&[...covered].every(i=>i>=1&&i<=22),
 'chapter:lesson-coverage','Review items must link back to all 22 study lessons.');
check(lessons.rollout?.teacherReviewed===false&&lessons.rollout?.questionBankPromotionEnabled===false,
 'library:publish-gate','Teacher gate should remain closed.');
check(reviews.teacherApproved===false&&reviews.questionBankPromotionEnabled===false&&reviews.weaknessMapWriteEnabled===false,
 'reviews:publish-gate','Chapter review is not approved for central generator or weakness map.');
const report={
 schemaVersion:1,kind:'aura_math6_v2_machine_quality_preflight',
 sourceSha256:{lessons:sha(lessonBytes),chapterReviews:sha(reviewBytes)},
 scope:{lessonCount:lessons.lessons.length,lessonQuestionCount:n,
  chapterCount:reviews.chapters.length,chapterQuestionCount:m,
  linkedLessons:covered.size,visualActivities:5},
 automatedChecks:{passed:checks.length,failed:errors.length},
 checks:{method:'Static structural and manually curated independent answer-index cross-check; no official textbook or teacher signature',errors,warnings},
 pedagogicalCertification:{
  status:'PENDING_HUMAN_PEDAGOGICAL_QA',
  teacherReviewed:false,officialPublisherEditionVerified:false,
  formulaProofForEveryWording:false,
  risks:['Need qualified educator to verify pedagogy, wording, scope and age suitability.',
   'Not a substitute for all original exercises, assessment design or teacher approved marking rubric.']
 },
 promotion:{eligibleForQuestionBank:0,eligibleForPracticeGenerator:0,
  eligibleForWeaknessMap:0,serverApprovalRequired:true,activationAllowed:false}
};
const output=process.argv.find(x=>x.startsWith('--output='))?.split('=').slice(1).join('=');
if(output)fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(errors.length)process.exitCode=1;
