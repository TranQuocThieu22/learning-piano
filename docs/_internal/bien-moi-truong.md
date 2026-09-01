# Biến môi trường

> **Tài liệu nội bộ — KHÔNG hiển thị trên web.**
> Thư mục `_internal` nằm ngoài `contentDirs` trong `src/lib/markdown.ts` nên không
> xuất hiện trên thanh điều hướng.
>
> **Lịch sử cập nhật:** xem mục cuối file — mỗi lần sửa thêm một dòng, không ghi đè dòng cũ.

Tài liệu này liệt kê **mọi biến ứng dụng thật sự đọc**, ai đọc nó, và chuyện gì xảy
ra khi thiếu. Bản mẫu để chép là `.env.example`; file này giải thích *vì sao*.

---

## 1. Nguyên tắc chung

**Không biến nào ra tới trình duyệt.** Next.js chỉ đưa biến có tiền tố
`NEXT_PUBLIC_` xuống client, và dự án này không dùng tiền tố đó ở đâu cả. Nghĩa là
mọi biến dưới đây chỉ tồn tại phía máy chủ — kể cả `SEPAY_ACCOUNT_NUMBER`. Nếu sau
này thêm biến `NEXT_PUBLIC_*` thì phải coi giá trị đó là công khai hoàn toàn.

**Ba nơi nạp biến, và chúng không giống nhau:**

| Chạy cái gì | Có tự đọc `.env.local` không |
|---|---|
| `next dev` / `next build` | **Có**, Next.js tự lo |
| `drizzle-kit` (`pnpm db:generate`, `pnpm db:migrate`) | **Không** — nên `drizzle.config.ts` phải gọi `dotenv` thủ công |
| Script trong `scripts/` | **Không** — mỗi script tự gọi `config({ path: '.env.local' })` |

Đây là lý do các file đó có dòng `import { config } from 'dotenv'` ở đầu. Bỏ đi là
lệnh chạy tay hỏng ngay, dù `next dev` vẫn bình thường.

**Phía ứng dụng chỉ có một chỗ đọc `process.env`: `src/lib/env.ts`.** Có test canh
(`src/lib/env.test.ts`) rằng không file nào khác trong `src/` đọc thẳng, và rằng
mọi biến khai trong schema đều có mặt trong `.env.example`. Script trong `scripts/`
không tính — chúng là Node độc lập, tự nạp dotenv và tự kiểm lấy.

Khai báo nằm ở `src/lib/env-schema.ts` (phần thuần, tách khỏi `env.ts` vì
`server-only` làm test không nạp được module). Schema chia **ba tầng, khác nhau có
chủ ý — đừng gộp**:

