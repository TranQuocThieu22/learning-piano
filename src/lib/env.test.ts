import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { dangBan, ENV_KEYS } from './env-schema';

/**
 * Canh gác: mọi biến môi trường code đọc đều phải được ghi trong .env.example.
 *
 * Vì sao cần: thêm một biến mới mà quên ghi vào .env.example thì người deploy
 * sau không có cách nào biết mà đặt — và triệu chứng lại xuất hiện ở tận
 * production, dưới dạng một tính năng lặng lẽ không chạy.
 *
 * Cùng kiểu với admin-actions.guard.test.ts: đọc mã nguồn như dữ liệu, để một
 * quy ước không dựa vào việc người ta nhớ.
 */

const ROOT = process.cwd();

/** Biến do nền tảng cấp, không phải cấu hình của dự án. */
const BO_QUA = new Set(['NODE_ENV', 'VERCEL', 'VERCEL_ENV', 'VERCEL_URL', 'CI']);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.next', '.git'].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|mjs)$/.test(name) && !/\.test\./.test(name)) out.push(p);
  }
  return out;
}

/** Tên biến được nhắc trong .env.example, kể cả dòng đang bị chú thích. */
function keysInExample(): Set<string> {
  const text = readFileSync(join(ROOT, '.env.example'), 'utf8');
  const found = new Set<string>();
  for (const line of text.split('\n')) {
    const m = /^\s*#?\s*([A-Z][A-Z0-9_]*)\s*=/.exec(line);
    if (m) found.add(m[1]);
  }
  return found;
}

/** Mọi process.env.X còn đọc trực tiếp, ngoài module env.ts. */
function keysReadDirectly(): Map<string, string[]> {
  const found = new Map<string, string[]>();
  for (const file of [...walk(join(ROOT, 'src')), ...walk(join(ROOT, 'scripts'))]) {
    if (file.endsWith(join('src', 'lib', 'env.ts'))) continue;
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) {
      if (BO_QUA.has(m[1])) continue;
      found.set(m[1], [...(found.get(m[1]) ?? []), file]);
    }
  }
  return found;
}

describe('.env.example phải mô tả đủ mọi biến code cần', () => {
  const example = keysInExample();

  it.each(ENV_KEYS)('%s (khai trong src/lib/env.ts) có trong .env.example', (key) => {
    expect(example.has(key)).toBe(true);
  });

  it('mọi process.env.X đọc trực tiếp đều có trong .env.example', () => {
    const thieu = [...keysReadDirectly().entries()]
      .filter(([key]) => !example.has(key))
      .map(([key, files]) => `${key} (dùng ở ${files.join(', ')})`);

    expect(thieu).toEqual([]);
  });
});

describe('src/lib/env.ts là nơi duy nhất đọc biến môi trường phía ứng dụng', () => {
  it('không file nào trong src/ còn đọc process.env trực tiếp', () => {
    const trongSrc = [...keysReadDirectly().entries()]
      .filter(([, files]) => files.some((f) => f.includes(join(ROOT, 'src'))))
      .map(([key, files]) => `${key} — ${files.join(', ')}`);

    expect(trongSrc).toEqual([]);
  });
});

describe('công tắc mở bán', () => {
  it('chỉ đúng chuỗi "true" mới là mở bán', () => {
    expect(dangBan('true')).toBe(true);
    expect(dangBan('TRUE')).toBe(true);
    expect(dangBan('  true  ')).toBe(true);
  });

  it('mặc định là KHÔNG bán — thiếu biến, chuỗi rỗng, hay giá trị lạ đều đóng', () => {
    for (const raw of [undefined, null, '', '  ', '1', 'yes', 'false', 'bật']) {
      expect(dangBan(raw)).toBe(false);
    }
  });
});
