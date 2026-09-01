# Làm việc hàng ngày — bản một trang

> **Tài liệu nội bộ — KHÔNG hiển thị trên web.**
>
> **Lịch sử cập nhật:** xem mục cuối file — mỗi lần sửa thêm một dòng, không ghi đè dòng cũ.

Bản rút gọn để mở ra lúc đang làm. Lý do đằng sau từng bước nằm ở
[`quy-trinh-lam-viec.md`](quy-trinh-lam-viec.md) — đọc file đó khi cần biết **vì sao**,
đọc file này khi chỉ cần biết **làm gì tiếp**.

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

## 4. Ai làm gì

| Việc | Ai |
|---|---|
| Viết mã, chạy cổng kiểm tra, soạn commit message | Claude |
| Đọc diff, commit, push, merge, xoá nhánh | Bạn, trong Fork |
| Bấm nút trên Vercel, Cloudflare, Google Console, Neon | Bạn |
| Script đụng database **production** | Bạn |
| `pnpm db:generate` / `db:migrate` trên nhánh **dev** | Claude |

## 5. Còn treo

Không gấp, xoá dòng nào đã xong:

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
| 01/09/2026 | `docs(internal): Thêm bản một trang cho quy trình làm việc hàng ngày` | Tạo file — tách phần "làm gì tiếp" ra khỏi `quy-trinh-lam-viec.md` để lúc đang làm không phải đọc lại toàn bộ lý do; gom ba nhịp thường dùng (commit thẳng, xem trước bằng nhánh, xem thứ chưa commit bằng tunnel) và danh sách việc còn treo sau khi đổi tên miền |
