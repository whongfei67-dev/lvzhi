import Link from "next/link";
import { ContactInvitationModal } from "@/components/creator/contact-invitation-modal";
import { getEmployedCreators } from "@/lib/platform-demo-data";

export default function EmployedCreatorPage() {
  const creators = getEmployedCreators();
  const demoCreator = creators[0];

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
      <div className="border-b border-[rgba(212,165,116,0.25)] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#D4A574]">创作者学院 / 在职创作者</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#2C2416]">我是在职创作者</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[#9A8B78]">
            我希望在不脱离当前工作状态的前提下，逐步开始创作智能体、内容或课程作品。这里会说明如何保护身份信息、如何被前台展示，以及如何通过邀请机制承接联系需求。
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#2C2416]">隐私设置说明</h2>
            <p className="mt-3 text-sm leading-7 text-[#9A8B78]">
              在职创作者可开启“隐藏真实姓名和个人信息”。开启后，前台默认隐藏真实姓名、直接联系方式、敏感身份信息和具体工作单位，仅展示昵称、创作方向、作品与非敏感标签。
            </p>
            <div className="mt-5 space-y-3">
              {[
                "隐藏真实姓名和个人信息",
                "允许通过邀请机制申请联系",
                "创作者同意后再展示更多公开信息",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <ContactInvitationModal creatorId={demoCreator.id} creatorName={demoCreator.publicIdentityLabel ?? demoCreator.creatorDisplayName} />
              <Link
                href="/creators/policies/identity-and-privacy"
                className="inline-flex h-10 items-center rounded-2xl border border-[rgba(212,165,116,0.25)] px-4 text-sm font-medium text-[#D4A574] hover:bg-[rgba(212,165,116,0.08)]"
              >
                查看身份认证与隐私政策
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#2C2416]">前台展示示例</h2>
            <div className="mt-5 rounded-3xl border border-[rgba(212,165,116,0.2)] bg-[rgba(212,165,116,0.08)] p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#D4A574] to-[#B8860B] text-lg font-bold text-white">
                  {demoCreator.avatarSeed}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-[#2C2416]">{demoCreator.publicIdentityLabel}</h3>
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">在职创作者</span>
                  </div>
                  <p className="mt-1 text-sm text-[#9A8B78]">{demoCreator.publicOrganization}</p>
                  <p className="mt-3 text-sm leading-7 text-[#9A8B78]">{demoCreator.sanitizedBio}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(demoCreator.specialty ?? []).map((item) => (
                  <span key={item} className="rounded-full border border-[rgba(212,165,116,0.2)] bg-[rgba(212,165,116,0.08)] px-2.5 py-1 text-xs font-medium text-[#B8860B]">
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex gap-3">
                <Link href={`/creators/${demoCreator.id}`} className="flex-1 rounded-2xl border border-[rgba(212,165,116,0.25)] px-4 py-2.5 text-center text-sm font-semibold text-[#D4A574] hover:bg-[rgba(212,165,116,0.08)]">
                  查看详情
                </Link>
                <Link href={`/creators/${demoCreator.id}/invitation?status=submitted`} className="flex-1 rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-4 py-2.5 text-center text-sm font-semibold text-white">
                  发起获取邀请
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {creators.map((creator) => (
            <div key={creator.id} className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#D4A574] to-[#B8860B] text-base font-bold text-white">
                  {creator.avatarSeed}
                </div>
                <div>
                  <h3 className="font-semibold text-[#2C2416]">{creator.publicIdentityLabel ?? creator.creatorAlias ?? creator.creatorDisplayName}</h3>
                  <p className="text-sm text-[#9A8B78]">{creator.city} · 在职创作者</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-[#9A8B78]">{creator.nextStepCopy}</p>
              <div className="mt-5 flex gap-3">
                <Link href={`/creators/${creator.id}`} className="flex-1 rounded-2xl border border-[rgba(212,165,116,0.25)] px-4 py-2 text-center text-sm font-semibold text-[#D4A574] hover:bg-[rgba(212,165,116,0.08)]">
                  查看详情
                </Link>
                <Link href={`/creators/${creator.id}/invitation?status=${creator.invitationStatus}`} className="flex-1 rounded-2xl bg-[#2C2416] px-4 py-2 text-center text-sm font-semibold text-white">
                  查看状态
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
