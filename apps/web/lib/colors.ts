/**
 * 律植颜色系统 — 两层管理（v2.0 绿色系）
 *
 * Layer 1  palette   原始色值，只描述"是什么颜色"
 * Layer 2  tokens    语义映射，描述"颜色用来干什么"
 *
 * 视觉方向：温和、专业、有生长感、有植物感
 * 不使用：蓝紫渐变、霓虹蓝、科技蓝主导
 */

// ─── Layer 1: 颜色库（palette） ───────────────────────────────────────────────

export const palette = {
  // ── 情绪色：淡绿色系 ──
  // 用于：标签、hover状态、轻背景、辅助卡片底、品牌记忆点
  /** 品牌浅绿：柔和、有生长感 */
  mint:         "#DDEAE1",
  /** 雾绿浅底：轻背景、留白区 */
  mintLight:    "#EEF4EF",
  /** 薄荷绿：hover状态、轻强调 */
  mintBorder:   "#C4DBCB",

  // ── 结构色：深植绿/墨绿 ──
  // 用于：主按钮、CTA、导航强调、深色section、品牌骨架
  /** 深植绿：专业、稳定、品牌骨架 */
  forest:       "#284A3D",
  /** 墨绿黑：最深文字、标题锚点 */
  forestDeep:   "#18261F",
  /** 森林中绿：按钮hover、强调 */
  forestMid:    "#3A6354",

  // ── 中性色：暖白/灰绿白/深灰绿 ──
  // 用于：页面底色、正文、边框、分割线
  /** 暖白底：页面大背景 */
  warmWhite:    "#F7F7F3",
  /** 卡片白：纯白略暖 */
  cardWhite:    "#FFFFFF",
  /** 边框灰绿：分割线、输入框边框 */
  borderGreen:  "#D9DED7",
  /** 正文深灰绿：正文、说明文字 */
  textPrimary: "#2E3430",
  /** 次级灰绿：副标题、标签 */
  textSecondary:"#5A6560",
  /** 弱化灰绿：占位符、时间戳 */
  textWeak:     "#9AA59D",

  // ── 功能色 ──
  /** 成功绿 */
  success:      "#2FA863",
  /** 警告橙 */
  warning:      "#E8A83C",
  /** 风险红 */
  danger:       "#D94D4D",
} as const;


// ─── Layer 2: 使用规则（tokens） ──────────────────────────────────────────────

export const tokens = {
  /**
   * 品牌深植绿
   * ✅ 品牌 logo、深色 section 背景、标题锚点
   * ✅ 表达专业感、稳定感
   */
  brand: palette.forest,

  /**
   * 品牌墨绿
   * ✅ 最��标题、深色背景
   * ❌ 不要偏黑过头
   */
  brandDeep: palette.forestDeep,

  /**
   * 主按钮 / CTA
   * ✅ 深植绿作为主 CTA 颜色
   * ✅ 按钮、关键交互
   */
  cta: palette.forest,

  /**
   * CTA hover
   */
  ctaHover: palette.forestMid,

  /**
   * 情绪浅绿（轻量使用）
   * ✅ 标签背景、hover 状态、轻背景区
   * ✅ 生长感、友好感
   * ❌ 不要大面积泛滥
   */
  emotionMint: palette.mint,

  /**
   * 情绪雾绿（背景）
   * ✅ section 背景、卡片底色
   */
  emotionMintLight: palette.mintLight,

  /**
   * 页面背景
   * ✅ <body> 底色
   * ✅ 整体留白感
   */
  bgPage: palette.warmWhite,

  /**
   * 卡片 / 内容容器背景
   * ✅ 卡片、弹窗、表单
   */
  bgCard: palette.cardWhite,

  /**
   * 默认边框
   * ✅ 输入框、卡片边框、分割线
   */
  borderDefault: palette.borderGreen,

  // ── 文字三级 ──
  /** 主要文字：标题、核心内容 */
  textPrimary:   palette.textPrimary,
  /** 次级文字：副标题、说明、标签 */
  textSecondary: palette.textSecondary,
  /** 弱化文字：占位符、时间戳 */
  textWeak:      palette.textWeak,

  // ── 功能色 ──
  /** 成功 / 免费 */
  success: palette.success,
  /** 警告 / 提醒 */
  warning: palette.warning,
  /** 风险 / 错误 */
  danger: palette.danger,
} as const;


// ─── 类型导出 ─────────────────────────────────────────────────────────────────

export type PaletteKey = keyof typeof palette;
export type TokenKey   = keyof typeof tokens;
