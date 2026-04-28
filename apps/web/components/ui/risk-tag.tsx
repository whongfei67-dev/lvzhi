import * as React from "react";
import { cn } from "@/lib/utils";

export type RiskLevel = "low" | "medium" | "high" | "critical" | "unknown";

interface RiskTagProps {
  level: RiskLevel;
  /** Override display label */
  label?: string;
  /** Show numeric score alongside the label */
  score?: number;
  /** "badge" (default) or "pill" for a more compact inline style */
  variant?: "badge" | "pill";
  className?: string;
}

const CONFIG: Record<RiskLevel, {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  icon: string;
}> = {
  low:      { label: "低风险",  bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500",  icon: "●" },
  medium:   { label: "中风险",  bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-400",   icon: "▲" },
  high:     { label: "高风险",  bg: "bg-orange-50",   text: "text-orange-700",  border: "border-orange-200",  dot: "bg-orange-500",  icon: "▲" },
  critical: { label: "极高风险", bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500",     icon: "!" },
  unknown:  { label: "未评估",  bg: "bg-slate-100",   text: "text-slate-500",   border: "border-slate-200",   dot: "bg-slate-400",   icon: "?" },
};

export function RiskTag({ level, label, score, variant = "badge", className }: RiskTagProps) {
  const c = CONFIG[level] ?? CONFIG.unknown;
  const displayLabel = label ?? c.label;

  if (variant === "pill") {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        c.bg, c.text, className
      )}>
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", c.dot)} />
        {displayLabel}
        {score !== undefined && <span className="opacity-60">·{score}</span>}
      </span>
    );
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold",
      c.bg, c.text, c.border, className
    )}>
      <span className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-md text-[9px] font-bold",
        level === "critical" ? "bg-red-500 text-white"
          : level === "high" ? "bg-orange-500 text-white"
          : level === "medium" ? "bg-amber-400 text-white"
          : level === "low" ? "bg-emerald-500 text-white"
          : "bg-slate-300 text-white"
      )}>
        {c.icon}
      </span>
      {displayLabel}
      {score !== undefined && (
        <span className="ml-0.5 rounded-md bg-white/60 px-1 text-[10px] font-bold tabular-nums">
          {score}
        </span>
      )}
    </span>
  );
}
