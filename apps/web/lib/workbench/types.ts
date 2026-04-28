/** 联调 / 高密度工作台域（与 project-test/workbench 路由对齐） */

export type WorkbenchDemoRole = "client" | "creator" | "admin" | "super";

export type NavItemDef = {
  href: string;
  label: string;
  /** 对应 `.nav-item.nav-sub` */
  sub?: boolean;
  /**
   * 生产工作台侧栏：跳转路径（可含 #section），与联调稿 `href` 锚点一一对应。
   * 由 `applyAppRoutesToNavGroups` 注入；联调 demo 不设置。
   */
  appRoute?: string;
};

export type NavGroupDef = {
  label: string;
  items: NavItemDef[];
};

/** 客户 / 创作者 KPI：带 spark 行 */
export type WorkbenchKpiSparkItem = {
  kind: "spark";
  label: string;
  value: string;
  trendText: string;
  /** `neutral`：灰色说明，无涨跌 class */
  trendTone: "up" | "down" | "neutral";
  spark: { points: string; stroke: string; strokeWidth?: number };
};

/** 管理员 / 超管 KPI：简版 `.trend` */
export type WorkbenchKpiSimpleItem = {
  kind: "simple";
  label: string;
  value: string;
  trendText: string;
  /** 追加在 `.trend` 上的修饰，如 `down` */
  trendClassName?: "down" | "up";
};

export type WorkbenchKpiItem = WorkbenchKpiSparkItem | WorkbenchKpiSimpleItem;

/** 侧栏 + 顶栏 + 首屏 KPI：可与接口返回结构逐步对齐 */
export type WorkbenchShellFixture = {
  profile: { avatar: string; avatarUrl?: string; name: string; roleLine: string; lawyerVerified?: boolean };
  topbar: { title: string; pills: string[] };
  navGroups: NavGroupDef[];
  kpis: WorkbenchKpiItem[];
  /** `grid-4` 区块 id，如 cli-overview */
  overviewSectionId: string;
};
