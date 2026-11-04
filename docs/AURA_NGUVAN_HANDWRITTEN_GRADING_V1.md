# AURA STUDY — Ngữ văn: tự luận viết tay, nộp ảnh theo câu, chấm có kiểm chứng
Version: 1.0 · 2026-11-04
Status: DESIGN SPECIFICATION ONLY. NOT IMPLEMENTED IN PRODUCTION.
Parent/Admin: 1. Learner: 1. Supports same or different devices; local-first with reliable sync.

## 1. Quyết định sản phẩm
- Với các câu tự luận Ngữ văn, học sinh có thể **viết trên giấy** thay vì gõ bài dài vào ứng dụng.
- **Mỗi câu hỏi có ô đáp án riêng** để chụp ảnh hoặc tải ảnh bài làm viết tay, hỗ trợ nhiều ảnh nếu câu trả lời dài nhiều trang.
- Sau khi bấm Nộp bài, AURA phân tích chữ viết, đánh giá theo rubric đã phê duyệt, sau đó mới tiết lộ **nhận xét, hướng cải thiện, dàn ý/đáp án gợi ý**. Không hiện đáp án gợi ý hoặc đáp án mẫu trước khi kết thúc bài kiểm tra.
- Bản ảnh gốc là bằng chứng chính. AURA không tự sửa chính tả trong ảnh và không tự thay bài viết của học sinh bằng văn bản AI tạo.
- Tự luận mở không có một đáp án duy nhất; bài gợi ý là **một cách làm tham khảo**, không phải câu chữ bắt buộc để đạt điểm.
- Chấm tự động là **AI-assisted, provisional** trừ khi quy tắc và bằng chứng đã đạt chuẩn. Admin được xem lại, sửa điểm cùng lý do. Điểm chưa tin cậy không tự động đóng góp vào bản đồ năng lực.
- Không tự suy luận tính cách/hành vi học sinh từ bài viết.

## 2. UX Student theo từng câu
`Câu 3 — Viết đoạn văn khoảng 5–7 câu ... (5 điểm)`
1. Hiện nội dung đề, tiêu chí công khai, giới hạn thời gian nếu là bài kiểm tra.
2. Tại **Ô trả lời câu 3**, có nút `Chụp bài viết` hoặc `Tải ảnh`.
3. Xem trước từng ảnh, crop/xoay/chụp lại, thêm trang; hiển thị thứ tự trang, số ảnh, trạng thái ảnh đọc được.
4. Nếu có OCR: cung cấp bản chép máy để học sinh kiểm tra; học sinh có thể đánh dấu sai nhận dạng; **ghi cả ảnh gốc, bản OCR và lịch sử chỉnh sửa**, không cho nhập văn bản hoàn toàn mới thay cho bằng chứng ảnh trong bài kiểm tra.
5. Học sinh nhấn **Nộp bài** một lần; thiết bị lưu nguyên ảnh, manifest ảnh, ID câu hỏi, phiên bản đề và event ID duy nhất vào IndexedDB trước khi báo `Đã lưu trên máy`; khi online upload object an toàn đến server; tiếp tục tiến trình `Đang đồng bộ` → `Đang chấm`.
6. Với **đề nhiều câu**, câu trả lời, nhận xét và gợi ý được giữ kín đến khi học sinh nộp **toàn bài** hoặc Admin cho phép kết thúc phiên; không tiết lộ từng đáp án để tránh làm lộ câu còn lại.
7. Sau khi chấm xong: xem điểm và rubric theo tiêu chí (nếu grade provisional ghi rõ `Điểm AI sơ bộ`), nhận xét điểm làm tốt / cần cải thiện, lỗi được dẫn chứng từ chính ảnh hoặc trích dẫn đã đối chiếu, rồi **Đáp án gợi ý / Dàn ý gợi ý**, và kế hoạch luyện lại. Không che mất bài viết gốc.

## 3. Quality gate trước khi chấm
- Ảnh có thể là JPEG/HEIC/PNG, nhiều trang. Giới hạn dung lượng và số ảnh bằng cấu hình; chuẩn hóa ảnh trên thiết bị mà không xóa bản gốc trước khi upload.
- Kiểm tra mờ/chói/cắt mất mép/thiếu trang/thứ tự trang/không có nội dung; cho yêu cầu chụp lại nếu không đủ chất lượng.
- OCR tiếng Việt và chữ viết tay phải xuất `recognized_text` + `confidence` và, nếu có thể, vị trí đoạn trên ảnh. Không dùng lời AI đoán để điền chỗ không đọc được.
- Không có ảnh hoặc không đọc đủ, trạng thái `NEEDS_RETAKE` hoặc `NEEDS_PARENT_REVIEW`; **không chấm 0** do ảnh/OCR thất bại.
- Nếu OCR nhận dạng không chắc nội dung ảnh, vẫn giữ ảnh cho Admin xem và chỉnh bản phiên âm trước khi cho chấm lại. Bản sửa của Admin được audit.
- Bảo vệ riêng tư ảnh của trẻ: lưu private bucket/server, signed URL ngắn hạn, giới hạn dung lượng, định nghĩa lịch giữ dữ liệu/xóa theo quyền Admin; không công khai trên GitHub Pages hoặc link Drive công khai.

