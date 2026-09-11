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
lệnh đổi cấu trúc bảng chạy nhầm là sửa database thật, không có đường lùi.

**Cách sửa.** Tạo nhánh dev trên Neon, đặt riêng `DATABASE_URL` cho Development
và Preview. Cũng đừng chạy `vercel env pull` một cách máy móc — chính nó bơm 16
biến `PG*`/`POSTGRES_*`/`NEON_*` mà ứng dụng không đọc vào `.env.local`.

---

## 9. `AppShell` tắt `header.offset` thì thanh bên trùm lên nút hamburger

> [!NOTE]
> **Đã hết hiệu lực từ 10/09/2026** — `AppShell` và thanh bên đã bị bỏ hẳn, khung
> app giờ là thanh mỏng trên đỉnh + thanh tab dưới đáy (`AppLayout.tsx`). Giữ mục
> này lại vì hai lý do: nó là bằng chứng cho thấy `AppShell` kéo theo bao nhiêu
> việc phải bù, và nếu có ngày dựng lại thanh bên cho màn hình rộng thì cái bẫy
> này còn nguyên đó.

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

## 12. Script chạy tay đọc nhầm nhánh database, không báo gì cả

**Triệu chứng.** `node scripts/beta-metrics.mjs` in ra toàn số 0 hoặc "Không có ai
trong cohort", trong khi production rõ ràng đang có người học. Kiểu ngược lại còn
khó chịu hơn: `grant-access.mjs` báo "Đã mở khoá nen-tang cho ..." nhưng người học
đăng nhập vào vẫn bị chặn.

**Nguyên nhân.** Mọi script trong `scripts/` đều nạp `.env.local` trước:

```js
config({ path: '.env.local', quiet: true });
config({ quiet: true });
```

Từ lúc tách database (mục 8 `ke-hoach-beta.md`), `.env.local` trỏ vào **nhánh dev**
(`ep-dry-voice-…`), còn production nằm ở nhánh `main` (`ep-still-bird-…`). Nên chạy
script ở máy làm việc là đang đọc và ghi vào dev. Việc tách nhánh là đúng và cần —
cái sai là **script không nói cho biết nó vừa nối vào đâu**, nên kết quả rỗng trông
y hệt như "chưa có ai học".

**Cách sửa.** Hai lớp:

1. **Script tự khai báo.** `beta-metrics.mjs` in host và tên database ngay dòng đầu,
   không kèm tài khoản mật khẩu (`new URL(...).hostname + pathname`). Script nào
   đụng vào dữ liệu thật cũng nên làm vậy.
2. **Đặt biến ngay trên dòng lệnh khi cần chạy với production.** `dotenv` mặc định
   **không ghi đè** biến đã có trong `process.env`, nên biến đặt bên ngoài luôn thắng
   `.env.local`:

   ```powershell
   $env:DATABASE_URL='<chuỗi kết nối nhánh main>'; node scripts/beta-metrics.mjs
   Remove-Item Env:DATABASE_URL
   ```

   Dòng `Remove-Item` không thừa: PowerShell giữ biến suốt cả phiên, quên xoá thì
   script đụng database gõ sau đó sẽ chạy thẳng vào **production** — đúng tai nạn
   mà bẫy 8 đã cảnh báo, chỉ khác đường vào.

---

## 13. Có hai bảng tên `user` trong database

**Triệu chứng.** Truy vấn `information_schema.columns WHERE table_name = 'user'` trả
về danh sách cột nhân đôi và mâu thuẫn — `id` vừa là `text` vừa là `uuid`, `emailVerified`
vừa là `boolean` vừa là `timestamp`, kèm những cột chưa từng khai trong `src/db/schema/`
như `banned`, `banReason`, `updatedAt`.

**Nguyên nhân.** Tích hợp Neon Auth tạo bảng riêng của nó ở schema `neon_auth`, nên
tồn tại song song `neon_auth.user` và `public.user`. Ứng dụng chỉ dùng cái thứ hai.
`information_schema` không lọc schema giúp, còn `search_path` (`"$user", public`) thì
lặng lẽ chọn `public.user` — nên truy vấn thường vẫn đúng, chỉ có việc *đọc kết quả
information_schema* là sai.

