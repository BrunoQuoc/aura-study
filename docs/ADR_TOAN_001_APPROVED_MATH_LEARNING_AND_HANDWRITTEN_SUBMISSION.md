# AURA STUDY — ADR-TOAN-001: Quy chuẩn môn Toán đã chốt
Ngày phê duyệt: 2026-11-04
Trạng thái: APPROVED DESIGN — chưa triển khai production
Phạm vi: Một học sinh lớp 6, một Admin phụ huynh; dùng chung hoặc khác thiết bị; local-first, cloud sync đáng tin cậy.
Nguồn liên quan: [Toán 6 — Adaptive Learning V1](AURA_TOAN_ADAPTIVE_LEARNING_V1_PROPOSAL.md), [Quy chuẩn 8 môn](AURA_CONTENT_STANDARD_8_SUBJECTS_V1.md), [Ngữ văn viết tay](AURA_NGUVAN_HANDWRITTEN_GRADING_V1.md), [Kiến trúc đồng bộ](AURA_SINGLE_LEARNER_SYNC_V1.md).

## 1. Quyết định sản phẩm đã được phụ huynh chốt
### 1.1 Phương pháp học và ôn Toán
AURA dùng chu trình 6 bước: (1) kiểm tra kiến thức nền, (2) giải thích bản chất trực quan, (3) xem ví dụ có lý do từng bước, (4) tự giải bài từ gần đến biến đổi, (5) nhận diện và sửa lỗi theo chứng cứ, (6) ôn lại ngắt quãng, tăng dần khả năng vận dụng. Ưu tiên hiểu đúng và tự giải hơn số lượng bài hoặc tốc độ.

- Học kiến thức có thể dùng hình minh họa, trục số, bài mẫu, gợi ý từng mức khi con thật sự cần; không giải hộ ngay.
- Ôn sau khoảng thời gian được điều chỉnh bằng kết quả thực tế; không gắn nhãn "đã vững" chỉ sau một bài đúng.
- Mỗi kỹ năng theo dõi: hiểu khái niệm, giải độc lập, vận dụng dạng biến đổi, kết quả ôn lại, lỗi lặp; bằng chứng và độ tin cậy tách riêng.

### 1.2 Bài toán đố / Toán tự luận viết tay
**BẮT BUỘC theo chuẩn ảnh bài làm** cho:
- Bài toán đố và toán có lời văn, bài giải nhiều bước;
- Bài hình học vẽ hình, trình bày, giải thích/lập luận;
- Bài thực tế cần tóm tắt, lập phép tính, giải và kết luận.

Trình tự:
1. Con xem đề trên Student, tự giải **trên giấy bên ngoài**.
2. Chụp/tải ảnh bài làm **vào đúng ô của từng câu hỏi**. Hỗ trợ nhiều ảnh/trang, đổi thứ tự, xem trước, xoay, thay ảnh trước khi nộp.
3. Con hoàn thành các câu và bấm **Nộp toàn bài**. Khóa phiên bản đáp án đã nộp; không tự sửa bài gốc sau nộp; lần làm lại tạo version/lượt mới.
4. **Sau khi nộp toàn bài** mới chạy chấm điểm (kể cả trắc nghiệm, nếu chúng cùng một đề); không hiển thị kết quả từng câu trước khi nộp hết.
5. **Chỉ sau khi chấm xong theo trạng thái cho phép** mới mở: điểm, nhận xét theo bước, lỗi cụ thể, lời giải/đáp án gợi ý và một bài tương tự để tự kiểm tra lại.

Các câu trắc nghiệm, điền số hoặc tính ngắn không bắt buộc ảnh, nhưng vẫn cùng quy tắc **nộp toàn bài → chấm → mới hiện đáp án** khi nằm trong một đề/bài ôn có chấm.

