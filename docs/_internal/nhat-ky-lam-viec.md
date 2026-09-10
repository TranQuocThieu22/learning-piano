# Nhật ký làm việc

> **Đây là chỗ ghi *hôm nay đã xảy ra gì*.** Mỗi ngày làm việc thêm một khối lên **đầu**
> danh sách, mới nhất nằm trên.
>
> **Vì sao cần:** `git log` kể được code đã đổi gì, nhưng phần lớn việc của dự án này
> xảy ra **ngoài repo** — đăng bài, gửi link form, có người nhắn hỏi, một người bỏ giữa
> chừng. Không ghi lại thì sau một tuần nghỉ chỉ còn cảm giác mơ hồ là "hình như đã làm
> gì đó". Đây cũng là file trả lời được câu *"tuần trước tôi dừng ở đâu"* mà mục "Còn
> treo" không trả lời được, vì mục đó chỉ ghi việc chưa làm chứ không ghi việc đã làm.
>
> **Không phải chỗ để:**
>
> - Danh sách việc phải làm → mục 7 của [`lam-viec-hang-ngay.md`](lam-viec-hang-ngay.md)
> - Quyết định và lý do → [`nhat-ky-quyet-dinh.md`](nhat-ky-quyet-dinh.md)
> - Số liệu beta chính thức → [`ke-hoach-beta.md`](ke-hoach-beta.md), đo bằng
>   `beta-metrics.mjs`
>
> Khi một dòng quan sát ở đây lớn thành quyết định, **chép nó sang `nhat-ky-quyet-dinh.md`**
> rồi để nguyên dòng cũ tại chỗ — nhật ký không sửa lại quá khứ.
>
> **File này cố ý không có mục "Lịch sử cập nhật".** Cả file đã là lịch sử rồi; thêm một
> bảng lịch sử nữa là ghi hai lần cùng một thứ. Đừng "sửa" cho giống các file khác.

**Khuôn một khối** — ba mục, cố ý ít để còn viết nổi mỗi ngày. Mục nào trống thì bỏ hẳn,
đừng để dòng rỗng:

```markdown
## dd/mm/yyyy — nhãn ngắn

**Đã làm**
- ...

**Quan sát**
- ...

**Tiếp theo**
- ...
```

---

## 10/09/2026 — Gỡ rào cản trước cửa

**Đã làm**

- **Trang lộ trình có hình.** Đây là chỗ người từ Facebook đáp xuống đầu tiên, nhưng
  trước hôm nay nó chỉ là một danh sách mười một chương toàn chữ. Thêm bản đồ hành
  trình dạng SVG (chương thành vòng tròn, Trạm dừng chân thành ngôi sao, hai giai đoạn
  thành hai vùng màu, Chương 8-10 vẽ nét đứt vì đang soạn), mục "Buổi tập đầu tiên bạn
  chơi được gì?" nhúng bản nhạc thật của Bài tập 1B bằng `{{sheet:}}` để khách nghe thử
  ngay câu mở đầu Ode to Joy, và ảnh thế tay Đô sẵn có của Chương 1. Ba Trạm dừng chân
  đổi từ danh sách sang bảng có cột "Bạn chơi được gì".
- **Thêm trang `07-doc-them/chon-dan-dau-tien.md`.** Điều kiện tham gia beta là "có đàn
  thật", nhưng chỗ duy nhất nói về chuyện mua đàn lại là một khối nhỏ trong Chương 1 và
  chỉ nêu mỗi cây tầm 15-20 triệu — với người đang cân nhắc bắt đầu thì đó là cánh cửa
  đóng. Trang mới mở bằng câu "dưới 3 triệu là đi trọn được Giai đoạn 1 và 2", dựa trên
  nhóm đàn gấp gọn 88 phím quanh 2-4 triệu.
- **Ghi lại hai ràng buộc phần cứng trước nay chưa tài liệu nào ghi:** đàn bắt buộc phải
  có **phím cảm ứng lực** (Chương 5 dạy chơi to nhỏ) và **cổng cắm pedal** (Chương 9 là
  cả một chương về pedal). Cả hai đều hay bị cắt ở đàn giá thấp và người mua lần đầu
  không biết mà hỏi. Đã bổ sung vào khối gợi ý ở Chương 1 và dẫn sang trang mới; khối
  mời beta ở trang lộ trình cũng thêm link.
- **Đăng bài vào nhóm tự học piano đầu tiên — đang chờ admin duyệt.** Đây mới là kênh
  tuyển thật; Trang Facebook chỉ là chỗ người ta kiểm tra mình là ai sau khi thấy bài ở
  nơi khác. Bài chưa được duyệt thì chưa đếm được gì, kể cả lượt xem.
- **Gom bảy mẫu comment thành `mau-comment-tuyen-beta.md`.** Soạn lại mỗi lần thì mỗi
  lần một giọng, và dễ trượt về kiểu comment chỉ có lời mời. File chốt luôn sáu nguyên
  tắc để không bị gỡ, trong đó có ranh giới vừa chốt hôm nay: comment **không nêu mình
  là tác giả**, nhưng cũng **không dựng lên một người học không có thật** để khen giáo
  trình — không nói ra thì là im lặng, bịa ra một người học thì là chuyện khác hẳn.
