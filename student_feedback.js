/* AURA STUDY — concise Student feedback + evidence-aware wrong-answer explanations */
(function(){
  if(!document.body.classList.contains('student-shell'))return;
  const WRONG='aura_wrong_book_v1';
  const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/\s+/g,' ').trim();
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(_){return f}};

  function choiceText(entry,letter){
    const i='ABCD'.indexOf(String(letter||'').trim().toUpperCase());
    return i>=0&&Array.isArray(entry?.options)?String(entry.options[i]??''):'';
  }
  function selectedText(entry){
    const L=String(entry?.lastAnswer||'').trim().toUpperCase();
    const t=choiceText(entry,L);return t?`${L}. ${t}`:(L||'Chưa trả lời');
  }
  function correctText(entry){
    const L=String(entry?.correctAnswer||'').trim().toUpperCase();
    const t=entry?.correctText||choiceText(entry,L);return t?`${L}. ${t}`:(L||'');
  }
  function divideReason(text){
    const m=String(text||'').match(/(\d+)\s*:\s*(\d+)/);if(!m)return'';
    const a=Number(m[1]),b=Number(m[2]);if(!b)return'';
    const q=Math.floor(a/b),r=a%b;return `${a} : ${b} = ${q} dư ${r}. Vì số dư ${r}${r?' khác 0':' bằng 0'}, phép chia này ${r?'có dư':'là phép chia hết'}.`;
  }
  function explicitExplanation(entry){
    const reason=String(entry?.explanation||entry?.reason||'').trim();
    const rule=String(entry?.rule||entry?.remember||'').trim();
    if(!reason&&!rule)return null;
    return {
      reason:reason||`Đáp án đúng là ${correctText(entry)}.`,
      rule:rule||'Đối chiếu lại lời giải/metadata của câu hỏi.',
      source:String(entry?.explanationSource||'Lời giải/metadata của câu hỏi')
    };
  }
  function explain(entry){
    const explicit=explicitExplanation(entry);if(explicit)return explicit;
    const stem=norm(entry?.stem),correct=correctText(entry),chosen=selectedText(entry),topic=norm(entry?.topic),subject=entry?.subject||'TOAN';
    let reason='',rule='',source='Quy tắc xác định từ dữ kiện câu hỏi';

    /* Only use deterministic rules here. Do not infer a learner's misconception. */
    if(subject==='TOAN'){
      if(/n\*/.test(stem)||/tap hop.*so tu nhien.*khac 0/.test(stem)){
        rule='N* = {1; 2; 3; ...}: gồm các số tự nhiên dương và không chứa 0.';
        reason=`Đối chiếu định nghĩa N*, đáp án ${correct} thỏa điều kiện; lựa chọn ${chosen} không khớp định nghĩa.`;
      }else if(/tap hop|phan tu|thuoc/.test(stem)||topic==='tap hop'){
        rule='Một phần tử thuộc tập hợp khi nó xuất hiện trong danh sách hoặc thỏa tính chất xác định của tập hợp.';
        reason=`Đối chiếu trực tiếp dữ kiện của tập hợp cho thấy ${correct} là đúng; ${chosen} không thỏa quan hệ được hỏi.`;
      }else if(/lien sau/.test(stem)){
        const m=String(entry?.stem||'').match(/(?:số|so)\s+(\d+)/i);rule='Số liền sau của n là n + 1.';
        reason=m?`Với n = ${m[1]}, ta có ${m[1]} + 1 = ${Number(m[1])+1}, nên ${correct} là đúng; ${chosen} không phải số liền sau.`:`Áp dụng n + 1 cho số đã cho nên ${correct} đúng; ${chosen} không phải số liền sau.`;
      }else if(/luy thua|so mu|[²³⁴⁵⁶⁷⁸⁹]/.test(stem)||topic==='luy thua'){
        rule=/tich/.test(stem)?'Khi nhân hai lũy thừa cùng cơ số: a^m · a^n = a^(m+n).':'Lũy thừa a^n là tích của n thừa số bằng a.';
        reason=`Áp dụng quy tắc lũy thừa cho biểu thức cho kết quả ${correct}; ${chosen} không bằng kết quả theo quy tắc này.`;
      }else if(/phep chia.*du|chia co du/.test(stem)){
        const detail=divideReason(entry?.correctText||choiceText(entry,entry?.correctAnswer));rule='Phép chia có dư khi số dư khác 0 và nhỏ hơn số chia.';
        reason=detail?`${detail} Vì vậy ${correct} là lựa chọn đúng; ${chosen} không thỏa điều kiện số dư.`:`Đối chiếu phép chia cho thấy ${correct} thỏa điều kiện có dư; ${chosen} không thỏa điều kiện này.`;
      }else if(/ky hieu.*so tu nhien|tap hop cac so tu nhien.*ky hieu/.test(stem)){
        rule='Tập hợp các số tự nhiên được ký hiệu là N.';reason=`Vì vậy ${correct} là đáp án đúng; ${chosen} không phải ký hiệu được hỏi.`;
      }else if(/thu tu.*phep tinh|bieu thuc.*luy thua/.test(stem)){
        rule='Không có ngoặc: lũy thừa trước → nhân/chia → cộng/trừ.';reason=`Đối chiếu thứ tự thực hiện phép tính cho thấy ${correct} đúng; ${chosen} không đúng thứ tự ưu tiên.`;
      }else if(/le lien tiep/.test(stem)){
        rule='Hai số tự nhiên lẻ liên tiếp hơn kém nhau 2 đơn vị.';reason=`Dùng khoảng cách 2 giữa các số lẻ liên tiếp cho kết quả ${correct}; ${chosen} không thỏa điều kiện này.`;
      }else if(/dien tich.*hinh chu nhat/.test(stem)){
        rule='Diện tích hình chữ nhật = chiều dài × chiều rộng.';reason=`Nhân hai kích thước trong đề cho ${correct}; ${chosen} không bằng tích chiều dài và chiều rộng.`;
      }else if(/tim x|tìm x/.test(String(entry?.stem||'').toLowerCase())){
        rule='Giải phương trình bằng phép tính ngược, rồi thay x trở lại để kiểm tra.';reason=`Thay giá trị trong ${correct} vào biểu thức làm điều kiện của đề được thỏa mãn; ${chosen} không thỏa khi kiểm tra lại.`;
      }else if(/duong cheo vuong goc|hinh thoi/.test(stem)){
        rule='Hình thoi có bốn cạnh bằng nhau; hai đường chéo vuông góc và cắt nhau tại trung điểm.';reason=`Đối chiếu tính chất hình thoi cho thấy ${correct} phù hợp; ${chosen} không thỏa tính chất được hỏi.`;
      }else if(/tu giac.*bon canh bang nhau/.test(stem)){
        rule='Hình thoi và hình vuông đều có bốn cạnh bằng nhau.';reason=`Theo tính chất hình học, ${correct} là lựa chọn thỏa điều kiện; ${chosen} chứa hình không bắt buộc có bốn cạnh bằng nhau.`;
      }else if(/hinh binh hanh/.test(stem)){
        rule='Hình bình hành có các cạnh đối song song và bằng nhau; các góc đối bằng nhau.';reason=`Đối chiếu tính chất hình bình hành cho thấy ${correct} phù hợp; ${chosen} không thỏa tính chất được hỏi.`;
      }
    }

    if(reason&&rule)return {reason,rule,source};
    return {
      reason:`Đáp án đã được xác minh là ${correct}. AURA chưa có lời giải nguồn đủ chi tiết để kết luận chính xác vì sao lựa chọn ${chosen} sai.`,
      rule:'Đối chiếu lại đáp án nguồn và phần kiến thức liên quan; AURA không suy đoán nguyên nhân khi thiếu lời giải chi tiết.',
      source:'Đáp án đã xác minh · chưa có lời giải nguồn chi tiết'
    };
  }

  function wrongEntries(){return Object.values(read(WRONG,{}))}
  function entryByStem(stem){const n=norm(stem);return wrongEntries().find(x=>norm(x.stem)===n)||null}
  function mathQuestionByStem(stem){
    const n=norm(stem);for(const e of (window.AURA_MATH_EXAMS||[])){for(const q of (e.mc||[])){if(norm(q.stem)===n)return q}}return null;
  }
  function enrichEntry(entry){
    if(!entry)return entry;
    const q=mathQuestionByStem(entry.stem);
    return q?{...entry,rule:entry.rule||q.rule||'',explanation:entry.explanation||q.explanation||'',explanationSource:entry.explanationSource||q.explanationSource||''}:entry;
  }
  function boxHTML(entry){
    const x=explain(enrichEntry(entry));
    return `<div class="wrong-explanation"><span>Vì sao sai?</span><p>${esc(x.reason)}</p><small><b>Ghi nhớ:</b> ${esc(x.rule)}</small><small class="wrong-explanation-source">Nguồn: ${esc(x.source)}</small></div>`;
  }

  function enhanceStoredWrong(){
    document.querySelectorAll('#app .wrong-item,#app .wrong-practice-result').forEach(card=>{
      if(card.querySelector('.wrong-explanation'))return;
      const stem=card.querySelector('h3')?.textContent||'',entry=entryByStem(stem);if(!entry)return;
      const anchor=card.querySelector('.wrong-practice-answer-row')||card.querySelector('details')||card.querySelector('.okbox')||card.querySelector('h3');
      if(anchor)anchor.insertAdjacentHTML('afterend',boxHTML(entry));
    });
  }
  function enhanceImmediateExamResult(){
    document.querySelectorAll('#app .card').forEach(card=>{
      if(card.matches('.wrong-item,.wrong-practice-result')||card.querySelector('.wrong-explanation'))return;
      const bad=card.querySelector('b.bad');if(!bad)return;
      const stem=card.querySelector('p')?.textContent?.trim();if(!stem)return;
      const q=mathQuestionByStem(stem);if(!q||!q.answer)return;
      const m=(bad.textContent||'').match(/:\s*([ABCD])/i),got=m?.[1]?.toUpperCase()||'';
      const entry={subject:'TOAN',topic:q.skill||'',stem:q.stem,options:q.options,correctAnswer:q.answer,correctText:q.options?.['ABCD'.indexOf(q.answer)]||'',lastAnswer:got,rule:q.rule||'',explanation:q.explanation||'',explanationSource:q.explanationSource||''};
      const anchor=card.querySelector('.okbox')||card.querySelector('p');if(anchor)anchor.insertAdjacentHTML('afterend',boxHTML(entry));
    });
  }

  function syncMobileActive(){
    const active=document.querySelector('.side .navbtn.active')?.dataset.page||'';
    const map={home:/home\s*\(/,library:/library\s*\(|studentReviewHub\s*\(/,lessons:/lessons?\s*\(/,generator:/generator\s*\(/,history:/history\s*\(/};
    document.querySelectorAll('.mobilebar button').forEach(b=>{const oc=b.getAttribute('onclick')||'',re=map[active];b.classList.toggle('is-active',!!(re&&re.test(oc)))})
  }
  const baseSetActive=window.setActive;
  if(typeof baseSetActive==='function'&&!baseSetActive.__auraStudentFeedback){
    const wrapped=function(page,...rest){const out=baseSetActive.call(this,page,...rest);requestAnimationFrame(syncMobileActive);return out};
    wrapped.__auraStudentFeedback=true;window.setActive=wrapped;
  }

  let queued=false;
  function refresh(){enhanceStoredWrong();enhanceImmediateExamResult();syncMobileActive()}
  function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;refresh()})}
  function init(){refresh();const app=document.getElementById('app');if(app)new MutationObserver(queue).observe(app,{childList:true,subtree:true});document.addEventListener('change',e=>{if(e.target.matches('#app input[type="radio"],#app input[type="checkbox"],#app select'))queue()})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();