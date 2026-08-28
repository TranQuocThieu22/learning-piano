<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Quyết định sản phẩm đã chốt

Đọc `docs/07-doc-them/` trước khi đề xuất tính năng mới. Thư mục này **hiển thị trên web** (mục "Đọc thêm" ở cuối sidebar) nên hãy viết cho người học đọc, không viết theo văn phong tài liệu kỹ thuật nội bộ. Đây cũng là chỗ chứa các bài bên lề không nằm trong lộ trình tập — ví dụ lịch sử piano (`lich-su-piano.md`) đã được tách khỏi Chương 0. Các quyết định đã chốt:

- **Không làm piano ảo bấm chuột/chạm màn hình** — xem `docs/07-doc-them/khong-lam-piano-ao.md`. Lý do ngắn gọn: giáo trình dạy kỹ thuật vật lý (form tay, độc lập ngón, lực đánh) mà bàn phím ảo không rèn được, lại tạo cảm giác sai về tiến bộ và cạnh tranh thời gian với cây đàn thật người học đang có. Hai hướng thay thế được chấp nhận là **bài luyện nhận nốt** và **kết nối Web MIDI với đàn thật**.
- **Không ép người học chơi theo bản nhạc chạy trực tiếp** — đây là lý do chính khiến người mới bỏ cuộc với các app chấm điểm tự động (xem mục 0 trong `docs/_internal/dinh-huong-kinh-doanh.md`). Người học tự quyết khi nào bắt đầu, dừng, tập lại đoạn nào, ở tốc độ nào. **Được phép:** phát nhạc mẫu để nghe, máy đánh nhịp do người học tự bật và tự chỉnh, chấm điểm kiểu đánh xong rồi xem lại, và **phản hồi tức thời từng nốt trong lúc đánh** — tô xanh chỗ đúng, nháy đỏ chỗ đang chờ khi bấm trượt (`src/lib/score-follow.ts`). **Không được phép:** bản nhạc tự trôi bắt phải theo kịp, nốt rơi kiểu game, chấm đúng/sai thời gian thực gây áp lực. Ràng buộc này áp cho cả Web MIDI sau này.

  Ranh giới giữa hai vế nằm ở **áp lực**, không nằm ở chuyện tức thời hay không — phản hồi ngay thì người học biết mình đang ở đâu, đó là dạy chứ không phải chấm. Ba điều giữ cho nó không thành áp lực, sửa gì thì đừng phá:

  1. **Con trỏ chỉ nhích khi người học bấm phím.** Không đếm giờ, không tự chạy, dừng bao lâu cũng được.
  2. **Tín hiệu sai nháy rồi tắt hẳn, không để lại vết.** Đánh trượt không lùi con trỏ, không xoá màu xanh đã có, không trừ gì cả.
  3. **Không có bảng tỉ số chạy trong lúc đánh.** `FollowState.misses` cố ý không hiện lên màn hình: một cái nháy là báo hiệu, một con số cứ tăng trước mắt là áp lực. Phần thống kê đầy đủ chỉ xuất hiện sau khi bấm dừng.
- **Không nêu đích danh tên app hay khóa học của đối thủ** ở bất cứ đâu — tài liệu, nội dung web, trang bán hàng, quảng cáo. Luôn mô tả theo cách làm ("app chấm điểm tự động"), không theo tên thương hiệu. Lý do pháp lý ghi ở mục 0 trong `docs/_internal/dinh-huong-kinh-doanh.md`.
- **Không dùng tệp để theo dõi tiến độ** — tiến độ được ghi bằng cách tick bài trên trang `/nhat-ky`, lưu vào database theo tài khoản Google. Thư mục `docs/05-learning-logs` và quy trình nộp video đã được gỡ bỏ, đừng tạo lại.

# Định hướng kinh doanh

Trước khi đụng tới bất cứ thứ gì liên quan tới giá, gói bán, phân quyền hay thanh toán, **đọc `docs/_internal/dinh-huong-kinh-doanh.md`**.

Thư mục `_internal` **không hiển thị trên web** (nằm ngoài `contentDirs` trong `src/lib/markdown.ts`) — đây là tài liệu nội bộ, đừng đưa nội dung của nó ra giao diện người học.

Vài ràng buộc tuyệt đối, vi phạm là gây hậu quả thật:

- **Không bịa "giá gốc" gạch ngang** cho mức giá chưa từng bán, và **không dùng đồng hồ đếm ngược giả lập**. Khuyến mại ở Việt Nam chịu điều chỉnh của Nghị định 81/2018 (sửa đổi bởi 128/2024); bịa giá gốc là quảng cáo sai sự thật, có thể bị phạt và đình chỉ tên miền.
- **Không chạy thương mại trên gói Vercel Hobby** — gói miễn phí cấm dùng thương mại, tài khoản bị đình chỉ đồng nghĩa khách đã trả tiền mất quyền truy cập.
- **Không hứa cập nhật miễn phí trọn đời** cho nội dung chưa tồn tại. Giai đoạn 3 và 4 là **sản phẩm riêng**, không gộp vào gói Giai đoạn 1-2, và chỉ được quảng bá khi đã soạn xong.

# Bẫy kỹ thuật đã biết

**Trước khi dò một lỗi lạ, đọc `docs/_internal/bay-ky-thuat.md`** — ghi theo lối *triệu chứng → nguyên nhân → cách sửa*, vì lúc gặp lại thì thứ bạn có trong tay là triệu chứng. Bốn cái hay tái phát nhất:

