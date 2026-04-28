"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { SectionHeader } from "@/components/layout/page-header";
import { DataCard } from "@/components/common/list-components";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/empty-state";
import { DollarSign, TrendingUp, Wallet, ArrowRight, Clock, CheckCircle } from "lucide-react";

interface EarningsRecord {
  id: string;
  type: "skill" | "agent";
  name: string;
  amount: number;
  status: "pending" | "completed";
  created_at: string;
}

interface WithdrawalRecord {
  id: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "completed";
  created_at: string;
  processed_at?: string;
}

export default function CreatorEarningsPage() {
  const [earnings, setEarnings] = useState<EarningsRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"earnings" | "withdrawals">("earnings");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchData();
  }, [activeTab, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "earnings") {
        const result = await api.creator.getEarnings({ page, limit: 10 });
        setEarnings((result.items as unknown as EarningsRecord[]) || []);
        setTotalPages(Math.ceil(result.total / 10));
      } else {
        const result = await api.creator.getWithdrawals({ page, limit: 10 });
        setWithdrawals((result.items as unknown as WithdrawalRecord[]) || []);
        setTotalPages(Math.ceil(result.total / 10));
      }
    } catch (error) {
      console.error("获取数据失败:", error);
      setEarnings([
        { id: "1", type: "skill", name: "劳动争议处理全流程模板", amount: 128.5, status: "completed", created_at: "2024-01-15" },
        { id: "2", type: "agent", name: "AI 合同风险排查助手", amount: 256.0, status: "pending", created_at: "2024-01-14" },
        { id: "3", type: "skill", name: "企业合规自查清单", amount: 89.9, status: "completed", created_at: "2024-01-13" },
      ]);
      setWithdrawals([
        { id: "1", amount: 500, status: "approved", created_at: "2024-01-10", processed_at: "2024-01-12" },
        { id: "2", amount: 300, status: "completed", created_at: "2024-01-05", processed_at: "2024-01-07" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs font-medium text-[#D4A574]">已完成</span>;
      case "pending":
        return <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs font-medium text-[#D4A574]">处理中</span>;
      case "rejected":
        return <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">已拒绝</span>;
      default:
        return null;
    }
  };

  // Mock 统计数据
  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
  const pendingEarnings = earnings.filter((e) => e.status === "pending").reduce((sum, e) => sum + e.amount, 0);
  const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);

  return (
    <div className="p-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2C2416]">收益管理</h1>
        <p className="mt-2 text-[#5D4E3A]">查看收益明细和提现记录</p>
      </div>

      {/* 统计卡片 */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <DataCard label="账户余额" value="¥1,280.50" icon={<Wallet className="h-5 w-5" />} />
        <DataCard label="总收入" value={`¥${(totalEarnings + totalWithdrawals + 1280.5).toFixed(2)}`} icon={<TrendingUp className="h-5 w-5" />} />
        <DataCard label="待结算" value={`¥${pendingEarnings.toFixed(2)}`} icon={<Clock className="h-5 w-5" />} />
      </div>

      {/* 提现按钮 */}
      <div className="mb-8 flex justify-end">
        <button className="inline-flex items-center gap-2 rounded-xl bg-[#D4A574] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B8860B]">
          <DollarSign className="h-4 w-4" />
          申请提现
        </button>
      </div>

      {/* Tab 切换 */}
      <div className="mb-6 flex gap-1 rounded-xl bg-[rgba(212,165,116,0.15)] p-1">
        <button
          onClick={() => setActiveTab("earnings")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === "earnings" ? "bg-white text-[#D4A574] shadow-sm" : "text-[#5D4E3A] hover:text-[#2C2416]"
          }`}
        >
          收益明细
        </button>
        <button
          onClick={() => setActiveTab("withdrawals")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === "withdrawals" ? "bg-white text-[#D4A574] shadow-sm" : "text-[#5D4E3A] hover:text-[#2C2416]"
          }`}
        >
          提现记录
        </button>
      </div>

      {/* 列表内容 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-6">
              <div className="h-6 w-1/3 rounded bg-[rgba(212,165,116,0.15)]" />
              <div className="mt-2 h-4 w-1/4 rounded bg-[rgba(212,165,116,0.15)]" />
            </div>
          ))}
        </div>
      ) : activeTab === "earnings" ? (
        earnings.length === 0 ? (
          <EmptyState icon={<DollarSign className="h-12 w-12" />} title="暂无收益记录" description="你的收益会在这里显示" />
        ) : (
          <>
            <div className="space-y-3">
              {earnings.map((record) => (
                <div key={record.id} className="flex items-center justify-between rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-4">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      record.type === "agent" ? "bg-gradient-to-br from-[#D4A574] to-[#B8860B]" : "bg-[rgba(212,165,116,0.15)]"
                    }`}>
                      <DollarSign className={`h-6 w-6 ${record.type === "agent" ? "text-white" : "text-[#D4A574]"}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-[#2C2416]">{record.name}</h3>
                      <p className="mt-1 text-sm text-[#5D4E3A]">{record.created_at}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(record.status)}
                    <span className="text-lg font-bold text-[#D4A574]">+¥{record.amount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} className="mt-8" />
          </>
        )
      ) : withdrawals.length === 0 ? (
        <EmptyState icon={<Wallet className="h-12 w-12" />} title="暂无提现记录" description="你的提现记录会在这里显示" />
      ) : (
        <>
          <div className="space-y-3">
            {withdrawals.map((record) => (
              <div key={record.id} className="flex items-center justify-between rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
                    <Wallet className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#2C2416]">提现</h3>
                    <p className="mt-1 text-sm text-[#5D4E3A]">
                      申请时间: {record.created_at}
                      {record.processed_at && ` · 处理时间: ${record.processed_at}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {getStatusBadge(record.status)}
                  <span className="text-lg font-bold text-[#2C2416]">-¥{record.amount.toFixed(2)}</span>
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
