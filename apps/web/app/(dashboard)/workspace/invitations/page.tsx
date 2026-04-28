"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { SectionHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Pagination } from "@/components/common/pagination";
import { Users, Clock, CheckCircle, XCircle, ArrowRight } from "lucide-react";

interface Invitation {
  id: string;
  type: "sent" | "received";
  title: string;
  from_user: string;
  to_user: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  message?: string;
}

export default function InvitationsPage() {
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchInvitations();
  }, [activeTab, page]);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const result = await api.workspace.getInvitations({
        page,
        limit: 10,
      });
      setInvitations((result.items as unknown as Invitation[]) || []);
      setTotalPages(Math.ceil(result.total / 10));
    } catch (error) {
      console.error("获取邀请失败:", error);
      // Mock 数据
      setInvitations([
        { id: "1", type: "received", title: "合作邀请", from_user: "陈律师", to_user: "你", status: "pending", created_at: "2024-01-15", message: "希望与您合作开发劳动法相关智能体" },
        { id: "2", type: "received", title: "试用邀请", from_user: "张律师", to_user: "你", status: "pending", created_at: "2024-01-14", message: "邀请您试用我的新智能体" },
        { id: "3", type: "sent", title: "发出的合作邀请", to_user: "王律师", from_user: "你", status: "pending", created_at: "2024-01-13", message: "希望与您合作" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Invitation["status"]) => {
    switch (status) {
      case "pending":
        return <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">待处理</span>;
      case "accepted":
        return <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs font-medium text-[#D4A574]">已接受</span>;
      case "rejected":
        return <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">已拒绝</span>;
    }
  };

  return (
    <div className="p-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2C2416]">合作邀请</h1>
        <p className="mt-2 text-[#5D4E3A]">
          管理你收到和发出的合作邀请
        </p>
      </div>

      {/* Tab 切换 */}
      <div className="mb-6 flex gap-1 rounded-xl bg-[rgba(212,165,116,0.15)] p-1">
        <button
          onClick={() => setActiveTab("received")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === "received"
              ? "bg-white text-[#D4A574] shadow-sm"
              : "text-[#5D4E3A] hover:text-[#2C2416]"
          }`}
        >
          <Users className="h-4 w-4" />
          收到的邀请
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === "sent"
              ? "bg-white text-[#D4A574] shadow-sm"
              : "text-[#5D4E3A] hover:text-[#2C2416]"
          }`}
        >
          <ArrowRight className="h-4 w-4" />
          发出的邀请
        </button>
      </div>

      {/* 邀请列表 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-6">
              <div className="h-6 w-1/3 rounded bg-[rgba(212,165,116,0.15)]" />
              <div className="mt-2 h-4 w-2/3 rounded bg-[rgba(212,165,116,0.15)]" />
            </div>
          ))}
        </div>
      ) : invitations.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title={`暂无${activeTab === "received" ? "收到的" : "发出的"}邀请`}
          description={activeTab === "received" ? "当有人邀请你合作时，会显示在这里" : "你发出的邀请会显示在这里"}
        />
      ) : (
        <>
          <div className="space-y-4">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4A574] to-[#B8860B] text-lg font-bold text-white">
                      {activeTab === "received" ? inv.from_user[0] : inv.to_user[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#2C2416]">{inv.title}</h3>
                      <p className="mt-1 text-sm text-[#5D4E3A]">
                        {activeTab === "received" ? `来自 ${inv.from_user}` : `发送给 ${inv.to_user}`}
                      </p>
                      {inv.message && (
                        <p className="mt-2 text-sm text-[#5D4E3A]">{inv.message}</p>
                      )}
                      <div className="mt-3 flex items-center gap-4">
                        <span className="flex items-center gap-1 text-xs text-[#9A8B78]">
                          <Clock className="h-3 w-3" />
                          {inv.created_at}
                        </span>
                        {getStatusBadge(inv.status)}
                      </div>
                    </div>
                  </div>

                  {activeTab === "received" && inv.status === "pending" && (
                    <div className="flex gap-2">
                      <button className="rounded-xl bg-[#D4A574] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#B8860B]">
                        接受
                      </button>
                      <button className="rounded-xl border border-[rgba(212,165,116,0.25)] px-4 py-2 text-sm font-medium text-[#5D4E3A] transition-colors hover:border-red-300 hover:text-red-600">
                        拒绝
                      </button>
                    </div>
                  )}
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
