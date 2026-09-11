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

## 11/09/2026 — Điện thoại là thiết bị chính, và app biết nghe đàn

**Đã làm**

- **Rạng sáng (phiên khác):** chế độ toàn màn hình, bỏ nốt thanh tiêu đề, nhạc nền chạy
  liền mạch khi chuyển trang. Lý do và cái bẫy đi kèm đã ghi ở mục 2 của
  [`nhat-ky-quyet-dinh.md`](nhat-ky-quyet-dinh.md), không chép lại đây.
- **Chốt "điện thoại và tablet là thiết bị chính, máy tính là phụ"** thành quy định trong
  `AGENTS.md` kèm bốn hệ quả. Người học đặt máy lên giá nhạc của đàn; laptop không có chỗ
  đặt trên đàn nên gần như không ai mở lúc tập. Đợt dựng lại điều hướng mấy hôm trước đã
  đi theo hướng này rồi, nhưng chưa ai viết nó ra thành luật.
- **Soạn bốn bản bài đăng tuyển beta**, mỗi bản một góc nhìn (nhờ người thử / người từng
  bỏ dở / buổi đầu chơi được gì / người sắp mua đàn), để đăng 4-6 nhóm mà không dán cùng
  một đoạn — Facebook nhận ra, và người trong nhóm cũng nhận ra. **Bốn bản này hiện mới
  nằm trong khung chat, chưa lưu thành file.**
- **Bàn lại chuyện làm app đẩy lên store, kết luận vẫn là giữ web.** Vướng lớn nhất là
  thanh toán: nội dung số bán trong app phải qua hệ thống của Apple/Google, phí 15-30%,
  gần như chắc chắn không thu bằng VietQR được. Hai lối đã cân nhắc cho iPhone (app bọc
  web, bảo người học cài trình duyệt riêng) ghi vào mục 8 của `lo-trinh-phat-trien.md`.
- **Làm xong tính năng nghe tiếng đàn qua micro** — buổi sáng mới ghi là "hướng cần thử",
  buổi chiều làm đầy đủ. Micro là cách nối mặc định ở cả trang luyện nhận nốt lẫn *Tập bài
  này với đàn*; dây MIDI đứng thứ hai. Đo trên tiếng đàn tổng hợp: ~92% nốt nghe đúng khi
  tập theo bản nhạc, ~1% nốt ma; luyện nhận nốt 100% đúng phím và không lần nào đánh sai
  mà bị báo "Chính xác". Thử trong trình duyệt thật bằng micro giả lập: Ode to Joy tay
  phải và tay trái đều 15/15.
- **Deploy đỏ ngay sau đó, và tìm ra vì sao.** Vitest bỏ cuộc sau 5 giây mỗi ca, mà ca đo
  độ chính xác micro mất 3 giây ngay trên máy bàn — máy dựng bản của Vercel chậm hơn vài
  lần là trượt. Khai hạn giờ riêng cho hai ca nặng, cắt bớt khối lượng, ghi thành **bẫy 19**.
- **Thêm `next build` vào cổng kiểm tra trước khi commit** (giờ là năm lệnh), ghi vào skill
  soạn commit, `AGENTS.md`, quy trình làm việc và bản một trang.
