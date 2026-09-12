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
| Nhạc nền: tải nhạc miễn phí về hay tự sinh? | **Tự sinh bằng Web Audio.** Vui nhộn, **mặc định BẬT**, chỉ tắt khi có tiếng khác | Sản phẩm có bán, mà nhạc "miễn phí" trên mạng gần như luôn kèm điều kiện (ghi công, cấm dùng thương mại) — sai một cái là phải gỡ cả bản đã phát hành. Tự sinh thì không có ai để xin phép, không phải tải 2-4MB trên 4G, và sửa được ngay bằng một con số. **Sửa 11/09/2026:** bản đầu mặc định TẮT và tắt ở mọi trang bài học, nhưng chủ sản phẩm chốt lại là mở app ra phải có nhạc cho có hứng, và đọc lý thuyết thì vẫn nên có — nên đổi thành mặc định bật, và chuyển luật tắt sang theo sự kiện (nghe bản nhạc mẫu, mở phần tập với đàn). Ràng buộc "người học tự quyết" của `AGENTS.md` vẫn nguyên giá trị cho phần TẬP; nhạc nền tắt bằng một cú gạt và app nhớ. **Bổ sung 11/09/2026: ba bài thay vì một** (Nắng sớm / Chiều êm / Bước nhẹ), người học tự chọn trên thẻ ở màn hình chủ, mặc định vẫn là bài sáng cũ. Cả ba đều ở **Đô trưởng** — đây là ràng buộc của giáo trình chứ không phải thiếu ý tưởng: Chương 1 dạy đúng năm nốt Đô-Rê-Mi-Pha-Sol, nhạc nền lạc giọng sẽ nghịch tai với chính thứ người học đang bấm, nên ba bài khác nhau ở vòng hợp âm, tốc độ, mật độ nốt và tầm cao thấp chứ không ở giọng. Bài chậm (Chiều êm, 88 nhịp/phút) KHÔNG phải quay lại bản thiền hồi đầu vốn bị bỏ vì ru ngủ: nó vẫn có tiếng gảy và vẫn nghe ra ô nhịp, và nó chỉ kêu khi người học tự chọn |
| Giữ thanh tiêu đề của app không? | **Không.** Bỏ nốt, chỉ còn thanh tab dưới đáy | Sau khi bỏ thanh bên, thanh tiêu đề chỉ còn ba nút mà cả ba đều thỉnh thoảng mới dùng: đăng nhập (một lần rồi thôi), đổi nền (vài tháng một lần), quay lại (đã có cử chỉ vuốt của máy và nút *Bài trước* cuối bài). Một dải cố định suốt buổi tập cho ba nút đó là không đáng. Đăng nhập và đổi nền dời vào thẻ tài khoản cuối màn hình chủ |
| Giữ thanh bên (AppShell) hay bỏ để giống app điện thoại? | **Bỏ hẳn.** Thanh tab dưới đáy + `/library` + `/exercises` | Thanh bên nằm sau nút hamburger ở góc trên bên trái — góc xa ngón cái nhất khi cầm máy một tay — mà lại là đường duy nhất đi bất cứ đâu. Nó còn kéo theo cả chùm việc phải bù cho `offset: false` (hiệu ứng headroom, ba lớp CSS cộng tay chiều cao thanh tiêu đề). Điều kiện để bỏ được: mục lục phải có nhà mới, nếu không thì tám chương lý thuyết mất đường tới |
| App cài ngoài màn hình chính nên chạy `standalone` hay `fullscreen`? | **`fullscreen`.** Ẩn luôn thanh trạng thái | Chiều cao là thứ khan hiếm nhất lúc tập: điện thoại xoay ngang chỉ còn khoảng 360px, một dòng khuông nhạc đã ăn gần hết, thanh trạng thái lấy thêm 24-30px nữa. Đổi lại là không còn thấy đồng hồ ở bất cứ trang nào — đã cân nhắc và chấp nhận. Kéo theo: `InstallPrompt` phải hỏi cả ba kiểu hiển thị, vì `display-mode` chỉ khớp đúng kiểu đang chạy nên app đã cài sẽ tự mời cài lại chính nó. Bổ sung 10/09: thêm lớp thứ hai `FullscreenOnFirstTap.tsx` gọi Fullscreen API ở lần chạm đầu, vì lớp manifest chỉ ăn với máy cài LẠI sau khi đổi — máy cài từ trước vẫn chạy `standalone` và vẫn thấy thanh trạng thái. **Đã thử rồi BỎ, 11/09/2026:** có làm bản chỉ ẩn khi máy xoay NGANG, trả lại thanh điều hướng (nút back, nút home) lúc xoay dọc — dựng xong, test xanh, rồi chủ sản phẩm bảo để như cũ. Lý do bỏ: web **không tách được** thanh điều hướng khỏi thanh trạng thái — `standalone` là hiện cả hai, Fullscreen API là ẩn cả hai, không có API nào ẩn riêng một cái. Nên muốn giữ nút back lúc xoay dọc thì phải chịu thấy lại đồng hồ, mà cái giá đó không đáng. Kèm theo là hai chỗ khó chịu: xoay máy không được tính là cử chỉ người dùng nên vào toàn màn hình phải chờ người học chạm thêm một cái, và `display-mode: fullscreen` khớp theo cả toàn màn hình do API (ghi thành bẫy 21 lúc đó, nay bẫy 21 đã là chuyện khác). **Đừng đề xuất lại nếu ràng buộc của web chưa đổi** |
| Lý thuyết, bài tập và nhật ký để ba trang riêng hay gom một chỗ? | **Gom thành một Đường đi theo chương.** Mỗi chương là một trang: lý thuyết đứng đầu, rồi từng bài tập, tick ngay tại chỗ. Thanh tab còn bốn mục | Chủ sản phẩm mô tả đúng cái phiền: *"phải qua lý thuyết rồi chọn đúng bài tập rồi qua nhật ký nhớ bài nào vừa học rồi check"*. Ba chỗ hỏng cùng lúc: (1) lý thuyết và bài tập là hai chuỗi rời nên *Bài tiếp theo* cuối lý thuyết Chương 3 nhảy thẳng sang lý thuyết Chương 4, bỏ qua cả sáu bài tập — thứ nối hai bên chỉ là một dòng chữ viết tay trong nội dung; (2) `/exercises` và `/journal` vẽ CÙNG một danh sách bài theo hai kiểu, người học phải nhớ trang nào làm việc gì; (3) cả hai đều bỏ sót phần lý thuyết. **Lật lại quyết định 10/09** ghi trong mã `/exercises`: *"Hai việc khác nhau nên để hai trang, gộp lại thì trang nào cũng làm nửa vời"* — lập luận đó đúng khi nhìn từng trang, nhưng sai khi nhìn cả buổi học của người thật. Kéo theo: lý thuyết thành bước **tick được** (tổng bước 25 → 33, chỉ THÊM dòng vào database, không xoá gì); `/exercises` và `/journal` chuyển hướng về `/path` chứ không xoá, vì chúng nằm trong lịch sử trình duyệt của người đang học và trong hai bài giáo trình. *Mục lục* ở lại vì còn Lộ trình và Đọc thêm — những bài không nằm trên đường đi, không có thứ tự, không tick được |
| Có chỗ cho người học thử các bài hát nổi tiếng họ thích không? | **Có — `Góc bài hát` (`/songs`), miễn phí, không tick, không chấm.** Nhưng CHỈ nhạc đã hết hạn bảo hộ bản quyền | Chủ sản phẩm xin một chỗ để thử những bài quen tai, ví dụ *Đông Miên*. Bài đó (司南, 2019) còn trong thời hạn bảo hộ; soạn và phát hành bản nhạc của nó trong một sản phẩm **có bán** là nhân bản tác phẩm được bảo hộ, ở Việt Nam cần giấy phép (VCPMC quản lý tập thể quyền tác giả âm nhạc). Đây là đường dự án đã giữ từ đầu: nhạc nền tự sinh bằng Web Audio *chính vì* bản quyền, một ảnh anime đã bị gỡ vì bản quyền, và cả giáo trình chỉ dùng nhạc hết hạn bảo hộ (Ode to Joy 40 lần, Twinkle 22, Jingle Bells 15, Mary Had a Little Lamb 5, Für Elise 1) — không một bài nào còn bản quyền. Nên dựng **khung** dùng được cho cả hai loại, nạp trước ba bài hết hạn bảo hộ, và mỗi file bắt buộc khai trường `nguon` ghi vì sao bài đó được phép có mặt — có test gác, thêm bài mà bỏ trống là đỏ. Muốn có nhạc đang thịnh hành thì **mua giấy phép trước rồi ghi số giấy phép vào `nguon`**. Để MIỄN PHÍ cho mọi người: người chưa mua mà đánh được một câu quen tai là lý do quay lại tốt hơn mọi lời quảng cáo. Không tick, không đếm tiến độ — đây là chỗ chơi, biến nó thành danh sách phải hoàn thành là phá ràng buộc "không tạo áp lực" của `AGENTS.md` |
| Thiết kế cho máy tính hay cho điện thoại? | **Điện thoại và tablet là chính**, máy tính là phụ. Vẫn là web, không làm app trên store | Người học đặt máy lên giá nhạc của đàn; laptop không có chỗ đặt trên đàn nên không ai mở nó lúc tập. Đợt dựng lại điều hướng 10-11/09 đã đi theo hướng này nhưng chưa ghi thành nguyên tắc, nên chữ cũ sót lại: app và bài tuyển beta vẫn ghi Web MIDI "chỉ chạy trên máy tính", trong khi chủ sản phẩm dùng nó trên điện thoại Android hằng ngày. Chốt thành văn 11/09/2026, bốn hệ quả ghi ở `AGENTS.md`. Không mâu thuẫn với dòng đầu bảng: "di động" ở đây là cỡ màn hình, không phải kênh phân phối |
| Người học dùng iPhone thì app nghe đàn bằng gì? | **Micro, ngay trên web.** Là cách mặc định; dây MIDI đứng thứ hai | iPhone/iPad không có Web MIDI. Micro chạy trên mọi máy, cả đàn cơ không có cổng cắm, không cần mua cáp — khớp với việc người học đặt điện thoại trên giá nhạc. Đã cân nhắc và xếp sau: app bọc web lên App Store (vướng thanh toán qua store, rủi ro bị từ chối) và bảo người học cài trình duyệt riêng (thêm một chỗ để bỏ cuộc) — xem mục 8 của `lo-trinh-phat-trien.md`. Buổi sáng 11/09 mới ghi là hướng cần thử; cùng ngày chủ sản phẩm chốt làm luôn và làm đầy đủ. Hai giới hạn đã chấp nhận và nói rõ với người học: phòng ồn thì nghe nhầm nhiều hơn, hai tay cách nhau đúng một quãng tám thì không tách được |
| Bài luyện nhận nốt: cho chọn giọng rồi giữ nguyên, hay đổi mỗi câu? | **Đổi ngẫu nhiên mỗi câu**, không có ô chọn giọng cố định. Tắt công tắc thì câu nào cũng Đô trưởng | Bản đầu làm đúng kiểu ô chọn: bảy giọng, chọn một rồi giữ nguyên cả buổi. Chủ sản phẩm bác ngay trong vòng vài phút — *"hoá biểu phải ngẫu nhiên mỗi lần qua nốt chứ không phải cho chọn cố định"* — và lý do đứng vững: **chọn cố định thì sau vài câu người học thuộc lòng "đang Sol trưởng" rồi thôi không nhìn đầu khuông nữa**, mà nhìn hoá biểu rồi nhớ nó mới đúng là kỹ năng cần rèn; mở một bản nhạc lạ thì giọng gì cũng phải tự đọc ra. Kéo theo về mã: hoá biểu đi theo TỪNG CÂU (`DrillQuestion.key`) chứ không theo buổi tập, nên chỗ vẽ và chỗ chấm không thể lệch giọng nhau; kho nốt phải dựng lại theo từng giọng lúc bốc câu vì cách viết mỗi nốt phụ thuộc giọng (trong Sol trưởng, Pha thăng là nốt trơn của giọng còn Pha thường mới là nốt phải ghi dấu bình). Tên giọng chỉ hiện SAU khi trả lời đúng — hiện lúc đang hỏi là làm hộ đúng phần cần rèn |
| Bài luyện nhận nốt: hỏi một nốt hay cả một ô nhịp? | **Cho chọn cả hai.** Thêm ô *Mỗi câu dài bao nhiêu*: `1 nhịp` (như cũ) hoặc `Khuông nhạc 4/4` — bốn **nốt đen đều nhau**, đọc lần lượt trái sang phải | Đọc được một nốt lẻ và đọc được một câu nhạc là hai kỹ năng khác nhau: mở bản nhạc thật ra thì mắt phải **đi tới**, và phải nhớ hoá biểu suốt cả ô chứ không chỉ cho một nốt. **Vì sao bốn nốt đen đều nhau chứ không trộn trắng/đen/móc:** bài này cố ý KHÔNG đo thời gian (luật chống áp lực ở `AGENTS.md`), nên hình nốt vẽ ra đẹp nhưng app không kiểm được người học có giữ đúng trường độ không — nó ngầm hứa một thứ không có thật, mà học tiết tấu thì đã có máy đánh nhịp và bài trong giáo trình. **Ranh giới phải giữ:** trong MỘT phách là bấm cùng lúc (nốt nào trước cũng được), giữa các phách là lần lượt — trộn hai tầng là thành nhảy cóc. Con trỏ chỉ nhích khi bấm đúng phách đang chờ; bấm trúng một nốt có thật ở phách sau vẫn là trượt. Kéo theo về mã: `DrillQuestion.parts` thành `beats: DrillPart[][]`, và `answerQuestion` thành `answerBeat` nhận thẳng một phách — nhận cả câu thì không có cách nào chặn nhảy cóc |
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

