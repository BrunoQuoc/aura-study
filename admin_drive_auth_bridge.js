/* AURA STUDY — robust OAuth/Picker bridge for Admin Drive INBOX.
   Keeps auth/folder selection separate from upload/approval logic. */
(function(){
  if(!document.body.classList.contains('admin-shell'))return;
  const CFG=window.AURA_GOOGLE_DRIVE_CONFIG||{};
  const FOLDER_KEY='aura_drive_inbox_folder_v1';
  const SESSION_KEY='aura_drive_connected_account_v1';
  const runtime={token:'',expiresAt:0,client:null,tokenPromise:null,gsiPromise:null,gapiPromise:null,pickerReady:false};
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(_){return f}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  function friendlyError(err){
    const raw=String(err?.message||err?.type||err||'Không thể kết nối Google Drive.');
    const low=raw.toLowerCase();
    if(low.includes('origin_mismatch')||low.includes('invalid_client'))return `OAuth chưa cho phép origin ${location.origin}. Trong Google Cloud > Clients, Authorized JavaScript origins phải có đúng ${location.origin}`;
    if(low.includes('popup_failed_to_open')||low.includes('popup blocked'))return 'Trình duyệt đang chặn cửa sổ đăng nhập Google. Hãy cho phép pop-up cho brunoquoc.github.io rồi thử lại.';
    if(low.includes('popup_closed'))return 'Cửa sổ đăng nhập Google đã bị đóng trước khi hoàn tất.';
    if(low.includes('access_denied'))return 'Google chưa cấp quyền Drive cho AURA hoặc tài khoản đã từ chối quyền.';
    if(low.includes('interaction_required')||low.includes('login_required'))return 'Google yêu cầu đăng nhập lại. Hãy bấm Kết nối Google và chọn đúng tài khoản Drive.';
    if(low.includes('403'))return 'Google Drive từ chối quyền truy cập. Kiểm tra Drive API đã bật và tài khoản có quyền với thư mục 00_INBOX.';
    return raw;
  }

  function waitFor(test,timeout=12000){
    return new Promise((resolve,reject)=>{
      const start=Date.now();
      (async function poll(){
        if(test())return resolve();
        if(Date.now()-start>=timeout)return reject(new Error('Không tải được thư viện Google. Kiểm tra mạng hoặc chặn script của trình duyệt.'));
        await sleep(50);poll();
      })();
    });
  }

  function loadScript(id,src,test){
    if(test()){
      const s=document.getElementById(id);if(s)s.dataset.loaded='1';
      return Promise.resolve();
    }
    let s=document.getElementById(id);
    if(!s){s=document.createElement('script');s.id=id;s.src=src;s.async=true;s.defer=true;document.head.appendChild(s)}
    return waitFor(test).then(()=>{s.dataset.loaded='1'});
  }

  async function ensureGsi(){
    if(runtime.gsiPromise)return runtime.gsiPromise;
    runtime.gsiPromise=loadScript('aura-google-gsi','https://accounts.google.com/gsi/client',()=>!!window.google?.accounts?.oauth2).catch(e=>{runtime.gsiPromise=null;throw e});
    return runtime.gsiPromise;
  }

  async function ensurePicker(){
    if(runtime.pickerReady&&window.google?.picker)return;
    if(runtime.gapiPromise)return runtime.gapiPromise;
    runtime.gapiPromise=(async()=>{
      await loadScript('aura-google-api','https://apis.google.com/js/api.js',()=>!!window.gapi);
      await new Promise((resolve,reject)=>{try{gapi.load('picker',{callback:resolve,onerror:()=>reject(new Error('Không tải được Google Picker.'))})}catch(e){reject(e)}});
      runtime.pickerReady=!!window.google?.picker;
      if(!runtime.pickerReady)throw new Error('Google Picker chưa sẵn sàng.');
    })().catch(e=>{runtime.gapiPromise=null;throw e});
    return runtime.gapiPromise;
  }

  function tokenValid(){return runtime.token&&Date.now()<runtime.expiresAt-30000}
  async function requestToken(interactive=false){
    if(tokenValid()&&!interactive)return runtime.token;
    if(runtime.tokenPromise)return runtime.tokenPromise;
    await ensureGsi();
    if(!CFG.clientId)throw new Error('Thiếu Google OAuth Client ID.');
    if(!runtime.client)runtime.client=google.accounts.oauth2.initTokenClient({client_id:CFG.clientId,scope:CFG.scope||'https://www.googleapis.com/auth/drive.file',callback:()=>{}});
    runtime.tokenPromise=new Promise((resolve,reject)=>{
      const c=runtime.client;
      c.callback=r=>{
        if(r?.error){runtime.token='';runtime.expiresAt=0;reject(new Error(r.error_description||r.error));return}
        runtime.token=r.access_token||'';
        runtime.expiresAt=Date.now()+Math.max(60,Number(r.expires_in||3600)-60)*1000;
        resolve(runtime.token);
      };
      c.error_callback=e=>reject(new Error(e?.message||e?.type||'Không thể mở đăng nhập Google.'));
      c.requestAccessToken({prompt:interactive?'select_account':''});
    }).finally(()=>{runtime.tokenPromise=null});
    return runtime.tokenPromise;
  }

  async function driveJson(url,options={},interactive=false,retry=true){
    let token=await requestToken(interactive);
    const headers=new Headers(options.headers||{});headers.set('Authorization',`Bearer ${token}`);
    let res=await fetch(url,{...options,headers});
    if(res.status===401&&retry){runtime.token='';runtime.expiresAt=0;token=await requestToken(true);headers.set('Authorization',`Bearer ${token}`);res=await fetch(url,{...options,headers})}
    if(!res.ok){let msg=`Google Drive trả lỗi ${res.status}`;try{const d=await res.json();msg=d?.error?.message||msg}catch(_){ }throw new Error(msg)}
    return res.status===204?{}:res.json();
  }

  async function accountInfo(){const d=await driveJson('https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress)',{},false);return d?.user||{}}
  async function verifyFolder(f){
    if(!f?.id)throw new Error('Chưa chọn thư mục 00_INBOX.');
    const fields='id,name,mimeType,capabilities(canAddChildren)';
    const d=await driveJson(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(f.id)}?fields=${encodeURIComponent(fields)}`);
    if(d.mimeType!=='application/vnd.google-apps.folder')throw new Error('Mục đã lưu không phải thư mục.');
    if(d.name!==(CFG.expectedInboxName||'00_INBOX'))throw new Error(`Hãy chọn đúng thư mục ${CFG.expectedInboxName||'00_INBOX'}.`);
    if(d.capabilities&&d.capabilities.canAddChildren===false)throw new Error('Tài khoản hiện tại không có quyền thêm file vào 00_INBOX.');
    return {...f,name:d.name,verifiedAt:new Date().toISOString()};
  }

  async function pickInbox(){
    await ensurePicker();const token=await requestToken(false);
    return new Promise(resolve=>{
      const view=new google.picker.DocsView(google.picker.ViewId.DOCS).setIncludeFolders(true).setSelectFolderEnabled(true).setMimeTypes('application/vnd.google-apps.folder').setMode(google.picker.DocsViewMode.LIST);
      const picker=new google.picker.PickerBuilder().addView(view).setOAuthToken(token).setDeveloperKey(CFG.apiKey).setAppId(CFG.appId).setOrigin(location.origin).setTitle(`Chọn đúng thư mục ${CFG.expectedInboxName||'00_INBOX'}`).setCallback(data=>{
        const action=data[google.picker.Response.ACTION];
        if(action===google.picker.Action.PICKED){const doc=data[google.picker.Response.DOCUMENTS]?.[0];resolve(doc?{id:doc[google.picker.Document.ID],name:doc[google.picker.Document.NAME]||'',mimeType:doc[google.picker.Document.MIME_TYPE]||'',url:doc[google.picker.Document.URL]||''}:null)}
        else if(action===google.picker.Action.CANCEL)resolve(null);
      }).build();picker.setVisible(true);
    });
  }

  function saveAccount(user){
    const account={email:user?.emailAddress||'',name:user?.displayName||'',connectedAt:new Date().toISOString()};
    try{sessionStorage.setItem(SESSION_KEY,JSON.stringify(account))}catch(_){ }
    return account;
  }
  function currentAccount(){try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}}
  function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}
  function decorate(){
    if(document.body.dataset.auraPage!=='inbox')return;
    const acct=currentAccount();if(!acct)return;
    const summary=document.querySelector('.inbox-summary article:first-child');
    setText(summary?.querySelector('strong'),'ĐÃ KẾT NỐI');
    setText(summary?.querySelector('small'),acct.email?`Google: ${acct.email}`:'Google Drive đã xác thực');
  }

  const baseInbox=window.auraAdminInbox;
  function rerender(){if(typeof baseInbox==='function')baseInbox();else if(typeof window.auraAdminInbox==='function')window.auraAdminInbox();setTimeout(decorate,0)}

  window.auraConnectDrive=async function(){
    try{
      await Promise.all([ensureGsi(),ensurePicker()]);await requestToken(true);
      const user=await accountInfo();saveAccount(user);
      const old=read(FOLDER_KEY,null);
      if(old?.id){try{const checked=await verifyFolder(old);write(FOLDER_KEY,checked)}catch(_){localStorage.removeItem(FOLDER_KEY);rerender();alert(`Đã kết nối Google${user?.emailAddress?' ('+user.emailAddress+')':''}.\n\nThư mục 00_INBOX đã lưu trước đó không còn truy cập được bằng phiên Google này. Hãy bấm “Chọn 00_INBOX” và chọn lại một lần.`);return}}
      rerender();
    }catch(e){alert('Không thể kết nối Google Drive:\n'+friendlyError(e));rerender()}
  };

  window.auraSelectInboxFolder=async function(){
    try{
      await Promise.all([ensureGsi(),ensurePicker()]);if(!tokenValid())await requestToken(true);
      const user=await accountInfo();saveAccount(user);const picked=await pickInbox();if(!picked)return;
      const checked=await verifyFolder(picked);write(FOLDER_KEY,checked);rerender();
    }catch(e){alert('Không thể chọn 00_INBOX:\n'+friendlyError(e));rerender()}
  };

  window.addEventListener('aura-drive-auth-change',decorate);
  setTimeout(decorate,0);
})();