"use client";

import { ReactNode, isValidElement, useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterBarProps {
  filters: {
    label?: string;
    icon?: ReactNode;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
  }[];
  className?: string;
  showDivider?: boolean;
}

export function FilterBar({ filters, className = "", showDivider = true }: FilterBarProps) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {filters.map((filter, index) => (
        <div key={filter.label || index} className="flex items-center gap-2">
          {filter.label && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-[#5A6560]">
              {filter.icon}
              {filter.label}
            </span>
          )}
          <div className="flex flex-wrap gap-2">
            {filter.options.map((option) => (
              <button
                key={option.value}
                onClick={() => filter.onChange(option.value)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                  filter.value === option.value
                    ? "border-[#5C4033] bg-[#5C4033] text-white"
                    : "border-[#D9DED7] bg-white text-[#5A6560] hover:border-[#5C4033] hover:text-[#5C4033]"
                }`}
              >
                {option.label}
                {option.count !== undefined && (
                  <span className={`ml-1.5 text-xs ${filter.value === option.value ? "text-white/80" : "text-[#9AA59D]"}`}>
                    {option.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          {showDivider && index < filters.length - 1 && (
            <div className="h-6 w-px bg-[#D9DED7]" />
          )}
        </div>
      ))}
    </div>
  );
}

interface CategoryTabsProps {
  tabs: {
    id: string;
    label: string;
    icon?: ReactNode | React.ElementType<{ className?: string }>;
    count?: number;
  }[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function CategoryTabs({ tabs, activeTab, onChange, className = "" }: CategoryTabsProps) {
  return (
    <div className={`flex gap-1 rounded-xl bg-[#EEF4EF] p-1 ${className}`}>
      {tabs.map((tab) => {
        let iconNode: ReactNode = null;
        if (isValidElement(tab.icon)) {
          iconNode = tab.icon;
        } else if (tab.icon && (typeof tab.icon === "function" || typeof tab.icon === "object")) {
          const Icon = tab.icon as React.ElementType<{ className?: string }>;
          iconNode = <Icon className="h-4 w-4" />;
        }
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-[#5C4033] shadow-sm"
                : "text-[#5A6560] hover:text-[#2E3430]"
            }`}
          >
            {iconNode}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === tab.id ? "bg-[#DDEAE1] text-[#5C4033]" : "bg-[#DDEAE1]/50 text-[#5A6560]"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterDropdown({ label, options, value, onChange, className = "" }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
          value
            ? "border-[#5C4033] bg-[#5C4033] text-white"
            : "border-[#D9DED7] bg-white text-[#5A6560] hover:border-[#5C4033]"
        }`}
      >
        <SlidersHorizontal className="h-4 w-4" />
        {selectedOption?.label || label}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-2 min-w-[160px] rounded-xl border border-[#D9DED7] bg-white p-2 shadow-lg">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                  value === option.value
                    ? "bg-[#EEF4EF] text-[#5C4033]"
                    : "text-[#5A6560] hover:bg-[#EEF4EF] hover:text-[#5C4033]"
                }`}
              >
                {option.label}
                {option.count !== undefined && (
                  <span className="text-xs text-[#9AA59D]">{option.count}</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface SortSelectProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SortSelect({ options, value, onChange, className = "" }: SortSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-xl border border-[#D9DED7] bg-white px-4 py-2 text-sm font-medium text-[#5A6560] transition-colors hover:border-[#5C4033]"
      >
        排序: {selectedOption?.label || "默认"}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-2 min-w-[140px] rounded-xl border border-[#D9DED7] bg-white p-2 shadow-lg">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                  value === option.value
                    ? "bg-[#EEF4EF] text-[#5C4033]"
                    : "text-[#5A6560] hover:bg-[#EEF4EF] hover:text-[#5C4033]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