- **Chiều tối và tối (phiên này):**
  - **Nhạc nền to lên đúng mức.** Kéo thanh trượt hết cỡ, vặn cả âm lượng máy lên hết mà
    vẫn nghe bé. Đo ra RMS -31,3dB lúc kéo hết cỡ, nhỏ hơn nhạc bình thường khoảng 15dB.
    Ba chỗ cộng dồn, phải sửa cả ba: trần âm lượng để 0,22; bộ nén nối SAU nút âm lượng
    nên kéo càng cao càng bị nén mạnh; và `knee` để mặc định 30dB, rộng tới mức nén từ
    -35dB. Nay -15,9dB lúc kéo hết cỡ, không mẫu nào vỡ tiếng. Ghi thành **bẫy 20**.
  - **Thử rồi bỏ: chỉ ẩn thanh hệ thống khi xoay ngang.** Dựng xong, năm lệnh xanh, rồi
    chủ sản phẩm bảo để như cũ. Lý do ghi ở mục 2 của
    [`nhat-ky-quyet-dinh.md`](nhat-ky-quyet-dinh.md) — nhánh đã xoá nên chỗ đó là dấu vết
    duy nhất còn lại.
  - **Nới đáy thanh tab 16px.** Thanh tab nằm sát cạnh dưới màn hình, khó bấm và còn chồng
    lên dải vuốt về màn hình chính của Android. Ghi thành **bẫy 21**.
  - **Thêm hai bài nhạc nền nữa** (Chiều êm, Bước nhẹ), chọn trên thẻ ở màn hình chủ, bài
    cũ giữ nguyên làm mặc định. Cả ba ở Đô trưởng vì ràng buộc giáo trình, có test gác:
    mọi nốt của mọi bài phải rơi vào phím trắng.
  - **Gom điều hướng thành Đường đi theo chương.** Trước đó một buổi học phải đi ba
    trang: Mục lục đọc lý thuyết, Bài tập mò đúng bài, Nhật ký nhớ vừa học gì rồi tick.
    Gốc rễ là lý thuyết và bài tập vốn là HAI chuỗi rời — đọc xong lý thuyết Chương 3 bấm
    *Bài tiếp theo* là nhảy sang lý thuyết Chương 4, bỏ qua cả sáu bài tập. Nay một chuỗi
    duy nhất, mỗi chương một trang có tick tại chỗ, thanh tab còn bốn mục.
  - **Dựng Góc bài hát** (`/songs`), miễn phí, không tick. Sáu bài đều đã hết hạn bảo hộ;
    mỗi file bắt buộc khai trường `nguon` và **có test gác** — thêm bài mà bỏ trống là đỏ.
  - **Sửa lỗi nhạc nền kêu chồng lên bản nhạc mẫu** (bẫy 23), lỗi đang chạy trên
    production.
  - **Soạn `ban-quyen-bai-hat.md`** — cách đi xin phép để đưa nhạc còn bảo hộ vào Góc bài
    hát, kèm thư hỏi mẫu dán là gửi được. Chỗ quan trọng nhất là cảnh báo hỏi nhầm cửa:
    thứ cần xin là quyền **sao chép** và **làm tác phẩm phái sinh**, không phải quyền biểu
    diễn — mà quyền in ấn thường không nằm trong uỷ quyền tác giả giao cho tổ chức quản lý
    tập thể. Về chi phí tài liệu nói thẳng là **chưa biết** và không đoán, vì biểu phí công
    khai là cho nhạc nền quán xá và karaoke, suy từ đó ra là suy sai. Trang `/songs` sửa
    lời cho khớp ("đang cân nhắc" → "đang làm") và mời người học nhắn bài họ muốn, để biết
    nên đi xin bài nào trước.
  - **Sửa một nốt sai đã chạy trên production của Für Elise.** Người dùng báo bài này
    "sai nốt". Nguyên nhân là luật ký âm chứ không phải gõ nhầm: dấu thăng có hiệu lực tới
    hết ô nhịp, nên `^d` ở đầu ô làm nốt `d` ở cuối ô cũng thành Rê thăng. Bản nhạc vẽ ra
    nhìn hoàn toàn bình thường — sai chỉ nghe thấy chứ không nhìn thấy. Ghi thành **bẫy
    25**.
  - **Mỗi bài trong Góc bài hát nay có hai bản: cơ bản và nâng cao.** Bản nâng cao hai
    tay, đầy đủ hơn, và mỗi bài thêm một thứ khác nhau: Jingle Bells trọn điệp khúc mười
    sáu ô với tay trái kiểu hành khúc; Khúc hoan ca thêm hợp âm tay trái; Canon giãn thành
    tám ô rải nốt liên tục; Chúc mừng sinh nhật thêm đệm valse; Für Elise đi hết đoạn A với
    nền rải hợp âm; Minuet trả lại **đúng tiết tấu gốc** — bài gốc không có nhịp lấy đà,
    nốt Rê đầu tiên rơi thẳng vào phách mạnh chứ không dẫn vào như bản rút gọn đang ghi.
  - **Ode to Joy dài gấp đôi: chủ đề đủ mười sáu ô.** Chủ sản phẩm chỉ ra bài còn thiếu
    khúc sau, và đúng — cả góc bài hát lẫn bài tập 2E của Chương 1 đều đang gọi tám ô là
    "trọn vẹn", trong khi chủ đề thật có bốn câu: A, A', **B**, A'. Câu B (ô 9-12) là khúc
    hầu hết người tự học không biết là có. Cả hai bản đều lên mười sáu ô; bản nâng cao trả
    lại đúng nốt Sol thấp cuối câu B và tiết tấu chấm dôi ở các nốt ngân, bản cơ bản giữ
    thế tay 5 ngón bằng cách nâng nốt Sol đó lên một quãng tám và nói rõ là cố ý.
  - **Chép lại nốt theo bản nhạc gốc thay vì theo trí nhớ.** Chủ sản phẩm bảo: không dám
    chép từ trí nhớ thì đi tìm bản nhạc mà chép. Đúng, và làm được: IMSLP, Mutopia qua tên
    miền riêng, abcnotation.com đều bị chặn ở cổng ra, **nhưng GitHub thì đi được** — mà
    Mutopia Project có toàn bộ mã nguồn LilyPond trên GitHub, kèm khai rõ bản khắc nào và
    giấy phép gì. Đường đi, ba kho dùng được và cách kiểm đã ghi thành mục 6 của
    [`ban-quyen-bai-hat.md`](ban-quyen-bai-hat.md).
    - **Für Elise sai nhiều hơn tưởng.** Chuỗi Đô-Mi-La đi lên là của **tay phải** chứ
      không phải tay trái như Claude đoán, tay trái chỉ chấm ba nốt đầu ô rồi im, và ô kết
      của đoạn A cũng khác. Nay chép đúng từng nốt theo bản khắc Breitkopf & Härtel 1888.
    - **Minuet lên cả bài, ba mươi hai ô, hai đoạn.** Chỗ đoán đúng: bài không có nhịp lấy
      đà. Chỗ trước đây không dám viết tiếp vì sợ sai thì nay có nguồn.
    - **Jingle Bells có thêm phần lời hát** — *"Dashing through the snow"* — đoạn rất nhiều
      người chưa từng tập. Phát hiện kèm theo: **điệp khúc Pierpont viết năm 1857 khác hẳn
      điệp khúc ai cũng hát bây giờ**; giữ điệp khúc quen thuộc, ghi chú chuyện đó trong bài.
    - **Ode to Joy: câu 3 Claude chép từ trí nhớ hoá ra đúng.** Hai bản số hoá độc lập đều
      khớp từng nốt, kể cả nốt Sol thấp ô 12. Không sửa gì, chỉ ghi nguồn đối chiếu vào
      trường `nguon`.
  - **Bỏ hẳn cơ chế nhìn trước của phần bám theo bản nhạc.** Người dùng báo: *"chưa kịp gõ
    nốt thứ nhất mà gõ nhầm nốt thứ 3 thì nhảy sang nốt 3 luôn"*. Đúng — bản cũ nhìn trước
    hai sự kiện, mở khoá sau lần trượt đầu tiên, nên bấm nhầm một phím rồi bấm lại chính nó
    (phản xạ khi màn hình không phản ứng) là con trỏ nhảy qua mấy nốt chưa ai đánh. Nay đi
    tuần tự tuyệt đối, và đường ra khi kẹt là **nút *Bỏ qua nốt này*** do người học tự bấm.
    Chốt thành điều thứ tư trong danh sách "đừng phá" ở `AGENTS.md`.
  - **Luyện nhận nốt: bỏ ba mức cố định, cho người học tự ghép.** Chủ sản phẩm muốn tập
    nốt nhảy rộng hơn. Nay có ba ô chọn rời nhau — **tay** (khóa Sol / khóa Pha / cả hai,
    chọn cả hai thì mỗi câu đổi khóa), **quãng** (chọn được nhiều vùng cùng lúc, từ thế tay
    Đô tới quãng trầm và quãng cao), **dấu hoá** (bật là có phím đen). Vùng nào khóa đang
    chọn không vẽ nổi thì ẩn hẳn khỏi danh sách, và lựa chọn được nhớ lại cho buổi sau.
  - **Chọn quãng bằng hình cây đàn 88 phím, và cả hai tay thì hiện khuông đôi.** Chủ sản
    phẩm chốt lại hai chỗ ngay sau khi dùng thử: dãy nút chữ đổi thành **hình bàn phím
    thật**, chạm vào cụm nào thì cụm đó sáng xanh; và chọn cả hai tay thì vẽ **cả khóa Sol
    lẫn khóa Pha song song** như bản nhạc piano, nốt nằm ở khuông nào là một phần của câu
    hỏi. Hình bàn phím vẽ đúng tỉ lệ đàn thật (phím trắng 23,5×150mm, phím đen 13,7×95mm)
    nên ướm từ màn hình ra đàn là khớp; màu xanh tô đúng những nốt đang được hỏi nên bật
    tắt dấu hoá hay thế tay 5 ngón là thấy ngay.
  - **Thêm test gác cho nhạc viết tay** (`songs.test.ts`): mọi ô nhịp phải đủ phách, bản
    nâng cao phải có hai khuông nhạc, bài nào cũng phải có đủ hai bản, và không nốt nào
    được ăn theo dấu hoá của nốt trước trong cùng ô. Gỡ bản sửa ra chạy lại thì cả hai ca
    mới đều đỏ đúng chỗ.
  - **Bịt thêm hai lỗ nữa của nhạc nền** sau khi người dùng báo lỗi cũ vẫn còn. Cả hai đọc
    ra được từ mã và độc lập với cuộc đua ở bẫy 23: `{ once: true }` chỉ gỡ đúng listener
    vừa bắn nên listener anh em sống tới hết phiên, và lúc cử chỉ tới thì không ai hỏi lại
    xem có nguồn tiếng nào đang giữ chỗ không. Ghi thành **bẫy 24**. **Chưa xác nhận được
    đây có đúng là nguyên nhân người dùng gặp hay không** — dựng phép đo trên trình duyệt
    thật nhưng không tái hiện nổi, vì cú chạm giả không được tính là cử chỉ thật.

