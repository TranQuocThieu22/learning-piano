---
name: Daily Practice Structure
description: Triggers when the user asks for a new day's lesson or how to practice for the day.
---

# Multi-day Lessons & Progress Tracking
- The curriculum is structured into **Chương** (Chapter/Module) and **Bài** (Lesson/Topic).
- **PROGRESS IS TRACKED IN THE APP, NOT IN A FILE.** The user marks a lesson done by ticking it on the **Nhật ký học tập** page (`/nhat-ky`), which saves to the database against their Google account. Do NOT create or update `docs/01-roadmap/progress.md` — that file has been removed and the submission workflow no longer exists. Never tell the user to record or submit a video.
- To find out where the user currently is, ASK them which lesson they last ticked. Do not assume, and do not look for a progress file — there isn't one.
- **NEW LESSON ESTIMATION**: Whenever you introduce a BRAND NEW lesson (e.g., Chương 2 - Bài 1), you MUST evaluate the complexity of the lesson's core topic. Then, explicitly tell the user your estimation of how many days (e.g., "This topic takes 3 days to master" - provide ONE specific number, NOT a range like "2-3 days") they should spend practicing this specific lesson before moving on.
- When the user asks for a new day of practice but they haven't finished the estimated days for the current lesson, DO NOT create a new lesson file. Instead, advise them to continue repeating the current lesson's routine to build muscle memory.
- **CRITICAL FILE NAMING**: Exercise files MUST be named using the `chuong-XX-bai-YY.md` format (e.g., `docs/03-exercises/chuong-03-bai-01.md`). This is not just for sorting — the app parses lessons with the regex `/^chuong-(\d+)-bai-(\d+)$/` in `src/lib/lessons.ts`. **A file that does not match this pattern is silently dropped from the Nhật ký page and can never be ticked.** This applies to Recital/Tổng ôn lessons too: name them `chuong-03-bai-06.md`, never `recital-01.md`.
- **CRITICAL**: The Title (Heading 1) of the new exercise file MUST follow the exact format: `# Chương [X] - Bài [Y]: [Chủ đề]`. (For example: `# Chương 2 - Bài 1: Nhịp điệu và Phối hợp 2 tay`). This ensures the UI can parse it and group it into a 3-level menu (Exercises -> Chương 2 -> Bài 1).
- **Do NOT create learning-log files.** The `docs/05-learning-logs` folder has been retired along with the submission workflow — progress is now recorded solely by ticking lessons in the app.

# Musical Content Rules (CRITICAL)
- **NEVER use a note the user has not been taught yet.** Before writing any ABC block, check the reading vocabulary they actually have. As of Chương 3: right hand reads C-D-E-F-G (treble, middle C position), left hand reads C-D-E-F-G (bass, one octave below). Anything above G or below low C requires shifting the hand — a Chương 6 skill.
  - Concretely: **"Twinkle Twinkle" and "Happy Birthday" are NOT usable** in Giai đoạn 1 — both need the note A, outside the 5-finger position. "Jingle Bells", "Ode to Joy", "Mary Had a Little Lamb" and "Hot Cross Buns" all fit and are safe.
- **Verify every bar adds up.** In `M: 4/4` each bar must total exactly 4 quarter-notes; in `M: 3/4` exactly 3. Remember a whole note (`C4`) does NOT fit in a 3/4 bar — use a dotted half (`C3`) instead.
- Use `%%staves {1 2}` with `V: 1 clef=treble` / `V: 2 clef=bass` for Grand Staff exercises. Both voices must have the same number of bars.
- Keep ABC header fields (`T:`, `C:`) in unaccented ASCII to avoid rendering issues; the surrounding Vietnamese prose keeps full diacritics.

# Daily Practice Structure
When giving instructions for a daily piano practice session, you MUST structure the lesson to fit a 30-45 minute timeframe, divided into the following sections:

1. **Bài tập Không cần đàn / Away from piano (Tập ban ngày lúc rảnh rỗi)**:
   - **CRITICAL DETAIL REQUIREMENT**: When generating these exercises, DO NOT be generic or superficial. You MUST provide highly detailed, step-by-step physical instructions tailored EXACTLY to the new skill of the day. For example, if teaching leaps, specify exactly which fingers to lift and tap. If teaching music copying, describe exactly how to draw the clef and where to place the note on the 5 lines (e.g., "draw a circle cut by the first line").
   - **MANDATORY**: ALWAYS include a **Tapping/Rhythm (Bài tập mặt bàn)** exercise. This is crucial for beginners to build finger independence and rhythm.
   - **OPTIONAL ADDITION**: You MUST also add **ONE (1) additional optional method** from the list below to keep things fresh:
     - **Mental Play / Visualization (Luyện tập Tưởng tượng)**: Closing eyes and vividly imagining the hands, keys, and sounds of the piece.
     - **Score Study (Đọc chay bản nhạc)**: Reading the sheet music (or ABC notation) like a book, saying note names and clapping the rhythm.
     - **Solfège/Singing (Hát giai điệu)**: Singing or humming the melody of the exercise to internalize the pitch and rhythm before playing.
     - **Music Copying / Dictation (Chép nốt nhạc ra giấy)**: Drawing a 5-line staff and manually writing down notes, clefs, or composing short melodies on paper to build deep visual memory.
2. **Khởi động & Ôn tập trên đàn (5-10 phút)**:
   - Reviewing the previous day's theory or doing simple finger warm-ups. Name the SPECIFIC exercise from the previous lesson to replay.
3. **Học kiến thức / Kỹ năng mới trên đàn (15-20 phút)**:
   - Core practice. Focusing intensely on the new skill for the day (e.g., finding new notes, learning a new rhythm).
   - **MANDATORY**: You MUST generate at least **3 to 4 varied exercises (ABC notation blocks)** per lesson. Do not just provide 1 exercise. Provide a warm-up exercise (e.g., Bài tập A), a familiar melody or variation (e.g., Bài tập B), and a slightly more challenging pattern (e.g., Bài tập C). This ensures the user has enough material to practice for 15-20 minutes without getting bored.
   - Emphasize taking breaks if hands get tense.
4. **Thực hành tự do & Luyện tai (5-10 phút)**:
   - **MANDATORY: Every lesson MUST include an Ear Training (Thẩm âm) challenge.** The user currently trains eyes (reading) and hands (playing) but not ears. Pick one appropriate to the lesson, for example:
     - Close eyes, press a key, then sing "Aaaa" matching that exact pitch, then check.
     - Play two notes blind and guess whether the second is higher or lower, and by how many keys.
     - Play a major vs minor third blind and call out "Vui!" or "Buồn!".
     - Try to find a simple known melody by ear alone, without any sheet music.
   - Also include free playing: playing through slowly without stopping, improvising, or exploring the keyboard.

# Recital Milestones (Trạm dừng chân)
- After each major cluster of chapters (currently: after Chương 3, and planned after Chương 6), you MUST create a **Tổng ôn / Recital** lesson instead of a new-skill lesson.
- A Recital lesson: introduces **NO new skill**, gives 2-3 complete pieces that combine everything learned so far, opens by reminding the user how far they have come, and defines an explicit "pass" standard (e.g., "play the whole piece start to finish without stopping to fix mistakes").
- Name it as a normal lesson file (`chuong-03-bai-06.md`) so it appears on the Nhật ký page and can be ticked.

Always remind the user that **quality over quantity** is key. 30 minutes of highly focused practice is better than 2 hours of mindless playing.
