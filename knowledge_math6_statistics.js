/* AURA STUDY — Chapter IX original synthetic data experiments and local-only chapter review. */
(()=>{
'use strict';
const URL='aura_data/knowledge_math6_kntt_volume2_chapter9_review_v1.json';
const KEY='aura_kntt_math6_volume2_ch9_review_v1';
const $=id=>document.getElementById(id);
const NS='http://www.w3.org/2000/svg';
const counts={A:5,B:8,C:6};
let state={data:null,sha:null,answers:Array(6).fill(null),submitted:false,score:null};
function el(name,cls='',content){
 const e=document.createElement(name);if(cls)e.className=cls;
 if(content!==undefined)e.textContent=String(content);return e;
}
function svg(name,attrs={},content){
 const e=document.createElementNS(NS,name);
 for(const [key,value] of Object.entries(attrs))e.setAttribute(key,String(value));
 if(content!==undefined)e.textContent=String(content);return e;
}
function gcd(a,b){while(b){const t=a%b;a=b;b=t}return a}
function drawBars(){
 const selected=$('statsGroup').value;
 const root=$('statsBars');root.replaceChildren();
 const colors={A:'#307fb2',B:'#2d8a70',C:'#bb8545'};
 Object.entries(counts).forEach(([name,count],i)=>{
  const x=130+i*145,y=198-count*17;
  root.append(svg('rect',{x,y,width:78,height:count*17,rx:3,fill:colors[name],
   opacity:selected===name?1:0.55,'aria-label':name+': '+count+' cuốn'}));
  root.append(svg('text',{x:x+39,y:218,'text-anchor':'middle','font-size':16,
   fill:'#365b74'},name));
  root.append(svg('text',{x:x+39,y:y-8,'text-anchor':'middle','font-size':15,
   fill:'#365b74'},String(count)));
 });
 $('statsBarResult').textContent='Nhóm '+selected+' có '+counts[selected]+
  ' quyển; nhóm ít nhất có 5 quyển. Chênh lệch: '+(counts[selected]-5)+' quyển.';
}
function drawProb(){
 const n=Number($('statsFrequency').value);
 if(!Number.isInteger(n)||n<0||n>20)return;
 const grid=$('statsTrialGrid');grid.replaceChildren();
 for(let i=0;i<20;i++)grid.append(el('span','cell'+(i<n?' filled':'')));
 const k=gcd(n,20),fraction=(n/k)+'/'+(20/k);
 $('statsProbabilityResult').textContent=n+'/20 lần xuất hiện mặt 6 = '+fraction+
  ' = '+(n*5)+'% (xác suất thực nghiệm theo dữ liệu minh họa).';
}
function validate(d){
 if(d?.schemaVersion!==1||d.libraryId!=='AURA-KNTT6-MATH-VOLUME2-CHAPTER9-REVIEW'||
  d.parentLibraryId!=='AURA-KNTT6-MATH-VOLUME2'||d.subject!=='TOAN'||
  d.grade!==6||d.volume!==2||d.chapter!==9||
  d.status!=='DRAFT_NEEDS_PEDAGOGICAL_REVIEW'||
  d.teacherApproved!==false||d.questionBankPromotionEnabled!==false||
  d.weaknessMapWriteEnabled!==false||!Array.isArray(d.questions)||d.questions.length!==6)
  throw Error('Bộ ôn dữ liệu chưa hợp lệ hoặc không được phép dùng.');
 const coverage=new Set();
 d.questions.forEach((q,i)=>{
  if(q.id!=='C9-0'+(i+1)||typeof q.prompt!=='string'||q.prompt.length<16||
   !Array.isArray(q.choices)||q.choices.length!==4||
   new Set(q.choices).size!==4||
   !Number.isInteger(q.correct)||q.correct<0||q.correct>3||
   typeof q.explanation!=='string'||q.explanation.length<30||
   typeof q.skill!=='string'||q.skill.length<3||
   q.requiresPedagogicalReview!==true||q.eligibleForQuestionBank!==false||
   !Array.isArray(q.sourceLessons)||!q.sourceLessons.length||
   q.sourceLessons.some(n=>!Number.isInteger(n)||n<38||n>43))
   throw Error('Câu ôn chương không hợp lệ: '+q.id);
  q.sourceLessons.forEach(n=>coverage.add(n));
 });
 if(coverage.size!==6)throw Error('Bộ ôn chưa phủ đủ 6 bài.');
 return d;
}
async function sha(q){
 const bytes=new TextEncoder().encode(JSON.stringify(q));
 const b=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function restore(){
 try{
  const r=JSON.parse(localStorage.getItem(KEY)||'null');
  if(r?.version===1&&r.libraryId===state.data.libraryId&&r.questionSha256===state.sha&&
   Number.isInteger(r.score)&&r.score>=0&&r.score<=6&&
   Array.isArray(r.answers)&&r.answers.length===6&&
   r.answers.every(x=>Number.isInteger(x)&&x>=0&&x<4)){
   state.answers=r.answers;state.score=r.score;state.submitted=true;
  }
 }catch(_){/* Invalid drafts discarded */ }
}
function result(){
 const root=$('statsReviewResult');root.replaceChildren();
 if(!state.submitted)return;
 root.append(el('strong','score','Kết quả ôn Chương IX: '+state.score+'/6 câu.'));
 const missed=state.data.questions.filter((q,i)=>state.answers[i]!==q.correct);
 if(!missed.length){root.append(el('p','','Đã làm đúng cả sáu câu. Có thể luyện lại để củng cố.'));return;}
 root.append(el('p','','Những bài nên ôn lại:'));
 const list=el('ul');
 [...new Set(missed.flatMap(q=>q.sourceLessons))].sort((a,b)=>a-b).forEach(n=>{
  const li=el('li'),a=el('a','', 'Ôn lại Bài '+n);
  a.href='knowledge-math6-volume2.html#bai-'+n;li.append(a);list.append(li);
 });
 root.append(list);
 root.append(el('p','','Gợi ý chỉ phục vụ tự học cục bộ; không ghi Weakness Map chính thức.'));
}
function render(){
 if(!state.data)return;
 const root=$('statsReviewQuestions');root.replaceChildren();
 state.data.questions.forEach((q,i)=>{
  const f=el('fieldset','decimal-question');
  f.append(el('legend','','Câu '+(i+1)+' · '+q.prompt));
  q.choices.forEach((choice,j)=>{
   const lab=el('label','decimal-option');
   const radio=el('input');radio.type='radio';radio.name='stats-q-'+i;
   radio.value=String(j);radio.checked=state.answers[i]===j;
   radio.disabled=state.submitted;
   radio.addEventListener('change',()=>{state.answers[i]=j;});
   lab.append(radio,el('span','','ABCD'[j]+'. '+choice));
   if(state.submitted){
    if(j===q.correct)lab.classList.add('correct');
    else if(j===state.answers[i])lab.classList.add('wrong');
   }
   f.append(lab);
  });
  if(state.submitted)f.append(el('p','decimal-feedback',
   (state.answers[i]===q.correct?'✓ Đúng. ':'✕ Chưa đúng. Đáp án dự kiến: '+'ABCD'[q.correct]+'. ')+q.explanation));
  root.append(f);
 });
 $('statsReviewSubmit').hidden=state.submitted;
 $('statsReviewRetry').hidden=!state.submitted;
 result();
}
function submit(e){
 e.preventDefault();
 if(state.submitted)return;
 if(state.answers.some(x=>!Number.isInteger(x))){
  $('statsReviewResult').replaceChildren(el('p','','Vui lòng chọn đủ 6 đáp án rồi nộp.'));return;
 }
 state.score=state.data.questions.reduce((n,q,i)=>n+(q.correct===state.answers[i]?1:0),0);
 state.submitted=true;
 try{
  localStorage.setItem(KEY,JSON.stringify({version:1,libraryId:state.data.libraryId,
   questionSha256:state.sha,answers:[...state.answers],score:state.score,
   completedAt:new Date().toISOString()}));
 }catch(_){/* Unable to persist; still render score in session. */}
 render();$('statsReviewResult').scrollIntoView({behavior:'smooth',block:'nearest'});
}
async function boot(){
 $('statsGroup').addEventListener('change',drawBars);
 $('statsFrequency').addEventListener('input',drawProb);
 drawBars();drawProb();
 $('statsReviewForm').addEventListener('submit',submit);
 $('statsReviewRetry').addEventListener('click',()=>{
  state.answers=Array(6).fill(null);state.score=null;state.submitted=false;
  try{localStorage.removeItem(KEY)}catch(_){/* no persistent scores */}
  render();
 });
 try{
  if(!globalThis.crypto?.subtle)throw Error('Trình duyệt thiếu WebCrypto.');
  const response=await fetch(URL,{cache:'no-store',credentials:'omit'});
  if(!response.ok)throw Error('Không tải được bộ ôn (HTTP '+response.status+').');
  state.data=validate(await response.json());
  state.sha=await sha(state.data.questions);restore();render();
 }catch(err){
  $('statsReviewQuestions').replaceChildren(el('p','',
   'Bộ ôn bị khóa do dữ liệu không hợp lệ: '+String(err?.message||err)));
  $('statsReviewSubmit').disabled=true;
 }
}
boot();
})();