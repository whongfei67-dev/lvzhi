import * as React from "react";
import { cn } from "@/lib/utils";

export interface Metric {
  label: string;
  value: React.ReactNode;
  description?: string;
}

interface MetricGridProps {
  metrics: Metric[];
  /** Number of columns: 2 | 3 | 4 — auto-responsive */
  cols?: 2 | 3 | 4;
  /** Visual style */
  variant?: "card" | "plain" | "bordered";
  className?: string;
}

const colsMap = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
};

export function MetricGrid({ metrics, cols = 3, variant = "card", className }: MetricGridProps) {
  return (
    <div className={cn("grid gap-3", colsMap[cols], className)}>
      {metrics.map((m, i) => (
        <div
          key={i}
          className={cn(
            "rounded-2xl p-3",
            variant === "card"    && "bg-slate-50",
            variant === "bordered" && "border border-slate-200 bg-white",
            variant === "plain"   && ""
          )}
        >
          <p className="text-xs text-slate-500">{m.label}</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">{m.value}</p>
          {m.description && (
            <p className="mt-0.5 text-xs text-slate-400">{m.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
