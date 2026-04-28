import Link from "next/link";

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { cn } from "@/lib/utils";

/**
 * 全站「律植」字标 — 与工作台侧栏同款书法栈（`--font-marketing-brush`），
 * 通过 `tone` / `size` 适配浅色顶栏、深色侧栏、Hero 深色底与表单区。
 */

export type LogoTone = "light" | "dark" | "hero";
/**
 * `nav`：仅营销顶栏最左、页脚左上「律植」，字号同发现律师页 `.hero-title--single-brush-line`。
 * `form`：登录/注册等窄卡片内字标。
 */
export type LogoSize = "xs" | "sm" | "md" | "lg" | "hero" | "form" | "nav";

export type LogoProps = {
  size?: LogoSize;
  tone?: LogoTone;
  href?: string;
  className?: string;
  /** 为 false 时只渲染字标节点（用于已外包一层 `<Link>` / `<a>` 的场景） */
  link?: boolean;
  /** `link` 为 true 时用于无障碍名称 */
  ariaLabel?: string;
};

export function Logo({
  size = "md",
  tone = "light",
  href = "/",
  className,
  link = true,
  ariaLabel = "律植 · 返回首页",
}: LogoProps) {
  const label = preferTradForKeShiLu("律植");
  /**
   * `nav` 字标：与发现律师页主标题一致 —— `.hero-title.hero-title--single-brush-line`
   *（`clamp(1.9rem, 4.35vw, 3.45rem)` + `line-height: 1.2` + `letter-spacing: 0.06em`）。
   */
  const navUtilitySize =
    size === "nav"
      ? "!text-[clamp(1.9rem,4.35vw,3.45rem)] !leading-[1.2] !tracking-[0.06em]"
      : "";
  /** 与 `.hero-title` 同色 `#5C4033`（`--coffee`）；盖过 base 里 `a{color:inherit}` 继承的正文色 `#2C2416` */
  const lightToneColor =
    tone === "light"
      ? cn("!text-[#5C4033]", link ? "hover:!text-[#8b5a2b]" : null)
      : "";
  const cls = cn(
    "brand-wordmark",
    `brand-wordmark--size-${size}`,
    `brand-wordmark--tone-${tone}`,
    lightToneColor,
    navUtilitySize,
    className,
  );

  if (!link) {
    return <span className={cls}>{label}</span>;
  }

  return (
    <Link href={href} className={cls} aria-label={ariaLabel}>
      {label}
    </Link>
  );
}
