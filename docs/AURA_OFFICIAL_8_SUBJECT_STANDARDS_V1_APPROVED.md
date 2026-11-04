# AURA STUDY — QUY CHUẨN CHÍNH THỨC 8 MÔN V1.0
**Quyết định sản phẩm:** APPROVED / ĐÃ ĐƯỢC PHỤ HUYNH CHỐT
**Ngày chốt:** 2026-11-05
**Trạng thái kỹ thuật:** DESIGN APPROVED — NOT IMPLEMENTED OR DEPLOYED
**Phạm vi:** 01 học sinh lớp 6 + 01 Admin phụ huynh; cùng hoặc khác thiết bị; ứng dụng local-first + cloud sync đáng tin cậy.

> **Tài liệu này là nguồn quyết định ưu tiên cao nhất cho cách học, cách trả lời và thời điểm chấm của tất cả 8 môn.** Các tài liệu cũ có chữ PROPOSAL vẫn còn để tra cứu lịch sử, nhưng phần nào mâu thuẫn với bộ chuẩn này thì bộ chuẩn này được ưu tiên. Chưa thay đổi production.

## I. Quy định chung toàn hệ thống
1. **Nguồn:** Anh tải file gốc PDF, Word, ảnh, Excel, PowerPoint mà không phải chuyển theo template. AURA giữ nguyên nguồn, tự trích xuất/tách phần, đề xuất loại tài liệu/môn/chủ đề/kỳ, chuẩn hóa thành bản học liệu. Tài liệu chưa chắc hoặc đáp án chưa kiểm chứng cần Admin duyệt; không công bố giả và không xóa/sửa nguồn.
2. **Loại tài liệu:** LESSON (bài học), PRACTICE (đề ôn/bài tập), ASSESSMENT (kiểm tra), WORKED_EXAMPLE (bài mẫu), FORMULA_NOTE (công thức/ghi nhớ), REFERENCE (tham khảo), ANSWER_KEY (đáp án), SOLUTION (lời giải), ACTIVITY (thực hành), FLASHCARD_SET (thẻ). "Đề ôn có đáp án" và "đề ôn chưa đáp án" là cùng PRACTICE, khác `answer_state`; ANSWER_KEY/SOLUTION liên kết đúng đề và đúng số câu.
3. **Học vs kiểm tra:** `LEARN_GUIDED` được phép xem ví dụ, giải thích và gợi ý **trong hoạt động học có hướng dẫn**; `PRACTICE_SUBMISSION` và `ASSESSMENT` là các hoạt động **có nộp/chấm**: không hiện điểm, đúng/sai, transcript, lời giải, đáp án gợi ý hoặc gợi ý làm bài trước khi **NỘP TOÀN BÀI → CHẤM HOÀN TẤT → CÔNG BỐ KẾT QUẢ/GỢI Ý**. Khóa này phải thực thi ở server, không chỉ ẩn UI.
4. **Đánh giá:** Điểm phải dựa trên đáp án/rubric có nguồn và kiểm chứng. AI đề xuất chưa xác minh không chấm chính thức. Nếu ảnh mờ, audio thiếu, OCR/ASR không chắc, câu tự luận nhiều cách hiểu, hoặc không đủ dữ kiện: chuyển `NEEDS_RETAKE`/`NEEDS_PARENT_REVIEW`, không mặc định chấm 0. Điểm AI sơ bộ và điểm đã xác minh được tách rõ; chỉ kết quả đáng tin cậy mới vào Weakness Map chính thức.
5. **Nộp:** Mỗi đáp án gắn attempt_id, question_id, version; nộp toàn bài giữ snapshot bất biến; lượt sửa là attempt mới. Thể hiện trạng thái `Đã lưu trên máy`, `Chờ đồng bộ`, `Đã đồng bộ`, `Đang chấm`, `Cần Admin xác minh`, `Đã chấm`.
6. **Đồng bộ/bảo mật:** IndexedDB lưu nháp, ảnh/âm thanh đã thu được và outbox; server nhận theo event UUID idempotent, không ghi trùng. Student/Admin có xác thực phân quyền thật. Ảnh chữ viết tay, giọng nói và kết quả học phải lưu ở private storage, không public trên GitHub/Drive links.
7. **Học liệu:** Admin phân loại, duyệt, phát hành theo trạng thái; Student chỉ thấy tài liệu PUBLISHED thực sự mở được. Chương trình GDPT 2018, môn/chủ đề, sách/Unit, học kỳ phải có nguồn hoặc xác nhận Admin; không đoán nhãn cho đủ.

