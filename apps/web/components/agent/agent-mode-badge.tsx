import * as React from "react";
import { cn } from "@/lib/utils";

export type AgentMode = "free" | "trial" | "paid";

interface ModeBadgeProps {
  mode: AgentMode;
  className?: string;
}

const config: Record<AgentMode, { label: string; className: string }> = {
  free:  { label: "免费版",  className: "bg-emerald-50 text-emerald-700" },
  trial: { label: "免费试用", className: "bg-amber-50 text-amber-700" },
  paid:  { label: "商用版",  className: "bg-blue-50 text-blue-700" },
};

/** Derive AgentMode from raw DB fields */
export function inferMode(agent: {
  price: number;
  is_free_trial?: boolean | null;
  pricing_model?: string | null;
}): AgentMode {
  if (agent.pricing_model === "free" || agent.price === 0) return "free";
  if (agent.is_free_trial) return "trial";
  return "paid";
}

export function ModeBadge({ mode, className }: ModeBadgeProps) {
  const { label, className: c } = config[mode];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", c, className)}>
      {label}
    </span>
  );
}
