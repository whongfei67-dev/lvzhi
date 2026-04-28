"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  /** Show a loading spinner instead of the search icon */
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
}

const SIZE = {
  sm: { wrapper: "h-9 rounded-xl px-3", icon: "h-3.5 w-3.5", text: "text-sm", clear: "h-3.5 w-3.5" },
  md: { wrapper: "h-11 rounded-2xl px-4", icon: "h-4 w-4", text: "text-sm", clear: "h-4 w-4" },
  lg: { wrapper: "h-13 rounded-2xl px-5", icon: "h-5 w-5", text: "text-base", clear: "h-4 w-4" },
};

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = "搜索…",
  size = "md",
  loading = false,
  disabled = false,
  className,
  autoFocus = false,
}: SearchBarProps) {
  const [internal, setInternal] = React.useState("");
  const controlled = value !== undefined;
  const current = controlled ? value : internal;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (!controlled) setInternal(v);
    onChange?.(v);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") onSearch?.(current);
  }

  function clear() {
    if (!controlled) setInternal("");
    onChange?.("");
  }

  const s = SIZE[size];

  return (
    <div
      className={cn(
        "relative flex items-center gap-2 border border-slate-200 bg-white transition-colors",
        "focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100",
        s.wrapper,
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {/* Left icon */}
      <span className="shrink-0 text-slate-400">
        {loading ? (
          <svg className={cn(s.icon, "animate-spin")} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          <svg className={s.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        )}
      </span>

      {/* Input */}
      <input
        type="search"
        value={current}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={cn(
          "min-w-0 flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 outline-none",
          "[&::-webkit-search-cancel-button]:hidden",
          s.text
        )}
      />

      {/* Clear button */}
      {current && !disabled && (
        <button
          type="button"
          onClick={clear}
          className="shrink-0 rounded-lg p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className={s.clear} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Search button (only when onSearch provided) */}
      {onSearch && (
        <button
          type="button"
          onClick={() => onSearch(current)}
          disabled={disabled}
          className="shrink-0 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:shadow-md transition-all disabled:opacity-50"
        >
          搜索
        </button>
      )}
    </div>
  );
}
