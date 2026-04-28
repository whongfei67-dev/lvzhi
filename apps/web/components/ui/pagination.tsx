"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  /** Current page (1-indexed) */
  page: number;
  /** Total number of pages */
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
  /** Max page buttons to show (excluding prev/next) */
  siblingCount?: number;
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function Pagination({ page, totalPages, onChange, className, siblingCount = 1 }: PaginationProps) {
  if (totalPages <= 1) return null;

  const DOTS = "…";

  function getPages(): (number | string)[] {
    const totalPageNumbers = siblingCount * 2 + 5; // siblings + first + last + 2 dots + current

    if (totalPageNumbers >= totalPages) {
      return range(1, totalPages);
    }

    const leftSibling = Math.max(page - siblingCount, 1);
    const rightSibling = Math.min(page + siblingCount, totalPages);
    const showLeftDots = leftSibling > 2;
    const showRightDots = rightSibling < totalPages - 1;

    if (!showLeftDots && showRightDots) {
      const leftItems = range(1, 3 + 2 * siblingCount);
      return [...leftItems, DOTS, totalPages];
    }
    if (showLeftDots && !showRightDots) {
      const rightItems = range(totalPages - (3 + 2 * siblingCount) + 1, totalPages);
      return [1, DOTS, ...rightItems];
    }
    return [1, DOTS, ...range(leftSibling, rightSibling), DOTS, totalPages];
  }

  const pages = getPages();

  return (
    <nav aria-label="分页" className={cn("flex items-center gap-1", className)}>
      {/* Prev */}
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
        aria-label="上一页"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {pages.map((p, i) =>
        p === DOTS ? (
          <span key={`dots-${i}`} className="flex h-9 w-9 items-center justify-center text-sm text-slate-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(Number(p))}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition-colors",
              p === page
                ? "bg-slate-900 text-white"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
        aria-label="下一页"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
}
