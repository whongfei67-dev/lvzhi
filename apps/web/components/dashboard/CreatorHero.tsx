"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Plus } from "lucide-react";

interface StatItem {
  value: string;
  label: string;
}

interface CreatorHeroProps {
  userName?: string;
  monthlyEarnings?: string;
  earningsTrend?: string;
  stats?: StatItem[];
  pendingInvitations?: number;
  onActionClick?: () => void;
}

/**
 * 创作者欢迎区组件 - UI预演方案
 * 
 * 设计：
 * - 深色背景（咖啡色渐变）
 * - 背景图片（律师/法律相关）
 * - 5项统计数据横排
 * - 快捷操作按钮
 */
export function CreatorHero({
  userName = "创作者",
  monthlyEarnings = "0",
  earningsTrend = "0%",
  stats = [],
  pendingInvitations = 0,
  onActionClick,
}: CreatorHeroProps) {
  const defaultStats: StatItem[] = stats.length > 0 ? stats : [
    { value: "¥ 0", label: "本月收益" },
    { value: "¥ 0", label: "累计收益" },
    { value: "0", label: "Skills" },
    { value: "0", label: "智能体" },
    { value: "0", label: "本月浏览" },
  ];

  const trendNum = parseFloat(earningsTrend.replace(/[^0-9.-]/g, "")) || 0;
  const trendUp = trendNum >= 0;

  return (
    <div className="creator-hero">
      <div className="creator-hero-bg" />
      <div className="creator-hero-content">
        {/* 欢迎行 */}
        <div className="creator-welcome-row">
          <div className="creator-welcome-left">
            <div className="creator-welcome-greeting">欢迎回来，</div>
            <div className="creator-welcome-name">
              {userName}
              <span className="creator-badge">
                <Sparkles className="w-[10px] h-[10px]" />
                认证创作者
              </span>
            </div>
            <div className="creator-welcome-desc">
              本月收益 {monthlyEarnings}，{trendUp ? "上升" : "下降"} {Math.abs(trendNum)}%
            </div>
          </div>
          <div className="creator-quick-actions">
            <Link href="/creator/skills/new" className="creator-quick-btn">
              <Plus className="w-4 h-4" />
              创建 Skills
            </Link>
            <Link href="/creator/agents/new" className="creator-quick-btn">
              <Plus className="w-4 h-4" />
              创建智能体
            </Link>
          </div>
        </div>

        {/* 统计数据 */}
        <div className="creator-stats">
          {defaultStats.map((stat, index) => (
            <div key={index} className="creator-stat-card">
              <div className="creator-stat-value">{stat.value}</div>
              <div className="creator-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 待处理通知 */}
      {pendingInvitations > 0 && (
        <div className="alert-banner">
          <div className="alert-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="alert-content">
            <div className="alert-title">您有 {pendingInvitations} 条试用邀请待处理</div>
            <div className="alert-desc">查看用户试用申请，及时回复可提高转化率</div>
          </div>
          <Link href="/creator/invitations?tab=trial" className="alert-action">
            立即处理 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

/**
 * 客户工作台欢迎区组件
 */
interface WorkspaceHeroProps {
  userName?: string;
  stats?: StatItem[];
  statsLoading?: boolean;
}

export function WorkspaceHero({
  userName = "用户",
  stats = [],
  statsLoading = false,
}: WorkspaceHeroProps) {
  const defaultStats: StatItem[] = stats.length > 0 ? stats : [
    { value: "0", label: "已购项目" },
    { value: "0", label: "收藏" },
    { value: "0", label: "邀请" },
    { value: "0", label: "帖子" },
  ];

  return (
    <div className="creator-hero">
      <div className="creator-hero-bg" />
      <div className="creator-hero-content">
        {/* 欢迎行 */}
        <div className="creator-welcome-row">
          <div className="creator-welcome-left">
            <div className="creator-welcome-greeting">欢迎回来，</div>
            <div className="creator-welcome-name">
              {userName}
            </div>
            <div className="creator-welcome-desc">
              这里是您的个人数据中心
            </div>
          </div>
        </div>

        {/* 统计数据 */}
        <div className="creator-stats">
          {defaultStats.map((stat, index) => (
            <div key={index} className="creator-stat-card">
              {statsLoading ? (
                <div className="h-7 w-16 animate-pulse rounded bg-white/10" />
              ) : (
                <div className="creator-stat-value">{stat.value}</div>
              )}
              <div className="creator-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
