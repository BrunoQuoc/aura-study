/* AURA STUDY — standardized exam metadata registry
   Source metadata is immutable. Usage assignment can be overridden separately. */
(function(){
  const OVERRIDE_STORAGE_KEY='aura_metadata_overrides_v1';
  const SUBJECTS={
    TOAN:{label:'Toán',status:'ready',generatorPeriods:['GK1'],note:'Kho hiện tại tập trung nội dung đầu năm và giữa học kỳ I.'},
    NGUVAN:{label:'Ngữ văn',status:'partial',generatorPeriods:[],note:'Có nội dung HKI nhưng generator đang dùng chung tài liệu chưa phân kỳ; chưa bật mô phỏng theo kỳ cho tới khi tách pool sạch metadata.'},
    TIENGANH:{label:'Tiếng Anh',status:'partial',generatorPeriods:['GK1'],note:'Ngân hàng hiện tại theo phạm vi Units 1–3.'},
    KHTN:{label:'KHTN',status:'awaiting_source',generatorPeriods:[],note:'Chưa có kho câu hỏi/tài liệu đủ căn cứ để gắn kỳ.'},
    LSDL:{label:'Lịch sử & Địa lý',status:'awaiting_source',generatorPeriods:[],note:'Chưa có kho câu hỏi/tài liệu đủ căn cứ để gắn kỳ.'},
    GDCD:{label:'GDCD',status:'awaiting_source',generatorPeriods:[],note:'Chưa có kho câu hỏi/tài liệu đủ căn cứ để gắn kỳ.'},
    TINHOC:{label:'Tin học',status:'awaiting_source',generatorPeriods:[],note:'Chưa có kho câu hỏi/tài liệu đủ căn cứ để gắn kỳ.'},
    CONGNGHE:{label:'Công nghệ',status:'awaiting_source',generatorPeriods:[],note:'Chưa có kho câu hỏi/tài liệu đủ căn cứ để gắn kỳ.'}
  };

  /*
    `sourceTerm` / `sourcePeriods` record what the source itself states.
    `term` / `periods` are AURA's default usage assignment based on the stated basis.
    Neither layer is mutated when Admin wants to use the resource elsewhere.
  */
  const RESOURCES={
    'review:TOAN:toan_gk1_thucte':{
      subject:'TOAN',resourceId:'toan_gk1_thucte',kind:'review',grade:6,sourceFile:'data.js',
      sourcePeriods:['GK1'],sourceTerm:'HK1',periods:['GK1'],term:'HK1',docType:'worked_example',scope:'Bài toán thực tế nhiều bước',
      assignmentBasis:'source_declared',confidence:'high',note:'ID và tiêu đề nguồn xác định GK1.'
    },
    'review:NGUVAN:nv_tiengviet_hk1':{
      subject:'NGUVAN',resourceId:'nv_tiengviet_hk1',kind:'review',grade:6,sourceFile:'nguvan_bank.js',
      sourcePeriods:[],sourceTerm:'HK1',periods:['CK1'],term:'HK1',docType:'worked_example',scope:'Thực hành Tiếng Việt HKI',
      assignmentBasis:'source_declared_term',confidence:'high',note:'Nguồn ghi rõ HKI; xếp vào ôn cuối kỳ I, không suy đoán là GK1.'
    },
    'review:NGUVAN:nv_doc_hieu':{
      subject:'NGUVAN',resourceId:'nv_doc_hieu',kind:'review',grade:6,sourceFile:'data.js',
      sourcePeriods:[],sourceTerm:'',periods:[],term:'',docType:'worked_example',scope:'Đọc hiểu – 5 chủ đề',
      assignmentBasis:'insufficient_source_evidence',confidence:'unassigned',note:'Tên/phạm vi hiện tại chưa đủ căn cứ để gắn GK1 hay CK1.'
    },
    'review:TIENGANH:en_u1_3':{
      subject:'TIENGANH',resourceId:'en_u1_3',kind:'review',grade:6,sourceFile:'data.js',
      sourcePeriods:[],sourceTerm:'',periods:['GK1'],term:'HK1',docType:'worked_example',scope:'Global Success 6 · Units 1–3',
      assignmentBasis:'curriculum_scope',confidence:'medium',note:'Gắn theo phạm vi Units 1–3 để ôn GK1; không khẳng định tài liệu nguồn tự ghi nhãn GK1.'
    }
  };

  const BANKS={
    'TOAN:smart':{
      subject:'TOAN',bankId:'smart',grade:6,docType:'question_bank',sourceFile:'generator.js + data.js',
      sourcePeriods:[],sourceTerm:'',periods:['GK1'],term:'HK1',scope:'Số tự nhiên, phép tính, hình học cơ bản, bài toán thực tế',
      generator:true,assignmentBasis:'current_bank_scope',confidence:'medium'
    },
    'NGUVAN:reviews':{
      subject:'NGUVAN',bankId:'reviews',grade:6,docType:'question_bank',sourceFile:'data.js + nguvan_bank.js',
      sourcePeriods:[],sourceTerm:'HK1',periods:[],term:'HK1',scope:'Tiếng Việt HKI và các bài đọc hiểu hiện có',
      generator:false,assignmentBasis:'mixed_scope_requires_split',confidence:'low',
      note:'Kho hiện tại trộn tài liệu HKI với bài đọc hiểu chưa phân kỳ; không dùng để tạo đề mô phỏng theo kỳ.'
    },
    'TIENGANH:units_1_3':{
      subject:'TIENGANH',bankId:'units_1_3',grade:6,docType:'question_bank',sourceFile:'english_bank.js + english_extra.js',
      sourcePeriods:[],sourceTerm:'',periods:['GK1'],term:'HK1',scope:'Global Success 6 · Units 1–3 · Reading · Rewrite',
      generator:true,assignmentBasis:'curriculum_scope',confidence:'medium'
    }
  };

  const PERIODS={
    GK1:{label:'Giữa kỳ 1',term:'HK1'},
    CK1:{label:'Cuối kỳ 1',term:'HK1'},
    GK2:{label:'Giữa kỳ 2',term:'HK2'},
    CK2:{label:'Cuối kỳ 2',term:'HK2'}
  };

  /* Static overrides stay empty in production. Runtime Admin decisions are persisted separately. */
  const STATIC_OVERRIDES={resources:{},banks:{}};

  function cleanPeriods(values){
    return [...new Set((Array.isArray(values)?values:[]).filter(p=>PERIODS[p]))];
  }
  function cleanOverrideRow(row){
    if(!row||typeof row!=='object')return null;
    const mode=row.mode==='add'?'add':'replace';
    return {periods:cleanPeriods(row.periods),mode,assignmentBasis:'manual_admin_override',reason:String(row.reason||'').trim(),updatedAt:String(row.updatedAt||'')};
  }
  function cleanOverrideGroup(rows){
    const out={};Object.entries(rows&&typeof rows==='object'?rows:{}).forEach(([key,row])=>{const clean=cleanOverrideRow(row);if(clean)out[key]=clean});return out;
  }
  function readStoredOverrides(){
    try{
      const raw=JSON.parse(localStorage.getItem(OVERRIDE_STORAGE_KEY)||'{}');
      return {resources:cleanOverrideGroup(raw.resources),banks:cleanOverrideGroup(raw.banks)};
    }catch(_){return {resources:{},banks:{}}}
  }
  function mergeOverrides(){
    const stored=readStoredOverrides();
    return {resources:{...STATIC_OVERRIDES.resources,...stored.resources},banks:{...STATIC_OVERRIDES.banks,...stored.banks}};
  }
  let OVERRIDES=mergeOverrides();
  function persistOverrides(){
    const stored={resources:{...OVERRIDES.resources},banks:{...OVERRIDES.banks}};
    localStorage.setItem(OVERRIDE_STORAGE_KEY,JSON.stringify(stored));
    return stored;
  }
  function reloadOverrides(){OVERRIDES=mergeOverrides();if(window.AURA_EXAM_METADATA)window.AURA_EXAM_METADATA.overrides=OVERRIDES;return OVERRIDES}
  function termForPeriods(values,fallback=''){
    const terms=[...new Set(cleanPeriods(values).map(p=>PERIODS[p]?.term).filter(Boolean))];
    return terms.length===1?terms[0]:(fallback||'');
  }
  function overrideFor(group,key){
    const row=OVERRIDES[group]?.[key];
    return row&&typeof row==='object'?row:null;
  }
  function effectivePeriods(group,key,row){
    const base=cleanPeriods(row?.periods),ov=overrideFor(group,key);
    if(!ov)return base;
    const manual=cleanPeriods(ov.periods);
    return ov.mode==='add'?[...new Set([...base,...manual])]:manual;
  }
  function sourceLabel(row){
    const parts=[];
    if(row?.sourcePeriods?.length)parts.push(row.sourcePeriods.map(p=>PERIODS[p]?.label||p).join(', '));
    else if(row?.sourceTerm)parts.push(row.sourceTerm);
    return parts.join(' · ')||'nguồn không ghi rõ kỳ';
  }
  function effectiveMeta(group,key,row){
    if(!row)return null;
    const ov=overrideFor(group,key),defaultPeriods=cleanPeriods(row.periods),periods=effectivePeriods(group,key,row),effectiveTerm=termForPeriods(periods,row.term||'');
    const overrideScope=ov?`Admin gán sử dụng ${periods.map(p=>PERIODS[p]?.label||p).join(', ')||'ngoài kỳ'}; nguồn: ${sourceLabel(row)}${ov.reason?` · ${ov.reason}`:''}`:'';
    return {
      ...row,
      sourcePeriods:cleanPeriods(row.sourcePeriods),
      sourceTerm:row.sourceTerm||'',
      defaultPeriods,
      defaultTerm:row.term||'',
      periods,
      term:effectiveTerm,
      effectivePeriods:periods,
      effectiveTerm,
      scope:ov?[overrideScope,row.scope].filter(Boolean).join(' · '):row.scope,
      assignmentBasis:ov?.assignmentBasis||row.assignmentBasis,
      override:ov?{...ov,periods:cleanPeriods(ov.periods)}:null,
      effectiveAssignmentBasis:ov?.assignmentBasis||row.assignmentBasis
    };
  }

  const registry={
    version:'1.3.0',schemaVersion:3,periods:PERIODS,subjects:SUBJECTS,resources:RESOURCES,banks:BANKS,overrides:OVERRIDES,overrideStorageKey:OVERRIDE_STORAGE_KEY,
    schema:{
      required:['subject','docType'],
      resourceRequired:['subject','resourceId','kind','grade','sourceFile','docType','sourcePeriods','sourceTerm','periods','assignmentBasis','confidence'],
      bankRequired:['subject','bankId','grade','sourceFile','docType','sourcePeriods','sourceTerm','periods','generator','assignmentBasis','confidence'],
      optional:['term','scope','note'],
      confidence:['high','medium','low','unassigned'],
      assignmentBasis:['source_declared','source_declared_term','curriculum_scope','current_bank_scope','mixed_scope_requires_split','insufficient_source_evidence','manual_admin_override'],
      overrideModes:['replace','add']
    }
  };

  window.AURA_EXAM_METADATA=registry;
  window.auraExamMetaFor=function(kind,subject,id){
    const key=`${kind}:${subject}:${id}`;
    return effectiveMeta('resources',key,RESOURCES[key]);
  };
  window.auraExamEffectivePeriods=function(kind,subject,id){
    const key=`${kind}:${subject}:${id}`,row=RESOURCES[key];
    return row?effectivePeriods('resources',key,row):[];
  };
  window.auraExamBankMetaFor=function(subject,bankId){
    const key=`${subject}:${bankId}`;
    return effectiveMeta('banks',key,BANKS[key]);
  };
  window.auraExamGeneratorReady=function(subject,period){
    const rows=Object.entries(BANKS).filter(([,row])=>row.subject===subject&&row.generator);
    if(rows.length)return rows.some(([key,row])=>effectivePeriods('banks',key,row).includes(period));
    const s=SUBJECTS[subject];
    return !!(s&&Array.isArray(s.generatorPeriods)&&s.generatorPeriods.includes(period));
  };
  window.auraMetadataOverrideFor=function(group,key){return overrideFor(group,key)};
  window.auraMetadataOverrides=function(){return {resources:{...OVERRIDES.resources},banks:{...OVERRIDES.banks}}};
  window.auraReloadMetadataOverrides=reloadOverrides;
  window.auraSetMetadataOverride=function(group,key,payload){
    const base=group==='resources'?RESOURCES:group==='banks'?BANKS:null;if(!base||!base[key])return {ok:false,error:'Không tìm thấy metadata gốc.'};
    const clean=cleanOverrideRow(payload);if(!clean)return {ok:false,error:'Override không hợp lệ.'};
    OVERRIDES[group]={...OVERRIDES[group],[key]:{...clean,updatedAt:new Date().toISOString()}};
    registry.overrides=OVERRIDES;persistOverrides();
    window.dispatchEvent(new CustomEvent('aura:metadata-overrides-changed',{detail:{group,key,action:'set'}}));
    return {ok:true,meta:effectiveMeta(group,key,base[key])};
  };
  window.auraClearMetadataOverride=function(group,key){
    if(!OVERRIDES[group]?.[key])return {ok:true};
    const next={...OVERRIDES[group]};delete next[key];OVERRIDES[group]=next;registry.overrides=OVERRIDES;persistOverrides();
    window.dispatchEvent(new CustomEvent('aura:metadata-overrides-changed',{detail:{group,key,action:'clear'}}));
    return {ok:true};
  };
  window.auraValidateExamMetadata=function(){
    const errors=[],validPeriods=new Set(Object.keys(PERIODS));
    const validatePeriods=(key,label,values)=>{
      if(!Array.isArray(values)){errors.push(`${key}: ${label} phải là mảng`);return}
      values.forEach(p=>{if(!validPeriods.has(p))errors.push(`${key}: ${label} có kỳ không hợp lệ ${p}`)});
    };
    const check=(group,required)=>Object.entries(group).forEach(([key,row])=>{
      required.forEach(field=>{if(row[field]===undefined||row[field]===null)errors.push(`${key}: thiếu ${field}`)});
      validatePeriods(key,'periods',row.periods);
      validatePeriods(key,'sourcePeriods',row.sourcePeriods);
      if(!registry.schema.confidence.includes(row.confidence))errors.push(`${key}: confidence không hợp lệ`);
      if(!registry.schema.assignmentBasis.includes(row.assignmentBasis))errors.push(`${key}: assignmentBasis không hợp lệ`);
    });
    check(RESOURCES,registry.schema.resourceRequired);
    check(BANKS,registry.schema.bankRequired);
    Object.entries(OVERRIDES).forEach(([group,rows])=>Object.entries(rows||{}).forEach(([key,row])=>{
      if(!['resources','banks'].includes(group))errors.push(`${key}: nhóm override không hợp lệ`);
      if(group==='resources'&&!RESOURCES[key])errors.push(`${key}: override không có resource gốc`);
      if(group==='banks'&&!BANKS[key])errors.push(`${key}: override không có bank gốc`);
      validatePeriods(key,'override periods',row.periods);
      if(!registry.schema.overrideModes.includes(row.mode||'replace'))errors.push(`${key}: override mode không hợp lệ`);
      if(row.assignmentBasis!=='manual_admin_override')errors.push(`${key}: override phải dùng manual_admin_override`);
    }));
    return {ok:errors.length===0,errors,version:registry.version,schemaVersion:registry.schemaVersion};
  };
  window.addEventListener('storage',e=>{if(e.key===OVERRIDE_STORAGE_KEY){reloadOverrides();window.dispatchEvent(new CustomEvent('aura:metadata-overrides-changed',{detail:{action:'storage'}}))}});
})();
