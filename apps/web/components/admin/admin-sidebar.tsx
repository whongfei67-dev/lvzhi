"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Bot, Sparkles, MessageSquare,
  ShoppingCart, Wallet, Shield, FileCheck, Database,
  Settings, UserCog, Lock, ChevronRight
} from "lucide-react";

interface AdminSidebarProps {
  isSuperadmin?: boolean;
}

export function AdminSidebar({ isSuperadmin = false }: AdminSidebarProps) {
  const pathname = usePathname();

  const mainItems = [
    { label: "管理概览", href: "/admin", icon: LayoutDashboard },
    { label: "用户管理", href: "/admin/users", icon: Users },
    { label: "内容审核", href: "/admin/review", icon: FileCheck },
    { label: "Skills 审核", href: "/admin/skills", icon: Sparkles },
    { label: "智能体审核", href: "/admin/agents", icon: Bot },
    { label: "社区管理", href: "/admin/community", icon: MessageSquare },
    { label: "订单管理", href: "/admin/orders", icon: ShoppingCart },
    { label: "提现审批", href: "/admin/withdraw", icon: Wallet },
    { label: "认证审核", href: "/admin/verification", icon: Shield },
    { label: "机会管理", href: "/admin/opportunities", icon: FileCheck },
  ];

  const superadminItems = [
    { label: "数据中心", href: "/admin/data", icon: Database },
    { label: "管理员管理", href: "/admin/admins", icon: UserCog },
    { label: "小黑屋", href: "/admin/blocked", icon: Lock },
    { label: "系统配置", href: "/admin/settings", icon: Settings },
  ];

  return (
    <nav className="flex h-full flex-col bg-white">
      {/* Logo */}
      <div className="border-b border-[#D9DED7] p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#284A3D]">
            <span className="text-sm font-bold text-white">管</span>
          </div>
          <div>
            <span className="font-semibold text-[#2E3430]">管理后台</span>
            <span className="ml-2 rounded bg-[#EEF4EF] px-2 py-0.5 text-xs font-medium text-[#284A3D]">
              {isSuperadmin ? "超管" : "管理员"}
            </span>
          </div>
        </Link>
      </div>

      {/* 主导航 */}
      <div className="flex-1 space-y-1 overflow-y-auto p-3">
        <p className="px-4 py-2 text-xs font-medium uppercase text-[#9AA59D]">主要功能</p>
        {mainItems.map((item) => {
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

        {/* 超管专属 */}
        {isSuperadmin && (
          <>
            <p className="mt-6 px-4 py-2 text-xs font-medium uppercase text-[#9AA59D]">系统管理</p>
            {superadminItems.map((item) => {
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
          </>
        )}
      </div>

      {/* 底部 */}
      <div className="border-t border-[#D9DED7] p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#5A6560] transition-colors hover:bg-[#EEF4EF] hover:text-[#284A3D]"
        >
          返回首页
        </Link>
      </div>
    </nav>
  );
}
