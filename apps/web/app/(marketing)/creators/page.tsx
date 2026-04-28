export const dynamic = "force-dynamic";

import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/common/empty-state";
import { CreatorCard, type CreatorCardCreator } from "@/components/creator/creator-card";
import { Building, Crown, Scale, Shield, Sparkles } from "lucide-react";
import { PracticeLawyerBadge } from "@/components/common/practice-lawyer-badge";
import {
  DEMO_CREATORS,
  LAWYER_DOMAINS,
  LAWYER_REGIONS,
  getLawyerLeaderboard,
  normalizeLawyerFilter,
} from "@/lib/platform-demo-data";

const TABS = [
  { key: "discover", label: "发现创作者", icon: null },
  { key: "creator-ranking", label: "创作者贡献榜", icon: <Crown className="h-4 w-4" /> },
  { key: "lawyer-ranking", label: "律师榜单", icon: <Scale className="h-4 w-4" /> },
  { key: "academy-support", label: "学院支持", icon: <Shield className="h-4 w-4" /> },
];

const ENTRY_CARDS = [
  {
    title: "执业律师创作者",
    desc: "面向已完成律师认证的创作者，适合展示专业能力、案例与智能体作品。",
    href: "/creators?tab=creator-ranking",
    cta: "查看律师创作者",
  },
  {
    title: "法律创作新人",
    desc: "从内容、课程或工具原型切入，逐步建立自己的作品矩阵与公开主页。",
    href: "/classroom",
    cta: "去看学习路径",
  },
  {
    title: "我是在职创作者",
    desc: "我希望在不脱离当前工作状态的前提下，逐步开始创作智能体、内容或课程作品。",
    href: "/creators/employed",
    cta: "进入在职创作者路径",
  },
  {
    title: "平台政策",
    desc: "统一查看创作者学院的规则、帮助说明、隐私政策与人工服务入口。",
    href: "/creators/policies",
    cta: "进入平台政策",
  },
];

type LawyerRankRow = {
  id: string;
  displayName: string;
  verified: boolean;
  city: string;
  institution: string;
  specialties: string[];
};

function toCreatorCard(creator: (typeof DEMO_CREATORS)[number], rank?: number): CreatorCardCreator {
  return {
    id: creator.id,
    displayName: creator.creatorDisplayName ?? creator.display_name ?? creator.name,
    publicLabel: creator.hideRealIdentity
      ? creator.publicIdentityLabel ?? creator.creatorAlias ?? creator.creatorDisplayName ?? creator.display_name ?? creator.name
      : creator.creatorDisplayName ?? creator.display_name ?? creator.name,
    bio: creator.hideRealIdentity ? creator.sanitizedBio : creator.bio,
    lawFirm: creator.hideRealIdentity ? creator.publicOrganization ?? creator.city : creator.organization,
    specialty: creator.specialty,
    verified: creator.verified,
    agentCount: creator.agentsPublished,
    demoCount: creator.worksPublished,
    isEmployedCreator: creator.isEmployedCreator,
    hideRealIdentity: creator.hideRealIdentity,
    rank,
  };
}

