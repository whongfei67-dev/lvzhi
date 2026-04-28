"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Sparkles, Bot, DollarSign, Users,
  FileCheck, Shield, BarChart3, Settings, ChevronRight
} from "lucide-react";

const NAV_ITEMS = [
  { label: "创作者概览", href: "/creator", icon: LayoutDashboard },
  { label: "Skills 管理", href: "/creator/skills", icon: Sparkles },
  { label: "智能体管理", href: "/creator/agents", icon: Bot },
  { label: "收益管理", href: "/creator/earnings", icon: DollarSign },
  { label: "邀请管理", href: "/creator/invitations", icon: Users },
  { label: "试用邀请", href: "/creator/trials", icon: FileCheck },
];

const SECONDARY_ITEMS = [
  { label: "认证申请", href: "/creator/verification", icon: Shield },
  { label: "数据分析", href: "/creator/stats", icon: BarChart3 },
];

export function CreatorNav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col">
      {/* Logo */}
      <div className="border-b border-[#D9DED7] p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#284A3D]">
            <span className="text-sm font-bold text-white">律</span>
          </div>
          <span className="font-semibold text-[#2E3430]">创作者工作台</span>
        </Link>
      </div>

      {/* 主导航 */}
      <div className="flex-1 space-y-1 p-3">
        <p className="px-4 py-2 text-xs font-medium uppercase text-[#9AA59D]">主要功能</p>
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

        <p className="mt-6 px-4 py-2 text-xs font-medium uppercase text-[#9AA59D]">其他</p>
        {SECONDARY_ITEMS.map((item) => {
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
            </Link>
          );
        })}
      </div>

      {/* 底部 */}
      <div className="border-t border-[#D9DED7] p-3">
        <Link
          href="/workspace"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#5A6560] transition-colors hover:bg-[#EEF4EF] hover:text-[#284A3D]"
        >
          返回客户工作台
        </Link>
      </div>
    </nav>
  );
}
