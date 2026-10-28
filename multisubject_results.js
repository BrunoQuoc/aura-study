/* AURA STUDY — multi-subject learning results */
(function(){
  const isStudent=document.body.classList.contains('student-shell');
  const isAdmin=document.body.classList.contains('admin-shell');
  if(!isStudent&&!isAdmin)return;

  const ATTEMPTS='aura_attempts',WRONG='aura_wrong_book_v1',SMART='aura_smart_stats';
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(_){return f}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/\s+/g,' ').trim();
  const SUBJECT_ALIASES={
    TOAN:['toan','math'],NGUVAN:['ngu van','van 6','literature'],TIENGANH:['tieng anh','english'],
    KHTN:['khtn','khoa hoc tu nhien'],LSDL:['lich su','dia ly','lich su & dia ly','lsdl'],
    GDCD:['gdcd','giao duc cong dan'],TINHOC:['tin hoc'],CONGNGHE:['cong nghe']
  };

  function subjectMeta(id){
    const s=(window.AURA_SUBJECTS||[]).find(x=>x[0]===id);
    return s?{id,label:s[1],icon:s[2]}:{id:id||'KHAC',label:id==='KHAC'?'Khác':(id||'Chưa xác định'),icon:'•'};
  }
  function inferSubject(x){
    if(x?.subject&&subjectMeta(x.subject).id===x.subject)return x.subject;
    const text=norm(`${x?.title||''} ${x?.note||''} ${x?.source||''}`);
    for(const [id,keys] of Object.entries(SUBJECT_ALIASES))if(keys.some(k=>text.includes(k)))return id;
    return 'KHAC';
  }
  function isScored(x){
    const score=Number(x?.score);
    if(!Number.isFinite(score))return false;
    if(x?.total!==undefined&&Number(x.total)<=0)return false;
    return true;
  }
  function migrateAttempts(){
    const a=read(ATTEMPTS,[]);let changed=false;
    const next=a.map(x=>{if(x?.subject)return x;const s=inferSubject(x);if(s==='KHAC')return x;changed=true;return {...x,subject:s}});
    if(changed)write(ATTEMPTS,next);
    return next;
  }
  function attempts(){return migrateAttempts().map(x=>({...x,_subject:inferSubject(x)}))}
  function avg(list){const scored=list.filter(isScored);return scored.length?+(scored.reduce((s,x)=>s+Number(x.score),0)/scored.length).toFixed(1):null}
  function ts(v){const n=Date.parse(v||'');return Number.isFinite(n)?n:0}
  function dateTime(v){const d=new Date(v);return Number.isFinite(d.getTime())?d.toLocaleString('vi-VN'):''}

  function reviewProgress(){
    const out=[];
    Object.entries(window.AURA_REVIEWS||{}).forEach(([subject,groups])=>(groups||[]).forEach(r=>{
      const st=read('review_'+r.id,{}),answers=Array.isArray(st.answers)?st.answers:[],done=Array.isArray(st.done)?st.done:[];
      const total=(r.items||[]).length,doneCount=done.filter(Boolean).length,hasAnswer=answers.some(x=>String(x||'').trim());
      if(!doneCount&&!hasAnswer&&!st.updatedAt)return;
      out.push({subject,id:r.id,title:r.title,total,done:doneCount,pct:total?Math.round(doneCount/total*100):0,updatedAt:st.updatedAt||'',complete:!!total&&doneCount===total});
    }));
    return out;
  }

  function weakData(subject){
    const book=Object.values(read(WRONG,{})).filter(x=>(x.subject||'TOAN')===subject&&(x.consecutiveCorrect||0)<2);
    const groups={};
    book.forEach(x=>{const label=x.topic||'Nội dung tổng hợp',g=groups[label]||(groups[label]={label,source:'wrong',questions:0,wrong:0,recovered:0,score:0});g.questions++;g.wrong+=Number(x.wrongCount||0);g.recovered+=Number(x.correctAfterWrong||0);g.score+=Number(x.wrongCount||0)*2-(x.correctAfterWrong||0)+(x.consecutiveCorrect?0:2)});
    const smart=read(SMART,{})?.[subject]||{};
    const skills=Object.entries(smart).map(([label,v])=>({label,source:'smart',seen:Number(v?.seen||0),wrong:Number(v?.wrong||0),rate:Number(v?.seen||0)?Number(v?.wrong||0)/Number(v?.seen||1):0})).filter(x=>x.seen>0&&x.wrong>0);
    const rows=[...Object.values(groups),...skills].sort((a,b)=>{
      const pa=a.source==='wrong'?a.score:(a.rate*10+a.seen*.05),pb=b.source==='wrong'?b.score:(b.rate*10+b.seen*.05);return pb-pa;
    });
    return {activeQuestions:book.length,rows,top:rows[0]||null};
  }

  function subjectSummary(subject){
    const all=attempts().filter(x=>x._subject===subject),scored=all.filter(isScored),reviews=reviewProgress().filter(x=>x.subject===subject),weak=weakData(subject);
    const reviewDone=reviews.reduce((s,x)=>s+x.done,0),reviewTotal=reviews.reduce((s,x)=>s+x.total,0),last=Math.max(0,...all.map(x=>ts(x.time)),...reviews.map(x=>ts(x.updatedAt)));
    return {subject,meta:subjectMeta(subject),attempts:all,scored,avg:avg(scored),reviews,reviewDone,reviewTotal,weak,last,hasActivity:!!(all.length||reviews.length||weak.rows.length)};
  }
  function summaries(){
    const ids=[...(window.AURA_SUBJECTS||[]).map(x=>x[0]),'KHAC'];
    return ids.map(subjectSummary).filter(x=>x.hasActivity).sort((a,b)=>b.last-a.last);
  }

  function patchLatestAttempt(subject,extra={},beforeLength=null){
    if(!subject||subject==='KHAC')return;
    const a=read(ATTEMPTS,[]);if(!a.length)return;
    if(beforeLength!==null&&a.length<=beforeLength&&!a[0])return;
    a[0]={...a[0],subject,...extra};write(ATTEMPTS,a);
  }

  const baseGradeExam=window.gradeExam;
  if(typeof baseGradeExam==='function'&&!baseGradeExam.__auraMultiSubject){
    const wrapped=function(id,...rest){const before=read(ATTEMPTS,[]).length,res=baseGradeExam.call(this,id,...rest);patchLatestAttempt('TOAN',{sourceType:'exam',sourceId:id},before);return res};
    wrapped.__auraMultiSubject=true;window.gradeExam=wrapped;
  }
  const baseGradeGenerated=window.gradeAuraGenerated;
  if(typeof baseGradeGenerated==='function'&&!baseGradeGenerated.__auraMultiSubject){
    const wrapped=function(...args){const e=read('aura_generated_exam',null),before=read(ATTEMPTS,[]).length,res=baseGradeGenerated.apply(this,args);if(e?.subject)patchLatestAttempt(e.subject,{sourceType:'generated',sourceId:e.id||'',period:e.period||''},before);return res};
    wrapped.__auraMultiSubject=true;window.gradeAuraGenerated=wrapped;
  }
  const baseSaveReview=window.saveReview;
  if(typeof baseSaveReview==='function'&&!baseSaveReview.__auraMultiSubject){
    const wrapped=function(subject,id,...rest){const res=baseSaveReview.call(this,subject,id,...rest),key='review_'+id,st=read(key,{});write(key,{...st,subject,updatedAt:new Date().toISOString()});return res};
    wrapped.__auraMultiSubject=true;window.saveReview=wrapped;
  }

  function subjectCardsHTML(){
    const list=summaries().filter(x=>x.subject!=='KHAC');
    if(!list.length)return '<div class="card multi-empty"><b>Chưa có dữ liệu theo môn.</b><span>Làm một đề có chấm điểm hoặc đánh dấu tiến độ ôn tập để AURA bắt đầu tổng hợp.</span></div>';
    return `<section class="multi-subject-grid">${list.map(s=>{
      const main=s.scored.length?`${s.avg}/10`:s.reviewTotal?`${s.reviewDone}/${s.reviewTotal}`:'Chưa có điểm';
      const mainLabel=s.scored.length?`${s.scored.length} bài có điểm`:s.reviewTotal?'mục ôn đã đánh dấu':'chưa có bài chấm tự động';
      const weak=s.weak.top?`${s.weak.top.label}${s.weak.activeQuestions?` · ${s.weak.activeQuestions} câu cần ôn`:''}`:'Chưa có phần yếu nổi bật';
      return `<article class="card multi-subject-card"><div class="multi-subject-top"><span class="multi-subject-icon">${esc(s.meta.icon)}</span><div><h3>${esc(s.meta.label)}</h3><small>${esc(mainLabel)}</small></div><strong>${esc(main)}</strong></div><div class="multi-subject-line"><span>Ưu tiên</span><b>${esc(weak)}</b></div>${s.reviewTotal?`<div class="multi-progress"><i style="width:${Math.min(100,Math.round(s.reviewDone/Math.max(1,s.reviewTotal)*100))}%"></i></div><small class="multi-review-note">Tiến độ ôn tập: ${s.reviewDone}/${s.reviewTotal} mục</small>`:''}<button class="btn soft" type="button" onclick="auraOpenSubjectResults('${s.subject}')">Xem chi tiết</button></article>`;
    }).join('')}</section>`;
  }

  function overallHTML(){
    const a=attempts(),scored=a.filter(isScored),rv=reviewProgress(),ss=summaries().filter(x=>x.subject!=='KHAC'),weak=Object.values(read(WRONG,{})).filter(x=>(x.consecutiveCorrect||0)<2).length;
    const activeSubjects=new Set([...a.map(x=>x._subject),...rv.map(x=>x.subject)].filter(x=>x&&x!=='KHAC')).size;
    return `<section class="multi-overview"><article><span>Môn đã học</span><strong>${activeSubjects}</strong><small>${activeSubjects?'Có hoạt động được ghi nhận':'Chưa có hoạt động'}</small></article><article><span>Bài có điểm</span><strong>${scored.length}</strong><small>Chỉ tính bài chấm tự động đáng tin cậy</small></article><article><span>Câu cần ôn</span><strong>${weak}</strong><small>Từ Sổ câu sai</small></article><article><span>Bài ôn đang ghi nhận</span><strong>${rv.length}</strong><small>Không quy đổi thành điểm 0/10</small></article></section>`;
  }

  function historyRowsHTML(){
    const a=attempts();
    if(!a.length)return '<div class="card multi-empty"><b>Chưa có lịch sử bài làm.</b><span>Kết quả chấm điểm sẽ xuất hiện tại đây.</span></div>';
    return `<section class="multi-history-list">${a.map(x=>{const s=subjectMeta(x._subject),score=isScored(x)?`${Number(x.score)}/10`:'Không chấm điểm';return `<article class="card multi-history-row"><div class="multi-history-main"><span class="multi-badge">${esc(s.icon)} ${esc(s.label)}</span><b>${esc(x.title||'Bài học')}</b><small>${esc(dateTime(x.time))}${x.note?' · '+esc(x.note):''}</small></div><strong>${esc(score)}</strong></article>`}).join('')}</section>`;
  }

  function multiHistory(){
    if(typeof window.setActive==='function')window.setActive('history');
    const app=document.getElementById('app');if(!app)return;
    app.innerHTML=`<div class="sectionhead multi-results-head" style="margin-top:0"><div><h2>Kết quả học tập</h2><span>Tổng quan → từng môn → kỹ năng/chủ đề → từng bài</span></div></div>${overallHTML()}<div class="multi-section-head"><div><h3>Kết quả theo môn</h3><span>Mỗi môn dùng thước đo phù hợp với dữ liệu thật</span></div></div>${subjectCardsHTML()}<div class="multi-section-head"><div><h3>Lịch sử bài làm</h3><span>Điểm và môn học được tách riêng</span></div></div>${historyRowsHTML()}`;
    document.body.dataset.auraPage='history';
    if(typeof window.auraQueuePolish==='function')window.auraQueuePolish();
  }

  window.auraOpenSubjectResults=function(subject){
    if(typeof window.setActive==='function')window.setActive('history');
    const app=document.getElementById('app'),s=subjectSummary(subject);if(!app)return;
    const weakRows=s.weak.rows.slice(0,6).map(x=>`<div class="multi-weak-row"><b>${esc(x.label)}</b><span>${x.source==='wrong'?`${x.questions} câu cần ôn · sai ${x.wrong} lượt`:`Sai ${Math.round(x.rate*100)}% trên ${x.seen} lượt chấm`}</span></div>`).join('')||'<div class="multi-empty-inline">Chưa đủ dữ liệu để xác định phần yếu.</div>';
    const reviewRows=s.reviews.map(x=>`<div class="multi-review-row"><div><b>${esc(x.title)}</b><small>${x.complete?'Đã hoàn thành':'Đang ôn'}${x.updatedAt?' · cập nhật '+esc(dateTime(x.updatedAt)):''}</small></div><strong>${x.done}/${x.total}</strong></div>`).join('')||'<div class="multi-empty-inline">Chưa có bài ôn được ghi nhận.</div>';
    const attemptRows=s.attempts.map(x=>`<div class="multi-review-row"><div><b>${esc(x.title||'Bài học')}</b><small>${esc(dateTime(x.time))}</small></div><strong>${isScored(x)?`${Number(x.score)}/10`:'—'}</strong></div>`).join('')||'<div class="multi-empty-inline">Chưa có bài chấm điểm.</div>';
    app.innerHTML=`<button class="btn soft" onclick="history()" style="margin-bottom:12px">← Kết quả học tập</button><div class="sectionhead" style="margin-top:0"><div><h2>${esc(s.meta.icon)} ${esc(s.meta.label)}</h2><span>Kết quả riêng của môn, không trộn với môn khác</span></div></div><section class="multi-subject-detail-summary"><article><span>Điểm trung bình</span><strong>${s.scored.length?s.avg+'/10':'—'}</strong><small>${s.scored.length?s.scored.length+' bài có điểm':'Không ép bài chưa chấm thành 0 điểm'}</small></article><article><span>Tiến độ ôn</span><strong>${s.reviewTotal?s.reviewDone+'/'+s.reviewTotal:'—'}</strong><small>${s.reviews.length?s.reviews.length+' bài ôn có dữ liệu':'Chưa có tiến độ ôn'}</small></article><article><span>Câu cần ôn</span><strong>${s.weak.activeQuestions}</strong><small>${s.weak.top?'Ưu tiên: '+esc(s.weak.top.label):'Chưa có phần yếu nổi bật'}</small></article></section><section class="card multi-detail-card"><div class="small">PHẦN YẾU / KỸ NĂNG</div>${weakRows}</section><section class="card multi-detail-card"><div class="small">TIẾN ĐỘ ÔN TẬP</div>${reviewRows}</section><section class="card multi-detail-card"><div class="small">BÀI ĐÃ CHẤM / GHI NHẬN</div>${attemptRows}</section>`;
  };

  window.AURA_RESULTS={attempts,reviewProgress,weakData,subjectSummary,summaries,subjectMeta,inferSubject,isScored,avg,ts};
  window.history=multiHistory;
  migrateAttempts();
})();