export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PracticeLawyerBadge } from "@/components/common/practice-lawyer-badge";
import { ContactInvitationModal } from "@/components/creator/contact-invitation-modal";
import { CreatorFeedbackPanel } from "@/components/creator/creator-feedback-panel";
import { createCompatClient } from "@/lib/supabase/compat-client";
import { getCreatorById, getLawyerById } from "@/lib/platform-demo-data";

function statusCopy(status: string) {
  if (status === "approved") {
    return {
      title: "创作者已同意进一步沟通",
      desc: "你当前可以查看更多经创作者确认后公开的信息，并进入下一步联系流程。",
    };
  }
  if (status === "declined") {
    return {
      title: "创作者暂未同意本次邀请",
      desc: "在获得创作者同意前，页面不会展示真实姓名、敏感身份信息或直接联系方式。",
    };
  }
  if (status === "submitted") {
    return {
      title: "邀请已提交",
      desc: "平台已记录你的联系意向，待创作者确认后再开放下一步信息。",
    };
  }
  return {
    title: "在职创作者身份保护中",
    desc: "如需进一步了解其身份信息或建立联系，请先发起获取邀请。",
  };
}

export default async function CreatorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ invitation?: string }>;
}) {
  type CreatorProfile = {
    id: string;
    display_name?: string;
    bio?: string;
    lawyer_verified?: boolean;
  };
  type LawyerProfile = {
    law_firm?: string;
    years_experience?: number;
    bar_number?: string;
  };
  type SkillRow = Record<string, unknown>;
  const { id } = await params;
  const query = await searchParams;
  const mockCreator = getCreatorById(id);
  const supabase = await createCompatClient();
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("role", "creator")
    .single();

  const profile = (profileData ?? null) as CreatorProfile | null;

  if (mockCreator && !profile) {
    const mockProductCards = [
      { id: "mock-agent-contract", title: "合同审查工作流", desc: "适合企业法务、业务协同与标准化文本初筛。", cta: "查看智能体", href: "/agents" },
      { id: "mock-content-compliance", title: "合规答疑内容集", desc: "帮助快速理解业务场景下的风险边界与公开说明。", cta: "查看内容", href: "/community" },
      { id: "mock-course-note", title: "创作者教学笔记", desc: "沉淀实务经验、提示词结构与可演示表达方式。", cta: "查看课程", href: "/classroom" },
    ];
    const invitationStatus = ["submitted", "approved", "declined"].includes(query.invitation ?? "")
      ? (query.invitation as "submitted" | "approved" | "declined")
      : ((mockCreator.invitationStatus as "submitted" | "approved" | "declined" | undefined) ?? "submitted");
    const currentStatus = statusCopy(invitationStatus);
    const revealIdentity = mockCreator.identityRevealAfterApproval && invitationStatus === "approved";
    const mockLawyer = getLawyerById(mockCreator.id);
    const hasLawyerContactRoute = !!mockLawyer;
    const displayName: string = (mockCreator.hideRealIdentity && !revealIdentity
      ? mockCreator.publicIdentityLabel ?? mockCreator.creatorAlias ?? mockCreator.creatorDisplayName
      : (mockCreator.realName ?? mockCreator.creatorDisplayName ?? mockCreator.name)) ?? "匿名创作者";
    const organization = mockCreator.hideRealIdentity && !revealIdentity
      ? mockCreator.publicOrganization ?? mockCreator.city
      : mockCreator.organization;
    const bio = mockCreator.hideRealIdentity && !revealIdentity
      ? mockCreator.sanitizedBio
      : mockCreator.bio;

    return (
      <div className="page-shell max-w-4xl space-y-8 py-12">
        <Link href="/creators" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
          ← 返回创作者学院
        </Link>

        <div className="card space-y-5 p-8">
          <div className="flex items-start gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent)] text-3xl font-bold text-white shrink-0">
              {mockCreator.avatarSeed}
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-[var(--ink)]">{displayName}</h1>
                {mockLawyer ? <PracticeLawyerBadge /> : null}
                {mockCreator.isEmployedCreator && <Badge variant="secondary">在职创作者</Badge>}
              </div>
              <p className="text-[var(--muted)]">{organization}</p>
              <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">{bio}</p>
            </div>
          </div>

          {mockCreator.isEmployedCreator && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-semibold text-amber-900">{currentStatus.title}</p>
              <p className="mt-2 text-sm leading-7 text-amber-800">
                该创作者当前以在职创作者身份进行创作，已开启身份信息保护。{currentStatus.desc}
              </p>
              {!revealIdentity && (
                <p className="mt-2 text-sm leading-7 text-amber-800">
                  在获得创作者同意后，你将看到更多可公开信息。
                </p>
              )}
            </div>
          )}

          <div className="grid gap-4 text-sm sm:grid-cols-3">
            <div className="rounded-2xl bg-[rgba(212,165,116,0.08)] p-4">
              <span className="text-xs text-[var(--muted)]">创作方向</span>
              <p className="mt-1 font-semibold text-[var(--ink)]">{(mockCreator.specialty ?? []).slice(0, 2).join(" / ")}</p>
            </div>
            <div className="rounded-2xl bg-[rgba(212,165,116,0.08)] p-4">
              <span className="text-xs text-[var(--muted)]">已发布内容</span>
              <p className="mt-1 font-semibold text-[var(--ink)]">{mockCreator.worksPublished} 项</p>
            </div>
            <div className="rounded-2xl bg-[rgba(212,165,116,0.08)] p-4">
              <span className="text-xs text-[var(--muted)]">智能体数量</span>
              <p className="mt-1 font-semibold text-[var(--ink)]">{mockCreator.agentsPublished} 个</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(mockCreator.specialty ?? []).map((item) => (
              <span
                key={item}
                className="rounded-full border border-[var(--accent)]/15 bg-[var(--accent)]/8 px-3 py-1 text-sm text-[var(--accent)]"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 border-t border-[var(--line)] pt-4">
            {mockCreator.isEmployedCreator && mockCreator.hideRealIdentity && !revealIdentity ? (
              <>
                <ContactInvitationModal creatorId={mockCreator.id} creatorName={displayName} />
                <Link
                  href={`/creators/${mockCreator.id}/invitation?status=${invitationStatus}`}
                  className="inline-flex h-10 items-center rounded-2xl border border-[rgba(212,165,116,0.25)] px-4 text-sm font-medium text-[#D4A574] hover:bg-[rgba(212,165,116,0.08)]"
                >
                  查看邀请状态
                </Link>
              </>
            ) : (
              <Link
                href={hasLawyerContactRoute ? `/find-lawyer/contact/${mockCreator.id}` : `/creators/${mockCreator.id}/invitation?status=${invitationStatus}`}
                className="inline-flex h-10 items-center rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-4 text-sm font-semibold text-white"
              >
                {hasLawyerContactRoute ? "联系创作者" : "查看邀请结果"}
              </Link>
            )}
            <Link
              href="/creators/policies/identity-and-privacy"
              className="inline-flex h-10 items-center rounded-2xl border border-[rgba(212,165,116,0.25)] px-4 text-sm font-medium text-[#D4A574] hover:bg-[rgba(212,165,116,0.08)]"
            >
              查看隐私规则
            </Link>
          </div>
        </div>

        {revealIdentity && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-[var(--ink)]">已获授权展示的信息</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-[rgba(212,165,116,0.08)] p-4">
                <span className="text-xs text-[var(--muted)]">真实姓名</span>
                <p className="mt-1 font-semibold text-[var(--ink)]">{mockCreator.realName}</p>
              </div>
              <div className="rounded-2xl bg-[rgba(212,165,116,0.08)] p-4">
                <span className="text-xs text-[var(--muted)]">公开机构</span>
                <p className="mt-1 font-semibold text-[var(--ink)]">{mockCreator.organization}</p>
              </div>
              <div className="rounded-2xl bg-[rgba(212,165,116,0.08)] p-4">
                <span className="text-xs text-[var(--muted)]">联系路径</span>
                <p className="mt-1 font-semibold text-[var(--ink)]">平台协助转达 / 邀请继续沟通</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockProductCards.map((item) => (
            <div key={item.title} className="card flex flex-col gap-3 p-5">
              <h2 className="font-semibold text-[var(--ink)]">{item.title}</h2>
              <p className="flex-1 text-sm leading-7 text-[var(--muted)]">{item.desc}</p>
              <Link href={item.href} className="inline-flex h-10 items-center justify-center rounded-2xl bg-[rgba(212,165,116,0.15)] px-4 text-sm font-medium text-[#D4A574] hover:bg-[rgba(212,165,116,0.2)]">
                {item.cta}
              </Link>
            </div>
          ))}
        </div>

        <CreatorFeedbackPanel
          creatorId={mockCreator.id}
          creatorName={displayName}
          products={mockProductCards.map((item) => ({ id: item.id, title: item.title }))}
        />
      </div>
    );
  }

  if (!profile) notFound();

  const { data: lawyerProfileData } = await supabase
    .from("lawyer_profiles")
    .select("*")
    .eq("user_id", id)
    .single();

  const { data: activeAgentsData } = await supabase
    .from("agents")
    .select("*")
    .eq("creator_id", id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const { data: activeSkillsData } = await supabase
    .from("skills")
    .select("id, slug, title, summary, price, status")
    .eq("creator_id", id)
    .in("status", ["active", "published"])
    .order("updated_at", { ascending: false });

  const lawyerProfile = (lawyerProfileData ?? null) as LawyerProfile | null;
  const activeAgents = (activeAgentsData ?? []) as Record<string, unknown>[];
  const activeSkills = (activeSkillsData ?? []) as SkillRow[];
  const realCreatorProducts = activeSkills.map((skill: SkillRow) => ({
    id: String(skill.id || ""),
    title: String(skill.title || "未命名作品"),
  }));

  return (
    <div className="page-shell max-w-3xl space-y-8 py-12">
      <Link href="/creators" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← 返回创作者学院
      </Link>

      <div className="card space-y-5 p-8">
        <div className="flex items-start gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent)] text-3xl font-bold text-white shrink-0">
            {(profile.display_name ?? "?")[0]}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-[var(--ink)]">{profile.display_name ?? "匿名创作者"}</h1>
              {profile.lawyer_verified ? <PracticeLawyerBadge /> : null}
            </div>
            {lawyerProfile?.law_firm && <p className="text-[var(--muted)]">{lawyerProfile.law_firm}</p>}
            {profile.bio && <p className="max-w-xl text-sm leading-relaxed text-[var(--muted)]">{profile.bio}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 text-sm sm:grid-cols-3">
          {lawyerProfile?.years_experience && (
            <div>
              <span className="text-xs text-[var(--muted)]">执业年限</span>
              <p className="font-semibold text-[var(--ink)]">{lawyerProfile.years_experience} 年</p>
            </div>
          )}
          {lawyerProfile?.bar_number && (
            <div>
              <span className="text-xs text-[var(--muted)]">执业证号</span>
              <p className="truncate font-semibold text-[var(--ink)]">{lawyerProfile.bar_number}</p>
            </div>
          )}
          <div>
            <span className="text-xs text-[var(--muted)]">智能体数量</span>
            <p className="font-semibold text-[var(--ink)]">{activeAgents?.length ?? 0} 个</p>
          </div>
          <div>
            <span className="text-xs text-[var(--muted)]">已上架作品</span>
            <p className="font-semibold text-[var(--ink)]">{activeSkills?.length ?? 0} 个</p>
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-8">
        <h2 className="text-lg font-semibold text-[var(--ink)]">创作产品</h2>
        {activeSkills?.length ? (
          <div className="grid gap-3">
            {activeSkills.slice(0, 8).map((skill: Record<string, unknown>) => (
              <Link
                key={String(skill.id)}
                href={`/inspiration/${encodeURIComponent(String(skill.slug || skill.id))}`}
                className="rounded-2xl border border-[var(--line)] bg-white p-4 hover:border-[var(--accent)]/35"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-[var(--ink)]">{String(skill.title || "未命名作品")}</div>
                  <div className="text-sm text-[var(--accent)]">
                    {Number(skill.price ?? 0) > 0
                      ? `¥ ${Number(skill.price ?? 0)}`
                      : "免费"}
                  </div>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {String(skill.summary || "已通过审核并上架至灵感广场。")}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">暂无已上架作品。</p>
        )}
      </div>

      <CreatorFeedbackPanel
        creatorId={String(profile.id)}
        creatorName={String(profile.display_name ?? "匿名创作者")}
        products={realCreatorProducts}
      />
    </div>
  );
}
