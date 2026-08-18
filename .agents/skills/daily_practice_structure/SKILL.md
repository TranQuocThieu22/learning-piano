---
name: Daily Practice Structure
description: Triggers when the user asks for a new day's lesson or how to practice for the day.
---

# Multi-day Lessons & Progress Tracking
- The curriculum is structured into **Chương** (Chapter/Module) and **Bài** (Lesson/Topic).
- Keep track of the current chapter and lesson in a file named `docs/01-roadmap/progress.md`. If it doesn't exist, create it.
- **NEW LESSON ESTIMATION**: Whenever you introduce a BRAND NEW lesson (e.g., Chương 2 - Bài 1), you MUST evaluate the complexity of the lesson's core topic. Then, explicitly tell the user your estimation of how many days (e.g., "This topic takes 3 days to master" - provide ONE specific number, NOT a range like "2-3 days") they should spend practicing this specific lesson before moving on.
- When the user asks for a new day of practice but they haven't finished the estimated days for the current lesson, DO NOT create a new lesson file. Instead, advise them to continue repeating the current lesson's routine to build muscle memory.
- **CRITICAL FILE NAMING**: Exercise files MUST be named using the `chuong-XX-bai-YY.md` format (e.g., `docs/03-exercises/chuong-03-bai-01.md`). This ensures files sort correctly in the file explorer and Next.js menu.
- **CRITICAL**: The Title (Heading 1) of the new exercise file MUST follow the exact format: `# Chương [X] - Bài [Y]: [Chủ đề]`. (For example: `# Chương 2 - Bài 1: Nhịp điệu và Phối hợp 2 tay`). This ensures the UI can parse it and group it into a 3-level menu (Exercises -> Chương 2 -> Bài 1).
- Always log the previous session's results in `docs/05-learning-logs`.

# Daily Practice Structure
When giving instructions for a daily piano practice session, you MUST structure the lesson to fit a 30-45 minute timeframe, divided into the following sections:

1. **Bài tập Không cần đàn / Away from piano (Tập ban ngày lúc rảnh rỗi)**:
   - **MANDATORY**: ALWAYS include a **Tapping/Rhythm (Bài tập mặt bàn)** exercise. This is crucial for beginners to build finger independence and rhythm.
   - **OPTIONAL ADDITION**: You MUST also add **ONE (1) additional optional method** from the list below to keep things fresh:
     - **Mental Play / Visualization (Luyện tập Tưởng tượng)**: Closing eyes and vividly imagining the hands, keys, and sounds of the piece.
     - **Score Study (Đọc chay bản nhạc)**: Reading the sheet music (or ABC notation) like a book, saying note names and clapping the rhythm.
     - **Solfège/Singing (Hát giai điệu)**: Singing or humming the melody of the exercise to internalize the pitch and rhythm before playing.
     - **Music Copying / Dictation (Chép nốt nhạc ra giấy)**: Drawing a 5-line staff and manually writing down notes, clefs, or composing short melodies on paper to build deep visual memory.
2. **Khởi động & Ôn tập trên đàn (5-10 phút)**: 
   - Reviewing the previous day's theory or doing simple finger warm-ups.
3. **Học kiến thức / Kỹ năng mới trên đàn (15-20 phút)**: 
   - Core practice. Focusing intensely on the new skill for the day (e.g., finding new notes, learning a new rhythm).
   - **MANDATORY**: You MUST generate at least **3 to 4 varied exercises (ABC notation blocks)** per lesson. Do not just provide 1 exercise. Provide a warm-up exercise (e.g., Bài tập A), a familiar melody or variation (e.g., Bài tập B), and a slightly more challenging pattern (e.g., Bài tập C). This ensures the user has enough material to practice for 15-20 minutes without getting bored.
   - Emphasize taking breaks if hands get tense.
4. **Thực hành tự do / Tổng kết (5-10 phút)**:
   - Playing through the exercise slowly without stopping, or just exploring the keyboard freely.
   - Remind the user to record a submission if applicable.

Always remind the user that **quality over quantity** is key. 30 minutes of highly focused practice is better than 2 hours of mindless playing.