**Quan sát**

- **Chữ trong app tụt lại sau thực tế mà không ai biết.** Suốt nhiều tháng app ghi "Web
  MIDI chỉ chạy trên máy tính", trong khi chủ sản phẩm vẫn cắm đàn vào điện thoại Android
  dùng hằng ngày. Nó chỉ lộ ra khi có người hỏi ngược lại một câu tưởng như ngây thơ:
  *"iPhone không tải được Chrome hả?"*. Bài học: câu chữ viết một lần rồi chép đi chép lại
  là chỗ sai lâu nhất, vì không có test nào gác nó.
- **"Bốn lệnh kiểm đều xanh" không có nghĩa là deploy sẽ chạy.** Bốn lệnh đó không dựng bản
  production — mà đó mới là thứ Vercel chạy. Đây là kiểu hỏng im lặng nhất: không ai báo
  gì, người học chỉ đơn giản vẫn thấy bản cũ.
- **Ca khó nhất của việc nghe đàn không phải hợp âm, mà là đánh lại đúng phím còn đang
  ngân.** Tiếng cũ và tiếng mới cộng lệch pha nên ngay tại nốt gốc, phần "mới sáng lên" có
  khi gần bằng 0 — máy mất nốt gốc và nhận thành hoạ âm cao hơn một quãng tám. Mà đây lại
  đúng là thứ đầy rẫy trong giáo trình: Ode to Joy có bốn chỗ lặp nốt liền nhau.
