/* AURA STUDY — Student-first navigation and guided study flow. */
(function(){
  if(!document.body.classList.contains('student-shell'))return;
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  const SUBJECTS=()=>window.AURA_SUBJECTS||[];
  const EXAMS=()=>window.AURA_MATH_EXAMS||[];
  const REV=()=>window.AURA_REVIEWS||{};
  const oldSubject=window.subject;

  function labelChrome(){
    const brand=document.querySelector('.brandtext small');if(brand)brand.textContent='Lớp 6 · Học dễ hơn mỗi ngày';
    const account=document.querySelector('.aura-account');if(account)account.innerHTML='<b>Lớp 6</b>';
    const labels={home:'Hôm nay',library:'Ôn thi',lessons:'Bài học',generator:'Luyện nhanh',history:'Kết quả'};
    document.querySelectorAll('.side .navbtn').forEach(b=>{const t=b.querySelector('span');if(t&&labels[b.dataset.page])t.textContent=labels[b.dataset.page]});
    document.querySelectorAll('.mobilebar button').forEach(b=>{
      const oc=b.getAttribute('onclick')||'';let text='';
      if(oc.includes('home('))text='Hôm nay';else if(oc.includes('studentReviewHub(')||oc.includes('library('))text='Ôn thi';else if(oc.includes('lessons('))text='Bài học';else if(oc.includes('generator('))text='Luyện nhanh';else if(oc.includes('history('))text='Kết quả';
      const sm=b.querySelector('small');if(sm&&text)sm.textContent=text;
    });
  }

  function periodOf(text){
    const s=String(text||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(/giua\s*(ky|hk)\s*(1|i)\b/.test(s))return'GK1';
    if(/(cuoi\s*(ky|hk)\s*(1|i)\b|hoc\s*ky\s*(1|i)\b)/.test(s))return'CK1';
    if(/giua\s*(ky|hk)\s*(2|ii)\b/.test(s))return'GK2';
    if(/(cuoi\s*(ky|hk)\s*(2|ii)\b|hoc\s*ky\s*(2|ii)\b)/.test(s))return'CK2';
    return'';
  }
  const PERIODS={GK1:{title:'Giữa kỳ 1',sub:'Ôn phần kiến thức trước giữa HK1'},CK1:{title:'Cuối kỳ 1',sub:'Ôn toàn bộ phạm vi HK1'},GK2:{title:'Giữa kỳ 2',sub:'Ôn phần kiến thức đầu HK2'},CK2:{title:'Cuối kỳ 2',sub:'Ôn toàn bộ phạm vi HK2'}};

  function resources(){
    const out=[];
    EXAMS().filter(x=>x.ready).forEach(x=>out.push({kind:'exam',subject:'TOAN',id:x.id,title:x.title,desc:x.desc||'',period:periodOf(`${x.title} ${x.desc||''}`)}));
    Object.entries(REV()).forEach(([sub,groups])=>(groups||[]).forEach(x=>out.push({kind:'review',subject:sub,id:x.id,title:x.title,desc:x.desc||'',period:periodOf(`${x.title} ${x.desc||''}`)})));
    return out;
  }
  function subjectName(id){return SUBJECTS().find(x=>x[0]===id)?.[1]||id}
  function setPage(p){if(typeof window.setActive==='function')window.setActive(p);else document.querySelectorAll('.navbtn').forEach(b=>b.classList.toggle('active',b.dataset.page===p))}

  function studentReviewHub(){
    setPage('library');const app=$('#app');if(!app)return;
    const rs=resources(),unassigned=rs.filter(x=>!x.period).length;
    app.innerHTML=`<div class="student-page-head"><div><span class="student-kicker">ÔN THI THEO NĂM HỌC</span><h1>Con đang chuẩn bị cho kỳ nào?</h1><p>Chọn đúng kỳ thi. AURA chỉ đưa những tài liệu đã nhận diện chắc chắn thuộc phạm vi đó.</p></div></div>
    <div class="exam-period-grid">${Object.entries(PERIODS).map(([id,p],i)=>{const n=rs.filter(x=>x.period===id).length;return`<button class="exam-period-card p${i+1}" onclick="studentExamPeriod('${id}')"><span class="period-no">0${i+1}</span><div><b>${p.title}</b><small>${p.sub}</small><em>${n?n+' tài liệu đã xếp':'Đang chờ nội dung ôn'}</em></div><span class="period-arrow">→</span></button>`}).join('')}</div>
    <div class="student-info-card"><b>AURA tự phân loại</b><span>Khi có đề cương hoặc nội dung ôn Anh đưa vào INBOX, AURA sẽ gắn bài học, bài tập và đề vào đúng 1 trong 4 kỳ. Tài liệu chưa đủ căn cứ sẽ không bị xếp đoán.</span>${unassigned?`<small>${unassigned} tài liệu hiện có chưa được gắn kỳ vì tên/nội dung chưa đủ chắc chắn.</small>`:''}</div>`;
  }

  function studentExamPeriod(id){
    setPage('library');const app=$('#app'),p=PERIODS[id];if(!app||!p)return studentReviewHub();
    const list=resources().filter(x=>x.period===id);
    app.innerHTML=`<button class="btn soft" onclick="studentReviewHub()" style="margin-bottom:14px">← 4 kỳ thi</button><div class="student-page-head compact"><div><span class="student-kicker">${p.title.toUpperCase()}</span><h1>${p.title}</h1><p>${p.sub}</p></div></div>${list.length?`<div class="student-resource-list">${list.map(r=>`<article class="student-resource"><div><span>${esc(subjectName(r.subject))}</span><b>${esc(r.title)}</b><small>${esc(r.desc)}</small></div><button class="btn primary" onclick="${r.kind==='exam'?`exam('${r.id}')`:`review('${r.subject}','${r.id}')`}">${r.kind==='exam'?'Làm đề':'Ôn bài'}</button></article>`).join('')}</div>`:`<div class="student-empty-state"><div class="empty-mark">✓</div><h2>Chưa có nội dung được gắn chắc chắn</h2><p>Khi Anh gửi nội dung ôn của ${p.title}, AURA sẽ tự đưa đúng bài học, bài tập và đề vào đây.</p><button class="btn primary" onclick="lessons()">Học bài trước</button></div>`}`;
  }

  function studentPractice(sub='TOAN'){
    setPage('generator');const app=$('#app');if(!app)return;
    const ready=['TOAN','NGUVAN','TIENGANH'];
    app.innerHTML=`<div class="student-page-head"><div><span class="student-kicker">LUYỆN NHANH</span><h1>Chọn môn rồi bắt đầu</h1><p>Không cần cài đặt đề. AURA tự chọn câu phù hợp từ nội dung đang có.</p></div></div>
      <div class="quick-subjects">${SUBJECTS().map(s=>`<button class="quick-subject ${s[0]===sub?'active':''}" ${ready.includes(s[0])?`onclick="generator('${s[0]}')"`:'disabled'}><span>${esc(s[2])}</span><b>${esc(s[1])}</b><small>${ready.includes(s[0])?'Sẵn sàng':'Đang cập nhật'}</small></button>`).join('')}</div>
      <div class="student-page-head compact"><div><h2>Con muốn luyện bao nhiêu?</h2><p>Chọn một mức, AURA sẽ tạo bài ngay.</p></div></div>
      <div class="quick-levels"><button onclick="studentStartQuick('${sub}',10)"><b>10 câu</b><span>Nhanh · khoảng 10 phút</span></button><button class="recommended" onclick="studentStartQuick('${sub}',15)"><em>Nên chọn</em><b>15 câu</b><span>Vừa đủ · khoảng 15–20 phút</span></button><button onclick="studentStartQuick('${sub}',20)"><b>20 câu</b><span>Ôn kỹ · khoảng 25 phút</span></button></div>
      <div class="student-tip"><b>Mẹo học nhanh:</b> làm hết một lượt trước, sau đó mới xem đáp án và ôn lại câu sai.</div>`;
  }

  function studentStartQuick(sub,count){
    const app=$('#app');if(!app)return;
    app.innerHTML=`<div hidden><select id="genSubject"><option value="${esc(sub)}" selected>${esc(sub)}</option></select><select id="genBasis"><option value="outline" selected>outline</option></select><select id="genCount"><option selected>${count}</option></select><select id="genLevel"><option value="standard" selected>standard</option></select><input id="genKeywords" value=""></div>`;
    if(typeof window.generateAuraExam==='function')window.generateAuraExam();
  }

  // Student never sees the advanced generator/library UI; Admin keeps them unchanged.
  window.studentReviewHub=studentReviewHub;
  window.studentExamPeriod=studentExamPeriod;
  window.studentStartQuick=studentStartQuick;
  window.generator=studentPractice;
  window.library=studentReviewHub;

  // Make subject pages return to the child-friendly exam hub instead of the raw library.
  if(typeof oldSubject==='function')window.subject=function(id){const r=oldSubject(id);setTimeout(()=>{const back=[...document.querySelectorAll('#app button')].find(b=>(b.getAttribute('onclick')||'').includes('library()'));if(back){back.textContent='← Ôn thi';back.setAttribute('onclick','studentReviewHub()')}},0);return r};

  function patchDashboard(){
    if(!document.querySelector('.dash-home'))return;
    const tasks=[...document.querySelectorAll('.dash-task')];
    const q=tasks.find(x=>x.textContent.includes('LUYỆN ĐỀ'));
    if(q){const k=q.querySelector('.dash-task-kicker'),b=q.querySelector('b'),s=q.querySelector('small');if(k)k.textContent='LUYỆN NHANH';if(b)b.textContent='Luyện 10–20 câu';if(s)s.textContent='Chọn môn, chọn số câu rồi bắt đầu ngay.'}
    const weak=tasks.find(x=>x.textContent.includes('ÔN PHẦN YẾU'));if(weak){const k=weak.querySelector('.dash-task-kicker');if(k)k.textContent='XEM LẠI CÂU SAI'}
  }

  labelChrome();patchDashboard();
  const obs=new MutationObserver(()=>{labelChrome();patchDashboard()});obs.observe(document.body,{childList:true,subtree:true});
})();