# Lộ trình phát triển và mô hình doanh thu

> **Tài liệu nội bộ — KHÔNG hiển thị trên web.** Thư mục `_internal` nằm ngoài
> `contentDirs` trong `src/lib/markdown.ts`.
>
> **Tài liệu này bổ sung cho `dinh-huong-kinh-doanh.md`, không thay thế nó.**
> File kia trả lời *bán cái gì, giá bao nhiêu, vì sao*. File này trả lời *làm theo
> thứ tự nào, đo bằng gì, và khi nào được phép bước tiếp*.
>
> **Lịch sử cập nhật:** xem mục cuối file — mỗi lần sửa thêm một dòng, không ghi đè dòng cũ.
>
> **Mức độ tin cậy:** Mọi con số dưới đây là **suy luận**, chưa có một khách hàng
> thật nào để kiểm chứng. Phần thuế và pháp lý phải hỏi kế toán trước khi dựa vào.
> Ba kịch bản ở mục 3 tồn tại để **giới hạn kỳ vọng**, không phải để lập kế hoạch chi tiêu.
>
> **Bản mở rộng 7 năm:** `du-phong-7-nam.md` — kéo dài ba kịch bản ở mục 3 ra tới 2033,
> quy đổi doanh thu gộp sang ròng, và liệt kê năm rào cản thật. Nó **cố ý vi phạm** cảnh
> báo "quá năm thứ hai là văn học" ở mục 3, nên chỉ dùng để thấy thứ tự độ lớn.

---

## 1. Khoảng cách lớn nhất hiện nay

Trạng thái thật của sản phẩm (kiểm lại trong mã ngày 28/08/2026):

| Thứ | Trạng thái |
|---|---|
| Nội dung | Giai đoạn 1 xong (Chương 0-6), Giai đoạn 2 mới có Chương 7 — tổng 25 bài |
| Backend thanh toán | Xong: đơn hàng, VietQR, webhook SePay, trang admin đối soát |
| Trang mua cho người học | **Xong** — `/checkout` và `/checkout/[orderId]`, vào từ nút ở `LessonLocked.tsx` |
| Khoá nội dung theo gói | **Xong** — `src/lib/access.ts` khoá từ Chương 2 trở đi |
| Đổi cấu trúc bảng | **Xong** — migration có file trong `drizzle/`, Vercel tự áp lúc build |
| **Trang bán hàng cho người lạ** | **Chưa có** — `src/app/page.tsx` chỉ chuyển hướng sang lộ trình, không có chỗ nào nói sản phẩm là gì và giá bao nhiêu |
| Nguồn khách | Chưa có gì — không SEO, không kênh nào |
| Người học thật | **0** (production có 2 tài khoản thử của chính mình) |

Hai khoảng cách, và chúng khác nhau về mức độ cấp bách:

**Khoảng cách 1 — chưa có ai học.** Đây mới là cái chặn đường. Mọi con số ở tài liệu này
và ở `dinh-huong-kinh-doanh.md` đều là suy luận, và chỉ người học thật mới xác nhận hay
bác bỏ được chúng.

**Khoảng cách 2 — chưa thu được tiền.** Có thật, nhưng **chưa phải việc phải làm ngay**.

> [!IMPORTANT]
> **Không nhầm hai việc này với nhau.** Chương 0 và Chương 1 vốn **miễn phí** theo thiết
> kế paywall — nghĩa là **đo được chỉ số quyết định (T3→T4) mà không cần bán gì cả**.
>
> Điều này giải một mâu thuẫn tưởng như bế tắc: mục 9 của `dinh-huong-kinh-doanh.md` ghi
> *"chỉ nên bắt đầu thu tiền sau khi Chương 5-6 và Giai đoạn 2 hoàn thiện"*, vì bán một
> khóa dang dở là rủi ro uy tín lớn nhất. Ràng buộc đó vẫn đúng và vẫn giữ. Nhưng nó
> **không cấm đưa người học thật vào phần miễn phí** — mà đó lại đúng là thứ cần làm sớm
> nhất.
>
> Vậy nên thứ tự ở mục 7 là: **đo trước bằng người dùng miễn phí → hoàn thiện Giai đoạn 2
> → mới mở bán**. Vừa tôn trọng ràng buộc cũ, vừa không phải chờ hết Chương 10 mới biết
> sản phẩm có dùng được không.

