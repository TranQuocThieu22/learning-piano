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

Số liệu cho biết *bao nhiêu người rơi*, không cho biết *vì sao*. `beta-metrics.mjs`
chỉ ra được **ai** dừng ở bài nào; phần dưới đây là cách hỏi cho ra **vì sao**.

**Nguyên tắc xuyên suốt: hỏi về việc đã xảy ra, đừng hỏi ý kiến.** "Buổi tập gần
nhất của bạn diễn ra thế nào" cho câu trả lời dùng được; "bạn thấy giáo trình có
dễ hiểu không" chỉ cho ra lời khen lịch sự. Người ta nhớ việc mình đã làm khá
chính xác, còn ý kiến thì họ nghĩ ra ngay lúc được hỏi.

### 7.1 Biểu mẫu — gửi cuối tuần 2

Google Form, đúng năm câu, trả lời trên điện thoại trong ba phút.

**1.** *(chọn một)* Hai tuần vừa rồi bạn ngồi vào đàn được mấy buổi?
`0` · `1-2` · `3-5` · `6 buổi trở lên`

> Đối chiếu với số bài đã tick. Lệch nhiều nghĩa là người ta có tập mà không tick
> — và nếu vậy thì **chỉ số quyết định ở mục 6 đang bị đọc thấp hơn thực tế**.

**2.** *(mở)* **Lần gần nhất bạn định ngồi vào đàn mà rốt cuộc không ngồi — chuyện
gì đã xảy ra?**

> Câu quan trọng nhất của cả biểu mẫu. Nó hỏi một sự việc cụ thể, nên người ta kể
> lại được; hỏi "vì sao bạn ít tập" thì chỉ nhận về "bận quá".

**3.** *(mở)* Có bài nào hoặc đoạn nào bạn phải đọc lại nhiều lần mà vẫn thấy mơ
hồ không? Nhớ tên bài thì ghi giúp.

> Chỉ thẳng chỗ cần viết lại. Đây là câu cho ra việc sửa được ngay.

**4.** *(chọn một + ô "khác")* Nếu bạn đã ngừng tập, lý do gần nhất là gì?
`Chưa ngừng, vẫn đang tập` · `Không sắp xếp được thời gian` · `Bài khó quá, thấy
nản` · `Bài dễ quá, thấy chán` · `Không biết mình có đang tập đúng không` ·
`Đàn không tiện dùng` · `Khác`

> Hai lựa chọn "khó quá" và "dễ quá" cố ý đặt cạnh nhau. Nếu kết quả nghiêng hẳn
> một bên thì đó là vấn đề nhịp độ giáo trình, không phải vấn đề động lực.

**5.** *(mở, không bắt buộc)* Còn điều gì bạn muốn nói mà bốn câu trên chưa hỏi tới?

> Câu bắt được thứ người soạn biểu mẫu không nghĩ ra. Thường là câu cho nhiều
> nhất, và cũng là lý do biểu mẫu dừng ở năm câu chứ không mười.

**Về email:** bật thu thập email nhưng **để không bắt buộc**, và nói rõ trong phần
mô tả rằng nó dùng để đối chiếu với tiến độ và để mời phỏng vấn. Bắt buộc điền thì
người định bỏ cuộc sẽ không trả lời — mà họ đúng là nhóm cần nghe nhất.

**Đừng hỏi về giá.** Người đang dùng miễn phí trả lời câu hỏi giá không đáng tin.
Giá tính sau, khi có nội dung đủ để bán.

### 7.2 Phỏng vấn — cuối đợt

**Năm người, mỗi người 20 phút.** Ưu tiên **người đã bỏ giữa chừng** — họ biết điều
mà người học xong không biết. `beta-metrics.mjs` in sẵn danh sách email của người
quá hạn chưa xong Chương 1; lấy từ đó.

Khung 20 phút:

