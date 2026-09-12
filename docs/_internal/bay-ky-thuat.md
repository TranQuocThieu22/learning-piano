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
  vào `SynthControllerInternals` ở `src/hooks/useSheetAudio.ts` — cùng chỗ đã vá `seek` và
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
`sheet-focus-lock` mà `SheetViewer.tsx` gắn lên `body` chính là công tắc sẵn có:

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

**Kèm theo: padding của khung phải nằm ở CSS.** `SheetViewer.tsx` (khi đó còn tên `AbcjsViewer.tsx`) trước đây đặt
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

## 19. Build đỏ trên Vercel trong khi ở máy mình xanh hết

**Triệu chứng.** Bốn lệnh kiểm ở máy đều xanh, `git push` xong thì deploy trên Vercel
đỏ. Log không chỉ ra dòng mã nào sai, chỉ có một ca test trượt — mà chính ca đó vừa
chạy qua ở máy vài phút trước.

**Nguyên nhân.** Vitest bỏ cuộc sau **5 giây mỗi ca**, và đó là mặc định không ai khai
ở đâu cả. Ca nào ở máy bàn chạy mất 2-3 giây thì trên máy dựng bản của Vercel hay
GitHub — chậm hơn vài lần, lại chạy chung máy với việc khác — sẽ vượt ngưỡng. Ở đây là
`mic-accuracy.test.ts`: nó dựng vài trăm nốt tiếng đàn tổng hợp rồi cho chạy qua bộ
nghe, mất 3,0 giây ở máy bàn.

**Vì sao khó lần.** Nó không hỏng theo kiểu đúng/sai mà theo kiểu nhanh/chậm, nên chạy
lại ở máy vẫn xanh — dễ đổ cho "Vercel dở" rồi bấm deploy lại. Và vì lệnh build của
Vercel là `vitest run && drizzle-kit migrate && next build`, test trượt làm **cả deploy
không xảy ra**: người học vẫn thấy bản cũ, không ai được báo gì.

**Cách sửa.**

```ts
const SLOW_MACHINE_TIMEOUT_MS = 60_000;
it('…', async () => { /* … */ }, SLOW_MACHINE_TIMEOUT_MS);
```

Khai hạn giờ cho **đúng ca nặng**, đừng nới mặc định cho cả kho test: nới toàn cục thì
một ca treo thật sẽ ngồi im hàng phút thay vì đỏ ngay. Kèm theo, cắt bớt khối lượng cho
ca đó nếu cắt mà kết luận không đổi — `mic-accuracy` giảm từ 20 câu nhạc xuống 12, vẫn
đo trên 151 nốt và cho ra cùng con số.

**Bài học chung.** Ca test nào ở máy chạy quá **một giây** thì coi như đã đứng ở mép
vực: hoặc khai hạn giờ, hoặc làm nó nhẹ đi. Và `next build` phải nằm trong cổng kiểm
tra trước khi commit — bốn lệnh kia không đụng tới nó, mà nó mới là thứ Vercel chạy
(mục 3 của [`quy-trinh-lam-viec.md`](quy-trinh-lam-viec.md)).

---

## 20. Bộ nén đặt sau nút âm lượng: kéo thanh trượt lên mà nhạc không to thêm

**Triệu chứng.** Người học kéo thanh trượt âm lượng nhạc nền lên **hết cỡ**, vặn cả
âm lượng máy lên hết, mà nhạc nền vẫn nghe bé. Không có lỗi nào trong console, nhạc
vẫn kêu đúng bài, đoạn dưới của thanh trượt vẫn thay đổi được — chỉ riêng đoạn trên là
gần như giậm chân tại chỗ.

**Nguyên nhân.** Chuỗi tiếng hồi đó nối theo thứ tự
`master(âm lượng) → lọc → nén → loa`. Bộ nén đứng **sau** nút âm lượng, nên mức vào của
nó chạy theo thanh trượt: kéo lên cao thì tín hiệu vượt ngưỡng nhiều hơn và bị nén mạnh
hơn, đúng vào lúc người học đang xin to hơn. Với `threshold` -20dB và `ratio` 4, mỗi
1dB kéo thêm chỉ còn ra 0,25dB ở loa.

Ba thứ cộng dồn, và đo ra mới thấy nó tệ tới mức nào — kéo hết cỡ chỉ được RMS
**-31,3dB**, tức nhỏ hơn nhạc bình thường khoảng 15dB:

1. Trần âm lượng `MAX_GAIN` để 0,22, tự nó đã cắt 13dB.
2. Bộ nén đặt sai chỗ như trên.
3. `knee` để mặc định. Mặc định của trình duyệt là **30dB** — rộng đến mức bắt đầu nén
   từ tận -35dB, tức nén cả phần thân của tiếng chứ không riêng phần đỉnh. Đây là con
   số dễ quên nhất vì không ai viết nó ra trong mã.

**Cách sửa.** Cho nút âm lượng xuống **cuối** chuỗi, để bộ nén luôn thấy một mức vào cố
định; đặt `knee` bằng tay; rồi nâng trần:

```ts
filter.connect(comp).connect(master).connect(ctx.destination);
```

**Cách đo.** Đừng chỉnh bằng tai, và cũng đừng đo bằng `AnalyserNode` trên bối cảnh
đang chạy — xem bẫy 18 để biết vì sao dễ ra số 0 đánh lừa. Dựng lại đúng chuỗi đó trong
`OfflineAudioContext`, kết xuất một phút rồi tính đỉnh và RMS của cả đoạn:

```js
const ctx = new OfflineAudioContext(2, 44100 * 62, 44100);
// …dựng y hệt chuỗi thật, hẹn lịch các nốt…
const buf = await ctx.startRendering();
```

Kết xuất offline chạy nhanh hơn thời gian thực rất nhiều, nên quét được cả một dải giá
trị trong vài giây — đủ để dò nhị phân ra mức `MAX_GAIN` lớn nhất mà đỉnh vẫn chưa chạm
1,0. Chạy trong Chromium (`OfflineAudioContext` không có ở Node), điều khiển qua
`--remote-debugging-port` rồi `Runtime.evaluate` với `awaitPromise`. **Không dùng
`--dump-dom` với `--virtual-time-budget`**: DOM bị đổ ra trước khi `startRendering()`
kịp xong, và thứ in ra là trang lúc chưa có kết quả chứ không phải lỗi gì cả.

**Bài học chung.** Trong một chuỗi Web Audio, **nút âm lượng của người dùng phải là mắt
cuối cùng**. Bất cứ thứ gì phi tuyến đặt sau nó — nén, méo, cổng tiếng — đều biến thanh
trượt thành một đường cong không ai đoán được. Và mỗi lần đụng vào con số âm lượng thì
đo lại đỉnh với RMS, đừng tin tai: tai quen rất nhanh với mức đang nghe.

---

## 21. Chạy toàn màn hình thì `env(safe-area-inset-bottom)` bằng 0, thanh tab tụt sát mép

