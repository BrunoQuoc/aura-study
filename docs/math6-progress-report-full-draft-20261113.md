# AURA STUDY — Báo cáo Toán 6: Đã biên soạn 43/43 bài chính, CHƯA nghiệm thu chính thức

**Ngày:** 13/11/2026. **Phạm vi:** chỉ Toán 6 KNTT tập 1 và tập 2; không sửa thiết kế học tập của môn khác.

## 1. Kiểm kê kết quả có nội dung thật

| Phạm vi | Bài chính biên soạn | Luyện theo bài | Ôn chương | Tương tác | SVG minh họa |
|---|---:|---:|---:|---:|---:|
| Tập 1, Chương I–V | 22/22 | 66 | 30 | 5 | Có từ trước |
| Tập 2, Chương VI — Phân số | 5/5 | 15 | 6 | 0 | 0 |
| Tập 2, Chương VII — Số thập phân | 4/4 | 12 | 6 | 2 | 0 |
| Tập 2, Chương VIII — Hình học | 6/6 | 18 | 6 | 2 | 6 hình SVG mới |
| Tập 2, Chương IX — Thống kê/xác suất | 6/6 | 18 | 6 | 2 | 6 hình SVG mới |
| **Tổng lõi** | **43/43 bài chính (100% bản nháp)** | **129 câu** | **54 câu** | **11 hoạt động** | **12 SVG mới ở Tập 2** |

Ngoài lõi, thư viện tự luyện cuối năm đã thêm **12 câu trắc nghiệm + 6 đề tự luận có rubric 10 điểm mỗi đề**. Tổng là **195 câu trắc nghiệm bản nháp** (183 lõi và 12 cuối năm), **6 bài tự luận**. Số bài chính 43/43 không đại diện 100% nội dung toàn SGK hoặc kiểm định sư phạm; còn luyện tập chung, thực hành/trải nghiệm và kiểm tra, các đề tự luận bổ sung.

## 2. Công việc trong đợt Chương IX

- Bài 38–43 có mục tiêu, giải thích, ví dụ làm theo bước, lỗi thường gặp và **18 câu luyện có đáp án, giải thích, skill**.
- Sáu mô hình biểu diễn dữ liệu **SVG AURA tự dựng** gắn trực tiếp vào bài: khảo sát phân loại 20 bạn (8,7,5), biểu đồ tranh 1 hình=2 quyển, biểu đồ cột 6/9/5, cột kép hai lớp qua hai ngày, sáu kết quả xúc xắc có thể, tần suất thực nghiệm đồng xu 12 ngửa/8 sấp trên 20 lượt.
- Hai thao tác trực quan tại knowledge-math6-statistics-review.html: kéo thay đổi cột Cam và tính lại tổng/chênh lệch; đổi số lần tung đồng xu trong mô phỏng giả ngẫu nhiên ổn định. **Mô phỏng không phải dữ liệu đo thật**, nên không dùng để chứng minh xác suất lý thuyết hay bảo đảm kết quả lần kế.
- Sáu câu ôn ChIX có **datasetFacts** ghi số lượng, chú giải, nhóm so sánh, kết quả có thể và số lần sự kiện; học sinh sai được dẫn về Bài 38–43. Kết quả chỉ lưu ở khóa riêng, kèm SHA nguồn.
- Ôn ChVI có thêm 6 câu gắn Bài 23–27, khắc phục thiếu bộ ôn riêng trước đây.
- Ôn hai tập có 12 trắc nghiệm luyện thử và 6 bài tự luận, rubric từng bước tổng 10 điểm mỗi bài. Tự luận giữ cờ requiresHumanReview=true, autoGradeAllowed=false, readyForExamEngine=false; giao diện không tự chấm tự luận, không chuyển đáp án viết lên backend.

## 3. Kiểm soát chất lượng, dữ kiện và pháp lý

