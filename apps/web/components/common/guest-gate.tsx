"use client";

import Link from "next/link";
import { Lock, Eye, Unlock } from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";

/** 全站游客「登录后解锁」类卡片：淡化线框 + 柔边光晕（amber / 咖啡系） */
export const guestUnlockCardSurfaceClassName =
  "rounded-2xl border border-[rgba(212,165,116,0.10)] shadow-[0_0_0_1px_rgba(212,165,116,0.04),0_20px_56px_-24px_rgba(92,64,51,0.11)]";

const guestUnlockIconRing = "bg-[rgba(212,165,116,0.14)] ring-1 ring-[rgba(212,165,116,0.11)]";

/** 解锁卡内图标底（大） */
export const guestUnlockIconShellLgClassName = `rounded-2xl ${guestUnlockIconRing}`;

/** 解锁卡内图标底（小，用于 UnlockGate） */
export const guestUnlockIconShellSmClassName = `rounded-xl ${guestUnlockIconRing}`;

/** 与灵感广场「灵感精选」一致：盖住整块列表内容的透明轻模糊层（置于 `relative min-h-full` 内层上） */
export function GuestMarketingUnlockContentVeil({ className = "" }: { className?: string }) {
  return (
    <div
      className={["absolute inset-0 z-[14] bg-transparent backdrop-blur-[2px]", className].filter(Boolean).join(" ")}
      aria-hidden
    />
  );
}

export type GuestMarketingUnlockViewportCtaProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  loginHref?: string;
  registerHref?: string;
  /** 读屏标签，建议传入与主标题一致的纯文案（若用书法标题已做 `preferTradForKeShiLu`） */
  ariaLabel: string;
  zClassName?: string;
};

/** 与灵感广场一致：叠在滚动视口上的透明居中 CTA（外层 `pointer-events-none`，内层可点） */
export function GuestMarketingUnlockViewportCta({
  title,
  subtitle,
  loginHref = "/login",
  registerHref = "/register",
  ariaLabel,
  zClassName = "z-[18]",
}: GuestMarketingUnlockViewportCtaProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${zClassName} flex items-center justify-center bg-transparent px-4 py-10`}
      role="region"
      aria-label={ariaLabel}
    >
      <div className="pointer-events-auto w-full max-w-md text-center">
        <div className={`mx-auto flex h-12 w-12 items-center justify-center ${guestUnlockIconShellLgClassName}`}>
          <Lock className="h-6 w-6 text-[#B8860B]" aria-hidden />
        </div>
        <h3 className="home-cta-brush-title mt-4 text-xl font-normal text-[#5C4033] [text-shadow:0_1px_14px_rgba(255,252,247,0.95),0_0_28px_rgba(255,248,240,0.88)] sm:text-2xl">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-2 text-sm leading-relaxed text-[#5D4E3A] [text-shadow:0_1px_10px_rgba(255,252,247,0.92)]">
            {subtitle}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href={loginHref}
            className="inline-flex min-w-[104px] items-center justify-center rounded-xl border border-[rgba(212,165,116,0.4)] bg-white/90 px-5 py-2.5 text-sm font-semibold text-[#5C4033] shadow-sm backdrop-blur-sm transition-colors hover:border-[#D4A574] hover:bg-white"
          >
            登录
          </Link>
          <Link
            href={registerHref}
            className="inline-flex min-w-[104px] items-center justify-center rounded-xl bg-[#5C4033] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#8B7355]"
          >
            注册
          </Link>
        </div>
      </div>
    </div>
  );
}

interface GuestGateProps {
  children?: React.ReactNode;
  action?: string;
  mode?: "blur" | "hidden" | "prompt";
  description?: string;
  fallback?: React.ReactNode;
  className?: string;
}

interface SessionState {
  id: string;
  email: string;
  role?: string;
}

export function GuestGate({
  children,
  action = "登录后操作",
  mode = "blur",
  description,
  fallback,
  className = "",
}: GuestGateProps) {
  const [session, setSession] = useState<SessionState | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const { getSession } = await import("@/lib/api/client");
      const userSession = await getSession();
      setSession(userSession);
    } catch (error) {
      setSession(null);
    }
  };

  if (!mounted) {
    return <>{children}</>;
  }

  if (session) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const defaultDescriptions: Record<string, string> = {
    收藏: "登录后可收藏感兴趣的内容",
    评论: "登录后可参与评论讨论",
    购买: "登录后可购买或使用",
    查看联系方式: "登录后可查看发布者联系方式",
    下载: "登录后可下载完整内容",
    查看详情: "登录后可查看完整详情",
  };

  const desc = description || defaultDescriptions[action] || `登录后可${action}`;

  if (mode === "hidden") {
    return (
      <div className={`relative ${className}`}>
        <div className="blur-sm opacity-50 pointer-events-none select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <UnlockGate action={action} description={desc} />
        </div>
      </div>
    );
  }

  if (mode === "blur") {
    return (
      <div className={`relative ${className}`}>
        <div className="relative">
          <div className="max-h-48 overflow-hidden">
            {children}
          </div>
          <div className="absolute inset-0 bottom-0 h-24 bg-gradient-to-t from-[#FFFCF7] via-[#FFFCF7]/85 to-transparent" />
        </div>
        <UnlockGate action={action} description={desc} />
      </div>
    );
  }

  return (
    <div className={`guest-prompt-card-surface p-6 text-center ${className}`}>
      <div
        className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center ${guestUnlockIconShellLgClassName}`}
      >
        <Lock className="h-6 w-6 text-[#B8860B]" aria-hidden />
      </div>
      <h3 className="font-semibold text-[#5C4033]">{action}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#9A8B78]">{desc}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Link href="/login" className="guest-prompt-btn-login">
          登录
        </Link>
        <Link href="/register" className="guest-prompt-btn-register">
          注册
        </Link>
      </div>
    </div>
  );
}

