'use client';

import { IconBook2, IconChevronLeft, IconChevronRight, IconHome, IconMap2, IconMetronome } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';

/**
 * Thanh tab dưới đáy — đường điều hướng chính của app.
 *
 * Vì sao ở dưới đáy: đó là vùng ngón cái với tới được khi cầm máy một tay. Thanh
 * bên cũ nằm sau nút hamburger ở góc trên bên trái, góc xa ngón cái nhất trên
 * một màn hình 6 inch, mà lại là đường duy nhất để đi bất cứ đâu — nay đã bỏ hẳn
 * (xem `AppLayout.tsx`).
 *
 * Năm mục là năm việc làm hằng ngày. Hai trong số đó — Mục lục và Bài tập — liệt
 * kê đầy đủ toàn bộ nội dung, nên bỏ thanh bên không làm mất đường đi tới trang
 * nào.
 *
 * Mỗi tab một màu (`data-section`, khai trong globals.css), trùng màu với biểu
 * tượng ở đầu trang tương ứng — nhìn màu là biết mình đang ở khu nào mà không cần
 * đọc chữ.
 *
 * z-index 200 đứng dưới thanh mời cài đặt (300) và lớp phủ tập trung (350), nên
 * lúc đang tập với đàn thì nó khuất hẳn, đúng ý chế độ tập trung.
 */

/*
 * Bốn mục, giảm từ năm ngày 11/09/2026.
 *
 * *Bài tập* và *Nhật ký* đã nhập thành **Đường đi**: hai trang đó vẽ cùng một
 * danh sách bài theo hai kiểu (ô tròn để nhảy tới, hàng có ô tick để đánh dấu),
 * nên người học phải nhớ trang nào làm việc gì — và cả hai đều bỏ sót lý thuyết.
 * Nay một chỗ lo cả ba việc: xem tới đâu, mở bài, và tick.
 *
 * *Mục lục* ở lại vì nó còn Lộ trình và Đọc thêm — những bài KHÔNG nằm trên đường
 * đi, không có thứ tự, và không tick được.
 */
/**
 * Xoay ngang thì thanh tab dời sang **mép trái** và thu lại còn biểu tượng.
 *
 * Vì sao đổi hẳn hướng chứ không chỉ làm mỏng đi: xoay ngang là lúc **chiều cao**
 * thành thứ khan hiếm nhất — điện thoại chỉ còn khoảng 360px, mà một dải ngang 76px
 * ăn hơn một phần năm trong đó. Bề ngang thì ngược lại, đang thừa. Dời sang cạnh
 * trái là trả lại đúng thứ đang thiếu bằng thứ đang thừa.
 *
 * Mép TRÁI chứ không mép phải: xoay ngang thì hai tay ôm hai cạnh máy, mà thao tác
 * điều hướng hầu như luôn đi trước thao tác đọc — tay trái rảnh hơn tay phải đang
 * chực cuộn.
 *
 * Mở rộng ra có nhãn chữ thì thanh **đẩy nội dung dạt ra**, không đè lên. Bản đầu
 * cho nó đè vì sợ mỗi lần gạt là cả trang xô một cái, nhưng cái giá đắt hơn: thanh
 * 172px che mất mảng bên trái, mà bên trái là chỗ mọi dòng chữ bắt đầu — tiêu đề
 * thẻ bị cụt đúng phần đầu câu.
 */
const RAIL_KEY = 'tab-bar-rail';

/**
 * Kho nhớ trạng thái thu/mở của thanh dọc.
 *
 * Vì sao phải qua `useSyncExternalStore` chứ không đọc `localStorage` trong một
 * hiệu ứng: máy chủ không có `localStorage`, nên đọc lúc dựng state là HTML hai
 * bên khác nhau và React báo lệch hydration; còn đọc trong hiệu ứng thì đó là
 * `setState` thẳng trong effect, thứ quy tắc lint của repo cấm và cũng làm vẽ
 * thừa một lần. `useSyncExternalStore` sinh ra đúng cho chuyện này: nó dùng ảnh
 * chụp của máy chủ trong lúc hydrate rồi mới đổi sang ảnh chụp thật.
 *
 * Cùng khuôn với kho nhớ lựa chọn ở `NoteRecognitionDrill.tsx`.
 */
