/* AURA STUDY — Daily learning dashboard. Uses existing local data only. */
(function(){
  const safe=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}};
  const attempts=()=>read('aura_attempts',[]);
  const subjects=()=>window.AURA_SUBJECTS||[];
  const maps=()=>window.AURA_LESSON_MAPS||[];
  const subjectInfo=id=>subjects().find(x=>x[0]===id)||[id,id,'•',''];

  function rememberSubject(id){if(id)localStorage.setItem('aura_last_subject',id)}

  const baseSubject=window.subject;
  if(typeof baseSubject==='function'&&!baseSubject.__auraRemember){
    const wrapped=function(id,...rest){rememberSubject(id);return baseSubject.call(this,id,...rest)};
    wrapped.__auraRemember=true;window.subject=wrapped;
  }
  const baseLessonSubject=window.lessonSubject;
  if(typeof baseLessonSubject==='function'&&!baseLessonSubject.__auraRemember){
    const wrapped=function(id,...rest){rememberSubject(id);return baseLessonSubject.call(this,id,...rest)};
    wrapped.__auraRemember=true;window.lessonSubject=wrapped;
  }

  function lessonStats(){
    const all=maps(),state=read('aura_lesson_state',{});let total=0,done=0;
    all.forEach(m=>{(m.nodes||[]).forEach(n=>{total++;if(state[m.id]?.done?.[n.id])done++})});
    return {total,done,pct:total?Math.round(done/total*100):0};
  }

  function hasContent(id){
    if(maps().some(m=>m.subject===id))return true;
    if(id==='TOAN')return (window.AURA_MATH_EXAMS||[]).some(x=>x.ready)||(((window.AURA_REVIEWS||{}).TOAN||[]).length>0);
    if(id==='NGUVAN')return (((window.AURA_REVIEWS||{}).NGUVAN||[]).length>0)||(window.AURA_NGUVAN_BANK!=null);
    if(id==='TIENGANH'){const b=window.AURA_ENGLISH_BANK||{};return ((b.mc||[]).length+(b.written||[]).length)>0||(((window.AURA_REVIEWS||{}).TIENGANH||[]).length>0)}
    return false;
  }

  function lastSubject(){
    const id=localStorage.getItem('aura_last_subject');
    return subjects().some(s=>s[0]===id)?id:'';
  }

  function avgScore(a){return a.length?+(a.reduce((s,x)=>s+Number(x.score||0),0)/a.length).toFixed(1):null}
  function recent7(a){const cut=Date.now()-7*86400000;return a.filter(x=>{const t=Date.parse(x.time||'');return Number.isFinite(t)&&t>=cut}).length}
  function dateText(v){const d=new Date(v);return Number.isFinite(d.getTime())?d.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'}):''}

  function openSubject(id){rememberSubject(id);if(typeof window.subject==='function')window.subject(id)}
  function openLessonSubject(id){rememberSubject(id);if(typeof window.lessonSubject==='function')window.lessonSubject(id);else if(typeof window.lessons==='function')window.lessons()}
  function continueStudy(){
    const id=lastSubject();
    if(!id){if(typeof window.lessons==='function')window.lessons();return}
    if(maps().some(m=>m.subject===id))openLessonSubject(id);else openSubject(id);
  }

  window.auraDashboardSubject=openSubject;
  window.auraDashboardContinue=continueStudy;
  window.auraDashboardLessons=function(){if(typeof window.lessons==='function')window.lessons()};
  window.auraDashboardGenerator=function(){if(typeof window.generator==='function')window.generator()};
  window.auraDashboardHistory=function(){if(typeof window.history==='function')window.history()};

  function dashboardHome(){
    if(typeof window.setActive==='function')window.setActive('home');
    const app=document.querySelector('#app');if(!app)return;
    const a=attempts(),avg=avgScore(a),week=recent7(a),ls=lessonStats(),last=lastSubject(),lastMeta=last?subjectInfo(last):null;
    const lowest=a.length?[...a].filter(x=>Number.isFinite(Number(x.score))).sort((x,y)=>Number(x.score)-Number(y.score))[0]:null;
    const contLabel=lastMeta?`Tiếp tục ${safe(lastMeta[1])}`:'Chọn môn để bắt đầu';
    const contHint=lastMeta?`Mở lại ${safe(lastMeta[1])} từ lần học gần nhất.`:'Chọn một môn rồi AURA sẽ ghi nhớ để lần sau mở nhanh.';
    const subjectCards=subjects().map(s=>{
      const id=s[0],ready=hasContent(id);
      return `<button class="dash-subject" data-subject="${safe(id)}" onclick="auraDashboardSubject('${safe(id)}')"><span class="dash-subject-icon">${safe(s[2])}</span><span class="dash-subject-copy"><b>${safe(s[1])}</b><small>${ready?'Đã có nội dung':'Đang cập nhật'}</small></span><span class="dash-chevron">›</span></button>`
    }).join('');
    const activity=a.slice(0,3).map(x=>`<div class="dash-activity-row"><div><b>${safe(x.title||'Bài luyện')}</b><small>${safe(dateText(x.time))}${x.note?' · '+safe(x.note):''}</small></div><strong>${Number.isFinite(Number(x.score))?safe(x.score)+'/10':'—'}</strong></div>`).join('');
    const weakText=lowest?`${safe(lowest.title||'Bài gần đây')} · ${safe(lowest.score)}/10`:'Chưa có dữ liệu để xác định phần yếu.';

    app.innerHTML=`<div class="dash-home">
      <section class="dash-hero">
        <div class="dash-hero-main">
          <div class="dash-eyebrow">AURA STUDY · HÔM NAY</div>
          <h1>Hôm nay mình học gì?</h1>
          <p>${contHint}</p>
          <div class="dash-actions"><button class="btn white" onclick="auraDashboardContinue()">${contLabel}</button><button class="btn dash-ghost" onclick="auraDashboardLessons()">Xem tất cả bài học</button></div>
        </div>
        <div class="dash-progress-card">
          <div class="dash-progress-head"><span>Tiến độ bài học</span><b>${ls.pct}%</b></div>
          <div class="dash-progress-track"><i style="width:${ls.pct}%"></i></div>
          <small>${ls.total?`${ls.done}/${ls.total} phần kiến thức đã đánh dấu hiểu`:'Chưa có tiến độ được ghi nhận'}</small>
        </div>
      </section>

      <section class="dash-stats" aria-label="Tóm tắt học tập">
        <article><span>Điểm trung bình</span><strong>${avg===null?'—':avg+'/10'}</strong><small>${a.length?a.length+' lượt đã chấm':'Chưa có lượt chấm'}</small></article>
        <article><span>Bài đã làm</span><strong>${a.length}</strong><small>Tổng lượt có kết quả lưu</small></article>
        <article><span>7 ngày gần đây</span><strong>${week}</strong><small>Lượt luyện tập có chấm điểm</small></article>
      </section>

      <div class="dash-section-head"><div><h2>Học hôm nay</h2><span>Ba việc ngắn để bắt đầu nhanh</span></div></div>
      <section class="dash-today">
        <button class="dash-task primary-task" onclick="auraDashboardContinue()"><span class="dash-task-kicker">TIẾP TỤC</span><b>${lastMeta?safe(lastMeta[1]):'Chọn môn học'}</b><small>${lastMeta?'Quay lại môn gần nhất':'Bắt đầu từ môn em muốn học'}</small><span class="dash-task-arrow">→</span></button>
        <button class="dash-task" onclick="auraDashboardHistory()"><span class="dash-task-kicker">ÔN PHẦN YẾU</span><b>${lowest?'Xem lại kết quả':'Theo dõi phần yếu'}</b><small>${weakText}</small><span class="dash-task-arrow">→</span></button>
        <button class="dash-task" onclick="auraDashboardGenerator()"><span class="dash-task-kicker">LUYỆN ĐỀ</span><b>Tạo đề thông minh</b><small>Cân mức độ, giảm lặp và ưu tiên phần cần củng cố.</small><span class="dash-task-arrow">→</span></button>
      </section>

      <div class="dash-section-head"><div><h2>Môn học</h2><span>Chạm vào môn để mở kho nội dung</span></div><button class="dash-link" onclick="auraDashboardLessons()">Bài học →</button></div>
      <section class="dash-subjects">${subjectCards}</section>

      <div class="dash-section-head"><div><h2>Hoạt động gần đây</h2><span>Kết quả được lưu trên thiết bị này</span></div>${a.length?'<button class="dash-link" onclick="auraDashboardHistory()">Xem tất cả →</button>':''}</div>
      <section class="dash-activity">${activity||'<div class="dash-empty"><b>Chưa có hoạt động chấm điểm.</b><span>Làm một đề hoặc bài luyện để AURA bắt đầu ghi nhận tiến độ.</span></div>'}</section>
    </div>`;
    document.body.dataset.auraPage='home';
    if(typeof window.auraQueuePolish==='function')window.auraQueuePolish();
  }

  window.home=dashboardHome;
  if(document.querySelector('.side .navbtn.active')?.dataset.page==='home')dashboardHome();
})();