### 10–11/09 — sửa chế độ tập trung, dựng lại điều hướng, thêm nhạc nền

Hai ngày làm gọn về một hướng: **app dùng được bằng một tay trên điện thoại**. Bắt đầu
từ một lỗi người dùng báo, kết thúc ở chỗ bỏ hẳn hai lớp khung giao diện.

**Chế độ tập trung không thoát ra được** (`fix: Bấm được nút Thoát của chế độ tập trung`).
Hiệu ứng nhấc khối mã lên khi rê chuột đặt `transform`, mà `transform` khác `none` tạo
khối chứa cho con dùng `position: fixed` — lớp phủ neo vào khối mã thay vì khung nhìn, nút
*Thoát* trôi ra ngoài màn hình. Cùng họ với bẫy `backdrop-filter` đã sửa hôm trước, nên
ghi thành bẫy 16. Ngay sau đó là lỗi thứ hai của cùng chế độ đó
(`fix: Cuộn tới cuối và luôn thấy nút Thoát trong chế độ tập trung`): con của flexbox bị
bóp nên `scrollHeight` nói dối, cuộn hết cỡ vẫn không thấy phần bị cắt — bẫy 17.

**Ẩn thanh trạng thái** (`feat: Ẩn thanh trạng thái khi mở app từ màn hình chính`, rồi
`refactor: Bỏ nốt thanh tiêu đề, app chạy toàn màn hình`). Hai lớp: manifest khai
`display: 'fullscreen'`, và Fullscreen API gọi ở cú chạm đầu tiên để phủ nốt máy đã cài
app từ trước. Lớp manifest chỉ ăn với máy **cài lại**, chỗ này dễ tưởng là không chạy.

