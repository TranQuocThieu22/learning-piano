# Tổng quan dự án Piano Journey

> **Mục đích của file này:** một trang duy nhất mô tả toàn cảnh sản phẩm, đủ để bàn
> chuyện lộ trình, nội dung hay kinh doanh mà không cần mở cả repo. Khi cần hỏi
> Claude (hoặc bất kỳ ai) một câu bên lề, thả đúng file này vào là đủ ngữ cảnh.
>
> File nằm ở gốc `docs/`, **không hiển thị trên web** — `contentDirs` trong
> `src/lib/markdown.ts` chỉ nhận `01-roadmap`, `02-chapters`, `03-exercises`,
> `07-doc-them`.
>
> **Cập nhật lần cuối:** 26/08/2026

---

## 1. Sản phẩm là gì

Giáo trình piano **tiếng Việt cho người mới từ số 0**, dạng web app, kèm công cụ hỗ
trợ luyện tập. Người học đọc bài trên web, tập trên **đàn phím thật** của mình, rồi
tick bài đã xong vào nhật ký.

**Là:** lộ trình có thứ tự và có điểm dừng, dạy kỹ thuật vật lý trên đàn thật, giải
thích *vì sao* chứ không chỉ *làm gì*.

**Không là:** kho bài hát, app game hóa, hay công cụ thay thế cây đàn.

**Ba khoảng trống sản phẩm nhắm vào** (đầy đủ ở `docs/_internal/dinh-huong-kinh-doanh.md`
mục 0):

| Cách học phổ biến | Thiếu cái gì |
|---|---|
| App chấm điểm tự động | Ép theo bản nhạc đang chạy; sai mà không hiểu vì sao |
| Khóa video online | Không có lộ trình, không biết mình đang ở đâu |
| Gia sư | Đắt và ràng buộc lịch |

**Điều kiện người học:** có đàn phím tối thiểu 61 phím, ưu tiên phím nặng
(weighted). Mỗi ngày 30-45 phút.

---

## 2. Lộ trình và trạng thái

Giáo trình chia làm **4 giai đoạn**; Giai đoạn 1 đã xong, Giai đoạn 2 đang soạn dở.

**Giai đoạn 1 — Nền tảng (~60 ngày).** Xác định nốt trên đàn, hiểu nhịp phách, điều
khiển ngón độc lập.

| Chương | Nội dung | Số bài | Trạng thái |
|---|---|---|---|
| 0 | Vì sao bạn muốn chơi piano — bài đọc tạo động lực, không có bài tập; lịch sử piano tách sang trang *Đọc thêm* | 0 | ✅ Xong |
| 1 | 5 nốt đầu tiên C-D-E-F-G, độc lập ngón | 2 | ✅ Xong |
| 2 | Trường độ (đen/trắng/tròn), phối hợp 2 tay | 3 | ✅ Xong |
| 3 | Đọc khuông nhạc, khóa Sol + khóa Pha, Grand Staff, nhịp 3/4, **Trạm dừng chân 1** | 6 | ✅ Xong |
| 4 | Phím đen, dấu thăng/giáng/bình, nửa cung - nguyên cung, Blues | 3 | ✅ Xong |
| 5 | Legato, staccato, cường độ (dynamics) | 3 | ✅ Xong |
| 6 | Ba nốt mới La-Si-Đô cao, luồn ngón cái, vắt ngón, thang âm Đô trưởng, **Trạm dừng chân 2** | 4 | ✅ Xong |

Tổng hiện có: **25 bài tick được**, trải 7 chương — Giai đoạn 1 xong, Giai đoạn 2 đã bắt đầu.

**Giai đoạn 2 — Ứng dụng và đệm hát.** Đích đến: **tự đệm được một bài hát hoàn
chỉnh** — điều kiện để gói "Nền tảng" trọn vẹn. Khung 4 chương đã chốt trong roadmap:

| Chương | Nội dung | Số bài | Trạng thái |
|---|---|---|---|
| 7 | Hợp âm ba nốt, C-F-G, Trưởng/Thứ, đổi hợp âm, đệm Ode to Joy | 4 | ✅ Xong |
| 8 | Mẫu đệm tay trái: hợp âm chập, hợp âm rải, mẫu cho 4/4 và 3/4 | 0 | ⬜ Chưa soạn |
| 9 | Pedal vang âm — đạp và nhả đúng thời điểm | 0 | ⬜ Chưa soạn |
| 10 | Đệm trọn một bài hát + **Trạm dừng chân 3** | 0 | ⬜ Chưa soạn |