- **Ba ngày liên tiếp dồn hết vào sản phẩm, việc tuyển beta đứng yên.** Hôm nay không kiểm
  bài đang chờ duyệt, không comment thêm, không đăng nhóm mới. Chốt chặn 1 còn 12 ngày.
- **Hai lỗi người dùng báo chiều nay đều không nghe/nhìn ra được nguyên nhân.**
  Nhạc nhỏ thì thủ phạm là bộ nén đứng sai chỗ chứ không phải con số âm lượng; thanh tab
  sát mép thì thủ phạm là `env(safe-area-inset-bottom)` trả về 0 vì chế độ toàn màn hình.
  Cả hai đều là kiểu "triệu chứng ở A, nguyên nhân ở B", và cả hai chỉ lộ ra khi **đo**.
  Đây là lý do `bay-ky-thuat.md` ghi theo lối triệu chứng → nguyên nhân.
- **Có lúc tối ưu lại chống lại chính mình.** Chạy toàn màn hình để lấy thêm chiều cao,
  nhưng đúng vì thế mà `env()` bằng 0 và thanh tab tụt sát mép thành khó bấm. Thêm chiều
  cao xong lại mất chỗ bấm.
- **Đo xong mới biết không cần cái núm mình định thêm.** Định làm hệ số chỉnh âm lượng
  riêng cho từng bài nhạc nền, vì bài dày nốt lẽ ra phải to hơn bài thưa nốt. Đo ra ba bài
  chênh nhau 0,6dB — dưới ngưỡng tai nghe ra được, vì bộ nén đã san sẵn. Gỡ bỏ. Một con số
  luôn bằng 1 nằm trong mã là thứ lần sau phải đoán xem nó dùng làm gì.
