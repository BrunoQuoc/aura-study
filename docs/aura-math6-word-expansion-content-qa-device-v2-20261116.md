# AURA STUDY — Toán 6: mở rộng toán đố, kiểm định rubric và cổng nghiệm thu thiết bị (V2)

**Ngày:** 16/11/2026 · **Môi trường:** Staging · **Audit:** `AURA-MATH6-WORD-EXPANSION-TEACHER-DEVICE-GATES-V2-20261116`

## 1. Phạm vi thực hiện

| Thành phần | Trước | Sau |
|---|---:|---:|
| Ngân hàng câu hỏi Toán 6 | 402 | 402 |
| Bài toán có lời văn có hướng dẫn AI từng bước | 16 | **41** |
| Bộ rubric tạm bốn phần | 16 | **41** |
| Bài toán có bộ lựa chọn/dữ kiện được đối chiếu đáp số ngân hàng khi nhập mới | — | **25/25** |
| Câu từ ngân hàng đã kiểm định toán độc lập | 156 | 156 |
| Câu từ ngân hàng chưa kiểm định toán độc lập | 246 | 246 |
| Bài được giáo viên xác nhận sư phạm | 0 | **0** |
| Biên bản thử toán đố trên thiết bị thật | 0 | **0** |

**Lưu ý:** 41 là số bản nháp toán đố có hướng dẫn và rubric Staging, không phải tổng số toán đố trong SGK, không phải 41 bài đã được giáo viên duyệt và cũng không phải điểm thi đã mở. Mỗi bài được lưu với `content_status=AI_DRAFT_UNVERIFIED_SGK`, `pedagogy_signed_off=false`, `live_scoring_allowed=false`.

## 2. Phân loại toàn bộ ngân hàng

Đã lập `aura_review.math6_word_problem_inventory` cho **402/402 câu** dựa trên revision hiện tại. Bản kiểm kê sau bổ sung:
- **41** câu đang có guided word scaffold trên Staging.
- **30** câu còn lại bị heuristic đánh dấu là ứng viên toán đố, cần người xem xét.
- **331** câu không bị heuristic đánh dấu.

**Giới hạn quan trọng:** heuristic chỉ là bộ lọc, không chứng minh 331 câu còn lại không có lời văn. Vì vậy trạng thái `NOT_FLAGGED` không phải `NOT_WORD_PROBLEM`. Có giao diện Admin để gắn nhãn `WORD_PROBLEM` / `NOT_WORD_PROBLEM` / `NEEDS_CONTEXT`, yêu cầu nhận xét bằng chứng; không tự tạo rubric hoặc chấm điểm từ nhãn phân loại.

## 3. 25 bài mới và giới hạn toán học

Đợt này bổ sung các dạng:
- Tập hợp/đếm thành viên, số tự nhiên, tăng giảm lượng hàng và tải trọng.
- Lũy thừa/nhân đôi, phép chia đều, số nguyên tố.
- BCNN trong lịch trùng nhau; số học sinh có điều kiện giới hạn.
- Số nguyên âm qua nhiệt độ, điểm tăng giảm.
- Hình học: cạnh lục giác, diện tích chữ nhật và chiều cao hình bình hành.
- Phân số của số, tìm số khi biết một phần, tăng phần trăm.
- Khảo sát, xác suất thực nghiệm.

Mỗi hồ sơ có dữ kiện, mục tiêu, hai bước tính mẫu, kết luận, lỗi thường gặp, ba lựa chọn nhận biết mục tiêu/phép tính/đơn vị, đáp số số. **25/25** đáp số được đối chiếu với revision ngân hàng và tính lại trong giai đoạn biên soạn; tất cả các lựa chọn của 25 bộ mới đã được xoay vị trí để tránh đáp án đúng luôn ở vị trí đầu.

Đây là nội dung AI mới biên soạn; nhiều phương án gây nhiễu vẫn cần giáo viên rà tính sư phạm, chưa kiểm định nguồn SGK theo trang. Đã giữ nguyên số liệu kiểm định độc lập của ngân hàng là **156 đã kiểm / 246 chưa kiểm**.

## 4. Auto Grading & Error Analysis vẫn giữ cổng bảo vệ

Thang điểm **tạm thời** cho mỗi bài:
1. **Hiểu đề:** nhận diện đúng *đại lượng cần tìm* từ ba lựa chọn.
2. **Lập phép tính:** chọn được một cách giải chuẩn từ ba lựa chọn.
3. **Tính toán:** đối chiếu đáp số số học.
4. **Kết luận:** đúng đáp số và đúng đơn vị.

Máy **chưa hiểu/chấm trọn vẹn lời giải học sinh viết tự do**. Bài nộp gắn `PENDING_ADMIN`, Admin có quyền xem nguyên văn, chấm lại cả bốn tiêu chí và nhập nhận xét. **Weakness Map** ưu tiên kết quả đã rà của Admin; mọi điểm được ghi rõ là luyện tập tạm trên Staging, không phát hành Exam Engine/Auto Grading chính thức.

Student được mở các bài đang có hướng dẫn, xem mã lỗi và nhấn “Mở bài học để ôn”. Giao diện danh sách có bộ lọc theo chủ đề và tập 1/tập 2.

