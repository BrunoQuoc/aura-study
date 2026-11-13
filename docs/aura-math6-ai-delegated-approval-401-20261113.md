# AURA STUDY — Biên bản phê duyệt AI theo ủy quyền: Toán 6 (401/401)

**Ngày:** 13/11/2026 (Asia/Ho_Chi_Minh)  
**Đợt QA / phê duyệt:** `AURA-M6-AI-DELEGATED-401-20261113`  
**Môi trường:** Supabase Staging — Không tự phát hành cho học sinh.

## Kết quả đã lưu

| Chương | Câu hỏi | AI_APPROVED | Admin (người thật) | PENDING |
|---|---:|---:|---:|---:|
| Tập 1 · Chương I | 63 | 62 | 1 | 0 |
| Tập 1 · Chương II | 60 | 60 | 0 | 0 |
| Tập 1 · Chương III | 45 | 45 | 0 | 0 |
| Tập 1 · Chương IV | 27 | 27 | 0 | 0 |
| Tập 1 · Chương V | 18 | 18 | 0 | 0 |
| Tập 2 · Chương VI | 45 | 45 | 0 | 0 |
| Tập 2 · Chương VII | 36 | 36 | 0 | 0 |
| Tập 2 · Chương VIII | 54 | 54 | 0 | 0 |
| Tập 2 · Chương IX | 54 | 54 | 0 | 0 |
| **Tổng** | **402** | **401** | **1** | **0** |

Trạng thái `AI_APPROVED` là **phê duyệt nội dung AI cho môi trường Staging theo chỉ thị ủy quyền trực tiếp của người dùng**, được phân biệt trong cơ sở dữ liệu và giao diện khỏi `APPROVED` do Admin xác thực. **Không mạo danh Admin**.

## Nội dung thực hiện

1. Đã đọc và đối chiếu các câu hỏi, đáp án và lời giải trong toàn bộ 43 bài học của 9 chương thuộc hai tập. Các câu đủ tiêu chí cấu trúc và không phát hiện sai lệch toán học rõ ràng trong lượt rà soát AI.
2. Sửa **22 câu** để tránh mơ hồ: dùng dấu chấm phẩy tách danh sách số nguyên (không nhầm dấu phẩy thập phân), bỏ mã hình `FIG-...` khỏi lời đề, bổ sung “hình chữ nhật” cho bài toán diện tích cần định danh loại hình. **Không sửa đáp án số học** trong các câu này.
3. Tất cả 22 lần sửa đã tạo revision mới, giữ nguyên phiên bản cũ; 22 phiên bản mới đạt lại kiểm tra cấu trúc, rubric, grading preview và liên kết hình.
4. Đã lưu **401 assessment records**, **401 review history events** có `action=AI_APPROVED`, `decision_origin=AI_DELEGATED`, `actor_uid=NULL`. Quyết định Admin duy nhất trước đó được giữ nguyên.
5. Cập nhật các báo cáo chương và Admin V2 để hiện riêng số “AI đã duyệt”, “Admin đã duyệt”, và cho phép Admin tái duyệt theo lô các câu đã AI phê duyệt nếu cần.
6. Đồng bộ lại **216 tham chiếu** trong 18 cấu hình đề luyện/đề ôn đang khóa; **0 tham chiếu phiên bản cũ**. Các bản blueprint trước đó được lưu vào lịch sử.

## Phạm vi độ tin cậy

- Kiểm tra cấu trúc: **402/402 câu** đạt.
- Đọc và rà nghĩa đề, đáp án và lời giải: **402/402 trong đợt AI review**; việc mô hình không nhận thấy sai lệch **không phải chứng minh toán học độc lập hoàn toàn** cho từng bài.
- Phép tính trực tiếp có bằng chứng tính lại theo quy tắc: **35 câu** từ đợt QA kỹ thuật trước.
- Số liệu biểu đồ được đối chiếu bằng quy tắc: **23/23 hình mới** từ đợt QA trước.
- Tương thích và phóng to hình trên iPhone thật sau cập nhật: **chưa có biên bản nghiệm thu mới**.
- **30 QA findings còn mở**, gồm cảnh báo tái duyệt và nghiệm thu hình trên thiết bị. Việc AI phê duyệt không tự xóa cảnh báo kỹ thuật/thiết bị.

## Phân biệt quyết định AI và phê duyệt con người

Trạng thái `AI_APPROVED` là một trạng thái riêng, không tạo chữ ký Admin. Các hành động phê duyệt thật từ Admin vẫn yêu cầu phiên xác thực có grant ADMIN và ghi `reviewer_uid`. Admin có thể xem/lọc toàn bộ câu AI đã phê duyệt và thực hiện quyết định thay thế, không làm mất lịch sử AI.

## Cổng phát hành

- `publication_allowed=false`, `live_exam_eligible=false` cho 402 câu.
- Exam Engine: **OFF**; 18 blueprint vẫn là `DRAFT_LOCKED`.
- Auto Grading thực tế: **OFF**, dùng bản chấm thử kiểm tra riêng.
- Cả 9 chương vẫn `ready_for_release_assessment=false`, do phê duyệt AI Staging không phải tất cả quyết định Admin xác thực và còn các QA findings đang mở.

**Kết luận:** Theo ủy quyền của người dùng, **đã giải quyết hết 401 câu khỏi hàng chờ thông qua quyết định AI có lịch sử và nguồn gốc xác định; không còn câu PENDING**. Đây là kết quả nghiệm thu nội dung AI trong môi trường thử nghiệm, **chưa được mô tả là phê duyệt sư phạm độc lập bởi giáo viên hoặc bản phát hành cho học sinh**.

## Điều hướng
- [Admin V2 — xem 401 câu AI đã duyệt](https://brunoquoc.github.io/aura-study/admin-ch08-review.html)
- [Cổng đăng nhập 3 vai trò](https://brunoquoc.github.io/aura-study/aura-portal.html)
