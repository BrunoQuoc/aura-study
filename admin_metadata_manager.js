/* AURA STUDY — Admin Phân kỳ V2. Presentation + per-resource override workflow only.
   The source registry, underlying content, and generator gates stay authoritative. */
(function () {
  'use strict';
  if (!document.body.classList.contains('admin-shell')) return;

  const PERIODS = [
    {id:'GK1',name:'Giữa kỳ 1',term:'HK1'},
    {id:'CK1',name:'Cuối kỳ 1',term:'HK1'},
    {id:'GK2',name:'Giữa kỳ 2',term:'HK2'},
    {id:'CK2',name:'Cuối kỳ 2',term:'HK2'}
  ];
  const BASIS = {
    source_declared:'Nguồn ghi rõ kỳ',
    source_declared_term:'Nguồn chỉ ghi học kỳ',
    curriculum_scope:'AURA xếp theo phạm vi kiến thức',
    current_bank_scope:'AURA xếp theo phạm vi ngân hàng',
    mixed_scope_requires_split:'Nguồn trộn nhiều phạm vi, cần tách',
    insufficient_source_evidence:'Chưa đủ căn cứ từ tài liệu',
    manual_admin_override:'Admin chọn kỳ sử dụng'
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const state = {subject:'ALL', period:'ALL', view:'ALL'};
  const app = document.getElementById('app');
  if (!app) return;

  const registry = () => window.AURA_EXAM_METADATA || {subjects:{},resources:{},banks:{}};
  function rows() {
    const data=registry();
    return [
      ...Object.entries(data.resources || {}).map(([key,row])=>({group:'resources',key,row,title:titleFor(row,key)})),
      ...Object.entries(data.banks || {}).map(([key,row])=>({group:'banks',key,row,title:'Ngân hàng: '+(row.scope || row.bankId || key)}))
    ];
  }
  function titleFor(row,key) {
    if (row.kind === 'review') {
      const source = (window.AURA_REVIEWS?.[row.subject] || []).find(r=>r.id === row.resourceId);
      if (source?.title) return source.title;
    }
    return row.scope || row.resourceId || key;
  }
  function effective(item) {
    const row=item.row;
    if (item.group==='resources' && typeof window.auraExamMetaFor==='function')
      return window.auraExamMetaFor(row.kind,row.subject,row.resourceId) || row;
    if (item.group==='banks' && typeof window.auraExamBankMetaFor==='function')
      return window.auraExamBankMetaFor(row.subject,row.bankId) || row;
    return row;
  }
  const list = x => Array.isArray(x) ? x : [];
  function periodNames(xs) {
    const ids=list(xs);
    return ids.length ? ids.map(id=>PERIODS.find(x=>x.id===id)?.name || id).join(' · ') : 'Chưa gán kỳ';
  }
  function sourceDetail(row) {
    if (list(row.sourcePeriods).length) return 'Nguồn ghi rõ: '+periodNames(row.sourcePeriods);
    if (row.sourceTerm) return 'Nguồn chỉ ghi '+row.sourceTerm+' — không xác nhận riêng GK/CK';
    return 'Nguồn không ghi rõ kỳ hoặc học kỳ';
  }
  function status(item, meta) {
    if (meta.override) return {name:'Đã chỉnh thủ công',kind:'manual'};
    if (!list(meta.effectivePeriods || meta.periods).length ||
      ['insufficient_source_evidence','mixed_scope_requires_split'].includes(item.row.assignmentBasis))
      return {name:'Cần rà soát',kind:'review'};
    if (list(item.row.sourcePeriods).length) return {name:'Có căn cứ nguồn',kind:'verified'};
    return {name:'Theo phạm vi AURA',kind:'scope'};
  }
  function isBlockedBank(item) {
    return item.group==='banks' &&
      (item.row.assignmentBasis==='mixed_scope_requires_split' || item.row.generator===false);
  }
  function subjectState(id) {
    const sub=registry().subjects?.[id];
    return sub?.status || 'awaiting_source';
  }
  function subjectStatusText(id) {
    return ({ready:'Đã có nội dung',partial:'Nội dung chưa đầy đủ',awaiting_source:'Chờ học liệu'})[subjectState(id)] || 'Chờ học liệu';
  }
  function periodReady(id,p) {
    return typeof window.auraExamGeneratorReady==='function' && window.auraExamGeneratorReady(id,p);
  }
  function subjectReadiness(id,subjectRows) {
    if (id==='ALL') return '';
    const available=PERIODS.filter(p=>periodReady(id,p.id)).map(p=>p.name);
    const count=subjectRows.filter(i=>list(effective(i).effectivePeriods).length).length;
    return '<div class="period-v2-readiness">' +
      '<div><strong>'+esc(registry().subjects?.[id]?.label || id)+'</strong>'+
      '<span class="period-v2-pill '+esc(subjectState(id))+'">'+esc(subjectStatusText(id))+'</span></div>'+
      '<p>'+esc(registry().subjects?.[id]?.note || 'Chưa có học liệu được xác nhận')+'</p>'+
      '<div class="period-v2-readiness-grid">'+
      '<span><b>'+count+'/'+subjectRows.length+'</b> mục đã xác định kỳ sử dụng</span>'+
      '<span><b>'+esc(available.length?available.join(' · '):'Chưa có')+'</b> kỳ được phép tạo đề theo ngân hàng hiện tại</span>'+
      '</div><small>Gán lại kỳ cho tài liệu không tự tạo thêm câu hỏi, đáp án hoặc dữ liệu còn thiếu.</small></div>';
  }
  function checkboxMarkup(values=[]) {
    const selected=new Set(list(values));
    return ['HK1','HK2'].map(term=>
      '<fieldset class="period-v2-term"><legend>'+('HK1'===term?'Học kỳ I':'Học kỳ II')+'</legend>'+
      PERIODS.filter(p=>p.term===term).map(p=>
        '<label class="period-v2-choice"><input type="checkbox" data-period="'+p.id+'" '+(selected.has(p.id)?'checked':'')+'>'+
        '<span>'+p.name+'</span></label>').join('')+'</fieldset>'
    ).join('');
  }
  function itemMarkup(item) {
    const meta=effective(item),row=item.row,ov=meta.override || null,info=status(item,meta);
    const activePeriods=list(meta.effectivePeriods || meta.periods);
    const editable=!isBlockedBank(item);
    const preselected=ov?list(ov.periods):activePeriods;
    const mode=ov?.mode==='add'?'add':'replace';
    const source=sourceDetail(row);
    const defaultPeriod=periodNames(row.periods);
    const current=periodNames(activePeriods);
    const note = row.note || '';
    const original=row.sourceFile || '';
    return '<article class="period-v2-item" data-group="'+esc(item.group)+'" data-key="'+esc(item.key)+'">' +
      '<div class="period-v2-item-head">' +
      '<div class="period-v2-heading"><small>'+ (item.group==='banks'?'NGÂN HÀNG CÂU HỎI':'TÀI LIỆU ÔN TẬP') +
      '</small><h3>'+esc(item.title)+'</h3><p>'+esc(row.scope || '')+'</p></div>' +
      '<span class="period-v2-pill '+info.kind+'">'+info.name+'</span></div>' +
      '<div class="period-v2-three">' +
      '<div><span>1. TÀI LIỆU GỐC</span><b>'+esc(source)+'</b><small>'+esc(BASIS[row.assignmentBasis]||row.assignmentBasis||'')+'</small></div>'+
      '<div><span>2. AURA MẶC ĐỊNH</span><b>'+esc(defaultPeriod)+'</b><small>Không thay đổi nguồn ban đầu</small></div>'+
      '<div class="is-current"><span>3. ĐANG SỬ DỤNG</span><b>'+esc(current)+'</b><small>'+esc(ov?.reason || (ov?'Admin đã chọn thủ công':'Theo thiết lập AURA'))+'</small></div>'+
      '</div>'+
      (note?'<p class="period-v2-note">Lưu ý nguồn: '+esc(note)+'</p>':'')+
      (editable ?
        '<details class="period-v2-editor"><summary><span>Chỉnh kỳ sử dụng</span><span aria-hidden="true">⌄</span></summary>'+
        '<div class="period-v2-editor-inner">'+
        '<p class="period-v2-help">Chỉ thay đổi <b>kỳ AURA được dùng nội dung này</b>. Không đổi kỳ ghi trong tài liệu gốc, không thêm nội dung hoặc tự bật tạo đề.</p>'+
        '<label class="period-v2-field"><b>Cách áp dụng</b><select data-mode aria-label="Cách áp dụng kỳ cho '+esc(item.title)+'">'+
        '<option value="replace" '+(mode==='replace'?'selected':'')+'>Chỉ dùng ở các kỳ em chọn</option>'+
        '<option value="add" '+(mode==='add'?'selected':'')+'>Dùng thêm các kỳ em chọn (giữ kỳ mặc định)</option></select></label>'+
        '<div class="period-v2-checkboxes">'+checkboxMarkup(preselected)+'</div>'+
        '<label class="period-v2-field"><b>Lý do thay đổi (bắt buộc)</b>'+
        '<textarea data-reason rows="2" maxlength="600" placeholder="Ví dụ: Phần kiến thức này dùng ôn nền tảng cho kỳ 2; đã đối chiếu chương trình.">'+esc(ov?.reason || '')+'</textarea></label>'+
        '<label class="period-v2-ack"><input type="checkbox" data-ack>'+
        '<span>Tôi đã kiểm tra căn cứ phân kỳ, chấp nhận việc sử dụng khác tài liệu gốc nếu có. Đây không phải xác nhận đề đã đủ dữ kiện.</span></label>'+
        '<div class="period-v2-actions"><button type="button" class="btn primary" data-action="save">Lưu kỳ sử dụng</button>'+
        (ov?'<button type="button" class="btn soft" data-action="reset">Trả về mặc định</button>':'')+
        (list(row.sourcePeriods).length?'<button type="button" class="btn soft" data-action="source">Dùng đúng kỳ ghi trong nguồn</button>':'')+
        '</div><p class="period-v2-small">Quyết định này được lưu trên trình duyệt Admin hiện tại, không tự đồng bộ qua thiết bị khác.</p>'+
        '</div></details>'
      : '<div class="period-v2-blocked"><b>Cần tách ngân hàng nguồn trước khi phân kỳ.</b> Kho này chưa cho phép tạo đề theo kỳ. '+
        'Đừng gán thủ công để che tình trạng trộn phạm vi.'+
        (ov?'<button type="button" class="btn soft" data-action="reset">Bỏ phân kỳ thủ công hiện có</button>':'')+'</div>')+
      '<details class="period-v2-provenance"><summary>Thông tin nguồn & kỹ thuật</summary>'+
      '<div><b>Tệp:</b> '+esc(original)+' · <b>Độ tin cậy:</b> '+esc(row.confidence||'chưa xác định')+
      ' · <b>Mã nguồn:</b> '+esc(item.key)+'</div></details>'+
      '</article>';
  }
  function filteredRows(all) {
    return all.filter(item=>{
      const meta=effective(item),assigned=list(meta.effectivePeriods||meta.periods);
      if(state.subject!=='ALL'&&item.row.subject!==state.subject)return false;
      if(state.period!=='ALL'&&!assigned.includes(state.period))return false;
      if(state.view==='manual'&&!meta.override)return false;
      if(state.view==='review'&&status(item,meta).kind!=='review')return false;
      if(state.view==='unassigned'&&assigned.length)return false;
      return true;
    });
  }
  function options(listing,value) {
    return listing.map(o=>'<option value="'+esc(o.id)+'" '+(o.id===value?'selected':'')+'>'+esc(o.label)+'</option>').join('');
  }
  function draw(initial=false) {
    if(initial && typeof window.setActive==='function')window.setActive('metadata');
    document.body.dataset.auraPage='metadata';
    const all=rows(),filtered=filteredRows(all);
    const manual=all.filter(item=>!!effective(item).override).length;
    const review=all.filter(item=>status(item,effective(item)).kind==='review').length;
    const subjects=registry().subjects || {};
    const selected=state.subject==='ALL'?all:all.filter(i=>i.row.subject===state.subject);
    const validation=typeof window.auraValidateExamMetadata==='function'?
      window.auraValidateExamMetadata():{ok:false,errors:['Chưa nạp registry phân kỳ']};

    app.innerHTML='<div class="period-v2">' +
      '<div class="period-v2-hero"><div><small>QUẢN LÝ HỌC LIỆU · LỚP 6</small><h1>Phân kỳ ôn tập & đề thi</h1>'+
      '<p>Chọn môn và kỳ cần xem, sau đó chỉnh đúng tài liệu. AURA phân biệt <b>kỳ trong tài liệu gốc</b> và <b>kỳ được phép dùng để ôn tập</b>.</p></div>'+
      '<div class="period-v2-head-note"><b>Nguyên tắc</b><span>Không suy đoán đáp án, không biến tài liệu thiếu dữ kiện thành đề đủ điều kiện.</span></div></div>'+
      '<div class="period-v2-stats">'+
      '<div><span>Mục có trong registry</span><strong>'+all.length+'</strong><small>Tài liệu và ngân hàng</small></div>'+
      '<div><span>Đã chỉnh thủ công</span><strong>'+manual+'</strong><small>Chỉ trên trình duyệt này</small></div>'+
      '<div><span>Cần rà soát kỳ</span><strong>'+review+'</strong><small>Không tự gán khi thiếu căn cứ</small></div></div>'+
      '<div class="period-v2-filters"><div class="period-v2-filter-head"><h2>01 · Tìm tài liệu cần phân kỳ</h2><p>Chọn lần lượt môn, kỳ và trạng thái. Bộ lọc chỉ thay đổi danh sách hiển thị.</p></div>'+
      '<div class="period-v2-filter-grid">'+
      '<label><b>Môn học</b><select data-filter="subject">'+
      options([{id:'ALL',label:'Tất cả 8 môn'},...Object.entries(subjects).map(([id,s])=>({id,label:s.label}))],state.subject)+'</select></label>'+
      '<label><b>Kỳ đang sử dụng</b><select data-filter="period">'+
      options([{id:'ALL',label:'Tất cả các kỳ'},...PERIODS.map(p=>({id:p.id,label:p.name}))],state.period)+'</select></label>'+
      '<label><b>Trạng thái</b><select data-filter="view">'+options([
        {id:'ALL',label:'Tất cả mục'},
        {id:'review',label:'Cần rà soát'},
        {id:'manual',label:'Đã chỉnh thủ công'},
        {id:'unassigned',label:'Chưa gán kỳ'}
      ],state.view)+'</select></label></div></div>'+
      subjectReadiness(state.subject,selected)+
      (validation.ok?'':'<div class="period-v2-warning"><b>Registry có lỗi cần kiểm tra:</b><ul>'+
      list(validation.errors).map(err=>'<li>'+esc(err)+'</li>').join('')+'</ul></div>')+
      '<section class="period-v2-results"><div class="period-v2-results-head"><h2>02 · Xem nguồn và chỉnh kỳ sử dụng</h2>'+
      '<span>'+filtered.length+' / '+all.length+' mục hiển thị</span></div>'+
      '<p class="period-v2-description">Mỗi thẻ cho biết ba lớp: <b>nguồn gốc → thiết lập mặc định → kỳ AURA đang dùng</b>. Chạm “Chỉnh kỳ sử dụng” khi cần thay đổi.</p>'+
      (filtered.length?filtered.map(itemMarkup).join(''):
        '<div class="period-v2-empty"><b>Chưa có mục phù hợp.</b><p>'+
        (state.subject!=='ALL'&&selected.length===0?
          'Môn này chưa có tài liệu/ngân hàng đủ điều kiện trong registry. Hãy bổ sung nguồn qua INBOX trước khi phân kỳ.':
          'Không có tài liệu khớp bộ lọc. Thử chọn “Tất cả các kỳ” hoặc “Tất cả mục”.')+
        '</p><button type="button" class="btn soft" data-action="clear">Đặt lại bộ lọc</button></div>')+
      '</section>'+
      '<div class="period-v2-footer"><b>Cần phân biệt:</b> phân kỳ không đồng nghĩa tài liệu đã đủ dữ kiện để chấm tự động. '+
      'Các môn thiếu nguồn vẫn phải bổ sung học liệu và được kiểm tra riêng trước khi mở tạo đề.</div>'+
      '</div>';
  }
  function itemOf(button) {return button.closest('.period-v2-item');}
  function fail(message) {if(typeof window.alert==='function')window.alert(message);}
  function apply(action) {
    if(action?.ok===false){fail(action.error||'Không thể cập nhật phân kỳ.');return;}
    draw(false);
  }
  function selectedPeriods(card) {
    return [...card.querySelectorAll('input[data-period]:checked')].map(x=>x.dataset.period);
  }
  function save(card) {
    if(!card)return;
    const ids=selectedPeriods(card),mode=card.querySelector('[data-mode]')?.value==='add'?'add':'replace';
    const reason=card.querySelector('[data-reason]')?.value.trim() || '';
    if(!ids.length){fail('Anh hãy chọn ít nhất một kỳ. Muốn dùng lại thiết lập gốc, chọn “Trả về mặc định”.');return;}
    if(!reason){fail('Anh cần ghi lý do thay đổi để AURA lưu dấu quyết định phân kỳ.');return;}
    if(!card.querySelector('[data-ack]')?.checked){fail('Anh hãy xác nhận đã đối chiếu tài liệu trước khi thay đổi kỳ sử dụng.');return;}
    const item=rows().find(x=>x.group===card.dataset.group&&x.key===card.dataset.key);
    if(!item || isBlockedBank(item)){fail('Ngân hàng chưa được tách nguồn, không thể gán kỳ thủ công.');return;}
    if(typeof window.auraSetMetadataOverride!=='function'){fail('Chức năng phân kỳ chưa sẵn sàng.');return;}
    apply(window.auraSetMetadataOverride(item.group,item.key,{
      periods:ids,mode,reason,assignmentBasis:'manual_admin_override'
    }));
  }
  function reset(card) {
    if(!card || typeof window.auraClearMetadataOverride!=='function')return;
    if(typeof window.confirm==='function' &&
      !window.confirm('Trả tài liệu về kỳ sử dụng mặc định của AURA? Kỳ trong nguồn gốc vẫn giữ nguyên.'))return;
    apply(window.auraClearMetadataOverride(card.dataset.group,card.dataset.key));
  }
  function useSource(card) {
    if(!card)return;
    const item=rows().find(x=>x.group===card.dataset.group&&x.key===card.dataset.key);
    if(!item || !list(item.row.sourcePeriods).length){fail('Tài liệu nguồn không ghi rõ kỳ cụ thể.');return;}
    if(typeof window.auraSetMetadataOverride!=='function'){fail('Chức năng phân kỳ chưa sẵn sàng.');return;}
    if(typeof window.confirm==='function' &&
       !window.confirm('Sử dụng đúng kỳ được ghi rõ trong nguồn cho tài liệu này?'))return;
    apply(window.auraSetMetadataOverride(item.group,item.key,{
      periods:item.row.sourcePeriods,mode:'replace',
      reason:'Admin chọn sử dụng theo kỳ được ghi rõ trong tài liệu nguồn.',
      assignmentBasis:'manual_admin_override'
    }));
  }

  app.addEventListener('change',event=>{
    const filter=event.target.closest('[data-filter]');
    if(!filter || !app.contains(filter))return;
    const field=filter.dataset.filter;
    if(!['subject','period','view'].includes(field))return;
    state[field]=filter.value;
    draw(false);
  });
  app.addEventListener('click',event=>{
    const button=event.target.closest('[data-action]');
    if(!button || !app.contains(button))return;
    const action=button.dataset.action;
    if(action==='clear'){state.subject='ALL';state.period='ALL';state.view='ALL';draw(false);return;}
    const card=itemOf(button);
    if(action==='save')save(card);
    if(action==='reset')reset(card);
    if(action==='source')useSource(card);
  });
  window.auraMetadataManager=()=>draw(true);
  window.addEventListener('aura:metadata-overrides-changed',()=>{
    if(document.body.dataset.auraPage==='metadata')draw(false);
  });
  window.addEventListener('storage',event=>{
    if(event.key===registry().overrideStorageKey && document.body.dataset.auraPage==='metadata')draw(false);
  });
})();
