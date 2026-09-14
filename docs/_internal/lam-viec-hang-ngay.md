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
   `npx tsc --noEmit && pnpm lint && pnpm test && pnpm check:lessons && npx next build`
2. Chốt **tiêu đề commit**, rồi mới ghi dòng lịch sử vào những tài liệu vừa sửa.
3. Claude in commit message → **bạn đọc diff trong Fork** → commit → push `main`.
4. Vercel deploy production. GitHub Actions chạy lại bốn lệnh đầu, đỏ thì báo về —
   riêng `next build` thì chỉ Vercel chạy, nên nó phải được kiểm ở bước 1 (bẫy 19).
5. Xem kết quả ở <https://pianojourney.rehover.io>.

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
4. Claude chạy `pnpm db:migrate` lên nhánh dev, bấm thử, báo lại kết quả năm lệnh
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

## 6. Mở và đóng một phiên chat

**Mở:** một phiên cho một việc. Bốn loại việc, đừng trộn — *nội dung* / *code* /
*vận hành* (Vercel, Cloudflare, Form) / *chiến lược*. Đặt tên **theo việc** ngay lúc bắt
đầu (`Soạn Chương 8`), không đặt theo loại việc (`Chỉnh code`) rồi dùng phiên đó mãi.

Buổi sáng mở bằng: *"đọc `lam-viec-hang-ngay.md` và khối mới nhất trong
`nhat-ky-lam-viec.md` rồi nói tôi làm gì tiếp"*. File thứ hai là thứ trả lời được
*"hôm qua tôi dừng ở đâu"*.

**Đóng:** kể lại hôm nay đã làm gì và thấy gì — kể cả việc ngoài repo như đăng bài, gửi
link, có người nhắn — rồi nói *"ghi vào nhật ký"*. Tôi thêm một khối vào đầu
[`nhat-ky-lam-viec.md`](nhat-ky-lam-viec.md) và ghi những thứ khác vào đúng file của
chúng. Xong thì archive phiên; archive không xoá gì, mở lại được bất cứ lúc nào.

Lý do đầy đủ ở mục 9 của [`quy-trinh-lam-viec.md`](quy-trinh-lam-viec.md).

## 7. Còn treo

Không gấp, xoá dòng nào đã xong:

- [x] ~~**Cấp gói cho những người đã điền form, rồi NHẮN TAY cho từng người.**~~ Xong
      14/09/2026: đã cấp gói và nhắn tay cho những người điền form tới hôm đó. Người điền
      form **sau** ngày này vẫn đi đúng hai bước ấy — cách làm ở mục 2 của
      [`ke-hoach-beta.md`](ke-hoach-beta.md), nhớ ô *Lý do* gõ đúng `beta dot 1`.

- [ ] **Thử *Tập câu này với đàn* ở trang `/hand-position` trên đàn thật.** Phần nghe qua
      micro của trang này chưa ai đo lần nào — mọi con số micro tới giờ đều đo ở bài luyện
      nhận nốt và ở *Tập bài này với đàn* của bài học. Mở câu 2 (thế tay Sol), đánh trọn
      câu, đếm xem máy nghe sai mấy lần và sai kiểu gì.

- [ ] **Kiểm lại hai lỗi nhạc nền trên đúng chiếc máy tính đã gặp** (commit `c09dd4c` và
      `baf899c`): gạt tắt nhạc nền rồi sang *Mục lục* và *Đường đi* xem có tự phát lại
      không; bấm *Nghe thử* một bản nhạc xem còn tiếng nhạc nền chen vào không. Còn lỗi thì
      mở DevTools chạy `localStorage.getItem('pj-ambient')` ngay lúc nhạc đang phát.

- [ ] **Thử nghe qua micro trên máy thật, trước khi mời người beta dùng.** Mọi con số tới giờ
      đo trên tiếng đàn tổng hợp. Đặt điện thoại lên giá nhạc cây FP-30X, mở
      `/note-trainer` → *Nghe qua micro*, đánh 20 nốt và đếm máy nghe sai mấy lần; rồi mở
      Bài tập 1B (Ode to Joy) → *Tập bài này với đàn* và đánh trọn bài. Thử **cả iPhone
      lẫn Android** nếu có, trong phòng bình thường. Kể lại kết quả cho Claude: số sai,
      sai kiểu gì (nhầm quãng tám, nốt ma, sót nốt nhẹ) — thứ tự đo đầy đủ ở Giai đoạn D
      của [`lo-trinh-phat-trien.md`](lo-trinh-phat-trien.md).

