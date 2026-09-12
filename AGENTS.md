<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Quyết định sản phẩm đã chốt

**Trước khi đề xuất đổi hướng gì lớn, đọc `docs/_internal/nhat-ky-quyet-dinh.md`** — nó ghi các câu đã hỏi và đã chốt kèm *lý do*, dựng lại từ lịch sử phiên làm việc. Mục 1 là bảng "đừng hỏi lại": app mobile, backend riêng, thuê bao tháng, bỏ beta, chuyển hết sang video — đều đã có kết luận và lý do.

**Thư mục `docs/09-cap-nhat/` là mục "Có gì mới"** — các bài kể cho người học biết web vừa
đổi gì, hiện ở `/updates`, ở màn hình chủ và cuối trang `/library`. Ba điều phải giữ:

- **Tên file mở đầu bằng ngày**: `2026-09-12-luyen-nhan-not-tu-chon.md`. Ngày lấy từ chính
  tên file, sai mẫu thì bài **im lặng biến mất** khỏi trang chứ không báo lỗi.
- **Viết cho người học, kể bằng việc họ làm được** — không nhắc tên file, không nhắc commit,
  không "phiên bản 2.0". Cùng văn phong với `07-doc-them/`.
- **Đọc tách khỏi `markdown.ts`** (qua `src/lib/updates.ts`, cùng lối với `internal-docs.ts`).
  Đừng thêm `09-cap-nhat` vào `contentDirs`: bài cập nhật không phải bài học, slug của chúng
  mở đầu bằng ngày nên mọi chỗ đang suy số chương từ slug sẽ hiểu sai.

Viết xong một bài ở đây thì rút thành bài Facebook theo mẫu ở
`docs/_internal/bai-dang-facebook.md` — bản trên web là bản gốc, Facebook là bản rút gọn
dẫn về nó.

Đọc `docs/07-doc-them/` trước khi đề xuất tính năng mới. Thư mục này **hiển thị trên web** (mục "Đọc thêm" trong trang `/library`) nên hãy viết cho người học đọc, không viết theo văn phong tài liệu kỹ thuật nội bộ. Đây cũng là chỗ chứa các bài bên lề không nằm trong lộ trình tập — ví dụ lịch sử piano (`lich-su-piano.md`) đã được tách khỏi Chương 0. Các quyết định đã chốt:

- **Không làm piano ảo bấm chuột/chạm màn hình** — xem `docs/07-doc-them/khong-lam-piano-ao.md`. Lý do ngắn gọn: giáo trình dạy kỹ thuật vật lý (form tay, độc lập ngón, lực đánh) mà bàn phím ảo không rèn được, lại tạo cảm giác sai về tiến bộ và cạnh tranh thời gian với cây đàn thật người học đang có. Thứ thay thế được chấp nhận là **app nghe chính cây đàn thật** — qua **micro** (mặc định, chạy trên mọi máy) hoặc **dây MIDI** — trong bài luyện nhận nốt và phần *Tập bài này với đàn*. Mã nghe qua micro nằm ở `src/lib/mic-*.ts`; chỉnh con số nào ở đó thì phải chạy lại `mic-accuracy.test.ts`, vì nó là thứ duy nhất đo độ chính xác trên nhiều câu nhạc chứ không phải vài ca chọn sẵn.
- **Không ép người học chơi theo bản nhạc chạy trực tiếp** — đây là lý do chính khiến người mới bỏ cuộc với các app chấm điểm tự động (xem mục 0 trong `docs/_internal/dinh-huong-kinh-doanh.md`). Người học tự quyết khi nào bắt đầu, dừng, tập lại đoạn nào, ở tốc độ nào. **Được phép:** phát nhạc mẫu để nghe, máy đánh nhịp do người học tự bật và tự chỉnh, chấm điểm kiểu đánh xong rồi xem lại, và **phản hồi tức thời từng nốt trong lúc đánh** — tô xanh chỗ đúng, nháy đỏ chỗ đang chờ khi bấm trượt (`src/lib/score-follow.ts`). **Không được phép:** bản nhạc tự trôi bắt phải theo kịp, nốt rơi kiểu game, chấm đúng/sai thời gian thực gây áp lực. Ràng buộc này áp y nguyên cho cả micro lẫn Web MIDI.

  Ranh giới giữa hai vế nằm ở **áp lực**, không nằm ở chuyện tức thời hay không — phản hồi ngay thì người học biết mình đang ở đâu, đó là dạy chứ không phải chấm. Bốn điều giữ cho nó không thành áp lực, sửa gì thì đừng phá:

  1. **Con trỏ chỉ nhích khi người học bấm phím.** Không đếm giờ, không tự chạy, dừng bao lâu cũng được.
  2. **Tín hiệu sai nháy rồi tắt hẳn, không để lại vết.** Đánh trượt không lùi con trỏ, không xoá màu xanh đã có, không trừ gì cả.
  3. **Không có bảng tỉ số chạy trong lúc đánh.** `FollowState.misses` cố ý không hiện lên màn hình: một cái nháy là báo hiệu, một con số cứ tăng trước mắt là áp lực. Phần thống kê đầy đủ chỉ xuất hiện sau khi bấm dừng.
  4. **Đi tuần tự từng nốt, tuyệt đối không nhảy cóc — và không đoán hộ người học.** Con trỏ chỉ nhích khi bấm đúng chỗ đang chờ; bấm nhầm nốt nào, kể cả nốt có thật ở phía sau, thì chỉ nháy đỏ. Đã có một bản "nhìn trước" để tự bắt lại nhịp khi người học bỏ sót nốt, và nó sai ngay khi dùng thật: bấm nhầm một phím rồi bấm lại chính nó là con trỏ nhảy qua mấy nốt chưa ai đánh. Đường ra khi kẹt là **nút *Bỏ qua nốt này*** — người học tự quyết, máy không quyết hộ.
