import * as React from "react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Render a divider below this section */
  divider?: boolean;
  className?: string;
}

export function FormSection({ title, description, children, divider = true, className }: FormSectionProps) {
  return (
    <div className={cn("", className)}>
      <div className="mb-5">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-slate-500 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="space-y-5">{children}</div>
      {divider && <div className="mt-8 h-px bg-slate-100" />}
    </div>
  );
}
