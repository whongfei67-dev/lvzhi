import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSessionServer, isAdminRole, isSuperAdminRole } from "@/lib/auth";
import { AdminAccountMenu } from "@/components/admin-account-menu";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSessionServer();
  if (!session) {
    redirect("/login?next=/review");
  }
  if (!isAdminRole(session.role)) {
    redirect("/login?next=/review");
  }
  const superAdmin = isSuperAdminRole(session.role);

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-title">律植后台控制台</div>
        <AdminAccountMenu
          displayName={session.display_name}
          email={session.email}
          userId={session.user_id}
          role={session.role}
        />
      </header>
      <div className="admin-content">
        <aside className="admin-sidenav">
          <Link href="/content" className="admin-nav-link">
            内容审核台
          </Link>
          <Link href="/review" className="admin-nav-link">
            社区审核台
          </Link>
          <Link href="/verification" className="admin-nav-link">
            认证审批台
          </Link>
          <Link href="/ip" className="admin-nav-link">
            知产审核台
          </Link>
          <Link href="/reports" className="admin-nav-link">
            举报审核台
          </Link>
          <Link href="/opportunities" className="admin-nav-link">
            岗位处置台
          </Link>
          <Link href="/promotion" className="admin-nav-link">
            推广合作台
          </Link>
          {superAdmin ? (
            <Link href="/data-overview" className="admin-nav-link">
              数据总览台
            </Link>
          ) : null}
          <Link href="/withdraw" className="admin-nav-link">
            提现审批台
          </Link>
          <Link href="/settlement" className="admin-nav-link">
            结算审批台
          </Link>
          <Link href="/policies" className="admin-nav-link">
            策略配置（超管）
          </Link>
        </aside>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
