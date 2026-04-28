"use client";

import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterBarProps {
  title?: string;
  options: FilterOption[];
  value?: string;
  onChange?: (value: string) => void;
  /** 是否显示全部选项 */
  showAll?: boolean;
  /** 全部选项的值 */
  allValue?: string;
  className?: string;
}

/**
 * 筛选按钮组组件 v2.0
 * 
 * 配色：绿色系
 * 视觉：温和、专业、克制
 */
export function FilterBar({ 
  title, 
  options, 
  value, 
  onChange,
  showAll = true,
  allValue = "",
  className 
}: FilterBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {title && <span className="text-sm font-medium text-[#5A6560]">{title}</span>}
      <div className="flex flex-wrap gap-2">
        {/* 全部选项 */}
        {showAll && (
          <button
            onClick={() => onChange?.(allValue)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-all",
              (value === allValue || value === "")
                ? "border-[#5C4033] bg-[#5C4033] text-white"
                : "border-[#D9DED7] bg-white text-[#5A6560] hover:border-[#5C4033] hover:text-[#5C4033]"
            )}
          >
            全部
          </button>
        )}
        
        {/* 其他选项 */}
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange?.(opt.value)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-all",
              value === opt.value
                ? "border-[#5C4033] bg-[#5C4033] text-white"
                : "border-[#D9DED7] bg-white text-[#5A6560] hover:border-[#5C4033] hover:text-[#5C4033]"
            )}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className={cn(
                "ml-1 text-xs",
                value === opt.value ? "opacity-80" : "text-[#9AA59D]"
              )}>
                ({opt.count})
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
