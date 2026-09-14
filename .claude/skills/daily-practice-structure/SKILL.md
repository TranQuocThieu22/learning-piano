---
name: daily-practice-structure
description: Soạn bài học piano mới theo cấu trúc Chương/Bài của giáo trình này, kèm quy tắc đặt tên file chuong-XX-bai-YY.md, giới hạn nốt được phép dùng và bố cục buổi tập 30-45 phút. Dùng khi người dùng xin bài học mới, hỏi hôm nay tập gì, hoặc cần soạn bài Tổng ôn (Trạm dừng chân).
---

# Multi-day Lessons & Progress Tracking
- The curriculum is structured into **Chương** (Chapter/Module) and **Bài** (Lesson/Topic).
- **PROGRESS IS TRACKED IN THE APP, NOT IN A FILE.** The user marks a lesson done by ticking it on the **Nhật ký học tập** page (`/journal`), which saves to the database against their Google account. Do NOT create or update `docs/01-roadmap/progress.md` — that file has been removed and the submission workflow no longer exists. Never tell the user to record or submit a video.
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
- **Write ABC header fields (`T:`, `C:`) in proper Vietnamese WITH diacritics** — `T: Bài tập 4A - Pha và Sol Khóa Pha`, `C: Gia sư Piano`. abcjs renders diacritics correctly (verified in-browser); an earlier version of this rule claimed otherwise and was wrong. Unaccented Vietnamese on a paid product reads as sloppy, and the product sells on being Vietnamese. Song titles that are genuinely English stay as they are (`T: Jingle Bells - Grand Staff`).
- **Show it, don't only describe it.** Theory chapters ran almost entirely on prose until 12/09/2026 — learners skim walls of text. Two block types render as pictures, and both are checked by `pnpm test` / `pnpm check:lessons`, so a typo fails a gate instead of silently vanishing:
  - ```` ```keys ```` — a piano diagram of one hand shape. First line is the notes in international names (`C4 E4 G4`), the rest is an optional caption shown under the picture. Right for chords, hand positions, and any sentence that describes *which keys*.
  - ```` ```abc ```` — a real staff. Right for slurs, staccato dots, dynamics, rhythm — anything the learner must recognise *on paper*.

  Pick by what the learner needs to recognise: keys under the fingers, or marks on the page. A sentence like "ba ngón cách nhau đều đặn, giữa mỗi cặp có một phím trắng bỏ trống" is a picture pretending to be a paragraph.
- Run `pnpm check:lessons` after writing any lesson. It parses every ABC block with the same abcjs the app uses and fails on: bars that do not add up to `M:`, Grand Staff voices with unequal bar counts, notes outside the taught 5-finger position, filenames or titles that break the `chuong-XX-bai-YY` contract, and Vietnamese titles missing their diacritics.

# Lesson Layout — Practice First (settled 14/09/2026)
The owner decided lessons are **practice first, theory is optional reading**: *"học gì cũng thực hành trước, ai muốn coi lý thuyết thì đọc thêm"*. Measured before the change, lesson files were ~70% prose and the theory chapter sat in front of every chapter as a required step. Reasons in `docs/_internal/nhat-ky-quyet-dinh.md`.

**Chương 1-2 already follow this layout — copy them.** Chương 3-7 are still in the old layout and wait for the owner's approval of the pilot before being rewritten.

Every exercise lesson, in this order:

