function auraPatchAllV24(){
  document.querySelectorAll('.small,.note,.brandtext small,.hero .small,.generated-head .small').forEach(el=>{
    el.textContent=el.textContent.replace(/V2\.3\.1/g,'V2.4.1').replace(/V2\.3\.0/g,'V2.4.1').replace(/V2\.4\.0/g,'V2.4.1').replace(/V2\.4(?!\.\d)/g,'V2.4.1');
  });
}
function auraOpenWeakGenerator(subject){generator();const s=document.querySelector('#genSubject'),st=document.querySelector('#smartStrategy');if(s)s.value=subject||'TOAN';if(st)st.value='weak'}
const auraGradeV24PatchBase=window.gradeAuraGenerated;
window.gradeAuraGenerated=function(){
  const e=JSON.parse(localStorage.getItem('aura_generated_exam')||'null');
  auraGradeV24PatchBase();
  if(e?.engineVersion==='2.4.0'&&typeof attempts==='function'&&typeof saveAttempts==='function'){
    const a=attempts();
    if(a[0]){a[0].title=String(a[0].title||'').replace(/V2\.3\.1/g,'V2.4.1').replace(/V2\.4\.0/g,'V2.4.1');a[0].note=String(a[0].note||'').replace(/V2\.3\.1/g,'V2.4.1').replace(/V2\.4\.0/g,'V2.4.1');saveAttempts(a)}
  }
  auraPatchAllV24();
  document.querySelectorAll('button').forEach(b=>{if(b.textContent.trim()==='Tạo đề ưu tiên phần yếu')b.onclick=()=>auraOpenWeakGenerator(e?.subject)});
};
const auraGeneratorV24PatchBase=window.generator;window.generator=function(){auraGeneratorV24PatchBase();auraPatchAllV24()};
const auraHomeV24PatchBase=window.home;window.home=function(){auraHomeV24PatchBase();auraPatchAllV24()};
auraPatchAllV24();