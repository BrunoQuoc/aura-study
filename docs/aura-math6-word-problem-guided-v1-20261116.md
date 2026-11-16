# AURA STUDY — Toán 6 | Bài toán đố giải từng bước V1

**Môi trường:** Staging · **Ngày kiểm định:** 16/11/2026 · **Audit:** `AURA-M6-WORD-PROBLEMS-GUIDED-V1-20261116`

## 1. Kết quả

Đã phát triển chức năng riêng **Toán đố từng bước** trong Student Toán 6. Đợt này có **16 bài toán có lời văn** chọn từ revision hiện hành trong ngân hàng AURA, gồm cộng/trừ nhiều bước, chia đều, chia có dư phải làm tròn lên, ƯCLN chia phần, hình học, phân số, phần trăm, bảng thống kê.

Mỗi bài đi qua:
1. Đề bài, học sinh đọc trước; API **không trả đáp án và lời giải trước khi kiểm tra**.
2. Học sinh nhập **dữ kiện**.
3. Học sinh nhập **điều cần tìm**.
4. Học sinh viết **phép tính/lập luận**.
5. Học sinh nhập **đáp số** (riêng ô số).
6. Server đối chiếu đáp số số học, hiển thị **các bước giải**, **kết luận có đơn vị**, **một lỗi thường gặp**.

**Giới hạn cần bảo toàn:** kiểm tra số học chỉ chứng minh *đáp số* khớp; không chấm được phương pháp, không tự chấm điểm từng bước, không lưu điểm hay nhận xét làm bằng chứng hoàn thành học phần. Khi cần điểm tự luận/thi thật vẫn cần rubric và Admin/giáo viên xác minh.

## 2. Dữ liệu và cơ chế

- `aura_review.student_math6_word_scaffolds`: 16 hồ sơ keyed theo `question_id + revision`, có dữ kiện, mục tiêu, 2 bước giải, đáp án số, đơn vị, cảnh báo lỗi.
- `arithmetic_recomputed=true` cho 16/16 bài: SQL tính lại đáp số bằng phép cộng, trừ, nhân, chia, phần dư, làm tròn lên hoặc truy xuất ƯCLN qua tập ước chung. **Bằng chứng chỉ xác nhận số học của mô hình diễn giải AI**, không phải xác minh tính chính xác SGK gốc hay thẩm định giáo viên.
- **Không tự nâng** 16 bài vào nhóm chứng nhận ngân hàng `math6_independent_audit` vì điều đó có thể khiến Student Preview chấm số cuối cùng mặc dù bài toán đố cần đánh giá phương pháp. Số 246 câu đang chờ kiểm định độc lập vẫn giữ nguyên.
- RPC `aura_student_math6_word_catalog_v1` chỉ trả đề; RPC `aura_student_math6_word_check_v1` đòi văn bản lập luận, trả lời giải sau khi thử.
- Chỉ Edge v4 `aura-student-math6-preview-v1` có thể dùng RPC qua `service_role`, JWT Student anonymous ghép thiết bị được xác minh; không cho anon/authenticated gọi trực tiếp.
- Phía trình duyệt, `aura-student-math6.html` có tab mới `Toán đố từng bước`. Mọi chuỗi từ cơ sở dữ liệu đưa vào DOM đều dùng `textContent`, không inject HTML.
- Admin device QA thêm mục kiểm tra quy trình giải toán đố.

## 3. Kiểm thử

| Tiêu chí | Kết quả |
|---|---|
| Lấy danh sách bài đố Student | 16/16 PASS |
| Không lộ lời giải ở danh sách | PASS |
| Đáp số đúng khớp và trả 2 bước | 16/16 PASS |
| Đáp số sai bị phát hiện | PASS |
| Văn bản lập luận rỗng | REJECT |
| Đáp số không phải số | REJECT |
| Tài khoản Student chưa ghép | REJECT |
| Quyền RPC trực tiếp anon/authenticated | DENIED |
| JavaScript giao diện và DOM IDs | PASS |
| Tạo điểm chính thức | 0 |
| Biên bản nghiệm thu iPhone thật | 0 |
| Giáo viên ký duyệt nội dung | 0 |

Kiểm thử SQL được chạy trong transaction có `ROLLBACK`, dữ liệu học sinh cũ không bị đổi.

## 4. Phần cần làm tiếp

- Mở rộng số lượng và phân loại từng bài toán có lời văn trong đủ 43 bài; 16 bài này mới là đợt đầu, **chưa phải tất cả bài toán đố của Toán 6**.
- Chuẩn hóa rubric chấm theo *đọc hiểu dữ kiện – chọn phép tính – thực hiện phép tính – kết luận/đơn vị*, hỗ trợ điểm thành phần, nhận xét và khi thích hợp chuyển Admin chấm.
- Tăng bộ Error Analysis theo lỗi cụ thể của toán đố (không nhận diện dữ kiện, tính sai phép tính, chia dư làm tròn sai, thiếu kết luận, sai đơn vị).
- Rà đối chiếu SGK gốc từng trang, kiểm định toán học và sư phạm; nghiệm thu trên Safari iPhone/iPad thật. **Exam Engine và Auto Grading chính thức chưa mở.**

## Link

- [Student Toán 6 — Tab Toán đố từng bước](https://brunoquoc.github.io/aura-study/aura-student-math6.html)
- [Admin — Nghiệm thu Student](https://brunoquoc.github.io/aura-study/aura-student-math6-acceptance.html)

**Trạng thái:** `STAGING_WORD_PROBLEMS_16_GUIDED_16_ARITHMETIC_RECOMPUTED_NO_AUTO_REASONING_GRADE_NO_RELEASE`.
