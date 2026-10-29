/* AURA STUDY — Admin INBOX classifier integration */
(function(){
  if(!document.body.classList.contains('admin-shell'))return;
  const QUEUE_KEY='aura_inbox_queue_v1',PRED_KEY='aura_inbox_predictions_v1';
  const state={files:[],analysis:null,current:-1};
  const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(_){return f}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const queue=()=>{const q=read(QUEUE_KEY,[]);return Array.isArray(q)?q:[]};
  const preds=()=>{const p=read(PRED_KEY,{});return p&&typeof p==='object'?p:{}};
  const fp=f=>`${f.name}::${f.size}::${f.lastModified||0}`;
  const SUBJECT={TOAN:'Toán',NGUVAN:'Ngữ văn',TIENGANH:'Tiếng Anh',KHTN:'KHTN',LSDL:'Lịch sử & Địa lý',GDCD:'GDCD',TINHOC:'Tin học',CONGNGHE:'Công nghệ',KHAC:'Khác'};
  const TYPE={exam:'Đề kiểm tra / đề thi',practice:'Đề ôn / bài tập',lesson:'Bài học / kiến thức',solution:'Bài giải / lời giải',answer_key:'Đáp án',formula:'Công thức / ghi nhớ',reference:'Tài liệu tham khảo'};
  const PERIOD={GK1:'Giữa kỳ 1',CK1:'Cuối kỳ 1',GK2:'Giữa kỳ 2',CK2:'Cuối kỳ 2'};
  function label(map,id){return map[id]||'Chưa xác định'}
  function savePred(key,p){const all=preds();all[key]=p;write(PRED_KEY,all)}
  function patchQueue(files,results){
    const rows=queue(),used=new Set();
    files.forEach((f,i)=>{const p=results[i];if(!p)return;const idx=rows.findIndex((r,j)=>!used.has(j)&&r.status!=='APPROVED'&&r.name===f.name&&Number(r.size||0)===Number(f.size||0));if(idx<0)return;used.add(idx);rows[idx]={...rows[idx],suggestedSubject:p.subject,suggestedDocType:p.docType,suggestedPeriod:p.period,classificationConfidence:p.confidence,classificationReasons:p.reasons,classificationSource:p.analysisSource,classificationTextSample:p.textSample,classifierVersion:p.classifierVersion,classifiedAt:p.classifiedAt,subject:rows[idx].subject||p.subject,docType:rows[idx].docType||p.docType,period:rows[idx].period||p.period}});
    write(QUEUE_KEY,rows);
  }
  function seedFilenameSuggestions(){
    const c=window.AURA_INBOX_CLASSIFIER;if(!c)return;const rows=queue();let changed=false;
    rows.forEach(r=>{if(r.status==='APPROVED'||r.classifierVersion)return;const p=c.classifyName(r.name);r.suggestedSubject=p.subject;r.suggestedDocType=p.docType;r.suggestedPeriod=p.period;r.classificationConfidence=p.confidence;r.classificationReasons=p.reasons;r.classificationSource=p.analysisSource;r.classifierVersion=p.classifierVersion;r.classifiedAt=p.classifiedAt;r.subject=r.subject||p.subject;r.docType=r.docType||p.docType;r.period=r.period||p.period;changed=true});
    if(changed)write(QUEUE_KEY,rows);
  }
  async function analyze(files){
    const c=window.AURA_INBOX_CLASSIFIER;if(!c)return[];const out=[];
    for(let i=0;i<files.length;i++){state.current=i;decorateSelected();let p=preds()[fp(files[i])];if(!p||p.classifierVersion!==c.version){p=await c.analyzeFile(files[i]);savePred(fp(files[i]),p)}out.push(p);decorateSelected()}
    state.current=-1;decorateSelected();return out;
  }
  function confidenceText(c){return c==='high'?'Tin cậy cao':c==='medium'?'Tin cậy vừa':'Cần Admin kiểm tra'}
  function suggestion(item){
    const reasons=Array.isArray(item.classificationReasons)?item.classificationReasons:[];
    return `<div><span>AURA ĐỀ XUẤT · ${esc(confidenceText(item.classificationConfidence))}</span><b>${esc(label(SUBJECT,item.suggestedSubject))} · ${esc(label(TYPE,item.suggestedDocType))}${item.suggestedPeriod?` · ${esc(label(PERIOD,item.suggestedPeriod))}`:''}</b><small>${esc(item.classificationSource||'Tên file')}${reasons.length?` · ${esc(reasons.join(' · '))}`:''}</small></div>`;
  }
  function decorateCards(){
    const rows=queue();document.querySelectorAll('.inbox-review-item[data-drive-id]').forEach(card=>{const item=rows.find(x=>x.driveFileId===card.dataset.driveId);if(!item)return;const sig=[item.classifierVersion,item.classificationConfidence,item.suggestedSubject,item.suggestedDocType,item.suggestedPeriod,(item.classificationReasons||[]).join('|')].join('::');let box=card.querySelector('.aura-classifier');if(box?.dataset.sig===sig)return;if(!box){box=document.createElement('div');const head=card.querySelector('.inbox-file-head');if(!head)return;head.insertAdjacentElement('afterend',box)}box.className=`aura-classifier ${item.classificationConfidence||'low'}`;box.dataset.sig=sig;box.innerHTML=suggestion(item)})
  }
  function decorateSelected(){
    const local=document.querySelector('.inbox-local-list');if(!local)return;const all=preds(),rows=state.files.map((f,i)=>{const p=all[fp(f)],busy=state.current===i;return `<div><b>${esc(f.name)}</b><span>${busy?'AURA đang đọc nội dung…':p?`${esc(label(SUBJECT,p.subject))} · ${esc(label(TYPE,p.docType))}${p.period?` · ${esc(label(PERIOD,p.period))}`:''} · ${esc(confidenceText(p.confidence))}`:'Đang chờ phân tích'}</span></div>`}).join('');const sig=`${state.current}::${rows}`;let panel=document.querySelector('.aura-selected-analysis');if(!state.files.length){panel?.remove();return}if(panel?.dataset.sig===sig)return;if(!panel){panel=document.createElement('div');panel.className='aura-selected-analysis';local.insertAdjacentElement('afterend',panel)}panel.dataset.sig=sig;panel.innerHTML=`<span>AURA PHÂN LOẠI TRƯỚC</span>${rows}`;
  }
  function decorate(){decorateCards();decorateSelected()}
  seedFilenameSuggestions();
  const choose=window.auraInboxFilesChosen;if(choose)window.auraInboxFilesChosen=function(fileList){const files=Array.from(fileList||[]);state.files=files;choose(fileList);state.analysis=analyze(files).catch(()=>[])};
  const upload=window.auraUploadInboxFiles;if(upload)window.auraUploadInboxFiles=async function(){const files=[...state.files],results=state.analysis?await state.analysis:await analyze(files);const out=await upload();patchQueue(files,results);if(typeof window.auraAdminInbox==='function')window.auraAdminInbox();state.files=[];state.analysis=null;setTimeout(decorate,0);return out};
  const keep=window.auraKeepInboxFile;if(keep)window.auraKeepInboxFile=function(fileId){const rows=queue(),i=rows.findIndex(x=>x.driveFileId===fileId),card=document.querySelector(`.inbox-review-item[data-drive-id="${CSS.escape(fileId)}"]`);if(i>=0&&card){rows[i].adminReviewedAt=new Date().toISOString();rows[i].adminChangedSuggestion=(rows[i].suggestedSubject&&card.querySelector('.inbox-subject')?.value!==rows[i].suggestedSubject)||(rows[i].suggestedDocType&&card.querySelector('.inbox-doctype')?.value!==rows[i].suggestedDocType)||(rows[i].suggestedPeriod&&card.querySelector('.inbox-period')?.value!==rows[i].suggestedPeriod);write(QUEUE_KEY,rows)}const out=keep(fileId);setTimeout(decorate,0);return out};
  const approve=window.auraApproveInboxFile;if(approve)window.auraApproveInboxFile=async function(fileId){const rows=queue(),i=rows.findIndex(x=>x.driveFileId===fileId),card=document.querySelector(`.inbox-review-item[data-drive-id="${CSS.escape(fileId)}"]`);if(i>=0&&card){rows[i].adminReviewedAt=new Date().toISOString();rows[i].adminChangedSuggestion=(rows[i].suggestedSubject&&card.querySelector('.inbox-subject')?.value!==rows[i].suggestedSubject)||(rows[i].suggestedDocType&&card.querySelector('.inbox-doctype')?.value!==rows[i].suggestedDocType)||(rows[i].suggestedPeriod&&card.querySelector('.inbox-period')?.value!==rows[i].suggestedPeriod);write(QUEUE_KEY,rows)}return approve(fileId)};
  const observer=new MutationObserver(decorate);observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});setTimeout(decorate,0);
})();