| Tầng | Biến | Thiếu thì |
|---|---|---|
| Bắt buộc | `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | ném lỗi ngay lúc khởi động, nêu đủ mọi biến thiếu cùng lúc |
| Đóng cửa an toàn | `ADMIN_EMAILS`, `SEPAY_WEBHOOK_API_KEY` | tính năng đó tự khoá lại, ứng dụng vẫn sống |
| Tuỳ chọn | `DATABASE_URL_UNPOOLED`, `SEPAY_BANK_CODE`, `SEPAY_ACCOUNT_NUMBER`, `SEPAY_ACCOUNT_NAME` | lùi về mặc định |

Nâng hai biến tầng giữa lên tầng bắt buộc nghe có vẻ chặt hơn nhưng là **làm yếu
đi**: thà site chạy ở chế độ an toàn còn hơn site chết vì thiếu một khoá.

**Bí mật không bao giờ được commit.** `.env.local` đã nằm trong `.gitignore` —
kiểm tra lại bằng `git check-ignore .env.local` nếu nghi ngờ.

---

## 2. Database

### `DATABASE_URL` — **bắt buộc**

Chuỗi kết nối Postgres, dùng chuỗi **có pooler**.

- Đọc bởi: `src/db/index.ts` (mọi truy vấn của ứng dụng), và `drizzle.config.ts` khi
  không có bản unpooled.
- Thiếu thì sao: ứng dụng ném lỗi ngay lúc khởi động, không chạy được gì.
- Lưu ý: `src/db/index.ts` đặt `prepare: false` vì pooler ở chế độ transaction không
  hỗ trợ prepared statement. Đừng bỏ tuỳ chọn đó.

### `DATABASE_URL_UNPOOLED` — nên có

Chuỗi kết nối **trực tiếp**, không qua pooler.

- Đọc bởi: chỉ `drizzle.config.ts`.
- Thiếu thì sao: tự lùi về `DATABASE_URL`, vẫn chạy được. Nhưng lệnh đổi cấu trúc
  bảng (`drizzle-kit migrate`) chạy ổn định hơn khi đi thẳng, không qua pooler.

---

## 3. Đăng nhập (Auth.js / NextAuth)

Ba biến này **không xuất hiện trong mã nguồn dưới dạng `process.env`** — Auth.js đọc
chúng theo quy ước tên. Tìm bằng `grep` sẽ không thấy, đừng vì thế mà tưởng thừa.

### `AUTH_SECRET` — **bắt buộc**

Khoá ký cookie phiên đăng nhập.

- Sinh bằng: `npx auth secret`
- Thiếu thì sao: đăng nhập hỏng khi build production.
- Đổi giá trị thì sao: **mọi người đang đăng nhập bị đăng xuất**. Đừng đổi vô cớ.

### `AUTH_GOOGLE_ID` và `AUTH_GOOGLE_SECRET` — **bắt buộc**

Thông tin ứng dụng OAuth, lấy ở [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

- Đọc bởi: `providers: [Google]` trong `src/auth.ts`, theo quy ước tên của Auth.js.
- Đường dẫn chuyển hướng phải khai báo đúng ở phía Google:
  `<địa-chỉ-web>/api/auth/callback/google`. Chạy máy mình là
  `http://localhost:3000/api/auth/callback/google`.
- Triệu chứng khi sai đường dẫn chuyển hướng: Google báo `redirect_uri_mismatch`,
  không phải lỗi của ứng dụng.

---

## 4. Quản trị

### `ADMIN_EMAILS` — bắt buộc nếu muốn dùng `/admin`

Danh sách email được vào khu quản trị, ngăn nhau bằng dấu phẩy, chấm phẩy hoặc
khoảng trắng. Không phân biệt hoa thường.

- Đọc bởi: `src/lib/admin.ts`, qua hàm thuần `src/lib/admin-allowlist.ts`.
- **Để trống nghĩa là không ai vào được** — đây là hành vi cố ý, có test bảo vệ
  (`admin-allowlist.test.ts`). Quên cấu hình phải dẫn tới "không ai vào", tuyệt đối
  không được dẫn tới "ai cũng vào".
- Người không có quyền truy cập `/admin` nhận **404**, không phải 403 — không xác
  nhận cho người dò biết ở đó có khu quản trị.

> **Vì sao ở biến môi trường mà không ở database.** Kẻ chiếm được quyền ghi vào
> database vẫn không tự phong mình làm admin, vì danh sách nằm chỗ khác. Đổi danh
> sách phải deploy lại — chậm, nhưng với một cửa cấp được quyền truy cập trả phí thì
> đó là điểm mạnh.

---

## 5. Thanh toán (SePay)

> **Tiền tố `SEPAY_` gây hiểu nhầm: mã QR KHÔNG cần tài khoản SePay.**
> `src/lib/payment/vietqr.ts` chỉ ghép một URL ảnh tĩnh tới `qr.sepay.vn/img` —
> dịch vụ mở công khai, không đăng nhập, không khoá. Ba biến `SEPAY_BANK_CODE`,
> `SEPAY_ACCOUNT_NUMBER`, `SEPAY_ACCOUNT_NAME` là **số tài khoản ngân hàng của
> bạn**, không phải thông tin đăng nhập SePay. Chỉ `SEPAY_WEBHOOK_API_KEY` và
> webhook đối soát mới cần đăng ký tại my.sepay.vn.

Xem thêm mục 7 của [`dinh-huong-kinh-doanh.md`](dinh-huong-kinh-doanh.md) về quy trình thu tiền.

### `SEPAY_WEBHOOK_API_KEY` — **bắt buộc, nhạy cảm nhất**

