export const dynamic = "force-dynamic";

import Link from "next/link";
import { createCompatClient } from "@/lib/supabase/compat-client";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

// ─── constants ────────────────────────────────────────────────────────────────

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "全职",
  intern:    "实习",
  part_time: "兼职",
};

const JOB_TYPE_FILTERS = [
  { value: "",          label: "全部" },
  { value: "full_time", label: "全职" },
  { value: "intern",    label: "实习" },
  { value: "part_time", label: "兼职" },
];

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; job_type?: string }>;
}) {
  type JobRow = Record<string, unknown>;
  const params = await searchParams;
  const supabase = await createCompatClient();

  let query = supabase
    .from("jobs")
    .select("*, profiles(display_name, verified)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (params.q)        query = query.ilike("title", `%${params.q}%`);
  if (params.job_type) query = query.eq("job_type", params.job_type);

  const { data: jobsData } = await query;
  const jobs = (jobsData ?? []) as JobRow[];
  const total = jobs.length;

  // Build search query string (preserve filters when searching)
  const filterQs = params.job_type ? `&job_type=${params.job_type}` : "";

  return (
    <div className="min-h-screen marketing-page-shell-tint">

      {/* ── Hero ── */}
      <section
        className="page-header"
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
            src="https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=1920&q=80"
            alt="工作背景"
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
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold tracking-wider text-[#B8860B]">法律职位</p>
                <h1 className="text-4xl font-bold text-[#2C2416] lg:text-5xl" style={{ fontFamily: "'Noto Serif TC', 'Source Han Serif TC', serif" }}>
                  求职招聘
                </h1>
                <p className="text-[#5D4E3A]">浏览全职、实习、兼职法律职位，找到属于你的机会</p>
              </div>

              {/* Search form */}
              <form method="GET" action="/jobs" className="flex w-full max-w-md items-center gap-2">
                {params.job_type && (
                  <input type="hidden" name="job_type" value={params.job_type} />
                )}
                <div className="search-box flex-1">
                  <Search className="text-[#9A8B78]" />
                  <input
                    name="q"
                    defaultValue={params.q}
                    placeholder="搜索职位名称、技能方向…"
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
            </div>
          </div>
        </PageContainer>
      </section>

      {/* ── Content ── */}
      <PageContainer py="md">
        <div className="space-y-5">

          {/* Toolbar: filter pills + count */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Filter pills — link-based for server compat */}
            <div className="flex flex-wrap items-center gap-2">
              {JOB_TYPE_FILTERS.map((f) => {
                const active = (params.job_type ?? "") === f.value;
                const href = f.value
                  ? `/jobs?job_type=${f.value}${params.q ? `&q=${params.q}` : ""}`
                  : `/jobs${params.q ? `?q=${params.q}` : ""}`;
                return (
                  <Link
                    key={f.value}
                    href={href}
                    className={
                      active
                        ? "rounded-xl bg-[#2C2416] px-3.5 py-1.5 text-sm font-medium text-white"
                        : "rounded-xl bg-white border border-[rgba(212,165,116,0.25)] px-3.5 py-1.5 text-sm font-medium text-[#5D4E3A] hover:bg-[rgba(212,165,116,0.08)] transition-colors"
                    }
                  >
                    {f.label}
                  </Link>
                );
              })}
            </div>

            {/* Active search hint + count */}
            <div className="flex items-center gap-3">
              {params.q && (
                <span className="flex items-center gap-1.5 rounded-xl border border-[rgba(212,165,116,0.2)] bg-[rgba(212,165,116,0.08)] px-3 py-1.5 text-sm text-[#B8860B]">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  {params.q}
                  <Link href={`/jobs${filterQs ? `?${filterQs.slice(1)}` : ""}`} className="ml-1 text-[#D4A574] hover:text-[#B8860B]">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Link>
                </span>
              )}
              <span className="text-sm text-[#9A8B78]">{total} 个职位</span>
            </div>
          </div>

          {/* Job list */}
          {!jobs.length ? (
            <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white">
              <EmptyState
                icon="💼"
                title="暂无符合条件的职位"
                description="试试更换搜索关键词，或清除筛选条件"
                action="清除筛选"
                actionHref="/jobs"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((row: JobRow) => {
                const recruiter = row.profiles as { display_name: string | null; verified: boolean } | null;
                const specialties = (row.specialty as string[] | null) ?? [];
                return (
                  <Link
                    key={String(row.id)}
                    href={`/jobs/${String(row.id)}`}
                    className="group flex flex-col gap-4 rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-5 transition-all hover:border-[#B8A88A] hover:shadow-md sm:flex-row sm:items-start sm:justify-between"
                  >
                    {/* Left: main info */}
                    <div className="min-w-0 flex-1 space-y-2.5">
                      {/* Title row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-[#2C2416] group-hover:text-[#B8860B] transition-colors">
                          {String(row.title ?? "")}
                        </h2>
                        {Boolean(row.job_type) && (
                          <Badge variant="paid">{JOB_TYPE_LABELS[String(row.job_type)] ?? String(row.job_type)}</Badge>
                        )}
                      </div>

                      {/* Meta: recruiter + location */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#9A8B78]">
                        <span className="flex items-center gap-1">
                          {recruiter?.display_name ?? "匿名机构"}
                          {recruiter?.verified && (
                            <span className="inline-flex items-center justify-center rounded-full bg-[rgba(212,165,116,0.15)] px-1.5 py-0.5 text-[10px] font-semibold text-[#D4A574]">
                              已认证
                            </span>
                          )}
                        </span>
                        {Boolean(row.location) && (
                          <>
                            <span className="text-[#B8A88A]">·</span>
                            <span className="flex items-center gap-1">
                              <svg className="h-3.5 w-3.5 text-[#9A8B78]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                              </svg>
                              {String(row.location)}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Specialty tags */}
                      {specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {specialties.slice(0, 4).map((s) => (
                            <span
                              key={s}
                              className="rounded-full border border-[rgba(212,165,116,0.2)] bg-[rgba(212,165,116,0.08)] px-2.5 py-0.5 text-xs font-medium text-[#B8860B]"
                            >
                              {s}
                            </span>
                          ))}
                          {specialties.length > 4 && (
                            <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs text-[#9A8B78]">
                              +{specialties.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: salary + cta */}
                    <div className="flex shrink-0 flex-row items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-start">
                      {row.salary_range ? (
                        <p className="text-lg font-bold text-[#D4A574]">{String(row.salary_range)}</p>
                      ) : (
                        <p className="text-sm text-[#9A8B78]">薪资面议</p>
                      )}
                      <span className="flex items-center gap-1 text-xs font-medium text-[#9A8B78] group-hover:text-[#D4A574] transition-colors">
                        查看详情
                        <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
