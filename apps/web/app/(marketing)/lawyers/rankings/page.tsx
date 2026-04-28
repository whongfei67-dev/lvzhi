"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { GuestGate } from "@/components/common/guest-gate";
import { Star, Trophy, ChevronRight, Building2 } from "lucide-react";
import { PracticeLawyerBadge } from "@/components/common/practice-lawyer-badge";
import {
  MOCK_INFLUENCE_FIRMS,
  getMockLawyersForRankingsTab,
} from "@/lib/lawyers-ranking-demo";

const RANKING_TABS = [
  { id: "comprehensive", label: "综合推荐" },
  { id: "influence", label: "创作影响力" },
  { id: "newcomer", label: "新锐创作者律师" },
  { id: "firm_influence", label: "影响力律所" },
] as const;

function isRankingTab(tab: string | null): tab is (typeof RANKING_TABS)[number]["id"] {
  return !!tab && RANKING_TABS.some((t) => t.id === tab);
}

function LawyerRankingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sp = useMemo(() => searchParams ?? new URLSearchParams(), [searchParams]);
  const tabParam = sp.get("tab");
  const [activeRanking, setActiveRanking] = useState<(typeof RANKING_TABS)[number]["id"]>("comprehensive");

  useEffect(() => {
    if (tabParam === "region" || tabParam === "domain") {
      router.replace("/lawyers/rankings?tab=comprehensive", { scroll: false });
      setActiveRanking("comprehensive");
      return;
    }
    if (isRankingTab(tabParam)) setActiveRanking(tabParam);
  }, [tabParam, router]);

  const selectTab = useCallback(
    (id: (typeof RANKING_TABS)[number]["id"]) => {
      setActiveRanking(id);
      router.replace(`/lawyers/rankings?tab=${encodeURIComponent(id)}`, { scroll: false });
    },
    [router]
  );

  const rankingLawyers =
    activeRanking === "firm_influence"
      ? []
      : getMockLawyersForRankingsTab(activeRanking).slice(0, 12);

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
      <PageHeader
        title="律师榜单"
        description="发现平台最优秀的认证律师"
        backHref="/lawyers"
      />

      <section className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
        <div className="border-b border-[rgba(212,165,116,0.25)]">
          <div className="flex flex-wrap gap-1">
            {RANKING_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
                className={`border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                  activeRanking === tab.id
                    ? "border-[#D4A574] text-[#D4A574]"
                    : "border-transparent text-[#5D4E3A] hover:text-[#2C2416]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
        <p className="mb-4 text-xs text-[#9A8B78]">
          以下为示例数据，接口就绪后将展示实时榜单。
        </p>
        <div className="space-y-3">
          {activeRanking === "firm_influence"
            ? MOCK_INFLUENCE_FIRMS.map((firm, index) => (
                <Link
                  key={firm.id}
                  href={`/lawyers/firms/${encodeURIComponent(firm.id)}`}
                  className="group flex items-center gap-5 rounded-xl p-5 transition-all hover:-translate-y-0.5 lawyer-directory-row"
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                      index === 0
                        ? "bg-amber-100 text-amber-700"
                        : index === 1
                          ? "bg-[rgba(212,165,116,0.15)] text-[#5D4E3A]"
                          : index === 2
                            ? "bg-orange-50 text-orange-600"
                            : "bg-[rgba(212,165,116,0.15)] text-[#5D4E3A]"
                    }`}
                  >
                    {index < 4 ? <Trophy className="h-6 w-6" /> : index + 1}
                  </div>

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4A574]/25 to-[#B8860B]/20 text-[#5C4033]">
                    <Building2 className="h-7 w-7" aria-hidden />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[#2C2416] group-hover:text-[#D4A574]">{firm.name}</h3>
                      <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs text-[#5D4E3A]">
                        {firm.city}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#5D4E3A]">{firm.summary}</p>
                    <p className="mt-2 text-xs text-[#9A8B78]">
                      平台认证律师约 {firm.lawyerCount} 位 · 示例数据
                    </p>
                  </div>

                  <ChevronRight className="h-5 w-5 shrink-0 text-[#9A8B78] opacity-40" aria-hidden />
                </Link>
              ))
            : rankingLawyers.map((lawyer, index) => (
                <Link
                  key={lawyer.id}
                  href={`/lawyers/${encodeURIComponent(lawyer.id)}`}
                  className="group flex items-center gap-5 rounded-xl p-5 transition-all hover:-translate-y-0.5 lawyer-directory-row"
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                      index === 0
                        ? "bg-amber-100 text-amber-700"
                        : index === 1
                          ? "bg-[rgba(212,165,116,0.15)] text-[#5D4E3A]"
                          : index === 2
                            ? "bg-orange-50 text-orange-600"
                            : "bg-[rgba(212,165,116,0.15)] text-[#5D4E3A]"
                    }`}
                  >
                    {index < 3 ? <Trophy className="h-6 w-6" /> : index + 1}
                  </div>

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4A574] to-[#B8860B] text-xl font-bold text-white">
                    {lawyer.name[0]}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-semibold text-[#2C2416] group-hover:text-[#D4A574]">{lawyer.name}</h3>
                      {lawyer.lawyer_verified ? <PracticeLawyerBadge /> : null}
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-[#B8860B]">
                      {lawyer.rankTitle ||
                        (lawyer.lawyer_verified
                          ? "执业律师"
                          : lawyer.creator_level === "creator"
                            ? "认证创作者"
                            : "律师")}
                    </p>
                    <p className="mt-1 text-sm text-[#5D4E3A]">{lawyer.firm}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(lawyer.expertise ?? []).slice(0, 3).map((exp) => (
                        <span
                          key={exp}
                          className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs text-[#5D4E3A]"
                        >
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-6">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-lg font-bold text-amber-500">
                        <Star className="h-5 w-5 fill-current" />
                        {lawyer.rating}
                      </div>
                      <p className="text-xs text-[#9A8B78]">{lawyer.review_count} 评价</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-[#D4A574]">{lawyer.follower_count}</p>
                      <p className="text-xs text-[#9A8B78]">关注</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[#9A8B78]" />
                  </div>
                </Link>
              ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 lg:px-8">
        <GuestGate
          action="预约咨询"
          mode="prompt"
          description="登录后可查看律师联系方式、预约咨询服务"
        />
      </section>
    </div>
  );
}

function RankingsFallback() {
  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)] p-8 text-center text-sm text-[#5D4E3A]">
      加载榜单…
    </div>
  );
}

/** 蓝图 §8.2：与 `/lawyers/ranking/*` 301 及 `?tab=` 对齐 */
export default function LawyerRankingsPage() {
  return (
    <Suspense fallback={<RankingsFallback />}>
      <LawyerRankingsContent />
    </Suspense>
  );
}
