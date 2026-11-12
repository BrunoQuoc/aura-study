import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(path,'utf8');
const data=JSON.parse(read('aura_data/knowledge_math6_kntt_volume1_v2.json'));
const html=read('knowledge-math6-v2.html');
const js=read('knowledge_math6_v2.js');
const legacy=read('lesson_maps_ui.js');
const student=read('student-direct.html');

test('KNTT Math6 volume 1: 5 verified chapters, all 22 numbered lessons, 66 authored MCQs',()=>{
 assert.equal(data.schemaVersion,2);
 assert.equal(data.libraryId,'AURA-KNTT6-MATH-VOLUME1');
 assert.equal(data.volume,1);assert.equal(data.subject,'TOAN');
 assert.equal(data.chapters.length,5);
 assert.deepEqual(data.chapters.map(x=>x.range),[[1,7],[8,12],[13,17],[18,20],[21,22]]);
 assert.equal(data.lessons.length,22);
 assert.deepEqual(data.lessons.map(x=>x.number),Array.from({length:22},(_,i)=>i+1));
 assert.equal(data.lessons.reduce((n,l)=>n+l.practice.length,0),66);
 assert.deepEqual(data.chapters.map(x=>data.lessons.filter(l=>l.chapter===x.number).length),[7,5,5,3,2]);
 assert.equal(new Set(data.lessons.map(l=>l.id)).size,22);
 assert.equal(new Set(data.lessons.flatMap(l=>l.practice.map(p=>l.id+':'+p.skill+':'+p.prompt))).size,66);
});
test('Every lesson has substantive original objectives, concept teaching, worked solution and explanations',()=>{
 for(const l of data.lessons){
  assert.ok(l.title.length>4,l.id);
  assert.equal(l.status,'DRAFT_ORIGINAL_AURA');
  assert.equal(l.readyForQuestionBank,false);
  assert.equal(l.requiresPedagogicalReview,true);
  assert.ok(l.objectives.length>=2);
  assert.ok(l.concepts.length>=2);
  assert.ok(l.concepts.every(x=>x.heading.length>=4&&x.body.length>=30));
  assert.ok(l.workedExample.prompt.length>=10);
  assert.ok(l.workedExample.steps.length>=2);
  assert.ok(l.workedExample.steps.every(s=>s.length>=10));
  assert.ok(l.workedExample.conclusion.length>=2);
  assert.ok(l.commonMistake.length>10);
  assert.equal(l.practice.length,3);
  for(const q of l.practice){
   assert.ok(q.prompt.length>=8,q.prompt);
   assert.equal(q.choices.length,4,q.prompt);
   assert.equal(new Set(q.choices).size,4,q.prompt);
   assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4,q.prompt);
   assert.ok(q.explanation.length>=10,q.prompt);
   assert.ok(q.skill.length>=3,q.prompt);
  }
 }
});
test('Source provenance and copyright-safe rollout are explicit and fail-closed',()=>{
 assert.equal(data.source.basis,'PUBLIC_TOC_ALIGNMENT_ONLY');
 assert.equal(data.source.verifiedFullText,false);
 assert.equal(data.source.verifiedPublisherEdition,false);
 assert.equal(data.rollout.status,'DRAFT_PREVIEW');
 assert.equal(data.rollout.teacherReviewed,false);
 assert.equal(data.rollout.questionBankPromotionEnabled,false);
 assert.equal(data.rollout.examEngineLinkEnabled,false);
 assert.match(data.rights,/Independently authored/);
 assert.equal(data.expectedLessonCount,22);
 assert.equal(data.expectedPracticeCount,66);
});
test('Student existing Lesson Maps remain, Math6 V2 is an additional optional route',()=>{
 assert.match(legacy,/if\(id==='TOAN'\)/);
 assert.match(legacy,/knowledge-math6-v2\.html/);
 assert.match(legacy,/function lessonOriginal/);
 assert.match(legacy,/function lessonPractice/);
 assert.match(student,/lesson_maps_ui\.js\?v=kntt6v2-/);
 assert.match(student,/lesson_maps\.css\?v=kntt6v2-/);
 assert.match(html,/knowledge_math6_v2\.js\?v=/);
 assert.match(html,/knowledge_math6_v2\.css\?v=/);
});
test('Preview reads only scoped progress, never central scores, grader or question bank',()=>{
 assert.match(js,/aura_kntt_math6_v2_progress_v1/);
 assert.doesNotMatch(js,/aura_wrong_book_v1|aura_lesson_state|aura_lesson_practice_|aura_inbox_queue_v1/);
 assert.doesNotMatch(js,/auraApproveInboxFile|submitExam|saveExam|auraSetMetadataOverride|AURA_EXAM/);
 assert.doesNotMatch(js,/\.innerHTML\s*=/);
 assert.match(html,/connect-src 'self'/);
 assert.match(html,/Không ảnh hưởng kết quả thi|không ảnh hưởng kết quả thi/i);
});
test('Sample verified mathematical answers and known pitfalls are represented correctly',()=>{
 const m=n=>data.lessons[n-1];
 assert.equal(m(2).practice[0].choices[m(2).practice[0].correct],'2 000');
 assert.equal(m(4).practice[0].choices[m(4).practice[0].correct],'219');
 assert.equal(m(5).practice[0].choices[m(5).practice[0].correct],'6 dư 1');
 assert.equal(m(6).practice[0].choices[m(6).practice[0].correct],'25');
 assert.equal(m(7).practice[0].choices[m(7).practice[0].correct],'20');
 assert.equal(m(9).practice[0].choices[m(9).practice[0].correct],'342');
 assert.equal(m(11).practice[0].choices[m(11).practice[0].correct],'6');
 assert.equal(m(12).practice[0].choices[m(12).practice[0].correct],'12');
 assert.equal(m(14).practice[0].choices[m(14).practice[0].correct],'−14');
 assert.equal(m(18).practice[1].choices[m(18).practice[1].correct],'36 cm');
 assert.equal(m(20).practice[1].choices[m(20).practice[1].correct],'30 cm²');
 assert.equal(m(22).practice[1].choices[m(22).practice[1].correct],'Tam giác đều');
});