**Cách sửa.** Mọi truy vấn vào `information_schema` phải kèm `table_schema = 'public'`:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user'
ORDER BY ordinal_position;
```

Đừng "sửa" bằng cách xoá `neon_auth` — đó là bảng của tích hợp, không phải rác.

---

---

## 14. Nhánh `dev` trên Neon biến mất, triệu chứng lại là "sai mật khẩu"

**Triệu chứng.** Sau một thời gian không đụng tới, mọi script chạy tay và cả
`pnpm dev` đều báo:

```
PostgresError: password authentication failed for user 'neondb_owner'
```

Production vẫn chạy bình thường — chỉ máy làm việc bị.

**Nguyên nhân.** Không phải mật khẩu. **Nhánh `dev` đã bị xoá**, và Neon trả về
lỗi xác thực cho endpoint không còn tồn tại. Mật khẩu trong `.env.local` vẫn đúng
nguyên — lần gặp thật, chuỗi mới do Neon cấp có mật khẩu **giống hệt** chuỗi cũ,
chỉ khác phần endpoint.

Đây là chỗ dễ mất thời gian nhất: thông báo lỗi chỉ thẳng vào mật khẩu, nên phản
xạ đầu tiên là đi xoay khoá và cập nhật biến môi trường — sai hướng hoàn toàn.

**Cách nhận ra nhanh.** Mở Neon Console, nhìn cột **Branches** của project. Đang
là `1` trong khi lẽ ra phải là `2` thì nhánh `dev` đã mất. Đừng tra DNS để kiểm:
Neon dùng DNS ký tự đại diện cho `*.neon.tech` nên endpoint **đã xoá vẫn phân giải
bình thường**, cho cảm giác an tâm sai.

**Cách sửa.** Tạo lại nhánh: Branches → New Branch, name `dev`, parent `main`,
*Current point in time*. Rồi lấy **cả hai** chuỗi (pooled và direct) thay vào
`.env.local`, và chạy lại phép thử dấu vết — ghi một đơn vào `dev`, kiểm
production không thấy nó.

**Nghi phạm.** Chưa xác định chắc. Khả năng cao nhất là tính năng *Create Database
Branch For Deployment → Preview* của tích hợp Neon–Vercel: nó tự tạo và **tự xoá**
nhánh cho mỗi bản preview, và có thể đã dọn nhầm `dev`. Nếu nhánh lại biến mất lần
nữa thì gần như chắc là do đây, và phải xem lại cấu hình tích hợp.

**Bài học chung.** Sự cách ly dev/production **không tự duy trì**. Sau mỗi đợt
nghỉ dài, việc đầu tiên nên làm là chạy `node scripts/beta-metrics.mjs` — nó in ra
endpoint đang nối vào, nên hỏng cái gì cũng lộ ra ngay ở dòng đầu.

---

## 15. Tiếng đàn vẫn kêu sau khi đã rời trang

**Triệu chứng.** Đang bấm *Nghe thử* một bản nhạc rồi bấm sang trang khác. Trang mới
hiện ra bình thường nhưng **tiếng đàn vẫn phát tiếp**, và không còn nút nào tắt được
— cái nút đó vừa biến mất cùng trang cũ.

**Nguyên nhân.** Điều hướng trong Next.js **không tải lại trang**. Component bị gỡ
khỏi cây React, nhưng thứ nó tạo ra ngoài React — bộ phát tiếng, đồng hồ đếm, trình
nghe sự kiện — vẫn sống nguyên. Ở đây là `SynthController` của abcjs, dựng trong một
`useEffect` **không có hàm dọn dẹp**.

Đây là bẫy của cả một *loại* mã, không riêng bản nhạc: bất cứ thứ gì phát tiếng, chạy
`setInterval`, hay giữ thiết bị đều dính nếu quên cleanup. Lúc phát triển rất khó
thấy, vì tải lại trang bằng F5 thì trình duyệt dọn hộ — chỉ điều hướng phía client
mới lộ ra.

**Cách sửa.** Trả về hàm dọn dẹp từ `useEffect`. Với abcjs phải gọi đúng hàm:

- `pause()` **không đủ** — nó chỉ dừng đồng hồ, chuỗi âm thanh vẫn còn.
- `destroy()` mới là hàm gọi tới `midiBuffer.stop()`. Hàm này **có thật trong
  `synth-controller.js` nhưng thiếu trong `.d.ts`** của abcjs, nên phải khai thêm
  vào `SynthControllerInternals` ở `AbcjsViewer.tsx` — cùng chỗ đã vá `seek` và
  `midiBuffer` vì đúng lý do đó.

Hàm dọn dẹp còn chạy mỗi khi dependency đổi, nên nó sửa luôn một rò rỉ dễ bỏ sót:
đổi bản nhạc mà không dọn là bỏ lại một controller cũ còn sống.

**Cách kiểm cho chắc, không dùng tai.** Gắn máy đếm vào Web Audio trước khi bấm phát:

```js
window.__starts = 0; window.__stops = 0;
const P = AudioBufferSourceNode.prototype;
const s = P.start, t = P.stop;
P.start = function (...a) { window.__starts++; return s.apply(this, a); };
P.stop  = function (...a) { window.__stops++;  return t.apply(this, a); };
```

Hiệu số `__starts - __stops` là số nguồn tiếng đang kêu. Bấm phát rồi chuyển trang:
hiệu số phải về **0** và đứng yên. Máy đếm **còn sống sót** qua lần chuyển trang cũng
chính là bằng chứng đó là điều hướng phía client chứ không phải tải lại trang — thiếu
điều đó thì phép thử vô nghĩa.

**Đã kiểm là không dính:** `Metronome.tsx` (có `useEffect(() => stop, [stop])`) và
`useMidiInput.ts` (gỡ listener, đặt `onstatechange = null`).

---

## 16. `position: fixed` bị tổ tiên kéo về, lớp phủ tập trung không thoát ra được

**Triệu chứng.** Bấm *Chế độ tập trung* ở một bản nhạc. Lớp phủ hiện ra sai chỗ —
có lúc chỉ là một dải mỏng, có lúc nằm hẳn ngoài màn hình — và **không thoát ra
được** vì nút *Thoát* trôi theo nó. Nền lại đang bị khoá cuộn nên cuộn tới cũng
không được. Trên máy tính thì lúc bấm được lúc không, càng khó tin là lỗi thật.

**Nguyên nhân.** `position: fixed` chỉ neo vào khung nhìn khi **không tổ tiên nào
tạo khối chứa**. Bốn thuộc tính sau, chỉ cần khác `none`, là tạo khối chứa và kéo
mọi con `fixed` về mình: `transform`, `filter`, `backdrop-filter`, `perspective`
(`will-change` và `contain: paint` cũng vậy).

Bản nhạc nằm sâu trong hai lớp đều dính:

| Tổ tiên | Thuộc tính | Bật lúc nào |
|---|---|---|
| `.markdown-body` | `backdrop-filter: blur(12px)` | luôn luôn |
| `.markdown-pre-wrapper` | `transform: translateY(-2px)` | khi rê chuột vào khối |

Cái thứ hai độc hơn vì nó **chập chờn**: lớp phủ neo vào khối mã thì con trỏ không
còn nằm trên khối nữa → hết `:hover` → lớp phủ lại phủ kín màn hình → con trỏ nằm
trên con của khối → `:hover` bật lại. Đo bằng Playwright thấy nó nhảy qua nhảy lại
liên tục, nên nút *Thoát* lúc bấm trúng lúc không. Trên điện thoại thì ngược lại,
dính chắc: chạm vào nút để bật là trạng thái `:hover` bám lại cho tới khi chạm chỗ
khác, mà cả màn hình lúc đó là lớp phủ.

**Triệu chứng đánh lừa ở chỗ mọi thứ tính ra vẫn đúng:** `position` vẫn là `fixed`,
`top/left/right/bottom` vẫn là `0px`. Chỉ toạ độ thật là sai. Nên đừng đọc
`getComputedStyle` của chính lớp phủ, hãy đo `getBoundingClientRect()` của nó và
so với `innerWidth`/`innerHeight`:

```js
const ov = document.querySelector('.sheet-music-wrapper.is-focused');
ov.getBoundingClientRect();   // phải là 0,0 và bằng đúng cỡ khung nhìn
// Rồi lần ngược lên tìm thủ phạm:
for (let e = ov.parentElement; e; e = e.parentElement) {
  const cs = getComputedStyle(e);
  if ([cs.transform, cs.filter, cs.backdropFilter, cs.perspective].some(v => v !== 'none'))
    console.log(e.className, cs.transform, cs.filter, cs.backdropFilter);
}
```

**Cách sửa.** Trong lúc đang tập trung thì tắt các thuộc tính đó ở tổ tiên. Lớp
`sheet-focus-lock` mà `AbcjsViewer.tsx` gắn lên `body` chính là công tắc sẵn có:

```css
body.sheet-focus-lock .markdown-body { backdrop-filter: none; }
body.sheet-focus-lock .markdown-pre-wrapper,
body.sheet-focus-lock .markdown-pre-wrapper:hover { transform: none; transition: none; }
```

Cần cả `transition: none`: bỏ đi thì transform chạy nốt 0.2s về 0, mà trong 0.2s
đó giá trị vẫn là một ma trận nên vẫn tạo khối chứa. Cũng cần cả bộ chọn không
`:hover` để thắng điểm ưu tiên của `.markdown-pre-wrapper:hover`.

**Đừng chữa bằng cách chuyển lớp phủ sang React portal.** Nghe thì gọn hơn, nhưng
`portal` bật/tắt là React dựng lại phần tử DOM mới, mất sạch SVG mà abcjs đã vẽ
thẳng vào `paperRef` — bản nhạc trắng trơn, màu đang tô của lần tập cũng mất theo.

**Bài học chung.** Thêm bất cứ hiệu ứng kính mờ hay hiệu ứng nhấc lên nào cho một
khối *bao ngoài* bản nhạc là phải nghĩ tới chế độ tập trung. Cách kiểm rẻ nhất:
bật chế độ tập trung rồi rê chuột khắp màn hình, lớp phủ phải đứng yên.

---

## 17. Con của flexbox bị bóp, cuộn hết cỡ vẫn không thấy phần bị cắt

**Triệu chứng.** Điện thoại xoay ngang, đang ở chế độ tập trung. Thẻ *Tập bài này
với đàn* dưới cùng **bị cắt mất một nửa** và **kéo xuống thêm không được** — cuộn
đã chạm đáy thật, không phải kẹt. Cuộn lên thì thanh nút cũng trôi mất, nên nhìn
như treo máy.

**Nguyên nhân.** Lớp phủ tập trung là `display: flex; flex-direction: column`. Con
của flexbox mặc định `flex-shrink: 1`, nên khi không đủ chỗ, trình duyệt **bóp nhỏ
ô của con** chứ không để nó tràn ra. Ô bị bóp thì nội dung thừa bị cắt, mà
`scrollHeight` của lớp phủ **tính theo ô đã bóp** — cuộn tối đa vẫn không tới được
phần bị cắt. Đo trên màn hình cao 360px:

| | Cần | Được cấp | Cuộn tối đa |
|---|---|---|---|
| Thẻ *Tập bài này với đàn* | 138px | 34px | 18px |

Đây là lý do khung bản nhạc đã phải đặt `flex: 0 0 auto` từ trước — nhưng đặt lẻ
cho một con thì con thêm sau vẫn dính. Điểm đánh lừa: nhìn `scrollHeight` thấy
"đã cuộn hết" nên dễ kết luận là không còn gì bên dưới, trong khi phần bị cắt
nằm ngay trong `scrollHeight` của **chính đứa con** (`138` so với ô `34`).

**Cách sửa.** Chặn co cho *mọi* con của lớp phủ, và ghim thanh nút vào đỉnh để nó
không bao giờ trôi khỏi tầm mắt:

```css
.sheet-music-wrapper.is-focused > * { flex-shrink: 0; }

