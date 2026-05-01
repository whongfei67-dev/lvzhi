'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api/client'
import { Search, MapPin, Scale, Star, Building2 } from 'lucide-react'
import { PracticeLawyerBadge } from '@/components/common/practice-lawyer-badge'
import { FollowToggleButton } from '@/components/creator/follow-toggle-button'
import { preferTradForKeShiLu } from '@/lib/keshilu-text'
import { withPublicMediaProxy } from '@/lib/media-url'
import {
  GuestMarketingUnlockContentVeil,
  GuestMarketingUnlockViewportCta,
} from '@/components/common/guest-gate'
import {
  type LawyerListItem,
  MOCK_INFLUENCE_FIRMS,
  getDisplayLawyers,
  isShowingMockLawyers,
  filterLawyersByRegionDomain,
  filterInfluenceFirms,
  getFirmDisplayLawyerCount,
} from '@/lib/lawyers-ranking-demo'

/**
 * 律师列表页 v3.0 — UI预演方案
 * 视觉方向：琥珀咖啡色系 + 思源宋体
 */

/** 头图：城市天际线（Unsplash，与琥珀遮罩叠放） */
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920&q=80"

const DOMAINS = [
  { value: '', label: '全部领域' },
  { value: '合同法', label: '合同法' },
  { value: '劳动法', label: '劳动法' },
  { value: '婚姻家事', label: '婚姻家事' },
  { value: '企业法务', label: '企业法务' },
  { value: '知识产权', label: '知识产权' },
  { value: '刑事辩护', label: '刑事辩护' },
]

const REGIONS = [
  { value: '', label: '全国' },
  { value: '北京', label: '北京' },
  { value: '上海', label: '上海' },
  { value: '深圳', label: '深圳' },
  { value: '广州', label: '广州' },
  { value: '杭州', label: '杭州' },
  { value: '成都', label: '成都' },
]

const RANKING_TABS = [
  { id: 'comprehensive', label: '综合推荐' },
  { id: 'influence', label: '创作影响力' },
  { id: 'newcomer', label: '新锐创作者律师' },
  { id: 'firm_influence', label: '影响力律所' },
]

export const dynamic = 'force-dynamic'

