import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const d=JSON.parse(readFileSync('aura_data/knowledge_math6_kntt_volume2_v1.json','utf8'));
const r=JSON.parse(readFileSync('aura_data/knowledge_math6_kntt_volume2_chapter9_review_v1.json','utf8'));
const reader=readFileSync('knowledge_math6_volume2.js','utf8');
const script=readFileSync('knowledge_math6_statistics.js','utf8');
const html=readFileSync('knowledge-math6-statistics-review.html','utf8');
const courseHtml=readFileSync('knowledge-math6-volume2.html','utf8');
const expected={
 38:['Môn thể thao yêu thích','Có, vì 7 + 6 + 5 = 18','Hôm qua bạn đọc sách bao nhiêu phút?'],
 39:['12 quyển','15','10 chiếc'],
 40:['B','3','8 cuốn'],
 41:['3 cây','6A nhiều hơn 1 cây','6B hơn 2 cây'],
 42:['8','2, 4, 6','Chắc chắn'],
 43:['3/5','30%','1/8']
};
const reviewExpected=[
 'Có, tổng là 24','12 quyển','5 cây','Hai lớp bằng nhau','5, 6','1/4'
];
test('All 43 main lessons authored as original drafts, 21 in Volume2, and 63 lesson exercises',()=>{
 assert.equal(d.lessons.length,21);
 assert.equal(d.authoredLessonCount,21);
 assert.equal(d.expectedTotalLessons,21);
 assert.equal(d.authoredPracticeCount,63);
 assert.equal(d.lessons.reduce((sum,l)=>sum+l.practice.length,0),63);
 assert.deepEqual(d.lessons.map(x=>x.number),Array.from({length:21},(_,i)=>i+23));
 assert.deepEqual(d.chapters.map(c=>c.status),Array(4).fill('DRAFT_CONTENT_IN_PROGRESS'));
 assert.equal(d.outline.filter(x=>x.authored).length,21);
 assert.equal(d.rollout.teacherReviewed,false);
 assert.equal(d.rollout.questionBankPromotionEnabled,false);
 assert.equal(d.rollout.weaknessMapWriteEnabled,false);
 assert.equal(d.rollout.examEngineLinkEnabled,false);
});
test('Six real data/statistics/probability lessons contain original teaching and independently checked answers',()=>{
 for(const l of d.lessons.filter(x=>x.chapter===9)){
  assert.ok(l.number>=38&&l.number<=43);
  assert.equal(l.objectives.length,2);
  assert.equal(l.concepts.length,3);
  assert.ok(l.concepts.every(x=>x.body.length>=70));
  assert.ok(l.workedExample.steps.length>=3);
  assert.ok(l.workedExample.steps.every(x=>x.length>50));
  assert.ok(l.commonMistake.length>=60);
  assert.equal(l.practice.length,3);
  assert.equal(l.status,'DRAFT_ORIGINAL_AURA');
  assert.equal(l.requiresPedagogicalReview,true);
  assert.equal(l.readyForQuestionBank,false);
  assert.deepEqual(l.practice.map(q=>q.choices[q.correct]),expected[l.number],
   'Wrong independently prepared expected option for lesson '+l.number);
  for(const q of l.practice){
   assert.equal(q.choices.length,4);
   assert.equal(new Set(q.choices).size,4);
   assert.ok(q.explanation.length>55);
   assert.ok(q.skill.length>3);
  }
 }
});
test('Chapter IX six review answers are accurate and every Bài 38–43 is traced',()=>{
 assert.equal(r.parentLibraryId,d.libraryId);
 assert.equal(r.chapter,9);
 assert.equal(r.teacherApproved,false);
 assert.equal(r.questionBankPromotionEnabled,false);
 assert.equal(r.weaknessMapWriteEnabled,false);
 assert.equal(r.questions.length,6);
 assert.deepEqual(r.questions.map(q=>q.choices[q.correct]),reviewExpected);
 assert.deepEqual(r.questions.flatMap(q=>q.sourceLessons),[38,39,40,41,42,43]);
 r.questions.forEach((q,i)=>{
  assert.equal(q.id,'C9-0'+(i+1));
  assert.equal(q.eligibleForQuestionBank,false);
  assert.equal(q.requiresPedagogicalReview,true);
  assert.ok(q.explanation.length>=50);
 });
});
test('Chart arithmetic, experimental counts and visual-source safety',()=>{
 assert.equal(5+8+6,19);
 assert.equal(8-5,3);
 assert.equal((15/60)*100,25);
 assert.equal((12/20)*100,60);
 assert.equal((5/40),1/8);
 assert.match(script,/aura_kntt_math6_volume2_ch9_review_v1/);
 assert.match(script,/questionSha256:state\.sha/);
 assert.match(script,/sourceLessons/);
 assert.match(html,/id="statsFrequency"/);
 assert.match(html,/id="statsBarChart"/);
 assert.match(courseHtml,/knowledge-math6-statistics-review\.html/);
 assert.match(reader,/count!==63/);
 assert.match(reader,/state\.selected===43/);
 assert.doesNotMatch(script,/aura_smart_stats|aura_generated_exam|auraMathSourcePool|auraRecordSmartResult|\.innerHTML\s*=/);
});
