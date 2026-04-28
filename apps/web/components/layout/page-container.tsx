import * as React from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Max-width preset: "default" = max-w-screen-2xl, "narrow" = max-w-3xl, "wide" = max-w-screen-2xl */
  width?: "narrow" | "default" | "wide";
  /** Vertical padding preset */
  py?: "sm" | "md" | "lg";
}

const widthMap = {
  narrow:  "max-w-3xl",
  default: "max-w-screen-2xl",
  wide:    "max-w-screen-2xl",
};

const pyMap = {
  sm: "py-6",
  md: "py-10",
  lg: "py-16",
};

export function PageContainer({
  className,
  width = "default",
  py = "md",
  children,
  ...props
}: PageContainerProps) {
  return (
    <div className={cn("min-h-screen bg-slate-50 text-slate-900", className)} {...props}>
      <div className={cn("mx-auto px-3 lg:px-5", widthMap[width], pyMap[py])}>
        {children}
      </div>
    </div>
  );
}
