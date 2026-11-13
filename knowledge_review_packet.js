/* AURA STUDY — source-derived educator review packet (NOT AN APPROVAL).
 * In-memory exception editing; exported review notes have no publishing authority.
 */
(()=>{
'use strict';
const SOURCE_LESSONS='aura_data/knowledge_math6_kntt_volume1_v2.json';
const SOURCE_REVIEWS='aura_data/knowledge_math6_kntt_v2_chapter_reviews.json';
const $=id=>document.getElementById(id);
const state={items:[],chapters:[],sha:{},exceptions:new Map(),loaded:false};
function node(tag,cls='',txt){
 const n=document.createElement(tag);if(cls)n.className=cls;
 if(txt!==undefined)n.textContent=String(txt);return n;
}
function choiceLetter(n){return String.fromCharCode(65+n)}
async function resource(path){
 const r=await fetch(path,{cache:'no-store',credentials:'omit'});
 if(!r.ok)throw Error('Không tải được tài liệu nguồn '+path+' (HTTP '+r.status+').');
 const raw=await r.text();
 return {raw,data:JSON.parse(raw)};
}
async function sha(raw){
 if(!globalThis.crypto?.subtle)throw Error('WebCrypto SHA-256 không khả dụng. Không thể bảo đảm phiên bản nguồn.');
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));
 return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function validQ(q,id){
 return q&&typeof q.prompt==='string'&&q.prompt.trim().length>=8
 &&Array.isArray(q.choices)&&q.choices.length===4
 &&q.choices.every(x=>typeof x==='string'&&x.trim().length)
 &&new Set(q.choices).size===4
 &&Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4
 &&typeof q.explanation==='string'&&q.explanation.trim().length>=20
 &&typeof q.skill==='string'&&q.skill.trim().length>=3;
}
function catalog(lessons,reviews){
 if(lessons?.schemaVersion!==2||lessons?.libraryId!=='AURA-KNTT6-MATH-VOLUME1'
  ||lessons.rollout?.questionBankPromotionEnabled!==false
  ||lessons.rollout?.teacherReviewed!==false||!Array.isArray(lessons.lessons)
  ||lessons.lessons.length!==22||!Array.isArray(lessons.chapters)||lessons.chapters.length!==5
  ||reviews?.schemaVersion!==1||reviews.parentLibraryId!==lessons.libraryId
  ||reviews.teacherApproved!==false||reviews.questionBankPromotionEnabled!==false
  ||reviews.weaknessMapWriteEnabled!==false
  ||!Array.isArray(reviews.chapters)||reviews.chapters.length!==5)
  throw Error('Phiên bản dữ liệu hoặc trạng thái nguồn không hợp lệ. Không hiển thị bộ duyệt.');
 const items=[],ids=new Set(),covered=new Set();
 const chapterById=new Map(lessons.chapters.map(c=>[c.number,c]));
 for(let i=0;i<22;i++){
  const l=lessons.lessons[i];
  if(l.number!==i+1||l.id!=='KNTT6-MATH-V1-'+String(i+1).padStart(2,'0')
   ||l.status!=='DRAFT_ORIGINAL_AURA'||l.readyForQuestionBank!==false
   ||l.requiresPedagogicalReview!==true
   ||!chapterById.has(l.chapter)||!Array.isArray(l.practice)||l.practice.length!==3)
   throw Error('Bài '+(i+1)+' chưa đúng cấu trúc.');
  l.practice.forEach((q,j)=>{
   const id=l.id+'-P'+(j+1);
   if(!validQ(q,id)||ids.has(id))throw Error('Nội dung câu '+id+' chưa hợp lệ.');
   ids.add(id);
   items.push({id,kind:'LESSON_PRACTICE',chapter:l.chapter,
    chapterTitle:chapterById.get(l.chapter).title,lessonNumber:l.number,
    lessonTitle:l.title,sourceLessons:[l.number],prompt:q.prompt,
    choices:q.choices,correct:q.correct,explanation:q.explanation,skill:q.skill});
  });
 }
 for(let i=0;i<5;i++){
  const c=reviews.chapters[i],chapter=chapterById.get(i+1);
  if(!c||c.number!==i+1||!Array.isArray(c.questions)||c.questions.length!==6)
   throw Error('Thiếu bộ ôn chương '+(i+1)+'.');
  for(const q of c.questions){
   if(!validQ(q,q.id)||ids.has(q.id)||!/^C[1-5]-0[1-6]$/.test(q.id)
    ||!q.id.startsWith('C'+c.number+'-')||q.eligibleForQuestionBank!==false
    ||q.requiresPedagogicalReview!==true
    ||!Array.isArray(q.sourceLessons)||!q.sourceLessons.length
    ||q.sourceLessons.some(n=>!Number.isInteger(n)||n<chapter.range[0]||n>chapter.range[1]))
    throw Error('Bộ ôn chương có câu chưa hợp lệ: '+q.id);
   ids.add(q.id);q.sourceLessons.forEach(n=>covered.add(n));
   items.push({id:q.id,kind:'CHAPTER_REVIEW',chapter:c.number,chapterTitle:chapter.title,
    lessonNumber:q.sourceLessons[0],
    lessonTitle:lessons.lessons[q.sourceLessons[0]-1].title,
    sourceLessons:q.sourceLessons,prompt:q.prompt,choices:q.choices,
    correct:q.correct,explanation:q.explanation,skill:q.skill});
  }
 }
 if(items.length!==96||ids.size!==96||covered.size!==22)
  throw Error('Hồ sơ chưa đủ 96 câu hoặc thiếu liên kết tới 22 bài.');
 return {items,chapters:lessons.chapters};
}
function uiStatus(){
 $('packetExceptions').textContent=String(state.exceptions.size);
 const root=$('packetAlert');
 if(!state.loaded)return;
 if(!state.exceptions.size){
  root.textContent='Chưa đánh dấu ngoại lệ. Điều này không có nghĩa toàn bộ 96 câu đã được giáo viên phê duyệt.';
 }else root.textContent='Đã đánh dấu '+state.exceptions.size+' ngoại lệ. Vui lòng ghi lý do tối thiểu 15 ký tự cho từng câu trước khi xuất.';
}
function render(){
 if(!state.loaded)return;
 const chosen=$('packetChapter').value,kind=$('packetKind').value,flag=$('packetFlag').value,
  search=$('packetSearch').value.trim().toLocaleLowerCase('vi');
 const root=$('packetItems');root.replaceChildren();
 const filtered=state.items.filter(q=>(chosen==='all'||q.chapter===Number(chosen))
  &&(kind==='all'||q.kind===kind)
  &&(flag==='all'||state.exceptions.has(q.id))
  &&(!search||[q.id,q.prompt,q.skill,q.lessonTitle,q.explanation].join(' ').toLocaleLowerCase('vi').includes(search)));
 $('packetShowing').textContent='Đang xem '+filtered.length+' / 96 câu nguồn.';
 if(!filtered.length)root.append(node('p','packet-empty','Không có câu phù hợp bộ lọc.'));
 for(const q of filtered){
  const section=node('article','packet-item'+(state.exceptions.has(q.id)?' flagged':''));
  section.dataset.questionId=q.id;
  const head=node('div','packet-item-head');
  head.append(node('strong','',q.id),node('span','packet-item-meta',
    'Chương '+q.chapter+' · Bài '+q.sourceLessons.join(', ')+
    ' · '+(q.kind==='LESSON_PRACTICE'?'Luyện trong bài':'Ôn cuối chương')+
    ' · Kỹ năng: '+q.skill));
  section.append(head);
  const body=node('div','packet-item-body');
  body.append(node('p','packet-prompt',q.prompt));
  const options=node('ol','packet-options');
  q.choices.forEach((answer,i)=>{
   const li=node('li',i===q.correct?'answer':'',choiceLetter(i)+'. '+answer);
   if(i===q.correct)li.append(node('span','',' · Đáp án của bản nháp AURA'));
   options.append(li);
  });
  body.append(options,node('p','packet-explain','Giải thích nguồn: '+q.explanation));
  section.append(body);
  const box=node('div','packet-flag');
  const label=node('label');
  const check=node('input');check.type='checkbox';check.checked=state.exceptions.has(q.id);
  check.setAttribute('aria-label','Đánh dấu câu '+q.id+' cần xem xét lại');
  check.addEventListener('change',()=>{
   if(check.checked)state.exceptions.set(q.id,state.exceptions.get(q.id)||'');
   else state.exceptions.delete(q.id);
   render();
  });
  label.append(check,node('span','','Đề nghị chỉnh sửa / kiểm định lại câu này'));
  box.append(label);
  if(state.exceptions.has(q.id)){
   const textarea=node('textarea');
   textarea.value=state.exceptions.get(q.id);
   textarea.placeholder='Nêu sai sót, mâu thuẫn hoặc lý do cần rà soát (tối thiểu 15 ký tự).';
   textarea.setAttribute('aria-label','Lý do ngoại lệ '+q.id);
   textarea.maxLength=1000;
   textarea.addEventListener('input',()=>{state.exceptions.set(q.id,textarea.value);uiStatus();});
   box.append(textarea,node('small','','Lý do chỉ được xuất vào bản nháp ngoại lệ; không tự phê duyệt hoặc sửa đáp án nguồn.'));
  }
  section.append(box);root.append(section);
 }
 uiStatus();
}
function download(){
 if(!state.loaded)return;
 const bad=[...state.exceptions].filter(([,reason])=>reason.trim().length<15);
 if(bad.length){
  $('packetAlert').textContent='Chưa thể xuất: '+bad.length+' ngoại lệ thiếu lý do tối thiểu 15 ký tự, ví dụ '+bad[0][0]+'.';
  return;
 }
 const payload={
  schemaVersion:1,
  kind:'aura_knowledge_teacher_exception_draft_v1',
  libraryId:'AURA-KNTT6-MATH-VOLUME1',
  reviewDecision:'NOT_AN_APPROVAL',
  reviewerAuthenticated:false,
  educatorSignoffPresent:false,
  sourceSha256:{...state.sha},
  totalQuestions:96,
  generatedAt:new Date().toISOString(),
  exclusions:[...state.exceptions.entries()].sort((a,b)=>a[0].localeCompare(b[0]))
   .map(([id,reason])=>({id,reason:reason.trim()})),
  note:'Only exception proposals. Qualified educator must verify the full 96-question source and approve through protected GitHub workflow.'
 };
 const blob=new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json'});
 const href=URL.createObjectURL(blob),a=node('a');
 a.href=href;a.download='aura-math6-v2-exception-draft.json';
 document.body.append(a);a.click();a.remove();
 window.setTimeout(()=>URL.revokeObjectURL(href),3000);
 $('packetAlert').textContent='Đã tạo bản nháp '+payload.exclusions.length+' ngoại lệ. Tệp này KHÔNG phải quyết định phê duyệt.';
}
async function boot(){
 try{
  const [lessons,reviews]=await Promise.all([resource(SOURCE_LESSONS),resource(SOURCE_REVIEWS)]);
  const data=catalog(lessons.data,reviews.data);
  state.sha={lessonData:await sha(lessons.raw),chapterData:await sha(reviews.raw)};
  state.items=data.items;state.chapters=data.chapters;state.loaded=true;
  $('packetCount').textContent=String(data.items.length);
  $('packetLessons').textContent=String(lessons.data.lessons.length);
  $('packetChapters').textContent=String(data.chapters.length);
  $('packetLessonSha').textContent=state.sha.lessonData;
  $('packetReviewSha').textContent=state.sha.chapterData;
  data.chapters.forEach(c=>{
   const opt=node('option','', 'Chương '+c.number+' · '+c.title);
   opt.value=String(c.number);$('packetChapter').append(opt);
  });
  for(const id of ['packetChapter','packetKind','packetFlag'])$(id).addEventListener('change',render);
  $('packetSearch').addEventListener('input',render);
  $('packetExport').addEventListener('click',download);
  $('packetPrint').addEventListener('click',()=>window.print());
  $('packetChapter').value='1';
  render();
 }catch(err){
  $('packetItems').replaceChildren(node('p','packet-empty',
   'Hồ sơ kiểm định bị chặn vì dữ liệu không hợp lệ: '+String(err?.message||err)));
  $('packetAlert').textContent='Không có quyền phát hành hoặc phê duyệt từ trang này.';
 }
}
boot();
})();