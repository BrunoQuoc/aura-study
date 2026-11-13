import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const lessons=JSON.parse(readFileSync('aura_data/knowledge_math6_kntt_volume1_v2.json'));
const reviews=JSON.parse(readFileSync('aura_data/knowledge_math6_kntt_v2_chapter_reviews.json'));
const js=readFileSync('knowledge_review_packet.js','utf8');
const html=readFileSync('knowledge-review-packet.html','utf8');
const approval=readFileSync('knowledge-approval.html','utf8');
test('Batch review packet covers all 96 original candidates with answer + feedback',()=>{
 const lessonItems=lessons.lessons.flatMap(l=>l.practice.map((q,i)=>({
  id:l.id+'-P'+(i+1),chapter:l.chapter,q
 })));
 const chapterItems=reviews.chapters.flatMap(c=>c.questions.map(q=>({
  id:q.id,chapter:c.number,q
 })));
 const items=lessonItems.concat(chapterItems);
 assert.equal(lessons.lessons.length,22);
 assert.equal(reviews.chapters.length,5);
 assert.equal(lessonItems.length,66);
 assert.equal(chapterItems.length,30);
 assert.equal(items.length,96);
 assert.equal(new Set(items.map(x=>x.id)).size,96);
 for(const item of items){
  assert.equal(item.q.choices.length,4,item.id);
  assert.ok(item.q.correct>=0&&item.q.correct<4,item.id);
  assert.ok(item.q.choices[item.q.correct].length>0,item.id);
  assert.ok(item.q.explanation.length>=20,item.id);
  assert.ok(item.q.skill.length>=3,item.id);
 }
});
test('Review pack is a draft-only source trace and cannot approve or publish',()=>{
 assert.match(html,/Hồ sơ kiểm định sư phạm/);
 assert.match(html,/Đây là hồ sơ hỗ trợ giáo viên kiểm định, không phải quyết định phê duyệt/);
 assert.match(html,/knowledge_review_packet.js/);
 assert.match(approval,/knowledge-review-packet\.html/);
 assert.match(js,/reviewDecision:'NOT_AN_APPROVAL'/);
 assert.match(js,/reviewerAuthenticated:false/);
 assert.match(js,/educatorSignoffPresent:false/);
 assert.match(js,/sourceSha256:\{\.\.\.state\.sha\}/);
 assert.match(js,/reason\.trim\(\)\.length<15/);
 assert.doesNotMatch(js,/auraMathSourcePool|auraRecordSmartResult|aura_generated_exam|aura_smart_stats|aura_inbox_queue_v1|\.innerHTML\s*=/);
});
test('Fail-closed source validation cannot silently make an exercise official',()=>{
 assert.match(js,/questionBankPromotionEnabled!==false/);
 assert.match(js,/teacherReviewed!==false/);
 assert.match(js,/teacherApproved!==false/);
 assert.match(js,/q\.eligibleForQuestionBank!==false/);
 assert.match(js,/q\.requiresPedagogicalReview!==true/);
 assert.match(js,/items\.length!==96/);
 assert.match(js,/covered\.size!==22/);
 assert.match(html,/connect-src 'self'/);
});
