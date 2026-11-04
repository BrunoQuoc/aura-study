# AURA STUDY — Bộ quy chuẩn học liệu 8 môn, phiên bản 1.0
**Status:** DESIGN SPECIFICATION — NOT DEPLOYED. **Scope:** one learner (Grade 6), one Parent Admin, multi-device local-first sync. **Curriculum alignment:** chương trình GDPT 2018, dùng mã yêu cầu cần đạt/chủ đề do nguồn hoặc Admin xác minh, không suy đoán tên bài hay thứ tự SGK. **Owner of final decisions:** Admin.

## A. NGUYÊN TẮC TRUNG TÂM
1. File gốc bất biến và có mã/hash; AI đọc/đề xuất, Admin phê duyệt; bản xuất bản khác file gốc. Bắt buộc giữ trang/hình/công thức/nguồn, không bóp méo thông tin cho đẹp.
2. Tách **loại tài liệu**, **tình trạng đáp án**, **mức kiểm chứng**, **mục tiêu học**, **trạng thái xuất bản**. Không dùng một nhãn để thay thế năm ý nghĩa khác nhau.
3. Không bắt Admin tạo file mẫu trước upload. File mẫu chuẩn hóa là phương án tùy chọn cho nhập liệu số lượng lớn. Student nhận bản render chuẩn qua một schema thống nhất.
4. Một tài liệu có thể sinh nhiều học liệu: đề + đáp án; bài học + thẻ nhớ; bài đa môn tách thành asset nhỏ nhưng vẫn cùng source ID.
5. Câu chưa có đáp án tin cậy hoặc thiếu dữ kiện (ảnh, audio, công thức, lược đồ) không được chấm tự động hoặc đưa vào Weakness Map.
6. Chương trình khung chuẩn; bộ sách giáo khoa, năm học, phạm vi kiểm tra, bài/chủ đề là metadata riêng. Không giả rằng mọi SGK cùng thứ tự.
7. Drive giữ nguồn; registry Cloud là trạng thái học liệu đã công bố; Student chỉ thấy nội dung PUBLISHED có quyền đọc và preview hoạt động.

## B. BỘ LOẠI TÀI LIỆU (PRIMARY DOC TYPE)
Mỗi asset có **1 loại chính** và nhiều thẻ/quan hệ bổ sung.
| Code | Giao diện | Mục đích | Đầu ra chuẩn |
|---|---|---|---|
| LESSON | Bài học / Kiến thức | Dạy khái niệm, kỹ năng | Mục tiêu → Nội dung → Ví dụ → Luyện ngắn → Ghi nhớ |
| PRACTICE | Đề ôn / Bài tập | Tự luyện theo chủ đề | Câu hỏi độc lập, gắn kỹ năng, tùy chế độ chấm |
| ASSESSMENT | Đề kiểm tra / Đề thi | Đánh giá năng lực theo thời gian/khung | Snapshot đề cố định, ma trận chủ đề, phiếu nộp |
| WORKED_EXAMPLE | Bài mẫu / Bài giải mẫu | Học phương pháp qua một ví dụ | Đề/vấn đề → Cách làm mẫu → Giải thích từng bước |
| FORMULA_NOTE | Công thức / Ghi nhớ | Tra cứu nhanh, nhớ quy tắc | Phát biểu → Điều kiện → Ký hiệu → Ví dụ → Lỗi thường gặp |
| REFERENCE | Tài liệu tham khảo | Bổ trợ, đọc thêm | Tệp/đoạn nguồn + mô tả + liên kết chủ đề |
| ANSWER_KEY | Đáp án | Bảng kết quả theo câu | Map question_id → đáp án + provenance |
| SOLUTION | Hướng dẫn giải / Lời giải | Cách suy luận | Map question_id → bước giải/giải thích + provenance |
| ACTIVITY | Bài thực hành / Dự án | Thực hành, quan sát, thí nghiệm, sản phẩm | Nhiệm vụ → Quy trình an toàn → Minh chứng → Rubric |
| FLASHCARD_SET | Bộ thẻ ôn | Ôn nhớ | Mặt trước/mặt sau + nguồn + kiểm chứng |

