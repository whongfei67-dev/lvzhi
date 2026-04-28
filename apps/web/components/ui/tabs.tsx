"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

type TabsListVariant = "default" | "pills" | "underline";

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: TabsListVariant;
}

const TabsListContext = React.createContext<TabsListVariant>("default");

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = "default", ...props }, ref) => (
  <TabsListContext.Provider value={variant}>
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex items-center",
        variant === "default" && "rounded-2xl bg-slate-100 p-1 gap-0.5",
        variant === "pills" && "gap-2",
        variant === "underline" && "border-b border-slate-200 gap-0 w-full",
        className
      )}
      {...props}
    />
  </TabsListContext.Provider>
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const variant = React.useContext(TabsListContext);
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-40 cursor-pointer",
        variant === "default" && [
          "rounded-xl px-4 py-2 text-slate-600",
          "data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm",
          "hover:text-slate-900",
        ],
        variant === "pills" && [
          "rounded-full px-4 py-2 text-slate-600",
          "data-[state=active]:bg-slate-900 data-[state=active]:text-white",
          "hover:bg-slate-100 hover:text-slate-900 data-[state=active]:hover:bg-slate-900",
        ],
        variant === "underline" && [
          "px-4 py-3 text-slate-500 border-b-2 border-transparent -mb-px",
          "data-[state=active]:border-slate-900 data-[state=active]:text-slate-900",
          "hover:text-slate-700",
        ],
        className
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30 rounded-2xl",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
