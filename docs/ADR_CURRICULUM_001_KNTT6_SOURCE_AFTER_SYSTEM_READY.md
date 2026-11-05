# AURA STUDY — ADR-CURRICULUM-001: Bộ sách nền Kết nối tri thức Lớp 6
Trạng thái: APPROVED INPUT / PHỤ HUYNH ĐÃ XÁC NHẬN · DESIGN ONLY, NOT DEPLOYED
Ngày xác nhận: 2026-11-05
Bối cảnh: AURA dành cho 1 học sinh lớp 6 và 1 Admin phụ huynh; 8 môn trong quy chuẩn đã chốt.

## 1. Quyết định được phụ huynh xác nhận
- Bộ sách định hướng của học sinh: **Kết nối tri thức với cuộc sống — Lớp 6 (KNTT6)**.
- Phụ huynh **chỉ cung cấp tài liệu, đề cương, bài tập, học liệu nguồn sau khi hệ thống AURA hoàn thiện**. Không yêu cầu upload/scans ngay ở giai đoạn này.
- AURA không giả định các file SGK thương mại đã được cấp phép sao chép hoặc tải về. Lưu bộ sách/nhãn chương trình như **metadata đối chiếu**, nội dung cụ thể phải dựa trên nguồn hợp lệ/được xác minh.
- Phạm vi AURA hiện tại: Toán, Ngữ văn, Tiếng Anh, Lịch sử & Địa lí, Khoa học tự nhiên, Tin học, Công nghệ, GDCD. Hình phụ huynh gửi còn có môn ngoài phạm vi hiện tại (Âm nhạc, Giáo dục thể chất, Mĩ thuật, Hoạt động trải nghiệm...), KHÔNG tự thêm vào AURA khi chưa được chọn.
- Các sách nhìn thấy trong ảnh bao gồm Toán 6 tập 1/2, Ngữ văn 6 tập 1/2, KHTN 6, Lịch sử & Địa lí 6, Tin học 6, Công nghệ 6, GDCD 6 (đều ghi Kết Nối Tri Thức); ảnh không chứng minh chính xác tên sách Tiếng Anh. Repo hiện có tài liệu `Global Success 6 Units 1–3`; giữ là nguồn đã có để kiểm tra đối chiếu, **chưa mặc định xác thực chính xác toàn bộ sách Tiếng Anh/Unit/kỳ học**.

## 2. Curriculum Map và cấu hình
- `grade = 6`
- `curriculum_framework = GDPT_2018` (phải đối chiếu cập nhật văn bản chương trình khi biên soạn)
- `default_textbook_series = KET_NOI_TRI_THUC_VOI_CUOC_SONG`
- `subjects = [TOAN, NGUVAN, TIENGANH, LSDL, KHTN, TINHOC, CONGNGHE, GDCD]`
- Mỗi môn: `textbook_series`, `book_title`, `volume`, `chapter`, `lesson`, `unit`, `curriculum_outcome`, `source_status`, `source_evidence`; những trường chưa biết phải để null hoặc `UNVERIFIED`, không đoán.
- Chưa có mốc bài học trong tuần, lịch kiểm tra, giáo viên hoặc trường được xác nhận; không tự tạo lịch như một sự thật.
- Tài liệu chuẩn hóa luôn giữ `source_provenance`, `rights_status`, `answer_state`, `gradeable_status`, `approval_status` theo bộ chuẩn tám môn.

## 3. Công việc hệ thống trước khi phụ huynh nộp tài liệu
1. Thiết kế/schema Curriculum Map theo bộ KNTT 6; nhập chỉ những tiêu đề/chủ đề có thể xác minh từ nguồn được phép hoặc chính sách mở; mọi khoảng trống ghi `AWAITING_SOURCE`.
2. Kiểm kê kho Toán, Ngữ văn và Tiếng Anh đã tồn tại, bảo toàn tài liệu gốc/đáp án/dữ liệu học sinh hiện có; kiểm tra ánh xạ với chương trình mới, không tự nâng kết quả chưa được xác minh.
3. Xây/kiểm thử pipeline INBOX → extract/QA → metadata suggestion → Admin confirm → published; không cần người dùng chuyển file theo mẫu.
4. Xây mô-đun tạo ví dụ, bài luyện **nguyên bản** từ mục tiêu học đã xác minh; đáp án/rubric phải được kiểm chứng trước khi dùng chấm điểm.
5. Triển khai 1 Student/1 Admin, local-first sync, bài ảnh viết tay Toán/Văn/English, tự luận gõ web 5 môn và Exam Engine nộp toàn bài mới chấm/hiện gợi ý.
6. Nghiệm thu trên staging với **học liệu mẫu được phép sử dụng/tự biên soạn**, không đòi hỏi upload bộ tài liệu thật trước khi triển khai xong. Sau khi đạt: phụ huynh đưa nguồn thật vào INBOX và đối chiếu bài đang học.

## 4. Không được ngộ nhận
- Chỉ biết bộ sách **không đồng nghĩa** với có sẵn toàn bộ văn bản SGK, hình, audio, đáp án hoặc quyền sao chép.
- Không tự công bố một ngân hàng đề theo toàn năm KNTT nếu dữ liệu chủ đề/kỳ chưa được xác minh.
- Không yêu cầu phụ huynh chụp/scan SGK ngay trong giai đoạn xây hạ tầng.
- Không tự đưa học liệu thử nghiệm chưa xác minh vào báo cáo năng lực thật.

## 5. Liên kết
- [Bộ chuẩn 8 môn đã duyệt](AURA_OFFICIAL_8_SUBJECT_STANDARDS_V1_APPROVED.md)
- [Chiến lược nguồn học liệu](AURA_LEARNING_CONTENT_SOURCING_V1_PROPOSAL.md)
- [Kiến trúc đơn học sinh và đồng bộ](AURA_SINGLE_LEARNER_SYNC_V1.md)

**Cam kết trạng thái:** Đây là hồ sơ cấu hình và đầu vào do phụ huynh xác nhận. Chưa triển khai vào bản production.