## 2. Phễu và cách đo — định nghĩa dùng chung

Mọi con số về sau phải nói rõ đang ở tầng nào của phễu. Trộn lẫn "lượt truy cập" với
"người đăng ký thật" là cách tự lừa mình phổ biến nhất.

| Tầng | Định nghĩa | Đo bằng |
|---|---|---|
| **T1 — Lượt truy cập** | Người lạ vào trang bất kỳ | Analytics |
| **T2 — Đăng ký thật** | Đăng nhập Google thành công | Bảng `user` |
| **T3 — Bắt đầu** | Tick được ít nhất 1 bài | `lesson_completion` |
| **T4 — Chạm paywall** | Tick xong bài cuối Chương 1 | `lesson_completion` |
| **T5 — Mua** | Đơn hàng đã đối soát | `payment_received` |
| **T6 — Hoàn thành Giai đoạn 1** | Tick xong bài cuối Chương 6 | `lesson_completion` |
| **T7 — Giới thiệu** | Khách mới nói do người cũ giới thiệu | Hỏi lúc mua |

**Chỉ số quyết định vẫn là T3 → T4** (mục 8 của `dinh-huong-kinh-doanh.md`): trong
20-30 người học thật đầu tiên, bao nhiêu người đi hết Chương 1. Dưới một nửa thì vấn đề
nằm ở **sản phẩm**, và chưa được tiêu một đồng quảng cáo nào.

**Phép thử bắt buộc cho mọi dự phóng doanh thu.** Trước khi tin bất kỳ con số khách
hàng nào, lắp ngược lại phễu:

```
Số khách mua  ÷  (tỷ lệ T4→T5)  ÷  (tỷ lệ T3→T4)  ÷  (tỷ lệ T2→T3)  =  số đăng ký cần
```

Ví dụ vì sao phép thử này quan trọng: một dự phóng từng đưa ra **13.000 khách/năm**.
Với giả định rộng tay (30% đi hết Chương 1, 30% trong số đó mua), con số đó đòi
**~145.000 người đăng ký thật/năm**, tức khoảng **1-1,5 triệu lượt truy cập/năm** —
quy mô của một trang giáo dục lớn, không phải mặc định của sản phẩm một người làm.
Không có gì cấm mơ tới đó, nhưng nó là **kịch bản tốt**, không phải kịch bản cơ sở.

## 3. Ba kịch bản doanh thu

Giả định chung: giá ra mắt 399k, tăng lên ~599k khi Giai đoạn 2 hoàn thiện (mục 5 tài
liệu định hướng). **Chưa tính** doanh thu Giai đoạn 3-4 vì chúng chưa tồn tại.

| | Xấu | Cơ sở | Tốt |
|---|---|---|---|
| **Năm 1** (khách / doanh thu) | 10 / ~4tr | 30-80 / 12-32tr | 150-300 / 60-120tr |
| **Năm 2** | 30 / ~18tr | 150-400 / 90-240tr | 800 / ~480tr |
| **Năm 3** | 60 / ~36tr | 400-900 / 240-540tr | 1.800 / ~1,08 tỷ |
| **Năm 5** | Đã dừng | 1.000-2.000 / 0,6-1,2 tỷ | 6.000 / ~3,6 tỷ |
| **Điều gì dẫn tới kịch bản này** | T3→T4 dưới 40%, không ai giới thiệu ai | SEO tích lũy dần, giới thiệu truyền miệng có thật | SEO mạnh + video lan được + MIDI thành điểm khác biệt rõ |

