/* AURA STUDY — decimal review and original manipulatives: draft-only, local self-practice. */
(()=>{
'use strict';
const DATA_URL='aura_data/knowledge_math6_kntt_volume2_chapter7_review_v1.json';
const KEY='aura_kntt_math6_volume2_ch7_review_v1';
const NS='http://www.w3.org/2000/svg';
const $=id=>document.getElementById(id);
const state={data:null,answers:[null,null,null,null,null,null],submitted:false,score:null,hash:null};
const el=(tag,cls='',text)=>{
 const n=document.createElement(tag);if(cls)n.className=cls;
 if(text!==undefined)n.textContent=String(text);return n;
};
const vi=x=>Number(x).toString().replace('.',',');
function round(){
 const v=Number($('roundSlider').value);
 if(!Number.isFinite(v)||v<0||v>10)return;
 const down=Math.floor(v),up=down+1,rounded=Math.floor(v+0.5);
 const pos=70+(v-down)*460;
 $('decimalPoint').setAttribute('cx',String(pos));
 $('decimalPointLabel').setAttribute('x',String(pos));
 $('decimalPointLabel').textContent=vi(v);
 $('decimalLeft').textContent=vi(down);
 $('decimalMiddle').textContent=vi(down+0.5);
 $('decimalRight').textContent=vi(up);
 $('roundResult').textContent=vi(v)+' làm tròn đến hàng đơn vị là '+rounded+
  (v-down===0.5?' (đúng giữa hai số nguyên, theo quy tắc làm tròn lên).':'.');
}
function percent(){
 const p=Number($('percentSlider').value);
 if(!Number.isInteger(p)||p<0||p>100||p%5!==0)return;
 const grid=$('percentGrid');grid.replaceChildren();
 for(let i=0;i<20;i++){
  const box=el('span','cell'+(i<p/5?' filled':''));
  box.setAttribute('aria-label',i<p/5?'Ô được tô':'Ô chưa tô');
  grid.append(box);
 }
 $('percentResult').textContent=vi(p)+'% = '+(p/5)+
  '/20 ô; '+vi(p)+'% của 200 = '+vi(200*p/100)+'.';
}
function validate(d){
 if(d?.schemaVersion!==1||d.libraryId!=='AURA-KNTT6-MATH-VOLUME2-CHAPTER7-REVIEW'||
  d.parentLibraryId!=='AURA-KNTT6-MATH-VOLUME2'||d.subject!=='TOAN'||
  d.chapter!==7||d.grade!==6||d.volume!==2||
  d.status!=='DRAFT_NEEDS_PEDAGOGICAL_REVIEW'||d.teacherApproved!==false||
  d.questionBankPromotionEnabled!==false||d.weaknessMapWriteEnabled!==false||
  !Array.isArray(d.questions)||d.questions.length!==6)
  throw Error('Bộ luyện chưa đúng định dạng hoặc không an toàn.');
 const ids=new Set(),cover=new Set();
 d.questions.forEach((q,i)=>{
  if(q.id!=='C7-0'+(i+1)||ids.has(q.id)||
   typeof q.prompt!=='string'||q.prompt.length<12||
   !Array.isArray(q.choices)||q.choices.length!==4||new Set(q.choices).size!==4||
   !Number.isInteger(q.correct)||q.correct<0||q.correct>3||
   typeof q.explanation!=='string'||q.explanation.length<25||
   typeof q.skill!=='string'||q.skill.length<3||
   q.requiresPedagogicalReview!==true||q.eligibleForQuestionBank!==false||
   !Array.isArray(q.sourceLessons)||!q.sourceLessons.length||
   q.sourceLessons.some(n=>!Number.isInteger(n)||n<28||n>31))
   throw Error('Câu ôn chương chưa được kiểm tra: '+q.id);
  ids.add(q.id);q.sourceLessons.forEach(n=>cover.add(n));
 });
 if(cover.size!==4)throw Error('Chưa đủ phạm vi Bài 28–31.');
 return d;
}
async function hashQuestions(questions){
 const bytes=new TextEncoder().encode(JSON.stringify(questions));
 const h=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(h)).map(n=>n.toString(16).padStart(2,'0')).join('');
}
function loadProgress(){
 try{
  const p=JSON.parse(localStorage.getItem(KEY)||'null');
  if(p?.version===1&&p.libraryId===state.data.libraryId&&
    p.questionSha256===state.hash&&
    Array.isArray(p.answers)&&p.answers.length===6&&
    p.answers.every(x=>Number.isInteger(x)&&x>=0&&x<4)&&
    Number.isInteger(p.score)&&p.score>=0&&p.score<=6){
    state.answers=p.answers;state.score=p.score;state.submitted=true;
  }
 }catch(_){/* Invalid local draft is ignored. */}
}
function showResult(){
 const root=$('decimalReviewResult');root.replaceChildren();
 if(!state.submitted)return;
 root.append(el('strong','score','Kết quả ôn chương: '+state.score+'/6 câu.'));
 const missed=state.data.questions.filter((q,i)=>state.answers[i]!==q.correct);
 if(missed.length){
  root.append(el('p','','Các câu còn sai nên ôn lại đúng bài học:'));
  const links=el('ul');
  const lessons=[...new Set(missed.flatMap(q=>q.sourceLessons))].sort((a,b)=>a-b);
  lessons.forEach(n=>{
   const li=el('li'),a=el('a','','Ôn lại Bài '+n+' · Toán 6 Tập 2');
   a.href='knowledge-math6-volume2.html#bai-'+n;
   li.append(a);links.append(li);
  });
  root.append(links);
 }else root.append(el('p','','Em đã chọn đúng cả 6 câu. Có thể luyện lại để củng cố kiến thức.'));
 root.append(el('p','','Kết quả chỉ là tự luyện; không phải điểm thi hoặc chứng nhận sư phạm.'));
}
function showQuestions(){
 if(!state.data)return;
 const root=$('decimalReviewQuestions');root.replaceChildren();
 state.data.questions.forEach((q,i)=>{
  const f=el('fieldset','decimal-question');
  f.append(el('legend','','Câu '+(i+1)+' · '+q.prompt));
  q.choices.forEach((choice,j)=>{
   const label=el('label','decimal-option');
   const input=el('input');input.type='radio';input.name='decimal-q-'+i;
   input.value=String(j);
   input.checked=state.answers[i]===j;input.disabled=state.submitted;
   input.addEventListener('change',()=>{state.answers[i]=j;});
   label.append(input,el('span','','ABCD'[j]+'. '+choice));
   if(state.submitted){
    if(j===q.correct)label.classList.add('correct');
    else if(state.answers[i]===j)label.classList.add('wrong');
   }
   f.append(label);
  });
  if(state.submitted){
   const prefix=state.answers[i]===q.correct?'✓ Chính xác. ':'✕ Chưa đúng. Đáp án AURA dự kiến: '+'ABCD'[q.correct]+'. ';
   f.append(el('p','decimal-feedback',prefix+q.explanation));
  }
  root.append(f);
 });
 $('decimalReviewSubmit').hidden=state.submitted;
 $('decimalReviewRetry').hidden=!state.submitted;
 showResult();
}
function save(){
 try{
  localStorage.setItem(KEY,JSON.stringify({
   version:1,libraryId:state.data.libraryId,questionSha256:state.hash,
   answers:[...state.answers],score:state.score,completedAt:new Date().toISOString()
  }));
  return true;
 }catch(_){return false;}
}
function submit(e){
 e.preventDefault();
 if(state.submitted)return;
 if(state.answers.some(x=>!Number.isInteger(x))){
  $('decimalReviewResult').replaceChildren(el('p','','Vui lòng trả lời đủ cả 6 câu trước khi nộp.'));return;
 }
 state.score=state.data.questions.reduce((n,q,i)=>n+(state.answers[i]===q.correct?1:0),0);
 state.submitted=true;
 const saved=save();
 showQuestions();
 if(!saved)$('decimalReviewResult').append(el('p','','Không lưu được kết quả trên thiết bị này. Khi tải lại trang, điểm có thể mất.'));
 $('decimalReviewResult').scrollIntoView({behavior:'smooth',block:'nearest'});
}
async function boot(){
 $('roundSlider').addEventListener('input',round);
 $('percentSlider').addEventListener('input',percent);
 round();percent();
 $('decimalReviewForm').addEventListener('submit',submit);
 $('decimalReviewRetry').addEventListener('click',()=>{
  state.answers=[null,null,null,null,null,null];state.submitted=false;state.score=null;
  try{localStorage.removeItem(KEY);}catch(_){/* no persistent state */}
  showQuestions();
 });
 try{
  if(!crypto?.subtle)throw Error('Thiếu WebCrypto để kiểm soát phiên bản ôn tập.');
  const response=await fetch(DATA_URL,{cache:'no-store',credentials:'omit'});
  if(!response.ok)throw Error('Không nạp được bộ câu hỏi (HTTP '+response.status+').');
  state.data=validate(await response.json());
  state.hash=await hashQuestions(state.data.questions);
  loadProgress();showQuestions();
 }catch(err){
  $('decimalReviewQuestions').replaceChildren(el('p','', 'Không thể mở ôn tập vì kiểm tra nội dung chưa đạt: '+String(err?.message||err)));
  $('decimalReviewSubmit').disabled=true;
 }
}
boot();
})();