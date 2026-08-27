# Bẫy kỹ thuật đã giẫm phải

> **Lịch sử cập nhật:** xem mục cuối file — mỗi lần sửa thêm một dòng, không ghi đè dòng cũ.

Những lỗi dưới đây đều đã thật sự xảy ra trong dự án này và đều tốn thời gian dò.
Ghi lại theo lối **triệu chứng → nguyên nhân → cách sửa**, vì lần sau gặp lại thì
thứ bạn có trong tay là triệu chứng chứ không phải nguyên nhân.

---

## 1. Component ghép của Mantine dùng trong Server Component → trang 500

**Triệu chứng.** Trang trả `500`, log server ghi:

```
Error: Element type is invalid: expected a string (for built-in components)
or a class/function (for composite components) but got: undefined.
```

Không chỉ ra file nào, không chỉ ra component nào.

**Nguyên nhân.** Mantine là client component. Khi một Server Component import
`Table`, nó chỉ nhận **một tham chiếu** tới component đó, không nhận các thuộc
tính tĩnh gắn kèm. Nên `Table.Tbody`, `List.Item`... là `undefined`.

Dính: `Table.*` (`Thead`, `Tbody`, `Tr`, `Th`, `Td`, `ScrollContainer`),
`List.Item`, và nhiều khả năng cả `Tabs.*`, `Menu.*`, `Accordion.*`.

**Cách sửa.** Bọc phần dùng component ghép vào một client component riêng —
`src/components/admin/AdminUserTable.tsx` và `AdminPaymentTables.tsx` làm đúng
vậy. Với chỗ chỉ cần vài dòng thì thay bằng `Stack` + `Group` + `Text` cũng
được, và thường hợp mobile hơn.

**Tìm chỗ còn dính:**

```bash
grep -rn "^\s*<\(List\|Table\|Tabs\|Menu\|Accordion\)\.[A-Z]" src/ --include=*.tsx | cut -d: -f1 | sort -u | xargs -I{} sh -c 'head -1 {} | grep -q "use client" || echo "SERVER: {}"'
```

Neo `^\s*` là cố ý: không có nó, lệnh bắt luôn cả những dòng **comment** cảnh báo
"đừng dùng `<Table.Tr>`" nằm trong chính các file đã sửa đúng, và báo nhầm hai
file `src/app/checkout/`. Vẫn nên liếc qua kết quả chứ đừng tin tuyệt đối.

**Ghi chú về cách chẩn đoán.** Lần đó tôi dựng một route thử tạm chỉ chứa đúng
`<Table.Tbody>` để chứng minh, thay vì đoán. Mất một phút và cho câu trả lời
chắc chắn. Lưu ý thư mục bắt đầu bằng `_` **không** thành route trong App Router.

---

## 2. `\s` trong template literal bị nuốt mất dấu gạch chéo

**Triệu chứng.** Regex dựng bằng `new RegExp` không khớp gì cả, dù nhìn hoàn toàn
đúng.

**Nguyên nhân.** JavaScript bỏ dấu gạch chéo của những escape nó không hiểu.
Trong template literal, `` `^##\s+` `` cho ra chuỗi `^##s+` — regex đi tìm chữ
cái `s`, không phải khoảng trắng. `\b`, `\d`, `\w` cũng vậy.

**Cách sửa.** Dùng `String.raw`, vẫn nội suy `${}` được:

