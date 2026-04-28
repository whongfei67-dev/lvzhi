"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Award,
  Briefcase,
  Building2,
  Check,
  ChevronRight,
  Cpu,
  FileText,
  MapPin,
  Users,
} from "lucide-react";
import { HERO_BG, type LawyerCaseItem } from "@/lib/lawyer-detail-view";
import { buildFirmDetailView, type FirmDetailView } from "@/lib/firm-detail-view";

function segmentSlug(raw: string | string[] | undefined): string {
  if (raw == null) return "";
  return Array.isArray(raw) ? (raw[0] ?? "") : raw;
}

export default function FirmDetailPage() {
  const routeParams = useParams<{ slug?: string | string[] }>();
  const slug = segmentSlug(routeParams?.slug);

  const [view, setView] = useState<FirmDetailView | null>(null);
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const v = buildFirmDetailView(slug);
    setView(v);
    setMissing(!v);
    setLoading(false);
  }, [slug]);

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

  if (missing || !view) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] px-6 py-24 text-center">
        <Building2 className="mx-auto h-12 w-12 text-[#D4A574]" />
        <h1 className="mt-4 text-lg font-semibold text-[#5C4033]">未找到该律所</h1>
        <p className="mt-2 text-sm text-[#5D4E3A]">请从律师列表重新进入，或稍后再试。</p>
        <Link
          href="/lawyers"
          className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#B8860B] underline decoration-[#D4A574] underline-offset-2"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          返回律师列表
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-16">
      <section className="relative overflow-hidden bg-[#3d2d24] pb-10">
        <div className="pointer-events-none absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HERO_BG} alt="" className="h-full w-full object-cover opacity-[0.42]" />
          <div
            className="absolute inset-0 bg-gradient-to-br from-[rgba(45,35,28,0.88)] via-[rgba(62,48,38,0.82)] to-[rgba(92,64,51,0.78)]"
            aria-hidden
          />
          <div className="marketing-hero-fade-dark-to-cream" aria-hidden />
        </div>

        <div className="relative z-[2] mx-auto max-w-6xl px-6 pb-10 pt-20 md:pt-24 lg:px-8">
          <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-start">
            <div className="flex h-[140px] w-[140px] shrink-0 items-center justify-center rounded-3xl border-[3px] border-[#D4A574] bg-gradient-to-br from-[#D4A574]/30 to-[#B8860B]/25 text-[#5C4033] shadow-xl">
              <Building2 className="h-16 w-16" strokeWidth={1.25} />
            </div>

            <div className="min-w-0 flex-1 text-center lg:text-left">
              <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <h1 className="font-serif text-2xl font-bold tracking-wide text-white md:text-3xl">
                  {view.name}
                </h1>
                <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs text-white/90">
                  执业机构
                </span>
              </div>

              <p className="mt-2 flex items-center justify-center gap-2 text-sm text-white/80 lg:justify-start">
                <Briefcase className="h-4 w-4 shrink-0 text-[#D4A574]" />
                {view.tagline}
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-5 text-sm text-white/80 lg:justify-start">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#D4A574]" />
                  {view.city}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-[#D4A574]" />
                  认证律师约 {view.lawyerCount} 位
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-[#D4A574]" />
                  影响力律所（示例）
                </span>
              </div>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 lg:text-left">{view.summary}</p>
              {view.showDemoNotice ? (
                <p className="mt-3 text-xs text-amber-200/90">当前为示例档案，接口就绪后将展示机构认证信息。</p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-5">
            <article className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-7 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-[#5C4033]">
                <Building2 className="h-[18px] w-[18px] text-[#D4A574]" />
                律所简介
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
                代表性项目
              </h2>
              <ul className="space-y-5">
                {view.cases.map((c: LawyerCaseItem, i: number) => (
                  <li key={i} className="border-l-2 border-[#D4A574] pl-4">
                    <p className="font-semibold text-[#2C2416]">{c.title}</p>
                    <p className="mt-1 text-xs font-medium text-[#B8860B]">{c.role}</p>
                    <p className="mt-2 text-sm leading-relaxed text-[#5D4E3A]">{c.summary}</p>
                  </li>
                ))}
              </ul>
            </article>

            <section className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-[#FFFCF7] p-7 shadow-sm md:min-h-[280px]">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#5C4033]">
                <Users className="h-5 w-5 text-[#D4A574]" />
                活跃创作者律师
              </h2>
              <p className="mb-5 text-xs leading-relaxed text-[#9A8B78]">
                在律植发布内容、Skills 或法律科技产品较为活跃的认证律师（示例数据）。
              </p>
              <ul className="space-y-4">
                {view.activeCreators.map((c) => (
                  <li
                    key={c.lawyerSlug}
                    className="flex gap-4 rounded-xl border border-[rgba(212,165,116,0.2)] bg-white/80 p-4"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.avatarUrl}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-[rgba(212,165,116,0.25)]"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/lawyers/${encodeURIComponent(c.lawyerSlug)}`}
                        className="text-base font-semibold text-[#2C2416] transition-colors hover:text-[#B8860B]"
                      >
                        {c.name}
                      </Link>
                      <p className="mt-0.5 text-xs font-medium text-[#D4A574]">{c.rankTitle}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {c.expertise.map((t) => (
                          <span
                            key={t}
                            className="rounded-md bg-[rgba(212,165,116,0.12)] px-2 py-0.5 text-xs text-[#5D4E3A]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Link
                      href={`/lawyers/${encodeURIComponent(c.lawyerSlug)}`}
                      className="self-center text-[#9A8B78] transition-colors hover:text-[#D4A574]"
                      aria-label={`查看 ${c.name}`}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-7 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#5C4033]">
                <Cpu className="h-5 w-5 text-[#D4A574]" />
                代表性法律科技产品
              </h2>
              <p className="mb-5 text-xs leading-relaxed text-[#9A8B78]">
                以本所品牌或合作为主的智能体、Skills 与工具（示例，非完整清单）。
              </p>
              <ul className="space-y-3">
                {view.legalTechProducts.map((p) => (
                  <li key={p.title}>
                    <Link
                      href={p.href}
                      className="group flex items-start gap-3 rounded-lg border border-transparent px-1 py-2 transition-colors hover:border-[rgba(212,165,116,0.35)] hover:bg-[rgba(212,165,116,0.06)]"
                    >
                      <span className="mt-0.5 shrink-0 rounded bg-[rgba(184,134,11,0.15)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8B6914]">
                        {p.kind}
                      </span>
                      <span className="min-w-0 flex-1 text-sm leading-snug text-[#5D4E3A] group-hover:text-[#5C4033]">
                        {p.title}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#9A8B78] opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="h-fit space-y-5 lg:sticky lg:top-24">
            <div className="rounded-[20px] border border-[rgba(212,165,116,0.25)] bg-white p-7 shadow-sm">
              <div className="mb-5 grid grid-cols-3 gap-2 text-center sm:gap-3">
                {view.sidebarStats.map((s) => (
                  <div key={s.label} className="min-w-0">
                    <p className="truncate text-lg font-bold text-[#5C4033] md:text-xl" title={s.value}>
                      {s.value}
                    </p>
                    <p className="mt-1 text-xs text-[#9A8B78]">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] border border-[rgba(212,165,116,0.25)] bg-white p-7 shadow-sm">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#2C2416]">
                <MapPin className="h-4 w-4 shrink-0 text-[#D4A574]" />
                办公地址
              </p>
              <p className="text-sm leading-relaxed text-[#5D4E3A]">{view.firmAddress}</p>

              <div className="mt-6 border-t border-[rgba(212,165,116,0.2)] pt-5">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#2C2416]">
                  <Check className="h-3.5 w-3.5 text-[#D4A574]" />
                  对外总机
                </p>
                <p className="text-base font-medium tracking-wide text-[#5D4E3A]">{view.publicPhone}</p>
                <p className="mt-2 text-xs leading-relaxed text-[#9A8B78]">
                  登记展示信息；个人直线等请通过平台向具体律师发起联系。
                </p>
              </div>
            </div>

            <Link
              href="/lawyers"
              className="flex items-center justify-center gap-1 rounded-xl border border-[rgba(212,165,116,0.25)] bg-white py-3 text-sm font-medium text-[#5D4E3A] transition-colors hover:border-[#D4A574] hover:text-[#D4A574]"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              返回律师列表
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
