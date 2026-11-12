# AURA STUDY — Stage 2B: Khôi phục Word gốc, hình và bảng để kiểm định nguồn

**Scope:** dành riêng cho AURA STUDY. **Chưa tự động đưa nội dung vào Question Bank hoặc Exam Engine.**

## Phát hiện thực tế từ 9 DOCX nguồn (2026-11-12)

Qua tài khoản Drive đã kết nối trong dự án, đọc **byte gốc** của 9 DOCX nguồn bị chặn:
- Toán GK1: 5 đề (01–05). Trong 5 DOCX có tổng **18 ảnh nhúng** (2, 4, 4, 4, 4), cùng 55 bảng OOXML. Lần đọc text-only trước đó không chứa hình nên chặn chuyển đổi đề.
- Ngữ văn: 3 DOCX có toàn bộ phần văn bản trong \`word/document.xml\`, không có hình nhúng; nguồn kiểm kê cũ bị giới hạn/truncation khi lấy readable text. Một file có 7 bảng.
- Tiếng Anh: 1 DOCX có 26 bảng và tên file **KHONG_DAP_AN**. Có thể khôi phục bản Word đầy đủ nhưng **không được tự suy diễn đáp án**.

**Đây là phát hiện về cấu trúc file gốc**, không phải kiểm định đáp án/hình đã trùng khớp từng câu hoặc giấy phép xuất bản. Các nguồn cũ vẫn BLOCKED cho đến khi được QA.

## Công cụ Stage 2B hiện có

\`scripts/extract-docx-for-review.py\` dùng Python stdlib, không cần chuyển file Word lên dịch vụ bên ngoài. Trên máy tin cậy, khi đã có **bản DOCX gốc được phép xử lý**, chạy:

    python3 scripts/extract-docx-for-review.py /duong-dan/thu-muc-word/

Hoặc:

    python3 scripts/extract-docx-for-review.py /duong-dan/de-toan-01.docx

Công cụ:
1. Kiểm tra DOCX là ZIP OOXML, CRC, số entry, giới hạn giải nén, chặn traversal, macro và XML DTD.
2. Giữ thứ tự đoạn văn/bảng và các đoạn trong ô bảng; đọc riêng header/footer/footnote/endnote nếu có.
3. Đối chiếu quan hệ \`rId\` của hình nhúng; giữ ảnh gốc và SHA-256, phát hiện ảnh tham chiếu thiếu hoặc ảnh không dùng.
4. Ghi \`blocks.json\`, \`manifest.json\`, \`media/*\` dưới \`.aura_private/docx-review/\`. Dữ liệu này **riêng tư, không commit GitHub**; \`.gitignore\` đã chặn thư mục \`.aura_private/\`.
5. Gắn trạng thái \`CAPTURED_NEEDS_HUMAN_CONTENT_QA\`, \`BLOCKED_INCOMPLETE_CAPTURE\`, hoặc \`BLOCKED_NO_ANSWER\`. Bất kể trạng thái nào, \`eligibleForQuestionBank=false\` và \`answerKeyValidated=false\`.

Công cụ KHÔNG tự đọc tài khoản Google, không tự cấp quyền Drive, không xuất bản câu hỏi, không sửa tài liệu Word. Phải dùng file gốc đã được chủ sở hữu cho phép tải qua một đường kết nối bảo mật. **Không đưa bản Word gốc, ảnh, đề thi hoặc bản trích xuất lên repository công khai**.

## Quy trình kiểm định tiếp theo (chưa đạt)

- **Capture:** đối chiếu số ảnh, bảng, toàn văn, header/footer và tài liệu Word gốc. Kiểm tra từng câu cần hình bằng ảnh gốc; ảnh ở package không đồng nghĩa chúng được gắn đúng câu trong Question Bank.
- **Question QA:** phân tách câu hỏi, dạng bài, đáp án/rubric, bám chương trình học và phân kỳ; không tự suy đoán dữ liệu còn thiếu. Đặc biệt nguồn Tiếng Anh không có đáp án phải có lời giải được xác minh độc lập.
- **Human review:** Admin xác nhận từng câu hoặc cụm câu, lưu nguồn + phiên bản + kết quả review có thể rollback. Trạng thái metadata-reviewed hiện có ở UI không thay cho kiểm định nội dung.
- **Versioned publish:** khi đầy đủ mới cho xuất bản Question Bank; kiểm thử trước trên staging, không bật chấm tự động từ nguồn chưa được QA. Supabase production vẫn NO-GO cho đến khi toàn bộ gate độc lập được xác minh.

## Giới hạn

- Công cụ hiện tập trung DOCX; PDF scan, JPG đơn lẻ, Google Docs native, MathType equation objects, chart/diagram Office, SmartArt, text in unsupported shape, tracked revisions hoặc external image links phải qua công cụ bổ sung/QA thủ công.
- Mức \`CAPTURED_NEEDS_HUMAN_CONTENT_QA\` **không phải công nhận 100% bản Word không lỗi**: còn phải kiểm tra layout bằng bản gốc và xác nhận liên kết từng hình với câu.
- Hoạt động này hiện được chuẩn bị để chạy có kiểm soát; **không có daemon**, không tự chạy sau khi bấm “Nguồn bị chặn” và chưa ghi ngược vào hàng chờ Google Drive trong iPad.
