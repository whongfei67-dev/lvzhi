import Link from "next/link";
import { notFound } from "next/navigation";
import { getCreatorById } from "@/lib/platform-demo-data";

function invitationMeta(status: string) {
  if (status === "approved") {
    return {
      title: "创作者已同意你的获取邀请",
      description: "你现在可以返回创作者详情页，查看更多经创作者确认后可公开的信息。",
      tone: "border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] text-emerald-900",
      ctaLabel: "查看已同意后的详情页",
    };
  }
  if (status === "declined") {
    return {
      title: "创作者暂未同意本次邀请",
      description: "在创作者再次确认前，平台将继续隐藏其真实姓名、敏感身份信息与直接联系方式。",
      tone: "border-amber-200 bg-amber-50 text-amber-900",
      ctaLabel: "返回创作者详情页",
    };
  }
  return {
    title: "邀请已提交",
    description: "平台已将你的联系意向提交给创作者。待创作者明确同意后，你将看到更多可公开信息。",
    tone: "border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] text-[#B8860B]900",
    ctaLabel: "查看创作者详情",
  };
}

export default async function InvitationStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const creator = getCreatorById(id);
  if (!creator) notFound();

  const status = ["submitted", "approved", "declined"].includes(query.status ?? "")
    ? (query.status as "submitted" | "approved" | "declined")
    : ((creator.invitationStatus as "submitted" | "approved" | "declined" | undefined) ?? "submitted");
  const meta = invitationMeta(status);

  return (
    <div className="page-shell max-w-3xl space-y-8 py-12">
      <Link href={`/creators/${id}`} className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← 返回创作者详情
      </Link>

      <div className={`rounded-3xl border p-8 ${meta.tone}`}>
        <h1 className="text-2xl font-bold">{meta.title}</h1>
        <p className="mt-3 text-sm leading-7">{meta.description}</p>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold text-[var(--ink)]">下一步建议</h2>
        <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
          <p>1. 如需继续沟通，请保留你的需求背景与联系方式，等待创作者确认。</p>
          <p>2. 在创作者未同意前，平台不会展示其真实姓名、详细个人身份信息或直接联系方式。</p>
          <p>3. 若需要人工协助，可前往“平台政策”中的人工服务页查看处理方式。</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={status === "approved" ? `/creators/${id}?invitation=approved` : `/creators/${id}`}
            className="rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-4 py-2.5 text-sm font-semibold text-white"
          >
            {meta.ctaLabel}
          </Link>
          <Link
            href="/creators/policies/manual-support"
            className="rounded-2xl border border-[rgba(212,165,116,0.25)] px-4 py-2.5 text-sm font-medium text-[#D4A574] hover:bg-[rgba(212,165,116,0.08)]"
          >
            查看人工服务
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href={`/creators/${id}/invitation?status=submitted`} className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-4 text-sm font-medium text-[#D4A574] shadow-sm hover:bg-[rgba(212,165,116,0.08)]">
          查看“邀请已提交”状态
        </Link>
        <Link href={`/creators/${id}/invitation?status=approved`} className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-4 text-sm font-medium text-[#D4A574] shadow-sm hover:bg-[rgba(212,165,116,0.08)]">
          查看“已同意”状态
        </Link>
        <Link href={`/creators/${id}/invitation?status=declined`} className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-4 text-sm font-medium text-[#D4A574] shadow-sm hover:bg-[rgba(212,165,116,0.08)]">
          查看“未同意”状态
        </Link>
      </div>
    </div>
  );
}
