import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import '@mantine/core/styles.css';
import "./globals.css";
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { ThemeColorMeta } from '@/components/ThemeColorMeta';

const beVietnamPro = Be_Vietnam_Pro({ 
  subsets: ["latin", "vietnamese"],
  weight: ['400', '500', '600', '700', '800'] 
});

const TEN_DAY_DU = 'Piano Journey — Giáo trình piano online, học từ số 0';
const MO_TA =
  'Giáo trình tự học piano cho người mới bắt đầu, bằng tiếng Việt. Giải thích ' +
  'vì sao chứ không chỉ bảo làm gì, kèm máy đánh nhịp và bài luyện nhận nốt.';

export const metadata: Metadata = {
  /**
   * Cần `metadataBase` để đường dẫn ảnh tương đối bên dưới nở thành URL đầy đủ —
   * thiếu nó thì ô xem trước lúc chia sẻ link không có ảnh. **Đổi tên miền thì
   * phải sửa dòng này.**
   */
  metadataBase: new URL('https://learning-piano.vercel.app'),

  title: {
    default: TEN_DAY_DU,
    /**
     * Trang con chỉ khai tên riêng của nó (`title: 'Điều khoản sử dụng'`), phần
     * thương hiệu do template nối vào. Không có template thì tab trình duyệt chỉ
     * hiện "Điều khoản sử dụng", không ai biết của trang nào.
     */
    template: '%s — Piano Journey',
  },
  description: MO_TA,

  /**
   * Người beta sẽ dán link vào Messenger và nhóm Facebook. Không khai openGraph
   * thì ô xem trước hiện trống trơn, trông như link rác và không ai bấm.
   */
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'Piano Journey',
    title: TEN_DAY_DU,
    description: MO_TA,
    images: [
      {
        url: '/images/chuong-00/anime-piano.jpg',
        width: 1376,
        height: 768,
        alt: 'Sân khấu với cây đàn grand piano dưới ánh đèn',
      },
    ],
  },

  // Cho phép iOS mở từ màn hình chính ở chế độ toàn màn hình, giống manifest.ts
  // lo phần Android. Safari không đọc manifest cho việc này.
  appleWebApp: { capable: true, title: 'Piano Journey', statusBarStyle: 'default' },
};

/**
 * `viewportFit: 'cover'` cho phép trang tràn xuống dưới thanh điều hướng của
 * Android và phần khuyết của iPhone; đổi lại phải tự chừa chỗ bằng
 * `env(safe-area-inset-*)` — xem `.safe-*` trong globals.css. Không bật cờ này
 * thì `env(safe-area-inset-bottom)` luôn trả về 0.
 *
 * `themeColor` nhuộm thanh trạng thái theo đúng màu nền trang, để dải trên cùng
 * không còn nhìn như một thanh riêng nằm đè lên giao diện. Giá trị ở đây là màu
 * của giao diện sáng (mặc định của app); khi người học bật giao diện tối thì
 * `ThemeColorMeta` sửa lại thẻ meta này ngay trên máy.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body className={beVietnamPro.className} suppressHydrationWarning>
        <MantineProvider defaultColorScheme="light">
          <ThemeColorMeta />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
