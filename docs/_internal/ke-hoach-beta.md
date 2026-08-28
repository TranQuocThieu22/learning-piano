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

```bash
node scripts/beta-metrics.mjs
```

Script in ra bốn thứ: số người đăng nhập, phễu rơi rụng theo từng bài, tỷ lệ đi hết
Chương 1, và thời gian trung vị từ bài đầu tới hết Chương 1.

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
      `pnpm db:push` và các script chạy tay dễ trượt nhất.
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
| 27/08/2026 | `docs(internal): Bật nhánh database riêng cho mỗi preview deployment` | Ghi lại rằng Preview đã tách xong bằng cách ngắt–nối lại tích hợp Neon, kèm hai cái bẫy: đừng xoá store, và để trống ô tiền tố biến |
| 27/08/2026 | `docs(internal): Tách database dev khỏi production bằng nhánh Neon` | Đánh dấu xong phần cách ly máy làm việc, ghi rõ vì sao hoãn phần Preview deployment thay vì mạo hiểm ngắt kết nối production |
| 27/08/2026 | `docs(internal): Lên kế hoạch chạy beta trước khi mở bán` | Tạo file — chốt mục tiêu đo tỷ lệ hết Chương 1, cách cấp quyền cho người beta, mốc thời gian và tiêu chí quyết định |
