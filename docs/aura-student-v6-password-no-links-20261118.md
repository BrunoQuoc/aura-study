# AURA STUDY Student V6 — Admin tạo user, Student đăng nhập, không dùng link

**Ngày:** 18/11/2026. **Môi trường:** Supabase **STAGING** + GitHub Pages cũ.

## Owner yêu cầu

Bỏ hoàn toàn thao tác **“Lấy liên kết học”** khỏi Admin. Anh chỉ cần tạo user (tên học sinh, tên đăng nhập, mật khẩu). Học sinh mở Student, nhập tên đăng nhập + mật khẩu và vào đầy đủ chức năng mà không phải kích hoạt hoặc ghép thiết bị.

Vẫn giữ giao diện Student dark blue/teal nguyên bản: Hôm nay / Ôn thi / Bài học / Luyện nhanh / Kết quả, cộng Nhiệm vụ và Hành trình đã bổ sung; không có Lớp học tương tác hoặc kỳ thi chính thức khi chưa nghiệm thu.

## UI triển khai

1. **Admin `admin-direct.html` → Học sinh:** form **Tên học sinh, Tên đăng nhập, Mật khẩu → Tạo học sinh**. Bỏ “Tạo và cấp liên kết”, “Lấy liên kết học”, “Đổi thiết bị” khỏi trang. Có thể tạo ngay user cloud. Username 3–30 ký tự ASCII thường, bắt đầu bằng chữ; mật khẩu 8–64 ký tự có chữ và số.
2. **Học sinh cũ:** những learner đã tạo từ V3/V5 không bị xóa. Hàng học sinh hiện **“Thiết lập đăng nhập”** nếu chưa có username/password; **“Đặt lại mật khẩu”** nếu đã có. Mật khẩu không được hiển thị/lưu lại, Admin giao riêng cho học sinh.
3. **Student `student-direct.html`:** một form **Tên đăng nhập/Mật khẩu → Đăng nhập và vào học**. Đăng nhập sai không mở nội dung; đăng nhập đúng được server kiểm tra learner UUID/household/active role rồi hiện Student. Có nút Đăng xuất tại header trên desktop, iPad và điện thoại.
4. **Cổng cũ `aura-student.html`:** truy cập thông thường chuyển tới Student direct; link `#join=` còn hiệu lực trước đây được giữ để tương thích trong thời hạn đã cấp (không thể cấp link mới qua Admin V6). **Cổng Admin `aura-admin.html`** dùng xác thực email Admin rồi chuyển vào Admin V3, không hiển thị workspace cấp link cũ.

## Xác thực & bảo mật

- Tài khoản username+password sử dụng **Supabase Auth chuẩn**: `auth.admin.createUser` (`email_confirm:true`) phía Edge Admin-verified, `auth.signInWithPassword` phía Student. Không có password hash tự làm hoặc PIN cục bộ.
- Username được chuyển thành định danh email nội bộ `<username>@brunoquoc.github.io` (miền tương ứng với GitHub Pages của dự án), **không phải hòm thư học sinh thực**, không dùng gửi/nhận email. Admin tự đặt/reset password. V6 dùng domain thật thay cho TLD thử nghiệm mà GoTrue có thể chặn. Hoạt động Auth thực tế cần được nghiệm thu bằng tài khoản do Admin tạo.
- `aura_review.student_password_accounts_v6` chỉ lưu **learner UUID, Auth UUID, username**, không chứa mật khẩu. SQL `aura_admin_create_student_password_v6` thực hiện tạo learner + bind Auth **atomic** (rollback nếu lỗi). Nếu bind thất bại sau khi Auth user được cấp, Edge dọn Auth user mới; không ghi password ra log.
- Chỉ Admin đã xác minh email và có `ADMIN` grant được tạo/reset tài khoản. RPC có kiểm tra sở hữu learner/household, Auth email đã xác minh và không cho dùng account Admin làm Student. Các RPC chỉ `service_role` có quyền gọi; client chỉ có publishable key.
- Quyền Student trên `aura-legacy-content-sync-v1`, `aura-legacy-content-asset-v2` chỉ mở sau khi user có `roles.student` từ active pairing và nếu đăng nhập password thì có bản ghi xác minh `aura_student_password_bound_v6`. Anonymous pairing cũ vẫn được xử lý cho legacy session, nhưng khi thiết lập password thì các ghép cũ bị thu hồi.
- Student đăng nhập nhiều thiết bị với cùng username/password, nhận học liệu cloud đã cấp. **Lịch sử bài làm/trạng thái học vẫn chỉ lưu trong từng trình duyệt**, chưa đồng bộ hai chiều tiến độ.
- `student_cloud_access_v5.js` tiếp tục snapshot dữ liệu cục bộ theo verified learner ID, không ghép nhầm tài khoản PIN cũ; khi đăng xuất lưu snapshot và khóa trang học.
- Password không ghi vào GitHub, localStorage Admin, các bảng nghiệp vụ hay API responses. Supabase Auth lưu hash theo cơ chế chuẩn.

## Khả năng và giới hạn

- Đã áp dụng SQL migration V6 lên staging, Edge `aura-identity-pair` V6 password API, shared document Edge và private file Edge với role logic mới.
- Đã có thể lấy danh sách hai học sinh hiện có trên SQL; **ban đầu cả hai chưa có username/password**. Phải dùng Admin “Thiết lập đăng nhập” trước khi Student đăng nhập.
- Chưa tạo tài khoản Auth người học thật trong lượt triển khai bằng công cụ (chỉ Admin thao tác tạo khi sử dụng); vì vậy **chưa có E2E native GoTrue thật với mật khẩu người dùng**. Browser CI mô phỏng Supabase Auth và backend, không phải nghiệm thu tài khoản thật.
- Exam Engine chính thức, giáo viên duyệt rubric, auto grading chính thức vẫn OFF.
- Khôi phục mật khẩu: Admin cấp lại bằng nút Đặt lại mật khẩu, không gửi email (email Auth là alias nội bộ).

## Kiểm định

- Offline Node regressions: `tests/student-password-v6.test.mjs` và các tests V1–V5.
- Browser Chrome synthetic: `tests/student-password-v6-browser.mjs` cho Admin/Student × phone/iPad/desktop: form đăng nhập, từ chối mật khẩu sai, cấp user, thiết lập account cũ, reset, xem bài AURA và đăng xuất. Không dùng mật khẩu tài khoản thực.

### Nghiệm thu trên thiết bị thật

1. Admin đăng nhập `aura-admin.html` nếu chưa có phiên Admin.
2. `admin-direct.html` → Học sinh → **Thiết lập đăng nhập** cho learner cũ hoặc tạo mới, nhập username và password (không chia sẻ qua tin nhắn công khai).
3. Trên **một trình duyệt Student khác**, mở `student-direct.html`, nhập tài khoản/password → vào học. Không cần link kích hoạt.
4. Đóng và mở lại Student; phiên vẫn được lưu. Nhấn Đăng xuất → form đăng nhập xuất hiện.
5. Thử mật khẩu sai, đổi mật khẩu qua Admin, kiểm tra Student mở đúng bài học/Ôn thi và không thể xem nội dung của learner khác.
6. Ghi kết quả nghiệm thu thật với thiết bị/trình duyệt và lỗi quan sát. Chưa có biên bản thì không ghi trạng thái DONE cho E2E.

### Địa chỉ
- Admin: https://brunoquoc.github.io/aura-study/admin-direct.html
- Student: https://brunoquoc.github.io/aura-study/student-direct.html
