import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import '@mantine/core/styles.css';
import "./globals.css";
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { Analytics } from '@vercel/analytics/next';
import { ThemeColorMeta } from '@/components/ThemeColorMeta';
import { AmbientMusic } from '@/components/AmbientMusic';

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
  metadataBase: new URL('https://pianojourney.rehover.io'),

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
          {/*
            Nhạc nền phải nằm ở layout GỐC, không nằm trong `AppLayout`: mỗi trang
            tự dựng `AppLayout` của nó, nên chuyển trang là React gỡ cây cũ đi và
            nhạc sẽ đứt rồi bắt đầu lại ở mỗi lần bấm.
          */}
          <AmbientMusic />
          {children}
        </MantineProvider>
        {/*
          Đếm lượt truy cập. Không đặt cookie nên không phải dựng banner xin đồng
          ý, và chỉ gửi dữ liệu khi đã bật Web Analytics trong bảng điều khiển
          Vercel — chưa bật thì component này im lặng, không hỏng gì.

          Ở `pnpm dev` nó cố ý không gửi gì, chỉ ghi ra console trình duyệt. Nên
          muốn biết đã chạy thật chưa thì phải xem trên production, đừng ngồi chờ
          số ở máy mình.

          Trình chặn quảng cáo chặn được script này, nên số đo luôn thấp hơn số
          thật. Đọc như xu hướng, đừng đọc như con số tuyệt đối.
        */}
        <Analytics />
      </body>
    </html>
  );
}
