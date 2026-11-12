# AURA STUDY — Stage 2C | Kiểm định câu hỏi trước Question Bank

**Ngày:** 2026-11-12 | **Nguồn:** DOCX gốc riêng tư từ AURA STUDY 00_INBOX.

## Kết quả kiểm toán nguồn gốc (không phải đáp án được trường cấp)

Dùng ZIP trích xuất riêng tư Stage 2B, công cụ \`scripts/build-question-review-packet.py\` phân tách:
- 5 đề Toán 6 giữa kỳ I thành **50 câu trắc nghiệm + 28 bài tự luận**;
- Gắn **18/18 ảnh nhúng** về mã câu theo thứ tự paragraph/OOXML trong file gốc;
- Mỗi đơn vị có source filename, SHA-256 file gốc, mã câu, trích đoạn text và vị trí ảnh \`sourceBlockIndex\`.

Mọi bản trích xuất có \`sourceAnswerProvided=false\`, \`sourceRubricProvided=false\`, \`publishEnabled=false\`. Trong Word gốc không tìm được bộ đáp án/thang điểm chính thức để xác minh; bản giải độc lập nếu có chỉ là **tài liệu nháp để giáo viên đối chiếu**, không được coi là đáp án nguồn. 18/18 image relationships tồn tại không bảo đảm đã chọn đúng đáp án hoặc phản ánh đúng lớp học: người duyệt phải nhìn ảnh từng câu.

### Năm vị trí cần đặc biệt chú ý

| Item ID | Vấn đề | Hành động |
| --- | --- | --- |
| \`M6-GK1-DE02-MCQ03\` | Hai phương án C và D lặp cùng nội dung sai | Giáo viên sửa phương án để bảo đảm chất lượng |
| \`M6-GK1-DE02-ESSAY04\` | Giá lưới theo m², thiếu chiều cao để tính diện tích hàng rào | Giữ chặn, hỏi lại bản gốc |
| \`M6-GK1-DE04-MCQ04\` | Đồng hồ có viền lục giác nhưng mặt số tròn; hỏi "mặt đồng hồ" mơ hồ | Viết rõ hỏi viền hay mặt số |
| \`M6-GK1-DE04-ESSAY06\` | Hình vuông cạnh 8 cm nhưng đường chéo 10 cm; mâu thuẫn | Giữ chặn, chỉnh dữ kiện nguồn |
| \`M6-GK1-DE05-ESSAY06\` | Tính đường chéo hình thoi từ cạnh và đường chéo dùng Pythagore | Rà soát mức kiến thức lớp 6 và ma trận |

## Bàn kiểm định riêng trong Admin

Mở **Admin → Nguồn Drive → Mở bàn kiểm định câu hỏi**, hoặc trực tiếp \`admin-question-review.html\`.

1. Tải \`Math6_GK1_review_packet.json\` vào Files trên iPad, chọn trong mục **01 · Nạp hồ sơ**. Đây là file **riêng tư**, không commit vào GitHub.
2. Duyệt từng câu theo bản Word, đối chiếu hình, đáp án/lời giải, thang điểm và các cảnh báo. Điều kiện rà soát cục bộ:
   - Có người kiểm tra và xác nhận hình đúng (hoặc giải thích không có hình);
   - Có đáp án độc lập kèm chứng cứ; MCQ chọn A–D;
   - Nhập điểm tối đa và rubric theo bước, kèm căn cứ/phê duyệt;
   - Cảnh báo phải được giải trình bằng ghi chú, không tự bỏ chặn;
   - Cả ba nhóm xác nhận bắt buộc.
3. Ghi nhận nội bộ và **Xuất biên bản JSON**. File biên bản chỉ chứa mã câu, SHA-256 nguồn và quyết định/điểm còn chặn, không chứa nguyên văn câu hay ảnh. Có thể nạp lại biên bản khi trở lại; nếu SHA nguồn đổi, quyết định cũ không được tái dùng.
4. Dù hoàn tất tất cả checklist, trạng thái chỉ là **LOCAL_REVIEW_COMPLETE_NOT_AUTHORIZED**. \`eligibleForQuestionBank=false\`, \`autoGradingAllowed=false\`. Hiện **không có nút/phương thức gửi vào Question Bank**.

**Giới hạn bảo mật:** Trang ở GitHub Pages không có server-side xác thực Admin. Bản ghi người duyệt nhập vào chỉ là thông tin cục bộ, không phải chữ ký hoặc phê duyệt của trường. Trang có CSP \`connect-src 'none'\` và không lưu nội dung đề/ảnh/token trong localStorage; vì vậy phải xuất biên bản trước khi rời trang. Gói JSON nguồn chứa ảnh/văn bản, cần giữ riêng tư.

## Tạo gói JSON từ bản capture gốc

Trên máy tin cậy có bản trích xuất ZIP riêng tư của AURA và repository hiện tại:

    python3 scripts/build-question-review-packet.py \
      /path/to/AURA_STUDY_Stage2B_Private_Source_Capture_20261112.zip \
      --output .aura_private/stage2c/Math6_GK1_review_packet.json

Gói JSON có 78 đơn vị và 18 liên kết hình. Tiêu chuẩn kiểm thử gồm Node unit state machine, Python synthetic ZIP builder và Chromium mock iPad/phone/desktop, **không dùng file học liệu thật trong CI**.

## Hạng mục tiếp theo, tuyệt đối không đánh dấu GO trước khi hoàn thành

- Admin (người có quyền thật) xác minh hình so với đề gốc và trả lời/điểm từng câu.
- Kiểm tra tất cả 5 vấn đề nguồn; tạo bản cập nhật nguồn có SHA mới, không tự tái dùng quyết định bản cũ.
- Có bộ đáp án và rubric đã ký/duyệt nguồn, tổng điểm bài thi khớp 10 và tiêu chí chấm cụ thể.
- Thiết kế cơ chế duyệt có đăng nhập server, audit log, hai người kiểm định độc lập hoặc người duyệt cuối, trạng thái version, rollback.
- Xây dựng staging-only importer có validation tại server cho question schema/image QA/answer rubric/curriculum và kiểm thử Exam Engine trước mọi publish.
- Chỉ khi các gate production Supabase và kiểm thử iPad Safari thật đủ PASS mới quyết định bật tự động Question Bank.

Không thay đổi Phân kỳ, nguồn Drive, dữ liệu học sinh hay Exam Engine trong Stage 2C này.
