# AURA STUDY — Toán 6, Tập 1 · V2.1: kiểm định sơ bộ, ôn tập cuối chương và trực quan

**Phạm vi:** bộ Toán 6 Tập 1 hiện có 5 chương, 22 bài do AURA biên soạn, 66 câu luyện gắn bài. Bổ sung **5 bài ôn tập cuối chương (30 câu mới)** và **5 hoạt động thao tác trực quan** độc lập. Không sao chép nội dung nguyên văn sách.

## Kiểm định nội dung: phân biệt tự động với sư phạm chính thức

- `scripts/qa-knowledge-math6-v2.mjs` chạy đối chiếu **66 đáp án bài học + 30 đáp án ôn chương** bằng bảng kết quả tính độc lập chuẩn bị riêng và kiểm tra từng câu có bốn phương án khác nhau, giải thích, tag kỹ năng, và bài học gốc.
- Đối chiếu 22 bài thuộc đúng chương, phát hiện nội dung giảng giải chưa đủ chiều sâu. Đã bổ sung **16 giải thích** quá ngắn thành lập luận có từng bước.
- Kiểm tra logic hàng số, tính chia hết, tính số nguyên, công thức hình học, đối xứng tại bộ ví dụ và bài tập đã đưa vào.
- **Giới hạn:** đây là bộ **machine/author preflight**, không phải chữ ký của nhà xuất bản hoặc giáo viên có thẩm quyền. Lời văn, độ khó, tính phù hợp phân kỳ, định hướng đánh giá và tính chính xác 100% chưa được giáo viên kiểm định độc lập. `teacherApproved=false` và `readyForQuestionBank=false` vẫn giữ.
- Báo cáo QA máy sinh trong GitHub Actions là `test-results/qa-math6-v2.json` (checksum SHA-256 hai nguồn). Nếu đáp án bị sửa trái bảng đối chiếu hoặc lệch coverage, CI thất bại.

## Ôn tập cuối chương

Bổ sung `aura_data/knowledge_math6_kntt_v2_chapter_reviews.json` (6 câu/chương), theo chủ đề:
1. Tập hợp, hệ số thập phân, thứ tự số tự nhiên, phép cộng/trừ, chia có dư, lũy thừa và thứ tự thực hiện phép tính.
2. Tính chia hết, nguyên tố, phân tích thừa số, ƯCLN và BCNN.
3. So sánh số nguyên, giá trị tuyệt đối, cộng/trừ, dấu ngoặc, nhân, chia.
4. Tam giác đều, hình vuông, hình bình hành, hình thoi, diện tích và chu vi.
5. Trục/tâm đối xứng, hình có/không có tâm đối xứng.

Mỗi câu gắn `sourceLessons`, `skill`, lời giải, khóa an toàn. **Mỗi bài trong tổng 22 bài gốc xuất hiện ít nhất một lần ở lô ôn chương**. Đây là 30 câu luyện mới, không phải phiên bản số hóa bài tập cuối chương gốc trong SGK.

## Hoạt động trực quan (không phụ thuộc ảnh SGK)

- Chương I: kéo điểm trên tia số 0–15 để nhận biết số liền trước/sau (đặc biệt số 0).
- Chương II: chọn ước chia 2/3/5/9, xem 60 số tự nhiên đầu được tô theo bội và kiểm tra số dư.
- Chương III: chọn hai số nguyên, phép cộng/trừ và quan sát vị trí kết quả trên trục số âm-dương.
- Chương IV: tăng/giảm chiều dài-rộng hình chữ nhật, đếm ô vuông và đối chiếu diện tích/chu vi.
- Chương V: thử hình vuông, hình chữ nhật, tam giác cân, hình bình hành với phép phản xạ trục dọc hoặc quay 180°.

Các hoạt động dùng DOM/SVG được tạo trực tiếp bằng mã, không tải hình từ nhà xuất bản hoặc liên hệ máy chủ chấm điểm.

## Trải nghiệm iPad và nguyên tắc chỉ hiện ngoại lệ

- Từ `knowledge-math6-v2.html`, bấm **Ôn tập 5 chương · 30 câu + 5 hoạt động trực quan** → `knowledge-math6-chapters.html`.
- Chọn chương, tương tác với mô hình, làm 6 câu, nhận phản hồi đúng/sai kèm lời giải.
- Sau khi nộp bài, các kỹ năng còn sai được gợi ý **Ôn lại Bài N**; không cần Admin tự phân loại lỗi từng câu.
- Chỉ lưu `aura_kntt_math6_v2_chapter_review_v1` trên thiết bị. Không ghi vào `aura_smart_stats`, `aura_wrong_book_v1`, `aura_generated_exam`, hệ thống học sinh hoặc các bảng Question Bank.

## Hợp đồng kết nối có kiểm soát — chưa kích hoạt

Phần ôn tập có đầy đủ `id`, `skill`, `sourceLessons`, nội dung và đáp án kèm lời giải. Đây là dữ liệu **sẵn cấu trúc** cho Practice Generator/Weakness Map. Nhưng **hiện không có bài nào đủ điều kiện được phát hành qua server**:

- Trước khi mở cổng: nhận bản đối chiếu chương trình/phiên bản đã kiểm tra; kiểm định độ chính xác từng câu/đáp án/thang; định danh người duyệt và quyền theo máy chủ; lưu SHA-256 nội dung; phê duyệt, version và audit log; kiểm thử trên staging.
- Khi server xác minh đầy đủ, chỉ câu có phê duyệt còn hiệu lực và SHA nguồn không đổi mới được đưa sang `auraMathCandidatePool` / `auraMathSourcePool` của Generator; khi học sinh nộp ở hệ thống có tài khoản và kết quả chấm được xác thực, `auraRecordSmartResult` mới cập nhật Weakness Map. Không lấy điểm bài luyện nháp trong localStorage làm kết quả chính thức.
- **Không triển khai một endpoint hay công tắc public giả tạo để biến `teacherApproved=true` thành phê duyệt thật.** Hệ thống hiện tại không có cổng phê duyệt server-side phù hợp cho thư viện này.
- `questionBankPromotionEnabled=false`, `weaknessMapWriteEnabled=false`, `teacherReviewed=false` luôn duy trì trong bản V2.1.

## QA thực hiện

Node test cho 5×6 câu, 22 bài coverage, ngăn rò sang khóa kết quả chính; báo cáo tính đáp án 96 câu. Chromium giả lập iPad 820×1180, điện thoại 390×844, desktop 1366×900 kiểm tra 5 thao tác trực quan, nộp 5/6, gợi ý bài 21, lưu sau refresh, không tràn ngang, không gọi mạng ngoài. Kiểm tra hồi quy 22 bài học hiện tại.

**Còn chờ:** giáo viên thực sự duyệt sư phạm, bản in chính thức được đối chiếu, iPad Safari thực tế, hệ thống phê duyệt và nhập Bank/Generator/Weakness Map có audit/rollback. Không đánh dấu production GO khi chưa đủ các gate.
