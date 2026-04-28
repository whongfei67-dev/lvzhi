import * as React from "react";
import { cn } from "@/lib/utils";

// Agent statuses
export type AgentStatus = "active" | "pending_review" | "rejected" | "draft";
// Job statuses
export type JobStatus = "active" | "closed" | "draft";
// Application statuses
export type ApplicationStatus = "pending" | "viewed" | "interviewing" | "offered" | "rejected";
// Generic string fallback
export type AnyStatus = AgentStatus | JobStatus | ApplicationStatus | string;

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  // agent
  active:         { label: "已上架",  className: "bg-emerald-50 text-emerald-700" },
  pending_review: { label: "审核中",  className: "bg-amber-50 text-amber-700" },
  rejected:       { label: "已拒绝",  className: "bg-rose-50 text-rose-700" },
  draft:          { label: "草稿",    className: "bg-slate-100 text-slate-600" },
  // job
  closed:         { label: "已关闭",  className: "bg-slate-100 text-slate-600" },
  // application
  pending:        { label: "待查看",  className: "bg-amber-50 text-amber-700" },
  viewed:         { label: "已查看",  className: "bg-slate-100 text-slate-600" },
  interviewing:   { label: "面试中",  className: "bg-blue-50 text-blue-700" },
  offered:        { label: "已录用",  className: "bg-emerald-50 text-emerald-700" },
  // order
  paid:           { label: "已支付",  className: "bg-emerald-50 text-emerald-700" },
  refunding:      { label: "退款中",  className: "bg-amber-50 text-amber-700" },
  unpaid:         { label: "待支付",  className: "bg-slate-100 text-slate-600" },
  // review
  pending_review_zh: { label: "待初审", className: "bg-amber-50 text-amber-700" },
  reviewing:      { label: "审核中",  className: "bg-blue-50 text-blue-700" },
  approved:       { label: "已通过",  className: "bg-emerald-50 text-emerald-700" },
};

interface StatusBadgeProps {
  status: AnyStatus;
  /** Override the displayed label */
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: "bg-slate-100 text-slate-600" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        cfg.className,
        className
      )}
    >
      {label ?? cfg.label}
    </span>
  );
}
