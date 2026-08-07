---
name: Daily Practice Structure
description: Triggers when the user asks for a new day's lesson or how to practice for the day.
---

# Multi-day Lessons & Progress Tracking
- A single "Bài" (Lesson) can span multiple days of practice.
- Keep track of the current lesson and day in a file named `01-roadmap/progress.md`. If it doesn't exist, create it.
- When the user asks for a new day of practice but wants to stay on the same lesson (e.g., Lesson 2, Day 2), DO NOT create a new `lesson-XX.md` file. Instead, rely on the existing lesson and generate a NEW exercise file for that specific day (e.g., `03-exercises/exercise-02-day-02.md`). 
- **TEACHING METHOD FOR CONSECUTIVE DAYS**: If Day 2 (or Day 3) is on the same Lesson topic as Day 1, you MUST provide **different** exercises, new variations, or slightly extended theory that still revolves around the same core topic. For example, if Day 1 is "Playing both hands together", Day 2 could be "Alternating hands", and Day 3 could be "Changing rhythm patterns". Do not just repeat Day 1's exact exercises. Gradually increase the difficulty.
- **CRITICAL**: The Title (Heading 1) of the new exercise file MUST follow the exact format: `# Bài tập [X] - Ngày [Y]: [Chủ đề]`. (For example: `# Bài tập 2 - Ngày 2: Luyện nhịp điệu luân phiên`). This ensures the UI can parse it and group it into a 3-level menu (Bài tập 2 -> Ngày 2).
- Always log the previous day's results in `05-learning-logs`.

# Daily Practice Structure
When giving instructions for a daily piano practice session, you MUST structure the lesson to fit a 30-45 minute timeframe, divided into the following sections:

1. **Khởi động & Ôn tập (5-10 phút)**: 
   - Reviewing the previous day's theory or doing simple finger warm-ups.
2. **Học kiến thức / Kỹ năng mới (15-20 phút)**: 
   - Core practice. Focusing intensely on the new skill for the day (e.g., finding new notes, learning a new rhythm).
   - Emphasize taking breaks if hands get tense.
3. **Thực hành tự do / Tổng kết (5-10 phút)**:
   - Playing through the exercise slowly without stopping, or just exploring the keyboard freely.
   - Remind the user to record a submission if applicable.
4. **Bài tập Không cần đàn / Away from piano (Tùy chọn, làm lúc rảnh rỗi)**:
   - Provide a short mental or physical exercise the user can do when NOT sitting at the piano. 
   - Examples: tapping fingers on a table to practice rhythm, reading sheet music mentally, visualizing finger placements, or tapping out independence exercises on the lap.

Always remind the user that **quality over quantity** is key. 30 minutes of highly focused practice is better than 2 hours of mindless playing.
