import { describe, expect, it } from 'vitest';
import { isAdminEmail, parseAdminEmails } from './admin-allowlist';

describe('parseAdminEmails', () => {
  it('tách được danh sách ngăn bằng dấu phẩy', () => {
    expect(parseAdminEmails('a@x.com,b@x.com')).toEqual(
      new Set(['a@x.com', 'b@x.com'])
    );
  });

  it('chịu được khoảng trắng, chấm phẩy và xuống dòng lẫn lộn', () => {
    expect(parseAdminEmails(' a@x.com ;\n b@x.com , c@x.com ')).toEqual(
      new Set(['a@x.com', 'b@x.com', 'c@x.com'])
    );
  });

  it('chuẩn hoá về chữ thường', () => {
    expect(parseAdminEmails('Admin@Example.COM')).toEqual(
      new Set(['admin@example.com'])
    );
  });

  it('trả tập rỗng khi không có gì', () => {
    expect(parseAdminEmails('')).toEqual(new Set());
    expect(parseAdminEmails('   ')).toEqual(new Set());
    expect(parseAdminEmails(undefined)).toEqual(new Set());
    expect(parseAdminEmails(null)).toEqual(new Set());
  });
});

describe('isAdminEmail — mặc định phải là TỪ CHỐI', () => {
  const list = 'chu@piano.vn, tro-ly@piano.vn';

  it('cho qua đúng email trong danh sách', () => {
    expect(isAdminEmail('chu@piano.vn', list)).toBe(true);
    expect(isAdminEmail('tro-ly@piano.vn', list)).toBe(true);
  });

  it('không phân biệt hoa thường và bỏ qua khoảng trắng thừa', () => {
    expect(isAdminEmail('  CHU@Piano.VN  ', list)).toBe(true);
  });

  it('chặn email không có trong danh sách', () => {
    expect(isAdminEmail('nguoila@gmail.com', list)).toBe(false);
  });

  it('KHÔNG cho ai vào khi quên đặt ADMIN_EMAILS', () => {
    expect(isAdminEmail('chu@piano.vn', undefined)).toBe(false);
    expect(isAdminEmail('chu@piano.vn', '')).toBe(false);
    expect(isAdminEmail('chu@piano.vn', '   ')).toBe(false);
  });

  it('chặn khi chưa đăng nhập (không có email)', () => {
    expect(isAdminEmail(undefined, list)).toBe(false);
    expect(isAdminEmail(null, list)).toBe(false);
    expect(isAdminEmail('', list)).toBe(false);
  });

  it('không cho qua bằng email chứa email admin như một phần', () => {
    expect(isAdminEmail('chu@piano.vn.kere.com', list)).toBe(false);
    expect(isAdminEmail('xxchu@piano.vn', list)).toBe(false);
  });
});
