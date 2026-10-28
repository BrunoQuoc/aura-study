# AURA STUDY

AURA STUDY là web app học tập lớp 6 tối ưu cho iPad/iPhone/Android. GitHub Pages là lớp triển khai ứng dụng; Google Drive là kho dữ liệu gốc.

## Truy cập hiện tại
AURA STUDY dùng mô hình **2 link riêng, không đăng nhập**:

- **Học sinh:** `https://brunoquoc.github.io/aura-study/student-direct.html`
- **Admin:** `https://brunoquoc.github.io/aura-study/admin-direct.html`

`index.html` và `admin.html` chỉ còn nhiệm vụ chuyển hướng về hai entry production ở trên để bookmark/link cũ không mở nhầm giao diện legacy.

Không còn luồng tạo user, email xác nhận, Supabase Auth hay mật khẩu trong giao diện đang sử dụng.

> Lưu ý: link Admin không có lớp xác thực. Ai có đúng URL Admin đều có thể mở giao diện quản trị. Mô hình này phù hợp với hệ thống gia đình hiện tại.

## Cache / Service Worker
Service Worker cũ đã được nghỉ sử dụng. Core `app.js` không còn đăng ký Service Worker. `sw.js` chỉ được giữ lại như lớp cleanup cho các thiết bị từng đăng ký bản cũ.

Hai trang `student-direct.html` và `admin-direct.html` thực hiện một lần cleanup cache/registration legacy khi mở; không còn vòng register → unregister lặp lại. Manifest hiện mở thẳng `student-direct.html`.

## Phạm vi học tập
Nội dung học gốc không bị xóa hoặc thay đổi khi tách Admin/Học sinh.

- Toán 6: đề kiểm tra, ôn tập, hình minh họa, chấm tự động phần đủ dữ kiện.
- Ngữ văn 6: đọc hiểu, Thực hành Tiếng Việt, tài liệu tham khảo.
- Tiếng Anh 6: ngân hàng Units 1–3, Reading, Rewrite và các dạng luyện tập hiện có.
- Tạo đề thông minh: cân mức độ, giảm lặp, ưu tiên phần yếu và lưu lịch sử làm bài cục bộ.

## Cách thức hoạt động
1. Tài liệu gốc lưu trên Google Drive theo cấu trúc Lớp → Môn → Bài học/Bài tập/Đề/Đáp án/Tham khảo.
2. File mới đưa vào `00_INBOX`.
3. Nova đọc nội dung, xác định môn/loại tài liệu, đổi tên chuẩn, ghép đề–đáp án và chuyển đúng thư mục.
4. Nội dung đủ dữ kiện được chuẩn hóa vào AURA DATA trên repo; GitHub Pages tự publish.
5. Bé sử dụng AURA STUDY trên iPad/mobile; dữ liệu học cục bộ lưu bằng `localStorage`.

## Metadata kỳ thi
`exam_metadata.js` là registry trung tâm cho luồng **Ôn thi theo năm học**. Metadata không sửa nội dung nguồn mà chỉ mô tả cách AURA được phép sử dụng tài liệu.

- Schema chính: `subject`, `docType`, `periods`, `term`, `scope`, `assignmentBasis`, `confidence`, `note`.
- `source_declared`: nguồn ghi rõ kỳ thi.
- `source_declared_term`: nguồn chỉ ghi rõ học kỳ; AURA không tự suy thành giữa kỳ nếu không có căn cứ.
- `curriculum_scope`: gắn theo phạm vi kiến thức đã xác định, ví dụ Tiếng Anh Units 1–3 cho GK1; phải ghi rõ đây là mapping theo phạm vi chứ không giả là nhãn nguồn.
- `insufficient_source_evidence`: giữ tài liệu ở trạng thái chưa phân kỳ.
- Môn chưa có kho đủ dữ kiện được đặt `awaiting_source`; không bật generator theo kỳ.
- Generator theo kỳ chỉ bật khi `generatorPeriods` của môn cho phép kỳ đang chọn.

