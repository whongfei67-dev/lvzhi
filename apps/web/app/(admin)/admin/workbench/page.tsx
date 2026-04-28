import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

export default async function AdminWorkbenchIndexPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (session.role !== "admin" && session.role !== "superadmin") redirect("/workspace");
  redirect(session.role === "superadmin" ? "/admin/workbench/sup-overview" : "/admin/workbench/adm-users");
}