export default function LawyersPage() {
  const [lawyers, setLawyers] = useState<LawyerListItem[]>([])
  const [loading, setLoading] = useState(true)
  /** undefined：尚未拉取；null：游客；有 id：已登录 */
  const [sessionUser, setSessionUser] = useState<{ id: string } | null | undefined>(undefined)
  const [selectedDomain, setSelectedDomain] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeRanking, setActiveRanking] = useState('comprehensive')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { getSession } = await import('@/lib/api/client')
        const s = await getSession()
        if (!cancelled) setSessionUser(s?.id ? { id: s.id } : null)
      } catch {
        if (!cancelled) setSessionUser(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (activeRanking !== 'comprehensive') {
      setLoading(false)
      return
    }
    fetchLawyers()
  }, [selectedDomain, selectedRegion, searchQuery, page, activeRanking])

  const fetchLawyers = async () => {
    setLoading(true)

    try {
      const result = await api.lawyers.list({
        page,
        limit: 20,
        expertise: selectedDomain || undefined,
        city: selectedRegion || undefined,
        search: searchQuery || undefined,
      })

      setLawyers(result.items as unknown as LawyerListItem[])
      setTotalPages(Math.max(1, Math.ceil(result.total / 20)))
    } catch (err) {
      console.error('获取律师列表失败:', err)
      setLawyers([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const rawDisplayLawyers = getDisplayLawyers(activeRanking, lawyers)
  const displayLawyersFiltered =
    activeRanking === "firm_influence"
      ? []
      : filterLawyersByRegionDomain(rawDisplayLawyers, selectedRegion, selectedDomain)
  const displayLawyers =
    activeRanking === "firm_influence" ? displayLawyersFiltered : displayLawyersFiltered.slice(0, 12)
  const displayFirms = filterInfluenceFirms(MOCK_INFLUENCE_FIRMS, selectedRegion, selectedDomain)
  const showLawyerMockHint = isShowingMockLawyers(activeRanking, lawyers)

  return (
    <div className="min-h-screen marketing-page-shell-tint">
      {/* ═══════════════════════════════════════════════════════ */}
      {/* Hero */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section
        className="page-header marketing-hero--inspiration-scale relative overflow-hidden"
        style={{ position: 'relative' }}
      >
        <div
          className="page-header-bg pointer-events-none"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 0,
            overflow: 'hidden'
          }}
        >
          <img
            src={HERO_IMAGE}
            alt="城市天际线背景"
            className="pointer-events-none"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="relative z-[2] mx-auto w-full max-w-6xl px-6 lg:px-8">
          <div className="page-header-content lawyers-marketing-hero animate-fade-in-up">
            <h1 className="hero-title hero-title--single-brush-line">
              {preferTradForKeShiLu("法智兼备　技业专精")}
            </h1>
            <p lang="zh-Hans" className="hero-desc marketing-subtitle--kai max-w-2xl">
              找专业靠谱的律师，遇懂你价值的托付
            </p>

            {/* 搜索框 */}
            <div className="mt-8">
              <div className="search-box mx-auto max-w-xl">
                <Search className="text-[#9A8B78]" />
                <input
                  type="text"
                  lang="zh-Hans"
                  placeholder={preferTradForKeShiLu("搜索律师姓名、律所...")}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  className="text-[#2C2416]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 筛选区域 */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-6 lg:px-8">
        {/* 地区筛选 */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm font-medium text-[#5D4E3A]">
            <MapPin className="h-4 w-4" />
            地区:
          </span>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <button
                key={r.value === "" ? "all-region" : r.value}
                type="button"
                onClick={() => {
                  setSelectedRegion(r.value)
                  setPage(1)
                }}
                className={`tag-border cursor-pointer transition-all ${
                  selectedRegion === r.value
                    ? "active border-[#D4A574] bg-[rgba(212,165,116,0.15)] text-[#D4A574]"
                    : ""
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* 领域筛选 */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm font-medium text-[#5D4E3A]">
            <Scale className="h-4 w-4" />
            领域:
          </span>
          <div className="flex flex-wrap gap-2">
            {DOMAINS.map((d) => (
              <button
                key={d.value === "" ? "all-domain" : d.value}
                type="button"
                onClick={() => {
                  setSelectedDomain(d.value)
                  setPage(1)
                }}
                className={`tag-border cursor-pointer transition-all ${
                  selectedDomain === d.value
                    ? "active border-[#D4A574] bg-[rgba(212,165,116,0.15)] text-[#D4A574]"
                    : ""
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-snug text-[#9A8B78] sm:text-xs">
          地区与领域筛选对综合推荐、创作影响力、新锐创作者律师及影响力律所均生效；切换榜单后列表会按该榜单数据重新筛选。
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 榜单切换 */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-[rgba(212,165,116,0.25)]">
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            {RANKING_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveRanking(tab.id)
                  setPage(1)
                }}
                className={`border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                  activeRanking === tab.id
                    ? 'border-[#D4A574] text-[#D4A574]'
                    : 'border-transparent text-[#5D4E3A] hover:text-[#2C2416]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="max-w-[min(100%,22rem)] shrink-0 pb-3 text-right text-[10px] leading-snug text-[#9A8B78] sm:max-w-md sm:text-xs">
            {activeRanking === "firm_influence"
              ? "律所榜单根据该律所全网活跃创作者人数统计"
              : activeRanking === "influence"
                ? "根据全网活跃度较高的创作者律师列举，不代表任何能力评价"
                : activeRanking === "newcomer"
                  ? "仅统计年龄35周岁以下的创作者律师"
                  : "仅展示本平台认证创作者律师，不代表任何能力评价"}
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 律师列表 */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {activeRanking === 'firm_influence' ? (
          <div className="space-y-4">
            {displayFirms.length === 0 ? (
              <p className="py-10 text-center text-sm text-[#9A8B78]">暂无符合当前筛选条件的律所，可尝试选择「全国」或「全部领域」。</p>
            ) : (
              displayFirms.map((firm) => (
                <Link
                  key={firm.id}
                  href={`/lawyers/firms/${encodeURIComponent(firm.id)}`}
                  className="card lawyer-directory-card group flex flex-col gap-4 p-6 sm:flex-row sm:items-center"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4A574]/25 to-[#B8860B]/20 text-[#5C4033]">
                    <Building2 className="h-8 w-8" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[#2C2416] group-hover:text-[#D4A574]">{firm.name}</h3>
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-[rgba(92,64,51,0.06)] px-2 py-0.5 text-xs text-[#5D4E3A] ring-1 ring-[rgba(212,165,116,0.28)]">
                        <MapPin className="h-3 w-3 shrink-0 text-[#B8860B]" aria-hidden />
                        {firm.city}
                      </span>
                    </div>
                    {firm.domains && firm.domains.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {firm.domains.map((d) => (
                          <span
                            key={d}
                            className="inline-flex items-center gap-0.5 rounded-full bg-[rgba(212,165,116,0.12)] px-2 py-0.5 text-xs text-[#5C4033] ring-1 ring-[rgba(212,165,116,0.25)]"
                          >
                            <Scale className="h-3 w-3 shrink-0 text-[#B8860B]" aria-hidden />
                            {d}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <p className="mt-2 text-sm text-[#5D4E3A]">{firm.summary}</p>
                    <p className="mt-2 text-xs text-[#9A8B78]">
                      {selectedDomain
                        ? `该领域活跃创作者律师约 ${getFirmDisplayLawyerCount(firm, selectedDomain)} 位 · 示例数据`
                        : `平台认证律师约 ${firm.lawyerCount} 位 · 示例数据`}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        ) : loading && activeRanking === 'comprehensive' ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D4A574] border-t-transparent"></div>
          </div>
        ) : (
          <>
            {showLawyerMockHint ? (
              <p className="mb-4 text-xs text-[#9A8B78]">
                以下为示例数据，接口就绪后将展示实时榜单。
              </p>
            ) : null}
            <div
              className={
                sessionUser === null
                  ? 'relative h-[min(72vh,680px)] max-h-[min(72vh,680px)] overflow-y-auto overflow-x-hidden'
                  : 'relative'
              }
            >
              <div className={sessionUser === null ? 'relative min-h-full' : 'relative'}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayLawyers.length === 0 ? (
                <p className="col-span-full py-10 text-center text-sm text-[#9A8B78]">
                  暂无符合当前筛选条件的律师，可尝试将地区改为「全国」或领域改为「全部领域」。
                </p>
              ) : (
                displayLawyers.map((lawyer) => (
                <article
                  key={`${activeRanking}-${lawyer.id}-${selectedRegion}-${selectedDomain}`}
                  className="card lawyer-directory-card group flex h-full flex-col p-3 sm:p-4"
                >
                  <Link href={`/lawyers/${encodeURIComponent(lawyer.id)}`} className="flex h-full flex-col">
                    <div className="flex gap-2.5 sm:gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#D4A574] to-[#B8860B] text-base font-bold text-white sm:h-12 sm:w-12 sm:rounded-xl sm:text-lg">
                        {lawyer.avatar ? (
                          <img src={withPublicMediaProxy(lawyer.avatar)} alt="" className="h-full w-full rounded-lg object-cover sm:rounded-xl" />
                        ) : (
                          lawyer.name?.[0] || "律"
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="truncate text-sm font-semibold text-[#2C2416] transition-colors group-hover:text-[#D4A574]">
                            {lawyer.name}
                          </h3>
                          {lawyer.lawyer_verified ? (
                            <PracticeLawyerBadge className="shrink-0 scale-90" />
                          ) : (
                            <span className="tag shrink-0 py-0 text-[10px] sm:text-xs">
                              认证创作者
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-[#B8860B] sm:text-xs">
                          {lawyer.rankTitle ||
                            (lawyer.lawyer_verified
                              ? "执业律师"
                              : "认证创作者")}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-[#5D4E3A] sm:text-xs">
                          {lawyer.firm || "独立执业"}
                        </p>
                      </div>
                    </div>

                    {(lawyer.city || (lawyer.domains && lawyer.domains.length > 0)) ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {lawyer.city ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-[rgba(92,64,51,0.06)] px-2 py-0.5 text-[10px] text-[#5D4E3A] ring-1 ring-[rgba(212,165,116,0.28)] sm:text-xs">
                            <MapPin className="h-2.5 w-2.5 shrink-0 text-[#B8860B]" aria-hidden />
                            {lawyer.city}
                          </span>
                        ) : null}
                        {(lawyer.domains ?? []).slice(0, 3).map((d) => (
                          <span
                            key={d}
                            className="inline-flex items-center gap-0.5 rounded-full bg-[rgba(212,165,116,0.12)] px-2 py-0.5 text-[10px] text-[#5C4033] ring-1 ring-[rgba(212,165,116,0.25)] sm:text-xs"
                          >
                            <Scale className="h-2.5 w-2.5 shrink-0 text-[#B8860B]" aria-hidden />
                            {d}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {lawyer.bio ? (
                      <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-[#5D4E3A] sm:text-xs">{lawyer.bio}</p>
                    ) : null}

                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-[rgba(212,165,116,0.22)] pt-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] sm:text-xs">
                        {lawyer.rating != null ? (
                          <div className="flex items-center gap-0.5 font-medium text-[#D4A574]">
                            <Star className="h-3.5 w-3.5 shrink-0 fill-current sm:h-4 sm:w-4" />
                            <span>{lawyer.rating.toFixed(1)}</span>
                            <span className="font-normal text-[#9A8B78]">({lawyer.review_count || 0})</span>
                          </div>
                        ) : null}
                        {lawyer.follower_count !== undefined ? (
                          <span className="shrink-0 text-[#9A8B78]">{lawyer.follower_count} 关注</span>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-[10px] font-medium text-[#D4A574] sm:text-xs">详情</span>
                    </div>
                  </Link>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <FollowToggleButton
                      targetUserId={String(lawyer.id || '')}
                      onChanged={({ followerCount }) => {
                        if (typeof followerCount !== 'number') return
                        setLawyers((prev) =>
                          prev.map((item) =>
                            String(item.id) === String(lawyer.id)
                              ? { ...item, follower_count: followerCount }
                              : item
                          )
                        )
                      }}
                      className="inline-flex h-8 items-center rounded-lg border border-[rgba(212,165,116,0.35)] px-3 text-[11px] font-semibold text-[#B8860B] transition hover:bg-[rgba(212,165,116,0.08)] disabled:cursor-not-allowed disabled:opacity-60 sm:h-9 sm:text-xs"
                    />
                    <Link
                      href={`/lawyers/${encodeURIComponent(lawyer.id)}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-[rgba(212,165,116,0.25)] px-2.5 py-1.5 text-[11px] font-medium text-[#5D4E3A] transition-colors hover:border-[#D4A574] hover:text-[#D4A574] sm:text-xs"
                    >
                      查看详情
                    </Link>
                  </div>
                </article>
                ))
              )}
                </div>

                {/* 分页：仅综合推荐且接口返回多页时展示 */}
                {activeRanking === 'comprehensive' && lawyers.length > 0 && totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="pagination-btn"
                    >
                      上一页
                    </button>
                    <span className="px-4 py-2 text-sm text-[#5D4E3A]">
                      第 {page} / {totalPages} 页
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="pagination-btn"
                    >
                      下一页
                    </button>
                  </div>
                )}
                {sessionUser === null ? <GuestMarketingUnlockContentVeil /> : null}
              </div>
              {sessionUser === null ? (
                <GuestMarketingUnlockViewportCta
                  ariaLabel={preferTradForKeShiLu('登录后查看更多律师详情')}
                  title={preferTradForKeShiLu('登录后查看更多律师详情')}
                  subtitle={preferTradForKeShiLu('包括联系方式、预约咨询、发表评价等功能')}
                  loginHref={`/login?next=${encodeURIComponent('/lawyers')}`}
                />
              ) : null}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