## II. MA TRẬN CÁCH TRẢ LỜI CHÍNH THỨC
| Môn | Tự luận / bài viết | Trắc nghiệm / câu ngắn | Quy tắc đặc biệt |
|---|---|---|---|
| TOAN — Toán | **Viết tay trên giấy → chụp ảnh theo từng câu** đối với toán đố, lời văn, nhiều bước, hình học tự luận | Chọn/điền trên web | Chấm theo bước, lập luận, phép tính, đơn vị; hình mờ cần review |
| NGUVAN — Ngữ văn | **Viết tay trên giấy → chụp ảnh theo từng câu** đối với đoạn/bài văn, tự luận đọc hiểu | Dạng chọn/nhận biết có thể trên web | Rubric nội dung, lập luận, dẫn chứng, bố cục, diễn đạt; viết lại lần 2 |
| LSDL — Lịch sử & Địa lí | **Gõ trực tiếp vào ô trả lời trên web** | Chọn/điền trên web | Lịch sử, Địa lí và tích hợp có rubric riêng; ảnh bản đồ nếu đề cần |
| KHTN — Khoa học tự nhiên | **Gõ trực tiếp trên web** | Chọn/điền trên web | Giải thích hiện tượng, dữ liệu, quan sát; thí nghiệm thực hành dùng minh chứng riêng |
| TINHOC — Tin học | **Gõ trực tiếp trên web** | Chọn/điền trên web | Kỹ năng thao tác thực tế cần bằng chứng/tệp kết quả nếu có |
| CONGNGHE — Công nghệ | **Gõ trực tiếp trên web** | Chọn/điền trên web | Quy trình/thiết bị/an toàn và sản phẩm có rubric, minh chứng riêng |
| GDCD — Giáo dục công dân | **Gõ trực tiếp trên web** | Chọn/điền trên web | Chấp nhận nhiều lập luận/ứng xử phù hợp, không đánh giá nhân cách |
| TIENGANH — Tiếng Anh | **WRITING: viết tay giấy → chụp ảnh theo câu**. **VOCABULARY: học bằng thẻ web, phần nhớ–viết từ/đặt câu viết giấy → chụp phiếu**. Câu Grammar yêu cầu tự viết cũng chụp ảnh | Listening, Reading câu khách quan thao tác web; Speaking thu âm | 4 kỹ năng riêng, transcript và lời giải sau chấm; không coi lật thẻ là thuộc từ |

- Ngoại lệ: câu viết rất ngắn trong Toán/Văn không phải dạng tự luận có thể dùng input trực tiếp nếu Admin cấu hình rõ; không ép mọi câu trắc nghiệm chụp ảnh.
- Phiếu Vocabulary có thể gom 5–8 từ đã đánh số và chụp 1–n ảnh; map từng số vào đúng prompt, không bắt chụp mỗi từ riêng.
- Với Listening/Speaking: nếu thiếu audio, micro bị từ chối hoặc nhận dạng tiếng nói thiếu chắc chắn, không tự ghi điểm 0.
- Reading yêu cầu câu trả lời dài theo hình thức **Writing** thì dùng ảnh bài viết tay; Reading khách quan vẫn dùng web.

## III. PHƯƠNG PHÁP HỌC THEO MÔN
### 1. TOAN
6 bước: Chẩn đoán kiến thức nền → Hiểu trực quan/bản chất → Xem ví dụ giải thích từng bước → Tự giải tăng dần → Xác định/sửa lỗi có căn cứ → Ôn ngắt quãng và vận dụng. Toán lời văn/hình học dùng ảnh theo câu; chấm **sau khi nộp toàn bài**, đánh giá bước giải thay vì chỉ đáp số. Weakness Map theo hiểu đề, phép tính, lập luận, hình học, đơn vị và khả năng làm lại độc lập. Gợi ý 5 mức chỉ thuộc chế độ học có hướng dẫn, KHÔNG trong bài có chấm.

