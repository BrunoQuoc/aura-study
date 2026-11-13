/* AURA STUDY — source-bound year-end preview: only MCQs auto-marked locally;
 * open-response rubrics remain human-review-only and never enter official grades.
 */
(()=>{
'use strict';
const SOURCE='aura_data/math6_endyear_practice_v1.json';
const KEY='aura_kntt_math6_yearend_preview_v1';
const $=id=>document.getElementById(id);
const data={source:null,answers:Array(12).fill(null),score:null,submitted:false,sha:null};
const el=(tag,cls='',text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
function isSourceRef(ref){
 return ref&&Number.isInteger(ref.volume)&&Number.isInteger(ref.lesson)&&
  ((ref.volume===1&&ref.lesson>=1&&ref.lesson<=22)||
   (ref.volume===2&&ref.lesson>=23&&ref.lesson<=43));
}
function validate(s){
 if(s?.schemaVersion!==1||s.libraryId!=='AURA-KNTT6-MATH-GRADE6-YEAREND'||
  s.subject!=='TOAN'||s.grade!==6||
  s.teacherApproved!==false||s.questionBankPromotionEnabled!==false||
  s.examEngineEnabled!==false||s.weaknessMapWriteEnabled!==false||
  s.officialAutoGradingEnabled!==false||
  !Array.isArray(s.mc)||s.mc.length!==12||
  !Array.isArray(s.written)||s.written.length!==6)
  throw Error('Đề ôn cả năm chưa phù hợp cổng an toàn.');
 const seen=new Set(),volumeCover=new Set();
 s.mc.forEach((q,i)=>{
  if(q?.id!=='Y6-M'+String(i+1).padStart(2,'0')||seen.has(q.id)||
   typeof q.prompt!=='string'||q.prompt.length<15||
   !Array.isArray(q.choices)||q.choices.length!==4||
   q.choices.some(x=>typeof x!=='string'||!x.trim())||
   new Set(q.choices).size!==4||!Number.isInteger(q.correct)||q.correct<0||q.correct>3||
   typeof q.explanation!=='string'||q.explanation.length<40||
   typeof q.skill!=='string'||q.skill.length<4||
   !isSourceRef(q.sourceRef)||q.requiresPedagogicalReview!==true||
   q.eligibleForQuestionBank!==false)
   throw Error('Câu trắc nghiệm thiếu đáp án hoặc dấu nguồn: '+(i+1));
  volumeCover.add(q.sourceRef.volume);seen.add(q.id);
 });
 if(volumeCover.size!==2)throw Error('Ôn cả năm phải có câu từ cả hai tập.');
 s.written.forEach((q,i)=>{
  if(q?.id!=='Y6-W'+String(i+1).padStart(2,'0')||seen.has(q.id)||
   typeof q.prompt!=='string'||q.prompt.length<35||
   !Array.isArray(q.sourceRefs)||!q.sourceRefs.length||
   q.sourceRefs.some(x=>!isSourceRef(x))||
   q.requiresHumanReview!==true||q.autoGradeAllowed!==false||
   q.readyForExamEngine!==false||q.teacherReviewed!==false||
   q.maxPoints!==10||
   !Array.isArray(q.modelAnswer?.steps)||q.modelAnswer.steps.length<2||
   typeof q.modelAnswer.final!=='string'||!q.modelAnswer.final||
   !Array.isArray(q.rubric)||q.rubric.length<3||
   q.rubric.some(x=>!Number.isInteger(x.points)||x.points<1||x.points>10||
    typeof x.criterion!=='string'||x.criterion.length<12||!x.expected)||
   q.rubric.reduce((sum,x)=>sum+x.points,0)!==10)
   throw Error('Rubric tự luận chưa đủ 10 điểm / chưa được bảo vệ: '+(i+1));
  seen.add(q.id);
 });
 return s;
}
async function sha(q){
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(q)));
 return Array.from(new Uint8Array(digest)).map(n=>n.toString(16).padStart(2,'0')).join('');
}
function loadSaved(){
 try{
  const p=JSON.parse(localStorage.getItem(KEY)||'null');
  if(p?.version===1&&p.libraryId===data.source.libraryId&&p.questionSha256===data.sha&&
   Array.isArray(p.answers)&&p.answers.length===12&&
   p.answers.every(x=>Number.isInteger(x)&&x>=0&&x<4)&&
   Number.isInteger(p.score)&&p.score>=0&&p.score<=12){
   data.answers=p.answers;data.score=p.score;data.submitted=true;
  }
 }catch(_){/* Ignore stale or tampered local preview. */}
}
function result(){
 const box=$('annualResult');box.replaceChildren();
 if(!data.submitted)return;
 box.append(el('strong','','Trắc nghiệm: '+data.score+'/12 câu đúng (tự luyện).'));
 const wrong=data.source.mc.filter((q,i)=>data.answers[i]!==q.correct);
 if(wrong.length){
  box.append(el('p','','Những bài cần ôn thêm:'));
  const ul=el('ul'),seen=new Set();
  wrong.forEach(q=>{
   const ref=q.sourceRef,key=ref.volume+'-'+ref.lesson;
   if(seen.has(key))return;
   seen.add(key);
   const li=el('li'),a=el('a','','Tập '+ref.volume+' · Bài '+ref.lesson);
   a.href=ref.volume===1?'knowledge-math6-v2.html#bai-'+ref.lesson:
    'knowledge-math6-volume2.html#bai-'+ref.lesson;
   li.append(a);ul.append(li);
  });box.append(ul);
 }else box.append(el('p','','Đúng cả 12 câu. Hãy kiểm tra lại phần tự luận và các ví dụ mẫu.'));
 box.append(el('p','','Điểm tự luyện không ghi vào hệ thống thi, lưu cục bộ và tự hết hiệu lực khi câu hỏi đổi SHA.'));
}
function renderMc(){
 if(!data.source)return;
 const root=$('annualQuizQuestions');root.replaceChildren();
 data.source.mc.forEach((q,i)=>{
  const f=el('fieldset');f.append(el('legend','','Câu '+(i+1)+' · '+q.prompt));
  q.choices.forEach((opt,j)=>{
   const label=el('label','statistics-option'),input=el('input');
   input.type='radio';input.name='annual-'+i;input.value=String(j);
   input.checked=data.answers[i]===j;input.disabled=data.submitted;
   input.addEventListener('change',()=>data.answers[i]=j);
   label.append(input,el('span','','ABCD'[j]+'. '+opt));
   if(data.submitted&&j===q.correct)label.classList.add('correct');
   else if(data.submitted&&j===data.answers[i])label.classList.add('wrong');
   f.append(label);
  });
  if(data.submitted)f.append(el('p','statistics-feedback',
   (data.answers[i]===q.correct?'✓ Đúng. ':'✕ Sai. Đáp án dự kiến: '+'ABCD'[q.correct]+'. ')+q.explanation));
  root.append(f);
 });
 $('annualSubmit').hidden=data.submitted;$('annualRetry').hidden=!data.submitted;
 result();
}
function renderWritten(){
 const root=$('annualWritten');root.replaceChildren();
 data.source.written.forEach((q,i)=>{
  const section=el('article','annual-written');
  section.append(el('h3','','Bài tự luận '+(i+1)+' · Tối đa 10 điểm tham khảo'));
  section.append(el('p','',q.prompt));
  const textarea=el('textarea');textarea.placeholder='Tự giải vào đây hoặc làm trên giấy rồi so sánh thang điểm. Không tự chấm, không lưu bài viết.';
  textarea.setAttribute('aria-label','Bài tự luận '+(i+1)+' — vùng tự viết');section.append(textarea);
  const details=el('details');details.append(el('summary','','Xem lời giải mẫu và rubric (chỉ sau khi tự làm)'));
  const ul=el('ol');
  q.modelAnswer.steps.forEach(step=>ul.append(el('li','',step)));
  details.append(ul,el('p','','Kết luận AURA dự kiến: '+q.modelAnswer.final));
  const t=el('table'),thead=el('thead'),hdr=el('tr');
  hdr.append(el('th','','Tiêu chí'),el('th','','Điểm'));thead.append(hdr);t.append(thead);
  const tbody=el('tbody');
  q.rubric.forEach(row=>{
   const tr=el('tr');tr.append(el('td','',row.criterion+' — '+row.expected),el('td','',row.points));
   tbody.append(tr);
  });
  const sum=el('tr');sum.append(el('td','','Tổng tối đa'),el('td','',q.maxPoints));tbody.append(sum);
  t.append(tbody);details.append(t);
  details.append(el('p','','Rubric chưa được giáo viên phê duyệt; không chuyển bảng điểm cho Exam Engine.'));
  section.append(details);root.append(section);
 });
}
function submit(evt){
 evt.preventDefault();
 if(!data.source||data.submitted)return;
 if(data.answers.some(x=>!Number.isInteger(x))){
  $('annualResult').replaceChildren(el('p','','Hãy trả lời đủ 12 câu trắc nghiệm trước khi nộp.'));return;
 }
 data.score=data.source.mc.reduce((n,q,i)=>n+(q.correct===data.answers[i]?1:0),0);
 data.submitted=true;
 try{localStorage.setItem(KEY,JSON.stringify({
  version:1,libraryId:data.source.libraryId,questionSha256:data.sha,
  answers:[...data.answers],score:data.score,completedAt:new Date().toISOString()
 }));}catch(_){/* Not a durable or official grade. */}
 renderMc();
 $('annualResult').scrollIntoView({behavior:'smooth',block:'nearest'});
}
async function boot(){
 $('annualQuizForm').addEventListener('submit',submit);
 $('annualRetry').addEventListener('click',()=>{
  data.answers=Array(12).fill(null);data.score=null;data.submitted=false;
  try{localStorage.removeItem(KEY)}catch(_){}
  renderMc();
 });
 try{
  if(!crypto?.subtle)throw Error('Thiết bị thiếu kiểm soát SHA.');
  const response=await fetch(SOURCE,{cache:'no-store',credentials:'omit'});
  if(!response.ok)throw Error('Không tải được tài liệu ôn (HTTP '+response.status+').');
  data.source=validate(await response.json());
  data.sha=await sha(data.source.mc);loadSaved();renderMc();renderWritten();
 }catch(error){
  $('annualQuizQuestions').replaceChildren(el('p','','Chưa thể mở ôn cuối năm: '+String(error?.message||error)));
  $('annualSubmit').disabled=true;
  $('annualWritten').replaceChildren(el('p','','Thang điểm tạm bị khóa vì nguồn chưa vượt qua kiểm tra toàn vẹn.'));
 }
}
boot();
})();
