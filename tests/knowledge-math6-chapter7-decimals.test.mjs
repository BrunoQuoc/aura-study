import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const course=JSON.parse(readFileSync('aura_data/knowledge_math6_kntt_volume2_v1.json','utf8'));
const review=JSON.parse(readFileSync('aura_data/knowledge_math6_kntt_volume2_chapter7_review_v1.json','utf8'));
const html=readFileSync('knowledge-math6-decimals-review.html','utf8');
const js=readFileSync('knowledge_math6_decimals.js','utf8');
const view=readFileSync('knowledge-math6-volume2.html','utf8');

const golden={
 28:['-0,37','5,08','-3,47 < -3,4'],
 29:['2,65','8,55','-5'],
 30:['12,7','8,77','100'],
 31:['20%','36','120 000 đồng']
};
const reviewGolden=['-0,35','-1,8 < -1,08','1,85','-1,2','6,85','10'];

test('Math6 Volume2 adds four original Decimal lessons 28-31 and 12 complete practice questions',()=>{
 assert.equal(course.chapters.length,4);
 assert.equal(course.lessons.length,15);
 assert.equal(course.lessons.reduce((n,l)=>n+l.practice.length,0),45);
 assert.equal(course.authoredLessonCount,15);
 assert.equal(course.authoredPracticeCount,45);
 assert.equal(course.outline.filter(o=>o.authored).length,15);
 assert.ok(course.chapters.slice(0,3).every(c=>c.status==='DRAFT_CONTENT_IN_PROGRESS'));
 assert.ok(course.chapters.slice(3).every(c=>c.status==='NOT_AUTHORED'));
 assert.deepEqual(course.lessons.map(l=>l.number),Array.from({length:15},(_,i)=>i+23));
 assert.equal(course.expectedTotalLessons,21);
 const seen=new Set();
 for(const l of course.lessons.filter(l=>l.chapter===7)){
  assert.deepEqual(l.objectives.length,2);
  assert.equal(l.concepts.length,3);
  assert.ok(l.concepts.every(x=>x.body.length>=65));
  assert.ok(l.workedExample.steps.length>=3);
  assert.ok(l.workedExample.steps.every(x=>x.length>=40));
  assert.ok(l.commonMistake.length>60);
  assert.equal(l.readyForQuestionBank,false);
  assert.equal(l.requiresPedagogicalReview,true);
  assert.equal(l.practice.length,3);
  assert.deepEqual(l.practice.map(q=>q.choices[q.correct]),golden[l.number],
   'Independent answer ledger mismatch at Bài '+l.number);
  for(const q of l.practice){
   assert.equal(q.choices.length,4);
   assert.equal(new Set(q.choices).size,4);
   assert.ok(q.explanation.length>=55);
   assert.ok(q.skill.length>=3);
   assert.ok(!seen.has(q.prompt));
   seen.add(q.prompt);
  }
 }
 assert.equal(seen.size,12);
});

test('Chapter VII review has six independent answers, 4-lesson skill coverage and closed gates',()=>{
 assert.equal(review.schemaVersion,1);
 assert.equal(review.subject,'TOAN');
 assert.equal(review.parentLibraryId,course.libraryId);
 assert.equal(review.chapter,7);
 assert.equal(review.teacherApproved,false);
 assert.equal(review.questionBankPromotionEnabled,false);
 assert.equal(review.weaknessMapWriteEnabled,false);
 assert.equal(review.status,'DRAFT_NEEDS_PEDAGOGICAL_REVIEW');
 assert.equal(review.questions.length,6);
 assert.deepEqual(review.questions.map(q=>q.choices[q.correct]),reviewGolden);
 assert.deepEqual([...new Set(review.questions.flatMap(q=>q.sourceLessons))].sort((a,b)=>a-b),[28,29,30,31]);
 assert.equal(new Set(review.questions.map(q=>q.id)).size,6);
 review.questions.forEach((q,i)=>{
  assert.equal(q.id,'C7-0'+(i+1));
  assert.equal(q.choices.length,4);
  assert.equal(new Set(q.choices).size,4);
  assert.ok(q.explanation.length>=45);
  assert.equal(q.requiresPedagogicalReview,true);
  assert.equal(q.eligibleForQuestionBank,false);
 });
});

test('Learning visuals and quizzes are local-only, revocable and separate from signed approval pipeline',()=>{
 assert.match(html,/knowledge_math6_decimals\.js/);
 assert.match(html,/id="roundSlider"/);
 assert.match(html,/id="percentSlider"/);
 assert.match(html,/connect-src 'self'/);
 assert.match(view,/knowledge-math6-decimals-review\.html/);
 assert.match(js,/Math\.floor\(v\+0\.5\)/);
 assert.match(js,/200\*p\/100/);
 assert.match(js,/questionSha256:state\.hash/);
 assert.match(js,/aura_kntt_math6_volume2_ch7_review_v1/);
 assert.match(js,/NOT_AN_APPROVAL|draft-only/);
 assert.doesNotMatch(js,/aura_smart_stats|aura_wrong_book_v1|aura_generated_exam|auraMathSourcePool|auraRecordSmartResult|\.innerHTML\s*=/);
 assert.equal(course.rollout.teacherReviewed,false);
 assert.equal(course.rollout.questionBankPromotionEnabled,false);
 assert.equal(course.rollout.examEngineLinkEnabled,false);
 assert.equal(course.rollout.weaknessMapWriteEnabled,false);
});

test('Independent arithmetic spot checks of decimals and percentages',()=>{
 assert.equal((54-27.5)/10,2.65);
 assert.equal((720+135)/100,8.55);
 assert.equal(45/-9,-5);
 assert.equal(240*0.15,36);
 assert.equal(150000*(1-0.2),120000);
 assert.equal(80*(12.5/100),10);
 assert.equal(Math.floor(3.4+0.5),3);
 assert.equal(Math.floor(3.5+0.5),4);
});
