/* AURA STUDY Stage 2C — local-only question QA gate, no publish endpoint. */
(function(root){
'use strict';
const PACKET_KIND='aura_question_review_packet_v1';
const EXPORT_KIND='aura_question_review_decisions_v1';
const HEX64=/^[0-9a-f]{64}$/i;
const SAFE_ID=/^[A-Za-z0-9_-]{6,120}$/;
const VALID_TYPES=new Set(['MCQ','ESSAY']);
const text=(v,max=6000)=>typeof v==='string'?v.slice(0,max):'';
const trim=(v,max=6000)=>text(v,max).trim();
function assert(condition,message){if(!condition)throw new Error(message)}
function sanitizePacket(packet){
  assert(packet&&typeof packet==='object'&&!Array.isArray(packet),'Dữ liệu kiểm định không hợp lệ.');
  assert(packet.schemaVersion===1&&packet.kind===PACKET_KIND,'Sai phiên bản gói kiểm định.');
  assert(packet.safety?.questionBankPublishEnabled===false,'Không nhập được gói tự bật xuất bản.');
  assert(Array.isArray(packet.items)&&packet.items.length>0&&packet.items.length<=500,
    'Gói phải có từ 1 đến 500 câu hỏi.');
  const ids=new Set();let mediaBytes=0;
  const items=packet.items.map((raw,i)=>{
    assert(raw&&typeof raw==='object','Câu hỏi không hợp lệ ở vị trí '+(i+1));
    const id=trim(raw.itemId,120),sha=trim(raw.sourceSha256,64);
    assert(SAFE_ID.test(id)&&!ids.has(id),'Mã câu bị trùng hoặc không hợp lệ.');
    assert(HEX64.test(sha),'Thiếu SHA-256 nguồn gốc.');
    assert(VALID_TYPES.has(raw.type),'Loại câu không hợp lệ.');
    assert(raw.reviewedForBank===false&&raw.publishEnabled===false,
      'Không chấp nhận câu nguồn đã tự đánh dấu xuất bản.');
    const sourceName=trim(raw.sourceName,255),label=trim(raw.sourceLabel,80);
    assert(sourceName&&label,'Thiếu nguồn hoặc nhãn câu.');
    const blocks=(Array.isArray(raw.textBlocks)?raw.textBlocks:[]).map(x=>trim(x,2000)).filter(Boolean).slice(0,60);
    assert(blocks.length&&blocks.some(x=>x.length>=5),'Thiếu nội dung câu hỏi.');
    const options=(Array.isArray(raw.options)?raw.options:[]).map(x=>({
      key:trim(x?.key,1),text:trim(x?.text,1000)
    }));
    if(raw.type==='MCQ'){
      assert(options.length===4 && options.map(x=>x.key).join('')==='ABCD'&&options.every(x=>x.text),
        'Câu trắc nghiệm phải có đủ bốn lựa chọn A/B/C/D.');
    }
    const images=(Array.isArray(raw.images)?raw.images:[]);
    assert(images.length<=12,'Một câu có quá nhiều ảnh.');
    const safeImages=images.map(img=>{
      assert(img&&HEX64.test(img.sha256),'Ảnh thiếu SHA-256.');
      const url=text(img.dataUrl,600000);
      assert(/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(url),
        'Ảnh không phải dữ liệu nội bộ hợp lệ.');
      mediaBytes+=url.length;
      assert(mediaBytes<=12000000,'Gói hình vượt giới hạn an toàn.');
      return {sha256:img.sha256.toLowerCase(),assetName:trim(img.assetName,90),
        dataUrl:url,sourceBlockIndex:Number.isInteger(img.sourceBlockIndex)?img.sourceBlockIndex:-1};
    });
    const flags=(Array.isArray(raw.issueFlags)?raw.issueFlags:[]).map(x=>trim(x,120)).filter(Boolean).slice(0,20);
    ids.add(id);
    return {itemId:id,sourceName,sourceSha256:sha.toLowerCase(),sourceLabel:label,
      type:raw.type,grade:6,subject:'TOAN',period:'GK1',
      textBlocks:blocks,options,images:safeImages,issueFlags:flags,
      sourceAnswerProvided:false,sourceRubricProvided:false,readyForQuestionBank:false};
  });
  return {schemaVersion:1,kind:PACKET_KIND,items,
    summary:{questions:items.length,images:items.reduce((a,x)=>a+x.images.length,0),
      issues:items.reduce((a,x)=>a+x.issueFlags.length,0)}};
}
function emptyDecision(){return {answer:'',answerEvidence:'',rubric:'',maxPoints:'',rubricEvidence:'',
  imageEvidence:'',checkImage:false,checkAnswer:false,checkRubric:false,
  issueResolutions:{},reviewNote:'',reviewerLabel:''};}
function evaluate(item,data){
  const d={...emptyDecision(),...(data||{})};
  const issues=[];
  const answer=trim(d.answer,1800),answerEvidence=trim(d.answerEvidence,2500),
    rubric=trim(d.rubric,3500),rubricEvidence=trim(d.rubricEvidence,1500),
    reviewer=trim(d.reviewerLabel,100);
  if(!reviewer||reviewer.length<2)issues.push('Chưa nhập tên/người kiểm tra.');
  if(!d.checkImage|| (item.images.length>0&&trim(d.imageEvidence,1500).length<8))
    issues.push('Chưa xác minh liên kết hình và vị trí từng hình trong câu.');
  if(!d.checkAnswer||answerEvidence.length<12)
    issues.push('Chưa đối chiếu độc lập đáp án kèm căn cứ.');
  if(item.type==='MCQ'&&!item.options.some(x=>x.key===answer))issues.push('Chưa chọn đáp án A/B/C/D hợp lệ.');
  if(item.type==='ESSAY'&&answer.length<5)issues.push('Câu tự luận thiếu lời giải/đáp án kiểm tra.');
  const points=Number(d.maxPoints);
  if(!Number.isFinite(points)||points<=0||points>10||String(d.maxPoints).trim()==='')
    issues.push('Chưa có điểm tối đa hợp lệ (0–10, lớn hơn 0).');
  if(!d.checkRubric||rubric.length<15||rubricEvidence.length<12)
    issues.push('Chưa kiểm tra thang điểm từng bước và tổng điểm.');
  // Accept a step only when its number follows ':' or '='; do not treat
  // question indices, years or measurements within descriptions as marks.
  const stepPoints=[...rubric.matchAll(/[:=]\s*(\d+(?:[.,]\d+)?)(?=\s*(?:điểm|đ\b|[;.\n]|$))/gi)]
    .map(m=>Number(m[1].replace(',','.')));
  const rubricSum=stepPoints.reduce((a,b)=>a+b,0);
  if(!stepPoints.length||!Number.isFinite(rubricSum)||Math.abs(rubricSum-points)>0.0001)
    issues.push('Tổng điểm các bước trong rubric không khớp điểm tối đa.');

  if(item.issueFlags.length){
    // A text comment is not evidence that the original source was corrected.
    // Refuse to clear a source quality defect until source SHA is replaced.
    issues.push('Nguồn còn cảnh báo; phải sửa/đối chiếu lại bản gốc và tạo hồ sơ SHA mới trước khi hoàn thành.');
    for(const flag of item.issueFlags){
      if(trim(d.issueResolutions?.[flag],900).length<20)
        issues.push('Chưa xử lý/giải trình cảnh báo: '+flag);
    }
  }
  return {status:issues.length?'NEEDS_QA':'LOCAL_REVIEW_COMPLETE_NOT_AUTHORIZED',
    blockers:issues,readyForStaging:issues.length===0,
    eligibleForQuestionBank:false,autoGradingAllowed:false,
    authoritativeReview:false,serverApprovalRequired:true};
}
function exportDecisions(packet,decisions){
  const items=packet.items.map(item=>{
    const decision=decisions[item.itemId]||emptyDecision(),gate=evaluate(item,decision);
    return {itemId:item.itemId,sourceSha256:item.sourceSha256,
      decision:{answer:trim(decision.answer,1800),answerEvidence:trim(decision.answerEvidence,2500),
        rubric:trim(decision.rubric,3500),maxPoints:trim(String(decision.maxPoints||''),20),
        rubricEvidence:trim(decision.rubricEvidence,1500),imageEvidence:trim(decision.imageEvidence,1500),
        checkImage:!!decision.checkImage,checkAnswer:!!decision.checkAnswer,
        checkRubric:!!decision.checkRubric,issueResolutions:decision.issueResolutions||{},
        reviewNote:trim(decision.reviewNote,2500),reviewerLabel:trim(decision.reviewerLabel,100)},
      gate};
  });
  return {schemaVersion:1,kind:EXPORT_KIND,createdAt:new Date().toISOString(),
    issuer:'BROWSER_LOCAL_NO_SERVER_AUTH',publish:false,grading:false,
    sourceCount:new Set(items.map(x=>x.sourceSha256)).size,items};
}
function importDecisions(packet,payload){
  assert(payload&&payload.kind===EXPORT_KIND&&payload.schemaVersion===1&&Array.isArray(payload.items),
    'Sai định dạng bản ghi kiểm định.');
  const lookup=new Map(packet.items.map(x=>[x.itemId,x]));
  const out={};
  for(const row of payload.items){
    const item=lookup.get(row?.itemId);
    if(!item||item.sourceSha256!==row.sourceSha256)continue; // changed source invalidates old approval
    if(row?.gate?.eligibleForQuestionBank===true)continue;
    out[item.itemId]=row.decision&&typeof row.decision==='object'?row.decision:emptyDecision();
  }
  return out;
}
root.AURA_QUESTION_REVIEW_CORE=Object.freeze({
  PACKET_KIND,EXPORT_KIND,sanitizePacket,emptyDecision,evaluate,exportDecisions,importDecisions
});
})(typeof window!=='undefined'?window:globalThis);
