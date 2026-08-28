# Kế hoạch chạy beta

> **Tài liệu nội bộ — KHÔNG hiển thị trên web.**
>
> **Lịch sử cập nhật:** xem mục cuối file — mỗi lần sửa thêm một dòng, không ghi đè dòng cũ.

Kế hoạch này không nhằm "có người dùng". Nó nhằm trả lời **một câu hỏi duy nhất**
đã chốt ở mục 8 của [`dinh-huong-kinh-doanh.md`](dinh-huong-kinh-doanh.md):

> Trong 20-30 người học thật đầu tiên, **bao nhiêu người đi hết Chương 1?**

Mọi thứ dưới đây tồn tại để đo được con số đó cho tử tế.

---

## 1. Vì sao chạy beta thay vì mở bán luôn

**Nỗi lo bị chia sẻ không phải lý do để bỏ beta.** Nội dung là văn bản và bản nhạc
ABC — mục 1 của tài liệu định hướng đã kết luận nó *"cực dễ bị sao chép, một người
mua chụp màn hình là phát tán được toàn bộ"*. Người trả 399k sao chép dễ y hệt
người dùng beta. Thu tiền **không** thêm một lớp bảo vệ nào; nó chỉ bỏ mất phản hồi.

Câu trả lời cho chuyện sao chép đã có sẵn trong tài liệu: **Web MIDI**, thứ duy nhất
không copy được. Đó là việc dài hạn, không phải lý do hoãn beta.

**Lý do thật khiến chưa mở bán được:** gói `nen-tang` = Giai đoạn 1 + 2, mà Giai
đoạn 2 gồm Chương 7-10 thì **Chương 8, 9, 10 chưa được viết**. Đích đến dùng để
biện minh cho mức giá — *tự đệm được một bài hát hoàn chỉnh* — nằm ở Chương 10.

**Beta miễn phí còn gỡ được một vướng mắc khác:** gói Vercel Hobby cấm dùng thương
mại. Không thu tiền thì không vi phạm. Đây là quãng thời gian hợp lệ duy nhất để
chạy trên Hobby — trước đơn hàng đầu tiên phải nâng Pro.

---

## 2. Phạm vi

**Mở toàn bộ nội dung đang có** cho người tham gia beta: Chương 1-6 (Giai đoạn 1,
trọn vẹn, kết ở Trạm dừng chân) cộng Chương 7.

Cách mở: cấp quyền thật bằng script sẵn có, **không sửa code**, không đụng paywall:

```bash
node scripts/grant-access.mjs <email> nen-tang "beta dot 1"
```

Ba lý do chọn cách này:

- Người beta chạm được cả phần trả phí, nên đo được rơi rụng **sau** paywall chứ
  không chỉ trước nó.
- Ghi chú `"beta dot 1"` nằm trong cột `note` của bảng `entitlement`, sau này lọc
  ra được ai là người thử, ai là khách trả tiền.
- Họ **giữ quyền truy cập vĩnh viễn**. Cố ý. Người bỏ thời gian dò lỗi cho bạn thì
  xứng đáng, và điều đó cũng khiến họ trả lời thẳng thay vì lịch sự cho qua.

---

## 3. Tuyển ai, bao nhiêu

**Mục tiêu 20-30 người tập thật.** Rơi rụng ở tuần hai rất cao nên tuyển khoảng
**40** để còn lại chừng đó.

**Một điều kiện lọc bắt buộc: phải có đàn thật** (piano hoặc keyboard). Giáo trình
dạy kỹ thuật vật lý và dự án đã chốt không làm piano ảo — người không có đàn không
tập được, và nếu nhận họ vào thì số liệu rơi rụng sẽ bẩn, không còn nói lên điều gì
về sản phẩm.

**Ưu tiên đúng chân dung:** người mới hoàn toàn hoặc từng bỏ dở, tiếng Việt, tự học.
Đừng tuyển người đã chơi được — họ vượt Chương 1 trong một buổi và không đại diện
cho ai cả.

