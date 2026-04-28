"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { WorkbenchSectionContent } from "@/components/workbench-app/workbench-section-content";
import { defaultHomePathForRole } from "@/lib/auth/default-home";
import type { Session } from "@/lib/auth/session-types";
import { getSession } from "@/lib/api/client";
import { getWorkbenchSectionInfo } from "@/lib/workbench/app-section-pages";

export default function CreatorSectionPage() {
  const params = useParams();
  const router = useRouter();
  const raw = params?.section;
  const section = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] ?? "" : "";
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

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
      if (!s.id) {
        router.replace("/login");
        return;
      }
      setSession(s);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready || !session || !section) {
    return <div className="p-8 text-sm text-[#5D4E3A]">加载中…</div>;
  }

  const info = getWorkbenchSectionInfo("creator", section);
  if (!info) notFound();

  return (
    <WorkbenchSectionContent
      role="creator"
      section={section}
      session={{
        id: String(session.id ?? ""),
        email: String(session.email ?? ""),
        display_name: String(session.display_name ?? ""),
      }}
    />
  );
}