## 2. Tách rõ CHẾ ĐỘ HỌC với CHẾ ĐỘ LÀM BÀI CÓ CHẤM
- `LEARN_GUIDED`: học bài, xem ví dụ và gợi ý từng nấc được phép **trong bài học riêng**, có nhãn rõ đây là nội dung hướng dẫn, không tính là bài kiểm tra năng lực độc lập.
- `PRACTICE_SUBMISSION` / `ASSESSMENT`: đề ôn có nộp điểm hoặc kiểm tra năng lực: **không hiện gợi ý, lời giải, đáp án, đúng/sai, điểm theo câu trước khi nộp toàn bài**. Không cho lộ câu khác qua UI, API hoặc nội dung file client tải sẵn; hệ thống chấm hoặc cấp đáp án sau nộp với quyền phù hợp.
- Sau chấm, đề nghị con làm lại bài biến đổi để xác nhận hiểu bài; việc đúng sau khi đã xem gợi ý không được tính ngang với giải độc lập lần đầu.

## 3. Chấm từng bước cho bài viết tay
- Không chỉ so đáp số cuối. Rubric theo **từng câu**, có source/phiên bản và điểm tối đa, có thể gồm: hiểu dữ kiện và yêu cầu; mô hình/lập phép tính; phép biến đổi/tính toán; lập luận; đơn vị/kết luận/trình bày.
- **Không áp một trọng số 5 phần cố định** cho mọi câu; ví dụ bài 5 điểm có thể chia hiểu đề 1, lập phép tính 1,5, tính toán 1,5, kết luận 1 nhưng chỉ khi rubric câu đó được Admin xác nhận.
- Nếu đúng phương pháp nhưng sai một phép tính, cho điểm phần hợp lý; nếu ra đúng số bằng lập luận sai, không chấm tối đa chỉ vì đúng đáp số.
- Ảnh gốc là bằng chứng; OCR chữ viết tay / ký hiệu / hình vẽ chỉ là bản trích xuất có thể sai, phải giữ confidence và liên kết từng nhận xét đến ảnh/bước làm. Không suy luận hình không theo tỷ lệ hoặc dữ kiện thiếu.
- Chỉ cho `AUTO_VERIFIED` khi parser đủ chắc và có bộ kiểm tra đáp án/quy trình hoặc rubric đã được duyệt. Các trường hợp chưa chắc ở `AI_GRADED_PROVISIONAL` / `NEEDS_PARENT_REVIEW` và Admin kiểm tra, điều chỉnh cùng lý do.
- **Ảnh mờ, cắt mất chữ, thiếu trang, không đọc được → `NEEDS_RETAKE` hoặc `NEEDS_PARENT_REVIEW`, không tự chấm 0.**
- Câu chưa có đáp án xác minh, hình thiếu dữ kiện hoặc nguồn AI tự giải chưa duyệt không tự đưa vào điểm năng lực/Weakness Map.
- Không phát hành đáp án gợi ý nếu bài vẫn `NEEDS_RETAKE` hoặc `NEEDS_PARENT_REVIEW` chưa hoàn tất; Admin có thể xác minh để kết thúc chấm. Không lộ đáp án nguồn trước thời điểm chấm xong.

## 4. Student UX và trạng thái
Một câu tự luận có **Ô đáp án câu N** với nút Chụp bài làm, Tải ảnh, Thêm trang, Xem lại, Xoay/chụp lại. Mỗi ảnh gắn `attempt_id`, `question_id`, `page_index`, `content_sha256`.
- `DRAFT_LOCAL` → `SUBMITTED_LOCAL` → `SYNC_PENDING` → `SUBMITTED_SERVER` → `GRADING_PENDING` → `AI_GRADED_PROVISIONAL` / `NEEDS_PARENT_REVIEW` → `GRADED_FINAL` → `SOLUTION_RELEASED`.
- Sau Nộp toàn bài mà offline: lưu ảnh, câu trả lời, sự kiện và phiên bản đề vào IndexedDB trước khi báo `Đã lưu trên máy`; chỉ báo `Đã đồng bộ` khi server ACK. Nếu AI grading cần cloud, để `Chờ kết nối để chấm`, tuyệt đối không giả đã chấm.
- Nộp lại khi reconnect phải idempotent; không được ghi trùng kết quả. Parent có thể xem ảnh trên thiết bị khác sau khi sync.
- Ảnh bài của trẻ lưu private, kiểm soát truy cập, không công khai URL hoặc đưa lên GitHub repo.

