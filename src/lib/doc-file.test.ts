import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readDocFile } from './doc-file';

describe('readDocFile', () => {
  let tam: string | null = null;

  afterEach(() => {
    if (tam) fs.rmSync(tam, { recursive: true, force: true });
    tam = null;
  });

  function ghi(ten: string, noiDung: string): string {
    tam ??= fs.mkdtempSync(path.join(os.tmpdir(), 'doc-file-'));
    const file = path.join(tam, ten);
    fs.writeFileSync(file, noiDung, 'utf-8');
    return file;
  }

  it('file checkout trên Windows đọc ra y hệt file checkout trên Linux', () => {
    const lf = '# Bài hát\n\n```abc\nX:1\nK:C\nCDEF|\n```\n';
    const crlf = lf.replace(/\n/g, '\r\n');

    expect(readDocFile(ghi('crlf.md', crlf))).toBe(readDocFile(ghi('lf.md', lf)));
    expect(readDocFile(ghi('crlf2.md', crlf))).toBe(lf);
  });

  it('xuống dòng kiểu máy Mac cũ chỉ có \\r cũng quy về \\n', () => {
    expect(readDocFile(ghi('cr.md', 'dòng một\rdòng hai'))).toBe('dòng một\ndòng hai');
  });

  it('giữ nguyên chữ tiếng Việt có dấu', () => {
    expect(readDocFile(ghi('dau.md', 'Đô Rê Mi\r\n'))).toBe('Đô Rê Mi\n');
  });
});