**Dựng lại điều hướng** — ba bước, mỗi bước do người dùng chốt sau khi xem bản trước:

1. `feat: Thêm màn hình chủ, thanh tab và bản đồ chặng cho điện thoại` — `/` không còn
   chuyển hướng, thêm `/exercises` và nút *Bài trước / Bài tiếp theo* cuối mỗi bài.
2. `refactor: Bỏ AppShell, thay bằng thanh tab và trang mục lục` — bỏ thanh bên và nút
   hamburger, mục lục dời sang `/library` và `/exercises`. Trừ 270 dòng.
3. `refactor: Bỏ nốt thanh tiêu đề` — còn đúng một thanh cố định là thanh tab dưới đáy.

Điều kiện để bỏ được thanh bên: **mục lục phải có nhà mới trước**. Bỏ trước thì tám chương
lý thuyết mất đường tới.

**Nhạc nền** (`feat: Thêm nhạc nền tự sinh, mặc định tắt` → `feat: Nhạc nền vui hơn, mặc
định bật, chỉ tắt khi có tiếng khác` → `fix: Nhạc nền chạy liền mạch khi chuyển trang`).
Tự sinh bằng Web Audio thay vì tải nhạc về — lý do bản quyền đứng trước lý do kỹ thuật,
xem bảng mục 1. Bản đầu êm kiểu thiền, người dùng thấy ru ngủ nên đổi sang vòng I–V–vi–IV
có rải nốt. Mặc định chuyển từ tắt sang bật theo yêu cầu, và luật tắt chuyển từ
theo-đường-dẫn sang **theo sự kiện** để đọc lý thuyết vẫn có nhạc.

