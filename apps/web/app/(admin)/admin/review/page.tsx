export const dynamic = 'force-dynamic'
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth/roles";
import { getServerSession } from "@/lib/auth/server-session";
import { admin } from "@/lib/api/client";
function reviewStatusClass(status: string) {
  if (["待复审", "待初审", "待处理"].includes(status)) return "bg-[#FFF8E1] text-[#C8912A]";
  if (status === "审核中") return "bg-[#EAF3FF] text-[#5C9EEB]";
  if (status === "已通过") return "bg-[#E9FAF4] text-[#437365]";
  return "bg-[#EDF3F6] text-[#55656D]";
}
function riskClass(risk: string) {
  if (risk === "高") return "bg-[#FDF1EC] text-[#A46D5D]";
  if (risk === "中") return "bg-[#FFF8E1] text-[#C8912A]";
  return "bg-[#E9FAF4] text-[#437365]";
}

function Panel({ title, action, actionHref, children }: {
  title: string; action?: string; actionHref?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#DFE9EE] bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#26363D]">{title}</h2>
        {action && actionHref && (
          <Link href={actionHref} className="text-sm font-medium text-[#5C9EEB]">{action}</Link>
        )}
      </div>
      {children}
    </div>
  );
}

export default async function AdminReviewPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  // 权限检查：只有 admin 和 superadmin 可以访问
  if (!isAdmin(session)) {
    redirect("/workspace");
  }

  const isSuperadmin = session.role === "superadmin";

  // 获取待审核智能体列表
  let pendingAgents: { id: string; name: string; description: string | null; price: number; is_free_trial: boolean; pricing_model: string; created_at: string; creator?: { display_name: string | null; verified: boolean } }[] = [];

  try {
    const result = await admin.getAgents({ status: "pending_review", limit: 50 });
    pendingAgents = result.items as typeof pendingAgents;
  } catch (error) {
    console.error("Failed to fetch pending agents:", error);
  }

  return (
    <div className="min-h-screen bg-[#F7FBFE]">
      <main className="mx-auto max-w-7xl px-6 py-6 lg:px-6">
        <div className="space-y-6">
            {/* Header */}
            <section className="rounded-2xl border border-[#DFE9EE] bg-white p-6">
              <p className="text-sm font-semibold text-[#5C9EEB]">审核台</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#26363D]">智能体、演示与内容审核</h1>
              <p className="mt-3 max-w-2xl text-[#55656D]">
                统一处理智能体发布审核，支持通过或驳回处理。
              </p>
              <div className="mt-6 flex items-center gap-3">
                <input
                  className="h-12 flex-1 max-w-sm rounded-2xl border border-[#DFE9EE] bg-[#F7FBFE] px-4 text-sm outline-none placeholder:text-[#87949B] focus:border-[#5C9EEB]"
                  placeholder="搜索智能体名称或创作者"
                />
              </div>
            </section>

            {/* Review queue + detail */}
            <div className="grid gap-6 xl:grid-cols-[0.58fr_0.42fr]">
              <Panel title={`审核队列（${pendingAgents.length}）`} action="返回总览" actionHref="/admin">
                {!pendingAgents.length ? (
                  <div className="py-6 text-center">
                    <div className="text-4xl">✅</div>
                    <p className="mt-4 text-sm text-[#87949B]">暂无待审核内容，队列清空！</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingAgents.map((agent) => {
                      const mode = agent.pricing_model === "free" || agent.price === 0 ? "免费版"
                        : agent.is_free_trial ? "免费试用" : "商用版";
                      return (
                        <div key={agent.id} className="rounded-2xl border border-[#EDF3F6] p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="font-semibold text-[#26363D]">{agent.name}</div>
                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${reviewStatusClass("待初审")}`}>
                                  待初审
                                </span>
                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${riskClass("低")}`}>
                                  风险 低
                                </span>
                              </div>
                              <div className="mt-2 text-sm text-[#87949B]">
                                智能体审核 · {agent.creator?.display_name ?? "未知创作者"} · {mode}
                              </div>
                              <div className="mt-1 text-sm text-[#87949B]">
                                提交：{new Date(agent.created_at).toLocaleString("zh-CN")}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                              <ReviewActions agentId={agent.id} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Panel>

              <div className="space-y-6">
                <Panel title="审核详情预览">
                  {pendingAgents && pendingAgents[0] ? (
                    <>
                      <div className="rounded-2xl bg-[#F7FBFE] p-4">
                        <div className="text-sm font-semibold text-[#26363D]">当前审核对象</div>
                        <div className="mt-2 text-lg font-semibold text-[#26363D]">{pendingAgents[0].name}</div>
                        <div className="mt-1 text-sm text-[#87949B]">
                          {pendingAgents[0].creator?.display_name ?? "未知"} · 智能体审核
                        </div>
                      </div>
                      <div className="mt-4 space-y-3 text-sm leading-7 text-[#55656D]">
                        <p><span className="font-medium text-[#26363D]">状态：</span>等待人工初审。</p>
                        <p><span className="font-medium text-[#26363D]">合规要求：</span>需确认演示内容与智能体真实能力一致。</p>
                        <p><span className="font-medium text-[#26363D]">风险提示：</span>请检查是否存在对裁判结果的暗示性表述。</p>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <ReviewApproveButton agentId={pendingAgents[0].id} />
                        <button className="rounded-2xl bg-[#C8912A] px-4 py-2.5 text-sm font-semibold text-white">打回修改</button>
                        <ReviewRejectButton agentId={pendingAgents[0].id} />
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-[#87949B] py-4">暂无待审核内容</p>
                  )}
                </Panel>

                <Panel title="审核规则提醒">
                  <ul className="space-y-3 text-sm leading-7 text-[#55656D]">
                    <li>• 演示内容需与真实能力一致，不得夸大功能。</li>
                    <li>• 禁止出现裁判结果预测、胜诉率承诺等敏感表述。</li>
                    <li>• 涉及隐私案例内容必须完成脱敏。</li>
                    <li>• 举报内容优先处理高风险项与线下交易线索。</li>
                  </ul>
                </Panel>
              </div>
            </div>
        </div>
      </main>
    </div>
  );
}

// 审核操作按钮组件
async function ReviewActions({ agentId }: { agentId: string }) {
  "use server";

  async function approveAgent() {
    "use server";
    try {
      await admin.approveAgent(agentId);
      revalidatePath("/admin/review");
    } catch (error) {
      console.error("Failed to approve agent:", error);
    }
  }

  async function rejectAgent() {
    "use server";
    try {
      await admin.rejectAgent(agentId);
      revalidatePath("/admin/review");
    } catch (error) {
      console.error("Failed to reject agent:", error);
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
      <form action={rejectAgent}>
        <button
          type="submit"
          className="w-full rounded-xl bg-[#A46D5D] px-3 py-2 text-sm font-medium text-white hover:bg-[#8E5C4E] transition-colors"
        >
          驳回
        </button>
      </form>
    </>
  );
}

async function ReviewApproveButton({ agentId }: { agentId: string }) {
  "use server";

  async function approveAgent() {
    "use server";
    try {
      await admin.approveAgent(agentId);
      revalidatePath("/admin/review");
    } catch (error) {
      console.error("Failed to approve agent:", error);
    }
  }

  return (
    <form action={approveAgent}>
      <button type="submit" className="w-full rounded-2xl bg-[#437365] px-4 py-2.5 text-sm font-semibold text-white">审核通过</button>
    </form>
  );
}

async function ReviewRejectButton({ agentId }: { agentId: string }) {
  "use server";

  async function rejectAgent() {
    "use server";
    try {
      await admin.rejectAgent(agentId);
      revalidatePath("/admin/review");
    } catch (error) {
      console.error("Failed to reject agent:", error);
    }
  }

  return (
    <form action={rejectAgent}>
      <button type="submit" className="w-full rounded-2xl bg-[#A46D5D] px-4 py-2.5 text-sm font-semibold text-white">驳回</button>
    </form>
  );
}
