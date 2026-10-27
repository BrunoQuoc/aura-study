const AURA_V24='2.4.0';

function auraSmartKey(q,type='mc'){
  if(q?.id)return q.id;
  const raw=`${type}|${q?.stem||q?.prompt||''}|${q?.answer||''}`;
  return `q_${auraSeedHash(raw).toString(36)}`;
}
function auraSmartLevel(q,subject=''){
  if(q?.level)return q.level;
  const txt=`${q?.skill||''} ${q?.tags||''} ${q?.source||''} ${q?.stem||q?.prompt||''}`.toLowerCase();
  if(subject==='TIENGANH'){
    if(/rewrite|suggestion|inference|best describes|best suggestion/.test(txt))return 'apply';
    if(/reading|choose the correct sentence|which/.test(txt))return 'understand';
    return 'recognize';
  }
  if(subject==='NGUVAN'){
    if(/viết|đặt câu|vận dụng|sưu tầm/.test(txt))return 'apply';
    if(/vì sao|tác dụng|ý nghĩa|phân tích|giải thích|thể hiện/.test(txt))return 'understand';
    return 'recognize';
  }
  if(subject==='TOAN'){
    if(/thực tế|tìm x|hình chữ nhật|diện tích|chu vi|tiền|nhiều bước/.test(txt))return 'apply';
    if(/biểu thức|chia có dư|lũy thừa|thứ tự/.test(txt))return 'understand';
    return 'recognize';
  }
  return 'understand';
}
function auraSmartSkill(q,subject=''){
  if(q?.skill)return q.skill;
  const txt=`${q?.tags||''} ${q?.source||''} ${q?.stem||q?.prompt||''}`.toLowerCase();
  if(subject==='TIENGANH'){
    if(/rewrite|suggestion/.test(txt))return 'rewrite';
    if(/reading/.test(txt))return 'reading';
    if(/house|bedroom|unit2/.test(txt))return 'house';
    if(/friend|appearance|unit3/.test(txt))return 'friends';
    return 'school';
  }
  if(subject==='NGUVAN'){
    if(/đọc hiểu|rừng|ước mơ|mù cang|hòa bình|biển/.test(txt))return 'đọc hiểu';
    if(/ẩn dụ|so sánh|nhân hóa|điệp/.test(txt))return 'biện pháp tu từ';
    if(/cụm danh từ|cụm động từ|cụm tính từ/.test(txt))return 'cụm từ';
    if(/từ đơn|từ phức|nghĩa của từ/.test(txt))return 'từ và nghĩa';
    return 'tiếng Việt';
  }
  if(subject==='TOAN'){
    if(/tập hợp|phần tử/.test(txt))return 'tập hợp';
    if(/lũy thừa/.test(txt))return 'lũy thừa';
    if(/chia có dư|phép chia/.test(txt))return 'phép chia';
    if(/tìm x/.test(txt))return 'tìm x';
    if(/hình|diện tích|chu vi/.test(txt))return 'hình học';
    if(/thực tế|tiền|sách|mua/.test(txt))return 'bài toán thực tế';
    return 'số và phép tính';
  }
  return 'khác';
}
function auraSmartStats(){
  try{return JSON.parse(localStorage.getItem('aura_smart_stats')||'{}')}catch{return{}}
}
function auraSaveSmartStats(s){localStorage.setItem('aura_smart_stats',JSON.stringify(s))}
function auraRecentKeys(){
  try{return JSON.parse(localStorage.getItem('aura_recent_questions')||'[]')}catch{return[]}
}
function auraPushRecent(keys){
  const arr=[...keys,...auraRecentKeys().filter(x=>!keys.includes(x))].slice(0,160);
  localStorage.setItem('aura_recent_questions',JSON.stringify(arr));
}
function auraSkillWeakness(subject,skill){
  const s=auraSmartStats()?.[subject]?.[skill];
  if(!s||!s.seen)return 0;
  return (s.wrong||0)/Math.max(1,s.seen);
}
function auraSmartDistribution(count,strategy='balanced'){
  const presets={balanced:[.4,.4,.2],weak:[.3,.4,.3],exam:[.35,.4,.25],easy:[.6,.3,.1]};
  const p=presets[strategy]||presets.balanced;
  let r=Math.round(count*p[0]),u=Math.round(count*p[1]),a=count-r-u;
  if(a<0){u+=a;a=0}
  return{recognize:r,understand:u,apply:a};
}
function auraWeightedPick(items,n,rng,subject,recentSet){
  const pool=[...items],out=[];
  while(pool.length&&out.length<n){
    let total=0,weights=pool.map(q=>{
      const key=auraSmartKey(q,q._type||'mc'),skill=auraSmartSkill(q,subject),weak=auraSkillWeakness(subject,skill);
      let w=1+weak*3.2;
      if(recentSet.has(key))w*=.12;
      if(q._new)w*=1.08;
      total+=w;return w;
    });
    let r=rng()*total,idx=0;
    for(;idx<weights.length-1;idx++){r-=weights[idx];if(r<=0)break}
    out.push(pool.splice(idx,1)[0]);
  }
  return out;
}
function auraSmartSelect(all,count,subject,strategy,rng){
  const recent=new Set(auraRecentKeys().slice(0,90)),dist=auraSmartDistribution(count,strategy),chosen=[],used=new Set();
  for(const level of ['recognize','understand','apply']){
    let candidates=all.filter(q=>auraSmartLevel(q,subject)===level&&!used.has(auraSmartKey(q,q._type||'mc')));
    let picks=auraWeightedPick(candidates,dist[level],rng,subject,recent);
    for(const q of picks){chosen.push(q);used.add(auraSmartKey(q,q._type||'mc'))}
  }
  if(chosen.length<count){
    const rest=all.filter(q=>!used.has(auraSmartKey(q,q._type||'mc')));
    for(const q of auraWeightedPick(rest,count-chosen.length,rng,subject,recent)){chosen.push(q);used.add(auraSmartKey(q,q._type||'mc'))}
  }
  return auraShuffle(chosen,rng).slice(0,count);
}
function auraFilterKeywordsSmart(items,keywords=''){
  const ks=String(keywords).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(x=>x.length>=3);
  if(!ks.length)return items;
  const f=items.filter(x=>ks.some(k=>`${x.stem||x.prompt||''} ${x.tags||''} ${x.skill||''} ${x.source||''}`.toLowerCase().includes(k)));
  return f.length?f:items;
}
function auraEnglishSmartPool(keywords=''){
  const b=window.AURA_ENGLISH_BANK||{},arr=[];
  for(const q of (b.mc||[]))arr.push({...q,_type:'mc',_new:String(q.source||'').includes('V2.4')});
  for(const q of (b.written||[]))arr.push({...q,_type:'written',_new:String(q.source||'').includes('V2.4')});
  return auraFilterKeywordsSmart(arr,keywords);
}
function auraNguvanSmartPool(keywords=''){
  return auraFilterKeywordsSmart(auraReviewPool('NGUVAN',keywords).map(q=>({...q,id:`nv_${auraSeedHash(q.prompt).toString(36)}`,_type:'written'})),keywords);
}
function auraMathCandidatePool(rng,keywords='',count=60){
  const arr=[];
  const levels=[['recognize','basic'],['understand','standard'],['apply','advanced']];
  for(const [lvl,mode] of levels){
    for(let i=0;i<Math.max(18,Math.ceil(count/3));i++){
      const q=auraMathVariant(rng,mode);
      arr.push({...q,id:`m_${auraSeedHash(`${q.stem}|${q.options?.join('|')}`).toString(36)}`,level:lvl,skill:auraSmartSkill(q,'TOAN'),_type:'mc',_new:true});
    }
  }
  const src=auraMathSourcePool();
  src.forEach(q=>arr.push({...auraShuffleMc(q,rng),id:`ms_${auraSeedHash(q.stem).toString(36)}`,level:auraSmartLevel(q,'TOAN'),skill:auraSmartSkill(q,'TOAN'),_type:'mc'}));
  for(let i=0;i<18;i++){
    const q=auraMathWritten(rng);
    arr.push({...q,id:`mw_${auraSeedHash(q.prompt).toString(36)}`,level:auraSmartLevel(q,'TOAN'),skill:auraSmartSkill(q,'TOAN'),_type:'written',_new:true});
  }
  return auraFilterKeywordsSmart(arr,keywords);
}
function auraSmartSummaryHtml(){
  const s=auraSmartStats(),rows=[];
  for(const subject of Object.keys(s)){
    for(const [skill,v] of Object.entries(s[subject]||{})){
      if(!v.seen)continue;
      rows.push({subject,skill,rate:(v.wrong||0)/v.seen,seen:v.seen});
    }
  }
  rows.sort((a,b)=>b.rate-a.rate||b.seen-a.seen);
  if(!rows.length)return '<div class="meta">Chưa đủ dữ liệu lỗi sai. Sau vài lần làm đề, AURA sẽ tự nhận diện phần cần ôn.</div>';
  return rows.slice(0,5).map(x=>`<div class="resource"><div class="fileico">🎯</div><div class="grow"><b>${auraEscape(x.skill)}</b><small>${x.subject} • sai ${Math.round(x.rate*100)}% trên ${x.seen} lượt chấm</small></div></div>`).join('');
}
const auraGenerator24Base=window.generator;
window.generator=function(){
  auraGenerator24Base();
  const app=auraApp();if(!app)return;
  auraPatchVersion24();
  const grid=document.querySelector('.generator-grid');
  if(grid&&!document.querySelector('#smartStrategy')){
    grid.insertAdjacentHTML('beforeend',`<label><b>Chiến lược V2.4</b><select id="smartStrategy"><option value="balanced" selected>Cân bằng 40/40/20</option><option value="weak">Ưu tiên phần yếu</option><option value="exam">Mô phỏng kiểm tra</option><option value="easy">Củng cố nền tảng</option></select></label>`);
  }
  const note=grid?.parentElement?.querySelector('.note');
  if(note)note.innerHTML='<b>V2.4:</b> hệ thống cân Nhận biết – Thông hiểu – Vận dụng, hạn chế lặp câu gần đây và ưu tiên kỹ năng bé thường sai. Câu Tiếng Anh do AURA soạn vẫn được ghi nhãn “câu mới cùng dạng”.';
  if(!document.querySelector('.v24-english-presets')){
    const card=document.createElement('div');card.className='card v24-english-presets';
    card.innerHTML=`<h3>🇬🇧 Đề Tiếng Anh nhanh</h3><p class="meta">Tạo ngay các bộ đề khác nhau từ ngân hàng Units 1–3.</p><div class="gen-actions"><button class="btn soft" onclick="auraEnglishPreset('unit1 school',15)">Unit 1 • School</button><button class="btn soft" onclick="auraEnglishPreset('unit2 house',15)">Unit 2 • House</button><button class="btn soft" onclick="auraEnglishPreset('unit3 friends',15)">Unit 3 • Friends</button><button class="btn soft" onclick="auraEnglishPreset('reading',15)">Reading</button><button class="btn soft" onclick="auraEnglishPreset('rewrite',15)">Rewrite</button><button class="btn primary" onclick="auraEnglishPreset('',20)">Review Units 1–3</button></div>`;
    grid?.parentElement?.insertAdjacentElement('afterend',card);
  }
  if(!document.querySelector('.v24-weak-card')){
    const c=document.createElement('div');c.className='card v24-weak-card';c.innerHTML=`<h3>📊 Phần cần luyện thêm</h3>${auraSmartSummaryHtml()}`;
    app.appendChild(c);
  }
};
function auraEnglishPreset(keywords,count=15){
  generator();
  document.querySelector('#genSubject').value='TIENGANH';
  document.querySelector('#genBasis').value='template';
  const opt=[...document.querySelector('#genCount').options].find(o=>+o.value===count);
  if(opt)document.querySelector('#genCount').value=String(count);
  document.querySelector('#genKeywords').value=keywords;
  document.querySelector('#smartStrategy').value=keywords==='rewrite'?'weak':'balanced';
  generateAuraExam();
}
const auraGenerate24Base=window.generateAuraExam;
window.generateAuraExam=function(){
  const strategy=document.querySelector('#smartStrategy')?.value;
  if(!strategy)return auraGenerate24Base();
  const subject=document.querySelector('#genSubject')?.value||'TOAN',basis=document.querySelector('#genBasis')?.value||'template',count=+(document.querySelector('#genCount')?.value||15),level=document.querySelector('#genLevel')?.value||'standard',keywords=document.querySelector('#genKeywords')?.value||'',seed=`V24-${subject}-${Date.now()}-${Math.random()}`,rng=auraRng(seed);
  let pool=[];
  if(subject==='TIENGANH')pool=auraEnglishSmartPool(keywords);
  else if(subject==='NGUVAN')pool=auraNguvanSmartPool(keywords);
  else if(subject==='TOAN')pool=auraMathCandidatePool(rng,keywords,Math.max(60,count*4));
  if(!pool.length){alert('Chưa có đủ ngân hàng câu hỏi phù hợp để tạo đề V2.4.');return}
  const selected=auraSmartSelect(pool,Math.min(count,pool.length),subject,strategy,rng);
  const mc=[],written=[];
  for(const q of selected){
    if(q._type==='mc'){
      if(subject==='TIENGANH')mc.push(auraEnglishMcShuffle(q,rng));
      else if(q.options&&q.answer)mc.push(q);
    }else written.push(q);
  }
  if(subject==='TOAN'&&written.length<Math.max(2,Math.round(count*.25))){
    while(written.length<Math.max(2,Math.round(count*.25))){
      const q=auraMathWritten(rng);written.push({...q,level:'apply',skill:auraSmartSkill(q,'TOAN')});
      if(mc.length+written.length>=count)mc.pop();
    }
  }
  const names={TOAN:'Toán 6',NGUVAN:'Ngữ văn 6',TIENGANH:'Tiếng Anh 6'};
  const exam={id:`smart_${subject}_${Date.now()}`,subject,title:`${names[subject]} – Đề thông minh V2.4`,basis,count:mc.length+written.length,level,keywords,seed,createdAt:new Date().toISOString(),mc,written,engineVersion:AURA_V24,smartStrategy:strategy,sourceMode:subject==='TIENGANH'?'patterns+smart-selection':'smart-selection'};
  localStorage.setItem('aura_generated_exam',JSON.stringify(exam));localStorage.removeItem('aura_generated_draft');
  auraPushRecent(selected.map(q=>auraSmartKey(q,q._type||'mc')));
  renderAuraGeneratedExam(exam);auraPatchVersion24();
};
function auraRecordSmartResult(){
  const e=JSON.parse(localStorage.getItem('aura_generated_exam')||'null'),d=JSON.parse(localStorage.getItem('aura_generated_draft')||'{}');
  if(!e)return;
  let graded=[];try{graded=JSON.parse(localStorage.getItem('aura_smart_graded_ids')||'[]')}catch{}
  if(graded.includes(e.id))return;
  const stats=auraSmartStats(),sub=e.subject;stats[sub]=stats[sub]||{};
  function hit(q,correct){
    const skill=auraSmartSkill(q,sub),x=stats[sub][skill]||{seen:0,correct:0,wrong:0};
    x.seen++;if(correct)x.correct++;else x.wrong++;stats[sub][skill]=x;
  }
  (e.mc||[]).forEach((q,i)=>hit(q,d.mc?.[i]===q.answer));
  (e.written||[]).forEach((q,i)=>{
    if(!(q.autoGrade&&sub==='TIENGANH'))return;
    hit(q,auraNormEnglish(d.written?.[i])===auraNormEnglish(q.answer));
  });
  auraSaveSmartStats(stats);
  graded=[e.id,...graded.filter(x=>x!==e.id)].slice(0,200);
  localStorage.setItem('aura_smart_graded_ids',JSON.stringify(graded));
}
const auraGrade24Base=window.gradeAuraGenerated;
window.gradeAuraGenerated=function(){
  saveAuraGeneratedDraft();
  auraRecordSmartResult();
  const e=JSON.parse(localStorage.getItem('aura_generated_exam')||'null');
  auraGrade24Base();
  auraPatchVersion24();
  if(e?.engineVersion===AURA_V24){
    const app=auraApp(),weak=Object.entries(auraSmartStats()?.[e.subject]||{}).filter(([,v])=>v.seen).sort((a,b)=>(b[1].wrong/b[1].seen)-(a[1].wrong/a[1].seen)).slice(0,3);
    if(app&&weak.length)app.insertAdjacentHTML('beforeend',`<div class="card"><h3>🎯 AURA đề xuất ôn tiếp</h3>${weak.map(([k,v])=>`<div class="resource"><div class="fileico">↻</div><div class="grow"><b>${auraEscape(k)}</b><small>Sai ${Math.round((v.wrong/v.seen)*100)}% • ${v.seen} lượt</small></div></div>`).join('')}<button class="btn soft" onclick="generator()">Tạo đề ưu tiên phần yếu</button></div>`);
  }
};
function auraPatchVersion24(){
  document.querySelectorAll('.brandtext small,.hero .small,.generated-head .small').forEach(el=>{
    el.textContent=el.textContent.replace(/V2\.3\.1/g,'V2.4.0').replace(/V2\.3\.0/g,'V2.4.0').replace(/V2\.4(?!\.0)/g,'V2.4.0');
  });
}
const auraRender24Base=window.renderAuraGeneratedExam;
window.renderAuraGeneratedExam=function(e){
  auraRender24Base(e);auraPatchVersion24();
  if(e?.engineVersion===AURA_V24){
    const note=document.querySelector('.generated-head .note');
    if(note){
      const d=auraSmartDistribution(e.count,e.smartStrategy),labels={balanced:'Cân bằng',weak:'Ưu tiên phần yếu',exam:'Mô phỏng kiểm tra',easy:'Củng cố nền tảng'};
      note.textContent=`Mã đề: ${String(e.seed).slice(-12)} • V2.4 ${labels[e.smartStrategy]||''} • mục tiêu ${d.recognize}/${d.understand}/${d.apply} (Nhận biết/Thông hiểu/Vận dụng).`;
    }
  }
};
const auraHome24Base=window.home;
window.home=function(){
  auraHome24Base();auraPatchVersion24();
  const card=document.querySelector('.v23-generator-card');
  if(card){const b=card.querySelector('b'),s=card.querySelector('small');if(b)b.textContent='Đề thi thông minh V2.4';if(s)s.textContent='Cân mức độ • tránh lặp • học từ lỗi sai • thêm nhiều đề Tiếng Anh Units 1–3.'}
};
(function auraInitV24(){auraPatchVersion24();if(typeof window.home==='function')window.home()})();