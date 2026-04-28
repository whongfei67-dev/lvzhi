"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { ClientRoleWorkbench } from "@/app/(marketing)/project-test/workbench/_components/workbench-real/ClientRoleWorkbench";
import { defaultHomePathForRole } from "@/lib/auth/default-home";
import type { Session } from "@/lib/auth/session-types";
import { getSession } from "@/lib/api/client";
import { applyAppRoutesToNavGroups } from "@/lib/workbench";

export type WorkbenchFrameSession = {
  display_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
};

export function WorkspaceWorkbenchFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [urlHash, setUrlHash] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await getSession();
      if (cancelled) return;
      if (!s) {
        router.replace("/login");
        return;
      }
      if (s.role !== "client" && s.role !== "visitor") {
        router.replace(defaultHomePathForRole(s.role));
        return;
      }
      setSession(s);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

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

  useEffect(() => {
    const onAvatarUpdated = (event: Event) => {
      const payload = (event as CustomEvent<{ url?: string }>).detail;
      const nextUrl = String(payload?.url || "").trim();
      if (!nextUrl) return;
      setSession((prev) => (prev ? { ...prev, avatar_url: nextUrl } : prev));
    };
    window.addEventListener("lvzhi:avatar-updated", onAvatarUpdated);
    return () => window.removeEventListener("lvzhi:avatar-updated", onAvatarUpdated);
  }, []);

  const navGroups = useMemo(() => applyAppRoutesToNavGroups("client"), []);
  const profile = useMemo(() => {
    const name = session?.display_name?.trim() || session?.email?.split("@")[0] || "用户";
    return {
      avatar: name.slice(0, 1),
      avatarUrl: session?.avatar_url || "",
      name,
      roleLine: "客户",
    };
  }, [session]);

  if (!ready || !session) {
    return (
      <div
        id="workbench-integration-mount"
        className="flex min-h-screen items-center justify-center bg-[#3a3430] text-sm text-[rgba(255,255,255,0.78)]"
      >
        加载工作台…
      </div>
    );
  }

  return (
    <div id="workbench-integration-mount">
      <ClientRoleWorkbench
        panelId="client-app"
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
      </ClientRoleWorkbench>
    </div>
  );
}