### 2. NGUVAN
Đọc hiểu có dẫn chứng → Lập dàn ý → Viết tay → Chụp ảnh → AI chấm rubric sơ bộ → Admin xác minh nếu cần → Hiện nhận xét/đáp án/dàn ý gợi ý sau chấm → Con tự sửa/viết lại lần 2 → So sánh tiến bộ. Bản gốc giữ nguyên, không đánh đồng lỗi OCR với lỗi chính tả. Theo dõi đọc hiểu, dẫn chứng, bố cục, lập luận, diễn đạt, chính tả. Bài văn mẫu chỉ là tham khảo, không ép học sinh chép.

### 3. TIENGANH
- **Listening:** nghe audio nguồn rõ ràng, tìm ý chính/chi tiết; luyện có replay tùy mục tiêu; kiểm tra giữ transcript và key kín trước nộp.
- **Speaking:** nghe mẫu, nói/ghi âm, trả lời, hội thoại và mô tả; đánh giá giao tiếp và phát âm dễ hiểu, không ép accent bản xứ; AI feedback khi đủ tin cậy.
- **Reading:** đọc ngữ cảnh, gist, detail, evidence, từ trong ngữ cảnh; web cho dạng khách quan.
- **Writing:** **viết tay + chụp ảnh theo câu**, chấm ý nghĩa, từ vựng, ngữ pháp, diễn đạt, spelling, rồi trả lời mẫu sau chấm; viết lại lượt mới.
- **Vocabulary Cards:** thẻ lật/ảnh/nghe/nghĩa trên web; nhớ nghĩa, spelling và đặt câu bằng **phiếu viết tay chụp ảnh**; ôn ngắt quãng theo chứng cứ, không kết luận "đã thuộc" vì lật thẻ.
- **Grammar Builder:** học trong ngữ cảnh, quan sát → đối chiếu → tự tạo câu; câu đòi viết thì dùng ảnh.
- **Pronunciation Lab, Listen & Write, English Missions, Error Coach:** mô-đun nằm trong lộ trình cùng 4 kỹ năng, triển khai theo ưu tiên và năng lực hệ thống, không thành nhiều ứng dụng tách rời. Listen & Write yêu cầu chữ viết dùng ảnh phiếu, không gõ web.
- Admin xem theo kỹ năng; không tuyên bố đạt chứng chỉ CEFR từ bài kiểm tra nội bộ chưa chuẩn hóa.

### 4. LSDL
Tách HISTORY/GEOGRAPHY/INTEGRATED. Lịch sử: bối cảnh → thời gian/sự kiện → nguyên nhân/kết quả → ý nghĩa. Địa lí: khái niệm → bản đồ/biểu đồ/số liệu → phân tích → vận dụng. Tự luận **gõ trên web**; rubric riêng cho dữ kiện, chứng cứ và lập luận.

### 5. KHTN
Câu hỏi khoa học → khái niệm → quan sát/thí nghiệm an toàn → phân tích dữ liệu → kết luận/ứng dụng. Tự luận **gõ trên web**; không coi giả thuyết chưa kiểm chứng là kết luận; minh chứng thực hành riêng.

### 6. TINHOC
Khái niệm → thao tác minh họa → thực hành → an toàn số → tự kiểm tra. Tự luận **gõ trên web**; kỹ năng thực hành không kết luận từ một câu trắc nghiệm hay mô tả suông.

### 7. CONGNGHE
Chức năng/mục đích → thiết bị/vật liệu → nguyên lý/quy trình → an toàn → ứng dụng/thực hành. Tự luận **gõ trên web**; sản phẩm thực hành có minh chứng/rubric riêng.

### 8. GDCD
Tình huống → chuẩn mực/kiến thức → lựa chọn cách ứng xử → lý giải → liên hệ. Tự luận **gõ trên web**; rubric xem xét tính hợp lý và dẫn chứng, tránh áp một câu mẫu duy nhất hoặc gán nhãn phẩm chất học sinh.

