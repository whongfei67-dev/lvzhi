"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { SectionHeader } from "@/components/layout/page-header";
import { CardGrid } from "@/components/common/list-components";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/empty-state";
import { Bot, Star, Plus, Edit, Trash2, Eye, Clock, MessageSquare } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "draft" | "pending" | "pending_review" | "active" | "published" | "inactive" | "hidden" | "rejected";
  rating?: number;
  usage_count: number;
  trial_count: number;
  created_at: string;
  updated_at: string;
}

export default function CreatorAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAgents();
  }, [page]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const result = await api.creator.getAgents({ page, limit: 12 });
      setAgents((result.items as unknown as Agent[]) || []);
      setTotalPages(Math.ceil(result.total / 12));
    } catch (error) {
      console.error("获取智能体失败:", error);
      setAgents([
        { id: "1", name: "AI 合同风险排查助手", description: "智能识别合同风险点", category: "合同法", status: "active", rating: 4.8, usage_count: 5678, trial_count: 123, created_at: "2024-01-15", updated_at: "2024-01-15" },
        { id: "2", name: "劳动争议咨询助手", description: "快速解答劳动法问题", category: "劳动法", status: "active", rating: 4.7, usage_count: 3456, trial_count: 89, created_at: "2024-01-10", updated_at: "2024-01-10" },
        { id: "3", name: "知识产权检索助手", description: "快速检索知识产权信息", category: "知识产权", status: "pending", usage_count: 0, trial_count: 0, created_at: "2024-01-20", updated_at: "2024-01-20" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Agent["status"]) => {
    switch (status) {
      case "draft":
        return <span className="rounded-full bg-[rgba(212,165,116,0.08)] px-2.5 py-0.5 text-xs font-medium text-[#5D4E3A]">草稿</span>;
      case "pending":
      case "pending_review":
        return <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs font-medium text-[#D4A574]">审核中</span>;
      case "active":
      case "published":
        return <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs font-medium text-[#D4A574]">审核通过已上架</span>;
      case "inactive":
      case "hidden":
        return <span className="rounded-full bg-[rgba(212,165,116,0.08)] px-2.5 py-0.5 text-xs font-medium text-[#5D4E3A]">已下线</span>;
      case "rejected":
        return <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">未通过</span>;
    }
  };

  return (
    <div className="p-8">
      {/* 页面标题 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2C2416]">智能体管理</h1>
          <p className="mt-2 text-[#5D4E3A]">管理你的智能体内容，提交审核后上架到灵感广场</p>
        </div>
        <Link
          href="/creator/agents/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#D4A574] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B8860B]"
        >
          <Plus className="h-4 w-4" />
          创建智能体
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-4 text-center">
          <p className="text-2xl font-bold text-[#D4A574]">{agents.length}</p>
          <p className="text-sm text-[#5D4E3A]">总数量</p>
        </div>
        <div className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-4 text-center">
          <p className="text-2xl font-bold text-[#D4A574]">{agents.filter(a => ["active", "published"].includes(a.status)).length}</p>
          <p className="text-sm text-[#5D4E3A]">审核通过已上架</p>
        </div>
        <div className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-4 text-center">
          <p className="text-2xl font-bold text-[#D4A574]">{agents.reduce((sum, a) => sum + (a.usage_count || 0), 0).toLocaleString()}</p>
          <p className="text-sm text-[#5D4E3A]">总对话量</p>
        </div>
        <div className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-4 text-center">
          <p className="text-2xl font-bold text-[#D4A574]">{agents.reduce((sum, a) => sum + (a.trial_count || 0), 0)}</p>
          <p className="text-sm text-[#5D4E3A]">总试用量</p>
        </div>
      </div>

      {/* 智能体列表 */}
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-5">
              <div className="h-14 w-14 rounded-xl bg-[rgba(212,165,116,0.15)]" />
              <div className="mt-4 h-6 w-3/4 rounded bg-[rgba(212,165,116,0.15)]" />
            </div>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <EmptyState
          icon={<Bot className="h-12 w-12" />}
          title="暂无智能体"
          description="创建你的第一个智能体，开始 AI 创作之旅"
          action={
            <Link
              href="/creator/agents/new"
              className="inline-flex items-center gap-2 rounded-xl bg-[#D4A574] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B8860B]"
            >
              <Plus className="h-4 w-4" />
              创建智能体
            </Link>
          }
        />
      ) : (
        <>
          <CardGrid>
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="group flex flex-col rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-5 transition-all hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4A574] to-[#B8860B]">
                    <Bot className="h-7 w-7 text-white" />
                  </div>
                  {getStatusBadge(agent.status)}
                </div>

                <h3 className="font-medium text-[#2C2416] line-clamp-1">{agent.name}</h3>
                <p className="mt-1 flex-1 text-sm text-[#5D4E3A] line-clamp-2">{agent.description}</p>

                <div className="mt-3">
                  <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2 py-0.5 text-xs text-[#5D4E3A]">{agent.category}</span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[rgba(212,165,116,0.25)] pt-3">
                  <div className="flex items-center gap-3 text-xs text-[#9A8B78]">
                    {agent.rating && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current text-amber-500" />
                        {agent.rating}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {agent.usage_count.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {agent.trial_count}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Link
                      href={`/creator/agents/${agent.id}/edit`}
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
