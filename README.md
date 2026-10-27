# AURA STUDY

PWA học tập lớp 6 tối ưu cho iPad/iPhone/Android. GitHub Pages là lớp triển khai ứng dụng; Google Drive là kho dữ liệu gốc.

## Phiên bản hiện tại
V2.3.0 bổ sung Bộ tạo đề ngẫu nhiên theo mẫu đề / đề cương ôn tập, tiếp tục giữ sao lưu/khôi phục đầy đủ dữ liệu học cục bộ và PWA offline.

## Cách thức hoạt động
1. Tài liệu gốc được lưu trên Google Drive theo cấu trúc Lớp → Môn → Bài học/Bài tập/Đề/Đáp án/Tham khảo.
2. File mới được đưa vào `00_INBOX`.
3. Nova đọc nội dung, xác định môn/loại tài liệu, đổi tên chuẩn, ghép đề–đáp án và chuyển đúng thư mục.
4. Nội dung đủ dữ kiện được chuẩn hóa vào AURA DATA trên repo; GitHub Pages tự publish.
5. Bé sử dụng AURA STUDY trên iPad/mobile. Bài đang làm, tiến độ ôn tập, đề ngẫu nhiên và kết quả lưu cục bộ bằng localStorage.

## Bộ tạo đề ngẫu nhiên V2.3
- Có mục `🎲 Tạo đề` riêng trên desktop và mobile.
- Chọn môn, căn cứ tạo đề, số câu, mức độ và từ khóa chủ đề.
- `Theo mẫu đề`: Toán trộn các câu nguồn đã xác minh với các biến thể tham số cùng dạng; đáp án biến thể được tính trực tiếp từ dữ kiện sinh ra.
- `Theo đề cương`: ưu tiên ngân hàng ôn tập của môn và từ khóa người dùng nhập.
- Toán: hỗ trợ trắc nghiệm + tự luận; phần trắc nghiệm chấm tự động và lưu lịch sử.
- Ngữ văn: rút ngẫu nhiên từ câu hỏi/đáp án đã có trong ngân hàng ôn tập; không tự bịa đáp án ngoài nguồn.
- Tiếng Anh: hiện tạm khóa sinh đề khi dữ liệu chỉ có đáp án tóm tắt mà thiếu nguyên câu hỏi. Khi câu hỏi nguồn được đồng bộ đủ, bộ tạo đề tự mở.
- Mỗi đề có seed/mã đề riêng; có thể tạo đề khác, in đề và mở lại đề gần nhất.

## Quy trình cập nhật tài liệu chuẩn
- Bước 1: Thả PDF/DOCX vào `00_INBOX`; không bắt buộc đổi tên trước.
- Bước 2: Nhắn `Nova, chuẩn hóa INBOX`.
- Bước 3: Nova chuẩn hóa tên theo mẫu `L6_MON_LOAI_HOCKY-CHUDE_SOTHUTU_NGAY`.
- Ví dụ: `L6_TOAN_DE_GK1_SO02_20261017.pdf`.
- Bước 4: Khi muốn đưa nội dung mới vào app, nhắn `Nova, cập nhật tài liệu mới vào AURA STUDY`.
- Bước 5: Nếu tài liệu là mẫu đề hoặc đề cương, Nova chuẩn hóa câu hỏi/đáp án đủ dữ kiện vào ngân hàng để Bộ tạo đề V2.3 sử dụng.

## Nguyên tắc dữ liệu
- Google Drive là nguồn dữ liệu chuẩn.
- Không tự tạo đáp án cho câu nguồn khi tài liệu không cung cấp đủ dữ kiện.
- Đề và đáp án dùng cùng mã để dễ ghép cặp.
- Generator chỉ dùng câu nguồn đủ dữ kiện hoặc các biến thể tham số có thể tự tính đáp án một cách xác định.
- Câu hình/scan thiếu dữ kiện thật không được đưa vào chấm tự động.

## Sử dụng trên iPad/iPhone
Mở trang GitHub Pages bằng Safari → Chia sẻ → Thêm vào Màn hình chính.

## Sao lưu & khôi phục
- `Sao lưu`: xuất JSON chứa lịch sử điểm, bài đang làm, tiến độ ôn tập, đề ngẫu nhiên gần nhất và bài làm của đề ngẫu nhiên.
- `Khôi phục`: chọn file backup JSON đã xuất trước đó để phục hồi dữ liệu trên thiết bị mới.
- V2.3 vẫn đọc được backup kiểu cũ chỉ chứa `attempts`.
