# Nhật ký quyết định — vì sao dự án ở chỗ này

> **Mục đích:** ghi lại *những câu đã hỏi và đã trả lời* trong quá trình dựng dự án,
> kèm lý do. Các tài liệu khác trong `_internal/` mô tả **hiện trạng** — file này mô tả
> **đường đi tới hiện trạng đó**, để không phải bàn lại từ đầu một câu đã chốt cách
> đây hai tháng.
>
> **Nguồn:** dựng lại từ toàn bộ lịch sử phiên làm việc với Claude Code trong thư mục
> `~/.claude/projects/D--AQ-Project-BE-piano-learning/`, khoảng 25/08 → 08/09/2026.
> Mốc ngày lấy theo dấu thời gian UTC của phiên nên có thể lệch một ngày so với giờ
> Việt Nam; cần chính xác thì tra `git log`.
>
> **File này không thay thế gì cả.** Mỗi mục chỉ ghi kết luận và lý do, rồi trỏ sang
> tài liệu giữ chi tiết. Chỗ nào mâu thuẫn thì **tài liệu kia đúng, file này cũ**.

---

## 1. Những câu đã chốt — đừng hỏi lại

Bảng này để đọc lướt. Cột *Vì sao* mới là phần đáng giá; cột *Kết luận* thì đọc code
cũng ra.

| Câu hỏi | Kết luận | Vì sao |
|---|---|---|
| Có nên chuyển sang app mobile để dễ thương mại hoá? | **Không.** Giữ web | Nội dung là bài đọc dài kèm sheet nhạc, không phải thứ cần có mặt trên store. Đổi lại phải nuôi hai nền tảng, chịu chiết khấu, và mất khả năng sửa nội dung tức thì |
| Có nên tách backend riêng (NestJS)? | **Không.** Giữ Next.js server actions + Drizzle | Một người làm, một sản phẩm. Tách backend là nhân đôi số thứ phải deploy và debug mà chưa đổi lại được gì |
| Trang admin có nên là app riêng? | **Không.** Nằm trong cùng app, chặn bằng `ADMIN_EMAILS` và cột `role` | Cùng lý do trên. Mỗi hàm trong `admin-actions.ts` phải tự gọi `requireAdmin()` vì Server Action là endpoint HTTP thật — chặn ở trang là chưa đủ |
| Thanh toán: tự động hay đối soát tay? | **VietQR + webhook SePay**, đối soát tự động chưa bật trong beta | Tiền vào thẳng tài khoản ngân hàng, không qua bên giữ tiền. Mã QR dùng dịch vụ ảnh công khai nên **không cần tài khoản SePay** mới hiện được QR — chỗ này từng hiểu nhầm vì cả bốn biến đều mang tiền tố `SEPAY_` |
| Có nên bỏ beta, mở bán luôn cho đỡ bị chia sẻ lậu? | **Không.** Vẫn chạy beta 40 người | Rủi ro lớn hơn nhiều là bán một thứ chưa ai học hết Chương 1. Nội dung chữ vốn dễ sao chép — khoá chặt chỉ làm phiền người trả tiền, còn Web MIDI và cập nhật liên tục mới thực sự tạo khác biệt |
| Điều khoản có nên cấm chia sẻ tài khoản? | **Không nhắc tới.** Bản cuối bỏ hẳn điều cấm | Nói ra là mách nước: người định chia sẻ vẫn chia sẻ, còn người tử tế thì thấy mình bị nghi ngờ ngay từ trang điều khoản |
| Có nên chuyển toàn bộ nội dung chữ thành video? | **Không.** Text-first, video chỉ quay thứ phải nhìn mới hiểu | Chữ dạy *vì sao*, video dạy *tay đặt thế nào*. Chuyển hết sang video thì sửa một câu phải quay lại cả bài, chi phí sản xuất tăng vọt, mà vẫn không chống được sao chép |
| Kho sheet mở rộng, chuyển sang thuê bao tháng? | **Chưa.** Giữ mua đứt, chừa đường cho gói luyện tập trả tháng về sau | Nội dung hiện hữu hạn; bán thuê bao khi chưa có gì mới mỗi tháng là tự đặt bẫy cho mình. Bản quyền sheet cũng chưa giải quyết xong |
| Đường dẫn tiếng Việt hay tiếng Anh? | **Tiếng Anh**, trừ slug bài học và thư mục nội dung | Đã thành quy ước trong `AGENTS.md`. Slug giữ nguyên vì nằm trong cột `lesson_completion.lesson_slug` — đổi là mất tiến độ người học đã tick |
| Tài liệu ghi "cập nhật lần cuối" hay ghi lịch sử? | **Bảng lịch sử cộng dồn**, cột giữa là **tiêu đề commit** chứ không phải mã commit | Ghi đè thì mất bối cảnh vì sao một quyết định bị sửa. Không ghi mã commit vì lúc soạn thay đổi chưa có mã, phải quay lại điền sau và luôn quên |
| `pnpm db:push` hay migration có file? | **Migration có file.** `db:push` đã gỡ khỏi dự án | Beta là có dữ liệu người thật. `db:push` so sánh schema rồi tự sửa — một lần chạy nhầm vào production là mất dữ liệu không có đường lùi. Vercel chạy `drizzle-kit migrate` lúc build nên production tự cập nhật |
| App cài ngoài màn hình chính nên chạy `standalone` hay `fullscreen`? | **`fullscreen`.** Ẩn luôn thanh trạng thái | Chiều cao là thứ khan hiếm nhất lúc tập: điện thoại xoay ngang chỉ còn khoảng 360px, một dòng khuông nhạc đã ăn gần hết, thanh trạng thái lấy thêm 24-30px nữa. Đổi lại là không còn thấy đồng hồ ở bất cứ trang nào — đã cân nhắc và chấp nhận. Kéo theo: `InstallPrompt` phải hỏi cả ba kiểu hiển thị, vì `display-mode` chỉ khớp đúng kiểu đang chạy nên app đã cài sẽ tự mời cài lại chính nó |
| Có nên làm nhánh `dev`/`preview`? | **Có đường sẵn nhưng tạm chưa dùng.** Beta vẫn test local rồi đẩy thẳng `main` | Một người làm; mỗi thay đổi nhỏ mà phải qua preview thì chậm hơn phần lợi thu được. Quy trình nhánh đã viết sẵn ở `quy-trinh-lam-viec.md` để bật lên khi có khách thật |

