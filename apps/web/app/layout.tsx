import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "律植 · 面向法律行业的灵感与实践平台",
    template: "%s | 律植",
  },
  description: "律植连接灵感、方法、工具与专业服务，帮助法律从业者发现价值、创造价值、实现价值。汇聚专业律师认证的技能包与智能体，提供社区交流、合作机会与法律服务。",
  keywords: ["法律", "智能体", "AI法律助手", "法律科技", "律师服务", "法律灵感", "法律工具", "法律社区", "企业合规", "合同审查"],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "律植",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&family=Noto+Serif+TC:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
