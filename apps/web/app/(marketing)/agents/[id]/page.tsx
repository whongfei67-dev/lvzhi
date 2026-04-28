export const dynamic = 'force-dynamic'
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createCompatClient } from "@/lib/supabase/compat-client";
import { ProductDetailCreatorPanel } from "@/components/creator/product-detail-creator-panel";

type AgentMode = "免费版" | "商用版" | "免费试用";
type AgentRow = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  is_free_trial: boolean;
  pricing_model?: string | null;
  monthly_price?: number | null;
  status?: string;
  tags?: string[] | null;
  demo_content?: unknown;
  profiles?: unknown;
};

function modeClass(mode: AgentMode) {
  if (mode === "免费版") return "bg-[rgba(212,165,116,0.08)] text-[#D4A574]";
  if (mode === "商用版") return "bg-[rgba(212,165,116,0.08)] text-[#B8860B]";
  return "bg-amber-50 text-amber-700";
}

function agentMode(agent: { price: number; is_free_trial: boolean; pricing_model?: string | null }): AgentMode {
  if (agent.pricing_model === "free" || agent.price === 0) return "免费版";
  if (agent.is_free_trial) return "免费试用";
  return "商用版";
}

function agentPrice(agent: { price: number; monthly_price?: number | null; pricing_model?: string | null }): string {
  if (agent.pricing_model === "free" || agent.price === 0) return "永久免费";
  if (agent.pricing_model === "subscription" && agent.monthly_price) return `¥${agent.monthly_price}/月`;
  if (agent.price > 0) return `¥${agent.price}/次`;
  return "免费试用";
}

const categoryLabels: Record<string, string> = {
  contract: "合同审查", litigation: "诉讼", consultation: "法律咨询",
  compliance: "合规风控", other: "其他",
};

const staticDiscussions = [
  { title: "合同审查智能体里，免费版和商用版最大的体验差别是什么？", author: "法学生阿木" },
  { title: "劳动仲裁前置咨询场景中，哪些问题适合先交给智能体？", author: "周律师" },
  { title: "婚姻家事问答助手的合规边界可以怎么设计？", author: "赵老师" },
];

function InfoPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-5 shadow-sm">
      <div className="text-sm text-[#9A8B78]">{label}</div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-[#2C2416]">{value}</div>
    </div>
  );
}