**Quy tắc ví dụ:** “Đề ôn chưa đáp án” = PRACTICE + answer_state ABSENT; “Đề ôn có đáp án” = PRACTICE + SOURCE_KEY_PRESENT/VERIFIED, có thể liên kết ANSWER_KEY; “bài mẫu” = WORKED_EXAMPLE; “công thức” = FORMULA_NOTE. Không tạo hai mục PRACTICE riêng chỉ vì có/không có đáp án. Đề kiểm tra là ASSESSMENT do mục đích, không do có key. Tài liệu không có đủ chứng cứ phân loại giữ NEEDS_REVIEW.

## C. CÁC TRỤC METADATA ĐỘC LẬP
- **subject**: TOAN, NGUVAN, TIENGANH, LSDL, CONGNGHE, TINHOC, GDCD, KHTN. **strand** tùy môn (ví dụ LS/DL hoặc KHTN mạch nội dung).
- **grade**: 6. **curriculum**: GDPT_2018 (ghi phiên bản/văn bản nếu điều chỉnh). **textbook_series** optional; không mặc định đoán.
- **location**: subject → strand → topic → lesson/skill; một file có nhiều topic, mỗi derived asset có liên kết nguồn.
- **source_ref**: Drive file ID, SHA-256, MIME, version, page/slide/sheet/cell/figure, quality score, provenance.
- **doc_type**: từ bảng B; **learning_use** = LEARN / REVISE / PRACTICE / FORMATIVE_TEST / SUMMATIVE_TEST / READ_ONLY / REFERENCE.
- **period**: NONE/UNASSIGNED, GK1, CK1, GK2, CK2; chỉ khẳng định khi nguồn hoặc Admin cho phép; phân biệt source_declared và curriculum_scope.
- **answer_state**: NOT_APPLICABLE, ABSENT, SOURCE_KEY_PRESENT_UNCHECKED, PARTIAL, AI_PROPOSED_UNVERIFIED, SOURCE_VERIFIED, ADMIN_VERIFIED, CONFLICT.
- **graded_mode (per question)**: AUTO_VERIFIED / MANUAL_REVIEW / UNGRADABLE. Câu AI đề xuất chưa xác minh = UNGRADABLE.
- **suggested_metadata vs confirmed_metadata**: lưu tách, có confidence và lý do/nguồn; không ghi đè quyết định Admin.
- **publication_state**: UPLOADED → EXTRACTED → QUALITY_CHECKED → CLASSIFIED_DRAFT → NEEDS_REVIEW → APPROVED_PENDING_PUBLISH → PUBLISHED; nhánh REJECTED, PUBLISH_FAILED.
- **visibility**: Student chỉ nhận PUBLISHED; key/solution chỉ mở sau nộp bài nếu cài đặt yêu cầu; admin có quyền xem toàn bộ.
- **difficulty**: BASIC / UNDERSTAND / APPLY / ADVANCED là đề xuất, không dùng làm điểm năng lực nếu không có kết quả thật.
- **content_version**, **reviewer**, **reviewed_at**, **published_at**, **audit_log**, **duplicate_of**, **related_assets[]**.

## D. CẤU TRÚC CHUNG BÀI HỌC / ÔN / KIỂM TRA
- LESSON bắt buộc: tên môn/chủ đề, yêu cầu cần đạt (có nguồn hoặc do Admin xác nhận), kiến thức cốt lõi, ví dụ minh họa, phần kiểm tra hiểu bài, thẻ ghi nhớ, tài liệu nguồn. Từng bài có thể rút gọn phần không phù hợp.
- PRACTICE bắt buộc: mục tiêu/skill, nhóm câu, loại trả lời, tham chiếu nguồn, khả năng chấm từng câu, đáp án chỉ hiển thị theo chế độ. Nguồn thiếu key vẫn cho làm tự luyện không chấm.
- ASSESSMENT bắt buộc: chủ đề/ma trận/độ phủ, thời lượng (nếu có), thang điểm, version đề, khóa đáp án có nguồn tin cậy, đánh dấu câu cần chấm tay. Một bài chưa chấm đủ thì trạng thái CHƯA HOÀN TẤT, không ép thành 0/10.
- WORKED_EXAMPLE giữ nguyên đề và lập luận, hiển thị bước làm + lưu ý; không tự biến thành điểm số.
- FORMULA_NOTE phải có phạm vi áp dụng, ký hiệu, đơn vị/điều kiện, ví dụ, ngoại lệ; ngôn ngữ/định nghĩa không gắn nhãn “công thức Toán” một cách máy móc.
- ACTIVITY yêu cầu an toàn, dụng cụ/đầu vào, quá trình, sản phẩm/bằng chứng, rubric; không chấm bằng phỏng đoán từ câu text.
- REFERENCE cho phép PDF/ảnh gốc, không giả là lesson tương tác.

