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
| `drizzle-kit` (`pnpm db:push`) | **Không** — nên `drizzle.config.ts` phải gọi `dotenv` thủ công |
| Script trong `scripts/` | **Không** — mỗi script tự gọi `config({ path: '.env.local' })` |

Đây là lý do các file đó có dòng `import { config } from 'dotenv'` ở đầu. Bỏ đi là
lệnh chạy tay hỏng ngay, dù `next dev` vẫn bình thường.

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
  bảng (`pnpm db:push`) chạy ổn định hơn khi đi thẳng, không qua pooler.

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

- [ ] `DATABASE_URL` — chuỗi có pooler
- [ ] `DATABASE_URL_UNPOOLED` — chuỗi trực tiếp
- [ ] `AUTH_SECRET` — **khác** khoá đang dùng ở máy mình
- [ ] `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- [ ] Thêm đường dẫn chuyển hướng của tên miền thật vào Google Cloud Console
- [ ] `ADMIN_EMAILS`
- [ ] `SEPAY_WEBHOOK_API_KEY` — **khác** khoá thử ở máy mình, và dán y hệt vào SePay
- [ ] Trỏ webhook SePay tới `https://<tên-miền>/api/webhooks/sepay`
- [ ] `SEPAY_BANK_CODE`, `SEPAY_ACCOUNT_NUMBER`, `SEPAY_ACCOUNT_NAME`
- [ ] Chạy `pnpm db:push` trỏ vào database production
- [ ] Kiểm tra đang ở gói Vercel **Pro**, không phải Hobby — xem mục 6 của
      [`dinh-huong-kinh-doanh.md`](dinh-huong-kinh-doanh.md)

Sau khi deploy, thử một lần bằng
`TEST_BASE_URL=https://<tên-miền> node scripts/test-webhook.mjs <email>` — script tự
tạo đơn giả, giả lập webhook, kiểm tra rồi dọn sạch.

---

## Lịch sử cập nhật

> Mỗi lần sửa file thì **thêm một dòng mới lên đầu bảng**, không sửa dòng cũ. Cột
> *Tiêu đề commit* phải chép **y hệt** tiêu đề commit để tìm lại được bằng
> `git log --grep="<tiêu đề>"` hoặc gõ thẳng vào ô tìm kiếm của Fork.

| Ngày | Tiêu đề commit | Cập nhật gì |
|---|---|---|
| 27/08/2026 | `docs: Thêm dự phóng 7 năm và chuyển sang ghi lịch sử cập nhật cộng dồn` | Chuyển từ "Cập nhật lần cuối" sang bảng lịch sử cập nhật |
| 25/08/2026 | `feat: Thêm trang quản trị người học và tài liệu biến môi trường` | Tạo file — liệt kê mọi biến ứng dụng thật sự đọc, ba nơi nạp biến, checklist deploy lên Vercel |
