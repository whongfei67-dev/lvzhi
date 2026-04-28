"use client";

import Link from "next/link";
import { Search, Plus, Lock } from "lucide-react";
import { ReactNode } from "react";
import { EmptyState } from "./empty-state";

interface CardGridProps {
  children: ReactNode;
  className?: string;
  minCardWidth?: string;
}

export function CardGrid({ children, className = "", minCardWidth = "280px" }: CardGridProps) {
  return (
    <div
      className={`grid gap-4 lg:grid-cols-3 sm:grid-cols-2 ${className}`}
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}, 1fr))` }}
    >
      {children}
    </div>
  );
}

interface ListViewProps {
  children: ReactNode;
  className?: string;
}

export function ListView({ children, className = "" }: ListViewProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {children}
    </div>
  );
}

interface LoginPromptProps {
  action?: string;
  className?: string;
}

export function LoginPrompt({ action = "登录后操作", className = "" }: LoginPromptProps) {
  return (
    <div className={`rounded-xl border border-[#D9DED7] bg-[#EEF4EF] p-6 text-center ${className}`}>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white">
        <Lock className="h-6 w-6 text-[#5C4033]" />
      </div>
      <h3 className="font-semibold text-[#2E3430]">登录后{action}</h3>
      <p className="mt-2 text-sm text-[#5A6560]">
        成为律植会员，解锁更多功能
      </p>
      <div className="mt-4 flex justify-center gap-3">
        <Link
          href="/login"
          className="rounded-xl border border-[#D9DED7] bg-white px-5 py-2 text-sm font-medium text-[#2E3430] transition-colors hover:border-[#5C4033] hover:text-[#5C4033]"
        >
          登录
        </Link>
        <Link
          href="/register"
          className="rounded-xl bg-[#5C4033] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3A6354]"
        >
          注册
        </Link>
      </div>
    </div>
  );
}

interface CreatePromptProps {
  title?: string;
  description?: string;
  href?: string;
  className?: string;
}

export function CreatePrompt({
  title = "开始创作",
  description = "分享你的知识和经验，获得收益",
  href = "/creator/guide",
  className = "",
}: CreatePromptProps) {
  return (
    <div className={`rounded-xl border border-[#C4DBCB] bg-[#EEF4EF] p-6 ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white">
            <Plus className="h-6 w-6 text-[#5C4033]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#2E3430]">{title}</h3>
            <p className="mt-1 text-sm text-[#5A6560]">{description}</p>
          </div>
        </div>
        <Link
          href={href}
          className="shrink-0 rounded-xl bg-[#5C4033] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3A6354]"
        >
          开始
        </Link>
      </div>
    </div>
  );
}

interface SearchPromptProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
  className?: string;
}

export function SearchPrompt({
  placeholder = "搜索内容...",
  onSearch,
  className = "",
}: SearchPromptProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9AA59D]" />
      <input
        type="text"
        placeholder={placeholder}
        onChange={(e) => onSearch?.(e.target.value)}
        className="w-full rounded-xl border border-[#D9DED7] bg-white py-3.5 pl-14 pr-5 text-[#2E3430] placeholder:text-[#9AA59D] focus:border-[#5C4033] focus:outline-none focus:ring-2 focus:ring-[#5C4033]/10"
      />
    </div>
  );
}

interface DataCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function DataCard({
  label,
  value,
  trend,
  trendUp = true,
  icon,
  className = "",
}: DataCardProps) {
  return (
    <div className={`rounded-xl border border-[#D9DED7] bg-white p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[#5A6560]">{label}</p>
          <p className="mt-2 text-2xl font-bold text-[#2E3430]">{value}</p>
          {trend && (
            <p className={`mt-1 text-sm ${trendUp ? "text-[#2FA863]" : "text-[#D94D4D]"}`}>
              {trendUp ? "↑" : "↓"} {trend}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF4EF] text-[#5C4033]">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatBadgeProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  className?: string;
}

export function StatBadge({
  label,
  value,
  icon,
  className = "",
}: StatBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#EEF4EF] px-3 py-1.5 text-sm ${className}`}>
      {icon}
      <span className="font-medium text-[#5C4033]">{value}</span>
      <span className="text-[#5A6560]">{label}</span>
    </span>
  );
}