> [!WARNING]
> **Dự phóng quá năm thứ hai là văn học, không phải kế hoạch.** Dùng bảng này để biết
> *thứ tự độ lớn*, đừng dùng để đặt mục tiêu hay để tính chuyện nghỉ việc.
>
> Kịch bản **Xấu** không phải chuyện đùa: mục 0 của tài liệu định hướng đã ghi rõ giả
> thuyết nền có thể sai — nếu người khác cũng bỏ ở tuần thứ hai giống như khi họ dùng
> app chấm điểm tự động, thì vấn đề nằm ở bản chất việc học piano, và **toàn bộ định vị
> phải làm lại**. Mọi bảng dự phóng không có nhánh này đều là bảng thiếu.

## 4. Doanh thu không phải tiền vào túi

Bảng ở mục 3 là **doanh thu gộp**. Phải trừ ít nhất những khoản sau trước khi nói về
"kiếm được bao nhiêu":

| Khoản | Ghi chú |
|---|---|
| **Thuế** | Từ 01/01/2026 hộ kinh doanh bỏ thuế khoán, phải kê khai; ngưỡng miễn nâng lên **200 triệu/năm**. Bán khóa học số thường được xếp là **dịch vụ**. **Phải hỏi kế toán** trước khi dựa vào con số cụ thể — mục 7 tài liệu định hướng cũng đã ghi vậy |
| **Hoàn tiền** | Chính sách 7 ngày ở mục 7 nghĩa là một phần doanh thu quay ngược ra. Tạm tính 5-10% |
| **Hạ tầng** | Vercel Pro **bắt buộc** (mục 6 — gói Hobby cấm dùng thương mại), tên miền, database |
| **Cổng thanh toán** | Chuyển khoản + QR thì phí thấp; nếu sau này thêm thẻ thì 2-3% |
| **Chi phí kiếm khách** | Khoản dễ bị bỏ quên nhất. Bằng 0 chỉ khi khách tới hoàn toàn từ SEO và truyền miệng |
| **Thời gian người làm** | Không xuất hiện trên sổ sách nhưng là chi phí thật. Một tính năng "chấm bài thủ công" 99k/tháng có thể lỗ về mặt giờ công |

**Quy tắc:** khi nói doanh thu, luôn nói kèm nó là **gộp**. Khi so sánh với việc đi làm
hay việc khác, phải dùng con số **sau thuế và sau chi phí**.

## 5. Mô hình sản phẩm bốn lớp

Đây là hình dạng dài hạn được chấp nhận. Quan trọng nhất là **điều kiện mở khóa** của
từng lớp — không được nhảy cóc.

| Lớp | Là gì | Vai trò | Điều kiện được phép làm |
|---|---|---|---|
| **Free** | Bài SEO trả lời câu hỏi người mới, máy đánh nhịp, luyện nhận nốt, Chương 0 + Chương 1 | Mang khách vào, không tốn tiền quảng cáo | **Làm được ngay** — công cụ đã có sẵn trong app |
| **Core** | Giáo trình mua đứt, hiện là gói Nền tảng | Doanh thu chính | **Làm được ngay** — chỉ thiếu trang mua và khóa nội dung |
| **MIDI** | Chấm bài kiểu đánh xong xem lại, với đàn thật | Thứ khó sao chép nhất — nội dung chữ chụp màn hình là hết | Sau khi Core bán được và Giai đoạn 2 xong |
| **Recurring** | Bài luyện mới hàng tháng, thử thách, về sau có thể là AI coach đọc dữ liệu luyện tập | Nâng LTV, giữ khách nhiều năm | **Chỉ khi MIDI chạy ổn định** — đúng điều kiện mục 10 tài liệu định hướng |

> [!IMPORTANT]
> **Ràng buộc không được vi phạm ở lớp MIDI:** chấm điểm phải theo kiểu **đánh xong rồi
> xem lại**, không được có bản nhạc tự trôi, nốt rơi kiểu game, hay chấm đúng/sai thời
> gian thực. Xem `AGENTS.md` và mục 0 tài liệu định hướng — đây là lý do tồn tại của cả
> sản phẩm, không phải chi tiết kỹ thuật.

