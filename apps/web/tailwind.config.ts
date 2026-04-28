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
        // ── Layer 2 语义 token ──

        /** 品牌深植绿 */
        brand: {
          DEFAULT: palette.forest,
          deep: palette.forestDeep,
        },

        /** CTA 主色 - 深植绿 */
        cta: {
          DEFAULT: palette.forest,
          hover: palette.forestMid,
        },

        /** 情绪色：淡绿色系 */
        emotion: {
          DEFAULT: palette.mint,
          light: palette.mintLight,
          border: palette.mintBorder,
        },

        // ── 向后兼容 ──
        background: "var(--bg)",
        surface:    "var(--surface)",
        ink:        "var(--ink)",
        border:     "var(--line)",
        input:      "var(--line)",
        ring:       "var(--accent)",
        foreground: "var(--ink)",

        primary: {
          DEFAULT:    palette.forest,
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT:    palette.mintLight,
          foreground: palette.textPrimary,
        },
        destructive: {
          DEFAULT:    palette.danger,
          foreground: "#ffffff",
        },
        card: {
          DEFAULT:    palette.cardWhite,
          foreground: palette.textPrimary,
        },
        popover: {
          DEFAULT:    palette.cardWhite,
          foreground: palette.textPrimary,
        },
        muted: {
          DEFAULT:    palette.mintLight,
          foreground: palette.textSecondary,
        },
        accent: {
          DEFAULT:    palette.mint,
          foreground: palette.forest,
        },
      },

      fontFamily: {
        sans: [
          "PingFang SC",
          "HarmonyOS Sans SC",
          "Noto Sans SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "Inter",
          "sans-serif",
        ],
      },

      borderRadius: {
        sm:    radiusPalette.sm,
        md:    radiusPalette.md,
        lg:    radiusPalette.lg,
        xl:    radiusPalette.xl,
        "2xl": "1rem",
        "3xl": "1.5rem",
      },

      boxShadow: {
        card:         shadowPalette.card,
        "card-hover": shadowPalette.hover,
        "card-brand": shadowPalette.brand,
        sm:           shadowPalette.sm,
      },
    },
  },
  plugins: [typography],
};

export default config;
