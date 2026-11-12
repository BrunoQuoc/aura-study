/* AURA STUDY — shared Google Drive OAuth session for all Admin Drive modules.
   One browser-memory access token per Admin page. No token is written to localStorage/sessionStorage. */
(function(){
  if(!document.body.classList.contains('admin-shell'))return;

  const state={token:'',expiresAt:0,pending:null,originalInit:null,patched:false,gsiPromise:null,metadataToken:'',metadataExpiresAt:0,metadataPending:null};
  const METADATA_SCOPE='https://www.googleapis.com/auth/drive.metadata.readonly';
  const valid=()=>!!state.token&&Date.now()<state.expiresAt-30000;
  const remaining=()=>Math.max(60,Math.floor((state.expiresAt-Date.now())/1000));
  const emit=()=>{try{window.dispatchEvent(new CustomEvent('aura-drive-auth-change',{detail:{connected:valid(),expiresAt:state.expiresAt}}))}catch(_){}};

  function clear(){state.token='';state.expiresAt=0;state.metadataToken='';state.metadataExpiresAt=0;emit()}
  function remember(r){
    state.token=r?.access_token||'';
    state.expiresAt=Date.now()+Math.max(60,Number(r?.expires_in||3600)-60)*1000;
    emit();
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

  async function connect(interactive=true){
    await ensureGsi();
    if(valid())return state.token;
    const cfg=window.AURA_GOOGLE_DRIVE_CONFIG||{};
    if(!cfg.clientId)throw new Error('Thiếu Google OAuth Client ID.');
    return new Promise((resolve,reject)=>{
      const client=window.google.accounts.oauth2.initTokenClient({
        client_id:cfg.clientId,
        scope:cfg.scope||'https://www.googleapis.com/auth/drive.file',
        callback:()=>{}
      });
      client.callback=r=>{
        if(r?.error){reject(new Error(r.error_description||r.error));return}
        if(r?.access_token&&!valid())remember(r);
        resolve(valid()?state.token:(r?.access_token||''));
      };
      client.error_callback=e=>reject(new Error(e?.message||e?.type||'Không thể xác thực Google Drive.'));
      try{client.requestAccessToken({prompt:interactive?'select_account':''})}catch(e){reject(e)}
    });
  }

  // Separate consent and token for broad, READ-ONLY Drive metadata discovery.
  // IMPORTANT: use the real GIS client; the shared drive.file proxy cannot prove
  // that a token has metadata.readonly scope. Never persist or log this token.
  const metadataValid=()=>!!state.metadataToken&&Date.now()<state.metadataExpiresAt-30000;
  async function connectMetadataRead(){
    await ensureGsi();
    if(metadataValid())return state.metadataToken;
    if(state.metadataPending)return state.metadataPending;
    const cfg=window.AURA_GOOGLE_DRIVE_CONFIG||{};
    if(!cfg.clientId||!state.originalInit)throw new Error('Chưa cấu hình Google OAuth cho quyền đọc nguồn.');
    state.metadataPending=new Promise((resolve,reject)=>{
      const client=state.originalInit({
        client_id:cfg.clientId,
        scope:METADATA_SCOPE,
        include_granted_scopes:false,
        callback:()=>{}
      });
      client.callback=response=>{
        if(response?.error){reject(new Error(response.error_description||response.error));return}
        // Google Identity Services normally returns the scopes granted in response.scope.
        // Absence of a verifiable grant must not be treated as successful authorization.
        const granted=String(response?.scope||'').split(/\s+/);
        if(!response?.access_token||!granted.includes(METADATA_SCOPE)){
          reject(new Error('Google chưa xác nhận quyền drive.metadata.readonly. Kiểm tra OAuth consent và thử lại.'));
          return;
        }
        state.metadataToken=response.access_token;
        state.metadataExpiresAt=Date.now()+Math.max(60,Number(response.expires_in||3600)-60)*1000;
        emit();
        resolve(state.metadataToken);
      };
      client.error_callback=error=>reject(new Error(error?.message||error?.type||'Không kết nối được quyền chỉ đọc metadata.'));
      try{client.requestAccessToken({prompt:'consent'});}
      catch(error){reject(error);}
    }).finally(()=>{state.metadataPending=null});
    return state.metadataPending;
  }

  window.AURA_DRIVE_AUTH=Object.freeze({
    ensure:ensureGsi,
    connect,
    connectMetadataRead,
    hasMetadataToken:metadataValid,
    get metadataToken(){return metadataValid()?state.metadataToken:''},
    metadataScope:METADATA_SCOPE,
    clear,
    hasToken:valid,
    get token(){return valid()?state.token:''},
    status(){return {connected:valid(),expiresAt:state.expiresAt}}
  });

  ensureGsi().catch(()=>{});
})();
