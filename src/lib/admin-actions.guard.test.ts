import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Canh gác: mọi Server Action trong admin-actions.ts phải tự kiểm tra quyền.
 *
 * Đây là loại lỗi rất dễ mắc và rất khó thấy — thêm một action mới, quên gọi
 * `requireAdmin()`, mọi thứ trên giao diện vẫn đúng vì layout đã chặn người lạ
 * nhìn thấy trang. Nhưng Server Action là endpoint HTTP thật: ai biết id của nó
 * đều POST được, kể cả khi chưa từng thấy cái nút.
 *
 * Test đọc thẳng mã nguồn thay vì gọi hàm, vì gọi Server Action cần ngữ cảnh
 * request của Next.js. Thô, nhưng bắt đúng cái cần bắt.
 */
const SOURCE = readFileSync(
  join(process.cwd(), 'src/lib/admin-actions.ts'),
  'utf8'
);

/** Tách từng hàm được export ra kèm phần thân của nó. */
function exportedActions(): Array<{ name: string; body: string }> {
  const found: Array<{ name: string; body: string }> = [];
  const signature = /export\s+async\s+function\s+(\w+)/g;

  let match: RegExpExecArray | null;
  while ((match = signature.exec(SOURCE)) !== null) {
    const next = SOURCE.slice(match.index + match[0].length);
    // Cắt tới hàm export kế tiếp, hoặc hết file nếu đây là hàm cuối.
    const endsAt = next.search(/export\s+async\s+function/);
    found.push({
      name: match[1],
      body: endsAt === -1 ? next : next.slice(0, endsAt),
    });
  }
  return found;
}

describe('Mọi Server Action admin phải tự kiểm tra quyền', () => {
  const actions = exportedActions();

  it('tìm được các action để kiểm tra', () => {
    // Nếu số này về 0 thì test bên dưới sẽ đỗ một cách vô nghĩa.
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.map((a) => a.name)).toContain('grantAccessAction');
    expect(actions.map((a) => a.name)).toContain('revokeAccessAction');
  });

  it('file thực sự là Server Action (có chỉ thị "use server")', () => {
    expect(SOURCE.trimStart().startsWith("'use server'")).toBe(true);
  });

  for (const action of actions) {
    it(`${action.name}() gọi requireAdmin()`, () => {
      expect(action.body).toMatch(/await\s+requireAdmin\s*\(/);
    });

    it(`${action.name}() gọi requireAdmin() TRƯỚC khi chạm database`, () => {
      const guardAt = action.body.search(/await\s+requireAdmin\s*\(/);
      const dbAt = action.body.search(/\bdb\s*\.|grantEntitlement\s*\(/);
      if (dbAt === -1) return; // action không chạm database thì không có gì để sai
      expect(guardAt).toBeGreaterThanOrEqual(0);
      expect(guardAt).toBeLessThan(dbAt);
    });
  }
});
