/* AURA STUDY — weekly progress report derived from local learning data */
(function(){
  if(!document.body.classList.contains('student-shell'))return;
  const ATTEMPTS='aura_attempts',WRONG='aura_wrong_book_v1';
  const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(_){return f}};
  const ts=v=>{const n=Date.parse(v||'');return Number.isFinite(n)?n:0};
  const avg=a=>a.length?+(a.reduce((s,x)=>s+Number(x.score||0),0)/a.length).toFixed(1):null;
  function monday(d=new Date()){
    const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());
    x.setDate(x.getDate()-((x.getDay()+6)%7));x.setHours(0,0,0,0);return x;
  }
  function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
  function dateShort(d){return d.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'})}
  function windowData(){
    const start=monday(),end=addDays(start,7),prevStart=addDays(start,-7);
    const attempts=read(ATTEMPTS,[]),book=Object.values(read(WRONG,{}));
    const cur=attempts.filter(x=>{const t=ts(x.time);return t>=+start&&t<+end});
    const prev=attempts.filter(x=>{const t=ts(x.time);return t>=+prevStart&&t<+start});
    const curAvg=avg(cur),prevAvg=avg(prev);
    const strengthened=book.filter(x=>(x.consecutiveCorrect||0)>=2&&ts(x.lastCorrect)>=+start&&ts(x.lastCorrect)<+end)
      .sort((a,b)=>ts(b.lastCorrect)-ts(a.lastCorrect));
    const improved=book.filter(x=>ts(x.lastCorrect)>=+start&&ts(x.lastCorrect)<+end);
    const active=book.filter(x=>(x.consecutiveCorrect||0)<2);
    const improvedTopics={};improved.forEach(x=>{const k=x.topic||'Toán tổng hợp';improvedTopics[k]=(improvedTopics[k]||0)+1});
    const priorityTopics={};active.forEach(x=>{const k=x.topic||'Toán tổng hợp',score=(x.wrongCount||0)*2-(x.correctAfterWrong||0)+(x.consecutiveCorrect?0:2);priorityTopics[k]=(priorityTopics[k]||0)+score});
    const bestTopic=Object.entries(improvedTopics).sort((a,b)=>b[1]-a[1])[0]?.[0]||'';
    const priority=Object.entries(priorityTopics).sort((a,b)=>b[1]-a[1])[0]?.[0]||'';
    return {start,end,cur,prev,curAvg,prevAvg,strengthened,improved,bestTopic,priority,active};
  }
  function signature(d){return [
    +d.start,d.cur.length,d.prev.length,d.curAvg,d.prevAvg,d.strengthened.length,d.improved.length,d.bestTopic,d.priority,d.active.length,
    d.cur.map(x=>`${x.time||''}:${x.score||''}`).join('|'),
    d.strengthened.map(x=>`${x.key||x.stem||''}:${x.lastCorrect||''}:${x.consecutiveCorrect||0}`).join('|'),
    d.active.map(x=>`${x.key||x.stem||''}:${x.wrongCount||0}:${x.correctAfterWrong||0}:${x.consecutiveCorrect||0}:${x.lastSeen||''}:${x.lastCorrect||''}`).join('|')
  ].join('~')}
  function trendText(d){
    if(d.curAvg===null)return {text:'Chưa có điểm',cls:'neutral',detail:'Làm một bài có chấm điểm để bắt đầu báo cáo.'};
    if(d.prevAvg===null)return {text:`${d.curAvg}/10`,cls:'neutral',detail:'Chưa đủ dữ liệu tuần trước để so sánh.'};
    const delta=+(d.curAvg-d.prevAvg).toFixed(1);
    if(delta>0)return {text:`${d.curAvg}/10`,cls:'up',detail:`Tăng ${delta} điểm so với tuần trước.`};
    if(delta<0)return {text:`${d.curAvg}/10`,cls:'down',detail:`Giảm ${Math.abs(delta)} điểm so với tuần trước.`};
    return {text:`${d.curAvg}/10`,cls:'neutral',detail:'Giữ mức điểm trung bình như tuần trước.'};
  }
  function recommendation(d){
    if(d.priority)return `Tuần tới nên ưu tiên ${d.priority}. AURA sẽ tiếp tục lấy các câu chưa vững ở chủ đề này vào lượt ôn.`;
    if(d.cur.length||d.strengthened.length)return 'Hiện không còn câu sai nổi bật cần ưu tiên. Có thể tiếp tục học bài mới và luyện ngắn để duy trì nhịp học.';
    return 'Chưa đủ dữ liệu để đưa khuyến nghị. Hãy hoàn thành một đề hoặc một lượt luyện để AURA bắt đầu phân tích.';
  }
  function strengthenedHTML(d){
    if(!d.strengthened.length)return `<div class="weekly-strengthened-empty">Chưa có câu nào đạt trạng thái “Đã vững hơn” trong tuần này.</div>`;
    return `<div class="weekly-strengthened-list">${d.strengthened.slice(0,5).map(x=>`<div class="weekly-strengthened-item"><span>✓</span><div><b>${esc(x.stem||'Câu đã củng cố')}</b><small>${esc(x.topic||'Toán tổng hợp')} · đúng lại ${x.correctAfterWrong||0} lượt</small></div></div>`).join('')}</div>${d.strengthened.length>5?`<div class="weekly-strengthened-more">+ ${d.strengthened.length-5} câu khác đã vững hơn</div>`:''}`;
  }
  function reportHTML(d,compact=false){
    const tr=trendText(d),range=`${dateShort(d.start)} – ${dateShort(addDays(d.end,-1))}`,sig=esc(signature(d));
    if(compact){
      return `<section class="weekly-mini" data-weekly-signature="${sig}"><div><span class="weekly-kicker">TUẦN NÀY · ${range}</span><b>${d.cur.length} lượt có điểm · ${d.active.length} câu cần ôn · ${d.strengthened.length} câu đã vững</b><small>${d.bestTopic?`Đang cải thiện: ${esc(d.bestTopic)}`:d.priority?`Ưu tiên: ${esc(d.priority)}`:'AURA sẽ cập nhật khi có thêm dữ liệu.'}</small></div><button type="button" onclick="history()">Xem báo cáo →</button></section>`;
    }
    return `<section class="card weekly-report" data-weekly-signature="${sig}"><div class="weekly-head"><div><div class="small">BÁO CÁO TIẾN BỘ THEO TUẦN</div><h3>Tuần ${range}</h3></div><span>Dữ liệu trên thiết bị này</span></div><div class="weekly-metrics"><article><span>Bài có điểm</span><strong>${d.cur.length}</strong><small>${d.prev.length?`Tuần trước ${d.prev.length}`:'Chưa có mốc tuần trước'}</small></article><article class="${tr.cls}"><span>Điểm trung bình</span><strong>${tr.text}</strong><small>${tr.detail}</small></article><article><span>Câu đã củng cố</span><strong>${d.strengthened.length}</strong><small>${d.improved.length?`${d.improved.length} câu có tiến bộ trong tuần`:'Chưa ghi nhận lượt sửa đúng'}</small></article></div><div class="weekly-insights"><div class="weekly-insight good"><span>TIẾN BỘ NỔI BẬT</span><b>${d.bestTopic?esc(d.bestTopic):'Chưa đủ dữ liệu'}</b><p>${d.bestTopic?'Đây là chủ đề có nhiều câu được làm đúng lại nhất trong tuần.':'Khi bé sửa đúng các câu từng sai, AURA sẽ ghi nhận chủ đề cải thiện tại đây.'}</p></div><div class="weekly-insight focus"><span>ƯU TIÊN TUẦN TỚI</span><b>${d.priority?esc(d.priority):'Duy trì nhịp học'}</b><p>${esc(recommendation(d))}</p>${d.active.length&&typeof window.openWrongPractice==='function'?'<button class="btn soft" type="button" onclick="openWrongPractice()">Luyện câu cần ưu tiên</button>':''}</div></div><div class="weekly-strengthened"><div class="weekly-strengthened-head"><span>CÂU ĐÃ VỮNG HƠN TRONG TUẦN</span><b>${d.strengthened.length}</b></div>${strengthenedHTML(d)}</div><p class="weekly-note">Báo cáo chỉ dùng điểm, câu sai và lượt sửa đúng đã được AURA ghi nhận; không suy đoán những chủ đề chưa có dữ liệu.</p></section>`;
  }
  function elementFrom(html){const holder=document.createElement('div');holder.innerHTML=html;return holder.firstElementChild}
  function injectHistory(){
    const app=document.getElementById('app');if(!app)return;
    const h=app.querySelector('.sectionhead h2');if(!h||!/Kết quả học tập/i.test(h.textContent||''))return;
    const d=windowData(),sig=signature(d);let box=app.querySelector('.weekly-report');
    if(!box){box=elementFrom(reportHTML(d));h.closest('.sectionhead').insertAdjacentElement('afterend',box)}
    else if(box.dataset.weeklySignature!==sig){const fresh=elementFrom(reportHTML(d));box.replaceWith(fresh);box=fresh}
    const anchor=app.querySelector('.learning-insights')||app.querySelector('.wrong-book-summary');
    if(anchor&&box&&anchor.nextElementSibling!==box)anchor.insertAdjacentElement('afterend',box);
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