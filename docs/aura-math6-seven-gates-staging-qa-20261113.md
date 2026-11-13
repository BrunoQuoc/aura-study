# AURA STUDY — Báo cáo nghiệm thu 7 hạng mục Toán 6

**Ngày triển khai:** 13/11/2026 (Asia/Ho_Chi_Minh)  
**Môi trường:** Supabase Staging, GitHub Pages  
**QA audit:** `AURA-M6-FULL-STACK-QA-18-ENGINE-20261113`.

## Đánh giá có chứng cứ — không tự đánh dấu ĐẠT khi chưa kiểm thử

| Hạng mục | Kết quả xác minh |
|---|---|
| Kiểm tra cấu trúc 402 câu | **ĐẠT**: 402/402, đủ 9 chương và 43 bài |
| Kiểm định toán học độc lập toàn bộ lời giải | **CHƯA ĐẠT ĐẦY ĐỦ**: 35 câu có bằng chứng tính trực tiếp bằng parser độc lập và 23 bộ dữ liệu biểu đồ được đối chiếu; toàn bộ 402 đã qua lượt rà nội dung AI nhưng **không thay thế** kiểm định độc lập toàn bộ |
| Xử lý 30 cảnh báo QA | **CHƯA ĐẠT TRỌN BỘ**: 7/7 cảnh báo nội dung và rubric được đóng dưới nguồn gốc AI trên Staging, gồm 4 HIGH; 23 cảnh báo visual-device còn mở |
| Nghiệm thu 23 biểu đồ trên iPhone thật | **CHƯA CÓ BIÊN BẢN**: 0 báo cáo thiết bị thật trên bản mới. Không giả lập xác nhận người dùng |
| Exam Engine chính thức | **CHƯA KÍCH HOẠT**: 18/18 bản blueprint chạy thử toàn bộ trên Staging, bảo toàn mọi cổng khóa phát hành |
| Auto Grading chính thức | **CHƯA KÍCH HOẠT**: 212 câu số đạt 212/212 ca đúng, sai, fallback mơ hồ; 190 câu cần đánh giá thủ công theo rubric. Quy trình chấm thủ công đã thêm với audit |
| Kiểm thử học → luyện → thi → chấm → phân tích lỗi | **ĐẠT KIỂM THỬ BACKEND STAGING**: 18/18 blueprint, 216 tham chiếu; trả kết quả chấm thủ công và Weakness Map; synthetic attempts rollback, 0 điểm học sinh thật. Chưa nghiệm thu E2E trên Student/iPhone thật |

## Phần mềm đã triển khai

- `public.aura_qa_exam_start_v1`: khởi tạo bản thi thử QA từ bản blueprint đã khóa, từ chối rò rỉ đáp án ra đề.
- `public.aura_qa_exam_submit_v1`: chấm tự động đáp án số tiếng Việt, fallback thủ công, idempotent, ghi Weakness Map.
- `public.aura_qa_exam_review_pending_v1`: chỉ Admin được xem các câu cần chấm và rubric/đáp án.
- `public.aura_qa_exam_manual_grade_v1`: cho phép Admin QA ghi chấm đúng/sai với nhận xét bắt buộc, hoàn tất điểm và bản đồ lỗi.
- `public.aura_math6_readiness_v1`: nguồn xác minh số liệu 7 hạng mục, service_role only.
- Edge Function `aura-admin-review-v1` phiên bản 21, xác thực JWT và grant Admin.
- Giao diện `aura-math6-qa-lab.html`: học lý thuyết theo chương, làm đề 9/15 câu, nộp bài, chấm tự động, chấm rubric, xem lỗi.
- Giao diện `aura-math6-readiness.html`: bảng kiểm nghiệm thu lấy trực tiếp Staging.

## Kết quả kiểm thử

- 18/18 cấu hình luyện tập và đề chương tạo, nộp, chấm và chốt kết quả thành công qua SQL transactional tests. 216/216 tham chiếu câu hỏi; tổng các giao dịch QA thử nghiệm rollback thành công.
- Kịch bản hỗn hợp 15 câu: 10 đúng số, 1 sai số, 4 phải chuyển thủ công (1 gồm định dạng mơ hồ); Weakness Map sinh từ sai số học. Kịch bản toàn bộ chấm thủ công được hoàn tất, có lưu chấm, kết quả cuối 13/15 và 2 mục sai; việc nộp lại không thay điểm.
- Kiểm tra quyền: anonymous/authenticated không được gọi trực tiếp các RPC privileged; quyết định Edge đòi tài khoản Admin xác thực.
- Frontend QA Lab, readiness và Admin V2 có cú pháp JS hợp lệ; đường dẫn đã thêm trên trang Admin.
- Chưa kiểm thử HTTP end-to-end vào GitHub Pages qua Safari thật, do đó không được mô tả là sản phẩm học sinh đã nghiệm thu.

## Nguyên tắc phát hành

**Exam Engine production: OFF. Auto Grading live: OFF. Device signoff count: 0.**

Không chuyển hạng mục phụ thuộc thiết bị thật thành ĐẠT bằng kiểm thử giả lập. Giữ nguyên 401 câu `AI_APPROVED` với nguồn gốc AI và một câu Admin đã duyệt. Không thay đổi ký duyệt giáo viên.

Các hạng mục còn thiếu để phát hành: kiểm định độc lập ngoài kiểm tra cấu trúc/AI, nghiệm thu 23 hình thực tế trên điện thoại, quyết định phát hành có trách nhiệm và thử nghiệm Student E2E.

## Trang kiểm tra

- [7 cổng nghiệm thu — số liệu trực tiếp](https://brunoquoc.github.io/aura-study/aura-math6-readiness.html)
- [QA Lab](https://brunoquoc.github.io/aura-study/aura-math6-qa-lab.html)
- [Kiểm tra 23 biểu đồ trên iPhone](https://brunoquoc.github.io/aura-study/admin-chart-review.html?v=3)
- [Admin V2](https://brunoquoc.github.io/aura-study/admin-ch08-review.html)
