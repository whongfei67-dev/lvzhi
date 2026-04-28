import Link from "next/link";
import { notFound } from "next/navigation";
import { getPolicyBySlug } from "@/lib/platform-demo-data";

export default async function CreatorPolicyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = getPolicyBySlug(slug);
  if (!policy) notFound();

  return (
    <div className="page-shell max-w-5xl space-y-8 py-12">
      <Link href="/creators/policies" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← 返回平台政策
      </Link>

      <div className="card p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#D4A574]">创作者学院政策页</p>
        <h1 className="mt-3 text-3xl font-bold text-[var(--ink)]">{policy.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">{policy.summary}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <div className="space-y-6">
          {(policy.sections ?? []).map((section) => (
            <div key={section.title} className="card p-6">
              <h2 className="text-xl font-semibold text-[var(--ink)]">{section.title}</h2>
              <div className="mt-4 space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-[var(--muted)]">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-[var(--ink)]">常见问题</h2>
            <div className="mt-4 space-y-4">
              {(policy.faq ?? []).map((item) => (
                <div key={item.question} className="rounded-2xl border border-[rgba(212,165,116,0.2)] bg-[rgba(212,165,116,0.08)] p-4">
                  <p className="font-medium text-[#2C2416]">{item.question}</p>
                  <p className="mt-2 text-sm leading-7 text-[#9A8B78]">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-semibold text-[var(--ink)]">下一步</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              如果你需要继续了解规则应用、隐私展示或联系机制，可以继续进入对应页面进行演示查看。
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={policy.ctaHref ?? "/creators/policies"}
                className="rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-4 py-2.5 text-sm font-semibold text-white"
              >
                {policy.ctaLabel ?? "返回政策列表"}
              </Link>
              <Link
                href="/creators"
                className="rounded-2xl border border-[rgba(212,165,116,0.25)] px-4 py-2.5 text-sm font-medium text-[#D4A574] hover:bg-[rgba(212,165,116,0.08)]"
              >
                返回创作者学院
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
