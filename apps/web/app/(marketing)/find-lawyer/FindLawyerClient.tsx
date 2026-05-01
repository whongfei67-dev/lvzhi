"use client"

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api/client'
import type { User } from '@/lib/api/types'
import { Search, Trophy, MapPin, Scale, Star, ChevronRight, Users } from 'lucide-react'
import { PracticeLawyerBadge } from '@/components/common/practice-lawyer-badge'
import { FollowToggleButton } from '@/components/creator/follow-toggle-button'

const REGIONS = ['全国', '北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉', '西安']
const DOMAINS = [
  { value: 'all', label: '全部领域' },
  { value: 'contract', label: '合同审查' },
  { value: 'litigation', label: '诉讼仲裁' },
  { value: 'consultation', label: '法律咨询' },
  { value: 'ip', label: '知识产权' },
  { value: 'labor', label: '劳动仲裁' },
  { value: 'family', label: '婚姻家事' },
  { value: 'criminal', label: '刑事辩护' },
]

type Lawyer = User & {
  name?: string
  display_name: string
  bio?: string
  firm?: string
  verified: boolean
  lawyer_verified?: boolean
  follower_count?: number
  agent_count?: number
  rating?: number
  review_count?: number
}

type PromotionConfig = {
  lawyer_recommend_mode?: 'comprehensive' | 'domain'
  lawyer_domain?: string
  lawyer_ids?: string[]
}

const DOMAIN_TO_SPECIALTY: Record<string, string> = {
  contract: '合同法',
  litigation: '诉讼仲裁',
  consultation: '法律咨询',
  ip: '知识产权',
  labor: '劳动仲裁',
  family: '婚姻家事',
}

function normalizeLawyer(item: Lawyer): Lawyer {
  const displayName = item.display_name || item.name || item.email || '匿名律师'
  return {
    ...item,
    display_name: displayName,
    name: item.name || displayName,
  }
}

interface FindLawyerClientProps {
  initialRegion?: string
  initialDomain?: string
  initialQuery?: string
}

