# AURA STUDY — Báo cáo Toán 6 sau xây dựng ôn cuối năm và rubric tự luận (13/11/2026)

## Độ bao phủ đã biên soạn

| Phạm vi | Bài chính | Câu luyện trong bài | Câu ôn riêng |
|---|---:|---:|---:|
| Tập 1, Chương I–V | 22/22 | 66 | 30 |
| Tập 2, Chương VI phân số | 5/5 | 15 | 6 |
| Tập 2, Chương VII số thập phân | 4/4 | 12 | 6 |
| Tập 2, Chương VIII hình học | 6/6 | 18 | 6 |
| Tập 2, Chương IX dữ liệu và xác suất | 6/6 | 18 | 6 |
| Ôn tổng hợp hai tập | — | — | 12 |
| **Tổng** | **43/43 bài chính** | **129** | **66** |

**195 câu trắc nghiệm AURA tự biên soạn (bản nháp), cùng 5 bài tự luận với 20 tiêu chí chấm từng phần, tổng thang điểm 10.** Bài tự luận là bổ sung độc lập, không gộp vào 195 MCQ. Có **11 tương tác** và **6 hình SVG tĩnh**. Đây là đếm học liệu đã viết, không phải điểm hay mức độ được giáo viên chứng nhận.

## Gói mới sau Chương IX

- `aura_data/knowledge_math6_kntt_yearend_review_v1.json`: 6 câu ôn Chương VI, 12 câu tổng hợp theo kỹ năng Tập 1 và Tập 2, 5 bài tự luận gồm ví dụ giải/4 tiêu chí cho điểm mỗi bài.
- Cấu trúc 5 tự luận: ƯCLN/BCNN; cộng và chia phân số; trung điểm có lập luận; tính giảm giá phần trăm; bảng số lần và xác suất thực nghiệm.
- Mỗi bài tự luận có tối đa **2 điểm**, chia 4 tiêu chí **0,5 điểm**, tổng **10 điểm**. `gradingMode=HUMAN_REVIEW_REQUIRED`, `machineAutoGradeAllowed=false`, `teacherApproved=false`; AURA chỉ đưa lời giải tham khảo, **không tự chấm lập luận hay chuyển điểm sang Exam Engine**.
- `knowledge-math6-yearend.html`: học sinh luyện hai bộ trắc nghiệm có tự chấm cục bộ, xem giải thích và gợi ý bài cần ôn khi sai; mở từng lời giải tự luận/rubric khi đã tự làm xong. Không yêu cầu nhập lại câu hỏi hay đáp án.
- Lưu điểm trắc nghiệm cục bộ với SHA-256 bộ câu theo từng dạng ôn. Nếu thay đổi học liệu, điểm bản cũ không còn khớp SHA. Không lưu lời giải tự luận của học sinh trong trình duyệt hoặc máy chủ.

## Trạng thái chất lượng và điều kiện GO

- **Phần học liệu:** đã viết đủ 43 bài chính của hai tập và một bộ ôn tổng hợp cơ bản; không coi như đã đối chiếu đầy đủ mọi hoạt động thực hành/trải nghiệm, luyện tập chung, kiểm tra học kỳ và lời giải nguyên bản SGK.
- **Phần đáp án:** đã có ledger đối chiếu câu trắc nghiệm và kiểm tra toán học độc lập trong CI; chưa có đánh giá của giáo viên theo từng nguồn/version.
- **Phần sản phẩm:** trang dùng được trên GitHub Pages sau khi CI PASS; Playwright kiểm tra iPad/điện thoại/desktop giả lập, không thay cho Safari thật.
- **Cổng phê duyệt:** vẫn `NO_APPROVED_RELEASE`. 96 câu Tập 1 chưa có chữ ký giáo viên; 99 câu Tập 2 và ôn cuối năm chưa nhập cổng ký chính thức. Không có chức năng tự duyệt; Question Bank/Exam Engine/Weakness Map sản xuất không nhận câu mới.
- **Bài tự luận:** giữ chấm thủ công theo rubric có thẩm quyền; chỉ đánh giá tự động các phần định lượng sau khi thuật toán đủ chứng cứ và có ranh giới rõ.

## Những gì vẫn cần xây dựng trước GO chính thức

1. Bảng kiểm định sư phạm đầy đủ theo nguồn chính thức, biên bản/ngoại lệ/đáp án và chứng cứ được người có chuyên môn duyệt độc lập.
2. Kiểm kê riêng các phần **Luyện tập chung, thực hành/trải nghiệm, bài ứng dụng tự luận nâng cao**, xác thực phạm vi so với sách trường sử dụng và bổ sung phần chưa đạt.
3. Kiểm định **thang điểm tự luận theo từng bước** trên các phương pháp giải tương đương và phản ví dụ để tránh máy chấm sai.
4. Quản trị GitHub cấu hình Environment `aura-learning-approval`, required reviewers và P-256 secret bảo vệ; quy trình chữ ký chỉ chuyển item đạt QA sang Generator; Weakness Map chỉ nhận kết quả đã chấm.
5. Nghiệm thu Safari iPad thực, backup/rollback và phân quyền dữ liệu trước khi tuyên bố toàn hệ thống GO.

**Không có nội dung SGK có bản quyền được sao chép đầy đủ vào kho công khai**; toàn bộ đề, ví dụ và rubric mới do AURA tự biên soạn tham chiếu phạm vi mục lục.
