'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronDown, ChevronUp, Search, Star } from 'lucide-react'
import {
  GuestMarketingUnlockContentVeil,
  GuestMarketingUnlockViewportCta,
} from '@/components/common/guest-gate'
import { PracticeLawyerBadge } from '@/components/common/practice-lawyer-badge'
import { preferTradForKeShiLu } from '@/lib/keshilu-text'
import {
  type InspirationDemoProduct,
} from '@/lib/inspiration-demo-items'
import { PRACTICE_TAGS, categoryMatchesPracticeTag } from '@/lib/inspiration-practice-tags'
import { getSession } from '@/lib/api/client'

/**
 * 灵感广场 — 对齐《律植项目蓝图 v6.4》§4、§17.2（子页面口号 §1.0）
 * 视觉方向：琥珀咖啡色系 + 思源宋体
 */

const HERO_IMAGE = "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=1920&q=80"

/** 列表排序（单选） */
const SORT_OPTIONS = [
  { id: 'default' as const, label: '综合推荐' },
  { id: 'reviews' as const, label: '好评最多' },
  { id: 'published' as const, label: '最新发布' },
]

type SortId = (typeof SORT_OPTIONS)[number]['id']

type PromotionConfig = {
  inspiration_skill_ids?: string[]
}

function formatGoodReviewCount(n: number): string {
  if (n >= 10000) return `${Math.round(n / 1000) / 10}万`
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

function formatPublishedDate(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' })
  } catch {
    return ''
  }
}

