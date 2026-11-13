import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const data=JSON.parse(readFileSync('aura_data/knowledge_math6_kntt_volume2_v1.json','utf8'));
const js=readFileSync('knowledge_math6_volume2.js','utf8');
const html=readFileSync('knowledge-math6-volume2.html','utf8');
const legacy=readFileSync('lesson_maps_ui.js','utf8');
const student=readFileSync('student-direct.html','utf8');

test('Volume 2: official TOC 4 chapters, lessons 23–43; 21 main lessons authored across VI–IX',()=>{
 assert.equal(data.schemaVersion,1);
 assert.equal(data.libraryId,'AURA-KNTT6-MATH-VOLUME2');
 assert.equal(data.subject,'TOAN');
 assert.equal(data.volume,2);
 assert.equal(data.chapters.length,4);
 assert.deepEqual(data.chapters.map(x=>[x.number,...x.range]),[
  [6,23,27],[7,28,31],[8,32,37],[9,38,43]
 ]);
 assert.equal(data.outline.length,21);
 assert.deepEqual(data.outline.map(x=>x.number),
  Array.from({length:21},(_,i)=>i+23));
 assert.equal(data.outline.filter(x=>x.authored).length,21);
 assert.deepEqual(data.lessons.map(x=>x.number),Array.from({length:21},(_,i)=>i+23));
 assert.ok(data.chapters.every(x=>x.status==='DRAFT_CONTENT_IN_PROGRESS'));
 assert.equal(data.authoredLessonCount,21);
 assert.equal(data.expectedTotalLessons,21);
 assert.equal(data.authoredPracticeCount,63);
 assert.equal(data.lessons.reduce((sum,l)=>sum+l.practice.length,0),63);
});
test('Chapter VI 5 lessons have original explanations, worked problems, 15 unique questions',()=>{
 const seen=new Set();
 for(const l of data.lessons.filter(l=>l.chapter===6)){
  assert.equal(l.chapter,6);
  assert.ok(l.objectives.length>=2);
  assert.ok(l.concepts.length>=2);
  assert.ok(l.concepts.every(x=>x.heading.length>5&&x.body.length>=50));
  assert.ok(l.workedExample.prompt.length>20);
  assert.ok(l.workedExample.steps.length>=3);
  assert.ok(l.workedExample.steps.every(x=>x.length>=25));
  assert.ok(l.workedExample.conclusion.length>15);
  assert.ok(l.commonMistake.length>35);
  assert.equal(l.status,'DRAFT_ORIGINAL_AURA');
  assert.equal(l.requiresPedagogicalReview,true);
  assert.equal(l.readyForQuestionBank,false);
  assert.equal(l.practice.length,3);
  for(const q of l.practice){
   assert.ok(q.prompt.length>=14,l.id);
   assert.equal(q.choices.length,4,l.id);
   assert.equal(new Set(q.choices).size,4,l.id);
   assert.ok(q.correct>=0&&q.correct<4);
   assert.ok(q.explanation.length>=45);
   assert.ok(q.skill.length>=4);
   assert.ok(!seen.has(q.prompt),'Duplicate question '+q.prompt);
   seen.add(q.prompt);
  }
 }
 assert.equal(seen.size,15);
});
test('Independent expected answer choices for all 15 original tasks',()=>{
 const keys={
  23:['(-5)/7','(-2)/3 và (-6)/9','(-3)/4'],
  24:['(-5)/6 < (-3)/4','13/5','(-1)/2; 0; 3/4'],
  25:['1/6','5/8','(-5)/6'],
  26:['(-2)/3','(-4)/3','0'],
  27:['27','32','45']
 };
 for(const l of data.lessons.filter(l=>l.chapter===6)){
  assert.deepEqual(l.practice.map(q=>q.choices[q.correct]),keys[l.number],
   'Mismatch in manual independent answer ledger for lesson '+l.number);
 }
});
test('No publisher pages copied, no source content promoted to official bank',()=>{
 assert.equal(data.source.verifiedFullText,false);
 assert.equal(data.source.teacherEditionConfirmed,false);
 assert.match(data.source.basis,/TOC_ALIGNMENT_ONLY/);
 assert.match(data.rights,/AURA-original/);
 assert.deepEqual(data.rollout,{
  status:'DRAFT_PREVIEW_PARTIAL',teacherReviewed:false,
  questionBankPromotionEnabled:false,examEngineLinkEnabled:false,
  weaknessMapWriteEnabled:false
 });
 assert.match(html,/Đã có nội dung bản nháp Bài 23–43/);
 assert.match(html,/knowledge_math6_volume2\.js/);
 assert.match(html,/connect-src 'self'/);
 assert.match(legacy,/href='knowledge-math6-volume2\.html'/);
 assert.match(legacy,/href='knowledge-math6-v2\.html'/);
 assert.match(student,/lesson_maps_ui\.js/);
 assert.match(js,/aura_kntt_math6_volume2_progress_v1/);
 assert.doesNotMatch(js,/aura_smart_stats|aura_wrong_book_v1|aura_generated_exam|AURA_MATH_EXAMS|\.innerHTML\s*=/);
});
test('Only authored chapters are selectable; Tập 1 reader and content stay isolated',()=>{
 assert.match(js,/const available=state\.data\.lessons\.some/);
 assert.match(js,/!available\);/);
 assert.match(js,/state\.selected===23/);
 assert.match(js,/state\.selected===43/);
 assert.match(js,/count!==63/);
 assert.match(js,/d\.lessons\.length!==21/);
});
