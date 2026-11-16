# AURA STUDY — Chấm toán đố 4 phần & Error Analysis V1

**Ngày:** 16/11/2026 (Asia/Ho_Chi_Minh) · **Môi trường:** Supabase Staging · **QA Audit:** `AURA-MATH6-WORD-4STEP-GRADING-ERRORMAP-V1-20261116`

## 1. Phạm vi hoàn thiện

Đã triển khai cơ chế **chấm thử theo từng tiêu chí** cho **16 bài toán có lời văn** hiện có hướng dẫn từng bước trong ngân hàng Toán 6 của AURA. Đây không phải toàn bộ dạng toán đố của 43 bài/402 câu. Câu hỏi, đáp án và lời giải mẫu thuộc AURA Staging, **chưa có xác nhận nội dung từng trang SGK hoặc nghiệm thu giáo viên**.

### Rubric 4 phần (tạm thời, tối đa 4 điểm)

| Tiêu chí | Máy chấm được | Máy chưa chấm được |
|---|---|---|
| Hiểu đề (1 điểm) | Học sinh chọn đúng **đại lượng cần tìm** từ 3 lựa chọn | Chưa hiểu/đánh giá toàn bộ văn bản dữ kiện học sinh tự viết |
| Lập phép tính (1 điểm) | Học sinh chọn đúng cách lập phép tính từ 3 phương án được biên soạn và kiểm tra | Không chứng minh cách lập luận tự viết tương đương hoặc hoàn chỉnh |
| Tính toán (1 điểm) | Đáp số số học khớp đáp án đã được tính lại | Không chấm được sự hợp lý của mọi bước trung gian |
| Kết luận (1 điểm) | **Kết quả số và đơn vị** đều khớp | Chưa đánh giá tự động đầy đủ câu kết luận bằng lời |

**Lưu ý kiểm soát:** 4/4 điểm do máy cấp chỉ là **điểm luyện tạm theo đáp án có cấu trúc**, không đồng nghĩa bài tự luận đã đúng hết. Tất cả bài nộp gắn `PENDING_ADMIN`, phần lời giải văn bản cần người có quyền Admin kiểm tra. Không ghi điểm Exam Engine/học bạ chính thức.

### Error Analysis và Weakness Map

Đã có các mã lỗi:
- `MISREAD_QUESTION`: chọn sai điều cần tìm → đọc lại câu hỏi, phân biệt dữ kiện với yêu cầu.
- `WRONG_OPERATION`: chọn sai phép tính → ôn lập phép tính từ lời văn; xem lại ví dụ theo bài.
- `NUMERIC_MISMATCH`: đáp số không khớp → luyện phép tính, kiểm tra thứ tự, làm tròn/chia dư.
- `WRONG_UNIT`: sai đơn vị → xem lại đại lượng được hỏi và đơn vị tương ứng.
- `CONCLUSION_DEPENDS_ON_CALCULATION`: đơn vị đúng nhưng kết luận sai do đáp số.
- `WRONG_CONCLUSION_OR_UNIT`: Admin xác định câu kết luận/đơn vị cần sửa.

Student nhận góp ý từng phần, **nút mở đúng bài học để ôn**, lịch sử lượt luyện, thống kê lỗi gần đây. Admin chấm lại toàn bộ 4 tiêu chí có nhận xét: nếu kết luận khác máy, thống kê lỗi hiệu lực theo **đánh giá Admin**, không tiếp tục khẳng định lỗi máy đã được Admin sửa.

## 2. Triển khai

