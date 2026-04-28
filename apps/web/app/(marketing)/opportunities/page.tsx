'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { api, getSession, type Session } from '@/lib/api/client'
import { VIRTUAL_OPPORTUNITIES, type OpportunityRow } from '@/lib/opportunity-virtual'
import {
  buildOpportunityQuickApplyMessage,
  OPPORTUNITY_TEXT_ONLY_FILE_URL,
} from '@/lib/opportunity-quick-apply'
import { ChevronDown, ChevronUp, Search, MapPin, Briefcase, Plus, SendHorizontal } from 'lucide-react'
import { preferTradForKeShiLu } from '@/lib/keshilu-text'
import {
  GuestMarketingUnlockContentVeil,
  GuestMarketingUnlockViewportCta,
  guestUnlockCardSurfaceClassName,
} from '@/components/common/guest-gate'

/**
 * 合作机会首页 — 对齐《律植项目蓝图 v6.4》§6、§17.4（子页面口号 §1.0）
 * 视觉方向：琥珀咖啡色系 + 思源宋体
 */

const HERO_IMAGE = "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1920&q=80"

const CATEGORIES = [
  { value: '', label: '全部' },
  { value: 'job', label: '招聘' },
  { value: 'project', label: '项目' },
  { value: 'collaboration', label: '合作' },
  { value: 'service_offer', label: '服务' },
]

const LOCATIONS = [
  { value: '', label: '全部' },
  { value: '北京', label: '北京' },
  { value: '上海', label: '上海' },
  { value: '深圳', label: '深圳' },
  { value: '广州', label: '广州' },
  { value: '杭州', label: '杭州' },
  { value: '成都', label: '成都' },
  { value: '远程', label: '远程' },
]
/** 单页从接口拉取的最大条数（与下方可视区滚动配合） */
const OPPORTUNITY_PAGE_LIMIT = 15
/** 列表可视区内最多同时展示的机会卡片数量 */
const OPPORTUNITY_VISIBLE_MAX = 15

function formatPublishTime(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso.slice(0, 10)
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' })
  } catch {
    return iso.slice(0, 10)
  }
}

