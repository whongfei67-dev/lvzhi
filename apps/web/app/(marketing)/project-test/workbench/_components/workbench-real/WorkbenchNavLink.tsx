"use client";

import Link from "next/link";

import type { NavItemDef } from "@/lib/workbench/types";

import { workbenchAppRouteActive } from "./nav-active";
import type { WorkbenchNavProps } from "./types";

type NavLinkProps = WorkbenchNavProps & {
  item: NavItemDef;
  className?: string;
  children: React.ReactNode;
};

export function WorkbenchNavLink({
  item,
  mode = "demo",
  pathname = "",
  urlHash = "",
  activeHash,
  onNavigate,
  className = "nav-item",
  children,
}: NavLinkProps) {
  if (mode === "app" && item.appRoute) {
    const active = workbenchAppRouteActive(item.appRoute, pathname, urlHash);
    return (
      <Link
        href={item.appRoute}
        className={[className, active ? "active" : ""].filter(Boolean).join(" ")}
      >
        {children}
      </Link>
    );
  }

  const active = activeHash === item.href;
  return (
    <a
      href={item.href}
      className={[className, active ? "active" : ""].filter(Boolean).join(" ")}
      onClick={(e) => {
        e.preventDefault();
        onNavigate(item.href);
        requestAnimationFrame(() => {
          document.querySelector(item.href)?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }}
    >
      {children}
    </a>
  );
}
