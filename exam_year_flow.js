/* AURA STUDY — enhanced exam-period flow: period -> subject -> exams / worked examples / weak areas */
(function(){
  if(!document.body.classList.contains('student-shell'))return;

  const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  const normalize=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch(_){return fallback}};
  const SUBJECTS=()=>window.AURA_SUBJECTS||[];
  const EXAMS=()=>window.AURA_MATH_EXAMS||[];
  const REVIEWS=()=>window.AURA_REVIEWS||{};
  const META=()=>window.AURA_EXAM_METADATA||{};
  const ENGINE_READY=new Set(['TOAN','NGUVAN','TIENGANH']);

  const PERIODS={
    GK1:{title:'Giữa kỳ 1',desc:'Ôn phần kiến thức trước giữa học kỳ 1',icon:'①',minutes:45},
    CK1:{title:'Cuối kỳ 1',desc:'Ôn toàn bộ phạm vi học kỳ 1',icon:'②',minutes:60},
    GK2:{title:'Giữa kỳ 2',desc:'Ôn phần kiến thức đầu học kỳ 2',icon:'③',minutes:45},
    CK2:{title:'Cuối kỳ 2',desc:'Ôn toàn bộ phạm vi học kỳ 2',icon:'④',minutes:60}
  };

  function periodOf(text){
    const s=normalize(text);
    if(/giua\s*(ky|hk)\s*(1|i)\b/.test(s)||/\bgk1\b/.test(s))return'GK1';
    if(/(cuoi\s*(ky|hk)\s*(1|i)\b|hoc\s*ky\s*(1|i)\b)/.test(s)||/\bck1\b/.test(s))return'CK1';
    if(/giua\s*(ky|hk)\s*(2|ii)\b/.test(s)||/\bgk2\b/.test(s))return'GK2';
    if(/(cuoi\s*(ky|hk)\s*(2|ii)\b|hoc\s*ky\s*(2|ii)\b)/.test(s)||/\bck2\b/.test(s))return'CK2';
    return'';
  }

  function resourceMeta(kind,subject,id){
    if(typeof window.auraExamMetaFor==='function')return window.auraExamMetaFor(kind,subject,id);
    return META().resources?.[`${kind}:${subject}:${id}`]||null;
  }
  function periodsFor(kind,subject,id,title,desc){
    const meta=resourceMeta(kind,subject,id);
    if(meta&&Array.isArray(meta.periods))return meta.periods.filter(x=>PERIODS[x]);
    const fallback=periodOf(`${title||''} ${desc||''}`);
    return fallback?[fallback]:[];
  }
  function generatorReady(subject,period){
    if(!ENGINE_READY.has(subject))return false;
    if(typeof window.auraExamGeneratorReady==='function')return window.auraExamGeneratorReady(subject,period);
    const arr=META().subjects?.[subject]?.generatorPeriods||[];
    return arr.includes(period);
  }
  function confidenceLabel(meta){
    if(!meta)return'';
    const basis={source_declared:'Nguồn ghi rõ kỳ',source_declared_term:'Nguồn ghi rõ học kỳ',curriculum_scope:'Gắn theo phạm vi kiến thức',current_bank_scope:'Theo phạm vi ngân hàng',insufficient_source_evidence:'Chưa đủ căn cứ'}[meta.assignmentBasis]||'';
    return basis?`${basis}${meta.scope?' · '+meta.scope:''}`:(meta.scope||'');
  }

  function pushResource(out,r){
    const ps=periodsFor(r.kind,r.subject,r.id,r.title,r.desc),meta=resourceMeta(r.kind,r.subject,r.id);
    if(ps.length)ps.forEach(period=>out.push({...r,period,examMeta:meta}));
    else out.push({...r,period:'',examMeta:meta});
  }
  function resources(){
    const out=[];
    EXAMS().filter(x=>x.ready&&x.id!=='quick15').forEach(x=>pushResource(out,{kind:'exam',subject:'TOAN',id:x.id,title:x.title,desc:x.desc||''}));
    Object.entries(REVIEWS()).forEach(([subject,groups])=>(groups||[]).forEach(x=>pushResource(out,{kind:'review',subject,id:x.id,title:x.title,desc:x.desc||''})));
    return out;
  }

  function subjectMeta(id){return SUBJECTS().find(x=>x[0]===id)||[id,id,'•','']}
  function setPage(){if(typeof window.setActive==='function')window.setActive('library')}
  function resourceTitle(r){return r.kind==='review'?String(r.title||'').replace(/^Ôn tập/i,'Bài mẫu'):r.title}

  function weaknessData(subject){
    const smart=read('aura_smart_stats',{})?.[subject]||{};
    const smartRows=Object.entries(smart).map(([skill,v])=>({
      key:`smart:${skill}`,
      label:skill,
      source:'smart',
      seen:Number(v?.seen||0),
      wrong:Number(v?.wrong||0),
      rate:Number(v?.seen||0)?Number(v?.wrong||0)/Number(v?.seen||1):0,
      active:Number(v?.wrong||0)>0
    })).filter(x=>x.seen>0&&x.wrong>0);

    const book=Object.values(read('aura_wrong_book_v1',{})).filter(x=>(x.subject||'TOAN')===subject&&(x.consecutiveCorrect||0)<2);
    const groups={};
    book.forEach(x=>{
      const label=x.topic||'Nội dung tổng hợp';
      const g=groups[label]||(groups[label]={key:`book:${label}`,label,source:'book',questions:0,wrong:0,recovered:0,active:true});
      g.questions++;g.wrong+=Number(x.wrongCount||0);g.recovered+=Number(x.correctAfterWrong||0);
    });
    const bookRows=Object.values(groups);
    const rows=[...bookRows,...smartRows].sort((a,b)=>{
      const pa=a.source==='book'?(a.questions*5+a.wrong-a.recovered):(a.rate*10+a.seen*.05);
      const pb=b.source==='book'?(b.questions*5+b.wrong-b.recovered):(b.rate*10+b.seen*.05);
      return pb-pa;
    });
    return {rows,activeQuestions:book.length,smartSkills:smartRows.length};
  }

  function weakCount(subject){const d=weaknessData(subject);return d.activeQuestions||d.smartSkills}
  function periodResources(period,subject=''){return resources().filter(x=>x.period===period&&(!subject||x.subject===subject))}

  function weakRowsHTML(subject){
    const d=weaknessData(subject);
    if(!d.rows.length){
      return `<div class="exam-flow-empty"><b>Chưa đủ dữ liệu để xác định phần yếu.</b><span>AURA chỉ đánh dấu phần yếu sau khi bé có câu được chấm đúng/sai. Không suy đoán khi chưa có dữ liệu.</span></div>`;
    }
    return `<div class="exam-weak-list">${d.rows.slice(0,4).map((x,i)=>{
      const detail=x.source==='book'?`${x.questions} câu cần ôn · sai ${x.wrong} lượt${x.recovered?` · đã sửa đúng ${x.recovered} lượt`:''}`:`Sai ${Math.round(x.rate*100)}% trên ${x.seen} lượt chấm`;
      return `<article class="exam-weak-item"><span class="exam-weak-rank">${i+1}</span><div><b>${esc(x.label)}</b><small>${esc(detail)}</small></div></article>`;
    }).join('')}</div>`;
  }

  function examRows(list){
    if(!list.length)return'';
    return `<div class="exam-resource-list">${list.map(r=>{const meta=confidenceLabel(r.examMeta);return `<div class="exam-resource-row"><div class="exam-resource-icon">📝</div><div class="grow"><b>${esc(resourceTitle(r))}</b><small>${esc(r.desc)}${meta?` · ${esc(meta)}`:''}</small></div><button class="btn primary" type="button" onclick="exam('${r.id}')">Làm đề</button></div>`}).join('')}</div>`;
  }

  function reviewRows(list){
    if(!list.length)return'';
    return `<div class="exam-resource-list">${list.map(r=>{const meta=confidenceLabel(r.examMeta);return `<div class="exam-resource-row"><div class="exam-resource-icon">📘</div><div class="grow"><b>${esc(resourceTitle(r))}</b><small>Bài mẫu có lời giải · ${esc(r.desc)}${meta?` · ${esc(meta)}`:''}</small></div><button class="btn soft" type="button" onclick="review('${r.subject}','${r.id}')">Xem lời giải</button></div>`}).join('')}</div>`;
  }

  function generatedExamButton(subject,period){
    if(!generatorReady(subject,period))return'';
    return `<button class="btn soft" type="button" onclick="auraStartPeriodExam('${subject}','${period}')">Tạo đề mô phỏng</button>`;
  }

  function weakButtons(subject){
    if(!ENGINE_READY.has(subject))return'';
    const active=weaknessData(subject).activeQuestions;
    return `<div class="exam-flow-actions">${subject==='TOAN'&&active&&typeof window.openWrongPractice==='function'?'<button class="btn soft" type="button" onclick="openWrongPractice()">Luyện lại câu sai</button>':''}<button class="btn primary" type="button" onclick="auraStartWeakStudy('${subject}',10)">Luyện theo phần yếu</button></div>`;
  }

  function studentReviewHub(){
    setPage();const app=document.getElementById('app');if(!app)return;
    const rs=resources(),unassigned=rs.filter(x=>!x.period).length;
    app.innerHTML=`<div class="sectionhead exam-year-head" style="margin-top:0"><div><h2>Ôn thi theo năm học</h2><span>Chọn kỳ thi → chọn môn → làm đề, xem bài mẫu và ôn đúng phần còn yếu</span></div></div>
      <div class="card exam-year-guide"><div class="exam-year-step"><b>1</b><span>Chọn kỳ thi</span></div><i>→</i><div class="exam-year-step"><b>2</b><span>Chọn môn</span></div><i>→</i><div class="exam-year-step"><b>3</b><span>Đề thi · Bài mẫu · Phần yếu</span></div></div>
      <div class="card quick15-card"><div class="quick15-row"><div class="quick15-main"><div class="quick15-icon">15'</div><div><h3>Kiểm tra 15 phút · Toán 6</h3><p>AURA tự trộn 10 câu trắc nghiệm Toán đủ dữ kiện. Mỗi lần bắt đầu là một đề mới.</p></div></div><button class="btn primary" onclick="startRandom15Exam()">Làm bài 15 phút</button></div></div>
      <div class="subjects exam-year-periods">${Object.entries(PERIODS).map(([id,p])=>{const list=periodResources(id),n=list.length,subCount=new Set(list.map(x=>x.subject)).size;return `<div class="subject" onclick="studentExamPeriod('${id}')"><div class="ico">${p.icon}</div><h3>${p.title}</h3><div class="meta">${p.desc}</div><span class="tag ${n?'ready':'empty'}">${n?subCount+' môn · '+n+' tài liệu':'Chưa có tài liệu gắn kỳ'}</span></div>`}).join('')}</div>
      <div class="card exam-year-note"><b>Metadata kỳ thi đã được chuẩn hóa</b><p class="meta">AURA ưu tiên metadata nguồn. Phạm vi chương/Unit chỉ được dùng khi registry ghi rõ căn cứ; tài liệu thiếu căn cứ vẫn ở trạng thái chưa phân kỳ.</p>${unassigned?`<div class="note">${unassigned} tài liệu hiện có vẫn chưa đủ căn cứ để gắn vào một kỳ cụ thể; AURA giữ nguyên thay vì xếp đoán.</div>`:''}</div>`;
  }

  function studentExamPeriod(id){
    setPage();const app=document.getElementById('app'),p=PERIODS[id];if(!app||!p)return studentReviewHub();
    const list=periodResources(id);
    app.innerHTML=`<button class="btn soft" onclick="studentReviewHub()" style="margin-bottom:12px">← Ôn thi theo năm học</button>
      <div class="sectionhead" style="margin-top:0"><div><h2>${p.title}</h2><span>${p.desc} · Mốc làm đề tham khảo ${p.minutes} phút</span></div></div>
      <div class="subjects exam-period-subjects">${SUBJECTS().map(s=>{const n=periodResources(id,s[0]).length,w=weakCount(s[0]),canGenerate=generatorReady(s[0],id),ready=n||w||canGenerate;return `<div class="subject ${ready?'':'is-empty'}" onclick="studentExamSubject('${id}','${s[0]}')" ${ready?'':'style="opacity:.62"'}><div class="ico">${esc(s[2])}</div><h3>${esc(s[1])}</h3><div class="meta">${n?`${n} tài liệu đã gắn kỳ`:canGenerate?'Có ngân hàng phù hợp để tạo đề mô phỏng':'Chưa có tài liệu/ngân hàng phù hợp kỳ này'}${w?` · ${w} phần yếu hiện tại`:''}</div><span class="tag ${n||w||canGenerate?'ready':'empty'}">${n||w?`${n?n+' tài liệu':''}${n&&w?' · ':''}${w?w+' ưu tiên':''}`:canGenerate?'Có thể tạo đề':'Chờ nguồn'}</span></div>`}).join('')}</div>
      <div class="card exam-period-note"><b>${list.length?`${new Set(list.map(x=>x.subject)).size} môn có tài liệu được gắn chắc chắn`:'Kỳ này chưa có tài liệu nguồn được gắn chắc chắn'}</b><p class="meta">Generator chỉ xuất hiện khi metadata xác nhận ngân hàng hiện tại phù hợp với kỳ đang chọn. KHTN, Lịch sử & Địa lý, GDCD, Tin học và Công nghệ sẽ giữ trạng thái chờ nguồn cho tới khi có dữ liệu.</p></div>`;
  }

  function studentExamSubject(id,subject){
    setPage();const app=document.getElementById('app'),p=PERIODS[id];if(!app||!p)return studentReviewHub();
    localStorage.setItem('aura_last_subject',subject);
    const meta=subjectMeta(subject),list=periodResources(id,subject),exams=list.filter(x=>x.kind==='exam'),reviews=list.filter(x=>x.kind==='review'),weak=weaknessData(subject),canGenerate=generatorReady(subject,id),subjectRegistry=META().subjects?.[subject];
    app.innerHTML=`<button class="btn soft" onclick="studentExamPeriod('${id}')" style="margin-bottom:12px">← ${p.title}</button>
      <div class="sectionhead exam-subject-head" style="margin-top:0"><div><h2>${esc(meta[2])} ${esc(meta[1])} · ${p.title}</h2><span>${exams.length} đề nguồn · ${reviews.length} bài mẫu · ${weak.rows.length} nhóm cần chú ý</span></div></div>
      <section class="card exam-subject-summary"><div><span>TÀI LIỆU GẮN ĐÚNG KỲ</span><strong>${list.length}</strong><small>Không trộn tài liệu chưa xác định kỳ</small></div><div><span>PHẦN YẾU HIỆN TẠI</span><strong>${weak.rows.length}</strong><small>Dựa trên các lượt chấm thực tế</small></div><div><span>THỜI GIAN ĐỀ</span><strong>${p.minutes}'</strong><small>Mốc tham khảo cho ${p.title}</small></div></section>

      <section class="card exam-flow-section exam-flow-exams"><div class="exam-flow-title"><div><span>01 · ĐỀ THI</span><h3>Đề kiểm tra / đề mô phỏng</h3><p>Ưu tiên đề nguồn đã được gắn đúng kỳ. Đề mô phỏng chỉ bật khi metadata xác nhận ngân hàng phù hợp kỳ này.</p></div>${generatedExamButton(subject,id)}</div>${examRows(exams)||`<div class="exam-flow-empty"><b>Chưa có đề nguồn ${esc(meta[1])} được gắn chắc chắn cho ${p.title}.</b><span>${canGenerate?'Có thể dùng “Tạo đề mô phỏng” từ ngân hàng phù hợp kỳ này.':esc(subjectRegistry?.note||'AURA sẽ chỉ hiển thị khi có tài liệu đủ căn cứ.')}</span></div>`}</section>

      <section class="card exam-flow-section exam-flow-reviews"><div class="exam-flow-title"><div><span>02 · BÀI MẪU</span><h3>Bài mẫu có lời giải</h3><p>Dùng để xem cách làm, đối chiếu phương pháp và củng cố kiến thức trước khi làm đề.</p></div></div>${reviewRows(reviews)||`<div class="exam-flow-empty"><b>Chưa có bài mẫu ${esc(meta[1])} được gắn chắc chắn cho ${p.title}.</b><span>Tài liệu chưa xác định kỳ sẽ không bị đưa vào đây chỉ để lấp chỗ trống.</span></div>`}</section>

      <section class="card exam-flow-section exam-flow-weak"><div class="exam-flow-title"><div><span>03 · PHẦN YẾU CẦN ÔN</span><h3>Ưu tiên theo dữ liệu của bé</h3><p>Phần yếu là dữ liệu hiện tại của môn học và được hiển thị riêng với metadata kỳ thi; AURA không tự coi phần yếu là nội dung của kỳ nếu chưa có mapping.</p></div>${weakButtons(subject)}</div>${weakRowsHTML(subject)}</section>`;
  }

  function startSmart(subject,strategy,count){
    const app=document.getElementById('app');if(!app||!ENGINE_READY.has(subject))return;
    count=Math.max(10,Math.min(20,Number(count)||15));
    app.innerHTML=`<div hidden><select id="genSubject"><option value="${esc(subject)}" selected>${esc(subject)}</option></select><select id="genBasis"><option value="outline" selected>outline</option></select><select id="genCount"><option value="${count}" selected>${count}</option></select><select id="genLevel"><option value="standard" selected>standard</option></select><input id="genKeywords" value=""><select id="smartStrategy"><option value="${esc(strategy)}" selected>${esc(strategy)}</option></select></div>`;
    if(typeof window.generateAuraExam==='function')window.generateAuraExam();
  }

  window.auraStartWeakStudy=function(subject,count=10){startSmart(subject,'weak',count)};
  window.auraStartPeriodExam=function(subject,period){
    if(!generatorReady(subject,period))return;
    localStorage.setItem('aura_exam_period',period||'');
    startSmart(subject,'exam',20);
  };

  window.studentReviewHub=studentReviewHub;
  window.studentExamPeriod=studentExamPeriod;
  window.studentExamSubject=studentExamSubject;
  window.library=studentReviewHub;
})();
