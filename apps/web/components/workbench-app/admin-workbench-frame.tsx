"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { AdminRoleWorkbench } from "@/app/(marketing)/project-test/workbench/_components/workbench-real/AdminRoleWorkbench";
import { SuperRoleWorkbench } from "@/app/(marketing)/project-test/workbench/_components/workbench-real/SuperRoleWorkbench";
import { applyAppRoutesToNavGroups } from "@/lib/workbench";
import type { WorkbenchDemoRole } from "@/lib/workbench/types";

import type { WorkbenchFrameSession } from "./workspace-workbench-frame";

export function AdminWorkbenchFrame({
  session,
  isSuperadmin,
  children,
}: {
  session: WorkbenchFrameSession;
  isSuperadmin: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const [urlHash, setUrlHash] = useState("");
  useEffect(() => {
    const sync = () => setUrlHash(typeof window !== "undefined" ? window.location.hash : "");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  useEffect(() => {
    const id = window.location.hash?.slice(1);
    if (!id) return;
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [pathname, urlHash]);

  const navRole: WorkbenchDemoRole = isSuperadmin ? "super" : "admin";
  const navGroups = useMemo(() => applyAppRoutesToNavGroups(navRole), [navRole]);
  const profile = useMemo(() => {
    const name = session.display_name?.trim() || session.email?.split("@")[0] || "用户";
    return {
      avatar: name.slice(0, 1),
      avatarUrl: session.avatar_url || "",
      name,
      roleLine: isSuperadmin ? "超管" : "管理员",
    };
  }, [session, isSuperadmin]);

  if (isSuperadmin) {
    return (
      <SuperRoleWorkbench
        panelId="super-app"
        isActive
        mode="app"
        pathname={pathname}
        urlHash={urlHash}
        navGroups={navGroups}
        profile={profile}
        activeHash=""
        onNavigate={() => {}}
      >
        {children}
      </SuperRoleWorkbench>
    );
  }

  return (
    <AdminRoleWorkbench
      panelId="admin-app"
      isActive
      mode="app"
      pathname={pathname}
      urlHash={urlHash}
      navGroups={navGroups}
      profile={profile}
      activeHash=""
      onNavigate={() => {}}
    >
      {children}
    </AdminRoleWorkbench>
  );
}
