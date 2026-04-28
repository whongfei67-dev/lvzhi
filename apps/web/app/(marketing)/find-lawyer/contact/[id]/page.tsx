import Link from "next/link";
import { notFound } from "next/navigation";
import { getLawyerById } from "@/lib/platform-demo-data";

export default async function FindLawyerContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lawyer = getLawyerById(id);
  if (!lawyer) notFound();

  return (
    <div className="page-shell max-w-3xl space-y-8 py-12">
      <Link href={`/find-lawyer/${lawyer.id}`} className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← 返回律师详情
      </Link>

      <div className="card p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#D4A574]">联系方式获取流程</p>
        <h1 className="mt-3 text-3xl font-bold text-[var(--ink)]">{lawyer.displayName}</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          主页面默认不展示“20 元”等显式价格。若需获取联系方式，平台会在这一层流程说明中提示付费获取联系方式的产品逻辑，并帮助用户先确认服务匹配度。
        </p>

        <div className="mt-6 rounded-3xl border border-[rgba(212,165,116,0.2)] bg-[rgba(212,165,116,0.08)] p-5">
          <p className="font-semibold text-[#B8860B]900">当前说明</p>
          <p className="mt-2 text-sm leading-7 text-[#B8860B]800">{lawyer.contactFlowNote}</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ["1. 提交需求摘要", "说明你的业务背景、区域与希望咨询的问题方向。"],
            ["2. 进入联系方式获取流程", "平台在此阶段说明付费获取联系方式逻辑，但不在主页面展示价格。"],
            ["3. 继续联系律师", "完成流程后，再进入后续沟通与匹配。"],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-2xl bg-[rgba(212,165,116,0.08)] p-4">
              <p className="font-medium text-[#2C2416]">{title}</p>
              <p className="mt-2 text-sm leading-7 text-[#9A8B78]">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-[#D4A574]">你的称呼</label>
            <input
              readOnly
              value="演示用户"
              className="h-11 rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white px-4 text-sm text-[#D4A574]"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-[#D4A574]">咨询方向</label>
            <textarea
              readOnly
              value={`希望咨询 ${lawyer.primaryDomain} 相关问题，并进一步获取联系方式。`}
              className="min-h-28 rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white px-4 py-3 text-sm text-[#D4A574]"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/find-lawyer/${lawyer.id}`} className="rounded-2xl border border-[rgba(212,165,116,0.25)] px-4 py-2.5 text-sm font-medium text-[#D4A574] hover:bg-[rgba(212,165,116,0.08)]">
            继续查看律师详情
          </Link>
          <Link href="/find-lawyer" className="rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-4 py-2.5 text-sm font-semibold text-white">
            返回找律师继续筛选
          </Link>
        </div>
      </div>
    </div>
  );
}
