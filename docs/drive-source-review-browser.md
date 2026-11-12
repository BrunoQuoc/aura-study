# AURA STUDY — Nguồn Drive → hàng chờ kiểm tra metadata

## Trạng thái

**Giai đoạn 2A: Đã lập trình luồng người dùng.** Việc kết nối OAuth thực tế trên tài khoản Google của chủ sở hữu vẫn cần xác nhận trực tiếp trên Admin; CI chỉ sử dụng mock. Không khẳng định tự động nhập câu hỏi hoặc chạy nền.

## Vào Admin

1. Mở **Admin → Nguồn Drive** hoặc nút **Quét nguồn Google Drive** ở Tổng quan.
2. Bấm **Kết nối Google — chỉ đọc metadata**. Google hiển thị trang consent. OAuth scope yêu cầu: \`https://www.googleapis.com/auth/drive.metadata.readonly\`. Phải đăng nhập Google đã được phép xem các file gốc trong cây INBOX.
3. Chọn đúng thư mục **00_INBOX**. Nếu đã chọn bằng Google Picker trong INBOX cũ, AURA tự dùng ID đã lưu; nếu chưa, dán **liên kết Google Drive của thư mục 00_INBOX**, không phải đường dẫn một file Word. Không dán access token, mật khẩu hoặc thông tin bí mật.
4. Bấm **Quét nguồn và cập nhật hàng chờ**. Lần quét đọc metadata toàn bộ thư mục con, hỗ trợ pagination và giới hạn an toàn; không tự chuyển/xóa nội dung.
5. Vào **Hàng chờ kiểm tra nguồn**. Bộ lọc gồm **Chờ kiểm tra**, **Nguồn bị chặn**, **Đã xem thông tin**, **Không còn trong INBOX** và **Tất cả**.
6. Với tài liệu không bị chặn, Admin kiểm tra môn/loại tài liệu và nguồn gốc, ghi chú lý do, đánh dấu xác nhận metadata rồi bấm **Ghi nhận đã kiểm tra thông tin**. Kết quả chỉ là metadata reviewed; chưa có nội dung được trích xuất, chưa có câu hỏi chấm tự động.
7. Tài liệu thiếu hình, trích xuất rút gọn hoặc không có đáp án vẫn nằm ở **Nguồn bị chặn**. Admin chỉ có thể ghi chú để bổ sung file nguồn, không chuyển trạng thái này thành sẵn sàng xuất bản.
8. Quét lại sau khi Drive đổi: nguồn mới vào hàng chờ; file thay đổi phiên bản hoặc đường dẫn trở lại kiểm tra; file rời cây INBOX chỉ được ghi "không còn trong INBOX", không coi là đã xóa từ Drive.

## Bảo mật và quyền truy cập

- **Google OAuth riêng, có đồng ý của chủ sở hữu:** \`drive.metadata.readonly\` cho phép API đọc metadata nhiều file mà tài khoản Google được phép truy cập; scope không bị giới hạn kỹ thuật trong OAuth chỉ ở \`00_INBOX\`. Mã AURA chỉ quét từ ID root chọn, xác minh tên \`00_INBOX\`. Người dùng có thể từ chối quyền và không cần bật tính năng.
- **Không dùng quyền của uploader \`drive.file\`** để tự tuyên bố đã quét đủ các file được upload trực tiếp trên Drive. Token đọc metadata được lấy bằng GIS client gốc, không qua proxy token upload.
- **Không lưu OAuth token** trong localStorage, sessionStorage, IndexedDB hay mã nguồn. Token trong RAM của tab; reload cần kết nối lại.
- **Không tải file gốc:** metadata scan chỉ lấy ID/tên/MIME/size/ngày sửa/checksum/webViewLink. Không trích xuất hình, text hoặc đáp án, không thể xác nhận chất lượng đề.
- **Hàng chờ cục bộ** ở \`aura_drive_source_review_queue_v1\`, tách khỏi \`aura_inbox_queue_v1\` và mọi nút duyệt/move của uploader. Ghi chú và ID file lưu trong localStorage của trình duyệt Admin, không tự đồng bộ hoặc gửi vào GitHub.
- **Chưa có xác thực Admin máy chủ** ở GitHub Pages. Không dùng trang như một cổng đa gia đình công khai cho nội dung nhạy cảm.
- **Google Cloud consent:** scope metadata.readonly có thể đòi cấu hình consent và test users/Google verification. Nếu Google trả access_denied/403, cần chủ sở hữu kiểm tra cấu hình hợp lệ, không vượt quyền bằng scope khác hoặc cách xử lý không an toàn.

## Tương thích

- Phần **Phân kỳ** không thay đổi, không động vào Question Bank/exam engine, generator, auto grading hay Supabase production gates.
- Đã phát triển kiểm thử cô lập với stub OAuth và Drive API, các viewport 820x1180, 390x844, 1366x900. Đây không phải kiểm thử Google OAuth consent trực tiếp trên iPad Safari.

## Bước tiếp theo chưa bật

AURA cần **trình xử lý nội dung** có thể đọc các file gốc có sự cho phép của chủ sở hữu, trích xuất đầy đủ hình/text/đáp án, kiểm tra chất lượng, phê duyệt từng câu hỏi và xuất bản Question Bank có version/rollback. Lịch đồng bộ tự động cần backend được xác thực và cơ chế làm mới token an toàn; chưa kích hoạt.
