# AURA STUDY — ADR-FIVE-SUBJECTS-001: Tự luận nhập trực tiếp trên web
Ngày phê duyệt: 2026-11-04
Trạng thái: APPROVED DESIGN — chưa triển khai production
Phạm vi: 1 học sinh lớp 6, 1 Admin phụ huynh. Áp dụng CHỈ cho 5 môn: Lịch sử & Địa lí (LSDL), Khoa học tự nhiên (KHTN), Tin học (TINHOC), Công nghệ (CONGNGHE), Giáo dục công dân (GDCD).
Bổ sung cho docs/AURA_CONTENT_STANDARD_8_SUBJECTS_V1.md; không thay thế quy tắc viết tay đã chốt của Toán và Ngữ văn.

## 1. Quyết định đã chốt
- Đối với 5 môn này, câu hỏi tự luận **nhập câu trả lời trực tiếp trên web** là đường đi mặc định. Không bắt buộc viết giấy, chụp ảnh hay OCR.
- Mỗi câu có `textarea` riêng (hỗ trợ gõ tiếng Việt, xuống dòng, lưu nháp và đếm từ nếu đề yêu cầu); nội dung gắn attempt_id, question_id, question_version, autosave revision.
- Trắc nghiệm / điền từ / matching vẫn dùng UI phù hợp câu hỏi, không ép thành textarea.
- Với câu đặc biệt cần lược đồ, bản đồ, biểu đồ, bảng tính, sản phẩm thực hành, hình vẽ hay tệp minh chứng, cho đính kèm **tùy chọn** hoặc tạo bài thực hành riêng; không mặc định bắt buộc chụp.
- Bảo toàn câu trả lời gốc của học sinh. AI không tự thay, tự viết lại hoặc làm bài hộ trong phiên làm bài có chấm.
- Quy tắc nộp/chấm giống Toán và Văn: **NỘP TOÀN BÀI → CHẤM → CÔNG BỐ ĐIỂM/NHẬN XÉT → ĐÁP ÁN/DÀN Ý GỢI Ý**. Không lộ đáp án, đúng/sai hay điểm theo từng câu trước khi nộp hết.
- Nếu AI không chắc, thiếu rubric, câu hỏi có nhiều cách hiểu hợp lệ hay chất lượng dữ liệu nguồn thấp, phân loại `AI_GRADED_PROVISIONAL` / `NEEDS_PARENT_REVIEW`; điểm sơ bộ phân biệt với điểm chính thức. Chưa chấm được không bị ép thành 0.
- Chỉ dùng điểm đã xác minh đủ tin cậy cho Weakness Map chính thức.

## 2. UX và xử lý dữ liệu
1. Student thấy đề và ô trả lời theo từng câu, có thể gõ/soạn ở web.
2. Autosave có debounce và transactional local record; chỉ báo đã lưu trên máy khi IndexedDB write thành công; hiển thị pending sync rõ. Không trộn đáp án các câu.
3. Bài có thời gian: cảnh báo thời gian còn lại và trạng thái offline; không đồng nhất mất kết nối với nộp thành công. Chính sách hết giờ do Admin xác nhận và lưu làm metadata của exam snapshot.
4. Nút `Nộp toàn bài` có bước xác nhận; khóa snapshot câu trả lời + event UUID sau khi nộp, chấm server sau khi nhận dữ liệu. Nếu offline, hiển thị `Đã lưu trên máy, chờ đồng bộ và chấm`; không giả đã chấm.
5. Chỉ khi đủ kết quả được phép công bố, Student xem điểm theo rubric, nhận xét dựa vào đúng câu trả lời của con, đáp án/dàn ý gợi ý. Nêu nhiều cách diễn đạt đúng khi phù hợp.
6. Cho bài sửa/ôn lại thành một **lượt mới**, liên kết với lượt gốc; không ghi đè câu đã nộp. AI feedback trong practice mode được phép sau nộp; còn guided-learning mode là nội dung khác, không dùng trước trong bài kiểm tra.

