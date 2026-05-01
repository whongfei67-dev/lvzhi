import type { WorkbenchDemoRole, WorkbenchShellFixture } from "./types";

const OK = "#3c8c5a";
const BAD = "#c15a4a";
const GRAY = "#9a8b78";

const CLIENT_SHELL: WorkbenchShellFixture = {
  overviewSectionId: "cli-overview",
  profile: { avatar: "周", name: "周律师", roleLine: "客户" },
  topbar: { title: "客户工作台", pills: ["项目检索", "近30天"] },
  navGroups: [
    {
      label: "个人信息",
      items: [
        { href: "#cli-profile", label: "个人资料" },
        { href: "#cli-settings", label: "账号设置" },
        { href: "#cli-verify-apply", label: "认证申请" },
      ],
    },
    {
      label: "个人工作台",
      items: [
        { href: "#cli-studio", label: "工作画布与文件" },
        { href: "#cli-posts", label: "帖子管理" },
        { href: "#cli-job-manage", label: "我的岗位" },
      ],
    },
    {
      label: "数据分析",
      items: [
        { href: "#cli-analytics-jobs", label: "岗位数据" },
        { href: "#cli-analytics-skills-eval", label: "Skills 多维评价" },
      ],
    },
    {
      label: "消息与协作",
      items: [
        { href: "#cli-msg", label: "帖子与留言（含合作邀请）" },
        { href: "#cli-notice", label: "通知", sub: true },
      ],
    },
  ],
  kpis: [
    {
      kind: "spark",
      label: "在办项目",
      value: "6",
      trendText: "+1 本周",
      trendTone: "up",
      spark: { points: "2,20 20,17 38,14 56,11 74,7 92,4", stroke: OK },
    },
    {
      kind: "spark",
      label: "已购 Skills",
      value: "14",
      trendText: "活跃 9",
      trendTone: "neutral",
      spark: { points: "2,14 22,13 42,15 62,14 82,13 98,14", stroke: GRAY, strokeWidth: 2 },
    },
    {
      kind: "spark",
      label: "本月处理任务",
      value: "38",
      trendText: "+12% 环比",
      trendTone: "up",
      spark: { points: "2,18 18,16 34,12 50,9 66,6 82,4 98,2", stroke: OK },
    },
    {
      kind: "spark",
      label: "待处理协作",
      value: "4",
      trendText: "1 条超时",
      trendTone: "down",
      spark: { points: "2,6 20,9 38,12 56,15 74,18 92,21", stroke: BAD },
    },
  ],
};

const CREATOR_SHELL: WorkbenchShellFixture = {
  overviewSectionId: "cre-overview",
  profile: { avatar: "李", name: "李律师", roleLine: "创作者" },
  topbar: { title: "创作者工作台", pills: ["经营检索", "近30天", "导出"] },
  navGroups: [
    {
      label: "个人信息",
      items: [
        { href: "#cre-profile", label: "个人资料" },
        { href: "#cre-verify", label: "律师认证" },
        { href: "#cre-settings", label: "账号设置" },
      ],
    },
    {
      label: "个人工作台",
      items: [
        { href: "#cre-skills", label: "Skills 管理" },
        { href: "#cre-studio", label: "工作画布与文件" },
        { href: "#cre-posts", label: "帖子管理" },
        { href: "#cre-job-manage", label: "我的岗位" },
      ],
    },
    {
      label: "数据分析",
      items: [
        { href: "#cre-analytics", label: "经营与内容" },
        { href: "#cre-analytics-skills-eval", label: "Skills 多维评价" },
      ],
    },
    {
      label: "消息与协作",
      items: [
        { href: "#cre-trial", label: "试用邀请" },
        { href: "#cre-msg", label: "留言（含合作邀请）" },
        { href: "#cre-followers", label: "关注我的用户" },
        { href: "#cre-notice", label: "通知", sub: true },
      ],
    },
  ],
  kpis: [
    {
      kind: "spark",
      label: "本月收益",
      value: "¥ 23,680",
      trendText: "+18.6% 环比",
      trendTone: "up",
      spark: { points: "2,21 18,18 34,14 50,11 66,7 82,4 98,2", stroke: OK },
    },
    {
      kind: "spark",
      label: "Skills 订单",
      value: "126",
      trendText: "+12.3% 环比",
      trendTone: "up",
      spark: { points: "2,19 20,16 38,13 56,10 74,7 92,4", stroke: OK },
    },
    {
      kind: "spark",
      label: "试用转化",
      value: "34.2%",
      trendText: "+4.1% 环比",
      trendTone: "up",
      spark: { points: "2,17 25,15 50,12 75,9 98,6", stroke: OK },
    },
    {
      kind: "spark",
      label: "待协作",
      value: "9",
      trendText: "2 超时",
      trendTone: "down",
      spark: { points: "2,5 22,8 42,12 62,16 82,19 98,22", stroke: BAD },
    },
  ],
};

