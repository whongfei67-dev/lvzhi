import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "提交作品审核",
};

export default function InspirationCreatePage() {
  return (
    <div className="min-h-screen bg-[#FFF8F0] font-serif text-[#2C2416]">
      <PageHeader
        variant="inspiration"
        title="提交作品审核"
        description="提交 Skills 或智能体，审核通过后上架到灵感广场"
        backHref="/inspiration/my-items"
      />
      <main className="mx-auto max-w-3xl px-6 py-10 lg:px-8">
        <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white/90 p-8 shadow-sm space-y-5 leading-relaxed text-[#5D4E3A]">
          <p>
            内测期间，<strong className="text-[#2C2416]">创作者端提交流程</strong>
            正在与审核后台对齐。请先登录并进入创作者工作台完成资料与合规确认。
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
            >
              去登录
            </Link>
            <Link
              href="/creator"
              className="inline-flex rounded-2xl border border-[rgba(212,165,116,0.35)] px-5 py-2.5 text-sm font-semibold text-[#5C4033] hover:bg-[rgba(212,165,116,0.08)]"
            >
              创作者工作台
            </Link>
            <Link
              href="/inspiration/skills"
              className="inline-flex rounded-2xl border border-transparent px-5 py-2.5 text-sm font-medium text-[#D4A574] hover:underline"
            >
              浏览 Skills 市场
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