- Nguồn đối chiếu cấu trúc: mục lục công khai tại NXB Giáo dục Việt Nam https://sachdientu.nxbgd.vn/thu-vien-so/doc-sach/shs-toan-tap-2.4491552782. Chỉ dùng phạm vi chương/bài, **không** sao chép văn bản/hình ảnh/bài giải SGK.
- Bảng đáp án độc lập cho 18 câu ChIX, 6 ôn ChVI, 6 ôn ChIX, 12 trắc nghiệm cuối năm. QA còn kiểm tra 6 rubric đúng tổng 10 điểm, đủ bước giải và cờ yêu cầu giáo viên xác nhận.
- Kiểm toán độ nhất quán dữ liệu: khảo sát 8+7+5=20, biểu đồ tranh 4+3+5 biểu tượng mỗi cái 2 sách=24 sách, cột 6+9+5=20, hai lớp 6A 6+8=14, 6B 4+7=11, mặt ngửa 12/20=60%, sự kiện 12/40=30%, phép tính phần trăm/đoạn thẳng.
- Kiểm thử trình duyệt giả lập iPad 820×1180, phone 390×844 và desktop 1366×900, bao gồm các tương tác SVG, mô phỏng thống kê, ôn ChVI/IX, trắc nghiệm cuối năm, rubric mở/ẩn, lưu điểm nháp và không lưu bài tự luận, hồi quy toàn Tập1 và các chương Tập2 cũ. **Không thể coi Chromium giả lập là chứng nhận Safari trên iPad thật.**
- Nếu bất kỳ kiểm thử nguồn, hình, đáp án hoặc cổng an toàn không PASS, nhánh thay đổi **không được merge**.

## 4. Quyền sử dụng và giới hạn thực tế

- Cả hai tập vẫn là học liệu **bản nháp**. teacherReviewed=false; questionBankPromotionEnabled=false; examEngineLinkEnabled=false; weaknessMapWriteEnabled=false.
- Cổng phê duyệt P-256 hiện chỉ mô hình hóa **96 câu Tập1**, active pointer tiếp tục NO_APPROVED_RELEASE. Chưa xác nhận giáo viên đủ thẩm quyền, chưa có signer/Environment được kiểm tra; không tự thêm câu Tập2 hoặc tổng hợp cuối năm vào nguồn được phê duyệt.
- Trắc nghiệm Tập2/cuối năm chỉ ghi kết quả **luyện cục bộ trong trình duyệt**, không ghi điểm thi chính thức hay Weakness Map server. Bài tự luận không tự chấm.
- Chưa có đồng bộ tiến độ liên thiết bị, giáo viên nhận bài tự luận hoặc xác thực server cho người duyệt.
- Không chạm Supabase, Drive Inbox, tài khoản/điểm học sinh thật, hay Ngữ văn/Tiếng Anh/môn khác.

## 5. Những việc bắt buộc trước khi coi môn Toán hoàn tất

1. Kiểm tra chi tiết độ khớp chương trình với sách trường đang dùng, sửa tất cả ngoại lệ, bổ sung các mục **luyện tập chung, hoạt động thực hành/trải nghiệm** chưa được dựng thành nội dung độc lập, xây đề thi đa dạng và bài tập có hình.
2. Giáo viên có chuyên môn kiểm định hai tập theo SHA phiên bản, kiểm tra tính đúng sư phạm, độ khó, bài tự luận, rubric, câu hỏi có dữ kiện hình và nguồn.
3. Cấu hình quyền duyệt độc lập và ký khóa P-256 trên GitHub Environment an toàn. Mở rộng cơ chế phê duyệt cho nguồn Tập2 và các đề cuối năm, không tái dùng chữ ký 96 câu Tập1 để cấp quyền cho nguồn khác.
4. Chỉ khi có release hợp lệ mới nối các câu đạt chuẩn vào Practice Generator; Weakness Map cập nhật từ **bài đã chấm**, không từ tự đánh dấu đã học. Đối với tự luận, cần bộ chấm theo rubric có người kiểm định và chính sách review kết quả trước khi dùng chính thức.
5. Kiểm thử thực tế Safari/iPad, hiệu năng, khả năng truy cập, backup và rollback trước GO.

**Kết luận:** 43/43 bài chính đã có bản nháp AURA nguyên gốc; **chưa được công nhận hoàn tất nội dung toàn SGK hay vận hành chính thức**.
