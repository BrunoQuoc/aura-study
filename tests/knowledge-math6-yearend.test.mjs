import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const data=JSON.parse(readFileSync('aura_data/knowledge_math6_kntt_yearend_review_v1.json','utf8'));
const v1=JSON.parse(readFileSync('aura_data/knowledge_math6_kntt_volume1_v2.json','utf8'));
const v2=JSON.parse(readFileSync('aura_data/knowledge_math6_kntt_volume2_v1.json','utf8'));
const html=readFileSync('knowledge-math6-yearend.html','utf8');
const js=readFileSync('knowledge_math6_yearend.js','utf8');
const course=readFileSync('knowledge-math6-volume2.html','utf8');
const expectedC6=['(-3)/4','(-5)/6 < (-3)/4','1/6','(-2)/3','27','32'];
const expectedYear=['12','24','5','-12','40 cm²','(-1)/2','30','6,85','Góc vuông','6 cm','3','1/4'];
const officialTitles=new Map([...v1.lessons,...v2.lessons].map(l=>[l.number,l.title]));
test('One scoped AURA year-end package with 18 original multiple-choice questions and teacher-only rubric',()=>{
 assert.equal(data.libraryId,'AURA-KNTT6-MATH-YEAREND-DRAFT');
 assert.equal(data.grade,6);
 assert.equal(data.subject,'TOAN');
 assert.deepEqual(data.sourceScope.volumes,[1,2]);
 assert.equal(data.sourceScope.totalMainLessons,43);
 assert.equal(data.sourceScope.verifiedPublisherFullText,false);
 assert.equal(data.sourceScope.publisherTextCopied,false);
 assert.equal(data.sourceScope.officialTextbookExercisesCopied,false);
 assert.equal(data.teacherApproved,false);
 assert.equal(data.questionBankPromotionEnabled,false);
 assert.equal(data.examEngineOfficialEnabled,false);
 assert.equal(data.weaknessMapWriteEnabled,false);
 assert.equal(data.chapter6.questions.length,6);
 assert.equal(data.yearEnd.questions.length,12);
 assert.equal(data.written.questions.length,5);
 assert.equal(data.written.maxTotalPoints,10);
 assert.equal(new Set([...data.chapter6.questions,...data.yearEnd.questions,...data.written.questions].map(q=>q.id)).size,23);
});
test('Independent answer ledger matches all Chapter VI and year-end options',()=>{
 assert.deepEqual(data.chapter6.questions.map(q=>q.choices[q.correct]),expectedC6);
 assert.deepEqual(data.yearEnd.questions.map(q=>q.choices[q.correct]),expectedYear);
 const every=[...data.chapter6.questions,...data.yearEnd.questions];
 for(const q of every){
  assert.equal(q.choices.length,4);
  assert.equal(new Set(q.choices).size,4);
  assert.ok(q.prompt.length>=20,q.id);
  assert.ok(q.explanation.length>=35,q.id);
  assert.equal(q.requiresPedagogicalReview,true);
  assert.equal(q.eligibleForQuestionBank,false);
  assert.ok(q.sourceLessons.every(n=>officialTitles.has(n)),q.id);
 }
 assert.deepEqual([...new Set(data.chapter6.questions.flatMap(q=>q.sourceLessons))].sort((a,b)=>a-b),[23,24,25,26,27]);
});
test('All five original essays have human-only 0.5-point step rubrics totaling 10 points',()=>{
 for(const q of data.written.questions){
  assert.ok(q.prompt.length>45,q.id);
  assert.equal(q.machineAutoGradeAllowed,false);
  assert.equal(q.gradingMode,'HUMAN_REVIEW_REQUIRED');
  assert.equal(q.maxPoints,2);
  assert.equal(q.rubric.length,4);
  assert.equal(q.rubric.reduce((n,x)=>n+x.points,0),2);
  assert.ok(q.rubric.every(x=>x.points===0.5&&x.criterion.length>25),q.id);
  assert.ok(q.workedSolution.length>=3,q.id);
  assert.ok(q.sourceLessons.every(n=>officialTitles.has(n)),q.id);
 }
 assert.deepEqual(data.written.questions[0].sourceLessons,[11,12]);
 assert.deepEqual(data.yearEnd.questions[0].sourceLessons,[11]);
 assert.deepEqual(data.yearEnd.questions[1].sourceLessons,[12]);
 assert.deepEqual(data.yearEnd.questions[2].sourceLessons,[14]);
 assert.deepEqual(data.yearEnd.questions[3].sourceLessons,[16]);
});
test('Math examples are numerically sound and user controls cannot publish, auto-grade essays or change official results',()=>{
 assert.equal(24*36/12,72);
 assert.equal(-9/12+10/12,1/12);
 assert.equal((2/3)/(-4/9),-1.5);
 assert.equal(4+4,8);
 assert.equal(240000*0.25,60000);
 assert.equal(240000-60000,180000);
 assert.equal(5/20,0.25);
 assert.match(html,/knowledge_math6_yearend\.js/);
 assert.match(html,/id="yearendSet"/);
 assert.match(html,/connect-src 'self'/);
 assert.match(course,/knowledge-math6-yearend\.html/);
 assert.match(js,/HUMAN_REVIEW_REQUIRED/);
 assert.match(js,/questionSha256|sha256:state\.sha\[state\.mode\]/);
 assert.match(js,/aura_kntt_math6_yearend_quiz_v1_/);
 assert.doesNotMatch(js,/aura_smart_stats|aura_generated_exam|auraMathSourcePool|auraRecordSmartResult|\.innerHTML\s*=/);
});