- [x] ~~**Quyết chỗ cho kho ôn luyện.**~~ Xong 13/09/2026: `/review/[chapter]` đã dựng đúng
      đề xuất — `seed` trong đường dẫn, nút *Bài khác*, hàng chọn kiểu bài, và *Tập bài này với
      đàn* có sẵn trong `SheetViewer`. Đường vào nằm cuối danh sách bước của mỗi chương.

- [ ] **Thử Kho nhạc của tôi trên điện thoại thật.** `/my-sheets` mới chỉ chạy qua `next build`
      và test, chưa ai nhập một file `.mid` thật hay chụp một trang sách thật. Ba thứ cần thử,
      vì cả ba chỉ hỏng trên máy thật: (1) chọn file `.mid` tải từ mạng — có ra bản nhạc đọc
      được không, hai tay chia có hợp lý không; (2) chụp hai ba trang sách bằng điện thoại —
      ảnh có bị nằm ngang không (thẻ EXIF, bẫy 41), gửi có lâu quá không trên 4G; (3) mở lại
      trên máy khác xem ảnh có hiện không. Gặp gì lạ thì kể lại kèm tên file hoặc kiểu điện thoại.

- [x] ~~**Đọc thử Chương 1-2 khuôn mới, rồi làm tiếp Chương 3-7.**~~ Xong 14/09/2026: chủ
      sản phẩm bảo làm tiếp, cả 20 bài Chương 3-7 đã viết lại cùng khuôn (bản nhạc giữ nguyên
      từng ký tự, thêm khuông và hình bàn phím minh hoạ). Vẫn nên mở vài bài Chương 3-7 trên
      điện thoại xem có câu dẫn nào thiếu thông tin để tập không.

- [ ] **Thử dòng nhắc vượt bài và dòng khen đánh trọn trên điện thoại thật, đã đăng nhập.**
      Hai thứ này mới chạy qua test và trình duyệt thử ở máy — dòng nhắc chỉ hiện khi đã đăng nhập,
      mà trình duyệt thử không đăng nhập Google được. Ba việc: (1) chưa tick Chương 1 - Bài 1
      rồi mở Bài 2 — phải thấy dòng nhắc ở đầu trang, bấm *Học tiếp* thì mất và mở lại không
      hiện nữa; (2) mở *Tập bài này với đàn* ở một bản nhạc ngắn, đánh tới nốt cuối — cuối
      trang phải có dòng *Bạn đã đánh trọn…*; (3) đọc khung *Xong bài khi* ở vài bài Chương 2-4
      xem có câu nào đòi quá sức người mới không.

