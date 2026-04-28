"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import type { WorkbenchDemoRole } from "@/lib/workbench/types";

import { AdminRoleWorkbench } from "./AdminRoleWorkbench";
import { ClientRoleWorkbench } from "./ClientRoleWorkbench";
import { CreatorRoleWorkbench } from "./CreatorRoleWorkbench";
import { SuperRoleWorkbench } from "./SuperRoleWorkbench";
import type { WorkbenchExperienceMode } from "./types";

const ROLES: WorkbenchDemoRole[] = ["client", "creator", "admin", "super"];

const ROLE_LABEL: Record<WorkbenchDemoRole, string> = {
  client: "客户工作台",
  creator: "创作者工作台",
  admin: "管理员工作台",
  super: "超管工作台",
};

const DEFAULT_HASH: Record<WorkbenchDemoRole, string> = {
  client: "#cli-overview",
  creator: "#cre-overview",
  admin: "#adm-overview",
  super: "#sup-overview",
};

const COMBINED_HINT =
  "布局对齐创作者侧高密度信息架构。客户为创作者子集：同一壳层下收敛导航与经营模块；客户无上架与供给能力，不提供「发出的试用邀请」。岗位招聘为客户与创作者共有能力：均可对外发布岗位、管理已发岗位并处理投递。Skills 为核心载体时，以多维评价还原创作者能力，并输出设计提升与招聘、合作建议（示意）。管理员侧重平台治理与审核；超管在管理员之上增加系统级与高危域（示意）。";

const SPLIT_HINT =
  "分项联调：每个角色为独立 URL。本页为 React 实装（非 HTML 注入），侧栏锚点可点击滚动；四合一见 /project-test/workbench。静态对照仍可用 /workbench-roles-demo.html。";

type Props = {
  mode: WorkbenchExperienceMode;
  /** `mode === "split"` 时必传 */
  lockedRole?: WorkbenchDemoRole;
};

export function WorkbenchRolesExperience({ mode, lockedRole }: Props) {
  const [activeRole, setActiveRole] = useState<WorkbenchDemoRole>(lockedRole ?? "client");
  const [navHash, setNavHash] = useState<Record<WorkbenchDemoRole, string>>({ ...DEFAULT_HASH });

  useEffect(() => {
    if (mode === "split" && lockedRole) setActiveRole(lockedRole);
  }, [mode, lockedRole]);

  const setNav = useCallback((role: WorkbenchDemoRole, hash: string) => {
    setNavHash((s) => ({ ...s, [role]: hash }));
  }, []);

  const combined = mode === "combined";

  return (
    <div id="workbench-integration-mount" data-testid="workbench-react-root">
      <div className="role-bar">
        <div className="role-wrap">
          {combined
            ? ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`role-tab${activeRole === r ? " active" : ""}`}
                  data-role={r}
                  data-testid={`workbench-tab-${r}`}
                  onClick={() => setActiveRole(r)}
                >
                  {ROLE_LABEL[r]}
                </button>
              ))
            : ROLES.map((r) => (
                <Link
                  key={r}
                  href={`/project-test/workbench/${r}`}
                  prefetch={false}
                  className={`role-tab${lockedRole === r ? " active" : ""}`}
                  data-testid={`workbench-link-${r}`}
                >
                  {ROLE_LABEL[r]}
                </Link>
              ))}
        </div>
        <div className="role-hint">{combined ? COMBINED_HINT : SPLIT_HINT}</div>
      </div>

      {combined ? (
        <>
          <ClientRoleWorkbench
            panelId="panel-client"
            isActive={activeRole === "client"}
            activeHash={navHash.client}
            onNavigate={(h) => setNav("client", h)}
          />
          <CreatorRoleWorkbench
            panelId="panel-creator"
            isActive={activeRole === "creator"}
            activeHash={navHash.creator}
            onNavigate={(h) => setNav("creator", h)}
          />
          <AdminRoleWorkbench
            panelId="panel-admin"
            isActive={activeRole === "admin"}
            activeHash={navHash.admin}
            onNavigate={(h) => setNav("admin", h)}
          />
          <SuperRoleWorkbench
            panelId="panel-super"
            isActive={activeRole === "super"}
            activeHash={navHash.super}
            onNavigate={(h) => setNav("super", h)}
          />
        </>
      ) : lockedRole === "client" ? (
        <ClientRoleWorkbench
          panelId="panel-client"
          isActive
          activeHash={navHash.client}
          onNavigate={(h) => setNav("client", h)}
        />
      ) : lockedRole === "creator" ? (
        <CreatorRoleWorkbench
          panelId="panel-creator"
          isActive
          activeHash={navHash.creator}
          onNavigate={(h) => setNav("creator", h)}
        />
      ) : lockedRole === "admin" ? (
        <AdminRoleWorkbench
          panelId="panel-admin"
          isActive
          activeHash={navHash.admin}
          onNavigate={(h) => setNav("admin", h)}
        />
      ) : lockedRole === "super" ? (
        <SuperRoleWorkbench
          panelId="panel-super"
          isActive
          activeHash={navHash.super}
          onNavigate={(h) => setNav("super", h)}
        />
      ) : null}
    </div>
  );
}