**Đừng tuyển toàn người quen.** Họ ngại chê và sẽ tick bài cho bạn vui lòng. Cố gắng
để ít nhất một nửa là người lạ.

---

## 4. Thời lượng và các mốc

Giai đoạn 1 dự kiến khoảng 60 ngày, nhưng **không cần chờ hết** mới ra quyết định.

| Mốc | Thời điểm | Đo cái gì |
|---|---|---|
| Mở cổng | Ngày 0 | Bao nhiêu người đăng nhập lần đầu |
| Chốt chặn 1 | **Cuối tuần 2** | Bao nhiêu đi hết Chương 1 — **đây là con số quyết định** |
| Chốt chặn 2 | Cuối tuần 4 | Bao nhiêu tới Trạm dừng chân (hết Chương 3) |
| Kết thúc đợt | Cuối tuần 6 | Phỏng vấn, tổng kết |

Chương 1 chỉ có 2 bài nên người tập đều sẽ xong trong 3-5 ngày. Ai sau **hai tuần**
vẫn chưa xong thì coi như đã rơi — đừng chờ thêm, chính chỗ rơi mới là dữ liệu.

---

## 5. Đo bằng gì

Không cần công cụ phân tích nào. Bảng `lesson_completion` đã ghi `completed_at` cho
từng bài, đó chính là dữ liệu. Chạy:

```powershell
# Ở máy làm việc: .env.local trỏ nhánh dev, số ở đây là số để thử
node scripts/beta-metrics.mjs

# Số thật của người beta nằm ở production, phải đặt biến đè lên
$env:DATABASE_URL='<chuỗi kết nối nhánh main>'; node scripts/beta-metrics.mjs
Remove-Item Env:DATABASE_URL
```

Dòng `Remove-Item` không thừa — quên xoá thì script đụng database gõ sau đó sẽ chạy vào
production. Xem bẫy 12 trong [`bay-ky-thuat.md`](bay-ky-thuat.md).

Script in ra: **nguồn dữ liệu** (đang đọc database nào, cohort bao nhiêu người),
**phễu T2 → T3 → T4**, **số người đăng ký mà chưa bao giờ tick bài nào**, phễu rơi
rụng theo từng bài, **chỉ số quyết định**, và danh sách email của người quá hạn chưa
xong Chương 1 để xếp lịch phỏng vấn ở mục 7.

Hai điều đã đóng sẵn vào script, đừng lặng lẽ nới ra:

- **Chỉ đếm người trong cohort beta**, nhận ra bằng ghi chú ở `entitlement.note` mà
  mục 2 đã quy định — nên tài khoản admin và tài khoản thử luồng thanh toán không lọt
  vào mẫu số. Ở cỡ mẫu 20-30, hai ba tài khoản rác đã lệch cả chục phần trăm. Đợt sau
  thì chạy với `--cohort "beta dot 2"`.
- **Chỉ số quyết định tính trên nhóm đã đủ 14 ngày kể từ bài đầu tiên.** Quy tắc "sau
  hai tuần chưa xong thì coi như đã rơi" ở mục 4 đếm riêng cho từng người, nên ai mới
  bắt đầu ba hôm thì chưa phải người rơi — gộp họ vào mẫu số là tự kéo tỷ lệ xuống.
  Tỷ lệ thô vẫn in ngay bên cạnh để đối chiếu, không giấu đi.

Khoảng cách giữa hai con số đó không nhỏ: với dữ liệu thử, cùng một tập người cho
44% khi tính thô và 55% khi tính đúng — một bên trượt ngưỡng, một bên đạt.

**Một cảnh báo khi đọc số:** tick là hành động tự nguyện. Có người tập mà không tick,
có người tick mà chưa tập. Con số này là **chỉ dấu**, không phải sự thật tuyệt đối —
nên mục 7 mới có phần phỏng vấn.

