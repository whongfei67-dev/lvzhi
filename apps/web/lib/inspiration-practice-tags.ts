/** 灵感广场 / 精选灵感等业务域筛选（与作品 category 或 API slug 对齐） */
export const PRACTICE_TAGS = [
  { id: "all", label: "全部" },
  { id: "contract", label: "合同法" },
  { id: "labor", label: "劳动法" },
  { id: "ip", label: "知识产权" },
  { id: "corporate", label: "公司法" },
  { id: "family", label: "婚姻家事" },
] as const;

const SLUG_TO_LABEL: Record<string, string> = {
  contract: "合同法",
  labor: "劳动法",
  ip: "知识产权",
  corporate: "公司法",
  family: "婚姻家事",
};

/** 当前筛选标签是否与条目 category 匹配（支持中文类目或英文 slug） */
export function categoryMatchesPracticeTag(categoryRaw: string, tagId: string): boolean {
  if (tagId === "all") return true;
  const c = String(categoryRaw ?? "").trim();
  if (!c) return false;
  const label = PRACTICE_TAGS.find((t) => t.id === tagId)?.label;
  if (label && c === label) return true;
  const mapped = SLUG_TO_LABEL[tagId];
  if (mapped && c === mapped) return true;
  if (c.toLowerCase() === tagId.toLowerCase()) return true;
  return false;
}
