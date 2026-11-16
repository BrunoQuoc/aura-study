# AURA STUDY — Student Toán 6: Functional QA V2 và biên bản nghiệm thu Staging

**Ngày:** 16/11/2026 (Asia/Ho_Chi_Minh)  
**Audit ID:** `AURA-MATH6-STUDENT-FUNCTIONAL-QA-V2-20261116`  
**Dữ liệu:** Supabase Staging project `ufqzuowjhdqpydqvcsob`  
**Định nghĩa “Đạt” ở đây:** backend integration/SQL regression trong transaction và static JavaScript syntax. **Không phải** nghiệm thu Safari iPhone thật, không phải phát hành sản phẩm.

## Kết quả đã triển khai và kiểm thử

| Hạng mục | Kết quả QA |
|---|---|
| Đăng nhập/phân quyền Student | Dùng phiên anonymous đã ghép với một learner, mọi RPC đều kiểm tra device không bị thu hồi |
| Danh mục học sinh | 9 chương, 43 bài |
| Nội dung học | 7 bài chi tiết gốc + 36 bài có guided-scaffolds AI mới = 43/43 bài có nội dung đọc |
| Luyện tập có chấm điểm an toàn | 30/43 bài mở, chọn tối đa 3 câu bài học đã được kiểm định; 13 bài còn chặn vì chưa có câu độc lập được kiểm định |
| Đề kiểm tra chương | 9/9 chương có bài thử tối đa 6 câu từ pool an toàn |
| Ngân hàng câu có thể đưa vào Student Preview | 148 câu không phụ thuộc hình chưa nghiệm thu trong 156 câu rule-verified |
| Submit/Auto Grading | PASS: câu đúng số, câu sai số, câu bỏ trống, tránh chấm sai câu cần đọc hiểu |
| Admin chấm tự luận | PASS: queue, quyết định theo rubric, nhận xét bắt buộc, cập nhật điểm cuối |
| History/Weakness Map | PASS: Student xem bài đã nộp, chấm thủ công và gợi ý ôn tập |
| Parent progress | PASS: Parent đã cấp membership xem kết quả và bài đã mở của đúng household |
| Resume/Draft | Resume riêng theo paired learner; bản nháp client trong sessionStorage |
| Quyền truy cập | PASS: khác learner không thể xem bài hoặc nộp hộ; không có grant Admin không thể chấm |
| Device attestation | Backend từ chối checklist thiếu và yêu cầu bài luyện, bài chương, chấm thủ công và học bài thực tế |
| Nghiệm thu thiết bị thật | **PENDING: 0 biên bản** |
| Exam Engine/Auto Grading chính thức | **OFF** |

### Bằng chứng kiểm thử giao dịch

- Đã chạy `43/43` lời gọi Student lesson và kiểm tra payload, `7` bài có knowledge_blocks chi tiết và `36` bài Guided AI có 5 bước (khởi động, hình thành kiến thức, ví dụ, luyện, vận dụng).
- Đã chạy `30/30` `start_lesson` với 3 câu tối đa; `13` bài không có câu an toàn được giữ khóa.
- Đã chạy `9/9` chương qua tạo bài, nộp, mở lại; không để lộ answer, explanation, rubric trước nộp.
- Tình huống trộn đúng/sai/bỏ trống: 1 đúng, 1 sai, 4 bỏ trống; Weakness Map ghi một lỗi có căn cứ. Nộp lại cùng attempt là idempotent.
- Chương VI được dùng kiểm tra bản thử có câu cần đánh giá thủ công: Admin queue → chấm có ghi chú → Student xem điểm cuối và lịch sử → Parent xem tiến độ.
- Kiểm thử âm: uid khác không thể đọc attempt, không có ADMIN grant không thể chấm, role không ghép không thể mở bài, checklist thiếu không thể tạo device signoff.
- **Tất cả giao dịch SQL mô phỏng đã `ROLLBACK`**, không tạo điểm/attempt/progress giả lưu trong learner thật. Kiểm tra sau QA: 0 Student attempts, 0 manual history, 0 lesson progress từ mô phỏng.