const ADMIN_SHELL: WorkbenchShellFixture = {
  overviewSectionId: "adm-overview",
  profile: { avatar: "管", name: "管理员", roleLine: "admin" },
  topbar: { title: "管理员工作台", pills: ["工单模式", "近24h"] },
  navGroups: [
    {
      label: "治理",
      items: [
        { href: "#adm-overview", label: "平台总览" },
        { href: "#adm-users", label: "用户与身份" },
        { href: "#adm-content", label: "内容与合规" },
        { href: "#adm-trade", label: "交易与结算" },
      ],
    },
    {
      label: "处置",
      items: [
        { href: "#adm-queue", label: "审核队列" },
        { href: "#adm-risk", label: "风险与举报" },
      ],
    },
    {
      label: "审计",
      items: [{ href: "#adm-audit", label: "日志与审计" }],
    },
    {
      label: "配置",
      items: [{ href: "#adm-config", label: "业务参数" }],
    },
  ],
  kpis: [
    { kind: "simple", label: "待审核", value: "86", trendText: "Skills 42 / 认证 18" },
    { kind: "simple", label: "开放举报", value: "23", trendText: "7 高优", trendClassName: "down" },
    { kind: "simple", label: "结算异常", value: "5", trendText: "待复核" },
    { kind: "simple", label: "登录风控", value: "14", trendText: "拦截 9" },
  ],
};

const SUPER_SHELL: WorkbenchShellFixture = {
  overviewSectionId: "sup-overview",
  profile: { avatar: "超", name: "超管", roleLine: "superadmin" },
  topbar: { title: "超管工作台", pills: ["变更窗口", "双人规则"] },
  navGroups: [
    {
      label: "继承",
      items: [
        { href: "#sup-overview", label: "平台总览" },
        { href: "#sup-admin-all", label: "管理员能力全集" },
      ],
    },
    {
      label: "系统",
      items: [
        { href: "#sup-env", label: "环境与部署" },
        { href: "#sup-perm", label: "权限矩阵" },
        { href: "#sup-tenant", label: "租户与数据域" },
      ],
    },
    {
      label: "高危",
      items: [{ href: "#sup-danger", label: "高危操作" }],
    },
  ],
  kpis: [
    { kind: "simple", label: "全局健康", value: "99.95%", trendText: "SLA 30d" },
    { kind: "simple", label: "阻塞工单", value: "3", trendText: "需升级", trendClassName: "down" },
    { kind: "simple", label: "待终审角色", value: "2", trendText: "admin 授予" },
    { kind: "simple", label: "密钥轮换", value: "1", trendText: "计划中" },
  ],
};

export const WORKBENCH_SHELL_BY_ROLE: Record<WorkbenchDemoRole, WorkbenchShellFixture> = {
  client: CLIENT_SHELL,
  creator: CREATOR_SHELL,
  admin: ADMIN_SHELL,
  super: SUPER_SHELL,
};

export function getWorkbenchShellFixture(role: WorkbenchDemoRole): WorkbenchShellFixture {
  return WORKBENCH_SHELL_BY_ROLE[role];
}