- [ ] **Thử bộ sinh bằng mắt trước khi cho người học thấy.** Test đã gác cao độ, số phách và
      tầm nốt, nhưng *bài tập có nghe được không* thì chỉ đánh thử mới biết. Mở Chương 1-5,
      mỗi chương lấy vài `seed`, đánh trên đàn thật. Gặp bài nghe kỳ thì kể lại `seed` và kiểu
      bài — chỗ sửa nằm ở `cauBaO` và `cauLienBac`.

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
| 14/09/2026 | `feat: Viết lại Chương 3-7 theo khuôn tập trước, ít chữ` | Đánh dấu xong việc đọc thử Chương 1-2 và làm tiếp Chương 3-7 — chủ sản phẩm bảo làm tiếp nên cả giáo trình đã đổi khuôn; giữ lời nhắc mở thử vài bài Chương 3-7 trên máy thật vì chúng chưa ai đọc trên điện thoại |
| 14/09/2026 | `feat: Tập trước, lý thuyết thành đọc thêm — viết lại Chương 1-2` | Thêm vào mục 7 việc đọc thử Chương 1-2 khuôn mới trước khi làm Chương 3-7 — đợt viết lại cố ý dừng ở hai chương để chủ sản phẩm duyệt khuôn trên máy thật, và việc duyệt đó không ai làm hộ được |
| 14/09/2026 | `feat: Tiêu chí xong bài, nhắc khi vượt bài, khen khi đánh trọn với đàn` | Thêm vào mục 7 việc thử dòng nhắc vượt bài và dòng khen đánh trọn trên máy thật đã đăng nhập — dòng nhắc chỉ hiện với tài khoản đã đăng nhập mà trình duyệt thử của Claude không đăng nhập Google được, nên đây là phần duy nhất của thay đổi chưa ai nhìn thấy chạy thật |
| 14/09/2026 | `docs(internal): Đánh dấu đã cấp gói và nhắn tay cho người điền form beta` | Đánh dấu xong việc chặn cả đợt beta: đã cấp gói và nhắn tay cho những người điền form tới 14/09. Giữ lại lời nhắc rằng người điền form sau ngày này vẫn phải đi đủ hai bước, vì gạch dòng đi dễ khiến tưởng việc cấp gói đã xong hẳn chứ không phải việc lặp lại mỗi lần có người mới |
| 13/09/2026 | `docs(internal): Ghi quyết định cho kho ôn luyện và kho nhạc của tôi` | Đánh dấu việc *quyết chỗ cho kho ôn luyện* đã xong, và thay bằng việc mới: thử Kho nhạc của tôi trên điện thoại thật — ba thứ chỉ hỏng trên máy thật (file `.mid` thật, ảnh chụp bị xoay theo EXIF, mở lại trên máy khác) mà không ca test nào bắt được |
| 13/09/2026 | `docs(internal): Ghi nhật ký phiên tối 13/09 và ba việc còn treo` | Thêm ba việc vào mục 7: cấp gói kèm nhắn tay cho người đã điền form (việc chặn cả đợt beta mà chưa ai làm), thử phần nghe micro của trang Đặt tay ở đâu trên đàn thật, và kiểm lại hai lỗi nhạc nền trên đúng máy đã gặp |
| 13/09/2026 | `docs(internal): Ghi nhật ký phiên 12-13/09 và gom việc còn tồn đọng vào một chỗ` | Thêm hai việc vào mục 7: quyết chỗ cho kho ôn luyện (bộ sinh bài tập đã xong mà chưa trang nào gọi nó) và đánh thử bài sinh ra trên đàn thật — test gác được cao độ và số phách, nhưng "bài tập có nghe được không" thì không ca test nào phát biểu nổi |
| 11/09/2026 | `docs: Thêm next build vào cổng kiểm tra trước khi commit` | Cổng kiểm tra ở bước 1 lên năm lệnh sau một lần deploy đỏ dù bốn lệnh ở máy xanh hết; nói rõ ở bước 4 rằng CI không chạy build nên build chỉ được kiểm ở bước 1 |
| 11/09/2026 | `feat: Nghe tiếng đàn qua micro để tập với đàn trên mọi điện thoại` | Thêm vào mục 7 việc thử micro trên máy thật — tính năng mới chỉ được đo trên tiếng đàn tổng hợp, mà đó là việc duy nhất Claude không làm hộ được vì cần một chiếc điện thoại đặt cạnh cây đàn thật; ghi luôn cách thử cụ thể để làm được ngay khi mở file ra |
| 09/09/2026 | `chore: Đổi tên miền production sang pianojourney.rehover.io` | Đổi địa chỉ xem kết quả ở bước 5 sang tên miền mới — bước này được đọc mỗi ngày nên để tên miền cũ ở đây là chỗ dễ tin nhầm nhất |
| 09/09/2026 | `docs(internal): Chốt quy ước chia phiên và thêm nhật ký làm việc` | Thêm mục 6 — câu mở và câu đóng một phiên chat, vì kiến thức chỉ thoát ra khỏi phiên nếu có người hỏi trước khi đóng; câu mở đọc thêm khối mới nhất của `nhat-ky-lam-viec.md` vì mục "Còn treo" chỉ ghi việc chưa làm nên không trả lời được "hôm qua dừng ở đâu"; nói rõ đặt tên phiên theo việc chứ không theo loại việc; mục "Còn treo" dời xuống thành mục 7 |
| 02/09/2026 | `feat: Dẫn thẳng tới form đăng ký beta thay vì bắt nhắn tin` | Thêm vào mục 6 việc phải gỡ khối mời đăng ký và nút form khi đóng đợt beta — hai chỗ đó chỉ đúng trong lúc còn nhận người thử, để sót lại thì người mua sau này bấm vào một form đã đóng |
| 01/09/2026 | `docs(internal): Ghi vòng đổi cấu trúc bảng khi làm việc cùng AI` | Thêm mục 4 — ba lệnh migration vốn đã là việc của Claude theo mục 2 của quy trình, nhưng chưa chỗ nào nói người dùng còn giữ lại việc gì; chốt rằng phần không được bỏ là người đọc file .sql, và ghi cửa chặn Claude tự dừng khi SQL có DROP/RENAME. Thêm lối đọc tài liệu nội bộ trên web ở /admin/docs |
| 01/09/2026 | `docs(internal): Thêm bản một trang cho quy trình làm việc hàng ngày` | Tạo file — tách phần "làm gì tiếp" ra khỏi `quy-trinh-lam-viec.md` để lúc đang làm không phải đọc lại toàn bộ lý do; gom ba nhịp thường dùng (commit thẳng, xem trước bằng nhánh, xem thứ chưa commit bằng tunnel) và danh sách việc còn treo sau khi đổi tên miền |
