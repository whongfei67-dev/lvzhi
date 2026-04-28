"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { CategoryTabs } from "@/components/common/filter-components";
import { Sparkles, Bot, TrendingUp, Star, Award } from "lucide-react";

type RankingType = "comprehensive" | "skills" | "agents" | "newcomer";

const RANKING_CONFIG: Record<RankingType, { title: string; subtitle: string; icon: React.ElementType }> = {
  comprehensive: { title: "综合榜单", subtitle: "综合评分最高的灵感内容", icon: TrendingUp },
  skills: { title: "Skills 榜单", subtitle: "最受欢迎的 Skills 和模板", icon: Sparkles },
  agents: { title: "智能体榜单", subtitle: "最受用户喜爱的 AI 智能体", icon: Bot },
  newcomer: { title: "新锐榜单", subtitle: "近期表现优异的新上榜内容", icon: Award },
};

// Mock 数据
const MOCK_RANKINGS = [
  { id: "1", title: "劳动争议处理全流程模板", author: "陈律师", rating: 4.9, type: "Skills", category: "劳动法" },
  { id: "2", title: "AI 合同风险排查助手", author: "张律师", rating: 4.8, type: "智能体", category: "合同法" },
  { id: "3", title: "企业合规自查清单", author: "王律师", rating: 4.7, type: "Skills", category: "公司法" },
  { id: "4", title: "批量合同生成工具", author: "李律师", rating: 4.6, type: "工具", category: "合同法" },
  { id: "5", title: "婚姻法财产分割指南", author: "赵律师", rating: 4.5, type: "Skills", category: "婚姻家事" },
  { id: "6", title: "知识产权申请入门", author: "孙律师", rating: 4.4, type: "Prompt", category: "知识产权" },
  { id: "7", title: "刑事辩护策略分析", author: "周律师", rating: 4.3, type: "Skills", category: "刑事辩护" },
  { id: "8", title: "公司治理结构设计", author: "吴律师", rating: 4.2, type: "Skills", category: "公司法" },
];

export default function RankingsPage() {
  const [activeRanking, setActiveRanking] = useState<RankingType>("comprehensive");

  const config = RANKING_CONFIG[activeRanking];
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
      <PageHeader
        variant="inspiration"
        title="灵感榜单"
        description="发现最受欢迎的法律 Skills、智能体与创作"
        backHref="/inspiration"
      />

      {/* 榜单切换 */}
      <section className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
        <CategoryTabs
          tabs={[
            { id: "comprehensive", label: "综合榜单" },
            { id: "skills", label: "Skills 榜单" },
            { id: "agents", label: "智能体榜单" },
            { id: "newcomer", label: "新锐榜单" },
          ]}
          activeTab={activeRanking}
          onChange={(tab) => setActiveRanking(tab as RankingType)}
        />
      </section>

      {/* 榜单内容 */}
      <section className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
        {/* 榜单说明 */}
        <div className="mb-6 flex items-center gap-4 rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(212,165,116,0.15)]">
            <Icon className="h-6 w-6 text-[#D4A574]" />
          </div>
          <div>
            <h2 className="font-semibold text-[#2C2416]">{config.title}</h2>
            <p className="text-sm text-[#5D4E3A]">{config.subtitle}</p>
          </div>
        </div>

        {/* 榜单列表 */}
        <div className="space-y-3">
          {MOCK_RANKINGS.map((item, index) => (
            <Link
              key={item.id}
              href={`/inspiration/${item.id}`}
              className="group flex items-center gap-4 rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#D4A574] hover:shadow-md"
            >
              {/* 排名 */}
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
                index === 0 ? "bg-amber-100 text-amber-700" :
                index === 1 ? "bg-[rgba(212,165,116,0.15)] text-[#5D4E3A]" :
                index === 2 ? "bg-orange-50 text-orange-600" :
                "bg-[rgba(212,165,116,0.15)] text-[#5D4E3A]"
              }`}>
                {index + 1}
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-[#2C2416] transition-colors group-hover:text-[#D4A574] truncate">
                    {item.title}
                  </h3>
                  <span className="shrink-0 rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs font-medium text-[#5D4E3A]">
                    {item.type}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[#5D4E3A]">
                  <span>{item.author}</span>
                  <span className="text-[#9A8B78]">·</span>
                  <span>{item.category}</span>
                </div>
              </div>

              {/* 评分 */}
              <div className="shrink-0 flex items-center gap-1 text-sm font-medium text-[#D4A574]">
                <Star className="h-4 w-4 fill-current" />
                {item.rating}
              </div>
            </Link>
          ))}
        </div>

        {/* 更多入口 */}
        <div className="mt-8 text-center">
          <Link
            href="/inspiration"
            className="inline-flex items-center gap-2 rounded-xl border border-[rgba(212,165,116,0.25)] bg-white px-6 py-3 text-sm font-medium text-[#5D4E3A] transition-colors hover:border-[#D4A574] hover:text-[#D4A574]"
          >
            浏览全部灵感内容
          </Link>
        </div>
      </section>

      {/* 底部留白 */}
      <div className="pb-16" />
    </div>
  );
}
