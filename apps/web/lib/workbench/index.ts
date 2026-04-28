export type {
  NavGroupDef,
  NavItemDef,
  WorkbenchDemoRole,
  WorkbenchKpiItem,
  WorkbenchKpiSimpleItem,
  WorkbenchKpiSparkItem,
  WorkbenchShellFixture,
} from "./types";

export { WORKBENCH_SHELL_BY_ROLE, getWorkbenchShellFixture } from "./shell-fixtures";
export { applyAppRoutesToNavGroups } from "./app-route-maps";
export { tryResolveWorkbenchSectionTopbar } from "./workbench-app-topbar";
