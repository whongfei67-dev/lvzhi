/**
 * 律植圆角系统
 *
 * 与颜色系统同理，分两层：
 *   palette  原始尺寸值
 *   tokens   语义用途
 *
 * 与 tailwind.config 保持严格一致，修改时两处同步。
 */

// ─── 原始尺寸 ─────────────────────────────────────────────────────────────────

export const radiusPalette = {
  sm: "0.75rem",  //  12px
  md: "1rem",     //  16px
  lg: "1.5rem",   //  24px
  xl: "2rem",     //  32px
} as const;

// ─── 语义用途 ─────────────────────────────────────────────────────────────────

export const radiusTokens = {
  /**
   * 小圆角 — 0.75rem (12px)
   * ✅ 标签 (Badge)、芯片 (Chip)、行内 Tag
   * ✅ 搜索框、输入框内的清除按钮
   */
  tag: radiusPalette.sm,

  /**
   * 中圆角 — 1rem (16px)
   * ✅ 按钮 (Button)、输入框 (Input)、Select
   * ✅ 小型卡片内部元素、Tooltip
   */
  control: radiusPalette.md,

  /**
   * 大圆角 — 1.5rem (24px)
   * ✅ 卡片 (Card)、面板 (Panel)、Drawer
   * ✅ 弹窗 (Modal)、下拉菜单、榜单行
   */
  card: radiusPalette.lg,

  /**
   * 超大圆角 — 2rem (32px)
   * ✅ 首页 Hero 区块、大型内容容器
   * ✅ PriceCard、SectionHeader、创作者计划卡片
   */
  hero: radiusPalette.xl,
} as const;

export type RadiusPaletteKey = keyof typeof radiusPalette;
export type RadiusTokenKey   = keyof typeof radiusTokens;
