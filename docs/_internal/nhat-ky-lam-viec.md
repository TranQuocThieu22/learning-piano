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

## 09/09/2026 — Ngày 0 của beta

**Đã làm**

- **Mở beta.** Cổng chặn đã dựng sẵn từ `fb5ea72` (01/09): `SELLING_ENABLED` để trống nên
  `/checkout` trả 404, màn hình bài khoá không nhắc tới giá, Chương 1 mở cho mọi người.
  Hôm nay là ngày bắt đầu tính mốc.
- **Đăng bài đầu tiên trên Facebook.**
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