.sheet-music-wrapper.is-focused > .mantine-Group-root:first-child {
  position: sticky; top: 0; left: 0; z-index: 1;
  background: var(--mantine-color-body);   /* thiếu nền thì nốt nhạc cuộn chồng lên chữ */
}
```

**Cách kiểm.** So chiều cao ô với `scrollHeight` của từng con, đừng chỉ nhìn lớp cha:

```js
const ov = document.querySelector('.sheet-music-wrapper.is-focused');
[...ov.children].forEach(k =>
  console.log(k.className, Math.round(k.getBoundingClientRect().height), 'vs', k.scrollHeight));
```

Con nào có `scrollHeight` lớn hơn hẳn chiều cao ô là con đang bị bóp.

**Kèm theo: padding của khung phải nằm ở CSS.** `AbcjsViewer.tsx` trước đây đặt
`padding: '1rem'` trong `style` nội tuyến, mà style nội tuyến thắng mọi luật CSS
không `!important` — nên luật padding chừa tai thỏ của `.is-focused` trong
`globals.css` **chưa từng có tác dụng** dù đọc mã thì tưởng là có. Đã chuyển padding
sang `.sheet-music-wrapper` trong CSS. Gặp một luật CSS "rõ ràng đúng mà không ăn"
thì việc đầu tiên là tìm xem có `style` nội tuyến nào không.

---

## 18. Bộ phát tiếng mồ côi: bấm tắt mà vẫn kêu

**Triệu chứng.** Nhạc nền phải im khi người học bấm nghe bản nhạc mẫu, nhưng nó cứ
kêu chồng lên. Đọc mã thì thấy đường nào cũng đúng: sự kiện có bắn, component có
vẽ lại, `stop()` có chạy. Đo bằng máy phân tích âm thanh lại thấy tiếng vẫn còn
nguyên mức, không hề giảm.

**Nguyên nhân.** Có **hai bộ phát** cùng kêu, và `stop()` chỉ tắt được một.

Đường dẫn tới đó, gặp ở `AmbientMusic.tsx`:

1. React ở **chế độ Strict** gắn component, chạy effect, **gỡ ngay**, rồi gắn lại.
   Bộ phát A dựng ở lần gắn thứ nhất bị `dispose()`.
2. Nhưng `start()` của A là bất đồng bộ và đã trả về "chưa kêu được" (trình duyệt
   chưa cho phát tiếng vì chưa có thao tác người dùng), nên nó **gắn một trình
   nghe `pointerdown`** để thử lại sau.
3. Người học chạm màn hình. Trình nghe ấy gọi `A.start()`. Lúc này `A.ctx` đã là
   null, mà `start()` lại có nhánh "chưa có bối cảnh thì dựng mới" — thế là A
   **sống lại** với một `AudioContext` mới toanh.
4. Component thì đang trỏ vào bộ phát B. Từ đó về sau, mọi lệnh `stop()` chỉ tắt
   B. A kêu mãi, không nút nào trên giao diện với tới được.

Chế độ Strict chỉ làm lỗi này **lộ ra sớm**, không phải nguyên nhân gốc: bất cứ
lần gỡ-gắn nào (điều hướng, đổi khoá của component) cũng dựng được cùng kịch bản
trên production.

**Vì sao khó lần.** Máy đo gắn vào bộ nén của bộ phát sẽ bám vào **bộ cuối cùng
được dựng**, tức bộ B đã tắt — đo ra 0 và tưởng mọi thứ đúng, trong khi tai vẫn
nghe tiếng của A. Muốn đo đúng thì phải chọn bộ nén theo dấu riêng, ví dụ
`comp.threshold.value === -20`, và lấy mẫu **trải theo thời gian**.

**Cách sửa.** Hai chốt, thiếu cái nào cũng hở:

```ts
// 1. Dẹp rồi thì từ chối sống lại.
private disposed = false;
async start() { if (this.disposed) return false; /* … */ }
dispose() { this.disposed = true; /* … */ }

