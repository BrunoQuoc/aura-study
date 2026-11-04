# AURA STUDY — ADR-NGUVAN-001: Chốt mô hình học Ngữ văn
Ngày phê duyệt: 2026-11-04
Trạng thái: APPROVED DESIGN · Chưa triển khai production
Phạm vi: 01 học sinh lớp 6; 01 Admin phụ huynh; học cùng hoặc khác thiết bị; local-first và đồng bộ đáng tin cậy.

## 1. Quyết định đã chốt
Môn Ngữ văn vận hành theo chu trình:
**Đọc hiểu → Tự xây dàn ý → Viết trên giấy → Chụp ảnh nộp đúng câu → Nhận dạng và chấm theo rubric → Nhận xét cụ thể → Hiện gợi ý sau chấm → Tự sửa/viết lần 2 → Đối chiếu tiến bộ.**

Mục tiêu là nâng năng lực đọc, lập luận, diễn đạt và tự sửa của học sinh; không chỉ tăng điểm số hoặc tạo bài văn mẫu.

## 2. Thiết kế trải nghiệm Student
- Mỗi câu tự luận có ô đính kèm ảnh riêng; hỗ trợ chụp ảnh, tải ảnh, nhiều trang, sắp thứ tự, xem trước, xoay/chụp lại và tình trạng ảnh.
- Ảnh gốc giữ nguyên; nhận dạng chữ viết tay tiếng Việt là bản trích xuất có thể sai, không phải chứng cứ thay thế ảnh gốc. Bài/đề chưa nộp không để lộ bài mẫu.
- Khi nộp toàn bài, AURA ghi bản nháp và ảnh vào bộ nhớ offline, sau đó đồng bộ khi có mạng. Thể hiện rõ trạng thái Đã lưu trên máy / Đang đồng bộ / Đã nhận trên máy chủ / Đang chấm.
- Khi ảnh mờ, cắt chữ, thiếu trang, hoặc không thể nhận dạng tin cậy: yêu cầu chụp lại hoặc Admin xem; không mặc định chấm 0.
- Bài đã chấm sẽ hiển thị điểm theo từng tiêu chí, lời nhận xét dựa trên nội dung thực tế, 1–3 ưu tiên cần sửa, dàn ý/đoạn tham khảo **chỉ sau khi đã chấm**, và nút Nộp bản sửa lần 2.
- Với đề nhiều câu, chỉ mở đáp án gợi ý sau khi cả đề đã nộp và có kết quả chấm theo chính sách bài. Không lộ đáp án các câu chưa nộp.

## 3. Sáu năng lực và tính năng phát triển
1. **Đọc hiểu có chứng cứ:** trả lời câu hỏi, chọn và giải thích chi tiết trong văn bản chứng minh nhận xét.
2. **Lập dàn ý:** xác định yêu cầu đề, ý chính, dẫn chứng, trình tự bố cục; không đưa trước bài mẫu đầy đủ.
3. **Tự luận viết tay và chấm rubric:** nhận dạng từ ảnh, chấm nội dung, dẫn chứng, lập luận, tổ chức ý, diễn đạt/chính tả theo rubric phiên bản đã duyệt.
4. **Viết lại lần 2:** cùng câu hỏi, giữ liên kết original_response_id, nhận xét những thay đổi do học sinh tự viết; chỉ so sánh dựa trên cùng rubric và ảnh chứng cứ.
5. **Sổ lỗi diễn đạt:** lặp từ, câu thiếu liên kết, dùng từ sai, thiếu dẫn chứng... Sinh bài luyện ngắn có căn cứ và ghi nhận tiến bộ.
6. **Nói và nghe:** bài kể lại/diễn đạt ý bằng ghi âm, đánh giá rõ ràng có giới hạn, không suy diễn phẩm chất hay tâm lý từ giọng nói.