export default async function CreatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; region?: string; domain?: string }>;
}) {
  const params = await searchParams;
  const tab = params.tab ?? "discover";
  const currentRegion = normalizeLawyerFilter(params.region, LAWYER_REGIONS, "全国");
  const currentDomain = normalizeLawyerFilter(params.domain, LAWYER_DOMAINS, "全部领域");
  const query = (params.q ?? "").trim();

  const filteredCreators = DEMO_CREATORS.filter((creator) => {
    if (!query) return true;
    const haystack = [
      creator.creatorDisplayName,
      creator.creatorAlias,
      creator.city,
      creator.organization,
      (creator.specialty ?? []).join(" "),
    ]
      .filter(Boolean)
      .join(" ");
    return haystack.includes(query);
  });

  const creatorCards = filteredCreators.map((creator, index) => toCreatorCard(creator, index + 1));
  const rankedCreators = DEMO_CREATORS.slice().sort((a, b) => b.worksPublished - a.worksPublished).map((creator, index) => toCreatorCard(creator, index + 1));
  const lawyerRanking = getLawyerLeaderboard(currentRegion, currentDomain) as LawyerRankRow[];

  return (
    <div className="min-h-screen marketing-page-shell-tint">
      <div className="page-header" style={{ position: 'relative' }}>
        <div
          className="page-header-bg"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 0,
            overflow: 'hidden'
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80"
            alt="创作者背景"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <PageContainer py="lg">
          <div className="space-y-6 relative z-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold tracking-wider text-[#B8860B]">创作者学院</p>
                <h1 className="text-4xl font-bold text-[#2C2416] lg:text-5xl" style={{ fontFamily: "'Noto Serif TC', 'Source Han Serif TC', serif" }}>
                  认识创作者
                </h1>
                <p className="max-w-2xl leading-relaxed text-lg text-[#5D4E3A]">
                  在现有创作生态基础上，继续承接律师创作者、在职创作者和平台政策入口，保持统一展示风格与真实点击路径。
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-3 lg:flex-col lg:items-end">
                {[
                  { label: "创作者总数", value: `${DEMO_CREATORS.length}` },
                  { label: "在职创作者", value: `${DEMO_CREATORS.filter((item) => item.isEmployedCreator).length}` },
                  { label: "政策入口", value: "6 项" },
                ].map((item) => (
                  <div key={item.label} className="card px-5 py-3 text-center lg:text-right">
                    <p className="text-xl font-bold text-[#2C2416]">{item.value}</p>
                    <p className="text-xs text-[#5D4E3A]">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {ENTRY_CARDS.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="card p-5 transition-all hover:border-[rgba(212,165,116,0.4)]"
                >
                  <h2 className="text-lg font-semibold text-[#2C2416]">{card.title}</h2>
                  <p className="mt-3 min-h-20 text-sm leading-7 text-[#5D4E3A]">{card.desc}</p>
                  <span className="mt-4 inline-flex text-sm font-semibold text-[#D4A574] hover:text-[#D4A574] transition-colors">
                    {card.cta} →
                  </span>
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {TABS.map((item) => (
                <Link
                  key={item.key}
                  href={`/creators?tab=${item.key}`}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    tab === item.key
                      ? "bg-[#D4A574] text-white"
                      : "border border-[rgba(212,165,116,0.25)] bg-white text-[#5D4E3A] hover:bg-[rgba(212,165,116,0.1)]"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </PageContainer>
      </div>

      <PageContainer py="md">
        {tab === "discover" && (
          <div className="space-y-5">
            <form method="GET" action="/creators" className="flex max-w-2xl items-center gap-2">
              <input type="hidden" name="tab" value="discover" />
              <div className="search-box flex-1">
                <Sparkles className="text-[#9A8B78]" />
                <input
                  name="q"
                  defaultValue={params.q}
                  placeholder="搜索创作者昵称、机构或方向…"
                  className="search-input"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
              >
                搜索
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[#9A8B78]">{creatorCards.length} 位创作者可查看</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/creators/employed" className="btn-outline text-sm py-1.5 px-3">
                  我是在职创作者
                </Link>
                <Link href="/creators/policies" className="btn-outline text-sm py-1.5 px-3">
                  平台政策
                </Link>
              </div>
            </div>

            {!creatorCards.length ? (
              <div className="card p-12">
                <EmptyState
                  icon={<Crown className="h-12 w-12 text-[#9A8B78]" />}
                  title="暂无符合条件的创作者"
                  description="试试更换关键词，或直接进入在职创作者与平台政策入口。"
                  action="返回全部创作者"
                  actionHref="/creators"
                />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {creatorCards.map((creator) => (
                  <CreatorCard key={creator.id} creator={creator} layout="grid" />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "creator-ranking" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rankedCreators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} layout="grid" />
            ))}
          </div>
        )}

        {tab === "lawyer-ranking" && (
          <div className="space-y-4">
            <div className="card p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm text-[#5D4E3A]">创作者学院中的律师榜单入口</p>
                  <h2 className="mt-1 text-xl font-bold text-[#2C2416]">
                    {currentRegion} · {currentDomain}
                  </h2>
                </div>
                <Link
                  href={`/rankings?tab=lawyer-contributors&region=${encodeURIComponent(currentRegion)}&domain=${encodeURIComponent(currentDomain)}`}
                  className="btn btn-outline"
                >
                  查看完整律师榜单
                </Link>
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {LAWYER_REGIONS.map((region) => (
                    <Link
                      key={region.value}
                      href={`/creators?tab=lawyer-ranking&region=${encodeURIComponent(region.label)}&domain=${encodeURIComponent(currentDomain)}`}
                      className={
                        currentRegion === region.label
                          ? "rounded-xl bg-[#D4A574] px-3.5 py-2 text-sm font-medium text-white"
                          : "rounded-xl border border-[rgba(212,165,116,0.25)] bg-white px-3.5 py-2 text-sm font-medium text-[#5D4E3A] hover:bg-[rgba(212,165,116,0.1)]"
                      }
                    >
                      {region.label}
                    </Link>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {LAWYER_DOMAINS.map((domain) => (
                    <Link
                      key={domain.value}
                      href={`/creators?tab=lawyer-ranking&region=${encodeURIComponent(currentRegion)}&domain=${encodeURIComponent(domain.label)}`}
                      className={
                        currentDomain === domain.label
                          ? "rounded-xl bg-[#D4A574] px-3.5 py-2 text-sm font-medium text-white"
                          : "rounded-xl border border-[rgba(212,165,116,0.25)] bg-white px-3.5 py-2 text-sm font-medium text-[#5D4E3A] hover:bg-[rgba(212,165,116,0.1)]"
                      }
                    >
                      {domain.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {lawyerRanking.slice(0, 6).map((lawyer, index) => (
                <div key={lawyer.id} className="card p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4A574] to-[#B8860B] text-lg font-bold text-white">
                      #{index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[#2C2416] truncate">{lawyer.displayName}</p>
                        {lawyer.verified ? <PracticeLawyerBadge className="!text-[10px]" /> : null}
                      </div>
                      <p className="mt-1 text-sm text-[#5D4E3A]">{lawyer.city} · {lawyer.institution}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {lawyer.specialties.slice(0, 3).map((item) => (
                          <span key={item} className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs text-[#D4A574]">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Link href={`/find-lawyer/${lawyer.id}`} className="btn btn-outline text-sm py-2 px-3">
                      查看详情
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "academy-support" && (
          <div className="grid gap-4 lg:grid-cols-3">
            <Link href="/creators/policies" className="card p-6">
              <Shield className="h-6 w-6 text-[#D4A574]" />
              <h2 className="mt-4 text-lg font-semibold text-[#2C2416]">平台政策</h2>
              <p className="mt-3 text-sm leading-7 text-[#5D4E3A]">查看创作者权责声明、隐私政策、上传规则、投诉反馈与人工服务。</p>
            </Link>
            <Link href="/creators/employed" className="card p-6">
              <Building className="h-6 w-6 text-[#D4A574]" />
              <h2 className="mt-4 text-lg font-semibold text-[#2C2416]">在职创作者路径</h2>
              <p className="mt-3 text-sm leading-7 text-[#5D4E3A]">了解如何在不脱离当前工作状态的前提下，逐步开始创作并保护个人身份信息。</p>
            </Link>
            <Link href="/classroom" className="card p-6">
              <Sparkles className="h-6 w-6 text-[#D4A574]" />
              <h2 className="mt-4 text-lg font-semibold text-[#2C2416]">学习与成长</h2>
              <p className="mt-3 text-sm leading-7 text-[#5D4E3A]">从智能体课堂开始，继续完善作品、内容和课程的表达方式。</p>
            </Link>
          </div>
        )}
      </PageContainer>
    </div>
  );
}