**Vì sao Recurring bị chặn tới tận sau MIDI.** Tài liệu định hướng từ chối thuê bao vì
nội dung hữu hạn, và tự đặt ngoại lệ: *"Thuê bao chỉ hợp lý khi nội dung sinh thêm liên
tục hoặc có dịch vụ diễn ra liên tục."* Một gói tháng có **chấm bài thủ công** thoả điều
kiện đó về mặt hình thức, nhưng tạo ra **lao động lặp vô hạn cho một người** — đúng thứ
giết các sản phẩm cá nhân. Chỉ khi máy chấm được (MIDI) thì gói tháng mới không phải là
tự bán thời gian của mình.

## 6. Chính sách nội dung: text-first, video có chọn lọc

**Không chuyển toàn bộ giáo trình sang video.** Tỷ lệ nhắm tới: khoảng **60-70% chữ và
tương tác, 30-40% video ngắn**.

| Loại nội dung | Nên là |
|---|---|
| Lý thuyết, giải thích *vì sao*, lộ trình, ôn tập nhanh | **Chữ** — đọc lại nhanh, sửa nhanh, Google đọc được |
| Form tay, cổ tay, độc lập ngón, legato/staccato, lực đánh, luồn ngón/vắt ngón, phối hợp hai tay | **Video ngắn 30 giây - 5 phút** — chữ không tả nổi |
| Demo một bài hoàn chỉnh | Video |
| Nhạc mẫu | Đã có sẵn: mọi khối ABC đều bấm nghe được |

Một bài học **không phải** một video 15-30 phút. Nó là: *phần đọc → vài clip ngắn cho
đúng chỗ cần nhìn tay → bài tập ABC → tick hoàn thành*.

**Ba lý do cho thứ tự này:**

1. **Chi phí sửa.** Sửa một câu Markdown mất 30 giây; sửa một câu đã quay phải quay lại
   cả clip. Nên **chỉ quay thứ đã ổn định** — tức sau khi 20-30 người học thật đã phản
   hồi và nội dung không còn thay đổi nữa.
2. **Video không giải quyết được chuyện bị sao chép.** Video cũng copy được. Thứ khó
   copy là tương tác với cây đàn thật của người học (lớp MIDI).
3. **Video là tài sản bán hàng, không chỉ tài sản dạy học.** Người mua đang trả tiền cho
   một người họ chưa từng thấy mặt. Clip 60 giây quay bàn tay vừa là bài học, vừa là
   bằng chứng năng lực, vừa là bài đăng kéo khách. Khoản này thuộc mục "kiếm khách" chứ
   không chỉ mục "nội dung" — và đó là lý do nó đáng làm sớm hơn vẻ ngoài của nó.

## 7. Lộ trình theo giai đoạn, có cổng quyết định

Mỗi giai đoạn có **điều kiện ra**. Không đạt điều kiện thì không bước tiếp, kể cả khi
việc ở giai đoạn sau hấp dẫn hơn.

### Giai đoạn A — 20-30 người học thật, hoàn toàn miễn phí

*Việc cần làm:* đưa 20-30 người thật vào học Chương 0 và Chương 1 (phần vốn miễn phí),
đo đủ T1→T5 ở mục 2, và **phỏng vấn những người bỏ giữa chừng** — quan trọng hơn phỏng
vấn người hoàn thành rất nhiều, vì người bỏ mới nói cho bạn biết sản phẩm hỏng ở đâu.

*Chưa cần:* trang mua, khóa nội dung, cổng thanh toán, Vercel Pro. Chưa thu tiền thì
chưa phải là dùng thương mại.

*Điều kiện ra:* **T3→T4 đạt từ 50% trở lên** — tức quá nửa số người bắt đầu đi hết được
Chương 1.