## 4. Kiểm soát chất lượng chấm
- Rubric cấp câu hỏi có `rubric_id`, `rubric_version`, `criterion_weights`, `max_score`, `question_id`, `source_evidence` và `exam_snapshot_version`. Trọng số không cố định cho mọi đề.
- AI tạo chấm điểm **sơ bộ** có dẫn chứng từ bài viết. Cho phép nhiều cách diễn đạt đúng, không so khớp cứng với bài văn mẫu.
- Điểm sơ bộ phải ghi rõ trạng thái; điểm/đánh giá thiếu chắc chắn cần Admin xác minh trước khi tính là điểm chính thức trong báo cáo năng lực/Weakness Map.
- Admin có thể xem ảnh, bản OCR, rubric, điểm từng tiêu chí; xác nhận hoặc sửa điểm và ghi lý do, có audit trail.
- Không xem lỗi OCR như lỗi chính tả của con; không kết luận tâm lý/tính cách từ bài viết.
- Đáp án gợi ý là **định hướng và ví dụ**, không phải tiêu chuẩn câu chữ duy nhất; không dùng để viết hộ bản sửa của học sinh.

## 5. Parent Admin theo dõi
- Xem bài gốc, từng lượt nộp và ảnh theo câu; điểm AI sơ bộ và điểm đã xác minh phải phân biệt.
- Dashboard riêng cho: đọc hiểu, tìm dẫn chứng, lập dàn ý, lập luận/phân tích, diễn đạt, chính tả. Có thể bổ sung nói/nghe khi có dữ liệu.
- Chỉ tính năng lực từ lượt chấm đủ tin cậy; so sánh bản viết 1 và 2 cùng yêu cầu/tiêu chí; so sánh theo thời gian phải xét độ khó đề.
- Gợi ý ôn tập tập trung vào lỗi nổi trội (ví dụ dẫn chứng còn yếu), không chỉ hiển thị điểm trung bình môn.

## 6. Roadmap đã chốt
- **P0:** chụp nhiều ảnh theo câu → lưu/offline/sync tin cậy → OCR có kiểm tra chất lượng → rubric chấm AI sơ bộ → Admin xác minh → gợi ý mở sau chấm → bài viết lại lần 2.
- **P1:** luyện đọc hiểu có dẫn chứng, lập dàn ý, sổ lỗi diễn đạt, dashboard năng lực Ngữ văn và tiến bộ giữa hai lượt viết.
- **P2:** luyện nói/nghe và hoạt động bổ trợ, sau khi P0 ổn định.
- Không làm thêm lớp patch login, không sửa production trước khi có backend, thử nghiệm thật và kế hoạch rollback.

## 7. Kiểm thử nghiệm thu
1. Student nộp câu tự luận 2 ảnh đúng thứ tự; refresh/mất mạng không mất ảnh; reconnect không tạo lượt nộp trùng.
2. Nộp ảnh mờ/chữ khó đọc: chuyển chụp lại hoặc review, tuyệt đối không 0 điểm.
3. Rubric đã xác nhận cho phép chấm theo tiêu chí, gắn dẫn chứng chính xác từ bài viết; phân biệt AI sơ bộ và Admin xác nhận.
4. Không thể mở đáp án gợi ý trước khi nộp/chấm theo chính sách đề.
5. Con tự sửa bài, nộp bản 2; AURA chỉ ra thay đổi có chứng cứ, giữ cả hai bản.
6. Admin trên thiết bị khác nhìn được ảnh gốc, lịch chấm và tiến bộ đã đồng bộ.
7. Ảnh bài của trẻ và điểm số ở lưu trữ riêng tư, không có link công khai; phân quyền Student/Admin thực thi ở server.
8. Nội dung mẫu chỉ là tham khảo, không bắt buộc trùng câu chữ; số liệu dashboard không trộn kết quả chưa xác minh vào năng lực chính thức.

## 8. Liên kết
- [Ngữ văn tự luận viết tay](AURA_NGUVAN_HANDWRITTEN_GRADING_V1.md)
- [Bộ chuẩn 8 môn](AURA_CONTENT_STANDARD_8_SUBJECTS_V1.md)
- [Kiến trúc 1 học sinh và đồng bộ](AURA_SINGLE_LEARNER_SYNC_V1.md)

**Lưu ý:** Đây là quyết định thiết kế được phụ huynh chốt. Chưa phải tính năng đang hoạt động trên AURA production.
