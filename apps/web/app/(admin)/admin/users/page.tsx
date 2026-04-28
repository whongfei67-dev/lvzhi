export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth/roles";
import { getServerSession } from "@/lib/auth/server-session";
import { admin } from "@/lib/api/client";
// Server Actions - 使用 API
async function banUser(userId: string) {
  "use server";
  try {
    await admin.banUser(userId);
    revalidatePath("/admin/users");
  } catch (error) {
    console.error("Failed to ban user:", error);
  }
}

async function unbanUser(userId: string) {
  "use server";
  try {
    await admin.unbanUser(userId);
    revalidatePath("/admin/users");
  } catch (error) {
    console.error("Failed to unban user:", error);
  }
}

async function muteUser(userId: string) {
  "use server";
  try {
    await admin.muteUser(userId);
    revalidatePath("/admin/users");
  } catch (error) {
    console.error("Failed to mute user:", error);
  }
}

// 角色标签映射（新版角色体系）
const ROLE_LABEL: Record<string, string> = {
  visitor: "游客",
  client: "客户",
  creator: "创作者",
  admin: "一般管理员",
  superadmin: "超管",
};

function statusBadge(status: string | null | undefined) {
  if (status === "banned") return "bg-[#FDF1EC] text-[#A46D5D]";
  if (status === "muted") return "bg-[#FFF8E1] text-[#C8912A]";
  return "bg-[#E9FAF4] text-[#437365]";
}
function statusLabel(status: string | null | undefined) {
  if (status === "banned") return "已封禁";
  if (status === "muted") return "已禁言";
  return "正常";
}

export default async function AdminUsersPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  // 权限检查：只有 admin 和 superadmin 可以访问
  if (!isAdmin(session)) {
    redirect("/workspace");
  }

  const isSuperadmin = session.role === "superadmin";

  // 获取用户列表
  let users: { id: string; display_name: string | null; email: string | null; role: string; status: string | null; created_at: string }[] = [];
  try {
    const result = await admin.getUsers({ limit: 50 });
    users = result.items as typeof users;
  } catch (error) {
    console.error("Failed to fetch users:", error);
  }

  return (
    <div className="min-h-screen bg-[#F7FBFE]">
      <main className="mx-auto max-w-7xl px-6 py-6 lg:px-6">
        <div className="space-y-6">
            {/* Header */}
            <section className="rounded-2xl border border-[#DFE9EE] bg-white p-6">
              <p className="text-sm font-semibold text-[#5C9EEB]">管理端</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#26363D]">注册用户管理</h1>
              <p className="mt-3 text-[#55656D]">查看、封禁、解封或禁言平台注册用户。封禁后用户无法登录，禁言后用户无法发帖。</p>
            </section>

            {/* User list */}
            <div className="rounded-2xl border border-[#DFE9EE] bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold text-[#26363D]">用户列表（最近 50 条）</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#F7FBFE] text-[#87949B]">
                    <tr>
                      {["显示名称", "邮箱", "角色", "状态", "注册时间", "操作"].map((h) => (
                        <th key={h} className="px-4 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {!users.length ? (
                      <tr>
                        <td className="px-4 py-4 text-[#87949B]" colSpan={6}>暂无用户数据</td>
                      </tr>
                    ) : users.map((u) => (
                      <tr key={u.id} className="border-t border-[#EDF3F6] hover:bg-[#F7FBFE]">
                        <td className="px-4 py-3 font-medium text-[#26363D]">{u.display_name ?? "—"}</td>
                        <td className="px-4 py-3 text-[#55656D]">{u.email ?? "—"}</td>
                        <td className="px-4 py-3 text-[#55656D]">{ROLE_LABEL[u.role] ?? u.role}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge(u.status)}`}>
                            {statusLabel(u.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#87949B]">
                          {new Date(u.created_at).toLocaleDateString("zh-CN")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {u.status !== "banned" && (
                              <form action={banUser.bind(null, u.id)}>
                                <button className="rounded-lg border border-[#FDF1EC] bg-[#FDF1EC] px-2.5 py-1 text-xs font-medium text-[#A46D5D] hover:bg-[#F5E0D8] transition-colors">
                                  封禁
                                </button>
                              </form>
                            )}
                            {u.status === "banned" && (
                              <form action={unbanUser.bind(null, u.id)}>
                                <button className="rounded-lg border border-[#E9FAF4] bg-[#E9FAF4] px-2.5 py-1 text-xs font-medium text-[#437365] hover:bg-[#D4F5EB] transition-colors">
                                  解封
                                </button>
                              </form>
                            )}
                            {u.status !== "muted" && u.status !== "banned" && (
                              <form action={muteUser.bind(null, u.id)}>
                                <button className="rounded-lg border border-[#FFF8E1] bg-[#FFF8E1] px-2.5 py-1 text-xs font-medium text-[#C8912A] hover:bg-[#FFF0C0] transition-colors">
                                  禁言
                                </button>
                              </form>
                            )}
                            {u.status === "muted" && (
                              <form action={unbanUser.bind(null, u.id)}>
                                <button className="rounded-lg border border-[#DFE9EE] bg-[#F7FBFE] px-2.5 py-1 text-xs font-medium text-[#55656D] hover:bg-[#EDF3F6] transition-colors">
                                  解除禁言
                                </button>
                              </form>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        </div>
      </main>
    </div>
  );
}
