"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, Skill } from "@/lib/api/client";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/common/filter-components";
import { CardGrid } from "@/components/common/list-components";
import { Pagination } from "@/components/common/pagination";
import { GuestGate } from "@/components/common/guest-gate";
import { Sparkles, Star } from "lucide-react";

const SORT_OPTIONS = [
  { value: "popular", label: "最受欢迎" },
  { value: "latest", label: "最新发布" },
  { value: "rating", label: "评分最高" },
];

// 分类元数据
const CATEGORY_META: Record<string, { label: string; description: string }> = {
  contract: { label: "合同法", description: "合同审查、合同起草、合同纠纷处理相关的 Skills" },
  labor: { label: "劳动法", description: "劳动争议、劳动合同、社保公积金等劳动法相关 Skills" },
  ip: { label: "知识产权", description: "专利、商标、著作权等知识产权相关 Skills" },
  corporate: { label: "公司法", description: "公司设立、治理结构、并购重组等公司法律服务 Skills" },
  family: { label: "婚姻家事", description: "婚姻家庭、继承抚养等家事法律服务 Skills" },
  criminal: { label: "刑事辩护", description: "刑事辩护、刑事代理等刑事法律服务 Skills" },
  compliance: { label: "企业合规", description: "企业合规审查、风险防控等合规管理 Skills" },
};

interface PageProps {
  params: Promise<{ category: string }>;
}

export default function SkillsCategoryPage({ params }: PageProps) {
  const [categorySlug, setCategorySlug] = useState<string>("");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    params.then((p) => {
      setCategorySlug(p.category);
    });
  }, [params]);

  useEffect(() => {
    if (categorySlug) {
      fetchSkills();
    }
  }, [categorySlug, sortBy, searchQuery, page]);

  const fetchSkills = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.skills.list({
        page,
        limit: 12,
        category: categorySlug,
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

  const categoryMeta = CATEGORY_META[categorySlug] || {
    label: categorySlug,
    description: `浏览 ${categorySlug} 分类下的所有 Skills`,
  };

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
      {/* 页面头部 */}
      <PageHeader
        variant="inspiration"
        title={categoryMeta.label}
        description={categoryMeta.description}
        backHref="/inspiration/skills"
        showSearch
        searchPlaceholder={`搜索 ${categoryMeta.label} 相关 Skills...`}
        onSearch={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
      />

      {/* 其他分类快捷入口 */}
      <section className="mx-auto max-w-6xl px-6 py-4 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_META).map(([slug, meta]) => (
            <Link
              key={slug}
              href={`/inspiration/skills/category/${slug}`}
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

      {/* 内容区域 */}
      <section className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
        {/* 排序控制 */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-[#5D4E3A]">
            共找到 <span className="font-medium text-[#2C2416]">{totalPages * 12}</span> 个 Skills
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
                <div className="h-4 w-20 rounded bg-[rgba(212,165,116,0.15)]" />
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
        ) : skills.length === 0 ? (
          <div className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-12 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-[#9A8B78]" />
            <h3 className="mt-4 text-lg font-semibold text-[#2C2416]">暂无 {categoryMeta.label} 相关 Skills</h3>
            <p className="mt-2 text-sm text-[#5D4E3A]">该分类下还没有内容，敬请期待</p>
          </div>
        ) : (
          <>
            <CardGrid>
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
  const coverImage = String((skill as unknown as Record<string, unknown>).cover_image || "");

  return (
    <Link
      href={`/inspiration/${encodeURIComponent(
        String(skill.id ?? "").trim() || String(skill.slug ?? "").trim()
      )}`}
      className="group flex flex-col rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-5 transition-all hover:-translate-y-1 hover:border-[#D4A574] hover:shadow-md"
    >
      <div className="mb-3 h-28 overflow-hidden rounded-lg border border-[rgba(212,165,116,0.18)] bg-[rgba(255,248,240,0.5)]">
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-[#9A8B78]">Skills 封面</div>
        )}
      </div>
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

      <h3 className="mb-2 font-medium text-[#2C2416] transition-colors group-hover:text-[#D4A574] line-clamp-2">
        {skill.name}
      </h3>

      {skill.description && (
        <p className="mb-3 text-sm text-[#5D4E3A] line-clamp-2">
          {skill.description}
        </p>
      )}

      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(212,165,116,0.15)] text-xs font-medium text-[#D4A574]">
          {skill.creator_name?.[0] || "创"}
        </div>
        <span className="text-sm text-[#5D4E3A]">{skill.creator_name || "认证创作者"}</span>
      </div>

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