---

## 6. Tiêu chí quyết định

Đã chốt sẵn ở mục 8 của tài liệu định hướng, chép lại để khỏi phải mở hai file:

| Tỷ lệ đi hết Chương 1 | Kết luận | Làm gì tiếp |
|---|---|---|
| **≥ 50%** | Sản phẩm ổn | Viết nốt Chương 8-10, chuẩn bị mở bán |
| **< 50%** | Vấn đề nằm ở **sản phẩm**, không phải marketing | Sửa nội dung, **chưa tiêu tiền quảng cáo**, chạy đợt 2 |

Quan trọng: đừng đổi tiêu chí sau khi thấy kết quả. Viết trước, giữ nguyên.

---

## 7. Phản hồi định tính

Số liệu cho biết *bao nhiêu người rơi*, không cho biết *vì sao*. Cần thêm:

- **Một biểu mẫu ngắn** (Google Form) gửi ở cuối tuần 2, tối đa 5 câu. Câu quan
  trọng nhất: *"Lần gần nhất bạn định ngồi vào đàn mà rốt cuộc không ngồi — chuyện
  gì đã xảy ra?"*
- **Phỏng vấn 5 người**, mỗi người 20 phút, ở cuối đợt. Ưu tiên **người đã bỏ giữa
  chừng** — họ biết điều mà người học xong không biết.
- **Đừng hỏi về giá trong đợt này.** Người đang dùng miễn phí trả lời câu hỏi giá
  không đáng tin. Giá tính sau, khi có nội dung đủ để bán.

---

## 8. Việc phải xong trước khi mở cổng

- [x] **Tách database của MÁY LÀM VIỆC khỏi production.** Đã tạo nhánh Neon `dev`
      (endpoint `ep-dry-voice-aw3jnw02`); `.env.local` trỏ vào đó, production giữ
      nhánh `main` (`ep-still-bird-awjmxd8d`). Đã kiểm bằng dấu vết: ghi một đơn
      vào `dev` thì production **không** thấy nó. Đây là nửa quan trọng — nơi
      các script chạy tay dễ trượt nhất.
- [x] **Tách nốt Preview deployment.** Đã bật *Create Database Branch For
      Deployment → Preview* trong tích hợp Neon, nên **mỗi preview deployment có
      một nhánh database riêng**, tự tạo lúc deploy và tự dọn — tốt hơn phương án
      ban đầu là cho mọi preview dùng chung nhánh `dev`.

      Không sửa tại chỗ được: biến do integration tạo không có nút Edit, và hộp
      thoại *Connect to Project* từ chối vì project đã kết nối sẵn. Phải **ngắt kết
      nối project rồi nối lại** — chỉ gỡ liên kết, KHÔNG xoá store (xoá store là
      mất database). Nối lại phải để trống ô *Custom Environment Variable Prefix*,
      điền vào là biến đổi tên thành `STORAGE_URL` và code không đọc được.

      Làm được vì lúc đó **chưa có người dùng thật**, nên quãng production sập
      giữa hai bước không mất gì. Nếu đã có khách trả tiền thì phải hẹn giờ thấp
      điểm và báo trước.
- [x] **Khai đủ 5 biến môi trường còn thiếu trên Vercel** (`ADMIN_EMAILS`, bốn biến
      `SEPAY_*`). Đã kiểm trên production: `/admin` và `/admin/payments` trả 200.
- [x] **Thử đăng nhập trên điện thoại thật** — chạy được, và đã đi hết luồng
      `/checkout` tới trang mã QR bằng một tài khoản không phải admin.
