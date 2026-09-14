# Chương 3: Đọc bản nhạc (Sight-reading) cơ bản

> **Nên tập thử trước khi đọc trang này.** Mỗi bài tập đã có khuông nhỏ chỉ nốt nằm ở đâu — mở **[Chương 3 - Bài 1](/03-exercises/chuong-03-bai-01)** và đánh thử. Trang này dành cho lúc bạn tập mà thấy khó hiểu, hoặc muốn biết vì sao phải làm vậy.

Chào mừng bạn đến với Chương 3! Ở 2 chương trước, bạn đã chơi nhạc chủ yếu dựa vào việc nhìn phím đàn và nhìn tên nốt (C, D, E...) ghi trên giấy. Đó là cách rất tốt để làm quen.

Tuy nhiên, ngôn ngữ quốc tế của âm nhạc là **Khuông nhạc**. Việc đọc được các nốt nhạc "nhảy múa" trên 5 dòng kẻ sẽ giúp bạn có thể tự đánh bất cứ bài hát nào bạn thích sau này mà không cần ai dạy.

## 1. Khóa Sol (Treble Clef) - Dành cho Tay Phải
Khóa Sol thường dùng để ghi lại những âm thanh cao (tay phải).
- **Quy tắc Bàn tay:** Hãy xòe 5 ngón tay phải ra, tượng trưng cho 5 dòng kẻ.
- **Các nốt nằm trên Dòng kẻ (Lines):** Mi - Sol - Si - Rê - Pha (Mẹo nhớ tiếng Anh: Every Good Boy Does Fine).

```abc
X: 101
T: Khóa Sol - Các nốt trên DÒNG KẺ
M: 4/4
L: 1/4
K: C
E G B d | f4 |]
w: Mi Sol Si Re Pha
```

- **Các nốt nằm trong Khe hở (Spaces):** Pha - La - Đô - Mi (Mẹo nhớ: F-A-C-E).

```abc
X: 102
T: Khóa Sol - Các nốt trong KHE HỞ
M: 4/4
L: 1/4
K: C
F A c e |]
w: Pha La Do Mi
```

- **Nốt Đô Giữa (Middle C):** Nằm trên một dòng kẻ phụ ngắn xíu, rớt xuống bên dưới dòng kẻ số 1.

## 2. Khóa Pha (Bass Clef) - Dành cho Tay Trái
Khóa Pha dùng để ghi lại những âm thanh trầm ấm (tay trái).
- **Các nốt nằm trên Dòng kẻ (Lines):** Sol - Si - Rê - Pha - La (Mẹo nhớ: Good Boys Do Fine Always).

```abc
X: 103
T: Khóa Pha - Các nốt trên DÒNG KẺ
M: 4/4
L: 1/4
K: C
V: 1 clef=bass
G,, B,, D, F, | A,4 |]
w: Sol Si Re Pha La
```

- **Các nốt nằm trong Khe hở (Spaces):** La - Đô - Mi - Sol (Mẹo nhớ: All Cows Eat Grass).

```abc
X: 104
T: Khóa Pha - Các nốt trong KHE HỞ
M: 4/4
L: 1/4
K: C
V: 1 clef=bass
A,, C, E, G, |]
w: La Do Mi Sol
```

*(Bạn không cần phải nhớ hết tất cả ngay hôm nay đâu!)*

## 3. Vì sao một tên nốt lại xuất hiện ở nhiều chỗ?

Đọc kỹ hai phần trên, bạn sẽ thấy nốt **Pha** xuất hiện tới **ba lần** ở ba vị trí khác nhau. Đây không phải lỗi in ấn, và cũng là chỗ khiến hầu hết người mới khựng lại.

Lý do: trên đàn piano chỉ có **bảy chữ cái A-B-C-D-E-F-G**, và chúng lặp đi lặp lại suốt chiều dài cây đàn. Mỗi lần lặp lại như vậy gọi là một **quãng tám (octave)**. Vì thế cùng mang tên "Pha" nhưng chúng là những phím khác nhau, nghe cao thấp khác nhau:

| Vị trí trên khuông nhạc | So với Đô giữa |
|---|---|
| Khóa Pha, **dòng kẻ thứ 4** | Thấp hơn Đô giữa |
| Khóa Sol, **khe hở thứ 1** | Cao hơn Đô giữa một chút |
| Khóa Sol, **dòng kẻ thứ 5** (trên cùng) | Cao hơn nhiều |

Trên bàn phím, hai trong ba nốt Pha đó nằm như thế này — cùng một chữ, cách nhau đúng một quãng tám:

```keys
F3 F4
Cùng tên Pha, cách nhau một quãng tám. Hình dạng phím đen quanh chúng lặp lại y hệt.
```

Hãy nghe thử ba nốt Pha đó vang lên lần lượt từ thấp đến cao:

```abc
X: 105
T: Ba nốt Pha ở ba quãng tám khác nhau
M: 4/4
L: 1/4
Q: 1/4=70
%%score { 1 | 2 }
K: C
V:1 clef=treble
V:2 clef=bass
[V:1] z4 | F4 | f4 |]
[V:2] F,4 | z4 | z4 |]
```

Ba ô nhịp, mỗi ô một nốt Pha: ô đầu ở khuông dưới (tay trái), hai ô sau ở khuông trên (tay phải).
Cùng một chữ Pha, mà mỗi lần lại cao hơn lần trước đúng một quãng tám.

**👉 Điều cần nhớ:** khi đọc một nốt, đừng chỉ hỏi "nốt gì" mà phải hỏi **"nốt gì, và nằm ở khuông nào"**. Cùng chữ Pha nhưng ở Khóa Pha thì tay trái chơi, ở Khóa Sol thì tay phải chơi.

---
**Nhớ một điều thôi:** mắt ở bản nhạc, để ngón tay tự tìm phím.

**👉 Về tập tiếp: [Chương 3 - Bài 1: Đọc nốt trên dòng kẻ phụ](/03-exercises/chuong-03-bai-01)**