- **Comment vào 3 bài trong nhóm, có dán link, chưa ai trả lời.** Làm trong lúc chờ bài
  đăng được duyệt. Chưa comment nào bị gỡ. Đây là lượt tiếp xúc đầu tiên với người lạ
  không đi qua bài đăng của mình, và vì có dán link nên từ giờ mọi lượt truy cập lạ
  trên Analytics đều có một đường để quy về — trước hôm nay thì không.

**Quan sát**

- Rào cản "có đàn" là thứ dễ bỏ quên nhất khi tuyển beta: mọi tài liệu đều viết cho
  người **đã có** đàn, nên người chưa có đọc xong không biết đi tiếp bằng đường nào.
  Hai thay đổi hôm nay đều nhắm vào cùng một chỗ — mấy phút đầu tiên của người lạ.
- Giá đàn ghi theo khoảng và nói rõ phải kiểm lại; đàn thương hiệu lớn chỉ nêu theo
  series chứ không ghim model, vì số hiệu đổi hàng năm. Lần sau sửa trang này thì giữ
  nguyên lối viết đó.

**Tiếp theo**

- Các việc chốt hôm 09/09 vẫn còn nguyên: **đăng vào 4-6 nhóm tự học piano** (kênh tuyển
  thật, rải ra vài ngày), **chốt chặn 1 khoảng 23/09**, và khi có người đầu tiên đăng
  nhập thì cấp gói kèm ghi chú **`beta dot 1`**.
- **Trong lúc chờ duyệt thì đi bằng comment, không đi bằng bài đăng.** Trả lời thật vào
  các bài người ta đang hỏi (mua đàn, bắt đầu từ đâu, hai tay không phối hợp được) rồi
  mới nhắc tới giáo trình ở dòng cuối. Bài chỉ có mỗi lời mời thì bị xoá, còn một câu
  trả lời có ích thì admin không có cớ gỡ. Đừng dán cùng một đoạn ở nhiều bài.
- **Sau 1-2 ngày mở lại đúng 3 bài đã comment, và kiểm cả hộp tin nhắn chờ.** Người mới
  thường ngại hỏi công khai mà nhắn riêng, nên tin nhắn chờ (message request) là chỗ dễ
  bỏ sót nhất. Không ai trả lời trong vài ngày thì vấn đề nằm ở chỗ chọn bài để comment,
  không phải ở lời văn — comment dưới bài đã cũ thì gần như không ai đọc.

## 09/09/2026 — Ngày 0 của beta

**Đã làm**

- **Mở beta.** Cổng chặn đã dựng sẵn từ `fb5ea72` (01/09): `SELLING_ENABLED` để trống nên
  `/checkout` trả 404, màn hình bài khoá không nhắc tới giá, Chương 1 mở cho mọi người.
  Hôm nay là ngày bắt đầu tính mốc.
- **Đăng bài đầu tiên trên Facebook.**
- **Đổi tên miền production sang `pianojourney.rehover.io`.** Tên miền cũ
  `piano.rehover.io` vẫn trả 308 về địa chỉ mới nên link đã phát ra không chết.
  Đã thêm redirect URI của tên miền mới ở Google Cloud Console và kiểm bằng cách
  gọi thẳng `/api/auth/signin/google`: app sinh đúng `redirect_uri` mới, Google
  nhận và trả về trang nhập email chứ không phải `redirect_uri_mismatch`.
  Phép thử này không cần tài khoản thật nên lần sau đổi tên miền cứ dùng lại.
- **Gắn Vercel Web Analytics.** Trước đó không đo gì cả, nên câu "bao nhiêu người vào
  trang" không có số để trả lời. Chọn cái này thay vì Google Analytics vì nó không đặt
  cookie, đỡ phải dựng banner xin đồng ý cho một trang đang có hai chục người.
- Dọn 7 phiên chat cũ và rút toàn bộ lịch sử ra thành `nhat-ky-quyet-dinh.md`, chốt quy
  ước chia phiên ở mục 9 của `quy-trinh-lam-viec.md`.

**Quan sát**

- **Chưa có ai điền form.** Ở ngày 0 thì đây **chưa phải tín hiệu về sản phẩm** — chưa
  đủ người nhìn thấy để kết luận bất cứ điều gì. Con số cần theo dõi lúc này là *bao
  nhiêu người đã thấy bài*, không phải *bao nhiêu người đăng ký*.
- Trang Facebook chưa có người theo dõi, nên bài đăng trên trang gần như chỉ mình đọc.
  Kế hoạch beta đã lường trước: trang là chỗ để người ta **kiểm tra mình là ai** sau khi
  thấy bài ở nơi khác, không phải kênh tuyển.

**Tiếp theo**

- **Đăng vào các nhóm tự học piano** — đây mới là kênh tuyển thật. Kế hoạch chốt 4-6
  nhóm, rải ra vài ngày chứ đừng dán cùng lúc. Đọc luật nhóm trước, hoặc nhắn admin xin
  phép; bài chỉ có mỗi lời mời thì bị xoá.
- Mốc gần nhất: **chốt chặn 1 vào khoảng 23/09** (cuối tuần 2 kể từ ngày 0). Con số
  quyết định là tỷ lệ đi hết Chương 1, và nó chỉ tính trên người đã đủ 14 ngày kể từ bài
  đầu tiên của chính họ.
- Khi có người đầu tiên đăng nhập: vào `/admin`, cấp gói kèm ghi chú **`beta dot 1`** —
  gõ sai là người đó biến mất khỏi thống kê.
