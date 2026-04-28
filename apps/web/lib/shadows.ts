/**
 * 律植阴影系统 v2.0
 *
 * 视觉方向：温和、克制、专业
 * 与新的绿色系配色配合使用
 */

// ─── 原始阴影 ─────────────────────────────────────────────────────────────────

export const shadowPalette = {
  /** 卡片默认阴影：轻微浮起感 */
  card:  "0 2px 8px rgba(40, 74, 61, 0.06)",
  /** 悬停阴影：增强层次感 */
  hover: "0 8px 24px rgba(40, 74, 61, 0.10)",
  /** 品牌绿色光晕（CTA 按钮） */
  brand: "0 8px 20px rgba(40, 74, 61, 0.12)",
  /** 极小阴影：输入框、小型元素 */
  sm:    "0 1px 4px rgba(40, 74, 61, 0.04)",
} as const;

// ─── 语义用途 ─────────────────────────────────────────────────────────────────

export const shadowTokens = {
  /**
   * 卡片静态阴影
   * ✅ Card、Panel、榜单行、表单容器
   */
  card: shadowPalette.card,

  /**
   * 悬停阴影
   * ✅ 卡片 hover 状态
   * ✅ 下拉菜单、Tooltip、浮层
   */
  hover: shadowPalette.hover,

  /**
   * 品牌光晕
   * ✅ CTA 主按钮
   * ❌ 不用于普通内容卡片
   */
  brand: shadowPalette.brand,

  /**
   * 极小阴影
   * ✅ Input、Select 聚焦态
   * ✅ Badge、小型浮层
   */
  sm: shadowPalette.sm,
} as const;

export type ShadowPaletteKey = keyof typeof shadowPalette;
export type ShadowTokenKey   = keyof typeof shadowTokens;