- **Năm lệnh kiểm xanh vẫn chưa đủ để nói trang mở được.** Dựng `/path` xong, cả năm lệnh
  đều xanh mà mở trang ra là 500: `component={Link}` của Mantine trong Server Component.
  `next build` cũng qua, vì trang dựng theo từng lượt xem nên lỗi chỉ nổ khi có người mở
  thật. Bẫy 19 dạy "bốn lệnh xanh không có nghĩa deploy chạy"; bẫy 22 đi thêm một bước.
  Từ nay đổi giao diện là phải `next start` rồi mở từng đường dẫn.
- **Hai lỗi hôm nay đều nằm ở chỗ "trong lúc tôi chờ, thế giới có đổi không".** Nhạc nền
  kêu chồng lên bản nhạc mẫu là vì `pointerdown` bắn trước `click`: lệnh bật chạy trước
  lệnh dừng nhưng về đích sau, do nó kẹt trong `await resume()`. Cùng họ với bẫy 18 (bộ
  phát mồ côi) và với chỗ `setPiece` cố ý không tự gọi `start()`. Mọi thứ sau một `await`
  đều phải hỏi lại trạng thái.
- **Chỗ người dùng đẩy lại mạnh nhất là chuyện bản quyền**, và lý lẽ nghe rất hợp lý:
  "MuseScore với mấy trang Facebook bán sheet bình thường mà, soạn bằng AI rồi ghi nguồn
  là được". Hai chỗ sai: MuseScore **trả tiền bản quyền** chứ không phải cứ làm; và ghi
  tên tác giả là *nghĩa vụ*, không phải *giấy phép*. Ai chép ra — người hay AI — không
  liên quan tới bản quyền, vì thứ được bảo hộ là bản thân tác phẩm chứ không phải cái file.
