/* AURA STUDY — Student view for Admin-approved Drive files */
(function(){
  if(!document.body.classList.contains('student-shell'))return;
  const LIBRARY_KEY='aura_library_index_v1';
  const SUBJECT_LABEL={TOAN:'Toán',NGUVAN:'Ngữ văn',TIENGANH:'Tiếng Anh',KHTN:'KHTN',LSDL:'Lịch sử & Địa lý',GDCD:'GDCD',TINHOC:'Tin học',CONGNGHE:'Công nghệ',KHAC:'Khác'};
  const DOC_LABEL={exam:'Đề kiểm tra / đề thi',practice:'Đề ôn / bài tập',lesson:'Bài học / kiến thức',solution:'Bài giải / lời giải',answer_key:'Đáp án',formula:'Công thức / ghi nhớ',reference:'Tài liệu tham khảo'};
  const PERIOD_LABEL={GK1:'Giữa kỳ 1',CK1:'Cuối kỳ 1',GK2:'Giữa kỳ 2',CK2:'Cuối kỳ 2'};
  const read=()=>{try{const x=JSON.parse(localStorage.getItem(LIBRARY_KEY)||'[]');return Array.isArray(x)?x.filter(r=>r&&r.status==='ACTIVE'):[]}catch(_){return[]}};
  const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  const fmt=n=>{n=Number(n||0);if(!n)return'';const u=['B','KB','MB','GB'],i=Math.min(3,Math.floor(Math.log(n)/Math.log(1024)));return `${(n/Math.pow(1024,i)).toFixed(i?1:0)} ${u[i]}`};
  function icon(r){if((r.mimeType||'').startsWith('image/'))return'🖼️';if((r.mimeType||'').includes('pdf'))return'📄';if(r.docType==='exam')return'📝';if(r.docType==='solution'||r.docType==='answer_key')return'✅';if(r.docType==='lesson')return'📘';return'📎'}
  function row(r){const meta=[DOC_LABEL[r.docType]||r.docType||'Tài liệu',PERIOD_LABEL[r.period]||'',fmt(r.size),r.adminNote||''].filter(Boolean).join(' · ');const open=r.webViewLink?`<a class="btn soft" href="${esc(r.webViewLink)}" target="_blank" rel="noopener">Mở tài liệu</a>`:'<button class="btn soft" disabled>Chưa có liên kết</button>';return `<div class="resource"><div class="fileico">${icon(r)}</div><div class="grow"><b>${esc(r.name)}</b><small>${esc(meta)}</small></div>${open}</div>`}
  function hubSection(){const docs=read();if(!docs.length)return'';const grouped={};docs.forEach(r=>(grouped[r.subject]??=[]).push(r));return `<section class="card aura-approved-library" style="margin-top:16px"><div class="small">TÀI LIỆU ADMIN ĐÃ DUYỆT</div><h2>Thư viện tài liệu mới</h2><p class="meta">Tài liệu được Admin duyệt từ INBOX. File chưa gán kỳ vẫn hiển thị ở đây để không bị mất khỏi AURA.</p>${Object.entries(grouped).map(([sub,rows])=>`<h3 style="margin-top:18px">${esc(SUBJECT_LABEL[sub]||sub)}</h3>${rows.map(row).join('')}`).join('')}</section>`}
  function appendHub(){const app=document.getElementById('app');if(!app||app.querySelector('.aura-approved-library'))return;const html=hubSection();if(html)app.insertAdjacentHTML('beforeend',html)}
  function appendPeriodSubject(period,subject){const app=document.getElementById('app');if(!app)return;const docs=read().filter(r=>r.period===period&&r.subject===subject);if(!docs.length||app.querySelector('.aura-approved-period'))return;app.insertAdjacentHTML('beforeend',`<section class="card aura-approved-period" style="margin-top:16px"><div class="small">TÀI LIỆU ADMIN ĐÃ DUYỆT</div><h3>${esc(SUBJECT_LABEL[subject]||subject)} · ${esc(PERIOD_LABEL[period]||period)}</h3>${docs.map(row).join('')}</section>`)}
  function install(){
    if(window.__auraApprovedLibraryInstalled)return;
    const baseHub=window.studentReviewHub||window.library;if(typeof baseHub!=='function'){setTimeout(install,100);return}
    window.__auraApprovedLibraryInstalled=true;
    const wrapped=function(){const out=baseHub.apply(this,arguments);appendHub();return out};window.studentReviewHub=wrapped;window.library=wrapped;
    const baseSubject=window.studentExamSubject;if(typeof baseSubject==='function')window.studentExamSubject=function(period,subject){const out=baseSubject.apply(this,arguments);appendPeriodSubject(period,subject);return out};
    window.AURA_APPROVED_LIBRARY={read};
  }
  if(document.readyState==='complete')setTimeout(install,0);else window.addEventListener('load',()=>setTimeout(install,0),{once:true});
})();