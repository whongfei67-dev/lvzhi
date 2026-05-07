import { Converter } from "opencc-js";

/**
 * 全站文字策略（2026-05）：
 * - 非思源宋体、非楷体：默认展示繁体
 * - 楷体：展示简体
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

const SIMPLIFIED_TO_TRADITIONAL = Converter({ from: "cn", to: "tw" });
const TRADITIONAL_TO_SIMPLIFIED = Converter({ from: "tw", to: "cn" });

export function preferTradForKeShiLu(text: string): string {
  const baseTraditional = SIMPLIFIED_TO_TRADITIONAL(text);
  return Array.from(baseTraditional, (ch) => KESHILU_MISSING_SIMPL_TO_TRAD[ch] ?? ch).join("");
}

export function preferSimplForKaiTi(text: string): string {
  return TRADITIONAL_TO_SIMPLIFIED(text);
}

export function preferSimplForSourceHanSerif(text: string): string {
  return TRADITIONAL_TO_SIMPLIFIED(text);
}
