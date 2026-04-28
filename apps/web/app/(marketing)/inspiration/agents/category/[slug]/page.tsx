"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, Agent } from "@/lib/api/client";
import { PageHeader } from "@/components/layout/page-header";
import { CardGrid } from "@/components/common/list-components";
import { Pagination } from "@/components/common/pagination";
import { GuestGate } from "@/components/common/guest-gate";
import { Bot, Star } from "lucide-react";

const SORT_OPTIONS = [
  { value: "popular", label: "最受欢迎" },
  { value: "latest", label: "最新发布" },
  { value: "rating", label: "评分最高" },
];

const CATEGORY_META: Record<string, { label: string; description: string }> = {
  consultation: { label: "法律咨询", description: "专业的法律问题咨询智能体" },
  contract: { label: "合同服务", description: "合同审查、起草、管理的智能体助手" },
  litigation: { label: "诉讼辅助", description: "诉讼流程辅助和案例分析智能体" },
  compliance: { label: "合规审查", description: "企业合规审查和风险评估智能体" },
  research: { label: "法律研究", description: "法律法规研究和案例检索智能体" },
  document: { label: "文书生成", description: "法律文书自动生成智能体" },
};

interface PageProps {
  params: Promise<{ category: string }>;
}

export default function AgentsCategoryPage({ params }: PageProps) {
  const [categorySlug, setCategorySlug] = useState<string>("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    params.then((p) => setCategorySlug(p.category));
  }, [params]);

  useEffect(() => {
    if (categorySlug) {
      fetchAgents();
    }
  }, [categorySlug, sortBy, searchQuery, page]);

  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.agents.list({
        page,
        limit: 12,
        category: categorySlug,
        search: searchQuery || undefined,
      });
      setAgents(result.items as unknown as Agent[]);
      setTotalPages(Math.ceil(result.total / 12));
    } catch (err) {
      console.error("获取智能体列表失败:", err);
      setError("获取数据失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const categoryMeta = CATEGORY_META[categorySlug] || {
    label: categorySlug,
    description: `浏览 ${categorySlug} 分类下的所有智能体`,
  };

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
      <PageHeader
        variant="inspiration"
        title={categoryMeta.label}
        description={categoryMeta.description}
        backHref="/inspiration/agents"
        showSearch
        searchPlaceholder={`搜索 ${categoryMeta.label} 相关智能体...`}
        onSearch={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
      />

      {/* 其他分类入口 */}
      <section className="mx-auto max-w-6xl px-6 py-4 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_META).map(([slug, meta]) => (
            <Link
              key={slug}
              href={`/inspiration/agents/category/${slug}`}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                categorySlug === slug
                  ? "border-[#D4A574] bg-[#D4A574] text-white"
                  : "border-[rgba(212,165,116,0.25)] bg-white text-[#5D4E3A] hover:border-[#D4A574] hover:text-[#D4A574]"
              }`}
            >
              {meta.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-[#5D4E3A]">
            共找到 <span className="font-medium text-[#2C2416]">{totalPages * 12}</span> 个智能体
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white px-4 py-2 text-sm text-[#5D4E3A] focus:border-[#D4A574] focus:outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-3 sm:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-5">
                <div className="h-12 w-12 rounded-xl bg-[rgba(212,165,116,0.15)]" />
                <div className="mt-4 h-6 w-full rounded bg-[rgba(212,165,116,0.15)]" />
                <div className="mt-2 h-4 w-3/4 rounded bg-[rgba(212,165,116,0.15)]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 p-6 text-center text-red-600">{error}</div>
        ) : agents.length === 0 ? (
          <div className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-12 text-center">
            <Bot className="mx-auto h-12 w-12 text-[#9A8B78]" />
            <h3 className="mt-4 text-lg font-semibold text-[#2C2416]">暂无 {categoryMeta.label} 相关智能体</h3>
            <p className="mt-2 text-sm text-[#5D4E3A]">该分类下还没有内容，敬请期待</p>
          </div>
        ) : (
          <>
            <CardGrid>
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </CardGrid>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} className="mt-8" />
          </>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 lg:px-8">
        <GuestGate action="使用和体验" mode="prompt" description="登录后可使用智能体、收藏内容" />
      </section>
    </div>
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Link
      href={`/inspiration/${agent.slug || agent.id}`}
      className="group flex flex-col rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-5 transition-all hover:-translate-y-1 hover:border-[#D4A574] hover:shadow-md"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4A574] to-[#B8860B]">
        <Bot className="h-7 w-7 text-white" />
      </div>
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-3 py-1 text-xs font-medium text-[#5D4E3A]">
          {agent.category || "通用助手"}
        </span>
        {agent.rating && (
          <span className="flex items-center gap-1 text-sm font-medium text-[#D4A574]">
            <Star className="h-4 w-4 fill-current" />
            {agent.rating.toFixed(1)}
          </span>
        )}
      </div>
      <h3 className="mb-2 font-medium text-[#2C2416] transition-colors group-hover:text-[#D4A574] line-clamp-1">
        {agent.name}
      </h3>
      {agent.description && (
        <p className="mb-3 flex-1 text-sm text-[#5D4E3A] line-clamp-2">{agent.description}</p>
      )}
      <div className="mt-auto h-px bg-gradient-to-r from-transparent via-[rgba(212,165,116,0.2)] to-transparent" />
      <div className="flex items-center justify-between pt-3 text-sm text-[#9A8B78]">
        <span>{agent.usage_count || 0} 次对话</span>
        <span className="text-[#D4A574]">开始使用 →</span>
      </div>
    </Link>
  );
}
