"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  description?: string;
  error?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const inputId = id ?? React.useId();
    return (
      <label
        htmlFor={inputId}
        className={cn(
          "group flex cursor-pointer items-start gap-3",
          props.disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <div className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className="peer sr-only"
            {...props}
          />
          {/* Box */}
          <div
            className={cn(
              "h-5 w-5 rounded-md border-2 transition-colors",
              "peer-checked:border-blue-600 peer-checked:bg-blue-600",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400/30 peer-focus-visible:ring-offset-1",
              error ? "border-rose-400" : "border-slate-300 group-hover:border-slate-400",
              className
            )}
          />
          {/* Checkmark */}
          <svg
            className="pointer-events-none absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 6l3 3 5-5" />
          </svg>
        </div>
        {(label || description) && (
          <div className="leading-5">
            {label && (
              <span className="text-sm font-medium text-slate-900">{label}</span>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            )}
          </div>
        )}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
