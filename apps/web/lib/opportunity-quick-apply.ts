/**
 * 合作机会「一键正文投递」：与后端 `opportunity_applications.file_url` 占位一致
 *（与 `apps/api/src/lib/opportunity-applications-schema.ts` 中 COMMUNITY_APPLICATION_FILE_URL 同值）
 */
export const OPPORTUNITY_TEXT_ONLY_FILE_URL = "community:text-only";

function pickString(rec: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/** 预填工作台资料，用户可在弹窗内修改后再提交 */
export function buildOpportunityQuickApplyMessage(params: {
  opportunityTitle: string;
  publisherName: string;
  detailUrl: string;
  me: Record<string, unknown>;
}): string {
  const display = pickString(params.me, ["display_name", "nickname"]) || "我";
  const bio = pickString(params.me, ["bio"]);
  const org = pickString(params.me, ["work_organization"]);
  const contact = pickString(params.me, ["contact_address", "phone", "email"]);
  const lines: string[] = [];
  lines.push(
    `${params.publisherName} 您好，我在合作机会列表看到「${params.opportunityTitle}」，希望进一步了解并建立合作沟通。`,
  );
  lines.push("");
  lines.push("【我的介绍（来自工作台资料，可修改后发送）】");
  lines.push(`称呼：${display}`);
  if (org) lines.push(`机构/单位：${org}`);
  if (bio) lines.push(`简介：${bio}`);
  if (contact) lines.push(`联系方式：${contact}`);
  lines.push("");
  lines.push(`机会详情：${params.detailUrl}`);
  lines.push("");
  lines.push("如方便，请告知更倾向的沟通方式与时间安排。");
  return lines.join("\n");
}
