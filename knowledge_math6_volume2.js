/* AURA STUDY Math6 Tập 2 — isolated partial draft; not Exam Engine / Question Bank grading. */
(()=>{
'use strict';
const DATA_URL='aura_data/knowledge_math6_kntt_volume2_v1.json';
const STORAGE_KEY='aura_kntt_math6_volume2_progress_v1';
const $=id=>document.getElementById(id);
const state={data:null,chapter:6,selected:23,search:'',drafts:{},progress:{}};
function el(tag,cls='',content){
 const e=document.createElement(tag);if(cls)e.className=cls;
 if(content!==undefined)e.textContent=String(content);return e;
}
function btn(label,fn,cls='',disabled=false){
 const b=el('button',cls,label);b.type='button';b.disabled=disabled;b.addEventListener('click',fn);return b;
}
function validate(d){
 if(!d||d.schemaVersion!==1||d.libraryId!=='AURA-KNTT6-MATH-VOLUME2'||
  d.rollout?.status!=='DRAFT_PREVIEW_PARTIAL'||d.rollout?.teacherReviewed!==false||d.rollout?.weaknessMapWriteEnabled!==false||d.rollout?.questionBankPromotionEnabled!==false||
  d.rollout?.examEngineLinkEnabled!==false||!Array.isArray(d.chapters)||d.chapters.length!==4||
  !Array.isArray(d.lessons)||d.lessons.length!==21)throw Error('Kho bài học chưa hợp lệ hoặc chưa an toàn.');
 const ids=new Set(),nums=new Set(),chapters=new Set(d.chapters.map(c=>c.number));
 if(d.chapters.find(c=>c.number===8)?.status!=='DRAFT_CONTENT_IN_PROGRESS'||
    d.chapters.find(c=>c.number===9)?.status!=='DRAFT_CONTENT_IN_PROGRESS'||
    d.chapters.find(c=>c.number===6)?.status!=='DRAFT_CONTENT_IN_PROGRESS'||
    d.chapters.find(c=>c.number===7)?.status!=='DRAFT_CONTENT_IN_PROGRESS'||
    d.outline?.some((o,i)=>o.number!==i+23||o.authored!==true))
    throw Error('Chương chưa biên soạn hoặc số bài không đúng phiên bản.');
 if(chapters.size!==4||d.chapters.some(c=>!Array.isArray(c.range)||c.range.length!==2))
  throw Error('Danh mục chương không hợp lệ.');
 let count=0;
 d.lessons.forEach(l=>{
  if(!/^KNTT6-MATH-V2-\d{2}$/.test(l.id)||ids.has(l.id)||nums.has(l.number)||
   l.number<23||l.number>43||!chapters.has(l.chapter)||
   !d.chapters.some(c=>c.number===l.chapter&&l.number>=c.range[0]&&l.number<=c.range[1])||
   l.status!=='DRAFT_ORIGINAL_AURA'||l.readyForQuestionBank!==false||
   l.requiresPedagogicalReview!==true||typeof l.title!=='string'||l.title.trim().length<3||
   !Array.isArray(l.objectives)||l.objectives.length<2||
   !Array.isArray(l.concepts)||l.concepts.length<2||
   !Array.isArray(l.workedExample?.steps)||l.workedExample.steps.length<2||
   typeof l.commonMistake!=='string'||l.commonMistake.length<10||
   !Array.isArray(l.practice)||l.practice.length!==3||
   (l.chapter===8&&(!l.geometryModel||
    !['line-membership','opposite-rays','segment-length','midpoint','angle-definition','angle-measure'].includes(l.geometryModel.kind)||
    typeof l.geometryModel.caption!=='string'||l.geometryModel.caption.length<25)))
   throw Error('Bài '+l.number+' thiếu nội dung hoặc sai trạng thái.');
  l.practice.forEach(q=>{
   if(typeof q.prompt!=='string'||q.prompt.length<8||
    !Array.isArray(q.choices)||q.choices.length!==4||
    q.choices.some(x=>typeof x!=='string'||!x)||
    new Set(q.choices).size!==4||!Number.isInteger(q.correct)||q.correct<0||q.correct>3||
    typeof q.explanation!=='string'||q.explanation.length<8||
    typeof q.skill!=='string'||!q.skill)throw Error('Câu luyện tập chưa hợp lệ.');
   count++;
  });ids.add(l.id);nums.add(l.number);
 });
 if(count!==63||d.authoredLessonCount!==21||d.authoredPracticeCount!==63||d.expectedTotalLessons!==21||d.expectedTotalChapters!==4||d.outline?.length!==21||d.outline.filter(x=>x.authored).length!==15)
  throw Error('Số lượng bài và câu hỏi không khớp.');
 return d;
}
function loadProgress(){
 try{
  const v=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
  if(v.version===1&&v.libraryId===state.data.libraryId&&v.lessons&&
   typeof v.lessons==='object'&&!Array.isArray(v.lessons))state.progress=v.lessons;
 }catch(_){state.progress={};}
}
function save(n,updates){
 state.progress['bai-'+n]={...record(n),...updates,updatedAt:new Date().toISOString()};
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify({
  version:1,libraryId:state.data.libraryId,lessons:state.progress
 }));return true;}catch(_){return false;}
}
const record=n=>state.progress['bai-'+n]||{};
const lesson=n=>state.data.lessons.find(l=>l.number===n);
const chapter=n=>state.data.chapters.find(c=>c.number===n);
const progress=l=>{
 const r=record(l.number);
 return r.submitted?'Đã luyện '+r.score+'/3':r.read?'Đã học lý thuyết':'Chưa học';
};
function select(n,scroll=true){
 const l=lesson(Number(n));if(!l)return;
 state.selected=l.number;state.chapter=l.chapter;
 if(location.hash!=='#bai-'+l.number)history.replaceState(null,'','#bai-'+l.number);
 render();
 if(scroll)$('lessonContent').scrollIntoView({behavior:'smooth',block:'start'});
}
function menu(){
 const chapters=$('chapterList');chapters.replaceChildren();
 state.data.chapters.forEach(c=>{
  const available=state.data.lessons.some(l=>l.chapter===c.number);
  const b=btn('Chương '+c.number+' · '+c.title+(available?'':' · Chưa có bài'),()=>{
   if(!available)return;
   state.search='';$('lessonSearch').value='';select(c.range[0],false);
  },'chapter-button'+(state.chapter===c.number?' active':''),!available);
  b.setAttribute('aria-pressed',String(state.chapter===c.number));
  b.append(el('small','','Bài '+c.range[0]+'–'+c.range[1]));chapters.append(b);
 });
 const list=$('lessonList');list.replaceChildren();
 const search=state.search.trim().toLocaleLowerCase('vi');
 const found=state.data.lessons.filter(l=>search?
  ('Bài '+l.number+' '+l.title+' '+chapter(l.chapter).title).toLocaleLowerCase('vi').includes(search):
  l.chapter===state.chapter);
 if(!found.length){list.append(el('p','empty-search','Không có bài phù hợp.'));return;}
 found.forEach(l=>{
  const b=btn('Bài '+l.number+' · '+l.title,()=>select(l.number),
   'lesson-button'+(l.number===state.selected?' active':''));
  b.dataset.lesson=String(l.number);
  b.setAttribute('aria-current',l.number===state.selected?'page':'false');
  b.append(el('small','',progress(l)));list.append(b);
 });
}
function section(root,title,cls='knowledge-section'){
 const s=el('section',cls);s.append(el('h3','section-title',title));root.append(s);return s;
}
function renderTheory(root,l){
 let s=section(root,'Mục tiêu học tập');
 const ul=el('ul');l.objectives.forEach(t=>ul.append(el('li','',t)));s.append(ul);
 s=section(root,'Kiến thức trọng tâm');
 l.concepts.forEach((c,i)=>{
  const x=el('div','concept');
  x.append(el('span','concept-index',String(i+1).padStart(2,'0')));
  const body=el('div');body.append(el('h4','',c.heading),el('p','',c.body));x.append(body);s.append(x);
 });
 if(l.chapter===8&&l.geometryModel){
  const figureSection=section(root,'Hình minh họa hình học AURA tự dựng');
  if(typeof window.auraMath6DrawGeometry!=='function'||
    window.auraMath6DrawGeometry(figureSection,l.geometryModel)!==true){
    figureSection.append(el('p','error-state','Không thể dựng hình. Dữ liệu minh họa cần được kiểm tra.'));
  }
 }
 s=section(root,'Ví dụ có hướng dẫn','knowledge-section worked-example');
 s.append(el('p','example-question',l.workedExample.prompt));
 const steps=el('ol','worked-steps');
 l.workedExample.steps.forEach(t=>steps.append(el('li','',t)));
 s.append(steps,el('p','example-answer','Kết luận: '+l.workedExample.conclusion));
 const warning=el('section','common-mistake');
 warning.append(el('strong','','Lỗi dễ mắc'),el('p','',l.commonMistake));root.append(warning);
 const action=el('div','read-actions');
 action.append(btn(record(l.number).read?'✓ Đã học lý thuyết':'Đánh dấu đã học lý thuyết',()=>{
  if(save(l.number,{read:!record(l.number).read}))render();
  else alert('Không lưu được tiến độ trên trình duyệt này.');
 },'read-toggle'));
 action.append(el('small','','Đây là tự đánh dấu học tập, chưa phải chứng nhận đánh giá.'));root.append(action);
}
function renderQuiz(root,l){
 const s=section(root,'Luyện tập nhanh · 3 câu','practice-section');
 s.append(el('p','practice-intro','Câu hỏi mới do AURA soạn, không lấy nguyên văn SGK. Kết quả không đưa vào Exam Engine.'));
 const r=record(l.number),submitted=!!r.submitted;
 if(!state.drafts[l.number])state.drafts[l.number]=[null,null,null];
 const answers=submitted&&Array.isArray(r.answers)?r.answers:state.drafts[l.number];
 const form=el('form','quiz-form');
 form.addEventListener('submit',e=>{
  e.preventDefault();const picks=state.drafts[l.number];
  const notice=$('quizNotice');
  if(picks.some(x=>!Number.isInteger(x))){notice.textContent='Hãy trả lời đủ 3 câu trước khi nộp.';return;}
  let score=0;l.practice.forEach((q,i)=>{if(picks[i]===q.correct)score++;});
  if(!save(l.number,{answers:[...picks],score,submitted:true})){
   notice.textContent='Không lưu được kết quả trên thiết bị.';return;
  }
  render();$('quizResult')?.scrollIntoView({behavior:'smooth',block:'center'});
 });
 l.practice.forEach((q,i)=>{
  const f=el('fieldset','quiz-card');
  f.append(el('legend','quiz-legend','Câu '+(i+1)+' · '+q.prompt));
  q.choices.forEach((choice,k)=>{
   const wrap=el('label','quiz-option');const input=el('input');
   input.type='radio';input.name='question-'+i;input.value=String(k);
   input.checked=answers[i]===k;input.disabled=submitted;
   input.addEventListener('change',()=>{
    state.drafts[l.number][i]=k;
   });
   wrap.append(input,el('span','',String.fromCharCode(65+k)+'. '+choice));
   if(submitted&&k===q.correct)wrap.classList.add('correct');
   else if(submitted&&k===answers[i])wrap.classList.add('wrong');
   f.append(wrap);
  });
  if(submitted)f.append(el('p','quiz-feedback',
   (answers[i]===q.correct?'✓ Đúng. ':'✕ Chưa đúng. Đáp án đúng: '+String.fromCharCode(65+q.correct)+'. ')+q.explanation));
  form.append(f);
 });
 if(submitted){
  const result=el('div','quiz-result');result.id='quizResult';
  result.append(el('strong','','Kết quả luyện tập: '+r.score+'/3 câu'));
  result.append(el('p','',r.score===3?'Đúng cả 3 câu. Em có thể tiếp tục bài mới.':
   'Em xem giải thích, ôn kiến thức rồi làm lại nếu muốn.'));
  result.append(btn('Làm lại 3 câu',()=>{
   delete state.drafts[l.number];
   if(save(l.number,{answers:[],score:null,submitted:false}))render();
  },'retry-button'));
  form.append(result);
 }else{
  const submit=el('button','submit-button','Nộp bài & xem giải thích');submit.type='submit';
  form.append(submit);
 }
 const notice=el('p','quiz-notice');notice.id='quizNotice';notice.setAttribute('role','status');
 form.append(notice);s.append(form);
}
function content(){
 const l=lesson(state.selected),root=$('lessonContent');root.replaceChildren();
 $('lessonBreadcrumb').textContent='Chương '+l.chapter+' · Bài '+l.number+' / 43 · Tập 2 đang hoàn thiện';
 $('lessonProgressBadge').textContent=progress(l);
 const hero=el('div','lesson-title');
 hero.append(el('p','lesson-mini','TOÁN 6 · TẬP 2 · BÀI '+l.number),el('h2','',l.title),
  el('p','lesson-subtitle',chapter(l.chapter).title));
 root.append(hero,el('p','lesson-draft','Bài do AURA biên soạn · Bản nháp cần kiểm định sư phạm · Không dùng cho đề thi chính thức.'));
 renderTheory(root,l);renderQuiz(root,l);
 const pager=$('lessonPager');pager.replaceChildren();
 pager.append(btn('← Bài trước',()=>select(state.selected-1),'pager-button',state.selected===23));
 pager.append(el('span','','Bài '+state.selected+' / 43'));
 pager.append(btn('Bài tiếp →',()=>select(state.selected+1),'pager-button primary',state.selected===43));
}
function render(){
 if(!state.data)return;
 $('countChapters').textContent=String(state.data.chapters.length);
 $('countLessons').textContent=String(state.data.lessons.length);
 $('countQuestions').textContent=String(state.data.lessons.reduce((s,l)=>s+l.practice.length,0));
 $('countCompleted').textContent=String(state.data.lessons.filter(l=>record(l.number).submitted).length);
 menu();content();
}
async function boot(){
 try{
  const response=await fetch(DATA_URL,{cache:'no-store'});
  if(!response.ok)throw Error('Không tải được dữ liệu (HTTP '+response.status+').');
  state.data=validate(await response.json());loadProgress();
  const hash=/^#bai-(\d{1,2})$/.exec(location.hash);
  if(hash&&lesson(Number(hash[1]))){state.selected=Number(hash[1]);state.chapter=lesson(state.selected).chapter;}
  $('lessonSearch').addEventListener('input',e=>{state.search=e.target.value;menu();});
  window.addEventListener('hashchange',()=>{
   const match=/^#bai-(\d{1,2})$/.exec(location.hash);
   if(match&&lesson(Number(match[1])))select(Number(match[1]),false);
  });
  render();
 }catch(err){
  const root=$('lessonContent');root.replaceChildren();
  root.append(el('p','error-state','Không thể mở Thư viện Toán 6 Tập 2: '+String(err?.message||err)+
    '. Chưa hiển thị dữ liệu vì kiểm tra an toàn không đạt.'));
 }
}
boot();
})();