Lần sửa cuối lòi ra một lỗi đang chạy trên production: **hai bộ phát cùng kêu**, lệnh tắt
chỉ tắt được một — bẫy 18. Đáng nhớ ở chỗ mã nhìn đâu cũng đúng, và phép đo đầu tiên còn
báo "đã im" vì máy đo bám nhầm bộ nén của bộ phát đã tắt.

**Cách làm việc hai ngày này:** mọi thay đổi giao diện đều mở trình duyệt thật đo lại
(Playwright ở 390x780 và 1280x800), mọi thay đổi âm thanh đều gắn máy phân tích vào chuỗi
Web Audio rồi đọc số. Ba lần suýt kết luận sai chỉ vì phép đo — đo sai còn tệ hơn không đo,
vì nó cho một con số trông như bằng chứng.

### 12/09 — bài luyện nhận nốt, sáu vòng sửa theo người dùng trong một ngày

Cả ngày làm đúng một trang: `/note-trainer`. Không vòng nào xuất phát từ kế hoạch có sẵn —
mỗi vòng bắt đầu bằng một câu ngắn của chủ sản phẩm sau khi xem bản trước.

1. **Chọn quãng bằng nút bấm, hình đàn chỉ bôi vùng.** Bản trước bắt chạm thẳng vào hình
   bàn phím 88 phím để chọn; trên Android, chạm vào SVG có chữ làm **kính lúp chọn chữ** nhảy
   ra che nửa màn hình (bẫy 26). Bài học lớn hơn cái bẫy: hình vẽ hợp với việc **hiện trạng
   thái**, không hợp với việc nhận lệnh.