- **Không nêu đích danh tên app hay khóa học của đối thủ** ở bất cứ đâu — tài liệu, nội dung web, trang bán hàng, quảng cáo. Luôn mô tả theo cách làm ("app chấm điểm tự động"), không theo tên thương hiệu. Lý do pháp lý ghi ở mục 0 trong `docs/_internal/dinh-huong-kinh-doanh.md`.
- **Không dùng tệp để theo dõi tiến độ** — tiến độ được ghi bằng cách tick bài trên trang `/nhat-ky`, lưu vào database theo tài khoản Google. Thư mục `docs/05-learning-logs` và quy trình nộp video đã được gỡ bỏ, đừng tạo lại.
- **Điện thoại và tablet là thiết bị chính, máy tính là phụ.** Người học tập bằng cách đặt máy lên giá nhạc của cây đàn; laptop không có chỗ đặt trên đàn nên gần như không ai mở nó lúc tập. Vẫn là **web cài ra màn hình chính**, không làm app trên store — câu đó đã chốt ở mục 1 của `docs/_internal/nhat-ky-quyet-dinh.md`, hướng di động nói về màn hình chứ không mở lại chuyện kênh phân phối. Làm gì cũng giữ bốn điều:

  1. **Kiểm trên khung điện thoại trước**, cả dọc lẫn xoay ngang (xoay ngang chỉ còn khoảng 360px chiều cao). Máy tính kiểm sau, để chắc là không vỡ.
  2. **Hai tư thế cầm máy, thiết kế cho cả hai.** Đọc bài lúc rảnh thì cầm một tay, ngón cái bấm. Lúc tập thì máy nằm trên giá nhạc cách mắt nửa sải tay, hai tay đang ở trên phím đàn — bản nhạc phải đọc được từ khoảng cách đó, nút phải to và ít bước, không bắt gõ chữ.
  3. **Chữ cho người học không giả định máy tính** — không viết "trên máy tính", "bấm chuột", "cắm vào máy tính" như thể đó là cách duy nhất.
  4. **Web MIDI chạy trên Android (Chrome, Edge, cần cáp OTG) và máy tính, không chạy trên iPhone/iPad** — mọi trình duyệt trên iOS đều dùng WebKit, mà WebKit không có Web MIDI. Vì vậy **micro là cách nối mặc định**, MIDI đứng thứ hai. Tính năng nghe đàn nào cũng phải có cả hai đường, và không bài học nào được bắt buộc phải cho app nghe đàn.

# Định hướng kinh doanh

Trước khi đụng tới bất cứ thứ gì liên quan tới giá, gói bán, phân quyền hay thanh toán, **đọc `docs/_internal/dinh-huong-kinh-doanh.md`**.

