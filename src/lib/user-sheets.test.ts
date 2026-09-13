import { describe, expect, it } from 'vitest';
import {
  base64Bytes,
  detectSource,
  fitWithin,
  IMAGE_MAX_EDGE,
  sheetErrorMessage,
  IMAGE_MIME_TYPES,
  MAX_PAGE_BASE64,
  parseImageDataUrl,
  SHEET_SOURCES,
  sheetSourceLabel,
  titleFromFileName,
} from './user-sheets';

describe('nhận ra định dạng file người học chọn', () => {
  it('nhận file nhạc theo đuôi, không phân biệt chữ hoa chữ thường', () => {
    expect(detectSource('Fur Elise.mid')).toBe('midi');
    expect(detectSource('bai-tap.MIDI')).toBe('midi');
    expect(detectSource('song.musicxml')).toBe('musicxml');
    expect(detectSource('song.XML')).toBe('musicxml');
  });

  it('ảnh và file lạ không lọt vào đường nhập bản nhạc', () => {
    expect(detectSource('trang-1.jpg')).toBeNull();
    expect(detectSource('ban-nhac.pdf')).toBeNull();
    expect(detectSource('khong-co-duoi')).toBeNull();
  });
});

describe('tên gợi ý cho bản nhạc', () => {
  it('lấy tên file, bỏ đuôi và gạch nối', () => {
    expect(titleFromFileName('fur-elise.mid')).toBe('fur elise');
    expect(titleFromFileName('Chuong_1_bai_2.musicxml')).toBe('Chuong 1 bai 2');
  });

  it('tên rỗng vẫn ra một cái tên đọc được', () => {
    expect(titleFromFileName('.mid')).toBe('Bản nhạc của tôi');
  });
});

describe('bảng nguồn nói rõ app làm được gì', () => {
  it('mỗi nguồn đều có nhãn và một câu giải thích', () => {
    for (const source of SHEET_SOURCES) {
      expect(source.label.length).toBeGreaterThan(0);
      expect(source.note.length).toBeGreaterThan(0);
    }
  });

  it('nguồn lạ vẫn có nhãn để hiện, không ra chữ trống', () => {
    expect(sheetSourceLabel('khong-co-that')).toBe('Bản nhạc');
    expect(sheetSourceLabel('photo')).toBe('Ảnh chụp');
  });
});

describe('kiểm chuỗi ảnh gửi lên', () => {
  const anh = (mime = 'image/jpeg', body = 'AAAA') => `data:${mime};base64,${body}`;

  it('nhận ảnh đúng dạng', () => {
    expect(parseImageDataUrl(anh())).toEqual({ mime: 'image/jpeg', base64: 'AAAA' });
    for (const mime of IMAGE_MIME_TYPES) {
      expect(parseImageDataUrl(anh(mime))).not.toBeNull();
    }
  });

  it('từ chối thứ không phải ảnh, kể cả khi gọi thẳng vào Server Action', () => {
    expect(parseImageDataUrl('data:text/html;base64,AAAA')).toBeNull();
    expect(parseImageDataUrl('data:image/svg+xml;base64,AAAA')).toBeNull();
    expect(parseImageDataUrl('https://vi.du/anh.jpg')).toBeNull();
    expect(parseImageDataUrl('data:image/jpeg;base64,')).toBeNull();
  });

  it('từ chối ảnh quá cỡ thay vì để nó vào database', () => {
    expect(parseImageDataUrl(anh('image/jpeg', 'A'.repeat(MAX_PAGE_BASE64 + 4)))).toBeNull();
  });

  it('tính đúng cỡ thật của ảnh sau khi giải mã', () => {
    expect(base64Bytes('AAAA')).toBe(3);
    expect(base64Bytes('AAA=')).toBe(2);
    expect(base64Bytes('AA==')).toBe(1);
  });
});

describe('thu nhỏ ảnh trước khi gửi lên', () => {
  it('ảnh dọc của điện thoại co về đúng cạnh dài, giữ nguyên tỉ lệ', () => {
    expect(fitWithin(3000, 4000)).toEqual({ width: 1200, height: IMAGE_MAX_EDGE });
  });

  it('ảnh ngang cũng co theo cạnh dài của nó', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: IMAGE_MAX_EDGE, height: 1200 });
  });

  it('ảnh vốn đã nhỏ thì giữ nguyên, không phóng to cho nặng thêm', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it('ảnh hỏng (cỡ bằng 0) không làm vỡ phần tính toán', () => {
    expect(fitWithin(0, 0)).toEqual({ width: 0, height: 0 });
  });
});

describe('chữ báo lỗi cho người học', () => {
  it('mã lỗi đã biết ra câu tiếng Việt nói được phải làm gì', () => {
    expect(sheetErrorMessage('not-signed-in')).toContain('đăng nhập');
    expect(sheetErrorMessage('too-many')).toContain('Xoá bớt');
  });

  it('mã lỗi lạ vẫn ra một câu, không ra chuỗi rỗng', () => {
    expect(sheetErrorMessage('chuyen-gi-do')).toContain('thử lại');
    expect(sheetErrorMessage(undefined)).toBe('');
  });
});