**Triệu chứng.** Thanh tab dưới đáy nằm sát cạnh dưới của màn hình, chữ gần như chạm mép
máy. Bấm vào tab hay trượt, có lúc máy hiểu thành cử chỉ vuốt về màn hình chính. Mở cùng
trang đó bằng tab Chrome thường thì trông bình thường, nên rất dễ tưởng là do thiết bị.

**Nguyên nhân.** `env(safe-area-inset-bottom)` không phải là "chừa một chút cho đẹp" — nó
là **bề dày của thứ đang che màn hình**. App khai `display: 'fullscreen'` nên hệ điều hành
ẩn luôn thanh điều hướng Android; không còn thanh nào che thì inset đúng bằng **0**, và
CSS nào dựa vào nó để chừa chỗ sẽ chừa đúng 0px.

Nghịch lý ở chỗ: chính cái làm màn hình rộng thêm lại làm thanh tab khó bấm hơn. Mà dải
vuốt-để-về-màn-hình-chính của Android (thường 16-24px) vẫn nằm đó dù thanh điều hướng đã
ẩn — nó không xuất hiện trong bất kỳ `env()` nào.

**Cách sửa.** Đặt một mức sàn, đừng tin `env()` một mình:

```css
:root {
  --tab-bar-bottom: max(var(--safe-bottom), 16px);
}
```

`max()` chứ không phải cộng thêm: máy CÓ khuyết dưới đáy (iPhone, Android để thanh điều
hướng) thì `--safe-bottom` đã lớn hơn 16px và tự thắng, nên không cộng dồn thành thừa chỗ.

**Nhớ sửa cả những chỗ ăn theo.** Thanh tab dày lên thì mọi thứ tính vị trí theo nó phải
đổi cùng: `.app-content` chừa chỗ cuối trang, và thanh mời cài đặt phải nổi TRÊN thanh tab
(`InstallPrompt.tsx`). Chỗ nào còn viết `env(safe-area-inset-bottom)` thẳng trong khi thanh
tab đã tính theo biến mới thì sẽ lệch đúng bằng phần chênh, và triệu chứng là một thanh
thụt xuống nằm khuất sau mép trên của thanh kia.

**Bài học chung.** `env(safe-area-inset-*)` trả lời câu "có gì đang che không", KHÔNG trả
lời câu "chạm tới đây có thoải mái không". Vùng chạm sát mép màn hình luôn cần mức sàn tự
đặt.

---

## 22. Năm lệnh kiểm xanh hết mà mở trang ra vẫn 500

**Triệu chứng.** `tsc`, `pnpm lint`, `pnpm test`, `pnpm check:lessons` và `npx next build`
đều xanh. Mở trang lên thì 500, log ghi *"Functions cannot be passed directly to Client
Components unless you explicitly expose it by marking it with `use server`"*.

**Nguyên nhân.** Truyền `component={Link}` cho một component của Mantine từ trong **Server
Component**. Một component là một HÀM, mà hàm không tuần tự hoá được qua ranh giới
server/client. Đây là bà con gần của bẫy 1 — cùng gốc "Mantine + Server Component", nhưng
triệu chứng và chỗ sai khác hẳn nên ghi riêng.

```tsx
// ✗ trong Server Component
<Card component={Link} href="/path/3">…</Card>
<Button component={Link} href="/path/4">Chương 4</Button>
```

**Cách sửa.** Nhốt prop đó vào một client component rồi dùng nó ở trang — repo có sẵn
`NavAnchor.tsx` (cho `Anchor`) và `NavButton.tsx` (cho `Button`). Cả thẻ là link thì dựng
thẳng bằng `<Link>` với CSS riêng, đừng mượn `Card` của Mantine — xem `PathChapterCard.tsx`.

**Vì sao không lệnh kiểm nào bắt được.** `tsc` thấy prop hợp kiểu (Mantine khai
`component` là polymorphic, nhận mọi component). Lint không xét ranh giới server/client.
Test không dựng trang. Còn `next build` **cũng qua**: trang này là `ƒ` (dựng theo từng
lượt xem), nên lỗi chỉ nổ lúc có người mở thật, không phải lúc build. Chỉ trang `○`
(dựng sẵn) mới làm build đỏ.

**Bài học chung.** Bẫy 19 dạy "bốn lệnh xanh không có nghĩa deploy chạy". Bẫy này đi thêm
một bước: **năm lệnh xanh cũng không có nghĩa trang mở được**. Đổi giao diện thì phải
dựng bản, chạy `next start`, rồi `curl` hoặc mở trình duyệt thật từng đường dẫn mới:

```bash
npx next start -p 3112 &
for u in / /path /path/3; do echo "$u -> $(curl -s -o /dev/null -w '%{http_code}' -L localhost:3112$u)"; done
```

---

## 23. `pointerdown` bắn trước `click`, và lệnh `start()` đang chờ vẫn thắng lệnh `stop()`

**Triệu chứng.** Người học bấm *Nghe thử* một bản nhạc mẫu. Bản nhạc phát bình thường,
rồi **một hai giây sau nhạc nền kêu chồng lên**. Bấm dừng rồi bấm nghe lại thì lần này
không sao. Sổ đăng ký giữ chỗ (`ambient-hold.ts`) đo ra vẫn đúng: có người giữ, và lệnh
`stop()` có chạy.

**Nguyên nhân.** Hai đường cùng chạy, và đường sai về đích sau:

1. Mở trang, nhạc nền gọi `start()` nhưng trình duyệt chặn vì chưa có cử chỉ người dùng.
   Nó gắn một listener `pointerdown` chờ chạm để thử lại — đây là cách duy nhất, xem
   bẫy 21.
2. Người học chạm nút *Nghe thử*. **`pointerdown` bắn TRƯỚC `click`**, nên listener kia
   chạy trước, gọi `start()`, và lệnh này rơi vào `await ctx.resume()`.
3. React mới xử lý `click`: bản nhạc phát, gọi `holdAmbient()`, hiệu ứng chạy lại và gọi
   `stop()`. Lúc này `start()` vẫn đang chờ.
4. `resume()` xong, `start()` đi tiếp, đặt `setInterval` và bắt đầu hẹn lịch phát.

Nói cách khác: **lệnh dừng chạy xong trước khi lệnh bật kịp bắt đầu**, nên nó không có gì
để dừng cả.

**Vì sao chốt sẵn có không bắt được.** Trong `start()` đã có một chốt sau khi chờ:

```ts
if (this.ctx !== ctx || ctx.state !== 'running') return false;
```

Nhưng nó chỉ bắt được `dispose()`, vì chỉ `dispose()` mới đặt `this.ctx` về null. `stop()`
KHÔNG đụng tới `this.ctx` — nó chỉ xoá `setInterval` và hạ tiếng. Nên sau khi chờ xong,
mọi thứ trông y hệt lúc bắt đầu.

**Cách sửa.** Một cờ "đang muốn kêu", bật ở đầu `start()`, hạ ở đầu `stop()`, và kiểm lại
**sau** mỗi lần chờ:

```ts
this.wantPlaying = true;            // đầu start()
await ctx.resume().catch(() => {});
if (!this.wantPlaying) return false; // ai đó đã stop() trong lúc chờ
```

**Cách kiểm.** Đừng thử bằng tay trên trình duyệt: trên máy thật `resume()` xong gần như
tức thì, bấm cả trăm lần chưa chắc trúng cửa sổ đua. Dựng một `AudioContext` giả mà
`resume()` là một lời hứa **ta tự cầm** rồi mới quyết lúc nào cho xong — xem
`ambient-engine.test.ts`. Viết xong thì **gỡ bản sửa ra chạy lại**: test không đỏ khi chưa
sửa là test không gác gì cả.

**Bài học chung.** Mọi thứ nằm sau một `await` đều phải hỏi lại *"trong lúc tôi chờ, thế
giới có đổi không?"*. Và với cử chỉ người dùng thì nhớ thứ tự: `pointerdown` → `pointerup`
→ `click`. Việc gắn vào `pointerdown` chạy trước mọi việc gắn vào `click`, kể cả việc của
React.

---

## 24. `{ once: true }` chỉ gỡ đúng listener vừa bắn, cái anh em sống tới hết phiên

**Triệu chứng.** Đã sửa bẫy 23 rồi mà nhạc nền **vẫn** kêu chồng lên bản nhạc mẫu. Lần này
không phải ngay lúc mở trang: người học dùng app một lúc, bấm *Nghe thử*, lỡ gõ một phím
(hoặc chạm ra chỗ trống trên màn hình) là nhạc nền bật lên đè lên bản nhạc.

**Nguyên nhân.** Chờ cử chỉ đầu tiên thì phải gắn hai listener, vì không biết trước người
ta chạm hay gõ:

```ts
window.addEventListener('pointerdown', thu, { once: true });
window.addEventListener('keydown', thu, { once: true });
```

`{ once: true }` tự gỡ **đúng cái vừa bắn**, cái kia còn nguyên. Bình thường hàm dọn dẹp
của effect gỡ nốt — nhưng ở đây chính vì lần đó `start()` thành công nên effect không chạy
lại, hàm dọn dẹp không bao giờ được gọi, và listener `keydown` sống tới hết phiên. Nửa giờ
sau nó vẫn đang chờ, và bắn vào đúng lúc không được phép bật.

Lỗ thứ hai đi kèm: hàm xử lý kiểm điều kiện **lúc gắn** chứ không kiểm **lúc bắn**. Lúc
gắn thì chưa ai giữ chỗ phát tiếng, nhưng cú chạm có thể rơi vào lúc người học đang mở
phần *Tập bài này với đàn* rồi chạm ra ngoài.

**Cách sửa.** Ba điều, thiếu cái nào cũng còn lỗ:

1. Hàm xử lý **tự gỡ cả nhóm ngay ở dòng đầu**, đừng trông vào `{ once: true }`.
2. **Hỏi lại mọi điều kiện ngay tại lúc bắn** — ai đang giữ chỗ, effect còn sống không,
   đối tượng trong closure có còn là đối tượng hiện hành không.
3. Mọi lối ra của `start()` đều phải **hạ cờ "đang muốn kêu"** xuống. Không hạ thì một lần
   bị trình duyệt chặn là cờ kẹt ở `true` suốt phiên, và nó mất nghĩa: cờ phải nói "đang
   thật sự muốn kêu", không phải "đã từng có lúc muốn".

**Cách kiểm — và vì sao lần này không kiểm được.** Đã dựng phép đo trên trình duyệt thật
(đếm `OscillatorNode` để phân biệt nhạc nền với soundfont của abcjs) nhưng không tái hiện
nổi: trong trình duyệt chạy tự động, cú chạm giả không được tính là cử chỉ thật nên bản
nhạc không phát; mà bỏ luật cần cử chỉ đi thì tình huống lỗi biến mất luôn. Gặp thế thì
đọc mã sửa hết lỗ nhìn thấy được, và **ghi rõ trong commit là chưa chứng minh được** thay
vì nói đã sửa xong.

**Bài học chung.** Một listener chờ cử chỉ là **một mẩu trạng thái sống lâu hơn effect
sinh ra nó**. Đã lỡ để nó sống thì mọi thứ nó đọc phải được đọc lại lúc nó chạy, không
phải lúc nó được gắn. Cùng họ với bẫy 18 (bộ phát mồ côi) và bẫy 23 (lệnh đang chờ về đích
sau).

---

## 25. Dấu hoá trong ABC sống tới hết ô nhịp, nên bản nhạc nhìn đúng mà phát sai một nốt

**Triệu chứng.** Người học báo bản nhạc Für Elise "sai nốt". Nhìn vào bản nhạc thì không
thấy gì lạ: đúng chín nốt, đúng hình nốt, đúng chỗ. Đối chiếu từng chữ trong khối ABC với
giai điệu thật cũng khớp — `e ^d e B d c` đúng là Mi, Rê thăng, Mi, Si, Rê, Đô.

**Nguyên nhân.** Luật ký âm — và abcjs làm đúng luật: **một dấu hoá có hiệu lực tới hết ô
nhịp**, cho mọi nốt cùng tên trong cùng quãng tám. Viết `^d` ở đầu ô rồi viết `d` ở cuối ô
là được **hai nốt Rê thăng**, không phải một thăng một thường. Người gõ đọc dòng đó theo
kiểu "mỗi chữ một nốt" nên không thấy, mà bản nhạc vẽ ra cũng không có dấu gì ở nốt sau —
đúng như luật, vì dấu đã ghi ở đầu ô rồi.

Muốn nốt Rê thường thì phải ghi **dấu bình**: `=d`.

**Cách nhận ra.** Đừng nghe bằng tai, hãy bắt abcjs nói ra nó định phát nốt nào:

```js
const html = abcjs.synth.getMidiFile(abc, { midiOutputType: 'json' })[0];
// note-on nằm trong chuỗi đã mã hoá phần trăm: %9<kênh>%<cao độ>%<lực>
const notes = [...html.matchAll(/%9[0-9a-f]%([0-9a-f]{2})/g)].map((m) => parseInt(m[1], 16));
```

Số MIDI 75 là Rê thăng, 74 là Rê. Đây là cách duy nhất kiểm được **cao độ thật sự phát
ra**, khác hẳn việc đọc lại chuỗi ABC bằng mắt.

**Cách sửa.** Ghi `=d`. Và để không giẫm lại, `songs.test.ts` có ca gác quét mọi ô nhịp
của mọi bản nhạc: nốt nào ăn theo dấu hoá của nốt trước trong cùng ô mà không tự ghi dấu
thì đỏ. Cùng file còn một ca cộng trường độ từng ô nhịp, vì ô thiếu phách cũng là lỗi nhìn
không ra.

