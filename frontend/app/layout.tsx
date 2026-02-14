import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "aikai | 智能助手",
  description: "aikai 前端对话界面",
  icons: {
    icon: "/logo-without-text.png",
    shortcut: "/logo-without-text.png",
    apple: "/logo-without-text.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={manrope.variable}>{children}</body>
    </html>
  );
}