Khoá xác thực webhook. Phải **giống hệt** chuỗi khai ở SePay (Webhooks → kiểu xác
thực API Key).

- Đọc bởi: `src/app/api/webhooks/sepay/route.ts`.
- Sinh bằng: `openssl rand -hex 32` hoặc bất kỳ chuỗi ngẫu nhiên dài nào.
- Thiếu thì sao: endpoint từ chối **mọi** webhook và ghi lỗi ra log. Không có tiền
  nào được ghi nhận, không ai được mở khoá.

> **Đây là thứ duy nhất ngăn người lạ tự cấp cho họ gói trả phí bằng một lệnh
> `curl`.** Endpoint webhook công khai với Internet, không có phiên đăng nhập. So
> khớp khoá được làm không phụ thuộc thời gian (`timingSafeEqual` trên bản băm) để
> không lộ dần từng ký tự.

### `SEPAY_BANK_CODE`, `SEPAY_ACCOUNT_NUMBER`, `SEPAY_ACCOUNT_NAME`

Tài khoản nhận tiền, dùng để dựng mã VietQR hiển thị cho người học.

- Đọc bởi: `src/lib/payment/vietqr.ts`.
- Mã ngân hàng tra ở <https://api.vietqr.io/v2/banks> (ví dụ `MBBank`, `Vietcombank`, `ACB`).
- Thiếu thì sao: `getBankAccount()` trả `null`, giao diện không dựng được mã QR.
  Không ảnh hưởng webhook — tiền vẫn được đối soát bình thường.
- `SEPAY_ACCOUNT_NAME` chỉ để hiển thị, không tham gia đối soát.
- **Không cần tài khoản SePay.** Chưa đăng ký gì ở my.sepay.vn thì mã QR vẫn hiện
  bình thường, người học vẫn chuyển khoản được — chỉ là không có gì tự phát hiện
  tiền vào, phải mở khoá tay ở `/admin/payments`.

### `TEST_BASE_URL` — tuỳ chọn

Địa chỉ để `scripts/test-webhook.mjs` bắn webhook giả vào. Mặc định
`http://localhost:3000`. Chỉ dùng khi chạy thử, không cần đặt trên Vercel.

---

## 6. Biến do tích hợp bơm vào mà ứng dụng KHÔNG dùng

Tích hợp Neon và Vercel tự thêm một loạt biến vào `.env.local`. Ứng dụng **không đọc
cái nào** trong số này — liệt kê ra đây để sau này khỏi mất công đoán:

`PGHOST`, `PGHOST_UNPOOLED`, `PGUSER`, `PGDATABASE`, `PGPASSWORD`,
`POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_URL_NO_SSL`,
`POSTGRES_PRISMA_URL`, `POSTGRES_HOST`, `POSTGRES_USER`, `POSTGRES_PASSWORD`,
`POSTGRES_DATABASE`, `NEON_PROJECT_ID`, `NEON_AUTH_BASE_URL`,
`VITE_NEON_AUTH_URL`, `VERCEL_OIDC_TOKEN`

Xoá được, nhưng tích hợp sẽ tự thêm lại. Cứ để yên, chỉ cần biết chúng là nhiễu.

---

## 7. Danh sách kiểm khi deploy

Vercel **không** đọc `.env.local` — mọi biến phải khai lại trong bảng điều khiển
(Settings → Environment Variables).

**Tên miền production: `piano.rehover.io`** — mua ở Cloudflare Registrar, DNS giữ
tại Cloudflare, bản ghi `CNAME piano` trỏ về giá trị Vercel cấp và **để DNS only**
(bật proxy mây cam thì Vercel không cấp được SSL, triệu chứng là vòng lặp chuyển
hướng). `learning-piano.vercel.app` vẫn chạy song song, không mất.

- [ ] `DATABASE_URL` — chuỗi có pooler
- [ ] `DATABASE_URL_UNPOOLED` — chuỗi trực tiếp
- [ ] `AUTH_SECRET` — **khác** khoá đang dùng ở máy mình
- [ ] `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- [ ] Thêm `https://piano.rehover.io/api/auth/callback/google` vào Authorized
      redirect URIs ở Google Cloud Console, giữ nguyên mục cũ của `vercel.app`
      trong lúc chuyển tiếp