**Bài học chung.** Bản nhạc trong `docs/08-bai-hat/` là **nhạc viết tay**: không có trình
soạn nhạc nào kiểm hộ, và sai ở đây không làm trang đỏ, không làm build đỏ, không làm test
nào khác trượt — nó chỉ phát sai, rồi người học đánh theo và tưởng tai mình có vấn đề. Mọi
thứ máy kiểm được (số phách, dấu hoá, khoá nhạc, khai nguồn bản quyền) phải có test gác;
thứ máy không kiểm được — giai điệu có đúng bài gốc không — thì phải có người đánh lên
nghe, và nói thẳng ra là chưa ai nghe.

---

## 26. Chạm vào hình SVG có chữ trên Android: kính lúp chọn chữ nhảy ra che nửa màn hình

**Triệu chứng.** Người dùng gửi ảnh chụp màn hình: giữa bàn phím piano vẽ bằng SVG có **một
cục tròn trắng to đùng** che mất ba quãng, hai bên là hai mảng đen cong. Không phải lỗi vẽ
— nó chỉ hiện lúc ngón tay đang chạm, và ảnh chụp lại bắt được đúng khoảnh khắc đó.

**Nguyên nhân.** Cục tròn đó là **kính lúp chọn chữ** của Android. Hình SVG có thẻ `<text>`
(nhãn "Đô giữa", "Đô3"…), nên ngón tay giữ lâu một chút trên hình được hệ điều hành hiểu là
đang định bôi đen chữ; nó bật kính lúp để người dùng ngắm con trỏ cho chính xác. Trên máy
tính không bao giờ thấy, vì chuột không có thao tác giữ để chọn chữ.

`pointer-events: none` trên chính thẻ `<text>` **không cứu được**: sự kiện chạm vẫn đi vào
phần tử cha, và cơ chế chọn chữ làm việc trên cả cây DOM chứ không theo từng thẻ.

**Cách sửa.** Trên thẻ bọc ngoài hình:

```css
user-select: none;
-webkit-user-select: none;
-webkit-touch-callout: none;
```

**Bài học chung, và là cái đáng giá hơn.** Chỗ sai thật ra nằm sớm hơn một bước: **bắt người
học chạm thẳng vào một hình vẽ để chọn**. Hình SVG không phải nút bấm — nó không có tên đọc
được, trình đọc màn hình không hiểu, vùng chạm phải tự dựng bằng ô trong suốt, và hệ điều
hành có quyền hiểu cú chạm theo cách của nó (đúng như kính lúp ở đây). Bản sửa không chỉ tắt
kính lúp mà **chuyển hẳn việc chọn xuống một hàng nút thật** ở dưới, còn hình vẽ giữ đúng
một việc: bôi màu cho thấy đang chọn vùng nào. Nút thật thì bấm trúng chắc chắn, đọc màn
hình hiểu, và không phần mềm nào tranh mất cú chạm.

---

## 27. Khuông nhạc nhảy lên nhảy xuống mỗi câu một chỗ

**Triệu chứng.** Bài luyện nhận nốt đổi câu thì **năm dòng kẻ nhảy lên nhảy xuống**, mắt
phải tìm lại khuông trước khi đọc được nốt. Nốt càng cao hoặc càng trầm thì nhảy càng xa.
Cả cái thẻ cũng cao thấp theo, nên hai cái nút bên dưới cũng nhảy.

**Nguyên nhân.** abcjs vẽ ảnh SVG **cao vừa đúng nội dung**: nốt xa khuông thì phải kẻ thêm
dòng kẻ phụ, ảnh cao thêm. Khung chứa lại canh giữa theo chiều dọc, nên ảnh cao thấp khác
nhau kéo theo khuông nhạc trôi đi. Đo thật ở tỉ lệ đang dùng: ảnh cao từ **186px** (Đô3 khóa
Pha) tới **512px** (Si7 khóa Sol), và dòng kẻ trên cùng nằm ở **22px** hay **162px** tính từ
mép ảnh tuỳ nốt.

**Cách sửa.** Khung cao cố định, bỏ canh giữa, rồi sau khi vẽ xong thì **dịch ảnh sao cho
dòng kẻ trên cùng luôn rơi đúng một chỗ**:

```ts
const ink = svg.getBBox();
const topLineY = svg.querySelector('.abcjs-top-line').getBBox().y * abcScale;
const { scale, translateY } = anchorTransform(
  box, topLineY, ink.y * abcScale, (ink.y + ink.height) * abcScale,
);
svg.style.transformOrigin = '0 0';
// Phải ghi lại CẢ tỉ lệ của abcjs trong chuỗi này — xem bẫy 28.
svg.style.transform = `translateY(${translateY}px) scale(${abcScale * scale})`;
```

Luật tính nằm ở `src/lib/staff-anchor.ts`, có test riêng. Ảnh nào cao quá khung thì thu nhỏ
vừa đủ — thà chữ bé đi còn hơn cắt mất cái nốt đang hỏi. Với các quãng đang cho chọn thì
việc thu nhỏ gần như không bao giờ xảy ra; nó là lưới an toàn.

**Chỗ mất thêm nửa giờ: đo bằng `getBoundingClientRect` thì lệch 7px.** Bản đầu đo vị trí
dòng kẻ bằng toạ độ màn hình (`rect` của dòng kẻ trừ `rect` của ảnh), và kết quả là khuông
vẫn nhảy trong khoảng 8px. Lý do: lúc effect chạy, trình duyệt chưa xếp xong chỗ cho ảnh
trong trang, nên hai toạ độ màn hình đó chưa ăn khớp nhau. **`getBBox` đo trong hệ toạ độ
của chính ảnh SVG** nên đo lúc nào cũng ra một số. Sau khi đổi, dòng kẻ đứng đúng một chỗ
qua hai mươi câu liên tiếp.

**Bài học chung.** Đo cái gì thuộc về bên trong một ảnh SVG thì đo bằng `getBBox`, đừng đo
bằng toạ độ màn hình. Toạ độ màn hình phụ thuộc vào chỗ ảnh nằm trong trang, mà chỗ đó chưa
chắc đã chốt vào lúc mã của mình chạy.

---

## 28. Ghi `style.transform` lên ảnh abcjs là xoá luôn tỉ lệ, bản nhạc bé đi một nửa

**Triệu chứng.** Sau bản sửa ở bẫy 27, khuông nhạc **đứng yên đúng như mong muốn** — nhưng
chữ nhạc bé đi thấy rõ, nốt đọc từ giá nhạc cách nửa sải tay thì phải nheo mắt. Không có lỗi
nào trong console, năm lệnh kiểm xanh hết, test của `staff-anchor.ts` cũng xanh vì luật tính
neo vẫn đúng. Bản bé một nửa này **đã nằm trên production** từ commit
`fix: Neo khuông nhạc đứng yên, không nhảy theo cao độ nốt` cho tới lần sửa sau đó.

