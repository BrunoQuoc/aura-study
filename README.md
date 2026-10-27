# AURA STUDY

PWA học tập lớp 6 tối ưu cho iPad/iPhone/Android. GitHub Pages là lớp triển khai ứng dụng; Google Drive là kho dữ liệu gốc.

## Phiên bản hiện tại
V2.3.1 mở Bộ tạo đề Tiếng Anh Units 1–3, bổ sung chấm tự động trắc nghiệm + Rewrite và tiếp tục giữ engine Toán, ngân hàng Ngữ văn, backup/restore và PWA offline.

## Bộ tạo đề ngẫu nhiên V2.3.1
- Có mục `🎲 Tạo đề` trên desktop và mobile.
- Chọn môn, căn cứ tạo đề, số câu, mức độ và từ khóa chủ đề.
- `Theo mẫu đề`: giữ cấu trúc luyện tập gần mẫu đã chuẩn hóa.
- `Theo đề cương`: ưu tiên ngân hàng ôn tập và từ khóa.
- Toán: trộn câu nguồn đã xác minh với biến thể tham số cùng dạng; đáp án biến thể được tính trực tiếp.
- Ngữ văn: dùng ngân hàng đọc hiểu + Thực hành Tiếng Việt HKI đã chuẩn hóa.
- Tiếng Anh: đã mở Units 1–3 theo các nhóm School, House, Friends, Reading và Rewrite.
- Ngân hàng Tiếng Anh V2.3.1 có 29 câu trắc nghiệm/Reading và 16 câu Rewrite.
- Các câu Tiếng Anh mới được gắn nhãn `Câu mới cùng dạng` / `Biến thể cùng dạng`; hệ thống không gọi chúng là câu gốc của tài liệu.
- Chấm tự động Tiếng Anh: toàn bộ trắc nghiệm và Rewrite có đáp án xác định. Rewrite được chuẩn hóa chữ hoa/thường, khoảng trắng, dấu nháy và dấu câu cuối trước khi so khớp.
- Mỗi đề có seed/mã đề riêng; có thể tạo đề khác, in đề, mở lại và lưu kết quả.

## Cách thức hoạt động
1. Tài liệu gốc được lưu trên Google Drive theo cấu trúc Lớp → Môn → Bài học/Bài tập/Đề/Đáp án/Tham khảo.
2. File mới được đưa vào `00_INBOX`.
3. Nova đọc nội dung, xác định môn/loại tài liệu, đổi tên chuẩn, ghép đề–đáp án và chuyển đúng thư mục.
4. Nội dung đủ dữ kiện được chuẩn hóa vào AURA DATA trên repo; GitHub Pages tự publish.
5. Bé sử dụng AURA STUDY trên iPad/mobile. Bài đang làm, tiến độ ôn tập, đề ngẫu nhiên và kết quả lưu cục bộ bằng localStorage.

## Quy trình cập nhật tài liệu chuẩn
- Bước 1: Thả PDF/DOCX vào `00_INBOX`; không bắt buộc đổi tên trước.
- Bước 2: Nhắn `Nova, chuẩn hóa INBOX`.
- Bước 3: Nova chuẩn hóa tên theo mẫu `L6_MON_LOAI_HOCKY-CHUDE_SOTHUTU_NGAY`.
- Ví dụ: `L6_TOAN_DE_GK1_SO02_20261017.pdf`.
- Bước 4: Khi muốn đưa nội dung mới vào app, nhắn `Nova, cập nhật tài liệu mới vào AURA STUDY`.
- Bước 5: Nếu tài liệu là mẫu đề hoặc đề cương, Nova chuẩn hóa dạng bài/câu hỏi/đáp án đủ dữ kiện vào ngân hàng để Generator sử dụng.

## Nguyên tắc dữ liệu
- Google Drive là nguồn dữ liệu gốc.
- Không tự tạo đáp án cho câu nguồn khi tài liệu không cung cấp đủ dữ kiện.
- Câu mới do generator tạo phải gắn nhãn là biến thể/câu mới cùng dạng, không giả là câu gốc.
- Đề và đáp án dùng cùng mã để dễ ghép cặp.
- Câu hình/scan thiếu dữ kiện thật không được đưa vào chấm tự động.

## Sử dụng trên iPad/iPhone
Mở trang GitHub Pages bằng Safari → Chia sẻ → Thêm vào Màn hình chính.

## Sao lưu & khôi phục
- `Sao lưu`: xuất JSON chứa lịch sử điểm, bài đang làm, tiến độ ôn tập, đề ngẫu nhiên gần nhất và bài làm của đề ngẫu nhiên.
- `Khôi phục`: chọn file backup JSON đã xuất trước đó để phục hồi dữ liệu trên thiết bị mới.
- V2.3.1 vẫn đọc được backup kiểu cũ chỉ chứa `attempts`.
