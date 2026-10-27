# AURA STUDY

PWA học tập lớp 6 tối ưu cho iPad/iPhone/Android. GitHub Pages là lớp triển khai ứng dụng; Google Drive là kho dữ liệu gốc.

## Phiên bản hiện tại
**V2.4.1** là bản tinh gọn giao diện/dữ liệu hiển thị trên nền Đề thi thông minh V2.4. Nội dung học gốc không bị xóa hoặc thay đổi; lớp hiển thị được rút gọn để bé nhìn nhanh và thao tác dễ hơn.

### V2.4.1 – Clean UI/Data
- Chuẩn hóa hệ icon vector cho 8 môn, thanh điều hướng, tài liệu, sao lưu/khôi phục.
- Làm lại logo AURA theo biểu tượng sách mở + ánh sáng; đồng bộ launcher icon 180/192/512 px.
- Mỗi môn có một màu nhận diện riêng nhưng vẫn giữ cùng ngôn ngữ thiết kế.
- Thẻ môn học chỉ hiện dữ liệu cần thiết: số đề/câu/bài đang có, trạng thái `Sẵn sàng` hoặc `Đang cập nhật`.
- Trang chủ rút gọn thông điệp còn: học – ôn – theo dõi phần yếu – offline.
- Card, nút, form, ghi chú, trạng thái và thanh mobile được tinh gọn spacing, font và độ tương phản.
- Lớp làm đẹp nằm ở `ui_polish.css` + `ui_polish.js`, tách khỏi dữ liệu học để giảm rủi ro làm hỏng nội dung.

## Đề thi thông minh V2.4
- Có mục `Tạo đề` trên desktop và mobile.
- Chọn môn, căn cứ tạo đề, số câu, mức độ, từ khóa và chiến lược.
- Các chiến lược: `Cân bằng 40/40/20`, `Ưu tiên phần yếu`, `Mô phỏng kiểm tra`, `Củng cố nền tảng`.
- Lưu lịch sử câu gần đây để giảm lặp giữa các đề.
- Sau khi chấm, hệ thống cập nhật thống kê đúng/sai theo nhóm kỹ năng có thể chấm tự động và ưu tiên các nhóm đang yếu ở những đề sau.
- Toán tiếp tục sinh biến thể tham số và tự tính đáp án.
- Ngữ văn tiếp tục dùng ngân hàng đọc hiểu + Thực hành Tiếng Việt HKI; câu tự luận không tự đánh giá đúng/sai khi chưa có tiêu chí xác định.

## Tiếng Anh Units 1–3
- Tổng ngân hàng hiện tại: **93 mục**.
- Phạm vi: Unit 1 School, Unit 2 House, Unit 3 Friends, Reading và Rewrite.
- Có các nút tạo nhanh: `Unit 1 • School`, `Unit 2 • House`, `Unit 3 • Friends`, `Reading`, `Rewrite`, `Review Units 1–3`.
- Chấm tự động toàn bộ trắc nghiệm và các Rewrite có đáp án xác định.
- Các câu mới do AURA soạn được ghi nhãn `câu mới cùng dạng`; hệ thống không gọi chúng là câu gốc của tài liệu.

## Cách thức hoạt động
1. Tài liệu gốc lưu trên Google Drive theo cấu trúc Lớp → Môn → Bài học/Bài tập/Đề/Đáp án/Tham khảo.
2. File mới đưa vào `00_INBOX`.
3. Nova đọc nội dung, xác định môn/loại tài liệu, đổi tên chuẩn, ghép đề–đáp án và chuyển đúng thư mục.
4. Nội dung đủ dữ kiện được chuẩn hóa vào AURA DATA trên repo; GitHub Pages tự publish.
5. Bé sử dụng AURA STUDY trên iPad/mobile; dữ liệu học cục bộ lưu bằng localStorage.

## Nguyên tắc dữ liệu
- Google Drive là nguồn dữ liệu gốc.
- Không tự tạo đáp án cho câu nguồn khi tài liệu không cung cấp đủ dữ kiện.
- Câu mới do generator tạo phải gắn nhãn là biến thể/câu mới cùng dạng, không giả là câu gốc.
- Câu hình/scan thiếu dữ kiện thật không được đưa vào chấm tự động.
- Thống kê phần yếu chỉ dựa trên các mục có thể xác định đúng/sai đáng tin cậy.

## Sao lưu & khôi phục
- `Sao lưu`: xuất JSON chứa lịch sử điểm, bài đang làm, tiến độ ôn tập, đề ngẫu nhiên, lịch sử chống lặp và thống kê kỹ năng.
- `Khôi phục`: phục hồi các dữ liệu trên thiết bị mới.
- V2.4.1 vẫn đọc được backup kiểu cũ chỉ chứa `attempts`.

## Sử dụng trên iPad/iPhone
Mở trang GitHub Pages bằng Safari → Chia sẻ → Thêm vào Màn hình chính.