**Nguyên nhân.** Tuỳ chọn `scale` của abcjs **không phải** thuộc tính `width`/`height` hay
`viewBox` của SVG. abcjs cài nó bằng đúng một dòng `style` nội tuyến trên thẻ SVG:

```html
<svg style="transform: scale(2,2); transform-origin: 0px 0px" ...>
```

Nên `svg.style.transform = 'translateY(...)'` **ghi đè thẳng lên chỗ đó**. Tỉ lệ 2 biến mất,
ảnh vẽ ở tỉ lệ 1 — đúng một nửa. Không có lỗi nào báo ra vì về mặt DOM thì chẳng có gì sai
cả: mình ghi một `transform` hợp lệ lên một thẻ SVG hợp lệ.

Hai chuyện đi kèm làm nó khó thấy:

- **Tất cả các số đo vẫn "hợp lý".** Dòng kẻ vẫn được neo đúng chỗ, khuông vẫn đứng yên,
  chỉ là mọi thứ nhỏ đi cùng một tỉ lệ nên nhìn ảnh chụp riêng lẻ không ai nhận ra.
- **`getBBox()` trả về đơn vị TRƯỚC khi nhân tỉ lệ.** Nghĩa là lúc bản sửa đang xoá tỉ lệ,
  các con số đo được lại đúng khớp với ảnh đã bị thu nhỏ, nên phép neo vẫn ra kết quả đẹp.
  Sửa xong mới phải nhân `abcScale` vào cả ba số đo.

**Cách sửa.** Gộp cả hai phép biến hình vào một chuỗi, và dùng đúng gốc toạ độ `0 0` của
abcjs (để `top center` thì ảnh còn xê ngang):

```ts
svg.style.transformOrigin = '0 0';
svg.style.transform = `translateY(${translateY}px) scale(${abcScale * scale})`;
```

Tỉ lệ của abcjs nay là hằng số đặt tên trong `src/lib/staff-anchor.ts`
(`SINGLE_STAFF_SCALE`, `GRAND_STAFF_SCALE`) chứ không còn viết thẳng vào lời gọi
`renderAbc`, để chỗ tính neo và chỗ vẽ không thể lệch nhau nữa.

**Vì sao năm lệnh kiểm không bắt được, và cái gì bắt được.** Đây là lỗi *nhìn thấy*, không
phải lỗi *chạy sai*: không có khẳng định nào để vi phạm. Thứ bắt được nó là **đo kích thước
thật trên trình duyệt thật** — mở trang bằng Playwright rồi đọc `getBoundingClientRect()`
của ảnh SVG và so với chiều cao khung. Từ nay hễ đụng vào chỗ vẽ bản nhạc thì đo cả **ba
số**: vị trí dòng kẻ trên cùng (phải đứng yên), chiều cao khung (phải cố định), và **bề rộng
nét vẽ** (phải giữ nguyên qua các câu) — số thứ ba chính là số phát hiện ra bẫy này.

**Bài học chung.** Thư viện nào cũng có thể cài đặt một tuỳ chọn của nó bằng chính thuộc
tính DOM mình đang định ghi đè. Trước khi ghi `style.*` lên phần tử do thư viện tạo ra,
**đọc xem nó đang để sẵn cái gì ở đó** — một dòng `console.log(el.getAttribute('style'))` là
đủ, và rẻ hơn nhiều so với việc bản production chạy sai suốt mấy ngày.

**Hệ quả: `abcjs` bị ghim đúng một phiên bản trong `package.json`** (`"abcjs": "6.7.0"`,
không có dấu `^`). Bẫy 28 tới 33 đều dựa vào chi tiết *bên trong* thư viện — nó ghi đè
`style.transform`, bọc ảnh trong `div` `overflow: hidden`, tự ghi `width` lên thẻ chứa, và
`scale` thì chia chỗ chứ không phải cỡ chữ. Không chi tiết nào trong số đó là lời hứa công
khai của thư viện, nên một bản vá nhỏ cũng đủ đổi, mà đổi thì **không lệnh kiểm nào báo**:
`tsc`, `lint`, `vitest` và cả `next build` đều xanh, chỉ có bản nhạc trên màn hình là sai.
Nâng abcjs là việc **có chủ ý**: đổi con số đó bằng tay, rồi mở lại đúng bốn bẫy này mà nhìn
bằng mắt trên khung điện thoại trước.

---

## 29. abcjs bọc ảnh trong `div` có `overflow: hidden`, dịch ảnh xuống là mất dòng kẻ

**Triệu chứng.** Khuông đôi vẽ ra **thiếu ba dòng kẻ dưới cùng của khuông Pha**: còn mỗi khóa
Pha và hai dòng kẻ, phần dưới trắng trơn. Không có lỗi nào báo ra, và **DOM nói mọi thứ đều
bình thường** — đủ mười thẻ `path` dòng kẻ, `visibility: visible`, `opacity: 1`, toạ độ nằm
gọn trong khung. Chỉ ảnh chụp màn hình mới thấy thiếu.

**Nguyên nhân.** `renderAbc` không đặt ảnh SVG thẳng vào thẻ mình đưa cho nó: nó **bọc thêm
một `div` của riêng nó**, và đặt inline lên `div` đó `overflow: hidden` cùng `height` đúng
bằng chiều cao ảnh **chưa dịch**. Phép neo ở bẫy 27 dịch ảnh xuống mấy chục px, nên phần thò
ra khỏi chiều cao ấy bị `div` kia cắt — cắt lặng lẽ, vì cắt bằng `overflow` thì phần tử vẫn
còn nguyên trong DOM với đúng toạ độ của nó.

Chỗ này là chỗ dễ mất nhiều thời gian nhất: mọi phép đo trong DOM đều nói "vẽ rồi, nằm đúng
chỗ rồi". Muốn tìm ra thì phải **đi ngược cây cha mẹ từ thẻ SVG lên**, đọc `overflow` và
chiều cao của từng đời, rồi so với vị trí đã dịch.

**Cách sửa.** Sau mỗi lần vẽ (abcjs ghi lại thuộc tính này mỗi lần) thì trả nó về `visible`:

```ts
paper.style.overflow = 'visible';
```

Chỗ cắt thật lúc đó là cái khung ngoài do mình đặt — đúng như phép neo giả định.

**Bài học chung, cùng một họ với bẫy 28.** Thư viện vẽ đồ hoạ hay **để lại inline style trên
những thẻ nó tự tạo ra**, và hai thứ hay gặp nhất là `transform` (bẫy 28) với `overflow` +
`height` (bẫy này). Cả hai đều không phá lúc mình mới ghi đè, chỉ phá về sau khi nội dung
đổi. Nên mỗi khi phải dịch hay phóng thứ do thư viện vẽ: đọc inline style của chính thẻ đó
**và của cả cây cha mẹ tới thẻ mình đưa cho thư viện**, trước khi ghi.

