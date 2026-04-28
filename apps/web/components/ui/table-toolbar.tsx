"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { FilterOption } from "@/components/common/filter-bar";
import { FilterBar } from "@/components/common/filter-bar";

interface ToolbarAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TableToolbarProps {
  /** Section title shown on the left */
  title?: string;
  /** Total record count, renders "N 条记录" */
  total?: number;
  /** Inline search input */
  search?: {
    value: string;
    onChange: (v: string) => void;
    onSearch?: (v: string) => void;
    placeholder?: string;
  };
  /** Filter pills rendered below title row */
  filters?: {
    options: FilterOption[];
    value: string | string[];
    onChange: (v: string | string[]) => void;
    multiSelect?: boolean;
  };
  /** Right-side action buttons */
  actions?: ToolbarAction[];
  className?: string;
}

const ACTION_STYLE: Record<string, string> = {
  primary:
    "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-md",
  secondary:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  danger:
    "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100",
};

export function TableToolbar({
  title,
  total,
  search,
  filters,
  actions,
  className,
}: TableToolbarProps) {
  const hasTopRow = title || total !== undefined || search || (actions && actions.length > 0);

  return (
    <div className={cn("space-y-3", className)}>
      {hasTopRow && (
        <div className="flex flex-wrap items-center gap-3">
          {/* Title + count */}
          {(title || total !== undefined) && (
            <div className="flex items-baseline gap-2">
              {title && <h3 className="text-sm font-semibold text-slate-900">{title}</h3>}
              {total !== undefined && (
                <span className="text-xs text-slate-400">{total} 条记录</span>
              )}
            </div>
          )}

          <div className="flex flex-1 items-center justify-end gap-2">
            {/* Search */}
            {search && (
              <div className="relative flex h-9 min-w-[200px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-colors">
                <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="search"
                  value={search.value}
                  onChange={(e) => search.onChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && search.onSearch?.(search.value)}
                  placeholder={search.placeholder ?? "搜索…"}
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none [&::-webkit-search-cancel-button]:hidden"
                />
                {search.value && (
                  <button
                    type="button"
                    onClick={() => search.onChange("")}
                    className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Actions */}
            {actions?.map((action, i) => (
              <button
                key={i}
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all disabled:opacity-50",
                  ACTION_STYLE[action.variant ?? "secondary"]
                )}
              >
                {action.icon && <span className="h-4 w-4">{action.icon}</span>}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      {filters && (
        <FilterBar
          options={filters.options}
          value={Array.isArray(filters.value) ? filters.value[0] : filters.value}
          onChange={(v) => filters.onChange(v)}
        />
      )}
    </div>
  );
}
