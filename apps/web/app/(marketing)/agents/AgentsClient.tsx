"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import type { AgentListItem } from "@/lib/api/types";
import { PageContainer } from "@/components/layout/page-container";
import { Panel } from "@/components/ui/panel";
import { EmptyState } from "@/components/common/empty-state";
import { AgentCard, type AgentCardProps } from "@/components/agent/agent-card";
import { DiscussionCard, type DiscussionCardPost } from "@/components/community/discussion-card";
import { Bot, Search } from "lucide-react";

// ─── constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  contract:     "合同审查",
  litigation:   "诉讼仲裁",
  consultation: "法律咨询",
  compliance:   "合规风控",
  family:       "婚姻家事",
  labor:        "劳动仲裁",
  criminal:     "刑事辩护",
  ip:           "知识产权",
  tax:          "税务筹划",
  other:        "其他",
};

const CATEGORY_FILTERS = [
  { value: "",            label: "全部分类" },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
];

const MODE_FILTERS = [
  { value: "",      label: "全部" },
  { value: "free",  label: "免费版" },
  { value: "trial", label: "免费试用" },
  { value: "paid",  label: "商用版" },
];

const STATIC_DISCUSSIONS: DiscussionCardPost[] = [
  {
    id: "d1",
    title: "合同审查智能体里，免费版和商用版最大的体验差别是什么？",
    authorName: "法学生阿木",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    likeCount: 136,
    commentCount: 28,
  },
  {
    id: "d2",
    title: "劳动仲裁前置咨询场景中，哪些问题适合先交给智能体？",
    authorName: "周律师",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    likeCount: 94,
    commentCount: 19,
  },
  {
    id: "d3",
    title: "婚姻家事问答助手的合规边界可以怎么设计？",
    authorName: "赵老师",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    likeCount: 81,
    commentCount: 14,
  },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function buildHref(base: Record<string, string>, override: Record<string, string>) {
  const merged = { ...base, ...override };
  const qs = Object.entries(merged)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return `/agents${qs ? `?${qs}` : ""}`;
}

type ModeType = "免费" | "免费试用" | "付费"

function inferMode(agent: AgentListItem): ModeType {
  if (agent.price === 0) return "免费";
  if (agent.is_free_trial) return "免费试用";
  return "付费";
}

// ─── page component ──────────────────────────────────────────────────────────

interface AgentsClientProps {
  initialSearchParams: {
    q?: string
    category?: string
    mode?: string
  }
}

export function AgentsClient({ initialSearchParams }: AgentsClientProps) {
  const [agents, setAgents] = useState<AgentListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState({ total: 0, free: 0, commercial: 0 })
  const [searchParams, setSearchParams] = useState(initialSearchParams)

  useEffect(() => {
    async function fetchAgents() {
      setLoading(true)
      try {
        const result = await api.agents.list({
          category: searchParams.category || undefined,
          status: 'approved',
          search: searchParams.q || undefined,
          page: 1,
          pageSize: 50,
        })
        setAgents((result.items as unknown as AgentListItem[]) ?? [])
        setTotal(result.total)

        // 计算统计数据
        const allAgents = (result.items as unknown as AgentListItem[]) ?? []
        setStats({
          total: result.total,
          free: allAgents.filter(a => a.price === 0).length,
          commercial: allAgents.filter(a => a.price > 0).length,
        })
      } catch (error) {
        console.error('Failed to fetch agents:', error)
        setAgents([])
      } finally {
        setLoading(false)
      }
    }
    fetchAgents()
  }, [searchParams])

  const base = { q: searchParams.q ?? "", category: searchParams.category ?? "", mode: searchParams.mode ?? "" }

  // 过滤模式
  const filteredAgents = agents.filter(agent => {
    if (searchParams.mode === 'free') return agent.price === 0
    if (searchParams.mode === 'paid') return agent.price > 0 && !agent.is_free_trial
    if (searchParams.mode === 'trial') return agent.is_free_trial && agent.price > 0
    return true
  })

  // Hot list (top 5)
  const hotAgents = filteredAgents.slice(0, 5)

  type AgentCardData = {
    id: string;
    name: string;
    description: string;
    category: string;
    creator: string;
    mode: ModeType;
    useCount: number;
  }

  const latestAgents: AgentCardData[] = filteredAgents.slice(0, 8).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category ? (CATEGORY_LABELS[row.category] ?? row.category) : "其他",
    creator: row.creator_name ?? "未知创作者",
    mode: inferMode(row),
    useCount: row.trial_count,
  }))

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const q = formData.get('q') as string
    setSearchParams(prev => ({ ...prev, q: q || undefined }))
  }

  return (
    <div className="min-h-screen marketing-page-shell-tint">

      {/* ── Hero ── */}
      <div className="page-header" style={{ position: 'relative' }}>
        <div
          className="page-header-bg"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 0,
            overflow: 'hidden'
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1920&q=80"
            alt="智能体背景"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <PageContainer py="lg">
          <div className="space-y-6 relative z-10">

            {/* Title row + stats */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wider text-[#B8860B]">发现智能体</p>
                <h1 className="text-3xl font-bold text-[#2C2416] lg:text-4xl">法律 AI 智能体市场</h1>
                <p className="max-w-xl text-[#5D4E3A] leading-relaxed">
                  发现由法律创作者打造的中文法律智能体，覆盖合同、诉讼、合规等全法律场景
                </p>
              </div>

              {/* Stats strip */}
              <div className="flex shrink-0 flex-wrap gap-3 lg:flex-col lg:items-end">
                {[
                  { label: "已收录智能体", value: stats.total },
                  { label: "免费可用",     value: stats.free },
                  { label: "商用版",       value: stats.commercial },
                ].map(({ label, value }) => (
                  <div key={label} className="card px-5 py-3 text-center lg:text-right">
                    <p className="text-xl font-bold text-[#2C2416]">{loading ? '-' : value}</p>
                    <p className="text-xs text-[#5D4E3A]">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Search */}
            <form method="GET" onSubmit={handleSearch} className="flex max-w-2xl items-center gap-2">
              {searchParams.category && <input type="hidden" name="category" value={searchParams.category} />}
              {searchParams.mode     && <input type="hidden" name="mode"     value={searchParams.mode} />}
              <div className="search-box flex-1">
                <Search className="text-[#9A8B78]" />
                <input
                  name="q"
                  defaultValue={searchParams.q}
                  placeholder="搜索智能体名称、法律场景、创作者…"
                  className="search-input"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
              >
                搜索
              </button>
            </form>
          </div>
        </PageContainer>
      </div>

      {/* ── Latest Agents Section ── */}
      <PageContainer py="lg">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[#2C2416] mb-4">最新上线</h2>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-40 rounded-2xl bg-[rgba(212,165,116,0.15)] animate-pulse" />
              ))}
            </div>
          ) : latestAgents.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {latestAgents.slice(0, 4).map((agent) => (
                <AgentCard key={agent.id} id={agent.id} name={agent.name} description={agent.description} category={agent.category} creator={agent.creator} mode={agent.mode} useCount={agent.useCount} />
              ))}
            </div>
          ) : (
            <p className="text-[#5D4E3A] text-sm">暂无最新智能体</p>
          )}
        </div>
      </PageContainer>

      {/* ── Content ── */}
      <PageContainer py="md">
        <div className="grid gap-6 xl:grid-cols-[1fr_288px]">

          {/* ── Left: agent list ── */}
          <div className="min-w-0 space-y-5">

            {/* Category filter */}
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
              {CATEGORY_FILTERS.map((f) => {
                const active = (searchParams.category ?? "") === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => setSearchParams(prev => ({ ...prev, category: f.value || undefined }))}
                    className={
                      active
                        ? "shrink-0 rounded-xl bg-[#D4A574] px-3.5 py-2 text-sm font-medium text-white"
                        : "shrink-0 rounded-xl border border-[rgba(212,165,116,0.25)] bg-white px-3.5 py-2 text-sm font-medium text-[#5D4E3A] hover:bg-[rgba(212,165,116,0.1)] transition-colors"
                    }
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* Mode filter + count row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {MODE_FILTERS.map((f) => {
                  const active = (searchParams.mode ?? "") === f.value;
                  return (
                    <button
                      key={f.value}
                    onClick={() => setSearchParams(prev => ({ ...prev, mode: f.value || undefined }))}
                    className={
                      active
                        ? "shrink-0 rounded-xl bg-[#D4A574] px-3 py-1.5 text-sm font-medium text-white"
                        : "shrink-0 rounded-xl border border-[rgba(212,165,116,0.25)] bg-white px-3 py-1.5 text-sm font-medium text-[#5D4E3A] hover:bg-[rgba(212,165,116,0.1)] transition-colors"
                    }
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                {searchParams.q && (
                  <span className="flex items-center gap-1.5 rounded-xl bg-[rgba(212,165,116,0.2)] px-3 py-1.5 text-sm text-[#D4A574]">
                    {searchParams.q}
                    <button
                      onClick={() => setSearchParams(prev => ({ ...prev, q: undefined }))}
                      className="ml-0.5 text-[#D4A574] hover:text-[#2C2416]"
                    >
                      ✕
                    </button>
                  </span>
                )}
                <span className="text-sm text-[#9A8B78]">{filteredAgents.length} 个智能体</span>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 rounded-2xl bg-[rgba(212,165,116,0.15)] animate-pulse" />
                ))}
              </div>
            ) : !filteredAgents.length ? (
              <div className="card p-12">
                <EmptyState
                  icon={<Bot className="h-16 w-16 text-[#9A8B78]" />}
                  title="暂无符合条件的智能体"
                  description="试试更换分类、价格模式或搜索关键词"
                  action="清除筛选"
                  actionHref="/agents"
                />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredAgents.map((row) => (
                  <AgentCard
                    key={row.id}
                    id={row.id}
                    name={row.name}
                    category={row.category ? (CATEGORY_LABELS[row.category] ?? row.category) : "其他"}
                    creator={row.creator_name ?? "未知创作者"}
                    mode={inferMode(row)}
                    useCount={row.trial_count}
                    description={row.description}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Right: sidebar ── */}
          <aside className="space-y-5">

            {/* Category nav */}
            <Panel title="分类导航" noPadding>
              <ul className="divide-y divide-[rgba(212,165,116,0.15)]">
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                  const active = searchParams.category === key;
                  return (
                    <li key={key}>
                      <button
                        onClick={() => setSearchParams(prev => ({ ...prev, category: active ? "" : key }))}
                        className={`flex w-full items-center justify-between px-5 py-3 text-sm transition-colors ${
                          active
                            ? "bg-[rgba(212,165,116,0.2)] font-semibold text-[#D4A574]"
                            : "text-[#5D4E3A] hover:bg-[rgba(212,165,116,0.1)]"
                        }`}
                      >
                        {label}
                        <svg className="h-3.5 w-3.5 text-[#9A8B78]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Panel>

            {/* Hot ranking */}
            {!loading && hotAgents.length > 0 && (
              <Panel title="热门智能体">
                <ul className="space-y-2">
                  {hotAgents.map((row, i) => (
                    <li key={row.id}>
                      <Link
                        href={`/agents/${row.id}`}
                        className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[rgba(212,165,116,0.1)]"
                      >
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          i === 0 ? "bg-[rgba(212,165,116,0.2)] text-[#D4A574]"
                          : i === 1 ? "bg-[rgba(212,165,116,0.15)] text-[#B8860B]"
                          : i === 2 ? "bg-[rgba(212,165,116,0.12)] text-[#B8860B]"
                          : "bg-[rgba(212,165,116,0.1)] text-[#9A8B78]"
                        }`}>
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[#2C2416]">{row.name}</p>
                          <p className="text-xs text-[#9A8B78]">
                            {row.category ? (CATEGORY_LABELS[row.category] ?? row.category) : "其他"}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-medium text-[#D4A574]">
                          {row.price === 0 ? "免费" : `¥${row.price}`}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            {/* Community discussions */}
            <Panel title="大家在讨论" actionHref="/community">
              <ul className="space-y-1 divide-y divide-[rgba(212,165,116,0.15)]">
                {STATIC_DISCUSSIONS.map((post) => (
                  <li key={post.id} className="pt-1 first:pt-0">
                    <DiscussionCard post={post} variant="compact" />
                  </li>
                ))}
              </ul>
            </Panel>

          </aside>
        </div>
      </PageContainer>
    </div>
  );
}
