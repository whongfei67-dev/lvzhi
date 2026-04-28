import Link from "next/link";
import { Logo } from "@/components/common/logo";
import { preferTradForKeShiLu } from "@/lib/keshilu-text";

/**
 * 底部导航 — 对齐《律植项目蓝图 v6.4》§9
 *
 * 视觉方向：琥珀咖啡色系
 */

const COLUMNS = [
  {
    title: "发现",
    links: [
      { label: "灵感广场", href: "/inspiration" },
      { label: "社区", href: "/community" },
      { label: "发现律师", href: "/lawyers" },
    ],
  },
  {
    title: "创作",
    links: [
      { label: "创作指南", href: "/creator-guide" },
      { label: "开始创作", href: "/creator-guide/getting-started" },
      { label: "平台规则", href: "/creator-guide/policies" },
    ],
  },
  {
    title: "机会",
    links: [
      { label: "合作机会", href: "/opportunities" },
      { label: "发布机会", href: "/opportunities/create" },
      { label: "浏览岗位", href: "/opportunities" },
    ],
  },
  {
    title: "平台",
    links: [
      { label: "关于律植", href: "/" },
      { label: "平台规则", href: "/creator-guide/policies" },
      { label: "隐私政策", href: "/privacy" },
      { label: "用户协议", href: "/terms" },
      { label: "联系我们", href: "/contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer
      className="border-t"
      style={{ borderColor: "rgba(212,165,116,0.25)", background: "#FFF8F0" }}
    >
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">

          {/* Brand */}
          <div className="space-y-4">
            <Logo size="nav" tone="light" ariaLabel="律植 · 返回首页" />
            <p className="max-w-xs text-sm leading-relaxed text-[#5D4E3A]">
              面向法律行业的灵感与实践平台。连接灵感、方法、工具与专业服务。
            </p>
            <a
              href="mailto:15395301253@163.com"
              className="text-sm text-[#9A8B78] transition-colors hover:text-[#5C4033]"
            >
              15395301253@163.com
            </a>
          </div>

          {/* Nav columns */}
          {COLUMNS.map((col) => (
            <div key={col.title} className="space-y-3">
              <p className="text-sm font-semibold text-[#5C4033]">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors hover:text-[#5C4033]"
                      style={{ color: "#5D4E3A" }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-8 flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row"
          style={{ borderColor: "rgba(212,165,116,0.25)" }}
        >
          <div className="text-sm" style={{ color: "#9A8B78" }}>
            <p>© {new Date().getFullYear()} 律植. All rights reserved.</p>
            <p className="mt-1">沪ICP备2026012971号</p>
          </div>
          <p className="footer-brand-motto sm:max-w-[min(100%,22rem)]">
            {preferTradForKeShiLu("生长 · 互助 · 专业")}
          </p>
        </div>

        {process.env.NODE_ENV === "development" ? (
          <div className="mt-6 text-center">
            <Link
              href="/project-test"
              className="text-xs font-medium text-[#D4A574] underline decoration-[rgba(212,165,116,0.5)] underline-offset-2 hover:text-[#5C4033]"
            >
              项目联调测试页（/project-test，仅开发环境显示）
            </Link>
          </div>
        ) : null}
      </div>
    </footer>
  );
}