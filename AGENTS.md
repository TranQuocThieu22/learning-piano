<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Quyết định sản phẩm đã chốt

Đọc `docs/06-quyet-dinh/` trước khi đề xuất tính năng mới. Thư mục này **hiển thị trên web** (mục "Ghi chú" ở sidebar) nên hãy viết cho người học đọc, không viết theo văn phong tài liệu kỹ thuật nội bộ. Các quyết định đã chốt:

- **Không làm piano ảo bấm chuột/chạm màn hình** — xem `docs/06-quyet-dinh/khong-lam-piano-ao.md`. Lý do ngắn gọn: giáo trình dạy kỹ thuật vật lý (form tay, độc lập ngón, lực đánh) mà bàn phím ảo không rèn được, lại tạo cảm giác sai về tiến bộ và cạnh tranh thời gian với cây đàn thật người học đang có. Hai hướng thay thế được chấp nhận là **bài luyện nhận nốt** và **kết nối Web MIDI với đàn thật**.
- **Không ép người học chơi theo bản nhạc chạy trực tiếp** — đây là lý do chính khiến người mới bỏ cuộc với các app chấm điểm tự động (xem mục 0 trong `docs/_internal/dinh-huong-kinh-doanh.md`). Người học tự quyết khi nào bắt đầu, dừng, tập lại đoạn nào, ở tốc độ nào. **Được phép:** phát nhạc mẫu để nghe, máy đánh nhịp do người học tự bật và tự chỉnh, chấm điểm kiểu đánh xong rồi xem lại. **Không được phép:** bản nhạc tự trôi bắt phải theo kịp, nốt rơi kiểu game, chấm đúng/sai thời gian thực gây áp lực. Ràng buộc này áp cho cả Web MIDI sau này.
- **Không nêu đích danh tên app hay khóa học của đối thủ** ở bất cứ đâu — tài liệu, nội dung web, trang bán hàng, quảng cáo. Luôn mô tả theo cách làm ("app chấm điểm tự động"), không theo tên thương hiệu. Lý do pháp lý ghi ở mục 0 trong `docs/_internal/dinh-huong-kinh-doanh.md`.
- **Không dùng tệp để theo dõi tiến độ** — tiến độ được ghi bằng cách tick bài trên trang `/nhat-ky`, lưu vào database theo tài khoản Google. Thư mục `docs/05-learning-logs` và quy trình nộp video đã được gỡ bỏ, đừng tạo lại.

# Định hướng kinh doanh

Trước khi đụng tới bất cứ thứ gì liên quan tới giá, gói bán, phân quyền hay thanh toán, **đọc `docs/_internal/dinh-huong-kinh-doanh.md`**.

Thư mục `_internal` **không hiển thị trên web** (nằm ngoài `contentDirs` trong `src/lib/markdown.ts`) — đây là tài liệu nội bộ, đừng đưa nội dung của nó ra giao diện người học.

Vài ràng buộc tuyệt đối, vi phạm là gây hậu quả thật:

- **Không bịa "giá gốc" gạch ngang** cho mức giá chưa từng bán, và **không dùng đồng hồ đếm ngược giả lập**. Khuyến mại ở Việt Nam chịu điều chỉnh của Nghị định 81/2018 (sửa đổi bởi 128/2024); bịa giá gốc là quảng cáo sai sự thật, có thể bị phạt và đình chỉ tên miền.
- **Không chạy thương mại trên gói Vercel Hobby** — gói miễn phí cấm dùng thương mại, tài khoản bị đình chỉ đồng nghĩa khách đã trả tiền mất quyền truy cập.
- **Không hứa cập nhật miễn phí trọn đời** cho nội dung chưa tồn tại. Giai đoạn 3 và 4 là **sản phẩm riêng**, không gộp vào gói Giai đoạn 1-2, và chỉ được quảng bá khi đã soạn xong.
