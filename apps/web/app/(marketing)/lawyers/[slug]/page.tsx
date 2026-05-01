"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { GuestGate } from "@/components/common/guest-gate";
import { ReportCornerButton } from "@/components/common/report-corner-button";
import { api, getSession } from "@/lib/api/client";
import {
  Award,
  Book,
  Briefcase,
  Check,
  ChevronRight,
  FileText,
  Library,
  MapPin,
  MessageSquare,
  Phone,
  User,
  Users,
} from "lucide-react";
import {
  buildLawyerDetailView,
  HERO_BG,
  type LawyerDetailView,
  type LawyerEducationItem,
  type LawyerReviewItem,
} from "@/lib/lawyer-detail-view";

/** 与「工作背景」列表同一套字号、间距与分隔线；副标题按换行拆成第二、三行 */
function EducationListWorkStyle({ education }: { education: LawyerEducationItem[] }) {
  return (
    <ul className="space-y-5">
      {education.map((edu, i) => {
        const trimmed = edu.sub?.trim() ?? "";
        const nl = trimmed.indexOf("\n");
        const line2 = nl >= 0 ? trimmed.slice(0, nl).trim() : trimmed;
        const line3 = nl >= 0 ? trimmed.slice(nl + 1).trim() : "";
        return (
          <li
            key={i}
            className="border-b border-[rgba(212,165,116,0.15)] pb-4 last:border-0 last:pb-0"
          >
            <p className="text-sm font-semibold text-[#2C2416]">{edu.title}</p>
            {line2 ? <p className="mt-1 text-xs text-[#D4A574]">{line2}</p> : null}
            {line3 ? <p className="mt-1 text-xs text-[#9A8B78]">{line3}</p> : null}
            {edu.emblemUrl ? (
              <p className="mt-2 flex items-center gap-2 text-sm leading-relaxed text-[#5D4E3A]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={edu.emblemUrl}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-[rgba(212,165,116,0.35)]"
                />
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function segmentSlug(raw: string | string[] | undefined): string {
  if (raw == null) return "";
  return Array.isArray(raw) ? (raw[0] ?? "") : raw;
}

function isUuidSlug(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.trim());
}

/** 未登录半遮罩；登录后跳转留言登记表单 */
function LawyerMessageCta({ slug }: { slug: string }) {
  const [loggedIn, setLoggedIn] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { getSession } = await import("@/lib/api/client");
        const s = await getSession();
        if (!cancelled) setLoggedIn(!!s);
      } catch {
        if (!cancelled) setLoggedIn(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!slug) {
    return <div className="h-[46px] w-full animate-pulse rounded-xl bg-[rgba(212,165,116,0.15)]" />;
  }

  const messagePath = `/lawyers/${slug}/message`;

  if (loggedIn === undefined) {
    return <div className="h-[46px] w-full animate-pulse rounded-xl bg-[rgba(212,165,116,0.15)]" />;
  }

  if (!loggedIn) {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none opacity-[0.38]">
          <span className="flex w-full items-center justify-center rounded-xl bg-[#5C4033] py-3 text-sm font-semibold text-white">
            我要留言
          </span>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-xl bg-white/70 px-3 py-2 text-center backdrop-blur-[3px]">
          <p className="text-[11px] leading-snug text-[#5D4E3A]">
            登录后填写留言，系统将把你的留言推送给该律师
          </p>
          <Link
            href={`/login?returnUrl=${encodeURIComponent(messagePath)}`}
            className="text-xs font-semibold text-[#5C4033] underline decoration-[#D4A574] decoration-2 underline-offset-2 hover:text-[#B8860B]"
          >
            登录解锁
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={messagePath}
      className="flex w-full items-center justify-center rounded-xl bg-[#5C4033] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8B7355]"
    >
      我要留言
    </Link>
  );
}

function LawyerReviewComposer({ slug, onCreated }: { slug: string; onCreated: () => void }) {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getSession();
        if (!cancelled) setLoggedIn(Boolean(s));
      } catch {
        if (!cancelled) setLoggedIn(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async () => {
    const text = content.trim();
    if (!text) {
      setErr("请填写评价内容");
      return;
    }
    setSubmitting(true);
    setErr("");
    try {
      await api.lawyers.createReview(slug, { rating, content: text, tags: [] });
      setContent("");
      onCreated();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (!loggedIn) {
    return (
      <p className="mb-4 text-xs text-[#9A8B78]">
        登录后可发表真实评价。
      </p>
    );
  }

  return (
    <div className="mb-5 rounded-xl border border-[rgba(212,165,116,0.2)] bg-[rgba(255,248,240,0.6)] p-3">
      <div className="mb-2 flex items-center gap-2">
        <label className="text-xs text-[#6B5B4D]">评分</label>
        <select
          value={rating}
          onChange={(e) => setRating(Math.max(1, Math.min(5, Number(e.target.value) || 5)))}
          className="rounded border border-[rgba(212,165,116,0.35)] bg-white px-2 py-1 text-xs text-[#5C4033]"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} 星
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="写下你的真实评价（2-1000字）"
        className="w-full rounded-lg border border-[rgba(212,165,116,0.25)] bg-white px-3 py-2 text-sm text-[#5D4E3A] outline-none focus:border-[#D4A574]"
      />
      {err ? <p className="mt-1 text-xs text-[#b35a5a]">{err}</p> : null}
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="rounded-lg bg-[#D4A574] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#B8860B] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "提交中..." : "提交评价"}
        </button>
      </div>
    </div>
  );
}

export default function LawyerDetailPage() {
  const routeParams = useParams<{ slug?: string | string[] }>();
  const slug = segmentSlug(routeParams?.slug);

  const [view, setView] = useState<LawyerDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [missingProfile, setMissingProfile] = useState(false);
  const [reviewsVersion, setReviewsVersion] = useState(0);

  useEffect(() => {
    let gen = 0;
    const run = async (myGen: number) => {
      setLoading(true);
      setMissingProfile(false);
      let apiRow: Record<string, unknown> | null = null;
      let reviewRows: LawyerReviewItem[] | null = null;
      let reviewTotal: number | null = null;
      try {
        if (slug) {
          try {
            apiRow = (await api.lawyers.get(slug)) as Record<string, unknown>;
          } catch {
            apiRow = null;
          }

          // Fallback: if lawyer detail lookup misses by UUID, build from creator profile data.
          if (!apiRow && isUuidSlug(slug)) {
            try {
              const profile = (await api.users.getProfile(slug)) as Record<string, unknown>;
              if (String(profile.role || "").toLowerCase() === "creator") {
                apiRow = {
                  ...profile,
                  name: profile.display_name ?? profile.name,
                  avatar: profile.avatar_url ?? profile.avatar,
                  law_firm: profile.law_firm ?? profile.firm,
                };
              }
            } catch {
              // keep null
            }
          }

          const reviewRes = await api.lawyers.getReviews(slug, { page: 1, limit: 50 });
          reviewRows = (reviewRes.items || []).map((item, idx) => ({
            id: String(item.id || `review-${idx}`),
            author: String(item.reviewer_name || "匿名用户"),
            rating: Number(item.rating || 5),
            date: String(item.created_at || new Date().toISOString()).slice(0, 10),
            body: String(item.content || ""),
            tags: Array.isArray(item.tags) ? item.tags.map((x) => String(x)) : [],
            avatarUrl: String(item.reviewer_avatar || "https://i.pravatar.cc/40"),
          }));
          reviewTotal = Number(reviewRes.total || reviewRows.length);
        }
      } catch {
        // 保底：详情失败才置空；评价失败不影响详情渲染
        if (!apiRow) apiRow = null;
      }
      if (myGen !== gen) return;
      if (!apiRow && isUuidSlug(slug)) {
        setView(null);
        setMissingProfile(true);
        setLoading(false);
        return;
      }
      const nextView = buildLawyerDetailView(slug, apiRow);
      if (reviewRows) {
        nextView.reviews = reviewRows;
        nextView.reviewCount = reviewTotal ?? reviewRows.length;
      }
      setView(nextView);
      setLoading(false);
    };
    run(gen);
    const onVis = () => {
      if (document.visibilityState !== "visible" || !slug) return;
      gen += 1;
      run(gen);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      gen += 1;
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [slug, reviewsVersion]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-64 rounded-lg bg-[rgba(212,165,116,0.15)]" />
            <div className="h-48 rounded-2xl bg-[rgba(212,165,116,0.12)]" />
            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <div className="h-96 rounded-2xl bg-[rgba(212,165,116,0.1)]" />
              <div className="h-72 rounded-2xl bg-[rgba(212,165,116,0.1)]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (missingProfile || !view) {
    return (
      <div className="min-h-screen bg-[#FFF8F0]">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold text-[#2C2416]">未找到该律师档案</h1>
            <p className="mt-3 text-sm text-[#5D4E3A]">
              该链接对应的律师可能已下线，或不在当前可展示名单中。
            </p>
            <Link
              href="/lawyers"
              className="mt-6 inline-flex items-center rounded-xl border border-[rgba(212,165,116,0.35)] px-4 py-2 text-sm font-medium text-[#5C4033] hover:border-[#D4A574] hover:text-[#D4A574]"
            >
              返回律师列表
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-16">
      {/* Hero — 明亮会议室背景；与营销 layout 叠放，透明顶栏透出 */}
      <section className="relative overflow-hidden bg-[#E8DDD0] pb-10">
        <div className="pointer-events-none absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_BG}
            alt=""
            className="h-full w-full object-cover opacity-[0.66]"
          />
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#F7EEE6]/58 via-[#EFE4D7]/46 to-[#E6D5C4]/36"
            aria-hidden
          />
          <div className="marketing-hero-fade-cream" aria-hidden />
        </div>

        <div className="relative z-[2] mx-auto max-w-6xl px-6 pb-10 pt-20 md:pt-24 lg:px-8">
          <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-start">
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={view.avatarUrl}
                alt={view.name}
                className="h-[140px] w-[140px] rounded-3xl border-[3px] border-[#D4A574] object-cover shadow-xl"
              />
              {view.verified && (
                <div className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-[#3d2d24] bg-[#D4A574] text-white">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 text-center lg:text-left">
              <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <h1 className="font-serif text-2xl font-bold tracking-wide text-[#2C2416] md:text-3xl">
                  {view.name}
                </h1>
              </div>

              <p className="mt-2 flex items-center justify-center gap-2 text-sm text-[#6B5B4D] lg:justify-start">
                <Briefcase className="h-4 w-4 shrink-0 text-[#D4A574]" />
                {view.titleLine}
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-5 text-sm text-[#6B5B4D] lg:justify-start">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#D4A574]" />
                  {view.city}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-[#D4A574]" />
                  执业 {view.practiceYears} 年
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-[#D4A574]" />
                  服务 {view.clientsLabel}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <span className="shrink-0 text-sm text-[#6B5B4D]">擅长领域：</span>
                {view.tagLabels.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[rgba(212,165,116,0.35)] bg-white/80 px-3 py-1 text-xs text-[#5D4E3A] transition-colors hover:bg-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-5">
            <article className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-7 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-[#5C4033]">
                <User className="h-[18px] w-[18px] text-[#D4A574]" />
                个人简介
              </h2>
              {view.bio.map((p, i) => (
                <p key={i} className="text-[0.9375rem] leading-[1.9] text-[#5D4E3A]">
                  {p}
                </p>
              ))}
            </article>

            <article className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-7 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-[#5C4033]">
                <FileText className="h-[18px] w-[18px] text-[#D4A574]" />
                代表性案例
              </h2>
              <ul className="space-y-5">
                {view.cases.map((c, i) => (
                  <li
                    key={i}
                    className="border-l-2 border-[#D4A574] pl-4"
                  >
                    <p className="font-semibold text-[#2C2416]">{c.title}</p>
                    <p className="mt-1 text-xs font-medium text-[#B8860B]">{c.role}</p>
                    <p className="mt-2 text-sm leading-relaxed text-[#5D4E3A]">{c.summary}</p>
                  </li>
                ))}
              </ul>
            </article>

            <section className="relative overflow-hidden rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white shadow-sm md:min-h-[300px]">
              {/* 桌面：悬停工作背景区域（含划入后的教育层）时，教育从右侧划入 */}
              <div className="group relative hidden md:block md:min-h-[300px] md:overflow-hidden">
                <div className="relative z-10 bg-[#FFFCF7] p-7 pr-6">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#5C4033]">
                    <Briefcase className="h-5 w-5 text-[#D4A574]" />
                    工作背景
                  </h2>
                  <ul className="space-y-5">
                    {view.workHistory.map((w, i) => (
                      <li key={i} className="border-b border-[rgba(212,165,116,0.15)] pb-4 last:border-0 last:pb-0">
                        <p className="text-sm font-semibold text-[#2C2416]">{w.title}</p>
                        <p className="mt-1 text-xs text-[#D4A574]">{w.org}</p>
                        <p className="mt-1 text-xs text-[#9A8B78]">{w.period}</p>
                        <p className="mt-2 text-sm leading-relaxed text-[#5D4E3A]">{w.summary}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pointer-events-none absolute inset-0 z-20 translate-x-full bg-[#FFFCF7] transition-transform duration-500 ease-out group-hover:translate-x-0">
                  <div className="pointer-events-auto h-full overflow-y-auto p-7 pr-6">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#5C4033]">
                      <Book className="h-5 w-5 text-[#D4A574]" />
                      教育背景
                    </h2>
                    <EducationListWorkStyle education={view.education} />
                  </div>
                </div>
              </div>

              {/* 移动端：上下排列，无悬停动效 */}
              <div className="md:hidden">
                <div className="border-b border-[rgba(212,165,116,0.2)] bg-[#FFFCF7] p-7">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#5C4033]">
                    <Briefcase className="h-5 w-5 text-[#D4A574]" />
                    工作背景
                  </h2>
                  <ul className="space-y-4">
                    {view.workHistory.map((w, i) => (
                      <li key={i}>
                        <p className="text-sm font-semibold text-[#2C2416]">{w.title}</p>
                        <p className="mt-0.5 text-xs text-[#D4A574]">{w.org}</p>
                        <p className="text-xs text-[#9A8B78]">{w.period}</p>
                        <p className="mt-2 text-sm text-[#5D4E3A]">{w.summary}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t border-[rgba(212,165,116,0.2)] bg-[#FFFCF7] p-7">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#5C4033]">
                    <Book className="h-5 w-5 text-[#D4A574]" />
                    教育背景
                  </h2>
                  <EducationListWorkStyle education={view.education} />
                </div>
              </div>
            </section>

            <GuestGate
              action="查看用户评价"
              mode="hidden"
              description="登录后可查看该律师的完整用户评价与互动记录"
            >
              <article className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-7 shadow-sm">
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="flex flex-wrap items-center gap-2 font-semibold text-[#5C4033]">
                    <MessageSquare className="h-[18px] w-[18px] text-[#D4A574]" />
                    用户评价
                    <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs font-semibold text-[#B8860B]">
                      {view.reviewCount}
                    </span>
                  </h2>
                  <div className="flex gap-1 rounded-lg bg-[rgba(212,165,116,0.08)] p-1 text-sm">
                    <button
                      type="button"
                      className="rounded-md bg-white px-3 py-1.5 font-medium text-[#5C4033] shadow-sm"
                    >
                      最新
                    </button>
                    <button
                      type="button"
                      className="rounded-md px-3 py-1.5 font-medium text-[#5D4E3A] transition-colors hover:text-[#5C4033]"
                    >
                      最有价值
                    </button>
                  </div>
                </div>
                <LawyerReviewComposer
                  slug={slug}
                  onCreated={() => setReviewsVersion((v) => v + 1)}
                />

                <ul className="divide-y divide-[rgba(212,165,116,0.1)]">
                  {view.reviews.map((rev) => (
                    <li key={rev.id} className="flex gap-3.5 py-5 first:pt-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={rev.avatarUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[0.9375rem] font-semibold text-[#2C2416]">{rev.author}</span>
                          {rev.peerVerified && (
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#D4A574]">
                              <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                            </span>
                          )}
                          <span className="text-xs text-[#9A8B78]">{rev.date}</span>
                        </div>
                        <p className="mt-2 text-[0.9375rem] leading-relaxed text-[#5D4E3A]">{rev.body}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {rev.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-md bg-[rgba(212,165,116,0.1)] px-2 py-0.5 text-xs text-[#9A8B78]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </li>
                  ))}
                  {!view.reviews.length ? (
                    <li className="py-4 text-sm text-[#9A8B78]">暂无用户评价。</li>
                  ) : null}
                </ul>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    className="rounded-lg border border-[rgba(212,165,116,0.35)] px-8 py-2.5 text-sm font-medium text-[#5C4033] transition-colors hover:border-[#D4A574] hover:text-[#D4A574]"
                  >
                    查看全部 {view.reviewCount} 条评价
                  </button>
                </div>
              </article>
            </GuestGate>
          </div>

          <aside className="h-fit space-y-5 lg:sticky lg:top-24">
            <div className="rounded-[20px] border border-[rgba(212,165,116,0.25)] bg-white p-7 shadow-sm">
              <div className="mb-5 grid grid-cols-3 gap-2 text-center sm:gap-3">
                {view.sidebarStats.map((s) => (
                  <div key={s.label} className="min-w-0">
                    <p
                      className="truncate text-lg font-bold text-[#5C4033] md:text-xl"
                      title={s.value}
                    >
                      {s.value}
                    </p>
                    <p className="mt-1 text-xs text-[#9A8B78]">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-7 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-[#5C4033]">
                <FileText className="h-[18px] w-[18px] text-[#D4A574]" />
                实务文章
              </h3>
              <ul className="space-y-4">
                {view.sidebarArticles.map((a, i) => (
                  <li key={i} className="border-b border-[rgba(212,165,116,0.12)] pb-4 last:border-0 last:pb-0">
                    <Link href={a.href} className="group block">
                      <p className="line-clamp-2 text-sm font-medium leading-snug text-[#2C2416] transition-colors group-hover:text-[#B8860B]">
                        {a.title}
                      </p>
                      {a.date ? (
                        <p className="mt-1.5 text-xs text-[#9A8B78]">{a.date}</p>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-7 shadow-sm">
              <h3 className="mb-1 flex items-center gap-2 font-semibold text-[#5C4033]">
                <Library className="h-[18px] w-[18px] text-[#D4A574]" />
                法律技能库
              </h3>
              <p className="mb-4 text-xs leading-relaxed text-[#9A8B78]">
                律师作为创作者在平台发布的 Skills 与法律产品
              </p>
              <ul className="space-y-3">
                {view.sidebarSkills.map((sk, i) => (
                  <li key={i}>
                    <Link
                      href={sk.href}
                      className="group flex items-start gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-[rgba(212,165,116,0.08)]"
                    >
                      <span
                        className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          sk.kind === "product"
                            ? "bg-[rgba(184,134,11,0.18)] text-[#8B6914]"
                            : "bg-[rgba(212,165,116,0.2)] text-[#5C4033]"
                        }`}
                      >
                        {sk.kind === "product" ? "产品" : "Skill"}
                      </span>
                      <span className="min-w-0 flex-1 text-sm leading-snug text-[#5D4E3A] group-hover:text-[#5C4033]">
                        {sk.title}
                      </span>
                    </Link>
                  </li>
                ))}
                {!view.sidebarSkills.length ? (
                  <li className="text-sm text-[#9A8B78]">暂无已发布的法律技能或产品。</li>
                ) : null}
              </ul>
            </div>

            <div className="rounded-[20px] border border-[rgba(212,165,116,0.25)] bg-white p-7 shadow-sm">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#2C2416]">
                <MapPin className="h-4 w-4 shrink-0 text-[#D4A574]" />
                律所地址
              </p>
              <p className="text-sm leading-relaxed text-[#5D4E3A]">{view.firmAddress}</p>

              <div className="mt-6 border-t border-[rgba(212,165,116,0.2)] pt-5">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#2C2416]">
                  <Phone className="h-3.5 w-3.5 text-[#D4A574]" />
                  执业机构座机
                </p>
                <p className="text-base font-medium tracking-wide text-[#5D4E3A]">{view.firmLandline}</p>
                <p className="mt-2 text-xs leading-relaxed text-[#9A8B78]">
                  由律师执业机构登记；个人直线或手机等可在登录后通过平台向律师发起联系获取。
                </p>
              </div>
            </div>

            <div className="rounded-[20px] border border-[rgba(212,165,116,0.25)] bg-white p-7 shadow-sm">
              <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#5C4033]">
                <MessageSquare className="h-[17px] w-[17px] text-[#D4A574]" />
                我要留言
              </h3>
              <p className="mb-4 text-xs leading-relaxed text-[#9A8B78]">
                未登录为半锁定预览；登录后可填写留言并由系统推送给律师。
              </p>
              <LawyerMessageCta slug={slug} />
            </div>

            <Link
              href="/lawyers"
              className="flex items-center justify-center gap-1 rounded-xl border border-[rgba(212,165,116,0.25)] bg-white py-3 text-sm font-medium text-[#5D4E3A] transition-colors hover:border-[#D4A574] hover:text-[#D4A574]"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              返回律师列表
            </Link>
            <div className="flex justify-end">
              <ReportCornerButton
                targetType="creator_profile"
                targetId={String(view.id || "").trim()}
                cornerLabel="举报此律师"
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
