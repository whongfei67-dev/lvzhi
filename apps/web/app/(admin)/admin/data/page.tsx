"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { DataCard } from "@/components/common/list-components";
import { Users, Bot, Sparkles, ShoppingCart, DollarSign, TrendingUp, Eye, Heart } from "lucide-react";

interface PlatformStats {
  total_users: number;
  new_users_today: number;
  total_skills: number;
  total_agents: number;
  total_orders: number;
  total_revenue: number;
  active_users: number;
  page_views: number;
}

export default function DataPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const result = await api.admin.getDataStats({ period });
      setStats(result as unknown as PlatformStats);
    } catch (error) {
      console.error("获取统计数据失败:", error);
      // Mock 数据
      setStats({
        total_users: 10567,
        new_users_today: 128,
        total_skills: 2345,
        total_agents: 567,
        total_orders: 8923,
        total_revenue: 1234567.89,
        active_users: 3456,
        page_views: 56789,
      });
    } finally {
      setLoading(false);
    }
  };

  const mockStats = stats || {
    total_users: 0,
    new_users_today: 0,
    total_skills: 0,
    total_agents: 0,
    total_orders: 0,
    total_revenue: 0,
    active_users: 0,
    page_views: 0,
  };

  return (
    <div className="p-8">
      {/* 页面标题 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2C2416]">数据中心</h1>
          <p className="mt-2 text-[#5D4E3A]">平台核心数据统计与分析</p>
        </div>

        {/* 时间筛选 */}
        <div className="flex gap-1 rounded-xl bg-[rgba(212,165,116,0.15)] p-1">
          {[
            { id: "today" as const, label: "今日" },
            { id: "week" as const, label: "本周" },
            { id: "month" as const, label: "本月" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                period === item.id
                  ? "bg-white text-[#D4A574] shadow-sm"
                  : "text-[#5D4E3A] hover:text-[#2C2416]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 核心指标 */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-[#2C2416]">核心指标</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DataCard
            label="总用户数"
            value={mockStats.total_users.toLocaleString()}
            trend="+12%"
            trendUp
            icon={<Users className="h-5 w-5" />}
          />
          <DataCard
            label="新增用户"
            value={mockStats.new_users_today.toString()}
            trend="+8%"
            trendUp
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <DataCard
            label="活跃用户"
            value={mockStats.active_users.toLocaleString()}
            icon={<Users className="h-5 w-5" />}
          />
          <DataCard
            label="页面浏览量"
            value={mockStats.page_views.toLocaleString()}
            trend="+15%"
            trendUp
            icon={<Eye className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* 内容指标 */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-[#2C2416]">内容指标</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DataCard
            label="Skills 总量"
            value={mockStats.total_skills.toLocaleString()}
            icon={<Sparkles className="h-5 w-5" />}
          />
          <DataCard
            label="智能体总量"
            value={mockStats.total_agents.toLocaleString()}
            icon={<Bot className="h-5 w-5" />}
          />
          <DataCard
            label="总订单数"
            value={mockStats.total_orders.toLocaleString()}
            icon={<ShoppingCart className="h-5 w-5" />}
          />
          <DataCard
            label="平台总收入"
            value={`¥${mockStats.total_revenue.toLocaleString()}`}
            trend="+20%"
            trendUp
            icon={<DollarSign className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* 趋势图表（简化版） */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* 用户趋势 */}
        <div className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-6">
          <h2 className="mb-6 text-lg font-semibold text-[#2C2416]">用户增长趋势</h2>
          <div className="flex h-48 items-end justify-between gap-2">
            {[65, 72, 68, 78, 85, 92, 88].map((value, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-[#D4A574] transition-all hover:bg-[#B8860B]"
                  style={{ height: `${value}%` }}
                />
                <span className="text-xs text-[#9A8B78]">
                  {["周一", "周二", "周三", "周四", "周五", "周六", "周日"][index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 收入趋势 */}
        <div className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-6">
          <h2 className="mb-6 text-lg font-semibold text-[#2C2416]">收入趋势</h2>
          <div className="flex h-48 items-end justify-between gap-2">
            {[45, 52, 48, 65, 72, 68, 75].map((value, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-[#B8860B] transition-all hover:bg-[#D4A574]"
                  style={{ height: `${value}%` }}
                />
                <span className="text-xs text-[#9A8B78]">
                  {["周一", "周二", "周三", "周四", "周五", "周六", "周日"][index]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
