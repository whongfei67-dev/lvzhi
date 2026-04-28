"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { EmptyState } from "@/components/common/empty-state";
import { Pagination } from "@/components/common/pagination";
import { Users, Clock, CheckCircle, XCircle, MessageSquare } from "lucide-react";

interface Invitation {
  id: string;
  from_user: string;
  from_avatar?: string;
  to_user?: string;
  message?: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

export default function CreatorInvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchInvitations();
  }, [page]);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const result = await api.creator.getInvitations({ page, limit: 10 });
      setInvitations((result.items as unknown as Invitation[]) || []);
      setTotalPages(Math.ceil(result.total / 10));
    } catch (error) {
      console.error("获取邀请失败:", error);
      setInvitations([
        { id: "1", from_user: "王律师", message: "希望与您合作开发劳动法相关智能体", status: "pending", created_at: "2024-01-15" },
        { id: "2", from_user: "李律师", message: "邀请您试用我的新智能体", status: "pending", created_at: "2024-01-14" },
        { id: "3", from_user: "赵律师", message: "合作推广您的 Skills", status: "accepted", created_at: "2024-01-13" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Invitation["status"]) => {
    switch (status) {
      case "pending":
        return <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs font-medium text-[#D4A574]">待处理</span>;
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
        <h1 className="text-2xl font-bold text-[#2C2416]">收到的邀请</h1>
        <p className="mt-2 text-[#5D4E3A]">管理其他创作者发来的合作邀请</p>
      </div>

      {/* 邀请列表 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-[rgba(212,165,116,0.15)]" />
                <div className="flex-1">
                  <div className="h-6 w-1/3 rounded bg-[rgba(212,165,116,0.15)]" />
                  <div className="mt-2 h-4 w-2/3 rounded bg-[rgba(212,165,116,0.15)]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : invitations.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="暂无邀请"
          description="当有人邀请你合作时，会显示在这里"
        />
      ) : (
        <>
          <div className="space-y-4">
            {invitations.map((inv) => (
              <div key={inv.id} className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4A574] to-[#B8860B] text-lg font-bold text-white">
                      {inv.from_user[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#2C2416]">{inv.from_user}</h3>
                      {inv.message && (
                        <p className="mt-2 flex items-start gap-2 text-sm text-[#5D4E3A]">
                          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
                          {inv.message}
                        </p>
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

                  {inv.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setInvitations((prev) =>
                            prev.map((i) => (i.id === inv.id ? { ...i, status: "accepted" } : i))
                          );
                        }}
                        className="flex items-center gap-1 rounded-xl bg-[#D4A574] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#B8860B]"
                      >
                        <CheckCircle className="h-4 w-4" />
                        接受
                      </button>
                      <button
                        onClick={() => {
                          setInvitations((prev) =>
                            prev.map((i) => (i.id === inv.id ? { ...i, status: "rejected" } : i))
                          );
                        }}
                        className="flex items-center gap-1 rounded-xl border border-[rgba(212,165,116,0.25)] px-4 py-2 text-sm font-medium text-[#5D4E3A] transition-colors hover:border-red-300 hover:text-red-600"
                      >
                        <XCircle className="h-4 w-4" />
                        拒绝
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} className="mt-8" />
        </>
      )}
    </div>
  );
}
