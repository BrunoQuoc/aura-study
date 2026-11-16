# AURA STUDY — Đăng nhập tối giản V3: Admin tạo — Student học

**Ngày:** 16/11/2026 · **Môi trường:** Staging · **Audit:** `AURA-SIMPLE-ADMIN-STUDENT-LOGIN-V3-20261116`

## Luồng người dùng

**Trang mở đầu chỉ có hai nút: Admin và Student.** Không còn hiển thị Parent hoặc tên thiết bị, mã ghép đôi 32 ký tự trong luồng chính.

### Admin
1. Mở [AURA Portal](https://brunoquoc.github.io/aura-study/aura-portal.html), chọn **Admin**.
2. Nhập email Admin đã được cấp quyền. Nhận và mở magic link qua email như trước.
3. Gõ tên học sinh thử nghiệm → **Tạo học sinh + link học**.
4. Bấm **Sao chép liên kết**, gửi riêng vào thiết bị học sinh.
5. Có thể mở danh sách học sinh, cấp lại link (link chưa dùng cũ bị vô hiệu), hoặc ngắt thiết bị cũ trong mục **Đổi thiết bị**.
6. Công cụ quản lý học liệu, ngân hàng câu hỏi, đề thi và nghiệm thu vẫn nằm trong Admin; các công cụ chuyên sâu được thu gọn.

### Student
1. Nhận link riêng từ Admin.
2. **Lần đầu:** mở link trên thiết bị học, hoàn thành Turnstile nếu được yêu cầu, bấm **Kích hoạt và vào học Toán 6**. Không nhập email/mật khẩu/mã 32 ký tự.
3. **Những lần sau:** mở Student trên chính trình duyệt đã kích hoạt, hệ thống xác minh phiên và đi thẳng vào Toán 6. Nếu xóa dữ liệu trình duyệt, đổi trình duyệt hoặc đổi thiết bị, nhờ Admin cấp lại link.
4. Student chỉ xem dữ liệu hồ sơ đã được máy chủ ghép; Exam Engine, chấm điểm chính thức vẫn OFF.

## Cấu trúc kỹ thuật

- GitHub UI: `aura-portal.html`, `aura-admin.html`, `aura-student.html`, `aura-simple-access.js`, `aura-portal-v2.css`.
- Supabase Edge `aura-identity-pair` v7, verify_jwt=true: bốn action mới `list_students`, `create_student`, `issue_student_link`, `revoke_student_devices`. Yêu cầu Supabase Auth user có email xác thực và quyền ADMIN độc lập.
- DB service_role-only RPCs `aura_admin_student_list_v1`, `aura_admin_student_create_v1`, `aura_admin_student_issue_link_v1`, `aura_admin_student_revoke_devices_v1`; các RPC không cấp EXECUTE cho anon/authenticated.
- Cho phép nhiều learner trong một household bằng cách thay ràng buộc singleton `aura_learners_household_id_key` bằng index `aura_learners_household_idx`.
- `aura_bootstrap_parent` cũ đã điều chỉnh để chọn learner cũ đầu tiên mà không phụ thuộc ràng buộc singleton, có kiểm thử hồi quy.
- Link kích hoạt có **mã 192 bit ngẫu nhiên**, dùng một lần và hết hạn sau **48 giờ**. Mã chỉ tồn tại rõ trong liên kết Admin nhận, xuất hiện trong **URL fragment** để tránh gửi trong HTTP request; DB chỉ giữ SHA-256. Tái phát hành link vô hiệu các link chưa dùng trước đó của **cùng learner**.
- Redemption tái sử dụng hàm pairing DB cũ có row lock, kiểm tra token, hạn dùng, trạng thái đã dùng và learner/household; browser Auth anonymous vẫn được chặn theo learner.
- Admin và Student dùng Supabase Auth storage key riêng; không chia sẻ session. Các quyền Student vẫn được server kiểm tra mỗi request. Cloudflare Turnstile vẫn dùng khi cần tạo phiên anonymous lần đầu.
- Legacy Parent và trang kiểm thử `aura-staging-login.html` vẫn còn để tương thích; không xuất hiện trên trang mở đầu mới.
- **Trang `index.html` và `admin-direct.html`, `student-direct.html` (ứng dụng ổn định trước đó) KHÔNG bị chuyển hướng hay thay đổi** để tránh tác động lên lối vào đang dùng.

## QA đã thực hiện

- Quyền ADMIN: tạo hai learner cùng household trong transaction, kiểm tra list, digest format, ngăn user khác tạo/cấp link; rollback, số learner cũ không đổi.
- `aura_bootstrap_parent` sau sửa cấu trúc: bảo toàn learner cũ, kiểm thử rollback.
- Web UI: Static JS syntax PASS, mọi ID tham chiếu trong admin/student tồn tại, portal có đúng hai card, không có Parent hoặc ô ghép mã 32 ký tự; Edge v7 JWT verified.
- Read-only DB: 1 learner cũ, 2 thiết bị active vẫn tồn tại; không có quyền gọi RPC trực tiếp từ anon/authenticated; 0 live Exam Engine, 0 live grading.
- **Chưa có E2E xác thực link kích hoạt trên Safari/iPhone thật**; truy cập live Github Pages qua công cụ hiện không xác minh được. Vì thế ghi `BROWSER_ACTIVATION_PENDING`, không tự gắn trạng thái nghiệm thu thiết bị.

## Các link Staging

- [Trang chính hai vai trò](https://brunoquoc.github.io/aura-study/aura-portal.html)
- [Admin — tạo và quản lý học sinh](https://brunoquoc.github.io/aura-study/aura-admin.html)
- [Student — kích hoạt một lần, vào học](https://brunoquoc.github.io/aura-study/aura-student.html)

**Rủi ro vận hành:** Đường link kích hoạt là một bí mật, chỉ nên gửi riêng tới học sinh và mở trên đúng thiết bị; mất thiết bị phải được Admin ngắt. Phiên anonymous phụ thuộc dữ liệu Auth còn lưu trong trình duyệt. Trước khi sử dụng thật cần nghiệm thu browser, kịch bản thu hồi/đổi thiết bị, bật bảo vệ CAPTCHA phía server và chính sách dữ liệu cá nhân.
