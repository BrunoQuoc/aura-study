# AURA STUDY — Toán 6 KNTT: kế hoạch hoàn thiện riêng môn Toán

**Ưu tiên chủ sở hữu 2026-11-13:** Hoàn thiện môn Toán trước. Không thiết kế lại các môn khác và không đưa nguyên một cấu trúc Toán áp đặt lên Ngữ văn/Tiếng Anh/KHTN.

## Phạm vi & bằng chứng

- **Tập 1 / Chương I–V:** 22 bài (Bài 1–22) / 66 luyện theo bài + 30 ôn cuối chương / 5 hoạt động trực quan; chất lượng **DRAFT**, chưa giáo viên ký duyệt, 0 câu mới được nhập Question Bank chính thức.
- **Tập 2 / Chương VI–IX:** 21 bài (Bài 23–43) theo **mục lục công khai từ Nhà xuất bản Giáo dục Việt Nam**, đối chiếu thêm danh mục ihoc.vn. Đây là xác nhận cấu trúc mục lục, **không phải** chứng thực bản in đang học tại trường hay toàn văn bản quyền.
  - Chương VI — Phân số: Bài 23–27 (**5 bài biên soạn mới / 15 câu luyện mới / ĐÃ CÓ BẢN NHÁP THẬT**).
  - Chương VII — Số thập phân: Bài 28–31 (**4 bài CHƯA BIÊN SOẠN**).
  - Chương VIII — Những hình hình học cơ bản: Bài 32–37 (**6 bài CHƯA BIÊN SOẠN**).
  - Chương IX — Dữ liệu và xác suất thực nghiệm: Bài 38–43 (**6 bài CHƯA BIÊN SOẠN**).
  - Các hoạt động thực hành/trải nghiệm, luyện tập chung, ôn cuối chương và ôn cuối năm: **chưa đủ để xem là toàn bộ SGK hoàn chỉnh**.

## Hạng mục hoàn thành trong lô đầu Tập 2

- \`aura_data/knowledge_math6_kntt_volume2_v1.json\`: toàn bộ 21 nhan đề trong \`outline\` để kiểm soát coverage, chỉ **5 bài có nội dung** trong \`lessons\`. Các chương VII–IX có \`NOT_AUTHORED\`, không dựng bài rỗng.
- Mỗi Bài 23–27 gồm mục tiêu, 3 khái niệm/quy tắc, ví dụ giải theo ít nhất 3 bước, lưu ý lỗi thường gặp, 3 câu trắc nghiệm có lời giải/skill. Tổng 15 câu AURA biên soạn độc lập.
- \`knowledge-math6-volume2.html\` và \`knowledge_math6_volume2.js\`: trang học riêng trên iPad, chọn 5 bài đầu, tự đánh dấu đã học, luyện 3 câu, xem giải thích, tìm bài và lưu kết quả cục bộ dưới **key Tập 2 riêng**.
- Từ Student → Bài học → Toán, có đường dẫn Tập 2 riêng bên cạnh Tập 1. Không sửa nội dung Tập 1.
- Đáp án được kiểm định bằng bảng lựa chọn thủ công trong \`tests/knowledge-math6-volume2-fractions.test.mjs\`, không chỉ test tự đối chiếu với cùng một JSON.
- CI Chromium 820×1180 iPad, 390×844 điện thoại, 1366×900 desktop; ngăn tràn ngang, xác nhận 3 chương chưa có bài không thể chọn, kết quả cục bộ tồn tại sau refresh, không rò sang điểm thi Tập 1/Weakness Map.

## Cổng an toàn chưa mở

- \`DRAFT_PREVIEW_PARTIAL\`, \`teacherReviewed=false\`, \`questionBankPromotionEnabled=false\`, \`examEngineLinkEnabled=false\`, \`weaknessMapWriteEnabled=false\`.
- Không thay đổi cổng ký phê duyệt của **96 câu Tập 1**; **15 câu Tập 2 chưa được gửi vào cổng ký**, không tính thành 111 câu đã được giáo viên duyệt.
- Không nhân bản văn bản SGK, hình SGK, câu hỏi nguyên văn; chỉ mượn tiêu đề chương/bài đối chiếu và tự soạn lý thuyết, ví dụ, đáp án. Cần kiểm định chuyên môn độc lập trước khi bật trong đề chính thức.
- Không có Supabase/Auth/RLS, Grade/Question Bank, Google Drive, học sinh hoặc lịch sử thi nào bị thay đổi.

## Trình tự còn lại để nói "Toán 6 hoàn thiện"

1. Bài 28–31 số thập phân: bài học, ví dụ, câu hỏi, mô hình làm tròn và phần trăm.
2. Bài 32–37 hình học: bài, hình SVG AURA nguyên gốc, hoạt động đo hình/góc; kiểm tra hình đủ dữ kiện.
3. Bài 38–43 thống kê & xác suất thực nghiệm: biểu đồ, bảng dữ liệu, mô phỏng thống kê và câu ứng dụng; cách kiểm định dữ liệu được ghi.
4. Ôn tập theo chương Tập 2, bài ứng dụng thực tế, luyện tập chung, ôn cuối năm (biên soạn AURA, không sao chép SGK); đánh dấu lộ trình coverage rõ.
5. Kiểm tra sư phạm hai tập trên đúng nguồn và người duyệt có thẩm quyền; đối chiếu đáp án/diễn giải/trường hợp biên, lưu provenance và chữ ký riêng theo từng phiên bản.
6. Kết nối các câu **đã duyệt thật**, qua cổng có khóa ký và quyền duyệt độc lập, sang Practice Generator và Weakness Map **khi có kết quả đã chấm**, không coi học thử là điểm chính thức.
7. Test Safari/iPad thực, reset/backup/restore và rollback; chỉ sau đó xem xét đề xuất GO cho từng module cụ thể.

## Mốc nghiệm thu

**Stage Math6-V2-Vol2-Fractions = DRAFT PREVIEW**, không phải "Toán hoàn thiện". Kết thúc của đợt đầu phải có đủ 5 bài thật với 15 câu và QA PASS; không được tăng KPI phần còn thiếu bằng các trang tiêu đề.

Tham khảo: [Mục lục NXBGD — Toán 6 Tập 2](https://sachdientu.nxbgd.vn/thu-vien-so/doc-sach/shs-toan-tap-2.4491552782), [Mục lục đối chiếu](https://ihoc.vn/sgk/lop-6/toan-hoc-lop-6/sach-giao-khoa-toan-lop-6-tap-2-ket-noi-tri-thuc-voi-cuoc-song.html), \`docs/knowledge-library-math6-volume1-v2.md\`, \`docs/knowledge-approval-versioned-promotion.md\`.