- **Việc tuyển beta sang phiên thứ hai vẫn chưa động tới.** Cả ngày hôm nay là sản phẩm.
- **Hai chỗ hôm nay phải đổi cách viết React vì lint chặn, và lint chặn đúng.** Đọc
  `localStorage` lúc dựng state thì HTML máy chủ khác HTML máy người học; đặt lại state
  trong `useEffect` thì vẽ một lần bằng dữ liệu cũ rồi mới sửa. Cách đúng là
  `useSyncExternalStore` cho phần nhớ giữa hai buổi, và "chỉnh state ngay trong lúc vẽ" cho
  phần đặt lại khi lựa chọn đổi. Mất thêm nửa giờ nhưng đổi lại không có cái nháy nào.
- **Tính năng tự đoán ý người học là tính năng dễ mất niềm tin nhất.** Cơ chế nhìn trước
  sinh ra để giải một vấn đề có thật (micro bỏ sót một nốt thì con trỏ kẹt vĩnh viễn), và
  nó giải được — nhưng cái giá là máy đoán hộ. Đoán đúng chín lần không ai để ý; đoán sai
  một lần là người học hết tin vào toàn bộ phần tô màu, mà tô màu là thứ duy nhất tính năng
  đó làm. Thay bằng một nút để người học tự quyết thì vừa hết đoán sai, vừa đúng tinh thần
  "người học tự quyết" đã chốt từ đầu.
- **Có loại lỗi chỉ đọc ra được chứ không tái hiện được.** Lỗi nhạc nền báo lại lần hai
  cần một cử chỉ thật của người dùng mới nổ, mà trình duyệt chạy tự động không có cử chỉ
  thật — bỏ luật cần cử chỉ đi thì tình huống lỗi biến mất luôn. Cách còn lại là đọc kỹ mã
  và sửa mọi lỗ nhìn thấy, rồi nói thẳng trong commit là chưa chứng minh được. Ghi "đã
  sửa" cho một thứ chưa đo được là lần sau mất thêm một vòng hỏi lại người dùng.
- **Người dùng báo lại cùng một triệu chứng thường là lỗ khác, không phải bản sửa hỏng.**
  Ba lỗ của nhạc nền đều ra đúng một triệu chứng "kêu lúc phải im" nhưng nguyên nhân rời
  nhau hẳn. Sửa xong một cái mà triệu chứng còn thì đọc lại từ đầu, đừng vặn tiếp chỗ vừa
  sửa.

**Tiếp theo**

- **Thử micro trên máy thật trước khi mời người beta dùng** — cách thử cụ thể đã ghi ở mục
  7 của [`lam-viec-hang-ngay.md`](lam-viec-hang-ngay.md). Đây là việc duy nhất Claude không
  làm hộ được.
- **Việc beta vẫn còn nguyên:** mở lại 3 bài đã comment, kiểm hộp tin nhắn chờ, xem bài
  đăng đã được duyệt chưa, và đăng nhóm thứ hai bằng một trong bốn bản đã soạn.
- Nếu muốn dùng lại bốn bản bài đăng thì bảo Claude lưu thành
  `docs/_internal/mau-bai-dang-tuyen-beta.md`, đặt cạnh file mẫu comment.
- **Nghe thử ba bài nhạc nền trên máy thật.** Vòng hợp âm và mẫu rải nốt là Claude soạn,
  hợp lý về lý thuyết và có test gác đúng giọng, nhưng hay dở thì phải nghe mới biết. Bài
  nào chán thì đổi vòng hoặc đổi mẫu rải, khung đã dựng sẵn nên thêm bài rất nhanh.
- **Kiểm 16px nới đáy thanh tab trên máy thật.** Con số suy ra từ bề rộng dải cử chỉ của
  Android chứ chưa đo trên máy. Chưa đủ thoáng thì nâng lên 20-24px, sửa đúng một dòng
  trong `globals.css`.
- **Đánh thử sáu bài trong Góc bài hát.** Claude xác minh được nốt viết ra đúng như nó
  định và trường độ từng ô nhịp khớp, nhưng không nghe được để biết giai điệu có đúng bài
  gốc không. Hai chỗ đáng ngờ nhất: Minuet ô nhịp thứ 3 (tiết tấu do Claude tự chọn) và
  vòng hoà thanh của Canon.
