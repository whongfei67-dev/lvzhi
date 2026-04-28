import { getWorkbenchShellFixture } from "./shell-fixtures";
import type { WorkbenchDemoRole } from "./types";

function stripHash(href: string) {
  return href.replace(/^#/, "");
}

function navLabelForSection(role: WorkbenchDemoRole, sectionId: string): string | null {
  const shell = getWorkbenchShellFixture(role);
  for (const g of shell.navGroups) {
    for (const item of g.items) {
      if (stripHash(item.href) === sectionId) return item.label;
    }
  }
  return null;
}

function sectionFromWorkbenchPath(pathname: string, base: string): string | null {
  if (!pathname.startsWith(base)) return null;
  const rest = pathname.slice(base.length).replace(/^\//, "");
  const seg = rest.split("/")[0]?.split("?")[0] ?? "";
  return seg || null;
}

/**
 * 生产工作台 `/…/workbench/<section>` 顶栏：`<角色工作台> · <侧栏当前页标题>`。
 * 非 workbench 子路由返回 null，由调用方回退到 shell 默认。
 */
export function tryResolveWorkbenchSectionTopbar(pathname: string): { title: string; pills: string[] } | null {
  const clientBase = "/workspace/workbench";
  const creatorBase = "/creator/workbench";
  const adminBase = "/admin/workbench";

  if (pathname.startsWith(clientBase)) {
    const shell = getWorkbenchShellFixture("client");
    const sec = sectionFromWorkbenchPath(pathname, clientBase);
    const label = sec ? navLabelForSection("client", sec) : null;
    return {
      title: label ? `客户工作台 · ${label}` : "客户工作台",
      pills: [],
    };
  }

  if (pathname.startsWith(creatorBase)) {
    const shell = getWorkbenchShellFixture("creator");
    const sec = sectionFromWorkbenchPath(pathname, creatorBase);
    const label = sec ? navLabelForSection("creator", sec) : null;
    return {
      title: label ? `创作者工作台 · ${label}` : "创作者工作台",
      pills: [],
    };
  }

  if (pathname.startsWith(adminBase)) {
    const sec = sectionFromWorkbenchPath(pathname, adminBase) ?? "";
    const shellRole: WorkbenchDemoRole = sec.startsWith("sup-") ? "super" : "admin";
    const shell = getWorkbenchShellFixture(shellRole);
    const label = sec ? navLabelForSection(shellRole, sec) : null;
    const prefix = shellRole === "super" ? "超管工作台" : "管理员工作台";
    return {
      title: label ? `${prefix} · ${label}` : prefix,
      pills: [],
    };
  }

  return null;
}
