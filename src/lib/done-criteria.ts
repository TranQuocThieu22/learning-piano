/**
 * Mục **Xong bài khi** của một bài tập: vài dòng nói rõ làm được tới đâu thì tick.
 *
 * Vì sao có (14/09/2026). Chủ sản phẩm hỏi có nên khoá bài sau cho tới khi người
 * học tập đạt bài trước không. Câu trả lời là không — `AGENTS.md` cấm bắt buộc cho
 * app nghe đàn, micro chưa đo trên máy thật, và ổ khoá biến "lười" thành "bỏ app".
 * Nhưng cái lo đằng sau thì có thật: nút tick không nói tick khi nào, và mục *Yêu
 * cầu thực hành* của Chương 2-4 chỉ dặn *cách tập* ("đánh đi đánh lại 15 lần"),
 * không nói *tới đâu là xong*. Người không lười cũng không biết lúc nào nên tick.
 *
 * Nên tiêu chí được **tách khỏi thân bài và đặt ngay trên nút tick** — đúng lúc
 * người học đang tự hỏi "mình xong chưa". Để nguyên trong thân bài thì nó chỉ là
 * thêm một đoạn chữ giữa một trang dài mấy màn hình.
 *
 * Người soạn viết nó như một mục thường trong file markdown:
 *
 * ```markdown
 * ## Xong bài khi
 *
 * - Đánh trọn 2E từ nốt đầu tới nốt cuối, chậm cũng được, không dừng lại để sửa.
 * - Nhảy quãng mà cổ tay đứng yên.
 * ```
 *
 * Mọi bài tập đều phải có mục này — `done-criteria.test.ts` soi cả giáo trình.
 */

const HEADING = /^##[ \t]+Xong bài khi[ \t]*$/;
/** Mục kết thúc ở tiêu đề kế tiếp hoặc ở đường kẻ ngang ngăn phần "Tiếp theo". */
const SECTION_END = /^(#{1,6}[ \t]|---[ \t]*$)/;
const ITEM = /^[ \t]*(?:[-*]|\d+\.)[ \t]+(.+?)[ \t]*$/;

export interface SplitLesson {
  /** Bài học đã bỏ mục *Xong bài khi*, để thân bài không in nó lần thứ hai. */
  body: string;
  /** Từng dòng tiêu chí, theo thứ tự người soạn viết. Rỗng khi bài không có mục này. */
  criteria: string[];
}

/**
 * Tách mục *Xong bài khi* ra khỏi bài.
 *
 * Chỉ nhận **dòng gạch đầu dòng** trong mục, bỏ qua mọi thứ khác. Tiêu chí được
 * vẽ bằng chữ trơn cạnh nút tick, không qua bộ đọc markdown — nên đoạn văn xen
 * vào sẽ không có chỗ hiện, và test giáo trình bắt nó thay vì để lặng lẽ mất.
 */
export function splitDoneCriteria(markdown: string): SplitLesson {
  const lines = markdown.split('\n');
  // File soạn trên Windows có `\r` cuối dòng; so mẫu trên bản đã gọt, cắt trên bản gốc.
  const bare = (line: string) => line.replace(/\r$/, '');

  const start = lines.findIndex((line) => HEADING.test(bare(line)));
  if (start === -1) return { body: markdown, criteria: [] };

  let end = start + 1;
  while (end < lines.length && !SECTION_END.test(bare(lines[end]))) end++;

  const criteria = lines
    .slice(start + 1, end)
    .map((line) => ITEM.exec(bare(line))?.[1])
    .filter((item): item is string => Boolean(item));

  const body = [...lines.slice(0, start), ...lines.slice(end)].join('\n');
  return { body, criteria };
}

/**
 * Những dòng trong mục mà `splitDoneCriteria` sẽ lặng lẽ bỏ đi — đoạn văn thường,
 * hay dòng có định dạng markdown (in đậm, liên kết) sẽ hiện nguyên dấu `**` lên
 * màn hình. Chỉ để test giáo trình dùng.
 */
export function unrenderableCriteriaLines(markdown: string): string[] {
  const lines = markdown.split('\n').map((line) => line.replace(/\r$/, ''));
  const start = lines.findIndex((line) => HEADING.test(line));
  if (start === -1) return [];

  const problems: string[] = [];
  for (let i = start + 1; i < lines.length && !SECTION_END.test(lines[i]); i++) {
    const line = lines[i];
    if (line.trim() === '') continue;
    const item = ITEM.exec(line)?.[1];
    if (!item || /[*_`[\]]/.test(item)) problems.push(line);
  }
  return problems;
}
