"use client";

import { useMemo, type ReactNode } from "react";

import { getWorkbenchShellFixture, tryResolveWorkbenchSectionTopbar } from "@/lib/workbench";
import type { NavGroupDef, WorkbenchShellFixture } from "@/lib/workbench/types";

import {
  WorkbenchKpiOverviewSection,
  WorkbenchLogo,
  WorkbenchSideNav,
  WorkbenchTopbar,
  WorkbenchUserProfile,
} from "./WorkbenchShellPrimitives";
import type { WorkbenchNavProps } from "./types";

type Props = WorkbenchNavProps & {
  panelId: string;
  isActive: boolean;
  mode?: "demo" | "app";
  pathname?: string;
  urlHash?: string;
  navGroups?: NavGroupDef[];
  profile?: WorkbenchShellFixture["profile"];
  children?: ReactNode;
};

export function SuperRoleWorkbench({
  panelId,
  isActive,
  activeHash,
  onNavigate,
  mode = "demo",
  pathname = "",
  urlHash = "",
  navGroups: navGroupsProp,
  profile: profileProp,
  children,
}: Props) {
  const shell = getWorkbenchShellFixture("super");
  const navGroups = navGroupsProp ?? shell.navGroups;
  const profile = profileProp ?? shell.profile;
  const showFullSpec = mode !== "app" || !pathname || pathname === "/admin";

  const topbar = useMemo(() => {
    if (mode !== "app" || !pathname) return shell.topbar;
    const r = tryResolveWorkbenchSectionTopbar(pathname);
    if (r) return r;
    if (pathname.startsWith("/admin")) {
      return { title: "超管工作台", pills: shell.topbar.pills };
    }
    return shell.topbar;
  }, [mode, pathname, shell]);

  return (
    <div id={panelId} className={["role-panel", "app", isActive ? "active" : ""].filter(Boolean).join(" ")}>
      <aside className="sidebar" aria-label="超管工作台导航">
        <WorkbenchLogo />
        <WorkbenchSideNav
          groups={navGroups}
          activeHash={activeHash}
          onNavigate={onNavigate}
          ariaLabel="超管主导航"
          mode={mode}
          pathname={pathname}
          urlHash={urlHash}
        />
        <WorkbenchUserProfile profile={profile} />
      </aside>
      <main className="main">
        <WorkbenchTopbar topbar={topbar} homeHref="/admin" compact={mode === "app"} />
        <div className="content">
          {!showFullSpec && children ? (
            <div className="workbench-app-page-slot">{children}</div>
          ) : (
            <>
          <WorkbenchKpiOverviewSection sectionId={shell.overviewSectionId} items={shell.kpis} />

          <div className="callout">
            设定：超管包含管理员全部菜单与处置能力，并额外拥有系统配置、跨租户数据策略、密钥与集成、以及不可逆或全站影响操作的入口（示意，生产需 MFA、审批流、审计留痕）。
          </div>

          <section className="section" id="sup-admin-all">
            <div className="section-hd">管理员能力全集（折叠示意）</div>
            <div className="section-bd">
              与上一页「管理员工作台」同构，此处以高密度摘要代替完整树：用户与身份、内容合规、交易结算、审核队列、风险举报、日志审计、业务参数。
            </div>
          </section>

          <div className="two-col">
            <section className="section" id="sup-env">
              <div className="section-hd">环境与部署</div>
              <div className="section-bd">版本发布、特性开关、维护窗、回滚点；与业务参数解耦。</div>
            </section>
            <section className="section" id="sup-perm">
              <div className="section-hd">权限矩阵</div>
              <div className="section-bd">角色到资源动作映射；支持临时授权与时间盒权限。</div>
            </section>
            <section className="section" id="sup-tenant">
              <div className="section-hd">租户与数据域</div>
              <div className="section-bd">跨组织隔离、导出策略、法务冻结；默认仅超管可见。</div>
            </section>
            <section className="section" id="sup-danger">
              <div className="section-hd">高危操作</div>
              <div className="section-bd">
                全站配置覆盖、批量数据修复、密钥吊销、删除级操作；必须二次确认与工单关联（文案示意）。
              </div>
            </section>
          </div>
          <p className="foot">
            {mode === "app" ? "律植 · 超管工作台（与联调稿同构）" : "联调 React 实装 · 当前角色：超管"}
          </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
