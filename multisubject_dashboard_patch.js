/* AURA STUDY — keep dashboard summary consistent with multi-subject results */
(function(){
  function patch(){
    const api=window.AURA_RESULTS,card=document.querySelector('.dash-stats article:first-child');
    if(!api||!card)return;
    const a=api.attempts(),r=api.reviewProgress();
    const ids=new Set([...a.map(x=>x._subject||api.inferSubject(x)),...r.map(x=>x.subject)].filter(x=>x&&x!=='KHAC'));
    card.innerHTML=`<span>Môn đã học</span><strong>${ids.size}</strong><small>${ids.size?'Có hoạt động được ghi nhận':'Chưa có hoạt động'}</small>`;
  }
  const base=window.home;
  if(typeof base==='function'&&!base.__auraMultiDashboard){
    const wrapped=function(...args){const out=base.apply(this,args);setTimeout(patch,0);return out};
    wrapped.__auraMultiDashboard=true;window.home=wrapped;
  }
  patch();
})();
