"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Menu, X, Search } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { beijingGreetingWord } from "@/lib/datetime/beijing-greeting";
import { workbenchPathForRole } from "@/lib/auth/default-home";
import type { Session } from "@/lib/auth/session-types";
import { clearSessionCache, getSession, logout as apiLogout } from "@/lib/api/client";

/**
 * 顶部导航 — 对齐《律植项目蓝图 v6.4》§2.1
 *
 * 视觉方向：琥珀咖啡色系；左上角「律植」与工作台侧栏同款书法字栈；主导航经 preferTradForKeShiLu 处理缺字。
 * 颜色：amber #D4A574 / coffee #5C4033 / cream #FFF8F0
 */

const NAV_ITEMS = [
  { label: "首页", href: "/" },
  { label: "灵感广场", href: "/inspiration" },
  { label: "社区", href: "/community" },
  { label: "合作机会", href: "/opportunities" },
  { label: "发现律师", href: "/lawyers" },
  { label: "创作指南", href: "/creator-guide" },
];

/** 非「律师个人主页」的 /lawyers/* 一级路径 */
const LAWYERS_LIST_FIRST_SEGMENTS = new Set([
  "featured",
  "rankings",
  "ranking",
  "contact",
  "city",
  "category",
  "verified",
  "domain",
  "firms",
]);

function isLawyerProfilePath(pathname: string): boolean {
  if (!pathname.startsWith("/lawyers/")) return false;
  const first = pathname.slice("/lawyers/".length).split("/")[0];
  if (!first) return false;
  return !LAWYERS_LIST_FIRST_SEGMENTS.has(first);
}

function marketingNickname(s: Session) {
  const n = s.display_name?.trim();
  if (n) return n;
  const e = s.email?.trim();
  if (e) return e.split("@")[0] || e;
  return "用户";
}

