/* AURA STUDY — timed student exams + random 15-minute test */
(function(){
  if(!document.body.classList.contains('student-shell'))return;

  const EXAMS=()=>window.AURA_MATH_EXAMS||[];
  const QUICK_ID='quick15';
  const QUICK_STORE='aura_quick15_exam';
  let tickHandle=null;
  let activeExamId='';
  let submitting=false;

  function normalize(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
  function durationFor(exam){
    if(!exam)return 45;
    if(exam.id===QUICK_ID)return 15;
    const s=normalize(`${exam.title||''} ${exam.desc||''}`);
    if(/giua\s*(ky|hk)/.test(s))return 45;
    if(/cuoi\s*(ky|hk)|hoc\s*ky/.test(s))return 60;
    return 45;
  }
  function timerKey(id){return `aura_exam_timer_${id}`}
  function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function usableQuestion(q){return !!(q&&q.answer&&Array.isArray(q.options)&&q.options.length===4&&(!q.needsImage||q.image))}
  function shuffledQuestion(q){
    const letters='ABCD';
    const pairs=q.options.map((text,i)=>({text,orig:letters[i]}));
    shuffle(pairs);
    const idx=pairs.findIndex(p=>p.orig===q.answer);
    return {...q,options:pairs.map(p=>p.text),answer:letters[idx],note:null};
  }
  function removeQuick(){
    const list=EXAMS();
    const i=list.findIndex(x=>x.id===QUICK_ID);
    if(i>=0)list.splice(i,1);
  }
  function installQuick(exam){removeQuick();EXAMS().push(exam);return exam}
  function loadStoredQuick(){
    try{const raw=localStorage.getItem(QUICK_STORE);if(!raw)return null;const e=JSON.parse(raw);return e?.id===QUICK_ID?installQuick(e):null}catch(_){return null}
  }
  function buildQuick(){
    const seen=new Set(),pool=[];
    EXAMS().filter(e=>e.id!==QUICK_ID&&e.ready).forEach(e=>(e.mc||[]).forEach(q=>{
      if(!usableQuestion(q))return;
      const key=normalize(q.stem).replace(/\s+/g,' ').trim();
      if(!key||seen.has(key))return;
      seen.add(key);pool.push(q);
    }));
    const picked=shuffle(pool.slice()).slice(0,Math.min(10,pool.length)).map(shuffledQuestion);
    const e={id:QUICK_ID,title:'Kiểm tra 15 phút – Đề ngẫu nhiên',verified:true,ready:picked.length>0,desc:`${picked.length} câu trắc nghiệm ngẫu nhiên • 15 phút`,mc:picked,essay:[]};
    localStorage.setItem(QUICK_STORE,JSON.stringify(e));
    localStorage.removeItem('exam_'+QUICK_ID);
    localStorage.removeItem(timerKey(QUICK_ID));
    return installQuick(e);
  }
  function ensureQuick(){return EXAMS().find(x=>x.id===QUICK_ID)||loadStoredQuick()||buildQuick()}

  window.startRandom15Exam=function(){
    const key=timerKey(QUICK_ID),saved=Number(localStorage.getItem(key)||0);
    const existing=saved>Date.now()?ensureQuick():buildQuick();
    if(!existing?.mc?.length){alert('Chưa đủ câu hỏi để tạo bài kiểm tra 15 phút.');return}
    window.exam(QUICK_ID);
  };

  function format(sec){sec=Math.max(0,sec);const m=Math.floor(sec/60),s=sec%60;return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
  function examIsVisible(){return !!document.querySelector('#app input[type="radio"][name^="mc"]')}
  function injectTimer(exam){
    const app=document.getElementById('app');if(!app)return;
    app.querySelector('.exam-timerbar')?.remove();
    const duration=durationFor(exam),key=timerKey(exam.id);
    let end=Number(localStorage.getItem(key)||0);
    if(!end){end=Date.now()+duration*60*1000;localStorage.setItem(key,String(end))}
    const bar=document.createElement('div');bar.className='exam-timerbar';
    bar.innerHTML=`<div><span class="exam-timer-label">Thời gian làm bài</span><strong id="examCountdown">${format(Math.max(0,Math.ceil((end-Date.now())/1000)))}</strong></div><div class="exam-timer-rule">${duration} phút</div>`;
    const first=app.firstElementChild;first?.insertAdjacentElement('afterend',bar);
    activeExamId=exam.id;
    clearInterval(tickHandle);
    function tick(){
      if(activeExamId!==exam.id)return;
      const left=Math.max(0,Math.ceil((end-Date.now())/1000));
      const el=document.getElementById('examCountdown');if(el)el.textContent=format(left);
      bar.classList.toggle('is-warning',left<=300&&left>60);
      bar.classList.toggle('is-danger',left<=60);
      if(left<=0&&!submitting){
        clearInterval(tickHandle);
        if(!examIsVisible())return;
        submitting=true;
        setTimeout(()=>{try{window.gradeExam(exam.id)}finally{submitting=false}},50);
      }
    }
    tick();if(Number(localStorage.getItem(key)||0)>Date.now())tickHandle=setInterval(tick,1000);
  }

  const originalExam=window.exam;
  if(typeof originalExam==='function'){
    window.exam=function(id){
      const app=document.getElementById('app');
      const fromResult=!!app?.querySelector('.score')&&/KẾT QUẢ TRẮC NGHIỆM/i.test(app.textContent||'');
      if(id===QUICK_ID)ensureQuick();
      const e=EXAMS().find(x=>x.id===id);
      originalExam(id);
      if(e&&e.ready&&!fromResult)setTimeout(()=>injectTimer(e),0);
    };
  }

  const originalGrade=window.gradeExam;
  if(typeof originalGrade==='function'){
    window.gradeExam=function(id){
      activeExamId='';clearInterval(tickHandle);localStorage.removeItem(timerKey(id));
      if(typeof window.auraRecordExamLearning==='function')window.auraRecordExamLearning(id);
      return originalGrade(id);
    };
  }

  loadStoredQuick();
})();