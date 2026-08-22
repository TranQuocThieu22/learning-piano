<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Quyết định sản phẩm đã chốt

Đọc `docs/06-quyet-dinh/` trước khi đề xuất tính năng mới. Thư mục này **hiển thị trên web** (mục "Ghi chú" ở sidebar) nên hãy viết cho người học đọc, không viết theo văn phong tài liệu kỹ thuật nội bộ. Các quyết định đã chốt:

- **Không làm piano ảo bấm chuột/chạm màn hình** — xem `docs/06-quyet-dinh/khong-lam-piano-ao.md`. Lý do ngắn gọn: giáo trình dạy kỹ thuật vật lý (form tay, độc lập ngón, lực đánh) mà bàn phím ảo không rèn được, lại tạo cảm giác sai về tiến bộ và cạnh tranh thời gian với cây đàn thật người học đang có. Hai hướng thay thế được chấp nhận là **bài luyện nhận nốt** và **kết nối Web MIDI với đàn thật**.
- **Không dùng tệp để theo dõi tiến độ** — tiến độ được ghi bằng cách tick bài trên trang `/nhat-ky`, lưu vào database theo tài khoản Google. Thư mục `docs/05-learning-logs` và quy trình nộp video đã được gỡ bỏ, đừng tạo lại.
