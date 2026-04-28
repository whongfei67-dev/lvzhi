"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Eye, FileText, MapPin, Send, Upload, Briefcase } from "lucide-react";
import { ApiError, api, getSession, uploadFormFile, type Session } from "@/lib/api/client";
import type { Opportunity } from "@/lib/api/types";
import { formatPostPublishedAtDisplay, postPublishedAtIsoAttribute } from "@/lib/community-post-time";
import {
  getVirtualOpportunityBySlug,
  VIRTUAL_OPPORTUNITIES,
  type OpportunityRow,
} from "@/lib/opportunity-virtual";
import { guestUnlockCardSurfaceClassName } from "@/components/common/guest-gate";

/** 详情顶区：城市高楼天际线 */
const OPPORTUNITY_DETAIL_HERO_BG =
  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920&q=80";

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    job: "招聘",
    project: "项目",
    collaboration: "合作",
    service_offer: "服务",
  };
  return labels[type] || type;
}

function typeTagClass(type: string): string {
  const colors: Record<string, string> = {
    job: "bg-[rgba(212,165,116,0.12)] text-[#B8860B]",
    project: "bg-violet-50 text-violet-800",
    collaboration: "bg-[rgba(212,165,116,0.12)] text-[#D4A574]",
    service_offer: "bg-teal-50 text-teal-800",
  };
  return colors[type] || "bg-[rgba(212,165,116,0.12)] text-[#D4A574]";
}

function normalizeFromApi(raw: Record<string, unknown>): OpportunityRow {
  const publisher_name =
    (typeof raw.publisher_name === "string" && raw.publisher_name) ||
    (typeof raw.publisherName === "string" && raw.publisherName) ||
    undefined;
  const application_file_requirements =
    (typeof raw.application_file_requirements === "string" && raw.application_file_requirements) ||
    (typeof raw.applicationFileRequirements === "string" && raw.applicationFileRequirements) ||
    undefined;
  return { ...(raw as unknown as Opportunity), publisher_name, application_file_requirements };
}

function fileRequirementLines(text: string | undefined): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/\n+/)
    .map((s) => s.trim().replace(/^[-*•]\s*/, ""))
    .filter(Boolean);
}

function cooperationDemandText(opp: OpportunityRow): string {
  const parts = [opp.summary, opp.description].filter(Boolean) as string[];
  const text = parts.join("\n\n").trim();
  return text || "详见机会说明，欢迎发起合作投递沟通。";
}

function deadlineDisplay(iso?: string): string {
  if (!iso) return "未设置截止时间，长期开放合作投递。";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "未设置截止时间，长期开放合作投递。";
  return `请于 ${formatPostPublishedAtDisplay(iso)} 前完成合作投递。`;
}