## E. QUY CHUẨN RIÊNG CHO 8 MÔN
### E1. TOÁN (TOAN)
- **Strands:** Số và Đại số; Hình học và Đo lường; Thống kê và Xác suất (chỉ nội dung phù hợp lớp 6/nguồn đã duyệt).
- **Asset ưu tiên:** LESSON, PRACTICE, ASSESSMENT, WORKED_EXAMPLE, FORMULA_NOTE, SOLUTION.
- **Bài học:** định nghĩa/quy tắc → điều kiện → ví dụ đúng → ví dụ sai thường gặp → 3 mức luyện. Giữ LaTeX, đơn vị và sơ đồ gốc.
- **Câu hỏi:** lựa chọn, điền kết quả, tự luận nhiều bước, hình học, đọc bảng/biểu đồ; tag kiến thức + kỹ năng tính toán/lập luận/mô hình hóa.
- **Chấm:** số và phép biến đổi khi có quy tắc kiểm chứng; kiểm tra đơn vị/khoảng sai số/biểu thức tương đương. Hình thiếu dữ kiện, dựng hình, tự luận lời giải → MANUAL_REVIEW. Không suy luận từ hình vẽ không ghi tỷ lệ.
- **Weakness:** chia hết, phân số/số nguyên, hình học, xử lý dữ liệu... chỉ từ câu đã chấm chắc chắn.

### E2. NGỮ VĂN (NGUVAN)
- **Strands:** Đọc hiểu; Viết; Nói và Nghe; Tiếng Việt (ngữ liệu và kỹ năng gắn yêu cầu cần đạt).
- **Asset:** văn bản đọc, phân tích mẫu WORKED_EXAMPLE, bài thực hành tiếng Việt, dàn ý, rubric viết, câu hỏi mở.
- **Bài học:** ngữ liệu có xuất xứ → mục tiêu đọc/viết → từ ngữ/nghệ thuật → gợi ý phân tích → câu hỏi vận dụng. Tách rõ *nhận xét mẫu* với *kết luận bắt buộc*.
- **Chấm:** câu nhận biết có đáp án nguồn có thể auto; diễn giải, cảm nhận, đoạn văn, bài văn chấm theo rubric (nội dung/lập luận/dẫn chứng/diễn đạt) cần Admin xác nhận nếu độ tin cậy thấp.
- **Cấm:** khẳng định chỉ một ý cảm nhận đúng; dùng bài văn mẫu làm chuẩn bắt chước/nhận là bài gốc của học sinh.

### E3. TIẾNG ANH (TIENGANH)
- **Strands:** Listening, Speaking, Reading, Writing; Vocabulary, Grammar, Pronunciation, Functional Language.
- **Asset:** bài học từ vựng/cấu trúc, reading passage, audio/video có quyền sử dụng, drill, mẫu hội thoại, đề kỹ năng.
- **Bài học:** tình huống → từ/cụm từ/ngữ pháp → ví dụ âm/đọc → thực hành 4 kỹ năng → tổng kết. Unit/book mapping phải có nguồn, không gắn nhầm kỳ chỉ từ số Unit.
- **Chấm:** trắc nghiệm/điền từ với đáp án xác minh có thể auto; chấp nhận biến thể chính tả/viết hoa khi hợp lệ theo rule; rewrite/translation/writing/speaking cần rubric và kiểm chứng ngữ nghĩa. Listening không có audio hoặc transcript nguồn phù hợp = UNGRADABLE.
- **Weakness:** từ vựng, thì/cấu trúc, đọc hiểu, nghe, viết theo lỗi quan sát được; không tự “đoán” vì sao con sai.

### E4. LỊCH SỬ & ĐỊA LÍ (LSDL)
- **Strands bắt buộc:** HISTORY / GEOGRAPHY / INTEGRATED; subskill: mốc thời gian và sự kiện, nguyên nhân-kết quả, bản đồ/lược đồ, biểu đồ, số liệu, không gian/vị trí, so sánh.
- **Bài học lịch sử:** mốc thời gian → bối cảnh → diễn biến → kết quả/ý nghĩa → tư liệu có nguồn.
- **Bài học địa lí:** hiện tượng/khái niệm → bản đồ/biểu đồ có chú giải → phân tích dữ liệu → vận dụng.
- **Chấm:** thời gian/tên/vị trí có nguồn có thể auto; nguyên nhân, so sánh, phân tích bản đồ/biểu đồ cần đủ hình và rubric. Không tự bịa mốc hay đọc nhầm ký hiệu.
- **Metadata bắt buộc:** `strand` và `source_map_or_image` khi liên quan; không đẩy đề Địa lí sang Lịch sử vì đều cùng môn.

