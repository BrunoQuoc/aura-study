/* AURA STUDY — multi-subject weekly progress report */
(function(){
  const isStudent=document.body.classList.contains('student-shell');
  const isAdmin=document.body.classList.contains('admin-shell');
  if(!isStudent&&!isAdmin)return;
  const WRONG='aura_wrong_book_v1';
  const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(_){return f}};
  const ts=v=>{const n=Date.parse(v||'');return Number.isFinite(n)?n:0};
  function monday(d=new Date()){const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));x.setHours(0,0,0,0);return x}
  function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
  function dateShort(d){return d.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'})}
  function api(){return window.AURA_RESULTS||null}
  function subjectMeta(id){return api()?.subjectMeta?.(id)||{id,label:id||'Chưa xác định',icon:'•'}}
  function subjectOfAttempt(x){return x?._subject||api()?.inferSubject?.(x)||x?.subject||'KHAC'}
  function isScored(x){return api()?.isScored?api().isScored(x):Number.isFinite(Number(x?.score))}
  function avg(list){const a=list.filter(isScored);return a.length?+(a.reduce((s,x)=>s+Number(x.score),0)/a.length).toFixed(1):null}

  function windowData(){
    const start=monday(),end=addDays(start,7),prevStart=addDays(start,-7),A=api();
    const attempts=A?.attempts?A.attempts():read('aura_attempts',[]).map(x=>({...x,_subject:x.subject||'KHAC'}));
    const reviews=A?.reviewProgress?A.reviewProgress():[];
    const book=Object.values(read(WRONG,{}));
    const cur=attempts.filter(x=>{const t=ts(x.time);return t>=+start&&t<+end});
    const prev=attempts.filter(x=>{const t=ts(x.time);return t>=+prevStart&&t<+start});
    const reviewCur=reviews.filter(x=>{const t=ts(x.updatedAt);return t>=+start&&t<+end});
    const strengthened=book.filter(x=>(x.consecutiveCorrect||0)>=2&&ts(x.lastCorrect)>=+start&&ts(x.lastCorrect)<+end);
    const improved=book.filter(x=>ts(x.lastCorrect)>=+start&&ts(x.lastCorrect)<+end);
    const subjectIds=new Set();
    cur.forEach(x=>{const s=subjectOfAttempt(x);if(s!=='KHAC')subjectIds.add(s)});
    reviewCur.forEach(x=>subjectIds.add(x.subject));
    improved.forEach(x=>subjectIds.add(x.subject||'TOAN'));
    strengthened.forEach(x=>subjectIds.add(x.subject||'TOAN'));
    const rows=[...subjectIds].map(subject=>{
      const c=cur.filter(x=>subjectOfAttempt(x)===subject),p=prev.filter(x=>subjectOfAttempt(x)===subject),r=reviewCur.filter(x=>x.subject===subject),str=strengthened.filter(x=>(x.subject||'TOAN')===subject),imp=improved.filter(x=>(x.subject||'TOAN')===subject);
      const curAvg=avg(c),prevAvg=avg(p),weak=A?.weakData?A.weakData(subject):{activeQuestions:0,top:null,rows:[]};
      const reviewDone=r.reduce((s,x)=>s+x.done,0),reviewTotal=r.reduce((s,x)=>s+x.total,0);
      return {subject,meta:subjectMeta(subject),cur:c,prev:p,reviews:r,reviewDone,reviewTotal,strengthened:str,improved:imp,curAvg,prevAvg,weak};
    }).sort((a,b)=>b.cur.length-a.cur.length||b.reviews.length-a.reviews.length||b.strengthened.length-a.strengthened.length);
    const scoredCur=cur.filter(isScored);
    return {start,end,cur,prev,reviewCur,strengthened,improved,rows,scoredCur};
  }

  function trend(row){
    if(row.curAvg===null)return row.reviewTotal?{text:`${row.reviewDone}/${row.reviewTotal} mục ôn`,cls:'neutral',detail:'Tiến độ ôn tập; không quy đổi thành điểm.'}:{text:'Có hoạt động',cls:'neutral',detail:'Chưa có bài chấm tự động trong tuần.'};
    if(row.prevAvg===null)return {text:`${row.curAvg}/10`,cls:'neutral',detail:'Chưa đủ dữ liệu tuần trước để so sánh.'};
    const delta=+(row.curAvg-row.prevAvg).toFixed(1);
    if(delta>0)return {text:`${row.curAvg}/10`,cls:'up',detail:`Tăng ${delta} điểm so với tuần trước.`};
    if(delta<0)return {text:`${row.curAvg}/10`,cls:'down',detail:`Giảm ${Math.abs(delta)} điểm so với tuần trước.`};
    return {text:`${row.curAvg}/10`,cls:'neutral',detail:'Giữ mức điểm như tuần trước.'};
  }
  function priorityText(row){
    if(row.weak?.top)return `${row.meta.label}: ưu tiên ${row.weak.top.label}.`;
    if(row.strengthened.length)return `${row.meta.label}: duy trì nhịp luyện; tuần này đã có ${row.strengthened.length} câu vững hơn.`;
    return `${row.meta.label}: chưa có phần yếu đủ dữ liệu để ưu tiên.`;
  }
  function signature(d){return [
    +d.start,d.cur.length,d.reviewCur.length,d.strengthened.length,
    d.rows.map(r=>`${r.subject}:${r.curAvg}:${r.prevAvg}:${r.reviewDone}/${r.reviewTotal}:${r.weak?.top?.label||''}`).join('|'),
    d.cur.map(x=>`${x.time||''}:${x.score||''}:${subjectOfAttempt(x)}`).join('|')
  ].join('~')}

  function subjectRowsHTML(d){
    if(!d.rows.length)return '<div class="weekly-subject-empty">Tuần này chưa có hoạt động đủ dữ liệu để tách theo môn.</div>';
    return `<div class="weekly-subjects">${d.rows.map(r=>{const tr=trend(r);return `<article class="weekly-subject ${tr.cls}"><div class="weekly-subject-head"><span>${esc(r.meta.icon)}</span><div><b>${esc(r.meta.label)}</b><small>${r.cur.length?`${r.cur.filter(isScored).length} bài có điểm`:r.reviews.length?`${r.reviews.length} bài ôn cập nhật`:'Có tiến bộ từ câu đã sửa'}</small></div><strong>${esc(tr.text)}</strong></div><p>${esc(tr.detail)}</p><div class="weekly-subject-focus"><span>Ưu tiên</span><b>${esc(r.weak?.top?.label||'Chưa có phần yếu nổi bật')}</b></div></article>`}).join('')}</div>`;
  }
  function strengthenedHTML(d){
    if(!d.strengthened.length)return '<div class="weekly-strengthened-empty">Chưa có câu nào đạt trạng thái “Đã vững hơn” trong tuần này.</div>';
    return `<div class="weekly-strengthened-list">${d.strengthened.slice(0,6).map(x=>{const m=subjectMeta(x.subject||'TOAN');return `<div class="weekly-strengthened-item"><span>✓</span><div><b>${esc(x.stem||'Câu đã củng cố')}</b><small>${esc(m.label)} · ${esc(x.topic||'Nội dung tổng hợp')} · đúng lại ${x.correctAfterWrong||0} lượt</small></div></div>`}).join('')}</div>${d.strengthened.length>6?`<div class="weekly-strengthened-more">+ ${d.strengthened.length-6} câu khác đã vững hơn</div>`:''}`;
  }

  function reportHTML(d,compact=false){
    const range=`${dateShort(d.start)} – ${dateShort(addDays(d.end,-1))}`,sig=esc(signature(d));
    if(compact){
      const hint=isAdmin?'Phụ huynh/Admin có thể mở Kết quả để xem chi tiết theo từng môn.':d.rows.length?`Đang ghi nhận: ${d.rows.map(x=>x.meta.label).join(' · ')}`:'AURA sẽ cập nhật khi có thêm dữ liệu.';
      return `<section class="weekly-mini" data-weekly-signature="${sig}"><div><span class="weekly-kicker">TUẦN NÀY · ${range}</span><b>${d.rows.length} môn có hoạt động · ${d.scoredCur.length} bài có điểm · ${d.strengthened.length} câu đã vững</b><small>${esc(hint)}</small></div><button type="button" onclick="history()">Xem báo cáo →</button></section>`;
    }
    const priorities=d.rows.length?d.rows.map(priorityText).join(' '):'Chưa đủ dữ liệu để đưa khuyến nghị theo môn.';
    const audienceNote=isAdmin?'Báo cáo dành cho Admin/phụ huynh, chỉ dùng dữ liệu học đã được AURA ghi nhận trên thiết bị này.':'Báo cáo tách riêng từng môn; bài chưa có cơ chế chấm đáng tin cậy không bị quy đổi thành 0/10.';
    return `<section class="card weekly-report" data-weekly-signature="${sig}"><div class="weekly-head"><div><div class="small">BÁO CÁO TIẾN BỘ THEO TUẦN · ĐA MÔN</div><h3>Tuần ${range}</h3></div><span>Dữ liệu trên thiết bị này</span></div><div class="weekly-metrics"><article><span>Môn đã học</span><strong>${d.rows.length}</strong><small>${d.rows.length?'Có hoạt động được ghi nhận trong tuần':'Chưa có hoạt động tuần này'}</small></article><article><span>Bài có điểm</span><strong>${d.scoredCur.length}</strong><small>Không trộn điểm giữa các môn</small></article><article><span>Câu đã củng cố</span><strong>${d.strengthened.length}</strong><small>${d.improved.length?`${d.improved.length} câu có lượt sửa đúng`:'Chưa ghi nhận lượt sửa đúng'}</small></article></div><div class="weekly-section-title"><b>Kết quả theo môn</b><span>Điểm hoặc tiến độ phù hợp từng môn</span></div>${subjectRowsHTML(d)}<div class="weekly-insights weekly-priority-wide"><div class="weekly-insight focus"><span>ƯU TIÊN TUẦN TỚI</span><b>${d.rows.length?'Theo từng môn':'Chưa đủ dữ liệu'}</b><p>${esc(priorities)}</p></div></div><div class="weekly-strengthened"><div class="weekly-strengthened-head"><span>CÂU ĐÃ VỮNG HƠN TRONG TUẦN</span><b>${d.strengthened.length}</b></div>${strengthenedHTML(d)}</div><p class="weekly-note">${audienceNote}</p></section>`;
  }

  function elementFrom(html){const holder=document.createElement('div');holder.innerHTML=html;return holder.firstElementChild}
  function injectHistory(){
    const app=document.getElementById('app');if(!app)return;
    const h=app.querySelector('.sectionhead h2');if(!h||!/Kết quả học tập/i.test(h.textContent||''))return;
    const d=windowData(),sig=signature(d);let box=app.querySelector('.weekly-report');
    if(!box){box=elementFrom(reportHTML(d));const anchor=app.querySelector('.learning-insights')||app.querySelector('.wrong-book-summary')||h.closest('.sectionhead');anchor.insertAdjacentElement('afterend',box)}
    else if(box.dataset.weeklySignature!==sig){const fresh=elementFrom(reportHTML(d));box.replaceWith(fresh)}
  }
  function injectHome(){
    const app=document.getElementById('app');if(!app||!app.querySelector('.dash-home'))return;
    const d=windowData(),sig=signature(d);let mini=app.querySelector('.weekly-mini');
    if(!mini){mini=elementFrom(reportHTML(d,true));app.querySelector('.dash-stats')?.insertAdjacentElement('afterend',mini)}
    else if(mini.dataset.weeklySignature!==sig){const fresh=elementFrom(reportHTML(d,true));mini.replaceWith(fresh)}
  }
  let queued=false;
  function refresh(){injectHistory();injectHome()}
  function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;refresh()})}
  function init(){refresh();const app=document.getElementById('app');if(app)new MutationObserver(queue).observe(app,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
