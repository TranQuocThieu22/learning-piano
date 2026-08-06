---
name: Generate Git Commit Messages
description: Triggers when the user asks for a commit message to track their learning progress or code changes.
---

# Instructions
When the user asks for a commit message to track their learning progress or code changes:
1. DO NOT run `git commit` or any git commands automatically.
2. The commit message MUST be written in Vietnamese (Tiếng Việt).
3. Only output the raw text of the commit message (Title and Body, if any) inside a markdown code block so the user can easily copy and paste it into their Git GUI client (e.g., Fork). Do NOT include the `git commit -m` command.
