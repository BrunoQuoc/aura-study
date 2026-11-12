/* AURA STUDY — Drive source review dashboard.
 * Explicit read-only OAuth and on-demand scan only; NO content extraction,
 * legacy upload approval, Drive writes or Question Bank publish.
 */
(function(){
  'use strict';
  if(!document.body.classList.contains('admin-shell'))return;
  const core=window.AURA_DRIVE_SOURCE_CORE;
  const app=document.getElementById('app');
  if(!core||!app)return;
  const CFG=window.AURA_GOOGLE_DRIVE_CONFIG||{};
  const QUEUE_KEY='aura_drive_source_review_queue_v1';
  const ROOT_KEY='aura_drive_source_inbox_root_v1';
  const LAST_KEY='aura_drive_source_last_scan_v1';
  const state={busy:false,error:'',notice:'',filter:'pending',subject:'ALL',offset:0};
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read=(key,fallback)=>{
    try{const data=JSON.parse(localStorage.getItem(key)||'null');return data==null?fallback:data;}
    catch(_){return fallback;}
  };
  const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  function records(){
    const rows=read(QUEUE_KEY,[]);
    return Array.isArray(rows)?rows.filter(x=>x&&core.validId(x.driveFileId)):[];
  }
  function rootValue(){
    const own=read(ROOT_KEY,'');
    if(typeof own==='string'&&core.validId(own))return own;
    const picker=read('aura_drive_inbox_folder_v1',null);
    return picker?.name==='00_INBOX'&&core.validId(picker.id)?picker.id:'';
  }
  const lastScan=()=>read(LAST_KEY,null);
  const connection=()=>!!window.AURA_DRIVE_AUTH?.hasMetadataToken?.();
  const subjects=()=>window.AURA_EXAM_METADATA?.subjects||{};
  function statusText(row){
    if(row.reviewStatus==='MISSING_FROM_INBOX')return 'Không còn trong INBOX';
    if(core.isBlocked(row.sourceGate))return 'Nguồn cần bổ sung';
    if(row.reviewStatus==='METADATA_REVIEWED')return 'Đã kiểm tra thông tin';
    return 'Chờ Admin kiểm tra';
  }
  function visible(row){
    if(state.subject!=='ALL'&&(row.confirmedSubject||row.suggestedSubject)!==state.subject)return false;
    if(state.filter==='all')return true;
    if(state.filter==='missing')return row.reviewStatus==='MISSING_FROM_INBOX';
    if(state.filter==='blocked')return row.reviewStatus!=='MISSING_FROM_INBOX'&&core.isBlocked(row.sourceGate);
    if(state.filter==='reviewed')return row.reviewStatus==='METADATA_REVIEWED';
    return row.reviewStatus==='WAITING_REVIEW' && !core.isBlocked(row.sourceGate);
  }
  function optionRows(values,current,firstValue='',firstLabel='Chưa xác định'){
    return [[firstValue,firstLabel],...Object.entries(values)].map(([value,label])=>
      '<option value="'+esc(value)+'" '+(value===current?'selected':'')+'>'+esc(label?.label||label)+'</option>').join('');
  }
  function dateText(iso){
    const time=Date.parse(iso||'');
    return Number.isFinite(time)?new Date(time).toLocaleString('vi-VN'):'Chưa có';
  }
  function card(row){
    const blocked=core.isBlocked(row.sourceGate);
    const missing=row.reviewStatus==='MISSING_FROM_INBOX';
    const reviewed=row.reviewStatus==='METADATA_REVIEWED';
    const reviewable=!blocked&&!missing;
    return '<article class="aura-source-card" data-source-id="'+esc(row.driveFileId)+'">'+
      '<div class="aura-source-card-head"><div><small>'+esc(row.sourcePath?.join(' / ')||'00_INBOX')+'</small>'+
      '<h3>'+esc(row.name)+'</h3><p>'+esc(row.mimeType||'Không rõ định dạng')+' · '+esc(dateText(row.modifiedTime))+'</p></div>'+
      '<span class="aura-source-pill '+(missing?'missing':blocked?'blocked':reviewed?'reviewed':'pending')+'">'+esc(statusText(row))+'</span></div>'+
      '<div class="aura-source-evidence"><b>Kiểm tra nguồn: '+esc(row.sourceGate||'CHƯA XÁC ĐỊNH')+'</b>'+
      '<p>'+esc(row.reason||'Chưa đủ thông tin xác nhận nguồn')+'</p>'+
      '<small>Đề xuất từ tên/thư mục chỉ để hỗ trợ phân loại; không xác nhận đáp án, hình ảnh hoặc nội dung.</small></div>'+
      '<div class="aura-source-form">'+
      '<label><b>Môn đề xuất</b><select data-source-field="subject" '+(!reviewable?'disabled':'')+'>'+
      optionRows(subjects(),row.confirmedSubject||row.suggestedSubject,'','Chọn môn')+'</select></label>'+
      '<label><b>Loại tài liệu</b><select data-source-field="docType" '+(!reviewable?'disabled':'')+'>'+
      optionRows(core.TYPES,row.confirmedDocType||row.suggestedDocType,'','Chọn loại')+'</select></label>'+
      '<label><b>Kỳ đề xuất</b><select data-source-field="period" '+(!reviewable?'disabled':'')+'>'+
      optionRows({GK1:'Giữa kỳ I',CK1:'Cuối kỳ I',GK2:'Giữa kỳ II',CK2:'Cuối kỳ II'},
        row.confirmedPeriod||row.suggestedPeriod,'','Chưa xác định kỳ')+'</select></label></div>'+
      '<label class="aura-source-note"><b>Ghi chú kiểm tra nguồn</b>'+
      '<textarea data-source-field="note" rows="2" maxlength="600" placeholder="Kết quả kiểm tra và thông tin còn thiếu...">'+
      esc(row.reviewNote||'')+'</textarea></label>'+
      (reviewable?
        '<label class="aura-source-ack"><input type="checkbox" data-source-field="ack">'+
        '<span>Tôi đã đối chiếu tên nguồn, môn và loại tài liệu. Đây chỉ là kiểm tra metadata, chưa xác nhận đủ câu hỏi/đáp án.</span></label>':'')+
      '<div class="aura-source-actions">'+
      (reviewable&&!reviewed?'<button type="button" class="btn primary" data-source-action="review">Ghi nhận đã kiểm tra thông tin</button>':'')+
      (reviewable&&reviewed?'<button type="button" class="btn soft" data-source-action="reopen">Yêu cầu kiểm tra lại</button>':'')+
      (blocked&&!missing?'<button type="button" class="btn soft" data-source-action="note">Lưu ghi chú — vẫn chặn nguồn</button>':'')+
      (row.webViewLink?'<a class="btn soft" href="'+esc(row.webViewLink)+'" target="_blank" rel="noopener noreferrer">Xem tài liệu gốc trên Drive</a>':'')+
      '</div>'+
      (missing?'<p class="aura-source-hint">File không còn trong cây 00_INBOX tại lần quét cuối. Có thể đã được di chuyển; không kết luận đã bị xóa.</p>':'')+
      '</article>';
  }
  function render(){
    try{window.setActive?.('driveSources');}catch(_){}
    document.body.dataset.auraPage='driveSources';
    const rows=records(),matches=rows.filter(visible),slice=matches.slice(state.offset,state.offset+35);
    const scan=lastScan();
    const stats={
      pending:rows.filter(x=>x.reviewStatus==='WAITING_REVIEW'&&!core.isBlocked(x.sourceGate)).length,
      blocked:rows.filter(x=>x.reviewStatus!=='MISSING_FROM_INBOX'&&core.isBlocked(x.sourceGate)).length,
      reviewed:rows.filter(x=>x.reviewStatus==='METADATA_REVIEWED').length,
      missing:rows.filter(x=>x.reviewStatus==='MISSING_FROM_INBOX').length
    };
    const root=rootValue();
    app.innerHTML='<div class="aura-source-ui">'+
      '<section class="aura-source-hero"><small>AURA STUDY / KHO NGUỒN / NHẬN TÀI LIỆU</small>'+
      '<h1>Đồng bộ nguồn từ Google Drive</h1>'+
      '<p>Quét các thư mục con của <b>00_INBOX</b>, đưa metadata tài liệu vào hàng chờ kiểm tra. '+
      'Tài liệu gốc vẫn ở Google Drive; chưa tải nội dung hoặc đưa câu hỏi vào đề thi.</p></section>'+
      '<div class="aura-source-metrics" aria-label="Lọc nhanh theo trạng thái nguồn">'+
      [['pending','Chờ kiểm tra',stats.pending],['blocked','Nguồn bị chặn',stats.blocked],
        ['reviewed','Đã xem thông tin',stats.reviewed],['missing','Không còn trong INBOX',stats.missing]]
      .map(([key,label,count])=>
        '<button type="button" class="aura-source-metric'+(state.filter===key?' is-selected':'')+
        '" data-source-metric="'+key+'" aria-pressed="'+(state.filter===key)+'" '+
        'aria-label="'+esc(label)+': '+count+' file. Xem danh sách">'+
        '<span>'+esc(label)+'</span><b>'+count+'</b><small>Chạm để xem danh sách →</small></button>'
      ).join('')+'</div>'+
      '<section class="aura-source-panel"><h2>01 · Kết nối quyền đọc nguồn</h2>'+
      '<p>Google sẽ yêu cầu quyền <b>đọc metadata của các file Drive mà tài khoản có quyền truy cập</b>. '+
      'Đây là quyền rộng ở cấp tài khoản Google; AURA chỉ thực hiện quét trong thư mục 00_INBOX anh chọn. '+
      'Token chỉ giữ trong bộ nhớ trang, không lưu trong trình duyệt hoặc đưa lên GitHub.</p>'+
      '<div class="aura-source-connect">'+
      '<span class="aura-source-pill '+(connection()?'reviewed':'pending')+'">'+
      (connection()?'Đã kết nối quyền đọc metadata':'Chưa kết nối')+'</span>'+
      '<button type="button" class="btn primary" data-source-action="connect" '+(state.busy?'disabled':'')+'>'+
      (connection()?'Kết nối lại':'Kết nối Google — chỉ đọc metadata')+'</button></div>'+
      '<label class="aura-source-root"><b>Liên kết hoặc ID thư mục 00_INBOX</b>'+
      '<input id="auraDriveSourceRoot" type="text" autocomplete="off" spellcheck="false" value="'+esc(root)+'" '+
      'placeholder="Dán liên kết folder 00_INBOX từ Google Drive"></label>'+
      '<p class="aura-source-footnote">Nếu chưa nhớ thư mục, anh có thể chọn 00_INBOX trong phần INBOX trước. '+
      'AURA xác minh đúng tên thư mục khi quét, không tự mở rộng sang Drive khác.</p>'+
      '<button type="button" class="btn primary" data-source-action="scan" '+(state.busy?'disabled':'')+'>'+
      (state.busy?'Đang quét thư mục…':'Quét nguồn và cập nhật hàng chờ')+'</button>'+
      '<div class="aura-source-footnote">'+(scan?.scannedAt?
      'Lần quét lưu trên thiết bị: '+esc(dateText(scan.scannedAt))+' · '+esc(scan.fileCount)+' file · '+esc(scan.folderCount)+' thư mục.':
      'Chưa có lần quét được lưu trên thiết bị này.')+'</div>'+
      '<p class="aura-source-danger">Không tự chạy nền, không tự xuất bản. Không nhập mật khẩu hoặc access token vào ô thư mục.</p>'+
      '</section>'+
      (state.error?'<div class="aura-source-error" role="alert">'+esc(state.error)+'</div>':'')+
      (state.notice?'<div class="aura-source-success" role="status">'+esc(state.notice)+'</div>':'')+
      '<section class="aura-source-panel aura-source-results" id="aura-source-review-results"><div class="aura-source-sectionhead"><div>'+
      '<h2>02 · Hàng chờ kiểm tra nguồn</h2>'+
      '<p>Kiểm tra môn, loại tài liệu, thông tin gốc. Hạng mục bị chặn phải bổ sung nguồn rồi quét lại.</p></div>'+
      '<b>'+matches.length+' / '+rows.length+' file</b></div>'+
      '<div class="aura-source-filters">'+
      '<label><b>Trạng thái</b><select data-source-filter="status">'+
      [['pending','Chờ kiểm tra'],['blocked','Nguồn bị chặn'],['reviewed','Đã xem thông tin'],['missing','Không còn trong INBOX'],['all','Tất cả']].map(([v,l])=>
        '<option value="'+v+'" '+(state.filter===v?'selected':'')+'>'+l+'</option>').join('')+'</select></label>'+
      '<label><b>Môn</b><select data-source-filter="subject">'+
      optionRows(subjects(),state.subject,'ALL','Tất cả môn')+'</select></label></div>'+
      (matches.length?slice.map(card).join(''):
        '<div class="aura-source-empty"><b>Chưa có tài liệu thuộc bộ lọc này.</b><p>'+
        (rows.length?'Đổi bộ lọc để xem các tài liệu đã ghi nhận.':
          'Bấm “Kết nối Google” rồi “Quét nguồn” để lập hàng chờ. Không có file được tự nhận khi chưa cấp quyền.')+
        '</p></div>')+
      (matches.length>35?'<div class="aura-source-pagination">'+
        '<button class="btn soft" data-source-action="prev" '+(state.offset===0?'disabled':'')+'>Trước</button>'+
        '<span>'+Math.min(state.offset+1,matches.length)+'–'+Math.min(state.offset+35,matches.length)+' / '+matches.length+'</span>'+
        '<button class="btn soft" data-source-action="next" '+(state.offset+35>=matches.length?'disabled':'')+'>Tiếp</button></div>':'')+
      '</section>'+
      '<p class="aura-source-footnote">Hàng chờ chỉ lưu trên thiết bị này. Nó <b>không kết nối</b> với nút duyệt/chuyển file của INBOX cũ; '+
      '“Đã xem thông tin” không có nghĩa câu hỏi đã đạt kiểm định nội dung hoặc sẵn sàng tự chấm.</p>'+
      '</div>';
  }
  async function driveGet(url,token){
    const response=await fetch(url,{method:'GET',
      headers:{Authorization:'Bearer '+token,Accept:'application/json'},cache:'no-store'});
    if(!response.ok){
      if(response.status===401||response.status===403)
        throw new Error('Google từ chối quyền đọc. Kiểm tra OAuth consent (drive.metadata.readonly) và tài khoản có quyền vào 00_INBOX.');
      throw new Error('Drive API báo lỗi '+response.status+'. Không cập nhật hàng chờ.');
    }
    return response.json();
  }
  function api(token){
    const base='https://www.googleapis.com/drive/v3/files';
    return {
      async folderInfo(id){
        const query=new URLSearchParams({fields:'id,name,mimeType,trashed',supportsAllDrives:'true'});
        return driveGet(base+'/'+encodeURIComponent(id)+'?'+query,token);
      },
      async listChildren(id,pageToken=''){
        const query=new URLSearchParams({
          q:"'"+id+"' in parents and trashed = false",
          fields:'nextPageToken,files(id,name,mimeType,size,modifiedTime,md5Checksum,parents,trashed,webViewLink)',
          pageSize:'1000',supportsAllDrives:'true',includeItemsFromAllDrives:'true'
        });
        if(pageToken)query.set('pageToken',pageToken);
        const data=await driveGet(base+'?'+query,token);
        return {files:data.files,nextPageToken:data.nextPageToken||''};
      }
    };
  }
  async function scan(){
    if(state.busy)return;
    state.error='';state.notice='';
    const input=document.getElementById('auraDriveSourceRoot')?.value||'';
    let id;
    try{id=core.folderId(input);}catch(error){state.error=error.message;render();return;}
    const token=window.AURA_DRIVE_AUTH?.metadataToken;
    if(!token){state.error='Anh hãy kết nối Google với quyền đọc metadata trước khi quét.';render();return;}
    state.busy=true;render();
    try{
      const registryRes=await fetch('aura_data/processed_sources.json',{cache:'no-store'});
      if(!registryRes.ok)throw new Error('Không tải được registry nguồn AURA. Đã dừng để tránh bỏ qua cảnh báo nguồn thiếu.');
      const registry=await registryRes.json();
      if(!Array.isArray(registry.sources))throw new Error('Registry nguồn không hợp lệ; đã dừng.');
      const tree=await core.scanTree(api(token),id);
      const now=new Date().toISOString();
      const result=core.reconcile(records(),tree.files,{registry:registry.sources,rootId:id,now});
      if(result.queue.length>2000)throw new Error('Hàng chờ vượt giới hạn an toàn. Không cập nhật.');
      // Atomic update: only persist after a FULL successful scan.
      write(QUEUE_KEY,result.queue);
      write(ROOT_KEY,id);
      write(LAST_KEY,{rootId:id,scannedAt:now,folderCount:tree.folderCount,
        fileCount:tree.files.length,summary:result.summary});
      const s=result.summary;
      state.notice='Đã quét '+tree.files.length+' file trong '+tree.folderCount+
        ' thư mục. Nguồn mới: '+s.added+', cần kiểm tra lại: '+s.changed+
        ', giữ nguyên: '+s.unchanged+', không còn trong INBOX: '+s.missing+
        '. Không có file nào được di chuyển hoặc xuất bản.';
      state.filter='pending';state.offset=0;
    }catch(error){state.error=String(error?.message||error);}
    finally{state.busy=false;render();}
  }
  async function connect(){
    if(state.busy)return;
    state.error='';state.notice='';
    try{
      const auth=window.AURA_DRIVE_AUTH;
      if(!auth?.connectMetadataRead)throw new Error('Chức năng Google OAuth chỉ đọc chưa sẵn sàng. Tải lại trang Admin.');
      await auth.connectMetadataRead();
      state.notice='Đã nhận quyền đọc metadata từ Google cho phiên này. Tiếp theo bấm “Quét nguồn”.';
    }catch(error){state.error='Chưa kết nối được: '+String(error?.message||error);}
    render();
  }
  function cardAction(button,action){
    const card=button.closest('.aura-source-card');
    const id=card?.dataset.sourceId;
    const all=records(),idx=all.findIndex(x=>x.driveFileId===id && x.rootId===rootValue());
    if(idx<0)return;
    const row=all[idx];
    if(row.reviewStatus==='MISSING_FROM_INBOX'){state.error='Nguồn không còn trong 00_INBOX. Hãy quét lại trước.';render();return;}
    const note=card.querySelector('[data-source-field="note"]')?.value?.trim().slice(0,600)||'';
    if(action==='reopen'){
      if(core.isBlocked(row.sourceGate))return;
      all[idx]={...row,reviewStatus:'WAITING_REVIEW',reviewedAt:''};
      state.notice='Đã đưa tài liệu về hàng chờ kiểm tra metadata.';
    }else if(action==='note'){
      if(!core.isBlocked(row.sourceGate)||!note){state.error='Hãy nhập ghi chú về dữ liệu cần bổ sung.';render();return;}
      all[idx]={...row,reviewNote:note,reviewStatus:'BLOCKED_SOURCE'};
      state.notice='Đã lưu ghi chú. Nguồn vẫn bị chặn.';
    }else if(action==='review'){
      if(core.isBlocked(row.sourceGate))return;
      const subject=card.querySelector('[data-source-field="subject"]')?.value||'';
      const type=card.querySelector('[data-source-field="docType"]')?.value||'';
      const period=card.querySelector('[data-source-field="period"]')?.value||'';
      const checked=card.querySelector('[data-source-field="ack"]')?.checked;
      if(!core.SUBJECTS[subject]||!core.TYPES[type]||!checked||note.length<5){
        state.error='Hãy chọn môn, loại tài liệu, ghi chú ít nhất 5 ký tự và đánh dấu xác nhận metadata.';
        render();return;
      }
      all[idx]={...row,confirmedSubject:subject,confirmedDocType:type,
        confirmedPeriod:['GK1','CK1','GK2','CK2'].includes(period)?period:'',
        reviewStatus:'METADATA_REVIEWED',reviewNote:note,reviewedAt:new Date().toISOString()};
      state.notice='Đã ghi nhận kiểm tra thông tin nguồn. Chưa đưa tài liệu vào ngân hàng câu hỏi.';
    }
    try{write(QUEUE_KEY,all);state.error='';state.offset=0;}
    catch(error){state.error='Không lưu được hàng chờ trên thiết bị: '+String(error?.message||error);}
    render();
  }
  app.addEventListener('click',event=>{
    const metric=event.target.closest('[data-source-metric]');
    if(metric&&app.contains(metric)){
      const filter=metric.dataset.sourceMetric;
      if(!['pending','blocked','reviewed','missing'].includes(filter))return;
      state.filter=filter;
      state.subject='ALL'; // metrics reflect every subject, so show the same overall count
      state.offset=0;
      state.error='';
      state.notice='';
      render();
      document.getElementById('aura-source-review-results')?.scrollIntoView({behavior:'smooth',block:'start'});
      return;
    }
    const button=event.target.closest('[data-source-action]');
    if(!button||!app.contains(button))return;
    const action=button.dataset.sourceAction;
    if(action==='connect')connect();
    if(action==='scan')scan();
    if(['review','reopen','note'].includes(action))cardAction(button,action);
    if(action==='next'){state.offset+=35;render();}
    if(action==='prev'){state.offset=Math.max(0,state.offset-35);render();}
  });
  app.addEventListener('change',event=>{
    const filter=event.target.closest('[data-source-filter]');
    if(!filter||!app.contains(filter))return;
    if(filter.dataset.sourceFilter==='status')state.filter=filter.value;
    if(filter.dataset.sourceFilter==='subject')state.subject=filter.value;
    state.offset=0;state.error='';state.notice='';render();
  });
  window.auraDriveSourceInbox=render;
  window.addEventListener('storage',event=>{
    if([QUEUE_KEY,ROOT_KEY,LAST_KEY].includes(event.key)&&document.body.dataset.auraPage==='driveSources')render();
  });
})();
