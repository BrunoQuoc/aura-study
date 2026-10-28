/* AURA STUDY — Restore Math GK1 Exam 1 from verified Drive source. */
(function(){
  const exams=window.AURA_MATH_EXAMS||[];
  const i=exams.findIndex(x=>x&&x.id==='de1');
  const de1={
    id:'de1',
    title:'Giữa kỳ I – Đề số 1',
    verified:true,
    ready:true,
    desc:'10 câu trắc nghiệm + 5 bài tự luận • THCS Chánh Hưng',
    mc:[
      {stem:'Viết tập hợp B = {x ∈ N* | x ≤ 7} bằng cách liệt kê các phần tử:',options:['B = {1;2;3;4;5;6;7}','B = {1;2;3;4;5;6}','B = {0;1;2;3;4;5;6;7}','B = {1;3;5;7}'],answer:'A',needsImage:false,note:null},
      {stem:'Cho tập hợp A = {1; 2; a; b}, khẳng định nào dưới đây SAI?',options:['1 ∈ A','a ∈ A','5 ∉ A','b ∉ A'],answer:'D',needsImage:false,note:null},
      {stem:'Cho số tự nhiên x, biết x + 20 = 55. Khi đó:',options:['x = 20','x = 25','x = 30','x = 35'],answer:'D',needsImage:false,note:null},
      {stem:'Phép tính 3⁴⁰·3²⁰⁰ : 3⁵⁰ có kết quả là:',options:['3⁵⁴','3¹⁰⁰','3⁵⁰','3¹⁹⁰'],answer:'D',needsImage:false,note:null},
      {stem:'Kết quả của phép tính 88 + 3 + 12 là:',options:['103','113','112','122'],answer:'A',needsImage:false,note:null},
      {stem:'Ba số tự nhiên liên tiếp giảm dần là:',options:['62; 61; 60','57; 55; 53','60; 61; 62','67; 56; 54'],answer:'A',needsImage:false,note:null},
      {stem:'Thứ tự thực hiện các phép tính trong một biểu thức không có dấu ngoặc, có các phép tính cộng, trừ, nhân, chia và nâng lên lũy thừa là:',options:['Nhân, chia → Cộng, trừ → Lũy thừa','Lũy thừa → Cộng, trừ → Nhân, chia','Lũy thừa → Nhân, chia → Cộng, trừ','Nhân, chia → Lũy thừa → Cộng, trừ'],answer:'C',needsImage:false,note:null},
      {stem:'Trong hình chữ nhật, khẳng định nào sau đây đúng?',options:['Hai đường chéo bằng nhau và cắt nhau tại trung điểm của mỗi đường.','Hai đường chéo không bằng nhau.','Hai đường chéo song song với nhau.','Hai đường chéo vuông góc với nhau.'],answer:'A',needsImage:false,note:null},
      {stem:'Tính chất nào không phải là của hình thang cân?',options:['Hai đường chéo bằng nhau.','Có các góc đối bằng nhau.','Có hai cạnh đáy song song.','Có hai cạnh bên bằng nhau.'],answer:'B',needsImage:false,note:null},
      {stem:'Yếu tố nào sau đây không phải của hình thoi?',options:['Hai đường chéo vuông góc với nhau.','Có 4 cạnh bằng nhau.','Hai cặp cạnh đối diện song song với nhau.','Có 4 góc vuông.'],answer:'D',needsImage:false,note:null}
    ],
    essay:[
      {prompt:'Bài 1. Thực hiện các phép tính sau:\na) 25·35 + 25·73 – 25·8\nb) 3³ – 2⁸ : 2⁵ + 6·5²\nc) 107 – {38 + [7·3² – 24 : 6 + (9 – 7)³]} : 15\nd) Tìm x, biết: 2ˣ + 2ˣ⁺¹ = 24',solution:'a) 2500\nb) 169\nc) 100\nd) x = 3',note:null},
      {prompt:'Bài 2. Mẹ Lan mang 160 000 đồng vào siêu thị mua 2 kg khoai tây và 5 kg gạo. Giá mỗi kilogram khoai tây là 24 500 đồng, mỗi kilogram gạo là 21 000 đồng. Hỏi mẹ Lan còn lại bao nhiêu tiền?',solution:'Tiền khoai tây: 2 × 24 500 = 49 000 đồng.\nTiền gạo: 5 × 21 000 = 105 000 đồng.\nTổng tiền: 154 000 đồng.\nCòn lại: 160 000 – 154 000 = 6 000 đồng.',note:null},
      {prompt:'Bài 3. Lớp 6A thực hiện kế hoạch nhỏ, mỗi ngày 5 kg giấy vụn. Sau 2 tuần thực hiện các bạn đem bán số giấy vụn đã quyên góp được với giá mỗi kg là 15 000 đồng. Sau khi thực hiện kế hoạch nhỏ các bạn đã thu được bao nhiêu tiền? (biết 1 tuần là 7 ngày)',solution:'2 tuần = 14 ngày.\nKhối lượng giấy vụn: 14 × 5 = 70 kg.\nSố tiền thu được: 70 × 15 000 = 1 050 000 đồng.',note:null},
      {prompt:'Bài 4. Trong một khu vườn hình chữ nhật, người ta làm một lối đi lát sỏi với các kích thước như hình vẽ sau.\na) Tính diện tích lối đi.\nb) Chi phí cho mỗi mét vuông làm lối đi hết 120 nghìn đồng. Hỏi chi phí để làm lối đi là bao nhiêu?',solution:'CẦN HÌNH GỐC để xác định các kích thước và tính diện tích lối đi.',note:'Bài này phụ thuộc hình vẽ/kích thước nguồn nên chưa đủ dữ kiện để tính chính xác.'},
      {prompt:'Bài 5. Quan sát hình bên.\na) Em hãy mô tả về cạnh, góc và đường chéo của hình bình hành ABCD. Nêu các cạnh song song, cạnh bằng nhau.\nb) Hình bình hành ABCD có cạnh AB = 5 cm và cạnh BC = 3 cm. Tính cạnh CD, AD.',solution:'a) AB ∥ CD, AD ∥ BC; AB = CD, AD = BC; các góc đối bằng nhau; hai đường chéo cắt nhau tại trung điểm mỗi đường.\nb) CD = 5 cm; AD = 3 cm.',note:null}
    ]
  };
  if(i>=0)exams[i]=de1;else exams.unshift(de1);

  function removeLegacyImageNote(){
    document.querySelectorAll('#app .note').forEach(el=>{
      const t=(el.textContent||'').trim();
      if(t.startsWith('Hình ảnh:')&&t.includes('hệ thống ưu tiên ảnh gốc'))el.remove();
    });
  }
  const app=document.querySelector('#app');
  if(app){removeLegacyImageNote();new MutationObserver(removeLegacyImageNote).observe(app,{childList:true,subtree:true});}
})();
