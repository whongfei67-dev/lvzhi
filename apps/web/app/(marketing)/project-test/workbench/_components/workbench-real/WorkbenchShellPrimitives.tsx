"use client";

import { Fragment } from "react";
import type { WorkbenchKpiItem, WorkbenchShellFixture } from "@/lib/workbench/types";
import { Logo } from "@/components/common/logo";
import { withPublicMediaProxy } from "@/lib/media-url";

import { WorkbenchNavLink } from "./WorkbenchNavLink";
import { WorkbenchSpark } from "@/components/workbench-app/WorkbenchSpark";
import type { WorkbenchNavProps } from "./types";

const MUTED = "var(--muted)";

/** 侧栏品牌：与首页顶栏 `Logo size="nav"` 同款字号与书法栈（深色底配色由 workbench-integration.css 微调） */
export function WorkbenchLogo() {
  return (
    <div className="logo">
      <Logo href="/" size="nav" tone="dark" ariaLabel="律植 · 返回网站首页" />
    </div>
  );
}

type SideNavProps = WorkbenchNavProps & {
  groups: WorkbenchShellFixture["navGroups"];
  ariaLabel: string;
};

export function WorkbenchSideNav({
  groups,
  activeHash,
  onNavigate,
  ariaLabel,
  mode = "demo",
  pathname,
  urlHash,
}: SideNavProps) {
  return (
    <nav className="nav" aria-label={ariaLabel}>
      {groups.map((g) => (
        <Fragment key={g.label}>
          <div className="nav-label">{g.label}</div>
          {g.items.map((item) => (
            <WorkbenchNavLink
              key={item.href}
              item={item}
              mode={mode}
              pathname={pathname}
              urlHash={urlHash}
              className={item.sub ? "nav-item nav-sub" : "nav-item"}
              activeHash={activeHash}
              onNavigate={onNavigate}
            >
              <span className="dot" />
              <span className="nav-text">{item.label}</span>
            </WorkbenchNavLink>
          ))}
        </Fragment>
      ))}
    </nav>
  );
}

export function WorkbenchUserProfile({ profile }: { profile: WorkbenchShellFixture["profile"] }) {
  return (
    <div className="profile">
      <div className="avatar">
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={withPublicMediaProxy(profile.avatarUrl)} alt="" className="avatar-img" />
        ) : (
          profile.avatar
        )}
      </div>
      <div>
        <div className="name-row">
          <div className="name">{profile.name}</div>
          {profile.lawyerVerified ? <span className="lawyer-chip">执业律师</span> : null}
        </div>
        <div className="role">{profile.roleLine}</div>
      </div>
    </div>
  );
}

export function WorkbenchTopbar({
  topbar,
  homeHref = "/",
  /** 生产工作台：去掉标题旁图形 Logo，标题本身可点回首页 */
  compact = false,
}: {
  topbar: WorkbenchShellFixture["topbar"];
  /** 点击左上角品牌回到该角色首页 */
  homeHref?: string;
  compact?: boolean;
}) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        {!compact ? (
          <Logo
            href={homeHref}
            size="sm"
            tone="light"
            className="topbar-logo"
            ariaLabel="律植 · 返回工作台首页"
          />
        ) : null}
        <div className="topbar-copy">
          {compact ? (
            <a className="topbar-title-link" href={homeHref} aria-label="返回工作台首页">
              <div className="title">{topbar.title}</div>
            </a>
          ) : (
            <div className="title">{topbar.title}</div>
          )}
          {topbar.pills.length > 0 ? (
            <div className="toolbar">
              {topbar.pills.map((p) => (
                <span key={p} className="pill">
                  {p}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="topbar-right">
        {compact ? (
          <a className="wb-topbar-home-link" href="/">
            返回首页
          </a>
        ) : (
          <div className="topbar-brand" aria-label="律植">
            <Logo size="xs" tone="light" link={false} />
          </div>
        )}
      </div>
    </header>
  );
}

function KpiSparkArticle({ item }: { item: Extract<WorkbenchKpiItem, { kind: "spark" }> }) {
  const trendCls =
    item.trendTone === "neutral"
      ? "trend-label"
      : item.trendTone === "up"
        ? "trend-label up"
        : "trend-label down";
  return (
    <article className="kpi">
      <div className="label">{item.label}</div>
      <div className="value">{item.value}</div>
      <div className="kpi-chart-row">
        <span className={trendCls} style={item.trendTone === "neutral" ? { color: MUTED } : undefined}>
          {item.trendText}
        </span>
        <WorkbenchSpark
          points={item.spark.points}
          stroke={item.spark.stroke}
          strokeWidth={item.spark.strokeWidth ?? 2.2}
        />
      </div>
    </article>
  );
}

function KpiSimpleArticle({ item }: { item: Extract<WorkbenchKpiItem, { kind: "simple" }> }) {
  const trendCls = ["trend", item.trendClassName].filter(Boolean).join(" ");
  return (
    <article className="kpi">
      <div className="label">{item.label}</div>
      <div className="value">{item.value}</div>
      <div className={trendCls}>{item.trendText}</div>
    </article>
  );
}

export function WorkbenchKpiOverviewSection({ sectionId, items }: { sectionId: string; items: WorkbenchKpiItem[] }) {
  return (
    <section className="grid-4" id={sectionId}>
      {items.map((item, i) =>
        item.kind === "spark" ? (
          <KpiSparkArticle key={i} item={item} />
        ) : (
          <KpiSimpleArticle key={i} item={item} />
        ),
      )}
    </section>
  );
}
