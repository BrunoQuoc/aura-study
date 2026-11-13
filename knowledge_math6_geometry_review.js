/* AURA STUDY — Geometry Chapter VIII interactive SVG and 6-question practice.
 * Browser-local formative practice only. No rights to sign or publish bank items.
 */
(()=>{
'use strict';
const SOURCE='aura_data/knowledge_math6_kntt_volume2_chapter8_review_v1.json';
const KEY='aura_kntt_math6_volume2_ch8_review_v1';
const $=id=>document.getElementById(id);
const state={data:null,answers:Array(6).fill(null),score:null,submitted:false,sourceSha:null};
const text=(id,value)=>{$(id).textContent=String(value)};
const el=(tag,cls='',value)=>{
 const n=document.createElement(tag);if(cls)n.className=cls;
 if(value!==undefined)n.textContent=String(value);return n;
};
function vietnam(x){return Number(x).toString().replace('.',',')}
function segment(){
 const cm=Number($('segmentSlider').value);
 if(!Number.isFinite(cm)||cm<0.5||cm>11.5||cm*2%1!==0)return;
 const x=65+510*cm/12;
 $('segmentM').setAttribute('cx',String(x));
 $('segmentMLabel').setAttribute('x',String(x));
 const m=cm===6;
 $('segmentAM').textContent=vietnam(cm)+' cm';
 $('segmentAM').setAttribute('x',String(65+(x-65)/2));
 $('segmentMB').textContent=vietnam(12-cm)+' cm';
 $('segmentMB').setAttribute('x',String(x+(575-x)/2));
 text('segmentOutput','M nằm giữa A, B. AM = '+vietnam(cm)+' cm, MB = '+
  vietnam(12-cm)+' cm; AM + MB = 12 cm. '+(m?'M là trung điểm vì AM = MB.':'M chưa là trung điểm.'));
}
function angle(){
 const value=Number($('angleSlider').value);
 if(!Number.isInteger(value)||value<0||value>180||value%5!==0)return;
 const rad=value*Math.PI/180,ox=320,oy=229,len=180;
 const x=ox+len*Math.cos(rad),y=oy-len*Math.sin(rad);
 $('angleRay').setAttribute('x2',String(x));
 $('angleRay').setAttribute('y2',String(y));
 $('angleBLabel').setAttribute('x',String(Math.max(8,Math.min(610,x+12))));
 $('angleBLabel').setAttribute('y',String(Math.max(18,y-9)));
 text('angleDegreeLabel',value+'°');
 const r=60,ex=ox+r*Math.cos(rad),ey=oy-r*Math.sin(rad);
 $('angleArc').setAttribute('d',value===0?'':'M '+(ox+r)+' '+oy+' A '+r+' '+r+' 0 0 0 '+ex+' '+ey);
 const classification=value===0?'góc 0° (không thuộc nhóm nhọn, vuông, tù, bẹt)':
  value<90?'góc nhọn':value===90?'góc vuông':value<180?'góc tù':'góc bẹt';
 text('angleOutput','∠AOB = '+value+'° là '+classification+'. Số đo được tạo bằng cách xoay đúng '+value+'°, không suy ra từ độ dài pixel.');
}
function validate(d){
 if(d?.schemaVersion!==1||d.libraryId!=='AURA-KNTT6-MATH-VOLUME2-CHAPTER8-REVIEW'||
  d.parentLibraryId!=='AURA-KNTT6-MATH-VOLUME2'||d.subject!=='TOAN'||
  d.grade!==6||d.volume!==2||d.chapter!==8||
  d.teacherApproved!==false||d.questionBankPromotionEnabled!==false||
  d.weaknessMapWriteEnabled!==false||d.status!=='DRAFT_NEEDS_PEDAGOGICAL_REVIEW'||
  !Array.isArray(d.questions)||d.questions.length!==6)
  throw Error('Nguồn ôn hình học chưa an toàn hoặc sai phạm vi.');
 const allSkills=new Set();
 d.questions.forEach((q,i)=>{
  if(q.id!=='C8-0'+(i+1)||q.requiresPedagogicalReview!==true||
   q.eligibleForQuestionBank!==false||
   typeof q.prompt!=='string'||q.prompt.length<24||
   !Array.isArray(q.choices)||q.choices.length!==4||
   q.choices.some(x=>typeof x!=='string'||!x.trim())||
   new Set(q.choices).size!==4||!Number.isInteger(q.correct)||q.correct<0||q.correct>3||
   typeof q.explanation!=='string'||q.explanation.length<70||
   typeof q.skill!=='string'||!q.skill||
   !Array.isArray(q.sourceLessons)||q.sourceLessons.length!==1||
   q.sourceLessons[0]!==32+i||
   !q.figureFacts||typeof q.figureFacts!=='object')
   throw Error('Câu '+(i+1)+' có dữ kiện chưa đủ hoặc dữ liệu phát hành sai.');
  allSkills.add(q.skill);
 });
 if(allSkills.size!==6)throw Error('Thiếu kỹ năng khác nhau trong sáu bài hình học.');
 const [a,b,c,dq,e,f]=d.questions.map(x=>x.figureFacts);
 if(a.line!=='d'||a.onLine?.join(',')!=='A,B'||a.offLine?.join(',')!=='C'||
    b.collinearOrder?.join(',')!=='X,O,Y'||b.origin!=='O'||
    c.collinearOrder?.join(',')!=='A,M,B'||c.lengthCm?.AM!==5||c.lengthCm?.MB!==7||
    dq.collinearOrder?.join(',')!=='A,M,B'||dq.lengthCm?.AM!==6||dq.lengthCm?.MB!==6||
    e.commonOrigin!=='O'||e.rays?.length!==2||
    f.measureDegrees!==135)
  throw Error('Dữ kiện hình học và câu hỏi chưa khớp hồ sơ kiểm định.');
 return d;
}
async function hash(questions){
 const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(questions)));
 return Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
function loadSaved(){
 try{
  const p=JSON.parse(localStorage.getItem(KEY)||'null');
  if(p?.version===1&&p.libraryId===state.data.libraryId&&p.questionSha256===state.sourceSha&&
   Array.isArray(p.answers)&&p.answers.length===6&&p.answers.every(v=>Number.isInteger(v)&&v>=0&&v<4)&&
   Number.isInteger(p.score)&&p.score>=0&&p.score<=6){
   state.answers=p.answers;state.score=p.score;state.submitted=true;
  }
 }catch(_){/* Only local learning notes; ignore corrupt cache. */}
}
function result(){
 const container=$('geometryReviewResult');container.replaceChildren();
 if(!state.submitted)return;
 container.append(el('strong','','Kết quả ôn hình học: '+state.score+'/6 câu.'));
 const wrong=state.data.questions.filter((q,i)=>state.answers[i]!==q.correct);
 if(wrong.length){
  container.append(el('p','','Các câu cần ôn lại:'));
  const links=el('ul');
  [...new Set(wrong.flatMap(q=>q.sourceLessons))].sort((a,b)=>a-b).forEach(n=>{
   const li=el('li'),a=el('a','','Ôn Bài '+n+' — Hình học cơ bản');
   a.href='knowledge-math6-volume2.html#bai-'+n;li.append(a);links.append(li);
  });container.append(links);
 }else container.append(el('p','','Em đã làm đúng cả sáu câu. Hãy thử lại hoặc tiếp tục bài tiếp theo.'));
 container.append(el('p','','Đây là điểm luyện thử trên trình duyệt, không được ghi vào bảng điểm thi hoặc Weakness Map chính thức.'));
}
function render(){
 if(!state.data)return;
 const container=$('geometryReviewQuestions');container.replaceChildren();
 state.data.questions.forEach((q,i)=>{
  const field=el('fieldset');field.append(el('legend','','Câu '+(i+1)+' · '+q.prompt));
  q.choices.forEach((option,index)=>{
   const label=el('label','geometry-choice'),input=el('input');
   input.type='radio';input.name='gq-'+i;input.value=String(index);
   input.disabled=state.submitted;input.checked=state.answers[i]===index;
   input.addEventListener('change',()=>{state.answers[i]=index});
   label.append(input,el('span','','ABCD'[index]+'. '+option));
   if(state.submitted&&q.correct===index)label.classList.add('correct');
   else if(state.submitted&&state.answers[i]===index)label.classList.add('wrong');
   field.append(label);
  });
  if(state.submitted){
   field.append(el('p','geometry-feedback',
    (state.answers[i]===q.correct?'✓ Chính xác. ':'✕ Chưa đúng. Đáp án dự kiến: '+'ABCD'[q.correct]+'. ')+q.explanation));
  }
  container.append(field);
 });
 $('geometrySubmit').hidden=state.submitted;$('geometryRetry').hidden=!state.submitted;
 result();
}
function persist(){
 try{localStorage.setItem(KEY,JSON.stringify({
  version:1,libraryId:state.data.libraryId,questionSha256:state.sourceSha,
  answers:[...state.answers],score:state.score,completedAt:new Date().toISOString()
 }));return true;}catch(_){return false}
}
function submit(evt){
 evt.preventDefault();
 if(!state.data||state.submitted)return;
 if(state.answers.some(x=>!Number.isInteger(x))){
  $('geometryReviewResult').replaceChildren(el('p','','Trả lời đủ cả 6 câu trước khi nộp bài.'));return;
 }
 state.score=state.data.questions.reduce((n,q,i)=>n+(state.answers[i]===q.correct?1:0),0);
 state.submitted=true;const saved=persist();render();
 if(!saved)$('geometryReviewResult').append(el('p','','Không lưu được điểm học thử trên thiết bị.'));
 $('geometryReviewResult').scrollIntoView({behavior:'smooth',block:'nearest'});
}
async function boot(){
 $('segmentSlider').addEventListener('input',segment);
 $('angleSlider').addEventListener('input',angle);
 segment();angle();
 $('geometryReviewForm').addEventListener('submit',submit);
 $('geometryRetry').addEventListener('click',()=>{
  state.answers=Array(6).fill(null);state.score=null;state.submitted=false;
  try{localStorage.removeItem(KEY)}catch(_){/* no storage */}
  render();
 });
 try{
  if(!crypto?.subtle)throw Error('Thiếu cơ chế kiểm tra SHA phiên bản.');
  const response=await fetch(SOURCE,{cache:'no-store',credentials:'omit'});
  if(!response.ok)throw Error('Không tải được bộ ôn (HTTP '+response.status+').');
  state.data=validate(await response.json());
  state.sourceSha=await hash(state.data.questions);loadSaved();render();
 }catch(error){
  $('geometryReviewQuestions').replaceChildren(el('p','','Chưa thể mở ôn tập: '+String(error?.message||error)));
  $('geometrySubmit').disabled=true;
 }
}
boot();
})();
