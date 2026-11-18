# AURA STUDY Student V5 — Giữ cấu trúc cũ, một tài khoản máy chủ, thêm Nhiệm vụ và Hành trình

**Ngày:** 18/11/2026. **Môi trường:** Supabase Staging và GitHub Pages `admin-direct.html` / `student-direct.html`.

## Quy tắc Owner

- Giữ **giao diện Student đang sử dụng** (nền navy–blue–teal, sidebar dark, 5 mục gốc Hôm nay · Ôn thi · Bài học · Luyện nhanh · Kết quả), không chép giao diện ảnh tham khảo.
- Chỉ thêm **Nhiệm vụ** và **Hành trình** vào sidebar desktop; trên mobile giữ 5 mục thanh dưới, có hai lối tắt trên Hôm nay để tránh menu chật.
- Ảnh tham khảo: `Trang chủ`→ Hôm nay; `Bài tập, nhiệm vụ`→ Nhiệm vụ + Luyện nhanh; `Lớp học, bài giảng`→ Bài học; `Học liệu tự ôn tập`→ Ôn thi/Bài học; `Kỳ thi ôn tập`→ Ôn thi; `Hành trình học tập`→ Hành trình.
- `Kỳ thi chính thức` **không bật** do Exam Engine, chấm điểm và teacher signoff chưa nghiệm thu. `Lớp học tương tác` loại bỏ hoàn toàn; không để nút chết.
- Student chỉ đăng nhập/kích hoạt **một lần bằng liên kết do Admin tạo trên máy chủ**, không có PIN cục bộ hoặc bước liên kết cloud thứ hai.

## Luồng đăng nhập thật

1. Admin vào `admin-direct.html` → **Học sinh** (hoặc `aura-admin.html` để đăng nhập email được cấp quyền lần đầu).
2. Admin **Tạo và cấp liên kết** → API `aura-identity-pair` `create_student`, `issue_student_link`, đã có từ V3. Link một lần, hạn 48 giờ, chứa mã kích hoạt trong fragment. Gửi riêng link cho Student, không đăng công khai.
3. Student mở `aura-student.html#join=...` trên thiết bị học. Sau khi kích hoạt, trang chuyển tới **`student-direct.html`** — không phải app Toán 6 thử nghiệm cũ.
4. `student_cloud_access_v5.js` dùng **Supabase Auth Student** có sẵn, gọi Edge action `student_profile` với JWT. Edge dùng `getUser` và xác minh `user.is_anonymous`, role Student; server RPC `aura_student_unified_profile_v5` kiểm tra active pairing + household/learner chính xác.
5. Nếu Student hợp lệ, hiển thị giao diện học đầy đủ. Nếu không hợp lệ/đã thu hồi, màn đăng nhập duy nhất hướng tới kích hoạt bằng link Admin.
6. Trên thiết bị đã kích hoạt, mở Student trực tiếp; không yêu cầu mã PIN lại. Muốn ngắt phiên/đổi thiết bị, vào **Tài khoản** ở header → `aura-student.html?manage=1` → kết thúc phiên. Admin có thể thu hồi thiết bị trong danh sách.
7. Chỉ còn một danh sách tài khoản **trên máy chủ** do Admin quản lý. Tài khoản cục bộ đời cũ (PIN) không tự ghép sai sang tài khoản cloud; dữ liệu trong browser cũ không bị xóa.

## Dữ liệu học tập và nội dung

- SGK chuẩn: nguồn NXB xác minh vẫn tự cập nhật trong **Bài học**; không cần duyệt.
- Bài AURA nháp trong Bài học: 36 previews xem thử, không phải nguyên văn SGK hoặc bài đã certified.
- Đề thi/kiểm tra/bài mẫu Owner đưa ngoài SGK: vẫn cần Admin duyệt rồi mới xuất bản và chỉ hiển thị trong **Ôn thi** khi có.
- 15 mô-đun bài tập QA locked: không mở thành bài luyện tự chấm. Không bật thi chính thức.
- Trang **Hôm nay** không còn hai khối kỹ thuật `Tài liệu mới từ Admin` và `Bài học theo nguồn chuẩn`; học liệu được chuyển về đúng **Ôn thi** hoặc **Bài học** và ẩn khi chưa có.
- **Nhiệm vụ** dùng hiện trạng bài học, sổ câu sai, lượt luyện; **Hành trình** dùng tiến độ học và lịch sử điểm đã có, không bịa dữ liệu.
- Tiến độ/bài làm **vẫn lưu cục bộ**, được tách theo `learner_id` đã xác minh bằng máy chủ ở trình duyệt đó; khi đổi tài khoản, hệ thống snapshot hồ sơ cũ và khôi phục hồ sơ tương ứng. Dữ liệu cục bộ PIN-era không biết chủ sở hữu được backup `aura_cloud_legacy_learning_backup_v5`, **không âm thầm gán** cho tài khoản máy chủ.
- Chưa đồng bộ lịch sử và trạng thái từng bài giữa hai thiết bị; việc dùng một tài khoản và nhận tài liệu cloud không đồng nghĩa đã đồng bộ toàn bộ bài làm.

## Bảo mật

- Server RPC `public.aura_student_unified_profile_v5(uuid)` chỉ `service_role` được EXECUTE; `anon` và `authenticated` không có quyền gọi trực tiếp. Edge `aura-legacy-content-sync-v1` vẫn JWT verified.
- Không dùng tên người dùng/cookie client để cấp quyền; ID Student phải được xác minh lại trên backend.
- Giữ nguyên phân quyền tài liệu, cơ chế duyệt bộ đề, cảnh báo nháp học liệu và cờ Exam Engine OFF.
- Không lưu link kích hoạt vào localStorage Admin; chỉ giữ trong phiên màn hình để sao chép riêng.
- Không xóa local PIN accounts lịch sử hay dữ liệu cũ; chỉ loại bỏ cơ chế đăng nhập PIN khỏi Student V5.

## QA

- Regression: `node --test tests/legacy-private-assets-v2.test.mjs tests/sgk-auto-review-policy.test.mjs tests/admin-unified-v3.test.mjs tests/learning-pipeline-v4.test.mjs tests/student-single-login-v5.test.mjs`.
- Browser synthetic: `tests/student-single-login-v5-browser.mjs`: Admin tạo tài khoản/cấp link, Student xác minh phiên, giữ 5 menu và mở Nhiệm vụ/Hành trình, panel kỹ thuật không còn trong Home, vào Bài học nhận nội dung AURA. Chạy phone, iPad, desktop.
- Chưa có phiên **Admin thật** tạo học sinh mới và Student thật kích hoạt link trên hai thiết bị tại môi trường này; không ghi PASS nghiệm thu thực. Không dùng token thật trong CI.

## Link dùng sau khi triển khai

- Admin: https://brunoquoc.github.io/aura-study/admin-direct.html
- Student: https://brunoquoc.github.io/aura-study/student-direct.html
- Cổng kích hoạt (link tạo tự động, không tự bịa mã): https://brunoquoc.github.io/aura-study/aura-student.html

## Tiếp tục

- Nghiệm thu User thật: Admin tạo một học sinh Staging, gửi link riêng, Student kích hoạt, kiểm tra đủ menu/bài học/chấm luyện hợp lệ, đổi thiết bị và thu hồi quyền.
- Từng bước chuyển tiến độ học tập và sai/đúng sang đồng bộ server có quyền theo learner sau khi kiểm định dữ liệu; không thay UI lần nữa.
