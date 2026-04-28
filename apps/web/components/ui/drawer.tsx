"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** Which edge the drawer slides in from */
  side?: "right" | "left" | "bottom";
  children: React.ReactNode;
  className?: string;
}

export function Drawer({ open, onClose, side = "right", children, className }: DrawerProps) {
  // Trap body scroll when open
  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const translateClass = {
    right: open ? "translate-x-0" : "translate-x-full",
    left: open ? "translate-x-0" : "-translate-x-full",
    bottom: open ? "translate-y-0" : "translate-y-full",
  }[side];

  const positionClass = {
    right: "right-0 top-0 h-full w-full max-w-md",
    left: "left-0 top-0 h-full w-full max-w-md",
    bottom: "bottom-0 left-0 w-full max-h-[90vh]",
  }[side];

  const roundedClass = {
    right: "rounded-l-3xl",
    left: "rounded-r-3xl",
    bottom: "rounded-t-3xl",
  }[side];

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed z-50 flex flex-col bg-white shadow-xl border border-slate-200",
          "transition-transform duration-300 ease-in-out",
          positionClass,
          roundedClass,
          translateClass,
          className
        )}
      >
        {children}
      </div>
    </>
  );
}

interface DrawerHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
  title?: string;
}

export function DrawerHeader({ className, onClose, title, children, ...props }: DrawerHeaderProps) {
  return (
    <div
      className={cn("flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0", className)}
      {...props}
    >
      {title ? (
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      ) : (
        children
      )}
      {onClose && (
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="关闭"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function DrawerBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex-1 overflow-y-auto px-6 py-5", className)} {...props} />
  );
}

export function DrawerFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0", className)}
      {...props}
    />
  );
}
