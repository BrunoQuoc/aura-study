# AURA STUDY — Mobile Chart QA v3: kiểm tra phiên Admin

**Ngày:** 13/11/2026. **Phạm vi:** Toán 6 KNTT Tập 2, Chương IX, 23 SVG Bài 39–41. **Môi trường:** Supabase Staging / GitHub Pages.

## Thay đổi đã triển khai

- Trang độc lập `admin-chart-review.html` sử dụng API `chart_gallery`, không phụ thuộc việc tải toàn bộ 54 câu Chương IX.
- Bổ sung gia hạn phiên Admin theo nhu cầu với `POST /auth/v1/token?grant_type=refresh_token`, dùng publishable key (không có server secret trong browser). Trường hợp bị 401 hoặc 403 chỉ rõ cần đăng nhập lại trong cùng Safari.
- Kiểm tra đồng thời sử dụng cùng một yêu cầu gia hạn (tránh gửi nhiều yêu cầu refresh trùng lặp).
- Nút mở trên Admin V2 dẫn đến `admin-chart-review.html?v=3` để thay đổi cache key sau bản sửa.
- Giữ quy trình mở/phóng to/thu nhỏ, đánh dấu từng hình, đủ 23/23 mới có thể ghi biên bản `aura_visual_device_attest_v2`.
- Không thay đổi chế độ khóa Exam Engine hoặc phê duyệt sư phạm.

## Bằng chứng kiểm tra trong phiên phát triển

| Phép thử kỹ thuật | Kết quả |
|---|---|
| Phiên còn hạn dùng access token hiện có | PASS |
| Phiên hết hạn gia hạn thành công; hai yêu cầu đồng thời dùng chung refresh | PASS |
| Chưa có phiên: báo đăng nhập lại cùng Safari | PASS |
| API trả 403: thông báo quyền Admin chưa hợp lệ | PASS |
| API trả 401: không tự thử lại vô hạn | PASS |
| Bộ dữ liệu độc lập trả đúng 23 hình | PASS |
| API không cấp RPC gọi trực tiếp cho anon/authenticated | PASS |
| Cú pháp JavaScript trang xem biểu đồ | PASS |
| Nghiệm thu thực tế bằng iPhone mới | **CHƯA CÓ DỮ LIỆU** |

**Audit:** `AURA-ADMIN-IPHONE-CHART-V3-AUTH-REGRESSION-20261113`.

## Giới hạn và cổng nghiệm thu

Kiểm thử mô phỏng và tĩnh không chứng minh Safari iPhone thật vận hành trọn vẹn. Chỉ khi Admin thực sự mở xem đủ 23 hình, đánh dấu và lưu biên bản trên điện thoại thì Staging mới ghi nhận lượt nghiệm thu thiết bị.

Các câu hỏi chưa phê duyệt sư phạm không được xuất bản: thời điểm ghi báo cáo có **402 câu, 1 đã duyệt, 401 chờ duyệt; 30 cảnh báo QA còn mở**. Auto Grading live và Exam Engine tiếp tục khóa.

- [Màn hình biểu đồ cho iPhone](https://brunoquoc.github.io/aura-study/admin-chart-review.html?v=3)
- [Admin V2](https://brunoquoc.github.io/aura-study/admin-ch08-review.html)
