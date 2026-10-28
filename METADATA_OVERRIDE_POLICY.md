# AURA STUDY — Metadata Override Policy

## Nguyên tắc bất biến

**Metadata nguồn không bị sửa. Cách sử dụng có thể override theo quyết định của Admin/phụ huynh.**

AURA tách metadata thành 3 lớp:

1. **SOURCE** — nguồn thực sự ghi gì.
   - `sourceTerm`
   - `sourcePeriods`
2. **DEFAULT ASSIGNMENT** — AURA mặc định dùng tài liệu ở đâu dựa trên nguồn/phạm vi kiến thức.
   - `term`
   - `periods`
   - `assignmentBasis`
3. **MANUAL OVERRIDE** — quyết định sử dụng của Admin/phụ huynh.
   - nằm riêng trong `OVERRIDES`
   - `assignmentBasis: 'manual_admin_override'`
   - không thay đổi SOURCE hoặc DEFAULT ASSIGNMENT.

## Hai kiểu override

### `replace`

Dùng khi muốn chuyển phạm vi sử dụng sang kỳ khác.

Ví dụ nguồn là HK1 nhưng muốn dùng ở GK2:

```js
'review:SUBJECT:resource_id': {
  periods:['GK2'],
  mode:'replace',
  assignmentBasis:'manual_admin_override',
  reason:'Phụ huynh chủ động dùng lại nội dung HK1 trong GK2.'
}
```

Kết quả:

- SOURCE vẫn là HK1.
- DEFAULT ASSIGNMENT vẫn giữ nguyên.
- Student nhìn tài liệu ở GK2.
- AURA vẫn truy vết được vì sao tài liệu xuất hiện ở GK2.

### `add`

Dùng khi muốn giữ kỳ mặc định và đồng thời dùng thêm ở kỳ khác.

```js
'review:SUBJECT:resource_id': {
  periods:['GK2'],
  mode:'add',
  assignmentBasis:'manual_admin_override',
  reason:'Dùng lại kiến thức nền để ôn bổ sung trong GK2.'
}
```

Kết quả:

- Tài liệu vẫn xuất hiện ở kỳ mặc định.
- Đồng thời xuất hiện thêm ở GK2.
- Metadata nguồn không đổi.

## Quy tắc vận hành

- Không sửa `sourceTerm` hoặc `sourcePeriods` để làm tài liệu “trông như” thuộc kỳ khác.
- Không sửa file gốc chỉ vì thay đổi mục đích sử dụng.
- Mọi override phải có lý do (`reason`).
- Khi override tồn tại, Student dùng **effective periods**; Admin/registry vẫn giữ đầy đủ SOURCE + DEFAULT + OVERRIDE.
- Override có thể áp dụng cho cả `resources` và `banks`; với bank, quyền tạo đề theo kỳ cũng dùng effective periods.
- Nếu muốn hủy quyết định thủ công, xóa override; AURA tự quay về default assignment.

## Cách yêu cầu sau này

Có thể dùng ngôn ngữ tự nhiên, ví dụ:

- “Đưa bài này sang HK2.” → `replace`.
- “Giữ ở HK1 nhưng dùng thêm HK2.” → `add`.
- “Trả tài liệu về phân loại ban đầu.” → xóa override.

Nếu câu lệnh chưa nói rõ `replace` hay `add`, ưu tiên bảo toàn dữ liệu và xác định theo ý nghĩa của yêu cầu; không sửa SOURCE.