- **Component ghép của Mantine (`Table.Tbody`, `List.Item`) dùng trong Server Component trả `undefined`**, trang 500 với thông báo "Element type is invalid" không chỉ ra file nào. Phải bọc vào client component — xem `AdminPaymentTables.tsx`.
- **`\s` trong template literal bị nuốt dấu gạch chéo**: `` `^##\s+` `` thành `^##s+`. Dùng `String.raw`.
- **Đếm số test là chưa đủ, phải đọc dòng `Test Files`** — một file test không nạp được sẽ làm test trong đó biến mất khỏi tổng số chứ không bị tính là trượt.
- **File có `import 'server-only'` thì vitest không nạp được**, kể cả gián tiếp. Tách đôi như `env-schema.ts` / `env.ts`, hoặc cho hàm nhận cấu hình qua tham số.

# Quy ước đặt đường dẫn

**Mọi đường dẫn tự viết trong `src/app/` phải bằng tiếng Anh, chữ thường, nối bằng dấu gạch ngang.** Áp cho cả tên tham số truy vấn và giá trị của nó.

| Đúng | Sai |
|---|---|
| `/journal` | `/nhat-ky` |
| `/checkout`, `/checkout/[orderId]` | `/mua` |
| `/metronome` | `/luyen-nhip` |
| `/note-trainer` | `/luyen-nhan-not` |
| `/admin/payments` | `/admin/thanh-toan` |
| `?error=not-signed-in` | `?loi=chua-dang-nhap` |

Lý do: đường dẫn là mã, không phải nội dung. Trộn hai ngôn ngữ khiến `grep` một tính năng phải nhớ nó được đặt tên ở thời kỳ nào, và dấu tiếng Việt bị mã hoá phần trăm trong URL thì đọc log gần như không ra.

**Ngoại lệ có chủ ý — hai thứ sau vẫn tiếng Việt, đừng đổi:**

- **Slug bài học** (`chuong-01-bai-01`) và **thư mục nội dung** (`03-exercises`, `07-doc-them`). Slug được lưu trong cột `lesson_completion.lesson_slug`, nên đổi tên là mất tiến độ đã tick của người học nếu không chuyển dữ liệu kèm theo. Chúng cũng bị ràng bởi regex ở `src/lib/lessons.ts`, `scripts/check-lessons.mjs` và mọi chỉ thị `{{sheet:}}`.
- **Chữ hiển thị cho người học** luôn là tiếng Việt có dấu. Quy định này chỉ nói về đường dẫn.


# Quy trình làm việc

**Đọc `docs/_internal/quy-trinh-lam-viec.md`** trước khi commit hoặc đổi cấu trúc bảng. Ba điều hay bị vi phạm nhất:

- **Không tự chạy `git commit`, `git push`, `git reset`.** Chỉ in nội dung commit message ra khối mã để người dùng dán vào Fork — xem `.claude/skills/git-commit-messages/SKILL.md`. Repo commit thẳng vào `main` nên lần đọc diff của người làm là lưới đỡ duy nhất.
- **Chốt tiêu đề commit TRƯỚC khi ghi dòng lịch sử cập nhật**, vì bảng đó chép y hệt tiêu đề. Đổi tiêu đề lúc commit thì phải quay lại sửa dòng đã ghi.
- **Đổi cấu trúc bảng phải qua migration có file.** `pnpm db:generate` sinh file `.sql` trong `drizzle/` — đọc file đó rồi commit kèm; Vercel chạy `drizzle-kit migrate` lúc build nên production tự cập nhật. Không còn `db:push`. Trong suốt beta **chỉ được THÊM** cột/bảng/index, không xoá, không đổi tên, không đổi kiểu.

# Quy ước tài liệu

**Mọi tài liệu trong `docs/` có mục "Lịch sử cập nhật" thì phải ghi thêm dòng mới, không được ghi đè.** Không dùng dòng "Cập nhật lần cuối" nữa — nó chỉ giữ được trạng thái mới nhất và xóa mất bối cảnh vì sao một quyết định bị sửa.

Mỗi lần sửa một trong các file dưới đây, **thêm một dòng lên đầu bảng** ở mục "Lịch sử cập nhật" cuối file, gồm ba cột: ngày (`dd/mm/yyyy`), **tiêu đề commit chép y hệt**, và nội dung thay đổi viết theo *vì sao* chứ không chỉ *cái gì*:

- `docs/OVERVIEW.md`
- `docs/_internal/dinh-huong-kinh-doanh.md`
- `docs/_internal/lo-trinh-phat-trien.md`
- `docs/_internal/du-phong-7-nam.md`
- `docs/_internal/bien-moi-truong.md`
- `docs/_internal/bay-ky-thuat.md`
- `docs/_internal/ke-hoach-beta.md`
- `docs/_internal/quy-trinh-lam-viec.md`

Ghi **tiêu đề commit** chứ không ghi mã commit, vì tiêu đề đã biết ngay lúc soạn thay đổi (mã thì chỉ có sau khi commit, dẫn tới phải quay lại điền sau và thường bị quên). Tìm lại commit bằng `git log --grep="<tiêu đề>"` hoặc gõ thẳng tiêu đề vào ô tìm kiếm của Fork. Đổi tiêu đề commit lúc commit thì phải sửa lại dòng vừa ghi cho khớp.
