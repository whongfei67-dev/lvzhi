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

export function AdminRoleWorkbench({
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
  const shell = getWorkbenchShellFixture("admin");
  const navGroups = navGroupsProp ?? shell.navGroups;
  const profile = profileProp ?? shell.profile;
  const showFullSpec = mode !== "app" || !pathname || pathname === "/admin";

  const topbar = useMemo(() => {
    if (mode !== "app" || !pathname) return shell.topbar;
    const r = tryResolveWorkbenchSectionTopbar(pathname);
    if (r) return r;
    if (pathname.startsWith("/admin")) {
      return { title: "管理员工作台", pills: shell.topbar.pills };
    }
    return shell.topbar;
  }, [mode, pathname, shell]);

  return (
    <div id={panelId} className={["role-panel", "app", isActive ? "active" : ""].filter(Boolean).join(" ")}>
      <aside className="sidebar" aria-label="管理员工作台导航">
        <WorkbenchLogo />
        <WorkbenchSideNav
          groups={navGroups}
          activeHash={activeHash}
          onNavigate={onNavigate}
          ariaLabel="管理员主导航"
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
            权限边界：可处理平台日常审核、内容与交易治理、查看审计日志；系统级环境切换、全局角色授予、高危数据变更默认不在此角色（示意归超管）。
          </div>

          <section className="section" id="adm-queue">
            <div className="section-hd">审核队列（高密度表）</div>
            <div className="section-bd">
              <div className="dense-table">
                <div className="dense-row head">
                  <div>对象</div>
                  <div>类型</div>
                  <div>等待</div>
                  <div>优先级</div>
                </div>
                <div className="dense-row">
                  <div>Skills「尽调助手」v1.3</div>
                  <div>上架</div>
                  <div>6h</div>
                  <div className="up">P1</div>
                </div>
                <div className="dense-row">
                  <div>用户 u_9281 认证</div>
                  <div>资质</div>
                  <div>1.2d</div>
                  <div>P2</div>
                </div>
                <div className="dense-row">
                  <div>帖子 #8832</div>
                  <div>举报</div>
                  <div>30m</div>
                  <div className="down">P0</div>
                </div>
              </div>
            </div>
          </section>

          <div className="two-col">
            <section className="section" id="adm-users">
              <div className="section-hd">用户与身份</div>
              <div className="section-bd">
                冻结、解封、重置 MFA、变更角色申请流转（执行节点可配置为超管终审）。
              </div>
            </section>
            <section className="section" id="adm-content">
              <div className="section-hd">内容与合规</div>
              <div className="section-bd">
                帖子、Skills、对外岗位信息等统一治理：下架、替换、敏感词命中复核、版权争议与虚假招聘举报工单。
              </div>
            </section>
            <section className="section" id="adm-trade">
              <div className="section-hd">交易与结算</div>
              <div className="section-bd">对账差异、退款仲裁、发票异常；只读对接财务导出。</div>
            </section>
            <section className="section" id="adm-risk">
              <div className="section-hd">风险与举报</div>
              <div className="section-bd">聚合多源信号：举报、模型输出风险标记、异常调用。</div>
            </section>
          </div>

          <section className="section" id="adm-audit">
            <div className="section-hd">日志与审计</div>
            <div className="section-bd">按对象追溯：谁、何时、对何资源、做了什么；支持导出与留存策略。</div>
          </section>
          <section className="section" id="adm-config">
            <div className="section-hd">业务参数</div>
            <div className="section-bd">
              费率展示规则、试用默认上限、邀请模板等；破坏性变更建议双人复核（示意）。
            </div>
          </section>
          <p className="foot">
            {mode === "app" ? "律植 · 管理员工作台（与联调稿同构）" : "联调 React 实装 · 当前角色：管理员"}
          </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
