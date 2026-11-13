# AURA STUDY — Báo cáo Toán 6: 43/43 bài chính đã có bản nháp; chưa nghiệm thu sư phạm
Ngày: 13/11/2026 (Việt Nam). Phạm vi chỉ Toán lớp 6 Kết nối tri thức, giữ nguyên thiết kế các môn khác.

## Kết quả kiểm kê trên nhánh chính đã hòa giải
| Nội dung | Số lượng bản nháp |
|---|---:|
| Tập 1 — 22 bài học chính | 22/22 |
| Tập 2 — Bài 23–43 | 21/21 |
| **Tổng bài chính được biên soạn** | **43/43** |
| Luyện tập trong bài Tập 1 + Tập 2 | 66 + 63 = **129 câu** |
| Ôn Chương I–V và VI–IX | 30 + 24 = **54 câu** |
| Ôn cuối năm hai tập | **12 câu trắc nghiệm** |
| **Tổng trắc nghiệm bản nháp** | **195 câu** |
| Tự luận cuối năm | **6 bài, rubric 10 điểm/bài** |
| Hoạt động trực quan có tương tác | 5 Tập 1 + 2 ChVII + 2 ChVIII + 2 ChIX = **11** |
| Hình SVG tĩnh mới của ChVIII | **6 hình** |

Đây là mức độ bao phủ **43 bài chính** bằng tài liệu do AURA tự biên soạn, không đồng nghĩa đạt 100% mọi tiết luyện tập chung, thực hành, trải nghiệm, ôn SGK hay nghiệm thu sư phạm.

## Phần Chương IX đã triển khai trước đợt này
Chương IX Bài 38–43 gồm dữ liệu và thu thập, bảng thống kê/biểu đồ tranh, biểu đồ cột, cột kép, sự kiện của phép thử và xác suất thực nghiệm. 18 câu luyện trong bài, 6 câu ôn chương; trang mô phỏng biểu đồ cột A/B/C, thay đổi tần suất minh họa trong 20 lượt. Nội dung và hai mô hình tương tác là dữ liệu AURA tự tạo. Tiến độ này đến từ bản chính đã hợp nhất và được giữ nguyên, không bị thay nội dung khi bổ sung phần ôn.

## Phần bổ sung ôn cuối năm ở đợt này
- **Ôn Chương VI:** 6 câu gắn Bài 23–27, có đáp án, lời giải, kỹ năng và cờ chờ giáo viên.
- **Ôn cả năm:** 12 câu trắc nghiệm liên kết nguồn ở cả hai tập; 6 bài tự luận có lời giải theo bước và rubric 10 điểm chia theo tiêu chí.
- Trắc nghiệm dùng để **luyện thử trên thiết bị**, điểm có dấu vết SHA câu hỏi và tự vô hiệu hóa khi dữ liệu thay đổi; bài sai dẫn đến đúng bài lý thuyết.
- **Tự luận không tự chấm**: học sinh nhập lời giải vào ô tạm thời, so sánh lời giải mẫu/rubric; văn bản tự luận không được lưu hoặc gửi backend. Các rubric phải được giáo viên kiểm định.
- Phần mềm được bổ sung vào Toán 6 Tập 2 với các liên kết ChVI và ôn cuối năm, không thay đổi nội dung ChIX đang hoạt động.

## Điều kiện chất lượng, bản quyền, bảo mật
- Nguồn đối chiếu chỉ là mục lục công khai NXB Giáo dục Việt Nam, không nhập toàn văn hay hình SGK có bản quyền. Cần giáo viên kiểm định khớp sách bản in và lộ trình trường.
- Các bài V1/V2 và câu bổ sung **chỉ là bản nháp chưa được giáo viên phê duyệt**. Tập 2 giữ teacherReviewed=false, questionBankPromotionEnabled=false, examEngineLinkEnabled=false, weaknessMapWriteEnabled=false. Cổng ký hiện chỉ dùng nguồn 96 câu Tập 1, vẫn NO_APPROVED_RELEASE.
- Không được dùng trắc nghiệm bản nháp hay tiêu chí tự luận để tính điểm thi, cập nhật Weakness Map chính thức hoặc tự xuất câu vào Question Bank. Chỉ một bản phát hành có chứng cứ phê duyệt của người có thẩm quyền gắn SHA mới được đi vào Practice Generator sau này.
- Không thay đổi Supabase production, Drive, điểm thi, học sinh hay học liệu môn khác.

## Nghiệm thu trước GO
1. Bổ sung từng tiết luyện tập chung, thực hành, trải nghiệm có nguồn kiểm chứng và các bài tự luận theo dạng Toán.
2. Kiểm toán đáp án độc lập, câu có hình và rubric theo chuẩn sư phạm; kiểm định giáo viên có chứng cứ gắn SHA nguồn cho cả hai tập.
3. Thiết lập quyền phê duyệt độc lập và khóa ký an toàn; mở rộng phát hành Tập 2 và đề cả năm theo phiên bản, không dùng chữ ký Tập 1 thay thế.
4. Chỉ cập nhật Weakness Map từ bài đã chấm được xác thực, không lấy điểm localStorage làm điểm chính thức.
5. Test Safari iPad thực, backup/rollback, tính truy cập và khả năng chịu lỗi trước GO.
