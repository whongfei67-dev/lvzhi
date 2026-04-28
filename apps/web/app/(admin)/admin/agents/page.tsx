export const dynamic = 'force-dynamic'
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth/roles";
import { getServerSession } from "@/lib/auth/server-session";
import { admin } from "@/lib/api/client";
const categoryLabels: Record<string, string> = {
  contract: "合同",
  litigation: "诉讼",
  consultation: "咨询",
  compliance: "合规",
  other: "其他",
};

export default async function AdminAgentsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  // 权限检查：只有 admin 和 superadmin 可以访问
  if (!isAdmin(session)) {
    redirect("/workspace");
  }

  const isSuperadmin = session.role === "superadmin";

  // 获取智能体数据
  let pendingAgents: { id: string; name: string; description: string | null; category: string | null; price: number; status: string; is_free_trial: boolean; pricing_model: string; created_at: string; creator?: { display_name: string | null; verified: boolean } }[] = [];
  let activeAgents: { id: string; name: string; description: string | null; category: string | null; price: number; status: string; is_free_trial: boolean; pricing_model: string; created_at: string; creator?: { display_name: string | null } }[] = [];

  try {
    const pendingResult = await admin.getAgents({ status: "pending_review", limit: 50 });
    pendingAgents = pendingResult.items as typeof pendingAgents;
  } catch (error) {
    console.error("Failed to fetch pending agents:", error);
  }

  try {
    const activeResult = await admin.getAgents({ status: "active", limit: 20 });
    activeAgents = activeResult.items as typeof activeAgents;
  } catch (error) {
    console.error("Failed to fetch active agents:", error);
  }

  return (
    <div className="min-h-screen bg-[#F7FBFE]">
      <main className="mx-auto max-w-7xl px-6 py-6 lg:px-6">
        <div className="space-y-6">
            {/* Header */}
            <section className="rounded-2xl border border-[#DFE9EE] bg-white p-6">
              <p className="text-sm font-semibold text-[#5C9EEB]">智能体管理</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#26363D]">智能体审核与管理</h1>
              <p className="mt-3 max-w-2xl text-[#55656D]">
                处理智能体发布审核，管理已上线智能体，支持通过或下架操作。
              </p>
            </section>

            {/* Stats */}
            <section className="grid gap-4 sm:grid-cols-3">
              {[
                ["待审核", `${pendingAgents.length}`, "需要处理"],
                ["已上线", `${activeAgents.length}`, "最近 20 条"],
                ["审核规则", "3 条", "合规、能力、脱敏"],
              ].map(([label, value, desc]) => (
                <div key={label} className="rounded-2xl border border-[#DFE9EE] bg-white p-6">
                  <div className="text-sm text-[#87949B]">{label}</div>
                  <div className="mt-2 text-3xl font-bold tracking-tight text-[#26363D]">{value}</div>
                  <div className="mt-2 text-sm text-[#87949B]">{desc}</div>
                </div>
              ))}
            </section>

            {/* Pending */}
            <div className="rounded-2xl border border-[#DFE9EE] bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#26363D]">
                  待审核（{pendingAgents.length}）
                </h2>
                <Link href="/admin/review" className="text-sm font-medium text-[#5C9EEB]">
                  进入审核台
                </Link>
              </div>
              {!pendingAgents.length ? (
                <div className="py-10 text-center">
                  <div className="text-4xl">✅</div>
                  <p className="mt-4 text-sm text-[#87949B]">暂无待审核智能体</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingAgents.map((agent) => (
                    <div key={agent.id} className="rounded-2xl border border-[#EDF3F6] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-semibold text-[#26363D]">{agent.name}</div>
                            {agent.category && (
                              <span className="rounded-full bg-[#EAF3FF] px-2.5 py-1 text-xs font-medium text-[#5C9EEB]">
                                {categoryLabels[agent.category] ?? agent.category}
                              </span>
                            )}
                            {agent.is_free_trial && (
                              <span className="rounded-full bg-[#EDF3F6] px-2.5 py-1 text-xs font-medium text-[#55656D]">
                                可试用
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-sm text-[#87949B]">
                            创建者：{agent.creator?.display_name ?? "未知"}
                            {agent.creator?.verified && <span className="ml-1 text-[#437365]">✓</span>}
                            <span className="mx-2">·</span>
                            定价：{agent.price === 0 ? "免费" : `¥${agent.price}`}
                            <span className="mx-2">·</span>
                            提交：{new Date(agent.created_at).toLocaleDateString("zh-CN")}
                          </div>
                          {agent.description && (
                            <div className="mt-2 rounded-xl bg-[#F7FBFE] px-3 py-2 text-sm text-[#55656D]">
                              {agent.description}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <AdminAgentActions agentId={agent.id} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active agents */}
            <div className="rounded-2xl border border-[#DFE9EE] bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold text-[#26363D]">已上线智能体（最近 20 条）</h2>
              {!activeAgents.length ? (
                <p className="text-sm text-[#87949B] py-4">暂无已上线智能体</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[#F7FBFE] text-[#87949B]">
                      <tr>
                        {["名称", "创建者", "定价", "分类", "上线时间", "操作"].map((h) => (
                          <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeAgents.map((agent) => (
                        <tr key={agent.id} className="border-t border-[#EDF3F6] hover:bg-[#F7FBFE] transition-colors">
                          <td className="px-4 py-3 font-medium text-[#26363D] max-w-40 truncate">{agent.name}</td>
                          <td className="px-4 py-3 text-[#55656D]">{agent.creator?.display_name ?? "—"}</td>
                          <td className="px-4 py-3 text-[#26363D] font-semibold">
                            {agent.price === 0 ? "免费" : `¥${agent.price}`}
                          </td>
                          <td className="px-4 py-3 text-[#87949B]">
                            {agent.category ? (categoryLabels[agent.category] ?? agent.category) : "—"}
                          </td>
                          <td className="px-4 py-3 text-[#87949B] text-xs whitespace-nowrap">
                            {new Date(agent.created_at).toLocaleDateString("zh-CN")}
                          </td>
                          <td className="px-4 py-3">
                            <AdminTakeDownButton agentId={agent.id} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
        </div>
      </main>
    </div>
  );
}

// 客户端操作按钮组件
async function AdminAgentActions({ agentId }: { agentId: string }) {
  "use server";

  async function approveAgent() {
    "use server";
    try {
      await admin.approveAgent(agentId);
      revalidatePath("/admin/agents");
    } catch (error) {
      console.error("Failed to approve agent:", error);
    }
  }

  async function takedownAgent() {
    "use server";
    try {
      await admin.rejectAgent(agentId);
      revalidatePath("/admin/agents");
    } catch (error) {
      console.error("Failed to takedown agent:", error);
    }
  }

  return (
    <>
      <form action={approveAgent}>
        <button
          type="submit"
          className="w-full rounded-xl bg-[#437365] px-3 py-2 text-sm font-medium text-white hover:bg-[#3A6659] transition-colors"
        >
          通过
        </button>
      </form>
      <form action={takedownAgent}>
        <button
          type="submit"
          className="w-full rounded-xl bg-[#A46D5D] px-3 py-2 text-sm font-medium text-white hover:bg-[#8E5C4E] transition-colors"
        >
          拒绝
        </button>
      </form>
    </>
  );
}

async function AdminTakeDownButton({ agentId }: { agentId: string }) {
  "use server";

  async function takedownAgent() {
    "use server";
    try {
      await admin.rejectAgent(agentId);
      revalidatePath("/admin/agents");
    } catch (error) {
      console.error("Failed to takedown agent:", error);
    }
  }

  return (
    <form action={takedownAgent}>
      <button
        type="submit"
        className="rounded-lg border border-[#FDF1EC] px-2.5 py-1 text-xs font-medium text-[#A46D5D] hover:bg-[#FDF1EC] transition-colors"
      >
        下架
      </button>
    </form>
  );
}
