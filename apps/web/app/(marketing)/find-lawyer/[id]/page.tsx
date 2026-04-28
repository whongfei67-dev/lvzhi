import Link from "next/link";
import { notFound } from "next/navigation";
import { getLawyerById } from "@/lib/platform-demo-data";

export default async function FindLawyerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lawyer = getLawyerById(id);
  if (!lawyer) notFound();

  return (
    <div className="page-shell max-w-4xl space-y-8 py-12">
      <Link href="/find-lawyer" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← 返回找律师
      </Link>

      <div className="card p-8">
        <div className="flex items-start gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#D4A574] to-[#B8860B] text-3xl font-bold text-white">
            {lawyer.avatarSeed}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-[var(--ink)]">{lawyer.displayName}</h1>
              {lawyer.verified ? (
                <span className="rounded-full bg-[rgba(212,165,116,0.08)] px-2.5 py-1 text-xs font-medium text-[#D4A574]">执业律师认证</span>
              ) : null}
              {lawyer.platformSelected && <span className="rounded-full bg-[rgba(212,165,116,0.08)] px-2.5 py-1 text-xs font-medium text-[#B8860B]">平台精选</span>}
            </div>
            <p className="mt-2 text-[var(--muted)]">{lawyer.city} · {lawyer.institution}</p>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{lawyer.summary}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-[rgba(212,165,116,0.08)] p-4">
            <span className="text-xs text-[var(--muted)]">综合排序</span>
            <p className="mt-1 font-semibold text-[var(--ink)]">{lawyer.rankLabel}</p>
          </div>
          <div className="rounded-2xl bg-[rgba(212,165,116,0.08)] p-4">
            <span className="text-xs text-[var(--muted)]">区域</span>
            <p className="mt-1 font-semibold text-[var(--ink)]">{lawyer.region}</p>
          </div>
          <div className="rounded-2xl bg-[rgba(212,165,116,0.08)] p-4">
            <span className="text-xs text-[var(--muted)]">领域</span>
            <p className="mt-1 font-semibold text-[var(--ink)]">{lawyer.primaryDomain}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {(lawyer.specialties ?? []).map((item) => (
            <span key={item} className="rounded-full border border-[rgba(212,165,116,0.2)] bg-[rgba(212,165,116,0.08)] px-3 py-1 text-sm text-[#B8860B]">
              {item}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/find-lawyer/contact/${lawyer.id}`} className="rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-4 py-2.5 text-sm font-semibold text-white">
            {lawyer.contactButtonLabel ?? "联系律师"}
          </Link>
          <Link href="/rankings?tab=lawyer-contributors" className="rounded-2xl border border-[rgba(212,165,116,0.25)] px-4 py-2.5 text-sm font-medium text-[#D4A574] hover:bg-[rgba(212,165,116,0.08)]">
            返回律师榜单
          </Link>
        </div>
      </div>
    </div>
  );
}
