/* AURA STUDY: six original, source-driven Toán6 data visualizations.
 * Educational SVG only, not images/publisher charts or official student records.
 */
(function(root){
'use strict';
const NS='http://www.w3.org/2000/svg', allowed=new Set([
 'survey','pictogram','bar','double-bar','sample-space','experimental-frequency'
]);
function svgEl(name,attrs={},content){
 const n=document.createElementNS(NS,name);
 Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));
 if(content!==undefined)n.textContent=String(content);
 return n;
}
function label(svg,x,y,value,anchor='middle',size=15){
 svg.append(svgEl('text',{x,y,'text-anchor':anchor,'font-size':size,
  'font-family':'system-ui,sans-serif',fill:'#235578'},value));
}
function bar(svg,x,y,w,h,color){
 svg.append(svgEl('rect',{x,y,width:w,height:h,rx:5,fill:color}));
}
function baseline(svg,y=214){
 svg.append(svgEl('line',{x1:50,y1:y,x2:605,y2:y,stroke:'#587a94','stroke-width':2}));
}
function numbersOK(values){return Array.isArray(values)&&values.length>0&&values.every(v=>Number.isInteger(v)&&v>=0&&v<=40)}
function render(container,model){
 if(!container||!model||!allowed.has(model.kind)||typeof model.caption!=='string')return false;
 const wrap=document.createElement('figure');wrap.className='aura-statistics-figure';wrap.dataset.statisticsKind=model.kind;
 const svg=svgEl('svg',{viewBox:'0 0 640 275','aria-label':model.caption,role:'img',
  preserveAspectRatio:'xMidYMid meet',class:'aura-statistics-svg'});
 svg.append(svgEl('title',{},model.caption));
 if(model.kind==='sample-space'){
  if(model.outcomes?.join(',')!=='1,2,3,4,5,6')return false;
  for(let i=0;i<6;i++){
   const x=105+i*87;
   svg.append(svgEl('rect',{x:x-31,y:104,width:62,height:62,rx:12,stroke:'#326d9b','stroke-width':2,fill:'#ebf5fd'}));
   label(svg,x,146,String(i+1),'middle',28);
  }
  label(svg,320,71,'Kết quả có thể của xúc xắc chuẩn 1–6');
  label(svg,320,225,'Không phải tần số đã quan sát');
 }else if(model.kind==='pictogram'){
  if(!numbersOK(model.values)||model.categories?.length!==3||
   !Number.isInteger(model.weightPerIcon)||model.weightPerIcon<1)return false;
  model.categories.forEach((category,i)=>{
   const y=80+i*63;label(svg,48,y,String(category),'start',17);
   for(let k=0;k<model.values[i];k++)label(svg,187+k*56,y,'★','middle',32);
   label(svg,572,y,String(model.values[i]*model.weightPerIcon)+' '+(model.unit||''),'end',14);
  });
  label(svg,320,255,'1 ★ = '+model.weightPerIcon+' '+(model.unit||'đơn vị'));
 }else if(model.kind==='double-bar'){
  if(model.categories?.length!==2||model.series?.length!==2||
   !numbersOK(model.series[0].values)||!numbersOK(model.series[1].values)||
   model.series.some(s=>s.values.length!==2))return false;
  baseline(svg);
  for(let i=0;i<2;i++){
   const x=162+i*290;
   model.series.forEach((series,j)=>{
    const v=series.values[i],h=v*13,xx=x+j*58;
    bar(svg,xx,214-h,45,h,j===0?'#2c73a3':'#dfa04a');
    label(svg,xx+22,204-h,String(v));
   });
   label(svg,x+48,245,model.categories[i], 'middle',15);
  }
  bar(svg,175,18,16,16,'#2c73a3');label(svg,198,31,model.series[0].name,'start',14);
  bar(svg,400,18,16,16,'#dfa04a');label(svg,423,31,model.series[1].name,'start',14);
 }else{
  if(model.categories?.length!==model.values?.length||!numbersOK(model.values))return false;
  baseline(svg);
  const size=model.values.length;
  model.values.forEach((v,i)=>{
   const x=85+i*(Math.floor(510/size)),w=size===2?110:100,h=v*11;
   bar(svg,x,214-h,w,h,'#317bab');
   label(svg,x+w/2,204-h,String(v));
   label(svg,x+w/2,242,model.categories[i], 'middle',15);
  });
  label(svg,578,40,model.unit||'lượt','end',14);
 }
 wrap.append(svg);
 const caption=document.createElement('figcaption');caption.textContent=model.caption;
 wrap.append(caption);container.append(wrap);return true;
}
root.auraMath6DrawStatistics=render;
root.auraMath6StatisticsKinds=Object.freeze([...allowed]);
})(window);
