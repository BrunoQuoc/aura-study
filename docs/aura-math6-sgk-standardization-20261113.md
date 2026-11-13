# AURA STUDY — Chuẩn hóa SGK Toán 6 Kết nối tri thức (Tập 1 & Tập 2)

**Ngày:** 13/11/2026 (Asia/Ho_Chi_Minh)  
**Môi trường:** Supabase Staging / GitHub Pages  
**Báo cáo:** `AURA-MATH6-KNTT-SGK-STANDARDIZATION-V1-20261113`

## Phạm vi nguồn được phép khẳng định

**Nguồn đã dùng ở bước này là mục lục SGK công khai từ trang tham chiếu thứ cấp; chưa phải bản SGK gốc được xuất bản cấp phép hoặc hồ sơ số trang đã xác minh.**

- Tập 1: https://thcs.toanmath.com/2022/01/sach-giao-khoa-toan-6-tap-1-ket-noi-tri-thuc-voi-cuoc-song.html
- Tập 2: https://thcs.toanmath.com/2022/01/sach-giao-khoa-toan-6-tap-2-ket-noi-tri-thuc-voi-cuoc-song.html

Không sao chép nguyên văn SGK, không gán mã bài tập/số trang khi chưa có bằng chứng; các bài tập và kiến thức trong AURA vẫn được ghi nhận là **AI tự biên soạn theo chủ đề**, không phải SGK gốc.

## Ma trận 77 đơn vị nội dung

| Đơn vị | Số lượng | Hiện trạng |
|---|---:|---|
| Bài học đánh số trong SGK | 43 | Khớp tên và thứ tự theo mục lục công khai; chưa xác minh từng trang |
| Luyện tập chung | 15 | Tạo 15 bộ luyện AI riêng, mỗi bộ 9 câu tham chiếu tới phiên bản ngân hàng hiện hành |
| Bài tập cuối chương | 9 | 9 nhóm luyện/ôn do AI soạn; 18 cấu hình thực hành/đề đang khóa |
| Hoạt động thực hành, trải nghiệm | 6 | Có sản phẩm AI biên soạn theo chủ đề |
| Ôn tập cuối năm | 1 | Có sản phẩm AI biên soạn |
| Phụ lục tra cứu, giải thích thuật ngữ | 3 | Tạo bảng thuật ngữ AURA tự biên soạn |
| **Tổng** | **77** | **77/77 có đơn vị/mục AI tương ứng, không đồng nghĩa 77/77 đã xác minh nội dung SGK nguyên bản** |

Lưu ý: 15 bộ luyện tập tham chiếu **135 vị trí câu hỏi** từ 402 câu cũ, **không phải 135 câu mới**. Nhóm câu đã lựa chọn theo đoạn bài học trong sách và phân phối ba mức nhận biết/thông hiểu/vận dụng; vẫn khóa trên Staging.

## Hồ sơ xuất xứ theo từng loại

| Loại | Số lượng | Phân loại có thể chứng minh |
|---|---:|---|
| Câu hỏi hiện hành | 402 | `AI_ORIGINAL_DECLARED`, gắn vào 43 bài; 0 câu có mã bài/tên trang SGK được xác minh |
| Khối kiến thức | 104 | `AI_ORIGINAL_DECLARED`, gắn bài học; 0 khối xác minh trích trực tiếp |
| Cấu hình luyện/đề | 18 | `AI_ADAPTED_PRACTICE`; 0 cấu hình được xác nhận là đề SGK gốc |
| Luyện tập chung | 15 | `AI_ADAPTED_EXISTING_BANK`; mỗi bộ 9 câu, 135 tham chiếu hợp lệ |
| Thuật ngữ / giải thích | 84 mục từ | 28 mục từ Tập 1 + 28 mục từ Tập 2 + 28 giải thích AI Tập 2 |
| Nguồn SGK gốc xác minh từng trang | 0 | Chưa có chứng cứ nguồn cấp phép và số trang |

Đã tạo các bảng Staging trong schema `aura_review`: `sgk_source_registry`, `sgk_alignment_sections`, `sgk_question_provenance`, `sgk_knowledge_provenance`, `sgk_blueprint_provenance`, `sgk_common_practice_modules`, `sgk_ai_glossary_drafts`.

**Bảo toàn dữ liệu:** không đổi stem, đáp án, rubric, trạng thái `AI_APPROVED/APPROVED`, không di chuyển hay xóa bản revision câu hỏi. Thông tin nguồn gốc nằm ở lớp metadata riêng, truy vết bằng `question_id+revision`.

## QA đã thực hiện

- 43 bài học được gắn nguồn tương ứng, 402 câu và 104 khối kiến thức có provenance.
- 15 bộ Luyện tập chung = 135 tham chiếu; 0 tham chiếu trỏ phiên bản sai, sai chương hoặc nằm ngoài dải bài.
- 18 bản blueprint có nhãn nguồn và tiếp tục khóa.
- 3 bảng thuật ngữ AURA đã tạo, không gán sai nguồn SGK gốc; 0 đơn vị trống về mặt **học liệu AI thay thế**.
- `aura_math6_sgk_coverage_v1()` cung cấp báo cáo trực tiếp về nguồn và độ phủ, chỉ service_role được gọi; Edge JWT + grant Admin kiểm tra trước khi cấp dữ liệu.
- Admin V2 hiển thị rõ: câu AI tự biên soạn, chỉ đối chiếu mục lục SGK, chưa xác minh trích SGK gốc.

## Các điểm chưa hoàn thành

1. Đối chiếu từng trang và từng mã bài tập SGK **từ nguồn sách hợp lệ**, bao gồm phép kiểm tra bằng người có chuyên môn; hiện bằng chứng nguồn cấp chính chưa được kết nối.
2. Chưa có bản “số hóa toàn bộ bài tập SGK nguyên bản” và không được mô tả như vậy.
3. Kiểm định toán học độc lập tất cả đáp án/lời giải trước phát hành cho học sinh vẫn là cổng riêng.
4. Nghiệm thu trực quan 23 biểu đồ trên iPhone thật và toàn bộ Student E2E chưa hoàn tất.
5. Chính sách quyền sử dụng tài liệu SGK cần được làm rõ trước khi nhập bản sao nguyên văn.

## Điều hướng

- [Ma trận 77 đơn vị SGK trong Admin](https://brunoquoc.github.io/aura-study/aura-math6-sgk-coverage.html)
- [Admin V2 — câu hỏi & nguồn gốc](https://brunoquoc.github.io/aura-study/admin-ch08-review.html)
- [Bảng 7 cổng nghiệm thu](https://brunoquoc.github.io/aura-study/aura-math6-readiness.html)

**Kết luận:** Đã chuẩn hóa toàn bộ **danh mục/nhãn nguồn và học liệu AI tương ứng**, nhưng **chưa thể khẳng định đã nhập hoặc kiểm định 100% bản SGK gốc**.