*Nếu không đạt:* quay lại sửa Chương 1, không tiêu tiền quảng cáo, **không soạn thêm
chương mới**. Đây là cổng nghiêm ngặt nhất của cả lộ trình, và cũng là cổng dễ bị bỏ qua
nhất vì soạn chương mới thì dễ chịu hơn nhiều so với nghe người ta nói sản phẩm mình dở.

> [!NOTE]
> **Nếu có người trong nhóm này chủ động hỏi mua** khi chưa có gì để bán — ghi lại, đó là
> tín hiệu mạnh nhất bạn có thể thu được ở giai đoạn này, mạnh hơn mọi con số ở mục 3.

### Giai đoạn B — Hoàn thiện Giai đoạn 2 và dựng đường bán

*Việc cần làm:* soạn Chương 8, 9, 10 để người học thật sự **tự đệm được một bài hát**;
song song dựng trang mua, khóa nội dung sau Chương 1, chính sách hoàn tiền 7 ngày, điều
khoản sử dụng, nâng **Vercel Pro** (bắt buộc trước khi thu đồng đầu tiên), đăng ký kinh
doanh và thuế.

*Điều kiện ra:* **có 1 người lạ — không phải người quen — trả tiền và học được**.

*Vì sao thứ tự này:* mục 4 tài liệu định hướng yêu cầu mỗi gói phải **tự nó trọn vẹn**.
Gói Nền tảng là Giai đoạn 1 + 2, nên chỉ trọn vẹn khi Chương 10 xong.

### Giai đoạn C — Nguồn khách bền

*Việc cần làm:*

- **8-10 bài SEO** trả lời đúng câu hỏi người mới gõ vào Google: *bắt đầu từ đâu, tay
  trái hay tay phải trước, bao lâu thì chơi được, vì sao hai tay khó, mỗi ngày tập bao
  nhiêu phút, 61 phím có đủ không, cách đọc nốt, cách nhớ vị trí nốt, tự học có được
  không*. Mỗi bài kết thúc bằng đường vào Chương 1. Nội dung phần lớn đã nằm sẵn trong
  giáo trình, chỉ cần viết lại cho người chưa mua đọc.
- Đưa máy đánh nhịp và bài luyện nhận nốt ra thành **trang có thể tìm thấy được**, thay
  vì nằm im sau thanh điều hướng.
- Quay loạt video kỹ thuật ngắn đầu tiên (danh sách ở mục 6). Tới đây nội dung đã ổn
  định sau phản hồi của nhóm ở Giai đoạn A, nên quay không sợ phải quay lại.

*Điều kiện ra:* **có khách tới từ tìm kiếm chứ không phải từ người quen**.

*Được phép tăng giá lên ~599k tại đây* (mục 5 tài liệu định hướng) — vì lúc này Giai đoạn 2
đã trọn vẹn. Thông báo trước, người đã mua giữ nguyên quyền truy cập.

### Giai đoạn D — Web MIDI thành điểm khác biệt

*Việc cần làm:* mở rộng `ScorePractice` thành tính năng đầy đủ trong bài học, chấm kiểu
đánh xong xem lại.

*Điều kiện ra:* người học dùng thật và nói được nó giúp gì.

*Trước khi mở giai đoạn này, phải biết người học dùng máy gì.* Từ 11/09/2026 đã chốt
**điện thoại và tablet là thiết bị chính** (xem `AGENTS.md`), mà Web MIDI chạy trên
Android và máy tính, **không chạy trên iPhone/iPad**. Lớp MIDI chỉ là điểm khác biệt với
phần người học dùng được nó. Nên đọc mục hệ điều hành trong Vercel Analytics trước: nếu
phần lớn là iOS thì điều kiện ra ở trên không đạt được bằng web thuần, và phải bàn lại
trước khi viết dòng mã nào — kể cả câu đã chốt "không làm app mobile".

#### Nghe tiếng đàn qua micro — đã làm, chờ đo trên máy thật

