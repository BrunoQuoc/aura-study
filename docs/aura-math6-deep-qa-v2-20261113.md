# AURA STUDY — Deep QA V2 / Toán 6 Tập 1 + Tập 2

**Ngày ghi nhận:** 2026-11-13 (Asia/Ho_Chi_Minh)  
**Môi trường:** Supabase Staging — chưa phát hành cho học sinh  
**Audit ID:** `AURA-M6-402-DEEP-QA-RELEASE-GATE-V2-20261113`  
**Loại nguồn:** Bài học và câu hỏi tự biên soạn, tham chiếu phạm vi SGK Kết nối tri thức; không sao chép nguyên văn SGK.

## Tóm tắt kết quả thực tế

| Kiểm tra | Kết quả |
|---|---:|
| Chương / bài học / câu hỏi | 9 / 43 / 402 |
| Kiểm tra cấu trúc đạt | 398 |
| Phiên bản đã duyệt cũ thiếu trường khóa phát hành rõ ràng | 4 |
| Lỗi cấu trúc khác | 0 |
| Đã duyệt / còn chờ duyệt | 5 / 397 |
| Phép tính trực tiếp đối chiếu độc lập | 35/35 khớp |
| Số liệu của hình SVG mới đối chiếu với đáp án | 23/23 khớp |
| Hình SVG liên kết hợp lệ theo quy tắc kỹ thuật | 26 |
| Câu có thể thử Auto Grading số | 212 |
| Câu yêu cầu người chấm | 190 |
| Cờ phát hành hoặc chấm điểm live bật | 0 |

**Giới hạn:** 35 bài được kiểm tra bằng phép tính trực tiếp và 23 biểu đồ được đối chiếu số liệu không có nghĩa là toàn bộ 402 lời giải đã được kiểm định toán học độc lập. Quyết định phê duyệt sư phạm vẫn thuộc tài khoản Admin được xác thực.

## Những thay đổi đã thực hiện

1. Bổ sung 23 SVG được tạo nguyên bản cho 5 câu biểu đồ tranh Bài 39, 9 câu biểu đồ cột Bài 40 và 9 câu biểu đồ cột kép Bài 41. Tất cả được tạo phiên bản mới, không xóa hoặc ghi đè câu hỏi gốc.
2. Sửa câu `M6-KNTT-T2-L39-Q08`: bỏ yêu cầu trung bình cộng không trọng tâm, chuyển sang đọc bảng thống kê và xác định nhóm có số lượt nhiều nhất. Phiên bản cũ được giữ lại.
3. Chuẩn hóa `publication_allowed=false` và `live_exam_eligible=false` cho **51 câu chờ duyệt** có thiếu trường metadata; tạo phiên bản mới và liên kết lại hàng chờ. Không tự thay đổi 5 quyết định đã phê duyệt.
4. Lưu chứng cứ QA theo `question_id` và `revision` tại `aura_review.question_qa_evidence`; không gán nhãn kiểm định toán học cho các câu chưa được kiểm chứng.
5. Tạo 30 mục cần xem xét tại `aura_review.qa_findings`: 4 HIGH do bản đã duyệt cũ thiếu metadata, 26 MEDIUM gồm 23 SVG cần nghiệm thu trực quan, 2 rubric V2 cần tái duyệt và 1 câu Bài 39 mới sửa.
6. Mở API QA dashboard có xác thực Admin và cập nhật màn hình Admin V2, gồm bộ lọc `QA — Cần rà soát`, `QA — Ưu tiên cao`, mức độ lỗi, hành động tiếp theo và tiến độ mỗi chương.

## Bốn trường hợp chưa được phép đi qua cổng phát hành

- `M6-KNTT-C08-L32-Q01`
- `M6-KNTT-C08-L32-Q02`
- `M6-KNTT-C08-L32-Q03`
- `M6-KNTT-C08-L32-Q04`

Cả bốn có trạng thái **APPROVED từ lượt trước**, nhưng bản hiện hành thiếu `publication_allowed=false`. Em giữ nguyên bản đã duyệt và lịch sử; đánh dấu cổng phát hành HOLD. Không tự sửa hoặc gán người duyệt khi chưa có một chu kỳ tái duyệt hợp lệ.

## Quy tắc phát hành

- Tất cả phát hành và chấm điểm live vẫn khóa.
- 397 câu chưa có duyệt sư phạm chính thức.
- 4 bản đã duyệt cũ cần xử lý metadata theo quy trình có audit.
- 23 hình mới cần kiểm thử trực quan trên thiết bị thật sau thay đổi giao diện/chất liệu.
- QA về cấu trúc, phép tính mẫu, SVG và chấm thử là bằng chứng kỹ thuật, **không phải ký duyệt sư phạm**.

## Truy cập
- Admin V2 (tài khoản Admin Staging): https://brunoquoc.github.io/aura-study/admin-ch08-review.html
- Đăng nhập: https://brunoquoc.github.io/aura-study/aura-staging-login.html

Không có khóa bí mật Supabase trong client GitHub Pages.
