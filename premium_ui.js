/* AURA STUDY — Premium interaction layer. No study content is changed. */
(function(){
  const navMap=[
    ['home','home'],['library','library'],['generator','generator'],['history','history'],['guide','guide']
  ];

  function activePage(){
    return document.querySelector('.side .navbtn.active')?.dataset.page || 'home';
  }

  function syncMobileNav(){
    const page=activePage();
    document.querySelectorAll('.mobilebar button').forEach(btn=>{
      const oc=btn.getAttribute('onclick')||'';
      const hit=navMap.find(([,fn])=>oc.includes(fn+'('));
      const on=!!hit&&hit[0]===page;
      btn.classList.toggle('mobile-active',on);
      if(on)btn.setAttribute('aria-current','page'); else btn.removeAttribute('aria-current');
    });
    document.body.dataset.auraPage=page;
  }

  function upgradeAccessibility(){
    document.querySelectorAll('.navbtn,.mobilebar button,.btn').forEach(el=>{
      if(!el.hasAttribute('type')&&el.tagName==='BUTTON')el.setAttribute('type','button');
    });
    const app=document.querySelector('#app');
    if(app){app.setAttribute('role','main');app.setAttribute('aria-live','polite')}
  }

  function animatePage(){
    const app=document.querySelector('#app');if(!app)return;
    app.classList.add('aura-page-refresh');
    requestAnimationFrame(()=>requestAnimationFrame(()=>app.classList.remove('aura-page-refresh')));
  }

  function refineDetails(){
    document.querySelectorAll('details').forEach(d=>{
      if(d.dataset.auraPremium)return;
      d.dataset.auraPremium='1';
      const s=d.querySelector(':scope > summary');
      if(s)s.setAttribute('role','button');
    });
  }

  function decorate(){
    document.body.classList.add('aura-premium');
    syncMobileNav();upgradeAccessibility();refineDetails();
  }

  let scheduled=false;
  function queue(){
    if(scheduled)return;scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;decorate()});
  }

  function wrapNavigation(name){
    const original=window[name];
    if(typeof original!=='function'||original.__auraPremiumWrapped)return;
    const wrapped=function(...args){
      const result=original.apply(this,args);
      syncMobileNav();animatePage();queue();
      return result;
    };
    wrapped.__auraPremiumWrapped=true;
    window[name]=wrapped;
  }

  function init(){
    ['home','library','generator','history','guide'].forEach(wrapNavigation);
    decorate();
    const app=document.querySelector('#app');
    if(app)new MutationObserver(queue).observe(app,{childList:true,subtree:true});
    new MutationObserver(syncMobileNav).observe(document.body,{attributes:true,subtree:true,attributeFilter:['class']});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
