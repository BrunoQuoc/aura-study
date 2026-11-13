# AURA STUDY — Toán 6 Kết nối tri thức, trọn Tập 1 & Tập 2

**Ngày kiểm kê:** 13/11/2026 · **Môi trường:** Supabase Staging · **Loại tài liệu:** câu hỏi và bài học **tự biên soạn**, dựa theo phạm vi kiến thức hai tập SGK; **không phải bản sao nguyên văn SGK**.

## Phạm vi
| Tập | Chương | Bài | Câu hỏi | Trạng thái |
|---|---|---:|---:|---|
| 1 | I — Tập hợp các số tự nhiên | 1–7 | 63 | READY_FOR_REVIEW |
| 1 | II — Tính chia hết trong tập hợp các số tự nhiên | 8–12 | 60 | READY_FOR_REVIEW |
| 1 | III — Số nguyên | 13–17 | 45 | READY_FOR_REVIEW |
| 1 | IV — Một số hình phẳng trong thực tiễn | 18–20 | 27 | READY_FOR_REVIEW |
| 1 | V — Tính đối xứng của hình phẳng trong tự nhiên | 21–22 | 18 | READY_FOR_REVIEW |
| 2 | VI — Phân số | 23–27 | 45 | READY_FOR_REVIEW |
| 2 | VII — Số thập phân | 28–31 | 36 | READY_FOR_REVIEW |
| 2 | VIII — Những hình hình học cơ bản | 32–37 | 54 | READY_FOR_REVIEW |
| 2 | IX — Dữ liệu và xác suất thực nghiệm | 38–43 | 54 | READY_FOR_REVIEW |
| **Tổng** | **9 chương** | **43 bài** | **402 câu** | **Chưa nghiệm thu sư phạm toàn bộ** |

## Sản phẩm đã triển khai
- **Knowledge Library:** 43 hồ sơ bài học, 104 khối kiến thức (lý thuyết, ví dụ, lỗi thường gặp), luồng ôn và luyện tập.
- **Question Bank:** 402 câu có đáp án, lời giải và rubric; mỗi bài có ít nhất 9 câu ở ba mức nhận biết, thông hiểu, vận dụng.
- **Luyện tập/đề ôn:** 9 cấu hình luyện theo chương và 9 cấu hình đề ôn chương, tất cả **DRAFT_LOCKED**. Có 7 bộ hoạt động trải nghiệm hoặc ôn tập cuối năm được gắn bản nháp.
- **Error Analysis / Weakness Map:** 90 dạng lỗi dự kiến trải trên cả 43 bài; đây là taxonomy, **chưa có dữ liệu thực nghiệm từ bài làm của học sinh**.
- **Auto Grading (STAGING):** 213 câu ứng viên so khớp số, 189 câu phải qua kiểm tra con người. Mỗi ứng viên được thử đúng, sai và đầu vào có định dạng mơ hồ; tổng cộng 639 ca thử cho 213 ứng viên đều cho nhánh kết quả dự kiến. Chấm thực tế **TẮT**.
- **Admin V2:** mục lục 9 chương/43 bài tải từ API qua phiên đăng nhập Admin đã xác thực, có tiến độ và hàng chờ kiểm định; không sử dụng service/secret key trong client.

## QA và tính đúng đắn
**Mã bản kiểm định:** `AURA-M6-KNTT-BOTH-VOLUMES-FULL-DRAFT-QA-20261113`.

Kiểm tra cấu trúc cơ sở dữ liệu ghi nhận 0 trường câu hỏi bắt buộc rỗng, 0 rubric trống, 0 sai lệch liên kết phiên bản, 0 bất nhất trạng thái phê duyệt, 0 câu hỏi trùng nhau sau chuẩn hóa ký tự đơn giản, 0 cờ xuất bản sai. Những phép thử này **không chứng minh toàn bộ 402 câu đã được kiểm định sư phạm độc lập**.

## Cổng phát hành bắt buộc
1. Kiểm định đáp án, độ khó, kiến thức và lời giải bởi người có thẩm quyền.
2. Phê duyệt phiên bản cụ thể bằng tài khoản Admin xác thực, ghi lại danh tính và nhận xét.
3. Kiểm thử màn hình sau đợt cập nhật giao diện mới trên thiết bị thật.
4. Xuất bản qua cổng riêng của Exam Engine sau khi tất cả điều kiện đáp ứng.
5. Chỉ bật Auto Grading thực tế sau khi đánh giá trường hợp ngoại lệ và có cơ chế xem xét thủ công.

**Trạng thái tại thời điểm kiểm tra:** 402 câu trong Staging, 5 APPROVED, 397 PENDING. Không có câu được bật live grading hoặc live exam. Bản nháp toàn chương trình **không đồng nghĩa hệ thống đã phát hành cho học sinh**.

## Điều hướng
- [Admin V2 — Ngân hàng câu hỏi](https://brunoquoc.github.io/aura-study/admin-ch08-review.html)
- [Đăng nhập Staging](https://brunoquoc.github.io/aura-study/aura-staging-login.html)

Nguồn đối chiếu mục lục:
- https://nghengu.vn/toan/toan-6-ket-noi-tri-thuc-tap-1-12567.html
- https://tailieumoi.vn/bai-viet/15820/toan-6-ket-noi-tri-thuc-giai-toan-6-giai-toan-lop-6-giai-bai-tap-toan-6-hay-nhat-giai-toan-6-tap-1-tap-2-ket-noi-tri-thuc
