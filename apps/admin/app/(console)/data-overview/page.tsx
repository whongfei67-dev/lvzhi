import { redirect } from "next/navigation";
import { getAdminSessionServer, isAdminRole, isSuperAdminRole } from "@/lib/auth";
import DataOverviewClient from "./page-client";

export default async function DataOverviewPage() {
  const session = await getAdminSessionServer();
  if (!session) {
    redirect("/login?next=/data-overview");
  }
  if (!isAdminRole(session.role)) {
    redirect("/login?next=/review");
  }
  if (!isSuperAdminRole(session.role)) {
    redirect("/review");
  }

  return <DataOverviewClient />;
}