**Giai đoạn 3 và 4** (Nâng cao, Cảm âm & Ứng tấu) — chưa soạn, và là **sản phẩm bán
riêng**, không gộp vào gói Giai đoạn 1-2.

**Trạm dừng chân (Recital).** Sau mỗi cụm chương có một bài Tổng ôn: không dạy kỹ
năng mới, chỉ chơi trọn 2-3 bản nhạc hoàn chỉnh. Trạm 1 sau Chương 3 (Jingle Bells,
Ode to Joy, Waltz nhỏ); Trạm 2 khép lại Giai đoạn 1 ở cuối Chương 6 (Twinkle Twinkle,
thang âm Đô trưởng hai tay, Waltz nhỏ số 2).

---

## 3. Quy ước soạn bài (bắt buộc)

Chi tiết đầy đủ ở `.claude/skills/daily-practice-structure/SKILL.md`. Bản rút gọn:

- **Tên file:** `docs/03-exercises/chuong-XX-bai-YY.md`. App parse bằng regex
  `/^chuong-(\d+)-bai-(\d+)$/` trong `src/lib/lessons.ts` — sai mẫu là bài **biến mất
  khỏi trang Nhật ký** và không tick được. Áp cho cả bài Tổng ôn.
- **Tiêu đề H1:** đúng khuôn `# Chương [X] - Bài [Y]: [Chủ đề]`.
- **Bố cục một buổi tập 30-45 phút:** ① bài tập không cần đàn (bắt buộc có gõ mặt
  bàn + 1 phương pháp tùy chọn) → ② khởi động & ôn bài cũ 5-10 phút → ③ kỹ năng mới
  15-20 phút, **tối thiểu 3-4 bài tập ABC khác nhau** → ④ thực hành tự do + **thẩm âm
  (bắt buộc)**.
- **Giới hạn nốt:** không bao giờ dùng nốt chưa dạy. **Chương 1-5** giới hạn ở thế tay
  5 ngón: tay phải C-D-E-F-G khóa Sol, tay trái C-D-E-F-G khóa Pha thấp hơn một quãng
  tám — nên **"Twinkle Twinkle" và "Happy Birthday" không dùng được** (cần nốt La), còn
  Jingle Bells, Ode to Joy, Mary Had a Little Lamb, Hot Cross Buns thì được. **Từ Chương
  6** (luồn ngón cái / vắt ngón) nới ra trọn quãng tám Đô-Đô ở cả hai tay, và Twinkle
  Twinkle chính là bài thưởng của Trạm dừng chân 2. **Từ Chương 7** tay trái bấm hợp âm
  nên với lên tới nốt Mi trên Đô giữa. `scripts/check-lessons.mjs` tự chọn tầm nốt theo
  số chương trong tên file — sửa tầm ở ba hằng số `RANGE_*` đầu file.
- **Bản nhạc viết bằng ABC notation**, render bằng abcjs. Mỗi ô nhịp phải cộng đủ
  phách; Grand Staff hai bè phải bằng số ô nhịp. Tiêu đề `T:` / `C:` viết **tiếng Việt
  có dấu**.
- **Ước lượng số ngày:** mỗi bài mới phải nói rõ cần tập bao nhiêu ngày — một con số
  cụ thể, không phải khoảng.
- **Kiểm tra:** chạy `pnpm check:lessons` sau khi soạn bài. Script dùng chính parser
  abcjs của app, bắt lỗi ô nhịp lệch, nốt ngoài thế tay, tên file/tiêu đề sai mẫu, và
  tiếng Việt mất dấu.

---

## 4. Ứng dụng web

**Stack:** Next.js 16 (App Router) + React 19, Mantine 9, TypeScript, abcjs 6 để vẽ và
phát bản nhạc, Auth.js v5 (đăng nhập Google) + Drizzle ORM trên Postgres (Neon),
Vitest. Deploy trên Vercel.

**Nội dung là file Markdown trong `docs/`**, đọc thẳng từ đĩa lúc render — không có
CMS, không có bảng bài học trong database.

**Các trang:**