function OpportunityListCard({
  opp,
  isLoggedIn,
  sessionUserId,
  canSubmitApplication,
}: {
  opp: OpportunityRow
  isLoggedIn: boolean
  sessionUserId: string | null
  canSubmitApplication: boolean
}) {
  const href = `/opportunities/${opp.slug || opp.id}`
  const typeLabel: Record<string, string> = {
    job: '招聘',
    project: '项目',
    collaboration: '合作',
    service_offer: '服务',
  }
  const typeColor = 'bg-[rgba(212,165,116,0.15)] text-[#D4A574]'
  const demand = opp.summary || opp.description || '详见机会说明。'
  const publisher = opp.publisher_name || '匿名发布'

  const isVirtual = String(opp.id).startsWith('virtual-')
  const isSelf = Boolean(sessionUserId && opp.publisher_id === sessionUserId)
  const canQuickApply = Boolean(
    canSubmitApplication &&
      isLoggedIn &&
      sessionUserId &&
      !isVirtual &&
      !isSelf,
  )

  const [applyOpen, setApplyOpen] = useState(false)
  const [applyMessage, setApplyMessage] = useState('')
  const [prefillLoading, setPrefillLoading] = useState(false)
  const [sendLoading, setSendLoading] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [applyDone, setApplyDone] = useState(false)

  const submitTarget = opp.slug || opp.id

  const openApply = useCallback(async () => {
    if (!canQuickApply || !sessionUserId) return
    setApplyOpen(true)
    setApplyError(null)
    setApplyDone(false)
    setPrefillLoading(true)
    setApplyMessage('')
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const detailUrl = origin ? `${origin}${href}` : href
    try {
      const me = await api.users.getProfile(sessionUserId)
      setApplyMessage(
        buildOpportunityQuickApplyMessage({
          opportunityTitle: opp.title,
          publisherName: publisher,
          detailUrl,
          me,
        }),
      )
    } catch {
      setApplyMessage(
        buildOpportunityQuickApplyMessage({
          opportunityTitle: opp.title,
          publisherName: publisher,
          detailUrl,
          me: {},
        }),
      )
    } finally {
      setPrefillLoading(false)
    }
  }, [canQuickApply, href, opp.title, publisher, sessionUserId])

  const sendDisabled = useMemo(
    () => prefillLoading || sendLoading || !applyMessage.trim(),
    [applyMessage, prefillLoading, sendLoading],
  )

  const sendApplication = useCallback(async () => {
    if (!canQuickApply) return
    setSendLoading(true)
    setApplyError(null)
    try {
      await api.opportunities.submitApplication(submitTarget, {
        file_url: OPPORTUNITY_TEXT_ONLY_FILE_URL,
        original_name: '（机会正文一键投递）',
        message: applyMessage.trim(),
      })
      setApplyDone(true)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '发送失败，请稍后再试'
      setApplyError(msg)
    } finally {
      setSendLoading(false)
    }
  }, [applyMessage, canQuickApply, submitTarget])

  useEffect(() => {
    if (!applyOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [applyOpen])

  const applyModal =
    applyOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(44,36,22,0.35)] p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`opp-apply-title-${opp.id}`}
            onClick={() => setApplyOpen(false)}
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-[rgba(212,165,116,0.35)] bg-[rgba(255,252,247,0.98)] p-5 shadow-[0_12px_40px_-18px_rgba(44,36,22,0.35)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 id={`opp-apply-title-${opp.id}`} className="text-base font-semibold text-[#2C2416]">
                    确认投递内容
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-[#6E5A44]">
                    已根据工作台个人资料预填正文；你可修改后再发送。确认后通过合作机会投递链路写入发布方工作台「机会投递」，并同步通知。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setApplyOpen(false)}
                  className="shrink-0 rounded-lg px-2 py-1 text-sm text-[#6E5A44] hover:bg-[rgba(212,165,116,0.12)]"
                >
                  关闭
                </button>
              </div>

              <div className="mt-3 rounded-xl border border-[rgba(212,165,116,0.22)] bg-white/70 p-3 text-xs text-[#5D4E3A]">
                <div className="font-medium text-[#5C4033]">投递对象</div>
                <div className="mt-1 truncate">
                  {publisher} · 「{opp.title}」
                </div>
              </div>

              <label className="mt-4 block text-xs font-medium text-[#9A8B78]" htmlFor={`opp-apply-msg-${opp.id}`}>
                投递正文
              </label>
              <textarea
                id={`opp-apply-msg-${opp.id}`}
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                rows={10}
                disabled={prefillLoading}
                className="mt-2 w-full resize-y rounded-xl border border-[rgba(212,165,116,0.28)] bg-white px-3 py-2 text-sm leading-relaxed text-[#2C2416] outline-none focus:border-[#D4A574] focus:ring-2 focus:ring-[#D4A574]/20 disabled:opacity-60"
              />

              {prefillLoading ? (
                <p className="mt-2 text-xs text-[#9A8B78]">正在读取工作台资料并生成正文…</p>
              ) : null}
              {applyError ? <p className="mt-2 text-xs text-red-700">{applyError}</p> : null}
              {applyDone ? (
                <p className="mt-2 text-xs font-medium text-[#2C7A4B]">
                  已送达：发布方可在工作台「机会投递」查看，并会收到通知提醒。
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setApplyOpen(false)}
                  className="rounded-xl border border-[rgba(212,165,116,0.28)] bg-white px-4 py-2 text-sm font-semibold text-[#5D4E3A] hover:border-[#D4A574]"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={sendDisabled || applyDone}
                  onClick={() => void sendApplication()}
                  className="rounded-xl bg-[#5C4033] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8B7355] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sendLoading ? '发送中…' : applyDone ? '已发送' : '确认发送'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <div
      className={`marketing-inspiration-skill-card !rounded-[20px] group relative flex gap-2 overflow-hidden p-3 ${guestUnlockCardSurfaceClassName}`}
    >
      <Link href={href} className="relative z-0 min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <span className={`tag text-[11px] ${typeColor}`}>{typeLabel[opp.opportunity_type] || opp.opportunity_type}</span>
          {opp.is_featured ? (
            <span className="tag border-[rgba(212,165,116,0.35)] bg-[rgba(212,165,116,0.08)] text-[11px] text-[#B8860B]">
              精选
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(212,165,116,0.1)] px-2 py-0.5 text-[11px] tabular-nums text-[#9A8B78]">
            <span className="text-[#5D4E3A]">发布时间 {formatPublishTime(opp.created_at)}</span>
          </span>
          {opp.location ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(212,165,116,0.22)] bg-[rgba(255,248,240,0.66)] px-2 py-0.5 text-[11px] text-[#6E5A44]">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              {opp.location}
            </span>
          ) : null}
        </div>

        <div className="mt-1 flex min-w-0 items-center gap-3 text-[11px] text-[#5D4E3A]">
          <span className="shrink-0 text-xs text-[#5D4E3A]">{publisher}</span>
          <h3 className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#2C2416] transition-colors duration-200 group-hover:text-[#B8860B]">
            {opp.title}
          </h3>
          <span className="shrink-0 text-[11px] text-[#9A8B78]">{opp.view_count ?? 0} 浏览</span>
          <span className="shrink-0 text-[11px] text-[#5D4E3A]">
            投递 <strong className="font-semibold text-[#5C4033]">{opp.application_count ?? 0}</strong>
          </span>
        </div>

        <p className="mt-1 line-clamp-1 text-[11px] leading-relaxed text-[#5D4E3A]">
          <span className="font-medium text-[#5C4033]">需求：</span>
          {demand}
        </p>
      </Link>

      <div className="relative z-[2] flex shrink-0 flex-col items-stretch justify-center border-l border-[rgba(212,165,116,0.18)] pl-2">
        {!isLoggedIn ? (
          <Link
            href={`/login?next=${encodeURIComponent('/opportunities')}`}
            className="inline-flex h-full min-h-[4.5rem] w-10 flex-col items-center justify-center gap-1 rounded-lg border border-[rgba(212,165,116,0.35)] bg-[rgba(255,251,244,0.85)] px-1 py-2 text-[11px] font-semibold text-[#5C4033] transition hover:border-[#D4A574] hover:text-[#B8860B]"
            title="登录后可一键投递"
          >
            <SendHorizontal className="h-4 w-4 shrink-0 text-[#D4A574]" aria-hidden />
            <span className="text-[10px] leading-tight" style={{ writingMode: 'vertical-rl' }}>
              登录投递
            </span>
          </Link>
        ) : isVirtual ? (
          <button
            type="button"
            disabled
            className="inline-flex h-full min-h-[4.5rem] w-10 cursor-not-allowed flex-col items-center justify-center gap-1 rounded-lg border border-[rgba(212,165,116,0.18)] bg-[rgba(255,251,244,0.55)] px-1 py-2 text-[11px] font-semibold text-[#9A8B78] opacity-70"
            title="示例机会不支持真实投递"
          >
            <SendHorizontal className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-[10px] leading-tight" style={{ writingMode: 'vertical-rl' }}>
              投递
            </span>
          </button>
        ) : isSelf ? (
          <button
            type="button"
            disabled
            className="inline-flex h-full min-h-[4.5rem] w-10 cursor-not-allowed flex-col items-center justify-center gap-1 rounded-lg border border-[rgba(212,165,116,0.18)] bg-[rgba(255,251,244,0.55)] px-1 py-2 text-[11px] font-semibold text-[#9A8B78] opacity-70"
            title="不能投递自己发布的机会"
          >
            <SendHorizontal className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-[10px] leading-tight" style={{ writingMode: 'vertical-rl' }}>
              投递
            </span>
          </button>
        ) : !canSubmitApplication ? (
          <button
            type="button"
            disabled
            className="inline-flex h-full min-h-[4.5rem] w-10 cursor-not-allowed flex-col items-center justify-center gap-1 rounded-lg border border-[rgba(212,165,116,0.18)] bg-[rgba(255,251,244,0.55)] px-1 py-2 text-[11px] font-semibold text-[#9A8B78] opacity-70"
            title="当前账号类型不支持机会投递，请使用客户或创作者账号登录"
          >
            <SendHorizontal className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-[10px] leading-tight" style={{ writingMode: 'vertical-rl' }}>
              投递
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void openApply()
            }}
            className="inline-flex h-full min-h-[4.5rem] w-10 flex-col items-center justify-center gap-1 rounded-lg border border-[rgba(212,165,116,0.38)] bg-[rgba(255,251,244,0.95)] px-1 py-2 text-[11px] font-semibold text-[#5C4033] shadow-sm transition hover:border-[#D4A574] hover:text-[#B8860B]"
            title="一键正文投递（预填工作台介绍，进入对方机会投递）"
          >
            <SendHorizontal className="h-4 w-4 shrink-0 text-[#D4A574]" aria-hidden />
            <span className="text-[10px] leading-tight" style={{ writingMode: 'vertical-rl' }}>
              投递
            </span>
          </button>
        )}
      </div>

      {applyModal}
    </div>
  )
}

