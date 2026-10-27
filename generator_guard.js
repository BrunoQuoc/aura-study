const AURA_V231='2.3.1';
function auraEnglishSourceReady(){const b=window.AURA_ENGLISH_BANK;return !!(b&&Array.isArray(b.mc)&&b.mc.length>=20&&Array.isArray(b.written)&&b.written.length>=10)}
function auraPatchVersion231(){
  document.querySelectorAll('.brandtext small,.hero .small,.generated-head .small').forEach(el=>{
    el.textContent=el.textContent.replace(/V2\.2\.[34]/g,'V2.3.1').replace(/V2\.3\.0/g,'V2.3.1').replace(/V2\.3(?!\.\d)/g,'V2.3.1')
  });
}
function auraEnglishFilter(items,keywords=''){
  const ks=String(keywords).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(x=>x.length>=3);
  if(!ks.length)return items;
  const f=items.filter(x=>ks.some(k=>`${x.stem||x.prompt||''} ${x.tags||''} ${x.skill||''}`.toLowerCase().includes(k)));
  return f.length?f:items;
}
function auraEnglishMcShuffle(q,rng){
  const correct=q.options['ABCD'.indexOf(q.answer)];
  const options=auraShuffle(q.options.map(String),rng);
  return {...q,options,answer:'ABCD'[options.indexOf(String(correct))],generated:true}
}
const auraGeneratorBase=window.generator;
window.generator=function(){
  auraGeneratorBase();
  auraPatchVersion231();
  const sub=document.querySelector('.sectionhead span');if(sub)sub.textContent='V2.3.1 • tạo đề từ mẫu/đề cương; đã mở Tiếng Anh Units 1–3';
  const note=document.querySelector('.generator-grid')?.parentElement?.querySelector('.note');
  if(note)note.innerHTML='<b>Nguyên tắc:</b> Toán sinh biến thể số và tự tính đáp án. Ngữ văn rút từ ngân hàng nguồn. Tiếng Anh V2.3.1 dùng câu mới cùng dạng Units 1–3 (School • House • Friends • Reading • Rewrite); câu mới được gắn nhãn rõ và không giả là câu gốc.';
  if(auraEnglishSourceReady()&&note)note.insertAdjacentHTML('afterend','<div class="okbox" style="margin-top:10px"><b>Tiếng Anh đã sẵn sàng:</b> chọn từ khóa <code>school</code>, <code>house</code>, <code>friends</code>, <code>reading</code> hoặc <code>rewrite</code> để tạo đề theo trọng tâm.</div>');
};
const auraGenerateBase=window.generateAuraExam;
window.generateAuraExam=function(){
  const sub=document.querySelector('#genSubject')?.value;
  if(sub!=='TIENGANH')return auraGenerateBase();
  if(!auraEnglishSourceReady()){alert('Ngân hàng Tiếng Anh V2.3.1 chưa tải đủ.');return}
  const basis=document.querySelector('#genBasis')?.value||'template',
        count=+(document.querySelector('#genCount')?.value||15),
        level=document.querySelector('#genLevel')?.value||'standard',
        keywords=document.querySelector('#genKeywords')?.value||'',
        seed=`EN-${Date.now()}-${Math.random()}`,rng=auraRng(seed),bank=window.AURA_ENGLISH_BANK;
  let mcPool=auraEnglishFilter(bank.mc,keywords),wrPool=auraEnglishFilter(bank.written,keywords);
  let ratio=level==='basic'?.8:level==='advanced'?.55:.68;
  if(basis==='outline')ratio=Math.max(.45,ratio-.08);
  let targetMc=Math.min(mcPool.length,Math.max(5,Math.round(count*ratio)));
  let targetWr=Math.min(wrPool.length,Math.max(2,count-targetMc));
  while(targetMc+targetWr<count){
    if(targetMc<mcPool.length)targetMc++;else if(targetWr<wrPool.length)targetWr++;else break;
  }
  const mc=auraShuffle(mcPool,rng).slice(0,targetMc).map(q=>auraEnglishMcShuffle(q,rng));
  const written=auraShuffle(wrPool,rng).slice(0,targetWr);
  const exam={id:'random_en_'+Date.now(),subject:'TIENGANH',title:'Tiếng Anh 6 – Đề ngẫu nhiên Units 1–3',basis,count:mc.length+written.length,level,keywords,seed,createdAt:new Date().toISOString(),mc,written,engineVersion:AURA_V231,sourceMode:'generated-from-patterns'};
  localStorage.setItem('aura_generated_exam',JSON.stringify(exam));localStorage.removeItem('aura_generated_draft');renderAuraGeneratedExam(exam);
  auraPatchVersion231();
};
function auraNormEnglish(s){return String(s||'').toLowerCase().replace(/[’‘`]/g,"'").replace(/[.!?]+$/g,'').replace(/\s+/g,' ').trim()}
const auraGradeBase=window.gradeAuraGenerated;
window.gradeAuraGenerated=function(){
  const e=JSON.parse(localStorage.getItem('aura_generated_exam')||'null');
  if(!e||e.subject!=='TIENGANH')return auraGradeBase();
  saveAuraGeneratedDraft();
  const d=JSON.parse(localStorage.getItem('aura_generated_draft')||'{}');
  let ok=0,total=0,wrong=[];
  (e.mc||[]).forEach((q,i)=>{total++;if(d.mc?.[i]===q.answer)ok++;else wrong.push(`Trắc nghiệm ${i+1}`)});
  (e.written||[]).forEach((q,i)=>{if(!q.autoGrade)return;total++;if(auraNormEnglish(d.written?.[i])===auraNormEnglish(q.answer))ok++;else wrong.push(`Rewrite ${i+1}`)});
  const score=total?+(ok/total*10).toFixed(1):0;
  if(typeof attempts==='function'&&typeof saveAttempts==='function'){
    const a=attempts();a.unshift({title:`${e.title} (V2.3.1)`,score,ok,total,time:new Date().toISOString(),note:'Chấm tự động trắc nghiệm + Rewrite theo đáp án chuẩn hóa; bỏ qua dấu câu cuối và khác biệt hoa/thường.'});saveAttempts(a)
  }
  const app=auraApp();app.innerHTML=`<div class="card"><div class="small">KẾT QUẢ TIẾNG ANH V2.3.1</div><h1 class="score ${score>=5?'good':'bad'}">${score}/10</h1><p>Đúng <b>${ok}/${total}</b> mục được chấm tự động.</p><div class="note">Rewrite được so khớp sau khi chuẩn hóa chữ hoa/thường, khoảng trắng, dấu nháy và dấu câu cuối. Các đáp án diễn đạt khác nhưng đúng nghĩa vẫn nên được người học tự đối chiếu.</div><button class="btn primary" onclick="openGeneratedExam()">Xem lại đề</button> <button class="btn soft" onclick="generator()">Tạo đề mới</button></div>${wrong.length?`<div class="card"><b>Cần xem lại:</b><p class="meta">${wrong.join(' • ')}</p></div>`:''}`;
  auraPatchVersion231();
};
const auraRenderBase=window.renderAuraGeneratedExam;
window.renderAuraGeneratedExam=function(e){auraRenderBase(e);auraPatchVersion231();if(e?.subject==='TIENGANH'){const note=document.querySelector('.generated-head .note');if(note)note.textContent=`Mã đề: ${String(e.seed).slice(-12)}. V2.3.1 chấm tự động trắc nghiệm và các câu Rewrite có đáp án xác định.`}}
const auraHomeBase=window.home;window.home=function(){auraHomeBase();auraPatchVersion231();const card=document.querySelector('.v23-generator-card');if(card){const b=card.querySelector('b'),s=card.querySelector('small');if(b)b.textContent='Tạo đề ngẫu nhiên V2.3.1';if(s)s.textContent='Toán • Ngữ văn • Tiếng Anh Units 1–3; tạo theo mẫu đề hoặc đề cương.'}}
function auraInitV231(){auraPatchVersion231();if(typeof window.home==='function')window.home()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',auraInitV231,{once:true});else auraInitV231();
