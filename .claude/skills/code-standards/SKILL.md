---
name: code-standards
description: Quy ước viết mã cho repo này — tái sử dụng thay vì chép, tách đúng trách nhiệm, mở rộng bằng bảng dữ liệu, generic đúng chỗ, và chỗ nào bắt buộc phải có test. Dùng khi thêm tính năng mới, sửa hoặc refactor bất cứ file nào trong src/, khi định viết một hàm mới, hoặc khi người dùng hỏi "code thế này sạch chưa".
---

# Trước khi viết hàm mới: tra bảng này đã

Chép một khuôn có sẵn sang chỗ mới là cách repo này sinh lỗi nhiều nhất. Bốn bản
sao kho `localStorage` và ba cái tên cho cùng câu hỏi "phím đen hay phím trắng"
đều ra đời kiểu đó: từng lần chép đều đúng, chỉ có điều mỗi bản về sau lại quên
một chi tiết khác nhau.

| Cần gì | Đã có sẵn ở đâu |
|---|---|
| Nhớ lựa chọn giữa hai buổi tập | `createLocalStore` (`src/lib/local-store.ts`) + `useLocalStore` (`src/hooks/useLocalStore.ts`) |
| Phím đen hay trắng, quãng tám thứ mấy, nốt nào trong 12 | `src/lib/pitch.ts` |
| Tên nốt, hoá biểu, sinh câu hỏi, chuỗi ABC | `src/lib/midi-notes.ts` |
| Hình học bàn phím để vẽ SVG | `src/lib/piano-keyboard.ts` |
| Nghe đàn thật (micro hoặc MIDI) | `src/hooks/usePianoInput.ts`, `src/lib/mic-*.ts` |
| Vẽ hoặc phát bản nhạc (abcjs) | **Chỉ bốn hook**: `useSheetRender`, `useSheetAudio` (bài học), `useDrillStaff` (luyện nhận nốt), `usePhrasePlayer` (luyện tai). Component đừng import abcjs |
| Con trỏ đi theo bản nhạc | `src/lib/score-follow.ts` |
| Đọc file markdown trong `docs/` | `markdown.ts` (bài học), `internal-docs.ts` (`_internal`), `updates.ts` (`09-cap-nhat`) |
| Kiểm đầu vào của Server Action | `src/lib/validation.ts` |
| Hỏi quyền, hỏi gói đã mua | `src/lib/access.ts`, `access-server.ts` |
| Biến môi trường | `src/lib/env.ts` (kiểu ở `env-schema.ts`) |

**Cách tra nhanh trước khi viết:** `grep -rn "<từ khoá>" src/lib src/hooks`. Tìm
thấy thứ gần giống mà chưa vừa ý thì **mở rộng nó**, đừng viết bản thứ hai.

# Sáu quy tắc, kèm chỗ chúng đã cứu repo này

## 1. Một việc ở đúng một chỗ

Thấy cùng một đoạn xuất hiện lần thứ hai thì **dừng lại và đặt câu hỏi nó thuộc
về ai**, đừng chép. Ba dấu hiệu bắt buộc phải tách:

- Cùng một phép tính viết tay ở hai file (`((midi % 12) + 12) % 12`).
- Cùng một khuôn `try/catch` + `Set` người nghe + biến nhớ tạm (kho `localStorage`).
- Hai cái tên cho một khái niệm (`isBlack`, `isBlackKey`, `isBlackPitch`).

Tách xong thì **chỉ để lại một cửa**: đừng re-export hàm ở file thứ hai cho tiện
— hai đường import tới cùng một hàm là mầm của bản sao thứ ba.

## 2. Tách phần trình duyệt ra khỏi phần tính toán

Vitest chạy ở `environment: 'node'`: **không có `window`, không có DOM**, và file
có `import 'server-only'` thì không nạp được (kể cả gián tiếp — xem
`docs/_internal/bay-ky-thuat.md`). Nên:

- Phần tính toán thuần → `src/lib/`, không chạm `window`, có test đi kèm.
- Phần chạm trình duyệt → nhận vào **qua tham số** để test thay được. Xem
  `StoreHost` trong `local-store.ts` và cặp `env-schema.ts` / `env.ts`.
- Hook trong `src/hooks/` chỉ nối React với phần lib, không chứa luật chơi.

Đây cũng là câu trả lời cho "làm sao test được": nếu một thứ khó test, gần như
luôn là vì nó đang ôm hai việc.

## 3. Mở rộng bằng bảng dữ liệu, không bằng `if` chồng thêm

Thêm một mức khó, một bài nhạc nền, một nhạc cụ — tất cả đều là **thêm một dòng
vào bảng**, không phải thêm một nhánh `if`: `EAR_PRESETS`, `DRILL_PRESETS`,
`PIECES`, `INSTRUMENTS`, `KEY_SIGNATURES`.

