import { redirect } from "next/navigation";

/** 蓝图 §4.2：Skill 详情 — 当前实现为 `/inspiration/[slug]`（slug 与 id 同参） */
export default async function InspirationSkillByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/inspiration/${encodeURIComponent(id)}`);
}
