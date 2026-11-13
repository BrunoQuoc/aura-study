# AURA STUDY — Auth / Portal V2 · Kiến trúc ba vai trò

**Ngày triển khai mã Staging:** 13/11/2026  
**Trạng thái:** Thiết kế & triển khai kỹ thuật lên GitHub/Supabase Staging. **Chưa nghiệm thu end-to-end trên iPhone hoặc cấu hình production domain.**

## Các khu vực giao diện riêng

| Khu vực | GitHub Pages | Nội dung |
|---|---|---|
| Chọn vai trò | `aura-portal.html` | Admin, Parent, Student |
| Admin | `aura-admin.html` | Đăng nhập email, kiểm tra quyền Admin, vào ngân hàng câu hỏi/QA |
| Parent | `aura-parent.html` | Đăng nhập email, danh sách học sinh thuộc hộ gia đình được cấp, tạo mã ghép thiết bị |
| Student | `aura-student.html` | Tạo phiên thiết bị ẩn danh, nhập mã 32 ký tự, kiểm tra quyền trên thiết bị đã ghép |
| Legacy | `aura-staging-login.html` | Giữ lại kiểm tra đăng nhập / pairing cũ, dùng như callback Magic Link và dự phòng |

### Mô hình quyền

- Vai trò **ADMIN** được cấp tường minh tại `aura_review.portal_role_grants`; không tự suy từ quyền Parent.
- Vai trò **PARENT** cần đồng thời có grant PARENT đang hoạt động và membership ở `aura_review.parent_household_access`. Chỉ được đọc học sinh thuộc hộ gia đình đã cấp.
- Vai trò **STUDENT** phụ thuộc vào thiết bị đã ghép chưa thu hồi trong `public.aura_student_devices`. Quyền không lấy từ nhãn thiết bị hoặc tham số client.
- Tài khoản Staging legacy trước đây vừa quản lý Admin vừa là chủ hộ được di trú thành **hai grant độc lập** để không mất dữ liệu, nhưng grant không tạo quyền kế thừa lẫn nhau.
- Chỉ Supabase Edge sử dụng service-role-only RPCs để kiểm tra. Các RPCs và bảng quyền không được cấp `EXECUTE/SELECT` cho `anon` hoặc `authenticated` trực tiếp.
- `aura-admin-review-v1` đã chuyển sang kiểm tra grant ADMIN thay vì `aura_households.admin_uid` để tránh Parent truy cập Review/Exam.
- `aura-identity-pair` kiểm tra grant Parent và membership trước khi tạo mã ghép hoặc thu hồi thiết bị. Chỉ email cho phép từ Allowlist mới dùng được bootstrap legacy.

### Đăng nhập Staging

- Admin và Parent dùng email Magic Link, `shouldCreateUser=false`, không tạo tài khoản mới tùy tiện. Cùng trình duyệt có thể giữ một phiên email nhưng tài nguyên máy chủ được phân quyền theo vai trò.
- Trong giai đoạn này `adminOtpOptions` chỉ chấp nhận callback về `aura-staging-login.html`. Luồng Portal mới lưu intent cố định `admin` hoặc `parent` trong localStorage (không có JWT), callback cũ nhận token rồi điều hướng tới trang vai trò tương ứng.
- Student sử dụng auth storage riêng `aura-stage-student-v1` và Captcha/Turnstile hiện có; ghép đôi qua Edge Function có kiểm tra mã, không lưu mã ghép trong localStorage.
- Các trang có giao diện mobile responsive; chỉ hiển thị bảng chức năng sau khi Edge xác nhận quyền.

### Tệp và API

- Frontend: `aura-portal.html`, `aura-admin.html`, `aura-parent.html`, `aura-student.html`, `aura-portal-v2.css`, `aura-portal-v2.js`.
- Legacy callback bridge: `aura-staging-login.html`.
- API mới: `aura-portal-access-v1` JWT required (whoami, admin_status, parent_summary, student_summary).
- API cũ cập nhật quyền: `aura-admin-review-v1` và `aura-identity-pair`.
- Supabase role/member tables và RPCs: `portal_role_grants`, `parent_household_access`, `aura_portal_access_v1`, `aura_portal_parent_summary_v1`, `aura_portal_student_summary_v1`, `aura_portal_parent_household_v1`.
- RPCs quyết định duyệt cá nhân/theo lô và nghiệm thu hình đã chuyển kiểm tra grant ADMIN.

### Kiểm tra đã thực hiện

- Bốn trang mới và CSS/JS được tạo thành công trên nhánh chính GitHub.
- Static JS syntax PASS; các phần tử ID tương ứng các màn hình đều tồn tại.
- Kiểm tra SQL: một grant ADMIN và một grant PARENT hiện hữu cho tài khoản legacy; vai trò không tồn tại trả về false; parent summary chỉ có học sinh liên kết.
- Direct permission tests: anon/authenticated không thể gọi trực tiếp role/summary RPC, chỉ service_role.
- Backend deploy: API portal JWT verification bật, Admin và Pairing gateway đều có kiểm tra quyền mới.
- Ngân hàng câu hỏi không thay đổi: 402 câu, 1 APPROVED, 401 PENDING, không bật xuất bản.

### Các giới hạn và điều kiện chưa hoàn thành

1. **Chưa thực hiện đăng nhập Magic Link thực tế từ iPhone Safari vào các màn hình mới**, chưa có biên bản nghiệm thu 3 luồng.
2. **Chưa xác minh truy cập HTTP thật của bản GitHub Pages mới** trong môi trường của cuộc kiểm thử; file GitHub đã tồn tại nhưng khả năng phân phối CDN cần xác minh độc lập.
3. Tài khoản Parent mới cần được Admin/ops provision trên Auth + grant + membership; không cho phép người dùng tự cấp quyền.
4. Khi chuyển lên production cần cập nhật Auth redirect allowlist theo domain, kiểm thử email templates, cấu hình CAPTCHA phía máy chủ và thực thi chính sách vận hành trước khi bỏ callback legacy.
5. Student login đã kết nối pairing, nhưng dashboard học/Exam Engine chính thức vẫn đang khóa theo cổng nghiệm thu sư phạm.

**Không tự kích hoạt Exam Engine hay tự ghi phê duyệt câu hỏi.**
