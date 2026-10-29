/* AURA STUDY — load local accounts and wire Admin student navigation */
(function(){
  if(window.__AURA_LOCAL_ACCOUNTS_LOADER__)return;window.__AURA_LOCAL_ACCOUNTS_LOADER__=true;
  function addAdminNav(){
    if(!document.body.classList.contains('admin-shell')||typeof window.auraStudentUsers!=='function')return;
    const side=document.querySelector('.side');
    if(side&&!side.querySelector('[data-page="students"]')){
      const b=document.createElement('button');b.className='navbtn';b.dataset.page='students';b.type='button';b.setAttribute('onclick','auraStudentUsers()');b.innerHTML='👥 <span>Học sinh</span>';
      const guide=side.querySelector('[data-page="guide"]');guide?side.insertBefore(b,guide):side.appendChild(b);
    }
    const mobile=document.querySelector('.mobilebar');
    if(mobile&&!mobile.querySelector('[data-aura-students]')){
      const b=document.createElement('button');b.type='button';b.dataset.auraStudents='1';b.setAttribute('onclick','auraStudentUsers()');b.innerHTML='👥<br><small>Học sinh</small>';
      const guide=[...mobile.querySelectorAll('button')].find(x=>(x.getAttribute('onclick')||'').includes('guide('));guide?mobile.insertBefore(b,guide):mobile.appendChild(b);
      mobile.style.gridTemplateColumns=`repeat(${mobile.querySelectorAll('button').length},minmax(68px,1fr))`;
      mobile.style.overflowX='auto';
    }
  }
  function ready(){addAdminNav();if(document.body.classList.contains('admin-shell'))new MutationObserver(addAdminNav).observe(document.body,{childList:true,subtree:true})}
  const existing=document.querySelector('script[data-aura-local-accounts]');
  if(existing){if(window.AURA_LOCAL_ACCOUNTS)ready();else existing.addEventListener('load',ready,{once:true});return}
  const s=document.createElement('script');s.src='local_accounts.js?v=accounts-r1';s.async=false;s.dataset.auraLocalAccounts='1';s.onload=ready;document.head.appendChild(s);
})();