| Phút | Hỏi gì |
|---|---|
| 0-3 | Trước khi biết tới trang này, bạn đã thử học piano bằng cách nào chưa? Chuyện gì xảy ra? |
| 3-10 | **Kể lại buổi tập gần nhất của bạn.** Ngồi xuống lúc mấy giờ, mở cái gì trước, làm gì tiếp — càng chi tiết càng tốt |
| 10-15 | Tới lúc nào thì bạn thấy khó ở? Lúc đó bạn làm gì? |
| 15-18 | Điều gì bạn tưởng sẽ có mà hoá ra không có? |
| 18-20 | Nếu có một thứ được sửa để bạn quay lại tập, đó là gì? |

Ba điều đừng làm:

- **Đừng giải thích, đừng bào chữa.** Họ nói "chỗ này khó hiểu" mà mình đáp "thật
  ra ý là..." thì cuộc phỏng vấn kết thúc ngay tại đó — họ sẽ chỉ gật cho xong.
- **Đừng hỏi họ muốn tính năng gì.** Người dùng giỏi mô tả vấn đề, không giỏi thiết
  kế giải pháp. Hỏi vấn đề, phần giải pháp là việc của mình.
- **Đừng ngắt lời khi họ im lặng.** Chỗ ngập ngừng thường là chỗ sắp nói thật.

Ghi âm nếu họ đồng ý — vừa nghe vừa ghi chép thì sẽ bỏ sót đúng câu đáng giá.

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
- [x] **Baseline migration cho database production.** Đã chuyển từ `drizzle-kit push`
      sang migration có file, rồi đánh dấu production là đã có cấu trúc `0000` bằng
      `node scripts/baseline-migrations.mjs --prod --through 0000_little_cassandra_nova`.
      Sau đó Vercel **tự áp `0001`** ở lần build kế tiếp — cột `user.created_at` lên
      production mà không phải gõ lệnh nào cho riêng nó. Đây cũng là lần đầu quy trình
      "đổi schema là tự động" chạy thật từ đầu tới cuối.

      Đã kiểm trên `ep-still-bird-awjmxd8d`: 2 migration được đánh dấu, hash khớp với
      cả hai file `.sql` trong git, cột `created_at` đã có, và 2 tài khoản với 9 bài
      đã tick còn nguyên.

      Dấu vết đáng nhớ: lần build **trước** khi baseline đã trượt đúng ở bước migrate
      (`relation "account" already exists`) và chỉ để lại bảng
      `drizzle.__drizzle_migrations` rỗng. Fail-closed hoạt động như thiết kế —
      deploy không xảy ra, production vẫn phục vụ bản cũ, không mất gì.
- [x] **Điều khoản sử dụng — đã lên production.** `piano.rehover.io/terms` trả 200,
      có đủ email liên hệ, link Trang Facebook, và lời hứa hoàn thiện Giai đoạn 2
      trong đợt beta. Mục 7 tài liệu định hướng yêu cầu nêu rõ tài khoản dùng cá
      nhân, không chia sẻ — đã có ở mục 2 của điều khoản.
