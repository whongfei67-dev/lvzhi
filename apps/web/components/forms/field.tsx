import * as React from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  /** Matches the child input's id for proper <label> association */
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, description, error, required, htmlFor, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-slate-700 leading-none"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      {description && (
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      )}
      {children}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-600">
          <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
