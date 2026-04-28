import Link from "next/link";
import { POLICY_PAGES } from "@/lib/platform-demo-data";

export default function CreatorPoliciesPage() {
  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
      <div className="border-b border-[rgba(212,165,116,0.25)] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#D4A574]">创作者学院 / 平台政策</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#2C2416]">平台政策</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[#9A8B78]">
            这里集中承接创作者学院的规则、隐私说明、上传下架规则、投诉反馈与人工服务。每个入口都是可演示的真实页面。
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {POLICY_PAGES.map((policy) => (
            <Link
              key={policy.slug}
              href={`/creators/policies/${policy.slug}`}
              className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-[#2C2416]">{policy.title}</h2>
              <p className="mt-3 min-h-24 text-sm leading-7 text-[#9A8B78]">{policy.summary}</p>
              <span className="mt-4 inline-flex text-sm font-semibold text-[#B8860B]">查看内容</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
