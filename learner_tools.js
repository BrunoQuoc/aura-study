/* AURA STUDY — learner tools: exam navigator + wrong-answer notebook */
(function(){
  if(!document.body.classList.contains('student-shell'))return;

  const WRONG_KEY='aura_wrong_book_v1';
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  const normalize=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
  let currentQuestion=0,scrollQueued=false,mutQueued=false;

  function loadWrong(){try{return JSON.parse(localStorage.getItem(WRONG_KEY)||'{}')}catch(_){return {}}}
  function saveWrong(v){localStorage.setItem(WRONG_KEY,JSON.stringify(v))}
  function topicOf(stem){
    const s=normalize(stem);
    if(/tap hop|thuoc|phan tu/.test(s))return'Tập hợp';
    if(/luy thua|so mu/.test(s))return'Lũy thừa';
    if(/hinh|tam giac|tu giac|duong cheo|vuong|thoi|binh hanh|luc giac/.test(s))return'Hình học';
    if(/chia|du|so tu nhien|phep tinh|bieu thuc/.test(s))return'Số tự nhiên & phép tính';
    return'Toán tổng hợp';
  }
  function questionKey(q){return normalize(q?.stem).replace(/[^a-z0-9\s]/g,'').slice(0,180)}
  function priority(x){return (x.wrongCount||0)*2-(x.correctAfterWrong||0)-(x.consecutiveCorrect||0)*1.5}
  function recordExamLearning(id){
    const exams=window.AURA_MATH_EXAMS||[],e=exams.find(x=>x.id===id);if(!e)return;
    let d={};try{d=JSON.parse(localStorage.getItem('exam_'+id)||'{}')}catch(_){return}
    const book=loadWrong(),now=new Date().toISOString();
    (e.mc||[]).forEach((q,i)=>{
      const usable=q?.answer&&(!q.needsImage||q.image);if(!usable)return;
      const key=questionKey(q);if(!key)return;
      const got=d.mc?.[i]||'',isCorrect=got===q.answer,old=book[key];
      if(!isCorrect){
        const entry=old||{key,subject:'TOAN',topic:topicOf(q.stem),stem:q.stem,options:q.options,correctAnswer:q.answer,correctText:q.options?.['ABCD'.indexOf(q.answer)]||'',wrongCount:0,correctAfterWrong:0,consecutiveCorrect:0,firstSeen:now};
        entry.stem=q.stem;entry.options=q.options;entry.correctAnswer=q.answer;entry.correctText=q.options?.['ABCD'.indexOf(q.answer)]||'';
        entry.wrongCount=(entry.wrongCount||0)+1;entry.consecutiveCorrect=0;entry.lastAnswer=got||'Chưa trả lời';entry.lastExam=e.title;entry.lastSeen=now;entry.status='needs_review';book[key]=entry;
      }else if(old){
        old.correctAfterWrong=(old.correctAfterWrong||0)+1;old.consecutiveCorrect=(old.consecutiveCorrect||0)+1;old.lastCorrect=now;old.lastExam=e.title;old.status=old.consecutiveCorrect>=2?'improving':'reviewing';book[key]=old;
      }
    });
    saveWrong(book);
  }
  window.auraRecordExamLearning=recordExamLearning;

  function examQuestions(){return [...document.querySelectorAll('#app .q')].filter(q=>q.querySelector('input[type="radio"][name^="mc"]'))}
  function answered(q){return !!q.querySelector('input[type="radio"]:checked')}
  function updateExamProgress(){
    const qs=examQuestions();if(!qs.length)return;
    qs.forEach((q,i)=>{q.id=`aura-question-${i+1}`;q.classList.add('aura-exam-question')});
    const done=qs.filter(answered).length;
    const text=$('#auraExamProgressText');if(text)text.textContent=`Đã làm ${done}/${qs.length}`;
    const chip=$('#auraTimerProgress');if(chip)chip.textContent=`${done}/${qs.length} câu`;
    document.querySelectorAll('.aura-qjump').forEach((b,i)=>{
      b.classList.toggle('answered',answered(qs[i]));
      b.classList.toggle('current',i===currentQuestion);
      b.setAttribute('aria-label',`Câu ${i+1}${answered(qs[i])?', đã trả lời':', chưa trả lời'}`);
    });
  }
  function jumpToQuestion(i){
    const qs=examQuestions(),q=qs[i];if(!q)return;currentQuestion=i;updateExamProgress();
    q.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>window.scrollBy({top:-155,behavior:'smooth'}),120);
  }
  window.auraJumpToQuestion=jumpToQuestion;

  function ensureExamNavigator(){
    const qs=examQuestions(),app=$('#app');
    if(!app||!qs.length){document.querySelector('.aura-exam-navigator')?.remove();return}
    if(!app.querySelector('.aura-exam-navigator')){
      const nav=document.createElement('section');nav.className='aura-exam-navigator';
      nav.innerHTML=`<div class="aura-exam-nav-head"><div><strong>Tiến độ bài làm</strong><span id="auraExamProgressText">Đã làm 0/${qs.length}</span></div><div class="aura-exam-legend"><i></i> Đã trả lời</div></div><div class="aura-qjumps">${qs.map((_,i)=>`<button type="button" class="aura-qjump" onclick="auraJumpToQuestion(${i})">${i+1}</button>`).join('')}</div>`;
      const first=qs[0];first.parentNode.insertBefore(nav,first);
    }
    const timer=app.querySelector('.exam-timerbar');
    if(timer&&!timer.querySelector('#auraTimerProgress')){
      const chip=document.createElement('div');chip.id='auraTimerProgress';chip.className='exam-progress-chip';chip.textContent=`0/${qs.length} câu`;
      const rule=timer.querySelector('.exam-timer-rule');rule?timer.insertBefore(chip,rule):timer.appendChild(chip);
    }
    updateExamProgress();
  }

  function trackCurrentQuestion(){
    if(scrollQueued)return;scrollQueued=true;requestAnimationFrame(()=>{
      scrollQueued=false;const qs=examQuestions();if(!qs.length)return;
      let best=0,bestDist=Infinity;qs.forEach((q,i)=>{const d=Math.abs(q.getBoundingClientRect().top-185);if(d<bestDist){bestDist=d;best=i}});
      if(best!==currentQuestion){currentQuestion=best;updateExamProgress()}
    })
  }

  function wrongEntries(){return Object.values(loadWrong()).sort((a,b)=>{
    const am=(a.consecutiveCorrect||0)>=2,bm=(b.consecutiveCorrect||0)>=2;if(am!==bm)return am?1:-1;
    return priority(b)-priority(a)||String(b.lastSeen||'').localeCompare(String(a.lastSeen||''));
  })}
  function wrongStatus(x){
    if((x.consecutiveCorrect||0)>=2)return['Đã vững hơn','mastered'];
    if((x.consecutiveCorrect||0)===1)return['Đang tiến bộ','improving'];
    return['Cần ôn lại','needs-review'];
  }
  function topicInsights(){
    const groups={};wrongEntries().forEach(x=>{const k=x.topic||'Toán tổng hợp',g=groups[k]||(groups[k]={topic:k,questions:0,active:0,wrong:0,recovered:0});g.questions++;g.wrong+=x.wrongCount||0;g.recovered+=x.correctAfterWrong||0;if((x.consecutiveCorrect||0)<2)g.active++});
    return Object.values(groups).sort((a,b)=>(b.active*5+b.wrong-b.recovered)-(a.active*5+a.wrong-a.recovered));
  }
  function appendWrongSummary(){
    const app=$('#app');if(!app||!app.querySelector('.sectionhead h2'))return;
    if(!/Kết quả học tập/i.test(app.querySelector('.sectionhead h2')?.textContent||''))return;
    if(app.querySelector('.wrong-book-summary'))return;
    const list=wrongEntries(),need=list.filter(x=>(x.consecutiveCorrect||0)<2).length;
    const box=document.createElement('section');box.className='card wrong-book-summary';
    box.innerHTML=`<div class="wrong-book-summary-main"><div class="wrong-book-icon">↺</div><div><div class="small">SỔ CÂU SAI</div><h3>${list.length?`${need} câu cần ôn lại`:'Chưa có câu sai'}</h3><p class="meta">${list.length?'AURA ưu tiên câu sai nhiều lần và giảm ưu tiên khi em làm đúng lại.':'Khi làm sai trong đề, câu đó sẽ tự xuất hiện tại đây.'}</p></div></div>${list.length?'<button class="btn soft" type="button" onclick="openWrongBook()">Mở sổ câu sai</button>':''}`;
    app.querySelector('.sectionhead').insertAdjacentElement('afterend',box);
  }
  function appendTopicInsights(){
    const app=$('#app'),anchor=app?.querySelector('.wrong-book-summary');if(!app||!anchor||app.querySelector('.learning-insights'))return;
    const groups=topicInsights();if(!groups.length)return;
    const box=document.createElement('section');box.className='card learning-insights';
    box.innerHTML=`<div class="learning-insights-head"><div><div class="small">PHÂN TÍCH THEO CHỦ ĐỀ</div><h3>Phần nên ưu tiên</h3></div><span>Dựa trên các câu từng làm sai</span></div><div class="learning-topic-grid">${groups.slice(0,4).map(g=>{const status=g.active?`${g.active} câu cần ôn`:'Đã cải thiện';const cls=g.active?'needs':'better';return `<div class="learning-topic ${cls}"><b>${esc(g.topic)}</b><span>${status}</span><small>Sai ${g.wrong} lượt · đúng lại ${g.recovered} lượt</small></div>`}).join('')}</div><p class="learning-insights-note">AURA chỉ kết luận từ dữ liệu bé đã làm; chủ đề chưa có đủ câu sẽ không bị gắn nhãn mạnh/yếu.</p>`;
    anchor.insertAdjacentElement('afterend',box);
  }
  window.openWrongBook=function(){
    if(typeof window.setActive==='function')window.setActive('history');
    const app=$('#app'),list=wrongEntries();if(!app)return;
    const need=list.filter(x=>(x.consecutiveCorrect||0)<2).length;
    app.innerHTML=`<button class="btn soft" type="button" onclick="history()" style="margin-bottom:12px">← Kết quả</button><div class="sectionhead" style="margin-top:0"><div><h2>Sổ câu sai</h2><span>${need} câu đang cần ưu tiên ôn lại</span></div></div>${list.length?`<div class="wrong-book-grid">${list.map(x=>{const st=wrongStatus(x);return `<article class="card wrong-item ${st[1]}"><div class="wrong-item-top"><span class="wrong-topic">${esc(x.topic||'Toán')}</span><span class="wrong-status">${st[0]}</span></div><h3>${esc(x.stem)}</h3><div class="wrong-stats"><span>Sai <b>${x.wrongCount||0}</b> lần</span><span>Làm đúng lại <b>${x.correctAfterWrong||0}</b> lần</span></div><details><summary>Xem đáp án đúng</summary><div class="okbox"><b>${esc(x.correctAnswer)}.</b> ${esc(x.correctText)}</div></details>${x.lastAnswer?`<p class="meta">Lần sai gần nhất: ${esc(x.lastAnswer)}${x.lastExam?' · '+esc(x.lastExam):''}</p>`:''}</article>`}).join('')}</div>`:`<div class="card"><h3>Chưa có câu sai</h3><p class="meta">Sau khi bé làm đề, AURA sẽ tự lưu các câu cần ôn lại tại đây.</p></div>`}`;
  };

  function relabelStudentNav(){
    const names={home:'Hôm nay',library:'Ôn thi',lessons:'Bài học',generator:'Luyện nhanh',history:'Kết quả'};
    document.querySelectorAll('.side .navbtn[data-page]').forEach(b=>{const n=names[b.dataset.page];if(!n)return;const span=b.querySelector('span');if(span)span.textContent=n;else b.textContent=n});
    document.querySelectorAll('.mobilebar button').forEach(b=>{const oc=b.getAttribute('onclick')||'',small=b.querySelector('small');if(!small)return;if(/home\(/.test(oc))small.textContent='Hôm nay';else if(/library\(/.test(oc))small.textContent='Ôn thi';else if(/lessons\(/.test(oc))small.textContent='Bài học';else if(/generator\(/.test(oc))small.textContent='Luyện nhanh';else if(/history\(/.test(oc))small.textContent='Kết quả'});
  }

  function refresh(){relabelStudentNav();ensureExamNavigator();appendWrongSummary();appendTopicInsights()}
  function queue(){if(mutQueued)return;mutQueued=true;requestAnimationFrame(()=>{mutQueued=false;refresh()})}
  function init(){refresh();document.addEventListener('change',e=>{if(e.target.matches('#app input[type="radio"][name^="mc"]'))setTimeout(updateExamProgress,0)});addEventListener('scroll',trackCurrentQuestion,{passive:true});new MutationObserver(queue).observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();