2. **Mỗi câu một nốt, hai nốt hai khuông, hay lúc một lúc hai.**
3. **Chồng nốt như hợp âm**, tối đa bốn nốt mỗi khuông, luôn nằm trong tầm một bàn tay và
   không có hai nốt cách nhau nửa cung.
4. **Neo khuông nhạc đứng yên** (bẫy 27) — trước đó khuông trôi lên xuống theo cao độ nốt vì
   abcjs vẽ ảnh cao vừa đúng nội dung.
5. **Dấu hoá chuyển lên hoá biểu đầu khuông** như bản nhạc thật.
6. **Hoá biểu đổi ngẫu nhiên mỗi câu** thay cho ô chọn giọng — xem dòng tương ứng ở bảng
   mục 1, đây là quyết định đáng nhớ nhất của ngày.

**Hai lỗi vẽ do chính bản sửa ở bước 4 gây ra, và cả hai đều lọt qua năm lệnh kiểm.** abcjs
cài tuỳ chọn `scale` bằng chính `style.transform` của thẻ SVG, nên phép dịch ảnh ghi đè lên
đã **xoá tỉ lệ và cho production chạy bản nhạc bé một nửa** (bẫy 28); nó còn bọc ảnh trong
một `div` có sẵn `overflow: hidden` cao đúng bằng ảnh chưa dịch, nên khuông Pha **mất ba
dòng kẻ dưới cùng** (bẫy 29). Cả hai đều không có lỗi nào báo ra, và DOM thì nói mọi thứ
đều đúng chỗ. Thứ bắt được chúng là đo trên trình duyệt thật: bề rộng nét vẽ cho cái thứ
nhất, đếm dòng kẻ trên ảnh chụp cho cái thứ hai. Từ nay đụng vào chỗ vẽ bản nhạc thì đo cả
ba số: vị trí dòng kẻ, chiều cao khung, bề rộng nét vẽ.

**Cách làm việc:** mỗi vòng đều dựng bản production rồi mở bằng trình duyệt thật ở khung
điện thoại 390x844 và khung xoay ngang 780x360, đo bằng số chứ không nhìn ảnh chụp. Hai lỗi
trên là bằng chứng vì sao: nhìn một ảnh chụp riêng lẻ thì cả hai đều trông bình thường.

---

### 12/09 — thêm chế độ đọc cả ô nhịp 4/4

Cùng ngày, sau đợt sáu vòng sửa ở trên. Chủ sản phẩm xin thêm *"option 1 nhịp hoặc khuông
nhạc 4/4"*, và câu hỏi thật sự phải chốt là **tiết tấu**: vẽ bốn nốt đen đều nhau, hay trộn
nốt trắng với nốt móc cho giống bản nhạc thật? Chốt bốn nốt đen — lý do đầy đủ ở mục 1.

Ba thứ kéo theo mà lúc bắt đầu chưa thấy:

- **Khuông nhạc phải thu nhỏ lại.** Một nốt lẻ thì ảnh cố ý vẽ rộng hơn khung, hai mép bị
  cắt toàn khoảng trắng, đổi lại nốt to. Ô nhịp thì cắt mép là **mất nốt thứ tư**, mà mất
  nốt thì không có lỗi nào báo ra. Nên `anchorTransform` nay ép được cả bề ngang, và
  `staff-anchor.ts` giữ luôn tỉ lệ lẫn khung cho từng chế độ để hai thứ không lệch nhau.
- **abcjs ghi đè `width` lên chính thẻ chứa.** Đo `clientWidth` sau khi vẽ là đo lại chính
  cái ảnh, nên phép ép bề ngang luôn ra tỉ lệ 1 và ô nhịp vẫn tràn — im lặng, không lỗi.
  Phải xoá `style.width` trước khi đo. Cùng họ với cái bẫy `overflow: hidden` đã ghi trước đó.
- **Con trỏ tô màu đi bằng `noteTimings` của abcjs**, không tự đếm thẻ trong DOM: khuông đôi
  vẽ xong bè trên mới tới bè dưới nên thứ tự DOM không phải thứ tự phách. Số sự kiện không
  khớp số phách thì không tô gì cả — thà không tô còn hơn tô nhầm sang nốt chưa ai đánh tới.

### 12/09 — khuông nhạc to hết cỡ, và chế độ tập trung

Chủ sản phẩm gửi ảnh chụp màn hình: ô nhịp chỉ chiếm quá nửa khung giấy nhạc, chữ nhạc
bé. Yêu cầu là *"cho khuông nhạc to hết ngang đi hoặc làm chế độ tập trung"* — làm cả hai.

Ba điều đáng nhớ hơn cả bản thân tính năng:

- **Triệu chứng "nhạc không đầy khung" dẫn thẳng vào một hướng sai.** Phản xạ đầu tiên là
  đi tìm tuỳ chọn kéo giãn của abcjs. Đo riêng abcjs ngoài app mới lộ ra là nó **đã** kéo
  giãn sẵn, và thủ phạm là tuỳ chọn `scale` mình đang truyền vào (bẫy 31). Bài học: khi số
  đo trong app khác số đo ngoài app, thủ phạm nằm ở thứ mình truyền vào, không nằm ở thư viện.
- **Chế độ tập trung KHÔNG được phép làm bản nhạc nhỏ đi.** Bản đầu chia chiều cao bằng
  flex và cho khung co lại; điện thoại xoay ngang chỉ còn 360px nên khung bị bóp xuống hơn
  trăm px — bật tập trung lên lại thấy nhỏ hơn lúc không bật. Nay khung có sàn bằng đúng
  chiều cao thường và **màn hình thấp thì cuộn**, chứ bản nhạc không bé đi.
- **Ghim hàng nút xuống ĐÁY, không ghim nút Thoát lên đỉnh.** Khác chế độ tập trung của bản
  nhạc bài học, ở đây thứ bấm đi bấm lại là *Bỏ qua nốt này* chứ không phải *Thoát* — mà lúc
  đang tập thì hai tay ở trên phím đàn, thứ phải với tới mà không cuộn phải là thứ hay dùng.
  Nút Thoát đứng ngay cạnh nên được luôn cả hai.

Đã thử rồi bỏ: xếp hai cột lúc xoay ngang (bản nhạc bên trái, phản hồi và nút bên phải).
Dựng xong, đo ra khuông nhạc **hẹp hơn** cả lúc không tập trung vì cột phải ăn mất một
phần tư bề ngang — mà bề ngang mới là thứ đang thiếu. Đừng đề xuất lại.

## 3. Còn treo

Ghi ở đây để lần sau mở ra là biết mình đang đứng ở đâu. Danh sách việc thì nằm ở
`ke-hoach-beta.md` và `lam-viec-hang-ngay.md`.

- **Chưa có người học thật nào đi hết Chương 1.** Đây vẫn là khoảng trống lớn nhất của cả
  dự án; mọi con số trong `du-phong-7-nam.md` đều treo trên giả định này.
