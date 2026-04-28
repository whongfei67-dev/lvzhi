import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import { radiusPalette } from "./lib/radius";
import { shadowPalette } from "./lib/shadows";

/**
 * 律植 Tailwind 配置 v3.0 — UI预演方案
 *
 * 视觉方向：琥珀咖啡色系 + 思源宋体 + 丝绒质感
 * 颜色来源：UI预演/base.css
 */

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
        // ── UI预演琥珀咖啡色系 ──────────────────────────────────────────────

        /** 琥珀色 - 强调色、hover状态、高亮 */
        amber: {
          DEFAULT: "#D4A574",
          dark: "#B8860B",
          light: "#E8CDB5",
        },

        /** 咖啡色 - 主色、按钮、标题 */
        coffee: {
          DEFAULT: "#5C4033",
          light: "#8B7355",
          dark: "#3E2A1F",
        },

        /** 奶油白 - 页面背景 */
        cream: "#FFF8F0",

        /** 文字三级 */
        text: {
          DEFAULT: "#2C2416",
          secondary: "#5D4E3A",
          muted: "#9A8B78",
        },

        /** 边框色 */
        border: {
          DEFAULT: "rgba(212,165,116,0.25)",
          light: "rgba(212,165,116,0.15)",
          dark: "rgba(92,64,51,0.3)",
        },

        // ── 语义 token ──────────────────────────────────────────────────────

        /** 品牌色 - 使用 coffee 作为品牌主色 */
        brand: {
          DEFAULT: "#5C4033",
          light: "#8B7355",
          dark: "#3E2A1F",
        },

        /** CTA 按钮色 */
        cta: {
          DEFAULT: "#5C4033",
          hover: "#8B7355",
          light: "#A68B6A",
        },

        /** 琥珀强调色 */
        accent: {
          DEFAULT: "#D4A574",
          light: "#E8CDB5",
          dark: "#B8860B",
        },

        /** 背景层次 */
        "bg-page": "#FFF8F0",
        "bg-card": "#FFFFFF",
        "bg-subtle": "rgba(212,165,116,0.08)",

        // ── 向后兼容：保留旧 CSS 变量映射 ────────────────────────────────────

        background: "var(--bg, #FFF8F0)",
        foreground: "var(--ink, #2C2416)",
        surface: "#FFFFFF",
        ink: "#2C2416",
        muted: "#5D4E3A",
        subtle: "#9A8B78",
        line: "rgba(212,165,116,0.25)",

        // ── shadcn/ui 兼容映射（HSL 格式）───────────────────────────────────

        primary: {
          DEFAULT: "#5C4033",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#D4A574",
          foreground: "#2C2416",
        },
        destructive: {
          DEFAULT: "#D94D4D",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F5EDE5",
          foreground: "#5D4E3A",
        },
        accent: {
          DEFAULT: "rgba(212,165,116,0.15)",
          foreground: "#5C4033",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#2C2416",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#2C2416",
        },
        border: "rgba(212,165,116,0.25)",
        input: "rgba(212,165,116,0.25)",
        ring: "#D4A574",

        // ── 功能色 ─────────────────────────────────────────────────────────

        success: "#2FA863",
        warning: "#E8A83C",
        danger: "#D94D4D",

        // ── 保留旧的颜色映射（兼容）──────────────────────────────────────────

        // 旧 forest/mint 颜色映射到新色系
        forest: "#5C4033",
        "forest-deep": "#3E2A1F",
        "forest-mid": "#8B7355",
        mint: "#E8CDB5",
        "mint-light": "#F5EDE5",
        "mint-border": "#D4A574",

        // 旧语义映射
        "text-primary": "#2C2416",
        "text-secondary": "#5D4E3A",
        "text-weak": "#9A8B78",
        "bg-page-old": "#F7F7F3",
        "bg-card-old": "#FFFFFF",
        "border-default": "rgba(212,165,116,0.25)",
      },

      fontFamily: {
        // ── UI预演要求：全站使用思源宋体 ───────────────────────────────────
        serif: [
          "'Noto Serif SC'",
          "'Source Han Serif CN'",
          "宋体",
          "SimSun",
          "serif",
        ],
        // 默认 sans 也使用思源宋体以保持一致
        sans: [
          "'Noto Serif SC'",
          "'Source Han Serif CN'",
          "'PingFang SC'",
          "'Microsoft YaHei'",
          "sans-serif",
        ],
        // 代码字体
        mono: [
          "Menlo",
          "Monaco",
          "'Courier New'",
          "monospace",
        ],
      },

      borderRadius: {
        // ── 与 lib/radius.ts radiusPalette 保持严格同步 ──
        sm: "8px",       // 12px  tag / chip / badge
        md: "10px",      // 16px  button / input / select
        lg: "16px",      // 24px  card / panel / modal
        xl: "24px",      // 32px  hero / large container
        "2xl": "24px",
        "3xl": "32px",
        // 保留旧映射
        ...radiusPalette,
      },

      boxShadow: {
        // ── UI预演阴影系统 ────────────────────────────────────────────────
        sm: "0 2px 8px rgba(92,64,51,0.08)",
        md: "0 8px 24px rgba(92,64,51,0.12)",
        lg: "0 16px 48px rgba(92,64,51,0.16)",
        // ── 保留旧映射 ───────────────────────────────────────────────────
        card: "0 2px 8px rgba(92,64,51,0.08)",
        "card-hover": "0 8px 24px rgba(92,64,51,0.12)",
        "card-ai": "0 8px 32px rgba(212,165,116,0.25)",
        ...shadowPalette,
      },

      // ── UI预演动画时长 ──────────────────────────────────────────────────
      transitionDuration: {
        fast: "0.15s",
        normal: "0.3s",
        slow: "0.5s",
      },

      // ── 自定义动画 ──────────────────────────────────────────────────────
      animation: {
        "fade-in-up": "fadeInUp 0.6s ease-out forwards",
        "fade-in-down": "fadeInDown 0.6s ease-out forwards",
        "fade-in-left": "fadeInLeft 0.6s ease-out forwards",
        "fade-in-right": "fadeInRight 0.6s ease-out forwards",
        "slow-zoom": "slowZoom 20s ease-in-out infinite alternate",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "slide-in": "slideIn 0.3s ease-out forwards",
      },

      keyframes: {
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(40px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          from: { opacity: "0", transform: "translateY(-40px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeInLeft: {
          from: { opacity: "0", transform: "translateX(-40px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        fadeInRight: {
          from: { opacity: "0", transform: "translateX(40px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        slowZoom: {
          from: { transform: "scale(1)" },
          to: { transform: "scale(1.1)" },
        },
        slideIn: {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [typography],
};

export default config;
