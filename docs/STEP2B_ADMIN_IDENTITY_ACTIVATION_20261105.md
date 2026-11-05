# AURA STUDY — Bước 2B: Admin allowlist & Staging Auth Activation
**Ngày:** 2026-11-05
**Trạng thái:** DEPLOYED BACKEND · EMAIL OWNER NOT SIGNED IN · FULL E2E PENDING
**Môi trường:** Supabase staging `ufqzuowjhdqpydqvcsob`, Singapore. Production `main` unchanged.

## Đã triển khai
1. Migration `aura_p0_parent_allowlist_and_pairing_v1`: tables `aura_admin_email_allowlist` and `aura_pairing_requests`, RLS default-deny with no client grants, service_role-only RPC functions `aura_bootstrap_parent` and `aura_redeem_device_pairing`.
2. **Một email Admin được phép** đã được lưu chỉ dưới dạng SHA-256 của địa chỉ email viết thường và trim vào bảng allowlist (không ghi email vào GitHub).
3. `aura_bootstrap_parent` kiểm tra `auth.users`: email phải được Supabase xác minh, danh tính không phải anonymous và email được pre-authorize. Lần đầu tạo **một** household và **một** learner; gọi lại idempotent.
4. Ghép đôi: Admin tạo mã ngẫu nhiên 192-bit, chỉ có hiệu lực 10 phút và dùng một lần; server chỉ lưu SHA-256 của mã. Student phải có phiên Supabase Auth anonymous riêng. Hàm `aura_redeem_device_pairing` dùng khóa hàng `FOR UPDATE` và thêm thiết bị vào learner đã có trong cùng transaction. Admin có hành động thu hồi quyền thiết bị.
5. Edge Function `aura-identity-pair` (JWT required) — `ACTIVE`, version 2. Source `infra/edge/aura-identity-pair/index.ts`.
6. Edge Function `aura-staging-login` (public HTML only, no data mutations) — `ACTIVE`, version 1. Source `infra/edge/aura-staging-login/index.ts`.
7. Thử các chốt cấp quyền: `authenticated`/ `anon` không đọc allowlist, pairing table hoặc gọi trực tiếp hai RPC; giả lập UID không tồn tại không thể bootstrap hoặc redeem. Security Advisor có **hai INFO** `RLS Enabled No Policy` cho hai bảng nội bộ — đây là cấu hình cố ý **deny all** client. Không có lỗi mức ERROR/WARN tại lần kiểm tra.

## Người dùng cần thiết lập Auth Redirect URLs (chưa thao tác bằng connector)
Supabase Dashboard → Authentication → URL Configuration → Redirect URLs:
`https://ufqzuowjhdqpydqvcsob.supabase.co/functions/v1/aura-staging-login`
Chỉ thêm URL này, không thay production URL hoặc GitHub Pages.

Sau đó mở trang:
`https://ufqzuowjhdqpydqvcsob.supabase.co/functions/v1/aura-staging-login`

Ở tab Admin: nhập đúng email đã chọn trong chat → **Gửi liên kết đăng nhập** → mở email xác minh **trên chính trình duyệt đã yêu cầu liên kết** (PKCE) → quay lại trang, bấm **Kiểm tra và kích hoạt quyền Admin**. **Không gửi OTP, mật khẩu, JWT hay URL callback có token cho người khác.**

Để test Student: Supabase Dashboard → Authentication → Providers → Anonymous Sign-Ins → bật khi đã cấu hình giới hạn tốc độ / CAPTCHA phù hợp để hạn chế abuse. Mở trang staging trên thiết bị của con → Tạo phiên Student → Admin tạo mã và chuyển trực tiếp cho con → Student nhập mã → Ghép đôi → kiểm tra trạng thái. Trước khi bật anonymous trên public app cần bảo vệ chống đăng ký tự động.

**Lưu ý:** Nếu Supabase email sign-in template/redirect provider chưa được cấu hình, UI có thể báo lỗi; không kết luận tính năng đã E2E. Login page ACTIVE chỉ chứng minh đã triển khai, không chứng minh email đã được giao và đăng nhập thành công.

## Kết quả kiểm tra dữ liệu thời điểm ghi tài liệu
- Allowlist: 1 email hash được bật.
- Supabase Auth user: 0 (Admin chưa tự xác minh).
- Households / learner profiles: 0.
- Pairing requests / devices: 0.
- Không có dữ liệu học sinh thật, kết quả học hoặc Drive file nào được chuyển.
- Authenticated-vs-student thật trên hai thiết bị: **CHƯA KIỂM THỬ**.

## Khi Admin xác minh email thành công
1. Kiểm tra `auth.users.email_confirmed_at` và `is_anonymous = false` trên máy chủ (không lưu địa chỉ email trong public code).
2. Bấm bootstrap và xác nhận có duy nhất 1 `aura_households` + 1 `aura_learners` cho Admin.
3. Kiểm tra Student trước ghép đôi không đọc được hồ sơ/đề, sau ghép đôi thấy đúng một learner.
4. Kiểm tra Student không thể lấy answer key/điểm chưa phát hành; thu hồi thiết bị chặn truy cập mới.
5. Kiểm thử đồng bộ thực qua IndexedDB → Supabase → Admin ở thiết bị thứ hai và logout/login, không mất/trùng dữ liệu.
6. Chỉ sau đó mới đánh dấu **Auth + Pairing P0 E2E PASS**.

## Tài liệu và bảo mật
- Mọi thông số liên quan đến mã ghép đôi và email hash không được in vào log công khai.
- Secret role chỉ tồn tại phía Edge; trang client chỉ dùng publishable key.
- Địa chỉ email Admin thật **không xuất hiện trong bất kỳ file nguồn** của hai chức năng này.
- Khi đổi thiết bị, mã mới nối vào cùng learner_id, không tạo hồ sơ con thứ hai.
- Dữ liệu cũ trên trình duyệt vẫn chưa được sao lưu đầy đủ; không chạy migration dữ liệu và không chỉnh production.
