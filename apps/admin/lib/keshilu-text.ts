/**
 * 书法字体缺简体字形时，优先替换为对应繁体，避免出现回退字体导致风格不一致。
 */
const KESHILU_MISSING_SIMPL_TO_TRAD: Record<string, string> = {
  让: "讓",
  灵: "靈",
  实: "實",
  践: "踐",
  创: "創",
  启: "啓",
  录: "錄",
  锁: "鎖",
  选: "選",
  广: "廣",
  页: "頁",
  场: "場",
  区: "區",
  会: "會",
  机: "機",
  现: "現",
  发: "發",
  师: "師",
  册: "冊",
  联: "聯",
  调: "調",
  测: "測",
  试: "試",
  评: "評",
  证: "證",
  课: "課",
};

export function preferTradForKeShiLu(text: string): string {
  return Array.from(text, (ch) => KESHILU_MISSING_SIMPL_TO_TRAD[ch] ?? ch).join("");
}
