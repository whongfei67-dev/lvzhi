"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T, index: number) => React.ReactNode;
  /** Tailwind min-width / width class, e.g. "w-32" or "min-w-[120px]" */
  width?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

export interface DataTableSort {
  key: string;
  direction: "asc" | "desc";
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  /** Row click — adds hover cursor */
  onRowClick?: (row: T) => void;
  sort?: DataTableSort;
  onSortChange?: (sort: DataTableSort) => void;
  loading?: boolean;
  loadingRows?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Extra class applied per row */
  getRowClass?: (row: T) => string | undefined;
  className?: string;
}

const ALIGN: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

function SortIcon({ active, direction }: { active: boolean; direction: "asc" | "desc" }) {
  return (
    <span className="ml-1.5 inline-flex flex-col gap-px">
      <svg
        className={cn("h-2.5 w-2.5 transition-colors", active && direction === "asc" ? "text-blue-600" : "text-slate-300")}
        viewBox="0 0 10 6" fill="currentColor"
      >
        <path d="M5 0L10 6H0L5 0z" />
      </svg>
      <svg
        className={cn("h-2.5 w-2.5 transition-colors", active && direction === "desc" ? "text-blue-600" : "text-slate-300")}
        viewBox="0 0 10 6" fill="currentColor"
      >
        <path d="M5 6L0 0H10L5 6z" />
      </svg>
    </span>
  );
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  sort,
  onSortChange,
  loading = false,
  loadingRows = 5,
  emptyTitle = "暂无数据",
  emptyDescription,
  getRowClass,
  className,
}: DataTableProps<T>) {
  function handleSort(col: DataTableColumn<T>) {
    if (!col.sortable || !onSortChange) return;
    const nextDir = sort?.key === col.key && sort.direction === "asc" ? "desc" : "asc";
    onSortChange({ key: col.key, direction: nextDir });
  }

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-slate-200 bg-white", className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          {/* Head */}
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col)}
                  className={cn(
                    "px-4 py-3 font-medium text-slate-500",
                    ALIGN[col.align ?? "left"],
                    col.width,
                    col.sortable && "cursor-pointer select-none hover:text-slate-700"
                  )}
                >
                  <span className="inline-flex items-center">
                    {col.header}
                    {col.sortable && (
                      <SortIcon
                        active={sort?.key === col.key}
                        direction={sort?.key === col.key ? sort.direction : "asc"}
                      />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-100">
            {loading
              ? Array.from({ length: loadingRows }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded-lg bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.length === 0
              ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-16 text-center">
                      <p className="text-sm font-medium text-slate-500">{emptyTitle}</p>
                      {emptyDescription && (
                        <p className="mt-1 text-xs text-slate-400">{emptyDescription}</p>
                      )}
                    </td>
                  </tr>
                )
              : rows.map((row, i) => (
                  <tr
                    key={getRowKey(row)}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "transition-colors",
                      onRowClick && "cursor-pointer hover:bg-slate-50",
                      getRowClass?.(row)
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn("px-4 py-3 text-slate-700", ALIGN[col.align ?? "left"], col.width)}
                      >
                        {col.cell(row, i)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
