import { redirect } from "next/navigation";

/** 蓝图 §4.3：智能体详情 — 当前实现为 `/inspiration/[slug]/agent` */
export default async function InspirationAgentByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/inspiration/${encodeURIComponent(id)}/agent`);
}
