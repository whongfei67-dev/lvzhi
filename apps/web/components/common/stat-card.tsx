import * as React from "react";
import { cn } from "@/lib/utils";

type Trend = "up" | "down" | "neutral";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  /** Sub-line text under the value */
  description?: string;
  trend?: Trend;
  trendValue?: string;
  /** Optional icon slot */
  icon?: React.ReactNode;
  className?: string;
}

const trendConfig: Record<Trend, { color: string; arrow: string }> = {
  up:      { color: "text-emerald-600", arrow: "↑" },
  down:    { color: "text-rose-600",    arrow: "↓" },
  neutral: { color: "text-slate-400",   arrow: "→" },
};

export function StatCard({ label, value, description, trend, trendValue, icon, className }: StatCardProps) {
  const tc = trend ? trendConfig[trend] : null;

  return (
    <div className={cn("rounded-3xl border border-slate-200 bg-white p-6 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
          {(description || tc) && (
            <div className="mt-2 flex items-center gap-2">
              {tc && trendValue && (
                <span className={cn("text-xs font-semibold", tc.color)}>
                  {tc.arrow} {trendValue}
                </span>
              )}
              {description && (
                <span className="text-sm text-slate-400">{description}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