### E5. CÔNG NGHỆ (CONGNGHE)
- **Strands:** công nghệ và đời sống; thiết bị, vật liệu/dụng cụ; thiết kế/quy trình; an toàn và thực hành (theo chủ đề nguồn lớp 6).
- **Bài học:** mục đích → thiết bị/nguyên lý/đặc điểm → quy trình → điều kiện an toàn → ứng dụng.
- **Activity:** thao tác từng bước, lưu ý an toàn, tiêu chí sản phẩm/quan sát, minh chứng ảnh hoặc phiếu thực hành.
- **Chấm:** nhận biết chức năng/quy trình khi có nguồn có thể auto; kỹ năng thực hành và chất lượng sản phẩm cần rubric/manual. Không mặc định trẻ đã thực hành chỉ vì chọn đáp án đúng.

### E6. TIN HỌC (TINHOC)
- **Strands:** thông tin và dữ liệu; thiết bị và hệ thống; mạng/Internet và an toàn số; ứng dụng số; tư duy thuật toán/giải quyết vấn đề (theo nguồn lớp 6).
- **Bài học:** khái niệm → thao tác minh họa chuẩn → thực hành → bảo vệ thông tin cá nhân/bản quyền → tự kiểm tra.
- **Asset:** hướng dẫn thao tác, ảnh màn hình có phiên bản, file bài thực hành, câu hỏi logic/thao tác.
- **Chấm:** lý thuyết/logic có đáp án có thể auto; kỹ năng thực hành cần xem kết quả thao tác/file sản phẩm; không thu mật khẩu thật, không gắn nhãn lỗi khi ảnh UI phiên bản khác.

### E7. GIÁO DỤC CÔNG DÂN (GDCD)
- **Strands:** phẩm chất/giá trị; hành vi và trách nhiệm; quan hệ gia đình-xã hội; quyền-nghĩa vụ và tình huống phù hợp lớp 6.
- **Bài học:** tình huống → kiến thức/chuẩn mực → chọn cách xử lý → lý giải hậu quả → tự liên hệ.
- **Chấm:** nhận biết quy tắc được nêu trong nguồn có thể auto; phán đoán/ứng xử mở phải có rubric lý do, tính phù hợp và tôn trọng, tránh duy nhất một câu chữ máy móc.
- **Bảo vệ trẻ:** không dùng trả lời tình huống đạo đức để gắn nhãn phẩm chất hay suy đoán tính cách; Weakness chỉ là kỹ năng/chủ đề trong bài.

### E8. KHOA HỌC TỰ NHIÊN (KHTN)
- **Strands:** Chất và sự biến đổi của chất; Vật sống; Năng lượng và sự biến đổi; Trái Đất và bầu trời; kỹ năng điều tra khoa học. Không áp cứng tách Hóa/Lý/Sinh vào dữ liệu lớp 6 nếu nguồn tổ chức theo mạch.
- **Bài học:** câu hỏi khoa học → khái niệm/định luật phù hợp → quan sát/số liệu/thí nghiệm → kết luận → ứng dụng và an toàn.
- **Activity:** câu hỏi nghiên cứu, biến số, dụng cụ, quy trình an toàn, kết quả quan sát, diễn giải, giới hạn.
- **Chấm:** đơn vị/đo lường, kiến thức xác minh có thể auto; giải thích hiện tượng, mô hình/ảnh, thiết kế thí nghiệm cần rubric. Không biến giả thuyết thành kết luận được xác nhận.
- **Safety:** không tạo hướng dẫn thí nghiệm hóa chất, điện, nhiệt hoặc thiết bị nguy hiểm mà học sinh có thể làm không giám sát.