## IV. ROADMAP HỢP NHẤT
**Kiến trúc P0 chung (bắt buộc trước):** Auth 1 Student/1 Admin; local-first sync; source ingestion + verified publication; Exam Engine submit-all + server answer gating; private handwritten photo engine dùng chung Toán/Văn/English; text answer engine cho 5 môn; image/audio quality control; versioned rubric, verified/grading review, audit; kiểm thử thiết bị thật.
**Học tập P0/P1:** môn Toán/Ngữ văn theo các ADR đã chốt; Tiếng Anh 4 kỹ năng + Vocabulary Cards. Grammar Builder, basic Dictation và Error Coach xây trên lõi này; ôn ngắt quãng và Weakness Maps theo dữ liệu đáng tin cậy.
**P2:** Interactive Speaking Partner, tương tác phát âm nâng cao, hình Toán tương tác; chỉ sau khi nền ổn định và cơ chế bảo mật/đánh giá đã được kiểm thử.

## V. NGHIỆM THU TỐI THIỂU
1. Student chụp câu tự luận Toán/Văn/Writing English đúng câu và đúng thứ tự trang; không lẫn giữa các môn; bài không mất khi offline/refresh.
2. Vocabulary flashcard học trên web, phiếu viết tay chụp theo số câu/word; hệ thống phân biệt biết nghĩa, viết đúng và dùng trong câu.
3. Năm môn LSDL/KHTN/TINHOC/CONGNGHE/GDCD gõ trực tiếp từng câu; autosave, reload không mất đáp án, đồng bộ không ghi trùng.
4. Đề mixed questions chỉ chấm khi **Nộp toàn bài**, không hiện đáp án/điểm/gợi ý sớm hoặc rò dữ liệu qua API/client.
5. Chấm tự luận theo rubric và chứng cứ; ảnh mờ/OCR/ASR không rõ không tự cho 0; AI provisional phân biệt điểm xác minh.
6. Admin xem bài, ảnh, âm thanh, trạng thái sync và điểm từ thiết bị khác; có quyền xác minh/sửa điểm với audit.
7. Học liệu lấy từ nguồn bất kỳ được duyệt trước khi publish; bản Student mở được; file gốc giữ nguyên.
8. Tất cả dữ liệu riêng tư của trẻ được lưu/đọc theo phân quyền server, không public key/grade/ảnh trong repo.
9. Đảm bảo rollback/backups trước khi sửa production; không khẳng định triển khai xong chỉ bằng đọc code.

## VI. LIÊN KẾT QUYẾT ĐỊNH VÀ THỨ TỰ ƯU TIÊN
1. TÀI LIỆU NÀY: phương thức trả lời chính thức và chính sách nộp/chấm toàn hệ thống.
2. [ADR Toán](ADR_TOAN_001_APPROVED_MATH_LEARNING_AND_HANDWRITTEN_SUBMISSION.md)
3. [ADR Ngữ văn](ADR_NGUVAN_001_APPROVED_LEARNING_LOOP.md)
4. [ADR 5 môn tự luận web](ADR_FIVE_SUBJECTS_001_TYPED_ESSAY_ON_WEB.md)
5. [ADR Tiếng Anh Writing & Vocabulary viết tay](ADR_ENGLISH_001_HANDWRITTEN_WRITING_VOCABULARY.md)
6. [Bộ chuẩn 8 môn](AURA_CONTENT_STANDARD_8_SUBJECTS_V1.md)
7. [English 4 Skills Proposal](AURA_ENGLISH_FOUR_SKILLS_V1_PROPOSAL.md): giữ đề xuất bổ trợ, **bãi bỏ phần Writing typed on web**.
8. [Vocabulary Cards Proposal](AURA_VOCABULARY_CARDS_V1_PROPOSAL.md): giữ flashcards web, **bãi bỏ trả lời bằng cách gõ** đối với bài luyện viết.
9. [English Additional Modules](AURA_ENGLISH_ADDITIONAL_MODULES_V1_PROPOSAL.md): các bài yêu cầu viết phải nộp ảnh, các chức năng nâng cao theo roadmap.
10. [Source Ingestion](AURA_SOURCE_INGESTION_V1.md) / [Single Learner Sync](AURA_SINGLE_LEARNER_SYNC_V1.md).

**Điều khoản chốt:** Đây là *chuẩn sản phẩm đã phê duyệt*, không phải cam kết các chức năng đã có trên GitHub Pages. Chỉ chuyển trạng thái `IMPLEMENTED / DEPLOYED / VERIFIED` sau khi hoàn thành thiết kế backend, migration, kiểm thử E2E và được Admin nghiệm thu.
