import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "律植管理后台",
  description: "律植独立管理后台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
