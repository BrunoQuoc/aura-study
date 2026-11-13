import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const v2=JSON.parse(readFileSync('aura_data/knowledge_math6_kntt_volume2_v1.json'));
const v1=JSON.parse(readFileSync('aura_data/knowledge_math6_kntt_volume1_v2.json'));
const ch6=JSON.parse(readFileSync('aura_data/knowledge_math6_kntt_volume2_chapter6_review_v1.json'));
const year=JSON.parse(readFileSync('aura_data/math6_endyear_practice_v1.json'));
const chapter9=JSON.parse(readFileSync('aura_data/knowledge_math6_kntt_volume2_chapter9_review_v1.json'));
const html=readFileSync('knowledge-math6-volume2.html','utf8');
const yearJs=readFileSync('knowledge_math6_yearend.js','utf8');
const sixJs=readFileSync('knowledge_math6_extra_chapter_review.js','utf8');
test('Both volumes have 43 original main lesson drafts, four Tập2 chapters and no official promotion',()=>{
 assert.equal(v1.lessons.length,22);
 assert.equal(v2.lessons.length,21);
 assert.equal(v2.authoredLessonCount,21);
 assert.equal(v2.authoredPracticeCount,63);
 assert.equal(v2.lessons.at(-1).number,43);
 assert.equal(v2.rollout.teacherReviewed,false);
 assert.equal(v2.rollout.questionBankPromotionEnabled,false);
 assert.equal(v2.rollout.examEngineLinkEnabled,false);
 assert.equal(v2.rollout.weaknessMapWriteEnabled,false);
 assert.equal(chapter9.questions.length,6);
 assert.match(html,/knowledge-math6-statistics-review\.html/);
 assert.match(html,/knowledge-math6-fractions-review\.html/);
 assert.match(html,/knowledge-math6-yearend\.html/);
});
test('Source-derived ChVI independent answer ledger, fully-covered five lessons',()=>{
 const golden=['(-2)/3','(-7)/8 < (-3)/4','1/2','(-3)/2','24','30'];
 assert.equal(ch6.schemaVersion,1);
 assert.equal(ch6.chapter,6);
 assert.equal(ch6.parentLibraryId,v2.libraryId);
 assert.equal(ch6.teacherApproved,false);
 assert.equal(ch6.questionBankPromotionEnabled,false);
 assert.equal(ch6.weaknessMapWriteEnabled,false);
 assert.deepEqual(ch6.questions.map(q=>q.choices[q.correct]),golden);
 assert.deepEqual([...new Set(ch6.questions.flatMap(x=>x.sourceLessons))].sort((a,b)=>a-b),
  [23,24,25,26,27]);
 ch6.questions.forEach((q,i)=>{
  assert.equal(q.id,'C6-0'+(i+1));
  assert.equal(q.requiresPedagogicalReview,true);
  assert.equal(q.eligibleForQuestionBank,false);
  assert.equal(q.choices.length,4);
  assert.equal(new Set(q.choices).size,4);
  assert.ok(q.explanation.length>=55);
 });
});
test('Full-year independent 12-key answer ledger covers both volumes, six human-only essay rubrics',()=>{
 const keys=['25','Tổng chữ số 12 chia hết cho 3 nhưng không chia hết cho 9',
  '29','6','5','40 cm²','5/6','4','40','9 cm','Góc tù','30%'];
 assert.equal(year.schemaVersion,1);
 assert.equal(year.subject,'TOAN');
 assert.equal(year.grade,6);
 assert.equal(year.teacherApproved,false);
 assert.equal(year.questionBankPromotionEnabled,false);
 assert.equal(year.examEngineEnabled,false);
 assert.equal(year.weaknessMapWriteEnabled,false);
 assert.equal(year.officialAutoGradingEnabled,false);
 assert.equal(year.mc.length,12);
 assert.deepEqual(year.mc.map(x=>x.choices[x.correct]),keys);
 assert.deepEqual([...new Set(year.mc.map(x=>x.sourceRef.volume))].sort(),[1,2]);
 for(const q of year.mc){
  assert.equal(q.requiresPedagogicalReview,true);
  assert.equal(q.eligibleForQuestionBank,false);
  assert.equal(new Set(q.choices).size,4);
  assert.ok(q.explanation.length>=40);
 }
 assert.equal(year.written.length,6);
 for(const q of year.written){
  assert.equal(q.maxPoints,10);
  assert.equal(q.rubric.reduce((a,v)=>a+v.points,0),10);
  assert.equal(q.requiresHumanReview,true);
  assert.equal(q.autoGradeAllowed,false);
  assert.equal(q.readyForExamEngine,false);
  assert.equal(q.teacherReviewed,false);
  assert.ok(q.modelAnswer.steps.length>=2);
 }
 assert.match(yearJs,/q\.autoGradeAllowed!==false/);
 assert.match(yearJs,/aura_kntt_math6_yearend_preview_v1/);
 assert.match(sixJs,/aura_kntt_math6_volume2_ch/);
 assert.doesNotMatch(yearJs,/aura_smart_stats|aura_generated_exam|auraRecordSmartResult|\.innerHTML\s*=/);
});
test('Independent arithmetic checks on draft problems',()=>{
 assert.equal(4+7*3,25);
 assert.equal(8+4,12);
 assert.equal(12+5,17);
 assert.equal(2*(12+5),34);
 assert.equal(12*5,60);
 assert.equal(240000*0.15,36000);
 assert.equal(240000-36000,204000);
 assert.equal(9/20*100,45);
 assert.equal(20/50*100,40);
 assert.ok(Math.abs((2/3+1/6)-(5/6))<1e-12);
});
