# AURA STUDY — Đồng bộ Admin → Student trên giao diện cũ (Staging V1)

**Ngày:** 18/11/2026 (Asia/Ho_Chi_Minh)  
**Audit:** `AURA-LEGACY-ADMIN-STUDENT-CLOUD-SYNC-V1-20261118`  
**Ưu tiên:** Hoàn thiện luồng xuất bản tài liệu đã duyệt từ Admin cũ và xem tài liệu trên Student cũ, khác trình duyệt/thiết bị.

## 1. Nguyên tắc không thay giao diện

- Admin gốc: [admin-direct.html](https://brunoquoc.github.io/aura-study/admin-direct.html).
- Student gốc: [student-direct.html](https://brunoquoc.github.io/aura-study/student-direct.html).
- Menu, màu sắc, bố cục và xử lý học/đề thi cũ giữ nguyên. Chỉ thêm hai adapter JavaScript `admin_legacy_cloud_sync.js` và `student_legacy_cloud_sync.js` tải cuối trang.
- Admin mở **Thư viện**: mục **Xuất bản tài liệu cho Student** hiển thị tài liệu đã duyệt từ INBOX trên trình duyệt Admin. Bấm **Xuất bản** với xác nhận, hoặc **Thu hồi**.
- Student đã ghép thiết bị: ở **Hôm nay**, **Bài học**, **Ôn thi** xuất hiện mục **Tài liệu mới từ Admin**, có nút **Làm mới** và mở tài liệu Drive.
- Chỉ là metadata và link Drive: **không tự thay đổi quyền chia sẻ trong Drive, không tự chép file sang Supabase**. Quyền xem file gốc cần được Admin cung cấp. Nếu Drive báo bị chặn, Student chưa thể đọc nội dung file.
- Chỉ đồng bộ các loại tài liệu học: `lesson`, `practice`, `exam`, `reference`, `formula`. Không đồng bộ `answer_key` hoặc `solution`. `exam` là *tài liệu đề để tham khảo/kiểm tra thử*, không kích hoạt Exam Engine.

## 2. Nền tảng kết nối mới

### Private database
- `aura_review.legacy_student_shared_resources_v1`: unique `(household_id,drive_file_id)`, mã loại nội dung và kỳ, phiên bản, `PUBLISHED_STAGING`/`WITHDRAWN`, cờ `official_exam_enabled=false`, `pedagogically_signed_off=false`.
- `aura_review.legacy_student_shared_publish_events_v1`: log các lần xuất bản, cập nhật và thu hồi.
- Hai bảng bật RLS, không có quyền trực tiếp cho `anon` hoặc `authenticated`.

### Bốn RPC
- `aura_legacy_content_admin_publish_v1`: Admin có role thật, household tương ứng, kiểm tra dữ liệu và chặn loại đáp án.
- `aura_legacy_content_admin_list_v1`: các tài liệu đã xuất bản hoặc thu hồi cho household Admin.
- `aura_legacy_content_admin_withdraw_v1`: ngừng hiển thị trên Student, giữ audit log.
- `aura_legacy_content_student_list_v1`: chỉ Student đang ghép với learner ở cùng household và thiết bị chưa bị thu hồi mới được đọc bản xuất bản. Không trả Admin notes.

### Edge Function
`aura-legacy-content-sync-v1` version **1**, `ACTIVE`, `verify_jwt=true`. Hành động `admin_publish`, `admin_list`, `admin_withdraw`, `student_list`. Máy chủ gọi `auth.getUser` kiểm tra token, xác thực email và quyền ADMIN hoặc `user.is_anonymous` và role Student trước khi gọi RPC qua service role. Frontend chỉ dùng Supabase **publishable key**.

## 3. Kiểm thử backend đã thực hiện

Kiểm thử SQL `BEGIN/ROLLBACK`, không lưu dữ liệu giả:
1. Admin hợp lệ xuất bản bản nháp kiểm thử: PASS.
2. Student đã ghép, thuộc cùng household, liệt kê và xem metadata: PASS.
3. Admin đọc được tài liệu vừa xuất bản: PASS.
4. Thu hồi tài liệu thì Student không còn thấy: PASS.
5. Thu hồi quyền thiết bị thì không thể đọc: PASS.
6. Tài khoản không có quyền Admin không thể xuất bản: PASS.
7. Student chưa ghép không được xem tài liệu: PASS.
8. Loại `answer_key` bị từ chối: PASS.
9. Chặn gọi trực tiếp RPC từ `anon`/`authenticated`: PASS.
10. Kiểm tra cú pháp hai adapter JS: PASS. Hai HTML gốc giữ nguyên menu.

**Dữ liệu sau QA:** 0 metadata tài liệu đã xuất bản thật; 0 event, 3 thiết bị đang ghép có hiệu lực; Exam Engine và Auto Grading official **OFF**. Kết quả kiểm thử không thay cho sử dụng thật trên điện thoại/máy tính.

## 4. Cách nghiệm thu thật (cần thực hiện trên hai thiết bị)

1. Trên máy Admin, mở [Admin gốc](https://brunoquoc.github.io/aura-study/admin-direct.html) → **INBOX** → duyệt một tài liệu học hợp lệ.
2. Mở **Thư viện** → khu vực **Xuất bản tài liệu cho Student**. Nếu chưa có phiên cloud, nhấn đăng nhập Admin bằng email một lần ở [AURA Admin cloud](https://brunoquoc.github.io/aura-study/aura-admin.html), rồi quay lại **Admin gốc**. Bấm **Xuất bản**.
3. Trên máy Student, dùng **liên kết kích hoạt riêng** do Admin cấp tại trang Admin cloud một lần. Sau khi kích hoạt, quay về [Student gốc](https://brunoquoc.github.io/aura-study/student-direct.html) → **Bài học/Ôn thi** → **Làm mới**.
4. Xác nhận thấy đúng **tên tài liệu, môn, loại, kỳ**. Nhấn **Mở tài liệu**; nếu Google Drive từ chối, Admin cần cấp quyền đọc phù hợp cho Student.
5. Admin **Thu hồi** tài liệu, Student bấm **Làm mới** và xác nhận không còn tài liệu trong kho cloud.

**Chưa thực hiện được bước nghiệm thu xuyên thiết bị thật trong phiên kỹ thuật này.** Chưa có Admin thực sự bấm xuất bản và Student thực sự nhận trên iPhone trong dữ liệu mới. Không công nhận tự động là phát hành chính thức.

## 5. Điều còn lại cho Ưu tiên 1

- Thực nghiệm với file Drive hợp lệ, quyền xem của Student và thiết bị thật.
- Nếu cần Student *đọc được file riêng tư không phải chia sẻ link Drive*, thiết kế cơ chế sao chép file có xác thực vào private Supabase Storage riêng. **Chưa có chức năng sao chép file bytes**.
- Đồng bộ câu hỏi/chấm bài chính thức thuộc giai đoạn tích hợp tiếp theo; giai đoạn này chỉ đồng bộ **tài liệu nguồn đã được Admin xuất bản**. Bộ 402 câu, 41 rubric staging và cờ thi live không bị thay đổi.
- Rà các cảnh báo bảo mật nền tảng Supabase hiện hữu (anonymous access policies, leaked password protection) trước phát hành thực.
