# AURA STUDY — Báo cáo tiến độ Toán 6 KNTT và thiết kế Chương VII

**Thời điểm kiểm kê:** 13/11/2026. **Ưu tiên chủ sở hữu:** hoàn thiện riêng môn Toán trước, bảo toàn thiết kế của Ngữ văn, Tiếng Anh và các môn khác.

## 1. Tiến độ thực theo bài có nội dung (không tính tiêu đề rỗng)

| Phạm vi | Bài học có nội dung | Câu luyện trong bài | Ôn chương độc lập | Hoạt động tương tác | Quyền phát hành |
|---|---:|---:|---:|---:|---|
| Tập 1 — Chương I–V (Bài 1–22) | 22/22 | 66 | 30 (5 chương) | 5 | 0/96 được phê duyệt |
| Tập 2 — Chương VI, Phân số (Bài 23–27) | 5/5 | 15 | **Chưa có bộ ôn cuối chương VI** | **Chưa có hoạt động riêng mới** | Không thuộc gói ký Tập 1 |
| Tập 2 — Chương VII, Số thập phân (Bài 28–31) | 4/4 | 12 | 6 | 2 (tia số làm tròn, lưới phần trăm) | Bản nháp; chưa phê duyệt |
| Tập 2 — Chương VIII, Hình học (Bài 32–37) | 0/6 | 0 | 0 | 0 | Chưa biên soạn |
| Tập 2 — Chương IX, Dữ liệu & xác suất (Bài 38–43) | 0/6 | 0 | 0 | 0 | Chưa biên soạn |
| **Tổng Toán 6** | **31/43 bài (72,1%)** | **93 câu trong bài** | **36 câu ôn** | **7 hoạt động** | **Không có câu mới được xác nhận phát hành chính thức** |

**Phương pháp tính:** 43 bài theo mục lục Tập 1–2; 22 bài Tập 1 + 9 bài Tập 2 đã có lý thuyết, ví dụ và bài luyện. Không tính các tiết Luyện tập chung, thực hành/trải nghiệm và ôn cuối năm như bài học độc lập; muốn nói "Toán 6 hoàn thiện" phải xây dựng các phần đó và kiểm định.

## 2. Sản phẩm Chương VII mới