---

## 2. Dòng thời gian

### 25–26/08 — từ chỗ "chạy được" sang chỗ "bán được"

Mở đầu bằng những việc rất nhỏ: header lệch trên điện thoại, thanh tab của trang luyện
nhận nốt bị nuốt mất tab thứ ba, hàng nút dưới trình phát sheet xếp không đều. Đi kèm là
loạt câu hỏi về âm thanh — có đổi được loại nhạc cụ khi phát sheet không, có tiếng piano
hãng nổi tiếng không. Kết quả là phần chọn nhạc cụ có nhóm, dựng bằng Mantine cho đồng
bộ giao diện.

Người dùng tập trên **Roland FP-30X** và hỏi về kết nối Bluetooth. Đây là gốc của hướng
Web MIDI: giáo trình được soạn quanh một cây đàn 88 phím phím nặng, nên mọi bài tập đều
giả định người học có đàn thật.

**Việc quan trọng nhất giai đoạn này là `docs/OVERVIEW.md`.** Nó ra đời từ một vấn đề rất
cụ thể: chat trên web hay điện thoại không thấy được repo ở `D:\AQ-Project`, nên mỗi lần
muốn bàn chuyện giá hay lộ trình lại phải kể lại từ đầu. Giải pháp là **một file duy
nhất, một trang, thả vào chat là đủ ngữ cảnh**. Đó là lý do OVERVIEW phải luôn ngắn và
luôn mới — nó là bản sao mang đi được của cả dự án.

Chương 0 được viết lại theo hướng cảm xúc — vì sao bạn muốn học piano, cảm giác khi nghe
một bản nhạc đẹp — thay vì mở đầu bằng lịch sử nhạc cụ. **Lý do: người mới không đọc nổi
nhiều chữ khô ở bài đầu tiên, họ bỏ ngay.** Lịch sử piano tách hẳn sang
`07-doc-them/lich-su-piano.md` kèm một câu giải thích vì sao dời đi. Sau đó phần tham
chiếu anime bị cắt bớt vì "nghe hơi sến", và ảnh *Howl's Moving Castle* bị gỡ vì bản quyền.

Cuối giai đoạn là hai tài liệu chiến lược — `du-phong-7-nam.md` và `lo-trinh-phat-trien.md`
— dựng từ một buổi bàn dài về mô hình kinh doanh. Ba ý còn giá trị nhất:

- **Đòn bẩy mạnh nhất không phải giá bán mà là tỷ lệ đi hết Chương 1.** Nâng từ 25% lên
  40% tác động tới lợi nhuận mạnh hơn hẳn tăng giá hay đổ tiền quảng cáo. Đây là lý do
  Chương 1 được sửa riêng một vòng cho hấp dẫn hơn.
