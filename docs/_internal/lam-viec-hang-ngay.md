# Làm việc hàng ngày — bản một trang

> **Tài liệu nội bộ — KHÔNG hiển thị trên web.**
>
> **Lịch sử cập nhật:** xem mục cuối file — mỗi lần sửa thêm một dòng, không ghi đè dòng cũ.

Bản rút gọn để mở ra lúc đang làm. Lý do đằng sau từng bước nằm ở
[`quy-trinh-lam-viec.md`](quy-trinh-lam-viec.md) — đọc file đó khi cần biết **vì sao**,
đọc file này khi chỉ cần biết **làm gì tiếp**.

Mọi tài liệu nội bộ **đọc được trên web**: đăng nhập bằng email nằm trong
`ADMIN_EMAILS` rồi vào `/admin/docs`. Tiện khi đang ở điện thoại, không phải mở
repo ra.

---

## 1. Vòng thường ngày — việc nhỏ

1. Claude viết mã, chạy cổng kiểm tra tại máy:
   `npx tsc --noEmit && pnpm lint && pnpm test && pnpm check:lessons`
2. Chốt **tiêu đề commit**, rồi mới ghi dòng lịch sử vào những tài liệu vừa sửa.
3. Claude in commit message → **bạn đọc diff trong Fork** → commit → push `main`.
4. Vercel deploy production. GitHub Actions chạy lại cả bốn lệnh, đỏ thì báo về.
5. Xem kết quả ở <https://piano.rehover.io>.

Nói **"commit luôn"** thì Claude tự chạy `git add/commit/push`. Tiện khi bạn đang ở
điện thoại, đổi lại mất bước bạn đọc diff — mà trên repo đẩy thẳng `main` thì đó là
lưới đỡ duy nhất trước khi thay đổi thành lịch sử.

## 2. Khi cần nhìn tận mắt trước — giao diện, việc rủi ro

Chèn thêm một nhịp vào giữa bước 3 và 4:

- Bạn tạo nhánh trong Fork, push lên đó. Đặt tên **`preview`** nếu cần thử đăng nhập;
  tên `feat/...` tự do thì vẫn xem được giao diện, chỉ không đăng nhập được.
- Mở preview URL trên điện thoại, bấm thử.
- Ưng thì merge vào `main` rồi push. Không ưng thì sửa tiếp trên nhánh.
- Xong việc **xoá nhánh** — nhánh còn sống là một nhánh database còn lơ lửng.

## 3. Khi đang xa máy tính, muốn xem thứ chưa commit

Bảo Claude bật đường hầm: `pnpm dev` + `cloudflared tunnel --url http://localhost:3000`,
rồi mở link nó gửi về. Thấy được cả thứ đang sửa dở. Hai điều đổi lại: **đăng nhập
Google sẽ hỏng** (redirect URI không khớp), và URL đó công khai với ai có link — tắt
tunnel là hết.

## 4. Khi đổi cấu trúc bảng

Ba lệnh `db:generate`, `db:migrate`, `pnpm dev` là **việc của Claude** — bạn không
gõ lệnh nào cả. Vòng chạy:

1. Bạn nói muốn đổi gì: *"thêm cột ghi_chu vào bảng lesson_completion"*.
2. Claude sửa `src/db/schema/*.ts`, chạy `pnpm db:generate`, rồi **dán nguyên văn
   file `.sql` vừa sinh vào khung chat**.
3. **Bạn liếc đoạn SQL đó.** Đây là chỗ duy nhất trong quy trình không nên bỏ:
   `generate` hay hiểu một lần *đổi tên cột* thành "xoá cột cũ, thêm cột mới", và
   chạy lên production là mất sạch dữ liệu cột đó. File thường chỉ vài dòng nên đọc
   trên điện thoại vẫn được.
4. Claude chạy `pnpm db:migrate` lên nhánh dev, bấm thử, báo lại kết quả bốn lệnh
   kiểm — kèm ảnh chụp màn hình hoặc link tunnel nếu có giao diện.
