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

## Thay đổi được phê duyệt sau checkpoint

### Admin quản lý phân kỳ / cách sử dụng tài liệu

Theo quyết định của phụ huynh/Admin, AURA bổ sung mục **Admin → Phân kỳ** nhưng vẫn giữ nguyên nguyên tắc dữ liệu:

- `sourceTerm/sourcePeriods` là metadata nguồn bất biến.
- `term/periods` là default assignment của AURA.
- Quyết định của Admin được lưu riêng tại `aura_metadata_overrides_v1`.
- `replace`: chuyển nơi sử dụng sang kỳ Admin chọn.
- `add`: giữ mặc định và dùng thêm ở kỳ Admin chọn.
- `clear`: trả về default assignment.
- Khi nguồn ghi rõ kỳ cụ thể, Admin có thể chọn **Dùng đúng kỳ nguồn**.
- Mọi override thủ công phải có lý do/ghi chú để truy vết.
- Cấu hình override được backup/restore cùng dữ liệu AURA.
- Student và Admin trên cùng origin/browser/device dùng chung effective assignment.
- Override áp dụng được cho cả tài liệu và ngân hàng tạo đề; quyền generator theo kỳ dùng effective periods.
- UI được rút gọn còn một mode chung ở đầu trang và danh sách tài liệu theo từng môn.

Thay đổi này là chức năng quản trị dữ liệu, không làm thay đổi metadata nguồn hoặc nội dung tài liệu gốc.

### Admin INBOX — upload từ thiết bị + duyệt trước khi chuyển

AURA bổ sung mục **Admin → INBOX** để quản lý vòng đời tài liệu mới:

1. Admin kết nối Google bằng OAuth `drive.file`.
2. Access token chỉ nằm trong RAM của phiên hiện tại, không lưu vào localStorage/backup.
3. Admin dùng Google Picker để xác nhận đúng thư mục `00_INBOX`; folder ID được lưu tại `aura_drive_inbox_folder_v1`.
4. Admin có thể chọn nhiều file từ thiết bị và upload giữ nguyên định dạng gốc vào `00_INBOX`.
5. File upload mới được gắn Drive `appProperties.auraState = WAITING_REVIEW` và xuất hiện trong hàng chờ Admin.
6. Admin phải chọn ít nhất **môn** và **loại tài liệu** trước khi duyệt; kỳ sử dụng có thể để chưa gán.
7. Nút **Duyệt & chọn thư mục đích** mở Google Picker lần nữa. File chỉ được move khỏi `00_INBOX` sau khi Admin tự chọn thư mục đích.
8. Move sử dụng Drive API `files.update` với `addParents/removeParents`; không có thao tác tự động chuyển file nếu Admin chưa duyệt.
9. Sau duyệt, file được gắn `auraState = APPROVED` cùng subject/docType/period/note/approvedAt để truy vết.
10. Hàng chờ cục bộ nằm tại `aura_inbox_queue_v1` và được backup/restore như các key `aura_*`; file thật vẫn nằm trên Google Drive.
11. Có nút đồng bộ lại hàng chờ từ Drive đối với file do AURA Admin upload và vẫn có `WAITING_REVIEW`.
12. `Reset báo cáo` không xóa hoặc thay đổi dữ liệu INBOX.

Google Cloud configuration của production Admin:

- Drive API: enabled.
- Picker API: enabled.
- OAuth scope: `https://www.googleapis.com/auth/drive.file`.
- Cloud Project Number / Picker App ID: `704823170664`.
- API key và OAuth Client ID là browser-visible config và phải luôn được giới hạn bằng Google Cloud restrictions; không lưu Client Secret trong repo/frontend.

Giới hạn hiện tại của INBOX:

- Đây là **upload + human approval workflow**. Chưa có backend/LLM tự động đọc nội dung mới upload để tự phân loại hoặc kiểm tra đáp án ngay trong website.
- Admin hiện tự chọn subject/docType/period trước khi move. Auto-analysis chỉ được bổ sung sau khi có pipeline tin cậy và vẫn phải giữ bước Admin duyệt cuối cùng.
- Queue/history cục bộ vẫn phụ thuộc browser/device; Drive file và Drive `appProperties` là lớp bền vững hơn cho file do AURA tạo.

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
- Admin quản lý phân kỳ và manual usage override.
- Admin INBOX upload từ thiết bị + duyệt thủ công + move bằng Google Drive.

## Giới hạn đã biết — không phải lỗi chặn sử dụng hiện tại

### Dữ liệu theo thiết bị
AURA hiện dùng `localStorage` cho learning state và một phần Admin state. Student và Admin chỉ thấy cùng dữ liệu local khi ở cùng browser/device. Cloud Sync đa thiết bị chưa triển khai. Google Drive file không phụ thuộc localStorage.

### Admin chưa có authentication/PIN
Admin production là link riêng nhưng chưa có lớp xác thực. Parent PIN cho Reset/Restore và các thao tác quản trị metadata/INBOX là nâng cấp an toàn phù hợp trong tương lai, không được coi là đã triển khai.

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
8. Manual metadata override không bao giờ được sửa SOURCE; mọi thay đổi chỉ đi qua lớp override và phải có reason.
9. Tài liệu mới luôn đi qua `00_INBOX`; AURA không được tự move ra khỏi INBOX khi chưa có hành động duyệt rõ ràng từ Admin.
10. Auto-analysis trong tương lai chỉ được đề xuất classification/answer status; quyền quyết định chuyển tài liệu vẫn thuộc Admin.

## Trạng thái đóng

Checkpoint này là mốc để tạm dừng AURA STUDY. Không tiếp tục chỉnh UI/feature trong giai đoạn pause trừ khi phát hiện lỗi dữ liệu, lỗi vận hành hoặc lỗi làm mất dữ liệu, hoặc có thay đổi quản trị dữ liệu được phụ huynh/Admin phê duyệt rõ ràng.