\`aura_data/knowledge_math6_kntt_volume2_v1.json\` mở rộng từ 5 lên 9 bài và từ 15 lên 27 câu, **không thay đổi Bài 23–27**. Bộ 4 bài:

- Bài 28: số thập phân âm, số đối, so sánh, chuyển phân số mẫu 100.
- Bài 29: cộng, trừ, nhân, chia thập phân có dấu; phép tính ngược.
- Bài 30: quy tắc làm tròn hàng phần mười, phần trăm; ước lượng để kiểm tra độ lớn.
- Bài 31: tỉ số, phần trăm của số, giảm giá phần trăm và bài toán có đơn vị.

Mỗi bài có mục tiêu, ba ý giảng, ví dụ giải theo 3 bước, lỗi thường gặp và **3 câu mới có lời giải & nhãn kỹ năng** (12 câu). Tệp \`aura_data/knowledge_math6_kntt_volume2_chapter7_review_v1.json\` chứa **6 câu ôn Chương VII** gắn \`sourceLessons\`, \`skill\` và cờ chặn phát hành.

Trang \`knowledge-math6-volume2.html\` mở đủ Bài 23–31; chỉ Chương VIII–IX bị vô hiệu hóa. Trang \`knowledge-math6-decimals-review.html\` có hai hoạt động AURA biên soạn từ số liệu tự tạo:
1. Kéo điểm số thập phân dương từ 0 đến 10 (bước 0,1) và xem làm tròn đến hàng đơn vị. Trường hợp ở giữa chính xác 0,5 được xử lý theo quy tắc bài học.
2. Chọn 0–100% với bước 5% trên **20 ô bằng nhau**, so sánh tỉ lệ ô tô và p% của 200.

Sau 6 câu ôn, hệ thống chỉ ra đúng kỹ năng/bài học có câu sai và dẫn về Bài 28–31. Điểm ôn chỉ lưu tại khóa trình duyệt \`aura_kntt_math6_volume2_ch7_review_v1\`. Nếu nội dung ôn bị thay đổi, SHA-256 câu hỏi sẽ không còn khớp kết quả lưu cũ, nên điểm cũ không được hiển thị lại như đã làm trên phiên bản mới.

## 3. Bảo toàn hệ thống

- Tập 1: \`aura_data/knowledge_math6_kntt_volume1_v2.json\`, 96 câu trong hồ sơ duyệt, theo khóa riêng \`aura_kntt_math6_v2_progress_v1\`, không bị sửa.
- Tập 2: nội dung 27 câu chỉ là luyện bản nháp; 6 câu ôn Chương VII không nhập vào Bank. \`teacherReviewed=false\`, \`questionBankPromotionEnabled=false\`, \`examEngineLinkEnabled=false\`, \`weaknessMapWriteEnabled=false\`.
- Cổng chữ ký P-256/đối chiếu SHA do PR #29 vẫn chỉ nhận **96 ứng viên Tập 1** và hiện \`NO_APPROVED_RELEASE\`. 33 câu mới của Tập 2 **chưa** vào cổng phê duyệt đó; không tự cộng vào "đã duyệt".
- Không thay đổi Supabase production, tài khoản học sinh, bài thi chính thức, Drive, Ngữ văn/Tiếng Anh hoặc các môn khác.
- Chỉ dùng mục lục công khai để xác định phạm vi; khái niệm, ví dụ, bài luyện và hoạt động tương tác AURA biên soạn mới. Dù đã rà đáp án bằng bộ kiểm tra riêng, **chưa có giáo viên độc lập chứng nhận phù hợp chương trình và lời giải**.

## 4. Chất lượng và nghiệm thu

- \`tests/knowledge-math6-volume2-fractions.test.mjs\` giữ bảng đáp án 15 câu phân số và kiểm tra dữ liệu 9 bài / 27 câu.
- \`tests/knowledge-math6-chapter7-decimals.test.mjs\` đối chiếu độc lập 12 đáp án Bài 28–31 và 6 đáp án ôn chương; kiểm tra nguồn, cấu trúc, cờ an toàn và phép toán mẫu.
- \`tests/knowledge-math6-volume2-browser.mjs\`, \`tests/knowledge-math6-chapter7-browser.mjs\`: iPad 820×1180, điện thoại 390×844, desktop 1366×900; kéo làm tròn 3,4 → 3 và 3,5 → 4, 75% của 200 → 150; làm 5/6, dẫn về bài sai, lưu sau reload, không ghi khóa điểm chính thức, không tràn ngang.
- Chạy hồi quy Tập 1, 5 bộ ôn cũ, cổng duyệt học liệu, tạo đề hiện có. Chỉ merge khi các workflow liên quan PASS. Đây là Chromium giả lập, **chưa thay cho Safari iPad thực tế**.

## 5. Các mốc tiếp theo để hoàn thiện môn Toán

1. **Chương VIII, Bài 32–37**: điểm, tia, đoạn thẳng, trung điểm, góc, số đo góc; SVG tự vẽ và đánh giá hình đủ dữ kiện.
2. **Chương IX, Bài 38–43**: bảng thống kê, biểu đồ tranh/cột/cột kép, biến cố và xác suất thực nghiệm; kiểm định dữ liệu mẫu và mô phỏng.
3. **Bộ ôn Chương VI, VIII, IX, ôn cuối năm** và các bài Luyện tập chung/thực hành trong cả hai tập. Bổ sung bài toán tự luận, rubric chấm theo bước thay vì chỉ MCQ; không tính chúng là hoàn tất khi chưa có nội dung.
4. Kiểm định sư phạm thật với tài liệu nguồn chính xác, bằng chứng nguồn SHA, người duyệt độc lập. Phát hành an toàn có version, chuẩn hóa kỹ năng Math, chỉ dữ liệu được ký mới chuyển vào Practice Generator; Weakness Map nhận **kết quả đã chấm** có liên kết nguồn, không nhận điểm học thử từ localStorage.
5. Chạy thử trên iPad Safari thực, kiểm thử sai hỏng nguồn, rollback và khôi phục dữ liệu. Chỉ đánh dấu GO cho từng bộ phận khi điều kiện đạt.

**Nguồn đối chiếu mục lục:** thư viện số NXBGD, SGV Toán 6 KNTT và danh mục SGK do chủ sở hữu cung cấp. Nội dung Tập 2 không được nhận là bản sao hoặc tái bản SGK. 
