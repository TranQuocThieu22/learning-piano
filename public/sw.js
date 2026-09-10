/*
 * Service worker tối thiểu — tồn tại để mở khoá lời mời cài đặt, KHÔNG để cache.
 *
 * Vì sao cần: Chrome chỉ phát sự kiện `beforeinstallprompt` khi trang có service
 * worker đăng ký một `fetch` handler. Thiếu nó thì trên Android không có cách nào
 * mời người học thêm web vào màn hình chính — họ phải tự mò trong menu trình duyệt,
 * và gần như không ai làm.
 *
 * Vì sao KHÔNG cache gì: repo này đẩy thẳng `main` và Vercel deploy production
 * ngay sau đó, nhiều lần một ngày. Một service worker có cache sẽ phục vụ lại bài
 * học cũ sau khi nội dung đã sửa, và triệu chứng là "sửa rồi mà trang không đổi" —
 * loại lỗi tốn hàng giờ để tìm ra vì nó chỉ xảy ra trên máy đã từng vào trang.
 * Cái giá phải trả cho việc không cache là không chạy được ngoại tuyến; đổi lại
 * người học luôn thấy đúng nội dung mới nhất. Với giáo trình đang được viết tiếp
 * hàng tuần thì đó là đánh đổi đúng.
 *
 * Muốn thêm cache về sau thì phải kèm cơ chế tự cập nhật, và đọc lại đoạn trên.
 */

// Nhận quyền điều khiển ngay, không chờ tab cũ đóng. Nếu sau này file này đổi,
// bản mới có hiệu lực ngay lần tải kế tiếp chứ không nằm chờ vô thời hạn.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

/*
 * Handler rỗng là CỐ Ý. Chrome chỉ kiểm tra rằng có handler, không kiểm tra nó
 * làm gì. Không gọi `event.respondWith` nên trình duyệt đi đường mạng bình thường
 * — không thêm một chặng trung gian, không đụng tới request dạng range (thứ mà
 * phần phát tiếng đàn cần), không có gì để hỏng.
 */
self.addEventListener('fetch', () => {});
