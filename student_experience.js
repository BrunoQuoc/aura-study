/* AURA STUDY — student functions only; visual system stays unchanged. */
(function(){
  if(!document.body.classList.contains('student-shell'))return;
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  const SUBJECTS=()=>window.AURA_SUBJECTS||[];
  const EXAMS=()=>window.AURA_MATH_EXAMS||[];
  const REV=()=>window.AURA_REVIEWS||{};
  const PRACTICE_READY=['TOAN','NGUVAN','TIENGANH'];
  let practiceSelection={sub:'TOAN',count:15};

  function periodOf(text){
    const s=String(text||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(/giua\s*(ky|hk)\s*(1|i)\b/.test(s))return'GK1';
    if(/(cuoi\s*(ky|hk)\s*(1|i)\b|hoc\s*ky\s*(1|i)\b)/.test(s))return'CK1';
    if(/giua\s*(ky|hk)\s*(2|ii)\b/.test(s))return'GK2';
    if(/(cuoi\s*(ky|hk)\s*(2|ii)\b|hoc\s*ky\s*(2|ii)\b)/.test(s))return'CK2';
    return'';
  }

  const PERIODS={
    GK1:{title:'Giữa kỳ 1',desc:'Ôn phần kiến thức trước giữa học kỳ 1',icon:'①',minutes:45},
    CK1:{title:'Cuối kỳ 1',desc:'Ôn toàn bộ phạm vi học kỳ 1',icon:'②',minutes:60},
    GK2:{title:'Giữa kỳ 2',desc:'Ôn phần kiến thức đầu học kỳ 2',icon:'③',minutes:45},
    CK2:{title:'Cuối kỳ 2',desc:'Ôn toàn bộ phạm vi học kỳ 2',icon:'④',minutes:60}
  };

  function resources(){
    const out=[];
    EXAMS().filter(x=>x.ready&&x.id!=='quick15').forEach(x=>out.push({kind:'exam',subject:'TOAN',id:x.id,title:x.title,desc:x.desc||'',period:periodOf(`${x.title} ${x.desc||''}`)}));
    Object.entries(REV()).forEach(([sub,groups])=>(groups||[]).forEach(x=>out.push({kind:'review',subject:sub,id:x.id,title:x.title,desc:x.desc||'',period:periodOf(`${x.title} ${x.desc||''}`)})));
    return out;
  }

  function subjectName(id){return SUBJECTS().find(x=>x[0]===id)?.[1]||id}
  function subjectIcon(id){return SUBJECTS().find(x=>x[0]===id)?.[2]||'•'}
  function setPage(p){if(typeof window.setActive==='function')window.setActive(p)}
  function resourceTitle(r){return r.kind==='review'?String(r.title||'').replace(/^Ôn tập/i,'Bài mẫu'):r.title}
  function periodList(id){return resources().filter(x=>x.period===id)}
  function periodSubjectList(id,sub){return resources().filter(x=>x.period===id&&x.subject===sub)}

  function studentReviewHub(){
    setPage('library');const app=$('#app');if(!app)return;
    const rs=resources(),unassigned=rs.filter(x=>!x.period).length;
    app.innerHTML=`<div class="sectionhead" style="margin-top:0"><div><h2>Ôn thi theo năm học</h2><span>Chọn kỳ thi → chọn môn → xem đề và bài mẫu có lời giải</span></div></div>
      <div class="card quick15-card"><div class="quick15-row"><div class="quick15-main"><div class="quick15-icon">15'</div><div><h3>Kiểm tra 15 phút · Toán 6</h3><p>AURA tự trộn 10 câu trắc nghiệm Toán từ ngân hàng câu hỏi đủ dữ kiện. Mỗi lần bắt đầu là một đề mới.</p></div></div><button class="btn primary" onclick="startRandom15Exam()">Làm bài 15 phút</button></div></div>
      <div class="subjects">${Object.entries(PERIODS).map(([id,p])=>{const list=rs.filter(x=>x.period===id),n=list.length,subCount=new Set(list.map(x=>x.subject)).size;return `<div class="subject" onclick="studentExamPeriod('${id}')"><div class="ico">${p.icon}</div><h3>${p.title}</h3><div class="meta">${p.desc}</div><span class="tag ${n?'ready':'empty'}">${n?subCount+' môn · '+n+' tài liệu · '+p.minutes+' phút':'Chưa có nội dung'}</span></div>`}).join('')}</div>
      <div class="card" style="margin-top:16px"><b>AURA tự phân loại theo kỳ thi</b><p class="meta">Khi có nội dung ôn hoặc đề cương, AURA sẽ gắn bài học, bài mẫu và đề vào đúng kỳ và đúng môn. Tài liệu chưa đủ căn cứ sẽ không bị xếp đoán.</p>${unassigned?`<div class="note">${unassigned} tài liệu hiện có chưa được gắn kỳ vì chưa đủ căn cứ.</div>`:''}</div>`;
  }

  function studentExamPeriod(id){
    setPage('library');const app=$('#app'),p=PERIODS[id];if(!app||!p)return studentReviewHub();
    const list=periodList(id),readySubs=new Set(list.map(x=>x.subject));
    app.innerHTML=`<button class="btn soft" onclick="studentReviewHub()" style="margin-bottom:12px">← Ôn thi</button>
      <div class="sectionhead" style="margin-top:0"><div><h2>${p.title}</h2><span>${p.desc} · Thời gian làm đề: ${p.minutes} phút</span></div></div>
      <div class="subjects exam-period-subjects">${SUBJECTS().map(s=>{const n=periodSubjectList(id,s[0]).length,ready=readySubs.has(s[0]);return `<div class="subject ${ready?'':'is-empty'}" onclick="studentExamSubject('${id}','${s[0]}')" ${ready?'':'style="opacity:.62"'}><div class="ico">${esc(s[2])}</div><h3>${esc(s[1])}</h3><div class="meta">${ready?'Đề thi, bài mẫu và tài liệu ôn':'Chưa có tài liệu được gắn chắc chắn'}</div><span class="tag ${ready?'ready':'empty'}">${ready?n+' tài liệu':'Chưa có nội dung'}</span></div>`}).join('')}</div>
      <div class="card" style="margin-top:16px"><b>${list.length?`${new Set(list.map(x=>x.subject)).size} môn đã có nội dung`:'Kỳ này chưa có nội dung được phân loại'}</b><p class="meta">Chọn từng môn để xem đúng tài liệu của môn đó. Những môn chưa có nội dung vẫn được giữ chỗ để cấu trúc năm học luôn nhất quán.</p></div>`;
  }

  function studentExamSubject(id,sub){
    setPage('library');const app=$('#app'),p=PERIODS[id];if(!app||!p)return studentReviewHub();
    const list=periodSubjectList(id,sub),name=subjectName(sub),icon=subjectIcon(sub);
    app.innerHTML=`<button class="btn soft" onclick="studentExamPeriod('${id}')" style="margin-bottom:12px">← ${p.title}</button>
      <div class="sectionhead" style="margin-top:0"><div><h2>${esc(icon)} ${esc(name)} · ${p.title}</h2><span>${list.length?`${list.length} tài liệu · `:''}Thời gian làm đề: ${p.minutes} phút</span></div></div>
      <div class="card">${list.length?list.map(r=>`<div class="resource"><div class="fileico">${r.kind==='exam'?'📝':'📘'}</div><div class="grow"><b>${esc(resourceTitle(r))}</b><small>${r.kind==='review'?'Bài mẫu có lời giải · ':''}${esc(r.desc)}</small></div><button class="btn ${r.kind==='exam'?'primary':'soft'}" onclick="${r.kind==='exam'?`exam('${r.id}')`:`review('${r.subject}','${r.id}')`}">${r.kind==='exam'?'Làm đề':'Xem lời giải'}</button></div>`).join(''):`<div class="meta">Chưa có nội dung ${esc(name)} được gắn chắc chắn cho ${p.title}. AURA sẽ chỉ đưa tài liệu vào đây khi xác định đúng kỳ và đúng môn.</div><div style="margin-top:14px"><button class="btn primary" onclick="studentOpenSubjectLessons('${sub}')">Mở bài học ${esc(name)}</button></div>`}</div>`;
  }

  function studentOpenSubjectLessons(sub){
    if(typeof window.lessonSubject==='function')return window.lessonSubject(sub);
    if(typeof window.lessons==='function')return window.lessons();
  }

  function studentPractice(sub=practiceSelection.sub,count=practiceSelection.count){
    setPage('generator');const app=$('#app');if(!app)return;
    if(PRACTICE_READY.includes(sub))practiceSelection.sub=sub;
    if([10,15,20].includes(Number(count)))practiceSelection.count=Number(count);
    const selectedSub=practiceSelection.sub,selectedCount=practiceSelection.count;
    app.innerHTML=`<div class="sectionhead" style="margin-top:0"><div><h2>Luyện nhanh</h2><span>Chọn môn và số câu, AURA tự chuẩn bị bài luyện</span></div></div>
      <div class="subjects practice-subjects">${SUBJECTS().map(s=>{const ready=PRACTICE_READY.includes(s[0]),selected=s[0]===selectedSub&&ready;return `<div class="subject practice-subject ${selected?'is-selected':''}" ${ready?`onclick="studentSelectPracticeSubject('${s[0]}')"`:'style="opacity:.5"'} aria-pressed="${selected?'true':'false'}"><div class="ico">${esc(s[2])}</div><h3>${esc(s[1])}</h3><div class="meta">${ready?'Có thể luyện ngay':'Đang cập nhật nội dung'}</div><span class="tag ${selected?'practice-selected-tag':ready?'ready':'empty'}">${selected?'✓ Đang chọn':ready?'Sẵn sàng':'Chưa có nội dung'}</span></div>`}).join('')}</div>
      <div class="card practice-picker" style="margin-top:16px"><h3>Chọn số câu</h3><p class="meta">Bé chọn độ dài buổi luyện, sau đó bấm “Bắt đầu luyện”.</p><div class="practice-counts"><button class="btn practice-count ${selectedCount===10?'is-selected':''}" onclick="studentSelectPracticeCount(10)">10 câu <span>Nhanh</span></button><button class="btn practice-count ${selectedCount===15?'is-selected':''}" onclick="studentSelectPracticeCount(15)">15 câu <span>Vừa đủ</span></button><button class="btn practice-count ${selectedCount===20?'is-selected':''}" onclick="studentSelectPracticeCount(20)">20 câu <span>Ôn kỹ</span></button></div><div class="practice-start-row"><div class="practice-choice-summary"><span>Đã chọn</span><strong>${esc(subjectName(selectedSub))} · ${selectedCount} câu</strong></div><button class="btn primary practice-start" onclick="studentStartQuick('${selectedSub}',${selectedCount})">Bắt đầu luyện →</button></div></div>`;
  }

  function studentSelectPracticeSubject(sub){
    if(!PRACTICE_READY.includes(sub))return;
    practiceSelection.sub=sub;
    studentPractice(sub,practiceSelection.count);
  }
  function studentSelectPracticeCount(count){
    count=Number(count);if(![10,15,20].includes(count))return;
    practiceSelection.count=count;
    studentPractice(practiceSelection.sub,count);
  }

  function studentStartQuick(sub,count){
    const app=$('#app');if(!app)return;
    app.innerHTML=`<div hidden><select id="genSubject"><option value="${esc(sub)}" selected>${esc(sub)}</option></select><select id="genBasis"><option value="outline" selected>outline</option></select><select id="genCount"><option selected>${count}</option></select><select id="genLevel"><option value="standard" selected>standard</option></select><input id="genKeywords" value=""></div>`;
    if(typeof window.generateAuraExam==='function')window.generateAuraExam();
  }

  window.studentReviewHub=studentReviewHub;
  window.studentExamPeriod=studentExamPeriod;
  window.studentExamSubject=studentExamSubject;
  window.studentOpenSubjectLessons=studentOpenSubjectLessons;
  window.studentSelectPracticeSubject=studentSelectPracticeSubject;
  window.studentSelectPracticeCount=studentSelectPracticeCount;
  window.studentStartQuick=studentStartQuick;
  window.library=studentReviewHub;
  window.generator=studentPractice;
})();