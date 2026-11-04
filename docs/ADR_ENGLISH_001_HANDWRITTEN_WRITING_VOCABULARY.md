# AURA STUDY — ADR-ENGLISH-001: Writing & Vocabulary viết tay, nộp ảnh
Ngày phê duyệt: 2026-11-04
Trạng thái: APPROVED DESIGN — chưa triển khai production
Phạm vi: AURA STUDY lớp 6; 1 Student, 1 Parent/Admin; local-first, dùng chung hoặc khác thiết bị.

## 1. Quyết định của Admin (ưu tiên cao hơn các đề xuất trước)
**English WRITING:** Bài viết câu, viết đoạn, email, câu viết lại, diễn đạt mở, bài nghe-chép chính tả có yêu cầu viết chữ và luyện ngữ pháp yêu cầu tự viết câu sẽ được học sinh **viết trên giấy → chụp ảnh đưa vào đúng ô câu → nộp toàn bài → chấm → hiện nhận xét/đáp án gợi ý**. Không bắt buộc gõ bài trả lời trên web. Các câu trắc nghiệm/chọn đáp án/ghép nối vẫn thao tác trên web.

**English VOCABULARY:** Giữ **thẻ từ vựng trực tuyến** để xem/lật thẻ, xem hình, nghĩa, nghe phát âm và ví dụ. Nhưng ở các hoạt động yêu cầu **tự nhớ để viết từ, chính tả, phiên âm theo phạm vi được giao, cụm từ hoặc đặt câu**, học sinh phải **viết tay ra giấy rồi chụp nộp**. Không lấy thao tác lật thẻ hoặc nhấn “Đã nhớ” làm bằng chứng đã viết đúng. Có thể ghép 5–8 từ vào **một phiếu luyện viết từ vựng đánh số**, tải 1–n ảnh cho cả phiếu, hệ thống ánh xạ số thứ tự sang đúng prompt để tránh yêu cầu chụp từng từ một.

**Phạm vi các kỹ năng:** Listening nghe audio trực tuyến; Speaking nói/ghi âm; Reading đọc/đáp ứng theo dạng câu (MCQ/chọn vẫn trên web, phần tự luận viết tay nếu là sản phẩm Writing); Writing và Vocabulary written production theo cơ chế ảnh. English Missions và Grammar Builder khi có yêu cầu viết câu phải dùng cùng input ảnh, không âm thầm tạo lại một luồng gõ trực tiếp.

**Bãi bỏ đề xuất trước:** Quy tắc “Writing typed directly on web” trong `AURA_ENGLISH_FOUR_SKILLS_V1_PROPOSAL.md`; các hoạt động "type/spell/use a sentence" trong `AURA_VOCABULARY_CARDS_V1_PROPOSAL.md` và `AURA_ENGLISH_ADDITIONAL_MODULES_V1_PROPOSAL.md` được thay thế bằng viết giấy/chụp ảnh **khi đó là câu trả lời bằng chữ viết**. Những đề xuất 4 kỹ năng và thẻ học từ vẫn giữ các phần không mâu thuẫn. Đây là tài liệu quyết định ưu tiên, không phải áp dụng một cách mơ hồ.

## 2. Chuẩn thao tác Student
1. Mỗi câu Writing có `Ô nộp bài viết tay`: Chụp ảnh, Tải ảnh, Thêm trang, Xem trước, Xoay, Chụp lại, Sắp thứ tự. Mỗi ảnh gắn với `attempt_id` + `question_id` + `page_index`.
2. Bài Vocabulary: chọn Unit/Topic, xem thẻ/nghe mẫu rồi chuyển `Phiếu luyện viết`. Mỗi ô của phiếu có số/mã từ, hướng dẫn (Việt → Anh; nghe → viết; sử dụng từ trong câu). Con viết từ/đáp án lên giấy theo đúng số và chụp 1 hoặc nhiều ảnh vào `Ô nộp phiếu`. Không hiện sẵn đáp án ở chế độ kiểm tra. Nếu học theo chế độ lật thẻ, nội dung nghĩa và từ mẫu có thể xuất hiện vì đó là chế độ học, không phải kiểm tra.
3. Tất cả hoạt động có chấm theo đề/bài: **nộp toàn bài/phiếu trước, không hiện đúng-sai, điểm, transcript, đáp án gợi ý trong khi làm**. Sau khi chấm xong theo quy trình phê duyệt mới hiển thị phản hồi và đáp án/dàn ý/câu ví dụ gợi ý.
4. Phiếu nộp phải hiển thị rõ những câu đã có ảnh, câu thiếu ảnh, kiểm tra chất lượng ảnh và xác nhận trước khi khóa bài. Sau nộp không sửa ảnh gốc; sửa bài tạo lượt nộp mới.
5. Bản ảnh được lưu trước vào IndexedDB cùng exam version và event UUID; mất mạng hiển thị `Đã lưu trên máy, chờ đồng bộ và chấm`, không tuyên bố chấm xong. Đồng bộ lên private storage server theo retry idempotent, có ACK; Admin thấy bài sau khi đã đồng bộ.