```ts
new RegExp(String.raw`^#{2,3}\s+Bài tập\s+${code}\b.*$`, 'm')
```

Xem `src/lib/sheet-embed.ts`.

---

## 3. Đếm số test là chưa đủ — phải đếm số FILE test

**Triệu chứng.** `vitest` in `Tests 103 passed (103)`, xanh hết, nhưng vài test
đã âm thầm ngừng chạy. Dòng thật sự cần đọc nằm ngay trên:

```
Test Files  1 failed | 7 passed (8)
Tests       103 passed (103)
```

**Nguyên nhân.** Một file test **không nạp được** thì mọi test trong đó biến mất
khỏi tổng số, chứ không bị tính là trượt. Lần này là do một module đang được test
lỡ import module có `server-only`.

**Cách sửa.** Luôn đọc dòng `Test Files`, không chỉ dòng `Tests`. Số file test
giảm mà không ai đụng vào là dấu hiệu có file hỏng.

---

## 4. `server-only` và cách chia đôi module

**Nguyên tắc.** File nào có `import 'server-only'` thì **vitest không nạp được**,
và mọi module import nó (dù gián tiếp) cũng chịu chung số phận.

**Cách làm trong dự án này** — tách đôi, phần thuần để test:

| Phần thuần (test được) | Phần `server-only` |
|---|---|
| `src/lib/admin-allowlist.ts` | `src/lib/admin.ts` |
| `src/lib/env-schema.ts` | `src/lib/env.ts` |
| `src/lib/access.ts` | `src/lib/access-server.ts` |

Hàm cần cấu hình thì **nhận qua tham số** thay vì tự đọc `env` — như
`getBankAccount(config)` trong `src/lib/payment/vietqr.ts`. Vừa giữ file thuần,
vừa test được ca thiếu cấu hình.

---

## 5. `.next/` giữ lại kiểu của route cũ

**Triệu chứng.** Sau khi đổi tên thư mục route, `tsc --noEmit` báo lỗi kiểu
`Cannot find module '../../src/app/nhat-ky/page.js'` — trỏ vào đường dẫn vừa xoá.

**Nguyên nhân.** Next sinh `.next/types/validator.ts` theo cây route cũ.

**Cách sửa.** `rm -rf .next`. Đây là lỗi ma, không phải lỗi mã nguồn.

---

## 6. Drizzle `$defaultFn` không tạo default ở database

**Triệu chứng.** Chèn bằng SQL thô báo `ReportNotNullViolationError` ở cột `id`,
dù schema có `.$defaultFn(() => crypto.randomUUID())`.

**Nguyên nhân.** `$defaultFn` chạy **ở tầng Drizzle**, không phải `DEFAULT` của
Postgres. Đi đường khác là không có gì sinh `id`.

**Cách sửa.** Script chạy tay phải tự cấp `id` (`randomUUID()` từ `node:crypto`),
hoặc dùng chính hàm của ứng dụng thay vì viết SQL thô.

---

## 7. Mã bài tập KHÔNG duy nhất trong giáo trình

`1A`–`1D` xuất hiện ở **năm** bài khác nhau (bài 1 của các Chương 1, 4, 5, 6, 7).
`2A`–`2D` cũng năm bài. `3A`–`3C` có ở cả `chuong-02-bai-03` lẫn `chuong-03-bai-01`.
Riêng Chương 3 còn tự mâu thuẫn: bài 1-3 dùng chung tiền tố `3` (3A→3I) rồi bài 4
nhảy sang `4A`.

**Hệ quả.** Mọi tham chiếu chéo phải dùng **đường dẫn bài + mã**, không bao giờ
dùng mã trần — đó là lý do chỉ thị nhúng bản nhạc viết là
`{{sheet: chuong-04-bai-01#1A}}`. Xem `src/lib/sheet-embed.ts`.

Cũng lưu ý bài tập nằm lẫn ở hai cấp tiêu đề: `chuong-01-bai-02` để 2A-2D ở `###`
nhưng 2E ở `##`. Regex nào quét bài tập cũng phải nhận cả hai.

---

## 8. Biến môi trường của Neon trên Vercel để "All Environments"

**Triệu chứng.** Không có triệu chứng — đó mới là vấn đề.

**Nguyên nhân.** Tích hợp Neon đặt `DATABASE_URL` cho **mọi môi trường**, nên
preview deploy và `vercel env pull` đều trỏ vào đúng database production. Một
`pnpm db:push` chạy nhầm là sửa cấu trúc bảng thật, không có đường lùi.

**Cách sửa.** Tạo nhánh dev trên Neon, đặt riêng `DATABASE_URL` cho Development
và Preview. Cũng đừng chạy `vercel env pull` một cách máy móc — chính nó bơm 16
biến `PG*`/`POSTGRES_*`/`NEON_*` mà ứng dụng không đọc vào `.env.local`.

---

## Lịch sử cập nhật

> Mỗi lần sửa file thì **thêm một dòng mới lên đầu bảng**, không sửa dòng cũ. Cột
> *Tiêu đề commit* phải chép **y hệt** tiêu đề commit để tìm lại được bằng
> `git log --grep="<tiêu đề>"` hoặc gõ thẳng vào ô tìm kiếm của Fork.

| Ngày | Tiêu đề commit | Cập nhật gì |
|---|---|---|
| 27/08/2026 | `docs(internal): Ghi lại các bẫy kỹ thuật đã giẫm phải` | Tạo file — tám bẫy gặp trong đợt làm cổng chặn trả phí, trang mua, đổi route và gom biến môi trường |
