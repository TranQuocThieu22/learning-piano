---
name: git-commit-messages
description: Soạn commit message tiếng Việt có dấu cho repo này. Mặc định chỉ in ra code block để người dùng tự dán vào Fork. Dùng khi người dùng nói "in commit message", "viết commit message", "soạn commit", hoặc vừa xong một thay đổi và cần ghi lại vào Git. Riêng khi người dùng nói "commit luôn" thì tự chạy git add/commit/push.
---

# Hai chế độ

Kỹ năng này có hai chế độ, phân biệt bằng đúng lời người dùng nói.

## Chế độ mặc định — chỉ in message

Khi người dùng nói "in commit message", "soạn commit", hoặc tương tự:

1. **KHÔNG chạy `git commit`, `git push`, hay bất kỳ lệnh git nào làm thay đổi.**
2. Chỉ in nội dung message trong code block để họ tự dán vào Fork.

## Chế độ "commit luôn" — tự chạy

Chỉ kích hoạt khi người dùng nói rõ **"commit luôn"** (hoặc "commit và push luôn").
Lúc đó tự làm trọn: đọc thay đổi, soạn message, `git add`, `git commit`, `git push`.

**Bốn việc bắt buộc trước khi commit, không được bỏ:**

1. **Đọc `git status` và `git diff`** — kể cả những thay đổi không phải mình tạo ra.
   Repo này thường có việc dở dang từ phiên khác; commit thứ mình chưa đọc là
   commit mù.
2. **Chạy đủ bốn lệnh kiểm**, vì repo đẩy thẳng `main` và Vercel deploy production
   ngay sau đó:

   ```bash
   npx next typegen && npx tsc --noEmit
   pnpm lint
   pnpm test
   pnpm check:lessons
   ```

   `next typegen` là bắt buộc: `next-env.d.ts` nằm trong `.gitignore` nên máy vừa
   checkout xong chạy `tsc` một mình sẽ trượt.
3. **Có lệnh nào đỏ thì DỪNG**, báo người dùng, không commit.
4. **Tách commit theo chủ đề**, đừng gom hết vào một. Nếu các thay đổi thuộc nhiều
   nhóm khác nhau thì commit nhiều lần.

**Sau khi push:** báo lại mã commit và nhắc CI ở `.github/workflows/ci.yml` đang
chạy — nó là lưới thứ hai, và nó báo *sau* khi commit đã nằm trong lịch sử.

> **Vì sao chế độ này từng bị cấm.** Repo commit thẳng vào `main`, nên trước đây
> lần đọc diff của người dùng là lưới đỡ duy nhất. Nay đã có GitHub Actions gác đủ
> bốn lệnh trên mọi lần đẩy, nên rủi ro giảm hẳn — nhưng CI báo sau khi commit đã
> vào lịch sử, nên bốn bước trên vẫn phải làm tại máy trước.

# Instructions


Phần dưới đây áp cho **cả hai chế độ**.

# Language Requirements (CRITICAL)
- **Vietnamese WITH full diacritics (có dấu).** Write "Gỡ bỏ mục Nhật ký", never "Go bo muc Nhat ky". Unaccented Vietnamese is a violation of this skill, not an acceptable shortcut — it does not matter that the terminal, the shell, or the tooling might display accents imperfectly.
- This matches the existing commit history of this repository, for example:
  - `Mở khóa Bài học mới: Khóa Pha (Bass Clef)`
  - `Đồng bộ hóa Lộ trình và Mở rộng Giáo trình`
  - `Tái cấu trúc Lộ trình học thuật: Chuyển đổi từ "Bài-Ngày" sang "Chương-Bài"`
- A Conventional Commits prefix (`feat:`, `fix:`, `docs:`, `chore:`, `style:`, `refactor:`) is optional and matches part of the existing history. If used, keep the prefix itself in English and write everything after it in accented Vietnamese.
- Technical identifiers stay unchanged in their original form: file paths, function names, environment variables, package names, and error strings (e.g. `src/lib/markdown.ts`, `DATABASE_URL`, `drizzle-kit`, `error=Configuration`).

# Format
- Title: one short line, imperative mood, ideally under 72 characters.
- Body (only when the change genuinely needs explanation): a blank line after the title, then bullet points starting with `- `. Explain **why**, not just what.
- Do not append `Co-Authored-By` or any AI attribution trailer unless the user explicitly asks for one.

# Output Shape
Output exactly one fenced code block containing only the message text, and nothing else inside that block:

```
feat: Thêm đăng nhập Google và Nhật ký học tập

- Thay thế quy trình nộp video bằng cơ chế tick "đã học xong" từng bài
- Lưu tiến độ theo tài khoản Google trong bảng lesson_completion
- Gỡ bỏ docs/04-submissions và progress.md
```

Never wrap it as `git commit -m "..."`, and never present it as a shell command the user should run.
