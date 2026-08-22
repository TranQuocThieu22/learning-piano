# Chương 2 - Bài 2: Đánh luân phiên 2 tay (Alternating hands)

Hôm nay chúng ta vẫn giữ nguyên chủ đề của Bài 2 là **Nhịp điệu và Phối hợp 2 tay**, nhưng chúng ta sẽ nâng cấp bài tập lên một chút để rèn luyện trí não và sự phản xạ độc lập.

Mục tiêu của Ngày 2 là giúp 2 tay của bạn không chỉ biết đánh cùng lúc, mà còn biết "chờ đợi" và đánh luân phiên nhau (tay này đánh thì tay kia nghỉ).

## Bài tập Không cần đàn (Away from piano)
Tiếp tục chuỗi bài tập luyện não ở mọi nơi để tay không bị cứng:

**1. BẮT BUỘC [Phương pháp: Bài tập mặt bàn / Tapping]**
- **Động tác:** Miệng nhẩm đếm đều "Một - Hai - Ba - Bốn". Úp tay lên đùi.
  - Nhịp 1: Vỗ nhẹ tay TRÁI.
  - Nhịp 2: Vỗ nhẹ tay PHẢI.
  - Nhịp 3: Vỗ cả HAI TAY cùng lúc.
  - Nhịp 4: NGHỈ (không vỗ tay nào).
- Lặp lại 10 lần liên tục mà không bị khựng. Bài này rèn luyện sự luân phiên độc lập của 2 bán cầu não.

**2. TÙY CHỌN [Phương pháp: Luyện tập Tưởng tượng / Mental Play]**
- **Tư thế:** Ngồi thả lỏng ở bất kỳ đâu, nhắm mắt lại.
- **Tưởng tượng:** Hãy hình dung bàn phím piano đang hiện ra rõ nét trước mắt. Đặt 5 ngón tay phải lên các phím C-D-E-F-G.
- **Động tác:** Trong đầu, tưởng tượng bấm phím Đô (C). Cố gắng "nghe" thấy âm thanh nốt Đô vang lên. Sau đó tưởng tượng bấm nốt Sol (G). Cảm nhận độ nặng của phím đàn ảo. Điều này giúp hình thành bản đồ phím đàn trong não cực kỳ vững chắc!

## Bài tập 2D: Khởi động luân phiên
Ở bài tập này, bạn sẽ đếm nhịp "1-2-3-4". Tay trái và tay phải sẽ thay phiên nhau lên tiếng. 
Hãy copy mã ABC dưới đây vào trình phát nhạc nhé:

```abc
X: 1
T: Bài tập 2D - Luân phiên 2 tay
C: Gia sư Piano
M: 4/4
L: 1/4
Q: 1/4=70
%%staves {1 2}
K: C
V: 1 clef=treble
z2 "Phải"C D | E2 z2 | z2 G F | E4 |]
w: (nghỉ) Do Re | Mi (nghỉ) | (nghỉ) Sol Pha | Mi
V: 2 clef=bass
"Trái"C, D, z2 | z2 E,2 | C, D, z2 | C,4 |]
w: Do Re (nghỉ) | (nghỉ) Mi | Do Re (nghỉ) | Do
```
*(Mẹo: Ký hiệu `z` trong bản nhạc gọi là "Dấu lặng", tức là bạn giữ im lặng và không bấm phím nào cả).*

## Bài tập 2E: Hội thoại âm nhạc
Hãy tưởng tượng hai tay đang nói chuyện với nhau. Tay trái hỏi, tay phải trả lời.

```abc
X: 2
T: Bài tập 2E - Hội thoại âm nhạc
C: Gia sư Piano
M: 4/4
L: 1/4
Q: 1/4=70
%%staves {1 2}
K: C
V: 1 clef=treble
z2 "Phải"E F | G2 z2 | z2 F E | D4 |]
V: 2 clef=bass
"Trái"C, D, z2 | z2 E,2 | D, C, z2 | z4 |]
```

## Bài tập 2F: Thử thách đan xen liên tục
Tay trái đánh 1 nốt, tay phải đánh 1 nốt xen kẽ nhau liên tục. Tập siêu chậm bài này nhé!

```abc
X: 3
T: Bài tập 2F - Đan xen liên tục
C: Gia sư Piano
M: 4/4
L: 1/4
Q: 1/4=60
%%staves {1 2}
K: C
V: 1 clef=treble
z "Phải"D z F | z G z2 | z F z D | C2 z2 |]
V: 2 clef=bass
"Trái"C, z E, z | C, z z2 | D, z G,, z | C,2 z2 |]
```

## Thực hành tự do & Luyện tai (5 phút)

**Thử thách Thẩm âm (Ear Training) — Tay nào vừa đánh?**
- Nhắm mắt, hai tay đặt sẵn ở vị trí quen thuộc (tay phải ở Đô giữa, tay trái ở Đô thấp).
- Bấm **một nốt bất kỳ**, lúc bằng tay trái lúc bằng tay phải, hoàn toàn ngẫu nhiên.
- Không mở mắt, tự nói to: **"Trái!"** hay **"Phải!"**.
- Làm 10 lần.

*Nghe có vẻ hiển nhiên vì bạn tự bấm nên biết trước. Mẹo là hãy bấm thật nhanh không suy nghĩ, rồi mới nghe và phán đoán — tai bạn đang học phân biệt **âm khu trầm và âm khu cao**, kỹ năng cần thiết khi sau này đọc khuông nhạc kép.*

**Tự do:** Đánh Bài 2D thật chậm, tập trung vào khoảnh khắc "chờ đến lượt" của mỗi tay.

## Yêu cầu thực hành
1. Mở đàn, khởi động bằng cách đánh lại Bài 2A và 2B trong 5 phút để làm nóng ngón tay.
2. Bắt đầu tập Bài 2D, 2E, 2F cực kỳ chậm. Chú ý lúc nào tay phải đánh, lúc nào tay trái đánh. 
3. Hãy kiên nhẫn, việc "chờ" đến lượt tay mình đánh đôi khi khó hơn là đánh cả 2 tay cùng lúc. Đánh đi đánh lại 15 lần.
