/* AURA STUDY — Admin-only report reset */
(function(){
  if(!document.body.classList.contains('admin-shell'))return;

  const EXACT_KEYS=['aura_attempts','aura_wrong_book_v1','aura_smart_stats','aura_smart_graded_ids','aura_exam_period'];
  const RESET_CUTOFF='aura_report_reset_at';

  function reportKeys(){
    const keys=[];
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i)||'';
      if(EXACT_KEYS.includes(k))keys.push(k);
    }
    return keys;
  }
  function reviewKeys(){
    const keys=[];
    for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i)||'';if(k.startsWith('review_'))keys.push(k)}
    return keys;
  }
  function clearReviewProgress(){
    reviewKeys().forEach(k=>{
      try{
        const st=JSON.parse(localStorage.getItem(k)||'{}');
        const done=Array.isArray(st.done)?st.done.map(()=>false):[];
        localStorage.setItem(k,JSON.stringify({...st,done,updatedAt:''}));
      }catch(_){ }
    });
  }
  function counts(){
    let attempts=0,wrong=0,reviews=0,skills=0;
    try{attempts=JSON.parse(localStorage.getItem('aura_attempts')||'[]').length||0}catch(_){ }
    try{wrong=Object.keys(JSON.parse(localStorage.getItem('aura_wrong_book_v1')||'{}')).length}catch(_){ }
    try{skills=Object.keys(JSON.parse(localStorage.getItem('aura_smart_stats')||'{}')).length}catch(_){ }
    reviews=reviewKeys().length;
    return {attempts,wrong,reviews,skills};
  }
  function removeModal(){document.querySelector('.aura-reset-modal')?.remove()}
  function modal(){
    removeModal();
    const c=counts(),wrap=document.createElement('div');
    wrap.className='aura-reset-modal';
    wrap.innerHTML=`<div class="aura-reset-backdrop" onclick="auraCloseReportReset()"></div><section class="aura-reset-dialog" role="dialog" aria-modal="true" aria-labelledby="auraResetTitle"><div class="aura-reset-icon">↺</div><div class="aura-reset-copy"><div class="small">ADMIN · DỮ LIỆU HỌC TẬP</div><h2 id="auraResetTitle">Reset báo cáo học tập?</h2><p>Thao tác này đưa báo cáo trên thiết bị này về trạng thái mới. Kho tài liệu, đề thi, metadata và nội dung bé đã gõ trong bài ôn vẫn được giữ nguyên.</p></div><div class="aura-reset-summary"><div><span>Bài có điểm</span><b>${c.attempts}</b></div><div><span>Câu trong sổ sai</span><b>${c.wrong}</b></div><div><span>Bài ôn đang lưu</span><b>${c.reviews}</b></div></div><div class="aura-reset-kept"><b>Sẽ reset:</b> điểm/lịch sử chấm, Sổ câu sai, thống kê kỹ năng, trạng thái chống ghi nhận trùng và các dấu “đã ôn”. Câu trả lời đã nhập trong bài ôn vẫn được giữ.</div><div class="aura-reset-actions"><button class="btn soft" type="button" onclick="auraCloseReportReset()">Hủy</button><button class="btn soft" type="button" onclick="backup()">Sao lưu trước</button><button class="btn aura-reset-danger" type="button" onclick="auraConfirmReportReset(this)">Reset báo cáo</button></div></section>`;
    document.body.appendChild(wrap);
    setTimeout(()=>wrap.classList.add('open'),10);
  }

  window.auraOpenReportReset=modal;
  window.auraCloseReportReset=removeModal;
  window.auraConfirmReportReset=function(btn){
    if(!btn)return;
    if(btn.dataset.confirmed!=='1'){
      btn.dataset.confirmed='1';btn.textContent='Bấm lần nữa để reset';btn.classList.add('confirming');
      setTimeout(()=>{if(btn?.isConnected&&btn.dataset.confirmed==='1'){btn.dataset.confirmed='0';btn.textContent='Reset báo cáo';btn.classList.remove('confirming')}},5000);
      return;
    }
    const keys=reportKeys();keys.forEach(k=>localStorage.removeItem(k));
    clearReviewProgress();
    localStorage.setItem(RESET_CUTOFF,new Date().toISOString());
    removeModal();
    if(typeof window.history==='function')window.history();
    const toast=document.createElement('div');toast.className='aura-reset-toast';toast.textContent='Đã reset báo cáo. Câu trả lời trong bài ôn vẫn được giữ.';document.body.appendChild(toast);setTimeout(()=>toast.classList.add('show'),20);setTimeout(()=>toast.remove(),3000);
  };

  function injectButton(){
    const app=document.getElementById('app');if(!app)return;
    const head=app.querySelector('.sectionhead');if(!head||!/Kết quả học tập/i.test(head.textContent||''))return;
    if(head.querySelector('.aura-reset-report-btn'))return;
    const btn=document.createElement('button');btn.type='button';btn.className='btn soft aura-reset-report-btn';btn.textContent='Reset báo cáo';btn.onclick=modal;head.appendChild(btn);
  }
  let queued=false;
  function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;injectButton()})}
  function init(){injectButton();const app=document.getElementById('app');if(app)new MutationObserver(queue).observe(app,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