1. **One short paragraph**: what the learner will be able to play by the end, and how many days (ONE number, e.g. "Bài này tập trong **2 ngày**: ngày 1 làm 1A và 1B, ngày 2 làm 1C và 1D."). No day-plan table, no `[!TIP]` box for the estimate.
2. **Only the knowledge needed to play, right where it is needed** — one to three lines, a picture if the thing is spatial (`![...](/images/...)` or a ```keys``` block). Example: where middle C is, finger numbers, what a rest looks like. Anything longer belongs in the theory chapter.
3. Optional `## Khởi động`: one line naming the SPECIFIC earlier exercise to replay, with `{{sheet: ...}}` embeds.
4. **3 to 4 exercises**, each `## Bài tập <code>: <title>` (the heading pattern is a contract with `src/lib/sheet-embed.ts`) followed by **1-2 lines of instruction**, then the ```abc``` block. The cue is what the eye needs at arm's length: which hand, what to watch for, how slow. No "vì sao" here.
5. `## Xong bài khi` (see below).
6. `---`, then an optional one-line celebration at the end of a chapter.
7. `## Tập thấy khó? Đọc ở đây` (see *Invite, don't just permit* below) — short bold-led paragraphs: **Tập khi không có đàn** (tapping), a **Luyện tai** challenge, and any *why* explanation or motivation. End with a link to the chapter's theory page.

**Invite, don't just permit.** The owner's rule: *"thực hành trước, người dùng thấy cần hoặc khó hiểu khi tập bài sẽ tìm đến lý thuyết — khuyến khích người dùng như vậy"*. Saying "không bắt buộc" only tells the learner they may skip; it does not tell them **when** the reading helps. So every pointer to explanation names the moment to use it:
- End of the opening paragraph: *"Cứ tập thử trước; chỗ nào khó hiểu thì kéo xuống mục cuối bài hoặc đọc [lý thuyết Chương N](/02-chapters/chuong-0N)."*
- The read-more heading is `## Tập thấy khó? Đọc ở đây`, opened by one line naming **this lesson's** typical sticking points: *"Không bắt buộc. Cứ tập thử phần trên trước — tay đang chờ cứ đánh theo, hay 2F rối quá thì đọc tiếp."*
- The link to the theory chapter starts from the trouble: *"Tập rồi mà vẫn lẫn ba loại nốt…: đọc [Chương 2](…)"*, not *"Muốn biết thêm…"*.
- Theory chapters open with *"> **Nên tập thử trước khi đọc trang này.** … Trang này dành cho lúc bạn tập mà thấy khó hiểu…"*. The chapter page button reads *"Tập thấy khó hiểu? Đọc lý thuyết chương này"*.

**Short text, practice without a break (settled 14/09/2026).** The owner's rule for every chapter, lesson and review page: *"các phần ngắn gọn chữ thôi, ưu tiên hình, bản nhạc hoặc các phần khác để người dùng thực hành liên tục và hứng thú khi học bài và ôn luyện"*. The learner should go from one thing to play to the next with only a glance at text in between.
- **Reach for these before writing a sentence**, in this order: an `abc` staff to play → a `keys` diagram or an image for *where* → a `{{sheet: ...}}` embed to replay an earlier piece → a link to a practice tool. If a sentence describes which keys, which fingers, or what a symbol looks like, it should be a picture.
- **Send the learner to a tool instead of explaining more.** Stuck reading notes → `/note-trainer`. Unsure of a rhythm → `/metronome`. Finished the lesson and wants more → `/review/<chapter>` (Chương 1-5). Wants to check themselves on a piece → *Tập bài này với đàn* is already under every staff, so say "bấm *Tập bài này với đàn*" rather than describing it. Never make a tool a required step (iPhone has no Web MIDI; mic is optional).
- **Recital / review lessons follow the same rule**: pieces first, one or two lines per piece, the pass standard in `## Xong bài khi`.
- **Hard limits, enforced by `pnpm check:lessons`** for any lesson that has the `## Tập thấy khó? Đọc ở đây` heading: opening paragraph ≤ 450 characters, prose in one practice section ≤ 350, one paragraph in the read-more section ≤ 300, and every `## Bài tập` section must contain a staff, a diagram, an image or a sheet embed. The limits sit just above the longest Chương 1-2 lesson at the time they were set. Over the limit → cut words or turn them into a picture; **never raise the number to make a lesson pass**.

Rules that did not change, only moved:
- Still give an away-from-piano tapping drill and an ear-training challenge in every lesson — but inside the read-more section, specific to the day's skill (which fingers, which rhythm), 2-3 lines each.
- Still at least 3-4 varied ABC exercises (warm-up, familiar melody, harder pattern).

**Theory chapters (`docs/02-chapters/chuong-XX.md`) are not steps.** They are not on the learning path, not tickable, and open with a quote block saying *"Đây là bài đọc thêm, không bắt buộc"* plus a link to the chapter's first exercise. Never write an exercise that only makes sense after reading the theory chapter, and never tell the learner to read it first.

# "Xong bài khi" — every exercise lesson MUST have it
- Put a `## Xong bài khi` section **right after the last exercise**, before the `---` that opens the read-more section. (Chương 3-7, still in the old layout, have it right before `## Yêu cầu thực hành`.) It holds **2 to 4 bullet lines** (`- ...`), each a concrete, self-checkable outcome: *"Đánh trọn 2E từ nốt đầu tới nốt cuối — chậm cũng được, không dừng lại để sửa."*
- The app **lifts this section out of the lesson body and shows it right above the tick button** (`src/lib/done-criteria.ts`). That is the moment the learner asks "am I done?", so write it for that moment: short enough to read at arm's length from the music stand (max 130 characters per line), plain text only — no `**bold**`, links or backticks, they would show up as raw symbols.
- **Outcomes, not practice instructions.** "Tập 15 lần" or "tập riêng từng tay trước" belong in the exercise cue. "Hai tay xuống phím cùng một lúc" belongs in *Xong bài khi*. Do not write the same sentence in both sections — the learner reads them back to back.
- **Never demand perfection or a connected piano.** "Chậm cũng được", "sai nốt cũng được, chỉ không dừng lại để sửa" is the house standard. Never write "tập với đàn đạt 100%" — the app deliberately does not gate lessons (reasons in `docs/_internal/nhat-ky-quyet-dinh.md`), and iPhone cannot use Web MIDI.
- `pnpm test` (`done-criteria.test.ts`) fails if an exercise file lacks the section, has fewer than 2 or more than 4 lines, a line is too long, or a line contains markdown.

# Recital Milestones (Trạm dừng chân)
- After each major cluster of chapters (currently: after Chương 3, and planned after Chương 6), you MUST create a **Tổng ôn / Recital** lesson instead of a new-skill lesson.
- A Recital lesson: introduces **NO new skill**, gives 2-3 complete pieces that combine everything learned so far, opens by reminding the user how far they have come, and defines an explicit "pass" standard (e.g., "play the whole piece start to finish without stopping to fix mistakes") — written as its `## Xong bài khi` section.
- Name it as a normal lesson file (`chuong-03-bai-06.md`) so it appears on the Nhật ký page and can be ticked.

# Write for a Phone on the Music Stand
Learners read lessons mainly on a **phone or tablet**, and practise with that device propped on the piano's music stand — a laptop has nowhere to sit on a keyboard, so almost nobody practises with one. This is a settled product decision (see `AGENTS.md`). When writing lesson text:
- **Never assume a computer.** Do not write "trên máy tính", "bấm chuột", "mở máy tính lên nghe". Say "trên điện thoại" or just "bấm nghe thử" — the instruction should work on whatever device the learner holds.
- **The practice sections are read at arm's length, hands on the keys.** Keep each on-piano step short enough to take in with one glance at the stand; put the long explanation in the read-more section or the theory chapter, which are read with the phone in hand.
- **Never make a lesson depend on connecting the piano (Web MIDI).** It works on Android and on computers but not on iPhone/iPad, so every exercise must be fully doable with just the piano and the sheet music. "Tập bài này với đàn" can be suggested as an extra, never as a step.

Always remind the user that **quality over quantity** is key. 30 minutes of highly focused practice is better than 2 hours of mindless playing.
