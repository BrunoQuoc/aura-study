/* AURA STUDY — exam presentation cleanup only */
(function(){
  const TECH_NOTE='Hình trong đề có chú thích nguồn.';
  function tidyExam(){
    document.querySelectorAll('.answer-option>span>b').forEach(b=>{
      const t=(b.textContent||'').trim();
      if(/^[ABCD]\.$/.test(t))b.textContent=t.slice(0,-1);
    });
    document.querySelectorAll('#app .note').forEach(note=>{
      const text=(note.textContent||'').trim();
      if(text.startsWith(TECH_NOTE))note.remove();
    });
  }
  let queued=false;
  function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;tidyExam()})}
  function init(){tidyExam();const app=document.getElementById('app');if(app)new MutationObserver(queue).observe(app,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
