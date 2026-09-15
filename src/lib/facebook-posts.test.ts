import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  formatVietnamTime,
  graphErrorHint,
  looksLikeSamePost,
  parseFacebookPosts,
  parseVietnamTime,
  scheduleProblem,
} from './facebook-posts';

const SAMPLE = [
  '## 4. Bài đăng số 2 — soạn 12/09/2026, đã đăng 13/09/2026',
  '',
  '> **Ảnh nên kèm:** một ảnh chụp màn hình.',
  '',
  '```text',
  'Dòng một bị ngắt',
  'giữa câu.',
  '',
  '• Gạch một, dài quá nên',
  '  xuống dòng.',
  '• Gạch hai.',
  '',
  'https://pianojourney.rehover.io/updates',
  '```',
  '',
  '---',
  '',
  '## 4c. Bài đăng số 4 — soạn 13/09/2026, chưa đăng',
  '',
  '```text',
  'Bài bốn.',
  '```',
  '',
  '## 5. Mẫu bài "cập nhật hệ thống"',
  '',
  '```text',
  '[1. Vừa làm xong cái gì]',
  '```',
].join('\n');

describe('đọc bài đăng ra khỏi file', () => {
  it('lấy đúng các bài có số, không đọc nhầm khối mẫu ở mục khác thành bài', () => {
    expect(parseFacebookPosts(SAMPLE).map((p) => p.number)).toEqual([2, 4]);
  });

  it('biết bài nào đã đăng, bài nào còn chờ', () => {
    expect(parseFacebookPosts(SAMPLE).map((p) => p.alreadyPosted)).toEqual([true, false]);
  });

  it('nối dòng ngắt giữa câu, nhưng giữ nguyên đoạn và gạch đầu dòng', () => {
    expect(parseFacebookPosts(SAMPLE)[0].message).toBe(
      'Dòng một bị ngắt giữa câu.\n\n• Gạch một, dài quá nên xuống dòng.\n• Gạch hai.\n\nhttps://pianojourney.rehover.io/updates'
    );
  });

  it('file checkout trên Windows (\\r\\n) vẫn ra đúng lời văn', () => {
    expect(parseFacebookPosts(SAMPLE.replace(/\n/g, '\r\n'))).toEqual(parseFacebookPosts(SAMPLE));
  });

  it('tiêu đề gõ bằng dấu tách rời vẫn nhận ra là đã đăng', () => {
    const nfd = '## Bài đăng số 3 — đã đăng\n```text\nBa\n```'.normalize('NFD');
    expect(parseFacebookPosts(nfd)[0].alreadyPosted).toBe(true);
  });

  it('bài chưa soạn lời thì không mượn lời của bài ngay sau nó', () => {
    const md = '## Bài đăng số 7 — chưa đăng\n\n## Bài đăng số 8 — chưa đăng\n```text\nTám\n```';
    expect(parseFacebookPosts(md).map((p) => [p.number, p.message])).toEqual([[8, 'Tám']]);
  });

  it('mọi mục "Bài đăng số" trong file thật đều đọc ra được lời văn, không trùng số', () => {
    const md = readFileSync(join(process.cwd(), 'docs/_internal/bai-dang-facebook.md'), 'utf8');
    const headings = md.split(/\r?\n/).filter((l) => /^## .*Bài đăng số \d+/.test(l.normalize('NFC')));
    const posts = parseFacebookPosts(md);

    expect(posts.length).toBe(headings.length);
    expect(new Set(posts.map((p) => p.number)).size).toBe(posts.length);
    for (const post of posts) {
      expect(post.message).not.toBe('');
      expect(post.message).not.toContain('```');
    }
  });
});

describe('giờ hẹn đăng', () => {
  it('đọc giờ theo giờ Việt Nam, không theo múi giờ của máy', () => {
    expect(parseVietnamTime('2026-09-17 20:00').toISOString()).toBe('2026-09-17T13:00:00.000Z');
    expect(formatVietnamTime(parseVietnamTime('2026-09-17 20:00'))).toBe('17/09/2026 20:00');
  });

  it('từ chối cách viết khác và ngày giờ không có thật', () => {
    expect(() => parseVietnamTime('17/09/2026 20:00')).toThrow();
    expect(() => parseVietnamTime('2026-02-30 20:00')).toThrow();
    expect(() => parseVietnamTime('2026-09-17 24:00')).toThrow();
  });

  it('chỉ nhận giờ hẹn nằm trong khoảng Facebook cho phép', () => {
    const now = new Date('2026-09-15T00:00:00Z');
    const after = (minutes: number) => new Date(now.getTime() + minutes * 60_000);

    expect(scheduleProblem(after(-60), now)).not.toBeNull();
    expect(scheduleProblem(after(5), now)).not.toBeNull();
    expect(scheduleProblem(after(15), now)).toBeNull();
    expect(scheduleProblem(after(29 * 24 * 60), now)).toBeNull();
    expect(scheduleProblem(after(31 * 24 * 60), now)).not.toBeNull();
  });
});

describe('chặn đăng trùng', () => {
  it('cùng một bài nhưng ngắt dòng khác vẫn bị nhận ra', () => {
    const inFile = 'Tập khuya, đeo tai nghe, nghe đi nghe lại một câu nhạc hai chục lần — tới lần thứ mười là chói tai.';
    const onPage = 'Tập khuya, đeo tai nghe, nghe đi nghe lại\nmột câu nhạc hai chục lần — tới lần thứ mười là chói tai.';
    expect(looksLikeSamePost(inFile, onPage)).toBe(true);
  });

  it('hai bài khác nhau thì không bị chặn nhầm', () => {
    expect(looksLikeSamePost('Bài về micro điện thoại.', 'Bài về nối đàn qua Bluetooth.')).toBe(false);
  });

  it('bài trên Trang chỉ có ảnh, không có chữ, thì không tính là trùng', () => {
    expect(looksLikeSamePost('', '')).toBe(false);
  });
});

describe('lỗi từ Facebook', () => {
  it('mã hết hạn thì chỉ đường làm lại mã', () => {
    expect(graphErrorHint(190)).toContain('mục 6');
  });

  it('lỗi lạ thì không bịa lời khuyên', () => {
    expect(graphErrorHint(100)).toBeNull();
    expect(graphErrorHint(undefined)).toBeNull();
  });
});