**Cách kiểm rẻ nhất cho cả nhóm lỗi này: đếm dòng kẻ trên ẢNH CHỤP.** Năm dòng cho một
khuông, mười dòng cho khuông đôi — đếm số hàng pixel đen chạy ngang gần hết bề ngang ảnh.
Phép đếm này bắt được cả cắt mất, cả vẽ nhỏ đi, cả vẽ đè lên nhau; DOM thì không nói được gì
về cả ba.

---

## 30. abcjs ghi cả `width` lên thẻ chứa, nên đo khung là đo lại chính cái ảnh

**Triệu chứng.** Ô nhịp 4/4 ở bài luyện nhận nốt **tràn ra ngoài khung và mất nốt ở hai
mép** — khuông đôi vẽ ra rộng 358px trong một khung chỉ 288px. Đã có sẵn đoạn thu nhỏ cho
vừa khung, và nó **chạy** (thấy rõ `transform` mới trên thẻ SVG), nhưng tỉ lệ nó tính ra
luôn bằng 1. Không lỗi, không cảnh báo; chỉ mất nốt.

**Nguyên nhân.** Đoạn thu nhỏ đo bề ngang khung bằng `paper.clientWidth`, với `paper` là
thẻ đưa cho `renderAbc`. Nhưng **abcjs ghi inline `width` lên chính thẻ ấy**, đúng bằng bề
ngang ảnh nó vừa vẽ. Nên sau lần vẽ đầu tiên, `clientWidth` không còn là bề ngang khung nữa
mà là bề ngang ảnh — phép tính thành `ảnh / ảnh = 1`, và kết luận "vừa rồi, khỏi thu".

**Cách sửa.** Xoá bề ngang abcjs vừa ghi, ngay trước khi đo:

```ts
paper.style.width = '';
```

**Dấu hiệu nhận ra sớm.** Một phép tính tỉ lệ *"nội dung so với khung"* mà **kết quả luôn
đúng bằng 1** thì gần như chắc chắn là đang so một thứ với chính nó. In cả tử lẫn mẫu ra
trước khi đi tìm chỗ khác.

**Cùng họ với bẫy 28 và 29** — thư viện vẽ đồ hoạ để lại inline style trên thẻ mình đưa cho
nó. Tới đây đã đủ ba thuộc tính bị ghi đè: `transform` (bẫy 28), `overflow` + `height`
(bẫy 29), và `width` (bẫy này). Lần sau đụng tới kích thước của thứ do thư viện vẽ thì
**giả định mặc định là mọi thuộc tính hình học trên thẻ đó đều đã bị nó ghi**, và dọn trước
khi đo.

## 31. Tuỳ chọn `scale` của abcjs không phải cỡ chữ, nó CHIA chỗ dành cho nhạc

**Triệu chứng.** Ô nhịp 4/4 vẽ ra **chỉ chiếm quá nửa khung giấy nhạc**, phần bên phải
trắng trơn — đo thật trên máy người dùng: khuông nhạc rộng 160px trong khung 320px. Nới
`staffwidth` to ra thì khung to theo nhưng **khuông nhạc vẫn đúng ngần ấy**, khoảng trống
bên phải chỉ càng rộng.

**Nguyên nhân.** Hai chỗ cùng lúc:

1. abcjs xếp nhạc vừa **`staffwidth / scale`** đơn vị chứ không phải trọn `staffwidth`.
   Đo ở tỉ lệ 1.25 thì nhạc chiếm đúng 76% bề ngang khung, và tỉ lệ này **không đổi** dù
   `staffwidth` to nhỏ thế nào (đo ở 253, 316, 395 đều ra 76-77%).
2. Mà ở component này, `scale` truyền cho abcjs **không quyết định cỡ chữ cuối cùng** —
   phép vẽ cuối do `style.transform` của mình ghi đè (bẫy 28). Nên nó còn đúng một tác
   dụng duy nhất, và tác dụng đó lại là cái vừa nói ở trên: bóp nhạc lại trong khung.

**Cách sửa.** Chỗ nào muốn nhạc chiếm hết bề ngang thì **truyền `scale: 1`** cho abcjs rồi
để transform của mình lo cỡ chữ:

```ts
ABCJS.renderAbc(paper, abc, {
  staffwidth: Math.round(availPx / tiLeMinhSeApDung),
  scale: 1,
});
```

Sau khi sửa: khuông nhạc 305px trong khung 316px — 96%, phần còn lại là chỗ dấu ngoặc ôm
hai khuông.

**Đừng đi nhầm hướng như lần đầu.** Triệu chứng "nhạc không đầy khung" trông hệt như lỗi
thiếu kéo giãn, nên phản xạ đầu tiên là đi tìm `%%stretchlast`. Nhưng đo riêng abcjs ngoài
app thì **khuông nhạc đã đầy 96% sẵn, có hay không có `%%stretchlast` cũng thế** — nghĩa là
lỗi không nằm ở đó. Chính chỗ số đo ngoài app khác số đo trong app mới chỉ ra thủ phạm là
một tuỳ chọn đang truyền vào.

**Cách soi nhanh cho mọi bẫy họ này.** Dựng lại đúng đoạn ABC đó trong một trang trắng,
nạp `node_modules/abcjs/dist/abcjs-basic-min.js`, rồi quét qua các giá trị tuỳ chọn và đo
`.abcjs-top-line`. Vài chục giây, và nó trả lời dứt khoát câu "tại thư viện hay tại mình".

## 32. Vẽ theo số đo px thì phải theo dõi kích thước, không thì xoay máy là hỏng

**Triệu chứng.** Xoay điện thoại xong, khuông nhạc **giữ nguyên cỡ của hướng cũ**. Xoay
ngang thì bản nhạc bé tí nằm nép bên trái một cái khung rộng gấp đôi; trong chế độ tập
trung thì ngược lại — bản nhạc **thò xuống dưới đáy khung rồi bị cắt mất khuông Pha**. Đo
được: khung rộng 876px mà bản nhạc vẫn 354px, và thò xuống dưới đáy 209px.

**Nguyên nhân.** Bản nhạc được vẽ theo **số đo px của khung tại đúng lúc vẽ** — bề ngang
quyết `staffwidth`, chiều cao quyết hệ số phóng. Mà hiệu ứng vẽ chỉ chạy lại khi đổi câu
hỏi hoặc vào/ra chế độ tập trung. Xoay máy không đụng tới cái nào trong hai thứ đó, nên
không có gì bắt vẽ lại.

Đây là cái giá của việc tự tính kích thước. Chỗ vẽ bản nhạc bài học không dính vì nó dùng
`responsive: 'resize'` của abcjs — abcjs tự theo dõi khung. Chỗ nào **tự tính** thì phải
**tự theo dõi**.

**Cách sửa.** `ResizeObserver` trên khung, đẩy số đo vào state, cho hiệu ứng vẽ phụ thuộc
state đó:

```ts
const observer = new ResizeObserver(() => {
  const w = Math.round(el.clientWidth);
  const h = Math.round(el.clientHeight);
  // Chỉ báo khi ĐỔI THẬT, và trả về chính đối tượng cũ khi không đổi —
  // hiệu ứng vẽ ghi vào DOM bên trong khung, báo bừa là vẽ lại vô tận.
  setBoxSize((truoc) => (truoc.w === w && truoc.h === h ? truoc : { w, h }));
});
```

Chọn `ResizeObserver` chứ không nghe `orientationchange`: nó bắt được mọi kiểu đổi kích
thước (xoay máy, đổi cỡ cửa sổ, bàn phím ảo, vào/ra lớp phủ), và nó bắn **sau** khi trình
duyệt xếp xong chỗ nên số đo lấy ra là số thật.

## 33. Tô màu lên thứ thư viện vừa vẽ: đừng để trong một hiệu ứng riêng

**Triệu chứng.** Con trỏ màu trên khuông nhạc **lặng lẽ biến mất**. Ba lần, mỗi lần một
nguyên nhân bề mặt khác nhau: lần đầu khi bật chế độ tập trung, lần hai ngay khi mới mở
trang, lần ba khi xoay máy. Không lỗi nào báo ra.

**Nguyên nhân, chung cho cả ba.** Màu được đặt bằng cách thêm lớp CSS lên **phần tử SVG do
thư viện vẽ ra**, và tham chiếu tới chúng giữ trong một ref. Mỗi lần bản nhạc được vẽ lại,
thư viện vứt hết phần tử cũ và dựng phần tử mới — màu vừa đặt nằm trên mấy thẻ vừa bị vứt.
Hiệu ứng tô màu thì có danh sách phụ thuộc RIÊNG, nên nó không chạy lại.

Cái bẫy nằm ở chỗ: **mỗi lần thêm một thứ khiến bản nhạc vẽ lại thì phải nhớ thêm thứ đó
vào danh sách phụ thuộc của hiệu ứng tô màu nữa.** Hai danh sách phải khớp nhau đời đời,
mà không có gì bắt buộc điều đó — quên là hỏng, và hỏng im lặng.

**Cách sửa.** Tách việc tô màu thành một **hàm**, rồi **gọi thẳng ở cuối chỗ vẽ**, ngay sau
khi nhặt lại tham chiếu phần tử. Hiệu ứng riêng chỉ giữ lại cho việc con trỏ nhích (lúc đó
bản nhạc KHÔNG vẽ lại, cố ý — vẽ lại là cả ô nhịp nháy một cái mỗi lần bấm đúng một nốt).

Luật chung: **thứ gì phải chạy sau mỗi lần vẽ thì gọi trong chỗ vẽ, đừng gửi gắm cho một
hiệu ứng khác.** Danh sách phụ thuộc thứ hai là thứ sẽ lệch.

## 34. Gom hàm dùng chung: biến trùng tên hàm vừa import, app vẫn chạy nhưng đọc sai nốt

**Triệu chứng.** Sau khi gom ba hàm "phím đen hay phím trắng" về `src/lib/pitch.ts`, hai ca
test trượt: nốt MIDI 58 đáng ra là **Si giáng** thì ra **La thăng**. Không có lỗi nào ném
ra, kiểu vẫn xanh, lint vẫn xanh. Nếu không có test thì thứ đi ra ngoài là tên nốt hiện sai
trên màn hình người học, ở đúng những nốt hoá — chỗ người mới ít tự tin nhất để nghi ngờ.

**Nguyên nhân.** Trong `noteAt` có biến cục bộ tên `pitchClass`. File vừa được thêm dòng
`import { pitchClass } from './pitch'`, và biến cục bộ được đổi tên thành `pc` cho khỏi che
mất hàm. Đổi chỗ khai báo và một chỗ dùng thì thấy ngay, nhưng còn một chỗ dùng nữa nằm sâu
trong một biểu thức: `key.chromatic?.[pitchClass]`. Sau khi đổi, nó không còn tra bảng bằng
**số** nữa mà bằng **hàm** — `undefined`, rồi rơi xuống nhánh mặc định `prefersSharp`.

Vì sao trượt khỏi mọi lưới: lấy một hàm làm khoá object là chuyện TypeScript cho phép (khoá
bị ép về chuỗi), nên `tsc` im lặng; và nhánh mặc định vẫn trả về một cách viết **hợp lệ**,
chỉ là không phải cách viết đúng của giọng đó.

**Cách sửa.** Đổi tên xong thì **đọc lại cả file bằng `grep` chính cái tên cũ**, đừng tin
mắt — `grep -n "pitchClass" src/lib/midi-notes.ts`. Và khi gom hàm dùng chung, ưu tiên đặt
tên hàm khác hẳn tên biến hay gặp (`isBlackPitch` chứ không phải `black`), để lần import
sau không tạo ra cảnh che tên.

Luật chung: **gom trùng lặp là việc đáng làm, nhưng mỗi lần gom phải có test chạy qua chỗ
gom.** Ba bản sao cùng đúng thì xoá hai bản không ai thấy gì; một bản sai lệch thì chỉ test
mới chỉ ra, vì lỗi kiểu này không ném lỗi mà chỉ trả lời khác đi.

## Lịch sử cập nhật

> Mỗi lần sửa file thì **thêm một dòng mới lên đầu bảng**, không sửa dòng cũ. Cột
> *Tiêu đề commit* phải chép **y hệt** tiêu đề commit để tìm lại được bằng
> `git log --grep="<tiêu đề>"` hoặc gõ thẳng vào ô tìm kiếm của Fork.

