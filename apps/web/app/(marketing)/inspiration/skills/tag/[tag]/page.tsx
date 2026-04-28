"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, Skill } from "@/lib/api/client";
import { PageHeader } from "@/components/layout/page-header";
import { CardGrid } from "@/components/common/list-components";
import { Pagination } from "@/components/common/pagination";
import { GuestGate } from "@/components/common/guest-gate";
import { Sparkles, Star } from "lucide-react";

const SORT_OPTIONS = [
  { value: "popular", label: "最受欢迎" },
  { value: "latest", label: "最新发布" },
  { value: "rating", label: "评分最高" },
];

interface PageProps {
  params: Promise<{ tag: string }>;
}

export default function SkillsTagPage({ params }: PageProps) {
  const [tagSlug, setTagSlug] = useState<string>("");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("popular");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    params.then((p) => setTagSlug(p.tag));
  }, [params]);

  useEffect(() => {
    if (tagSlug) {
      fetchSkills();
    }
  }, [tagSlug, sortBy, page]);

  const fetchSkills = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.skills.list({
        page,
        limit: 12,
        tag: tagSlug,
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
      <PageHeader
        variant="inspiration"
        title={`#${decodeURIComponent(tagSlug)}`}
        description={`浏览所有带有「${decodeURIComponent(tagSlug)}」标签的 Skills`}
        backHref="/inspiration/skills"
      />

      {/* 标签导航 */}
      <section className="mx-auto max-w-6xl px-6 py-4 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-[#5D4E3A]">相关标签:</span>
          {["合同审查", "劳动争议", "知识产权", "企业合规", "婚姻家事"].map((tag) => (
            <Link
              key={tag}
              href={`/inspiration/skills/tag/${encodeURIComponent(tag)}`}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                decodeURIComponent(tagSlug) === tag
                  ? "border-[#D4A574] bg-[#D4A574] text-white"
                  : "border-[rgba(212,165,116,0.25)] bg-white text-[#5D4E3A] hover:border-[#D4A574] hover:text-[#D4A574]"
              }`}
            >
              #{tag}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
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
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-3 sm:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-5">
                <div className="h-4 w-20 rounded bg-[rgba(212,165,116,0.15)]" />
                <div className="mt-4 h-6 w-full rounded bg-[rgba(212,165,116,0.15)]" />
                <div className="mt-4 h-4 w-1/2 rounded bg-[rgba(212,165,116,0.15)]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 p-6 text-center text-red-600">{error}</div>
        ) : skills.length === 0 ? (
          <div className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-12 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-[#9A8B78]" />
            <h3 className="mt-4 text-lg font-semibold text-[#2C2416]">暂无相关 Skills</h3>
            <p className="mt-2 text-sm text-[#5D4E3A]">试试其他标签吧</p>
          </div>
        ) : (
          <>
            <CardGrid>
              {skills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </CardGrid>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} className="mt-8" />
          </>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 lg:px-8">
        <GuestGate action="收藏和购买" mode="prompt" />
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
        <p className="mb-3 text-sm text-[#5D4E3A] line-clamp-2">{skill.description}</p>
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
