# AURA STUDY — Kiểm định nguồn SGK chính thức & Toán học độc lập — 16/11/2026

**Hệ thống:** Toán 6 Kết nối tri thức với cuộc sống, Tập 1 và Tập 2 · **Môi trường:** Supabase Staging.  
**Audit ID:** `AURA-MATH6-PUBLISHER-TOC-AND-INDEPENDENT-R3-20261116`.

## 1. Đối chiếu SGK chính thức

Nguồn gốc **trực tiếp từ trang sách điện tử Nhà xuất bản Giáo dục Việt Nam**:
- [Toán 6 — Tập 1, thư viện NXB](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-6-tap-mot.4699854777)
- [Toán 6 — Tập 2, thư viện NXB](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-toan-6-tap-hai.4699864675)
- [Giới thiệu chính thức phương pháp 4 giai đoạn trong bài học](https://nxbgd.vn/bai-viet/gioi-thieu-sach-giao-khoa-lop-6-bo-sach-ket-noi-tri-thuc-voi-cuoc-song)

**Đã xác minh trực quan trang mục lục hai tập:** 78/78 đơn vị với tên mục và **số trang bắt đầu**; bao gồm 43 bài đánh số, 15 Luyện tập chung, 9 ôn cuối chương, 6 hoạt động, 1 ôn tập cuối năm và 4 phụ lục thuật ngữ. 56 tiêu đề AURA trùng nguyên dạng, 7 tiêu đề AURA diễn đạt lại và 15 mục Luyện tập chung cần nhãn phân biệt. Ma trận trước đó thiếu **Bảng giải thích thuật ngữ — Tập 1**; đã bổ sung.

Nhãn chứng cứ được tách:
- `toc_heading_verified=true` cho 78 đơn vị; `printed_start_page` chứa số trang từ mục lục.
- `body_and_exercise_verified=false` cho toàn bộ 78; **chưa đối chiếu nội dung, bài tập, rubric và đáp án theo từng trang**.
- Các câu hỏi SGK gốc được chứng nhận: **0/402**. Không được gọi 402 câu AI là số hóa nguyên bản SGK.
- AI glossary supplement: **112 mục tra cứu/giải thích**, không phải bản chép từ bảng thuật ngữ SGK.
- 43 bài học còn chờ đối chiếu nội dung đầy đủ theo 4 pha **Khởi động – Hình thành kiến thức – Luyện tập – Vận dụng**.

### Cơ sở dữ liệu nguồn

`aura_review.sgk_primary_toc_sources` và `aura_review.sgk_primary_toc_items` lưu link nguồn NXB, số trang, tiêu đề gốc, mức độ khớp.  
`aura_review.sgk_source_registry` đã cập nhật `publisher_primary_verified=true` cho mục lục, giữ `direct_page_verification=false`.

## 2. Kiểm định Toán độc lập

Toàn bộ **402 câu hiện hành** có hàng audit theo `question_id+revision`, dùng mã đợt `AURA-M6-MATH-INDEPENDENT-R2-20261116`.

| Kiểm tra | Kết quả |
|---|---:|
| Câu hiện hành | 402 |
| Đáp án được tính lại độc lập bằng quy tắc cụ thể | **156** |
| Trong nhóm đã tính lại, lệch so với đáp án đang lưu | **0** |
| Chưa có quy tắc độc lập phù hợp hoặc cần hình/đọc hiểu | **246** |
| Câu bị xác định mâu thuẫn toán học trong tập đã kiểm | 0 |

Lần đầu R2 xác minh **95**; lượt mở rộng R3 kiểm tra thêm **61**, nâng tổng 156. Các nhóm quy tắc gồm phép tính, thứ tự thực hiện, chia phân số, tìm x, bội/ước, công thức chu vi/diện tích, trung điểm và đoạn thẳng, làm tròn, phần trăm, đọc số liệu và xác suất thực nghiệm. Hai câu chia phân số được kiểm bằng phân tích đúng phép chia phân số để tránh lỗi giả do ngữ pháp toán học.

**Cảnh báo về mức chứng cứ:** 156 câu có quy tắc tính lại đạt **không có nghĩa toàn bộ lời giải chi tiết, hình vẽ, rubric và diễn giải toán học đã được chứng minh độc lập**. 246 câu còn lại giữ `NEEDS_INDEPENDENT_CHECK`, không tự gắn đạt theo phê duyệt AI.

`aura_review.math6_independent_audit` lưu tiêu chí, giá trị chuẩn tự tính lại, đáp án đang lưu, phiên bản câu, thời gian và phiên bản checker. RPC `public.aura_math6_math_audit_v2(volume,chapter)` chỉ được gọi qua Edge Function xác thực Admin.

## 3. Bảng kiểm và cổng phát hành

- [Kiểm định toán học theo chương](https://brunoquoc.github.io/aura-study/aura-math6-math-audit.html)
- [Ma trận chuẩn hóa SGK gốc theo trang mục lục](https://brunoquoc.github.io/aura-study/aura-math6-sgk-coverage.html)
- [Bảy cổng nghiệm thu](https://brunoquoc.github.io/aura-study/aura-math6-readiness.html)
- [Admin V2](https://brunoquoc.github.io/aura-study/admin-ch08-review.html)

**Chưa hoàn thành:** 246 câu cần kiểm định chuyên biệt; đối chiếu nội dung bốn pha của 43 bài và từng trang SGK; 23 cảnh báo hình trực quan vẫn cần xác nhận trên iPhone 12 Pro Max; quy trình Student thực tế cần nghiệm thu. **0 báo cáo nghiệm thu mới trên iPhone; 0 cấu hình Exam Engine live; 0 grading profile live.** Không tự đánh dấu đã đạt thiết bị hay phát hành.

**Kết luận:** Đã thay nguồn tham chiếu mục lục thứ cấp bằng nguồn chính thức và kiểm định toán độc lập thêm; phát hành vẫn HOLD cho đến khi đủ chứng cứ chuyên môn và thiết bị.