function DemoStep({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold text-[#2C2416]">{title}</div>
      <div className="mt-2 text-sm leading-6 text-[#9A8B78]">{desc}</div>
    </div>
  );
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
      <div className="mb-4 text-lg font-semibold text-[#2C2416]">{title}</div>
      {children}
    </div>
  );
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createCompatClient();

  const [agentRes, authRes, demoRes, convertedRes, relatedRes] = await Promise.all([
    supabase
      .from("agents")
      .select("*, profiles(id, display_name, bio, verified, lawyer_verified, lawyer_profiles(law_firm, specialty, verified_at))")
      .eq("id", id)
      .single(),
    supabase.auth.getUser(),
    supabase.from("agent_demos").select("*", { count: "exact", head: true }).eq("agent_id", id),
    supabase.from("agent_demos").select("*", { count: "exact", head: true }).eq("agent_id", id).eq("converted", true),
    supabase
      .from("agents")
      .select("id, name, description, category, price, is_free_trial, pricing_model, monthly_price, profiles(display_name)")
      .eq("status", "active").neq("id", id).limit(3),
  ]);
  const agent = (agentRes?.data ?? null) as AgentRow | null;
  const user = authRes?.data?.user;
  const demoCount = demoRes?.count;
  const convertedCount = convertedRes?.count ?? 0;
  const relatedAgents = ((relatedRes?.data ?? []) as unknown[]) ?? [];

  if (!agent || agent.status !== "active") notFound();

  const creator = agent.profiles as {
    id: string;
    display_name: string | null;
    bio: string | null;
    verified: boolean;
    lawyer_verified?: boolean | null;
    lawyer_profiles: { law_firm: string | null; specialty: string[] | null; verified_at: string | null } | null;
  } | null;

  const mode = agentMode(agent);
  const price = agentPrice(agent);
  const categoryKey = agent.category ?? "";
  const category = categoryLabels[categoryKey] ?? (categoryKey || "其他");
  const agentTags = (agent.tags as string[] | null) ?? [];
  const conversionRate = demoCount && demoCount > 0 && convertedCount !== null
    ? Math.round((convertedCount / demoCount) * 100)
    : 0;

  async function startDemo() {
    "use server";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("agent_demos").insert({ agent_id: id, viewer_id: user?.id ?? null });
  }

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)] text-[#2C2416]">
      {/* Agent header */}
      <section className="border-b border-[rgba(212,165,116,0.25)] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="mb-5 text-sm text-[#9A8B78]">
            <Link href="/agents" className="hover:text-[#B8860B] transition-colors">发现智能体</Link>
            {" / "}
            <span>{category}</span>
            {" / "}
            <span className="text-[#D4A574]">{agent.name}</span>
          </div>

          <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            {/* Left: info */}
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${modeClass(mode)}`}>{mode}</span>
                <span className="rounded-full border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-3 py-1 text-sm text-[#5D4E3A]">{category}</span>
              </div>

              <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#2C2416]">{agent.name}</h1>
              {agent.description && (
                <p className="mt-5 max-w-3xl text-lg leading-8 text-[#5D4E3A]">{agent.description}</p>
              )}

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <InfoPanel label="演示次数" value={`${demoCount ?? 0}`} />
                <InfoPanel label="转化率" value={`${conversionRate}%`} />
                <InfoPanel label="收藏数" value="—" />
                <InfoPanel label="评分" value="—" />
              </div>

              {agentTags.length > 0 && (
                <div className="mt-8 rounded-3xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] p-6">
                  <div className="text-sm font-semibold text-[#2C2416]">适用标签</div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {agentTags.map((tag) => (
                      <span key={tag} className="rounded-full bg-white px-3 py-1.5 text-sm text-[#5D4E3A] shadow-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: action panel */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-[#9A8B78]">发布模式</div>
                    <div className="mt-1 text-xl font-bold text-[#2C2416]">{mode}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[#9A8B78]">价格</div>
                    <div className="mt-1 text-base font-semibold text-[#2C2416]">{price}</div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {agent.is_free_trial || agent.price === 0 ? (
                    <form action={startDemo}>
                      <button
                        type="submit"
                        className="w-full rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-4 py-3 text-sm font-semibold text-white hover:shadow-md transition-shadow"
                      >
                        立即体验
                      </button>
                    </form>
                  ) : user ? (
                    <button className="w-full rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-4 py-3 text-sm font-semibold text-white">
                      购买使用 · {price}
                    </button>
                  ) : (
                    <Link
                      href={`/auth/login?redirectTo=/agents/${id}`}
                      className="block w-full rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-4 py-3 text-sm font-semibold text-white text-center"
                    >
                      登录后体验
                    </Link>
                  )}
                  <button className="w-full rounded-2xl border border-[rgba(212,165,116,0.25)] px-4 py-3 text-sm font-semibold text-[#D4A574] hover:bg-[rgba(212,165,116,0.08)] transition-colors">
                    收藏智能体
                  </button>
                  {creator && (
                    <Link
                      href={`/creators/${creator.id}`}
                      className="block w-full rounded-2xl border border-[rgba(212,165,116,0.25)] px-4 py-3 text-sm font-semibold text-[#D4A574] text-center hover:bg-[rgba(212,165,116,0.08)] transition-colors"
                    >
                      咨询创作者
                    </Link>
                  )}
                </div>

                <div className="mt-6 rounded-2xl bg-[rgba(212,165,116,0.08)] p-4 text-sm leading-7 text-[#5D4E3A]">
                  {mode === "免费版"
                    ? "此智能体完全免费，直接体验无需付费。"
                    : mode === "免费试用"
                    ? "支持先免费试用，再决定是否购买完整版。"
                    : "商用版智能体，支持按次付费或按月订阅，具体以创作者配置为准。"}
                </div>
              </div>

              {/* Creator info */}
              {creator ? (
                <ProductDetailCreatorPanel
                  creatorId={creator.id}
                  displayName={creator.display_name ?? "匿名创作者"}
                  bio={creator.bio}
                  lawyerVerified={Boolean(creator.lawyer_verified)}
                  lawyerProfileSlug={
                    creator.verified && creator.lawyer_profiles?.verified_at
                      ? creator.display_name?.trim() || null
                      : null
                  }
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Demo + reviews */}
      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-12 lg:grid-cols-[1fr_0.9fr] lg:px-8">
        {/* Demo section */}
        <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-[#2C2416]">演示与能力说明</h2>
            <span className="rounded-full bg-[rgba(212,165,116,0.08)] px-3 py-1 text-sm font-medium text-[#B8860B]">可体验</span>
          </div>
          <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <DemoStep title="输入需求" desc="上传文件 / 粘贴内容 / 描述法律问题" />
              <DemoStep title="AI 分析" desc="识别关键信息，生成分析结果" />
              <DemoStep title="输出建议" desc="给出修改建议、风险提示与下一步方向" />
            </div>
            <div className="mt-6 rounded-2xl border border-dashed border-[#B8A88A] bg-white p-5">
              <div className="text-sm font-semibold text-[#2C2416]">示例体验区</div>
              {agent.demo_content ? (
                <div className="mt-3 rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] p-4 text-sm leading-7 text-[#5D4E3A]">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(agent.demo_content, null, 2)}</pre>
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] p-4 text-sm leading-7 text-[#9A8B78]">
                  示例输入：请帮我分析这份合同中的风险条款。
                </div>
              )}
              <form action={startDemo} className="mt-4">
                <button
                  type="submit"
                  className="rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  开始演示
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SidebarCard title="真实评价">
            <div className="space-y-4">
              {[
                ["用户A", "—", "功能很实用，帮助我快速理清了合同要点。"],
                ["用户B", "—", "交互流畅，输出结构清晰，值得推荐。"],
                ["用户C", "—", "对入门者很友好，解释通俗易懂。"],
              ].map(([name, score, content]) => (
                <div key={name} className="rounded-2xl border border-[rgba(212,165,116,0.2)] p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-[#2C2416]">{name}</div>
                    <div className="text-sm text-[#9A8B78]">{score}</div>
                  </div>
                  <div className="mt-2 text-sm leading-7 text-[#5D4E3A]">{content}</div>
                </div>
              ))}
            </div>
          </SidebarCard>

          <SidebarCard title="相关讨论">
            <div className="space-y-3">
              {staticDiscussions.map((item) => (
                <Link key={item.title} href="/community" className="block rounded-2xl border border-[rgba(212,165,116,0.2)] p-3 hover:bg-[rgba(212,165,116,0.08)] transition-colors">
                  <div className="text-sm font-medium leading-6 text-[#2C2416]">{item.title}</div>
                  <div className="mt-2 text-xs text-[#9A8B78]">{item.author}</div>
                </Link>
              ))}
            </div>
          </SidebarCard>
        </div>
      </section>

      {/* Related agents */}
      {relatedAgents && relatedAgents.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-[#B8860B]">相关推荐</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#2C2416]">相似智能体推荐</h2>
            </div>
            <Link href="/agents" className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white px-4 py-2 text-sm font-medium text-[#D4A574] hover:bg-[rgba(212,165,116,0.08)] transition-colors">
              返回发现页
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {relatedAgents.map((item) => {
              const row = item as Record<string, unknown>;
              const relCreator = row.profiles as { display_name: string | null } | { display_name: string | null }[] | null;
              const relCreatorName = Array.isArray(relCreator) ? relCreator[0]?.display_name : relCreator?.display_name;
              const relMode = agentMode(row as { price: number; is_free_trial: boolean; pricing_model?: string | null });
              const relId = String(row.id ?? "");
              return (
                <div key={relId} className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-lg font-semibold text-[#2C2416] truncate">{String(row.name ?? "")}</div>
                      <div className="mt-1 text-sm text-[#9A8B78]">
                        {categoryLabels[String(row.category ?? "")] ?? String(row.category ?? "")} · {relCreatorName ?? "匿名"}
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${modeClass(relMode)}`}>
                      {relMode}
                    </span>
                  </div>
                  {Boolean(row.description) && (
                    <p className="mt-4 text-sm leading-7 text-[#5D4E3A] line-clamp-2">{String(row.description)}</p>
                  )}
                  <div className="mt-5 flex gap-3">
                    <Link
                      href={`/agents/${relId}`}
                      className="flex-1 rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-4 py-2.5 text-sm font-semibold text-white text-center"
                    >
                      体验
                    </Link>
                    <Link
                      href={`/agents/${relId}`}
                      className="rounded-2xl border border-[rgba(212,165,116,0.25)] px-4 py-2.5 text-sm font-semibold text-[#D4A574] hover:bg-[rgba(212,165,116,0.08)] transition-colors"
                    >
                      详情
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
