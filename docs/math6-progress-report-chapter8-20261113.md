# AURA STUDY — Báo cáo thiết kế Toán 6, Chương VIII

**Ngày kiểm kê:** 13/11/2026. Ưu tiên hoàn thiện đúng Learning Engine Toán đã có, không thay đổi phân môn khác.

## Căn cứ phạm vi và bản quyền
- Mục lục công khai Toán 6 KNTT tập 2 tại https://sachdientu.nxbgd.vn/thu-vien-so/doc-sach/shs-toan-tap-2.4491552782 xác định Chương VIII gồm sáu bài 32–37: Điểm và đường thẳng; Điểm nằm giữa hai điểm. Tia; Đoạn thẳng. Độ dài đoạn thẳng; Trung điểm của đoạn thẳng; Góc; Số đo góc.
- AURA chỉ tham khảo tên và phạm vi bài; toàn bộ nội dung dạy học, ví dụ, câu luyện, biểu diễn SVG là bản tự biên soạn. Không sao chép toàn bộ SGK, hình SGK hoặc lời giải SGK.

## Đợt triển khai Chương VIII
- **6/6 bài học thật**, có mục tiêu, giải thích, ví dụ theo bước, lỗi thường gặp.
- **18 câu luyện trong bài + 6 câu ôn cuối chương**, mỗi câu đủ câu dẫn, bốn lựa chọn, đáp án, giải thích và kỹ năng.
- **6 hình SVG nguyên gốc**, nhúng ngay trong Bài 32–37: điểm thuộc đường thẳng, tia đối nhau, đoạn thẳng 6 cm, trung điểm AM=MB=4 cm, góc hai tia chung gốc, góc dựng chính xác 60°. Mỗi hình ghi rõ đây là *mô hình minh họa*, không đo độ dài bằng pixel.
- **2 thao tác trực quan**: kéo điểm M trên đoạn AB dài 12 cm từ 0,5 đến 11,5 cm để thấy điều kiện trung điểm; xoay tia tạo góc 0°–180° theo bước 5°, phân loại góc (0° không nằm trong các nhóm nhọn, vuông, tù, bẹt).
- **6 câu ôn** lưu kết quả tự luyện riêng tại trình duyệt và dẫn về đúng bài có lỗi. File ôn có dấu vết figureFacts ghi thứ tự điểm, độ dài tính cm, các tia chung gốc và số đo góc để kiểm định đủ dữ kiện hình.
- Không nhập lại câu hỏi hoặc đáp án. Đáp án vẫn là **nháp AURA**, cần kiểm định chuyên môn độc lập.

## Toàn bộ Toán 6 — số bài có nội dung

| Phạm vi | Bài có nội dung | Câu luyện trong bài | Ôn chương | Trực quan |
|---|---:|---:|---:|---|
| Tập 1, Chương I–V | 22/22 | 66 | 30 | 5 hoạt động |
| Tập 2, Chương VI phân số | 5/5 | 15 | 0 | 0 |
| Tập 2, Chương VII số thập phân | 4/4 | 12 | 6 | 2 hoạt động |
| Tập 2, Chương VIII hình học | 6/6 | 18 | 6 | 2 hoạt động và 6 SVG tĩnh |
| Tập 2, Chương IX dữ liệu/xác suất | 0/6 | 0 | 0 | 0 |
| **Cộng** | **37/43 (86,0%)** | **111** | **42** | **9 hoạt động + 6 hình SVG** |

Đây là độ phủ **bài chính** đã biên soạn. Luyện tập chung, tiết trải nghiệm, ôn cuối năm, tự luận và rubric chưa được tính là hoàn thành. Không dùng tiêu đề rỗng để tăng chỉ số.

## Cổng an toàn và dữ liệu
- Toán Tập 2 vẫn DRAFT_PREVIEW_PARTIAL; teacherReviewed=false; questionBankPromotionEnabled=false; examEngineLinkEnabled=false; weaknessMapWriteEnabled=false.
- 96 câu Tập 1 vẫn chờ xác nhận sư phạm và người ký có thẩm quyền; cổng ký hiện chỉ giới hạn 96 ứng viên Tập 1, không tự mở khóa dữ liệu mới Tập 2.
- Kết quả ôn Chương VIII lưu cục bộ tại aura_kntt_math6_volume2_ch8_review_v1, có SHA-256 của bộ câu nhằm tự thu hồi điểm cũ khi nội dung thay đổi. Không có ghi dữ liệu chính thức vào Supabase/Exam Engine/Question Bank/Weakness Map.
- Kiểm thử Chromium iPad/phone/desktop chỉ là kiểm thử tự động; chưa thay thế nghiệm thu Safari thực hoặc giáo viên.

## Đường việc tiếp theo
1. **Chương IX, Bài 38–43:** dữ liệu, thu thập dữ liệu, biểu đồ tranh/cột/cột kép, thí nghiệm và xác suất thực nghiệm. Bài và bài tập tự xây dựng; biểu đồ/mô phỏng dùng dữ liệu được kiểm toán.
2. **Ôn Chương VI, Chương IX, ôn cuối năm, luyện tập chung, thực hành**, kèm các tình huống ứng dụng thực tế.
3. **Bài tự luận Toán** và thang điểm theo bước, xác định bài tự chấm được và bài cần giáo viên xác nhận.
4. **Kiểm định sư phạm theo SHA nguồn** và bảo vệ chữ ký phát hành, sau đó mới nối câu đã duyệt với Practice Generator/Weakness Map sau khi bài làm được chấm.
5. **Safari iPad thực** và quy trình rollback trước nghiệm thu chính thức.
