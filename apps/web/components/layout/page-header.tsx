"use client";

import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  actions?: ReactNode;
  className?: string;
  titleClassName?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  /** 灵感频道：去掉硬底边线，与奶油色背景融合 */
  variant?: "default" | "inspiration";
  /** 铺满顶区的背景图（如课堂场景），叠营销头图遮罩以保证标题可读 */
  heroImage?: string;
  heroImageAlt?: string;
  /** 头图下缘羽化终点色，与页面主背景一致可避免与正文区接缝线 */
  heroFadeTo?: string;
}

export function PageHeader({
  title,
  description,
  backHref,
  actions,
  className = "",
  titleClassName = "",
  showSearch,
  searchPlaceholder = "搜索...",
  onSearch,
  variant = "default",
  heroImage,
  heroImageAlt = "",
  heroFadeTo = "#FFF8F0",
}: PageHeaderProps) {
  const hasHero = Boolean(heroImage);

  const shell = hasHero
    ? "relative min-h-[15rem] overflow-hidden border-b-0 bg-transparent pt-20 pb-10 sm:min-h-[17rem] lg:pb-12"
    : variant === "inspiration"
      ? "border-b-0 bg-gradient-to-b from-[rgba(255,252,248,0.96)] to-[rgba(255,248,240,0.9)] backdrop-blur-md shadow-[0_26px_56px_-40px_rgba(92,64,51,0.22)] pt-20"
      : "border-b border-[#D9DED7] bg-white pt-20";

  return (
    <section className={`${shell} ${className}`}>
      {hasHero ? (
        <div className="pointer-events-none absolute inset-0 z-0 shadow-[inset_0_-3.5rem_4rem_-1rem_rgba(255,248,240,0.45)] sm:shadow-[inset_0_-4.5rem_5rem_-1rem_rgba(255,248,240,0.5)]">
          <img
            src={heroImage}
            alt={heroImageAlt}
            className="h-full min-h-[15rem] w-full object-cover object-center sm:min-h-[17rem]"
          />
          <div className="marketing-hero-photo-overlay" aria-hidden />
          {/* 下缘羽化：与 heroFadeTo / 页面底色一致，减轻与正文区的分界线 */}
          <div
            className="absolute inset-x-0 bottom-0 z-[1] h-40 sm:h-48 lg:h-56"
            style={{
              background: `linear-gradient(to bottom, transparent 0%, rgba(255,248,240,0.18) 22%, rgba(255,248,240,0.5) 48%, ${heroFadeTo} 82%, ${heroFadeTo} 100%)`,
            }}
            aria-hidden
          />
        </div>
      ) : null}

      <div className={`mx-auto max-w-screen-2xl px-3 py-8 lg:px-5 ${hasHero ? "relative z-[2]" : ""}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            {/* 返回链接 */}
            {backHref && (
              <Link
                href={backHref}
                className={`mb-4 inline-flex items-center gap-1.5 text-sm transition-colors ${
                  hasHero
                    ? "font-medium text-[#5C4033] hover:text-[#B8860B]"
                    : "text-[#5A6560] hover:text-[#284A3D]"
                }`}
              >
                <ArrowLeft className="h-4 w-4" />
                返回
              </Link>
            )}

            {/* 标题 */}
            <h1
              className={`text-3xl font-bold tracking-tight lg:text-4xl ${
                hasHero ? "text-[#2C2416]" : "text-[#2E3430]"
              } ${titleClassName}`}
            >
              {title}
            </h1>

            {/* 描述 */}
            {description && (
              <p
                className={`mt-2 max-w-2xl text-base lg:text-lg ${
                  hasHero ? "text-[#5D4E3A]" : "text-[#5A6560]"
                }`}
              >
                {description}
              </p>
            )}
          </div>

          {/* 操作按钮区 */}
          {actions && <div className="shrink-0">{actions}</div>}
        </div>

        {/* 搜索框（可选） */}
        {showSearch && (
          <div className="mt-6">
            <div className="relative mx-auto max-w-xl">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9AA59D]" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                onChange={(e) => onSearch?.(e.target.value)}
                className="w-full rounded-xl border border-[#D9DED7] bg-[#F7F7F3] py-3.5 pl-14 pr-5 text-[#2E3430] shadow-sm placeholder:text-[#9AA59D] focus:border-[#284A3D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#284A3D]/10"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  action,
  actionLabel,
  actionHref,
  onAction,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div>
        <h2 className="text-lg font-semibold text-[#2E3430]">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-[#5A6560]">{description}</p>
        )}
      </div>
      {action || (actionLabel && actionHref && (
        <Link
          href={actionHref}
          onClick={onAction}
          className="shrink-0 text-sm font-medium text-[#5A6560] transition-colors hover:text-[#284A3D]"
        >
          {actionLabel}
        </Link>
      )) || (actionLabel && onAction && (
        <button
          onClick={onAction}
          className="shrink-0 text-sm font-medium text-[#5A6560] transition-colors hover:text-[#284A3D]"
        >
          {actionLabel}
        </button>
      ))}
    </div>
  );
}
