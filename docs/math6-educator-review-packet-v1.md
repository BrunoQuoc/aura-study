# AURA STUDY — Hồ sơ kiểm định sư phạm Toán 6 V2 · bước tiếp theo

## Mục tiêu

Chuyển 96 câu bài học và ôn chương thành **hồ sơ kiểm định có thể rà soát ngay trên iPad**, để giáo viên đánh dấu *chỉ những câu có ngoại lệ*, không phải nhập lại câu, bốn lựa chọn, đáp án và lời giải.

Trang: `knowledge-review-packet.html`, từ **Admin → Nguồn Drive → Cổng duyệt học liệu V2 → Hồ sơ kiểm định 96 câu**.

## Dữ liệu và dấu vết

- Bản gốc AURA gồm 22 bài × 3 câu = **66 câu**; ôn 5 chương × 6 câu = **30 câu**, tổng 96.
- Mã câu ổn định, chương, bài nguồn, kỹ năng, câu hỏi, bốn lựa chọn, **đáp án bản nháp** và lời giải đều được hiển thị trực tiếp từ hai JSON nguồn.
- Browser tự tính SHA-256 trên *nguyên văn nội dung đã nạp* của hai file. Người duyệt có thể lưu bản in/PDF và đối chiếu hash.
- Bộ hồ sơ **từ chối hiển thị** nếu nguồn thiếu, số câu/coverage bị lệch, hai lựa chọn trùng nhau, thiếu lời giải hoặc các flags bị sửa thành tự công nhận.
- Đáp án đang hiển thị **chỉ là đáp án của bản nháp AURA**, không phải đáp án được giáo viên xác nhận.

## Quy trình kiểm định tối giản

1. Giáo viên có chuyên môn mở hồ sơ, chọn chương và rà soát mức độ chính xác, phạm vi chương trình, câu chữ, phương án nhiễu, đáp án, lời giải, trình độ lớp 6 và tình trạng hình ảnh minh họa.
2. Câu nào cần sửa: bật **“Đề nghị chỉnh sửa / kiểm định lại câu này”**, ghi lý do ít nhất 15 ký tự. Không cần thay lại cả bộ 96 câu.
3. Bấm **“Xuất JSON ngoại lệ (bản nháp)”** để tải tệp `aura-math6-v2-exception-draft.json`. Hồ sơ xuất có `sourceSha256`, `exclusions`, `reviewDecision=NOT_AN_APPROVAL`, `reviewerAuthenticated=false`, `educatorSignoffPresent=false`.
4. Người quản trị nhận file bằng kênh được phép, rà các ngoại lệ. Chỉ ghi `exclusions` (ID + reason) vào policy trên nhánh GitHub; **không dùng JSON browser làm bằng chứng phê duyệt**. Câu không đạt cần sửa và kiểm định lại nếu muốn dùng.
5. Giáo viên **riêng biệt** xác nhận toàn lô đã kiểm định; bằng chứng phải gắn đúng SHA-256 nguồn và được giữ ở nơi có phân quyền. Người quản trị cập nhật `batchReview` theo chứng cứ có thật.
6. Quy trình GitHub Actions protected Environment và khóa riêng P-256 mới được phép phát hành danh sách câu đạt đã được duyệt, tự nối vào Practice Generator và ghi nhận kỹ năng trong Weakness Map cục bộ khi học sinh làm đề/chấm bài.

## Trạng thái bảo mật

- **Không có chức năng phê duyệt trong trang**. Dấu tick ngoại lệ, bản in hoặc JSON browser không được phép nâng quyền.
- Không ghi localStorage; danh sách ngoại lệ tồn tại **trong phiên xem** và được xuất khi người dùng bấm. Không gửi dữ liệu ra ngoài nguồn GitHub Pages. Chuyển trang/reload sẽ xóa trạng thái chưa xuất.
- Trạng thái server/pointer hiện tại: `NO_APPROVED_RELEASE`; 0/96 được giáo viên xác nhận chính thức. Cổng ký P-256 tiếp tục fail-closed.
- Không thay đổi `scripts/knowledge-release-core.mjs`, `aura_data/approved_knowledge/active.json`, `aura_data/knowledge_approval/math6_v2_policy.json` hay đăng câu sang Question Bank, Exam Engine hoặc Supabase.
- Hoạt động tương thích iPad/điện thoại/desktop được kiểm tra bằng Chromium mô phỏng; **Safari thực trên iPad chưa được nghiệm thu**.
- Quy trình này không tự động xác minh toàn văn sách giáo khoa chính thức và không biến tác giả AI thành giáo viên đủ thẩm quyền.

## Lộ trình sau hồ sơ kiểm định

Chỉ sau khi nhận được xác nhận sư phạm thật và thiết lập Environment `aura-learning-approval` với người duyệt độc lập và secret khóa ký được bảo vệ, mới chạy workflow `aura-knowledge-protected-promotion.yml` phiên bản `v1.0.0`. Nếu người dùng chưa có quyền cấu hình hoặc chưa có người kiểm định, giữ trạng thái chờ, không giả lập giấy phép.

Liên quan: Issue #26 — Knowledge Library KNTT lớp 6; cổng duyệt V1 tại PR #29.