export function TopNav() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname() ?? "";
  const hideHeaderIcons = isLawyerProfilePath(pathname);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSessionReady(false);
    clearSessionCache();
    getSession()
      .then((raw) => {
        if (cancelled) return;
        const s = raw && raw.role !== "visitor" ? raw : null;
        setSession(s);
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      })
      .finally(() => {
        if (!cancelled) setSessionReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const doLogout = async () => {
    setUserMenuOpen(false);
    setMobileOpen(false);
    try {
      await apiLogout();
    } finally {
      clearSessionCache();
      setSession(null);
      router.push("/");
      router.refresh();
    }
  };

  /** 仅进入登录页以便换号登录；不调用登出。未完成切换就返回时，服务端会话仍在，首页仍显示已登录。 */
  const doSwitchAccount = () => {
    setUserMenuOpen(false);
    setMobileOpen(false);
    router.push("/login?intent=switch");
    router.refresh();
  };

  function goSearch(raw: string) {
    const q = raw.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setMobileSearchOpen(false);
    setMobileOpen(false);
  }

  useEffect(() => {
    if (!mobileSearchOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
        setMobileSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [mobileSearchOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div
        className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8"
        style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}
      >
        <Logo size="nav" tone="light" className="shrink-0" ariaLabel="律植 · 返回首页" />

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1.5 md:flex">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                data-active={active ? "true" : "false"}
                className={`nav-primary-link home-cta-brush-title rounded-xl px-4 py-2.5 text-lg font-normal tracking-wide transition-colors ${
                  active ? "text-[#5C4033]" : "text-[#4E3B2D] hover:text-[#5C4033]"
                }`}
              >
                <span className="nav-primary-link__fill" aria-hidden />
                <span className="relative z-[1]">{preferTradForKeShiLu(item.label)}</span>
              </Link>
            );
          })}
          {process.env.NODE_ENV === "development" ? (
            <Link
              href="/project-test"
              data-active={pathname === "/project-test" ? "true" : "false"}
              className={`nav-primary-link home-cta-brush-title rounded-xl px-3 py-2 text-base font-normal tracking-wide transition-colors ${
                pathname === "/project-test"
                  ? "text-[#5C4033]"
                  : "text-[#9A8B78] hover:text-[#5C4033]"
              }`}
              title="内测联调路由与 API 探测"
            >
              <span className="nav-primary-link__fill" aria-hidden />
              <span className="relative z-[1]">{preferTradForKeShiLu("测试页")}</span>
            </Link>
          ) : null}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-2">
          {!hideHeaderIcons ? (
            <>
              {/* 桌面：悬停或聚焦搜索框时展开；与按钮无间隙避免鼠标路过丢悬停 */}
              <div className="group relative hidden md:block">
                <button
                  className="icon-btn"
                  title={preferTradForKeShiLu("搜索")}
                  type="button"
                  aria-haspopup="dialog"
                >
                  <Search className="h-5 w-5" />
                </button>
                <div className="pointer-events-none absolute right-0 top-[calc(100%-1px)] z-[120] w-[min(calc(100vw-2rem),360px)] opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                  <form
                    className="search-box mt-0 flex gap-2 rounded-xl border border-[rgba(212,165,116,0.28)] bg-[rgba(255,248,240,0.97)] p-2 shadow-lg backdrop-blur-md"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const el = e.currentTarget.elements.namedItem("nav-q") as HTMLInputElement;
                      goSearch(el?.value ?? "");
                    }}
                  >
                    <Search className="h-5 w-5 shrink-0 text-[#9A8B78]" aria-hidden />
                    <input
                      name="nav-q"
                      type="search"
                      autoComplete="off"
                      placeholder={preferTradForKeShiLu("搜索灵感、律师…")}
                      className="search-input min-w-0 flex-1 bg-transparent text-[#2C2416] outline-none"
                    />
                  </form>
                </div>
              </div>
              {/* 移动端：点击展开搜索 */}
              <div ref={mobileSearchRef} className="relative md:hidden">
                <button
                  type="button"
                  className="icon-btn"
                  title={preferTradForKeShiLu("搜索")}
                  aria-expanded={mobileSearchOpen}
                  aria-haspopup="dialog"
                  onClick={() => setMobileSearchOpen((o) => !o)}
                >
                  <Search className="h-5 w-5" />
                </button>
                {mobileSearchOpen ? (
                  <div className="absolute right-0 top-[calc(100%-2px)] z-[120] w-[min(calc(100vw-2rem),320px)]">
                    <form
                      className="search-box flex gap-2 rounded-xl border border-[rgba(212,165,116,0.28)] bg-[rgba(255,248,240,0.98)] p-2 shadow-lg backdrop-blur-md"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const el = e.currentTarget.elements.namedItem("nav-q-mobile") as HTMLInputElement;
                        goSearch(el?.value ?? "");
                      }}
                    >
                      <Search className="h-5 w-5 shrink-0 text-[#9A8B78]" aria-hidden />
                      <input
                        name="nav-q-mobile"
                        type="search"
                        autoComplete="off"
                        autoFocus
                        placeholder={preferTradForKeShiLu("搜索灵感、律师…")}
                        className="search-input min-w-0 flex-1 bg-transparent text-[#2C2416] outline-none"
                      />
                    </form>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
          {!sessionReady ? (
            <span className="hidden h-10 w-[7rem] shrink-0 rounded-lg bg-[rgba(212,165,116,0.12)] md:inline-block" aria-hidden />
          ) : session ? (
            <div
              className="relative hidden md:block"
              onMouseEnter={() => setUserMenuOpen(true)}
              onMouseLeave={() => setUserMenuOpen(false)}
            >
              <button
                type="button"
                className="home-cta-brush-title flex max-w-[min(52vw,20rem)] items-center gap-1 rounded-xl border border-transparent px-3 py-2 text-left text-base font-normal tracking-wide text-[#4E3B2D] transition-colors hover:border-[rgba(212,165,116,0.4)] hover:bg-[rgba(255,248,240,0.55)]"
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
              >
                <span className="min-w-0 truncate">
                  {beijingGreetingWord()}，{marketingNickname(session)}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-55" aria-hidden />
              </button>
              <div
                className={`absolute right-0 top-full z-[220] pt-1 transition-opacity duration-150 ${
                  userMenuOpen ? "pointer-events-auto visible opacity-100" : "pointer-events-none invisible opacity-0"
                }`}
                role="menu"
              >
                <div
                  className="w-[min(calc(100vw-2rem),15.5rem)] rounded-xl border border-[rgba(212,165,116,0.35)] py-1 shadow-lg"
                  style={{
                    background: "rgba(255, 248, 240, 0.82)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                >
                  <Link
                    href={workbenchPathForRole(session.role)}
                    className="block px-3 py-2.5 text-sm text-[#2C2416] transition-colors hover:bg-[rgba(212,165,116,0.18)]"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    进入个人工作台
                  </Link>
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-left text-sm text-[#2C2416] transition-colors hover:bg-[rgba(212,165,116,0.18)]"
                    role="menuitem"
                    onClick={() => doSwitchAccount()}
                  >
                    切换账号
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-left text-sm text-[#5c4033] transition-colors hover:bg-[rgba(212,165,116,0.18)]"
                    role="menuitem"
                    onClick={() => void doLogout()}
                  >
                    退出登录
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="home-cta-brush-title hidden px-4 py-2.5 text-lg font-normal tracking-wide transition-colors md:inline"
                style={{ color: "#4E3B2D" }}
              >
                {preferTradForKeShiLu("登录")}
              </Link>
              <Link
                href="/register"
                className="btn-slide primary home-cta-brush-title font-normal tracking-wide"
                style={{ padding: "0.75rem 1.4rem", fontSize: "1.05rem" }}
              >
                {preferTradForKeShiLu("注册")}
              </Link>
            </>
          )}
          <button
            className="rounded-lg p-2 md:hidden"
            style={{ color: "#5D4E3A" }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          className="border-t md:hidden"
          style={{
            borderColor: "rgba(212,165,116,0.25)",
            background: "rgba(255,248,240,0.98)",
            padding: "1rem",
          }}
        >
          <form
            className="search-box mb-4"
            onSubmit={(e) => {
              e.preventDefault();
              const el = e.currentTarget.elements.namedItem("nav-q-drawer") as HTMLInputElement;
              goSearch(el?.value ?? "");
            }}
          >
            <Search className="text-[#9A8B78]" aria-hidden />
            <input
              name="nav-q-drawer"
              type="search"
              autoComplete="off"
              placeholder={preferTradForKeShiLu("搜索灵感、律师…")}
              className="text-[#2C2416]"
            />
          </form>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  data-active={active ? "true" : "false"}
                  className={`nav-primary-link home-cta-brush-title block rounded-xl px-4 py-3 text-lg font-normal tracking-wide transition-colors ${
                    active ? "text-[#5C4033]" : "text-[#4E3B2D] hover:text-[#5C4033]"
                  }`}
                >
                  <span className="nav-primary-link__fill" aria-hidden />
                  <span className="relative z-[1]">{preferTradForKeShiLu(item.label)}</span>
                </Link>
              );
            })}
            {process.env.NODE_ENV === "development" ? (
              <Link
                href="/project-test"
                onClick={() => setMobileOpen(false)}
                data-active={pathname === "/project-test" ? "true" : "false"}
                className={`nav-primary-link home-cta-brush-title block rounded-xl px-4 py-3 text-lg font-normal tracking-wide transition-colors ${
                  pathname === "/project-test"
                    ? "text-[#5C4033]"
                    : "text-[#9A8B78] hover:text-[#5C4033]"
                }`}
              >
                <span className="nav-primary-link__fill" aria-hidden />
                <span className="relative z-[1]">{preferTradForKeShiLu("联调测试页")}</span>
              </Link>
            ) : null}
          </nav>
          <div
            className="mt-4 border-t pt-4"
            style={{ borderColor: "rgba(212,165,116,0.25)" }}
          >
            {session ? (
              <div className="space-y-2">
                <p className="home-cta-brush-title text-center text-lg font-normal text-[#5C4033]">
                  {beijingGreetingWord()}，{marketingNickname(session)}
                </p>
                <Link
                  href={workbenchPathForRole(session.role)}
                  onClick={() => setMobileOpen(false)}
                  className="home-cta-brush-title block rounded-xl py-2.5 text-center text-base font-normal tracking-wide text-[#2C2416]"
                  style={{ border: "1px solid rgba(212,165,116,0.35)", background: "rgba(255,248,240,0.75)" }}
                >
                  进入个人工作台
                </Link>
                <button
                  type="button"
                  className="home-cta-brush-title w-full rounded-xl py-2.5 text-center text-base font-normal tracking-wide text-[#2C2416]"
                  style={{ border: "1px solid rgba(212,165,116,0.25)" }}
                  onClick={() => doSwitchAccount()}
                >
                  切换账号
                </button>
                <button
                  type="button"
                  className="home-cta-brush-title w-full rounded-xl py-2.5 text-center text-base font-normal tracking-wide text-[#5c4033]"
                  style={{ border: "1px solid rgba(212,165,116,0.25)" }}
                  onClick={() => void doLogout()}
                >
                  退出登录
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="home-cta-brush-title flex-1 rounded-xl py-2.5 text-center text-lg font-normal tracking-wide"
                  style={{ border: "1px solid rgba(212,165,116,0.25)", color: "#4E3B2D" }}
                >
                  {preferTradForKeShiLu("登录")}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="home-cta-brush-title flex-1 rounded-xl py-2.5 text-center text-lg font-normal tracking-wide text-white"
                  style={{ background: "#5C4033" }}
                >
                  {preferTradForKeShiLu("注册")}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}