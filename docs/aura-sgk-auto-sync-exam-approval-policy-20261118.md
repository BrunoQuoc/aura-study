# AURA STUDY — SGK auto-sync / duyệt bộ đề kiểm tra

Ngày 18/11/2026 · Staging: Supabase `aura-study-staging` · Giao diện cũ Admin/Student.

## Quy tắc Owner chốt

1. **SGK từ nguồn chính thức do Owner đã cung cấp:** AURA tự lấy danh mục nguồn và cập nhật khi Student mở trang học; **không cần duyệt từng tài liệu và không có nút Duyệt/Xuất bản thủ công cho SGK**.
2. **Bài học/kiến thức theo SGK:** tham chiếu nguồn và mục lục được tự nạp. Không tự coi câu hỏi/lời giải AI là bài SGK đã kiểm chứng.
3. **Bộ đề thi/đề kiểm tra Owner đưa vào INBOX:** luôn cần quyết định **Admin APPROVED** riêng trước khi bật nút Xuất bản cho Student. Đề ở đây là tài liệu ôn tập Staging; Exam Engine/điểm chính thức chưa được bật.
4. **Đáp án, barem:** không được đưa vào kho Student chỉ vì có SGK; theo quyền/chu kỳ công bố của đề đã được duyệt (chưa tự động công bố).

## Nguồn SGK hiện được liên kết tự động

- `SGK-M6-KNTT-T1` — Toán 6 Kết nối tri thức, Tập 1 — https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-6-tap-mot.4699854777
- `SGK-M6-KNTT-T2` — Toán 6 Kết nối tri thức, Tập 2 — https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-6-tap-hai.4699864675

Tại thời điểm thay đổi: 2 nguồn, 78 mục lục được đối chiếu (không phải 78 bài tập nguyên văn); `full_textbook_verified=false`. Nội dung trang SGK là từ nhà xuất bản qua liên kết trực tiếp, không tự sao chép hoặc lưu trữ toàn văn ở AURA.

## Luồng kỹ thuật

- `public.aura_sgk_auto_catalog_v1(p_actor_uid)`: RPC chỉ server-role được gọi, lấy nguồn từ `aura_review.sgk_source_registry`, `sgk_primary_toc_sources` và `sgk_primary_toc_items`. Chỉ xuất nguồn có hai cờ xác minh NXB và URL trùng miền nhà xuất bản đã cấu hình; không đọc/ghi câu hỏi, đề, thang điểm.
- `aura-legacy-content-sync-v1` (Edge Function version 3): action `sgk_auto_catalog` xác thực Admin hoặc Student đã ghép. Trả danh mục SGK mà **không cần duyệt**.
- `student_sgk_auto_catalog.js`: mở Student cũ → Bài học/Hôm nay/Ôn thi → tự nạp SGK, lấy dữ liệu mới từ máy chủ sau tối đa 5 phút cache trong phiên; focus làm mới. Học sinh mở sách tại nguồn NXB để xem phiên bản nội dung nguồn đang phục vụ.
- `admin_legacy_cloud_sync.js`: hiển thị SGK tự động riêng; hàng chờ Xuất bản thủ công chỉ lọc bộ `exam`, hoặc `practice` có tên **đề thi / đề kiểm tra** đã duyệt ở INBOX; mã nguồn `ADMIN_APPROVED_FINAL` cũng được nhận diện.
- Edge `admin_publish`: chỉ chấp nhận loại **đề thi/kiểm tra**. Những học liệu SGK được tự đồng bộ qua `sgk_auto_catalog`, không đi qua đường duyệt này.
- Không sửa thiết kế, menu, điều hướng hoặc các bộ bài học, đề thi đã có.

## Bằng chứng và giới hạn

- SQL kiểm tra trực tiếp sau migration cho 2 nguồn, tổng 78 mục, `review_required=false`, `full_textbook_verified=false`. Quyền thực thi catalog RPC: `anon=false`, `authenticated=false`, `service_role=true`.
- **Tự đồng bộ tại thời điểm truy cập và làm mới phiên**, không phải job quét tải toàn văn SGK chạy 24/7. Hệ thống đang dẫn tới nguồn chính thức; chưa tự phát hiện/nhập mọi thay đổi từng trang sách thành câu hỏi tương tác. Muốn mở rộng sang SGK các môn khác cần đăng ký thêm URL nguồn đáng tin cậy vào registry; việc đăng ký nguồn khác với duyệt từng tài liệu.
- Tính năng duyệt đề không làm thay đổi cờ thi thật và không tự lộ đáp án.
- Không công nhận QA trên thiết bị thật khi chưa có bài test xuyên thiết bị và phiên Student thực tế.
