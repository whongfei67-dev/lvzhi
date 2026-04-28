import { notFound, redirect } from "next/navigation";

/** 已下线榜单：地区/领域由 /lawyers 页筛选 + 综合推荐承接 */
const LEGACY_KIND_TO_COMPREHENSIVE = new Set(["region", "domain"]);

/** 蓝图 §8.2：子榜单 → 与 `/lawyers/rankings?tab=` 对齐 */
const KINDS = new Set(["comprehensive", "influence", "newcomer", "firm_influence"]);

export default async function LawyerRankingKindPage({
  params,
}: {
  params: Promise<{ kind: string }>;
}) {
  const { kind } = await params;
  if (LEGACY_KIND_TO_COMPREHENSIVE.has(kind)) {
    redirect("/lawyers/rankings?tab=comprehensive");
  }
  if (!KINDS.has(kind)) notFound();
  redirect(`/lawyers/rankings?tab=${encodeURIComponent(kind)}`);
}