## F. CÂY THƯ VIỆN — HIỂN THỊ, KHÔNG ÉP LƯU DRIVE THEO CÂY
**Student:** Môn → Chủ đề/Bài → tab `Bài học`, `Bài tập & Đề ôn`, `Đề kiểm tra`, `Ví dụ & Bài mẫu`, `Công thức/Ghi nhớ`, `Tài liệu tham khảo`. Chỉ hiển thị tab có nội dung; ANSWER_KEY/SOLUTION gắn vào đề tương ứng và kiểm soát thời điểm hiển thị.
**Admin:** INBOX → Cần xác minh → Đã duyệt/Đã công bố → Lỗi công bố → Từ chối. Không bắt chọn thư mục riêng cho từng tài liệu. Đường dẫn Drive là thuộc tính kỹ thuật; không phải nguồn duy nhất quyết định Student thấy gì.

## G. TRIỂN KHAI TỪ NGUỒN TỚI STUDENT
1. Upload bản gốc, lưu hash/Drive ID trước mọi bước.
2. Trích xuất + đối chiếu hình, bảng, công thức, audio, ngôn ngữ, chất lượng.
3. Phân loại đề xuất; phát hiện file trùng, đa loại và liên kết key/solution với đề.
4. Sinh structured content draft đúng schema từng môn; nếu thiếu key, đề xuất lời giải AI với nhãn UNVERIFIED.
5. Chỉ đưa case không rõ, OCR thấp, thiếu key, xung đột hoặc tự luận mở cho Admin kiểm tra sâu. Admin chốt môn/loại/kỳ/kỹ năng, key và chất lượng.
6. Xuất bản transactional: verify Student preview/content + registry; PUBLISHED sau xác nhận đọc được. Không xuất bản nếu thiếu file hoặc mất quyền.
7. Student nhận khi sync, hiển thị đúng tab; Quiz Engine chỉ chấm phần verified; Admin dashboard dùng kết quả thật.

## H. MẪU TÊN / NGUYÊN TẮC CHỐNG TRÙNG
- Display title dễ đọc: `Toán 6 · Phép chia hết · Đề ôn 12 câu · Chưa có đáp án`. Answer status là badge, **không phải một thư mục khác**.
- Storage key theo stable asset ID, source ID, semantic version; không sử dụng tên tệp làm khóa duy nhất.
- Ghép đề–đáp án theo explicit ID/câu/mã đề và bằng chứng; nếu không chắc báo CONFLICT, không tự ghép.
- Một file Word chứa đề + đáp án có thể sinh PRACTICE/ASSESSMENT + ANSWER_KEY + SOLUTION cùng source ID, không tạo hai file đề trùng.
- Không tự xác định sách giáo khoa, học kỳ hoặc bài học chỉ từ thứ tự file/tên thiếu chứng cứ.

## I. TEST BẮT BUỘC
1. PRACTICE thiếu đáp án giữ ABSENT, tự đề xuất không được auto-grade.
2. PRACTICE với key riêng ghép đúng mã đề/số câu, key ẩn trước khi con nộp.
3. Một DOCX có bài học + công thức + ví dụ tách đúng asset, giữ nguồn trang.
4. Toán hình có ảnh mờ không được tự khẳng định đáp số.
5. Văn tự luận có nhiều đáp án hợp lệ được đưa manual rubric.
6. Anh văn nghe thiếu audio không bật chấm listening.
7. LSDL map không có chú giải vẫn giữ NEEDS_REVIEW.
8. Công nghệ/Tin học sản phẩm thực hành không mặc định tự chấm hoàn thành.
9. KHTN mô tả thí nghiệm nguy hiểm không mở hướng dẫn thực hành không giám sát.
10. Admin duyệt/Student mở từ thiết bị khác không yêu cầu đăng nhập Google Drive của con.
11. Re-upload cùng SHA không phát sinh hai tài liệu PUBLISHED.
12. Tài liệu bị từ chối không tự quay về INBOX; lỗi publish không giả thành công.

## J. THAM CHIẾU CHƯƠNG TRÌNH
- Chương trình GDPT (Thông tư 32/2018/TT-BGDĐT, các chương trình môn tương ứng): https://moet.gov.vn/content/vanban/Lists/VBPQ/Attachments/1483/vbhn-chuong-trinh-tong-the.pdf
- Bản danh mục chương trình thành phần: https://dev.thuvienphapluat.vn/chinh-sach-phap-luat-moi/vn/bieu-mau/65346/tai-ve-chuong-trinh-giao-duc-pho-thong-2018
- Mọi quy chiếu cụ thể theo SGK, học kỳ, chủ đề, yêu cầu cần đạt phải có bản nguồn hoặc xác nhận Admin trước khi đưa vào registry.
