"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Heart,
  Bell,
  Users,
  Settings,
  FileText,
  ChevronRight,
  Inbox,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "概览", href: "/workspace", icon: LayoutDashboard },
  { label: "申请成为创作者", href: "/workspace/become-creator", icon: Sparkles },
  { label: "已购内容", href: "/workspace/purchased", icon: Package },
  { label: "我的收藏", href: "/workspace/favorites", icon: Heart },
  { label: "机会投递", href: "/workspace/opportunity-applications", icon: Inbox },
  { label: "合作邀请", href: "/workspace/invitations", icon: Users },
  { label: "我的帖子", href: "/workspace/posts", icon: FileText },
  { label: "通知中心", href: "/workspace/notifications", icon: Bell },
];

const BOTTOM_ITEMS = [
  { label: "账号设置", href: "/workspace/settings", icon: Settings },
];

export function WorkspaceNav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col">
      {/* Logo */}
      <div className="border-b border-[#D9DED7] p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#284A3D]">
            <span className="text-sm font-bold text-white">律</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-[#2E3430]">律植</span>
            <span className="text-xs font-medium text-[#9AA59D]">客户工作台</span>
          </div>
        </Link>
      </div>

      {/* 主导航 */}
      <div className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#284A3D] text-white"
                  : "text-[#5A6560] hover:bg-[#EEF4EF] hover:text-[#284A3D]"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
              {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
            </Link>
          );
        })}
      </div>

      {/* 底部导航 */}
      <div className="space-y-1 border-t border-[#D9DED7] p-3">
        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#EEF4EF] text-[#284A3D]"
                  : "text-[#5A6560] hover:bg-[#EEF4EF] hover:text-[#284A3D]"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}

        {/* 退出登录 */}
        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#5A6560] transition-colors hover:bg-red-50 hover:text-red-600">
          <span>退出登录</span>
        </button>
      </div>
    </nav>
  );
}
