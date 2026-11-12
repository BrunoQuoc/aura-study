# AURA STUDY — Knowledge Library V2: cổng duyệt theo phiên bản → Generator → Weakness Map

**Phạm vi:** Toán 6 KNTT Tập 1, 22 bài và 5 bộ ôn tập, 96 câu AURA soạn mới. Không đưa sách giáo khoa bản quyền, ảnh SGK, thông tin học sinh hoặc bí mật GitHub lên repository công khai.

## 1. Tình trạng bảo mật và ranh giới

**Mặc định: 0/96 được cấp quyền**. Bộ máy đã đối chiếu 96 khóa đáp án với một danh sách đáp án kiểm tra độc lập do người soạn chuẩn bị, kiểm tra tính hợp lệ hình thức và phủ hết 22 bài; **đó không phải chữ ký xác nhận của giáo viên hay nhà xuất bản**.

- \`knowledge-approval.html\` là bảng **giám sát chỉ đọc**, không có chức năng cấp quyền từ trình duyệt GitHub Pages.
- \`aura_data/knowledge_approval/math6_v2_policy.json\` khởi tạo ở \`PENDING_QUALIFIED_REVIEW\`, SHA nguồn đang trống.
- \`aura_data/approved_knowledge/active.json\` khởi tạo \`NO_APPROVED_RELEASE\`.
- \`aura_data/approved_knowledge/trust.json\` khởi tạo không có khóa ký; không bản phát hành nào được tin.
- Sản xuất Supabase/Exam Engine/Question Bank chính thức vẫn **NO-GO**, không thể lấy UI Admin không xác thực làm nguồn phê duyệt.

## 2. Luồng tự động: không nhập lại từng câu

\`scripts/knowledge-release-core.mjs\` và \`scripts/knowledge-approval-pipeline.mjs\` tự đọc 22 bài (66 câu) và 5 bộ ôn (30 câu), tạo 96 bản ghi có:
- mã ổn định \`KNTT6-MATH-V1-01-P1\`, ... và \`C1-01\` đến \`C5-06\`;
- văn bản câu, bốn lựa chọn, đáp án, lời giải, chapter/lesson/skill;
- SHA-256 của từng bản ghi và SHA-256 của hai tệp nguồn.

Không yêu cầu tải JSON, nhập đáp án, xử lý từng bảng. Người kiểm định chỉ xử lý **bằng chứng toàn lô** và **ngoại lệ thực sự** (\`exclusions\`: ID kèm lý do). Khi sửa nguồn, SHA đổi và mọi chứng nhận của phiên bản cũ không còn hợp lệ cho bản mới.

## 3. Phê duyệt một lô bởi người có thẩm quyền

Cổng phát hành thực hiện qua workflow \`.github/workflows/aura-knowledge-protected-promotion.yml\` và GitHub Environment **\`aura-learning-approval\`**. Không được thay bằng nút public, localStorage hoặc "đã xem".

**Một lần thiết lập an toàn (quản trị GitHub / giáo viên có quyền):**

1. Tại GitHub repo → Settings → Environments, tạo Environment \`aura-learning-approval\`; cấu hình **Required reviewers** và hạn chế self-review. Mỗi lần phát hành cần một người duyệt độc lập với người chạy workflow. Nếu GitHub plan không hỗ trợ required reviewers, hệ thống không được xuất bản qua quy trình này.
2. Trên máy quản trị tin cậy chạy \`node scripts/create-knowledge-approval-keys.mjs\`. Khoá bí mật được ghi ở \`.aura_private/knowledge-approval/p256-private.pem\` (gitignored, quyền 0600); công cụ **không in hoặc gửi khóa bí mật**. Thêm nội dung PEM vào **Environment secret** \`AURA_KNOWLEDGE_P256_PRIVATE_KEY_PEM\`. Không dán private PEM vào chat, Issue, PR hoặc mã nguồn.
3. Chỉ đưa tệp công khai \`.aura_private/knowledge-approval/trust-public.json\` vào \`aura_data/approved_knowledge/trust.json\` trong Pull Request đã xem xét. Đây là khóa công khai dùng để xác thực P-256 trên trình duyệt.
4. Chạy \`node scripts/qa-knowledge-math6-v2.mjs\` và \`node scripts/knowledge-approval-pipeline.mjs status --output=.aura_private/math6-approval-preview.json\`. Báo cáo hiện **96 ứng viên** và SHA nguồn.
5. Giáo viên kiểm định nội dung/đáp án/độ khó từng chương (có thể theo lô) và lưu bằng chứng trong nơi kiểm soát truy cập. Cập nhật \`math6_v2_policy.json\`: \`batchReview.status="APPROVED_BY_QUALIFIED_REVIEWER"\`; \`educatorName\`, \`evidenceReference\` (chỉ mã/tài liệu tham chiếu, **không** đưa thông tin cá nhân nhạy cảm), và hai SHA nguồn từ báo cáo. Nếu một số câu chưa đạt, thêm mã + lý do vào \`exclusions\`. Không điền đáp án lại.
6. Commit thay đổi policy theo quy trình review GitHub. Chạy **AURA Knowledge — Protected Batch Approval & Signed Promotion** với \`version=v1.0.0\`. Job đầu kiểm tra đáp án và sự trùng khớp SHA nguồn. Job thứ hai phải chờ Required reviewer phê duyệt Environment.
7. Job sau khi chạy tiếp kiểm tra **thực sự** cấu hình bảo vệ Environment qua GitHub API và lịch sử chấp thuận trên đúng run; thiếu rule/duyệt, tự duyệt, hoặc thiếu secret: **FAIL CLOSED**.
8. Nếu đủ chứng cứ, ký ECDSA P-256/SHA-256 toàn bộ payload, đối chiếu lại khóa công khai và tạo một PR phát hành bất biến. GitHub auto-merge chỉ chạy khi nhánh chính cho phép; nếu không, PR được duyệt/merge theo quy định. Mỗi lần thay đổi nguồn lại yêu cầu phê duyệt phiên bản mới.

**Khóa lỗi:** Không có chứng thư/khóa/environment = **0 câu được duyệt**. Không có "duyệt tạm". Người đánh giá chưa được chứng thực là giáo viên thì cũng không nên cung cấp tuyên bố là đã qua kiểm định sư phạm.

## 4. Tự kết nối sang Practice Generator

Trang \`student-direct.html\` nạp \`approved_knowledge_runtime.js\` trước \`generator.js\` và \`smart_engine.js\`. Khi mở trang, runtime:

1. Đọc \`active.json\`; nếu không có \`SIGNED_ACTIVE\` thì trả mảng rỗng.
2. Đọc trust P-256 và manifest release với đường dẫn allowlist; so sánh SHA-256 manifest.
3. Xác thực chữ ký bằng **WebCrypto ECDSA SHA-256**, kiểm tra danh tính release, vùng sử dụng, đúng 96 ứng viên trừ các ID ngoại lệ, giới hạn câu/đáp án/kỹ năng, và SHA-256 **từng câu**.
4. Đọc lại **hai tệp nguồn hiện hành**; nếu nguồn bị sửa sau khi ký thì **tự thu hồi quyền sử dụng toàn bộ bản phát hành**.
5. Chỉ sau đó mới đưa câu đã duyệt vào \`auraMathSourcePool()\`; \`auraMathCandidatePool()\` dùng mã câu/skill/version, trộn vào ngân hàng luyện theo chiến lược đã có.

**Không sửa** các câu nguồn cũ, đề đã lưu, điểm thi, hay công cụ lớp học. Khi signer chưa được cấu hình, Generator tiếp tục hoạt động với nguồn cũ (không có 96 câu nháp).

### Weakness Map có nghĩa gì ở đây?

Weakness Map **không chứa câu học liệu**. Nó nhận sự kiện **đã chấm bài** từ Generator: khi học sinh làm sai một câu được duyệt, \`auraRecordSmartResult\` lấy \`skill\` của câu, cập nhật số lượt thấy/đúng/sai tại \`aura_smart_stats\` (lưu trong trình duyệt), từ đó chiến lược \`weak\` ưu tiên kỹ năng còn yếu.

Điều này là **gợi ý tự học cục bộ**, không phải bảng điểm hoặc xác nhận danh tính học sinh trên máy chủ. **Chưa có đồng bộ Supabase, tiến độ liên thiết bị hoặc kết quả kiểm tra chính thức** trong bước này.

## 5. Kiểm thử bắt buộc

- \`tests/knowledge-approval-gate.test.mjs\`: 96 ứng viên, 96 SHA câu; reject policy đang chờ, sai SHA nguồn, trùng phương án, thiếu giáo viên, sai run hoặc tự duyệt; chứng thực ký số hợp lệ, bản ký bị sửa không xác thực, khóa lạ không được tin, loại trừ ngoại lệ không nhập lại đáp án.
- \`tests/knowledge-approval-browser.mjs\`: dùng **cặp khóa P-256 tạo tạm trong CI**, tuyệt đối không dùng secret thật; giả lập đủ 96 câu được ký, kiểm chứng nguồn → Generator → chấm một câu sai → \`aura_smart_stats\` được cập nhật theo skill. Đồng thời thử nguồn chưa ký, sửa payload, giữ chữ ký nhưng đổi item SHA và sửa nguồn sau duyệt; tất cả phải bị chặn. Chromium giả lập iPad/phone/desktop.
- CI cần kiểm thử hồi quy cũ: 22 bài/66 câu, 30 ôn chương, 5 hình tương tác và các cổng không phát hành.
- Người dùng cần kiểm tra thực tế trên Safari/iPad và người có quyền GitHub cần cấu hình Environment và xác minh một release staging thật trước GO.

## 6. Triển khai/khôi phục

Phần xây dựng cổng và consumer có thể phát hành như **hạ tầng an toàn ở trạng thái chưa kích hoạt**, bởi \`trust.json\` trống và \`active.json\` ở \`NO_APPROVED_RELEASE\`. Để rollback, quay về nhánh backup trước triển khai; với bản release đã ký, cập nhật trusted active pointer bằng quy trình release đã được bảo vệ và bảo lưu hồ sơ cũ (không ghi đè manifest).

**Mốc đã hoàn thành:** tự tạo và chuẩn hóa 96 câu để gửi duyệt toàn lô; đã chuẩn bị đường ký phát hành và tự động kết nối học liệu đã ký với Generator/Weakness Map cục bộ.

**Mốc chưa đạt:** giáo viên ký xác nhận thực tế; cấu hình GitHub protected Environment/secret; tạo bản phát hành ký số thật; xác thực trên Safari iPad thật; cập nhật Weakness Map có định danh và backend; và cấp quyền Question Bank/Exam Engine chính thức.