### Nâng cấp mới

1. Table `aura_review.student_math6_guided_lessons` chứa **36 bài AI tự biên soạn** với các bước học cụ thể và ví dụ. Không sửa phần học liệu SGK được khai báo là trích nguyên văn và không nâng `pedagogical_certified`.
2. RPC `aura_student_math6_lesson_v1` trả `guided_stages`, `content_level=GUIDED_AI_STAGING` và nguồn AI.
3. RPC `aura_student_math6_readiness_v1` hiển thị `guided_ai_lessons=36`, `study_content_available_lessons=43`, `study_content_pedagogically_certified=false`.
4. Student UI `aura-student-math6.html` hiển thị 5 bước học, chặn luyện chưa đủ bằng chứng và giải thích rõ, xử lý revoked role, làm rõ bài chưa nộp/chưa chấm, giữ Staging.
5. Admin `aura-student-math6-acceptance.html`: checklist **9 mục thiết bị thật**, yêu cầu bài kiểm tra chương đã nộp và backend kiểm tra có bài luyện, bài học và chấm thủ công. Chỉ Admin được ghi trạng thái `ADMIN_USER_ATTESTED`. Không tự bật Exam Engine.

## Những điều kiện chưa đạt và lý do

- **13/43 bài** chưa có câu không hình đã được kiểm định độc lập để mở Practice với chấm tự động: ví dụ một số bài chia hết/số nguyên tố, nhận biết hình học và đọc biểu đồ. Đã bổ sung bài tự luyện trong phần hướng dẫn cho nhiều bài; không dùng câu chưa đủ QA để ghi điểm.
- **246/402** câu ngân hàng còn chờ kiểm định toán học độc lập. Các câu SVG và 23 cảnh báo visual QA chưa được nghiệm thu thực tế trên iPhone.
- Học liệu 36 bài AI bổ trợ vừa thêm là bản STAGING và chưa được kiểm định sư phạm, chưa đối chiếu toàn bộ 43 bài theo từng trang SGK.
- **Không có hồ sơ nghiệm thu trên iPhone/iPad thật** và chưa có bài thực tế đã nộp bằng Student. Bản kiểm thử SQL phải được phân biệt rõ với nghiệm thu người dùng.
- Chưa xác minh được URL GitHub Pages phân phối trực tiếp trong công cụ, mặc dù mã đã tồn tại và syntax JS đã PASS trên GitHub.
- Student/Parent sản phẩm chính thức và quyền nhập dữ liệu thật chưa được bật. **Exam Engine và Auto Grading live vẫn OFF.**

## Link thao tác

- [Student — đăng nhập, ghép thiết bị](https://brunoquoc.github.io/aura-study/aura-student.html)
- [Student — học Toán 6 Staging](https://brunoquoc.github.io/aura-study/aura-student-math6.html)
- [Admin — chấm bài Student](https://brunoquoc.github.io/aura-study/aura-student-math6-admin-review.html)
- [Admin — biên bản nghiệm thu thiết bị thật](https://brunoquoc.github.io/aura-study/aura-student-math6-acceptance.html)
- [Parent — theo dõi tiến độ Staging](https://brunoquoc.github.io/aura-study/aura-parent.html)
- [Admin — bảy điều kiện nghiệm thu và QA](https://brunoquoc.github.io/aura-study/aura-math6-readiness.html)

**Kết luận:** Đã hoàn thiện và kiểm thử đầy đủ luồng backend Staging đối với phần nội dung/đề hiện đủ điều kiện QA. Chưa đạt nghiệm thu Student trên thiết bị thật hoặc điều kiện phát hành toàn bộ Toán 6. Không giả giấy chứng nhận thiết bị, không bật live.
