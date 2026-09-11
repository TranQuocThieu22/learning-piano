import {
  ActionIcon,
  Alert,
  Button,
  Card,
  Checkbox,
  Input,
  Paper,
  SegmentedControl,
  createTheme,
  rem,
  type MantineColorsTuple,
} from '@mantine/core';

/**
 * Bộ màu và kiểu mặc định của cả app.
 *
 * **Chỉ được import từ client component** (`AppProviders.tsx`), không import từ
 * layout hay trang: `Button.extend` và các lời gọi tương tự bên dưới là thuộc tính
 * tĩnh của component Mantine, mà Server Component chỉ nhận được tham chiếu tới
 * component chứ không nhận thuộc tính gắn kèm — y hệt bẫy 1 trong
 * `docs/_internal/bay-ky-thuat.md`, lần này nổ ngay lúc dựng layout gốc.
 *
 * Vì sao màu rực hơn hẳn bản cũ: người học mở app trên điện thoại, giữa một ngày
 * nhiều thứ khác tranh sự chú ý. Giao diện xám trắng đọc như tài liệu; màu có
 * chủ đích làm nó đọc như một chỗ muốn quay lại. Nhưng màu chỉ nằm ở khung app —
 * bản nhạc vẫn luôn đen trên nền trắng như giấy (xem `.sheet-music-paper`).
 */

/** Tím thương hiệu, lấy từ dải màu của biểu tượng app (`public/icon.svg`). */
const brand: MantineColorsTuple = [
  '#f3efff',
  '#e4dbff',
  '#c7b4ff',
  '#a98aff',
  '#9068ff',
  '#7f52ff',
  '#6f40f5',
  '#5f31dd',
  '#5027bf',
  '#401f9c',
];

/**
 * Xám ngả tím thay cho xám trung tính của Mantine, để chữ phụ, viền và nền nút
 * cùng một họ với màu thương hiệu.
 *
 * Ô số 6 là màu chữ `dimmed` ở giao diện sáng — cố ý đậm hơn bản gốc của Mantine
 * (tỉ lệ tương phản ~4,9:1 trên nền trắng thay vì ~3,3:1), vì chữ phụ ở app này
 * phải đọc được từ giá nhạc cách mắt nửa sải tay.
 */
const gray: MantineColorsTuple = [
  '#f8f7fc',
  '#f0eef7',
  '#e6e3f0',
  '#d9d5e7',
  '#c2bdd6',
  '#a19bb9',
  '#736d8f',
  '#5d5878',
  '#47435f',
  '#322e47',
];

/**
 * Nền tối ngả chàm thay cho xám than. Mantine dùng ô 7 làm nền thẻ, ô 6 làm nền
 * ô nhập, ô 4 làm viền, ô 2 làm chữ phụ và ô 0 làm chữ chính.
 */
const dark: MantineColorsTuple = [
  '#dddbeb',
  '#b9b6d0',
  '#908cad',
  '#6d6989',
  '#4b4766',
  '#3a3653',
  '#2c2942',
  '#211e33',
  '#191727',
  '#12101d',
];

const FONT_STACK =
  'var(--font-be-vietnam), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

/** Bóng đổ ngả tím cho khớp với nền, bóng đen thuần trông bẩn trên nền màu. */
const shadow = (y: number, blur: number, alpha: number) =>
  `0 1px 2px rgba(34, 18, 84, 0.05), 0 ${y}px ${blur}px rgba(34, 18, 84, ${alpha})`;

export const theme = createTheme({
  primaryColor: 'brand',
  /*
   * Giao diện tối lấy ô 5 chứ không phải ô 4: nút đặc chữ trắng trên ô 4 chỉ đạt
   * ~3,7:1, dưới ngưỡng 4,5:1 cho chữ thường.
   */
  primaryShade: { light: 6, dark: 5 },
  colors: { brand, gray, dark },
  black: '#1c1733',
  /* Nút đặc màu vàng, chanh… tự chuyển chữ sang tối để còn đọc được. */
  autoContrast: true,

  fontFamily: FONT_STACK,
  headings: {
    fontFamily: FONT_STACK,
    fontWeight: '800',
    /*
     * Cỡ chữ tính cho màn hình điện thoại trước. Bản cũ để mặc định của Mantine
     * (h1 34px) nên tiêu đề dài của bài học chiếm ba bốn dòng trên máy 390px.
     */
    sizes: {
      h1: { fontSize: rem(30), lineHeight: '1.2' },
      h2: { fontSize: rem(24), lineHeight: '1.25' },
      h3: { fontSize: rem(20), lineHeight: '1.3' },
      h4: { fontSize: rem(17), lineHeight: '1.35' },
      h5: { fontSize: rem(15), lineHeight: '1.4' },
      h6: { fontSize: rem(14), lineHeight: '1.4' },
    },
  },

  defaultRadius: 'lg',
  defaultGradient: { from: 'brand.6', to: 'pink.5', deg: 135 },
  shadows: {
    xs: shadow(1, 3, 0.05),
    sm: shadow(4, 12, 0.06),
    md: shadow(10, 24, 0.1),
    lg: shadow(18, 40, 0.14),
    xl: shadow(28, 60, 0.18),
  },

  components: {
    /* Nút bo tròn hẳn đọc ra "bấm được" rõ hơn trên màn hình cảm ứng. */
    Button: Button.extend({ defaultProps: { radius: 'xl' } }),
    ActionIcon: ActionIcon.extend({ defaultProps: { radius: 'xl' } }),
    SegmentedControl: SegmentedControl.extend({ defaultProps: { radius: 'xl' } }),
    Card: Card.extend({ defaultProps: { radius: 'lg', shadow: 'sm' } }),
    Paper: Paper.extend({ defaultProps: { radius: 'lg' } }),
    Alert: Alert.extend({ defaultProps: { radius: 'lg' } }),
    Checkbox: Checkbox.extend({ defaultProps: { radius: 'md' } }),
    Input: Input.extend({ defaultProps: { radius: 'md' } }),
  },
});
