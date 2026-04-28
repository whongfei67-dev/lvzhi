"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type UserRole = "seeker" | "creator" | "recruiter" | "client";

interface IdentitySelectorProps {
  value?: UserRole;
  onChange?: (role: UserRole) => void;
  disabled?: boolean;
  className?: string;
}

const IDENTITIES: {
  role: UserRole;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    role: "seeker",
    label: "人才（合作机会）",
    description: "在合作机会公区浏览、沟通与承接合作类需求",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    role: "creator",
    label: "创作者",
    description: "发布 AI 智能体的律师、法学生、开发者均可入驻",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.97z" />
      </svg>
    ),
  },
  {
    role: "recruiter",
    label: "机构客户（合作机会）",
    description: "律所或企业，在合作机会中发布与管理需求",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    role: "client",
    label: "需求方客户",
    description: "有法律需求、使用智能体服务的个人或企业",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
  },
];

const COLOR: Record<UserRole, string> = {
  seeker: "border-violet-400 bg-violet-50 shadow-violet-100",
  creator: "border-blue-500 bg-blue-50 shadow-blue-100",
  recruiter: "border-emerald-500 bg-emerald-50 shadow-emerald-100",
  client: "border-amber-400 bg-amber-50 shadow-amber-100",
};

const ICON_COLOR: Record<UserRole, string> = {
  seeker: "text-violet-600 bg-violet-100",
  creator: "text-blue-600 bg-blue-100",
  recruiter: "text-emerald-600 bg-emerald-100",
  client: "text-amber-600 bg-amber-100",
};

export function IdentitySelector({ value, onChange, disabled = false, className }: IdentitySelectorProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
      {IDENTITIES.map(({ role, label, description, icon }) => {
        const active = value === role;
        return (
          <button
            key={role}
            type="button"
            disabled={disabled}
            onClick={() => onChange?.(role)}
            className={cn(
              "relative flex items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all focus:outline-none",
              active
                ? `${COLOR[role]} shadow-sm`
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {/* Radio */}
            <span className={cn(
              "absolute right-3 top-3 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
              active ? "border-current" : "border-slate-300"
            )}>
              {active && <span className="h-2 w-2 rounded-full bg-current" />}
            </span>

            {/* Icon */}
            <span className={cn(
              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              active ? ICON_COLOR[role] : "bg-slate-100 text-slate-500"
            )}>
              {icon}
            </span>

            {/* Text */}
            <div className="min-w-0">
              <p className={cn("text-sm font-semibold", active ? "text-slate-950" : "text-slate-900")}>
                {label}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
