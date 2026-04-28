"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/empty-state";
import { Briefcase, MapPin, Eye, Users, Clock } from "lucide-react";

interface Opportunity {
  id: string;
  title: string;
  type: string;
  location: string;
  publisher_name: string;
  status: "active" | "pending" | "closed";
  view_count: number;
  application_count: number;
  created_at: string;
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<"active" | "pending" | "closed">("active");

  useEffect(() => {
    fetchOpportunities();
  }, [activeTab, page]);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const result = await api.admin.getOpportunities({
        status: activeTab,
        page,
        limit: 20,
      });
      setOpportunities((result.items as unknown as Opportunity[]) || []);
      setTotalPages(Math.ceil(result.total / 20));
    } catch (error) {
      console.error("获取机会列表失败:", error);
      setOpportunities([
        { id: "1", title: "招聘高级法律顾问", type: "job", location: "北京", publisher_name: "某知名互联网公司", status: "active", view_count: 1234, application_count: 56, created_at: "2024-01-15" },
        { id: "2", title: "合同审查项目外包", type: "project", location: "上海", publisher_name: "某某企业", status: "active", view_count: 567, application_count: 23, created_at: "2024-01-14" },
        { id: "3", title: "法律顾问长期合作", type: "collaboration", location: "深圳", publisher_name: "某创业公司", status: "pending", view_count: 0, application_count: 0, created_at: "2024-01-13" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const reviewOpportunity = async (id: string, action: "approve" | "reject") => {
    try {
      if (action === "approve") {
        await api.admin.approveOpportunity(id);
      } else {
        await api.admin.rejectOpportunity(id);
      }
      fetchOpportunities();
    } catch (error) {
      console.error("审核岗位失败:", error);
    }
  };

  const getStatusBadge = (status: Opportunity["status"]) => {
    switch (status) {
      case "active":
        return <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs font-medium text-[#D4A574]">进行中</span>;
      case "pending":
        return <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">待审核</span>;
      case "closed":
        return <span className="rounded-full bg-[rgba(212,165,116,0.08)] text-[#5D4E3A]">已结束</span>;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      job: "招聘",
      project: "项目",
      collaboration: "合作",
      service_offer: "服务",
    };
    return labels[type] || type;
  };

  return (
    <div className="p-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2C2416]">机会管理</h1>
        <p className="mt-2 text-[#5D4E3A]">岗位发布无需预审，后台可按规则下架/恢复并通知发布者</p>
      </div>

      {/* Tab 切换 */}
      <div className="mb-6 flex gap-1 rounded-xl bg-[rgba(212,165,116,0.15)] p-1">
        {[
          { id: "active" as const, label: "进行中" },
          { id: "pending" as const, label: "处理中（历史）" },
          { id: "closed" as const, label: "已结束" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id ? "bg-white text-[#D4A574] shadow-sm" : "text-[#5D4E3A] hover:text-[#2C2416]"
            }`}
          >
            {tab.label}
            <span className={`rounded-full px-2 py-0.5 text-xs ${
              activeTab === tab.id ? "bg-[rgba(212,165,116,0.15)] text-[#D4A574]" : "bg-white text-[#5D4E3A]"
            }`}>
              {opportunities.filter((o) => o.status === tab.id).length || 0}
            </span>
          </button>
        ))}
      </div>

      {/* 列表内容 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-6">
              <div className="h-6 w-1/2 rounded bg-[rgba(212,165,116,0.15)]" />
              <div className="mt-2 h-4 w-1/3 rounded bg-[rgba(212,165,116,0.15)]" />
            </div>
          ))}
        </div>
      ) : opportunities.filter((o) => o.status === activeTab).length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-12 w-12" />}
          title={`暂无${activeTab === "active" ? "进行中" : activeTab === "pending" ? "待审核" : "已结束"}的机会`}
          description="当前没有此类机会"
        />
      ) : (
        <>
          <div className="space-y-4">
            {opportunities
              .filter((o) => o.status === activeTab)
              .map((opp) => (
                <div key={opp.id} className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[rgba(212,165,116,0.15)]">
                        <Briefcase className="h-6 w-6 text-[#D4A574]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-[#2C2416]">{opp.title}</h3>
                          <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs font-medium text-[#5D4E3A]">
                            {getTypeLabel(opp.type)}
                          </span>
                          {getStatusBadge(opp.status)}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-[#5D4E3A]">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {opp.publisher_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {opp.location}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-xs text-[#9A8B78]">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {opp.view_count} 浏览
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {opp.application_count} 投递
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {opp.created_at}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="rounded-xl border border-[rgba(212,165,116,0.25)] px-4 py-2 text-sm font-medium text-[#5D4E3A] transition-colors hover:border-[#D4A574] hover:text-[#D4A574]">
                        查看详情
                      </button>
                      {opp.status === "active" ? (
                        <button
                          className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                          onClick={() => void reviewOpportunity(opp.id, "reject")}
                        >
                          下架
                        </button>
                      ) : opp.status === "closed" ? (
                        <button
                          className="rounded-xl bg-[#D4A574] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#B8860B]"
                          onClick={() => void reviewOpportunity(opp.id, "approve")}
                        >
                          恢复上架
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="mt-8"
          />
        </>
      )}
    </div>
  );
}
