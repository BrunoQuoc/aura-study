# AURA STUDY — Biên bản triển khai tái duyệt & kiểm tra biểu đồ R3

**Ngày:** 13/11/2026  
**Hệ thống:** Toán 6 Kết nối tri thức, cả hai tập  
**Môi trường:** Supabase Staging  
**QA run:** `AURA-M6-REAPPROVAL-AND-MOBILE-VISUAL-R3-20261113`

## 1. Tái duyệt bốn câu đã phê duyệt

Nhóm `M6-KNTT-C08-L32-Q01` tới `Q04` đã được tạo **revision 3** với `publication_allowed=false`, `live_exam_eligible=false`, `approval_status=PENDING_PEDAGOGICAL_REVIEW`.

- Phiên bản 2 và quyết định `APPROVED` cũ còn nguyên trong `question_revisions` và `review_history`.
- Thêm sự kiện `SYSTEM_RELEASE_METADATA_REOPEN` và bản lưu người đã duyệt trước đó trong `reopen_events`; **không mạo danh Admin để tự phê duyệt mới**.
- Bốn câu hiện là `PENDING` và có cảnh báo HIGH `REAPPROVAL_AFTER_RELEASE_METADATA_FIX`. Khi Admin duyệt chính phiên bản mới, cảnh báo tái duyệt sẽ được đóng có lưu dấu thời điểm.

## 2. Sửa tham chiếu đề luyện, đề ôn

Đã kiểm tra 216 tham chiếu từ 18 bản blueprint đang khóa. Có 38 tham chiếu dùng phiên bản câu hỏi cũ trong 6 blueprint; đã cập nhật về revision hiện hành và lưu 6 bản cấu hình cũ tại `aura_review.blueprint_revision_history`. **Tham chiếu lỗi thời sau cập nhật: 0.** Tất cả blueprint vẫn `DRAFT_LOCKED`, `exam_engine_enabled=false`.

## 3. Kiểm định toàn kho

| Chỉ tiêu | Trạng thái |
|---|---:|
| Tổng câu hỏi | 402 |
| Đạt kiểm tra cấu trúc & phiên bản | 402/402 |
| Số câu đã phê duyệt hiện hành | 1 |
| Chờ quyết định sư phạm | 401 |
| Phép tính trực tiếp được kiểm tra độc lập | 35 |
| Biểu đồ mới đối chiếu số liệu/đáp án | 23/23 |
| Liên kết hình SVG hợp lệ | 26 |
| Ứng viên chấm số được kiểm tra | 212 |
| Cần người chấm | 190 |
| Cờ phát hành/chấm live | 0 |
| Cảnh báo QA còn mở | 30 |
| Trong đó ưu tiên HIGH | 4 |

**Giới hạn:** Kết quả cấu trúc đạt 402/402 không có nghĩa 402 câu đã được kiểm định độc lập tất cả lời giải hoặc đã được phê duyệt sư phạm.

## 4. Admin V2 và xác minh thiết bị

Admin V2 đã bổ sung:
- Bảng QA theo từng bài, đếm mức độ ưu tiên và mở trực tiếp vào hàng chờ.
- Bộ lọc `QA — Ưu tiên cao` cho bốn câu mở lại, chọn và duyệt theo danh tính Admin.
- Thư viện **23 biểu đồ** (5 biểu đồ tranh Bài 39, 9 biểu đồ cột Bài 40, 9 biểu đồ cột kép Bài 41).
- Nút **Phóng to biểu đồ** hiển thị SVG kích thước lớn, hỗ trợ cuộn ngang màn hình nhỏ.
- Biên bản nghiệm thu 4 tiêu chí và 23/23 ảnh tải thành công, lưu trực tiếp qua Edge Function xác minh tài khoản Admin vào `aura_review.device_visual_acceptance`.
- Khi Admin xác nhận đủ 23 hình, chỉ các cảnh báo *kiểm tra trực quan* của 23 hình được đóng với mã biên bản làm căn cứ; việc này không tự phê duyệt câu hỏi.

**Thời điểm ghi biên bản này: 0 biên bản nghiệm thu mới trên điện thoại thật.** Các biên bản iPhone trước đó được thực hiện trước khi có bộ thư viện 23 biểu đồ mới, vì vậy không thay thế lần nghiệm thu mới.

## 5. Công việc chưa hoàn thành

- Bốn câu đã sửa metadata cần Admin xác nhận lại trên revision 3.
- 397 câu khác chưa được phê duyệt đầy đủ (tổng 401 câu đang chờ).
- Hình mới cần người dùng kiểm tra trên thiết bị thật và lưu biên bản.
- Giữ nguyên khóa Exam Engine/Auto Grading live. Không bật phát hành khi chưa có bằng chứng đủ điều kiện.

**Admin:** https://brunoquoc.github.io/aura-study/admin-ch08-review.html

*Trạng thái: dữ liệu và quy trình kỹ thuật đã cập nhật; nghiệm thu sư phạm và iPhone sau thay đổi vẫn chờ.*