- **Web MIDI là moat.** Chữ dễ copy, video cũng copy được; hệ thống nói chuyện được với
  cây đàn thật của người học thì khó hơn nhiều.
- **Đừng soạn thêm nội dung trước khi có người học thật.** Thứ tự đúng: đủ Giai đoạn 1 →
  thả 20–30 người thật vào → đo → chỉ xây tiếp thứ dữ liệu chứng minh là cần.

### 27–28/08 — hạ tầng, cổng chặn, và tầng công ty

Nhiều việc nền: thêm cột `role` với `superadmin`, tách schema thành mỗi model một file
cho dễ đọc, dọn ảnh không còn tham chiếu, gom `public/images` theo trang và nén lại
(riêng Chương 0 từng nặng khoảng 6 MB ảnh).

Cổng chặn được dựng: khoá từ Chương 2, biểu tượng ổ khoá trên thanh bên để người học biết
trước chứ không bấm vào mới biết, và `/journal` không cho tick bài đang khoá. Quyết định
đáng nhớ nhất ở đây: **không hiện một phần bài rồi làm mờ phần còn lại** — nội dung vẫn
nằm trong HTML thì ai xem mã nguồn cũng đọc được, tức là khoá giả.

Đây cũng là lúc chốt quy ước đường dẫn tiếng Anh, chuẩn hoá biến môi trường thành
`env-schema.ts` / `env.ts` với ba tầng (bắt buộc / đóng cửa an toàn khi thiếu / tuỳ chọn),
và tách database dev khỏi production bằng nhánh Neon.

**Tầng công ty hình thành trong giai đoạn này.** Tên `reHover` được chọn cho công ty tương
lai; `rehover.com` đã bị rao bán nên không lấy được. Tên miền `rehover.io` mua thẳng ở
Cloudflare Registrar, dựng Email Routing `pianojourney@rehover.io` → Gmail và đã gửi thư
thử thành công. **Catch-all cố ý để tắt** — bật lên thì mọi địa chỉ bịa ra đều đổ vào
đúng hộp thư đang chờ báo lỗi từ người beta, mà tên miền mới thì bị quét rác trong vài
tuần. Trang Facebook lập ra làm kênh liên hệ ghi trong điều khoản.

Kế hoạch beta thành `ke-hoach-beta.md`. Quy trình làm việc được viết rồi rút gọn hai lần —
bản đầy đủ ở `quy-trinh-lam-viec.md`, bản mở ra lúc đang làm ở `lam-viec-hang-ngay.md`.
Lý do tách đôi: bản đầy đủ trả lời *vì sao*, nhưng lúc đang code thì chỉ cần *làm gì tiếp*.

### 01/09 — đổi tên miền, và biến "nhờ AI chạy hộ" thành quy trình

Chuyển production sang `piano.rehover.io`. Bẫy gặp phải: **CNAME trên Cloudflare phải để
DNS only, bật mây cam là Vercel không cấp được SSL**, triệu chứng là vòng lặp chuyển hướng
— đã ghi vào `bien-moi-truong.md`.

Hai thay đổi về cách làm việc, cùng xuất phát từ một nhận xét: *làm việc chủ yếu qua AI
nên không tiện tự gõ lệnh*.

1. **Câu lệnh "commit luôn"** thành quy ước có hiệu lực: nghe câu đó thì Claude tự đọc
   toàn bộ diff, chạy đủ bốn lệnh kiểm, rồi `add` / `commit` / `push`. Không nói câu đó
   thì mặc định chỉ in commit message ra để dán vào Fork.
2. **Trang `/admin/docs`** ra đời để đọc tài liệu `_internal` ngay trên web sau khi đăng
   nhập admin, kể cả từ điện thoại. Nó dựng từ `internal-docs.ts`, một đường đọc tách hẳn
   khỏi `markdown.ts`, để `_internal` **không bao giờ** lọt vào `contentDirs` của người học.

Cuối ngày là cờ **`SELLING_ENABLED`**, đáng ghi vì chiều của nó ngược trực giác một cách
cố ý: **để trống nghĩa là không bán**. Quên bật lúc mở bán thì phát hiện ngay lần thử đầu
tiên; quên tắt trong beta thì người thử thấy giá và tạo được đơn thật trên gói Vercel
Hobby vốn cấm dùng thương mại — kiểu hỏng đó không có triệu chứng nào. Mặc định phải rơi
về phía hỏng ồn ào.

