# AURA STUDY — Knowledge Library V2 · Toán 6 Tập 1

## Trạng thái phát hành

**DRAFT PREVIEW.** Thư viện độc lập phục vụ xem bài và luyện nhanh; **không** phải bản SGK sao chép, đáp án chính thức, hoặc kho đề đã phê duyệt. Chưa được đánh dấu kiểm định sư phạm.

## Phạm vi nội dung

- Đối chiếu **mục lục** Toán 6 tập 1 thuộc bộ *Kết nối tri thức với cuộc sống*, gồm **5 chương, 22 bài học chính**, theo thứ tự 1–22.
- Cấu trúc chương: I (Bài 1–7, tập hợp số tự nhiên); II (Bài 8–12, chia hết); III (Bài 13–17, số nguyên); IV (Bài 18–20, hình phẳng); V (Bài 21–22, đối xứng).
- **22 bài giảng mới** do AURA tự biên soạn, mỗi bài có mục tiêu, 2–3 ý kiến thức trọng tâm, ví dụ giải theo bước, lỗi thường gặp và **3 câu trắc nghiệm mới có lời giải** (tổng **66 câu**).
- Các phần *Luyện tập chung*, bài tập cuối chương và hoạt động thực hành được ghi nhận ở mục lục nhưng **chưa phải bài độc lập trong bản V2 này**.
- Nguồn căn cứ chỉ là **mục lục công khai**, chưa được đối chiếu toàn văn với bản in chính thức: https://ihoc.vn/sgk/lop-6/toan-hoc-lop-6/sach-giao-khoa-toan-lop-6-tap-1-ket-noi-tri-thuc-voi-cuoc-song.html và https://sgkvn.com/lop-6-3/ket-noi-tri-thuc-voi-cuoc-song-3/toan-6-tap-1-90.html . Nguồn ban đầu do chủ sở hữu cung cấp: https://giaokhoaonline.com/ket-noi-tri-thuc-voi-cuoc-song-lop-6/

## Truy cập

- Từ **AURA Học sinh → Bài học → Toán**, chọn thẻ **Toán 6 Tập 1 — Knowledge Library V2**.
- Hoặc trực tiếp: https://brunoquoc.github.io/aura-study/knowledge-math6-v2.html (chỉ sau khi phát hành GitHub Pages).
- Bộ chọn 5 chương, tìm theo tên bài, điều hướng bài trước/sau, ví dụ có lời giải, thực hành 3 câu và đáp án giải thích.
- Tiến độ học và luyện lưu riêng ở khóa trình duyệt `aura_kntt_math6_v2_progress_v1`. Không tự đồng bộ giữa thiết bị, không chuyển vào thống kê thi, lịch sử kết quả, Weakness Map hoặc Exam Engine. Không có cơ chế tài khoản và đồng bộ máy chủ mới ở trang này.

## Bảo toàn và cổng an toàn

- **Không sửa** các 5 sơ đồ Lesson Maps Toán hiện tại, không sửa `lesson_maps.js`, `aura_data/math6`, Question Bank, Drive, Auto Grading, Supabase, hay dữ liệu học sinh.
- Schema `schemaVersion=2`; mỗi bài `DRAFT_ORIGINAL_AURA`, `requiresPedagogicalReview=true`, `readyForQuestionBank=false`.
- `rollout.questionBankPromotionEnabled=false` và `rollout.examEngineLinkEnabled=false`: dữ liệu luyện nhanh là câu mới phục vụ tự học, không được tự dùng làm đề thi.
- Trang đọc fail-closed khi thiếu hoặc lệch 22 bài, 66 câu hoặc trạng thái an toàn; không render HTML từ dữ liệu học liệu (dùng `textContent`).
- Nguồn có bản quyền: chỉ sử dụng tên chương/bài để đối chiếu. Ví dụ và câu luyện được soạn mới, không sao chép nguyên văn SGK, trang sách hay hình gốc.

## QA và phát hành

- Node test xác minh đủ 5 chương/22 bài/66 câu; 22 bài có nội dung thực; đáp án hợp lệ, kiểm tra mẫu toán, nguồn và trạng thái an toàn; kiểm tra tính tách biệt với Lesson Maps V1.
- Chromium test với iPad 820×1180, điện thoại 390×844, desktop 1366×900: chọn chương, làm 3 câu có giải thích, lưu và khôi phục tiến độ, tìm bài thuộc chương khác, không tràn ngang.
- Cần **QA thật trên iPad Safari** trước khi đánh dấu chính thức. Nên ưu tiên kiểm định sư phạm từng bài/đáp án trước khi chuyển nguồn sang Question Bank.
- Rollback mã nguồn qua nhánh backup tạo trước khi merge.

## Công việc chưa hoàn thành

1. Đối chiếu mục lục với sách in chính thức (trường hoặc nhà xuất bản) và rà soát sư phạm từng phần.
2. Soạn riêng các bài *Luyện tập chung*, bài tập cuối chương, dự án thực hành; bổ sung hoạt động trực quan/ứng dụng.
3. Mở rộng chuẩn dữ liệu để Practice Generator và Weakness Map đọc kỹ năng đã được kiểm duyệt (chưa bật).
4. Chứng thực nghiệm thu iPad Safari và giữ khả năng chỉnh sửa, hoàn nguyên trước bản phát hành chính thức.

**Mốc rõ ràng:** Đây là V2 preview có đủ **22 bài có nội dung và 66 câu luyện**, không phải bản thay thế trọn vẹn SGK hoặc tuyên bố đã tự động hóa hoàn toàn Knowledge Library tất cả môn.
