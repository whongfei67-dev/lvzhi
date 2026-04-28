import "@/app/(marketing)/project-test/workbench/workbench-integration.css";

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/server-session";
import { AdminWorkbenchFrame } from "@/components/workbench-app/admin-workbench-frame";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  // 权限检查：只有 admin 和 superadmin 可以访问
  if (session.role !== "admin" && session.role !== "superadmin") {
    redirect("/workspace");
  }

  const isSuperadmin = session.role === "superadmin";

  return (
    <div id="workbench-integration-mount">
      <AdminWorkbenchFrame
        session={{ display_name: session.display_name, email: session.email }}
        isSuperadmin={isSuperadmin}
      >
        {children}
      </AdminWorkbenchFrame>
    </div>
  );
}
