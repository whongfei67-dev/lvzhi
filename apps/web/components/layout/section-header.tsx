import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  /** Small eyebrow label above the title (colored) */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Primary CTA button label */
  action?: string;
  actionHref?: string;
  onAction?: () => void;
  /** Secondary flat button */
  secondaryAction?: string;
  secondaryActionHref?: string;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  actionHref,
  onAction,
  secondaryAction,
  secondaryActionHref,
  className,
}: SectionHeaderProps) {
  return (
    <section
      className={cn(
        "rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          {eyebrow && (
            <p className="text-sm font-semibold text-blue-700">{eyebrow}</p>
          )}
          <h1 className={cn("font-bold tracking-tight text-slate-950", eyebrow ? "mt-2 text-3xl" : "text-3xl")}>
            {title}
          </h1>
          {description && (
            <p className="mt-3 text-slate-600 leading-7">{description}</p>
          )}
        </div>

        {(action || secondaryAction) && (
          <div className="flex flex-wrap gap-3 shrink-0">
            {secondaryAction && (
              secondaryActionHref ? (
                <Link
                  href={secondaryActionHref}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {secondaryAction}
                </Link>
              ) : (
                <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                  {secondaryAction}
                </button>
              )
            )}
            {action && (
              actionHref ? (
                <Link
                  href={actionHref}
                  className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-md transition-shadow"
                >
                  {action}
                </Link>
              ) : (
                <button
                  onClick={onAction}
                  className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-md transition-shadow"
                >
                  {action}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}
