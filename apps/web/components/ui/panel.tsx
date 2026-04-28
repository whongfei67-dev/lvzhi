import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Panel = titled card with optional action link — the most common layout atom
// used across admin, lawyer, and recruiter dashboards.

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  /** Short action label shown top-right */
  action?: string;
  /** href for the action link */
  actionHref?: string;
  /** Callback for the action (use instead of actionHref for client handlers) */
  onAction?: () => void;
  /** Remove default padding */
  noPadding?: boolean;
}

export function Panel({
  title,
  action,
  actionHref,
  onAction,
  noPadding,
  className,
  children,
  ...props
}: PanelProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-200 bg-white shadow-sm",
        !noPadding && "p-6",
        className
      )}
      {...props}
    >
      {/* header row */}
      <div className={cn("flex items-center justify-between", !noPadding && "mb-4")}>
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        {action && (
          actionHref ? (
            <Link
              href={actionHref}
              className="text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors"
            >
              {action}
            </Link>
          ) : onAction ? (
            <button
              onClick={onAction}
              className="text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors"
            >
              {action}
            </button>
          ) : null
        )}
      </div>
      {children}
    </div>
  );
}
