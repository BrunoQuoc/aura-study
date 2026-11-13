/* AURA STUDY — Year-end original Math6 draft review and human-only essay rubric.
 * Self-review is NOT a teacher signature, automatic essay grade or official result.
 */
(()=>{
'use strict';
const URL='aura_data/knowledge_math6_kntt_yearend_review_v1.json';
const STORAGE_PREFIX='aura_kntt_math6_yearend_quiz_v1_';
const $=id=>document.getElementById(id);
const state={data:null,mode:'chapter6',sha:{},answers:[],submitted:false,score:null};
const el=(tag,cls='',text)=>{
 const e=document.createElement(tag);if(cls)e.className=cls;
 if(text!==undefined)e.textContent=String(text);return e;
};
function validQ(q,prefix){
 return q&&typeof q.id==='string'&&q.id.startsWith(prefix)&&
 typeof q.prompt==='string'&&q.prompt.trim().length>=20&&
 Array.isArray(q.choices)&&q.choices.length===4&&
 q.choices.every(x=>typeof x==='string'&&x.trim())&&
 new Set(q.choices).size===4&&
 Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4&&
 typeof q.explanation==='string'&&q.explanation.trim().length>=35&&
 typeof q.skill==='string'&&q.skill.trim().length>=4&&
 Array.isArray(q.sourceLessons)&&q.sourceLessons.length>0&&
 q.sourceLessons.every(n=>Number.isInteger(n)&&n>=1&&n<=43)&&
 q.eligibleForQuestionBank===false&&q.requiresPedagogicalReview===true;
}
function validate(d){
 if(d?.schemaVersion!==1||d.libraryId!=='AURA-KNTT6-MATH-YEAREND-DRAFT'||
 d.kind!=='aura_math6_kntt_yearend_review_and_written_rubrics_v1'||
 d.status!=='DRAFT_NEEDS_QUALIFIED_PEDAGOGICAL_REVIEW'||
 d.teacherApproved!==false||d.questionBankPromotionEnabled!==false||
 d.examEngineOfficialEnabled!==false||d.weaknessMapWriteEnabled!==false||
 d.sourceScope?.verifiedPublisherFullText!==false||
 d.sourceScope?.publisherTextCopied!==false||
 d.yearEnd?.questions?.length!==12||
 d.chapter6?.questions?.length!==6||
 d.written?.questions?.length!==5||d.written.maxTotalPoints!==10)
 throw Error('Bộ ôn tổng hợp chưa được phép phát hành hoặc thiếu phạm vi.');
 const all=[...d.chapter6.questions,...d.yearEnd.questions];
 const ids=new Set();
 for(const q of all){
  if(!validQ(q,q.id.startsWith('C6-')?'C6-':'Y6-')||ids.has(q.id))throw Error('Câu trắc nghiệm không đúng chuẩn: '+q.id);
  ids.add(q.id);
 }
 if(!d.chapter6.questions.every(q=>q.sourceLessons.every(n=>n>=23&&n<=27)))throw Error('Bộ ôn VI sai nguồn.');
 for(const w of d.written.questions){
  if(!/^W6-0[1-5]$/.test(w.id)||ids.has(w.id)||
   w.machineAutoGradeAllowed!==false||w.gradingMode!=='HUMAN_REVIEW_REQUIRED'||
   w.maxPoints!==2||w.eligibleForQuestionBank!==false||
   w.requiresPedagogicalReview!==true||!Array.isArray(w.rubric)||w.rubric.length!==4||
   !w.rubric.every(c=>c.points===0.5&&typeof c.criterion==='string'&&c.criterion.length>=25)||
   w.rubric.reduce((n,c)=>n+c.points,0)!==w.maxPoints||
   !Array.isArray(w.workedSolution)||w.workedSolution.length<3)
   throw Error('Thang điểm tự luận không hợp lệ: '+w.id);
  ids.add(w.id);
 }
 if(ids.size!==23)throw Error('Hồ sơ thiếu mã câu hoặc mã bài tự luận.');
 return d;
}
async function hash(items){
 const bytes=new TextEncoder().encode(JSON.stringify(items));
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
const key=()=>STORAGE_PREFIX+state.mode;
const qs=()=>state.data[state.mode].questions;
function restore(){
 state.answers=Array(qs().length).fill(null);state.submitted=false;state.score=null;
 try{
  const r=JSON.parse(localStorage.getItem(key())||'null');
  if(r?.schemaVersion===1&&r.libraryId===state.data.libraryId&&r.sha256===state.sha[state.mode]&&
   Array.isArray(r.answers)&&r.answers.length===qs().length&&
   r.answers.every(n=>Number.isInteger(n)&&n>=0&&n<=3)&&
   Number.isInteger(r.score)&&r.score>=0&&r.score<=qs().length){
   state.answers=r.answers;state.submitted=true;state.score=r.score;
  }
 }catch(_){/* Invalid or outdated local draft ignored */}
}
function status(){
 const root=$('yearendQuizResult');root.replaceChildren();
 if(!state.submitted)return;
 root.append(el('strong','score','Kết quả tự luyện: '+state.score+'/'+qs().length+' câu.'));
 const missed=qs().filter((q,i)=>state.answers[i]!==q.correct);
 if(!missed.length){root.append(el('p','','Đã đúng tất cả, nhưng kết quả này chỉ là tự luyện.'));return;}
 root.append(el('p','','Các bài học nên ôn lại sau khi làm sai:'));
 const links=el('ul');
 [...new Set(missed.flatMap(q=>q.sourceLessons))].sort((a,b)=>a-b).forEach(n=>{
  const li=el('li'),a=el('a','','Bài '+n+' · xem lại kiến thức');
  a.href=n<=22?'knowledge-math6-v2.html#bai-'+n:'knowledge-math6-volume2.html#bai-'+n;
  li.append(a);links.append(li);
 });
 root.append(links);
 root.append(el('p','','Đây là gợi ý ôn bài cục bộ, không ghi Weakness Map chính thức.'));
}
function quiz(){
 if(!state.data)return;
 $('yearendSetDescription').textContent=state.mode==='chapter6'?
  'Ôn sáu dạng kiến thức về phân số, Bài 23–27.':'Ôn 12 dạng kiến thức cả hai tập, từ số tự nhiên đến xác suất thực nghiệm.';
 const root=$('yearendQuizQuestions');root.replaceChildren();
 qs().forEach((q,i)=>{
  const f=el('fieldset','decimal-question');
  f.append(el('legend','','Câu '+(i+1)+' · '+q.prompt));
  q.choices.forEach((choice,j)=>{
   const label=el('label','decimal-option');
   const input=el('input');input.type='radio';input.name='yearend-q-'+i;
   input.value=String(j);input.checked=state.answers[i]===j;
   input.disabled=state.submitted;
   input.addEventListener('change',()=>{state.answers[i]=j;});
   label.append(input,el('span','','ABCD'[j]+'. '+choice));
   if(state.submitted){
    if(j===q.correct)label.classList.add('correct');
    else if(j===state.answers[i])label.classList.add('wrong');
   }
   f.append(label);
  });
  if(state.submitted)f.append(el('p','decimal-feedback',
   (state.answers[i]===q.correct?'✓ Đúng. ':'✕ Chưa đúng. Đáp án dự kiến: '+'ABCD'[q.correct]+'. ')+q.explanation));
  root.append(f);
 });
 $('yearendSubmit').hidden=state.submitted;
 $('yearendRetry').hidden=!state.submitted;
 status();
}
function written(){
 const root=$('yearendWrittenItems');root.replaceChildren();
 state.data.written.questions.forEach((w,i)=>{
  const section=el('section','decimal-question');
  section.append(el('h3','','Bài tự luận '+(i+1)+' · '+w.maxPoints+' điểm'),el('p','',w.prompt));
  const details=el('details');
  details.style.marginTop='10px';
  const summary=el('summary','','Mở lời giải tham khảo & rubric chấm thủ công');
  summary.style.cursor='pointer';summary.style.fontWeight='750';
  details.append(summary);
  const sub=el('ol');w.workedSolution.forEach(x=>sub.append(el('li','',x)));
  details.append(sub,el('h4','','Tiêu chí cho điểm từng bước (tổng 2 điểm)'));
  const list=el('ol');w.rubric.forEach(x=>list.append(el('li','',x.criterion+' — '+x.points+' điểm')));
  details.append(list,el('p','',
   'Cần người chấm xác nhận cách trình bày/lập luận tương đương; AURA chưa được phép tự chấm tự luận này.'));
  section.append(details);root.append(section);
 });
}
function submit(e){
 e.preventDefault();if(state.submitted)return;
 if(state.answers.some(x=>!Number.isInteger(x))){
  $('yearendQuizResult').replaceChildren(el('p','','Vui lòng trả lời đủ mọi câu trước khi nộp.'));return;
 }
 state.score=qs().reduce((n,q,i)=>n+(q.correct===state.answers[i]?1:0),0);
 state.submitted=true;
 try{
  localStorage.setItem(key(),JSON.stringify({
   schemaVersion:1,libraryId:state.data.libraryId,sha256:state.sha[state.mode],
   answers:state.answers,score:state.score,completedAt:new Date().toISOString()
  }));
 }catch(_){/* Display remains in memory, no official side effects */}
 quiz();
 $('yearendQuizResult').scrollIntoView({behavior:'smooth',block:'nearest'});
}
async function boot(){
 $('yearendSet').addEventListener('change',e=>{state.mode=e.target.value;restore();quiz();});
 $('yearendQuizForm').addEventListener('submit',submit);
 $('yearendRetry').addEventListener('click',()=>{
  state.answers=Array(qs().length).fill(null);state.submitted=false;state.score=null;
  try{localStorage.removeItem(key())}catch(_){}
  quiz();
 });
 try{
  if(!globalThis.crypto?.subtle)throw Error('WebCrypto không khả dụng.');
  const response=await fetch(URL,{cache:'no-store',credentials:'omit'});
  if(!response.ok)throw Error('Không tải được học liệu (HTTP '+response.status+').');
  state.data=validate(await response.json());
  state.sha.chapter6=await hash(state.data.chapter6.questions);
  state.sha.yearEnd=await hash(state.data.yearEnd.questions);
  restore();quiz();written();
 }catch(err){
  $('yearendQuizQuestions').replaceChildren(el('p','','Cổng học thử bị khóa: '+String(err?.message||err)));
  $('yearendSubmit').disabled=true;
  $('yearendWrittenItems').replaceChildren(el('p','','Không hiển thị rubric khi dữ liệu chưa được kiểm tra.'));
 }
}
boot();
})();