- ~~**Nghe kỹ câu 3 của Ode to Joy (ô 9-12).**~~ **Xong ngay trong ngày** — hai bản số hoá
  độc lập xác nhận đúng từng nốt. Vẫn nên nghe cho vui tai, nhưng không còn là chỗ đáng ngờ.
  Dòng cũ giữ nguyên bên dưới vì nó ghi đúng thứ đã lo lúc đó.
- **Nghe kỹ câu 3 của Ode to Joy (ô 9-12).** Đây là khúc Claude chép từ trí nhớ chứ không
  có nguồn nào trong repo để đối chiếu — trước nay mọi chỗ trong giáo trình đều chỉ có tám
  ô đầu. Hai chỗ đáng ngờ: **nốt Sol cuối ô 12 có thật sự thấp hơn một quãng tám không**,
  và **hai nốt nhanh Mi-Pha ở ô 10, 11** có đúng chỗ không. Sai ở đây thì cả bốn ô nghe
  lạc, không phải lệch một nốt.
- **Sửa lời bài tập 2E của Chương 1** nếu thấy đáng: nó đang gọi tám ô là "Ode to Joy trọn
  vẹn cả bài". Tám ô vẫn là lượng đúng cho ngày thứ hai học đàn, chỉ có chữ "trọn vẹn" là
  sai — nhưng đây là bài trong giáo trình bán tiền nên để chủ sản phẩm quyết.
- **Sau đợt chép lại theo nguồn, chỗ còn là Claude soạn chỉ còn phần đệm tay trái** của
  Chúc mừng sinh nhật, Canon, và đoạn lời hát Jingle Bells. Giai điệu của cả sáu bài giờ
  đều có nguồn hoặc đã đối chiếu. Nghe thử thì tập trung vào mấy chỗ đệm đó.
- **Đánh thử nốt sáu bản nâng cao vừa thêm** — giờ là mười hai bản nhạc chứ không phải
  sáu. Ba chỗ Claude soạn chứ không chép nên đáng ngờ nhất: phần đệm valse của Chúc mừng
  sinh nhật, hình rải nốt của Canon, và **tay trái Für Elise đã bị làm phẳng tiết tấu** —
  bản gốc không chia đều ba nốt mỗi ô như đang ghi. Tiết tấu gốc của Minuet thì ngược lại:
  đó là chỗ Claude *sửa cho đúng*, nên nếu nghe lạ tai so với bản cũ thì là đúng ý, không
  phải lỗi.
- **Tick thử vài bước trên Đường đi** xem con số nhảy đúng ở cả ba chỗ (trang chương,
  `/path`, màn hình chủ). Máy dựng bản không có database nên luồng này chưa chạy được lần
  nào.
- **Hỏi VCPMC** nếu vẫn muốn có nhạc đang thịnh hành trong Góc bài hát. Khung đã dựng sẵn
  chỗ ghi số giấy phép; có phép là soạn được ngay. Thư hỏi mẫu và ba chỗ dễ hỏi nhầm cửa
  đã nằm sẵn ở [`ban-quyen-bai-hat.md`](ban-quyen-bai-hat.md).
- **Thử lại xem nhạc nền còn kêu chồng lên bản nhạc mẫu không** — đây là việc Claude không
  làm hộ được, vì lỗi cần một cử chỉ thật. Mở một bản nhạc bấm *Nghe thử*, rồi thử cả hai
  lối: chạm ra ngoài màn hình lúc đang phát, và (trên máy tính) gõ một phím bất kỳ. Còn
  kêu thì kể lại đúng thứ tự thao tác — thứ tự mới là thứ chỉ ra lỗ còn lại.
- **Gửi giai điệu dân ca** (gõ tên nốt hoặc chụp bản nhạc có sẵn) để Claude soạn tiếp. Đây
  là thứ hợp pháp mà người học Việt Nam nhiều khả năng thích nhất, nhưng Claude không dám
  chép từ trí nhớ vì nhiều dị bản vùng miền.

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
