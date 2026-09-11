import { describe, expect, it } from 'vitest';
import { capDoLabel, getAllSongs } from './songs';

const songs = getAllSongs();

describe('getAllSongs', () => {
  it('đọc được thư mục bài hát', () => {
    expect(songs.length).toBeGreaterThan(0);
  });

  it('xếp dễ trước khó sau', () => {
    const capDo = songs.map((s) => s.capDo);
    expect([...capDo].sort((a, b) => a - b)).toEqual(capDo);
  });

  /*
   * **Ca test quan trọng nhất của file này.**
   *
   * Sản phẩm này CÓ BÁN, mà soạn và phát hành bản nhạc của một tác phẩm còn trong
   * thời hạn bảo hộ là nhân bản tác phẩm được bảo hộ — ở Việt Nam cần giấy phép.
   * Trường `nguon` là chỗ ghi **vì sao bài này được phép có mặt**.
   *
   * Để test gác chứ không chỉ ghi thành quy ước, vì đây đúng là kiểu việc dễ quên
   * nhất: vài tháng sau thêm một bài "nghe hay quá" lúc đang vội, không ai nhớ
   * phải kiểm bản quyền, và cái sai đó chỉ lộ ra khi có thư của luật sư.
   *
   * Test này KHÔNG kiểm được bài đó có thật sự hết hạn bảo hộ hay không — việc ấy
   * phải do người làm. Nó chỉ chặn chuyện thêm bài mà **không ai ghi lại đã nghĩ
   * tới bản quyền**.
   */
  it('mọi bài hát đều khai nguồn gốc bản quyền', () => {
    for (const song of songs) {
      expect(song.nguon, `${song.slug} chưa khai trường \`nguon\``).toBeTruthy();
      expect(song.nguon!.length, `${song.slug}: \`nguon\` quá ngắn để có nghĩa`).toBeGreaterThan(
        20
      );
    }
  });

  it('mọi bài hát đều khai cấp độ và chương phù hợp', () => {
    for (const song of songs) {
      expect(song.capDo, `${song.slug} chưa khai \`capDo\``).toBeLessThan(99);
      expect(song.capDo).toBeGreaterThanOrEqual(1);
      expect(song.sauChuong, `${song.slug} chưa khai \`sauChuong\``).not.toBeNull();
    }
  });

  it('đường dẫn trỏ đúng thư mục bài hát', () => {
    for (const song of songs) {
      expect(song.href).toBe(`/08-bai-hat/${song.slug}`);
    }
  });

  // Tên bài lấy từ dòng H1; thiếu H1 thì nó rơi về tên file và hiện ra xấu.
  it('bài nào cũng có tên đọc được, không phải tên file', () => {
    for (const song of songs) {
      expect(song.title).not.toBe(song.slug);
      expect(song.title.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('capDoLabel', () => {
  it('có nhãn cho mọi cấp độ đang dùng', () => {
    for (const song of songs) {
      expect(capDoLabel(song.capDo)).not.toMatch(/^Cấp độ /);
    }
  });

  it('cấp độ lạ vẫn ra chữ đọc được chứ không phải undefined', () => {
    expect(capDoLabel(42)).toBe('Cấp độ 42');
  });
});
