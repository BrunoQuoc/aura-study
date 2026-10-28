# AURA STUDY — Stable Checkpoint

**Ngày chốt:** 2026-10-28  
**Trạng thái:** FROZEN / PAUSED — dùng thực tế, chưa phát triển thêm tính năng mới.  
**Nguyên tắc khi mở lại:** đúng dữ liệu → ổn định hệ thống → trải nghiệm học → cuối cùng mới đến trang trí.

## Production entries

- Student: `student-direct.html`
- Admin: `admin-direct.html`
- `index.html` redirect về Student production.
- `admin.html` redirect về Admin production.
- PWA manifest mở trực tiếp Student production.

## Những lỗi stability đã xử lý trước khi chốt

1. **Metadata kỳ thi không còn bị dính sang bài sau.**
   - `GK1/CK1/GK2/CK2` được lưu trực tiếp trong object `aura_generated_exam`.
   - Không dùng `aura_exam_period` làm state global khi chấm.
   - State legacy được migrate có điều kiện rồi xóa.

2. **Ghi metadata kết quả có guard.**
   - Subject/period chỉ được patch khi thao tác chấm thực sự tạo thêm một attempt mới.
   - Không sửa nhầm attempt cũ nếu thao tác chấm thất bại/không sinh kết quả.

3. **Reset báo cáo an toàn dữ liệu.**
   - Reset điểm/lịch sử chấm, Sổ câu sai, Smart Stats, chống ghi nhận trùng và dấu đã ôn.
   - Không xóa câu trả lời bé đã nhập trong các bài ôn.
   - Có `aura_report_reset_at`; tiến độ ôn cũ không tự quay lại báo cáo sau reset.
   - Backup/restore xử lý tương thích với mốc reset.

4. **Cache/Service Worker được đơn giản hóa.**
   - Core `app.js` không đăng ký Service Worker nữa.
   - Direct pages chỉ cleanup registration/cache legacy khi mở.
   - Không còn vòng register → unregister lặp lại.

5. **Entry legacy không còn mở app cũ.**
   - Root/student legacy redirect về Student direct.
   - Admin legacy redirect về Admin direct.

6. **“Vì sao sai?” chuyển sang evidence-aware.**
   - Ưu tiên `explanation/rule` từ dữ liệu câu hỏi khi có.
   - Chỉ tự giải thích khi quy tắc có thể xác định chắc chắn từ dữ kiện câu hỏi (ví dụ quy tắc Toán cơ bản).
   - Nếu nguồn chưa có lời giải chi tiết, AURA chỉ nêu đáp án đã xác minh và nói rõ chưa đủ căn cứ để kết luận nguyên nhân sai.
   - Không suy đoán lỗi tư duy của học sinh chỉ từ đáp án đã chọn.

## Phần đang hoạt động và được giữ nguyên

- Kết quả học tập đa môn.
- Báo cáo tuần tách theo môn.
- Sổ câu sai + luyện lại.
- Ôn thi theo năm học với exam metadata registry.
- Toán GK1; Tiếng Anh Units 1–3 dùng cho GK1 theo scope metadata.
- Ngữ văn CK1 chỉ dùng nguồn có căn cứ; tài liệu chưa đủ căn cứ vẫn chưa phân kỳ.
- Palette môn PA1 Premium nhẹ.
- Times New Roman cho nội dung học; UI/navigation giữ sans-serif.
- Admin Backup / Restore / Reset báo cáo.

## Giới hạn đã biết — không phải lỗi chặn sử dụng hiện tại

### Dữ liệu theo thiết bị
AURA hiện dùng `localStorage`. Student và Admin chỉ thấy cùng dữ liệu khi ở cùng browser/device. Cloud Sync đa thiết bị chưa triển khai.

### Admin chưa có authentication/PIN
Admin production là link riêng nhưng chưa có lớp xác thực. Parent PIN cho Reset/Restore là nâng cấp an toàn phù hợp trong tương lai, không được coi là đã triển khai.

### Technical debt: nhiều lớp patch/module
Core cũ và các lớp Dashboard / Smart Engine / Multi-subject / Weekly Report / Feedback vẫn được load theo thứ tự. Hiện luồng đã được guard và ổn định; nếu mở lại dự án để phát triển lớn, nên ưu tiên refactor module trước khi thêm nhiều tính năng mới.

### Nội dung các môn còn thiếu nguồn
KHTN, Lịch sử & Địa lý, GDCD, Tin học và Công nghệ chưa bật generator/kỳ thi khi chưa có nguồn đủ dữ kiện. Đây là chủ đích bảo toàn dữ liệu, không phải lỗi giao diện.

## Quy tắc khi tiếp tục dự án sau này

1. Không bật môn/kỳ chỉ để lấp giao diện trống.
2. Không biến bài chưa chấm tin cậy thành 0/10.
3. Không trộn điểm các môn thành chỉ số đánh giá chính.
4. Không đưa câu thiếu hình/dữ kiện vào auto-grade.
5. “Vì sao sai?” phải có nguồn/rule đủ chắc hoặc phải nói rõ giới hạn.
6. Trước khi thêm feature lớn: kiểm tra schema kết quả, backup/restore và migration.
7. Cloud Sync hoặc Parent Lock nếu triển khai phải giữ tương thích dữ liệu local hiện tại.

## Trạng thái đóng

Checkpoint này là mốc để tạm dừng AURA STUDY. Không tiếp tục chỉnh UI/feature trong giai đoạn pause trừ khi phát hiện lỗi dữ liệu, lỗi vận hành hoặc lỗi làm mất dữ liệu.
