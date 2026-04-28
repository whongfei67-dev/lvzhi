"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value?: string[];
  onChange?: (tags: string[]) => void;
  placeholder?: string;
  /** Max number of tags allowed */
  max?: number;
  /** Allow duplicate tags */
  allowDuplicates?: boolean;
  /** Delimiters that trigger tag creation in addition to Enter */
  delimiters?: string[];
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function TagInput({
  value = [],
  onChange,
  placeholder = "输入后按 Enter 添加",
  max,
  allowDuplicates = false,
  delimiters = [",", "，"],
  error,
  disabled = false,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag) return;
    if (!allowDuplicates && value.includes(tag)) {
      setInputValue("");
      return;
    }
    if (max !== undefined && value.length >= max) {
      setInputValue("");
      return;
    }
    onChange?.([...value, tag]);
    setInputValue("");
  }

  function removeTag(index: number) {
    onChange?.(value.filter((_, i) => i !== index));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
      return;
    }
    if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      removeTag(value.length - 1);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    const hitDelimiter = delimiters.some((d) => v.endsWith(d));
    if (hitDelimiter) {
      addTag(v.slice(0, -1));
    } else {
      setInputValue(v);
    }
  }

  const atMax = max !== undefined && value.length >= max;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "flex min-h-[2.75rem] flex-wrap gap-1.5 rounded-2xl border px-3 py-2 transition-colors",
          error
            ? "border-red-300 bg-red-50 focus-within:ring-2 focus-within:ring-red-200"
            : "border-slate-200 bg-slate-50 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        {value.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeTag(i); }}
                className="ml-0.5 rounded text-blue-500 hover:text-blue-800 transition-colors"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </span>
        ))}
        {!atMax && !disabled && (
          <input
            ref={inputRef}
            value={inputValue}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            placeholder={value.length === 0 ? placeholder : ""}
            className="min-w-[8rem] flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
          />
        )}
      </div>
      <div className="flex items-center justify-between">
        {error ? (
          <p className="flex items-center gap-1.5 text-xs text-red-600">
            <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        ) : <span />}
        {max !== undefined && (
          <p className={cn("text-xs", atMax ? "text-red-500" : "text-slate-400")}>
            {value.length} / {max}
          </p>
        )}
      </div>
    </div>
  );
}