## 3. Rubric theo 5 môn
- **LSDL**: tách HISTORY, GEOGRAPHY, INTEGRATED. Chấm đúng sự kiện/mốc thời gian/địa điểm; giải thích nguyên nhân-kết quả, lập luận, trích dẫn dữ kiện. Câu phân tích bản đồ cần hình và chú giải; không suy luận dữ kiện không có.
- **KHTN**: kiến thức khoa học, nêu/giải thích hiện tượng, quan hệ nhân quả, dùng số liệu và đơn vị, giả thuyết vs kết luận. Câu thí nghiệm dùng rubric quy trình, an toàn, dữ liệu quan sát; không suy diễn con đã làm thí nghiệm chỉ từ mô tả.
- **Tin học**: khái niệm, tư duy thuật toán, giải thích thao tác, nguyên tắc an toàn số. Câu cần chứng minh thao tác trên phần mềm/tệp sản phẩm tách mode thực hành và minh chứng; không chấm năng lực thực hành chỉ từ đoạn văn mô tả.
- **Công nghệ**: hiểu thiết bị/vật liệu/chức năng/quy trình, lựa chọn phương án và lý do, biện pháp an toàn. Bài sản phẩm thực tế dùng rubric và minh chứng riêng.
- **GDCD**: phân tích tình huống, nhận diện chuẩn mực/quyền và nghĩa vụ, phương án giải quyết hợp lý và lý lẽ. Chấp nhận nhiều cách ứng xử thỏa tiêu chí; không gán nhãn nhân cách của học sinh.

## 4. Chấm và bảo vệ đáp án
- `question_id` có rubric và answer key/version đã kiểm chứng hoặc Admin xác nhận. AI đề xuất answer nhưng chưa xác minh không được coi là đáp án chuẩn để chấm chính thức.
- Chấm tiêu chí theo câu, giải thích ở mức học sinh lớp 6, phản hồi ngắn và cụ thể. Không so khớp từ khóa thô để quyết định câu tự luận mở đúng/sai.
- Ẩn đáp án/rubric nội bộ và giải thích mẫu nhạy cảm khỏi client trước khi nộp; enforce ở backend, không chỉ bằng CSS/JS.
- Không lộ kết quả từng câu trong đề chưa hoàn tất; Admin thấy dữ liệu khi đồng bộ theo quyền.
- Nếu xử lý chấm bất thành/thiếu chứng cứ, hiển thị trạng thái chờ, không chấm bừa hoặc mở đáp án sớm.

## 5. Đồng bộ và an toàn
- Dùng IndexedDB local-first: text draft version, last_saved_local_at, answer_snapshot khi nộp, sync outbox event UUID; server idempotency và RLS.
- Khi chung thiết bị, Admin/Student có phiên quyền tách biệt; không hiển thị dữ liệu Admin ở Student do chuyển vai bằng flag client.
- Văn bản gõ của học sinh là dữ liệu riêng tư, không đưa vào code repo hoặc URL công khai.
- Reconnect xử lý đúng một lượt nộp; Admin ở thiết bị khác thấy trạng thái đã đồng bộ và bài học sinh.

## 6. Acceptance tests
1. Mỗi môn 1 đề gồm câu chọn và 2 câu tự luận gõ trực tiếp, autosave đúng từng câu, reload không mất chữ.
2. Chưa nộp toàn bài không có điểm, lời giải, hướng dẫn sau chấm hoặc câu đúng/sai.
3. Đề nộp thành công chỉ công bố đáp án sau khi chấm theo rubric hoặc hoàn tất bước Admin review.
4. Mất mạng khi gõ/nộp: lưu bài cục bộ và đồng bộ đúng một lần, Admin thấy từ máy khác.
5. Rubric LSDL phân biệt lịch sử với địa lí; KHTN không gán nhầm giả thuyết; Tin học/Công nghệ yêu cầu minh chứng khi chấm kỹ năng thực hành; GDCD chấp nhận nhiều cách lập luận hợp lý.
6. Khi thiếu nguồn/đáp án hoặc câu diễn đạt mơ hồ: chưa chấm chính thức, giữ kết quả review, không ép điểm 0.
7. Nộp lại/sửa bài là lượt mới; giữ lịch sử phiên bản ban đầu.
8. Kiểm thử quyền: Student không đọc đáp án trước thời điểm phát hành hoặc sửa điểm/rubric.

## 7. Ranh giới
- **Toán & Ngữ văn**: các câu tự luận đã chốt viết giấy, chụp ảnh; quy tắc này không thay thế chúng.
- **Tiếng Anh**: cơ chế câu tự luận chưa được quyết định trong ADR này.
- Đây là phê duyệt thiết kế; chưa có chức năng mới được triển khai lên production.
