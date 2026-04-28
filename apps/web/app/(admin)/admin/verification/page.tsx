"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/empty-state";
import { Shield, CheckCircle, XCircle, Clock, User, FileText } from "lucide-react";

interface VerificationRequest {
  id: string;
  user_id: string;
  user_name: string;
  type: "lawyer" | "creator";
  level: string;
  documents: string[];
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  processed_at?: string;
  note?: string;
}

export default function VerificationPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<"lawyer" | "creator">("lawyer");

  useEffect(() => {
    fetchRequests();
  }, [activeTab, page]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const result = await api.admin.getVerifications({
        type: activeTab,
        page,
        limit: 20,
      });
      setRequests((result.items as unknown as VerificationRequest[]) || []);
      setTotalPages(Math.ceil(result.total / 20));
    } catch (error) {
      console.error("获取认证申请失败:", error);
      setRequests([
        { id: "1", user_id: "1", user_name: "陈律师", type: "lawyer", level: "专业认证", documents: ["执业证书.jpg", "律所证明.pdf"], status: "pending", submitted_at: "2024-01-15" },
        { id: "2", user_id: "2", user_name: "王律师", type: "lawyer", level: "基础认证", documents: ["身份证.jpg"], status: "pending", submitted_at: "2024-01-14" },
        { id: "3", user_id: "3", user_name: "张律师", type: "lawyer", level: "专业认证", documents: ["执业证书.jpg"], status: "approved", submitted_at: "2024-01-13", processed_at: "2024-01-13" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "approved" as const, processed_at: new Date().toISOString() } : r))
    );
  };

  const handleReject = (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "rejected" as const, processed_at: new Date().toISOString() } : r))
    );
  };

  const getStatusBadge = (status: VerificationRequest["status"]) => {
    switch (status) {
      case "pending":
        return <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">待审核</span>;
      case "approved":
        return <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs font-medium text-[#D4A574]">已通过</span>;
      case "rejected":
        return <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">已拒绝</span>;
    }
  };

  return (
    <div className="p-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2C2416]">认证审核</h1>
        <p className="mt-2 text-[#5D4E3A]">审核用户提交的认证申请</p>
      </div>

      {/* Tab 切换 */}
      <div className="mb-6 flex gap-1 rounded-xl bg-[rgba(212,165,116,0.15)] p-1">
        {[
          { id: "lawyer" as const, label: "律师认证" },
          { id: "creator" as const, label: "创作者认证" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id ? "bg-white text-[#D4A574] shadow-sm" : "text-[#5D4E3A] hover:text-[#2C2416]"
            }`}
          >
            {tab.label}
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
      ) : requests.filter((r) => r.status === "pending").length === 0 ? (
        <EmptyState
          icon={<Shield className="h-12 w-12" />}
          title="暂无待审核申请"
          description="当前没有待审核的认证申请"
        />
      ) : (
        <>
          <div className="space-y-4">
            {requests
              .filter((r) => r.status === "pending")
              .map((request) => (
                <div key={request.id} className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4A574] to-[#B8860B] text-lg font-bold text-white">
                        {request.user_name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-[#2C2416]">{request.user_name}</h3>
                          <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs font-medium text-[#5D4E3A]">
                            {request.type === "lawyer" ? "律师认证" : "创作者认证"}
                          </span>
                          <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs font-medium text-[#D4A574]">
                            {request.level}
                          </span>
                          {getStatusBadge(request.status)}
                        </div>

                        <div className="mt-3">
                          <p className="text-sm font-medium text-[#5D4E3A]">提交材料：</p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {request.documents.map((doc, i) => (
                              <span key={i} className="flex items-center gap-1 rounded-full bg-[rgba(212,165,116,0.15)] px-3 py-1 text-xs text-[#5D4E3A]">
                                <FileText className="h-3 w-3" />
                                {doc}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-1 text-xs text-[#9A8B78]">
                          <Clock className="h-3 w-3" />
                          提交时间：{request.submitted_at}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="flex items-center gap-1 rounded-xl bg-[#D4A574] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#B8860B]"
                      >
                        <CheckCircle className="h-4 w-4" />
                        通过
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="flex items-center gap-1 rounded-xl border border-[rgba(212,165,116,0.25)] px-4 py-2 text-sm font-medium text-[#5D4E3A] transition-colors hover:border-red-300 hover:text-red-600"
                      >
                        <XCircle className="h-4 w-4" />
                        拒绝
                      </button>
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
