/*
 * Chép âm thanh từ micro ra luồng chính, từng khúc 1024 mẫu (~21ms).
 *
 * Chạy trên luồng âm thanh riêng của trình duyệt (AudioWorklet), nên dù trang
 * đang bận vẽ lại bản nhạc thì cũng không rơi mẫu nào. Việc nhận nốt KHÔNG làm ở
 * đây — nó nằm ở `src/lib/mic-listener.ts` trên luồng chính, để vitest kiểm được.
 *
 * File nằm trong `public/` vì AudioWorklet chỉ nạp được từ một địa chỉ riêng,
 * không đi qua bộ đóng gói của Next.js. Đổi tên file thì sửa cả `useMicInput.ts`.
 */
class PjMicCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(1024);
    this.filled = 0;
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel) {
      for (let i = 0; i < channel.length; i++) {
        this.buffer[this.filled++] = channel[i];
        if (this.filled === this.buffer.length) {
          this.port.postMessage(this.buffer, [this.buffer.buffer]);
          this.buffer = new Float32Array(1024);
          this.filled = 0;
        }
      }
    }
    // Trả về true để trình duyệt giữ bộ xử lý sống cả khi micro im lặng một lúc.
    return true;
  }
}

registerProcessor('pj-mic-capture', PjMicCapture);
