/* AURA STUDY — formative ChVI/IX Math6 reviews. No official publishing or grading writes. */
(()=>{
'use strict';
const chapter=Number(document.body.dataset.chapter);
const source={6:'aura_data/knowledge_math6_kntt_volume2_chapter6_review_v1.json',
 9:'aura_data/knowledge_math6_kntt_volume2_chapter9_review_v1.json'};
const key='aura_kntt_math6_volume2_ch'+chapter+'_review_v1';
const state={data:null,answers:Array(6).fill(null),submitted:false,score:null,sha:null};
const $=id=>document.getElementById(id);
const el=(tag,cls='',value)=>{const n=document.createElement(tag);if(cls)n.className=cls;
 if(value!==undefined)n.textContent=String(value);return n;};
const vi=n=>Number(n).toString().replace('.',',');
function validate(d){
 if(![6,9].includes(chapter)||d?.schemaVersion!==1||
  d.libraryId!=='AURA-KNTT6-MATH-VOLUME2-CHAPTER'+chapter+'-REVIEW'||
  d.parentLibraryId!=='AURA-KNTT6-MATH-VOLUME2'||d.subject!=='TOAN'||
  d.grade!==6||d.volume!==2||d.chapter!==chapter||
  d.status!=='DRAFT_NEEDS_PEDAGOGICAL_REVIEW'||d.teacherApproved!==false||
  d.questionBankPromotionEnabled!==false||d.weaknessMapWriteEnabled!==false||
  !Array.isArray(d.questions)||d.questions.length!==6)
  throw Error('Nguồn bài ôn không hợp lệ hoặc chưa đủ điều kiện xem.');
 const seen=new Set(),lessons=new Set();
 for(let i=0;i<6;i++){
  const q=d.questions[i];
  if(q?.id!=='C'+chapter+'-0'+(i+1)||seen.has(q.id)||
   typeof q.prompt!=='string'||q.prompt.length<18||
   !Array.isArray(q.choices)||q.choices.length!==4||
   q.choices.some(x=>typeof x!=='string'||!x)||new Set(q.choices).size!==4||
   !Number.isInteger(q.correct)||q.correct<0||q.correct>3||
   typeof q.explanation!=='string'||q.explanation.length<55||
   typeof q.skill!=='string'||q.skill.length<5||
   q.eligibleForQuestionBank!==false||q.requiresPedagogicalReview!==true||
   !Array.isArray(q.sourceLessons)||q.sourceLessons.length!==1||
   q.sourceLessons.some(n=>!Number.isInteger(n)||n<(chapter===6?23:38)||
     n>(chapter===6?27:43)))
   throw Error('Câu ôn chưa đủ thông tin ở vị trí '+(i+1));
  if(chapter===9&&(!q.datasetFacts||typeof q.datasetFacts!=='object'))
   throw Error('Thiếu dữ kiện nguồn thống kê.');
  q.sourceLessons.forEach(x=>lessons.add(x));seen.add(q.id);
 }
 if(lessons.size!==(chapter===6?5:6))
  throw Error('Bộ ôn chưa bao phủ đủ bài học.');
 return d;
}
async function fingerprint(items){
 const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(items)));
 return Array.from(new Uint8Array(h)).map(n=>n.toString(16).padStart(2,'0')).join('');
}
function loadCache(){
 try{
  const p=JSON.parse(localStorage.getItem(key)||'null');
  if(p?.version===1&&p.libraryId===state.data.libraryId&&p.questionSha256===state.sha&&
   Array.isArray(p.answers)&&p.answers.length===6&&
   p.answers.every(n=>Number.isInteger(n)&&n>=0&&n<4)&&
   Number.isInteger(p.score)&&p.score>=0&&p.score<=6){
   state.answers=p.answers;state.score=p.score;state.submitted=true;
  }
 }catch(_){/* Browser-only self-learning note */ }
}
function result(){
 const box=$('extraResult');box.replaceChildren();
 if(!state.submitted)return;
 box.append(el('strong','','Kết quả tự ôn Chương '+chapter+': '+state.score+'/6 câu.'));
 const wrong=state.data.questions.filter((q,i)=>q.correct!==state.answers[i]);
 if(wrong.length){
  box.append(el('p','','Những bài nên học lại:'));
  const ul=el('ul');
  [...new Set(wrong.flatMap(q=>q.sourceLessons))].sort((a,b)=>a-b).forEach(n=>{
   const li=el('li'),a=el('a','','Ôn lại Bài '+n);
   a.href='knowledge-math6-volume2.html#bai-'+n;li.append(a);ul.append(li);
  });box.append(ul);
 }else box.append(el('p','','Đúng cả sáu câu. Em có thể làm lại hoặc tiếp tục ôn các chương khác.'));
 box.append(el('p','','Đây là bài tự luyện trên thiết bị, chưa phải kết quả thi chính thức.'));
}
function render(){
 if(!state.data)return;
 const box=$('extraQuestions');box.replaceChildren();
 state.data.questions.forEach((q,i)=>{
  const field=el('fieldset');field.append(el('legend','','Câu '+(i+1)+' · '+q.prompt));
  q.choices.forEach((option,j)=>{
   const label=el('label','statistics-option'),input=el('input');
   input.type='radio';input.name='q-'+i;input.value=String(j);
   input.checked=state.answers[i]===j;input.disabled=state.submitted;
   input.addEventListener('change',()=>state.answers[i]=j);
   label.append(input,el('span','','ABCD'[j]+'. '+option));
   if(state.submitted&&j===q.correct)label.classList.add('correct');
   else if(state.submitted&&j===state.answers[i])label.classList.add('wrong');
   field.append(label);
  });
  if(state.submitted)field.append(el('p','statistics-feedback',
   (state.answers[i]===q.correct?'✓ Đúng. ':'✕ Sai. Đáp án AURA dự kiến: '+'ABCD'[q.correct]+'. ')+q.explanation));
  box.append(field);
 });
 $('extraSubmit').hidden=state.submitted;$('extraRetry').hidden=!state.submitted;
 result();
}
function submit(evt){
 evt.preventDefault();
 if(!state.data||state.submitted)return;
 if(state.answers.some(x=>!Number.isInteger(x))){
  $('extraResult').replaceChildren(el('p','','Vui lòng trả lời đủ 6 câu trước khi nộp.'));return;
 }
 state.score=state.data.questions.reduce((n,q,i)=>n+(q.correct===state.answers[i]?1:0),0);
 state.submitted=true;
 try{localStorage.setItem(key,JSON.stringify({
  version:1,libraryId:state.data.libraryId,questionSha256:state.sha,
  answers:[...state.answers],score:state.score,completedAt:new Date().toISOString()
 }));}catch(_){/* Device may deny local storage. */}
 render();
 $('extraResult').scrollIntoView({behavior:'smooth',block:'nearest'});
}
const NS='http://www.w3.org/2000/svg';
function svgEl(tag,attrs={},value){
 const node=document.createElementNS(NS,tag);
 Object.entries(attrs).forEach(([k,v])=>node.setAttribute(k,String(v)));
 if(value!==undefined)node.textContent=String(value);
 return node;
}
function bars(){
 const v=Number($('fruitCamSlider').value);
 if(!Number.isInteger(v)||v<0||v>12)return;
 const box=$('fruitChart');box.replaceChildren();
 const svg=svgEl('svg',{viewBox:'0 0 650 275',role:'img',
  'aria-label':'Cột Táo 6, Cam '+v+', Chuối 5 bạn; biểu đồ mô phỏng thay đổi nhóm Cam.'});
 svg.append(svgEl('line',{x1:70,y1:220,x2:590,y2:220,stroke:'#607e94','stroke-width':2}));
 const vals=[6,v,5],cats=['Táo','Cam','Chuối'];
 vals.forEach((n,i)=>{
  const x=145+i*150,h=n*14;
  svg.append(svgEl('rect',{x,y:220-h,width:66,height:h,rx:5,fill:'#2e82a6'}));
  svg.append(svgEl('text',{x:x+33,y:210-h,'text-anchor':'middle',fill:'#225c7b'},String(n)));
  svg.append(svgEl('text',{x:x+33,y:249,'text-anchor':'middle',fill:'#225c7b'},cats[i]));
 });box.append(svg);
 $('fruitOutput').textContent='Dữ liệu mô phỏng: Táo 6, Cam '+v+', Chuối 5 (bạn). Tổng = '+(11+v)+
  ' bạn; Cam nhiều hơn Chuối '+(v-5)+' bạn (nếu âm nghĩa là ít hơn).';
}
// Stable deterministic pseudo-experiment for reproducible instruction, NOT a true physical coin.
function coin(){
 const n=Number($('coinTrialsSlider').value);
 if(!Number.isInteger(n)||n<10||n>100||n%10!==0)return;
 let seed=43125,heads=0;
 for(let i=0;i<n;i++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  if(seed%2===0)heads++;
 }
 const tails=n-heads;
 const headP=Math.round(heads/n*1000)/10;
 const tailP=Math.round(tails/n*1000)/10;
 const box=$('coinChart');box.replaceChildren();
 const svg=svgEl('svg',{viewBox:'0 0 650 270',role:'img',
  'aria-label':'Mô phỏng '+n+' lượt tung đồng xu: ngửa '+heads+', sấp '+tails});
 svg.append(svgEl('line',{x1:125,y1:222,x2:530,y2:222,stroke:'#607e94','stroke-width':2}));
 const max=n,val=[heads,tails],labels=['Ngửa','Sấp'];
 val.forEach((k,i)=>{
  const h=k/max*150,x=218+i*195;
  svg.append(svgEl('rect',{x,y:222-h,width:84,height:h,rx:5,fill:i?'#dfa04b':'#2e82a6'}));
  svg.append(svgEl('text',{x:x+42,y:210-h,'text-anchor':'middle',fill:'#225c7b'},String(k)));
  svg.append(svgEl('text',{x:x+42,y:252,'text-anchor':'middle',fill:'#225c7b'},labels[i]));
 });box.append(svg);
 $('coinOutput').textContent='Mô phỏng '+n+' lượt: Ngửa '+heads+'/'+n+' ≈ '+vi(headP)+
  '%; Sấp '+tails+'/'+n+' ≈ '+vi(tailP)+
  '%. Đây là tần suất của mẫu mô phỏng, không dự đoán chắc chắn lượt tiếp theo.';
}
async function boot(){
 if(chapter===9){
  $('fruitCamSlider').addEventListener('input',bars);
  $('coinTrialsSlider').addEventListener('input',coin);
  bars();coin();
 }
 $('extraQuizForm').addEventListener('submit',submit);
 $('extraRetry').addEventListener('click',()=>{
  state.answers=Array(6).fill(null);state.score=null;state.submitted=false;
  try{localStorage.removeItem(key)}catch(_){}
  render();
 });
 try{
  if(!source[chapter]||!crypto?.subtle)throw Error('Chương hoặc WebCrypto không hợp lệ.');
  const response=await fetch(source[chapter],{cache:'no-store',credentials:'omit'});
  if(!response.ok)throw Error('Không nạp được nguồn (HTTP '+response.status+').');
  state.data=validate(await response.json());state.sha=await fingerprint(state.data.questions);
  loadCache();render();
 }catch(error){
  $('extraQuestions').replaceChildren(el('p','','Không thể tải bài ôn: '+String(error?.message||error)));
  $('extraSubmit').disabled=true;
 }
}
boot();
})();
