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

## 9. `AppShell` tắt `header.offset` thì thanh bên trùm lên nút hamburger

**Triệu chứng.** Trên điện thoại, mở thanh bên ra rồi thì không đóng lại được:
nút hamburger biến mất, bấm vào chỗ cũ không ăn gì.

**Nguyên nhân.** Thanh bên của Mantine được đặt `top: var(--app-shell-header-offset)`.
Biến đó **chỉ tồn tại khi `header.offset` bật** — xem
`assign-header-variables.mjs` trong `@mantine/core`. Mà `offset` lại là thứ bắt
buộc phải tắt nếu muốn thanh tiêu đề tự trượt đi lúc cuộn xuống mà nội dung
không nhảy theo. Tắt xong thì biến không còn, thanh bên rơi về `top: 0` và trùm
lên cả thanh tiêu đề, kể cả nút hamburger nằm trong đó.

**Cách sửa.** Tắt `offset` thì phải tự cộng chỗ cho thanh tiêu đề vào cả thanh
bên lẫn vùng nội dung — xem `.app-navbar` và `.app-main` trong
`src/app/globals.css`:

```css
.app-navbar.app-navbar {
  top: calc(var(--app-shell-header-height) + var(--safe-top));
  height: calc(100dvh - var(--app-shell-header-height) - var(--safe-top));
}
```

Hai lớp đó **nhân đôi tên lớp** là có chủ ý. Không nhân đôi thì chúng cùng độ ưu
tiên 0-1-0 với lớp CSS Module của Mantine, và ai thắng phụ thuộc vào thứ tự
`@mantine/core/styles.css` với `globals.css` được ghép lúc build — một thứ đổi
lúc nào không ai hay.

Kèm theo: đừng cho thanh tiêu đề trượt đi khi thanh bên đang mở. Trong
`AppLayout.tsx` điều kiện là `isMobile && !pinned && !mobileOpened`; bỏ vế cuối
đi là nút hamburger lại biến mất đúng theo kiểu trên.

---

## 10. Tab trình duyệt bị ẩn không phát sự kiện cuộn, tưởng là mã hỏng

**Triệu chứng.** Thanh tiêu đề kiểu headroom (`useHeadroom`) trông như không chạy
khi kiểm bằng công cụ điều khiển trình duyệt: `window.scrollTo()` đổi được
`window.scrollY` nhưng `pinned` không bao giờ đổi. Ép cho nó đổi rồi thì
`getComputedStyle(el).transform` vẫn trả về ma trận đơn vị, dù biến
`--app-shell-header-transform` đã được đặt đúng và luật CSS đã khớp.

**Nguyên nhân.** Tab không được hiển thị thì `document.visibilityState` là
`'hidden'` và trình duyệt ngừng dựng khung hình. Kéo theo hai chuyện: sự kiện
`scroll` không được phát (mọi hook nghe cuộn đứng im), và CSS transition kẹt ở
`currentTime: 0` mãi mãi (nên `transform` giữ nguyên giá trị đầu).

**Cách sửa.** Không phải lỗi của mã. Muốn kiểm thì:

- Bắn tay sự kiện: `window.scrollTo(0, y); window.dispatchEvent(new Event('scroll'))`.
- Đọc giá trị cuối của transition bằng cách tắt transition rồi ép tính lại:
  `el.style.transition = 'none'; void el.offsetHeight;`
- Xác nhận nghi ngờ bằng `el.getAnimations()` — thấy `playState: 'running'` mà
  `currentTime: 0` là đúng triệu chứng này.

Kèm theo: tab bị ẩn còn **bóp `setTimeout` về khoảng một giây**. Kịch bản kiểm
thử nào chờ vài chục lần liên tiếp (ví dụ bắn từng nốt MIDI giả rồi `await`
giữa mỗi nốt) sẽ chạy hàng chục giây rồi hết giờ. Bắn đồng bộ cả loạt rồi chờ
một lần ở cuối.

---

## 11. Tô màu lên bản nhạc abcjs: khi nào cần `!important`, khi nào không

**Triệu chứng.** Luật CSS đổi màu nốt nhạc trông đúng hết nhưng nốt vẫn đen sì.
Thêm `!important` vào thì ăn.

**Nguyên nhân.** abcjs vẽ xong thì đặt màu thẳng lên từng phần tử SVG, nên một
luật thường của tác giả không thắng nổi. Nhưng **giá trị do animation sinh ra
thì thắng**: trong thứ tự xếp tầng của CSS, animation đứng trên mọi khai báo
thường của tác giả, kể cả style nội tuyến.

**Cách sửa.** Tuỳ loại hiệu ứng:

- Màu **đứng yên** (`.practice-correct`, `.practice-wrong`, `.practice-missing`)
  → phải có `!important`, và phải nhắm cả thẻ con: `.practice-wrong, .practice-wrong *`.
- Màu **chạy bằng `@keyframes`** (`.practice-miss-flash`) → không cần `!important`.
  Đừng thêm vào cho chắc: `!important` bên trong khối `@keyframes` bị bỏ qua
  theo đúng đặc tả, nên nó chỉ làm người đọc sau tưởng nhầm là cần.

**Hai chuyện kèm theo khi làm hiệu ứng trên SVG của abcjs:**

- Muốn hiệu ứng **chạy lại từ đầu** khi kích hoạt liên tiếp thì phải gỡ lớp ra,
  ép trình duyệt tính lại bố cục (`void el.getBoundingClientRect()`), rồi mới
  gắn vào. Thiếu bước giữa thì hai thao tác bị gộp làm một và hiệu ứng đứng im.
- Thẻ `<g class="abcjs-note">` **không có sẵn thuộc tính `transform`** (đã kiểm),
  nên gắn `transform` bằng CSS để rung là an toàn. Chỉ dịch ngang thôi —
  `translateX` không phụ thuộc gốc toạ độ nên khỏi lo `transform-box`. Và chỉ
  gắn lên thẻ `<g>`, đừng gắn lên thẻ con, kẻo rung chồng lên nhau.

---

## Lịch sử cập nhật

> Mỗi lần sửa file thì **thêm một dòng mới lên đầu bảng**, không sửa dòng cũ. Cột
> *Tiêu đề commit* phải chép **y hệt** tiêu đề commit để tìm lại được bằng
> `git log --grep="<tiêu đề>"` hoặc gõ thẳng vào ô tìm kiếm của Fork.

| Ngày | Tiêu đề commit | Cập nhật gì |
|---|---|---|
| 28/08/2026 | `feat: Phản hồi từng nốt ngay khi tập bài với đàn` | Thêm bẫy 11 (màu tĩnh trên bản nhạc abcjs cần !important, màu chạy bằng keyframes thì không) và bổ sung vào bẫy 10 chuyện tab bị ẩn bóp setTimeout về khoảng một giây |
| 28/08/2026 | `fix: Trả lại chỗ cho nội dung trên màn hình điện thoại` | Thêm bẫy 9 (tắt `header.offset` của AppShell thì thanh bên trùm lên nút hamburger) và bẫy 10 (tab bị ẩn không phát sự kiện cuộn nên tưởng hiệu ứng headroom hỏng) |
| 27/08/2026 | `docs(internal): Ghi lại các bẫy kỹ thuật đã giẫm phải` | Tạo file — tám bẫy gặp trong đợt làm cổng chặn trả phí, trang mua, đổi route và gom biến môi trường |
