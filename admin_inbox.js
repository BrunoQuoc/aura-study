/* AURA STUDY — Admin Drive INBOX upload + approval workflow */
(function(){
  if(!document.body.classList.contains('admin-shell'))return;

  const CFG=window.AURA_GOOGLE_DRIVE_CONFIG||{};
  const FOLDER_KEY='aura_drive_inbox_folder_v1';
  const QUEUE_KEY='aura_inbox_queue_v1';
  const GOOGLE_SCOPE=CFG.scope||'https://www.googleapis.com/auth/drive.file';
  const SUBJECTS=[
    ['','Chưa chọn môn'],['TOAN','Toán'],['NGUVAN','Ngữ văn'],['TIENGANH','Tiếng Anh'],
    ['KHTN','KHTN'],['LSDL','Lịch sử & Địa lý'],['GDCD','GDCD'],['TINHOC','Tin học'],['CONGNGHE','Công nghệ'],['KHAC','Khác']
  ];
  const DOC_TYPES=[
    ['','Chưa chọn loại tài liệu'],['exam','Đề kiểm tra / đề thi'],['practice','Đề ôn / bài tập'],
    ['lesson','Bài học / kiến thức'],['solution','Bài giải / lời giải'],['answer_key','Đáp án'],
    ['formula','Công thức / ghi nhớ'],['reference','Tài liệu tham khảo']
  ];
  const PERIODS=[['','Chưa gán kỳ'],['GK1','Giữa kỳ 1'],['CK1','Cuối kỳ 1'],['GK2','Giữa kỳ 2'],['CK2','Cuối kỳ 2']];
  const runtime={
    accessToken:'',tokenExpiresAt:0,tokenClient:null,tokenPromise:null,googlePromise:null,pickerPromise:null,
    selectedFiles:[],uploadState:new Map(),busy:false
  };

  const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch(_){return fallback}};
  const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const folder=()=>read(FOLDER_KEY,null);
  const queue=()=>{const q=read(QUEUE_KEY,[]);return Array.isArray(q)?q:[]};
  const saveQueue=rows=>write(QUEUE_KEY,(Array.isArray(rows)?rows:[]).slice(0,300));
  const now=()=>new Date().toISOString();
  const idSafe=s=>String(s||'').replace(/[^a-zA-Z0-9_-]/g,'_');
  const labelOf=(arr,id)=>arr.find(x=>x[0]===id)?.[1]||id||'';
  const formatBytes=n=>{n=Number(n||0);if(!n)return'0 B';const u=['B','KB','MB','GB'],i=Math.min(u.length-1,Math.floor(Math.log(n)/Math.log(1024)));return `${(n/Math.pow(1024,i)).toFixed(i?1:0)} ${u[i]}`};
  const formatDate=s=>{try{return new Date(s).toLocaleString('vi-VN')}catch(_){return String(s||'')}};

  function upsertQueue(entry){
    const rows=queue(),i=rows.findIndex(x=>x.driveFileId===entry.driveFileId);
    if(i>=0)rows[i]={...rows[i],...entry};else rows.unshift(entry);
    saveQueue(rows);return entry;
  }
  function patchQueue(fileId,patch){
    const rows=queue(),i=rows.findIndex(x=>x.driveFileId===fileId);if(i<0)return null;
    rows[i]={...rows[i],...patch};saveQueue(rows);return rows[i];
  }

  function loadScript(id,src){
    const existing=document.getElementById(id);if(existing&&existing.dataset.loaded==='1')return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const s=existing||document.createElement('script');
      const done=()=>{s.dataset.loaded='1';resolve()};
      if(existing){s.addEventListener('load',done,{once:true});s.addEventListener('error',reject,{once:true});return}
      s.id=id;s.src=src;s.async=true;s.defer=true;s.onload=done;s.onerror=()=>reject(new Error('Không tải được thư viện Google.'));
      document.head.appendChild(s);
    });
  }
  async function ensureGoogle(){
    if(runtime.googlePromise)return runtime.googlePromise;
    runtime.googlePromise=Promise.all([
      loadScript('aura-google-gsi','https://accounts.google.com/gsi/client'),
      loadScript('aura-google-api','https://apis.google.com/js/api.js')
    ]).then(()=>new Promise((resolve,reject)=>{
      if(!window.gapi)return reject(new Error('Google API chưa sẵn sàng.'));
      gapi.load('picker',{callback:resolve,onerror:()=>reject(new Error('Không tải được Google Picker.'))});
    }));
    return runtime.googlePromise;
  }
  function tokenValid(){return runtime.accessToken&&Date.now()<runtime.tokenExpiresAt-30000}
  async function ensureToken(interactive=false){
    if(tokenValid())return runtime.accessToken;
    if(runtime.tokenPromise)return runtime.tokenPromise;
    await ensureGoogle();
    if(!CFG.clientId)throw new Error('Thiếu Google OAuth Client ID.');
    if(!runtime.tokenClient){
      runtime.tokenClient=google.accounts.oauth2.initTokenClient({client_id:CFG.clientId,scope:GOOGLE_SCOPE,callback:()=>{}});
    }
    runtime.tokenPromise=new Promise((resolve,reject)=>{
      const client=runtime.tokenClient;
      client.callback=response=>{
        if(response?.error){runtime.accessToken='';runtime.tokenExpiresAt=0;reject(new Error(response.error_description||response.error));return}
        runtime.accessToken=response.access_token||'';
        runtime.tokenExpiresAt=Date.now()+Math.max(60,Number(response.expires_in||3600)-60)*1000;
        resolve(runtime.accessToken);
      };
      client.error_callback=err=>reject(new Error(err?.message||err?.type||'Không thể kết nối Google.'));
      client.requestAccessToken({prompt:interactive?'select_account':''});
    }).finally(()=>{runtime.tokenPromise=null});
    return runtime.tokenPromise;
  }
  function clearToken(){runtime.accessToken='';runtime.tokenExpiresAt=0}

  async function driveFetch(url,options={},interactive=false,retry=true){
    const token=await ensureToken(interactive);
    const headers=new Headers(options.headers||{});headers.set('Authorization',`Bearer ${token}`);
    const res=await fetch(url,{...options,headers});
    if(res.status===401&&retry){clearToken();return driveFetch(url,options,false,false)}
    if(!res.ok){
      let message=`Google Drive trả lỗi ${res.status}`;
      try{const data=await res.json();message=data?.error?.message||message}catch(_){ }
      throw new Error(message);
    }
    return res;
  }
  async function driveJson(url,options={},interactive=false){const res=await driveFetch(url,options,interactive);return res.status===204?{}:res.json()}

  async function pickFolder(title){
    await ensureGoogle();const token=await ensureToken(!runtime.accessToken);
    return new Promise(resolve=>{
      const view=new google.picker.DocsView(google.picker.ViewId.DOCS)
        .setIncludeFolders(true).setSelectFolderEnabled(true)
        .setMimeTypes('application/vnd.google-apps.folder')
        .setMode(google.picker.DocsViewMode.LIST);
      const picker=new google.picker.PickerBuilder()
        .addView(view).setOAuthToken(token).setDeveloperKey(CFG.apiKey).setAppId(CFG.appId)
        .setOrigin(window.location.origin).setTitle(title||'Chọn thư mục Google Drive')
        .setCallback(data=>{
          const action=data[google.picker.Response.ACTION];
          if(action===google.picker.Action.PICKED){
            const doc=data[google.picker.Response.DOCUMENTS]?.[0];
            resolve(doc?{
              id:doc[google.picker.Document.ID],name:doc[google.picker.Document.NAME]||'',
              mimeType:doc[google.picker.Document.MIME_TYPE]||'',url:doc[google.picker.Document.URL]||''
            }:null);
          }else if(action===google.picker.Action.CANCEL)resolve(null);
        }).build();
      picker.setVisible(true);
    });
  }

  async function verifyFolder(f){
    if(!f?.id)throw new Error('Chưa chọn thư mục INBOX.');
    const fields='id,name,mimeType,capabilities(canAddChildren)';
    const data=await driveJson(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(f.id)}?fields=${encodeURIComponent(fields)}`);
    if(data.mimeType!=='application/vnd.google-apps.folder')throw new Error('Mục đã chọn không phải thư mục.');
    if(data.name!==(CFG.expectedInboxName||'00_INBOX'))throw new Error(`Hãy chọn đúng thư mục ${CFG.expectedInboxName||'00_INBOX'}.`);
    if(data.capabilities&&data.capabilities.canAddChildren===false)throw new Error('Tài khoản hiện tại không có quyền thêm file vào 00_INBOX.');
    return {...f,name:data.name,verifiedAt:now()};
  }

  function optionsHTML(rows,value=''){return rows.map(([id,label])=>`<option value="${esc(id)}" ${id===value?'selected':''}>${esc(label)}</option>`).join('')}
  function selectedFilesHTML(){
    if(!runtime.selectedFiles.length)return'<div class="inbox-empty-mini">Chưa chọn file từ thiết bị.</div>';
    return `<div class="inbox-local-list">${runtime.selectedFiles.map((f,i)=>{
      const st=runtime.uploadState.get(i)||{};
      return `<div class="inbox-local-file"><div><b>${esc(f.name)}</b><small>${esc(f.type||'application/octet-stream')} · ${formatBytes(f.size)}</small></div><span class="inbox-upload-state ${esc(st.kind||'')}">${esc(st.text||'Sẵn sàng')}</span></div>`;
    }).join('')}</div>`;
  }

  function reviewCard(item){
    const safe=idSafe(item.driveFileId),approved=item.status==='APPROVED';
    if(approved)return `<article class="card inbox-review-item approved"><div class="inbox-file-head"><div><span class="inbox-state approved">ĐÃ DUYỆT</span><h3>${esc(item.name)}</h3><small>${formatBytes(item.size)} · ${esc(labelOf(SUBJECTS,item.subject))} · ${esc(labelOf(DOC_TYPES,item.docType))}${item.period?` · ${esc(labelOf(PERIODS,item.period))}`:''}</small></div>${item.webViewLink?`<a class="btn soft" href="${esc(item.webViewLink)}" target="_blank" rel="noopener">Mở file</a>`:''}</div><div class="inbox-approved-dest"><b>Đã chuyển tới:</b> ${esc(item.destinationName||'thư mục đã chọn')}<small>${item.approvedAt?` · ${esc(formatDate(item.approvedAt))}`:''}</small></div></article>`;
    return `<article class="card inbox-review-item" data-drive-id="${esc(item.driveFileId)}" id="inbox-${safe}">
      <div class="inbox-file-head"><div><span class="inbox-state waiting">CHỜ ADMIN DUYỆT</span><h3>${esc(item.name)}</h3><small>${formatBytes(item.size)} · upload ${esc(formatDate(item.uploadedAt))}</small></div>${item.webViewLink?`<a class="btn soft" href="${esc(item.webViewLink)}" target="_blank" rel="noopener">Mở file</a>`:''}</div>
      <div class="inbox-review-grid">
        <label><b>Môn</b><select class="inbox-subject">${optionsHTML(SUBJECTS,item.subject||'')}</select></label>
        <label><b>Loại tài liệu</b><select class="inbox-doctype">${optionsHTML(DOC_TYPES,item.docType||'')}</select></label>
        <label><b>Kỳ sử dụng</b><select class="inbox-period">${optionsHTML(PERIODS,item.period||'')}</select></label>
      </div>
      <label class="inbox-note"><b>Ghi chú Admin</b><input class="inbox-admin-note" type="text" value="${esc(item.adminNote||'')}" placeholder="Ví dụ: Đề GK1 đã kiểm tra đáp án"></label>
      <div class="inbox-review-actions"><button class="btn primary" type="button" onclick="auraApproveInboxFile('${esc(item.driveFileId)}')">Duyệt & chọn thư mục đích</button><button class="btn soft" type="button" onclick="auraKeepInboxFile('${esc(item.driveFileId)}')">Giữ lại INBOX</button></div>
      <p class="inbox-review-help">AURA không tự chuyển file. Sau khi bấm duyệt, Admin phải tự chọn thư mục đích trên Google Drive; file chỉ được move khi bước đó hoàn tất.</p>
    </article>`;
  }

  function render(){
    if(typeof window.setActive==='function')window.setActive('inbox');
    const app=document.getElementById('app');if(!app)return;
    const f=folder(),rows=queue(),waiting=rows.filter(x=>x.status!=='APPROVED'),approved=rows.filter(x=>x.status==='APPROVED');
    const connected=tokenValid();
    app.innerHTML=`<div class="sectionhead inbox-admin-head" style="margin-top:0"><div><h2>INBOX tài liệu</h2><span>Thiết bị → 00_INBOX → Admin duyệt → mới chuyển sang kho môn</span></div></div>
      <section class="inbox-summary"><article><span>GOOGLE DRIVE</span><strong>${connected?'ĐÃ KẾT NỐI':'CHƯA KẾT NỐI'}</strong><small>OAuth scope: drive.file</small></article><article><span>THƯ MỤC NHẬN</span><strong>${esc(f?.name||'Chưa chọn')}</strong><small>${f?.id?'Đã ghi nhớ trên thiết bị':'Admin chọn bằng Google Picker một lần'}</small></article><article><span>CHỜ DUYỆT</span><strong>${waiting.length}</strong><small>${approved.length} tài liệu đã duyệt trên thiết bị</small></article></section>

      <section class="card inbox-step"><div class="inbox-step-head"><div><span>01 · KẾT NỐI</span><h3>Google Drive & 00_INBOX</h3><p>Access token chỉ giữ trong phiên hiện tại; AURA không lưu token Google vào localStorage.</p></div><div class="inbox-actions"><button class="btn ${connected?'soft':'primary'}" type="button" onclick="auraConnectDrive()">${connected?'Kết nối lại Google':'Kết nối Google'}</button><button class="btn soft" type="button" onclick="auraSelectInboxFolder()">${f?'Chọn lại 00_INBOX':'Chọn 00_INBOX'}</button>${connected&&f?'<button class="btn soft" type="button" onclick="auraSyncInboxQueue()">Đồng bộ hàng chờ</button>':''}</div></div>${f?`<div class="inbox-folder-chip"><b>${esc(f.name)}</b><span>ID: ${esc(f.id)}</span></div>`:'<div class="inbox-warning">Chưa chọn 00_INBOX. File sẽ không được upload cho tới khi Admin xác nhận đúng thư mục bằng Google Picker.</div>'}</section>

      <section class="card inbox-step"><div class="inbox-step-head"><div><span>02 · UPLOAD</span><h3>Thêm tài liệu từ thiết bị</h3><p>Có thể chọn nhiều PDF, Word, Excel, PowerPoint, ảnh hoặc file khác. File gốc được giữ nguyên định dạng.</p></div><div class="inbox-actions"><input id="auraInboxFileInput" type="file" multiple hidden onchange="auraInboxFilesChosen(this.files)"><button class="btn soft" type="button" onclick="document.getElementById('auraInboxFileInput').click()">Chọn file</button><button class="btn primary" type="button" onclick="auraUploadInboxFiles()" ${runtime.selectedFiles.length&&f&&!runtime.busy?'':'disabled'}>Đẩy lên INBOX</button></div></div>${selectedFilesHTML()}</section>

      <section class="inbox-review-section"><div class="sectionhead"><div><h2>Duyệt INBOX</h2><span>File mới mặc định ở trạng thái Chờ Admin duyệt</span></div></div>${waiting.length?`<div class="inbox-review-list">${waiting.map(reviewCard).join('')}</div>`:'<div class="card inbox-empty"><b>Không có tài liệu đang chờ duyệt.</b><span>Sau khi upload thành công, tài liệu sẽ xuất hiện tại đây.</span></div>'}</section>
      ${approved.length?`<section class="inbox-approved-section"><div class="sectionhead"><div><h2>Đã duyệt gần đây</h2><span>Lịch sử cục bộ để truy vết thao tác Admin</span></div></div><div class="inbox-review-list">${approved.slice(0,12).map(reviewCard).join('')}</div></section>`:''}`;
    document.body.dataset.auraPage='inbox';
  }

  async function syncQueue(showAlert=false){
    const f=folder();if(!f?.id)throw new Error('Chưa chọn 00_INBOX.');
    const q=`'${f.id.replace(/'/g,"\\'")}' in parents and trashed = false`;
    const fields='files(id,name,mimeType,size,webViewLink,parents,appProperties,createdTime,modifiedTime)';
    const data=await driveJson(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=1000&orderBy=createdTime%20desc&fields=${encodeURIComponent(fields)}`);
    let count=0;
    (data.files||[]).forEach(file=>{
      if(file.appProperties?.auraState!=='WAITING_REVIEW')return;
      upsertQueue({driveFileId:file.id,name:file.name,mimeType:file.mimeType||'',size:Number(file.size||0),webViewLink:file.webViewLink||'',uploadedAt:file.appProperties?.auraUploadedAt||file.createdTime||now(),status:'WAITING_REVIEW',inboxFolderId:f.id,source:'ADMIN_DEVICE_UPLOAD'});count++;
    });
    render();if(showAlert)alert(`Đã đồng bộ ${count} tài liệu chờ duyệt từ 00_INBOX.`);return count;
  }

  async function uploadOne(file,f){
    const boundary='-------AURA'+Date.now().toString(36)+Math.random().toString(36).slice(2);
    const uploadedAt=now(),mime=file.type||'application/octet-stream';
    const metadata={name:file.name,parents:[f.id],appProperties:{auraState:'WAITING_REVIEW',auraOrigin:'ADMIN_DEVICE_UPLOAD',auraUploadedAt:uploadedAt}};
    const prefix=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`;
    const suffix=`\r\n--${boundary}--`;
    const body=new Blob([prefix,file,suffix],{type:`multipart/related; boundary=${boundary}`});
    const fields='id,name,mimeType,size,webViewLink,parents,appProperties,createdTime';
    const data=await driveJson(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=${encodeURIComponent(fields)}`,{method:'POST',headers:{'Content-Type':`multipart/related; boundary=${boundary}`},body});
    return upsertQueue({driveFileId:data.id,name:data.name||file.name,mimeType:data.mimeType||mime,size:Number(data.size||file.size||0),webViewLink:data.webViewLink||'',uploadedAt,status:'WAITING_REVIEW',inboxFolderId:f.id,source:'ADMIN_DEVICE_UPLOAD'});
  }

  function reviewPayload(fileId){
    const card=document.querySelector(`.inbox-review-item[data-drive-id="${CSS.escape(fileId)}"]`);if(!card)return null;
    return {subject:card.querySelector('.inbox-subject')?.value||'',docType:card.querySelector('.inbox-doctype')?.value||'',period:card.querySelector('.inbox-period')?.value||'',adminNote:card.querySelector('.inbox-admin-note')?.value?.trim()||''};
  }

  window.auraAdminInbox=render;
  window.auraConnectDrive=async function(){
    try{await ensureToken(true);const f=folder();if(f?.id){const verified=await verifyFolder(f);write(FOLDER_KEY,verified);await syncQueue(false)}else render()}
    catch(e){alert('Không thể kết nối Google Drive: '+(e?.message||e));render()}
  };
  window.auraSelectInboxFolder=async function(){
    try{
      await ensureToken(true);const picked=await pickFolder(`Chọn đúng thư mục ${CFG.expectedInboxName||'00_INBOX'}`);if(!picked)return;
      const verified=await verifyFolder(picked);write(FOLDER_KEY,verified);await syncQueue(false);render();
    }catch(e){alert('Không thể chọn 00_INBOX: '+(e?.message||e))}
  };
  window.auraInboxFilesChosen=function(fileList){runtime.selectedFiles=Array.from(fileList||[]);runtime.uploadState.clear();render()};
  window.auraUploadInboxFiles=async function(){
    if(runtime.busy)return;const f=folder();if(!f?.id){alert('Hãy chọn 00_INBOX trước.');return}if(!runtime.selectedFiles.length){alert('Hãy chọn ít nhất một file.');return}
    runtime.busy=true;const failures=[];
    try{
      await ensureToken(!runtime.accessToken);await verifyFolder(f);
      for(let i=0;i<runtime.selectedFiles.length;i++){
        const file=runtime.selectedFiles[i];runtime.uploadState.set(i,{kind:'working',text:'Đang tải…'});render();
        try{await uploadOne(file,f);runtime.uploadState.set(i,{kind:'done',text:'Đã lên INBOX'})}
        catch(e){failures.push(file);runtime.uploadState.set(i,{kind:'error',text:'Lỗi upload'});console.error(e)}
      }
      if(failures.length){runtime.selectedFiles=failures;alert(`${failures.length} file chưa upload được. Các file thành công đã nằm trong 00_INBOX.`)}else{runtime.selectedFiles=[];runtime.uploadState.clear()}
      await syncQueue(false);
    }catch(e){alert('Upload chưa hoàn tất: '+(e?.message||e))}
    finally{runtime.busy=false;render()}
  };
  window.auraSyncInboxQueue=async function(){try{await ensureToken(!runtime.accessToken);await syncQueue(true)}catch(e){alert('Không thể đồng bộ INBOX: '+(e?.message||e))}};
  window.auraKeepInboxFile=function(fileId){const p=reviewPayload(fileId);if(p)patchQueue(fileId,p);render()};
  window.auraApproveInboxFile=async function(fileId){
    const item=queue().find(x=>x.driveFileId===fileId);if(!item)return;
    const p=reviewPayload(fileId);if(!p)return;
    if(!p.subject){alert('Hãy chọn môn trước khi duyệt.');return}if(!p.docType){alert('Hãy chọn loại tài liệu trước khi duyệt.');return}
    try{
      await ensureToken(!runtime.accessToken);
      const dest=await pickFolder('Chọn thư mục đích sau khi Admin duyệt');if(!dest)return;
      const f=folder();if(dest.id===f?.id){alert('Thư mục đích không được là 00_INBOX. Nếu chưa muốn chuyển, dùng “Giữ lại INBOX”.');return}
      const approvedAt=now();
      const appProperties={auraState:'APPROVED',auraOrigin:'ADMIN_DEVICE_UPLOAD',auraUploadedAt:item.uploadedAt||'',auraApprovedAt:approvedAt,auraAssignedSubject:p.subject,auraAssignedDocType:p.docType,auraAssignedPeriod:p.period||'',auraAdminNote:p.adminNote.slice(0,500),auraDestinationName:(dest.name||'').slice(0,120)};
      const query=`addParents=${encodeURIComponent(dest.id)}&removeParents=${encodeURIComponent(f.id)}&fields=${encodeURIComponent('id,name,mimeType,size,webViewLink,parents,appProperties')}`;
      const data=await driveJson(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?${query}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({appProperties})});
      patchQueue(fileId,{...p,status:'APPROVED',approvedAt,destinationId:dest.id,destinationName:dest.name||'',webViewLink:data.webViewLink||item.webViewLink||'',parents:data.parents||[dest.id]});
      render();
    }catch(e){alert('Chưa thể duyệt & chuyển file: '+(e?.message||e))}
  };
})();
