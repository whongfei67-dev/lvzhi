"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/empty-state";
import { Shield, Plus, CheckCircle, XCircle, User, Crown } from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "superadmin";
  created_at: string;
  last_login?: string;
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAdmins();
  }, [page]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const result = await api.admin.getAdmins({ page, limit: 20 });
      setAdmins((result.items as unknown as AdminUser[]) || []);
      setTotalPages(Math.ceil(result.total / 20));
    } catch (error) {
      console.error("获取管理员列表失败:", error);
      setAdmins([
        { id: "1", name: "超级管理员", email: "admin@lvzhi.com", role: "superadmin", created_at: "2024-01-01", last_login: "2024-01-15 10:30" },
        { id: "2", name: "运营管理员", email: "operator@lvzhi.com", role: "admin", created_at: "2024-01-05", last_login: "2024-01-15 09:00" },
        { id: "3", name: "内容管理员", email: "content@lvzhi.com", role: "admin", created_at: "2024-01-10", last_login: "2024-01-14 16:00" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: AdminUser["role"]) => {
    return (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium flex items-center gap-1 ${
        role === "superadmin" ? "bg-purple-100 text-purple-700" : "bg-[rgba(212,165,116,0.15)] text-[#B8860B]"
      }`}>
        {role === "superadmin" && <Crown className="h-3 w-3" />}
        {role === "superadmin" ? "超级管理员" : "管理员"}
      </span>
    );
  };

  return (
    <div className="p-8">
      {/* 页面标题 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2C2416]">管理员管理</h1>
          <p className="mt-2 text-[#5D4E3A]">管理系统管理员账号</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-[#D4A574] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B8860B]">
          <Plus className="h-4 w-4" />
          添加管理员
        </button>
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
      ) : admins.length === 0 ? (
        <EmptyState
          icon={<Shield className="h-12 w-12" />}
          title="暂无管理员"
          description="请添加管理员账号"
        />
      ) : (
        <>
          <div className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)]">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#5D4E3A]">账号</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#5D4E3A]">角色</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#5D4E3A]">创建时间</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#5D4E3A]">最后登录</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#5D4E3A]">操作</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-b border-[rgba(212,165,116,0.25)] last:border-b-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4A574] to-[#B8860B] text-sm font-bold text-white">
                          {admin.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-[#2C2416]">{admin.name}</p>
                          <p className="text-sm text-[#9A8B78]">{admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(admin.role)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#5D4E3A]">{admin.created_at}</td>
                    <td className="px-6 py-4 text-sm text-[#5D4E3A]">{admin.last_login || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button className="rounded-lg p-2 text-[#9A8B78] transition-colors hover:bg-[rgba(212,165,116,0.15)] hover:text-[#D4A574]">
                          <User className="h-4 w-4" />
                        </button>
                        {admin.role !== "superadmin" && (
                          <button className="rounded-lg p-2 text-[#9A8B78] transition-colors hover:bg-red-50 hover:text-red-600">
                            <XCircle className="h-4 w-4" />
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