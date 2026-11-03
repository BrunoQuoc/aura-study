/* AURA STUDY — show every Admin-approved resource on the matching Student subject page.
   Standardized lesson cards remain separate; this patch only fills the supplemental approved-resource area. */
(function(){
  if(!document.body.classList.contains('student-shell'))return;
  const DOC_LABEL={exam:'Đề kiểm tra / đề thi',practice:'Đề ôn / bài tập',lesson:'Bài học / kiến thức',solution:'Bài giải / lời giải',answer_key:'Đáp án',formula:'Công thức / ghi nhớ',reference:'Tài liệu tham khảo'};
  const PERIOD_LABEL={GK1:'Giữa kỳ 1',CK1:'Cuối kỳ 1',GK2:'Giữa kỳ 2',CK2:'Cuối kỳ 2'};
  const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  const fmt=n=>{n=Number(n||0);if(!n)return'';const u=['B','KB','MB','GB'],i=Math.min(3,Math.floor(Math.log(n)/Math.log(1024)));return `${(n/Math.pow(1024,i)).toFixed(i?1:0)} ${u[i]}`};
  const drive=id=>id?`https://drive.google.com/open?id=${encodeURIComponent(id)}`:'';
  function icon(r){if((r.mimeType||'').startsWith('image/'))return'🖼️';if((r.mimeType||'').includes('pdf'))return'📄';if(r.docType==='exam')return'📝';if(r.docType==='practice')return'✍️';if(r.docType==='solution'||r.docType==='answer_key')return'✅';if(r.docType==='lesson')return'📘';return'📎'}
  function row(r){
    const meta=[DOC_LABEL[r.docType]||r.docType||'Tài liệu',PERIOD_LABEL[r.period]||'',fmt(r.size),r.adminNote||''].filter(Boolean).join(' · ');
    const link=r.webViewLink||drive(r.driveFileId);
    return `<article class="aura-study-resource"><div class="aura-study-resource-icon">${icon(r)}</div><div class="aura-study-resource-main"><div class="aura-resource-chips"><span>Admin duyệt</span><span>${esc(DOC_LABEL[r.docType]||r.docType||'Tài liệu')}</span>${r.period?`<span>${esc(PERIOD_LABEL[r.period]||r.period)}</span>`:''}</div><h3>${esc(r.name||'Tài liệu')}</h3><p>${esc(meta||'Tài liệu nguồn để đọc và ôn thêm')}</p></div><div class="aura-study-resource-actions">${typeof window.auraOpenApprovedLesson==='function'?`<button class="btn primary" type="button" onclick="auraOpenApprovedLesson('${esc(r.driveFileId)}')">Xem tài liệu</button>`:''}${link?`<a class="btn soft" href="${esc(link)}" target="_blank" rel="noopener">Mở Drive</a>`:''}</div></article>`;
  }
  function ensureStyle(){
    if(document.getElementById('aura-approved-subject-all-style'))return;
    const s=document.createElement('style');s.id='aura-approved-subject-all-style';s.textContent=`
      .aura-approved-subject-all{margin-top:26px;padding-top:20px;border-top:1px solid rgba(17,27,58,.10)}
      .aura-approved-subject-all h2{margin:4px 0 6px}.aura-approved-subject-all p{margin:0 0 14px;color:#6b7694;line-height:1.5}
      .aura-approved-subject-all .aura-resource-list{display:grid;gap:10px}
      .aura-approved-subject-all .aura-study-resource{display:grid;grid-template-columns:52px minmax(0,1fr) auto;align-items:center;gap:14px;background:#f6f8fc;border:1px solid rgba(17,27,58,.10);border-radius:17px;padding:13px 14px;box-shadow:0 6px 18px rgba(17,27,58,.04)}
      .aura-approved-subject-all .aura-study-resource-icon{width:52px;height:52px;border-radius:14px;background:#eef3fb;display:grid;place-items:center;font-size:24px;border:1px solid #dfe6f2}
      .aura-approved-subject-all .aura-study-resource-main{min-width:0}.aura-approved-subject-all .aura-study-resource-main h3{margin:5px 0 3px;font-size:16px;line-height:1.35}.aura-approved-subject-all .aura-study-resource-main p{margin:0;color:#72809b;font-size:12px}
      .aura-approved-subject-all .aura-resource-chips{display:flex;gap:6px;flex-wrap:wrap}.aura-approved-subject-all .aura-resource-chips span{display:inline-flex;border-radius:999px;padding:4px 8px;background:#eef4ff;color:#355b9a;font-size:10px;font-weight:800}.aura-approved-subject-all .aura-resource-chips span:first-child{background:#edf8f1;color:#32734a}
      .aura-approved-subject-all .aura-study-resource-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
      @media(max-width:720px){.aura-approved-subject-all .aura-study-resource{grid-template-columns:44px minmax(0,1fr)}.aura-approved-subject-all .aura-study-resource-icon{width:44px;height:44px}.aura-approved-subject-all .aura-study-resource-actions{grid-column:1/-1;justify-content:flex-start;padding-left:58px}}
    `;document.head.appendChild(s);
  }
  function renderSubject(subject){
    const api=window.AURA_APPROVED_LIBRARY;if(!api?.read)return;
    try{api.recover?.()}catch(_){ }
    const all=(api.read()||[]).filter(r=>r&&r.status==='ACTIVE'&&r.subject===subject);
    const app=document.getElementById('app');if(!app||!all.length)return;
    const existingLesson=!!app.querySelector('.aura-approved-lessons');
    const docs=existingLesson?all.filter(r=>r.docType!=='lesson'):all;
    const head=app.querySelector('.sectionhead span');
    if(head){const base=(head.textContent||'').replace(/\s*·\s*\d+\s+tài liệu bổ sung.*$/i,'');head.textContent=`${base} · ${all.length} tài liệu bổ sung`}
    if(!docs.length||app.querySelector('.aura-approved-subject-all'))return;
    ensureStyle();
    app.insertAdjacentHTML('beforeend',`<section class="aura-approved-subject-all"><div class="small">NGUỒN HỌC & ÔN BỔ SUNG</div><h2>Tài liệu Admin đã duyệt</h2><p>Tài liệu nguồn của môn này đã được Admin duyệt. Đề thi, bài tập và tài liệu tham khảo không bị tính nhầm thành “bài học chuẩn hóa”.</p><div class="aura-resource-list">${docs.map(row).join('')}</div></section>`);
  }
  function install(){
    if(window.__auraApprovedSubjectPatchInstalled)return;
    if(!window.AURA_APPROVED_LIBRARY||typeof window.lessonSubject!=='function'){setTimeout(install,100);return}
    window.__auraApprovedSubjectPatchInstalled=true;
    const base=window.lessonSubject;
    window.lessonSubject=function(subject){const out=base.apply(this,arguments);setTimeout(()=>renderSubject(subject),0);return out};
    const current=document.body.dataset.auraPage;if(current==='lessons')setTimeout(()=>{},0);
  }
  if(document.readyState==='complete')install();else window.addEventListener('load',install,{once:true});
})();