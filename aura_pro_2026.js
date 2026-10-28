/* AURA STUDY — Professional UI behavior layer. Visual/chrome only. */
(function(){
  const ICONS={
    home:'<path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10.5V20h11v-9.5"/><path d="M10 20v-5h4v5"/>',
    library:'<path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H11v16H7.5A2.5 2.5 0 0 0 5 21V5.5Z"/><path d="M19 5.5A2.5 2.5 0 0 0 16.5 3H13v16h3.5A2.5 2.5 0 0 1 19 21V5.5Z"/>',
    lessons:'<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    generator:'<path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/>',
    history:'<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 5v5h5"/><path d="M12 8v4l3 2"/>',
    guide:'<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 1 1 3.5 2.1c-.9.5-1.3 1-1.3 1.9"/><path d="M12 17h.01"/>'
  };
  function icon(name){return `<svg class="ui-icon pro-nav-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]||ICONS.lessons}</svg>`}
  function decorateSide(){
    document.querySelectorAll('.side .navbtn').forEach(btn=>{
      const page=btn.dataset.page||'';
      if(!ICONS[page])return;
      const text=(btn.querySelector('span')?.textContent||btn.textContent||'').trim().replace(/^[^\p{L}\p{N}]+/u,'');
      if(btn.dataset.pro2026===text)return;
      btn.innerHTML=`${icon(page)}<span>${text}</span>`;
      btn.dataset.pro2026=text;
    });
  }
  function fnPage(oc){
    if(/home\s*\(/.test(oc))return'home';
    if(/lessons?\s*\(/.test(oc))return'lessons';
    if(/library\s*\(|studentReviewHub\s*\(/.test(oc))return'library';
    if(/generator\s*\(/.test(oc))return'generator';
    if(/history\s*\(/.test(oc))return'history';
    if(/guide\s*\(/.test(oc))return'guide';
    return'';
  }
  function decorateMobile(){
    document.querySelectorAll('.mobilebar button').forEach(btn=>{
      const page=fnPage(btn.getAttribute('onclick')||'');if(!page||!ICONS[page])return;
      const text=(btn.querySelector('small')?.textContent||btn.textContent||'').trim().replace(/^[^\p{L}\p{N}]+/u,'');
      if(btn.dataset.pro2026===text)return;
      btn.innerHTML=`${icon(page)}<small>${text}</small>`;
      btn.dataset.pro2026=text;
    });
  }
  function normalizeChrome(){
    document.body.classList.add('aura-pro-2026');
    decorateSide();decorateMobile();
    const account=document.querySelector('.aura-account');
    if(account)account.setAttribute('aria-label','Chế độ hiện tại');
  }
  let queued=false;
  function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;normalizeChrome()})}
  function init(){normalizeChrome();new MutationObserver(queue).observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

(function loadReviewExperience(){
  if(!document.querySelector('link[data-aura-review]')){
    const link=document.createElement('link');
    link.rel='stylesheet';link.href='review_experience.css?v=worked-r3';link.dataset.auraReview='1';document.head.appendChild(link);
  }
  if(!document.querySelector('script[data-aura-review]')){
    const script=document.createElement('script');
    script.src='review_experience.js?v=worked-r3';script.async=false;script.dataset.auraReview='1';document.head.appendChild(script);
  }
})();

(function loadExamExperience(){
  if(!document.querySelector('link[data-aura-exam]')){
    const link=document.createElement('link');
    link.rel='stylesheet';link.href='exam_ui.css?v=exam-r1';link.dataset.auraExam='1';document.head.appendChild(link);
  }
  if(!document.querySelector('script[data-aura-exam]')){
    const script=document.createElement('script');
    script.src='exam_ui.js?v=exam-r1';script.async=false;script.dataset.auraExam='1';document.head.appendChild(script);
  }
})();

(function loadTimedExamExperience(){
  if(!document.querySelector('link[data-aura-timer]')){
    const link=document.createElement('link');
    link.rel='stylesheet';link.href='exam_timer.css?v=timer-r2';link.dataset.auraTimer='1';document.head.appendChild(link);
  }
  if(!document.querySelector('script[data-aura-timer]')){
    const script=document.createElement('script');
    script.src='exam_timer.js?v=timer-r2';script.async=false;script.dataset.auraTimer='1';document.head.appendChild(script);
  }
})();
