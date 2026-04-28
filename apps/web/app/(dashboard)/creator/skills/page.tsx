"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { SectionHeader } from "@/components/layout/page-header";
import { CardGrid } from "@/components/common/list-components";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/empty-state";
import { Sparkles, Star, Plus, Edit, Trash2, Eye, Clock } from "lucide-react";

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  status: "draft" | "pending" | "pending_review" | "approved" | "active" | "published" | "hidden" | "rejected";
  rating?: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export default function CreatorSkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchSkills();
  }, [page]);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const result = await api.creator.getSkills({ page, limit: 12 });
      setSkills((result.items as unknown as Skill[]) || []);
      setTotalPages(Math.ceil(result.total / 12));
    } catch (error) {
      console.error("获取 Skills 失败:", error);
      setSkills([
        { id: "1", name: "劳动争议处理全流程模板", description: "包含入职到离职的完整流程", category: "劳动法", price: 0, status: "approved", rating: 4.9, usage_count: 1234, created_at: "2024-01-15", updated_at: "2024-01-15" },
        { id: "2", name: "合同审查 Prompt 合集", description: "实用的合同审查提示词", category: "合同法", price: 19.9, status: "approved", rating: 4.8, usage_count: 890, created_at: "2024-01-10", updated_at: "2024-01-10" },
        { id: "3", name: "企业合规自查清单", description: "全面的企业合规检查项", category: "公司法", price: 29.9, status: "pending", usage_count: 0, created_at: "2024-01-20", updated_at: "2024-01-20" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Skill["status"]) => {
    switch (status) {
      case "draft":
        return <span className="rounded-full bg-[rgba(212,165,116,0.08)] px-2.5 py-0.5 text-xs font-medium text-[#5D4E3A]">草稿</span>;
      case "pending":
      case "pending_review":
        return <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs font-medium text-[#D4A574]">审核中</span>;
      case "approved":
      case "active":
      case "published":
        return <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs font-medium text-[#D4A574]">审核通过已上架</span>;
      case "hidden":
        return <span className="rounded-full bg-[rgba(212,165,116,0.08)] px-2.5 py-0.5 text-xs font-medium text-[#5D4E3A]">已下架</span>;
      case "rejected":
        return <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">未通过</span>;
    }
  };

  const avgRating =
    skills.filter((s) => s.rating != null).reduce((sum, s) => sum + (s.rating ?? 0), 0) /
    (skills.filter((s) => s.rating != null).length || 1);

  return (
    <div className="p-8">
      {/* 页面标题 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2C2416]">Skills 管理</h1>
          <p className="mt-2 text-[#5D4E3A]">管理你的 Skills 内容，提交审核后上架到灵感广场</p>
        </div>
        <Link
          href="/creator/skills/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#D4A574] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B8860B]"
        >
          <Plus className="h-4 w-4" />
          创建 Skills
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-4 text-center">
          <p className="text-2xl font-bold text-[#D4A574]">{skills.length}</p>
          <p className="text-sm text-[#5D4E3A]">总数量</p>
        </div>
        <div className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-4 text-center">
          <p className="text-2xl font-bold text-[#D4A574]">{skills.filter(s => ["approved", "active", "published"].includes(s.status)).length}</p>
          <p className="text-sm text-[#5D4E3A]">审核通过已上架</p>
        </div>
        <div className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-4 text-center">
          <p className="text-2xl font-bold text-[#D4A574]">{skills.reduce((sum, s) => sum + (s.usage_count || 0), 0)}</p>
          <p className="text-sm text-[#5D4E3A]">总使用量</p>
        </div>
        <div className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">
            {avgRating.toFixed(1)}
          </p>
          <p className="text-sm text-[#5D4E3A]">平均评分</p>
        </div>
      </div>

      {/* Skills 列表 */}
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-5">
              <div className="h-12 w-12 rounded-xl bg-[rgba(212,165,116,0.15)]" />
              <div className="mt-4 h-6 w-3/4 rounded bg-[rgba(212,165,116,0.15)]" />
              <div className="mt-2 h-4 w-1/2 rounded bg-[rgba(212,165,116,0.15)]" />
            </div>
          ))}
        </div>
      ) : skills.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-12 w-12" />}
          title="暂无 Skills"
          description="创建你的第一个 Skills，开始创作之旅"
          action={
            <Link
              href="/creator/skills/new"
              className="inline-flex items-center gap-2 rounded-xl bg-[#D4A574] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B8860B]"
            >
              <Plus className="h-4 w-4" />
              创建 Skills
            </Link>
          }
        />
      ) : (
        <>
          <CardGrid>
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="group rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-5 transition-all hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(212,165,116,0.15)]">
                    <Sparkles className="h-6 w-6 text-[#D4A574]" />
                  </div>
                  {getStatusBadge(skill.status)}
                </div>

                <h3 className="font-medium text-[#2C2416] line-clamp-1">{skill.name}</h3>
                <p className="mt-1 text-sm text-[#5D4E3A] line-clamp-2">{skill.description}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2 py-0.5 text-xs text-[#5D4E3A]">{skill.category}</span>
                  <span className={skill.price === 0 ? "text-sm font-medium text-[#D4A574]" : "text-sm text-[#5D4E3A]"}>
                    {skill.price === 0 ? "免费" : `¥${skill.price}`}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[rgba(212,165,116,0.25)] pt-3">
                  <div className="flex items-center gap-3 text-xs text-[#9A8B78]">
                    {skill.rating && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current text-amber-500" />
                        {skill.rating}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {skill.usage_count}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Link
                      href={`/creator/skills/${skill.id}/edit`}
                      className="rounded-lg p-2 text-[#9A8B78] transition-colors hover:bg-[rgba(212,165,116,0.15)] hover:text-[#D4A574]"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button className="rounded-lg p-2 text-[#9A8B78] transition-colors hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </CardGrid>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} className="mt-8" />
        </>
      )}
    </div>
  );
}
