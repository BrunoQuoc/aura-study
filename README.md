# AURA STUDY

PWA học tập lớp 6 tối ưu cho iPad/iPhone/Android. GitHub Pages là lớp triển khai ứng dụng; Google Drive là kho dữ liệu gốc.

## Cách thức hoạt động
1. Tài liệu gốc được lưu trên Google Drive theo cấu trúc Lớp → Môn → Bài học/Bài tập/Đề/Đáp án/Tham khảo.
2. File mới được đưa vào `00_INBOX`.
3. Nova đọc nội dung, xác định môn/loại tài liệu, đổi tên chuẩn, ghép đề–đáp án và chuyển đúng thư mục.
4. Khi cần đưa vào app, Nova cập nhật dữ liệu/code trên repo này. GitHub Pages tự publish.
5. Bé sử dụng AURA STUDY trên iPad/mobile. Bài đang làm, ghi chú và kết quả hiện lưu cục bộ trên thiết bị bằng localStorage.

## Quy trình cập nhật tài liệu chuẩn
- Bước 1: Thả PDF/DOCX vào `00_INBOX`; không bắt buộc đổi tên trước.
- Bước 2: Nhắn `Nova, chuẩn hóa INBOX`.
- Bước 3: Nova chuẩn hóa tên theo mẫu `L6_MON_LOAI_HOCKY-CHUDE_SOTHUTU_NGAY`.
- Ví dụ: `L6_TOAN_DE_GK1_SO02_20261017.pdf`.
- Bước 4: Khi muốn đưa nội dung mới vào app, nhắn `Nova, cập nhật tài liệu mới vào AURA STUDY`.

## Nguyên tắc dữ liệu
- Google Drive là nguồn dữ liệu chuẩn.
- Không chỉnh dữ liệu học trực tiếp trên GitHub nếu không cần thiết.
- Không tự tạo đáp án khi tài liệu nguồn không cung cấp đáp án.
- Đề và đáp án dùng cùng mã để dễ ghép cặp.

## Sử dụng trên iPad/iPhone
Mở trang GitHub Pages bằng Safari → Chia sẻ → Thêm vào Màn hình chính.

## Sao lưu
Dữ liệu kết quả/ghi chú đang lưu cục bộ. Dùng nút `Sao lưu` trong ứng dụng để xuất JSON trước khi đổi thiết bị.
