/* AURA STUDY — public read-only status; cannot create approvals. */
(async function(){
'use strict';
const $=id=>document.getElementById(id);
function el(tag,cls='',text){
 const node=document.createElement(tag);if(cls)node.className=cls;
 if(text!==undefined)node.textContent=String(text);
 return node;
}
async function resource(path){
 const response=await fetch(path,{cache:'no-store',credentials:'omit'});
 if(!response.ok)throw Error('Thiếu nguồn '+path+' ('+response.status+')');
 const raw=await response.text();
 return {raw,data:JSON.parse(raw)};
}
async function sha(text){
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
 return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function detail(label,value){
 const root=$('approvalDetails');
 root.append(el('dt','',label),el('dd','',value));
}
function chapterCard(c,l){
 const card=el('div','approval-chapter');
 const count=l.filter(x=>x.chapter===c.number).reduce((n,x)=>n+x.practice.length,0);
 card.append(el('strong','','Chương '+c.number+' · '+c.title),
  el('small','',count+' câu luyện theo bài + 6 câu ôn chương = '+(count+6)+' câu cần kiểm định'));
 return card;
}
try{
 const [lessons,reviews,policy,pointer,trust]=await Promise.all([
  resource('aura_data/knowledge_math6_kntt_volume1_v2.json'),
  resource('aura_data/knowledge_math6_kntt_v2_chapter_reviews.json'),
  resource('aura_data/knowledge_approval/math6_v2_policy.json'),
  resource('aura_data/approved_knowledge/active.json'),
  resource('aura_data/approved_knowledge/trust.json')
 ]);
 const lessonCount=lessons.data.lessons.reduce((n,l)=>n+l.practice.length,0);
 const reviewCount=reviews.data.chapters.reduce((n,c)=>n+c.questions.length,0);
 const candidateTotal=lessonCount+reviewCount;
 if(lessons.data.lessons.length!==22||candidateTotal!==96)throw Error('Số bài/câu nguồn chưa đúng');
 const currentSha={lessonData:await sha(lessons.raw),chapterData:await sha(reviews.raw)};
 const batch=policy.data.batchReview||{},exclusions=policy.data.exclusions||[];
 const hashesMatch=batch.reviewedSourceSha256?.lessonData===currentSha.lessonData&&
  batch.reviewedSourceSha256?.chapterData===currentSha.chapterData;
 const publicKeySetup=!!trust.data.activeKeyId&&trust.data.publicKeys?.length>0;
 const signed=window.auraApprovedKnowledgeReady?
  (await window.auraApprovedKnowledgeReady,window.auraKnowledgeApprovalStatus()):{state:'BLOCKED',approvedCount:0};
 $('totalSource').textContent=String(candidateTotal);
 $('machineQA').textContent='96';
 $('signedApproved').textContent=String(signed.approvedCount||0);
 $('exceptions').textContent=String(exclusions.length);
 const container=$('approvalState');
 if(signed.state==='SIGNED_ACTIVE'){
  container.classList.add('active');
  container.textContent='✓ Bản phát hành ký số '+signed.version+' đã được xác thực trong trình duyệt, có '+signed.approvedCount+' câu dùng cho luyện tập.';
 }else if(hashesMatch&&batch.status==='APPROVED_BY_QUALIFIED_REVIEWER'&&publicKeySetup){
  container.classList.add('pending');
  container.textContent='Đã có hồ sơ kiểm định, đang chờ chữ ký qua GitHub Environment được bảo vệ. Chưa có câu mới được kích hoạt.';
 }else{
  container.classList.add('pending');
  container.textContent='Chưa có bản phát hành học liệu được ký và xác thực. 96 câu vẫn ở trạng thái chờ phê duyệt.';
 }
 detail('Môn học','Toán 6, Tập 1 · Kết nối tri thức');
 detail('Tổng câu từ nguồn',String(candidateTotal)+' câu; đã tách tự động, không nhập lại');
 detail('Trạng thái phê duyệt sư phạm',batch.status||'Chưa có');
 detail('Đối chiếu chính xác phiên bản nguồn',hashesMatch?'Khớp SHA-256 cả hai nguồn':'Chưa có chứng thực trùng nguồn');
 detail('Khoá công khai phát hành',publicKeySetup?'Đã khai báo mã nhận diện':'Chưa cấu hình — mặc định chặn');
 detail('Trạng thái chữ ký',signed.state);
 detail('Phiên bản sử dụng',signed.version||'Chưa có bản đủ điều kiện');
 detail('SHA-256 22 bài',currentSha.lessonData);
 detail('SHA-256 5 bộ ôn tập',currentSha.chapterData);
 const list=$('approvalChapters');
 lessons.data.chapters.forEach(c=>list.append(chapterCard(c,lessons.data.lessons)));
 const root=$('exceptionList');
 if(!exclusions.length){
  root.append(el('div','approval-empty','Không có ngoại lệ bị loại trừ trong cấu hình hiện tại. Tuy nhiên, toàn bộ lô vẫn đang chờ chứng thực sư phạm; chưa có câu nào tự được coi là đã duyệt.'));
 }else{
  exclusions.forEach(item=>{
   root.append(el('div','approval-exception',(item.id||'Không rõ mã')+' · '+(item.reason||'Chưa có lý do')));
  });
 }
 if(!hashesMatch)root.append(el('div','approval-exception',
  'Cổng đang chặn: chưa có chứng cứ người kiểm định đã đối chiếu đúng SHA-256 của phiên bản học liệu hiện tại.'));
 if(!publicKeySetup)root.append(el('div','approval-exception',
  'Chưa hoàn tất thiết lập khóa ký P-256 trong GitHub Environment được bảo vệ. Không thể phát hành chỉ bằng thao tác trên trang web.'));
}catch(error){
 $('approvalState').textContent='Lỗi kiểm tra học liệu — giữ nguyên trạng thái chặn: '+String(error?.message||error);
 $('approvalState').classList.add('error');
}
})();