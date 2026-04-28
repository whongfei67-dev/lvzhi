import type { NavGroupDef, WorkbenchDemoRole } from "./types";
import { getWorkbenchShellFixture } from "./shell-fixtures";

function stripHash(href: string): string {
  return href.replace(/^#/, "");
}

export function applyAppRoutesToNavGroups(role: WorkbenchDemoRole): NavGroupDef[] {
  const { navGroups } = getWorkbenchShellFixture(role);
  const base =
    role === "client"
      ? "/workspace/workbench"
      : role === "creator"
        ? "/creator/workbench"
        : "/admin/workbench";
  return navGroups.map((group) => ({
    ...group,
    items: group.items.map((item) => ({
      ...item,
      appRoute: `${base}/${stripHash(item.href)}`,
    })),
  }));
}