Thư mục `_internal` **không hiển thị cho người học** (nằm ngoài `contentDirs` trong `src/lib/markdown.ts`), nhưng **quản trị viên đọc được ở `/admin/docs`** — dựng từ `src/lib/internal-docs.ts`, một đường đọc tách hẳn khỏi `markdown.ts`. Đừng thêm `_internal` vào `contentDirs` và đừng đưa nội dung của nó ra giao diện người học.

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


# Quy ước viết mã

**Trước khi viết một hàm mới hay sửa bất cứ file nào trong `src/`, đọc
`.claude/skills/code-standards/SKILL.md`.** Nó có bảng tra "cần gì thì đã có sẵn ở
đâu", sáu quy tắc kèm chỗ từng quy tắc đã cứu repo này, và danh sách những chỗ
**đừng** refactor. Ba điều hay bị vi phạm nhất:

- **Chép một khuôn sang chỗ mới là cách repo này sinh lỗi nhiều nhất.** Kho nhớ
  lựa chọn từng có bốn bản sao, câu hỏi "phím đen hay phím trắng" từng có ba cái
  tên. Cần nhớ lựa chọn thì dùng `createLocalStore` (`src/lib/local-store.ts`);
  cần tính trên số MIDI thì dùng `src/lib/pitch.ts`. Tách xong chỉ để lại **một
  cửa** — đừng re-export cho tiện.
- **Phần tính toán tách khỏi phần chạm trình duyệt.** Vitest chạy ở `environment:
  'node'` nên `src/lib/` không được chạm `window`; thứ gì thuộc về trình duyệt thì
  nhận qua tham số để test thay được (xem `StoreHost`).
- **Mở rộng bằng cách thêm một dòng vào bảng dữ liệu**, không phải thêm một nhánh
  `if`: `EAR_PRESETS`, `DRILL_PRESETS`, `PIECES`, `INSTRUMENTS`, `KEY_SIGNATURES`.

# Quy trình làm việc

**Đọc `docs/_internal/quy-trinh-lam-viec.md`** trước khi commit hoặc đổi cấu trúc bảng. Cần bản rút gọn để mở ra lúc đang làm thì dùng `docs/_internal/lam-viec-hang-ngay.md` — nó chỉ trả lời *làm gì tiếp*, còn *vì sao* vẫn nằm ở file đầy đủ. Ba điều hay bị vi phạm nhất:

- **Mặc định không tự chạy `git commit`, `git push`, `git reset`** — chỉ in commit message ra khối mã để người dùng dán vào Fork. **Ngoại lệ duy nhất: người dùng nói "commit luôn"**, khi đó tự chạy trọn `git add` / `commit` / `push`, nhưng phải đọc hết `git diff` (kể cả thay đổi của phiên khác) và chạy đủ **năm lệnh kiểm** trước, trong đó có `npx next build` — xem `.claude/skills/git-commit-messages/SKILL.md`. Bốn lệnh kia không dựng bản production, mà đó mới là thứ Vercel chạy: build đỏ thì người học vẫn thấy bản cũ và không ai được báo gì (bẫy 19). Repo đẩy thẳng `main` và Vercel deploy production ngay sau đó; CI ở `.github/workflows/ci.yml` là lưới thứ hai nhưng nó báo **sau** khi commit đã vào lịch sử.
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
- `docs/_internal/ban-quyen-bai-hat.md`
- `docs/_internal/bay-ky-thuat.md`
- `docs/_internal/ke-hoach-beta.md`
- `docs/_internal/quy-trinh-lam-viec.md`
- `docs/_internal/lam-viec-hang-ngay.md`
- `docs/_internal/nhat-ky-quyet-dinh.md`
- `docs/_internal/bai-dang-facebook.md`

Ghi **tiêu đề commit** chứ không ghi mã commit, vì tiêu đề đã biết ngay lúc soạn thay đổi (mã thì chỉ có sau khi commit, dẫn tới phải quay lại điền sau và thường bị quên). Tìm lại commit bằng `git log --grep="<tiêu đề>"` hoặc gõ thẳng tiêu đề vào ô tìm kiếm của Fork. Đổi tiêu đề commit lúc commit thì phải sửa lại dòng vừa ghi cho khớp.
