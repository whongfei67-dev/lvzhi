export type { WorkbenchDemoRole } from "@/lib/workbench/types";

export type WorkbenchExperienceMode = "combined" | "split";

export type WorkbenchNavProps = {
  activeHash: string;
  onNavigate: (hash: string) => void;
  /** 生产工作台：Next 路由 + 哈希高亮 */
  mode?: "demo" | "app";
  pathname?: string;
  urlHash?: string;
};
