function auraPatchAllV24(){
  document.querySelectorAll('.small,.brandtext small,.hero .small,.generated-head .small').forEach(el=>{
    el.textContent=el.textContent.replace(/V2\.3\.1/g,'V2.4.0').replace(/V2\.3\.0/g,'V2.4.0').replace(/V2\.4(?!\.0)/g,'V2.4.0');
  });
}
function auraOpenWeakGenerator(subject){
  generator();
  const s=document.querySelector('#genSubject'),st=document.querySelector('#smartStrategy');
  if(s)s.value=subject||'TOAN';
  if(st)st.value='weak';
}
const auraGradeV24PatchBase=window.gradeAuraGenerated;
window.gradeAuraGenerated=function(){
  const e=JSON.parse(localStorage.getItem('aura_generated_exam')||'null');
  auraGradeV24PatchBase();
  auraPatchAllV24();
  document.querySelectorAll('button').forEach(b=>{
    if(b.textContent.trim()==='Tạo đề ưu tiên phần yếu')b.onclick=()=>auraOpenWeakGenerator(e?.subject);
  });
};
const auraGeneratorV24PatchBase=window.generator;
window.generator=function(){auraGeneratorV24PatchBase();auraPatchAllV24()};
const auraHomeV24PatchBase=window.home;
window.home=function(){auraHomeV24PatchBase();auraPatchAllV24()};
auraPatchAllV24();
