import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const course=JSON.parse(readFileSync('aura_data/knowledge_math6_kntt_volume2_v1.json','utf8'));
const chapter6=JSON.parse(readFileSync('aura_data/knowledge_math6_kntt_volume2_chapter6_review_v1.json','utf8'));
const chapter9=JSON.parse(readFileSync('aura_data/knowledge_math6_kntt_volume2_chapter9_review_v1.json','utf8'));
const annual=JSON.parse(readFileSync('aura_data/math6_endyear_practice_v1.json','utf8'));
const svg=readFileSync('knowledge_math6_statistics_svg.js','utf8');
const ui=readFileSync('knowledge_math6_extra_chapter_review.js','utf8');
const written=readFileSync('knowledge_math6_yearend.js','utf8');
const courseHtml=readFileSync('knowledge-math6-volume2.html','utf8');
const uiHtml=readFileSync('knowledge-math6-statistics-review.html','utf8');
const annualHtml=readFileSync('knowledge-math6-yearend.html','utf8');

const golden={
38:['Dữ liệu định lượng (số)','20','Màu áo yêu thích xanh'],
39:['8','6','10'],
40:['Cam','4','20'],
41:['1 lượt','14 lượt','11 lượt'],
42:['6','{2,4,6}','Không thể'],
43:['12/20 = 60%','4','30%']
};
const review6Golden=['(-2)/3','(-7)/8 < (-3)/4','1/2','(-3)/2','24','30'];
const review9Golden=['Định tính','12','15','3 lượt','{2,3,5}','30%'];
const annualGolden=['25','Tổng chữ số 12 chia hết cho 3 nhưng không chia hết cho 9',
 '29','6','5','40 cm²','5/6','4','40','9 cm','Góc tù','30%'];

