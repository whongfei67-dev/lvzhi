import Link from "next/link";

/**
 * 功能尚未接入时的占位说明（内测 / 迁移阶段）
 */
export function DevelopmentPlaceholder({
  eyebrow,
  title,
  description,
  backHref,
  backLabel,
}: {
  eyebrow: string;
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="flex min-h-[56vh] items-center justify-center bg-[#FFF8F0] px-6 py-16">
      <div
        className="mx-auto max-w-lg rounded-2xl border px-8 py-10 text-center"
        style={{
          borderColor: "rgba(212,165,116,0.35)",
          background: "rgba(255,252,247,0.96)",
          boxShadow: "0 8px 28px rgba(92,64,51,0.08)",
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-[#B8860B]">{eyebrow}</p>
        <h1 className="mt-3 text-xl font-semibold text-[#5C4033]">{title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-[#5D4E3A]">{description}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={backHref}
            className="inline-flex rounded-xl bg-[#5C4033] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6d4f3f]"
          >
            {backLabel}
          </Link>
          <Link
            href="/"
            className="inline-flex rounded-xl border px-5 py-2.5 text-sm font-medium text-[#5C4033] transition-colors hover:bg-[rgba(212,165,116,0.12)]"
            style={{ borderColor: "rgba(212,165,116,0.35)" }}
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
