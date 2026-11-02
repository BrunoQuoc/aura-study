/* AURA STUDY — shared Google Drive OAuth session for all Admin Drive modules.
   One browser-memory access token per Admin page. No token is written to localStorage/sessionStorage. */
(function(){
  if(!document.body.classList.contains('admin-shell'))return;

  const state={token:'',expiresAt:0,pending:null,originalInit:null,patched:false,gsiPromise:null};
  const valid=()=>!!state.token&&Date.now()<state.expiresAt-30000;
  const remaining=()=>Math.max(60,Math.floor((state.expiresAt-Date.now())/1000));

  function clear(){state.token='';state.expiresAt=0}
  function remember(r){
    state.token=r?.access_token||'';
    state.expiresAt=Date.now()+Math.max(60,Number(r?.expires_in||3600)-60)*1000;
    return state.token;
  }

  function markLoaded(){const s=document.getElementById('aura-google-gsi');if(s)s.dataset.loaded='1'}

  function patch(){
    if(state.patched)return true;
    const oauth=window.google?.accounts?.oauth2;
    if(!oauth?.initTokenClient)return false;
    state.originalInit=oauth.initTokenClient.bind(oauth);
    oauth.initTokenClient=function(config){
      const proxy={callback:config?.callback||function(){},error_callback:null};
      proxy.requestAccessToken=function(options={}){
        if(valid()){
          const response={access_token:state.token,expires_in:remaining(),token_type:'Bearer',scope:config?.scope||''};
          queueMicrotask(()=>{try{proxy.callback?.(response)}catch(_){}});
          return;
        }
        if(state.pending){
          state.pending.then(r=>{try{proxy.callback?.(r)}catch(_){}}).catch(e=>{try{proxy.error_callback?.({type:e?.message||'oauth_error',message:e?.message||String(e)})}catch(_){}});
          return;
        }
        state.pending=new Promise((resolve,reject)=>{
          const real=state.originalInit(config||{});
          real.callback=r=>{
            if(r?.error){clear();reject(new Error(r.error_description||r.error));return}
            remember(r);resolve({...r,access_token:state.token,expires_in:remaining()});
          };
          real.error_callback=e=>{clear();reject(new Error(e?.message||e?.type||'Không thể xác thực Google Drive.'))};
          try{real.requestAccessToken(options||{})}catch(e){clear();reject(e)}
        }).finally(()=>{state.pending=null});
        state.pending.then(r=>{try{proxy.callback?.(r)}catch(_){}}).catch(e=>{try{proxy.error_callback?.({type:e?.message||'oauth_error',message:e?.message||String(e)})}catch(_){}});
      };
      return proxy;
    };
    state.patched=true;markLoaded();return true;
  }

  function ensureGsi(){
    if(patch())return Promise.resolve();
    if(state.gsiPromise)return state.gsiPromise;
    state.gsiPromise=new Promise((resolve,reject)=>{
      let s=document.getElementById('aura-google-gsi');
      if(!s){s=document.createElement('script');s.id='aura-google-gsi';s.src='https://accounts.google.com/gsi/client';s.async=true;s.defer=true;document.head.appendChild(s)}
      const started=Date.now();
      const timer=setInterval(()=>{
        if(patch()){clearInterval(timer);resolve();return}
        if(Date.now()-started>15000){clearInterval(timer);reject(new Error('Không tải được Google Identity Services.'))}
      },50);
      s.addEventListener('error',()=>{clearInterval(timer);reject(new Error('Không tải được Google Identity Services.'))},{once:true});
    }).catch(e=>{state.gsiPromise=null;throw e});
    return state.gsiPromise;
  }

  window.AURA_DRIVE_AUTH=Object.freeze({
    ensure:ensureGsi,
    clear,
    hasToken:valid,
    get token(){return valid()?state.token:''},
    status(){return {connected:valid(),expiresAt:state.expiresAt}}
  });

  ensureGsi().catch(()=>{});
})();
