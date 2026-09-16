import { describe, expect, it } from 'vitest';
import { buildAccessGrantedEmail } from './email-message';

const MAU = {
  tenNguoiHoc: 'Minh',
  tenGoi: 'Nền tảng',
  linkApp: 'https://pianojourney.rehover.io',
  linkMessenger: 'https://m.me/61593938880341',
};

describe('thư báo đã mở khoá giáo trình', () => {
  it('gọi đúng tên người học và nói rõ đã mở gói nào', () => {
    const thu = buildAccessGrantedEmail(MAU);
    expect(thu.text).toContain('Chào Minh,');
    expect(thu.text).toContain('Nền tảng');
    expect(thu.html).toContain('Nền tảng');
  });

  it('tài khoản Google không có tên thì vẫn xưng hô tử tế, không để trống', () => {
    for (const ten of [null, '', '   ']) {
      const thu = buildAccessGrantedEmail({ ...MAU, tenNguoiHoc: ten });
      expect(thu.text).toContain('Chào bạn,');
      expect(thu.html).toContain('Chào bạn,');
    }
  });

  it('tên có ký tự của HTML thì hiện nguyên văn chứ không phá khung thư', () => {
    const thu = buildAccessGrantedEmail({ ...MAU, tenNguoiHoc: '<b>Minh</b> & bạn' });
    expect(thu.html).toContain('&lt;b&gt;Minh&lt;/b&gt; &amp; bạn');
    expect(thu.html).not.toContain('<b>Minh</b>');
  });

  it('luôn có đường nhắn Facebook kèm một câu hỏi trả lời được ngay', () => {
    // Trang Facebook không nhắn trước cho ai được — câu trả lời của người học là
    // thứ duy nhất mở ra đường để hỏi tiếp. Mất một trong hai thứ này là mất
    // luôn đường liên lạc, nên test canh cả hai.
    const thu = buildAccessGrantedEmail(MAU);
    for (const ban of [thu.text, thu.html]) {
      expect(ban).toContain(MAU.linkMessenger);
      expect(ban).toContain('bạn đang tập trên cây đàn nào?');
    }
  });

  it('có đường mở app ở cả bản chữ trơn lẫn bản HTML', () => {
    const thu = buildAccessGrantedEmail(MAU);
    expect(thu.text).toContain(MAU.linkApp);
    expect(thu.html).toContain(`href="${MAU.linkApp}"`);
  });

  it('bản chữ trơn không lẫn thẻ HTML nào', () => {
    // Thư thiếu bản chữ trơn tử tế bị bộ lọc thư rác chấm nặng hơn, mà thư báo
    // mở khoá rơi vào hộp Spam thì người học vẫn ngồi đợi như chưa gửi gì.
    const thu = buildAccessGrantedEmail(MAU);
    expect(thu.text).not.toMatch(/<[a-z/]/i);
  });

  it('tiêu đề nói ngay chuyện gì vừa xảy ra', () => {
    expect(buildAccessGrantedEmail(MAU).subject).toContain('mở khoá');
  });
});
