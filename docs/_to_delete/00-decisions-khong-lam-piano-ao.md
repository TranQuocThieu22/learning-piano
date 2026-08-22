# Quyết định: Không phát triển Piano ảo trên web

- **Ngày quyết định:** 22/08/2026
- **Trạng thái:** Đã chốt — không làm
- **Phạm vi:** Tính năng bàn phím piano ảo cho phép bấm chuột / chạm màn hình để phát ra tiếng đàn

## Bối cảnh

Ý tưởng được cân nhắc là dựng một bàn phím piano ảo ngay trên web, để người học có thể bấm thử nốt mà không cần ngồi vào đàn thật.

## Quyết định

**Không phát triển tính năng này.**

## Lý do

**1. Nó không tập được thứ mà giáo trình đang dạy.**
Toàn bộ Chương 1 đến Chương 6 xoay quanh **kỹ thuật vật lý**: giữ bàn tay khum tròn, rèn ngón áp út độc lập, không gồng vai, cảm nhận sức nặng cánh tay khi đánh mạnh nhẹ, giữ phím đủ trường độ. Bấm chuột hay chạm màn hình **không rèn được bất kỳ điều nào trong số đó** — không có lực phím, không có phản hồi xúc giác, không có độc lập ngón tay.

**2. Nó tạo cảm giác sai về sự tiến bộ.**
Người học dễ nhầm việc bấm đúng nốt trên màn hình là "đã tập bài", trong khi thực chất chưa hề luyện được phần khó nhất là điều khiển cơ thể. Điều này nguy hiểm hơn là không có gì, vì nó rút ngắn thời gian ngồi trước đàn thật.

**3. Đã có đàn thật.**
Người học sở hữu một cây Roland FP-30X. Một bàn phím ảo chỉ cạnh tranh sự chú ý với chính nhạc cụ thật.

**4. Nhu cầu "nghe thử bài tập" đã được đáp ứng.**
Các khối ABC notation trong bài tập đã tự phát được âm thanh qua abcjs, nên không cần thêm một nhạc cụ ảo chỉ để nghe giai điệu mẫu.

## Những hướng thay thế được đánh giá là đáng làm

Việc bác bỏ piano ảo **không đồng nghĩa với bác bỏ hình bàn phím tương tác**. Có hai hướng giữ lại được phần giá trị mà không mắc các nhược điểm trên:

**A. Bài luyện nhận nốt (ưu tiên cao, khối lượng nhỏ)**
Hiện một nốt trên khuông nhạc, người học bấm phím tương ứng trên hình bàn phím, hệ thống chấm đúng/sai và đo thời gian phản xạ. Việc này **thuần túy là ánh xạ mắt → tên nốt → vị trí phím**, không liên quan tới kỹ thuật ngón, nên hoàn toàn phù hợp với thao tác chuột/chạm. Tương tự cho bài luyện tai (thẩm âm), vốn hiện đang bắt buộc phải ngồi trước đàn.

**B. Kết nối Web MIDI với đàn thật (giá trị cao nhất, khối lượng lớn)**
FP-30X hỗ trợ USB MIDI và Bluetooth MIDI. Trình duyệt Chrome/Edge có Web MIDI API (Safari không hỗ trợ). Hướng này cho phép app **đọc trực tiếp nốt người học bấm trên đàn thật**, tự chấm đúng nốt và đúng nhịp hay chưa. Đây là cách duy nhất vừa giữ được đàn thật và kỹ thuật thật, vừa có phản hồi tự động — đóng đúng vai trò "gia sư chấm bài" mà quy trình nộp video trước đây đảm nhiệm. Nên dùng dây USB thay vì Bluetooth cho ổn định.

## Điều kiện xem xét lại

Quyết định này nên được mở lại nếu xuất hiện một trong các tình huống sau:

- Người học **không còn sở hữu đàn thật** và cần một phương án tạm thời để duy trì thói quen.
- App được mở rộng cho đối tượng **chưa mua đàn**, dùng piano ảo như bản dùng thử để tạo động lực mua nhạc cụ.
- Xuất hiện phần cứng cho phép mô phỏng lực phím ở mức chấp nhận được.

Trong mọi trường hợp, nếu làm lại thì phải kèm cảnh báo rõ ràng rằng piano ảo **không thay thế được việc tập trên đàn thật**.