function InspirationProductCard({
  item,
  index,
  featured = false,
}: {
  item: InspirationDemoProduct
  index: number
  featured?: boolean
}) {
  return (
    <Link
      href={`/inspiration/${item.id}`}
      className={`marketing-inspiration-skill-card group relative block overflow-hidden focus-within:ring-2 focus-within:ring-[#D4A574]/50 focus-within:ring-offset-2 focus-within:ring-offset-[#FFF8F0] animate-fade-in-up ${
        featured ? 'p-5' : 'p-4'
      }`}
      style={{ animationDelay: `${index * 70}ms`, animationFillMode: 'both' }}
    >
      <div className="relative z-0 flex min-h-[196px] flex-col">
        <h3
          className={`font-semibold leading-snug text-[#2C2416] transition-colors duration-200 group-hover:text-[#B8860B] line-clamp-2 ${
            featured ? 'text-[1.02rem]' : 'text-[0.95rem]'
          }`}
        >
          {item.title}
        </h3>

        <div className="mt-3 flex min-w-0 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.authorAvatar}
            alt=""
            className="h-8 w-8 shrink-0 rounded-full object-cover shadow-sm ring-2 ring-white ring-[rgba(212,165,116,0.3)]"
          />
          <span className="min-w-0 inline-flex items-center gap-1.5 truncate text-[13px] font-medium text-[#5D4E3A]">
            <span className="truncate">{item.author}</span>
            {item.authorIsLawyer ? <PracticeLawyerBadge className="!text-[10px]" /> : null}
          </span>
          {item.authorVerified ? (
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#D4A574] text-white"
              title="认证创作者"
            >
              <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex flex-col gap-2.5 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[12px]">
            <span className="text-[#9A8B78]">
              {item.category}
              <span className="text-[#C4B5A0]"> · </span>
              <span className="text-[#9A8B78]">{formatGoodReviewCount(item.goodReviewCount)} 好评</span>
              <span className="text-[#C4B5A0]"> · </span>
              <span className="text-[#9A8B78]">{item.stats}</span>
              <span className="text-[#C4B5A0]"> · </span>
              <span className="text-[#9A8B78]">发布 {formatPublishedDate(item.publishedAt)}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="flex items-center gap-0.5 font-medium text-[#D4A574]">
                <Star className="h-3.5 w-3.5 fill-[#D4A574] text-[#D4A574]" aria-hidden />
                {item.rating}
              </span>
              <span className={`font-semibold ${item.price === '免费' ? 'text-[#D4A574]' : 'text-[#5C4033]'}`}>
                {item.price}
              </span>
            </span>
          </div>

          <div className="rounded-xl border border-[rgba(212,165,116,0.2)] bg-[rgba(255,248,240,0.76)] px-3 py-2">
            <p className="text-xs font-medium leading-relaxed text-[#5C4033]">精选评价</p>
            <p className="mt-1 text-xs leading-relaxed text-[#5D4E3A] line-clamp-2">&ldquo;{item.reviewExcerpt}&rdquo;</p>
            <p className="mt-1.5 text-[11px] text-[#9A8B78]">—— {item.reviewReviewer}</p>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-10 flex translate-x-full items-center bg-[linear-gradient(120deg,rgba(255,252,247,0.98)_0%,rgba(255,248,240,0.99)_55%,rgba(255,248,240,0.98)_100%)] px-5 py-5 opacity-0 shadow-[inset_0_0_0_1px_rgba(212,165,116,0.22)] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:pointer-events-auto group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-x-0 group-focus-within:opacity-100"
        aria-hidden
      >
        <div className="max-h-full overflow-y-auto pr-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#D4A574]">产品简介</p>
          <p className="mt-2 text-sm leading-relaxed text-[#5D4E3A]">{item.description}</p>
        </div>
      </div>
    </Link>
  )
}

export default function InspirationPage() {
  const [items, setItems] = useState<InspirationDemoProduct[]>([])
  const [itemsLoading, setItemsLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  /** 法律业务类型筛选 */
  const [practiceTag, setPracticeTag] = useState('all')
  /** 列表排序 */
  const [sortId, setSortId] = useState<SortId>('default')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [promotionSkillIds, setPromotionSkillIds] = useState<string[]>([])
  const listScrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    async function checkLoginStatus() {
      try {
        const session = await getSession()
        setIsLoggedIn(!!session)
      } catch {
        setIsLoggedIn(false)
      }
    }
    checkLoginStatus()
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/proxy/promotion-config', { credentials: 'include' })
        const payload = (await res.json().catch(() => ({}))) as { code?: number; data?: PromotionConfig }
        if (cancelled) return
        if (payload.code === 0) {
          const ids = Array.isArray(payload.data?.inspiration_skill_ids)
            ? payload.data?.inspiration_skill_ids.map((item) => String(item)).filter(Boolean)
            : []
          setPromotionSkillIds(ids)
        }
      } catch {
        if (!cancelled) setPromotionSkillIds([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setItemsLoading(true)
        const res = await fetch('/api/proxy/skills?page=1&limit=240', { credentials: 'include' })
        const payload = (await res.json().catch(() => ({}))) as {
          code?: number
          data?: { items?: Record<string, unknown>[] }
        }
        const rows = payload?.code === 0 ? (payload?.data?.items ?? []) : []
        const mapped: InspirationDemoProduct[] = rows.map((row) => {
          const id = String(row.id ?? '')
          const title = String(row.title ?? row.name ?? '未命名作品')
          const author = String(row.creator_name ?? '平台创作者')
          const authorAvatar = String(row.creator_avatar ?? `https://i.pravatar.cc/96?u=${encodeURIComponent(id || title)}`)
          const category = String((row as Record<string, unknown>).category ?? '通用')
          const createdAt = String((row as Record<string, unknown>).created_at ?? new Date().toISOString())
          const rating = Number((row as Record<string, unknown>).rating ?? 0) || 4.6
          const downloads = Number((row as Record<string, unknown>).download_count ?? 0)
          const favorites = Number((row as Record<string, unknown>).favorite_count ?? 0)
          const views = Number((row as Record<string, unknown>).view_count ?? 0)
          const priceNum = Number((row as Record<string, unknown>).price ?? 0)
          const priceType = String((row as Record<string, unknown>).price_type ?? '')
          const isFree = priceType === 'free' || !Number.isFinite(priceNum) || priceNum <= 0
          const creatorIsLawyer =
            Boolean((row as Record<string, unknown>).creator_lawyer_verified) ||
            String((row as Record<string, unknown>).creator_level ?? '').toLowerCase() === 'lawyer'
          return {
            id,
            title,
            author,
            authorAvatar,
            authorVerified: Boolean(row.creator_verified),
            authorIsLawyer: creatorIsLawyer,
            lawyerSlug: '',
            creatorRegisteredAt: createdAt,
            category,
            rating,
            goodReviewCount: favorites || downloads || views,
            publishedAt: createdAt,
            stats: `${Math.max(downloads, 0)} 下载`,
            price: isFree ? '免费' : `¥${priceNum}`,
            featured: Boolean((row as Record<string, unknown>).is_featured),
            description: String((row as Record<string, unknown>).summary ?? (row as Record<string, unknown>).description ?? '已通过平台审核，欢迎体验。'),
            reviewExcerpt: '已通过平台审核，欢迎体验。',
            reviewReviewer: '平台用户',
          }
        })
        if (!cancelled) setItems(mapped)
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setItemsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const { filteredItems, matchedTotal } = useMemo(() => {
    const merged = [...items]
    const byKey = new Map<string, InspirationDemoProduct>()
    for (const item of merged) {
      const key = String(item.id || item.title).trim()
      if (!key) continue
      if (!byKey.has(key)) byKey.set(key, item)
    }
    const list = Array.from(byKey.values()).filter((item) => {
      if (!categoryMatchesPracticeTag(item.category, practiceTag)) return false
      if (searchValue && !item.title.toLowerCase().includes(searchValue.toLowerCase())) return false
      return true
    })

    const sorted = [...list]
    const t = (a: InspirationDemoProduct, b: InspirationDemoProduct) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()

    if (sortId === 'reviews') {
      sorted.sort((a, b) => b.goodReviewCount - a.goodReviewCount || t(a, b))
    } else if (sortId === 'published') {
      sorted.sort(t)
    } else {
      sorted.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1
        return t(a, b)
      })
    }
    return {
      filteredItems: sorted,
      matchedTotal: sorted.length,
    }
  }, [items, practiceTag, searchValue, sortId])

  const featuredItems = useMemo(() => {
    const merged = [...items]
    const byId = new Map<string, InspirationDemoProduct>()
    for (const item of merged) {
      const key = String(item.id || '').trim()
      if (!key || byId.has(key)) continue
      byId.set(key, item)
    }
    const mapped = promotionSkillIds
      .map((id) => byId.get(String(id)))
      .filter((item): item is InspirationDemoProduct => Boolean(item))
    if (mapped.length > 0) {
      return mapped.slice(0, 6)
    }
    return merged.filter((item) => item.featured).slice(0, 6)
  }, [items, promotionSkillIds])

  const scrollListBy = (distance: number) => {
    listScrollRef.current?.scrollBy({ top: distance, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen marketing-inspiration-index-shell">
      <section className="page-header marketing-hero--inspiration-scale relative overflow-hidden">
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            overflow: 'hidden',
          }}
        >
          <img
            src={HERO_IMAGE}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="relative z-[2] mx-auto w-full max-w-6xl px-6 lg:px-8">
          <div className="page-header-content animate-fade-in-up">
            <h1 className="hero-title">{preferTradForKeShiLu('法思撷趣 技生繁花')}</h1>
            <p className="page-desc marketing-subtitle--kai">
              每一份专业灵感，都能在这里遇见回响
            </p>

            <div className="search-box mb-2 max-w-xl">
              <Search className="text-[#9A8B78]" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="搜索作品标题…"
                className="text-[#2C2416]"
              />
            </div>
            <p className="text-xs leading-relaxed text-[#9A8B78]">
              业务类型筛选与排序在下方「灵感精选」区域生效，可与搜索关键词叠加使用。
            </p>
          </div>
        </div>
      </section>

      {featuredItems.length > 0 ? (
        <section
          className="relative"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,248,240,0.05) 0%, rgba(212,165,116,0.07) 38%, rgba(212,165,116,0.1) 62%, rgba(255,248,240,0.28) 100%)',
          }}
        >
          <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-[#D4A574]" />
              <h2 className="text-lg font-semibold text-[#D4A574]">精选推荐</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {featuredItems.map((item, i) => (
                <InspirationProductCard key={item.id} item={item} index={i} featured />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section
        className="mx-auto max-w-6xl px-6 py-10 lg:px-8"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,248,240,0.35) 0%, rgba(255,248,240,0.08) 18%, transparent 42%)',
        }}
      >
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-[#5C4033]">灵感精选</h2>
              <p className="mt-1 text-xs leading-relaxed text-[#9A8B78]">
                {itemsLoading ? '加载中…' : `当前筛选共 ${matchedTotal} 条，已在本区全量展示。`}
              </p>
            </div>
            <Link
              href="/inspiration/featured"
              className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg border border-[rgba(212,165,116,0.35)] bg-white px-3 py-1.5 text-xs font-medium text-[#8A6C4D] transition-colors hover:border-[#D4A574] hover:text-[#5C4033]"
            >
              查看更多
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-[rgba(212,165,116,0.2)] bg-[rgba(255,255,255,0.65)] px-4 py-3 sm:px-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
              <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[#B8860B]">
                业务类型
              </span>
              <div className="flex flex-wrap gap-2">
                {PRACTICE_TAGS.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setPracticeTag(tag.id)}
                    aria-pressed={practiceTag === tag.id}
                    className={`tag-border cursor-pointer text-sm transition-all ${
                      practiceTag === tag.id
                        ? 'active border-[#D4A574] bg-[rgba(212,165,116,0.15)] text-[#D4A574]'
                        : 'text-[#5D4E3A]'
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-[rgba(212,165,116,0.22)] to-transparent" />
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
              <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[#B8860B]">
                排序
              </span>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSortId(opt.id)}
                    aria-pressed={sortId === opt.id}
                    className={`tag-border cursor-pointer text-sm transition-all ${
                      sortId === opt.id
                        ? 'active border-[#D4A574] bg-[rgba(212,165,116,0.15)] text-[#D4A574]'
                        : 'text-[#5D4E3A]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="relative">
          <div
            ref={listScrollRef}
            className={`relative overflow-y-auto pr-[4.75rem] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
              isLoggedIn
                ? 'max-h-[74vh] sm:max-h-[78vh]'
                : 'h-[74vh] max-h-[74vh] overflow-x-hidden sm:h-[78vh] sm:max-h-[78vh]'
            }`}
          >
            {/*
              游客态：内层与整块网格同高，遮罩 absolute inset-0 盖住全部卡片（随内容变高），
              避免仅罩视口导致滚到底部露出卡片。CTA 单独叠在滚动视口上居中。
            */}
            <div className={isLoggedIn ? 'relative' : 'relative min-h-full'}>
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredItems.map((item, i) => (
                  <InspirationProductCard key={item.id} item={item} index={i} />
                ))}
              </div>
              {!isLoggedIn ? <GuestMarketingUnlockContentVeil /> : null}
            </div>
            {!isLoggedIn ? (
              <GuestMarketingUnlockViewportCta
                ariaLabel={preferTradForKeShiLu('登录后解锁更多精选技能')}
                title={preferTradForKeShiLu('登录后解锁更多精选技能')}
                subtitle="收藏、购买、评论等需要登录后操作"
              />
            ) : null}
          </div>
          <div className="absolute right-2 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2">
            <button
              type="button"
              aria-label="向上滚动灵感精选"
              onClick={() => scrollListBy(-420)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(212,165,116,0.38)] bg-[rgba(255,251,244,0.95)] text-[#8A6C4D] shadow-sm transition hover:border-[#D4A574] hover:text-[#5C4033]"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="向下滚动灵感精选"
              onClick={() => scrollListBy(420)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(212,165,116,0.38)] bg-[rgba(255,251,244,0.95)] text-[#8A6C4D] shadow-sm transition hover:border-[#D4A574] hover:text-[#5C4033]"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
