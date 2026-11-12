/* AURA STUDY Stage 2C — browser-local question QA, no server / no Question Bank write. */
(function(){
'use strict';
const core=window.AURA_QUESTION_REVIEW_CORE;
if(!core)return;
const $=id=>document.getElementById(id);
const state={packet:null,decisions:{},selected:0,filter:'all'};
const node=(tag,cls='',text='')=>{
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(text)el.textContent=text;
  return el;
};
function message(s,error=false){
  const el=$('qaMessage');el.textContent=s;el.classList.toggle('is-error',error);
}
async function readJson(file){
  if(!file||file.size>16*1024*1024)throw new Error('Tệp vượt 16 MB hoặc không hợp lệ.');
  const value=JSON.parse(await file.text());
  return value;
}
function currentItem(){return state.packet?.items[state.selected];}
function status(item){return core.evaluate(item,state.decisions[item.itemId]);}
function setSummary(){
  if(!state.packet)return;
  const rows=state.packet.items;
  const done=rows.filter(x=>status(x).readyForStaging).length;
  const blocks=[
    ['Câu trong hồ sơ',rows.length],
    ['Ảnh cần đối chiếu',rows.reduce((sum,x)=>sum+x.images.length,0)],
    ['Đã rà soát cục bộ',done],
    ['Vẫn cần kiểm định',rows.length-done]
  ];
  const root=$('qaSummary');root.replaceChildren();
  for(const [name,count] of blocks){
    const box=node('div'),label=node('span','',name),num=node('strong','',String(count));
    box.append(label,num);root.append(box);
  }
}
function filteredList(){
  if(!state.packet)return [];
  return state.packet.items.filter(item=>{
    if(state.filter==='issues')return item.issueFlags.length>0;
    if(state.filter==='images')return item.images.length>0;
    if(state.filter==='complete')return status(item).readyForStaging;
    if(state.filter==='blocked')return !status(item).readyForStaging;
    return true;
  });
}
function renderList(){
  const rows=filteredList(),root=$('qaQuestionList');root.replaceChildren();
  $('qaCount').textContent=rows.length+' / '+(state.packet?.items.length||0);
  rows.forEach(item=>{
    const index=state.packet.items.indexOf(item),gate=status(item);
    const b=node('button','qa-qitem'+(index===state.selected?' active':'')+
      (gate.readyForStaging?' done':item.issueFlags.length?' issue':''));
    b.type='button';b.dataset.itemId=item.itemId;
    b.setAttribute('role','listitem');
    const label=node('strong','',item.sourceLabel+' · '+item.sourceName.replace(/_20261027\.docx$/,''));
    const hint=node('small','',item.images.length+' hình · '+item.issueFlags.length+' cảnh báo · '+
      (gate.readyForStaging?'Đã rà soát tại máy':'Cần kiểm định'));
    b.append(label,hint);
    b.addEventListener('click',()=>{
      collect();
      state.selected=index;renderDetail();renderList();
      if(window.matchMedia('(max-width:900px)').matches)
        $('qaDetail').scrollIntoView({behavior:'smooth',block:'start'});
    });
    root.append(b);
  });
}
function addLabelControl(parent,labelText,element){
  const label=node('label','',labelText);label.append(element);parent.append(label);return element;
}
function getControl(name){return $('qaReviewForm').elements.namedItem(name);}
function renderDetail(){
  const item=currentItem();
  if(!item)return;
  $('qaQuestionTitle').textContent='03 · '+item.sourceLabel+' · '+(item.type==='MCQ'?'Trắc nghiệm':'Tự luận');
  $('qaSourceInfo').textContent='Nguồn: '+item.sourceName+' · SHA-256: '+
    item.sourceSha256.slice(0,16)+'… · Mã: '+item.itemId;
  const body=$('qaQuestionBody');body.replaceChildren();
  item.textBlocks.forEach(line=>body.append(node('p','qa-para',line)));
  if(item.options.length){
    const options=node('div','qa-options');
    item.options.forEach(o=>options.append(node('div','qa-option',o.key+'. '+o.text)));
    body.append(options);
  }
  item.images.forEach((img,i)=>{
    const fig=node('figure','qa-image'),preview=node('img');
    preview.src=img.dataUrl;preview.alt='Hình '+(i+1)+' từ Word gốc, '+item.sourceLabel;
    preview.loading='lazy';
    const cap=node('figcaption','',
      'Hình '+(i+1)+' · '+img.assetName+' · SHA '+img.sha256.slice(0,16)+'…'+
      ' · block '+img.sourceBlockIndex);
    fig.append(preview,cap);body.append(fig);
  });
  const answer=$('qaAnswerInput');answer.replaceChildren();
  if(item.type==='MCQ'){
    const select=node('select');select.name='answer';
    const blank=node('option','', '— Chưa có đáp án đã xác minh —');blank.value='';
    select.append(blank);
    item.options.forEach(opt=>{const o=node('option','',opt.key+' · '+opt.text.slice(0,100));o.value=opt.key;select.append(o);});
    addLabelControl(answer,'Đáp án đã tự kiểm tra',select);
  }else{
    const area=node('textarea');area.name='answer';area.rows=3;
    area.placeholder='Lời giải hoặc đáp án chi tiết do người kiểm định xác nhận';
    addLabelControl(answer,'Lời giải kiểm tra',area);
  }
  const flagRoot=$('qaFlagsItems');flagRoot.replaceChildren();
  $('qaFlags').hidden=item.issueFlags.length===0;
  item.issueFlags.forEach(flag=>{
    const wrap=node('div','qa-flag-row'),title=node('b','',flag);
    const area=node('textarea');area.rows=2;area.dataset.qaFlag=flag;
    area.placeholder='Giải thích đã sửa / bằng chứng bổ sung / cần giữ chặn...';
    wrap.append(title,area);flagRoot.append(wrap);
  });
  $('qaReviewForm').reset();
  const d=state.decisions[item.itemId]||core.emptyDecision();
  ['answer','answerEvidence','rubric','maxPoints','rubricEvidence','imageEvidence','reviewNote','reviewerLabel']
    .forEach(key=>{const el=getControl(key);if(el)el.value=d[key]??''});
  ['checkImage','checkAnswer','checkRubric'].forEach(key=>{
    const el=getControl(key);if(el)el.checked=!!d[key];
  });
  flagRoot.querySelectorAll('[data-qa-flag]').forEach(el=>{
    el.value=d.issueResolutions?.[el.dataset.qaFlag]||'';
  });
  renderGate();
}
function collect(){
  const item=currentItem();if(!item)return;
  const d=core.emptyDecision();
  for(const key of ['answer','answerEvidence','rubric','maxPoints','rubricEvidence',
    'imageEvidence','reviewNote','reviewerLabel']){
    const el=getControl(key);
    d[key]=el?.value??'';
  }
  for(const key of ['checkImage','checkAnswer','checkRubric'])d[key]=!!getControl(key)?.checked;
  $('qaFlagsItems').querySelectorAll('[data-qa-flag]').forEach(el=>{
    d.issueResolutions[el.dataset.qaFlag]=el.value;
  });
  state.decisions[item.itemId]=d;
}
function renderGate(){
  const item=currentItem();if(!item)return;
  const data=core.evaluate(item,state.decisions[item.itemId]);
  const gate=$('qaGate');gate.replaceChildren();gate.classList.toggle('done',data.readyForStaging);
  gate.append(node('strong','',data.readyForStaging?
    'Đã rà soát cục bộ — chưa được cấp quyền xuất bản':
    'Chưa đạt cổng kiểm định — Question Bank tiếp tục bị chặn'));
  const ul=node('ul');
  (data.blockers.length?data.blockers:['Đã điền biên bản, nhưng cần xác minh quyền duyệt trên máy chủ và kiểm thử nhập staging.'])
    .forEach(x=>ul.append(node('li','',x)));
  gate.append(ul);
}
function showAll(){
  $('qaContent').hidden=false;
  setSummary();renderList();renderDetail();
}
$('packetFile').addEventListener('change',async function(){
  const f=this.files?.[0];
  if(!f)return;
  try{
    const packet=core.sanitizePacket(await readJson(f));
    state.packet=packet;state.decisions={};state.selected=0;state.filter='all';
    $('qaFilter').value='all';$('decisionFile').disabled=false;
    showAll();
    message('Đã nạp '+packet.summary.questions+' câu và '+packet.summary.images+
      ' hình vào RAM; chưa có câu nào được tự duyệt.');
  }catch(error){
    state.packet=null;$('qaContent').hidden=true;$('decisionFile').disabled=true;
    message('Không nạp được hồ sơ: '+String(error?.message||error),true);
  }
});
$('decisionFile').addEventListener('change',async function(){
  const f=this.files?.[0];if(!f||!state.packet)return;
  try{
    const decisions=core.importDecisions(state.packet,await readJson(f));
    state.decisions=decisions;showAll();
    message('Đã khôi phục '+Object.keys(decisions).length+
      ' bản ghi cùng SHA-256 nguồn. Quyết định trên nguồn khác phiên bản bị bỏ qua.');
  }catch(error){message('Không nạp được biên bản: '+String(error?.message||error),true);}
});
$('qaReviewForm').addEventListener('submit',e=>e.preventDefault());
$('qaReviewForm').addEventListener('input',()=>{collect();renderGate();setSummary();});
$('qaReviewForm').addEventListener('change',()=>{collect();renderGate();setSummary();});
$('qaFilter').addEventListener('change',e=>{collect();state.filter=e.target.value;renderList();});
$('qaPrevious').addEventListener('click',()=>{
  collect();state.selected=Math.max(0,state.selected-1);
  renderDetail();renderList();
});
$('qaSaveNext').addEventListener('click',()=>{
  collect();
  const cur=currentItem(),gate=core.evaluate(cur,state.decisions[cur.itemId]);
  message(cur.itemId+': '+(gate.readyForStaging?'đã ghi nhận kiểm định cục bộ':'vẫn còn '+gate.blockers.length+' mục cần giải quyết')+
    '. Nhớ xuất biên bản trước khi rời trang.');
  state.selected=Math.min(state.packet.items.length-1,state.selected+1);
  renderDetail();renderList();setSummary();
});
$('qaExport').addEventListener('click',()=>{
  if(!state.packet)return;
  collect();
  const out=core.exportDecisions(state.packet,state.decisions);
  const blob=new Blob([JSON.stringify(out,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement('a');
  anchor.download='AURA_STAGE2C_REVIEW_DECISIONS_'+new Date().toISOString().slice(0,10)+'.json';
  anchor.href=url;document.body.append(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),15000);
  message('Đã xuất biên bản cục bộ. Không có câu hỏi nào được đưa vào Question Bank.');
});
window.addEventListener('beforeunload',e=>{
  if(!state.packet||!Object.keys(state.decisions).length)return;
  e.preventDefault();
});
})();
