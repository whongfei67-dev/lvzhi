import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Render as a circle (for avatars) */
  circle?: boolean;
}

function Skeleton({ className, circle, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-slate-200",
        circle ? "rounded-full" : "rounded-xl",
        className
      )}
      {...props}
    />
  );
}

/** Pre-built skeleton for a card row (avatar + two lines of text) */
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-start gap-4 rounded-2xl border border-slate-100 p-4", className)}>
      <Skeleton circle className="h-10 w-10 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}

/** Pre-built skeleton for a stat card */
function SkeletonStat({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3", className)}>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonStat };
