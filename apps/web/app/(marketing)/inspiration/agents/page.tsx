"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, Agent } from "@/lib/api/client";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/common/filter-components";
import { CategoryTabs } from "@/components/common/filter-components";
import { CardGrid } from "@/components/common/list-components";
import { Pagination } from "@/components/common/pagination";
import { GuestGate } from "@/components/common/guest-gate";
import { Sparkles, Bot, Star, Lock } from "lucide-react";

const CATEGORIES = [
  { value: "", label: "全部" },
  { value: "consultation", label: "法律咨询" },
  { value: "contract", label: "合同服务" },
  { value: "litigation", label: "诉讼辅助" },
  { value: "compliance", label: "合规审查" },
  { value: "research", label: "法律研究" },
  { value: "document", label: "文书生成" },
];

const SORT_OPTIONS = [
  { value: "popular", label: "最受欢迎" },
  { value: "latest", label: "最新发布" },
  { value: "rating", label: "评分最高" },
  { value: "usage", label: "使用量最高" },
];

export default function AgentsListPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAgents();
  }, [selectedCategory, sortBy, searchQuery, page]);

  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.agents.list({
        page,
        limit: 12,
        category: selectedCategory || undefined,
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

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
      {/* 页面头部 */}
      <PageHeader
        variant="inspiration"
        title="智能体"
        description="与专业的法律 AI 智能体对话，获得即时帮助"
        backHref="/inspiration"
        showSearch
        searchPlaceholder="搜索智能体..."
        onSearch={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
      />

      {/* 筛选区域 */}
      <section className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
        <FilterBar
          filters={[
            {
              label: "分类",
              options: CATEGORIES,
              value: selectedCategory,
              onChange: (value) => {
                setSelectedCategory(value);
                setPage(1);
              },
            },
          ]}
        />
      </section>

      {/* Tab 切换 */}
      <section className="mx-auto max-w-6xl px-6 lg:px-8">
        <CategoryTabs
          tabs={[
            { id: "skills", label: "Skills", icon: Sparkles },
            { id: "agents", label: "智能体", icon: Bot },
          ]}
          activeTab="agents"
          onChange={(tab) => {
            if (tab === "skills") {
              window.location.href = "/inspiration/skills";
            }
          }}
        />
      </section>

      {/* 内容区域 */}
      <section className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
        {/* 排序控制 */}
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
                <div className="mt-4 h-4 w-1/2 rounded bg-[rgba(212,165,116,0.15)]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 p-6 text-center text-red-600">
            {error}
          </div>
        ) : agents.length === 0 ? (
          <div className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-12 text-center">
            <Bot className="mx-auto h-12 w-12 text-[#9A8B78]" />
            <h3 className="mt-4 text-lg font-semibold text-[#2C2416]">暂无智能体</h3>
            <p className="mt-2 text-sm text-[#5D4E3A]">试试其他筛选条件吧</p>
          </div>
        ) : (
          <>
            <CardGrid>
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </CardGrid>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              className="mt-8"
            />
          </>
        )}
      </section>

      {/* 游客提示 */}
      <section className="mx-auto max-w-6xl px-6 pb-16 lg:px-8">
        <GuestGate
          action="使用和体验"
          mode="prompt"
          description="登录后可使用智能体、收藏内容，并参与评论"
        />
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
      {/* 头像 */}
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4A574] to-[#B8860B]">
        <Bot className="h-7 w-7 text-white" />
      </div>

      {/* 类型标签 */}
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

      {/* 名称 */}
      <h3 className="mb-2 font-medium text-[#2C2416] transition-colors group-hover:text-[#D4A574] line-clamp-1">
        {agent.name}
      </h3>

      {/* 描述 */}
      {agent.description && (
        <p className="mb-3 flex-1 text-sm text-[#5D4E3A] line-clamp-2">
          {agent.description}
        </p>
      )}

      {/* 底部统计 */}
      <div className="mt-auto h-px bg-gradient-to-r from-transparent via-[rgba(212,165,116,0.2)] to-transparent" />
      <div className="flex items-center justify-between pt-3 text-sm text-[#9A8B78]">
        <span>{agent.usage_count || 0} 次对话</span>
        <span className="flex items-center gap-1 text-[#D4A574]">
          开始使用 →
        </span>
      </div>
    </Link>
  );
}