// 2. Lúc cú chạm tới, kiểm xem bộ phát trong closure còn là bộ đang dùng không.
const thu = () => { if (engineRef.current === engine) void engine.start(); };
```

**Bài học chung.** Bất cứ chỗ nào có `await` rồi mới đụng lại `this`, hoặc có
trình nghe sự kiện gắn trong một lời hứa, đều phải hỏi lại: *tới lúc đoạn mã này
chạy, thứ tôi đang cầm còn là thứ đang được dùng không?* Cùng họ với bẫy 15 —
thứ tạo ngoài React không tự chết theo component.

---

## Lịch sử cập nhật

> Mỗi lần sửa file thì **thêm một dòng mới lên đầu bảng**, không sửa dòng cũ. Cột
> *Tiêu đề commit* phải chép **y hệt** tiêu đề commit để tìm lại được bằng
> `git log --grep="<tiêu đề>"` hoặc gõ thẳng vào ô tìm kiếm của Fork.

| Ngày | Tiêu đề commit | Cập nhật gì |
|---|---|---|
| 11/09/2026 | `fix: Nhạc nền chạy liền mạch khi chuyển trang` | Thêm bẫy 18 — bộ phát tiếng mồ côi sống lại sau `dispose()` nên `stop()` chỉ tắt được một nửa; ghi cả cách đo đúng vì máy đo bám nhầm bộ nén thì ra số 0 đánh lừa |
| 10/09/2026 | `fix: Cuộn tới cuối và luôn thấy nút Thoát trong chế độ tập trung` | Thêm bẫy 17 — con của flexbox bị bóp làm `scrollHeight` nói dối, cuộn hết cỡ vẫn không thấy phần bị cắt; kèm chuyện `style` nội tuyến làm luật padding chừa tai thỏ chưa từng chạy |
| 10/09/2026 | `fix: Bấm được nút Thoát của chế độ tập trung` | Thêm bẫy 16 — `transform`/`backdrop-filter` ở tổ tiên kéo lớp phủ `position: fixed` ra khỏi khung nhìn, làm chế độ tập trung không thoát được; ghi rõ vì sao triệu chứng chập chờn và cách đo bằng `getBoundingClientRect` thay vì `getComputedStyle` |
| 10/09/2026 | `refactor: Bỏ AppShell, thay bằng thanh tab và trang mục lục` | Đánh dấu bẫy 9 đã hết hiệu lực (AppShell bị bỏ) nhưng giữ nguyên nội dung, phòng khi dựng lại thanh bên cho màn hình rộng |
| 10/09/2026 | `fix: Dừng hẳn tiếng đàn khi rời trang đang phát` | Thêm bẫy 15 — thứ tạo ngoài React (bộ phát tiếng, đồng hồ, thiết bị) vẫn sống sau khi component bị gỡ, vì điều hướng Next.js không tải lại trang; ghi rõ `pause()` không đủ mà phải `destroy()`, và kèm cách kiểm bằng máy đếm gắn vào Web Audio thay vì nghe bằng tai |
| 01/09/2026 | `docs(internal): Ghi lại bẫy nhánh dev biến mất trên Neon` | Nhánh dev bị xoá nhưng lỗi lại hiện ra là sai mật khẩu, dẫn người ta đi dò nhầm hướng; ghi cả cách nhận ra nhanh bằng cột Branches |
| 28/08/2026 | `feat: Đổi schema bằng migration có file thay vì drizzle-kit push` | Sửa bẫy 8 và 12 cho khớp: `pnpm db:push` không còn tồn tại, rủi ro giờ nằm ở script chạy tay và biến môi trường quên xoá |
| 28/08/2026 | `feat: Ghi ngày tạo tài khoản và lọc cohort beta khi đo phễu` | Thêm bẫy 12 (script chạy tay nạp `.env.local` nên đọc nhánh dev, kết quả rỗng trông y hệt "chưa có ai học") và bẫy 13 (song song `neon_auth.user` với `public.user` làm `information_schema` trả về cột nhân đôi mâu thuẫn) |
| 28/08/2026 | `feat: Phản hồi từng nốt ngay khi tập bài với đàn` | Thêm bẫy 11 (màu tĩnh trên bản nhạc abcjs cần !important, màu chạy bằng keyframes thì không) và bổ sung vào bẫy 10 chuyện tab bị ẩn bóp setTimeout về khoảng một giây |
| 28/08/2026 | `fix: Trả lại chỗ cho nội dung trên màn hình điện thoại` | Thêm bẫy 9 (tắt `header.offset` của AppShell thì thanh bên trùm lên nút hamburger) và bẫy 10 (tab bị ẩn không phát sự kiện cuộn nên tưởng hiệu ứng headroom hỏng) |
| 27/08/2026 | `docs(internal): Ghi lại các bẫy kỹ thuật đã giẫm phải` | Tạo file — tám bẫy gặp trong đợt làm cổng chặn trả phí, trang mua, đổi route và gom biến môi trường |