Đường thanh toán bị chặn ở **ba chỗ** chứ không phải một: màn hình bài khoá, hai trang
`/checkout`, và `createOrderAction`.

### 01/09 — tuyển người beta

Chốt cách vận hành: tuyển **ngoài app** bằng Google Form, người tham gia đăng nhập Google
một lần, rồi admin vào `/admin` bấm cấp gói kèm ghi chú cohort. Ghi chú đó là thứ
`beta-metrics.mjs` dùng để nhận ra nhóm — gõ sai là người đó biến mất khỏi thống kê.

Form cố ý chỉ **năm câu**, vì mỗi câu thừa là mất người. Câu lọc bắt buộc là **có đàn thật
không**: người chưa có đàn không tập được, và số liệu rơi rụng sẽ bẩn. Câu xác nhận sau
khi gửi form phải mời họ đăng nhập ngay, vì việc cấp quyền chỉ làm được sau khi tài khoản
đã tồn tại.

Ràng buộc khi đăng bài mời: **ít nhất một nửa phải là người lạ** — người quen ngại chê, họ
tick bài cho mình vui lòng và mình nhận về số liệu đẹp nhưng vô dụng. Và luôn mô tả sản
phẩm theo **cách làm** ("không có chuyện bản nhạc tự chạy bắt bạn theo kịp"), tuyệt đối
không nêu tên app hay khoá học của người khác.

### 07–08/09 — dọn đường dẫn cũ

Sửa lỗi đăng nhập trên điện thoại. Tắt `learning-piano.vercel.app` cùng các đường dẫn cũ.
Cân nhắc `piano` với `pianojourney` cho tên miền con, chọn `pianojourney` vì `piano` đứng
một mình quá ngắn và không nói lên tên dự án.

---

## 3. Còn treo

Ghi ở đây để lần sau mở ra là biết mình đang đứng ở đâu. Danh sách việc thì nằm ở
`ke-hoach-beta.md` và `lam-viec-hang-ngay.md`.

- **Chưa có người học thật nào đi hết Chương 1.** Đây vẫn là khoảng trống lớn nhất của cả
  dự án; mọi con số trong `du-phong-7-nam.md` đều treo trên giả định này.
- **Nhánh `preview` và `preview.rehover.io`** đã có quy trình viết sẵn nhưng chưa bật.
- **Video kỹ thuật ngắn** (form tay, luồn ngón, legato) — đã chốt là cần, chưa quay.
- **Web MIDI mở rộng ra ngoài bài luyện nhận nốt** — hướng đã chốt, chưa làm.
- **Giai đoạn 3 và 4** là sản phẩm riêng, chỉ quảng bá khi đã soạn xong.

---

## 4. Bối cảnh người làm

Không phải chuyện kỹ thuật, nhưng ảnh hưởng tới cách viết tài liệu và cách đề xuất.

- Làm một mình, ở TP.HCM, tập trên **Roland FP-30X** (88 phím, phím nặng) — cây đàn mà
  giáo trình được soạn quanh nó.
- **Làm việc chủ yếu qua AI, không tiện tự gõ lệnh.** Nên: đề xuất nào cần chạy nhiều
  lệnh thì chạy hộ, đừng đưa danh sách lệnh rồi bảo tự làm; và mọi quy trình phải viết ở
  dạng AI đọc xong thi hành được.
- Dùng **Fork** cho git, nên commit message mặc định là in ra để dán chứ không tự chạy.
- Hay hỏi *"tiếp theo làm gì"* sau một quãng nghỉ. Đó là lý do `lam-viec-hang-ngay.md`
  tồn tại và phải trả lời được câu đó ngay ở đầu file.

---

## Lịch sử cập nhật

> Mỗi lần sửa file thì **thêm một dòng mới lên đầu bảng**, không sửa dòng cũ. Cột
> *Tiêu đề commit* phải chép **y hệt** tiêu đề commit.

| Ngày | Tiêu đề commit | Cập nhật gì |
|---|---|---|
| 10/09/2026 | `feat: Ẩn thanh trạng thái khi mở app từ màn hình chính` | Chốt `display: fullscreen` cho manifest và ghi rõ cái giá phải trả (mất đồng hồ ở mọi trang) cùng hệ quả kéo theo ở thanh mời cài đặt |
| 09/09/2026 | `docs(internal): Dựng nhật ký quyết định từ lịch sử phiên làm việc` | Tạo file — dựng lại các câu đã hỏi và đã chốt trong 25/08–08/09 kèm lý do, vì lý do vốn chỉ nằm trong lịch sử chat và sẽ mất khi phiên cũ bị dọn |
