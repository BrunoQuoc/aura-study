/* AURA STUDY — concise Student feedback + wrong-answer explanations */
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
  function explain(entry){
    const stem=norm(entry?.stem),correct=correctText(entry),chosen=selectedText(entry),topic=norm(entry?.topic),subject=entry?.subject||'TOAN';
    let reason='',rule='';
    if(subject==='TIENGANH'){
      if(/how about/.test(stem)){rule='How about + V-ing dùng để đưa ra lời gợi ý.';reason=`Đáp án ${correct} dùng đúng cấu trúc này; ${chosen} không đúng dạng động từ yêu cầu.`}
      else if(/let.?s/.test(stem)){rule="Let's + động từ nguyên mẫu dùng để đưa ra lời gợi ý.";reason=`Đáp án ${correct} giữ động từ ở dạng nguyên mẫu; ${chosen} không đúng cấu trúc.`}
      else if(/there is|there are|pictures|rooms/.test(stem)){rule='There is đi với danh từ số ít; There are đi với danh từ số nhiều.';reason=`Đáp án ${correct} phù hợp số ít/số nhiều trong câu; ${chosen} không hòa hợp.`}
      else if(/every day|monday|tuesday|usually|often/.test(stem)){rule='Thì hiện tại đơn: chủ ngữ ngôi thứ ba số ít dùng động từ thêm -s/-es.';reason=`Đáp án ${correct} phù hợp với chủ ngữ và dấu hiệu hiện tại đơn; ${chosen} không đúng dạng động từ.`}
      else if(/between|next|under|on the wall|opposite/.test(stem)){rule='Chọn giới từ theo đúng quan hệ vị trí được mô tả.';reason=`Đáp án ${correct} diễn tả đúng vị trí trong câu; ${chosen} không khớp quan hệ vị trí.`}
      else{rule='Đối chiếu cấu trúc/từ vựng của câu với đáp án đã được xác minh.';reason=`Đáp án đúng là ${correct}. Lựa chọn ${chosen} không khớp mẫu câu hoặc nghĩa yêu cầu.`}
      return {reason,rule};
    }
    if(/n\*/.test(stem)||/tap hop.*so tu nhien.*khac 0/.test(stem)){
      rule='N* = {1; 2; 3; ...}: gồm các số tự nhiên dương và không chứa 0.';reason=`Đáp án ${correct} thỏa đúng định nghĩa N*. ${chosen} thiếu phần tử cần có, có 0 hoặc không biểu diễn đầy đủ N*.`
    }else if(/tap hop|phan tu|thuoc/.test(stem)||topic==='tap hop'){
      rule='Một phần tử thuộc tập hợp khi nó xuất hiện trong danh sách (hoặc thỏa tính chất) của tập hợp.';
      if(/[∈∉]/.test(entry?.correctText||'')) reason=`Mệnh đề ${correct} đúng khi đối chiếu trực tiếp với các phần tử của tập hợp; ${chosen} cho quan hệ thuộc/không thuộc ngược với dữ kiện.`;
      else reason=`Đáp án ${correct} thỏa điều kiện của tập hợp; ${chosen} không thỏa đầy đủ điều kiện.`;
    }else if(/lien sau/.test(stem)){
      const m=String(entry?.stem||'').match(/(?:số|so)\s+(\d+)/i);rule='Số liền sau của n là n + 1.';reason=m?`Với n = ${m[1]}, ta có ${m[1]} + 1 = ${Number(m[1])+1}, nên ${correct} là đúng; ${chosen} không phải số liền sau.`:`Áp dụng n + 1 cho số đã cho nên ${correct} đúng; ${chosen} không phải số liền sau.`;
    }else if(/luy thua|so mu|[²³⁴⁵⁶⁷⁸⁹]/.test(stem)||topic==='luy thua'){
      rule=/tich/.test(stem)?'Khi nhân hai lũy thừa cùng cơ số: a^m · a^n = a^(m+n).':'Lũy thừa a^n là tích của n thừa số bằng a.';
      reason=`Áp dụng quy tắc lũy thừa cho biểu thức, kết quả khớp ${correct}; ${chosen} xuất phát từ việc xử lý sai cơ số, số mũ hoặc phép tính.`;
    }else if(/phep chia.*du|chia co du/.test(stem)){
      const detail=divideReason(entry?.correctText||choiceText(entry,entry?.correctAnswer));rule='Phép chia có dư khi số dư khác 0 và nhỏ hơn số chia.';reason=detail?`${detail} Vì vậy ${correct} là lựa chọn đúng; ${chosen} không thỏa điều kiện số dư.`:`Kiểm tra từng phép chia: ${correct} cho số dư khác 0; ${chosen} không thỏa điều kiện của phép chia có dư.`;
    }else if(/ky hieu.*so tu nhien|tap hop cac so tu nhien.*ky hieu/.test(stem)){
      rule='Tập hợp các số tự nhiên được ký hiệu là N.';reason=`Vì vậy ${correct} là đáp án đúng; ${chosen} là ký hiệu của tập hợp/đối tượng khác.`;
    }else if(/thu tu.*phep tinh|bieu thuc.*luy thua/.test(stem)){
      rule='Không có ngoặc: lũy thừa trước → nhân/chia → cộng/trừ.';reason=`Đáp án ${correct} sắp đúng thứ tự ưu tiên phép tính; ${chosen} đặt các phép tính sai thứ tự.`;
    }else if(/le lien tiep/.test(stem)){
      rule='Hai số tự nhiên lẻ liên tiếp hơn kém nhau 2 đơn vị.';reason=`Bắt đầu từ số đã cho rồi cộng 2 liên tiếp sẽ được ${correct}; ${chosen} không giữ khoảng cách 2 giữa các số lẻ.`;
    }else if(/dien tich.*hinh chu nhat/.test(stem)){
      rule='Diện tích hình chữ nhật = chiều dài × chiều rộng.';reason=`Nhân hai kích thước trong đề sẽ cho ${correct}; ${chosen} không bằng tích chiều dài và chiều rộng.`;
    }else if(/tim x|tìm x/.test(String(entry?.stem||'').toLowerCase())){
      rule='Giải phương trình bằng phép tính ngược, rồi thay x trở lại để kiểm tra.';reason=`Giá trị trong ${correct} làm hai vế bằng nhau; ${chosen} khi thay vào không thỏa phương trình.`;
    }else if(/duong cheo vuong goc|hinh thoi/.test(stem)){
      rule='Hình thoi có bốn cạnh bằng nhau; hai đường chéo vuông góc và cắt nhau tại trung điểm.';reason=`Đáp án ${correct} phù hợp tính chất này; ${chosen} không có đầy đủ tính chất được hỏi.`;
    }else if(/tu giac.*bon canh bang nhau/.test(stem)){
      rule='Hình thoi và hình vuông đều có bốn cạnh bằng nhau.';reason=`Vì vậy ${correct} là nhóm hình thỏa điều kiện; ${chosen} chứa hình không nhất thiết có bốn cạnh bằng nhau.`;
    }else if(/hinh binh hanh/.test(stem)){
      rule='Hình bình hành có các cạnh đối song song và bằng nhau; các góc đối bằng nhau.';reason=`Đáp án ${correct} phù hợp tính chất của hình bình hành; ${chosen} không thỏa tính chất được hỏi.`;
    }else if(topic.includes('hinh')){
      rule='Đối chiếu tính chất cạnh, góc và đường chéo của hình được hỏi.';reason=`Đáp án ${correct} thỏa tính chất hình học nêu trong đề; ${chosen} không thỏa đủ điều kiện.`;
    }else{
      rule='Thực hiện đúng quy tắc của dạng bài rồi đối chiếu lại với dữ kiện đề.';reason=`Theo đáp án đã được xác minh, ${correct} là đúng. ${chosen} không thỏa kết quả/điều kiện của câu hỏi.`;
    }
    return {reason,rule};
  }

  function wrongEntries(){return Object.values(read(WRONG,{}))}
  function entryByStem(stem){const n=norm(stem);return wrongEntries().find(x=>norm(x.stem)===n)||null}
  function mathQuestionByStem(stem){
    const n=norm(stem);for(const e of (window.AURA_MATH_EXAMS||[])){for(const q of (e.mc||[])){if(norm(q.stem)===n)return q}}return null;
  }
  function boxHTML(entry){const x=explain(entry);return `<div class="wrong-explanation"><span>Vì sao sai?</span><p>${esc(x.reason)}</p><small><b>Ghi nhớ:</b> ${esc(x.rule)}</small></div>`}

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
      const entry={subject:'TOAN',topic:'',stem:q.stem,options:q.options,correctAnswer:q.answer,correctText:q.options?.['ABCD'.indexOf(q.answer)]||'',lastAnswer:got};
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