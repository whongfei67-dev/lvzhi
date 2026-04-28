"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type PriceMode = "free" | "trial" | "paid";

interface PriceModeSelectorProps {
  value?: PriceMode;
  onChange?: (mode: PriceMode) => void;
  /** Controlled price value when mode === "paid" */
  price?: string;
  onPriceChange?: (price: string) => void;
  disabled?: boolean;
  className?: string;
}

const OPTIONS: { mode: PriceMode; label: string; sublabel: string; icon: string }[] = [
  { mode: "free", label: "完全免费", sublabel: "任何人均可无限使用", icon: "🎁" },
  { mode: "trial", label: "免费试用", sublabel: "可试用，完整功能需付费", icon: "✨" },
  { mode: "paid", label: "付费使用", sublabel: "用户按次 / 按月付费", icon: "💎" },
];

export function PriceModeSelector({
  value = "free",
  onChange,
  price = "",
  onPriceChange,
  disabled = false,
  className,
}: PriceModeSelectorProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {OPTIONS.map((opt) => {
          const active = value === opt.mode;
          return (
            <button
              key={opt.mode}
              type="button"
              disabled={disabled}
              onClick={() => onChange?.(opt.mode)}
              className={cn(
                "relative flex flex-col gap-1.5 rounded-2xl border-2 p-4 text-left transition-all focus:outline-none",
                active
                  ? "border-blue-500 bg-blue-50 shadow-sm shadow-blue-100"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {/* Radio indicator */}
              <span className={cn(
                "absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors",
                active ? "border-blue-500" : "border-slate-300"
              )}>
                {active && <span className="h-2 w-2 rounded-full bg-blue-500" />}
              </span>
              <span className="text-xl leading-none">{opt.icon}</span>
              <span className={cn("text-sm font-semibold", active ? "text-blue-700" : "text-slate-900")}>
                {opt.label}
              </span>
              <span className="text-xs text-slate-500 leading-relaxed">{opt.sublabel}</span>
            </button>
          );
        })}
      </div>

      {/* Price input — shown when "paid" is selected */}
      {value === "paid" && (
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-sm font-medium text-slate-500">定价</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">¥</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={price}
              disabled={disabled}
              onChange={(e) => onPriceChange?.(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-7 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <span className="text-sm text-slate-500">元 / 次</span>
        </div>
      )}
    </div>
  );
}