- [x] **Kênh liên hệ cho người beta.** Đã chốt hai kênh, ghi ở mục 7
      [`docs/legal/terms.md`](../legal/terms.md):

      - **Email `pianojourney@rehover.io` — XONG, đã gửi thư thử và nhận được.**
        Tên miền `rehover.io` mua thẳng tại Cloudflare Registrar (tầng công ty
        **reHover**, để sản phẩm sau dùng chung), nên không phải đổi nameserver.
        Chuyển tiếp dựng bằng **Cloudflare Email Routing**: MX trỏ về
        `route1/2/3.mx.cloudflare.net`, SPF `v=spf1 include:_spf.mx.cloudflare.net ~all`.

        Hai chỗ dễ mắc: (1) phải bấm **link xác nhận** Cloudflare gửi tới hộp thư
        đích, không bấm thì không thư nào được chuyển; (2) thêm Destination
        Address **chưa đủ** — vẫn phải tạo Routing rule cho từng địa chỉ, vì
        Destination là cấu hình ở tầng tài khoản còn MX chỉ sinh ra khi bật
        routing cho đúng tên miền.

        **Catch-all cố ý để tắt.** Bật lên thì mọi địa chỉ bịa ra ở `@rehover.io`
        đều vào hộp thư, và tên miền mới bị quét bằng danh sách từ điển chỉ trong
        vài tuần. Người gõ sai địa chỉ sẽ nhận thư báo lỗi và gửi lại — tốt hơn là
        im lặng biến mất giữa đống rác.
      - **Nhắn tin riêng cho Trang Facebook Piano Journey — ĐÃ TẠO.**
        facebook.com/profile.php?id=61593938880341 — hiện còn là đường dẫn dạng số
        vì chưa đặt được tên người dùng. Trong điều khoản đã để chữ dễ đọc và giấu
        đường dẫn phía sau, nên đặt tên người dùng sau cũng không phải sửa lại.

        Facebook không cho gạch dài trong tên Trang, phải dùng gạch nối thường.

      **Trang ở tầng sản phẩm, không phải tầng công ty**, và địa chỉ ghi trong điều
      khoản là **Trang** chứ không phải nhóm. Lý do: không ai vào một nhóm công khai
      để viết "tôi tập ba hôm rồi bỏ" trước mặt hai chục người khác và trước mặt tác
      giả — mà đó đúng là phản hồi mục 7 cần nhất. Nhóm (nếu lập) chỉ để tuyển người
      và thông báo, và phải để chế độ kín vì danh sách thành viên chính là danh sách
      người học.

      **Chuyển tiếp miễn phí chỉ lo chiều nhận.** Trả lời vẫn đi từ địa chỉ Gmail.
      Chấp nhận được trong beta; trước khi mở bán thì phải có gửi-đúng-tên, vì hoá
      đơn gửi từ `@gmail.com` trông không đáng tin. Việc đó đi cùng đợt nâng Vercel
      Pro và đăng ký kinh doanh.

**Chưa cần** trong đợt này: chính sách hoàn tiền, đăng ký kinh doanh, nâng Vercel
Pro. Cả ba chỉ bắt buộc khi bắt đầu thu tiền.

---

## 9. Chạy song song

Beta kéo dài 6 tuần. Dùng đúng quãng đó để **viết Chương 8, 9, 10** — ba chương còn
thiếu của Giai đoạn 2. Kết thúc beta mà nội dung cũng vừa đủ thì mở bán được ngay,
thay vì phải chờ thêm một vòng nữa.

**Đây là cam kết đã ghi vào điều khoản, không còn là dự định.** Mục 4 của
[`docs/legal/terms.md`](../legal/terms.md) hứa với người beta rằng Giai đoạn 2 sẽ
hoàn thiện trước khi đợt beta kết thúc, và người beta giữ trọn quyền truy cập Giai
đoạn 1 + 2 mà không phải trả thêm.

Vì sao hứa được mà không phạm mục 6 tài liệu định hướng: điều bị cấm ở đó là *"cập
nhật miễn phí trọn đời"* — nghĩa vụ vô hạn cho nội dung chưa hình dung ra. Ba chương
này đã có tên, có phạm vi, và nằm trong đúng gói `nen-tang` đã chốt. Lịch sử soạn
bài cũng ủng hộ: Chương 6 và Chương 7 viết xong trong **cùng một ngày** (26/08/2026),
nên ba chương trong sáu tuần là khả thi.

Hệ quả phải chấp nhận: **nếu chậm thì phải báo cho người beta**, không được im lặng
— điều khoản đã viết vậy. Và không được hứa thêm gì cho Giai đoạn 3, 4; hai giai
đoạn đó vẫn là sản phẩm riêng, chưa soạn, không được nhắc tới như một lời hứa.

---

## Lịch sử cập nhật

> Mỗi lần sửa file thì **thêm một dòng mới lên đầu bảng**, không sửa dòng cũ. Cột
> *Tiêu đề commit* phải chép **y hệt** tiêu đề commit để tìm lại được bằng
> `git log --grep="<tiêu đề>"` hoặc gõ thẳng vào ô tìm kiếm của Fork.

