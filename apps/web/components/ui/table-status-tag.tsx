import * as React from "react";
import { cn } from "@/lib/utils";

export type TagColor = "green" | "blue" | "amber" | "red" | "slate" | "purple" | "orange" | "indigo";

export interface TableStatusTagProps {
  label: string;
  color?: TagColor;
  /** Show a colored dot before the label */
  dot?: boolean;
  className?: string;
}

const COLOR_MAP: Record<TagColor, { bg: string; text: string; dot: string }> = {
  green:  { bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
  blue:   { bg: "bg-blue-50",     text: "text-blue-700",    dot: "bg-blue-500" },
  amber:  { bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-400" },
  red:    { bg: "bg-red-50",      text: "text-red-700",     dot: "bg-red-500" },
  slate:  { bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400" },
  purple: { bg: "bg-purple-50",   text: "text-purple-700",  dot: "bg-purple-500" },
  orange: { bg: "bg-orange-50",   text: "text-orange-700",  dot: "bg-orange-500" },
  indigo: { bg: "bg-indigo-50",   text: "text-indigo-700",  dot: "bg-indigo-500" },
};

export function TableStatusTag({
  label,
  color = "slate",
  dot = true,
  className,
}: TableStatusTagProps) {
  const c = COLOR_MAP[color];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-xs font-medium",
        c.bg,
        c.text,
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", c.dot)} />}
      {label}
    </span>
  );
}
