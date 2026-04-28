/**
 * 书法字库缺少部分简体字时，优先切换为对应繁体，避免字体回退不一致。
 * 当前「律植」简繁同形，保持原样；该映射用于后续文案扩展时兜底。
 */
const BRUSH_MISSING_SIMPL_TO_TRAD: Record<string, string> = {
  录: "錄",
  锁: "鎖",
  师: "師",
  详: "詳",
  后: "後",
  会: "會",
  联: "聯",
  课: "課",
  页: "頁",
};

export function preferTradForBrush(text: string): string {
  return Array.from(text, (ch) => BRUSH_MISSING_SIMPL_TO_TRAD[ch] ?? ch).join("");
}
