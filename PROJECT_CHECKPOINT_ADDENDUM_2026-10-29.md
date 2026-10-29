# AURA STUDY — Checkpoint Addendum 2026-10-29

## Admin INBOX: AURA phân loại trước, Admin quyết định cuối

Đã bổ sung classifier cục bộ cho luồng Admin INBOX.

### Quy tắc

- AURA chỉ **đề xuất** `subject`, `docType`, `period` và mức `confidence`.
- Admin luôn có quyền sửa đề xuất trước khi duyệt.
- File không tự rời `00_INBOX`; chỉ move sau hành động **Duyệt & chọn thư mục đích** của Admin.
- Khi thiếu căn cứ, classifier để `Chưa xác định` hoặc confidence thấp; không tự gán mạnh để lấp dữ liệu.

### Nguồn phân tích

Với file mới được chọn từ thiết bị, classifier có thể đọc cục bộ:

- TXT/CSV/MD/JSON/XML/HTML: text trực tiếp.
- PDF: text tối đa các trang đầu; nếu gần như không có text, thử OCR trang đầu.
- DOCX/PPTX/XLSX: trích text từ cấu trúc Open XML.
- JPG/PNG/WEBP và ảnh tương tự: OCR cục bộ khi kích thước phù hợp.
- Định dạng chưa hỗ trợ: chỉ dùng tên file và hạ confidence.

Các thư viện đọc file/OCR chạy trong browser. Không có backend/LLM bên ngoài nhận nội dung file để phân loại.

### Dữ liệu lưu cục bộ

- `aura_inbox_predictions_v1`: cache đề xuất classifier.
- `aura_inbox_queue_v1`: hàng chờ + đề xuất + quyết định Admin.
- Ghi `adminChangedSuggestion` để biết Admin có sửa khác đề xuất AURA hay không.

### Giới hạn

- File đã nằm sẵn trong INBOX trước khi classifier được bật chỉ được seed đề xuất theo **tên file**. Muốn phân tích nội dung đầy đủ, chọn/upload lại file từ thiết bị trong phiên Admin.
- OCR và đọc PDF/Office phụ thuộc khả năng tải thư viện client-side; nếu thất bại, hệ thống phải hạ confidence và không suy đoán mạnh.
- Classifier không kiểm tra đáp án/lời giải ở bước này; đây chỉ là phân loại tài liệu trước khi Admin duyệt.

### Production modules

- `admin_inbox_classifier_core.js`
- `admin_inbox_classifier_ui.js`
- `admin_inbox_classifier.css`
- `admin-direct.html` load classifier sau `admin_inbox.js`.

Nguyên tắc vận hành tiếp tục giữ: **SOURCE bất biến; AURA đề xuất; Admin quyết định cuối.**