Trạng thái hiện tại: Toán có kho GK1; Tiếng Anh Units 1–3 được dùng cho GK1 theo phạm vi; Ngữ văn có bài Thực hành Tiếng Việt ghi rõ HKI và được xếp vào CK1, còn bộ đọc hiểu chưa đủ căn cứ vẫn chưa phân kỳ. KHTN, Lịch sử & Địa lý, GDCD, Tin học và Công nghệ đang chờ nguồn.

### Quy tắc metadata của đề sinh
Kỳ thi của một đề mô phỏng (`GK1`, `CK1`, `GK2`, `CK2`) được lưu trực tiếp trong object `aura_generated_exam`. Không dùng một biến kỳ thi global để chấm các bài sinh sau đó. Vì vậy Luyện nhanh/Luyện phần yếu không thể kế thừa nhầm kỳ của một đề mô phỏng trước đó.

## Nguyên tắc dữ liệu
- Google Drive là nguồn dữ liệu gốc.
- Không tự tạo đáp án cho câu nguồn khi tài liệu không cung cấp đủ dữ kiện.
- Câu mới do generator tạo phải gắn nhãn là biến thể/câu mới cùng dạng, không giả là câu gốc.
- Câu hình/scan thiếu dữ kiện thật không được đưa vào chấm tự động.
- Thống kê phần yếu chỉ dựa trên các mục có thể xác định đúng/sai đáng tin cậy.
- Trạng thái INBOX chỉ là trạng thái nguồn; không đồng nghĩa với trạng thái đã nhập vào web.
- Không gắn kỳ thi chỉ để lấp chỗ trống. Khi metadata chưa đủ căn cứ, tài liệu phải giữ trạng thái chưa phân kỳ.

## Kết quả học tập và Reset báo cáo
Kết quả được tổng hợp theo **môn → kỹ năng/chủ đề → bài làm**. Điểm của các môn không bị trộn thành một chỉ số duy nhất; bài chưa có cơ chế chấm đáng tin cậy không bị ép về 0/10.

Admin có chức năng **Reset báo cáo**. Reset chỉ đưa dữ liệu báo cáo về trạng thái mới:

- Xóa lịch sử điểm/chấm, Sổ câu sai, Smart Stats và trạng thái chống ghi nhận trùng.
- Bỏ các dấu “đã hiểu/đã ôn xong” cũ.
- **Không xóa câu trả lời bé đã nhập trong bài ôn.**
- Lưu mốc `aura_report_reset_at`; báo cáo chỉ tính hoạt động ôn tập được cập nhật sau mốc này.
- Backup/restore đầy đủ có hỗ trợ mốc reset để dữ liệu cũ không bị ẩn sai sau khi khôi phục.

## Dữ liệu cục bộ
Không còn tài khoản người dùng nên dữ liệu học được lưu theo trình duyệt/thiết bị bằng `localStorage`.

- Hai link Student và Admin trên cùng một trình duyệt có thể nhìn cùng dữ liệu cục bộ.
- Đổi thiết bị hoặc xóa dữ liệu trình duyệt có thể làm mất kết quả chưa sao lưu.
- Admin có nút **Sao lưu / Khôi phục** để xuất và phục hồi dữ liệu JSON.
- Reset/backup/restore chỉ tác động dữ liệu trên thiết bị/trình duyệt đang mở.

## Sử dụng trên iPad/iPhone
Mở link Student hoặc Admin bằng Safari. Có thể dùng **Chia sẻ → Thêm vào Màn hình chính** để tạo biểu tượng truy cập nhanh. PWA mở trực tiếp Student production.

## Trạng thái kiến trúc
- Frontend production: GitHub Pages.
- Không dùng Lovable làm frontend.
- Không dùng Supabase Auth cho luồng truy cập hiện tại.
- Không có role Teacher trong sản phẩm.
- Giai đoạn hiện tại ưu tiên **đúng dữ liệu và ổn định hệ thống** trước khi bổ sung tính năng trang trí mới.
