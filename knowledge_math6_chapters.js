/* AURA STUDY — five original interactive chapter reviews. Draft, local-only. */
(()=>{
'use strict';
const URL='aura_data/knowledge_math6_kntt_v2_chapter_reviews.json';
const KEY='aura_kntt_math6_v2_chapter_review_v1';
const $=id=>document.getElementById(id);
const NS='http://www.w3.org/2000/svg';
const state={data:null,chapter:1,progress:{},drafts:{},visual:{}};
function el(tag,cls='',text){
 const n=document.createElement(tag);if(cls)n.className=cls;
 if(text!==undefined)n.textContent=String(text);
 return n;
}
function svgEl(tag,attrs={}){
 const n=document.createElementNS(NS,tag);
 Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));
 return n;
}
function btn(text,onClick,cls='',disabled=false){
 const n=el('button',cls,text);n.type='button';n.disabled=disabled;
 n.addEventListener('click',onClick);return n;
}
function validate(data){
 if(!data||data.schemaVersion!==1||data.libraryId!=='AURA-KNTT6-MATH-VOLUME1-CHAPTER-REVIEW'||
  data.parentLibraryId!=='AURA-KNTT6-MATH-VOLUME1'||data.status!=='DRAFT_NEEDS_PEDAGOGICAL_REVIEW'||
  data.teacherApproved!==false||data.questionBankPromotionEnabled!==false||
  data.weaknessMapWriteEnabled!==false||!Array.isArray(data.chapters)||data.chapters.length!==5)
  throw Error('Hồ sơ ôn chương chưa đủ điều kiện an toàn.');
 const ids=new Set(),covered=new Set();let count=0;
 for(const c of data.chapters){
  if(c.number<1||c.number>5||!Array.isArray(c.questions)||c.questions.length!==6||
   typeof c.title!=='string'||c.learningGoal.length<15)throw Error('Chương không hợp lệ.');
  for(const q of c.questions){
   if(!/^C[1-5]-\d{2}$/.test(q.id)||ids.has(q.id)||
    !Array.isArray(q.sourceLessons)||!q.sourceLessons.length||
    q.sourceLessons.some(n=>!Number.isInteger(n)||n<1||n>22)||
    !Array.isArray(q.choices)||q.choices.length!==4||new Set(q.choices).size!==4||
    !Number.isInteger(q.correct)||q.correct<0||q.correct>3||
    typeof q.explanation!=='string'||q.explanation.length<20||
    typeof q.skill!=='string'||!q.skill||
    q.requiresPedagogicalReview!==true||q.eligibleForQuestionBank!==false)
    throw Error('Câu hỏi ôn chương không hợp lệ: '+q.id);
   ids.add(q.id);q.sourceLessons.forEach(n=>covered.add(n));count++;
  }
 }
 if(count!==30||covered.size!==22)throw Error('Thiếu câu hoặc thiếu liên kết tới bài gốc.');
 return data;
}
function loadProgress(){
 try{
  const v=JSON.parse(localStorage.getItem(KEY)||'{}');
  if(v.version===1&&v.libraryId===state.data.libraryId&&v.chapters&&typeof v.chapters==='object')
   state.progress=v.chapters;
 }catch(_){state.progress={};}
}
function record(n){return state.progress[String(n)]||{};}
function save(n,values){
 state.progress[String(n)]={...record(n),...values,updatedAt:new Date().toISOString()};
 try{
  localStorage.setItem(KEY,JSON.stringify({version:1,libraryId:state.data.libraryId,chapters:state.progress}));
  return true;
 }catch(_){return false;}
}
function selectedChapter(){return state.data.chapters.find(c=>c.number===state.chapter);}
function clear(n){n.replaceChildren();}
function menu(){
 const root=$('chapterNav');clear(root);
 for(const c of state.data.chapters){
  const r=record(c.number);
  const b=btn('Chương '+c.number+' · '+c.title.split(' · ')[1],()=>selectChapter(c.number),
   'review-chapter-button'+(state.chapter===c.number?' active':''));
  b.append(el('small','',r.submitted?'Đã luyện: '+r.score+'/6':'6 câu · hoạt động trực quan'));
  b.setAttribute('aria-pressed',String(c.number===state.chapter));
  root.append(b);
 }
 $('doneChapters').textContent=String(state.data.chapters.filter(c=>record(c.number).submitted).length);
}
function selectChapter(n,scroll=true){
 const c=state.data.chapters.find(c=>c.number===Number(n));if(!c)return;
 state.chapter=c.number;
 if(location.hash!=='#chuong-'+c.number)history.replaceState(null,'','#chuong-'+c.number);
 menu();render();
 if(scroll)$('reviewWorkspace').scrollIntoView({behavior:'smooth',block:'start'});
}
function control(label,type,min,max,value,onInput,options){
 const wrap=el('label','visual-control');wrap.append(el('span','',label));
 let input;
 if(type==='select'){
  input=el('select');
  options.forEach(([id,title])=>{const opt=el('option','',title);opt.value=id;input.append(opt);});
  input.value=String(value);
 }else{
  input=el('input');input.type='range';input.min=min;input.max=max;input.step=1;input.value=value;
 }
 input.addEventListener(type==='select'?'change':'input',()=>onInput(input.value));
 wrap.append(input);
 return wrap;
}
function svgRoot(container,viewBox,label){
 const svg=svgEl('svg',{viewBox,role:'img','aria-label':label});
 container.append(svg);return svg;
}
function line(svg,x1,y1,x2,y2,color='#527a9c',width=2){
 svg.append(svgEl('line',{x1,y1,x2,y2,stroke:color,'stroke-width':width}));
}
function dot(svg,x,y,color='#2373bb',r=8){
 svg.append(svgEl('circle',{cx:x,cy:y,r,fill:color,stroke:'#fff','stroke-width':2}));
}
function textSvg(svg,x,y,text,fill='#4d6c89',fontSize=14){
 const n=svgEl('text',{x,y,fill,'font-size':fontSize,'text-anchor':'middle'});
 n.textContent=String(text);svg.append(n);
}
function numberLine(svg,min,max,marks,{y=94,labelEvery=1}={}){
 const left=33,right=723,span=right-left;
 const px=n=>left+(n-min)/(max-min)*span;
 line(svg,left,y,right,y,'#6c8bad',3);
 for(let n=min;n<=max;n++){
  const x=px(n);line(svg,x,y-6,x,y+6,'#a4b9cf',1);
  if(n%labelEvery===0)textSvg(svg,x,y+23,n,'#6c7e91',labelEvery===1?12:11);
 }
 for(const mark of marks){
  const x=px(mark.n);dot(svg,x,y,mark.color||'#2377bf',mark.radius||8);
  if(mark.label)textSvg(svg,x,y-16,mark.label,mark.color||'#2377bf',13);
 }
}
const shapes={
 square:[[-2,-2],[2,-2],[2,2],[-2,2]],
 rectangle:[[-3,-1.5],[3,-1.5],[3,1.5],[-3,1.5]],
 triangle:[[0,-2.5],[2,2],[-2,2]],
 parallelogram:[[-2,-1],[1,-1],[2,1],[-1,1]]
};
function transformShape(points,mode){
 return points.map(([x,y])=>mode==='reflect'?[-x,y]:[-x,-y]);
}
function isSymmetric(points,mode){
 const exact=p=>p[0]+','+p[1];
 const original=new Set(points.map(exact));
 return transformShape(points,mode).every(p=>original.has(exact(p)));
}
function polygon(svg,points,style){
 const pts=points.map(([x,y])=>(200+35*x)+','+(126+35*y)).join(' ');
 svg.append(svgEl('polygon',{points:pts,fill:style.fill,stroke:style.stroke,
  'stroke-width':style.width||3,'stroke-dasharray':style.dash||'none'}));
}
function visualWidget(number,container){
 const outer=el('section','review-visual-card');
 const names={
 1:['Thử di chuyển trên tia số','Kéo thanh để khám phá vị trí, số liền trước và liền sau.'],
 2:['Khám phá bội và dấu hiệu chia hết','Chọn số chia để tô các bội, rồi thử xem một số có chia hết không.'],
 3:['Tính số nguyên trên trục số','Thay đổi hai số và phép tính để nhìn kết quả bên trái/phải 0.'],
 4:['Thử thay đổi diện tích hình chữ nhật','Kéo hai thanh chiều dài và rộng, đếm ô vuông và đối chiếu công thức.'],
 5:['Thử phép đối xứng','Chọn một hình, gấp qua trục dọc hoặc quay 180° xem hai hình có trùng nhau không.']
 };
 outer.append(el('h3','',names[number][0]),el('p','',names[number][1]));
 const controls=el('div','visual-controls'),canvas=el('div','visual-canvas'),result=el('div','visual-result');
 result.setAttribute('role','status');outer.append(controls,canvas,result);container.append(outer);
 const v=state.visual[number]||(
  number===1?{n:5}:number===2?{divisor:3,n:42}:
  number===3?{a:-5,b:8,op:'+'}:
  number===4?{w:6,h:4}:{shape:'rectangle',mode:'reflect'}
 );
 state.visual[number]=v;
 const change=(key,value)=>{
  v[key]=['n','divisor','a','b','w','h'].includes(key)?Number(value):value;
  draw();
 };
 if(number===1)controls.append(control('Số trên tia số: '+v.n,'range',0,15,v.n,x=>{
  change('n',x);controls.firstChild.firstChild.textContent='Số trên tia số: '+v.n;
 }));
 if(number===2){
  controls.append(
   control('Chia hết cho','select',0,0,v.divisor,x=>change('divisor',x),[[2,'2'],[3,'3'],[5,'5'],[9,'9']]),
   control('Số thử: '+v.n,'range',2,60,v.n,x=>{
    change('n',x);controls.lastChild.firstChild.textContent='Số thử: '+v.n;
   })
  );
 }
 if(number===3){
  controls.append(
   control('Số thứ nhất: '+v.a,'range',-9,9,v.a,x=>{
    change('a',x);controls.firstChild.firstChild.textContent='Số thứ nhất: '+v.a;
   }),
   control('Phép tính','select',0,0,v.op,x=>change('op',x),[['+','Cộng (+)'],['-','Trừ (−)']]),
   control('Số thứ hai: '+v.b,'range',-9,9,v.b,x=>{
    change('b',x);controls.lastChild.firstChild.textContent='Số thứ hai: '+v.b;
   })
  );
 }
 if(number===4){
  controls.append(
   control('Chiều dài: '+v.w+' ô','range',2,12,v.w,x=>{
    change('w',x);controls.firstChild.firstChild.textContent='Chiều dài: '+v.w+' ô';
   }),
   control('Chiều rộng: '+v.h+' ô','range',2,8,v.h,x=>{
    change('h',x);controls.lastChild.firstChild.textContent='Chiều rộng: '+v.h+' ô';
   })
  );
 }
 if(number===5){
  controls.append(
   control('Chọn hình','select',0,0,v.shape,x=>change('shape',x),[
    ['square','Hình vuông'],['rectangle','Hình chữ nhật'],
    ['triangle','Tam giác cân'],['parallelogram','Hình bình hành']
   ]),
   control('Phép biến đổi','select',0,0,v.mode,x=>change('mode',x),[
    ['reflect','Gấp theo trục dọc'],['rotate','Quay 180° quanh tâm']
   ])
  );
 }
 function draw(){
  clear(canvas);
  if(number===1){
   const svg=svgRoot(canvas,'0 0 760 145','Tia số từ 0 đến 15. Chấm xanh ở '+v.n);
   numberLine(svg,0,15,[{n:v.n,label:String(v.n)}]);
   result.textContent='Số đang chọn: '+v.n+
    ' · Liền trước trong ℕ: '+(v.n===0?'không có':v.n-1)+' · Liền sau: '+(v.n+1)+'.';
  }else if(number===2){
   const grid=el('div','visual-grid');grid.setAttribute('aria-label','Các số 1 đến 60, màu xanh biểu diễn bội của '+v.divisor);
   for(let n=1;n<=60;n++){
    const cell=el('span','',n);
    if(n%v.divisor===0)cell.classList.add('multiple');
    if(n===v.n)cell.classList.add('focus');
    grid.append(cell);
   }
   canvas.append(grid);
   const rem=v.n%v.divisor;
   result.textContent=v.n+(rem===0?' chia hết cho ':' không chia hết cho ')+v.divisor+
    ' vì '+v.n+' = '+v.divisor+' × '+Math.floor(v.n/v.divisor)+' + '+rem+'.';
  }else if(number===3){
   const answer=v.op==='+'?v.a+v.b:v.a-v.b;
   const svg=svgRoot(canvas,'0 0 760 145','Trục số từ −20 đến 20, hai chấm ở '+v.a+' và '+answer);
   numberLine(svg,-20,20,[{n:v.a,label:'Bắt đầu',color:'#5b8fb5'},
    {n:answer,label:'Kết quả',color:'#cf7543'}],{labelEvery:5});
   result.textContent=v.a+' '+(v.op==='+'?'+':'−')+' ('+v.b+') = '+answer+
    '. Kết quả nằm '+(answer<0?'bên trái':answer>0?'bên phải':'ngay tại')+' 0.';
  }else if(number===4){
   const svg=svgRoot(canvas,'0 0 410 280','Hình chữ nhật '+v.w+' ô theo chiều dài và '+v.h+' ô theo chiều rộng');
   const cellSize=Math.min(27,245/Math.max(v.w,v.h)),startX=38,startY=25;
   for(let row=0;row<v.h;row++)for(let col=0;col<v.w;col++)
    svg.append(svgEl('rect',{x:startX+col*cellSize,y:startY+row*cellSize,
      width:cellSize,height:cellSize,fill:'#c5e2fb',stroke:'#4282b3','stroke-width':1}));
   textSvg(svg,38+v.w*cellSize/2,20,v.w+' ô','#285f95',14);
   textSvg(svg,38+v.w*cellSize+23,30+v.h*cellSize/2,v.h+' ô','#285f95',12);
   result.textContent='Diện tích: '+v.w+' × '+v.h+' = '+(v.w*v.h)+
    ' ô vuông. Chu vi: 2 × ('+v.w+' + '+v.h+') = '+(2*(v.w+v.h))+' đơn vị.';
  }else if(number===5){
   const svg=svgRoot(canvas,'0 0 400 255','Hình trước và sau biến đổi đối xứng');
   line(svg,200,8,200,246,'#7c94ac',1.8);
   line(svg,15,126,385,126,'#e2eaf2',1);
   const points=shapes[v.shape],mapped=transformShape(points,v.mode);
   polygon(svg,points,{fill:'#b3daf96b',stroke:'#2175b8',width:3});
   polygon(svg,mapped,{fill:'#fbd8b64d',stroke:'#b35e23',width:3,dash:'7,5'});
   dot(svg,200,126,'#5a708a',5);
   const success=isSymmetric(points,v.mode);
   result.textContent=(success?'✓ Hai hình trùng nhau. ':'✕ Hai hình chưa trùng nhau. ')+
    (v.mode==='reflect'?'Đường dọc là '+(success?'một trục đối xứng.':'không phải trục đối xứng của hình này.') :
    'Giao điểm ở giữa '+(success?'là tâm đối xứng.':'không phải tâm đối xứng cho hình này.'));
  }
 }
 draw();
}
function renderQuiz(number,root){
 const chapter=selectedChapter(),rec=record(number),done=!!rec.submitted;
 const questions=chapter.questions;
 if(!state.drafts[number])state.drafts[number]=Array(questions.length).fill(null);
 const choices=done&&Array.isArray(rec.answers)?rec.answers:state.drafts[number];
 const box=el('section','review-questions');
 box.append(el('h3','','Bài ôn cuối chương · '+questions.length+' câu'));
 box.append(el('p','review-note','Đây là bài luyện AURA tạo mới, không phải đề kiểm tra chính thức.'));
 const form=el('form','quiz-form');
 form.addEventListener('submit',ev=>{
  ev.preventDefault();
  const picked=state.drafts[number];
  if(picked.some(n=>!Number.isInteger(n))){
   $('chapterNotice').textContent='Em cần chọn đủ '+questions.length+' đáp án.';return;
  }
  let score=0;const missed=[];
  questions.forEach((q,i)=>{
   if(picked[i]===q.correct)score++;
   else missed.push({questionId:q.id,skill:q.skill,sourceLessons:q.sourceLessons});
  });
  if(!save(number,{submitted:true,score,answers:[...picked],missed})){
   $('chapterNotice').textContent='Trình duyệt không lưu được kết quả.';return;
  }
  menu();render();$('chapterResult')?.scrollIntoView({behavior:'smooth',block:'center'});
 });
 questions.forEach((q,i)=>{
  const f=el('fieldset','quiz-card');f.append(el('legend','quiz-legend','Câu '+(i+1)+' · '+q.prompt));
  q.choices.forEach((answer,index)=>{
   const label=el('label','quiz-option');
   const input=el('input');
   input.type='radio';input.name='review-q-'+i;input.value=String(index);
   input.checked=choices[i]===index;input.disabled=done;
   input.addEventListener('change',()=>{state.drafts[number][i]=index;});
   label.append(input,el('span','',String.fromCharCode(65+index)+'. '+answer));
   if(done&&index===q.correct)label.classList.add('correct');
   else if(done&&index===choices[i])label.classList.add('wrong');
   f.append(label);
  });
  if(done){
   f.append(el('p','quiz-feedback',(choices[i]===q.correct?'✓ Đúng. ':'✕ Chưa đúng. ')+
    'Đáp án: '+String.fromCharCode(65+q.correct)+'. '+q.explanation));
  }
  form.append(f);
 });
 if(done){
  const summary=el('section','review-summary');summary.id='chapterResult';
  summary.append(el('strong','','Kết quả ôn chương '+number+': '+rec.score+'/'+questions.length));
  summary.append(el('p','','Đây là phản hồi tự học, chưa ghi vào Weakness Map hoặc điểm kiểm tra chính thức.'));
  if(Array.isArray(rec.missed)&&rec.missed.length){
   const remediation=el('div','review-remediation');
   remediation.append(el('strong','','Gợi ý ôn lại kỹ năng còn sai'));
   const numbers=new Set(rec.missed.flatMap(x=>x.sourceLessons));
   [...numbers].sort((a,b)=>a-b).forEach(n=>{
    const link=el('a','','Ôn lại Bài '+n);
    link.href='knowledge-math6-v2.html#bai-'+n;
    remediation.append(link);
   });
   summary.append(remediation);
  }else summary.append(el('p','','Đã trả lời đúng 6/6. Có thể thử chương tiếp theo.'));
  form.append(summary);
  form.append(btn('Luyện lại chương '+number,()=>{
   delete state.drafts[number];if(save(number,{submitted:false,answers:[],score:null,missed:[]})){menu();render();}
  },'retry-button'));
 }else{
  const submit=el('button','submit-button','Nộp bài & xem giải thích');submit.type='submit';form.append(submit);
 }
 const notice=el('p','quiz-notice');notice.id='chapterNotice';notice.setAttribute('role','status');
 form.append(notice);box.append(form);root.append(box);
}
function render(){
 const c=selectedChapter();if(!c)return;
 $('reviewBreadcrumb').textContent='Toán 6 · Tập 1 · Chương '+c.number+'/5';
 const r=record(c.number);
 $('reviewStatus').textContent=r.submitted?'Đã luyện '+r.score+'/6':'Chưa luyện';
 const root=$('reviewContent');clear(root);
 const intro=el('div','review-heading');
 intro.append(el('p','eyebrow','CHƯƠNG '+c.number),el('h2','',c.title),el('p','',c.learningGoal));
 root.append(intro);
 visualWidget(c.number,root);
 renderQuiz(c.number,root);
 const actions=el('div','review-actions');
 actions.append(btn('← Chương trước',()=>selectChapter(c.number-1),'',c.number===1));
 actions.append(btn('Chương tiếp →',()=>selectChapter(c.number+1),'primary',c.number===5));
 root.append(actions);
}
async function boot(){
 try{
  const response=await fetch(URL,{cache:'no-store'});
  if(!response.ok)throw Error('Không tải được nguồn ôn tập HTTP '+response.status);
  state.data=validate(await response.json());loadProgress();
  const hash=/^#chuong-([1-5])$/.exec(location.hash);
  if(hash)state.chapter=Number(hash[1]);
  window.addEventListener('hashchange',()=>{
   const h=/^#chuong-([1-5])$/.exec(location.hash);
   if(h)selectChapter(Number(h[1]),false);
  });
  $('totalChapters').textContent=String(state.data.chapters.length);
  $('totalQuestions').textContent=String(state.data.chapters.reduce((n,c)=>n+c.questions.length,0));
  menu();render();
 }catch(error){
  clear($('reviewContent'));
  $('reviewContent').append(el('p','review-empty','Không mở được bộ ôn tập vì kiểm tra nguồn thất bại: '+String(error?.message||error)));
 }
}
boot();
})();