"use client";

import Link from "next/link";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  actionHref?: string;
}

export function EmptyState({
  title = "暂无数据",
  description = "这里还没有内容",
  icon,
  action,
  actionHref,
}: EmptyStateProps) {
  const actionNode =
    typeof action === "string" && actionHref ? (
      <Link
        href={actionHref}
        className="inline-flex h-10 items-center rounded-xl bg-[#D4A574] px-4 text-sm font-semibold text-white hover:bg-[#B8860B]"
      >
        {action}
      </Link>
    ) : (
      action
    );

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-[#9AA59D]">{icon}</div>}
      <h3 className="text-lg font-semibold text-[#2E3430]">{title}</h3>
      <p className="mt-2 text-sm text-[#5A6560]">{description}</p>
      {actionNode && <div className="mt-6">{actionNode}</div>}
    </div>
  );
}
