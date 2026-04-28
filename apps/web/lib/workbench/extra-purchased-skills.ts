/**
 * 免费 Skills 等：在正式订单接口未写入前，将「已获取」同步到工作画布「已购买技能」列表（本机合并展示）。
 */

export const WB_EXTRA_PURCHASED_SKILLS_KEY = "lvzhi_wb_extra_purchased_skills_v1";

export type ExtraPurchasedSkillRow = {
  id: string;
  skill_title: string;
  purchased_at: string;
};

function parseStored(raw: string | null): ExtraPurchasedSkillRow[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => {
        const o = x as Record<string, unknown>;
        return {
          id: String(o.id ?? "").trim(),
          skill_title: String(o.skill_title ?? o.title ?? "未命名").trim() || "未命名",
          purchased_at: String(o.purchased_at ?? new Date().toISOString()),
        };
      })
      .filter((r) => r.id);
  } catch {
    return [];
  }
}

export function readExtraPurchasedSkills(): ExtraPurchasedSkillRow[] {
  if (typeof window === "undefined") return [];
  return parseStored(localStorage.getItem(WB_EXTRA_PURCHASED_SKILLS_KEY));
}

/** 写入本机；与订单接口返回的列表在画布中合并展示（按 id 去重，订单优先）。 */
export function claimSkillToWorkbenchLocal(skillId: string, title: string): void {
  if (typeof window === "undefined") return;
  const id = String(skillId ?? "").trim();
  if (!id) return;
  const existing = parseStored(localStorage.getItem(WB_EXTRA_PURCHASED_SKILLS_KEY));
  if (existing.some((s) => s.id === id)) return;
  const next: ExtraPurchasedSkillRow[] = [
    ...existing,
    { id, skill_title: title.trim() || "未命名", purchased_at: new Date().toISOString() },
  ];
  try {
    localStorage.setItem(WB_EXTRA_PURCHASED_SKILLS_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("lvzhi-wb-extra-purchased"));
  } catch {
    /* ignore */
  }
}
