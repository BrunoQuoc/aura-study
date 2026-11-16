# AURA STUDY — Toán 6, mở đủ hàng chờ rà 402 câu & bằng chứng 246 câu

**Ngày:** 16/11/2026 (GMT+7)  
**Staging audit ID:** `AURA-MATH6-FULL-402-TRIAGE-246-EVIDENCE-20261116`  
**Kết quả kỹ thuật:** `STAGING_FULL_402_INVENTORY_PAGED_331_PLUS_30_246_MATH_EVIDENCE_QUEUE_PASS_NO_AUTO_CERTIFICATION`

## 1. Số liệu đã xác minh trên Supabase

| Nhóm | Số lượng | Ghi chú |
|---|---:|---|
| Tổng câu ngân hàng Toán 6 | 402 | Mọi câu có mã và revision |
| Câu có hướng dẫn toán đố và rubric 4 bước trên Staging | 41 | AI draft, chưa teacher signoff |
| Câu được heuristic gợi ý là có lời văn chưa được rà | 30 | Chưa xác minh phân loại |
| Câu không được heuristic gợi ý chưa được rà | 331 | **Không đồng nghĩa không phải toán đố** |
| Tổng câu cần người phân loại bổ sung | **361** | Admin xem từng câu |
| Câu kiểm định toán độc lập đã đạt trước đợt này | 156 | Giữ nguyên |
| Câu kiểm định toán độc lập còn chờ | **246** | Chỉ bổ sung hàng chờ bằng chứng |
| Hồ sơ bằng chứng mới được Admin lưu thật | 0 | Không tạo xác nhận giả |
| Rubric có xác nhận giáo viên | 0/41 | Chưa có giáo viên ký duyệt |
| Biên bản nghiệm thu thực tế toán đố | 0 | Chưa có bài Student thật đủ điều kiện |
| Điểm thi/Auto Grading live | 0 | Tiếp tục khóa |

**Không có dòng trạng thái nào bị chuyển từ `NEEDS_INDEPENDENT_CHECK` thành `RULE_VERIFIED` vì ghi nhận xét.**

## 2. Triển khai

### Cơ sở dữ liệu
- Bảng `aura_review.math6_math_audit_work_items`: 246 đầu việc khóa theo question_id + revision, lưu ghi chú kiểm định toán, người rà và trạng thái `PENDING_INDEPENDENT_CHECK` / `EVIDENCE_SUBMITTED` / `NEEDS_SOURCE_OR_DIAGRAM`. Ràng buộc `independently_certified=false`, `official_release_enabled=false`.
- Tái sử dụng `aura_review.math6_word_problem_inventory` có 402 câu, mỗi câu gắn bucket heuristic hoặc guided, không làm mất nhãn thủ công.
- RPC `aura_math6_word_inventory_admin_page_v2`: cung cấp 30 câu được gợi ý hoặc 331 câu không được đánh dấu, phân trang tối đa 40 câu.
- RPC `aura_math6_word_inventory_admin_label_v2`: Admin phân loại bằng ba trạng thái `WORD_PROBLEM`, `NOT_WORD_PROBLEM`, `NEEDS_CONTEXT`; cần nhận xét ≥12 ký tự, **không tạo rubric**.
- RPC `aura_math6_math_audit_admin_page_v1`: danh sách 246 câu còn chờ, ưu tiên phép tính số không dùng hình rồi đến lập luận và các bài có hình; phân trang, lọc theo tình trạng bằng chứng.
- RPC `aura_math6_math_audit_admin_evidence_v1`: Admin ghi bằng chứng toán ≥35 ký tự hoặc chỉ rõ hình/nguồn cần bổ sung. Trạng thái kiểm định gốc luôn còn `NEEDS_INDEPENDENT_CHECK`.
- Tất cả bốn RPC chỉ dành cho `service_role` qua Admin Edge, có kiểm tra role ADMIN độc lập. RLS bật cho bảng mới.

