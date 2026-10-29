/* AURA STUDY — Student view for Admin-approved Drive files */
(function(){
  if(!document.body.classList.contains('student-shell'))return;
  const LIBRARY_KEY='aura_library_index_v1',DECISION_KEY='aura_inbox_decisions_v1';
  const SUBJECT_LABEL={TOAN:'Toán',NGUVAN:'Ngữ văn',TIENGANH:'Tiếng Anh',KHTN:'KHTN',LSDL:'Lịch sử & Địa lý',GDCD:'GDCD',TINHOC:'Tin học',CONGNGHE:'Công nghệ',KHAC:'Khác'};
  const DOC_LABEL={exam:'Đề kiểm tra / đề thi',practice:'Đề ôn / bài tập',lesson:'Bài học / kiến thức',solution:'Bài giải / lời giải',answer_key:'Đáp án',formula:'Công thức / ghi nhớ',reference:'Tài liệu tham khảo'};
  const PERIOD_LABEL={GK1:'Giữa kỳ 1',CK1:'Cuối kỳ 1',GK2:'Giữa kỳ 2',CK2:'Cuối kỳ 2'};
  const parse=(k,f)=>{try{const x=JSON.parse(localStorage.getItem(k)||JSON.stringify(f));return x??f}catch(_){return f}};
  const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  const fmt=n=>{n=Number(n||0);if(!n)return'';const u=['B','KB','MB','GB'],i=Math.min(3,Math.floor(Math.log(n)/Math.log(1024)));return `${(n/Math.pow(1024,i)).toFixed(i?1:0)} ${u[i]}`};
  const driveOpen=id=>id?`https://drive.google.com/open?id=${encodeURIComponent(id)}`:'';
  const drivePreview=id=>id?`https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`:'';

  function normalizeDecision(x){
    const c=x?.adminConfirmation||{};
    const id=x?.driveFileId||'';
    return {
      driveFileId:id,name:x?.name||'Tài liệu',mimeType:x?.mimeType||'',size:Number(x?.size||0),
      webViewLink:x?.webViewLink||driveOpen(id),subject:c.subject||x?.subject||'',docType:c.docType||x?.docType||'',
      period:c.period||x?.period||'',adminNote:c.note||x?.adminNote||'',destinationId:x?.destinationId||'',
      destinationName:x?.destinationName||'',approvedAt:x?.decidedAt||x?.approvedAt||'',publishedAt:x?.decidedAt||new Date().toISOString(),
      status:'ACTIVE',source:'ADMIN_APPROVED_RECOVERED',auraSuggestion:x?.auraSuggestion||null,adminConfirmation:x?.adminConfirmation||null,
      qualityAudit:x?.qualityAudit||null,sha256:x?.sha256||''
    };
  }
  function recover(){
    const rows=parse(LIBRARY_KEY,[]),list=Array.isArray(rows)?rows:[],known=new Set(list.map(x=>x.driveFileId));const ds=parse(DECISION_KEY,[]);
    if(Array.isArray(ds))ds.filter(x=>x?.status==='APPROVED'&&x.driveFileId&&!known.has(x.driveFileId)).forEach(x=>{
      const entry=normalizeDecision(x);if(!entry.subject)return;list.unshift(entry);known.add(entry.driveFileId);
    });
    let changed=false;
    list.forEach(x=>{if(x?.driveFileId&&!x.webViewLink){x.webViewLink=driveOpen(x.driveFileId);changed=true}});
    if(changed||Array.isArray(ds))localStorage.setItem(LIBRARY_KEY,JSON.stringify(list.slice(0,1000)));
    return list;
  }
  const read=()=>recover().filter(r=>r&&r.status==='ACTIVE');
  const lessonDocs=subject=>read().filter(r=>r.docType==='lesson'&&(!subject||r.subject===subject));

  function icon(r){if((r.mimeType||'').startsWith('image/'))return'🖼️';if((r.mimeType||'').includes('pdf'))return'📄';if(r.docType==='exam')return'📝';if(r.docType==='solution'||r.docType==='answer_key')return'✅';if(r.docType==='lesson')return'📘';return'📎'}
  function row(r){const meta=[DOC_LABEL[r.docType]||r.docType||'Tài liệu',PERIOD_LABEL[r.period]||'',fmt(r.size),r.adminNote||''].filter(Boolean).join(' · ');const link=r.webViewLink||driveOpen(r.driveFileId);const open=link?`<a class="btn soft" href="${esc(link)}" target="_blank" rel="noopener">Mở tài liệu</a>`:'<button class="btn soft" disabled>Chưa có liên kết</button>';return `<div class="resource"><div class="fileico">${icon(r)}</div><div class="grow"><b>${esc(r.name)}</b><small>${esc(meta)}</small></div>${open}</div>`}
  function hubSection(){const docs=read();if(!docs.length)return'';const grouped={};docs.forEach(r=>(grouped[r.subject]??=[]).push(r));return `<section class="card aura-approved-library" style="margin-top:16px"><div class="small">TÀI LIỆU ADMIN ĐÃ DUYỆT</div><h2>Thư viện tài liệu mới</h2><p class="meta">Tài liệu được Admin duyệt từ INBOX. File chưa gán kỳ vẫn hiển thị ở đây để không bị mất khỏi AURA.</p>${Object.entries(grouped).map(([sub,rows])=>`<h3 style="margin-top:18px">${esc(SUBJECT_LABEL[sub]||sub)}</h3>${rows.map(row).join('')}`).join('')}</section>`}
  function appendHub(){const app=document.getElementById('app');if(!app||app.querySelector('.aura-approved-library'))return;const html=hubSection();if(html)app.insertAdjacentHTML('beforeend',html)}
  function appendPeriodSubject(period,subject){const app=document.getElementById('app');if(!app)return;const docs=read().filter(r=>r.period===period&&r.subject===subject);if(!docs.length||app.querySelector('.aura-approved-period'))return;app.insertAdjacentHTML('beforeend',`<section class="card aura-approved-period" style="margin-top:16px"><div class="small">TÀI LIỆU ADMIN ĐÃ DUYỆT</div><h3>${esc(SUBJECT_LABEL[subject]||subject)} · ${esc(PERIOD_LABEL[period]||period)}</h3>${docs.map(row).join('')}</section>`)}

  function lessonCard(r){
    const meta=[PERIOD_LABEL[r.period]||'',fmt(r.size),r.adminNote||''].filter(Boolean).join(' · ');
    return `<article class="lesson-card aura-drive-lesson-card"><div class="lesson-thumb aura-drive-lesson-thumb"><div>${icon(r)}</div><small>Tài liệu Drive</small></div><span class="lesson-badge">${esc(SUBJECT_LABEL[r.subject]||r.subject||'Môn học')} 6 · Admin duyệt</span><h3>${esc(r.name)}</h3><div class="meta">${esc(meta||'Bài học / kiến thức')}</div><button class="btn soft" type="button" onclick="auraOpenApprovedLesson('${esc(r.driveFileId)}')">Mở tài liệu</button></article>`;
  }
  function ensureLessonStyle(){
    if(document.getElementById('aura-approved-lesson-style'))return;
    const s=document.createElement('style');s.id='aura-approved-lesson-style';s.textContent=`.aura-approved-lessons{margin-top:24px}.aura-approved-lessons .sectionhead{margin-bottom:12px}.aura-drive-lesson-thumb{display:grid;place-items:center;align-content:center;gap:6px;min-height:150px;background:linear-gradient(180deg,#f7f9ff,#eef3ff)}.aura-drive-lesson-thumb>div{font-size:42px}.aura-drive-lesson-thumb small{color:#7180a0;font-weight:700}.aura-drive-preview{width:100%;height:min(72vh,820px);border:1px solid #dce3f1;border-radius:16px;background:#fff}.aura-approved-count-note{font-size:12px;color:#66749a;margin-top:4px}`;document.head.appendChild(s);
  }
  function annotateLessonOverview(){
    const docs=lessonDocs();if(!docs.length)return;
    const bySubject={};docs.forEach(r=>bySubject[r.subject]=(bySubject[r.subject]||0)+1);
    document.querySelectorAll('#app .subject[onclick*="lessonSubject("]').forEach(card=>{
      const m=(card.getAttribute('onclick')||'').match(/lessonSubject\('([^']+)'\)/);if(!m)return;const n=bySubject[m[1]]||0;if(!n)return;
      const tag=card.querySelector('.tag');if(tag&&!tag.dataset.approvedDocs){tag.dataset.approvedDocs='1';tag.textContent=`${tag.textContent} · ${n} tài liệu mới`;tag.classList.add('ready')}
    });
  }
  function appendLessonSubject(subject){
    const app=document.getElementById('app');if(!app||app.querySelector('.aura-approved-lessons'))return;
    const docs=lessonDocs(subject);if(!docs.length)return;ensureLessonStyle();
    app.insertAdjacentHTML('beforeend',`<section class="aura-approved-lessons"><div class="sectionhead"><div><h2>Tài liệu bài học Admin đã duyệt</h2><span>${docs.length} tài liệu mới · nguồn Drive</span></div></div><div class="lesson-grid">${docs.map(lessonCard).join('')}</div></section>`);
  }
  window.auraOpenApprovedLesson=function(fileId){
    const r=read().find(x=>x.driveFileId===fileId);if(!r)return;
    if(typeof window.setActive==='function')window.setActive('lessons');ensureLessonStyle();
    const app=document.getElementById('app');if(!app)return;
    const subject=r.subject||'KHAC',label=SUBJECT_LABEL[subject]||subject||'Môn học',link=r.webViewLink||driveOpen(fileId),preview=drivePreview(fileId);
    const meta=[DOC_LABEL[r.docType]||'Bài học / kiến thức',PERIOD_LABEL[r.period]||'',fmt(r.size),r.adminNote||''].filter(Boolean).join(' · ');
    app.innerHTML=`<button class="btn soft" type="button" onclick="lessonSubject('${esc(subject)}')" style="margin-bottom:12px">← ${esc(label)} 6</button><section class="card"><div class="small">TÀI LIỆU ADMIN ĐÃ DUYỆT</div><h2>${esc(r.name)}</h2><p class="meta">${esc(meta)}</p>${link?`<a class="btn soft" href="${esc(link)}" target="_blank" rel="noopener">Mở file gốc trên Google Drive</a>`:''}</section>${preview?`<iframe class="aura-drive-preview" src="${esc(preview)}" title="${esc(r.name)}" loading="lazy" allow="autoplay"></iframe>`:''}`;
    document.body.dataset.auraPage='lessons';
  };

  function install(){
    if(window.__auraApprovedLibraryInstalled){recover();return}
    const baseHub=window.studentReviewHub||window.library;if(typeof baseHub!=='function'){setTimeout(install,100);return}
    window.__auraApprovedLibraryInstalled=true;
    const wrappedHub=function(){const out=baseHub.apply(this,arguments);appendHub();return out};window.studentReviewHub=wrappedHub;window.library=wrappedHub;
    const baseSubjectExam=window.studentExamSubject;if(typeof baseSubjectExam==='function')window.studentExamSubject=function(period,subject){const out=baseSubjectExam.apply(this,arguments);appendPeriodSubject(period,subject);return out};
    const baseLessons=window.lessons;if(typeof baseLessons==='function')window.lessons=function(){const out=baseLessons.apply(this,arguments);annotateLessonOverview();return out};
    const baseLessonSubject=window.lessonSubject;if(typeof baseLessonSubject==='function')window.lessonSubject=function(subject){const out=baseLessonSubject.apply(this,arguments);appendLessonSubject(subject);return out};
    window.AURA_APPROVED_LIBRARY={read,recover,lessonDocs};recover();
  }
  if(document.readyState==='complete')setTimeout(install,0);else window.addEventListener('load',()=>setTimeout(install,0),{once:true});
})();