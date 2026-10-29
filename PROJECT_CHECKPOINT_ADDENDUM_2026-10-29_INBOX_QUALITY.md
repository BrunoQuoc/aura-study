# AURA STUDY — INBOX Quality/Dedup Addendum

**Ngày:** 2026-10-29

## Mục tiêu

Nâng Admin INBOX từ upload + duyệt thủ công thành pipeline quản trị nguồn có kiểm tra trước, nhưng vẫn giữ nguyên nguyên tắc: **AURA đề xuất, Admin quyết định cuối**.

## Chất lượng tài liệu

Khi Admin chọn file từ thiết bị, AURA kiểm tra sơ bộ:

- file có dữ liệu hay rỗng;
- nội dung có đọc/OCR được đủ để đối chiếu hay không;
- ảnh có độ phân giải quá thấp cho OCR hay không;
- với tài liệu được phân loại là đề/bài tập: có thấy dấu hiệu đáp án/lời giải trong phần nội dung AURA đọc được hay chưa.

Trạng thái chất lượng:

- `good`: đạt kiểm tra sơ bộ;
- `review`: cần Admin mở file kiểm tra thêm;
- `blocked`: có lỗi nghiêm trọng như file rỗng.

AURA không kết luận “không có đáp án/lời giải” chỉ vì chưa nhìn thấy trong phần nội dung đã đọc. Trạng thái dùng wording `not_seen`, không biến thành kết luận nguồn thiếu dữ liệu.

## Phát hiện trùng

- SHA-256 được tính cục bộ trong trình duyệt trước upload.
- Trùng chính xác = cùng SHA-256.
- Trùng nghi ngờ = cùng tên + dung lượng nhưng chưa có hash đối chiếu.
- File trùng chính xác bị loại khỏi upload mặc định; Admin được thông báo trước khi tiếp tục các file còn lại.
- Sau upload, hash được lưu trong queue cục bộ và Drive `appProperties.auraSha256`.
- AURA có thể truy vấn các file Drive mà app có quyền truy cập để tìm hash đã tồn tại.
- Index cục bộ: `aura_inbox_file_index_v1`.

## AURA đề xuất / Admin xác nhận

Decision history dùng `aura_inbox_decisions_v1` và lưu hai lớp riêng:

- `auraSuggestion`: subject/docType/period/confidence/reasons/classifierVersion do AURA đề xuất.
- `adminConfirmation`: status/subject/docType/period/note và `changedFromAura` phản ánh quyết định cuối của Admin.

Decision record cũng lưu `sha256`, `qualityAudit`, `duplicateAudit` khi có.

Drive metadata sau quyết định được bổ sung các trường kỹ thuật như:

- `auraSha256`
- `auraQualityStatus`
- `auraQualityVersion`
- `auraSuggestedSubject`
- `auraSuggestedDocType`
- `auraSuggestedPeriod`
- `auraAdminSubject`
- `auraAdminDocType`
- `auraAdminPeriod`
- `auraAdminDecision`

## Quy tắc vận hành

1. Quality check chỉ là kiểm tra sơ bộ, không thay thế Admin.
2. Duplicate exact không tự xóa file cũ và không tự ghi đè nguồn.
3. Admin vẫn phải duyệt/từ chối rõ ràng.
4. Duyệt -> move sang thư mục đích do Admin chọn.
5. Từ chối -> move vào `00_INBOX/99_REJECTED` và gắn `REJECTED`.
6. Không sửa metadata nguồn bất biến; các quyết định vận hành được lưu ở lớp riêng.