- **Dữ liệu:** `aura_review.student_math6_word_step_rubrics` — 16 bộ lựa chọn hiểu đề, chọn cách giải và đơn vị; đáp án chuẩn không được gửi trước khi nộp.
- **Dữ liệu:** `aura_review.student_math6_word_step_attempts` — lưu bài làm luyện tạm, nguyên văn học sinh nhập, điểm máy, Weakness Map, trạng thái và quyết định Admin; có ràng buộc `staging_only=true`, `official_grade_created=false`.
- **Hàm Student (service_role-only):** `aura_student_math6_word_step_get_v1`, `aura_student_math6_word_step_submit_v1`, `aura_student_math6_word_step_history_v1`. Mỗi lần truy cập đều xác minh Auth UID là thiết bị đã ghép với đúng learner.
- **Hàm Admin (service_role-only):** `aura_student_math6_word_step_admin_queue_v1` lọc đúng học sinh thuộc household Admin, `aura_student_math6_word_step_admin_review_v1` bắt buộc 4 quyết định 0/1 và nhận xét dài từ 12 ký tự.
- **Weakness Map:** `aura_review.word_step_effective_weaknesses_v1` ưu tiên bản rà cuối của Admin và bảo toàn bản machine evaluation gốc trong log.
- **Edge Student:** `aura-student-math6-preview-v1` phiên bản 5, JWT verified; các action `word_step_get`, `word_step_submit`, `word_step_history`.
- **Edge Admin:** `aura-admin-review-v1` phiên bản 27, JWT verified; các action `student_math6_word_step_queue`, `student_math6_word_step_review`.
- **Giao diện Student:** `aura-student-math6.html`, tab **Toán đố từng bước** chứa phần ghi dữ kiện, điều cần tìm, chọn cách giải, giải thích, nhập số, chọn đơn vị và kết luận. Hiển thị 4 tiêu chí, điểm tạm, lỗi cần ôn, liên kết về đúng bài.
- **Giao diện Admin:** `aura-student-math6-admin-review.html` bổ sung hàng chờ toán đố, xem bài viết và hướng dẫn giải, quyết định chấm lại từng bước, lưu nhận xét.
- **Bảng nghiệm thu:** `aura-student-math6-acceptance.html` đã có chỉ số rubric 4 bước, lượt chờ/chấm và bước thử Student.
- **Chỉ số Staging:** `aura_student_math6_readiness_v1` phân biệt số bài rubric, lượt đã lưu, lượt chờ Admin, lượt đã rà và điểm chính thức.

## 3. Kiểm thử đã chạy

| Hạng mục | Kết quả |
|---|---|
| 16/16 bài chọn đúng 4 tiêu chí | PASS |
| 80 tình huống âm tính theo 5 nhóm × 16 bài (sai hiểu đề, phép tính, số, đơn vị, sai toàn bộ) | PASS |
| Không lộ lựa chọn đúng hoặc lời giải trước khi nộp | PASS |
| Số sai và đơn vị đúng không được tính là kết luận đạt | PASS |
| Lỗi có mã và gợi ý ôn đúng tiêu chí | PASS |
| Hàng chờ Admin đúng household; không quyền bị từ chối | PASS |
| Admin rà và sửa điểm, Student xem lịch sử mới | PASS |
| Admin sửa lỗi máy và Admin tìm ra lỗi máy bỏ sót đều cập nhật Weakness Map | PASS |
| Người chưa ghép Student bị từ chối; RPC trực tiếp anon/authenticated không có EXECUTE | PASS |
| RLS bảng lưu bài làm được bật, không có policy mở công khai | PASS |
| Giao diện Student/Admin/DeviceQA kiểm tra cú pháp JavaScript và DOM ID | PASS |
| Bài làm mô phỏng còn lưu sau rollback | **0** |
| Điểm Auto Grading chính thức | **0** |
| Biên bản chạy Safari/iPhone thật | **0** |

**Giới hạn kiểm thử:** đây là bộ kiểm thử hàm SQL, kiểm soát quyền, kiểm thử payload và cú pháp JavaScript. Chưa kiểm chứng được GitHub Pages trực tiếp qua công cụ; chưa chạy thử tương tác thực trên Safari/iPhone/iPad. Không chứng nhận kết quả này là nghiệm thu thiết bị.

## 4. Chặn phát hành và công việc sau

- Ngân hàng Toán 6 hiện có **156/402 câu được kiểm định phép toán độc lập**, **246 câu còn chờ**. Không nâng thêm chứng nhận toàn ngân hàng từ kết quả chấm thử 16 bài.
- 16 bộ rubric mới chưa được giáo viên rà soát, và khả năng hiểu văn bản tự luận viết tự do **chưa tự động đánh giá an toàn**.
- Chưa kiểm định hình/biểu đồ trên thiết bị thật, 23 cảnh báo visual còn mở từ các đợt trước.
- Cần mở rộng bộ rubric theo dạng bài/ngữ cảnh cho toàn bộ bài toán có lời văn, nghiệm thu trên iPhone và rà nguồn SGK từng trang.
- Exam Engine, Auto Grading chính thức và phát hành môn Toán 6 vẫn **OFF / HOLD**.

## Truy cập

- [Student Toán 6 — Toán đố từng bước](https://brunoquoc.github.io/aura-study/aura-student-math6.html)
- [Admin — Chấm Student và Toán đố](https://brunoquoc.github.io/aura-study/aura-student-math6-admin-review.html)
- [Admin — Bảng nghiệm thu Student](https://brunoquoc.github.io/aura-study/aura-student-math6-acceptance.html)

**Kết luận:** Phân hệ chấm theo bước và phân tích lỗi có bản đầu chạy thử, có hàng đợi giáo viên/Admin kiểm soát lời giải. Không quảng bá là AI chấm chính xác toàn bộ tự luận hoặc hệ thống đã được cấp phép phát hành.
