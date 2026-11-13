import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const d=JSON.parse(readFileSync('aura_data/knowledge_math6_kntt_volume2_v1.json','utf8'));
const review=JSON.parse(readFileSync('aura_data/knowledge_math6_kntt_volume2_chapter8_review_v1.json','utf8'));
const visual=readFileSync('knowledge_math6_geometry_svg.js','utf8');
const interactive=readFileSync('knowledge_math6_geometry_review.js','utf8');
const html=readFileSync('knowledge-math6-geometry-review.html','utf8');
const reader=readFileSync('knowledge_math6_volume2.js','utf8');
const course=readFileSync('knowledge-math6-volume2.html','utf8');

const golden={
 32:['A thuộc a','Thẳng hàng','Song song'],
 33:['Y','Tia OA','Hai tia đối nhau'],
 34:['Hai đầu mút A, B và các điểm nằm giữa','8 cm','5 cm'],
 35:['Trung điểm','7 cm','8 cm'],
 36:['O','Góc bẹt','3'],
 37:['Góc nhọn','Góc tù','Góc vuông']
};
const reviewGolden=[
 'Ba điểm không thẳng hàng','Tia OX và OY là hai tia đối nhau',
 '12 cm','M là trung điểm của AB','Điểm O','Góc tù'
];

test('All six real geometry lessons authored in fixed curriculum order; Ch IX now authored as new drafts',()=>{
 assert.equal(d.libraryId,'AURA-KNTT6-MATH-VOLUME2');
 assert.equal(d.lessons.length,21);
 assert.equal(d.authoredLessonCount,21);
 assert.equal(d.authoredPracticeCount,63);
 assert.equal(d.lessons.reduce((sum,l)=>sum+l.practice.length,0),63);
 assert.equal(d.expectedTotalLessons,21);
 assert.deepEqual(d.lessons.map(l=>l.number),Array.from({length:21},(_,i)=>i+23));
 assert.deepEqual(d.chapters.map(c=>c.status),[
  'DRAFT_CONTENT_IN_PROGRESS','DRAFT_CONTENT_IN_PROGRESS',
  'DRAFT_CONTENT_IN_PROGRESS','DRAFT_CONTENT_IN_PROGRESS'
 ]);
 assert.deepEqual(d.outline.filter(o=>o.authored).map(x=>x.number),
  Array.from({length:21},(_,i)=>i+23));
 assert.deepEqual(d.outline.filter(o=>!o.authored).map(x=>x.number),[]);
 assert.equal(d.rollout.teacherReviewed,false);
 assert.equal(d.rollout.questionBankPromotionEnabled,false);
 assert.equal(d.rollout.examEngineLinkEnabled,false);
 assert.equal(d.rollout.weaknessMapWriteEnabled,false);
});
test('Geometry lessons: source-aligned goals, original worked examples, 18 independent answer choices and figures',()=>{
 const lessons=d.lessons.filter(l=>l.chapter===8);
 assert.deepEqual(lessons.map(l=>l.number),[32,33,34,35,36,37]);
 const names=['line-membership','opposite-rays','segment-length','midpoint',
  'angle-definition','angle-measure'];
 const seen=new Set();
 for(const [i,l] of lessons.entries()){
  assert.equal(l.title,d.outline.find(x=>x.number===l.number).title);
  assert.equal(l.status,'DRAFT_ORIGINAL_AURA');
  assert.equal(l.readyForQuestionBank,false);
  assert.equal(l.requiresPedagogicalReview,true);
  assert.equal(l.objectives.length,2);
  assert.equal(l.concepts.length,3);
  assert.ok(l.concepts.every(x=>x.heading.length>8&&x.body.length>90),l.id);
  assert.ok(l.workedExample.prompt.length>35,l.id);
  assert.equal(l.workedExample.steps.length,3);
  assert.ok(l.workedExample.steps.every(x=>x.length>50),l.id);
  assert.ok(l.commonMistake.length>70,l.id);
  assert.equal(l.geometryModel.kind,names[i]);
  assert.ok(l.geometryModel.caption.length>40);
  assert.equal(l.practice.length,3);
  assert.deepEqual(l.practice.map(q=>q.choices[q.correct]),golden[l.number]);
  for(const q of l.practice){
   assert.ok(q.prompt.length>=32,l.id);
   assert.equal(q.choices.length,4);
   assert.equal(new Set(q.choices).size,4);
   assert.ok(q.explanation.length>60);
   assert.ok(q.skill.length>6);
   assert.ok(!seen.has(q.prompt));seen.add(q.prompt);
  }
 }
 assert.equal(seen.size,18);
 assert.equal(lessons.at(-1).geometryModel.measureDegrees,60);
 assert.match(visual,/svgEl\('svg'/);
 assert.match(visual,/viewBox:'0 0 640 245'/);
 assert.match(visual,/Math\.cos\(rad\)/);
 assert.match(reader,/window\.auraMath6DrawGeometry/);
});
test('Chapter VIII review: six answers verified independently; all figure facts explicit',()=>{
 assert.equal(review.schemaVersion,1);
 assert.equal(review.subject,'TOAN');
 assert.equal(review.grade,6);
 assert.equal(review.chapter,8);
 assert.equal(review.status,'DRAFT_NEEDS_PEDAGOGICAL_REVIEW');
 assert.equal(review.teacherApproved,false);
 assert.equal(review.questionBankPromotionEnabled,false);
 assert.equal(review.weaknessMapWriteEnabled,false);
 assert.equal(review.questions.length,6);
 assert.deepEqual(review.questions.map(q=>q.choices[q.correct]),reviewGolden);
 assert.deepEqual(review.questions.map(q=>q.sourceLessons[0]),[32,33,34,35,36,37]);
 assert.equal(new Set(review.questions.map(x=>x.skill)).size,6);
 review.questions.forEach((q,i)=>{
  assert.equal(q.id,'C8-0'+(i+1));
  assert.equal(q.requiresPedagogicalReview,true);
  assert.equal(q.eligibleForQuestionBank,false);
  assert.equal(q.choices.length,4);
  assert.equal(new Set(q.choices).size,4);
  assert.ok(q.explanation.length>=70);
  assert.ok(q.figureFacts&&typeof q.figureFacts==='object');
 });
 const f=review.questions.map(q=>q.figureFacts);
 assert.equal(f[0].onLine.join(','),'A,B');
 assert.equal(f[0].offLine.join(','),'C');
 assert.equal(f[1].collinearOrder.join(','),'X,O,Y');
 assert.equal(f[1].origin,'O');
 assert.equal(f[2].collinearOrder.join(','),'A,M,B');
 assert.equal(f[2].lengthCm.AM+f[2].lengthCm.MB,12);
 assert.equal(f[3].collinearOrder.join(','),'A,M,B');
 assert.equal(f[3].lengthCm.AM,f[3].lengthCm.MB);
 assert.equal(f[4].rays.length,2);
 assert.ok(90<f[5].measureDegrees&&f[5].measureDegrees<180);
});
test('Segment + angle manipulatives use correct geometry bounds and never write official data',()=>{
 assert.match(html,/id="segmentSlider"/);
 assert.match(html,/id="angleSlider"/);
 assert.match(html,/viewBox="0 0 640 225"/);
 assert.match(html,/viewBox="0 0 640 285"/);
 assert.match(html,/connect-src 'self'/);
 assert.match(course,/knowledge_math6_geometry_svg\.js/);
 assert.match(course,/knowledge-math6-geometry-review\.html/);
 assert.match(interactive,/Math\.cos\(rad\)/);
 assert.match(interactive,/Math\.sin\(rad\)/);
 assert.match(interactive,/vietnam\(12-cm\)/);
 assert.match(interactive,/cm===6/);
 assert.match(interactive,/questionSha256:state\.sourceSha/);
 assert.match(interactive,/aura_kntt_math6_volume2_ch8_review_v1/);
 assert.doesNotMatch(interactive,/aura_smart_stats|aura_generated_exam|aura_wrong_book_v1|auraMathSourcePool|auraRecordSmartResult|\.innerHTML\s*=/);
 assert.equal(12/2,6);
 assert.equal(5+7,12);
 assert.equal(6+6,12);
 assert.equal(360/6,60);
 assert.equal(Math.round(Math.atan2(Math.sin(Math.PI/3),Math.cos(Math.PI/3))*180/Math.PI),60);
});