- [ ] `ADMIN_EMAILS`
- [ ] **Chỉ khi đã đăng ký SePay:** `SEPAY_WEBHOOK_API_KEY` — **khác** khoá thử ở
      máy mình, dán y hệt vào SePay, và trỏ webhook tới
      `https://piano.rehover.io/api/webhooks/sepay`. Chưa đăng ký thì bỏ qua mục
      này, endpoint tự từ chối mọi request khi thiếu khoá
- [ ] `SEPAY_BANK_CODE`, `SEPAY_ACCOUNT_NUMBER`, `SEPAY_ACCOUNT_NAME`
- [ ] Không cần chạy lệnh đổi cấu trúc bảng bằng tay — `pnpm build` trên Vercel đã
      chạy `drizzle-kit migrate`. Chỉ database CHƯA từng dùng migration mới cần
      baseline một lần: `node scripts/baseline-migrations.mjs --through <tag>`
- [ ] Kiểm tra đang ở gói Vercel **Pro**, không phải Hobby — xem mục 6 của
      [`dinh-huong-kinh-doanh.md`](dinh-huong-kinh-doanh.md)

Sau khi deploy, thử một lần bằng
`TEST_BASE_URL=https://<tên-miền> node scripts/test-webhook.mjs <email>` — script tự
tạo đơn giả, giả lập webhook, kiểm tra rồi dọn sạch. Chỉ chạy được khi đã có
`SEPAY_WEBHOOK_API_KEY` thật, và `.env.local` lúc đó phải trỏ vào database
production. Chưa có SePay thì phép thử nhẹ hơn là gọi thẳng endpoint và **mong đợi
401**: `curl -i -X POST https://piano.rehover.io/api/webhooks/sepay -d '{}'` —
401 chứng minh tên miền, SSL và route đều sống, còn 404 là sai đường dẫn.

---

## Lịch sử cập nhật

> Mỗi lần sửa file thì **thêm một dòng mới lên đầu bảng**, không sửa dòng cũ. Cột
> *Tiêu đề commit* phải chép **y hệt** tiêu đề commit để tìm lại được bằng
> `git log --grep="<tiêu đề>"` hoặc gõ thẳng vào ô tìm kiếm của Fork.

| Ngày | Tiêu đề commit | Cập nhật gì |
|---|---|---|
| 01/09/2026 | `feat: Chuyển sang tên miền piano.rehover.io và làm rõ vai trò của SePay` | Ghi rõ mã QR dùng dịch vụ ảnh công khai nên không cần tài khoản SePay — tiền tố `SEPAY_` ở ba biến ngân hàng từng khiến hiểu nhầm là phải đăng ký mới hiện được QR; chốt tên miền production kèm bẫy proxy Cloudflare, và hạ hai mục webhook xuống thành tuỳ chọn vì đối soát tự động chưa bật |
| 28/08/2026 | `feat: Đổi schema bằng migration có file thay vì drizzle-kit push` | Đổi mọi tham chiếu `pnpm db:push` sang `db:generate`/`db:migrate`, và bỏ mục đẩy schema bằng tay khỏi danh sách việc trước khi mở bán vì Vercel đã tự chạy migrate |
| 27/08/2026 | `refactor: Gom việc đọc biến môi trường về một chỗ và canh bằng test` | Ghi lại rằng src/lib/env.ts là nơi duy nhất đọc process.env, kèm ba tầng bắt buộc / đóng cửa an toàn / tuỳ chọn và lý do không gộp chúng |
| 27/08/2026 | `docs: Thêm dự phóng 7 năm và chuyển sang ghi lịch sử cập nhật cộng dồn` | Chuyển từ "Cập nhật lần cuối" sang bảng lịch sử cập nhật |
| 25/08/2026 | `feat: Thêm trang quản trị người học và tài liệu biến môi trường` | Tạo file — liệt kê mọi biến ứng dụng thật sự đọc, ba nơi nạp biến, checklist deploy lên Vercel |