### Giao diện Admin
Đã mở rộng trực tiếp trang [QA Toán đố, Toán 6](https://brunoquoc.github.io/aura-study/aura-math6-word-qa.html):
- Bước 1: 41 rubric chờ Admin rà và chuyển giáo viên.
- Bước 2: 30 ứng viên heuristic cần phân loại.
- Bước 3: checklist tám điều kiện nghiệm thu thực tế thiết bị Student, **chỉ mở nếu có bài đã được Admin rà**.
- Bước 4 **mới**: duyệt tiếp 331 câu không được bộ lọc đánh dấu, có phân trang 20 câu, chọn loại và ghi lý do.
- Bước 5 **mới**: mở 246 câu còn chờ kiểm định, nhập bằng chứng phép tính hoặc tình trạng thiếu hình/SGK theo từng câu.

Supabase Edge `aura-admin-review-v1` **v29**, `verify_jwt=true`, bổ sung bốn action mới `math6_word_inventory_page`, `math6_word_inventory_label_v2`, `math6_math_audit_page`, `math6_math_audit_evidence`. Các route chấm bài và nghiệm thu V2 cũ được giữ nguyên.

Hàm `aura_student_math6_readiness_v1` được bổ sung các chỉ số dành riêng cho trạng thái rà phân loại toàn bộ, số ghi chú bằng chứng đang chờ và cờ không phải chứng nhận.

## 3. Kiểm thử

- Phân trang 331 câu `NOT_FLAGGED` (20 câu/trang): đếm đủ 331, **0 mã trùng trang**.
- Phân trang 30 câu heuristic: đủ 30, **0 mã trùng**.
- Phân trang 246 câu cần kiểm định toán: đủ 246, **0 mã trùng**.
- Thử Admin phân loại câu, kiểm tra số câu chưa rà giảm 1: PASS, sau đó `ROLLBACK`.
- Thử Admin ghi bằng chứng toán và lọc `EVIDENCE_SUBMITTED`: PASS; xác nhận không nâng câu lên `RULE_VERIFIED`, sau đó `ROLLBACK`.
- Non-Admin không được lấy hàng chờ, non-Admin không được phân loại, trang quá kích thước cho phép bị từ chối.
- `anon`/`authenticated` không có quyền gọi trực tiếp các RPC; `service_role` được cấp đúng quyền.
- Trang Admin QA được biên dịch cú pháp JS thành công, không thiếu DOM IDs.
- Audit backend được lưu trong `aura_review.qa_runs`.
- **Chưa kiểm tra được trang GitHub Pages bằng phiên Safari/iPhone thực tế**; công cụ duyệt public URL không truy cập được, không suy đoán đã nghiệm thu trải nghiệm.

## 4. Cảnh báo và điều kiện phát hành

Supabase Security Advisor có các cảnh báo ở những bảng public dành cho phiên anonymous (cần đánh giá có đúng với mô hình Student pairing không) và `Leaked Password Protection Disabled`. Chưa thay đổi chính sách truy cập Student lúc này để không vô hiệu hóa phiên đã ghép. Tham khảo:
- [Anonymous Access Policies](https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins)
- [Password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

Các mục không thể tự hoàn thành bằng kiểm thử backend:
1. Giáo viên thật chưa ký 41 rubric; Admin precheck **không phải** teacher signoff.
2. Chưa có biên bản iPhone/iPad thật từ luồng Student nộp bài toán đố và Admin rà.
3. Cần người thực tế đọc và phân loại 361 câu, đánh giá nội dung SGK gốc khi nguồn hợp pháp được cung cấp.
4. Cần người kiểm định độc lập thẩm định các bằng chứng của 246 câu, không dựa chỉ trên câu trả lời AI.

**Trạng thái:** Hoàn thiện công cụ và hàng chờ kiểm định, **chưa hoàn thành xác nhận sư phạm hay phát hành chính thức**. Exam Engine và Auto Grading live vẫn **OFF**.
