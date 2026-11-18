# AURA STUDY V4 — Source → Learning Draft → Paired Student

Ngày 18/11/2026. Bản **Staging** kế thừa Admin V3 và giao diện Student cũ. Không thay menu, không bật thi hay chấm điểm chính thức.

## 1. Luồng dữ liệu đã nối

1. **Nguồn chuẩn:** nguồn NXB Toán 6 Kết nối tri thức (tập 1/2) đã đối chiếu mục lục và lưu trong `sgk_source_registry` + `sgk_primary_toc_sources/items`. Chỉ giữ liên kết nguồn NXB và khung mục lục, **không sao chép toàn bộ sách**, không tự nhận là bài tập SGK gốc.
2. **Chuẩn hóa cấu trúc:** `standard_learning_units_v3` có 78 đơn vị (53 SGK, 25 luyện/ôn); trigger V3 cập nhật khi mục lục nguồn thay đổi. View V4 `learning_pipeline_units_v4` ghép đơn vị nguồn với 36 `student_math6_guided_lessons` tự biên soạn và 15 `sgk_common_practice_modules`.
3. **QA phân loại:** 36 bản nháp bài học đủ 5 trường nội dung (khởi động, lý thuyết AURA, ví dụ AURA, prompt luyện tập, vận dụng) và giới hạn độ dài. Đây mới là **QA cấu trúc**, `pedagogical_certified=false`. 15 mô-đun luyện tập mang `STAGING_QA_LOCKED`, tuyệt đối không đưa câu hỏi/đáp án vào preview.
4. **Đồng bộ đa thiết bị:** Edge `aura-legacy-content-sync-v1` có thêm hai actions `learning_pipeline_catalog`, `learning_pipeline_lesson`. Mỗi action kiểm tra JWT, quyền ADMIN hoặc STUDENT đã ghép, server kiểm tra lại quyền vào SQL. Admin/Student gọi chung **một máy chủ**.
5. **Giao diện:** Admin V3 → Tài liệu → Sách giáo khoa/Bài tập: có bảng theo dõi nguồn → bản nháp → Student. Student cũ → Bài học: có khối **“Bài học theo nguồn chuẩn”**, với 36 bài AURA biên soạn có thể *xem thử*, không chấm điểm. Cả hai màn hình giữ nguyên URL và giao diện nền.

## 2. Quy tắc bảo vệ

- Mọi RPC đều chỉ cấp cho `service_role`, anon/authenticated không được thực thi. Không dùng metadata có thể sửa của JWT để phân quyền.
- Thiết bị Student phải có cặp ghép còn hiệu lực, đúng learner-household. Phải đăng nhập Student cloud một lần qua `aura-student.html`.
- Danh sách Student chỉ chứa tên, số trang và link mục lục từ NXB có nguồn xác minh, cùng cờ preview. Chi tiết được tải chỉ khi Student chọn bài và bài có `preview_ready=true`.
- Học liệu AI phải ghi rõ `AURA_AI_AUTHORED_DRAFT`, `PUBLISHER_TOC_ONLY`, `STRUCTURE_PRESENT_ONLY`, `preview_only=true`, `textbook_body_verified=false`, `auto_grading_enabled=false`.
- Không xuất bản câu hỏi, đáp án, giải tự luận, đánh giá chính thức; đề thi và bài mẫu ngoài SGK vẫn đi qua Admin duyệt riêng.
- Không lưu access token ở nguồn GitHub; client chỉ có publishable key và dùng phiên Auth của người sử dụng. Không có bucket công khai.
- Chỉ dẫn nguồn ở miền NXB `taphuan.nxbgd.vn`; từ chối URL không an toàn.

## 3. Thực trạng công việc còn phải làm

- **Chưa có full-text SGK được cấp quyền và kiểm chứng** để trích xuất từng trang / từng bài tập gốc. AURA không tự tải và sao chép nội dung SGK từ web vào hệ thống khi chưa rõ quyền sử dụng.
- **36 bản nháp không được chứng nhận về kiến thức**; hiện Student xem thử, chưa thay thế giáo trình và chưa tự chấm.
- **15 mô-đun luyện tập vẫn khóa QA**. Chỉ được mở khi kiểm định toán, đáp án, hình, dấu vết nguồn và xử lý ngoại lệ đạt.
- Chưa đăng ký nguồn chuẩn cho đủ các môn khác; chưa test tài khoản Student thật trên hai thiết bị. Mọi bằng chứng browser CI là synthetic, không phải nghiệm thu thiết bị thực.
- Không được diễn giải 78 khung mục lục thành 78 bài học tương tác hoàn chỉnh.

## 4. QA và nghiệm thu

SQL kiểm tra: 78 units, 36 `preview_ready`, 15 `practice_qa_locked`, 0 `publisher_body_verified`. Các RPC chỉ `service_role` execute. Đường gọi chi tiết lesson L08 trả `AURA_AI_AUTHORED_DRAFT`.

Chạy `node --test tests/learning-pipeline-v4.test.mjs tests/admin-unified-v3.test.mjs tests/sgk-auto-review-policy.test.mjs tests/legacy-private-assets-v2.test.mjs`.

Browser smoke (giả lập máy chủ) `tests/learning-pipeline-v4-browser.mjs`: Admin SGK thấy nháp, mục bài tập bị khóa; Student mở bài AURA qua phiên ghép tổng hợp, không thấy đáp án hoặc chức năng chấm điểm. Kiểm thử trên phone/iPad/desktop.

### Các bước xác nhận thật của Admin

1. Mở URL Admin cũ, đăng nhập Admin máy chủ tại `aura-admin.html` nếu chưa có session.
2. Tài liệu → Sách giáo khoa: xem panel dữ liệu, trạng thái 36 nháp / 15 khóa. Nhấn Xem nháp để đối chiếu nguồn.
3. Trên thiết bị khác, mở `aura-student.html` và kích hoạt bằng liên kết Admin đã cấp, sau đó vào `student-direct.html` → Bài học.
4. Chọn **“Xem bài AURA”**. Nhìn đúng tiêu đề, nội dung khởi động/kiến thức/ví dụ/luyện tập/vận dụng và nhãn *chưa chứng nhận*.
5. Bảo đảm bài kiểm tra chính thức và chấm điểm vẫn khóa. Không ghi PASS nghiệm thu thật cho đến khi có biên bản 2 thiết bị.

## 5. Bước kế tiếp

Tích hợp pipeline trích xuất **nội dung có quyền sử dụng** và soát chất lượng nội dung nguồn theo từng bài; sau đó gắn bộ kiểm định tính đúng và phiên bản. Chỉ đến khi có bằng chứng đạt QA mới mở các bài tập Student thực hành, không có hàng chờ duyệt SGK thủ công.
