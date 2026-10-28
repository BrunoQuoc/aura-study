/* AURA STUDY — standardized exam metadata registry
   Keeps source content unchanged and centralizes period assignment rules. */
(function(){
  const SUBJECTS={
    TOAN:{label:'Toán',status:'ready',generatorPeriods:['GK1'],note:'Kho hiện tại tập trung nội dung đầu năm và giữa học kỳ I.'},
    NGUVAN:{label:'Ngữ văn',status:'partial',generatorPeriods:['CK1'],note:'Có nội dung HKI; tài liệu không ghi rõ kỳ cụ thể vẫn giữ trạng thái chưa phân kỳ.'},
    TIENGANH:{label:'Tiếng Anh',status:'partial',generatorPeriods:['GK1'],note:'Ngân hàng hiện tại theo phạm vi Units 1–3.'},
    KHTN:{label:'KHTN',status:'awaiting_source',generatorPeriods:[],note:'Chưa có kho câu hỏi/tài liệu đủ căn cứ để gắn kỳ.'},
    LSDL:{label:'Lịch sử & Địa lý',status:'awaiting_source',generatorPeriods:[],note:'Chưa có kho câu hỏi/tài liệu đủ căn cứ để gắn kỳ.'},
    GDCD:{label:'GDCD',status:'awaiting_source',generatorPeriods:[],note:'Chưa có kho câu hỏi/tài liệu đủ căn cứ để gắn kỳ.'},
    TINHOC:{label:'Tin học',status:'awaiting_source',generatorPeriods:[],note:'Chưa có kho câu hỏi/tài liệu đủ căn cứ để gắn kỳ.'},
    CONGNGHE:{label:'Công nghệ',status:'awaiting_source',generatorPeriods:[],note:'Chưa có kho câu hỏi/tài liệu đủ căn cứ để gắn kỳ.'}
  };

  const RESOURCES={
    'review:TOAN:toan_gk1_thucte':{
      periods:['GK1'],term:'HK1',docType:'worked_example',scope:'Bài toán thực tế nhiều bước',
      assignmentBasis:'source_declared',confidence:'high',note:'ID và tiêu đề nguồn xác định GK1.'
    },
    'review:NGUVAN:nv_tiengviet_hk1':{
      periods:['CK1'],term:'HK1',docType:'worked_example',scope:'Thực hành Tiếng Việt HKI',
      assignmentBasis:'source_declared_term',confidence:'high',note:'Nguồn ghi rõ HKI; xếp vào ôn cuối kỳ I, không suy đoán là GK1.'
    },
    'review:NGUVAN:nv_doc_hieu':{
      periods:[],term:'',docType:'worked_example',scope:'Đọc hiểu – 5 chủ đề',
      assignmentBasis:'insufficient_source_evidence',confidence:'unassigned',note:'Tên/phạm vi hiện tại chưa đủ căn cứ để gắn GK1 hay CK1.'
    },
    'review:TIENGANH:en_u1_3':{
      periods:['GK1'],term:'HK1',docType:'worked_example',scope:'Global Success 6 · Units 1–3',
      assignmentBasis:'curriculum_scope',confidence:'medium',note:'Gắn theo phạm vi Units 1–3 để ôn GK1; không khẳng định tài liệu nguồn tự ghi nhãn GK1.'
    }
  };

  const BANKS={
    'TOAN:smart':{
      periods:['GK1'],term:'HK1',scope:'Số tự nhiên, phép tính, hình học cơ bản, bài toán thực tế',
      generator:true,assignmentBasis:'current_bank_scope',confidence:'medium'
    },
    'NGUVAN:reviews':{
      periods:['CK1'],term:'HK1',scope:'Tiếng Việt HKI và các bài đọc hiểu hiện có',
      generator:true,assignmentBasis:'source_declared_term',confidence:'medium',
      note:'Generator dùng kho HKI hiện có; tài liệu đọc hiểu chưa phân kỳ không tự được gắn vào danh sách bài mẫu CK1.'
    },
    'TIENGANH:units_1_3':{
      periods:['GK1'],term:'HK1',scope:'Global Success 6 · Units 1–3 · Reading · Rewrite',
      generator:true,assignmentBasis:'curriculum_scope',confidence:'medium'
    }
  };

  const PERIODS={
    GK1:{label:'Giữa kỳ 1',term:'HK1'},
    CK1:{label:'Cuối kỳ 1',term:'HK1'},
    GK2:{label:'Giữa kỳ 2',term:'HK2'},
    CK2:{label:'Cuối kỳ 2',term:'HK2'}
  };

  const registry={
    version:'1.0.0',schemaVersion:1,periods:PERIODS,subjects:SUBJECTS,resources:RESOURCES,banks:BANKS,
    schema:{
      required:['subject','docType'],
      optional:['periods','term','scope','assignmentBasis','confidence','note'],
      confidence:['high','medium','low','unassigned'],
      assignmentBasis:['source_declared','source_declared_term','curriculum_scope','current_bank_scope','insufficient_source_evidence']
    }
  };

  window.AURA_EXAM_METADATA=registry;
  window.auraExamMetaFor=function(kind,subject,id){
    return RESOURCES[`${kind}:${subject}:${id}`]||null;
  };
  window.auraExamGeneratorReady=function(subject,period){
    const s=SUBJECTS[subject];
    return !!(s&&Array.isArray(s.generatorPeriods)&&s.generatorPeriods.includes(period));
  };
})();