## 5. Kiểm định nội dung và giáo viên

Đã tạo **hàng chờ kiểm định rubric**, bao gồm 41 mục `PENDING_ADMIN_QA`. Admin chọn một mục để đối chiếu:
- Đề và đáp án ngân hàng.
- Phép tính được tính lại độc lập.
- Lựa chọn hiểu đề đúng nghĩa.
- Lựa chọn phép tính và phương án gây nhiễu.
- Đơn vị/kết luận.
- Ngôn ngữ phù hợp lứa tuổi.

Khi 6/6 tiêu chí được Admin đánh dấu và có nhận xét, trạng thái chuyển `READY_FOR_TEACHER`. Bài bị lỗi chuyển `NEEDS_FIX`. **Đây chỉ là tiền kiểm Admin, chưa được coi là duyệt sư phạm.**

**Cổng giáo viên:** `teacher_review_status=NOT_REVIEWED` được khóa, và **0/41** bộ nhận teacher signoff. Chưa có giáo viên thật được kết nối/cấp quyền ký duyệt, nên không tạo chữ ký giả hoặc tự nâng `pedagogy_signed_off`.

## 6. Nghiệm thu thiết bị thực tế

Admin có màn hình `aura-math6-word-qa.html` với checklist 8 điều kiện:
- Đúng hồ sơ Student đã kích hoạt/nhớ phiên.
- Đọc đề có lời văn trên thiết bị.
- Chọn được bốn phần bằng cảm ứng.
- Nhập lời giải tự do, đáp số và đơn vị.
- Xem mã lỗi và vào đúng bài cần ôn.
- Admin đã chấm thật bốn phần của bài vừa nộp.
- Student thấy nhận xét Admin trong lịch sử.
- Xoay dọc/ngang không tràn và không che nút.

Máy chủ yêu cầu **một bài Student đã nộp trong 30 ngày, thuộc đúng household Admin, thiết bị còn hiệu lực và đã được Admin rà**, cùng checklist đầy đủ và ghi chú quan sát. Thử với bài giả, bài chưa rà và checklist thiếu: **REJECT**. Sau khi ghi, biên bản được đánh dấu `ADMIN_USER_REPORTED`, `independent_device_verified=false`. **Không tự xác minh iPhone/iPad thay người dùng. Hiện 0 biên bản thật.**

## 7. Kiểm thử kỹ thuật

- 41 rubric × 6 kịch bản (đúng cả bốn, sai hiểu đề, sai phép tính, sai phép tính số, sai đơn vị/kết luận, sai toàn bộ) = **246 lượt giao dịch thử PASS**.
- Giữ đáp án chuẩn/giải mẫu phía server cho đến khi nộp. `word_step_get` không trả chỉ số đáp án đúng trước khi học sinh chọn.
- Admin queue phân quyền; không phải Admin bị từ chối. Checklist Admin thiếu tiêu chí không thể đánh dấu `READY_FOR_TEACHER`. Thêm nhãn ứng viên không tạo rubric.
- Kiểm thử giao dịch ghi biên bản thiết bị yêu cầu đủ điều kiện như mục 6, tất cả SQL sử dụng transaction `ROLLBACK`.
- **0 bài Student mô phỏng được lưu**, **0 phê duyệt giáo viên giả**, **0 biên bản thiết bị giả**, **0 điểm chính thức**.
- Kiểm tra cú pháp JavaScript của trang Student và trang QA Admin: PASS. Chưa thực hiện kiểm thử trình duyệt runtime thực trên Safari/iPhone/iPad, chưa xác minh tất cả liên kết GitHub Pages được tải trực tiếp thành công.

## 8. Trạng thái chưa hoàn thành

1. Xác nhận giảng viên/giáo viên có thẩm quyền để rà **41/41 rubric**; hiện mới có hàng chờ, chưa có chữ ký.
2. Rà thủ công **30 ứng viên heuristic**, tiếp tục rà cả 331 câu chưa bị thuật toán đánh dấu để phát hiện các trường hợp lọt.
3. Kiểm định toàn bộ **246 câu** của ngân hàng còn chờ và đối chiếu SGK gốc theo nguồn.
4. Nghiệm thu **thiết bị học sinh thật**, đồng thời 23 cảnh báo hình và biểu đồ cũ còn mở.
5. Chỉ khi đạt các cổng sư phạm, SGK và thiết bị mới xem xét mở Exam Engine/Auto Grading live.

## 9. Liên kết vận hành

- [Student Toán 6 — Toán đố từng bước](https://brunoquoc.github.io/aura-study/aura-student-math6.html)
- [Admin — Kiểm định nội dung và nghiệm thu toán đố](https://brunoquoc.github.io/aura-study/aura-math6-word-qa.html)
- [Admin — Rà lời giải đã nộp](https://brunoquoc.github.io/aura-study/aura-student-math6-admin-review.html)
- [Admin — Nghiệm thu Student tổng hợp](https://brunoquoc.github.io/aura-study/aura-student-math6-acceptance.html)

**Kết luận:** `STAGING_41_GUIDES_41_RUBRICS_246_SCENARIOS_PASS_30_CANDIDATES_41_QA_PENDING_TEACHER_0_DEVICE`. Chưa phát hành chính thức.