> [!NOTE]
> **11/09/2026: đã làm.** Buổi sáng mục này mới là giả thuyết để thử; buổi chiều chủ sản
> phẩm chốt làm luôn và làm đầy đủ, không đợi qua cổng beta. Micro là cách nối **mặc định**
> ở cả `/note-trainer` lẫn *Tập bài này với đàn*, MIDI đứng thứ hai.
>
> **Chưa có kết quả đo nào trên điện thoại thật đặt cạnh đàn thật.** Mọi con số dưới đây đo
> trên tiếng đàn tổng hợp. Việc đo thật nằm ở "Còn treo" của `lam-viec-hang-ngay.md`.

*Ý tưởng:* thay vì nối dây, app nghe tiếng đàn qua micro của điện thoại rồi nhận ra nốt
vừa đánh. Safari trên iPhone cho web dùng micro, nên hướng này đi được ở đúng chỗ Web MIDI
không đi được — đoạn "phải bàn lại chuyện app mobile" ở trên chỉ còn đúng nếu đo thật cho
thấy micro không đủ chuẩn.

*Đã làm gì* (chi tiết trong chú thích đầu mỗi file):

- `src/lib/mic-pitch.ts` — nhận nhiều nốt cùng lúc bằng cách cộng hoạ âm rồi trừ dần,
  không phải dò một cao độ như máy lên dây đàn guitar.
- `src/lib/mic-listener.ts` — tìm lúc phím xuống, chỉ báo nốt vừa đánh chứ không báo lại
  nốt còn đang ngân. Trễ khoảng 110ms từ lúc phím xuống.
- `src/lib/mic-follow.ts` — nối vào đúng lối bám theo đang có (`score-follow.ts`); ba ràng
  buộc chống áp lực giữ nguyên.
- `src/hooks/useMicInput.ts`, `public/audio/mic-capture-worklet.js` — bật micro, tắt ba bộ
  lọc dành cho cuộc gọi (lọc ồn, tự chỉnh âm lượng, khử vọng — cả ba đều phá tiếng đàn),
  bỏ qua micro trong lúc app tự phát nhạc mẫu.

*Đo trên tiếng tổng hợp* (`src/lib/mic-accuracy.test.ts`, chạy cùng `pnpm test`):

| Chế độ | Kết quả |
|---|---|
| Tập theo bản nhạc (có biết nốt đang chờ) | ~92% nốt nghe đúng, ~1% nốt ma |
| Luyện nhận nốt | 100% đúng phím; **0 lần** đánh sai mà bị báo "Chính xác" |

Phần sót còn lại gần như toàn là nốt đánh rất nhẹ trong phòng ồn. Thử trong trình duyệt thật
bằng micro giả lập (tiếng tổng hợp phát qua `getUserMedia` giả): Ode to Joy tay phải và tay
trái đều 15/15, nốt đánh nhầm được nghe đúng tên và nháy đỏ đúng một lần.

*Giới hạn đã biết, đã ghi cho người học ở `docs/07-doc-them/khong-lam-piano-ao.md`:*

- **Hai tay cách nhau đúng một quãng tám** — mọi hoạ âm của nốt cao nằm trọn trong nốt thấp,
  về lý thuyết không tách được. Ở những chỗ đó, nghe được một tay là tính đủ cả hai.
- **Tiếng bíp của máy đánh nhịp** lẫn vào micro. Phần lớn bị loại (tiếng bíp chỉ có một tần
  số, không giống nốt đàn) nhưng không phải tất cả.
- Không có bản nhạc đang chờ thì hai nốt cách nhau một quãng tám chỉ báo nốt thấp — chủ ý,
  vì phổ của nó y hệt phổ khi đánh lại nốt thấp.

*Vì sao đáng làm* — so với nối dây, micro hơn ở ba chỗ:

- **Chạy trên mọi máy, kể cả iPhone/iPad** — gỡ khoảng trống ở đoạn trên mà vẫn ở trong
  khuôn web.
- **Chạy với cả đàn cơ**, thứ không có cổng USB.
- **Không cáp OTG, không cắm rút** — máy đặt lên giá nhạc là xong, khớp với hướng di động.

