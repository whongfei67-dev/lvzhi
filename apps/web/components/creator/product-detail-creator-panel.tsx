import Link from "next/link";
import { PracticeLawyerBadge } from "@/components/common/practice-lawyer-badge";

/** 与智能体等产品详情页右侧「创作者信息」卡片一致 */
export function ProductDetailCreatorPanel({
  creatorId,
  displayName,
  bio,
  /** 与灵感广场作品详情一致：链到营销侧律师主页 `/lawyers/[slug]`（`lib/lawyer-detail-view` 预设名或接口 slug） */
  lawyerProfileSlug,
  lawyerVerified = false,
}: {
  creatorId: string;
  displayName: string;
  bio?: string | null;
  lawyerProfileSlug?: string | null;
  lawyerVerified?: boolean;
}) {
  const lawyerSlug = lawyerProfileSlug?.trim();
  const detailHref = lawyerSlug
    ? `/lawyers/${encodeURIComponent(lawyerSlug)}`
    : `/creators/${encodeURIComponent(creatorId)}`;
  const detailLabel = lawyerSlug ? "进入律师主页" : "查看创作者详情";

  return (
    <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
      <div className="text-lg font-semibold text-[#2C2416]">创作者信息</div>
      <div className="mt-4 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#D4A574] to-[#B8860B] text-lg font-bold text-white">
            {(displayName ?? "?")[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-[#2C2416]">
              <span>{displayName ?? "匿名创作者"}</span>
              {lawyerVerified ? <PracticeLawyerBadge className="!text-[10px]" /> : null}
            </div>
            {bio ? (
              <p className="mt-2 text-sm leading-6 text-[#9A8B78] line-clamp-3">{bio}</p>
            ) : null}
          </div>
        </div>
        <Link
          href={detailHref}
          className="inline-flex w-full items-center justify-center rounded-xl border border-[rgba(212,165,116,0.25)] px-3 py-2 text-sm font-medium text-[#D4A574] transition-colors hover:bg-[rgba(212,165,116,0.08)] sm:w-auto sm:justify-start"
        >
          {detailLabel}
        </Link>
      </div>
    </div>
  );
}
