---
name: Daily Practice Structure
description: Triggers when the user asks for a new day's lesson or how to practice for the day.
---

# Multi-day Lessons & Progress Tracking
- A single "Bài" (Lesson) can span multiple days of practice.
- Keep track of the current lesson and day in a file named `01-roadmap/progress.md`. If it doesn't exist, create it.
- **NEW LESSON ESTIMATION**: Whenever you introduce Day 1 of a BRAND NEW lesson (e.g., Lesson 3, Day 1), you MUST evaluate the complexity of the lesson's core topic. Then, explicitly tell the user your estimation of how many days (e.g., "This topic takes 3 days to master" - provide ONE specific number, NOT a range like "2-3 days") they should spend practicing this specific lesson before moving on.
- When the user asks for a new day of practice but wants to stay on the same lesson (e.g., Lesson 2, Day 2), DO NOT create a new `lesson-XX.md` file. Instead, rely on the existing lesson and generate a NEW exercise file for that specific day (e.g., `03-exercises/exercise-02-day-02.md`). 
- **CRITICAL FILE NAMING**: Even for Day 1 of a new lesson, the exercise file MUST be named with the day suffix (e.g., `03-exercises/exercise-03-day-01.md`). This ensures files sort correctly in the file explorer and Next.js menu.
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
   - **MANDATORY**: ALWAYS include a **Tapping/Rhythm (Bài tập mặt bàn)** exercise. This is crucial for beginners to build finger independence and rhythm.
   - **OPTIONAL ADDITION**: You MUST also add **ONE (1) additional optional method** from the list below to keep things fresh:
     - **Mental Play / Visualization (Luyện tập Tưởng tượng)**: Closing eyes and vividly imagining the hands, keys, and sounds of the piece.
     - **Score Study (Đọc chay bản nhạc)**: Reading the sheet music (or ABC notation) like a book, saying note names and clapping the rhythm.
     - **Solfège/Singing (Hát giai điệu)**: Singing or humming the melody of the exercise to internalize the pitch and rhythm before playing.

Always remind the user that **quality over quantity** is key. 30 minutes of highly focused practice is better than 2 hours of mindless playing.