## 3. Chuẩn chấm Writing
- Rubric từng câu: đáp ứng nhiệm vụ/ý nghĩa, từ vựng, ngữ pháp, tính mạch lạc/liên kết (nếu phù hợp), chính tả và dấu câu, theo điểm tối đa của câu; **không áp trọng số cố định cho mọi dạng**.
- OCR tiếng Anh viết tay là bản nhận dạng có độ không chắc; luôn giữ ảnh gốc. Không tự biến lỗi OCR thành lỗi spelling/grammar của học sinh.
- Chấp nhận nhiều cách diễn đạt đúng và câu phù hợp ngữ cảnh; không chấm bằng so khớp nguyên văn bài mẫu.
- AI có thể đề xuất điểm theo tiêu chí, dẫn chứng câu/bước, nhận xét và bài viết gợi ý sau chấm; trạng thái là `AI_GRADED_PROVISIONAL` khi chưa kiểm chứng đủ. Admin được xem, xác minh/sửa điểm, có audit.
- Ảnh thiếu/mờ/cắt chữ, bài không nhận dạng được, thiếu rubric hoặc đáp án nguồn chưa xác minh: `NEEDS_RETAKE` hoặc `NEEDS_PARENT_REVIEW`, **không tự cho 0 điểm, không kết luận sai chính tả**.

## 4. Chuẩn chấm Vocabulary
- Phân biệt các chiều năng lực: (a) nhận ra nghĩa khi thấy từ, (b) nhớ lại từ khi xem nghĩa, (c) viết đúng chính tả bằng tay, (d) dùng đúng từ trong câu/ngữ cảnh, (e) nhận ra dạng nói/nghe khi có audio.
- Viết chính tả/từ đơn: đối chiếu từ/cụm từ và biến thể hợp lệ đã được xác minh, dựa trên ảnh đọc được rõ. Sai do OCR thì chuyển review.
- Đặt câu: dùng rubric nghĩa/ngữ cảnh, hình thái từ, cấu trúc ngữ pháp, chính tả; chấp nhận nhiều câu đúng.
- Thẻ học hiển thị tự do trong LEARN mode; thẻ ôn RECALL/TEST phải giấu từ đích/đáp án đến lúc con đã hoàn tất phiếu và được chấm. Không đánh đồng biết mặt chữ với tự viết được.
- Ôn tập ngắt quãng từ kết quả xác minh theo từng nghĩa của từ (word sense), có phân biệt nhớ nghĩa và viết/dùng được, không tăng "mastered" chỉ vì lật thẻ.

## 5. UX nhất quán với môn Văn và Toán
Một nền tảng ảnh bài viết tay chung: xử lý ảnh, liên kết câu/phiếu, crop/rotate, multi-page, local-first outbox, private object storage, OCR, rubric, Admin review, results gating. Các môn có rubric riêng; không dùng rubric Văn để chấm tiếng Anh. Phần trắc nghiệm của mọi môn vẫn chấm bằng cơ chế khách quan sau nộp toàn bài.

## 6. Admin dashboard
- English Writing: bài ảnh gốc, OCR confidence, tiêu chí điểm, lỗi đã xác minh, bài viết lần 1 vs lần 2.
- Vocabulary: `Nhận nghĩa`, `Nhớ & viết đúng`, `Dùng đúng trong câu`, từ đến hạn ôn và các từ chưa ổn định.
- Không có điểm chính thức khi OCR/nguồn/rubric không đủ tin cậy; AI provisional tách rõ với Admin verified. Báo cáo chỉ dùng evidence hợp lệ và số lượng quan sát.

## 7. Thứ tự và nghiệm thu
P0: chung photo-submission engine cho Toán/Văn/English, hỗ trợ Writing per-question và Vocabulary worksheet per-batch, chống lộ đáp án trước nộp/chấm, chống mất bài offline và trùng sync, parent review.
P1: OCR chữ viết tiếng Anh, kiểm tra chính tả theo ảnh, chấm rubric viết câu/đoạn, bài ôn Vocabulary có lịch nhắc, nhận xét và chụp bản sửa lần 2.
P2: phối hợp nghe–viết (audio→paper→photo) và phát âm/đặt câu nói, hỗ trợ speaking AI khi đủ độ ổn định.

Acceptance tests:
1. Writing 3 câu: 2 ảnh câu 1, 1 ảnh câu 2, 1 ảnh câu 3; ảnh không bị gán sai câu sau reload/offline/sync.
2. Vocabulary 8 từ: một phiếu viết đánh số, 2 ảnh, mapping từng số/từ chính xác; thiếu số hoặc ảnh nhòe → review, không ép sai.
3. Student chỉ được xem đáp án và lời giải mẫu sau khi nộp toàn bài/phiếu và kết thúc chấm theo policy; không rò qua API/client.
4. OCR đọc sai một từ đúng trong ảnh: không trừ điểm chính thức; Admin có thể sửa transcription và regrade có audit.
5. Student làm đúng chính tả nhưng đặt câu sai ngữ cảnh: lưu hai năng lực riêng.
6. Bài nộp offline sống qua refresh, đồng bộ đúng một lần, Admin trên thiết bị khác nhận được.
7. Mọi ảnh/giọng của trẻ private; không public direct links, không lưu trong repo.
8. Với bài Writing mở, nhiều cách diễn đạt đúng đều được xem xét bằng rubric.
9. Cơ chế lật thẻ học Vocabulary vẫn sử dụng được mà không bắt chụp từng thẻ.

**Release gate:** Quyết định được chốt ở mức design, chưa thay đổi sản phẩm đang chạy; chỉ bật production sau khi backend, bảo mật, OCR/grading và kiểm thử thiết bị thật đạt.
