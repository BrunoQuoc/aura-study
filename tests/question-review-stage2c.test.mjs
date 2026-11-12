import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('admin_question_review_core.js','utf8');
function core(){const window={};vm.runInNewContext(source,{window,Date});return window.AURA_QUESTION_REVIEW_CORE;}
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO9L9ncAAAAASUVORK5CYII=';
function packet(overrides={}){
 return {schemaVersion:1,kind:'aura_question_review_packet_v1',
 safety:{questionBankPublishEnabled:false},
 items:[{itemId:'M6-GK1-DE04-ESSAY06',sourceName:'Exam_04.docx',sourceSha256:'a'.repeat(64),
 sourceLabel:'Bài 6',type:'ESSAY',textBlocks:['Cho hình vuông ABCD, AB = 8 cm, AC = 10 cm.'],
 options:[],images:[{sha256:'b'.repeat(64),assetName:'image4.png',
 dataUrl:png,sourceBlockIndex:73}],
 issueFlags:['CONTRADICTORY_SQUARE_SIDE_AND_DIAGONAL'],
 reviewedForBank:false,publishEnabled:false,...overrides}]};
}
test('Rejects fake published packets, tampered source IDs, unsafe image URLs and duplicate questions',()=>{
 const c=core();
 assert.equal(c.sanitizePacket(packet()).summary.images,1);
 assert.throws(()=>c.sanitizePacket(packet({publishEnabled:true})),/tự đánh dấu xuất bản/);
 assert.throws(()=>c.sanitizePacket(packet({sourceSha256:'bad'})),/SHA-256/);
 assert.throws(()=>c.sanitizePacket(packet({images:[{sha256:'b'.repeat(64),dataUrl:'https://example.com/exfil.png'}]})),/Ảnh không phải/);
 const dup=packet();dup.items.push({...dup.items[0]});
 assert.throws(()=>c.sanitizePacket(dup),/trùng/);
});
test('Explicit unresolved contradiction blocks review despite checked answer and rubric',()=>{
 const c=core(),item=c.sanitizePacket(packet()).items[0];
 const draft=c.emptyDecision();
 assert.equal(c.evaluate(item,draft).readyForStaging,false);
 Object.assign(draft,{answer:'Không tồn tại hình vuông với hai dữ kiện này.',
 answerEvidence:'Cạnh 8 cm cho đường chéo 8 căn bậc hai của 2, khác 10 cm.',
 rubric:'Nhận dạng mâu thuẫn được 0,5; giải thích được 0,5.',
 maxPoints:'1',rubricEvidence:'Giáo viên cần xác minh lại đề gốc trước khi tính điểm.',
 imageEvidence:'Đã đối chiếu ảnh số bốn và câu cuối.',
 checkImage:true,checkAnswer:true,checkRubric:true,reviewerLabel:'Admin kiểm định'});
 let gate=c.evaluate(item,draft);
 assert.ok(gate.blockers.some(x=>x.includes('CONTRADICTORY')));
 assert.equal(gate.eligibleForQuestionBank,false);
 draft.issueResolutions.CONTRADICTORY_SQUARE_SIDE_AND_DIAGONAL='Giữ chặn cho đến khi đề gốc sửa số liệu hình vuông.';
 gate=c.evaluate(item,draft);
 assert.equal(gate.readyForStaging,false,'source contradiction cannot be cleared by a browser note');
 assert.ok(gate.blockers.some(x=>x.includes('Nguồn còn cảnh báo')));
 assert.equal(gate.eligibleForQuestionBank,false,'No local approval may publish to bank');
 assert.equal(gate.autoGradingAllowed,false);
});
test('Export writes no original questions/images and rejects previous decisions when source hash changes',()=>{
 const c=core(),p=c.sanitizePacket(packet()),decision={...c.emptyDecision(),reviewerLabel:'Test Reviewer'};
 const e=c.exportDecisions(p,{[p.items[0].itemId]:decision});
 assert.equal(e.publish,false);
 assert.equal(e.grading,false);
 assert.equal(e.items[0].gate.serverApprovalRequired,true);
 assert.ok(!JSON.stringify(e).includes('Cho hình vuông'));
 assert.ok(!JSON.stringify(e).includes(png.slice(30)));
 assert.equal(Object.keys(c.importDecisions(p,e)).length,1);
 const changed=c.sanitizePacket(packet({sourceSha256:'c'.repeat(64)}));
 assert.equal(Object.keys(c.importDecisions(changed,e)).length,0);
});
test('MCQ requires exactly 4 distinct choices and verified option answer',()=>{
 const c=core(),mcq={...packet().items[0],itemId:'M6-GK1-DE02-MCQ03',type:'MCQ',
 options:[{key:'A',text:'16 = 2^4'},{key:'B',text:'16 = 4^3'},
 {key:'C',text:'16 = 2^3'},{key:'D',text:'16 = 2^3'}],images:[],issueFlags:[]};
 const p=c.sanitizePacket({...packet(),items:[mcq]});
 const gate=c.evaluate(p.items[0],{answer:'Z',reviewerLabel:'Reviewer'});
 assert.ok(gate.blockers.some(x=>x.includes('A/B/C/D')));
 assert.equal(gate.eligibleForQuestionBank,false);
});
test('HTML CSP forbids network connections and references dedicated review scripts',()=>{
 const html=readFileSync('admin-question-review.html','utf8');
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/img-src data:/);
 assert.match(html,/admin_question_review_ui\.js\?v=/);
 assert.match(html,/admin_question_review_core\.js\?v=/);
 assert.doesNotMatch(readFileSync('admin_question_review_ui.js','utf8'),/auraApproveInboxFile|aura_inbox_queue_v1|api\.github\.com|fetch\(/);
});

test('Clean item can be reviewed LOCALLY only when rubric steps sum to declared points',()=>{
 const c=core();
 const clean={...packet().items[0],itemId:'M6-GK1-DE01-MCQ01',sourceLabel:'Câu 1',
   type:'MCQ',images:[],issueFlags:[],
   options:[{key:'A',text:'Đúng'},{key:'B',text:'Sai B'},{key:'C',text:'Sai C'},{key:'D',text:'Sai D'}]};
 const item=c.sanitizePacket({...packet(),items:[clean]}).items[0];
 const d={...c.emptyDecision(),answer:'A',
   answerEvidence:'Đã giải và đối chiếu A là phương án duy nhất đúng.',
   rubric:'Đáp án đúng: 0,25 điểm',maxPoints:'0.25',
   rubricEvidence:'Đối chiếu thang điểm nháp 0,25 một câu; cần duyệt từ giáo viên.',
   imageEvidence:'Không có ảnh trong câu.',
   checkImage:true,checkAnswer:true,checkRubric:true,reviewerLabel:'Reviewer'};
 assert.equal(c.evaluate(item,d).readyForStaging,true);
 assert.equal(c.evaluate(item,d).eligibleForQuestionBank,false);
 d.maxPoints='0.5';
 assert.ok(c.evaluate(item,d).blockers.some(x=>x.includes('Tổng điểm')));
});
