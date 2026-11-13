/* AURA STUDY Math6: original deterministic SVG figures for Bài 32-37. */
(function(root){
'use strict';
const NS='http://www.w3.org/2000/svg';
const kinds=new Set(['line-membership','opposite-rays','segment-length','midpoint','angle-definition','angle-measure']);
function svgEl(name,attrs={},content){
 const e=document.createElementNS(NS,name);
 Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));
 if(content!==undefined)e.textContent=String(content);
 return e;
}
function t(svg,x,y,s,anchor='middle',weight='500'){
 svg.append(svgEl('text',{x,y,'text-anchor':anchor,fill:'#214d78','font-size':17,'font-family':'system-ui,sans-serif','font-weight':weight},s));
}
function line(svg,x1,y1,x2,y2,color='#3977a2',width=3){
 svg.append(svgEl('line',{x1,y1,x2,y2,stroke:color,'stroke-width':width,'stroke-linecap':'round'}));
}
function dot(svg,x,y,label,dy=-14){
 svg.append(svgEl('circle',{cx:x,cy:y,r:5,fill:'#205b91'}));t(svg,x,y+dy,label,'middle','700');
}
function arrow(svg,x1,y1,x2,y2){
 const a=Math.atan2(y2-y1,x2-x1),len=12;
 const x3=x2-len*Math.cos(a-0.45),y3=y2-len*Math.sin(a-0.45);
 const x4=x2-len*Math.cos(a+0.45),y4=y2-len*Math.sin(a+0.45);
 svg.append(svgEl('polygon',{points:x2+','+y2+' '+x3+','+y3+' '+x4+','+y4,fill:'#3977a2'}));
}
function draw(container,model){
 if(!container||!model||!kinds.has(model.kind)||typeof model.caption!=='string')return false;
 const wrap=document.createElement('figure');wrap.className='aura-geometry-figure';
 wrap.dataset.geometryKind=model.kind;
 const svg=svgEl('svg',{viewBox:'0 0 640 245',role:'img','aria-label':model.caption,
  preserveAspectRatio:'xMidYMid meet',class:'aura-geometry-svg'});
 svg.append(svgEl('title',{},model.caption));
 if(model.kind==='line-membership'){
  line(svg,55,135,582,135);arrow(svg,105,135,55,135);arrow(svg,530,135,582,135);
  dot(svg,170,135,'A');dot(svg,455,135,'B');dot(svg,320,65,'C');t(svg,595,140,'a');
 }else if(model.kind==='opposite-rays'){
  line(svg,320,130,58,130);line(svg,320,130,582,130);
  arrow(svg,120,130,58,130);arrow(svg,520,130,582,130);
  dot(svg,100,130,'X');dot(svg,320,130,'O');dot(svg,540,130,'Y');
  t(svg,320,203,'Tia OX và OY chung gốc, ngược hướng');
 }else if(model.kind==='segment-length'){
  line(svg,90,127,550,127,'#25699e',5);
  for(let k=0;k<=6;k++){const x=90+460*k/6;line(svg,x,116,x,139,'#25699e',2);}
  dot(svg,90,127,'A',-24);dot(svg,550,127,'B',-24);t(svg,320,191,'AB = 6 cm (mô hình)');
 }else if(model.kind==='midpoint'){
  line(svg,92,125,548,125,'#25699e',4);
  dot(svg,92,125,'A',-22);dot(svg,320,125,'M',-22);dot(svg,548,125,'B',-22);
  t(svg,208,180,'4 cm');t(svg,435,180,'4 cm');t(svg,320,220,'M nằm giữa A, B; AM = MB');
 }else if(model.kind==='angle-definition'){
  line(svg,155,193,535,193,'#3977a2',4);line(svg,155,193,425,51,'#3977a2',4);
  arrow(svg,482,193,535,193);arrow(svg,390,70,425,51);
  dot(svg,155,193,'O',27);t(svg,550,202,'A');t(svg,434,45,'B');t(svg,290,235,'∠AOB, đỉnh O');
 }else if(model.kind==='angle-measure'){
  if(model.measureDegrees!==60)return false;
  const ox=240,oy=195,len=170,deg=60,rad=deg*Math.PI/180;
  const bx=ox+len*Math.cos(rad),by=oy-len*Math.sin(rad);
  line(svg,ox,oy,ox+len,oy,'#3977a2',4);line(svg,ox,oy,bx,by,'#3977a2',4);
  arrow(svg,ox+len-25,oy,ox+len,oy);arrow(svg,bx-12.5,by+21.65,bx,by);
  dot(svg,ox,oy,'O',28);t(svg,ox+len+18,oy+6,'A');t(svg,bx+13,by-12,'B');
  const r=58,x1=ox+r,y1=oy,x2=ox+r*Math.cos(rad),y2=oy-r*Math.sin(rad);
  svg.append(svgEl('path',{d:'M '+x1+' '+y1+' A '+r+' '+r+' 0 0 0 '+x2+' '+y2,
   fill:'none',stroke:'#dc8b2d','stroke-width':3}));
  t(svg,ox+87,oy-23,'60°');svg.dataset.angleDegrees=String(deg);
 }
 wrap.append(svg);
 const caption=document.createElement('figcaption');caption.textContent=model.caption;
 wrap.append(caption);container.append(wrap);return true;
}
root.auraMath6DrawGeometry=draw;
root.auraMath6GeometryKinds=Object.freeze([...kinds]);
})(window);
