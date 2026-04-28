"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Bell } from "lucide-react";

interface TopbarProps {
  title?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
  notificationCount?: number;
  className?: string;
}

/**
 * 工作台顶部栏组件 - UI预演方案
 * 
 * 设计：
 * - 背景：半透明奶油色 + 毛玻璃效果
 * - 高度：64px
 * - 阴影：底部细线
 */
export function DashboardTopbar({
  title = "工作台",
  showSearch = true,
  showNotifications = true,
  notificationCount = 0,
  className = "",
}: TopbarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className={`topbar ${className}`}>
      <h1 className="topbar-title">{title}</h1>
      <div className="topbar-actions">
        {showSearch && (
          <div className="topbar-search">
            <Search className="w-4 h-4" />
            <input
              type="text"
              placeholder="搜索作品或数据..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
        {showNotifications && (
          <Link href="/workspace/notifications" className="topbar-btn" title="通知">
            <Bell className="w-[18px] h-[18px]" />
            {notificationCount > 0 && <span className="dot" />}
          </Link>
        )}
      </div>
    </header>
  );
}
