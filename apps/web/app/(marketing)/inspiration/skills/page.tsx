"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, Skill } from "@/lib/api/client";
import { CategoryTabs } from "@/components/common/filter-components";
import { CardGrid } from "@/components/common/list-components";
import { Pagination } from "@/components/common/pagination";
import { GuestGate } from "@/components/common/guest-gate";
import { Sparkles, Bot, Star, CalendarDays } from "lucide-react";
import { preferTradForKeShiLu } from "@/lib/keshilu-text";

const CATEGORIES = [
  { value: "", label: "全部" },
  { value: "contract", label: "合同法" },
  { value: "labor", label: "劳动法" },
  { value: "ip", label: "知识产权" },
  { value: "corporate", label: "公司法" },
  { value: "family", label: "婚姻家事" },
  { value: "criminal", label: "刑事辩护" },
  { value: "compliance", label: "企业合规" },
];

const SORT_OPTIONS = [
  { value: "recommended", label: "综合推荐" },
  { value: "popular", label: "最受欢迎" },
  { value: "latest", label: "最新发布" },
  { value: "rating", label: "评分最高" },
  { value: "price_low", label: "价格从低到高" },
  { value: "price_high", label: "价格从高到低" },
];

export default function SkillsListPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchSkills();
  }, [selectedCategory, sortBy, searchQuery, page]);

  const fetchSkills = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.skills.list({
        page,
        limit: 12,
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
      });
      setSkills(result.items as unknown as Skill[]);
      setTotalPages(Math.ceil(result.total / 12));
    } catch (err) {
      console.error("获取 Skills 列表失败:", err);
      setError("获取数据失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
      <section className="relative overflow-hidden border-b border-[rgba(212,165,116,0.22)] bg-[linear-gradient(180deg,rgba(255,248,240,0.95)_0%,rgba(255,248,240,0.85)_65%,rgba(255,248,240,0.55)_100%)]">
        <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="home-cta-brush-title text-3xl text-[#5C4033] sm:text-4xl">
                {preferTradForKeShiLu("技能精选")}
              </h1>
              <p className="mt-2 text-sm text-[#6F5A44]">
                完整 Skills 列表 · 可按发布时间、业务类型、综合推荐筛选
              </p>
            </div>
            <Link
              href="/inspiration"
              className="inline-flex items-center rounded-xl border border-[rgba(212,165,116,0.35)] bg-white px-4 py-2 text-sm font-semibold text-[#5C4033] shadow-sm hover:border-[#D4A574]"
            >
              返回灵感广场
            </Link>
          </div>
          <div className="mt-5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="搜索 Skills / 场景关键词..."
              className="w-full rounded-xl border border-[rgba(212,165,116,0.3)] bg-white px-4 py-2.5 text-sm text-[#2C2416] placeholder:text-[#9A8B78] focus:border-[#D4A574] focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* 筛选区域 */}
      <section className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
        <div className="rounded-2xl border border-[rgba(212,165,116,0.22)] bg-white/80 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#B8860B]">业务类型</span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value || "all"}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.value);
                  setPage(1);
                }}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  selectedCategory === cat.value
                    ? "border-[#D4A574] bg-[rgba(212,165,116,0.18)] text-[#5C4033]"
                    : "border-[rgba(212,165,116,0.3)] text-[#6A583F]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="mt-3 h-px bg-gradient-to-r from-transparent via-[rgba(212,165,116,0.22)] to-transparent" />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#B8860B]">
              <CalendarDays className="h-4 w-4" />
              发布时间
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#B8860B]">排序</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white px-3 py-1.5 text-sm text-[#5D4E3A] focus:border-[#D4A574] focus:outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Tab 切换 */}
      <section className="mx-auto max-w-6xl px-6 lg:px-8">
        <CategoryTabs
          tabs={[
            { id: "skills", label: "Skills", icon: Sparkles },
            { id: "agents", label: "智能体", icon: Bot },
          ]}
          activeTab="skills"
          onChange={(tab) => {
            if (tab === "agents") {
              window.location.href = "/inspiration/agents";
            }
          }}
        />
      </section>

      {/* 内容区域 */}
      <section className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
        {/* 汇总信息 */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-[#5D4E3A]">
            共找到 <span className="font-medium text-[#2C2416]">{totalPages * 12}</span> 个 Skills
          </p>
          <p className="text-xs text-[#9A8B78]">展示字段含：发布时间 / 业务类型 / 评分与价格</p>
        </div>

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-3 sm:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-5">
                <div className="h-4 w-20 rounded bg-[rgba(212,165,116,0.15)]" />
                <div className="mt-4 h-6 w-full rounded bg-[rgba(212,165,116,0.15)]" />
                <div className="mt-2 h-4 w-3/4 rounded bg-[rgba(212,165,116,0.15)]" />
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-[rgba(212,165,116,0.15)]" />
                  <div className="h-4 w-16 rounded bg-[rgba(212,165,116,0.15)]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 p-6 text-center text-red-600">
            {error}
          </div>
        ) : skills.length === 0 ? (
          <div className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-12 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-[#9A8B78]" />
            <h3 className="mt-4 text-lg font-semibold text-[#2C2416]">暂无 Skills</h3>
            <p className="mt-2 text-sm text-[#5D4E3A]">试试其他筛选条件吧</p>
          </div>
        ) : (
          <>
            <CardGrid className="xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2">
              {skills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
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
          action="收藏和购买"
          mode="prompt"
          description="登录后可收藏、购买 Skills，并参与评论讨论"
        />
      </section>
    </div>
  );
}

function SkillCard({ skill }: { skill: Skill }) {
  const price = skill.price || 0;
  const isFree = price === 0;
  const published = String((skill as unknown as Record<string, unknown>).created_at || "").slice(0, 10);
  const coverImage = String((skill as unknown as Record<string, unknown>).cover_image || "");

  return (
    <Link
      href={`/inspiration/${encodeURIComponent(
        String(skill.id ?? "").trim() || String(skill.slug ?? "").trim()
      )}`}
      className="group flex flex-col rounded-xl border border-[rgba(212,165,116,0.25)] bg-[rgba(255,251,244,0.98)] p-4 transition-all hover:-translate-y-1 hover:border-[#D4A574] hover:shadow-md"
    >
      <div className="mb-3 h-28 overflow-hidden rounded-lg border border-[rgba(212,165,116,0.18)] bg-[rgba(255,248,240,0.5)]">
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-[#9A8B78]">Skills 封面</div>
        )}
      </div>
      {/* 顶部标签 */}
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-3 py-1 text-xs font-medium text-[#5D4E3A]">
          {skill.category || "通用"}
        </span>
        {skill.rating && (
          <span className="flex items-center gap-1 text-sm font-medium text-[#D4A574]">
            <Star className="h-4 w-4 fill-current" />
            {skill.rating.toFixed(1)}
          </span>
        )}
      </div>

      {/* 标题 */}
      <h3 className="mb-1.5 text-[15px] font-medium text-[#2C2416] transition-colors group-hover:text-[#D4A574] line-clamp-2">
        {skill.name}
      </h3>

      {/* 描述 */}
      {skill.description && (
        <p className="mb-2.5 text-[13px] text-[#5D4E3A] line-clamp-2">
          {skill.description}
        </p>
      )}

      {/* 作者信息 */}
      <div className="mb-2.5 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(212,165,116,0.15)] text-xs font-medium text-[#D4A574]">
          {skill.creator_name?.[0] || "创"}
        </div>
        <span className="text-sm text-[#5D4E3A]">{skill.creator_name || "认证创作者"}</span>
      </div>
      <div className="mb-3 text-xs text-[#9A8B78]">
        发布时间：{published || "—"} · 业务类型：{skill.category || "通用"}
      </div>

      {/* 底部统计 */}
      <div className="mt-auto h-px bg-gradient-to-r from-transparent via-[rgba(212,165,116,0.2)] to-transparent" />
      <div className="flex items-center justify-between pt-3 text-sm text-[#9A8B78]">
        <span>{skill.usage_count || 0} 次使用</span>
        <span className={isFree ? "text-[#D4A574] font-medium" : "text-[#5D4E3A]"}>
          {isFree ? "免费" : `¥${price.toFixed(2)}`}
        </span>
      </div>
    </Link>
  );
}
