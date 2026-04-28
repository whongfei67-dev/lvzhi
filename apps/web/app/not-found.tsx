import Link from "next/link";
import { Home, Search, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-68px)] items-center justify-center bg-[#F7FBFE] px-6">
      <div className="w-full max-w-lg text-center">
        {/* 大数字 */}
        <div className="mb-8 select-none">
          <span className="bg-gradient-to-b from-[#DFE9EE] to-[#EDF3F6] bg-clip-text text-[120px] font-black text-transparent leading-none">
            404
          </span>
        </div>

        <h1 className="mb-3 text-2xl font-bold text-[#26363D]">页面不存在或已被移除</h1>
        <p className="mb-8 text-[#55656D] leading-relaxed">
          你访问的页面可能已下线或链接有误。
          <br />
          可以从以下入口重新开始。
        </p>

        {/* 主要 CTA */}
        <div className="mb-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#26363D] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1C2A30] transition-colors sm:w-auto"
          >
            <Home className="h-4 w-4" /> 返回首页
          </Link>
          <Link
            href="/inspiration"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#DFE9EE] bg-white px-6 py-3 text-sm font-medium text-[#26363D] hover:border-[#CFE1F7] transition-colors sm:w-auto"
          >
            <Search className="h-4 w-4" /> 逛灵感广场
          </Link>
        </div>

        {/* 热门入口 */}
        <div className="rounded-2xl border border-[#DFE9EE] bg-white p-5">
          <p className="mb-4 text-sm font-medium text-[#87949B]">或前往这些页面</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { label: "找律师", href: "/lawyers", emoji: "⚖️" },
              { label: "社区", href: "/community", emoji: "💬" },
              { label: "合作机会", href: "/opportunities", emoji: "🤝" },
              { label: "创作指南", href: "/creator-guide", emoji: "✨" },
              { label: "灵感广场", href: "/inspiration", emoji: "💡" },
              { label: "排行榜", href: "/lawyers/rankings", emoji: "🏆" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-xl border border-[#EDF3F6] p-3 text-sm text-[#55656D] hover:border-[#CFE1F7] hover:text-[#26363D] transition-colors"
              >
                <span>{item.emoji}</span>
                {item.label}
                <ArrowRight className="ml-auto h-3.5 w-3.5 text-[#C0CDD2]" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
