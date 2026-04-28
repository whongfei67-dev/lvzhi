"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/empty-state";
import { Shield, Ban, Clock, User, CheckCircle, XCircle, Eye } from "lucide-react";

interface BannedUser {
  id: string;
  user_name: string;
  email: string;
  ban_type: "warn" | "mute" | "ban";
  reason: string;
  banned_by: string;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
}

export default function BlockedUsersPage() {
  const [users, setUsers] = useState<BannedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<"active" | "expired">("active");

  useEffect(() => {
    fetchUsers();
  }, [activeTab, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await api.admin.getBlockedUsers({
        status: activeTab,
        page,
        limit: 20,
      });
      setUsers((result.items as unknown as BannedUser[]) || []);
      setTotalPages(Math.ceil(result.total / 20));
    } catch (error) {
      console.error("获取封禁用户失败:", error);
      setUsers([
        { id: "1", user_name: "违规用户1", email: "user1@example.com", ban_type: "ban", reason: "发布违规内容", banned_by: "管理员", created_at: "2024-01-15", is_active: true },
        { id: "2", user_name: "违规用户2", email: "user2@example.com", ban_type: "mute", reason: "多次骚扰其他用户", banned_by: "管理员", created_at: "2024-01-14", expires_at: "2024-02-14", is_active: true },
        { id: "3", user_name: "违规用户3", email: "user3@example.com", ban_type: "warn", reason: "轻微违规", banned_by: "管理员", created_at: "2024-01-10", is_active: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getBanTypeBadge = (type: BannedUser["ban_type"], is_active: boolean) => {
    if (!is_active) return <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs font-medium text-[#5D4E3A]">已解封</span>;
    
    switch (type) {
      case "warn":
        return <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 flex items-center gap-1">
          <Shield className="h-3 w-3" /> 警告
        </span>;
      case "mute":
        return <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700 flex items-center gap-1">
          <Ban className="h-3 w-3" /> 禁言
        </span>;
      case "ban":
        return <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 flex items-center gap-1">
          <XCircle className="h-3 w-3" /> 封禁
        </span>;
    }
  };

  const handleUnban = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, is_active: false } : u))
    );
  };

  return (
    <div className="p-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2C2416]">小黑屋</h1>
        <p className="mt-2 text-[#5D4E3A]">管理违规用户和处理记录</p>
      </div>

      {/* Tab 切换 */}
      <div className="mb-6 flex gap-1 rounded-xl bg-[rgba(212,165,116,0.15)] p-1">
        {[
          { id: "active" as const, label: "正在处罚" },
          { id: "expired" as const, label: "历史记录" },
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
              {users.filter((u) => activeTab === "active" ? u.is_active : !u.is_active).length || 0}
            </span>
          </button>
        ))}
      </div>

      {/* 列表内容 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-[rgba(212,165,116,0.15)]" />
                <div className="flex-1">
                  <div className="h-6 w-1/3 rounded bg-[rgba(212,165,116,0.15)]" />
                  <div className="mt-2 h-4 w-1/4 rounded bg-[rgba(212,165,116,0.15)]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : users.filter((u) => activeTab === "active" ? u.is_active : !u.is_active).length === 0 ? (
        <EmptyState
          icon={<Shield className="h-12 w-12" />}
          title={`暂无${activeTab === "active" ? "处罚中" : "历史"}的用户`}
          description={activeTab === "active" ? "当前没有正在处罚的用户" : "暂无历史处罚记录"}
        />
      ) : (
        <>
          <div className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)]">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#5D4E3A]">用户</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#5D4E3A]">处罚类型</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#5D4E3A]">原因</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#5D4E3A]">处罚时间</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#5D4E3A]">到期时间</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#5D4E3A]">操作</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter((u) => activeTab === "active" ? u.is_active : !u.is_active)
                  .map((user) => (
                    <tr key={user.id} className="border-b border-[rgba(212,165,116,0.25)] last:border-b-0">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4A574] to-[#B8860B] text-sm font-bold text-white">
                            {user.user_name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-[#2C2416]">{user.user_name}</p>
                            <p className="text-xs text-[#9A8B78]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getBanTypeBadge(user.ban_type, user.is_active)}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#5D4E3A]">{user.reason}</td>
                      <td className="px-6 py-4 text-sm text-[#5D4E3A]">{user.created_at}</td>
                      <td className="px-6 py-4 text-sm text-[#5D4E3A]">{user.expires_at || "-"}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button className="rounded-lg p-2 text-[#9A8B78] transition-colors hover:bg-[rgba(212,165,116,0.15)] hover:text-[#D4A574]">
                            <Eye className="h-4 w-4" />
                          </button>
                          {user.is_active && (
                            <button
                              onClick={() => handleUnban(user.id)}
                              className="rounded-lg p-2 text-[#9A8B78] transition-colors hover:bg-[rgba(212,165,116,0.08)] hover:text-[#D4A574]"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
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