# Chương 2: Nhịp điệu và Phối hợp 2 tay

> **Đây là bài đọc thêm, không bắt buộc.** Bài tập đã ghi sẵn nốt nào giữ mấy nhịp. Muốn tập ngay thì mở **[Chương 2 - Bài 1](/03-exercises/chuong-02-bai-01)**.

Bốn buổi của Chương 1 đã cho bạn năm nốt C-D-E-F-G và một bản nhạc hoàn chỉnh chơi bằng một tay. Chương này thêm hai thứ: **nhịp điệu (trường độ)** — nốt dài nốt ngắn — và lần đầu tiên bạn cho **hai tay đánh cùng lúc**.

## 1. Các loại hình nốt cơ bản (Trường độ)
Âm nhạc không chỉ có nốt cao hay thấp, mà còn có nốt dài hay ngắn. 
Trong bài này, chúng ta làm quen với 3 loại nốt phổ biến nhất:

1. **Nốt Đen (Quarter note):** 
   
   ![Nốt Đen](/images/chuong-02/quarter.svg)
   - Hình dáng: Bầu dục đặc ruột, có đuôi.
   - Giá trị: **1 nhịp** (đập chân 1 cái).
   
2. **Nốt Trắng (Half note):**

   ![Nốt Trắng](/images/chuong-02/half.svg)
   - Hình dáng: Bầu dục rỗng ruột, có đuôi.
   - Giá trị: **2 nhịp** (đánh xuống và giữ nguyên tay trong 2 nhịp đập chân).
   
3. **Nốt Tròn (Whole note):**

   ![Nốt Tròn](/images/chuong-02/whole.svg)
   - Hình dáng: Bầu dục rỗng ruột, không đuôi. Trông giống quả trứng.
   - Giá trị: **4 nhịp** (đánh xuống và giữ nguyên tay đủ 4 nhịp đập).

Ba hình nốt đó đứng cạnh nhau trên khuông nhạc thật trông như sau — chữ dưới mỗi nốt là số nhịp bạn đếm khi giữ nó:

```abc
X: 201
T: Nốt đen, nốt trắng, nốt tròn
M: 4/4
L: 1/4
K: C
C C C C | D2 D2 | E4 |]
w: 1 2 3 4 1~2 3~4 1~2~3~4
```

Để ý: cả ba ô nhịp đều dài bằng nhau. Ô đầu bốn nốt đen, ô giữa hai nốt trắng, ô cuối một nốt tròn — cùng một khoảng thời gian, chỉ khác số lần bạn bấm xuống.

*Mẹo: Khi đếm nhịp, hãy đếm đều đặn: "1 - 2 - 3 - 4" giống như tiếng kim giây đồng hồ.*

## 2. Phối hợp 2 tay (Cơ bản)
Hôm qua bạn đã tập từng tay riêng biệt. Hôm nay, chúng ta sẽ bắt hai tay đánh cùng một lúc.
- Ban đầu sẽ hơi ngượng ngùng vì não bộ phải xử lý 2 việc cùng lúc.
- Bí quyết là: **TẬP THẬT CHẬM**. Đừng vội vàng.

Hai tay cùng đánh thì bản nhạc có **hai khuông chồng lên nhau**: khuông trên cho tay phải, khuông dưới cho tay trái. Đọc theo chiều dọc — nốt nào thẳng hàng nhau thì bấm cùng lúc:

```abc
X: 202
T: Hai tay cùng đánh - đọc theo chiều dọc
M: 4/4
L: 1/4
%%score { 1 | 2 }
V:1 clef=treble
V:2 clef=bass
[V:1] C D E D | C4 |]
[V:2] C,4 | C,4 |]
```

Tay trái ở đây chỉ giữ đúng một nốt dài suốt cả ô nhịp, trong khi tay phải đi bốn nốt. Đó là kiểu phối hợp dễ nhất, và cũng là kiểu bạn gặp trong bài tập sắp tới.

---
**Nhớ một điều thôi:** nốt đen 1 nhịp, nốt trắng 2 nhịp, nốt tròn 4 nhịp — và đếm to thành tiếng khi đánh.

**👉 Về tập tiếp: [Chương 2 - Bài 1: Nhịp điệu và Phối hợp 2 tay](/03-exercises/chuong-02-bai-01)**