- **Nhánh `preview` và `preview.rehover.io`** đã có quy trình viết sẵn nhưng chưa bật.
- **Video kỹ thuật ngắn** (form tay, luồn ngón, legato) — đã chốt là cần, chưa quay.
- **Web MIDI mở rộng ra ngoài bài luyện nhận nốt** — hướng đã chốt, chưa làm.
- **Nghe qua micro chưa được đo trên máy thật.** iPhone/iPad không nối dây MIDI được (mọi
  trình duyệt iOS đều dùng WebKit, mà WebKit không có Web MIDI), nên 11/09/2026 đã làm
  đường nghe qua micro — chạy trên mọi máy, vẫn ở trên web. Nhưng mọi con số tới giờ đều đo
  trên tiếng đàn tổng hợp. Thứ tự đo thật ở Giai đoạn D của `lo-trinh-phat-trien.md`. Chỉ
  khi đo thật cho thấy micro không đủ chuẩn **và** phần lớn người beta dùng iOS (xem mục hệ
  điều hành trong Vercel Analytics) thì mới đụng lại câu "không làm app mobile".
- **Công tắc "Đổi hoá biểu mỗi câu" đang mặc định TẮT.** Người mới mở bài luyện nhận nốt vẫn
  chỉ gặp Đô trưởng. Chưa hỏi chủ sản phẩm có muốn bật sẵn không; đổi một dòng trong
  `DEFAULT_OPTIONS` của `midi-notes.ts` là xong.
- **Chưa quyết có cho mọi quãng đọc được ở cả hai khoá không.** Hiện khoá Pha chỉ nhận quãng
  2-3-4 và khoá Sol chỉ 4-5-6, vì quãng ngoài tầm phải kẻ tới bảy dòng kẻ phụ — mà bản nhạc
  thật thỉnh thoảng vẫn viết thế.
- **Giai đoạn 3 và 4** là sản phẩm riêng, chỉ quảng bá khi đã soạn xong.
- **Năm tab ở màn hình hẹp** — 390px chia năm là 78px mỗi ô. Chưa thử trên máy cỡ chữ hệ
  thống to; chữ tràn thì rút còn bốn tab hoặc bỏ chữ chỉ giữ biểu tượng.
- **Nhạc nền chưa có ai nghe thử ngoài máy đo.** Các số để chỉnh nằm ở đầu
  `ambient-engine.ts`: tốc độ 100 nhịp/phút, lọc 3000Hz, trần âm lượng 0,22.