*Ràng buộc không đổi:* ba điều giữ cho phản hồi tức thời không thành áp lực ở `AGENTS.md`
áp nguyên cho micro — con trỏ chỉ nhích khi người học đánh, sai thì nháy rồi tắt, không
có bảng điểm chạy trong lúc đánh. Micro là một đường vào khác của cùng lối phản hồi đang
có, không có luật riêng. Riêng cho micro: âm thanh xử lý ngay trên máy, không ghi âm, không
gửi đi đâu — và điều đó được **nói rõ ngay cạnh nút bật micro**, vì người học thấy trình
duyệt hỏi quyền micro là sẽ lo.

*Còn phải đo trên máy thật, theo thứ tự từ dễ tới khó* — micro không đủ chuẩn ở bước nào thì
ghi lại và cân nhắc giấu micro khỏi bước đó, dừng ở bước 2 vẫn có lời:

1. Bài luyện nhận nốt (`/note-trainer`) — mỗi lần đúng một nốt.
2. Bài tập một tay trong *Tập bài này với đàn* (Chương 1-5).
3. Hai tay và hợp âm (Chương 6-7).

Đo trên **cả iPhone lẫn Android**, **cả đàn điện lẫn đàn cơ** nếu có, trong phòng bình
thường chứ không phải phòng thật yên. Mọi con số chỉnh nằm ở `PITCH_TUNING` và
`LISTENER_TUNING` đầu hai file; chỉnh xong phải chạy lại `mic-accuracy.test.ts` để chắc
không thụt lùi.

*Kết quả đo thật dẫn tới đâu:*

- **Đủ chuẩn** → Giai đoạn D đổi từ "Web MIDI" thành "tập với đàn", với micro và MIDI là
  hai đường vào; đoạn "phải bàn lại chuyện app mobile" ở trên hết lý do tồn tại.
- **Không đủ chuẩn ở bước nào** → ghi kết quả đo vào đây (máy gì, đàn gì, sai kiểu gì).
  Kết quả không tốt cũng phải ghi, để lần sau khỏi đo lại từ đầu.

### Giai đoạn E — Xem lại toàn bộ mô hình

*Chỉ mở khi:* MIDI chạy ổn định, có từ 50 khách thật trở lên, biết tỷ lệ hoàn thành.

*Lúc đó mới bàn:* gói tháng, AI coach đọc dữ liệu luyện tập, Giai đoạn 3-4, gói trọn bộ.

## 8. Đã cân nhắc và tạm KHÔNG làm

Ghi lại kèm lý do, để lần sau có người (kể cả chính mình) đề xuất lại thì khỏi bàn từ đầu.

| Việc | Vì sao chưa làm |
|---|---|
| **Gói thuê bao 49-99k/tháng ngay bây giờ** | Nội dung hữu hạn; và gói tháng có chấm bài thủ công là lao động lặp vô hạn cho một người. Chờ MIDI — xem mục 5 |
| **AI Piano Coach** | Cần dữ liệu luyện tập thật, mà dữ liệu cần MIDI, mà MIDI chưa xong. Ý hay cho Giai đoạn E |
| **Chuyển toàn bộ nội dung sang video** | Chi phí sản xuất và chi phí sửa quá lớn, lại không giải quyết được chuyện bị sao chép — xem mục 6 |
| **Mở bán Giai đoạn 3-4, hoặc quảng bá "sắp ra mắt"** | Chưa soạn một chữ nào. Mục 4 tài liệu định hướng cấm quảng bá trước khi làm xong |
| **Chạy quảng cáo trả tiền** | Chưa biết T3→T4. Đổ tiền vào một cái phễu thủng là cách đốt tiền nhanh nhất |
| **App bọc web lên App Store chỉ để có MIDI cho iPhone** | Chỉ gỡ được chuyện nối dây trên iPhone, đổi lại vướng thanh toán qua store (nội dung số bán trong app phải qua hệ thống thanh toán của Apple/Google, phí 15-30%, gần như chắc chắn không được thu bằng VietQR — chưa kiểm quy định cụ thể) và rủi ro Apple từ chối app "chỉ là trang web bọc lại". Nghe qua micro (đã làm, xem Giai đoạn D) gỡ rộng hơn mà vẫn ở trên web — chỉ bàn lại nếu đo thật cho thấy micro không đủ chuẩn |
| **Bảo người học iPhone cài một trình duyệt riêng có Web MIDI** | Có vài app như vậy trên App Store nhưng chưa kiểm app nào còn chạy tốt; và bắt người mới cài thêm một app lạ là thêm một chỗ để họ bỏ cuộc |
| **Đổi tên gói theo kiểu "Journey 1-4" cho marketing** | Không sai, nhưng là việc trang trí. Để sau khi có trang bán hàng thật |

