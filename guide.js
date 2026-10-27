window.guide=function(){
  setActive('guide');
  document.querySelector('#app').innerHTML=`
    <section class="guide-hero">
      <div>
        <div class="guide-kicker">AURA STUDY · CẨM NANG SỬ DỤNG</div>
        <h1>Hướng dẫn sử dụng & vận hành</h1>
        <p>Một quy trình thống nhất từ tài liệu gốc trên Google Drive đến lúc bé học, làm đề, xem kết quả và ôn lại đúng phần còn yếu.</p>
        <div class="guide-actions">
          <button class="btn white" onclick="library()">Mở Thư viện</button>
          <button class="btn guide-outline" onclick="history()">Xem Kết quả</button>
        </div>
      </div>
      <div class="guide-summary">
        <b>Quy tắc cốt lõi</b>
        <span>Drive giữ tài liệu gốc</span>
        <span>INBOX là nơi tiếp nhận</span>
        <span>Nova chuẩn hóa & cập nhật</span>
        <span>AURA STUDY dùng để học – ôn – làm đề</span>
      </div>
    </section>

    <div class="guide-grid guide-start">
      <section class="card guide-card">
        <div class="guide-label">DÀNH CHO BÉ</div>
        <h2>Bắt đầu học trong 4 bước</h2>
        <div class="guide-step"><i>1</i><div><b>Mở Thư viện</b><p>Chọn môn học: Toán, Ngữ văn hoặc Tiếng Anh.</p></div></div>
        <div class="guide-step"><i>2</i><div><b>Chọn Ôn tập hoặc Đề kiểm tra</b><p>Ôn tập để luyện từng nội dung; Đề kiểm tra để làm bài hoàn chỉnh.</p></div></div>
        <div class="guide-step"><i>3</i><div><b>Làm bài và nộp</b><p>Bài đang làm được lưu trên thiết bị. Với phần được hỗ trợ, hệ thống chấm điểm tự động.</p></div></div>
        <div class="guide-step"><i>4</i><div><b>Xem lại lỗi sai</b><p>Mở Kết quả để xem điểm đã lưu, sau đó quay lại đề hoặc bài ôn liên quan.</p></div></div>
        <button class="btn primary" onclick="library()">Bắt đầu học</button>
      </section>

      <section class="card guide-card">
        <div class="guide-label">DÀNH CHO PHỤ HUYNH</div>
        <h2>Vận hành tài liệu trong 5 bước</h2>
        <div class="guide-step"><i>1</i><div><b>Đưa file mới vào 00_INBOX</b><p>PDF, DOCX hoặc ảnh có thể giữ tên gốc khi mới tải lên.</p></div></div>
        <div class="guide-step"><i>2</i><div><b>Nhắn “Nova, chuẩn hóa INBOX”</b><p>Nova phân loại, đổi tên chuẩn và xếp tài liệu vào đúng môn/nhóm.</p></div></div>
        <div class="guide-step"><i>3</i><div><b>Kiểm tra nguồn & đáp án</b><p>Không tự tạo đáp án nếu tài liệu nguồn không có. Câu thiếu dữ kiện phải được đánh dấu rõ.</p></div></div>
        <div class="guide-step"><i>4</i><div><b>Yêu cầu cập nhật AURA STUDY</b><p>Nhắn “Nova, cập nhật tài liệu mới vào AURA STUDY” khi muốn nội dung xuất hiện trên web.</p></div></div>
        <div class="guide-step"><i>5</i><div><b>Kiểm tra web sau cập nhật</b><p>Mở đúng môn, kiểm tra đề/ôn tập/hình ảnh rồi mới cho bé sử dụng.</p></div></div>
      </section>
    </div>

    <section class="card guide-section">
      <div class="guide-label">QUY TRÌNH CHUẨN</div>
      <h2>Từ tài liệu mới đến một buổi học</h2>
      <div class="guide-flow">
        <div><b>01</b><span>Tài liệu mới</span><small>Đưa vào 00_INBOX</small></div>
        <em>→</em>
        <div><b>02</b><span>Chuẩn hóa</span><small>Phân môn · đổi tên · xếp nhóm</small></div>
        <em>→</em>
        <div><b>03</b><span>Kiểm tra</span><small>Nguồn · đáp án · hình · dữ kiện</small></div>
        <em>→</em>
        <div><b>04</b><span>Cập nhật web</span><small>Đưa nội dung phù hợp vào AURA</small></div>
        <em>→</em>
        <div><b>05</b><span>Bé học</span><small>Ôn · làm đề · chấm điểm</small></div>
        <em>→</em>
        <div><b>06</b><span>Ôn lại</span><small>Xem lỗi sai · luyện lại</small></div>
      </div>
      <div class="note guide-note"><b>Không bỏ qua bước kiểm tra.</b> AURA STUDY ưu tiên tính đúng và độ tin cậy của tài liệu hơn việc đưa thật nhiều câu hỏi lên web.</div>
    </section>

    <section class="card guide-section">
      <div class="guide-label">00_INBOX</div>
      <h2>Chuẩn thư mục đang sử dụng</h2>
      <p class="meta">INBOX là vùng tiếp nhận và phân loại. Web hiện không tự đồng bộ Google Drive theo thời gian thực; việc đưa nội dung lên AURA STUDY là một bước cập nhật riêng.</p>
      <div class="guide-tree" aria-label="Cấu trúc thư mục mẫu">
        <code>00_INBOX/</code>
        <code>├─ 01_TOAN/</code>
        <code>│  ├─ 01_DE_KIEM_TRA/</code>
        <code>│  ├─ 02_ON_TAP/</code>
        <code>│  └─ 03_CONG_THUC/</code>
        <code>├─ 02_NGU_VAN/</code>
        <code>│  ├─ 01_KIEN_THUC/</code>
        <code>│  └─ 02_ON_TAP/</code>
        <code>└─ 03_TIENG_ANH/</code>
        <code>   └─ 01_ON_TAP/</code>
      </div>
      <h3>Quy ước tên file</h3>
      <div class="guide-chips">
        <span><b>L6</b> = Lớp 6</span><span><b>TOAN / NGUVAN / TIENGANH</b> = Môn</span><span><b>GK1</b> = Giữa kỳ 1</span><span><b>DE_01…</b> = Số đề</span><span><b>ON_TAP</b> = Ôn tập</span><span><b>CONG_THUC</b> = Công thức</span>
      </div>
      <div class="guide-examples">
        <code>L6_TOAN_GK1_DE_01_20261027.docx</code>
        <code>L6_TOAN_GK1_ON_TAP_BAI_TOAN_THUC_TE_20261027.docx</code>
        <code>L6_NGUVAN_NLXH.docx</code>
        <code>L6_TIENGANH_GLOBAL_SUCCESS_REVIEW_UNIT_01_02_03_KHONG_DAP_AN.docx</code>
      </div>
    </section>

    <div class="guide-grid">
      <section class="card guide-section">
        <div class="guide-label">TRÊN WEB</div>
        <h2>Khi nào dùng mục nào?</h2>
        <div class="guide-use"><b>⌂ Tổng quan</b><span>Xem nhanh các môn và điểm trung bình đã lưu.</span></div>
        <div class="guide-use"><b>▦ Thư viện</b><span>Vào môn học, mở đề kiểm tra và tài liệu ôn tập.</span></div>
        <div class="guide-use"><b>◷ Kết quả</b><span>Xem các lượt chấm đã lưu trên thiết bị hiện tại.</span></div>
        <div class="guide-use"><b>? Hướng dẫn & Vận hành</b><span>Xem lại quy trình sử dụng và quy tắc dữ liệu.</span></div>
        <div class="guide-use"><b>Sao lưu</b><span>Xuất file JSON kết quả trước khi đổi máy, xóa dữ liệu trình duyệt hoặc cần lưu bản dự phòng.</span></div>
      </section>

      <section class="card guide-section">
        <div class="guide-label">DỮ LIỆU & SAO LƯU</div>
        <h2>Điều Anh cần nhớ</h2>
        <ul class="guide-checks">
          <li><b>Google Drive</b> là nguồn tài liệu gốc.</li>
          <li>Kết quả và bài đang làm hiện lưu bằng <b>localStorage trên thiết bị</b>.</li>
          <li>Đổi điện thoại/iPad hoặc xóa dữ liệu trình duyệt có thể làm mất kết quả cục bộ.</li>
          <li>Trước khi đổi thiết bị, hãy dùng nút <b>Sao lưu</b>.</li>
          <li>File sao lưu hiện phục vụ lưu trữ kết quả; hãy giữ ở nơi an toàn.</li>
        </ul>
        <button class="btn soft" onclick="backup()">Sao lưu ngay</button>
      </section>
    </div>

    <section class="card guide-section">
      <div class="guide-label">CHẤT LƯỢNG</div>
      <h2>6 nguyên tắc vận hành AURA STUDY</h2>
      <div class="guide-principles">
        <div><b>01 · Giữ nguyên nguồn</b><p>Tài liệu gốc trên Drive không bị thay thế chỉ để phù hợp với web.</p></div>
        <div><b>02 · Không đoán đáp án</b><p>Nếu nguồn không có đáp án đáng tin cậy, hệ thống không tự bịa đáp án.</p></div>
        <div><b>03 · Thiếu dữ kiện thì khóa</b><p>Câu cần hình/kích thước nhưng chưa đủ dữ liệu không được chấm như câu hoàn chỉnh.</p></div>
        <div><b>04 · Phân biệt ảnh gốc và hình phục dựng</b><p>Hình phục dựng phải được ghi nhãn rõ, không được gọi là ảnh gốc.</p></div>
        <div><b>05 · Điểm số phải có ngữ cảnh</b><p>Điểm tự động chỉ tính trên phần hệ thống có đủ dữ kiện để chấm tin cậy.</p></div>
        <div><b>06 · Học từ lỗi sai</b><p>Sau mỗi đề, ưu tiên xem lại câu sai và ôn đúng phần yếu trước khi làm thêm nhiều đề mới.</p></div>
      </div>
    </section>

    <section class="card guide-section">
      <div class="guide-label">FAQ</div>
      <h2>Câu hỏi thường gặp</h2>
      <details class="guide-faq"><summary>Tài liệu mới đưa vào Drive có tự xuất hiện trên web không?</summary><p>Không. 00_INBOX là kho tiếp nhận. Sau khi chuẩn hóa và kiểm tra, cần một bước cập nhật AURA STUDY riêng.</p></details>
      <details class="guide-faq"><summary>Bé đang làm dở mà tải lại trang thì sao?</summary><p>Bài đang làm được lưu cục bộ trên thiết bị đối với các luồng hiện tại, nên dữ liệu đã nhập thường được giữ lại. Không xóa dữ liệu trình duyệt khi chưa sao lưu.</p></details>
      <details class="guide-faq"><summary>Tại sao có câu không được tính điểm?</summary><p>Vì AURA chỉ chấm câu có đủ dữ kiện. Câu thiếu hình hoặc thiếu thông tin cần thiết sẽ được loại khỏi phần chấm tự động thay vì đoán.</p></details>
      <details class="guide-faq"><summary>Hình phục dựng có phải ảnh gốc của đề không?</summary><p>Không. Hình phục dựng chỉ hỗ trợ một số câu nhận biết và luôn phải được ghi nhãn riêng. Hệ thống không dùng hình phục dựng để tự suy ra số liệu còn thiếu.</p></details>
      <details class="guide-faq"><summary>Khi nào nên bấm Sao lưu?</summary><p>Trước khi đổi máy, xóa dữ liệu Safari/Chrome, cài lại ứng dụng web hoặc khi Anh muốn giữ một bản dự phòng kết quả học.</p></details>
    </section>

    <section class="guide-footer-card">
      <div><b>Quy trình ngắn gọn nhất</b><span>INBOX → Nova chuẩn hóa → kiểm tra → cập nhật AURA → bé học → xem kết quả → ôn lại.</span></div>
      <button class="btn primary" onclick="library()">Vào Thư viện</button>
    </section>
  `;
};