- **Manifest `fullscreen` chỉ ăn với máy cài lại app.** Máy đang cài từ trước vẫn chạy
  `standalone`, và chỉ vào toàn màn hình nhờ lớp Fullscreen API ở cú chạm đầu.

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
| 12/09/2026 | `feat: Chế độ tập trung cho bài luyện nhận nốt` | Mục 2 thêm khối 12/09 thứ hai: ghi lại vì sao triệu chứng "nhạc không đầy khung" dẫn vào hướng sai, vì sao chế độ tập trung phải có SÀN chiều cao thay vì chia bằng flex (xoay ngang thì bật lên lại nhỏ hơn lúc không bật), vì sao ghim hàng nút xuống đáy chứ không ghim nút Thoát lên đỉnh, và ghi lại bản xếp hai cột đã dựng xong rồi bỏ vì đo ra hẹp hơn cả lúc không tập trung |
| 12/09/2026 | `feat: Luyện nhận nốt đọc được cả ô nhịp 4/4, không chỉ một nốt` | Mục 1 thêm dòng về chế độ ô nhịp 4/4, chốt luôn câu dễ bị lật lại nhất là **tiết tấu**: bốn nốt đen đều nhau chứ không trộn trường độ, vì app cố ý không đo thời gian nên hình nốt khác nhau chỉ là lời hứa suông. Mục 2 thêm khối 12/09 ghi ba thứ kéo theo mà lúc bắt đầu chưa thấy — phải ép bề ngang khuông nhạc, abcjs ghi đè `width` lên thẻ chứa làm phép đo tự so với chính nó, và con trỏ phải đi bằng `noteTimings` chứ không đếm thẻ trong DOM |
| 12/09/2026 | `docs(internal): Ghi nhật ký phiên 12/09 và chốt hoá biểu ngẫu nhiên` | Thêm dòng quyết định vào mục 1 (hoá biểu đổi ngẫu nhiên mỗi câu thay vì cho chọn một giọng cố định, kèm lý do: chọn cố định thì vài câu là người học thuộc lòng rồi thôi không nhìn đầu khuông nữa), thêm mốc 12/09 vào dòng thời gian với sáu vòng sửa và hai lỗi vẽ lọt qua năm lệnh kiểm, và hai việc còn treo mới ở mục 3 |
| 11/09/2026 | `feat: Thêm Góc bài hát để thử những bài quen tai` | Thêm dòng quyết định vào mục 1: có chỗ thử bài hát, nhưng chỉ nhạc hết hạn bảo hộ, kèm lý do pháp lý và đường đi nếu muốn nhạc còn bản quyền |
| 11/09/2026 | `feat: Gom lý thuyết, bài tập và tick vào một đường đi theo chương` | Thêm dòng quyết định vào mục 1: gộp Bài tập và Nhật ký thành Đường đi theo chương, lý thuyết thành bước tick được, và ghi rõ quyết định cũ nào bị lật cùng lý do lật |
| 11/09/2026 | `docs(internal): Ghi nhật ký phiên chiều 11/09` | Ghi vào dòng quyết định `fullscreen` một hướng đã dựng xong rồi bỏ (chỉ ẩn khi xoay ngang), kèm lý do web không tách được thanh điều hướng khỏi thanh trạng thái — để lần sau không ai đề xuất lại rồi làm lại từ đầu |
| 11/09/2026 | `feat: Thêm hai bài nhạc nền nữa, người học tự chọn` | Bổ sung vào dòng quyết định nhạc nền: ba bài thay vì một, kèm lý do vì sao cả ba bắt buộc ở Đô trưởng và vì sao bài chậm không phải là quay lại bản thiền đã bị bỏ |
| 11/09/2026 | `feat: Nghe tiếng đàn qua micro để tập với đàn trên mọi điện thoại` | Thêm dòng quyết định "iPhone thì nghe đàn bằng micro" vào mục 1, và đổi việc còn treo về Web MIDI trên iPhone thành "micro chưa đo trên máy thật" — trước đây lối ra duy nhất là bàn lại chuyện app mobile, nay đã có đường đi ngay trên web, chỉ còn thiếu phép đo thật |
| 11/09/2026 | `docs: Chốt điện thoại và tablet là thiết bị chính của người học` | Thêm dòng quyết định vào mục 1 và một việc còn treo về Web MIDI trên iPhone/iPad — hướng di động đã có trong đợt dựng lại điều hướng nhưng chưa thành nguyên tắc, nên chữ "chỉ chạy trên máy tính" còn sót trong app và suýt vào bài tuyển beta |
| 11/09/2026 | `docs(internal): Ghi nhật ký làm việc 10-11/09` | Ghi lại hai ngày sửa chế độ tập trung, dựng lại điều hướng và thêm nhạc nền, kèm ba việc còn treo sau đợt này — để phiên sau mở ra là biết đang đứng ở đâu |
| 11/09/2026 | `feat: Nhạc nền vui hơn, mặc định bật, chỉ tắt khi có tiếng khác` | Sửa lại dòng quyết định nhạc nền cho khớp thực tế: mặc định bật và tắt theo sự kiện, kèm lý do vì sao việc này không phá ràng buộc "người học tự quyết" của phần tập |
| 10/09/2026 | `feat: Thêm nhạc nền tự sinh, mặc định tắt` | Chốt cách làm nhạc nền và lý do bản quyền đứng trước lý do kỹ thuật |
| 10/09/2026 | `refactor: Bỏ nốt thanh tiêu đề, app chạy toàn màn hình` | Chốt bỏ thanh tiêu đề và ghi chỗ ở mới của đăng nhập/đổi nền; bổ sung vào dòng `fullscreen` lý do phải có lớp Fullscreen API thứ hai |
| 10/09/2026 | `refactor: Bỏ AppShell, thay bằng thanh tab và trang mục lục` | Chốt bỏ thanh bên và ghi rõ điều kiện đi kèm: mục lục phải dời sang trang có tên hẳn hoi trước, bỏ trước thì mất đường đi |
| 10/09/2026 | `feat: Ẩn thanh trạng thái khi mở app từ màn hình chính` | Chốt `display: fullscreen` cho manifest và ghi rõ cái giá phải trả (mất đồng hồ ở mọi trang) cùng hệ quả kéo theo ở thanh mời cài đặt |
| 09/09/2026 | `docs(internal): Dựng nhật ký quyết định từ lịch sử phiên làm việc` | Tạo file — dựng lại các câu đã hỏi và đã chốt trong 25/08–08/09 kèm lý do, vì lý do vốn chỉ nằm trong lịch sử chat và sẽ mất khi phiên cũ bị dọn |