export function OpportunityDetailPageContent() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const [opportunity, setOpportunity] = useState<OpportunityRow | null>(null);
  const [similarOpportunities, setSimilarOpportunities] = useState<OpportunityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyFile, setApplyFile] = useState<File | null>(null);
  const [applyMessage, setApplyMessage] = useState("");
  const [applyBusy, setApplyBusy] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyOk, setApplyOk] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSession().then(setSession).catch(() => setSession(null));
  }, []);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError("无效链接");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const virtual = getVirtualOpportunityBySlug(slug);
      try {
        const raw = await api.opportunities.get(slug);
        if (!cancelled && raw && typeof raw === "object" && "id" in raw) {
          setOpportunity(normalizeFromApi(raw as Record<string, unknown>));
          setLoading(false);
          return;
        }
      } catch {
        /* 走演示或错误 */
      }
      if (!cancelled && virtual) {
        setOpportunity(virtual);
        setLoading(false);
        return;
      }
      if (!cancelled) {
        setOpportunity(null);
        setError("未找到该机会或暂时无法加载");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!opportunity) {
      setSimilarOpportunities([]);
      return;
    }
    let cancelled = false;
    const sameTypeVirtual = VIRTUAL_OPPORTUNITIES.filter(
      (o) => o.opportunity_type === opportunity.opportunity_type && o.id !== opportunity.id
    );
    const otherVirtual = VIRTUAL_OPPORTUNITIES.filter((o) => o.id !== opportunity.id);

    (async () => {
      try {
        const res = await api.opportunities.list({
          page: 1,
          limit: 12,
          type: opportunity.opportunity_type,
        });
        const items = (res.items as unknown as Record<string, unknown>[])
          .map((raw) => normalizeFromApi(raw))
          .filter((o) => o.id !== opportunity.id)
          .slice(0, 5);
        if (cancelled) return;
        if (items.length > 0) {
          setSimilarOpportunities(items);
          return;
        }
        if (sameTypeVirtual.length > 0) {
          setSimilarOpportunities(sameTypeVirtual.slice(0, 5));
          return;
        }
        setSimilarOpportunities(otherVirtual.slice(0, 5));
      } catch {
        if (!cancelled) {
          setSimilarOpportunities(
            (sameTypeVirtual.length > 0 ? sameTypeVirtual : otherVirtual).slice(0, 5)
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [opportunity?.id, opportunity?.opportunity_type]);

  const publishedLabel = useMemo(
    () => (opportunity ? formatPostPublishedAtDisplay(opportunity.created_at) : "—"),
    [opportunity]
  );

  const publisher = opportunity?.publisher_name || "匿名发布";
  const publisherInitial = publisher.slice(0, 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0]">
        <div className="mx-auto max-w-6xl px-6 py-28 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 rounded bg-[rgba(212,165,116,0.15)]" />
            <div className="h-12 w-3/4 rounded bg-[rgba(212,165,116,0.15)]" />
            <div className="h-64 rounded-2xl bg-[rgba(212,165,116,0.1)]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF8F0] px-6">
        <div className="text-center">
          <Briefcase className="mx-auto h-12 w-12 text-[#9A8B78]" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold text-[#2C2416]">无法打开该机会</h2>
          <p className="mt-2 text-sm text-[#5D4E3A]">{error || "请返回列表重试"}</p>
          <Link
            href="/opportunities"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[#D4A574] hover:text-[#B8860B]"
          >
            <ArrowLeft className="h-4 w-4" />
            返回合作机会
          </Link>
        </div>
      </div>
    );
  }

  const demand = cooperationDemandText(opportunity);
  const fileReqLines = fileRequirementLines(opportunity.application_file_requirements);

  const loginHref = `/login?next=${encodeURIComponent(`/opportunities/${slug}`)}`;
  const isVirtualOpp = opportunity.id.startsWith("virtual-");
  const submitTargetId = opportunity.slug || opportunity.id;
  const isPublisher =
    Boolean(session?.id && opportunity.publisher_id && session.id === opportunity.publisher_id);

  const primaryCtaClass =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4A574] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#B8860B] disabled:cursor-not-allowed disabled:opacity-60";

  const renderApplySection = () => (
    <div className="space-y-3">
      {applyOk ? (
        <div className="rounded-xl border border-[rgba(212,165,116,0.3)] bg-[rgba(212,165,116,0.08)] px-4 py-3 text-sm text-[#5C4033]">
          <p className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#D4A574]" aria-hidden />
            投递成功，材料已同步至发布方的客户工作台。
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#9A8B78]">
            发布方可在「工作台 → 机会投递」查看与下载文件，并会收到一条通知。
          </p>
        </div>
      ) : !applyOpen ? (
        <>
          {!session ? (
            <Link href={loginHref} className={primaryCtaClass}>
              <Send className="h-4 w-4 shrink-0" aria-hidden />
              登录后合作投递
            </Link>
          ) : isPublisher ? (
            <Link
              href="/workspace/opportunity-applications"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(212,165,116,0.35)] bg-[rgba(255,255,255,0.45)] px-6 py-3.5 text-sm font-semibold text-[#5C4033] transition-colors hover:border-[#D4A574] hover:text-[#D4A574]"
            >
              查看我收到的投递
            </Link>
          ) : isVirtualOpp ? (
            <button type="button" disabled className={`${primaryCtaClass} opacity-55`}>
              <Send className="h-4 w-4 shrink-0" aria-hidden />
              演示机会无法真实投递
            </button>
          ) : (
            <button
              type="button"
              className={primaryCtaClass}
              onClick={() => {
                setApplyOpen(true);
                setApplyError(null);
              }}
            >
              <Send className="h-4 w-4 shrink-0" aria-hidden />
              合作投递
            </button>
          )}
        </>
      ) : (
        <div className="space-y-3 rounded-xl border border-[rgba(212,165,116,0.28)] bg-[rgba(255,255,255,0.35)] p-4 backdrop-blur-sm">
          <p className="text-xs text-[#9A8B78]">上传 PDF、Word 或图片（与平台上传接口一致，单文件最大 50MB）</p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,image/jpeg,image/png,image/gif,image/webp"
            onChange={(e) => setApplyFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[rgba(212,165,116,0.45)] bg-[rgba(255,255,255,0.5)] px-4 py-6 text-sm text-[#5D4E3A] transition-colors hover:border-[#D4A574] hover:bg-[rgba(212,165,116,0.06)]"
          >
            <Upload className="h-6 w-6 text-[#D4A574]" aria-hidden />
            <span className="font-medium text-[#2C2416]">{applyFile ? applyFile.name : "点击选择投递文件"}</span>
            <span className="text-xs text-[#9A8B78]">选择后点击下方按钮上传并送达发布方工作台</span>
          </button>
          <textarea
            value={applyMessage}
            onChange={(e) => setApplyMessage(e.target.value)}
            rows={3}
            placeholder="选填：补充说明（如团队介绍、可对接时间）"
            className="w-full resize-none rounded-xl border border-[rgba(212,165,116,0.25)] bg-white/80 px-3 py-2 text-sm text-[#2C2416] placeholder:text-[#9A8B78] focus:border-[#D4A574] focus:outline-none focus:ring-2 focus:ring-[#D4A574]/15"
          />
          {applyError ? <p className="text-sm text-red-600">{applyError}</p> : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={applyBusy}
              className={`${primaryCtaClass} sm:flex-1`}
              onClick={async () => {
                if (!applyFile) {
                  setApplyError("请先选择要上传的文件");
                  return;
                }
                setApplyBusy(true);
                setApplyError(null);
                try {
                  const up = await uploadFormFile(applyFile);
                  await api.opportunities.submitApplication(submitTargetId, {
                    file_url: up.url,
                    original_name: up.original_name,
                    message: applyMessage.trim() || undefined,
                    uploaded_file_id: up.id || undefined,
                  });
                  setApplyOk(true);
                  setApplyOpen(false);
                  setApplyFile(null);
                  setApplyMessage("");
                } catch (err) {
                  setApplyError(err instanceof ApiError ? err.message : "提交失败，请稍后重试");
                } finally {
                  setApplyBusy(false);
                }
              }}
            >
              {applyBusy ? "上传并提交中…" : "上传并提交投递"}
            </button>
            <button
              type="button"
              disabled={applyBusy}
              className="rounded-xl border border-[rgba(212,165,116,0.35)] px-4 py-3 text-sm font-medium text-[#5D4E3A] transition-colors hover:bg-[rgba(212,165,116,0.08)] disabled:opacity-50 sm:shrink-0"
              onClick={() => {
                setApplyOpen(false);
                setApplyFile(null);
                setApplyError(null);
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[11.5rem] overflow-hidden sm:h-[13rem] lg:h-[14.5rem]"
          aria-hidden
        >
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.82] saturate-[0.9] contrast-[0.96]"
            style={{ backgroundImage: `url(${OPPORTUNITY_DETAIL_HERO_BG})` }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255,252,247,0.88) 0%, rgba(255,248,240,0.42) 45%, rgba(255,248,240,0) 72%)",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-16 sm:h-20 lg:h-24" aria-hidden>
            <div
              className="absolute inset-0 shadow-[inset_0_-2rem_2.5rem_-0.5rem_rgba(255,248,240,0.5)]"
              style={{
                background:
                  "linear-gradient(to bottom, transparent 0%, rgba(255,248,240,0.18) 22%, rgba(255,248,240,0.5) 48%, #FFF8F0 82%, #FFF8F0 100%)",
              }}
            />
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-28 sm:pt-32 lg:px-8 lg:pb-20 lg:pt-36">
          <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
            <div className="min-w-0 space-y-8 lg:col-span-2">
              <article
                className={`relative rounded-2xl border border-[rgba(212,165,116,0.25)] marketing-cream-card-surface p-8 transition-all hover:border-[#D4A574] hover:shadow-md ${guestUnlockCardSurfaceClassName}`}
              >
                <Link
                  href="/opportunities"
                  className="absolute right-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-[rgba(212,165,116,0.35)] bg-white/95 px-3 py-1.5 text-xs font-medium text-[#5D4E3A] shadow-sm backdrop-blur-sm transition-colors hover:border-[#D4A574] hover:text-[#5C4033] sm:right-6 sm:top-6 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                >
                  <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                  返回机会列表
                </Link>

                <header className="mb-8 min-w-0 border-b border-[rgba(212,165,116,0.2)] pb-8 pr-24 sm:pr-44">
                  <div className="mb-4 flex flex-wrap gap-2">
                    <span className={`tag text-xs font-medium ${typeTagClass(opportunity.opportunity_type)}`}>
                      {typeLabel(opportunity.opportunity_type)}
                    </span>
                    {opportunity.is_featured ? (
                      <span className="tag text-xs font-medium border-[rgba(212,165,116,0.35)] bg-[rgba(212,165,116,0.08)] text-[#B8860B]">
                        精选
                      </span>
                    ) : null}
                  </div>

                  <h1 className="text-xl font-bold leading-snug tracking-tight text-[#2C2416] sm:text-2xl lg:text-[1.65rem]">
                    主题：{opportunity.title}
                  </h1>

                  <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-[#5D4E3A]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-[#9A8B78]">发布人</span>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(212,165,116,0.15)] text-sm font-bold text-[#D4A574]">
                        {publisherInitial}
                      </div>
                      <span className="font-medium text-[#2C2416]">{publisher}</span>
                    </div>
                    {opportunity.location ? (
                      <span className="inline-flex items-center gap-1.5 text-[#9A8B78]">
                        <MapPin className="h-4 w-4 shrink-0 text-[#D4A574]" aria-hidden />
                        {opportunity.location}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1.5 text-[#9A8B78]">
                      <Eye className="h-4 w-4 shrink-0 text-[#D4A574]" aria-hidden />
                      {opportunity.view_count ?? 0} 次浏览
                    </span>
                  </div>

                  <div className="mt-6 rounded-xl border border-[rgba(212,165,116,0.22)] bg-[rgba(255,255,255,0.38)] px-4 py-3 text-sm backdrop-blur-[2px]">
                    <p className="text-xs font-medium text-[#9A8B78]">投递时间</p>
                    <p className="mt-1 text-[#5D4E3A]">{deadlineDisplay(opportunity.deadline)}</p>
                    <p className="mt-2 text-xs text-[#9A8B78]">
                      发布于{" "}
                      <time dateTime={postPublishedAtIsoAttribute(opportunity.created_at)} className="tabular-nums text-[#5D4E3A]">
                        {publishedLabel}
                      </time>
                    </p>
                  </div>
                </header>

                <section className="space-y-4">
                  <h2 className="text-lg font-semibold text-[#2C2416]">合作需求</h2>
                  <div className="prose prose-sm max-w-none text-[#5D4E3A]">
                    <p className="whitespace-pre-wrap leading-relaxed">{demand}</p>
                  </div>
                  {typeof opportunity.budget === "number" ? (
                    <p className="text-sm text-[#9A8B78]">
                      预算参考：<span className="font-semibold text-[#D4A574]">¥{opportunity.budget.toLocaleString()}</span>
                      （具体可协商）
                    </p>
                  ) : null}
                </section>

                <section className="mt-10 space-y-4 border-t border-[rgba(212,165,116,0.15)] pt-10">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 shrink-0 text-[#D4A574]" aria-hidden />
                    <h2 className="text-lg font-semibold text-[#2C2416]">投递文件要求</h2>
                  </div>
                  {fileReqLines.length > 0 ? (
                    <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#5D4E3A] marker:text-[#D4A574]">
                      {fileReqLines.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm leading-relaxed text-[#5D4E3A]">
                      发布方暂未填写专项文件要求。合作投递建议附上团队/个人简介、相关案例或业绩材料；涉及资质类岗位可补充执业证明等扫描件（PDF
                      优先，单文件建议不超过 20MB）。
                    </p>
                  )}
                </section>

                <div className="mt-10 border-t border-[rgba(212,165,116,0.15)] pt-8 lg:hidden">{renderApplySection()}</div>
              </article>
            </div>

            <aside className="lg:col-span-1">
              <div
                className={`rounded-2xl border border-[rgba(212,165,116,0.25)] marketing-cream-card-surface p-6 transition-all hover:border-[#D4A574] hover:shadow-md ${guestUnlockCardSurfaceClassName}`}
              >
                <h3 className="text-sm font-semibold text-[#2C2416]">机会概览</h3>
                <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-xl bg-[rgba(212,165,116,0.08)] py-3">
                    <p className="text-xl font-bold text-[#D4A574]">{opportunity.application_count ?? 0}</p>
                    <p className="text-xs text-[#5D4E3A]">合作投递</p>
                  </div>
                  <div className="rounded-xl bg-[rgba(212,165,116,0.08)] py-3">
                    <p className="text-xl font-bold text-[#D4A574]">{opportunity.view_count ?? 0}</p>
                    <p className="text-xs text-[#5D4E3A]">浏览</p>
                  </div>
                </div>
                <div className="mt-6 hidden lg:block">{renderApplySection()}</div>
                <p className="mt-4 text-center text-xs text-[#9A8B78]">
                  投递需登录；文件经平台上传后写入发布方「机会投递」列表并推送通知。
                </p>

                <div className="mt-6 border-t border-[rgba(212,165,116,0.18)] pt-6">
                  <h3 className="text-sm font-semibold text-[#2C2416]">其他类似机会</h3>
                  <p className="mt-1 text-xs text-[#9A8B78]">与当前机会同类型，便于横向对比</p>
                  {similarOpportunities.length > 0 ? (
                    <ul className="mt-4 space-y-2">
                      {similarOpportunities.map((o) => (
                        <li key={o.id}>
                          <Link
                            href={`/opportunities/${o.slug || o.id}`}
                            className="block rounded-xl border border-[rgba(212,165,116,0.22)] bg-[rgba(255,255,255,0.35)] px-3 py-2.5 backdrop-blur-[2px] transition-colors hover:border-[rgba(212,165,116,0.45)] hover:bg-[rgba(255,255,255,0.55)]"
                          >
                            <p className="line-clamp-2 text-sm font-medium leading-snug text-[#2C2416]">{o.title}</p>
                            <p className="mt-1 text-xs text-[#9A8B78]">
                              {typeLabel(o.opportunity_type)}
                              {o.location ? ` · ${o.location}` : ""}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-[#9A8B78]">暂无同类型推荐，可前往列表浏览全部机会。</p>
                  )}
                </div>

                <div className="mt-6 border-t border-[rgba(212,165,116,0.18)] pt-6">
                  <h3 className="text-sm font-semibold text-[#2C2416]">更多机会</h3>
                  <p className="mt-2 text-sm text-[#5D4E3A]">在列表中筛选类型与地区，发现下一单合作。</p>
                  <Link
                    href="/opportunities"
                    className="mt-4 inline-flex text-sm font-medium text-[#D4A574] hover:text-[#B8860B]"
                  >
                    浏览全部机会 →
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
