# AURA STUDY — Toán 6: Student Practice Coverage V4

**Ngày:** 16/11/2026 · **Môi trường:** Supabase Staging / GitHub Pages  
**Audit ID:** `AURA-M6-STUDENT-FORMATIVE-COVERAGE-20261116`

## Tiến độ theo loại học liệu

| Hạng mục | Trước | Sau triển khai |
|---|---:|---:|
| Bài học có thể đọc | 43/43 | 43/43 |
| Bài có luyện Staging dùng câu ngân hàng đã kiểm định độc lập (có chấm thử) | 30/43 | 30/43 |
| Bài có tự luyện trắc nghiệm bổ trợ không ghi điểm | 0/13 | 13/13 |
| Tổng bài có cách luyện phù hợp | 30/43 | **43/43** |
| Câu tự luyện bổ trợ mới | 0 | **39 (3 câu × 13 bài)** |
| Câu hỏi ngân hàng đạt kiểm định toán độc lập | 156 | 156 |
| Câu hỏi ngân hàng còn chờ kiểm định độc lập | 246 | 246 |

Các bài được bổ sung tự luyện: Tập 1 bài 8, 9, 10, 22; Tập 2 bài 24, 32, 33, 36, 37, 38, 39, 40, 41.

**Cách hiểu trạng thái:** 43/43 có bài luyện **không** đồng nghĩa 43/43 đủ điều kiện mở điểm thi hay học bạ. Hệ thống giữ tách biệt 30 bài có điểm thử theo câu ngân hàng đã kiểm định và 13 bài có trắc nghiệm tự kiểm tra học tập AI (không ghi điểm). Những câu trắc nghiệm mới chưa được giáo viên ký duyệt hay đối chiếu từng trang SGK.

## Triển khai kỹ thuật

- Bảng `aura_review.student_math6_formative_items` lưu 39 câu trắc nghiệm ba lựa chọn, chỉ `service_role` truy cập, RLS bật, tất cả `pedagogical_signed_off=false`.
- `public.aura_student_math6_formative_get_v1(user_id,lesson_id)`: kiểm tra thiết bị Student đã ghép; trả ba câu và lựa chọn, **không trả đáp án/giải thích trước khi nộp**.
- `public.aura_student_math6_formative_check_v1(user_id,lesson_id,selections)`: kiểm tra chính xác ba lựa chọn, so sánh server-side, trả đáp án đúng và giải thích, `saved_to_gradebook=false`.
- Supabase Edge `aura-student-math6-preview-v1` v3 nhận `formative_get` / `formative_check` sau xác thực Bearer JWT bằng Supabase Auth và anonymous Student.
- Giao diện `aura-student-math6.html` hiển thị “Tự luyện 3 câu” ở những bài chưa có câu số đủ điều kiện kiểm định; khi hoàn thành hiển thị đúng/sai và lý do, có thể làm lại; không đánh dấu “đạt điểm kiểm tra”.
- RPC `aura_student_math6_readiness_v1()` mở rộng chỉ số `formative_self_check_lessons=13`, `formative_self_check_items=39`, `any_practice_available_lessons=43`; giữ `practice_ready_lessons=30`.
- Bảng nghiệm thu `aura-student-math6-acceptance.html` hiển thị rõ 30 luyện chấm thử / 13 tự luyện không ghi điểm.

## Kiểm thử đã chạy

- 13/13 bài trả đủ ba câu; không có thuộc tính `correct_index`, `explanation`, `correct_choice` trong JSON trước nộp.
- 13/13 bài trả đúng kết quả nếu cả ba lựa chọn phù hợp.
- Thử cả ba lựa chọn sai trả 0/3; lựa chọn có mã câu không tồn tại bị từ chối; chưa ghép thiết bị bị từ chối.
- Tổng số 43 bài: 30 bài có luyện chấm thử, 13 bài có tự luyện; không bài nào thiếu cách luyện.
- Quyền `anon`/`authenticated` không thể gọi trực tiếp hàm chấm tự luyện; chỉ Edge `service_role` có quyền.
- Static JavaScript syntax của giao diện Student và QA device: PASS; mọi `id` tham chiếu tồn tại. Security advisors không phát sinh cảnh báo mới trong kết quả kiểm tra.
- Các lượt thử SQL dùng `BEGIN ... ROLLBACK`, bảo toàn toàn bộ hồ sơ học sinh và tiến độ có thật.

## Điều kiện chưa hoàn thành để phát hành

- **246 câu ngân hàng chưa có bằng chứng kiểm định toán độc lập.**
- **23 cảnh báo biểu đồ/hình trên iPhone thực tế** chưa có biên bản nghiệm thu.
- Học liệu AI bổ trợ, trong đó 39 câu tự luyện mới, cần kiểm định sư phạm và đối chiếu SGK trước khi ghi nhận là nội dung chính thức.
- Chưa nghiệm thu luồng Student trên Safari/iPhone/iPad vật lý; các bài QA giao dịch không thay thế nghiệm thu thiết bị.
- Chưa xác minh HTTP thực tế rằng các file GitHub Pages đã phân phối bản mới; chỉ xác minh file và phiên bản Edge đã cập nhật.
- Exam Engine và Auto Grading chính thức vẫn **OFF**; không được bỏ khóa cho đến khi release gates đạt.

## Truy cập kiểm thử

- [Student Toán 6 — học và luyện](https://brunoquoc.github.io/aura-study/aura-student-math6.html)
- [Admin — nghiệm thu thiết bị thật](https://brunoquoc.github.io/aura-study/aura-student-math6-acceptance.html)
- [Admin — bảng chất lượng tổng hợp](https://brunoquoc.github.io/aura-study/aura-math6-readiness.html)

**Tóm tắt:** Phần chức năng luyện tập của Student hiện đã có phương án sử dụng cho đủ 43/43 bài trên Staging. Nghiệm thu sản phẩm thật và phát hành chính thức vẫn chưa hoàn thành.
