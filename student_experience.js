/* AURA STUDY — student functions only; visual system stays unchanged. */
(function(){
  if(!document.body.classList.contains('student-shell'))return;
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  const SUBJECTS=()=>window.AURA_SUBJECTS||[];
  const EXAMS=()=>window.AURA_MATH_EXAMS||[];
  const REV=()=>window.AURA_REVIEWS||{};

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
  function setPage(p){if(typeof window.setActive==='function')window.setActive(p)}
  function resourceTitle(r){return r.kind==='review'?String(r.title||'').replace(/^Ôn tập/i,'Bài mẫu'):r.title}

  function studentReviewHub(){
    setPage('library');const app=$('#app');if(!app)return;
    const rs=resources(),unassigned=rs.filter(x=>!x.period).length;
    app.innerHTML=`<div class="sectionhead" style="margin-top:0"><div><h2>Ôn thi theo năm học</h2><span>Chọn kỳ thi để xem đề và bài mẫu có lời giải</span></div></div>
      <div class="card quick15-card"><div class="quick15-row"><div class="quick15-main"><div class="quick15-icon">15'</div><div><h3>Kiểm tra 15 phút</h3><p>AURA tự trộn 10 câu trắc nghiệm từ ngân hàng câu hỏi đủ dữ kiện. Mỗi lần bắt đầu là một đề mới.</p></div></div><button class="btn primary" onclick="startRandom15Exam()">Làm bài 15 phút</button></div></div>
      <div class="subjects">${Object.entries(PERIODS).map(([id,p])=>{const n=rs.filter(x=>x.period===id).length;return `<div class="subject" onclick="studentExamPeriod('${id}')"><div class="ico">${p.icon}</div><h3>${p.title}</h3><div class="meta">${p.desc}</div><span class="tag ${n?'ready':'empty'}">${n?n+' tài liệu · '+p.minutes+' phút':'Chưa có nội dung'}</span></div>`}).join('')}</div>
      <div class="card" style="margin-top:16px"><b>AURA tự phân loại theo kỳ thi</b><p class="meta">Khi có nội dung ôn hoặc đề cương, AURA sẽ gắn bài học, bài mẫu và đề vào đúng kỳ. Tài liệu chưa đủ căn cứ sẽ không bị xếp đoán.</p>${unassigned?`<div class="note">${unassigned} tài liệu hiện có chưa được gắn kỳ vì chưa đủ căn cứ.</div>`:''}</div>`;
  }

  function studentExamPeriod(id){
    setPage('library');const app=$('#app'),p=PERIODS[id];if(!app||!p)return studentReviewHub();
    const list=resources().filter(x=>x.period===id);
    app.innerHTML=`<button class="btn soft" onclick="studentReviewHub()" style="margin-bottom:12px">← Ôn thi</button>
      <div class="sectionhead" style="margin-top:0"><div><h2>${p.title}</h2><span>${p.desc} · Thời gian làm đề: ${p.minutes} phút</span></div></div>
      <div class="card">${list.length?list.map(r=>`<div class="resource"><div class="fileico">${r.kind==='exam'?'📝':'📘'}</div><div class="grow"><b>${esc(resourceTitle(r))}</b><small>${esc(subjectName(r.subject))} · ${r.kind==='review'?'Bài mẫu có lời giải · ':''}${esc(r.desc)}</small></div><button class="btn ${r.kind==='exam'?'primary':'soft'}" onclick="${r.kind==='exam'?`exam('${r.id}')`:`review('${r.subject}','${r.id}')`}">${r.kind==='exam'?'Làm đề':'Xem lời giải'}</button></div>`).join(''):`<div class="meta">Chưa có nội dung được gắn chắc chắn cho ${p.title}. Khi có nội dung ôn, AURA sẽ tự đưa tài liệu phù hợp vào đây.</div><div style="margin-top:14px"><button class="btn primary" onclick="lessons()">Mở bài học</button></div>`}</div>`;
  }

  function studentPractice(sub='TOAN'){
    setPage('generator');const app=$('#app');if(!app)return;
    const ready=['TOAN','NGUVAN','TIENGANH'];
    app.innerHTML=`<div class="sectionhead" style="margin-top:0"><div><h2>Luyện nhanh</h2><span>Chọn môn và số câu, AURA tự chuẩn bị bài luyện</span></div></div>
      <div class="subjects">${SUBJECTS().map(s=>`<div class="subject" ${ready.includes(s[0])?`onclick="generator('${s[0]}')"`:'style="opacity:.5"'}><div class="ico">${esc(s[2])}</div><h3>${esc(s[1])}</h3><div class="meta">${ready.includes(s[0])?'Có thể luyện ngay':'Đang cập nhật nội dung'}</div><span class="tag ${ready.includes(s[0])?'ready':'empty'}">${s[0]===sub&&ready.includes(s[0])?'Đang chọn':ready.includes(s[0])?'Sẵn sàng':'Chưa có nội dung'}</span></div>`).join('')}</div>
      <div class="card" style="margin-top:16px"><h3>Chọn số câu</h3><p class="meta">Bé chỉ cần chọn độ dài buổi luyện.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn soft" onclick="studentStartQuick('${sub}',10)">10 câu · Nhanh</button><button class="btn primary" onclick="studentStartQuick('${sub}',15)">15 câu · Vừa đủ</button><button class="btn soft" onclick="studentStartQuick('${sub}',20)">20 câu · Ôn kỹ</button></div><div class="note" style="margin-top:14px"><b>Mẹo:</b> làm hết một lượt trước, sau đó mới xem đáp án và ôn lại câu sai.</div></div>`;
  }

  function studentStartQuick(sub,count){
    const app=$('#app');if(!app)return;
    app.innerHTML=`<div hidden><select id="genSubject"><option value="${esc(sub)}" selected>${esc(sub)}</option></select><select id="genBasis"><option value="outline" selected>outline</option></select><select id="genCount"><option selected>${count}</option></select><select id="genLevel"><option value="standard" selected>standard</option></select><input id="genKeywords" value=""></div>`;
    if(typeof window.generateAuraExam==='function')window.generateAuraExam();
  }

  window.studentReviewHub=studentReviewHub;
  window.studentExamPeriod=studentExamPeriod;
  window.studentStartQuick=studentStartQuick;
  window.library=studentReviewHub;
  window.generator=studentPractice;
})();