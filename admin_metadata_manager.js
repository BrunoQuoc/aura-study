/* AURA STUDY — Admin metadata assignment manager */
(function(){
  if(!document.body.classList.contains('admin-shell'))return;
  const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  const PERIOD_ORDER=['GK1','CK1','GK2','CK2'];
  const PERIOD_LABEL={GK1:'Giữa kỳ 1',CK1:'Cuối kỳ 1',GK2:'Giữa kỳ 2',CK2:'Cuối kỳ 2'};
  const BASIS_LABEL={source_declared:'Nguồn ghi rõ kỳ',source_declared_term:'Nguồn ghi rõ học kỳ',curriculum_scope:'AURA gắn theo phạm vi kiến thức',current_bank_scope:'AURA gắn theo phạm vi ngân hàng',mixed_scope_requires_split:'Kho trộn phạm vi — chưa bật theo kỳ',insufficient_source_evidence:'Chưa đủ căn cứ nguồn',manual_admin_override:'Admin chủ động gán sử dụng'};
  const DOC_LABEL={worked_example:'Bài mẫu / lời giải',question_bank:'Ngân hàng tạo đề'};

  function registry(){return window.AURA_EXAM_METADATA||{resources:{},banks:{},subjects:{},periods:{}}}
  function subjectLabel(id){return registry().subjects?.[id]?.label||id}
  function periodText(list,term=''){
    const arr=Array.isArray(list)?list:[];
    if(arr.length)return arr.map(x=>PERIOD_LABEL[x]||x).join(' · ');
    return term?`${term} · chưa xác định kỳ cụ thể`:'Chưa xác định kỳ';
  }
  function resourceTitle(key,row){
    if(row.kind==='review'){
      const r=(window.AURA_REVIEWS?.[row.subject]||[]).find(x=>x.id===row.resourceId);
      if(r?.title)return r.title;
    }
    return row.scope||row.resourceId||key;
  }
  function bankTitle(key,row){return `${subjectLabel(row.subject)} · Ngân hàng ${row.bankId||key.split(':').pop()}`}
  function effective(group,key,row){
    if(group==='resources'&&typeof window.auraExamMetaFor==='function')return window.auraExamMetaFor(row.kind,row.subject,row.resourceId)||row;
    if(group==='banks'&&typeof window.auraExamBankMetaFor==='function')return window.auraExamBankMetaFor(row.subject,row.bankId)||row;
    return row;
  }
  function allRows(){
    const r=registry();
    return [
      ...Object.entries(r.resources||{}).map(([key,row])=>({group:'resources',key,row,title:resourceTitle(key,row)})),
      ...Object.entries(r.banks||{}).map(([key,row])=>({group:'banks',key,row,title:bankTitle(key,row)}))
    ];
  }
  function checkboxes(key,selected=[]){
    const set=new Set(selected||[]);
    return PERIOD_ORDER.map(p=>`<label class="metadata-period"><input type="checkbox" data-period="${p}" ${set.has(p)?'checked':''}><span>${PERIOD_LABEL[p]}</span></label>`).join('');
  }
  function rowHTML(item){
    const {group,key,row,title}=item,meta=effective(group,key,row),ov=meta.override||null;
    const source=periodText(row.sourcePeriods,row.sourceTerm),def=periodText(row.periods,row.term),active=periodText(meta.effectivePeriods,meta.effectiveTerm);
    const selected=ov?.periods||meta.effectivePeriods||row.periods||[];
    const mode=ov?.mode||'replace';
    return `<article class="card metadata-item" data-group="${group}" data-key="${esc(key)}">
      <div class="metadata-item-head"><div><span class="metadata-kind">${group==='banks'?'NGÂN HÀNG TẠO ĐỀ':'TÀI LIỆU'}</span><h3>${esc(title)}</h3><small>${esc(subjectLabel(row.subject))} · ${esc(DOC_LABEL[row.docType]||row.docType)} · ${esc(row.sourceFile||'')}</small></div><span class="metadata-status ${ov?'manual':'default'}">${ov?'Admin override':'Theo mặc định'}</span></div>
      <div class="metadata-triplet"><div><span>NGUỒN</span><b>${esc(source)}</b><small>${esc(BASIS_LABEL[row.assignmentBasis]||row.assignmentBasis)}</small></div><div><span>MẶC ĐỊNH AURA</span><b>${esc(def)}</b><small>${esc(row.scope||'')}</small></div><div class="effective"><span>ĐANG SỬ DỤNG</span><b>${esc(active)}</b><small>${ov?esc(ov.reason||'Admin gán thủ công'):'Không có override'}</small></div></div>
      <div class="metadata-editor">
        <label><b>Cách sử dụng</b><select class="metadata-mode"><option value="replace" ${mode==='replace'?'selected':''}>Chuyển sang kỳ đã chọn</option><option value="add" ${mode==='add'?'selected':''}>Dùng thêm ở kỳ đã chọn</option></select></label>
        <div class="metadata-periods">${checkboxes(key,selected)}</div>
        <label class="metadata-reason"><b>Lý do / ghi chú Admin</b><input type="text" value="${esc(ov?.reason||'')}" placeholder="Ví dụ: Dùng lại nội dung HK1 để ôn nền tảng trong HK2"></label>
        <div class="metadata-actions"><button class="btn primary" type="button" onclick="auraSaveMetadataOverride(this)">Lưu cách sử dụng</button>${ov?'<button class="btn soft" type="button" onclick="auraResetMetadataOverride(this)">Trả về mặc định</button>':''}${row.sourcePeriods?.length?'<button class="btn soft" type="button" onclick="auraUseSourcePeriods(this)">Dùng đúng kỳ nguồn</button>':''}</div>
      </div>
    </article>`;
  }
  function render(){
    if(typeof window.setActive==='function')window.setActive('metadata');
    const app=document.getElementById('app');if(!app)return;
    const rows=allRows(),overrideCount=rows.filter(x=>effective(x.group,x.key,x.row).override).length,validation=typeof window.auraValidateExamMetadata==='function'?window.auraValidateExamMetadata():{ok:true,errors:[]};
    app.innerHTML=`<div class="sectionhead metadata-admin-head" style="margin-top:0"><div><h2>Quản lý phân kỳ & cách sử dụng</h2><span>Metadata nguồn không bị sửa · Admin chỉ thay đổi cách AURA sử dụng tài liệu</span></div></div>
      <section class="metadata-summary"><article><span>Tài liệu / ngân hàng</span><strong>${rows.length}</strong><small>Đang có metadata</small></article><article><span>Admin override</span><strong>${overrideCount}</strong><small>Đang dùng khác mặc định</small></article><article><span>Registry</span><strong>${validation.ok?'OK':'CẦN KIỂM TRA'}</strong><small>v${esc(registry().version||'')}</small></article></section>
      <div class="card metadata-policy"><b>Nguyên tắc bất biến</b><p>Nguồn gốc tài liệu luôn được giữ trong <code>sourceTerm/sourcePeriods</code>. “Chuyển sang kỳ khác” chỉ đổi nơi AURA sử dụng tài liệu; “Dùng thêm” giữ mặc định và bổ sung kỳ mới.</p></div>
      ${validation.ok?'':`<div class="card metadata-warning"><b>Registry có lỗi:</b><p>${validation.errors.map(esc).join('<br>')}</p></div>`}
      <div class="metadata-list">${rows.map(rowHTML).join('')}</div>`;
    document.body.dataset.auraPage='metadata';
  }
  function cardOf(btn){return btn?.closest('.metadata-item')}
  function payloadFrom(card){
    const periods=[...card.querySelectorAll('input[data-period]:checked')].map(x=>x.dataset.period),mode=card.querySelector('.metadata-mode')?.value||'replace',reason=card.querySelector('.metadata-reason input')?.value?.trim()||'';
    return {periods,mode,assignmentBasis:'manual_admin_override',reason};
  }
  function applyAndRender(fn){const result=fn();if(result?.ok===false){alert(result.error||'Không thể cập nhật metadata.');return}render()}

  window.auraMetadataManager=render;
  window.auraSaveMetadataOverride=function(btn){
    const card=cardOf(btn);if(!card)return;const payload=payloadFrom(card);
    if(!payload.periods.length){alert('Hãy chọn ít nhất một kỳ. Nếu muốn bỏ override, dùng “Trả về mặc định”.');return}
    applyAndRender(()=>window.auraSetMetadataOverride?.(card.dataset.group,card.dataset.key,payload)||{ok:false,error:'Registry chưa sẵn sàng.'});
  };
  window.auraResetMetadataOverride=function(btn){const card=cardOf(btn);if(!card)return;applyAndRender(()=>window.auraClearMetadataOverride?.(card.dataset.group,card.dataset.key)||{ok:false,error:'Registry chưa sẵn sàng.'})};
  window.auraUseSourcePeriods=function(btn){
    const card=cardOf(btn);if(!card)return;const group=card.dataset.group,key=card.dataset.key,row=registry()[group]?.[key],periods=row?.sourcePeriods||[];
    if(!periods.length){alert('Nguồn không ghi rõ kỳ cụ thể.');return}
    applyAndRender(()=>window.auraSetMetadataOverride?.(group,key,{periods,mode:'replace',assignmentBasis:'manual_admin_override',reason:'Admin chọn sử dụng đúng kỳ ghi trong nguồn.'})||{ok:false,error:'Registry chưa sẵn sàng.'});
  };
  window.addEventListener('aura:metadata-overrides-changed',()=>{if(document.body.dataset.auraPage==='metadata')render()});
})();
