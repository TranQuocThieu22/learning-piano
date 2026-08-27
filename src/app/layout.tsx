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

export const metadata: Metadata = {
  title: "Piano Learning App",
  description: "A comprehensive piano learning journey",
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
