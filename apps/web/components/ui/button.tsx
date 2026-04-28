"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * 按钮组件 v2.0
 *
 * 配色：深植绿系
 * 视觉：温和、专业、克制
 */

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[#284A3D] text-white shadow-sm hover:bg-[#3A6354] hover:shadow-md active:scale-[0.98] transition-all duration-150",
  secondary:
    "bg-[#EEF4EF] text-[#2E3430] border border-[#D9DED7] hover:bg-[#DDEAE1] hover:border-[#C4DBCB]",
  ghost:
    "text-[#5A6560] hover:bg-[#EEF4EF] hover:text-[#2E3430]",
  danger:
    "bg-[#D94D4D] text-white hover:bg-[#c44040]",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-xs rounded-xl",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-sm rounded-xl font-semibold",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export type { ButtonProps };
export { Button };
