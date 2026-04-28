"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Sparkles,
  Bot,
  DollarSign,
  Briefcase,
  Users,
  Award,
  BarChart2,
  Settings,
  Home,
  ChevronRight,
  UserPlus,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeType?: "default" | "red";
}

interface SidebarProps {
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  showUserSection?: boolean;
}

/**
 * 深色侧边栏组件 - UI预演方案
 * 
 * 设计：
 * - 宽度：260px
 * - 背景：咖啡色 #5C4033
 * - 强调色：琥珀色 #D4A574
 * - 字体：思源宋体
 */
export function DashboardSidebar({
  userName = "用户",
  userRole = "创作者",
  userAvatar,
  showUserSection = true,
}: SidebarProps) {
  const pathname = usePathname() ?? "";

  // 主导航项
  const mainNavItems: NavItem[] = [
    { label: "创作者概览", href: "/creator", icon: LayoutDashboard },
    { label: "我的信息", href: "/creator/profile", icon: User },
    { label: "Skills 管理", href: "/creator/skills", icon: Sparkles },
    { label: "智能体管理", href: "/creator/agents", icon: Bot },
    { label: "收益管理", href: "/creator/earnings", icon: DollarSign },
    { label: "合作邀请", href: "/creator/invitations", icon: Briefcase },
    { label: "试用邀请", href: "/creator/invitations?tab=trial", icon: Users, badge: 3, badgeType: "red" },
  ];

  // 账号与认证
  const accountNavItems: NavItem[] = [
    { label: "认证申请", href: "/creator/verification", icon: Award },
    { label: "数据分析", href: "/creator/stats", icon: BarChart2 },
    { label: "账号设置", href: "/workspace/settings", icon: Settings },
  ];

  // 其他
  const otherNavItems: NavItem[] = [
    { label: "返回首页", href: "/", icon: Home },
  ];

  const isActive = (href: string) => {
    if (href === "/creator") {
      return pathname === "/creator" || pathname === "/creator/";
    }
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`nav-item ${active ? "active" : ""}`}
      >
        <Icon className="w-[18px] h-[18px]" />
        <span>{item.label}</span>
        {item.badge && (
          <span className={`nav-badge ${item.badgeType === "red" ? "nav-badge-red" : ""}`}>
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link href="/" className="sidebar-logo">
        <span className="sidebar-logo-dot" />
        <span className="sidebar-logo-text">律植</span>
      </Link>

      {/* 主导航 */}
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-label">创作者中心</div>
        </div>
        {mainNavItems.map(renderNavItem)}

        <div className="sidebar-section" style={{ marginTop: "1rem" }}>
          <div className="sidebar-section-label">账号与认证</div>
        </div>
        {accountNavItems.map(renderNavItem)}

        <div className="sidebar-section" style={{ marginTop: "1rem" }}>
          <div className="sidebar-section-label">其他</div>
        </div>
        {otherNavItems.map(renderNavItem)}
      </nav>

      {/* 用户信息 */}
      {showUserSection && (
        <div className="sidebar-footer">
          <Link href="/workspace/settings" className="sidebar-user">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="sidebar-user-avatar" />
            ) : (
              <div
                className="sidebar-user-avatar"
                style={{
                  background: "var(--amber)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  color: "white",
                }}
              >
                {userName.charAt(0)}
              </div>
            )}
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{userName}</div>
              <div className="sidebar-user-role">
                <Sparkles className="w-[10px] h-[10px]" />
                {userRole}
              </div>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
          </Link>
        </div>
      )}
    </aside>
  );
}

/**
 * 客户工作台侧边栏
 */
export function WorkspaceSidebar({
  userName = "用户",
  userAvatar,
  showUserSection = true,
}: SidebarProps) {
  const pathname = usePathname() ?? "";

  const mainNavItems: NavItem[] = [
    { label: "工作台", href: "/workspace", icon: LayoutDashboard },
    { label: "申请成为创作者", href: "/workspace/become-creator", icon: UserPlus },
    { label: "我的收藏", href: "/workspace/favorites", icon: Sparkles },
    { label: "已购项目", href: "/workspace/purchased", icon: Bot },
    { label: "我的帖子", href: "/workspace/posts", icon: Users },
    { label: "邀请记录", href: "/workspace/invitations", icon: Briefcase },
    { label: "消息通知", href: "/workspace/notifications", icon: Users, badge: 5, badgeType: "red" },
  ];

  const accountNavItems: NavItem[] = [
    { label: "个人资料", href: "/workspace/settings", icon: User },
    { label: "账号设置", href: "/workspace/settings", icon: Settings },
  ];

  const otherNavItems: NavItem[] = [
    { label: "返回首页", href: "/", icon: Home },
  ];

  const isActive = (href: string) => {
    if (href === "/workspace") {
      return pathname === "/workspace" || pathname === "/workspace/";
    }
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`nav-item ${active ? "active" : ""}`}
      >
        <Icon className="w-[18px] h-[18px]" />
        <span>{item.label}</span>
        {item.badge && (
          <span className={`nav-badge ${item.badgeType === "red" ? "nav-badge-red" : ""}`}>
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link href="/" className="sidebar-logo">
        <span className="sidebar-logo-dot" />
        <span className="sidebar-logo-text">律植</span>
      </Link>

      {/* 主导航 */}
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-label">个人中心</div>
        </div>
        {mainNavItems.map(renderNavItem)}

        <div className="sidebar-section" style={{ marginTop: "1rem" }}>
          <div className="sidebar-section-label">账号</div>
        </div>
        {accountNavItems.map(renderNavItem)}

        <div className="sidebar-section" style={{ marginTop: "1rem" }}>
          <div className="sidebar-section-label">其他</div>
        </div>
        {otherNavItems.map(renderNavItem)}
      </nav>

      {/* 用户信息 */}
      {showUserSection && (
        <div className="sidebar-footer">
          <Link href="/workspace/settings" className="sidebar-user">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="sidebar-user-avatar" />
            ) : (
              <div
                className="sidebar-user-avatar"
                style={{
                  background: "var(--amber)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  color: "white",
                }}
              >
                {userName.charAt(0)}
              </div>
            )}
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{userName}</div>
              <div className="sidebar-user-role">
                <User className="w-[10px] h-[10px]" />
                客户
              </div>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
          </Link>
        </div>
      )}
    </aside>
  );
}