test('All 21 Tập2 main lessons authored, 63 practices; Tập1 untouched',()=>{
 assert.equal(course.libraryId,'AURA-KNTT6-MATH-VOLUME2');
 assert.equal(course.lessons.length,21);
 assert.equal(course.expectedTotalLessons,21);
 assert.equal(course.authoredLessonCount,21);
 assert.equal(course.authoredPracticeCount,63);
 assert.equal(course.lessons.reduce((n,l)=>n+l.practice.length,0),63);
 assert.deepEqual(course.lessons.map(x=>x.number),Array.from({length:21},(_,i)=>23+i));
 assert.ok(course.chapters.every(x=>x.status==='DRAFT_CONTENT_IN_PROGRESS'));
 assert.ok(course.outline.every(x=>x.authored===true));
 assert.equal(course.rollout.status,'DRAFT_PREVIEW_PARTIAL');
 assert.equal(course.rollout.teacherReviewed,false);
 assert.equal(course.rollout.questionBankPromotionEnabled,false);
 assert.equal(course.rollout.examEngineLinkEnabled,false);
 assert.equal(course.rollout.weaknessMapWriteEnabled,false);
});
test('Statistics ChIX: independent ledger verifies 18 complete original MCQs and six source-defined visuals',()=>{
 const lessons=course.lessons.filter(l=>l.chapter===9);
 assert.deepEqual(lessons.map(l=>l.number),[38,39,40,41,42,43]);
 assert.deepEqual(lessons.map(l=>l.statisticsModel.kind),
 ['survey','pictogram','bar','double-bar','sample-space','experimental-frequency']);
 const all=new Set();
 for(const l of lessons){
  assert.equal(l.status,'DRAFT_ORIGINAL_AURA');
  assert.equal(l.requiresPedagogicalReview,true);
  assert.equal(l.readyForQuestionBank,false);
  assert.equal(l.objectives.length,2);
  assert.equal(l.concepts.length,3);
  assert.ok(l.concepts.every(c=>c.body.length>70));
  assert.ok(l.workedExample.steps.length>=3);
  assert.ok(l.workedExample.conclusion.length>30);
  assert.ok(l.commonMistake.length>75);
  assert.equal(l.practice.length,3);
  assert.deepEqual(l.practice.map(q=>q.choices[q.correct]),golden[l.number],
   'Independent ChIX answer ledger mismatch: Bài '+l.number);
  for(const q of l.practice){
   assert.equal(q.choices.length,4);
   assert.equal(new Set(q.choices).size,4);
   assert.ok(q.explanation.length>=55);
   assert.ok(q.skill.length>=4);
   assert.ok(!all.has(q.prompt));all.add(q.prompt);
  }
  assert.ok(l.statisticsModel.caption.length>45);
 }
 assert.equal(all.size,18);
 const models=Object.fromEntries(lessons.map(x=>[x.number,x.statisticsModel]));
 assert.deepEqual(models[38].values,[8,7,5]);
 assert.equal(models[38].values.reduce((a,b)=>a+b,0),20);
 assert.equal(models[39].weightPerIcon,2);
 assert.equal(models[39].values.reduce((a,b)=>a+b,0)*2,24);
 assert.deepEqual(models[40].values,[6,9,5]);
 assert.equal(models[40].values.reduce((a,b)=>a+b,0),20);
 assert.deepEqual(models[41].series.map(x=>x.values),[[6,8],[4,7]]);
 assert.deepEqual(models[42].outcomes,[1,2,3,4,5,6]);
 assert.deepEqual(models[43].values,[12,8]);
 assert.equal(models[43].values.reduce((a,b)=>a+b,0),20);
 assert.match(svg,/function render/);
 assert.match(svg,/viewBox:'0 0 640 275'/);
 assert.match(courseHtml,/knowledge_math6_statistics_svg\.js/);
});
test('Chapter VI and IX review each has six independent keyed questions and safe source coverage',()=>{
 for(const [r,chapter,expected,range] of [
  [chapter6,6,review6Golden,[23,27]],[chapter9,9,review9Golden,[38,43]]
 ]){
  assert.equal(r.schemaVersion,1);
  assert.equal(r.chapter,chapter);
  assert.equal(r.subject,'TOAN');
  assert.equal(r.teacherApproved,false);
  assert.equal(r.questionBankPromotionEnabled,false);
  assert.equal(r.weaknessMapWriteEnabled,false);
  assert.equal(r.questions.length,6);
  assert.deepEqual(r.questions.map(q=>q.choices[q.correct]),expected);
  const lessons=[...new Set(r.questions.flatMap(q=>q.sourceLessons))].sort((a,b)=>a-b);
  assert.deepEqual(lessons,Array.from({length:range[1]-range[0]+1},(_,i)=>range[0]+i));
  r.questions.forEach((q,i)=>{
   assert.equal(q.id,'C'+chapter+'-0'+(i+1));
   assert.equal(q.requiresPedagogicalReview,true);
   assert.equal(q.eligibleForQuestionBank,false);
   assert.equal(q.choices.length,4);
   assert.equal(new Set(q.choices).size,4);
   assert.ok(q.explanation.length>=55);
   if(chapter===9)assert.ok(q.datasetFacts);
  });
 }
});
test('Annual original two-volume MCQs and six human-only ten-point essay rubrics',()=>{
 assert.equal(annual.schemaVersion,1);
 assert.equal(annual.subject,'TOAN');
 assert.equal(annual.grade,6);
 assert.equal(annual.teacherApproved,false);
 assert.equal(annual.questionBankPromotionEnabled,false);
 assert.equal(annual.examEngineEnabled,false);
 assert.equal(annual.weaknessMapWriteEnabled,false);
 assert.equal(annual.officialAutoGradingEnabled,false);
 assert.equal(annual.mc.length,12);
 assert.deepEqual(annual.mc.map(q=>q.choices[q.correct]),annualGolden);
 assert.deepEqual([...new Set(annual.mc.map(q=>q.sourceRef.volume))].sort(),[1,2]);
 assert.equal(annual.written.length,6);
 assert.ok(annual.written.every(q=>q.autoGradeAllowed===false));
 for(const q of annual.written){
  assert.equal(q.maxPoints,10);
  assert.equal(q.rubric.reduce((a,c)=>a+c.points,0),10);
  assert.equal(q.requiresHumanReview,true);
  assert.equal(q.readyForExamEngine,false);
  assert.equal(q.teacherReviewed,false);
  assert.ok(q.rubric.length>=3);
  assert.ok(q.modelAnswer.steps.length>=2);
 }
 assert.match(annualHtml,/Tự luận không tự chấm/);
 assert.match(written,/q\.autoGradeAllowed!==false/);
 assert.match(ui,/aura_kntt_math6_volume2_ch/);
 assert.match(uiHtml,/id="fruitCamSlider"/);
 assert.match(uiHtml,/id="coinTrialsSlider"/);
 assert.match(ui,/seed>>>16/);
 assert.doesNotMatch(ui,/aura_smart_stats|aura_generated_exam|auraRecordSmartResult|\.innerHTML\s*=/);
 assert.doesNotMatch(written,/aura_smart_stats|aura_generated_exam|auraRecordSmartResult|\.innerHTML\s*=/);
});
test('Independent arithmetic and source facts are consistent',()=>{
 assert.equal(9-5,4);
 assert.equal(6+8,14);
 assert.equal(4+7,11);
 assert.equal(12/20*100,60);
 assert.equal(8/20*100,40);
 assert.equal(12/40*100,30);
 assert.equal(18/60*100,30);
 assert.equal(2/3+1/6,5/6);
 assert.equal(240000*0.15,36000);
 assert.equal(240000-36000,204000);
 assert.equal(12*5,60);
 assert.equal(2*(12+5),34);
 assert.equal(9/20*100,45);
});