export function FindLawyerClient({ initialRegion = '全国', initialDomain = 'all', initialQuery = '' }: FindLawyerClientProps) {
  const [region, setRegion] = useState(initialRegion)
  const [domain, setDomain] = useState(initialDomain)
  const [query, setQuery] = useState(initialQuery)
  const [lawyers, setLawyers] = useState<Lawyer[]>([])
  const [topLawyers, setTopLawyers] = useState<Lawyer[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [promotionConfig, setPromotionConfig] = useState<PromotionConfig>({
    lawyer_recommend_mode: 'comprehensive',
    lawyer_domain: '',
    lawyer_ids: [],
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/proxy/promotion-config', { credentials: 'include' })
        const payload = (await res.json().catch(() => ({}))) as { code?: number; data?: PromotionConfig }
        if (cancelled) return
        if (payload.code === 0) {
          setPromotionConfig({
            lawyer_recommend_mode: payload.data?.lawyer_recommend_mode === 'domain' ? 'domain' : 'comprehensive',
            lawyer_domain: String(payload.data?.lawyer_domain || ''),
            lawyer_ids: Array.isArray(payload.data?.lawyer_ids) ? payload.data?.lawyer_ids.map((id) => String(id)).filter(Boolean) : [],
          })
        }
      } catch {
        if (!cancelled) {
          setPromotionConfig({
            lawyer_recommend_mode: 'comprehensive',
            lawyer_domain: '',
            lawyer_ids: [],
          })
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    async function fetchLawyers() {
      setLoading(true)
      try {
        // 仅拉取已通过律师认证/律师级创作者
        const result = await api.lawyers.list({
          search: query || undefined,
          city: region !== '全国' ? region : undefined,
          expertise: domain !== 'all' ? DOMAIN_TO_SPECIALTY[domain] ?? domain : undefined,
          page: 1,
          limit: 20,
        })
        setLawyers((result.items as unknown as Lawyer[]).map(normalizeLawyer))
        setTotal(result.total)

        // 获取 TOP 榜单
        const rankingRows = await api.lawyers.getRankings({
          city: region !== '全国' ? region : undefined,
          expertise: domain !== 'all' ? DOMAIN_TO_SPECIALTY[domain] ?? domain : undefined,
          limit: 5,
        })
        const baseTop = (rankingRows as unknown as Lawyer[]).map(normalizeLawyer)

        const selectedDomainLabel = DOMAINS.find((item) => item.value === domain)?.label || ''
        const modeMatched =
          promotionConfig.lawyer_recommend_mode === 'comprehensive'
            ? domain === 'all'
            : domain !== 'all' && (!promotionConfig.lawyer_domain || promotionConfig.lawyer_domain === selectedDomainLabel)

        if (modeMatched && Array.isArray(promotionConfig.lawyer_ids) && promotionConfig.lawyer_ids.length > 0) {
          const promotedRaw = await Promise.all(
            promotionConfig.lawyer_ids.slice(0, 10).map(async (id) => {
              try {
                return await api.lawyers.get(id)
              } catch {
                return null
              }
            })
          )
          const promoted = promotedRaw
            .filter((item: Record<string, unknown> | null): item is Record<string, unknown> => Boolean(item))
            .map((item: Record<string, unknown>) => normalizeLawyer(item as unknown as Lawyer))
          const merged = [...promoted, ...baseTop]
          const deduped: Lawyer[] = []
          const seen = new Set<string>()
          for (const item of merged) {
            const key = String(item.id || '')
            if (!key || seen.has(key)) continue
            seen.add(key)
            deduped.push(item)
          }
          setTopLawyers(deduped.slice(0, 5))
        } else {
          setTopLawyers(baseTop)
        }
      } catch (err) {
        console.error('Failed to fetch lawyers:', err)
        setLawyers([])
        setTopLawyers([])
      } finally {
        setLoading(false)
      }
    }
    fetchLawyers()
  }, [region, domain, query, promotionConfig])

  const buildHref = (overrides: { region?: string; domain?: string; q?: string }) => {
    const merged = {
      region,
      domain,
      q: query,
      ...overrides,
    }
    const qs = Object.entries(merged)
      .filter(([, value]) => value && value !== 'all' && value !== '全国')
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&')
    return `/find-lawyer${qs ? `?${qs}` : ''}`
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <div className="min-h-screen marketing-page-shell-tint">
      {/* Hero */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section
        className="page-header marketing-hero--inspiration-scale relative overflow-hidden"
        style={{ position: 'relative' }}
      >
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
            src="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920&q=80"
            alt="找律师背景"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="relative z-[2] mx-auto w-full max-w-6xl px-6 lg:px-8">
          <div className="page-header-content animate-fade-in-up">
            {/* 标签 */}
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <Scale className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">找律师</span>
            </div>

            <h1 className="page-title">{preferTradForKeShiLu("找律师")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("通过区域与领域组合快速锁定专业律师，获取一对一法律服务")}</p>

            {/* 搜索框 */}
            <div className="mt-8">
              <div className="search-box mx-auto max-w-xl">
                <Search className="text-[#9A8B78]" />
                <input
                  type="text"
                  placeholder="搜索律师姓名、律所..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
        {/* Filters */}
        <section>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Region & Domain Filters */}
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#2C2416]">筛选维度</h2>
                  <p className="mt-1 text-sm text-[#5D4E3A]">支持区域切换与领域切换</p>
                </div>
                <Link href="/find-lawyer" className="text-sm text-[#D4A574] hover:text-[#2C2416]">
                  重置
                </Link>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <p className="mb-3 text-sm font-medium text-[#5D4E3A]">区域</p>
                  <div className="flex flex-wrap gap-2">
                    {REGIONS.map((r) => (
                      <Link
                        key={r}
                        href={buildHref({ region: r })}
                        className={
                          region === r
                            ? 'rounded-xl bg-[#D4A574] px-3.5 py-2 text-sm font-medium text-white'
                            : 'rounded-xl border border-[rgba(212,165,116,0.25)] bg-white px-3.5 py-2 text-sm font-medium text-[#5D4E3A] hover:bg-[rgba(212,165,116,0.1)]'
                        }
                      >
                        {r}
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-medium text-[#5D4E3A]">法律领域</p>
                  <div className="flex flex-wrap gap-2">
                    {DOMAINS.map((d) => (
                      <Link
                        key={d.value}
                        href={buildHref({ domain: d.value })}
                        className={
                          domain === d.value
                            ? 'rounded-xl bg-[#D4A574] px-3.5 py-2 text-sm font-medium text-white'
                            : 'rounded-xl border border-[rgba(212,165,116,0.25)] bg-white px-3.5 py-2 text-sm font-medium text-[#5D4E3A] hover:bg-[rgba(212,165,116,0.1)]'
                        }
                      >
                        {d.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Lawyers */}
            <div className="card p-6">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[#D4A574]" />
                <h2 className="text-lg font-bold text-[#2C2416]">领域榜单 TOP 5</h2>
              </div>
              <p className="mt-1 text-sm text-[#5D4E3A]">
                {domain === 'all' ? '全部领域' : DOMAINS.find((d) => d.value === domain)?.label} ·{' '}
                {region === '全国' ? '全国' : region}
              </p>

              {loading ? (
                <div className="mt-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[rgba(212,165,116,0.2)]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-24 rounded bg-[rgba(212,165,116,0.1)]" />
                        <div className="h-3 w-16 rounded bg-[rgba(212,165,116,0.05)]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : topLawyers.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {topLawyers.map((lawyer, index) => (
                    <Link
                      key={lawyer.id}
                      href={`/lawyers/${encodeURIComponent(lawyer.id)}`}
                      className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[rgba(212,165,116,0.1)]"
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        index === 0 ? 'bg-[rgba(212,165,116,0.25)] text-[#D4A574]' :
                        index === 1 ? 'bg-[rgba(212,165,116,0.15)] text-[#5D4E3A]' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-[rgba(212,165,116,0.15)] text-[#9A8B78]'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="h-10 w-10 rounded-full bg-[rgba(212,165,116,0.15)] flex items-center justify-center text-[#D4A574]">
                        {lawyer.display_name?.[0] || '律'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[#2C2416] truncate">{lawyer.display_name}</p>
                          {lawyer.lawyer_verified ? <PracticeLawyerBadge className="!text-[11px]" /> : null}
                        </div>
                        <p className="text-xs text-[#5D4E3A]">{lawyer.follower_count || 0} 粉丝</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#9A8B78]" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-6 text-center text-sm text-[#9A8B78]">
                  暂无榜单数据
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Lawyer List */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#2C2416]">
              {domain === 'all' ? '全部领域' : DOMAINS.find((d) => d.value === domain)?.label}律师
              {region !== '全国' && ` · ${region}`}
              {total > 0 && <span className="ml-2 font-normal text-[#9A8B78]">({total} 位)</span>}
            </h2>
          </div>

          {loading ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-[rgba(212,165,116,0.2)]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 rounded bg-[rgba(212,165,116,0.2)]" />
                      <div className="h-3 w-16 rounded bg-[rgba(212,165,116,0.15)]" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-3 w-full rounded bg-[rgba(212,165,116,0.15)]" />
                    <div className="h-3 w-3/4 rounded bg-[rgba(212,165,116,0.15)]" />
                  </div>
                </div>
              ))}
            </div>
          ) : lawyers.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lawyers.map((lawyer) => (
                <article key={lawyer.id} className="card flex flex-col gap-4 p-6 group">
                  <Link href={`/lawyers/${encodeURIComponent(lawyer.id)}`} className="flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4A574] to-[#B8860B] text-2xl font-bold text-white">
                        {lawyer.display_name?.[0] || '律'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[#2C2416] truncate group-hover:text-[#D4A574] transition-colors">
                            {lawyer.display_name || lawyer.email}
                          </h3>
                          {lawyer.lawyer_verified ? <PracticeLawyerBadge /> : null}
                        </div>
                        <p className="mt-1 text-sm text-[#5D4E3A]">
                          {region === '全国' ? '全国执业' : region + '执业'}
                        </p>
                      </div>
                    </div>

                    {lawyer.bio && (
                      <p className="line-clamp-2 text-sm text-[#5D4E3A]">
                        {lawyer.bio}
                      </p>
                    )}
                  </Link>

                  <div className="mt-auto flex items-center justify-between pt-2 border-t border-[rgba(212,165,116,0.15)]">
                    <div className="flex items-center gap-3 text-xs text-[#9A8B78]">
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-[#D4A574] text-[#D4A574]" />
                        {lawyer.rating?.toFixed(1) || '5.0'}
                      </span>
                      <span>·</span>
                      <span>{lawyer.review_count || 0} 评价</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#9A8B78]">
                      <Users className="h-3.5 w-3.5" />
                      <span>{lawyer.follower_count || 0} 关注</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
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
                        setTopLawyers((prev) =>
                          prev.map((item) =>
                            String(item.id) === String(lawyer.id)
                              ? { ...item, follower_count: followerCount }
                              : item
                          )
                        )
                      }}
                      className="inline-flex h-9 items-center rounded-xl border border-[rgba(212,165,116,0.35)] px-3 text-xs font-semibold text-[#B8860B] transition hover:bg-[rgba(212,165,116,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <Link
                      href={`/lawyers/${encodeURIComponent(lawyer.id)}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-[rgba(212,165,116,0.25)] px-3 py-2 text-xs font-medium text-[#5D4E3A] transition-colors hover:border-[#D4A574] hover:text-[#D4A574]"
                    >
                      查看详情
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-12 text-center">
              <Scale className="mx-auto h-12 w-12 text-[#9A8B78]" />
              <p className="mt-4 text-[#9A8B78]">暂无符合条件的律师</p>
              <Link
                href="/find-lawyer"
                className="mt-4 inline-block text-sm text-[#D4A574] hover:underline"
              >
                查看全部律师
              </Link>
            </div>
          )}
        </section>

        {/* Note */}
        <div className="card p-6 bg-[rgba(212,165,116,0.06)]">
          <h3 className="font-semibold text-[#2C2416]">温馨提示</h3>
          <ul className="mt-3 space-y-1.5 text-sm text-[#5D4E3A]">
            <li>• 平台所有律师均经过实名认证</li>
            <li>• 建议通过智能体先与律师沟通，明确需求后再预约</li>
            <li>• 如遇问题，可联系平台客服协助</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
