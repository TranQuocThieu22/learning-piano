import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import '@mantine/core/styles.css';
import "./globals.css";
import { ColorSchemeScript, MantineProvider } from '@mantine/core';

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Piano Learning App",
  description: "A comprehensive piano learning journey",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body className={outfit.className} suppressHydrationWarning>
        <MantineProvider defaultColorScheme="dark">
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