## 5. Admin giám sát
- Xem bài viết gốc, ảnh theo câu, lời giải nhận dạng từ OCR (nếu có), điểm từng tiêu chí và rubric nguồn.
- Thấy riêng điểm sơ bộ và điểm đã xác minh; có quyền confirm/adjust/regrade với audit trail.
- Weakness Map phân biệt: hiểu đề, chọn phép tính, thực hiện phép tính, suy luận, hình học, trình bày/đơn vị; chỉ dùng lỗi có bằng chứng, không quy chụp bất cẩn/lười.
- Theo dõi lỗi đã được con tự sửa, mức cần gợi ý, khả năng làm bài biến đổi và kết quả ôn lại.
- Báo cáo năng lực loại trừ đáp án không đọc được/không chấm được thay vì tính thành 0.

## 6. Roadmap ưu tiên
- **P0:** cơ chế nộp toàn bài và khóa đáp án/gợi ý đến sau chấm; ô ảnh theo câu; chụp nhiều trang; lưu/sync không mất bài; quality check ảnh; rubric chấm từng bước; Admin review; kết quả và lời giải hiện đúng thời điểm; bài giải tương tự.
- **P1:** kiểm tra kiến thức nền, bài học trực quan/giải mẫu, thích ứng mức độ, ôn ngắt quãng, Error Analysis/Weakness Map theo kỹ năng với bằng chứng; liên kết các lỗi với nội dung cần ôn.
- **P2:** hình tương tác, luyện giải thích bằng lời, tối ưu lộ trình theo dữ liệu sau kiểm thử thật.
- Không sửa production cho tới khi có backup, kiểm thử thực tế và kế hoạch rollback.

## 7. Ca kiểm thử nghiệm thu (release gate)
1. Đề gồm 3 câu trắc nghiệm và 2 bài toán đố: Student nộp ảnh vào đúng từng câu; **chưa nộp toàn bài thì không thấy điểm hoặc lời giải** của bất kỳ câu nào.
2. Student nộp đủ: hệ thống chấm theo rubric câu đã xác minh; mở đáp án gợi ý **sau khi chấm hoàn tất**, không trước.
3. Bài đúng cách làm nhưng tính nhầm: có điểm bước đúng, nhận xét lỗi phép tính, không chỉ dựa vào đáp số.
4. Đáp số đúng nhưng thiếu lập luận/kết luận: rubric ghi nhận thiếu bước.
5. Ảnh mờ hoặc thiếu trang: yêu cầu chụp lại/Parent review, không tự cho 0, không phát hành lời giải trước khi hoàn tất.
6. Tài liệu không có đáp án verified: không tự chấm chính thức bằng lời giải AI chưa xác minh.
7. Hai ảnh cùng câu được lưu đúng thứ tự, vẫn tồn tại sau refresh/mất mạng; khi online nộp một lần, Admin thấy trên thiết bị khác.
8. Chấm sơ bộ và chấm Admin không bị trộn; thay đổi có audit.
9. Student sau khi xem hướng dẫn làm đúng một bài mới: AURA không tính như bài làm độc lập trước gợi ý.
10. Không lộ đáp án/điểm qua nguồn Student tải sẵn hoặc quyền API trước khi bài nộp.

## 8. Phân biệt thiết kế và triển khai
**APPROVED DESIGN** nghĩa là phụ huynh đã chốt yêu cầu; không đồng nghĩa mô-đun đã chạy, OCR/AI grader đã được kiểm định hay production đã thay đổi.