## 9. Điều kiện xem lại tài liệu này

- Sau khi **bán được đơn hàng đầu tiên cho người lạ** — cập nhật lại mục 1.
- Sau khi có **20-30 người học thật** và biết T3→T4 — cập nhật mục 3, và nếu tỷ lệ dưới
  50% thì viết lại cả mục 7.
- Khi **Giai đoạn 2 hoàn thiện** — xem lại giá và mục 5.
- Khi **Web MIDI chạy ổn định** — mở mục 5 lớp Recurring và mục 8 dòng đầu tiên.
- Nếu xuất hiện **đối thủ tiếng Việt trực tiếp** — xem lại toàn bộ.

---

## Lịch sử cập nhật

> Mỗi lần sửa file thì **thêm một dòng mới lên đầu bảng**, không sửa dòng cũ. Cột
> *Tiêu đề commit* phải chép **y hệt** tiêu đề commit để tìm lại được bằng
> `git log --grep="<tiêu đề>"` hoặc gõ thẳng vào ô tìm kiếm của Fork.

| Ngày | Tiêu đề commit | Cập nhật gì |
|---|---|---|
| 11/09/2026 | `feat: Nghe tiếng đàn qua micro để tập với đàn trên mọi điện thoại` | Thêm vào Giai đoạn D mục nghe tiếng đàn qua micro — ban đầu ghi là hướng cần thử, cùng ngày chủ sản phẩm chốt làm luôn nên ghi thành đã làm, kèm số đo trên tiếng tổng hợp, giới hạn đã biết, và thứ tự đo trên máy thật vì chưa có con số nào từ điện thoại đặt cạnh đàn thật. Micro là đường duy nhất tìm được để iPhone/iPad và đàn cơ cũng tập với đàn được mà vẫn ở trên web. Thêm vào mục 8 hai lối đã cân nhắc cho iPhone (app bọc web, trình duyệt riêng) và vì sao xếp sau micro |
| 11/09/2026 | `docs: Chốt điện thoại và tablet là thiết bị chính của người học` | Thêm vào Giai đoạn D việc phải đo tỷ lệ người học dùng iOS trước khi đầu tư vào lớp MIDI — người học chủ yếu tập bằng điện thoại, mà iPhone/iPad không có Web MIDI, nên điểm khác biệt này có thể chỉ tới được một phần người học |
| 28/08/2026 | `fix: Tắt nhiễu NOTICE của script baseline và cập nhật bảng trạng thái` | Bảng mục 1 vẫn ghi "Chưa có" cho trang mua và khoá nội dung dù cả hai đã chạy từ lâu — kiểm lại trong mã rồi sửa, và tách ra dòng riêng cho thứ thật sự còn thiếu là trang bán hàng cho người lạ |
| 27/08/2026 | `docs: Thêm dự phóng 7 năm và chuyển sang ghi lịch sử cập nhật cộng dồn` | Trỏ sang bản mở rộng 7 năm `du-phong-7-nam.md` |
| 26/08/2026 | `docs(internal): Thêm lộ trình phát triển và mô hình doanh thu` | Tạo file — phễu T1-T7, ba kịch bản doanh thu, mô hình sản phẩm bốn lớp, lộ trình A-E có cổng quyết định |