| Ngày | Tiêu đề commit | Cập nhật gì |
|---|---|---|
| 01/09/2026 | `docs(internal): Tick xong danh sách trước beta` | Điều khoản đã lên production ở tên miền mới piano.rehover.io — danh sách việc phải xong trước khi mở cổng đã đủ 7/7 |
| 27/08/2026 | `docs(internal): Soạn xong biểu mẫu và khung phỏng vấn cho mục Phản hồi định tính` | Mục 7 từ phác thảo thành thứ dùng được ngay: năm câu hỏi cụ thể kèm lý do từng câu, và khung phỏng vấn 20 phút hỏi về việc đã xảy ra thay vì hỏi ý kiến |
| 27/08/2026 | `feat: Thêm trang Điều khoản sử dụng cho giai đoạn beta` | Đã tạo Trang Facebook và điền link vào mục 7 điều khoản, chốt xong cả hai kênh liên hệ |
| 27/08/2026 | `feat: Thêm trang Điều khoản sử dụng cho giai đoạn beta` | Ghi lại cách dựng chuyển tiếp thư bằng Cloudflare Email Routing, hai chỗ dễ mắc, và lý do cố ý tắt catch-all |
| 27/08/2026 | `feat: Thêm trang Điều khoản sử dụng cho giai đoạn beta` | Chốt hai kênh liên hệ và ghi lý do đặt Trang Facebook ở tầng sản phẩm chứ không phải nhóm, vì nhóm công khai không cho ra phản hồi của người bỏ cuộc |
| 27/08/2026 | `feat: Thêm trang Điều khoản sử dụng cho giai đoạn beta` | Chuyển Giai đoạn 2 từ dự định thành cam kết ghi trong điều khoản, kèm lý do vì sao không phạm mục 6 và hệ quả phải báo nếu chậm |
| 28/08/2026 | `chore: Tick ô baseline và sửa dòng gợi ý database của beta-metrics` | Tick ô baseline ở mục 8 kèm bằng chứng đã kiểm, và ghi lại dấu vết lần build trượt trước đó để lần sau nhận ra đó là fail-closed đang hoạt động chứ không phải hỏng |
| 28/08/2026 | `feat: Baseline trỏ được vào production bằng cờ --prod` | Ô baseline ở mục 8 đổi sang cờ --prod: dán chuỗi kết nối production vào dòng lệnh là để mật khẩu nằm luôn trong lịch sử lệnh PowerShell |
| 28/08/2026 | `feat: Đổi schema bằng migration có file thay vì drizzle-kit push` | Thay ô đẩy cột `user.created_at` bằng ô baseline migration cho production — sau khi baseline thì cột được áp tự động ở lần deploy kế tiếp |
| 28/08/2026 | `feat: Ghi ngày tạo tài khoản và lọc cohort beta khi đo phễu` | Viết lại mục 5 cho khớp bản in mới của beta-metrics (lọc cohort theo entitlement.note, chỉ số quyết định tính trên nhóm đủ 14 ngày, in ra database đang đọc); thêm vào mục 8 việc đẩy cột user.created_at lên production vì ngày đăng ký không ghi lúc đó thì không dựng lại được |
| 27/08/2026 | `docs(internal): Bật nhánh database riêng cho mỗi preview deployment` | Ghi lại rằng Preview đã tách xong bằng cách ngắt–nối lại tích hợp Neon, kèm hai cái bẫy: đừng xoá store, và để trống ô tiền tố biến |
| 27/08/2026 | `docs(internal): Tách database dev khỏi production bằng nhánh Neon` | Đánh dấu xong phần cách ly máy làm việc, ghi rõ vì sao hoãn phần Preview deployment thay vì mạo hiểm ngắt kết nối production |
| 27/08/2026 | `docs(internal): Lên kế hoạch chạy beta trước khi mở bán` | Tạo file — chốt mục tiêu đo tỷ lệ hết Chương 1, cách cấp quyền cho người beta, mốc thời gian và tiêu chí quyết định |
