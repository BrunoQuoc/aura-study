/* AURA STUDY — load local accounts and wire Admin student navigation */
(function(){
  if(window.__AURA_LOCAL_ACCOUNTS_LOADER__)return;window.__AURA_LOCAL_ACCOUNTS_LOADER__=true;
  const MIGRATION_KEY='aura_student_legacy_migrated_v1';
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
  function installLegacyMigration(){
    if(!document.body.classList.contains('student-shell')||window.__AURA_LEGACY_STUDENT_MIGRATION__||typeof window.auraStudentLogin!=='function'||!window.AURA_LOCAL_ACCOUNTS)return;
    window.__AURA_LEGACY_STUDENT_MIGRATION__=true;
    const base=window.auraStudentLogin;
    window.auraStudentLogin=async function(e){
      const pending=localStorage.getItem(MIGRATION_KEY)!=='1';
      const legacy={};
      if(pending){for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(window.AURA_LOCAL_ACCOUNTS.isLearningKey(k)){const v=localStorage.getItem(k);if(v!=null)legacy[k]=v}}}
      const out=await base.apply(this,arguments);
      const session=(()=>{try{return JSON.parse(localStorage.getItem('aura_student_session_v1')||'null')}catch(_){return null}})();
      if(pending&&session?.studentId){
        const p=window.AURA_LOCAL_ACCOUNTS.profile(session.studentId)||{},hasProfile=Object.keys(p.data||{}).length>0;
        if(!hasProfile&&Object.keys(legacy).length){localStorage.setItem(`aura_student_profile_v1:${session.studentId}`,JSON.stringify({data:legacy,savedAt:new Date().toISOString(),migratedFromLegacy:true}));window.AURA_LOCAL_ACCOUNTS.restore(session.studentId);setTimeout(()=>{if(typeof window.home==='function')window.home()},0)}
        localStorage.setItem(MIGRATION_KEY,'1');
      }
      return out;
    };
  }
  function ready(){addAdminNav();installLegacyMigration();if(document.body.classList.contains('admin-shell'))new MutationObserver(addAdminNav).observe(document.body,{childList:true,subtree:true})}
  const existing=document.querySelector('script[data-aura-local-accounts]');
  if(existing){if(window.AURA_LOCAL_ACCOUNTS)ready();else existing.addEventListener('load',ready,{once:true});return}
  const s=document.createElement('script');s.src='local_accounts.js?v=accounts-r1';s.async=false;s.dataset.auraLocalAccounts='1';s.onload=ready;document.head.appendChild(s);
})();