| Đường dẫn | Chức năng |
|---|---|
| `/` | Chuyển hướng sang `/01-roadmap/roadmap` |
| `/[category]/[slug]` | Trang đọc bài (Lộ trình / Lý thuyết / Bài tập / Đọc thêm) |
| `/nhat-ky` | Nhật ký học tập — tick bài đã xong, lưu theo tài khoản Google |
| `/luyen-nhip` | Máy đánh nhịp, người học tự bật và tự chỉnh tốc độ |
| `/luyen-nhan-not` | Bài luyện nhận nốt trên khuông nhạc (chuột hoặc đàn MIDI) |
| `/admin`, `/admin/thanh-toan` | Quản trị người học và đối soát thanh toán |

**Tính năng đáng chú ý:**

- **Phát nhạc mẫu:** mọi khối ABC trong bài đều bấm nghe được, đúng nhịp và tốc độ ghi
  trên bài.
- **Web MIDI:** cắm đàn qua USB MIDI thì app nghe được nốt bạn bấm. Đã dùng cho bài
  luyện nhận nốt và cho `ScorePractice` (đánh xong → so với bản nhạc → tô màu chỗ sai).
  Chỉ chạy trên Chrome/Edge; Safari chưa hỗ trợ Web MIDI.
- **Tiến độ:** một dòng trong bảng `lesson_completion` cho mỗi cặp (người học, bài).

**Thanh toán:** đã có phần backend — bảng `payment_order` / `payment_received` /
`entitlement`, sinh mã VietQR, webhook SePay chống trùng, trang admin đối soát, và
script cấp quyền tay (`scripts/grant-access.mjs`). **Chưa có** trang mua cho người học
và **chưa khóa nội dung** theo gói.

---

## 5. Những quyết định đã chốt

Bốn ràng buộc dưới đây không phải sở thích — mỗi cái có lý do cụ thể, đừng đề xuất
ngược lại nếu chưa đọc lý do.

**Không làm piano ảo bấm chuột / chạm màn hình.**
Giáo trình dạy thứ nằm ở *cơ thể* — form tay, độc lập ngón, sức nặng cánh tay — mà
màn hình phẳng không rèn được. Tệ hơn, nó tạo cảm giác sai về tiến bộ và ăn mất thời
gian lẽ ra ngồi trước đàn. Hai hướng thay thế được chấp nhận: **bài luyện nhận nốt**
và **Web MIDI với đàn thật**. (`docs/07-doc-them/khong-lam-piano-ao.md`)

**Không ép chơi theo bản nhạc chạy trực tiếp.**
Đây là lý do chính khiến người mới bỏ cuộc với app chấm điểm tự động: nhịp độ do máy
áp đặt. Người học tự quyết khi nào bắt đầu, dừng, tập lại đoạn nào, ở tốc độ nào.
*Được phép:* phát nhạc mẫu để nghe, máy đánh nhịp tự bật tự chỉnh, chấm điểm kiểu đánh
xong rồi xem lại. *Không được phép:* bản nhạc tự trôi, nốt rơi kiểu game, chấm đúng/sai
thời gian thực. Áp cho cả Web MIDI sau này.

**Không nêu đích danh tên app hay khóa học của đối thủ** — ở tài liệu, web, trang bán
hàng, quảng cáo. Luôn mô tả theo *cách làm* ("app chấm điểm tự động"), không theo tên
thương hiệu. Lý do pháp lý ở mục 0 tài liệu nội bộ.

**Không dùng tệp để theo dõi tiến độ.** Tiến độ ghi bằng cách tick bài ở `/nhat-ky`,
lưu vào database. Thư mục `docs/05-learning-logs` và quy trình nộp video đã gỡ, đừng
tạo lại.

---

## 6. Kinh doanh (tóm tắt)

Hai tài liệu nội bộ, **không đưa lên web** — đọc trước khi đụng tới giá, gói bán, phân
quyền hay thanh toán:

- `docs/_internal/dinh-huong-kinh-doanh.md` — bán cái gì, giá bao nhiêu, vì sao.
- `docs/_internal/lo-trinh-phat-trien.md` — làm theo thứ tự nào, đo bằng gì, khi nào
  được bước tiếp. Có định nghĩa phễu T1-T7, ba kịch bản doanh thu, mô hình sản phẩm
  bốn lớp (Free → Core → MIDI → Recurring) và danh sách việc đã cân nhắc rồi tạm gác.

- **Mô hình:** freemium + **mua đứt**, không thuê bao (nội dung hữu hạn nên thuê bao
  đằng nào cũng dở).
- **Paywall đặt ở cuối Chương 1** — đủ lâu để người học thấy giá trị, chưa cho đi quá
  nhiều.