## 4. Grading contract
- Chỉ chấm theo **rubric phù hợp câu hỏi** và đã được Admin duyệt, gắn `question_id`, `rubric_version`, `max_score`, `source_evidence` và `exam_snapshot_version`.
- Gợi ý tiêu chí cho bài viết đoạn: (a) đáp ứng yêu cầu đề, (b) hiểu đúng nội dung, (c) lý lẽ/dẫn chứng/phân tích, (d) tổ chức bố cục, (e) diễn đạt/chính tả. **Tỷ trọng điểm là metadata theo câu, không áp dụng cố định**.
- Chấm từng tiêu chí, nêu nhận xét dựa trên chứng cứ và mức độ chắc chắn. Chấp nhận nhiều diễn đạt và cách lập luận phù hợp; không khấu trừ vì khác câu chữ đáp án mẫu.
- Trạng thái: `SUBMITTED_LOCAL`, `SYNC_PENDING`, `SUBMITTED_SERVER`, `OCR_PENDING`, `NEEDS_RETAKE`, `GRADING_PENDING`, `AI_GRADED_PROVISIONAL`, `NEEDS_PARENT_REVIEW`, `ADMIN_VERIFIED`, `GRADED_FINAL`.
- Các case thiếu rubric, OCR thấp, bài quá ngắn/không đúng câu, hình không rõ, nhiều cách hiểu đều cần review; **không phát hành grade final tự động nếu chứng cứ thấp**.
- Parent/Admin có quyền `Confirm`, `Adjust grade`, `Return for retake`, `Regrade`. Giữ `AI_grade`, `parent_grade`, lý do và lịch sử. Học sinh xem được nhãn grade rõ ràng.
- Weakness Map và báo cáo năng lực phân biệt `provisional_score` với `verified_score`; kết quả không xác minh được không tính như đáp án sai. Lưu tiêu chí yếu cụ thể, không gán nhãn nhân cách.

## 5. Timing of suggested answers
- **Tuyệt đối không hiện gợi ý trước nộp bài**.
- Mặc định: hệ thống chấm xong (có thể là điểm AI sơ bộ có nhãn) mới hiện lời nhận xét, dàn ý tham khảo, 1 đoạn viết mẫu minh họa nếu phù hợp.
- Trường hợp `NEEDS_RETAKE`, `NEEDS_PARENT_REVIEW` chưa chấm được: hiển thị lý do/chờ xác minh; **chưa hiện đáp án gợi ý** trừ khi Admin chủ động kết thúc bài.
- Với exam nhiều câu, chỉ mở gợi ý sau khi đã nộp toàn bộ đề và grading đã hoàn tất theo chính sách đề.
- Gợi ý mô tả cách cải thiện *bài của chính học sinh* (ý còn thiếu, cấu trúc, dẫn chứng), không thay thế toàn bộ bài làm hay ép sao chép văn mẫu.

## 6. Sync / privacy
- Lưu offline ảnh và manifest vào IndexedDB bằng transaction, event UUID không trùng, chunked upload khi online, server receipts; retry không ghi trùng.
- Object storage private; liên kết ảnh với learner ID, attempt ID, question ID, page index và content hash. Server RLS/authorization ngăn Student sửa rubric/grade và ngăn truy cập dữ liệu gia đình khác.
- On shared device, switching Admin/Student requires separate authorization; image and grading payloads not visible before role check.
- Confirm sync status to learner; parent dashboard only claims server-received work, shows last sync time.

## 7. Schema additions
`written_responses(id, learner_id, attempt_id, question_id, submitted_at, status, exam_version)`
`written_response_images(id, response_id, page_order, private_storage_key, sha256, capture_metadata, quality_flags, uploaded_at)`
`ocr_results(id, response_id, parser_version, recognized_text, confidence, anchors, reviewed_text, reviewed_by, reviewed_at)`
`writing_grades(id, response_id, rubric_version, grader_model_version, criterion_scores_json, total_score, confidence, status, evidence_refs, rationale, graded_at)`
`parent_grade_reviews(id, grade_id, parent_uid, final_score, reason, reviewed_at)`
`suggested_responses(id, response_id, version, outline, sample_text, improvement_points, released_at)`
Indices: uniqueness on attempt_id + question_id + page_order for image ordering; immutable submission revision; event_id unique for outbox dedup. Don't store sensitive access secrets in frontend.

## 8. Acceptance tests
1. Student captures 2 clear images for Question 3; order remains stable after refresh.
2. Student captures blurred or clipped writing; AURA asks to retake, NEVER scores 0.
3. Vietnamese handwritten accents OCR are uncertain; no fabricated characters presented as verified.
4. Rubric is versioned; score by criteria and show evidence/AI provisional label.
5. Suggested answer hidden before full exam submission, only released after grading event.
6. Offline photo submission survives browser reload, syncs once on reconnect.
7. Parent sees images and criterion scores on a second device, can review/override with audit.
8. Student cannot access answer key or other role's content before permission check.
9. Two legitimate writing styles that satisfy rubric are not penalized for differing from suggested text.
10. Server storage private; no public image URL or leaked student handwriting in repo.
11. Regrade preserves original submission and prior grade history.

## 9. Integration
- Addendum for [AURA_CONTENT_STANDARD_8_SUBJECTS_V1.md](AURA_CONTENT_STANDARD_8_SUBJECTS_V1.md), section E2 Ngữ văn.
- Aligns with [AURA_SINGLE_LEARNER_SYNC_V1.md](AURA_SINGLE_LEARNER_SYNC_V1.md), offline outbox and authorization.
- This file is a design specification; no mobile camera feature, OCR grading service, storage or sync has been deployed.
