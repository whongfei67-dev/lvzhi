import { redirect } from "next/navigation";

import { isAdmin } from "@/lib/auth/roles";
import type { Session } from "@/lib/auth/session-types";
import { getServerSession } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

/** 管理后台路由组：仅用 Cookie/API 会话，不用 Supabase */
export default async function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  let session: Session | null = null;
  try {
    session = await getServerSession();
  } catch (e) {
    console.error("[admin] getSession failed", e);
    redirect("/login");
  }
  if (!session) {
    redirect("/login");
  }
  if (!isAdmin(session)) {
    redirect("/workspace");
  }

  return <>{children}</>;
}