const listeners = new Set<() => void>();
let cached: boolean | null = null;

function getSnapshot(): boolean {
  if (cached === null) {
    try {
      cached = window.localStorage.getItem(RAIL_KEY) === 'expanded';
    } catch {
      // Chế độ riêng tư chặn localStorage — cứ để thu lại, app vẫn chạy.
      cached = false;
    }
  }
  return cached;
}

/** Máy chủ luôn vẽ trạng thái thu lại, nên lần vẽ đầu ở hai bên giống hệt nhau. */
function getServerSnapshot(): boolean {
  return false;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function storeRail(next: boolean) {
  cached = next;
  try {
    window.localStorage.setItem(RAIL_KEY, next ? 'expanded' : 'collapsed');
  } catch {
    // Không lưu được thì thôi, lần sau mở lại ở trạng thái thu.
  }
  for (const onChange of listeners) onChange();
}

const TABS = [
  { href: '/', label: 'Trang chủ', Icon: IconHome, section: 'home' },
  { href: '/library', label: 'Mục lục', Icon: IconBook2, section: 'library' },
  { href: '/path', label: 'Đường đi', Icon: IconMap2, section: 'exercises' },
  { href: '/metronome', label: 'Nhịp', Icon: IconMetronome, section: 'metronome' },
];

/**
 * Tab nào đang sáng. Trang bài học không có tab riêng nên sáng tab đã dẫn tới nó:
 * lý thuyết và bài tập thuộc *Đường đi* (từ 12/09/2026 đó là đường DUY NHẤT tới
 * lý thuyết — Mục lục không liệt kê chương nữa), còn lộ trình, đọc thêm, bài hát
 * và tin cập nhật thuộc *Mục lục*. Không có hàm này thì đang đọc bài là cả bốn
 * tab đều tắt, mất mốc định hướng.
 *
 * Tên thư mục nội dung giữ tiếng Việt có chủ ý — xem mục đường dẫn ở `AGENTS.md`.
 */
function activeTabHref(pathname: string): string {
  // Mọi bước trên đường đi — lý thuyết lẫn bài tập — đều sáng tab *Đường đi*, vì
  // đó là nơi vừa dẫn họ tới đây. Trang chương cũng vậy.
  if (pathname.startsWith('/03-exercises/')) return '/path';
  if (pathname.startsWith('/02-chapters/')) return '/path';
  if (pathname.startsWith('/path')) return '/path';
  if (/^\/(01-roadmap|07-doc-them|08-bai-hat)\//.test(pathname)) return '/library';
  if (pathname.startsWith('/songs')) return '/library';
  // *Có gì mới* không có tab riêng (bốn tab là bốn việc làm hằng ngày, đọc tin
  // cập nhật thì không), nên sáng tab đã dẫn tới nó.
  if (pathname.startsWith('/updates')) return '/library';
  // So khớp chính xác cho phần còn lại: `/` là tiền tố của mọi đường dẫn nên so
  // kiểu startsWith sẽ làm tab Trang chủ luôn sáng.
  return pathname;
}

export function TabBar() {
  const activeHref = activeTabHref(usePathname());

  const expanded = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <nav
      className="tab-bar"
      data-expanded={expanded || undefined}
      aria-label="Điều hướng nhanh"
    >
      {/*
        Chỉ hiện khi thanh đã dời sang cạnh trái (CSS lo việc ẩn/hiện): thanh nằm
        dưới đáy vốn đã có nhãn chữ sẵn, không có gì để mở thêm.
      */}
      <button
        type="button"
        className="tab-bar__toggle"
        onClick={() => storeRail(!expanded)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Thu nhỏ thanh điều hướng' : 'Mở rộng thanh điều hướng'}
        data-testid="rail-toggle"
      >
        {expanded ? <IconChevronLeft size={18} /> : <IconChevronRight size={18} />}
      </button>

      {TABS.map(({ href, label, Icon, section }) => {
        const active = activeHref === href;
        return (
          <Link
            key={href}
            href={href}
            className="tab-bar__item"
            data-section={section}
            data-active={active || undefined}
            aria-current={active ? 'page' : undefined}
          >
            <span className="tab-bar__icon">
              <Icon size={22} stroke={active ? 2.2 : 1.8} />
            </span>
            <span className="tab-bar__label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