| Ngày | Tiêu đề commit | Cập nhật gì |
|---|---|---|
| 12/09/2026 | `refactor: Tách khung xem bản nhạc thành cửa vẽ và cửa tiếng, ghim phiên bản abcjs` | Ghi vào bẫy 28 lý do `abcjs` bị ghim đúng `6.7.0` không có `^`: bẫy 28-33 đều bám vào chi tiết bên trong thư viện, mà chi tiết đó đổi thì cả năm lệnh kiểm vẫn xanh và chỉ bản nhạc trên màn hình là sai. Sửa tên file cho khớp: `AbcjsViewer.tsx` nay là `SheetViewer.tsx`, phần vá `SynthControllerInternals` dời sang `src/hooks/useSheetAudio.ts` |
| 12/09/2026 | `refactor: Gộp bốn kho nhớ và ba hàm phím đen về một chỗ, kèm quy ước viết mã` | Thêm bẫy 34 — đổi tên biến trùng tên hàm vừa import làm `key.chromatic?.[pitchClass]` tra bảng bằng hàm, nốt Si giáng lặng lẽ hiện thành La thăng mà `tsc` và lint đều xanh; ghi kèm luật mỗi lần gom trùng lặp phải có test chạy qua chỗ gom |
| 12/09/2026 | `fix: Vẽ lại khuông nhạc khi xoay máy, và tô lại con trỏ ngay sau mỗi lần vẽ` | Thêm bẫy 32 và 33, cả hai đều là lỗi im lặng gặp trên máy thật. Bẫy 32: vẽ theo số đo px thì phải tự theo dõi kích thước bằng `ResizeObserver`, không thì xoay máy là bản nhạc giữ nguyên cỡ hướng cũ rồi bị cắt. Bẫy 33: tô màu lên phần tử do thư viện vẽ mà để trong một hiệu ứng riêng thì hai danh sách phụ thuộc phải khớp nhau đời đời — đã hỏng ba lần vì đúng lý do đó, nên chuyển thành gọi thẳng ở cuối chỗ vẽ |
| 12/09/2026 | `fix: Ô nhịp 4/4 kéo giãn hết bề ngang khung, chữ nhạc to như chế độ một nốt` | Thêm bẫy 31: tuỳ chọn `scale` của abcjs xếp nhạc vừa `staffwidth / scale` chứ không trọn `staffwidth`, nên ở chỗ đã ghi đè `transform` (bẫy 28) thì nó chỉ còn tác dụng bóp nhạc lại — ô nhịp 4/4 chiếm 76% khung, nới `staffwidth` cũng vô ích. Ghi kèm cách soi: dựng lại đoạn ABC trong trang trắng rồi đo, vì chính chỗ số đo ngoài app khác số đo trong app mới chỉ ra thủ phạm là một tuỳ chọn đang truyền vào |
| 12/09/2026 | `feat: Luyện nhận nốt đọc được cả ô nhịp 4/4, không chỉ một nốt` | Thêm bẫy 30: abcjs ghi cả `width` lên thẻ chứa, nên phép thu nhỏ cho vừa khung đem ảnh so với chính nó và luôn ra tỉ lệ 1 — ô nhịp tràn ra ngoài, mất nốt ở hai mép, không lỗi nào báo. Ghi kèm dấu hiệu nhận ra sớm (tỉ lệ *nội dung trên khung* mà luôn đúng bằng 1) và chốt bài học chung của cả ba bẫy 28-29-30: giả định mọi thuộc tính hình học trên thẻ đưa cho thư viện vẽ đều đã bị nó ghi đè |
| 12/09/2026 | `feat: Dấu hoá đứng ở hoá biểu đầu khuông, và bản nhạc to lại như cũ` | Thêm bẫy 28 và 29 — abcjs cài tuỳ chọn `scale` bằng chính `style.transform` của thẻ SVG, lại còn bọc ảnh trong một `div` `overflow: hidden` cao đúng bằng ảnh chưa dịch nên khuông Pha mất ba dòng kẻ dưới cùng, nên bản sửa neo khuông ở bẫy 27 đã âm thầm xoá tỉ lệ và cho production chạy bản nhạc bé một nửa mấy ngày; ghi kèm chuyện `getBBox` trả về đơn vị trước khi nhân tỉ lệ, và ba số phải đo lại mỗi lần đụng vào chỗ vẽ bản nhạc |
| 12/09/2026 | `fix: Neo khuông nhạc đứng yên, không nhảy theo cao độ nốt` | Thêm bẫy 27 — abcjs vẽ ảnh cao vừa nội dung nên khuông nhạc trôi mỗi câu một chỗ; kèm chuyện đo bằng `getBoundingClientRect` lệch 7px vì lúc effect chạy trang chưa xếp xong chỗ, phải đo bằng `getBBox` trong hệ toạ độ của chính ảnh SVG |
| 12/09/2026 | `fix: Chọn quãng bằng nút bấm, hình đàn chỉ bôi vùng đang tập` | Thêm bẫy 26 — chạm vào hình SVG có chữ trên Android làm kính lúp chọn chữ nhảy ra che nửa màn hình, và `pointer-events: none` trên thẻ `text` không cứu được; ghi kèm bài học lớn hơn là đừng bắt người học chạm thẳng vào hình vẽ để chọn |
| 11/09/2026 | `fix: Sửa nốt sai của Für Elise và thêm bản nâng cao hai tay cho mọi bài hát` | Thêm bẫy 25 — dấu hoá trong ABC có hiệu lực tới hết ô nhịp nên nốt Rê của Für Elise phát ra Rê thăng trong khi bản nhạc nhìn vẫn đúng; ghi kèm cách đọc cao độ thật bằng `getMidiFile` thay vì đọc lại chuỗi ABC bằng mắt, và vì sao nhạc viết tay cần test gác riêng |
| 11/09/2026 | `docs(internal): Ghi nhật ký phiên tối 11/09 và bẫy 24` | Thêm bẫy 24 — `{ once: true }` chỉ gỡ listener vừa bắn nên cái anh em sống tới hết phiên và bật nhạc nền lúc phải im; ghi kèm chuyện phải hỏi lại điều kiện lúc bắn chứ không phải lúc gắn, và vì sao lỗi này không tái hiện được bằng trình duyệt chạy tự động |
| 11/09/2026 | `fix: Nhạc nền không kêu chồng lên bản nhạc mẫu nữa` | Thêm bẫy 23 — `pointerdown` bắn trước `click` nên lệnh bật nhạc nền chạy trước lệnh dừng, rồi về đích sau khi `resume()` xong; kèm cách dựng AudioContext giả để tái hiện cuộc đua và lời nhắc phải gỡ bản sửa ra thử lại |
| 11/09/2026 | `feat: Gom lý thuyết, bài tập và tick vào một đường đi theo chương` | Thêm bẫy 22 — `component={Link}` của Mantine trong Server Component làm trang 500 mà cả năm lệnh kiểm vẫn xanh, vì trang dựng theo từng lượt xem nên `next build` không chạm tới; kèm cách kiểm bằng `next start` + `curl` từng đường dẫn |
| 11/09/2026 | `fix: Nới đáy thanh tab để không bị sát mép màn hình` | Thêm bẫy 21 — chạy toàn màn hình thì `env(safe-area-inset-bottom)` bằng 0 nên thanh tab tụt sát mép và chồng lên dải vuốt về màn hình chính của Android; ghi rõ phải đặt mức sàn bằng `max()` và phải sửa kèm mọi chỗ tính vị trí theo thanh tab |
| 11/09/2026 | `fix: Nhạc nền to lên đúng mức khi kéo thanh trượt hết cỡ` | Thêm bẫy 20 — bộ nén đặt sau nút âm lượng làm đoạn trên của thanh trượt gần như vô tác dụng, cộng với `knee` mặc định 30dB không ai viết ra trong mã; ghi kèm cách đo bằng `OfflineAudioContext` vì đo trên bối cảnh đang chạy thì ra số đánh lừa |
| 11/09/2026 | `fix: Cho test đo micro hạn giờ rộng để build trên Vercel không trượt` | Thêm bẫy 19 — build đỏ trên Vercel mà ở máy xanh hết, vì vitest bỏ cuộc sau 5 giây mỗi ca và ca đo độ chính xác micro mất 3 giây ngay ở máy bàn; ghi rõ đây là kiểu hỏng theo nhanh/chậm nên chạy lại ở máy vẫn xanh, dễ đổ oan cho Vercel |
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
