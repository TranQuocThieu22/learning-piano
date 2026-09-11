---
capDo: 1
sauChuong: 1
nguon: "Ludwig van Beethoven, chủ đề *Ode an die Freude* trong Giao hưởng số 9, 1824 — đã hết hạn bảo hộ, thuộc phạm vi công cộng. Giai điệu đã đối chiếu với hai bản số hoá độc lập: bản hợp xướng bốn bè trong tuyển tập *Songs from the Public Domain* (kho bbloomf/lilypond-songs) và một bản MusicXML trong kho musetrainer/library"
---

# Khúc hoan ca (Ode to Joy)

Chủ đề nổi tiếng nhất của Beethoven, và cũng là một trong những giai điệu dễ chơi nhất từng được viết ra: **cả bài nằm gọn trong thế tay 5 ngón** Đô-Rê-Mi-Pha-Sol, không một nốt nào ra ngoài.

Bạn đã gặp từng mảnh của nó trong các bài tập. Đây là **chủ đề đầy đủ, mười sáu ô nhịp** — dài gấp đôi câu quen thuộc mà hầu hết người ta dừng lại.

> [!NOTE]
> Đây là chỗ để **thử cho vui**, không phải bài tập. Không có gì để tick, không ai chấm.

**Bài này có bốn câu, không phải hai.** Nhìn ra được bốn câu đó là thuộc bài:

| Câu | Ô nhịp | Nghe ra sao |
|---|---|---|
| 1 | 1–4 | Câu quen thuộc, kết lửng lơ ở Rê |
| 2 | 5–8 | Y hệt câu 1, nhưng kết về Đô — đã đóng lại |
| 3 | 9–12 | **Câu lạ tai**, bắt đầu thấp hơn và đi luẩn quẩn quanh Rê-Mi-Pha |
| 4 | 13–16 | Quay lại đúng câu 2, kết thật |

Câu 3 chính là khúc mà hầu hết người tự học không biết là có. Nó không khó hơn, chỉ lạ tai hơn — và thiếu nó thì bài nghe như bị cắt ngang.

## Bản cơ bản — một tay

```abc
X: 1
T: Khúc hoan ca - Ode to Joy trọn chủ đề (tay phải)
C: Ludwig van Beethoven (1824)
M: 4/4
L: 1/4
Q: 1/4=88
K: C
E E F G | G F E D | C C D E | E3 D |
E E F G | G F E D | C C D E | D3 C |
D D E C | D E/2F/2 E C | D E/2F/2 E D | C D G2 |
E E F G | G F E D | C C D E | D3 C |]
```

> [!NOTE]
> **Hai chỗ bản cơ bản làm khác bản gốc, cố ý.** Nốt Sol cuối ô 12 trong bản gốc thấp hơn một quãng tám, tức nằm ngoài thế tay 5 ngón — ở đây nâng lên cho tay không phải rời chỗ. Và mấy nốt ngân dài ở ô 4, 8, 16 được kéo thẳng cho dễ đếm, bản gốc chia nhỏ hơn. Bản nâng cao bên dưới giữ đúng cả hai.

### Tập thế nào

1. **Đặt tay một lần rồi thôi.** Ngón 1 trên Đô giữa, ngón 5 trên Sol. Cả bản này không nhấc tay, kể cả câu 3.
2. **Học câu 1 và 2 trước, đừng đụng tới câu 3.** Tám ô đầu đã là một bài hoàn chỉnh nghe được. Chỉ khi nào đánh trôi chảy tám ô đó mới thêm câu 3 vào.
3. **Câu 3 có hai ô giống hệt nhau gần như từ đầu đến cuối** — ô 10 và ô 11 chỉ khác đúng nốt cuối (Đô với Rê). Tập một ô rồi suy ra ô kia, đừng học như hai thứ riêng.
4. **Chỗ hai nốt nhanh** ở ô 10 và 11 (Mi-Pha đi liền) là chỗ duy nhất trong bài có nốt ngắn hơn một phách. Đếm "một-hai-VÀ-ba-bốn", hai nốt đó rơi đúng vào "hai-VÀ".
5. **Đánh chậm ở 60** trước, quen rồi hãy lên 88.

## Bản nâng cao — hai tay, đúng bản gốc

