import { describe, expect, it } from 'vitest';
import abcjs from 'abcjs';
import {
  capDoLabel,
  getAllSongs,
  getSongContent,
  getSongSheets,
  HEADING_CO_BAN,
  HEADING_NANG_CAO,
} from './songs';

const songs = getAllSongs();

/** Bỏ phần đầu bài, chỉ thị %%, tên hợp âm và ký hiệu diễn tấu — còn lại là nốt. */
function thanNhac(abc: string): string {
  return abc
    .split('\n')
    .filter((dong) => !/^[A-Za-z]:/.test(dong) && !dong.startsWith('%%'))
    .join('\n')
    .replace(/"[^"]*"/g, '')
    .replace(/![^!]*!/g, '')
    .replace(/\[[A-Za-z]:[^\]]*\]/g, '');
}

/** Mọi nốt trong một ô nhịp, kèm dấu hoá viết ra (nếu có) và dấu quãng tám. */
const NOT = /(\^{1,2}|_{1,2}|=)?([A-Ga-g])([,']*)/g;

/**
 * Ô nhịp nào cộng trường độ không bằng số chỉ nhịp.
 *
 * Ô đầu tiên được phép ngắn — đó là nhịp lấy đà, ba trong sáu bài đang dùng.
 * Ô dài quá thì luôn là lỗi, kể cả ô đầu.
 */
function oNhipThieuPhach(abc: string): string[] {
  const nhip = abc.match(/^M:\s*(\d+)\/(\d+)/m);
  if (!nhip) return ['thiếu dòng M: nên không kiểm được số phách'];
  const duPhach = Number(nhip[1]) / Number(nhip[2]);
  const ten = abc.match(/^T:\s*(.*)$/m)?.[1] ?? '(không tên)';
  const loi: string[] = [];

  for (const dong of abcjs.parseOnly(abc)[0].lines) {
    if (!dong.staff) continue;
    dong.staff.forEach((khuong, ki) => {
      (khuong.voices ?? []).forEach((be, bi) => {
        let tong = 0;
        let o = 1;
        const kiem = () => {
          if (tong === 0) return;
          const laLayDa = o === 1 && tong < duPhach;
          if (!laLayDa && Math.abs(tong - duPhach) > 1e-9) {
            loi.push(`"${ten}" khuông ${ki + 1} bè ${bi + 1} ô ${o}: ${tong} thay vì ${duPhach}`);
          }
          o += 1;
          tong = 0;
        };
        for (const el of be) {
          if (el.el_type === 'note') tong += el.duration ?? 0;
          if (el.el_type === 'bar') kiem();
        }
        kiem();
      });
    });
  }
  return loi;
}

/** Nốt nào ăn theo dấu hoá của nốt trước trong cùng ô nhịp mà không tự ghi dấu. */
function dauHoaThuaHuong(abc: string): string[] {
  const ten = abc.match(/^T:\s*(.*)$/m)?.[1] ?? '(không tên)';
  const loi: string[] = [];
  thanNhac(abc)
    .split(/[|:]+/)
    .forEach((oNhip, i) => {
      const daCoDauHoa = new Map<string, string>();
      for (const [, dauHoa, ten_not, quangTam] of oNhip.matchAll(NOT)) {
        const khoa = ten_not + quangTam;
        if (dauHoa) daCoDauHoa.set(khoa, dauHoa);
        else if (daCoDauHoa.has(khoa)) {
          loi.push(
            `"${ten}" ô ${i + 1}: nốt ${khoa} ăn theo dấu ${daCoDauHoa.get(khoa)} của nốt trước` +
              ' — ghi rõ dấu bình nếu muốn nốt thường'
          );
        }
      }
    });
  return loi;
}

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

/*
 * **Bản nhạc trong góc bài hát là nhạc VIẾT TAY.**
 *
 * Không có trình soạn nhạc nào kiểm hộ: gõ thẳng ABC vào file markdown, abcjs vẽ
 * ra đúng thứ đã gõ. Sai ở đây không làm trang đỏ, không làm test nào khác trượt
 * — bản nhạc vẫn hiện ra đẹp đẽ, chỉ có điều nó phát sai. Người học đánh theo rồi
 * tự nghĩ tai mình có vấn đề.
 *
 * Ba ca dưới đây gác ba thứ máy kiểm được. Thứ máy KHÔNG kiểm được — giai điệu có
 * đúng bài gốc không — vẫn phải có người đánh lên nghe.
 */
describe('bản nhạc trong file bài hát', () => {
  it('bài nào cũng có cả bản cơ bản lẫn bản nâng cao', () => {
    for (const song of songs) {
      const raw = getSongContent(song);
      expect(raw, `${song.slug} thiếu mục "${HEADING_CO_BAN}"`).toContain(HEADING_CO_BAN);
      expect(raw, `${song.slug} thiếu mục "${HEADING_NANG_CAO}"`).toContain(HEADING_NANG_CAO);
      expect(song.coNangCao).toBe(true);
      expect(getSongSheets(song).length, `${song.slug} phải có từ hai bản nhạc`).toBeGreaterThanOrEqual(
        2
      );
    }
  });

  /*
   * Bản nâng cao là bản HAI TAY, và `%%staves` là chỗ duy nhất nói ra điều đó.
   * Thiếu nó thì hai bè bị dồn vào một khuông nhạc: vẫn phát đúng tiếng nhưng
   * không đọc nổi, mà đây là bản người học phải đọc trong lúc hai tay đang bận.
   */
  it('bản nâng cao viết trên hai khuông nhạc', () => {
    for (const song of songs) {
      const nangCao = getSongSheets(song).at(-1)!;
      expect(nangCao, `${song.slug}: bản nâng cao thiếu %%staves`).toContain('%%staves');
      expect(nangCao, `${song.slug}: bản nâng cao thiếu khoá Fa cho tay trái`).toContain(
        'clef=bass'
      );
    }
  });

  it('mọi ô nhịp đều đủ phách', () => {
    for (const song of songs) {
      for (const abc of getSongSheets(song)) {
        for (const loi of oNhipThieuPhach(abc)) {
          expect.fail(`${song.slug}: ${loi}`);
        }
      }
    }
  });

  /*
   * **Ca test sinh ra từ một lỗi thật** — nốt thứ bảy của Für Elise phát ra Rê
   * thăng suốt từ lúc soạn bài, xem bẫy 25.
   *
   * Luật ký âm: dấu hoá có hiệu lực tới hết ô nhịp. Viết `^d` rồi sau đó trong
   * cùng ô viết `d` là được nốt Rê THĂNG, dù người gõ định viết Rê thường. Trên
   * bản nhạc chỗ đó trông hoàn toàn bình thường, nên mắt không bắt được.
   */
  it('không nốt nào thừa hưởng dấu hoá của nốt trước trong cùng ô nhịp', () => {
    for (const song of songs) {
      for (const abc of getSongSheets(song)) {
        for (const loi of dauHoaThuaHuong(abc)) {
          expect.fail(`${song.slug}: ${loi}`);
        }
      }
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