5. Bạn duyệt, hoặc nói "commit luôn".

**Cửa chặn Claude tự áp:** file `.sql` sinh ra có `DROP`, `RENAME` hay đổi kiểu cột
thì dừng lại và báo — không migrate, không commit, kể cả khi đã được bảo làm. Đó là
luật *chỉ được THÊM* ở mục 7 của [`quy-trinh-lam-viec.md`](quy-trinh-lam-viec.md), và
nó chỉ có giá trị khi không ai lách.

Trước khi migrate, Claude chạy `node scripts/beta-metrics.mjs` để chắc chắn đang trỏ
vào nhánh `dev` — nhánh này từng biến mất một lần và triệu chứng lại là "sai mật
khẩu" (bẫy 14).

## 5. Ai làm gì

| Việc | Ai |
|---|---|
| Viết mã, chạy cổng kiểm tra, soạn commit message | Claude |
| Đọc diff, commit, push, merge, xoá nhánh | Bạn, trong Fork |
| Bấm nút trên Vercel, Cloudflare, Google Console, Neon | Bạn |
| Script đụng database **production** | Bạn |
| `pnpm db:generate` / `db:migrate` trên nhánh **dev** | Claude |

## 6. Còn treo

Không gấp, xoá dòng nào đã xong:

- [ ] **Khi đóng đợt beta:** gỡ khối mời đăng ký ở đầu `docs/01-roadmap/roadmap.md`
      và hằng số `FORM_DANG_KY` cùng nút của nó trong `src/components/LessonLocked.tsx`.
      Hai chỗ này chỉ đúng trong lúc còn nhận người thử.

- [ ] Gán `preview.rehover.io` cho nhánh `preview` trong Vercel Domains (thêm một bản
      ghi CNAME nữa ở Cloudflare, vẫn **DNS only**).
- [ ] Thêm redirect URI của địa chỉ đó vào Google Cloud Console.
- [ ] Xác định môi trường Preview đang nối vào database nào **trước lần deploy preview
      đầu tiên** — build của Vercel có chạy `drizzle-kit migrate`. Xem khối cảnh báo ở
      mục 8 của [`quy-trinh-lam-viec.md`](quy-trinh-lam-viec.md).

---

## Lịch sử cập nhật

> Mỗi lần sửa file thì **thêm một dòng mới lên đầu bảng**, không sửa dòng cũ. Cột
> *Tiêu đề commit* phải chép **y hệt** tiêu đề commit để tìm lại được bằng
> `git log --grep="<tiêu đề>"` hoặc gõ thẳng vào ô tìm kiếm của Fork.

| Ngày | Tiêu đề commit | Cập nhật gì |
|---|---|---|
| 02/09/2026 | `feat: Dẫn thẳng tới form đăng ký beta thay vì bắt nhắn tin` | Thêm vào mục 6 việc phải gỡ khối mời đăng ký và nút form khi đóng đợt beta — hai chỗ đó chỉ đúng trong lúc còn nhận người thử, để sót lại thì người mua sau này bấm vào một form đã đóng |
| 01/09/2026 | `docs(internal): Ghi vòng đổi cấu trúc bảng khi làm việc cùng AI` | Thêm mục 4 — ba lệnh migration vốn đã là việc của Claude theo mục 2 của quy trình, nhưng chưa chỗ nào nói người dùng còn giữ lại việc gì; chốt rằng phần không được bỏ là người đọc file .sql, và ghi cửa chặn Claude tự dừng khi SQL có DROP/RENAME. Thêm lối đọc tài liệu nội bộ trên web ở /admin/docs |
| 01/09/2026 | `docs(internal): Thêm bản một trang cho quy trình làm việc hàng ngày` | Tạo file — tách phần "làm gì tiếp" ra khỏi `quy-trinh-lam-viec.md` để lúc đang làm không phải đọc lại toàn bộ lý do; gom ba nhịp thường dùng (commit thẳng, xem trước bằng nhánh, xem thứ chưa commit bằng tunnel) và danh sách việc còn treo sau khi đổi tên miền |
