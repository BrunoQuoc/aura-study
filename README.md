# AURA STUDY

PWA học tập lớp 6 tối ưu cho iPad/iPhone/Android. GitHub Pages là lớp triển khai ứng dụng; Google Drive là kho dữ liệu gốc.

## Phiên bản hiện tại
V2.4.0 nâng Bộ tạo đề thành **Đề thi thông minh**: cân mức độ Nhận biết – Thông hiểu – Vận dụng, hạn chế lặp câu gần đây, ghi nhớ nhóm kỹ năng bé thường sai và ưu tiên luyện lại phần yếu.

## Đề thi thông minh V2.4
- Có mục `🎲 Tạo đề` trên desktop và mobile.
- Chọn môn, căn cứ tạo đề, số câu, mức độ, từ khóa và chiến lược V2.4.
- Các chiến lược: `Cân bằng 40/40/20`, `Ưu tiên phần yếu`, `Mô phỏng kiểm tra`, `Củng cố nền tảng`.
- V2.4 lưu lịch sử câu gần đây để giảm lặp giữa các đề.
- Sau khi chấm, hệ thống cập nhật thống kê đúng/sai theo nhóm kỹ năng có thể chấm tự động và ưu tiên các nhóm đang yếu ở những đề sau.
- Toán: tiếp tục sinh biến thể tham số, tự tính đáp án, đồng thời phân nhóm dạng bài để V2.4 chọn theo mức độ.
- Ngữ văn: tiếp tục dùng ngân hàng đọc hiểu + Thực hành Tiếng Việt HKI; V2.4 cân mức độ và chống lặp. Các câu tự luận không tự đánh giá đúng/sai nếu không có tiêu chí chấm xác định.

## Tiếng Anh Units 1–3
- V2.3.1 có 29 câu trắc nghiệm/Reading + 16 Rewrite.
- V2.4 bổ sung thêm 36 câu trắc nghiệm/Reading + 12 Rewrite mới cùng dạng.
- Tổng ngân hàng hiện tại: **93 mục**.
- Phạm vi: Unit 1 School, Unit 2 House, Unit 3 Friends, Reading và Rewrite.
- Có các nút tạo nhanh: `Unit 1 • School`, `Unit 2 • House`, `Unit 3 • Friends`, `Reading`, `Rewrite`, `Review Units 1–3`.
- Chấm tự động toàn bộ trắc nghiệm và các Rewrite có đáp án xác định.
- Các câu mới do AURA soạn đều được ghi nhãn `câu mới cùng dạng`; hệ thống không gọi chúng là câu gốc của tài liệu.

## Cách thức hoạt động
1. Tài liệu gốc được lưu trên Google Drive theo cấu trúc Lớp → Môn → Bài học/Bài tập/Đề/Đáp án/Tham khảo.
2. File mới được đưa vào `00_INBOX`.
3. Nova đọc nội dung, xác định môn/loại tài liệu, đổi tên chuẩn, ghép đề–đáp án và chuyển đúng thư mục.
4. Nội dung đủ dữ kiện được chuẩn hóa vào AURA DATA trên repo; GitHub Pages tự publish.
5. Bé sử dụng AURA STUDY trên iPad/mobile. Bài đang làm, tiến độ ôn tập, đề ngẫu nhiên, lịch sử câu và thống kê kỹ năng lưu cục bộ bằng localStorage.

## Nguyên tắc dữ liệu
- Google Drive là nguồn dữ liệu gốc.
- Không tự tạo đáp án cho câu nguồn khi tài liệu không cung cấp đủ dữ kiện.
- Câu mới do generator tạo phải gắn nhãn là biến thể/câu mới cùng dạng, không giả là câu gốc.
- Câu hình/scan thiếu dữ kiện thật không được đưa vào chấm tự động.
- Thống kê phần yếu chỉ dựa trên các mục có thể xác định đúng/sai đáng tin cậy.

## Sao lưu & khôi phục
- `Sao lưu`: xuất JSON chứa lịch sử điểm, bài đang làm, tiến độ ôn tập, đề ngẫu nhiên, lịch sử chống lặp và thống kê kỹ năng V2.4.
- `Khôi phục`: phục hồi các dữ liệu trên thiết bị mới.
- V2.4 vẫn đọc được backup kiểu cũ chỉ chứa `attempts`.

## Sử dụng trên iPad/iPhone
Mở trang GitHub Pages bằng Safari → Chia sẻ → Thêm vào Màn hình chính.