- [ ] **Baseline migration cho database production, rồi deploy.** Repo đã chuyển từ
      `drizzle-kit push` sang migration có file, nên production cần đánh dấu một lần
      là đã có cấu trúc `0000`; sau đó `0001` (cột `user.created_at`) được Vercel áp
      **tự động** ngay lần build kế tiếp.

      ```powershell
      $env:DATABASE_URL='<chuỗi kết nối nhánh main>'; node scripts/baseline-migrations.mjs --through 0000_little_cassandra_nova
      Remove-Item Env:DATABASE_URL
      ```

      Chạy **trước** khi push commit chuyển đổi. Quên thì build trên Vercel trượt ở
      bước migrate và deploy không xảy ra — bản đang chạy vẫn nguyên, không mất gì,
      chỉ là phải quay lại làm bước này.

      Vì sao gấp: thiếu cột `created_at` thì tầng T2→T3 của phễu và quy tắc "quá hai
      tuần là rơi" ở mục 4 đều không tính được, và **ngày đăng ký không ghi ngay lúc
      đó thì về sau không dựng lại được**. Phải xong TRƯỚC khi người beta đầu tiên
      đăng nhập.
- [ ] **Điều khoản sử dụng** — mục 7 tài liệu định hướng đã yêu cầu: tài khoản dùng
      cá nhân, không chia sẻ. Miễn phí vẫn cần, vì nó đặt chuẩn mực ngay từ đầu.
- [ ] Một kênh liên hệ để người beta báo lỗi.

**Chưa cần** trong đợt này: chính sách hoàn tiền, đăng ký kinh doanh, nâng Vercel
Pro. Cả ba chỉ bắt buộc khi bắt đầu thu tiền.

---

## 9. Chạy song song

Beta kéo dài 6 tuần. Dùng đúng quãng đó để **viết Chương 8, 9, 10** — ba chương còn
thiếu của Giai đoạn 2. Kết thúc beta mà nội dung cũng vừa đủ thì mở bán được ngay,
thay vì phải chờ thêm một vòng nữa.

Đừng hứa mốc cụ thể với người beta về ba chương này. Mục 6 tài liệu định hướng đã
cấm hứa nội dung chưa tồn tại.

---

## Lịch sử cập nhật

> Mỗi lần sửa file thì **thêm một dòng mới lên đầu bảng**, không sửa dòng cũ. Cột
> *Tiêu đề commit* phải chép **y hệt** tiêu đề commit để tìm lại được bằng
> `git log --grep="<tiêu đề>"` hoặc gõ thẳng vào ô tìm kiếm của Fork.

| Ngày | Tiêu đề commit | Cập nhật gì |
|---|---|---|
| 28/08/2026 | `feat: Đổi schema bằng migration có file thay vì drizzle-kit push` | Thay ô đẩy cột `user.created_at` bằng ô baseline migration cho production — sau khi baseline thì cột được áp tự động ở lần deploy kế tiếp |
| 28/08/2026 | `feat: Ghi ngày tạo tài khoản và lọc cohort beta khi đo phễu` | Viết lại mục 5 cho khớp bản in mới của beta-metrics (lọc cohort theo entitlement.note, chỉ số quyết định tính trên nhóm đủ 14 ngày, in ra database đang đọc); thêm vào mục 8 việc đẩy cột user.created_at lên production vì ngày đăng ký không ghi lúc đó thì không dựng lại được |
| 27/08/2026 | `docs(internal): Bật nhánh database riêng cho mỗi preview deployment` | Ghi lại rằng Preview đã tách xong bằng cách ngắt–nối lại tích hợp Neon, kèm hai cái bẫy: đừng xoá store, và để trống ô tiền tố biến |
| 27/08/2026 | `docs(internal): Tách database dev khỏi production bằng nhánh Neon` | Đánh dấu xong phần cách ly máy làm việc, ghi rõ vì sao hoãn phần Preview deployment thay vì mạo hiểm ngắt kết nối production |
| 27/08/2026 | `docs(internal): Lên kế hoạch chạy beta trước khi mở bán` | Tạo file — chốt mục tiêu đo tỷ lệ hết Chương 1, cách cấp quyền cho người beta, mốc thời gian và tiêu chí quyết định |
