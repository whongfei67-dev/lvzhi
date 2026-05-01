"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { CreatorRoleWorkbench } from "@/app/(marketing)/project-test/workbench/_components/workbench-real/CreatorRoleWorkbench";
import { defaultHomePathForRole } from "@/lib/auth/default-home";
import type { Session } from "@/lib/auth/session-types";
import { getSession, lawyers, users } from "@/lib/api/client";
import { applyAppRoutesToNavGroups } from "@/lib/workbench";

export function CreatorWorkbenchFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [lawyerVerified, setLawyerVerified] = useState(false);
  const [showUpgradeTip, setShowUpgradeTip] = useState(false);
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
      if (s.role !== "creator") {
        router.replace(defaultHomePathForRole(s.role));
        return;
      }
      setSession(s);
      const level = String(s.creator_level ?? "").toLowerCase();
      const fromSession = Boolean(s.lawyer_verified) || level === "lawyer";
      setLawyerVerified(fromSession);
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
    if (!session?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const profile = await users.getProfile(session.id);
        if (cancelled) return;
        const creatorLevel = String(profile.creator_level ?? "").toLowerCase();
        const fromProfile = Boolean(profile.lawyer_verified) || creatorLevel === "lawyer";
        if (fromProfile) {
          setLawyerVerified(true);
          return;
        }
      } catch {
        // ignore and fallback below
      }

      try {
        const lawyerDetail = (await lawyers.get(session.id)) as Record<string, unknown>;
        if (cancelled) return;
        const creatorLevel = String(lawyerDetail.creator_level ?? "").toLowerCase();
        setLawyerVerified(Boolean(lawyerDetail.lawyer_verified) || creatorLevel === "lawyer");
      } catch {
        if (!cancelled) {
          const level = String(session.creator_level ?? "").toLowerCase();
          const fromSession = Boolean(session.lawyer_verified) || level === "lawyer";
          setLawyerVerified(fromSession);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.id, session?.creator_level]);

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

  useEffect(() => {
    if (!session?.id || !lawyerVerified) return;
    const key = `lvzhi:lawyer-upgrade-tip:${session.id}`;
    const shown = typeof window !== "undefined" ? window.sessionStorage.getItem(key) : "1";
    if (shown) return;
    setShowUpgradeTip(true);
    window.sessionStorage.setItem(key, "1");
    const t = window.setTimeout(() => setShowUpgradeTip(false), 5000);
    return () => window.clearTimeout(t);
  }, [session?.id, lawyerVerified]);

  const navGroups = useMemo(() => applyAppRoutesToNavGroups("creator"), []);
  const profile = useMemo(() => {
    const name = session?.display_name?.trim() || session?.email?.split("@")[0] || "用户";
    return {
      avatar: name.slice(0, 1),
      avatarUrl: session?.avatar_url || "",
      name,
      roleLine: lawyerVerified ? "执业律师" : "创作者",
      lawyerVerified,
    };
  }, [session, lawyerVerified]);

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
      {showUpgradeTip ? (
        <div className="fixed right-4 top-4 z-[120] rounded-xl border border-[rgba(212,165,116,0.45)] bg-[rgba(255,252,247,0.96)] px-4 py-3 text-sm text-[#5C4033] shadow-lg backdrop-blur">
          <div className="font-semibold">已升级为执业律师</div>
          <div className="mt-0.5 text-xs text-[#8B7355]">发现律师页与身份标识已同步更新。</div>
          <button
            type="button"
            onClick={() => setShowUpgradeTip(false)}
            className="mt-2 text-xs font-medium text-[#B8860B] hover:text-[#8B5A2B]"
          >
            我知道了
          </button>
        </div>
      ) : null}
      <CreatorRoleWorkbench
        panelId="creator-app"
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
      </CreatorRoleWorkbench>
    </div>
  );
}
