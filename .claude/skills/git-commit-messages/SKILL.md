---
name: git-commit-messages
description: Soạn commit message tiếng Việt có dấu cho repo này và chỉ in ra dưới dạng code block để người dùng tự dán vào Fork. Dùng khi người dùng nói "in commit message", "viết commit message", "soạn commit", hoặc vừa xong một thay đổi code/bài học và cần ghi lại vào Git. Không tự chạy git commit.
---

# Instructions
When the user asks for a commit message to track their learning progress or code changes:
1. DO NOT run `git commit` or any git commands automatically.
2. The commit message MUST be written in Vietnamese (Tiếng Việt).
3. Only output the raw text of the commit message (Title and Body, if any) inside a markdown code block so the user can easily copy and paste it into their Git GUI client (e.g., Fork). Do NOT include the `git commit -m` command.

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
