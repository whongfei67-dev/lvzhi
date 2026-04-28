"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface SidebarItem {
  label: string;
  href: string;
  /** Optional badge number (e.g. pending count) */
  badge?: number;
  /** Optional icon */
  icon?: React.ReactNode;
}

interface SidebarProps {
  title?: string;
  items: SidebarItem[];
  /** Override active detection: item.href must equal this value */
  activeHref?: string;
  className?: string;
}

export function Sidebar({ title, items, activeHref, className }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (activeHref !== undefined) return href === activeHref;
    return pathname === href;
  }

  return (
    <aside className={cn("rounded-3xl border border-slate-200 bg-white p-4 shadow-sm", className)}>
      {title && (
        <div className="px-3 py-2 text-sm font-semibold text-slate-950">{title}</div>
      )}
      <nav className={cn("space-y-1", title && "mt-2")}>
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {item.icon && (
                <span className={cn("shrink-0", active ? "text-white" : "text-slate-400")}>
                  {item.icon}
                </span>
              )}
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-blue-50 text-blue-700"
                  )}
                >
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
