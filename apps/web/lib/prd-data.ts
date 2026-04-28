export type Role = {
  id: string;
  name: string;
  summary: string;
  goals: string[];
};

export type Module = {
  id: string;
  name: string;
  phase: string;
  summary: string;
  metrics: string[];
};

export type TimelineItem = {
  stage: string;
  window: string;
  deliverables: string[];
};

export const productSummary = {
  name: "律植",
  slogan: "法承本心，技启新程",
  positioning:
    "汇聚法律 AI 技能，赋能万千法律服务场景；以客户工作台与创作者工作台为核心，灵感广场、社区、合作机会与发现律师构成公区能力（蓝图 v6.4）。"
};

export const roles: Role[] = [
  {
    id: "job-seeker",
    name: "求职方",
    summary: "建立档案、生成 AI 技能画像、投递岗位、购买求职服务。",
    goals: ["完成实名认证", "生成技能画像", "查看匹配职位", "一键投递"]
  },
  {
    id: "creator",
    name: "创作者",
    summary: "管理专业档案、发布智能体、配置演示内容、购买推广服务。",
    goals: ["身份认证", "创建智能体", "发布演示内容", "查看推广转化"]
  },
  {
    id: "recruiter",
    name: "机构客户（合作机会侧）",
    summary: "在合作机会中发布需求、筛选与沟通承接方；工作台统一走客户工作台。",
    goals: ["主体认证", "发布合作机会", "管理沟通与进度", "数据报表"]
  },
  {
    id: "client",
    name: "需求方",
    summary: "体验律师智能体演示、预约咨询、购买智能体服务。",
    goals: ["浏览律师", "体验演示", "发起咨询", "提交评价"]
  }
];

export const modules: Module[] = [
  {
    id: "profile",
    name: "求职档案与 AI 技能画像",
    phase: "MVP 必做",
    summary: "支撑求职匹配的基础数据层，后续连接简历优化、职位推荐与个人展示。",
    metrics: ["实名认证后可投递", "作品集支持 PDF/Word", "画像同步至简历与展示页"]
  },
  {
    id: "jobs",
    name: "职位发布与一键投递",
    phase: "MVP 必做",
    summary: "先完成职位列表、详情、投递动作与投递记录，再逐步接入 AI 匹配。",
    metrics: ["职位有效期 30 天", "按匹配度排序", "投递链路不超过 3 步"]
  },
  {
    id: "agents",
    name: "法律智能体市场",
    phase: "MVP 必做",
    summary: "支持智能体创建、审核、上架、试用与购买，演示内容作为独立对象管理。",
    metrics: ["演示先于购买", "审核 1 个工作日内", "支持试用/付费模式"]
  },
  {
    id: "promo",
    name: "律师品牌推广",
    phase: "MVP 增强",
    summary: "首页推荐与基础品牌页优先上线，演示内容嵌入推广卡片。",
    metrics: ["15 秒快速演示", "曝光/点击/咨询数据", "修改后需审核"]
  },
  {
    id: "training",
    name: "培训与增值服务",
    phase: "第二阶段",
    summary: "课程、简历优化、VIP 套餐与运营体系在核心闭环跑通后补齐。",
    metrics: ["购买后进入学习中心", "直播需预约", "支持结业证书"]
  }
];

export const timeline: TimelineItem[] = [
  {
    stage: "阶段 1",
    window: "第 1-2 周",
    deliverables: ["信息架构", "设计语言", "Web 工程骨架", "静态页面原型"]
  },
  {
    stage: "阶段 2",
    window: "第 3-4 周",
    deliverables: ["账号与角色切换", "职位与智能体列表", "基础演示页", "后台数据模型"]
  },
  {
    stage: "阶段 3",
    window: "第 5-6 周",
    deliverables: ["投递/咨询闭环", "审核流", "订单骨架", "运营数据看板"]
  }
];

export const kpis = [
  "核心页面加载时间 <= 2s",
  "演示启动加载 <= 1s（轻量）",
  "角色核心操作 <= 3 步",
  "演示数据统计口径与 PRD V1.3 保持一致"
];