export const dynamic = 'force-dynamic'

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<OpportunityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [session, setSession] = useState<Session | null>(null)
  const listScrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    getSession().then(setSession).catch(() => setSession(null))
  }, [])

  useEffect(() => {
    fetchOpportunities()
  }, [selectedCategory, selectedLocation, searchQuery, page])

  const fetchOpportunities = async () => {
    setLoading(true)

    try {
      const result = await api.opportunities.list({
        page,
        limit: OPPORTUNITY_PAGE_LIMIT,
        type: selectedCategory || undefined,
        city: selectedLocation || undefined,
        search: searchQuery || undefined,
      })

      const items = (result.items as unknown as Record<string, unknown>[]).map((raw) => {
        const o = raw as unknown as OpportunityRow
        return {
          ...o,
          publisher_name:
            o.publisher_name ??
            (typeof raw.publisher_name === 'string' ? raw.publisher_name : undefined) ??
            (typeof raw.publisher === 'string' ? raw.publisher : undefined),
        } as OpportunityRow
      })
      setOpportunities(items)
      setTotalPages(Math.ceil(result.total / OPPORTUNITY_PAGE_LIMIT))
    } catch (err) {
      console.error('获取机会列表失败:', err)
      setOpportunities([])
    } finally {
      setLoading(false)
    }
  }

  /** 仅未登录游客浏览时插入示例卡；已登录（含 visitor）只展示接口数据，避免示例卡占位导致「投递」全灰无法测链路 */
  const listRows = useMemo(() => {
    const seen = new Set<string>()
    const merged: OpportunityRow[] = []
    if (page === 1) {
      const seeds = !session ? [...VIRTUAL_OPPORTUNITIES] : []
      for (const row of [...seeds, ...opportunities]) {
        if (seen.has(row.id)) continue
        seen.add(row.id)
        merged.push(row)
      }
    } else {
      for (const row of opportunities) {
        if (seen.has(row.id)) continue
        seen.add(row.id)
        merged.push(row)
      }
    }
    return merged.slice(0, OPPORTUNITY_VISIBLE_MAX)
  }, [page, opportunities, session])

  const isLoggedIn = Boolean(session)
  /** 投递接口仅允许 client/creator（与后端 authorize 一致）；visitor 视为未开通投递能力 */
  const canSubmitOpportunityApplication = Boolean(
    session && session.role !== 'visitor',
  )

  const scrollListBy = (distance: number) => {
    listScrollRef.current?.scrollBy({ top: distance, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen marketing-page-shell-tint">
      {/* Hero */}
      <section
        className="page-header marketing-hero--inspiration-scale relative overflow-hidden"
        style={{ position: 'relative' }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 0,
            overflow: 'hidden'
          }}
        >
          <img
            src={HERO_IMAGE}
            alt="合作机会背景"
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
            <h1 className="hero-title hero-title--single-brush-line">
              {preferTradForKeShiLu('法技相逢 以技为桥')}
            </h1>
            <p lang="zh-CN" className="marketing-hero-subtitle-serif marketing-subtitle--kai max-w-3xl">
              以技结缘，以信合作，赴一场专业之约
            </p>

            <form
              className="hero-search-box"
              onSubmit={(e) => {
                e.preventDefault()
                setPage(1)
              }}
            >
              <Search className="text-[#9A8B78]" aria-hidden />
              <input
                type="search"
                name="opportunities-q"
                placeholder="搜索机会..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                className="text-[#2C2416]"
              />
            </form>
          </div>
        </div>
      </section>

      {/* 筛选区域 */}
      <section className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
        {/* 类型筛选 */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-[#5D4E3A]">类型:</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  setSelectedCategory(cat.value)
                  setPage(1)
                }}
                className={`tag-border transition-all ${
                  selectedCategory === cat.value
                    ? 'border-[#D4A574] bg-[rgba(212,165,116,0.15)] text-[#D4A574]'
                    : ''
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 地区筛选 */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-[#5D4E3A]">地区:</span>
          <div className="flex flex-wrap gap-2">
            {LOCATIONS.map((loc) => (
              <button
                key={loc.value}
                onClick={() => {
                  setSelectedLocation(loc.value)
                  setPage(1)
                }}
                className={`tag-border transition-all ${
                  selectedLocation === loc.value
                    ? 'border-[#D4A574] bg-[rgba(212,165,116,0.15)] text-[#D4A574]'
                    : ''
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 机会列表 + 发布机会 CTA：未登录时整块透明遮罩与解锁卡片 */}
      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <div className={!session ? 'select-none saturate-[0.99]' : ''}>
          <section className="py-8">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-[rgba(212,165,116,0.15)] marketing-cream-card-surface p-3">
                    <div className="h-3 w-1/3 rounded bg-[rgba(212,165,116,0.12)]" />
                    <div className="mt-3 h-4 w-2/3 rounded bg-[rgba(212,165,116,0.1)]" />
                    <div className="mt-2 h-3 w-full rounded bg-[rgba(212,165,116,0.06)]" />
                  </div>
                ))}
              </div>
            ) : listRows.length === 0 ? (
              <div className="rounded-2xl border border-[rgba(212,165,116,0.25)] marketing-cream-card-surface p-12 text-center shadow-[0_4px_14px_rgba(92,64,51,0.1)]">
                <Briefcase className="mx-auto h-12 w-12 text-[#9A8B78]" />
                <h3 className="mt-4 text-lg font-semibold text-[#2C2416]">暂无机会</h3>
                <p className="mt-2 text-sm text-[#5D4E3A]">试试调整筛选条件或稍后再来</p>
              </div>
            ) : (
              <>
                <div className="relative">
                  <div
                    ref={listScrollRef}
                    className={`relative overflow-y-auto py-2 pl-1 pr-[4.75rem] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
                      isLoggedIn
                        ? 'max-h-[min(68vh,560px)]'
                        : 'h-[min(68vh,560px)] max-h-[min(68vh,560px)] overflow-x-hidden'
                    }`}
                  >
                    <div className={isLoggedIn ? 'relative' : 'relative min-h-full'}>
                      <div className="space-y-2">
                        {listRows.map((opp) => (
                          <OpportunityListCard
                            key={opp.id}
                            opp={opp}
                            isLoggedIn={isLoggedIn}
                            sessionUserId={session?.id ?? null}
                            canSubmitApplication={canSubmitOpportunityApplication}
                          />
                        ))}
                      </div>
                      <div aria-hidden className="h-6" />
                      {!isLoggedIn ? <GuestMarketingUnlockContentVeil /> : null}
                    </div>
                    {!isLoggedIn ? (
                      <GuestMarketingUnlockViewportCta
                        ariaLabel={preferTradForKeShiLu('登录后解锁查看更多机会')}
                        title={preferTradForKeShiLu('登录后解锁查看更多机会')}
                        subtitle="登录后即可浏览完整列表与翻页、查看详情、发起合作投递，并使用下方发布入口。"
                        loginHref={`/login?next=${encodeURIComponent('/opportunities')}`}
                      />
                    ) : null}
                  </div>
                  <div className="absolute right-2 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2">
                    <button
                      type="button"
                      aria-label="向上滚动机会列表"
                      onClick={() => scrollListBy(-360)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(212,165,116,0.38)] bg-[rgba(255,251,244,0.95)] text-[#8A6C4D] shadow-sm transition hover:border-[#D4A574] hover:text-[#5C4033]"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="向下滚动机会列表"
                      onClick={() => scrollListBy(360)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(212,165,116,0.38)] bg-[rgba(255,251,244,0.95)] text-[#8A6C4D] shadow-sm transition hover:border-[#D4A574] hover:text-[#5C4033]"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {totalPages > 1 ? (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-lg border border-[rgba(212,165,116,0.25)] marketing-cream-card-surface px-4 py-2 text-sm font-medium text-[#5D4E3A] hover:bg-[rgba(212,165,116,0.1)] hover:text-[#D4A574] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      上一页
                    </button>
                    <span className="px-4 py-2 text-sm text-[#5D4E3A]">
                      第 {page} / {totalPages} 页
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="rounded-lg border border-[rgba(212,165,116,0.25)] marketing-cream-card-surface px-4 py-2 text-sm font-medium text-[#5D4E3A] hover:bg-[rgba(212,165,116,0.1)] hover:text-[#D4A574] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      下一页
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </section>

          <section className="pb-16">
            <div className={`card p-6 bg-[rgba(212,165,116,0.06)] ${guestUnlockCardSurfaceClassName}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[rgba(212,165,116,0.15)]">
                    <Briefcase className="h-6 w-6 text-[#D4A574]" aria-hidden />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#2C2416]">发布机会</h2>
                    <p className="text-sm text-[#5D4E3A]">让更多法律人才看到你的机会</p>
                  </div>
                </div>
                <Link href={isLoggedIn ? '/opportunities/create' : '/login?next=/opportunities/create'} className="btn-slide primary inline-flex shrink-0 items-center justify-center gap-2 self-start sm:self-auto">
                  <Plus className="h-4 w-4" aria-hidden />
                  立即发布
                </Link>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  )
}
