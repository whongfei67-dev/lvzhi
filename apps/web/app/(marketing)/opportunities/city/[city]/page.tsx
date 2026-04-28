"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/common/filter-components";
import { Pagination } from "@/components/common/pagination";
import { GuestGate } from "@/components/common/guest-gate";
import { api, Opportunity } from "@/lib/api/client";
import { MapPin, Briefcase, Plus } from "lucide-react";

const CATEGORIES = [
  { value: "", label: "全部" },
  { value: "job", label: "招聘" },
  { value: "project", label: "项目" },
  { value: "collaboration", label: "合作" },
  { value: "service_offer", label: "服务" },
];

const LOCATIONS = [
  { value: "北京", label: "北京" },
  { value: "上海", label: "上海" },
  { value: "深圳", label: "深圳" },
  { value: "广州", label: "广州" },
  { value: "杭州", label: "杭州" },
  { value: "成都", label: "成都" },
  { value: "远程", label: "远程" },
];

// Mock 数据
const MOCK_OPPORTUNITIES = [
  {
    id: "1",
    title: "招聘高级法律顾问",
    description: "知名互联网公司招聘高级法律顾问",
    opportunity_type: "job",
    location: "北京",
    publisher_name: "某知名互联网公司",
    budget: null,
    is_featured: true,
    view_count: 1234,
    application_count: 56,
  },
  {
    id: "2",
    title: "合同审查项目外包",
    description: "需要将一批标准合同进行审查分类",
    opportunity_type: "project",
    location: "北京",
    publisher_name: "某某企业",
    budget: 15000,
    is_featured: false,
    view_count: 567,
    application_count: 23,
  },
];

interface PageProps {
  params: Promise<{ city: string }>;
}

type OpportunityRow = Partial<Opportunity> & {
  id: string;
  title: string;
  opportunity_type: string;
};

export default function OpportunityCityPage({ params }: PageProps) {
  const [citySlug, setCitySlug] = useState<string>("");
  const [opportunities, setOpportunities] = useState<OpportunityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    params.then((p) => setCitySlug(p.city));
  }, [params]);

  useEffect(() => {
    if (citySlug) {
      fetchOpportunities();
    }
  }, [citySlug, selectedCategory, page]);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const result = await api.opportunities.list({
        page,
        limit: 10,
        city: citySlug,
        type: selectedCategory || undefined,
      });
      setOpportunities((result.items as unknown as OpportunityRow[]) ?? []);
      setTotalPages(Math.ceil(result.total / 10));
    } catch (err) {
      console.error("获取机会列表失败:", err);
      setOpportunities(MOCK_OPPORTUNITIES as OpportunityRow[]);
    } finally {
      setLoading(false);
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

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      job: "bg-[rgba(212,165,116,0.08)] text-[#B8860B]",
      project: "bg-purple-50 text-purple-700",
      collaboration: "bg-[rgba(212,165,116,0.08)] text-[#D4A574]",
      service_offer: "bg-teal-50 text-teal-700",
    };
    return colors[type] || "bg-[rgba(212,165,116,0.08)] text-[#D4A574]";
  };

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
      <PageHeader
        title={`${citySlug}机会`}
        description={`浏览所有在${citySlug}的合作机会`}
        backHref="/opportunities"
      />

      {/* 其他城市快捷入口 */}
      <section className="mx-auto max-w-6xl px-6 py-4 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-[#5D4E3A]">其他城市:</span>
          {LOCATIONS.filter((l) => l.value !== citySlug).map((location) => (
            <Link
              key={location.value}
              href={`/opportunities/city/${location.value}`}
              className="rounded-full border border-[rgba(212,165,116,0.25)] marketing-cream-card-surface px-4 py-1.5 text-sm text-[#5D4E3A] transition-colors hover:border-[#D4A574] hover:text-[#D4A574]"
            >
              {location.label}
            </Link>
          ))}
        </div>
      </section>

      {/* 筛选区域 */}
      <section className="mx-auto max-w-6xl px-6 py-4 lg:px-8">
        <FilterBar
          filters={[
            {
              label: "类型",
              options: CATEGORIES,
              value: selectedCategory,
              onChange: setSelectedCategory,
            },
          ]}
        />
      </section>

      {/* 发布机会入口 */}
      <section className="mx-auto max-w-6xl px-6 lg:px-8">
        <GuestGate action="发布机会" mode="hidden">
          <Link
            href="/opportunities/create"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#D4A574] py-4 text-sm font-semibold text-white transition-colors hover:bg-[#B8860B]"
          >
            <Plus className="h-4 w-4" />
            发布机会
          </Link>
        </GuestGate>
      </section>

      {/* 机会列表 */}
      <section className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-[rgba(212,165,116,0.25)] marketing-cream-card-surface p-6">
                <div className="h-6 w-1/2 rounded bg-[rgba(212,165,116,0.15)]" />
              </div>
            ))}
          </div>
        ) : opportunities.length === 0 ? (
          <div className="rounded-2xl border border-[rgba(212,165,116,0.25)] marketing-cream-card-surface p-12 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-[#9A8B78]" />
            <h3 className="mt-4 text-lg font-semibold text-[#2C2416]">暂无{citySlug}机会</h3>
            <p className="mt-2 text-sm text-[#5D4E3A]">试试其他城市吧</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {opportunities.map((opp) => (
                <Link
                  key={opp.id}
                  href={`/opportunities/${opp.slug || opp.id}`}
                  className="group flex flex-col gap-4 rounded-xl border border-[rgba(212,165,116,0.25)] marketing-cream-card-surface p-6 transition-all hover:-translate-y-0.5 hover:border-[#D4A574] hover:shadow-md"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-semibold text-[#2C2416] transition-colors group-hover:text-[#D4A574]">
                        {opp.title}
                      </h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeColor(opp.opportunity_type)}`}>
                        {getTypeLabel(opp.opportunity_type)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-[#5D4E3A]">
                      <span className="flex items-center gap-1">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(212,165,116,0.15)] text-[10px] font-bold text-[#D4A574]">
                          {opp.publisher_name?.[0] || "发"}
                        </div>
                        {opp.publisher_name || "匿名发布"}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {opp.location}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} className="mt-8" />
          </>
        )}
      </section>

      <div className="pb-16" />
    </div>
  );
}
