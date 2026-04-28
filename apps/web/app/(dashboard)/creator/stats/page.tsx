"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { DataCard } from "@/components/common/list-components";
import { TrendingUp, Eye, MessageSquare, Heart, Download, Star } from "lucide-react";

interface StatsData {
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_downloads: number;
  total_earnings: number;
  weekly_views: number[];
  weekly_likes: number[];
  top_content: { id: string; name: string; views: number; type: string }[];
}

export default function CreatorStatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const result = await api.creator.getStats();
      setStats(result as unknown as StatsData);
    } catch (error) {
      console.error("获取统计数据失败:", error);
      // Mock 数据
      setStats({
        total_views: 12345,
        total_likes: 567,
        total_comments: 234,
        total_downloads: 890,
        total_earnings: 2345.5,
        weekly_views: [1200, 1500, 1800, 1600, 1900, 2200, 2145],
        weekly_likes: [45, 56, 67, 78, 89, 102, 120],
        top_content: [
          { id: "1", name: "劳动争议处理全流程模板", views: 5678, type: "skill" },
          { id: "2", name: "AI 合同风险排查助手", views: 3456, type: "agent" },
          { id: "3", name: "企业合规自查清单", views: 2111, type: "skill" },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const mockStats = stats || {
    total_views: 0,
    total_likes: 0,
    total_comments: 0,
    total_downloads: 0,
    total_earnings: 0,
    weekly_views: [],
    weekly_likes: [],
    top_content: [],
  };

  return (
    <div className="p-8">
      {/* 页面标题 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2C2416]">数据分析</h1>
          <p className="mt-2 text-[#5D4E3A]">查看你的创作数据和分析报告</p>
        </div>

        {/* 时间筛选 */}
        <div className="flex gap-1 rounded-xl bg-[rgba(212,165,116,0.15)] p-1">
          {[
            { id: "7d" as const, label: "7天" },
            { id: "30d" as const, label: "30天" },
            { id: "90d" as const, label: "90天" },
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

      {/* 概览统计 */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <DataCard
          label="总浏览量"
          value={mockStats.total_views.toLocaleString()}
          trend="+12%"
          trendUp
          icon={<Eye className="h-5 w-5" />}
        />
        <DataCard
          label="总点赞数"
          value={mockStats.total_likes.toLocaleString()}
          trend="+8%"
          trendUp
          icon={<Heart className="h-5 w-5" />}
        />
        <DataCard
          label="总评论数"
          value={mockStats.total_comments.toLocaleString()}
          icon={<MessageSquare className="h-5 w-5" />}
        />
        <DataCard
          label="总下载量"
          value={mockStats.total_downloads.toLocaleString()}
          trend="+15%"
          trendUp
          icon={<Download className="h-5 w-5" />}
        />
        <DataCard
          label="总收入"
          value={`¥${mockStats.total_earnings.toLocaleString()}`}
          trend="+20%"
          trendUp
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* 趋势图表（简化版） */}
      <div className="mb-8 rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-6">
        <h2 className="mb-6 text-lg font-semibold text-[#2C2416]">浏览趋势</h2>
        <div className="flex h-48 items-end justify-between gap-2">
          {mockStats.weekly_views.map((value, index) => {
            const maxValue = Math.max(...mockStats.weekly_views);
            const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
            return (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-[#D4A574] transition-all hover:bg-[#B8860B]"
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs text-[#9A8B78]">
                  {["周一", "周二", "周三", "周四", "周五", "周六", "周日"][index]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 热门内容 */}
      <div className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-6">
        <h2 className="mb-6 text-lg font-semibold text-[#2C2416]">热门内容 TOP 10</h2>
        <div className="space-y-3">
          {mockStats.top_content.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-xl border border-[rgba(212,165,116,0.25)] p-4 transition-all hover:shadow-md"
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold ${
                index === 0 ? "bg-amber-100 text-amber-700" :
                index === 1 ? "bg-[rgba(212,165,116,0.15)] text-[#5D4E3A]" :
                index === 2 ? "bg-orange-50 text-orange-600" :
                "bg-[rgba(212,165,116,0.15)] text-[#5D4E3A]"
              }`}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="truncate font-medium text-[#2C2416]">{item.name}</h3>
                <p className="mt-1 text-xs text-[#9A8B78]">{item.type === "skill" ? "Skills" : "智能体"}</p>
              </div>
              <div className="flex items-center gap-1 text-[#D4A574]">
                <Eye className="h-4 w-4" />
                <span className="font-medium">{item.views.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
