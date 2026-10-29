/* AURA STUDY — load local accounts and wire Admin student navigation */
(function(){
  if(window.__AURA_LOCAL_ACCOUNTS_LOADER__)return;window.__AURA_LOCAL_ACCOUNTS_LOADER__=true;
  const MIGRATION_KEY='aura_student_legacy_migrated_v1',USERS_KEY='aura_local_students_v1',SESSION_KEY='aura_student_session_v1',PROFILE_PREFIX='aura_student_profile_v1:';
  const parse=(k,f)=>{try{const x=JSON.parse(localStorage.getItem(k)||JSON.stringify(f));return x??f}catch(_){return f}};
  function userCount(){const x=parse(USERS_KEY,[]);return Array.isArray(x)?x.length:0}
  function clearRuntimeTimers(){for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i)||'';if(k.startsWith('aura_exam_timer_'))localStorage.removeItem(k)}}
  function decorateStudentRows(){
    if(document.body.dataset.auraPage!=='students')return;
    document.querySelectorAll('#app .resource').forEach(row=>{
      const toggle=[...row.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes('auraToggleStudent('));if(!toggle||row.querySelector('[data-reset-learning]'))return;
      const m=(toggle.getAttribute('onclick')||'').match(/auraToggleStudent\('([^']+)'\)/);if(!m)return;
      const b=document.createElement('button');b.className='btn soft';b.type='button';b.dataset.resetLearning='1';b.textContent='Reset học';b.setAttribute('onclick',`auraResetStudentLearning('${m[1]}')`);toggle.insertAdjacentElement('afterend',b);
    });
  }
  function guardLegacyReset(){const b=document.querySelector('.aura-reset-report-btn');if(!b||!userCount())return;b.textContent='Reset theo học sinh';b.onclick=()=>{if(typeof window.auraStudentUsers==='function')window.auraStudentUsers()}}
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
    }
    if(mobile){mobile.style.setProperty('grid-template-columns',`repeat(${mobile.querySelectorAll('button').length},minmax(68px,1fr))`,'important');mobile.style.overflowX='auto'}
    decorateStudentRows();guardLegacyReset();
  }
  function installLegacyMigration(){
    if(!document.body.classList.contains('student-shell')||window.__AURA_LEGACY_STUDENT_MIGRATION__||typeof window.auraStudentLogin!=='function'||!window.AURA_LOCAL_ACCOUNTS)return;
    window.__AURA_LEGACY_STUDENT_MIGRATION__=true;
    const baseLogin=window.auraStudentLogin,baseLogout=window.auraStudentLogout;
    window.auraStudentLogin=async function(e){
      const pending=localStorage.getItem(MIGRATION_KEY)!=='1',legacy={};
      if(pending){for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(window.AURA_LOCAL_ACCOUNTS.isLearningKey(k)){const v=localStorage.getItem(k);if(v!=null)legacy[k]=v}}}
      const out=await baseLogin.apply(this,arguments);
      const session=parse(SESSION_KEY,null);
      if(session?.studentId){
        if(pending){const p=window.AURA_LOCAL_ACCOUNTS.profile(session.studentId)||{},hasProfile=Object.keys(p.data||{}).length>0;if(!hasProfile&&Object.keys(legacy).length){localStorage.setItem(`${PROFILE_PREFIX}${session.studentId}`,JSON.stringify({data:legacy,savedAt:new Date().toISOString(),migratedFromLegacy:true}));window.AURA_LOCAL_ACCOUNTS.restore(session.studentId)}localStorage.setItem(MIGRATION_KEY,'1')}
        clearRuntimeTimers();setTimeout(()=>location.reload(),0);
      }
      return out;
    };
    if(typeof baseLogout==='function')window.auraStudentLogout=function(){const out=baseLogout.apply(this,arguments);clearRuntimeTimers();setTimeout(()=>location.reload(),0);return out};
    window.addEventListener('storage',e=>{if(e.key===USERS_KEY||e.key===SESSION_KEY)location.reload()});
  }
  window.auraResetStudentLearning=function(id){
    const users=parse(USERS_KEY,[]),u=Array.isArray(users)?users.find(x=>x.id===id):null;if(!u)return;
    if(!confirm(`Reset tiến độ học tập của “${u.name}”?\n\nĐiểm, Sổ câu sai, thống kê kỹ năng và dấu đã ôn sẽ reset. Nội dung câu trả lời đã gõ trong bài ôn vẫn được giữ.`))return;
    const key=PROFILE_PREFIX+id,p=parse(key,{}),data={...(p.data||{})};
    ['aura_attempts','aura_wrong_book_v1','aura_smart_stats','aura_smart_graded_ids','aura_exam_period'].forEach(k=>delete data[k]);
    Object.keys(data).filter(k=>k.startsWith('review_')).forEach(k=>{try{const st=JSON.parse(data[k]||'{}');data[k]=JSON.stringify({...st,done:Array.isArray(st.done)?st.done.map(()=>false):[],updatedAt:''})}catch(_){}});
    data.aura_report_reset_at=new Date().toISOString();localStorage.setItem(key,JSON.stringify({...p,data,savedAt:new Date().toISOString()}));
    const sess=parse(SESSION_KEY,null);if(sess?.studentId===id){['aura_attempts','aura_wrong_book_v1','aura_smart_stats','aura_smart_graded_ids','aura_exam_period'].forEach(k=>localStorage.removeItem(k));for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i)||'';if(!k.startsWith('review_'))continue;try{const st=JSON.parse(localStorage.getItem(k)||'{}');localStorage.setItem(k,JSON.stringify({...st,done:Array.isArray(st.done)?st.done.map(()=>false):[],updatedAt:''}))}catch(_){}}localStorage.setItem('aura_report_reset_at',data.aura_report_reset_at)}
    alert(`Đã reset tiến độ của ${u.name}.`);if(typeof window.auraStudentUsers==='function')window.auraStudentUsers();
  };
  function ready(){addAdminNav();installLegacyMigration();if(document.body.classList.contains('admin-shell'))new MutationObserver(addAdminNav).observe(document.body,{childList:true,subtree:true})}
  const existing=document.querySelector('script[data-aura-local-accounts]');
  if(existing){if(window.AURA_LOCAL_ACCOUNTS)ready();else existing.addEventListener('load',ready,{once:true});return}
  const s=document.createElement('script');s.src='local_accounts.js?v=accounts-r1';s.async=false;s.dataset.auraLocalAccounts='1';s.onload=ready;document.head.appendChild(s);
})();