Đủ mười sáu ô, tay trái đệm hợp âm, và **trả lại hai chỗ bản cơ bản đã làm dễ đi**: nốt Sol cuối câu 3 xuống đúng quãng tám thật của nó, còn các nốt ngân dài chia đúng như Beethoven viết — một nốt chấm dôi, một nốt móc đơn, rồi một nốt trắng.

Chính cái nốt Sol thấp ấy mới làm câu 3 nghe như rơi hẫng xuống trước khi câu cuối bật lên. Nâng nó lên thì bài vẫn đúng nốt nhưng mất chỗ hay nhất.

Tay trái chỉ có **hai hình tay**, Đô trưởng và Sol bảy, dùng đi dùng lại suốt mười sáu ô.

```abc
X: 1
T: Khúc hoan ca - Ode to Joy trọn chủ đề (hai tay)
C: Ludwig van Beethoven (1824)
M: 4/4
L: 1/4
Q: 1/4=88
%%staves {1 2}
K: C
V: 1 clef=treble
e e f g | g f e d | c c d e | e3/2 d/2 d2 |
e e f g | g f e d | c c d e | d3/2 c/2 c2 |
d d e c | d e/2f/2 e c | d e/2f/2 e d | c d G2 |
e e f g | g f e d | c c d e | d3/2 c/2 c2 |]
V: 2 clef=bass
[C,E,G,]2 [C,E,G,]2 | [C,E,G,]2 [C,E,G,] [B,,D,G,] | [C,E,G,]2 [B,,D,G,] [C,E,G,] | [C,E,G,]2 [B,,D,G,]2 |
[C,E,G,]2 [C,E,G,]2 | [C,E,G,]2 [C,E,G,] [B,,D,G,] | [C,E,G,]2 [B,,D,G,] [C,E,G,] | [B,,D,G,]2 [C,E,G,]2 |
[B,,D,G,]2 [C,E,G,]2 | [B,,D,G,]2 [C,E,G,]2 | [B,,D,G,]2 [B,,D,G,]2 | [C,E,G,] [B,,D,G,] [B,,D,G,]2 |
[C,E,G,]2 [C,E,G,]2 | [C,E,G,]2 [C,E,G,] [B,,D,G,] | [C,E,G,]2 [B,,D,G,] [C,E,G,] | [B,,D,G,]2 [C,E,G,]2 |]
```

### Tập thế nào

1. **Hai hình tay trái, học thuộc trước khi ghép.** Đô trưởng là Đô-Mi-Sol, ngón 5-3-1. Sol bảy ở đây viết gọn còn Si-Rê-Sol, cũng ngón 5-3-1 — chỉ cần trượt ngón 5 xuống một phím và ngón 3 xuống một phím. Đổi qua đổi lại hai hình đó ba mươi lần là tay tự nhớ.
2. **Nghe chỗ hợp âm đổi.** Gần như mọi lần đổi sang Sol bảy đều rơi vào nốt Rê của giai điệu, và mọi lần quay về Đô trưởng đều rơi vào Đô hoặc Mi. Nghe ra được quy luật đó thì không cần nhìn bản nhạc nữa.
3. **Riêng câu 3 thì ngược lại:** Sol bảy giữ gần như suốt bốn ô, chỉ ghé về Đô trưởng ở nửa sau ô 9, ô 10 và đầu ô 12. Đó là lý do câu 3 nghe căng hơn ba câu kia — nó ở xa nhà lâu hơn.
4. **Ghép từng ô một, đừng ghép từng câu.** Đánh ô 1 hai tay cho khớp, dừng, rồi ô 2. Ghép cả câu ngay là chỗ hay vỡ.
5. **Ô 4, 8, 16 có hợp âm đổi ngay giữa nốt ngân.** Tay phải đang giữ một nốt dài thì tay trái vẫn phải đổi hợp âm đúng phách — đó là kỹ năng thật sự mới của bản này. Đếm to.
6. **Ô 12 là chỗ hai tay đi ngược nhau:** tay phải rơi xuống nốt Sol thấp, còn tay trái vẫn giữ Sol bảy chờ. Tập riêng ô 12 nối sang ô 13 vài lần — đó là bản lề của cả bài.
