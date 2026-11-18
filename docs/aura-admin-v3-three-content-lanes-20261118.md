# AURA STUDY — ADMIN V3 · Một kho tài liệu, ba luồng xử lý

Ngày: 18/11/2026 (Asia/Ho_Chi_Minh). Môi trường: Supabase Staging `ufqzuowjhdqpydqvcsob` + GitHub Pages `admin-direct.html`.

## Quy tắc Owner chốt

- **Sách giáo khoa:** lấy từ nguồn chuẩn đã đăng ký, tự đồng bộ danh mục/khung bài, không yêu cầu Admin duyệt từng sách hay bài. Nguồn phải có chứng cứ và quyền sử dụng nếu sao chép nội dung.
- **Bài tập:** tự tổ chức theo nguồn SGK được xác minh và bài học; kiểm tra tính đúng đắn toán học, hình vẽ và đáp án là *QA kỹ thuật* trước khi hiển thị, không phải Admin duyệt từng bài.
- **Kiểm tra:** bộ đề thi, đề kiểm tra và **bài mẫu bên ngoài SGK** mà Owner đưa lên phải qua Admin kiểm tra và xác nhận, sau đó mới được xuất bản.
- Đáp án riêng, bài thi chính thức, điểm thi, chữ ký giáo viên không được tự bật.

## Giao diện Admin V3

Giữ URL cũ `admin-direct.html`, cập nhật cấu trúc thành đúng 5 mục:

1. Tổng quan
2. Tài liệu (tab Sách giáo khoa | Bài tập | Kiểm tra)
3. Học sinh
4. Kết quả
5. Hệ thống

Các chức năng cũ vẫn giữ mã và dữ liệu: INBOX/Google Drive/auto route, giáo trình, tạo đề, phê duyệt bộ đề, phân kỳ, học sinh, kết quả, backup/restore, giám sát; chỉ được gom lại theo luồng. **Không xóa dữ liệu cũ** và không đổi Student UI trong PR này. `admin_unified_v3.js` điều hướng tới chức năng cũ, `admin_unified_v3.css` tối ưu điện thoại/iPad/máy tính.

## Backend và dữ liệu thực

- `aura_review.standard_learning_units_v3`: 78 đơn vị nguồn cấp mục lục NXB đã được đưa vào cấu trúc chuẩn môn/lớp/tập/chương/nhóm. **53 SGK** và **25 luyện/ôn**; `content_status=OUTLINE_ONLY`, `evidence_level=PUBLISHER_TOC_ONLY`, `requires_admin_approval=false`. Trigger tự đồng bộ bản ghi khi tên/số trang nguồn thay đổi.
- Nguồn SGK chính thức: Toán 6 Kết nối tri thức tập 1/2 (đang có 2 nguồn). Không tự suy diễn nội dung sách mới từ mục lục.
- Học liệu AI có sẵn: **36 bài hướng dẫn nháp** và **15 mô-đun luyện tập nháp**. Số bài SGK gốc có chứng cứ từng trang hiện **0**; không trộn với nội dung gốc.
- `aura_review.manual_material_approvals_v3`: biên bản duyệt riêng cho đề thi/kiểm tra và bài mẫu ngoài SGK. Không dùng bảng này cho SGK và bài tập từ nguồn chuẩn.
- `aura_manual_material_approve_v3` và `aura_legacy_content_admin_publish_v1`: chỉ service role gọi qua Edge đã xác thực Admin, có yêu cầu quyết định duyệt phù hợp trước khi xuất bản. Đã kiểm chứng lệnh thử xuất bản không có duyệt trả `MANUAL_APPROVAL_REQUIRED`.
- `aura_admin_content_overview_v3`: lấy số liệu nguồn có chứng cứ; chỉ service role được gọi.
- Edge `aura-legacy-content-sync-v1` version 4 với actions `admin_content_overview`, `admin_manual_approve`, `admin_publish` có kiểm tra duyệt. Các nhóm SGK/practice không đi qua đường xuất bản thủ công.

## Hạn chế còn thực tế

- Tự đồng bộ **nguồn/mục lục và khung bài** không đồng nghĩa đã tải toàn văn hoặc chuẩn hóa 100% SGK thành bài học/bài tập có lời giải. Cần bộ trích xuất hợp lệ, quyền sao chép và kiểm định nội dung phù hợp nguồn.
- 36 nháp bài học, 15 mô-đun luyện tập là học liệu tự biên soạn/chưa chứng nhận nguyên văn SGK. Không thể xuất bản như SGK gốc chỉ dựa vào mục lục.
- Chỉ có hai nguồn Toán 6 được đăng ký; các môn khác chưa có nguồn đủ xác minh.
- INBOX và một số công cụ cũ có dữ liệu lưu cục bộ trình duyệt. Muốn duyệt trên nhiều máy và đồng bộ toàn diện cần tiếp tục chuyển hàng chờ lên máy chủ.
- Thi thật, chấm điểm/đáp án và kiểm chứng thiết bị thật vẫn giữ trạng thái riêng, không tự nghiệm thu.

## Kiểm thử

- Unit/regression offline chạy `node --test tests/legacy-private-assets-v2.test.mjs tests/sgk-auto-review-policy.test.mjs tests/admin-unified-v3.test.mjs`.
- Browser smoke V3 trên phone/iPad/desktop với mô phỏng máy chủ, chạy Ubuntu 24.04 Chromium theo workflow `aura-admin-v3-unified-ui-qa.yml`.
- SQL verify: 78 normalized units (53 SGK, 25 practice), toàn bộ không có gate duyệt; `anon/authenticated` không gọi được các RPC đặc quyền, chỉ service_role. Chưa có bộ đề nào xuất bản, chưa có nghiệm thu máy thật.

## Nghiệm thu theo hành vi

1. Vào Admin V3, chỉ thấy 5 mục.
2. Tài liệu → SGK: 2 nguồn NXB Toán 6, nguồn chính thức và các khung bài chưa chứng nhận trọn nội dung.
3. Tài liệu → Bài tập: danh mục luyện/ôn từ nguồn chuẩn và tình trạng QA; không hiển thị nút Admin duyệt từng bài.
4. Tài liệu → Kiểm tra: INBOX upload, kiểm tra/duyệt, xuất bản bộ đề/bài mẫu; Student nhận khi được ghép thiết bị.
5. Học sinh/Kết quả/Hệ thống: chức năng cũ vẫn hoạt động; màn nhỏ không bị tràn ngang.