Viết code mới theo lối đó: dữ liệu để ở một mảng có kiểu rõ ràng, logic chỉ đọc
mảng. Người thêm tính năng sau (kể cả AI) chỉ phải đọc một bảng thay vì dò một
chuỗi điều kiện, và test chạy đúng cho cả dòng vừa thêm.

## 4. Generic khi đã có ít nhất hai kiểu thật

`createLocalStore<T>` là generic vì có bốn chỗ dùng với bốn kiểu khác nhau —
`DrillOptions`, `EarOptions`, `AmbientSettings`, `boolean`. Generic dựng sẵn cho
một kiểu duy nhất "phòng khi cần" chỉ làm khó đọc.

Khi đã generic thì **để hợp đồng lộ ra ở kiểu**, đừng bắt người dùng đọc phần
thân: `parse` cứ ném lỗi thoải mái (kho bắt), `serialize` lo phần ghi — nên bài
luyện tai đọc ra cả bộ lựa chọn mà chỉ ghi xuống mã mức, không cần một API riêng.

## 5. Đặt tên theo thứ nó là, và luôn dùng lại đúng tên đó

Đường dẫn trong `src/app/` bằng tiếng Anh chữ thường nối gạch ngang (luật ở
`AGENTS.md`). Tên hàm và biến bằng tiếng Anh; chữ hiện cho người học bằng tiếng
Việt có dấu. Một khái niệm chỉ mang một tên trong toàn repo.

Nhận ra hai tên cho một thứ thì đổi cho thống nhất **ngay trong lần sửa đó** —
và đổi tên xong phải đọc lại cả file: trong `noteAt` từng có biến `pitchClass`
trùng tên với hàm `pitchClass`, đổi một chỗ mà quên `key.chromatic?.[pitchClass]`
là app vẫn chạy, chỉ có nốt Si giáng lặng lẽ hiện thành La thăng.

## 6. Chú thích trả lời **vì sao**, không kể lại **cái gì**

Code đã nói nó làm gì. Chú thích ở repo này ghi thứ đọc code không thấy: ràng
buộc sản phẩm, cái bẫy đã mắc, lý do chọn cách này thay vì cách hiển nhiên hơn.
Viết bằng tiếng Việt có dấu, cùng giọng với phần còn lại.

Bắt buộc phải có chú thích khi: một con số có lý do (thời gian chờ, tỉ lệ vẽ),
một cách làm trông thừa nhưng cần (đọc kho ngoài qua `useSyncExternalStore`),
hoặc một ràng buộc ở `AGENTS.md` đang được giữ ngay tại dòng đó (bốn luật chống
áp lực trong lúc đánh).

# Chỗ bắt buộc phải có test

- Mọi thứ trong `src/lib/` không chạm DOM. Một hàm mới ở đây mà không có test là
  chưa xong.
- Sửa con số trong `src/lib/mic-*.ts` thì phải chạy lại `mic-accuracy.test.ts`.
- Test viết bằng tiếng Việt, tên test nói **hành vi người dùng thấy**, không nói
  tên hàm: *"trình duyệt chặn lưu trữ thì vẫn chạy"*, không phải *"save() không
  throw"*.
- Đọc dòng `Test Files` chứ không chỉ dòng `Tests`: một file không nạp được thì
  test trong đó biến mất khỏi tổng số chứ không bị tính là trượt.

# Khi nào ĐỪNG refactor

- **Đừng đụng vào ràng buộc sản phẩm** ở `AGENTS.md` nhân danh code sạch: con trỏ
  chỉ nhích khi bấm phím, không bảng tỉ số lúc đang đánh, không piano ảo, không
  bài học nào bắt buộc phải cho app nghe đàn.
- **Đừng đổi slug bài học, khoá `localStorage`, hay tên cột** — người học mất tiến
  độ hoặc mất thứ đang chọn. Trong beta chỉ được THÊM cột/bảng/index.
- **Đừng gộp hai thứ chỉ vì chúng trông giống nhau.** `describeMidiNote` và
  `describePitchList` cùng đọc tên nốt nhưng hiện cho hai chỗ khác nhau
  (`Đô♯/Rê♭` so với `Đô♯`); gộp là đổi chữ người học đang đọc.
- **Đừng refactor rộng hơn việc đang làm.** Dọn thứ mình vừa chạm vào, ghi lại
  thứ thấy được mà chưa dọn.

# Trước khi coi là xong

```bash
pnpm exec next typegen && pnpm exec tsc --noEmit
pnpm lint
pnpm test          # đọc cả dòng `Test Files`
pnpm check:lessons
npx next build     # thứ Vercel thật sự chạy — bốn lệnh trên không dựng production
```
