export const dynamic = 'force-dynamic'
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createCompatClient } from "@/lib/supabase/compat-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const jobTypeLabels: Record<string, string> = {
  full_time: "全职",
  intern: "实习",
  part_time: "兼职",
};

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  type JobRow = Record<string, unknown>;
  const { id } = await params;
  const supabase = await createCompatClient();

  const { data: jobData } = await supabase
    .from("jobs")
    .select("*, profiles(id, display_name, bio, verified)")
    .eq("id", id)
    .single();

  const job = (jobData ?? null) as JobRow | null;
  if (!job) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  // Check if user already applied
  let hasApplied = false;
  let userRole: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    userRole = (profile as Record<string, unknown> | null)?.role as string | null;

    if (userRole === "seeker") {
      const { data: app } = await supabase
        .from("applications")
        .select("id")
        .eq("job_id", id)
        .eq("seeker_id", user.id)
        .single();
      hasApplied = !!app;
    }
  }

  const recruiter = job.profiles as {
    id: string;
    display_name: string | null;
    bio: string | null;
    verified: boolean;
  } | null;

  async function applyAction() {
    "use server";
    const supabase = await createCompatClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login?redirectTo=/jobs/" + id);

    await supabase.from("applications").insert({
      job_id: id,
      seeker_id: (user as { id: string }).id,
    });
    redirect("/opportunities");
  }

  return (
    <div className="page-shell py-12 max-w-3xl space-y-8">
      {/* Breadcrumb */}
      <Link href="/jobs" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← 返回职位列表
      </Link>

      {/* Job header */}
      <div className="card p-8 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-[var(--ink)]">{String(job.title ?? "")}</h1>
              {Boolean(job.job_type) && (
                <Badge variant="paid">{jobTypeLabels[String(job.job_type)]}</Badge>
              )}
              <Badge variant={job.status === "active" ? "success" : "default"}>
                {job.status === "active" ? "招募中" : "已关闭"}
              </Badge>
            </div>
            <p className="text-[var(--muted)]">
              {recruiter?.display_name ?? "匿名机构"}
              {recruiter?.verified && (
                <span className="ml-1 text-[var(--success)]">✓ 已认证</span>
              )}
              {Boolean(job.location) && ` · ${String(job.location)}`}
            </p>
          </div>
          {Boolean(job.salary_range) && (
            <p className="text-xl font-bold text-[var(--highlight)]">{String(job.salary_range)}</p>
          )}
        </div>

        {Array.isArray(job.specialty) && job.specialty.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {job.specialty.map((s) => (
              <span
                key={String(s)}
                className="text-sm px-3 py-1 rounded-full bg-[var(--accent)]/8 text-[var(--accent)] border border-[var(--accent)]/15"
              >
                {String(s)}
              </span>
            ))}
          </div>
        )}

        {/* Apply button */}
        {String(job.status) === "active" && (
          <div className="pt-2">
            {!user ? (
              <Link
                href={`/auth/login?redirectTo=/jobs/${id}`}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-4 text-sm font-medium text-white shadow-sm hover:shadow-md transition-all"
              >
                登录后投递
              </Link>
            ) : userRole === "seeker" ? (
              hasApplied ? (
                <Button disabled variant="secondary">已投递</Button>
              ) : (
                <form action={applyAction}>
                  <Button type="submit">一键投递</Button>
                </form>
              )
            ) : null}
          </div>
        )}
      </div>

      {/* Job description */}
      {Boolean(job.description) && (
        <div className="card p-8 space-y-3">
          <h2 className="text-lg font-semibold text-[var(--ink)]">职位描述</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed whitespace-pre-wrap">
            {String(job.description)}
          </p>
        </div>
      )}

      {/* Requirements */}
      {Boolean(job.requirements) && (
        <div className="card p-8 space-y-3">
          <h2 className="text-lg font-semibold text-[var(--ink)]">任职要求</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed whitespace-pre-wrap">
            {String(job.requirements)}
          </p>
        </div>
      )}

      {/* Recruiter info */}
      {recruiter && (
        <div className="card p-8 space-y-3">
          <h2 className="text-lg font-semibold text-[var(--ink)]">发布机构</h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold">
              {(recruiter.display_name ?? "?")[0]}
            </div>
            <div>
              <p className="font-medium text-[var(--ink)]">
                {recruiter.display_name}
                {recruiter.verified && (
                  <span className="ml-1 text-xs text-[var(--success)]">✓ 已认证</span>
                )}
              </p>
              {recruiter.bio && (
                <p className="text-sm text-[var(--muted)]">{recruiter.bio.slice(0, 80)}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
