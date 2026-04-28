import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import { palette } from "./lib/colors";
import { radiusPalette } from "./lib/radius";
import { shadowPalette } from "./lib/shadows";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Layer 2 语义 token：直接用 palette 值，与 lib/colors.ts 保持同步 ──

        /** 品牌深蓝：logo / 标题 / 导航 */
        brand: {
          DEFAULT: palette.navy,
          dark:    "#0A1E30",   // hover 深化
          light:   "#1A3A5C",   // 浅变体
        },

        /** 科技蓝：主按钮 / CTA / 智能体 */
        cta: {
          DEFAULT: palette.blue,
          alt:     palette.indigo,  // 渐变终点
        },

        /** 背景层次 */
        "bg-page": palette.bgPage,
        "bg-card": palette.bgCard,

        /** 边框 */
        "border-default": palette.border,

        /** 文字三级 */
        "text-primary":   palette.textPrimary,
        "text-secondary": palette.textSecondary,
        "text-weak":      palette.textWeak,

        /** 功能色 */
        "color-success": palette.success,
        "color-warning": palette.warning,
        "color-danger":  palette.danger,

        // ── 向后兼容：保留旧 shadcn / CSS-var 映射 ──────────────────────

        background: "var(--bg)",
        surface:    "var(--surface)",
        ink:        "var(--ink)",
        border:     "var(--line)",
        input:      "var(--line)",
        ring:       "var(--accent)",
        foreground: "var(--ink)",

        primary: {
          DEFAULT:    palette.blue,
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT:    palette.indigo,
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT:    palette.danger,
          foreground: "#ffffff",
        },
        card: {
          DEFAULT:    palette.bgCard,
          foreground: palette.textPrimary,
        },
        popover: {
          DEFAULT:    palette.bgCard,
          foreground: palette.textPrimary,
        },
        muted: {
          DEFAULT:    "#F1F5F9",
          foreground: palette.textSecondary,
        },
        accent: {
          DEFAULT:    "rgba(59, 130, 246, 0.08)",
          foreground: palette.blue,
        },
      },

      fontFamily: {
        sans: [
          "PingFang SC",
          "HarmonyOS Sans SC",
          "Noto Sans SC",
          "Hiragino Sans GB",
          "Inter",
          "sans-serif",
        ],
      },

      borderRadius: {
        // ── 与 lib/radius.ts radiusPalette 保持严格同步 ──
        sm:    radiusPalette.sm,   // 0.75rem  12px  tag / chip / badge
        md:    radiusPalette.md,   // 1rem     16px  button / input / select
        lg:    radiusPalette.lg,   // 1.5rem   24px  card / panel / modal
        xl:    radiusPalette.xl,   // 2rem     32px  hero / large container
        // 扩展级（用于过渡兼容，不在 radiusPalette 中）
        "2xl": "1.5rem",           // 等同 lg，向下兼容旧 rounded-2xl 用法
        "3xl": "2rem",             // 等同 xl，向下兼容旧 rounded-3xl 用法
      },

      boxShadow: {
        // ── 与 lib/shadows.ts shadowPalette 保持严格同步 ──
        card:         shadowPalette.card,   // 卡片默认
        "card-hover": shadowPalette.hover,  // 悬停增强
        "card-ai":    shadowPalette.ai,     // AI 科技光晕
        sm:           shadowPalette.sm,     // 极小阴影
      },
    },
  },
  plugins: [typography],
};

export default config;
