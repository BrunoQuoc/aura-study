import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=JSON.parse(fs.readFileSync('aura_data/knowledge_math6_kntt_volume1_v2.json'));
const reviews=JSON.parse(fs.readFileSync('aura_data/knowledge_math6_kntt_v2_chapter_reviews.json'));
const script=fs.readFileSync('knowledge_math6_chapters.js','utf8');
const html=fs.readFileSync('knowledge-math6-chapters.html','utf8');
const studyPage=fs.readFileSync('knowledge-math6-v2.html','utf8');
const css=fs.readFileSync('knowledge_math6_chapters.css','utf8');
test('Five original chapter reviews cover every lesson and carry 30 unique explained MCQs',()=>{
 assert.equal(reviews.schemaVersion,1);
 assert.equal(reviews.chapters.length,5);
 assert.equal(reviews.chapters.reduce((a,c)=>a+c.questions.length,0),30);
 const ids=new Set(),covered=new Set(),chapterLessonMap=[[1,7],[8,12],[13,17],[18,20],[21,22]];
 reviews.chapters.forEach((chapter,i)=>{
  assert.equal(chapter.number,i+1);
  assert.ok(chapter.learningGoal.length>=15);
  assert.equal(chapter.questions.length,6);
  chapter.questions.forEach(q=>{
   assert.ok(!ids.has(q.id));ids.add(q.id);
   assert.ok(q.id.startsWith('C'+(i+1)+'-'));
   assert.equal(q.choices.length,4);
   assert.equal(new Set(q.choices).size,4);
   assert.ok(q.correct>=0&&q.correct<=3);
   assert.ok(q.explanation.length>=20,q.id);
   assert.ok(q.skill.length>=3);
   assert.equal(q.requiresPedagogicalReview,true);
   assert.equal(q.eligibleForQuestionBank,false);
   assert.ok(q.sourceLessons.length>0);
   q.sourceLessons.forEach(n=>{
    assert.ok(n>=chapterLessonMap[i][0]&&n<=chapterLessonMap[i][1],q.id);
    covered.add(n);
   });
  });
 });
 assert.equal(ids.size,30);
 assert.deepEqual([...covered].sort((a,b)=>a-b),Array.from({length:22},(_,i)=>i+1));
 assert.equal(base.lessons.length,22);
 assert.equal(base.lessons.reduce((n,l)=>n+l.practice.length,0),66);
});
test('Five visual manipulative types exist and chapter review cannot mutate official weakness map',()=>{
 assert.match(script,/function numberLine/);
 assert.match(script,/function isSymmetric/);
 assert.match(script,/function polygon/);
 assert.match(script,/visual-grid/);
 assert.match(script,/Math\.floor\(v\.n\/v\.divisor\)/);
 assert.match(script,/v\.w\*v\.h/);
 assert.match(script,/v\.op==='\+'/);
 assert.match(script,/aura_kntt_math6_v2_chapter_review_v1/);
 assert.doesNotMatch(script,/aura_smart_stats|aura_wrong_book_v1|aura_generated_exam|aura_inbox_queue_v1/);
 assert.doesNotMatch(script,/fetch\(\s*['"]https?:\/\/|\.innerHTML\s*=/);
});
test('Dedicated preview and original study link, safe CSP, and non-publish flags',()=>{
 assert.match(studyPage,/knowledge-math6-chapters\.html/);
 assert.match(html,/knowledge_math6_chapters\.js/);
 assert.match(html,/connect-src 'self'/);
 assert.match(html,/Weakness Map chính thức/);
 assert.match(css,/\.visual-grid/);
 assert.equal(reviews.teacherApproved,false);
 assert.equal(reviews.questionBankPromotionEnabled,false);
 assert.equal(reviews.weaknessMapWriteEnabled,false);
 assert.equal(base.rollout.teacherReviewed,false);
 assert.equal(base.rollout.examEngineLinkEnabled,false);
});
test('Expanded 16 explanations have enough reasoning and every old quiz answer remains valid',()=>{
 for(const l of base.lessons){
  assert.equal(l.readyForQuestionBank,false);
  for(const q of l.practice){
   assert.ok(q.explanation.length>=20,'Bài '+l.number+': '+q.prompt);
   assert.equal(new Set(q.choices).size,4);
  }
 }
});
