(function(){
  const REVIEWS=()=>window.AURA_REVIEWS||{};
  const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));

  const FULL_PROMPTS={
    toan_gk1_thucte:[
      'Một trường THCS tổ chức 1 280 học sinh tham quan bảo tàng. Buổi sáng có 465 học sinh tham gia. Buổi chiều có số học sinh tham gia nhiều hơn buổi sáng 175 học sinh. Hỏi còn bao nhiêu học sinh chưa tham gia tham quan?',
      'Một kho hàng có 5 600 kg gạo. Buổi sáng, kho xuất đi 1 450 kg gạo. Buổi chiều, kho nhập thêm 875 kg gạo. Hỏi cuối ngày trong kho có bao nhiêu ki-lô-gam gạo?',
      'Trong một hội chợ, gian hàng lớp 6A chuẩn bị 2 500 phần quà. Buổi sáng, lớp bán được 785 phần quà. Buổi chiều, lớp bán ít hơn buổi sáng 125 phần quà. Sau đó, lớp nhận thêm 350 phần quà từ nhà tài trợ. Hỏi cuối ngày gian hàng còn bao nhiêu phần quà?',
      'Một cửa hàng văn phòng phẩm nhập về 25 thùng vở, mỗi thùng có 48 quyển vở. Trong ngày đầu tiên, cửa hàng bán được 375 quyển. Ngày thứ hai, cửa hàng bán được số vở gấp đôi ngày đầu tiên.\na) Tính tổng số quyển vở cửa hàng đã bán trong hai ngày.\nb) Hỏi sau hai ngày, cửa hàng còn lại bao nhiêu quyển vở?',
      'Trong phong trào xây dựng thư viện xanh, khối 6 của một trường THCS có 8 lớp, mỗi lớp quyên góp được 65 quyển sách. Khối 7 quyên góp được nhiều hơn khối 6 là 180 quyển sách. Nhà trường dành ra 100 quyển sách để tặng học sinh khó khăn. Số sách còn lại được chia đều cho 10 tủ sách.\na) Tính tổng số quyển sách hai khối đã quyên góp.\nb) Hỏi mỗi tủ sách nhận được bao nhiêu quyển sách?',
      'Để tổ chức hội chợ, lớp 6A chuẩn bị 30 hộp bánh, mỗi hộp có 40 chiếc bánh. Buổi sáng, lớp bán được 325 chiếc bánh. Buổi chiều, lớp bán nhiều hơn buổi sáng 75 chiếc bánh. Số bánh còn lại được chia đều vào các túi, mỗi túi 25 chiếc bánh.\na) Tính số chiếc bánh lớp 6A còn lại sau hai buổi bán hàng.\nb) Hỏi lớp 6A đóng gói được bao nhiêu túi bánh?'
    ]
  };

  const MATH_WORKED={
    toan_gk1_thucte:[
      [
        'Số học sinh tham quan buổi chiều: 465 + 175 = 640 (học sinh).',
        'Tổng số học sinh đã tham quan: 465 + 640 = 1 105 (học sinh).',
        'Số học sinh chưa tham quan: 1 280 − 1 105 = 175 (học sinh).',
        'Đáp số: 175 học sinh.'
      ],
      [
        'Sau khi xuất 1 450 kg, số gạo còn lại: 5 600 − 1 450 = 4 150 (kg).',
        'Nhập thêm 875 kg, cuối ngày có: 4 150 + 875 = 5 025 (kg).',
        'Đáp số: 5 025 kg gạo.'
      ],
      [
        'Buổi chiều bán ít hơn buổi sáng 125 phần quà nên số bán buổi chiều: 785 − 125 = 660 (phần quà).',
        'Sau hai buổi, số phần quà còn: 2 500 − 785 − 660 = 1 055 (phần quà).',
        'Nhận thêm 350 phần quà: 1 055 + 350 = 1 405 (phần quà).',
        'Đáp số: 1 405 phần quà.'
      ],
      [
        'Tổng số vở ban đầu: 25 × 48 = 1 200 (quyển).',
        'Ngày 2 bán gấp đôi ngày 1: 375 × 2 = 750 (quyển).',
        'Tổng số vở đã bán: 375 + 750 = 1 125 (quyển).',
        'Số vở còn lại: 1 200 − 1 125 = 75 (quyển).',
        'Đáp số: 75 quyển vở.'
      ],
      [
        'Khối 6 có: 8 × 65 = 520 (quyển sách).',
        'Khối 7 có nhiều hơn khối 6 là 180 quyển nên có: 520 + 180 = 700 (quyển sách).',
        'Tổng số sách của hai khối: 520 + 700 = 1 220 (quyển).',
        'Dành riêng 100 quyển, số sách còn để chia vào tủ: 1 220 − 100 = 1 120 (quyển).',
        'Mỗi tủ có: 1 120 : 10 = 112 (quyển).',
        'Đáp số: 112 quyển sách mỗi tủ.'
      ],
      [
        'Tổng số bánh ban đầu: 30 × 40 = 1 200 (cái bánh).',
        'Buổi chiều bán nhiều hơn buổi sáng 75 cái nên bán: 325 + 75 = 400 (cái bánh).',
        'Sau hai buổi còn: 1 200 − 325 − 400 = 475 (cái bánh).',
        'Chia số bánh còn lại vào các túi, mỗi túi 25 cái: 475 : 25 = 19 (túi).',
        'Đáp số: 19 túi bánh.'
      ]
    ]
  };

  function workedSolution(sub,id,i,item){
    const steps=MATH_WORKED[id]?.[i];
    if(steps){
      return `<div class="worked-steps">${steps.map((s,k)=>`<div class="worked-step ${k===steps.length-1?'worked-answer':''}"><span>${k===steps.length-1?'✓':k+1}</span><p>${esc(s)}</p></div>`).join('')}</div>`;
    }
    return `<div class="worked-text">${esc(item?.[1]||'Chưa có lời giải.').replace(/\n/g,'<br>')}</div>`;
  }

  function relabel(root=document){
    root.querySelectorAll('#app h3').forEach(h=>{
      const t=(h.textContent||'').trim();
      if(/^📚\s*Ôn tập/i.test(t))h.textContent='📘 Bài mẫu có lời giải';
    });
    root.querySelectorAll('#app .resource').forEach(row=>{
      const btn=row.querySelector('button[onclick*="review("]');
      if(!btn)return;
      btn.textContent='Xem lời giải';
      const title=row.querySelector('.grow b');
      if(title)title.textContent=(title.textContent||'').replace(/^Ôn tập/i,'Bài mẫu');
    });
  }

  window.review=function(sub,id){
    if(typeof setActive==='function')setActive('library');
    const r=(REVIEWS()[sub]||[]).find(x=>x.id===id);if(!r)return;
    const cards=r.items.map((x,i)=>{const prompt=FULL_PROMPTS[id]?.[i]||x[0];return `<section class="card review-card"><div class="review-question-row"><div class="review-number">${i+1}</div><div class="review-question">${esc(prompt)}</div></div><details class="review-solution"><summary><span>↳</span> Xem lời giải đầy đủ</summary><div class="review-solution-box">${workedSolution(sub,id,i,x)}</div></details></section>`}).join('');
    document.getElementById('app').innerHTML=`<div class="review-page"><button class="btn soft" onclick="subject('${sub}')" style="margin-bottom:12px">← Quay lại</button><section class="card review-head"><div class="review-eyebrow">BÀI MẪU CÓ LỜI GIẢI</div><h2>${esc(r.title.replace(/^Ôn tập/i,'Bài mẫu'))}</h2><p class="meta">${esc(r.desc)} · Không chấm điểm</p></section><div class="review-list">${cards}</div></div>`;
  };

  window.saveReview=function(){};
  window.reviewCheck=function(){};

  let queued=false;
  function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;relabel()})}
  function init(){relabel();const app=document.getElementById('app');if(app)new MutationObserver(queue).observe(app,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();