- **Gói duy nhất đang có:** *Nền tảng* — Giai đoạn 1 + 2, **399.000đ**, chưa mở bán
  (`src/lib/packages.ts`; sửa giá thì sửa cả tài liệu nội bộ).
- **Chỉ số quyết định:** trong 20-30 người học thật đầu tiên, **bao nhiêu người đi hết
  Chương 1**. Dưới một nửa nghĩa là vấn đề ở sản phẩm, chưa nên tiêu tiền quảng cáo.
- **Tuyệt đối không:** bịa "giá gốc" gạch ngang hay đếm ngược giả lập (Nghị định
  81/2018, sửa bởi 128/2024); chạy thương mại trên Vercel Hobby; hứa cập nhật miễn phí
  trọn đời cho nội dung chưa tồn tại.

---

## 7. Việc tiếp theo, theo thứ tự ưu tiên

> Bản đầy đủ có cổng quyết định từng giai đoạn nằm ở mục 7 của
> `docs/_internal/lo-trinh-phat-trien.md`. Bản rút gọn:

1. ~~Hoàn thiện Chương 5 và 6~~ — **xong**, Giai đoạn 1 đủ 6 chương.
2. **Đưa 20-30 người học thật vào phần miễn phí (Chương 0-1) và đo** bao nhiêu người đi
   hết Chương 1. Chưa cần bán gì: hai chương đó vốn miễn phí theo thiết kế paywall. Dưới
   50% thì quay lại sửa Chương 1, **không soạn thêm chương mới**.
3. **Soạn nốt Giai đoạn 2 (Chương 8, 9, 10)** + dựng trang mua, khóa nội dung, hoàn tiền,
   Vercel Pro. Gói "Nền tảng" chỉ trọn vẹn khi người học **tự đệm được một bài hát**.
4. **8-10 bài SEO** trả lời câu hỏi người mới, mỗi bài dẫn vào Chương 1 — nguồn khách rẻ
   và tích lũy theo năm.
5. Video ngắn quay tay cho các bài kỹ thuật (quay khi nội dung đã ổn định).
6. **Web MIDI chấm điểm** — thứ duy nhất không sao chép được (nội dung chữ thì chụp màn
   hình là hết).

Chỉ mở bán sau bước 3. Gói tháng và AI coach chỉ bàn lại khi Web MIDI chạy ổn định.

---

## 8. Bản đồ thư mục

```
docs/
  OVERVIEW.md              ← file này (không lên web)
  01-roadmap/              Lộ trình + phương pháp luyện tập
  02-chapters/             Lý thuyết từng chương (chuong-XX.md)
  03-exercises/            Bài tập tick được (chuong-XX-bai-YY.md)
  07-doc-them/             Bài bên lề không bắt buộc: lịch sử piano, vì sao không có piano ảo (lên web)
  _internal/               Định hướng kinh doanh, lộ trình phát triển, biến môi trường (KHÔNG lên web)
public/images/             MỘT THƯ MỤC CHO MỖI TRANG, tên trùng slug của trang đó
  chuong-00/               Ảnh của docs/02-chapters/chuong-00.md
  chuong-01/  chuong-02/  chuong-04/
  phuong-phap-luyen-tap/   Ảnh của docs/01-roadmap/phuong-phap-luyen-tap.md
  lich-su-piano/           Ảnh của docs/07-doc-them/lich-su-piano.md
                           (ảnh dùng ở nhiều trang thì tạo thêm chung/)
src/
  app/                     Trang Next.js
  components/              AbcjsViewer, Metronome, NoteRecognitionDrill, ScorePractice...
  lib/                     markdown, lessons, progress, payment/, admin/
  db/schema.ts             Auth.js + lesson_completion + 3 bảng thanh toán
scripts/check-lessons.mjs  Kiểm tra toàn bộ giáo trình bằng parser abcjs
AGENTS.md                  Ràng buộc bắt buộc cho AI agent làm việc trên repo
```

---

## 9. Khi nào cập nhật file này

- Soạn xong một chương hoặc một bài mới → sửa bảng ở mục 2.
- Thêm/bỏ một trang hoặc tính năng trên app → sửa mục 4.
- Chốt một quyết định sản phẩm mới → thêm vào mục 5 kèm **lý do**.
- Đổi giá, đổi gói, đổi vị trí paywall → sửa mục 6 (và tài liệu nội bộ).