function UnlockGate({ action, description }: { action: string; description: string }) {
  return (
    <div className={`${guestUnlockCardSurfaceClassName} bg-transparent p-4 text-center`}>
      <div
        className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center ${guestUnlockIconShellSmClassName}`}
      >
        <Unlock className="h-5 w-5 text-[#B8860B]" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-[#5C4033]">{action}</p>
      <p className="mt-1 text-xs leading-relaxed text-[#9A8B78]">{description}</p>
      <div className="mt-3 flex justify-center gap-2">
        <Link href="/login" className="guest-prompt-btn-login guest-prompt-btn-login--compact">
          登录
        </Link>
        <Link href="/register" className="guest-prompt-btn-register guest-prompt-btn-register--compact">
          注册
        </Link>
      </div>
    </div>
  );
}

export function GuestBadge({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<SessionState | null>(null);

  useEffect(() => {
    setMounted(true);
    (async () => {
      try {
        const { getSession } = await import("@/lib/api/client");
        const userSession = await getSession();
        setSession(userSession);
      } catch {
        setSession(null);
      }
    })();
  }, []);

  if (!mounted || session) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-1 text-xs font-medium text-[#5D4E3A] ${className}`}
    >
      <Eye className="h-3 w-3" />
      游客预览
    </span>
  );
}

export function GuestOverlay({ message = "登录后解锁完整内容" }: { message?: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-[#FFFCF7] via-white/92 to-transparent">
      <div className="guest-prompt-card-surface px-6 py-5 text-center">
        <div
          className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center ${guestUnlockIconShellLgClassName}`}
        >
          <Lock className="h-6 w-6 text-[#B8860B]" aria-hidden />
        </div>
        <p className="text-sm font-semibold text-[#5C4033]">{message}</p>
        <Link
          href="/login"
          className="mt-3 inline-block rounded-xl bg-[#5C4033] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#8B7355]"
        >
          立即登录
        </Link>
      </div>
    </div>
  );
}
