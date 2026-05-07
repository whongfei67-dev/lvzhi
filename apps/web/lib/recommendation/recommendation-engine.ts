"use client";

import {
  CIVIL_CAUSE_ALIAS_TO_LABEL,
  CIVIL_CAUSE_LABEL_SET,
  CIVIL_CAUSE_LIBRARY,
  CIVIL_SCOPE_CORPUS,
  CRIMINAL_CAUSE_ALIAS_TO_LABEL,
  CRIMINAL_CAUSE_LABEL_SET,
  CRIMINAL_CAUSE_LIBRARY,
  CRIMINAL_SCOPE_CORPUS,
  AMBIGUOUS_SCOPE_CORPUS,
  getRecommendationReason,
  legalDomainTags,
  userMindsetLibrary,
  userTypeLibrary,
  type RecommendationMindsetId,
  type RecommendationUserTypeGroup,
  type RecommendationUserTypeId,
} from "./config/recommendation-source";

export type RecommendationPath = "lawyer_path" | "cooperation_path";
export type CaseType = "labor_dispute" | "general";
export type DemandMode = "solve_problem" | "seek_help" | "collaboration" | "job" | "creator" | "after_sales";

export type ParsedDemand = {
  userType: RecommendationUserTypeId;
  mindset: RecommendationMindsetId;
  demandMode: DemandMode;
  city: string | null;
  legalDomain: string | null;
  causeLevel1Label: string | null;
  causeLabel: string | null;
  causePath: string[] | null;
  causeLevel2Label: string | null;
  causeMatchDepth: 0 | 1 | 2 | 3;
  causeScope: "civil" | "criminal" | "both";
  keywords: string[];
  tagValidation: {
    validKeywords: string[];
    invalidKeywords: string[];
  };
  budgetLevel: "low" | "medium" | "high" | null;
  budgetPreference: { type: "exact"; value: number } | { type: "range"; min: number; max: number } | null;
  lawyerServicePreference: "response_time" | "budget" | "online_consult" | null;
};

export type RecommendationItem = {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  reason: string;
  href: string;
  score?: number;
  causeLevels?: {
    l1: string;
    l2?: string;
    l3?: string;
  };
};

export type RecommendationProfile = {
  input: string;
  path: RecommendationPath;
  caseType: CaseType;
  keywords: string[];
  answers: string[];
  globalReason?: string;
  parsedDemand?: ParsedDemand;
  generatedAt: string;
  modules: {
    skills: RecommendationItem[];
    lawyers: RecommendationItem[];
    posts: RecommendationItem[];
    opportunities: RecommendationItem[];
  };
};

export const RECOMMENDATION_STORAGE_KEY = "lvzhi:demand-recommendation:v1";
export type SearchQuestionStep = {
  id: string;
  prompt: string;
  placeholder: string;
};

type SkillRecord = {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  author: string;
  authorCertifiedLawyer: boolean;
  authorRegion: string;
  authorDomain: string;
  causeLevels?: {
    l1: string;
    l2?: string;
    l3?: string;
  };
  href: string;
};

type PostRecord = {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  author: string;
  authorCertifiedLawyer: boolean;
  authorRegion: string;
  authorDomain: string;
  causeLevels?: {
    l1: string;
    l2?: string;
    l3?: string;
  };
  href: string;
};

type LawyerRecord = {
  id: string;
  name: string;
  organization: string;
  tags: string[];
  region: string;
  domain: string;
  causeLevels?: {
    l1: string;
    l2?: string;
    l3?: string;
  };
  certified: boolean;
  hourlyRateCny?: number;
  href: string;
};

type OpportunityRecord = {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  region: string;
  href: string;
};

const TOP_N = 5;
const L1_HIT_QUOTA = { posts: 0, skills: 0, lawyers: 2 } as const;
const L2_HIT_QUOTA = { posts: 2, skills: 2, lawyers: 2 } as const;
const L3_HIT_QUOTA = { posts: 3, skills: 3, lawyers: 1 } as const;
const LABOR_HINTS = ["劳动", "辞退", "绩效", "解除"];
const COOPERATION_HINTS = ["合作", "顾问", "采购", "实习", "机会", "岗位", "共创", "需求"];
const REGION_HINTS = ["北京", "上海", "深圳", "广州", "杭州", "成都"];
const DOMAIN_HINTS = ["劳动争议", "数据合规", "知识产权", "企业合规", "合同", "隐私政策"];
const CITY_ALIAS_TO_STANDARD: Record<string, string> = {
  北京市: "北京",
  上海市: "上海",
  深圳市: "深圳",
  广州市: "广州",
  杭州市: "杭州",
  成都市: "成都",
};
const CITY_TO_PROVINCE: Record<string, string> = {
  北京: "北京",
  上海: "上海",
  天津: "天津",
  重庆: "重庆",
  广州: "广东",
  深圳: "广东",
  杭州: "浙江",
  宁波: "浙江",
  南京: "江苏",
  苏州: "江苏",
  成都: "四川",
  武汉: "湖北",
  西安: "陕西",
  长沙: "湖南",
  郑州: "河南",
  合肥: "安徽",
  福州: "福建",
  厦门: "福建",
  南昌: "江西",
  济南: "山东",
  青岛: "山东",
  沈阳: "辽宁",
  大连: "辽宁",
  长春: "吉林",
  哈尔滨: "黑龙江",
  石家庄: "河北",
  太原: "山西",
  呼和浩特: "内蒙古",
  南宁: "广西",
  昆明: "云南",
  贵阳: "贵州",
  兰州: "甘肃",
  西宁: "青海",
  银川: "宁夏",
  乌鲁木齐: "新疆",
  海口: "海南",
  三亚: "海南",
};
const CITY_PROXIMITY_ORDER: Record<string, string[]> = {
  北京: ["北京", "上海", "杭州", "广州", "深圳", "成都"],
  上海: ["上海", "杭州", "北京", "深圳", "广州", "成都"],
  深圳: ["深圳", "广州", "上海", "杭州", "北京", "成都"],
  广州: ["广州", "深圳", "上海", "杭州", "北京", "成都"],
  杭州: ["杭州", "上海", "北京", "深圳", "广州", "成都"],
  成都: ["成都", "北京", "上海", "广州", "深圳", "杭州"],
};
const CITY_POOL = [
  "北京",
  "上海",
  "天津",
  "重庆",
  "广州",
  "深圳",
  "杭州",
  "南京",
  "苏州",
  "成都",
  "武汉",
  "西安",
  "长沙",
  "郑州",
  "合肥",
  "福州",
  "厦门",
  "南昌",
  "济南",
  "青岛",
  "沈阳",
  "大连",
  "长春",
  "哈尔滨",
  "石家庄",
  "太原",
  "呼和浩特",
  "南宁",
  "昆明",
  "贵阳",
  "兰州",
  "西宁",
  "银川",
  "乌鲁木齐",
  "海口",
  "三亚",
  "宁波",
] as const;
const CAUSE_L1_CONTRACT = "合同、准合同纠纷";
const CAUSE_L1_LABOR = "劳动争议、人事争议、新就业形态用工纠纷";
const CAUSE_L1_IP = "知识产权与竞争纠纷";
const CAUSE_L1_DATA = "数据、网络虚拟财产纠纷";

const USER_TYPE_IDS = new Set<string>(userTypeLibrary.map((item) => item.id));
const MINDSET_IDS = new Set<string>(userMindsetLibrary.map((item) => item.id));
const LEGAL_DOMAIN_CANDIDATES = [...legalDomainTags];
const DEMAND_MODE_BY_GROUP: Record<RecommendationUserTypeGroup, DemandMode> = {
  solve_help: "seek_help",
  solve_problem: "solve_problem",
  collaboration: "collaboration",
  job: "job",
  creator_supply: "creator",
  after_sales: "after_sales",
};
const USER_TYPE_RULES: Array<{ id: RecommendationUserTypeId; keywords: string[] }> = [
  { id: "complaint_review_after_sales", keywords: ["投诉", "差评", "售后", "举报", "退款"] },
  { id: "company_legal_procurement", keywords: ["采购", "外包律师", "甲方", "法律服务供应商", "招标"] },
  { id: "student_job_seeker", keywords: ["法学生", "应届", "实习", "校招", "学生求职"] },
  { id: "lawyer_job_seeker", keywords: ["律师求职", "跳槽", "律所招聘", "团队招聘", "执业机会"] },
  { id: "law_firm_team_collaboration", keywords: ["联合办案", "团队合作", "律所合作", "协作律师"] },
  { id: "lawyer_collaboration", keywords: ["合作机会", "项目合作", "顾问合作", "资源置换"] },
  { id: "legal_ai_tech_partner", keywords: ["技术合作", "法律ai合作方", "技术共创", "算法团队"] },
  { id: "legal_ai_learning", keywords: ["学习法律ai", "法律ai教程", "提示词", "智能体学习"] },
  { id: "legal_ai_creator_lawyer", keywords: ["创作者", "发布技能", "ai创作", "上传作品"] },
  { id: "creator_certification_exposure", keywords: ["认证", "曝光", "精选展示", "提升影响力"] },
  { id: "lawyer_leads", keywords: ["案源", "接案", "获客", "客户线索"] },
  { id: "template_document_client", keywords: ["模板", "文书", "合同范本", "起诉状"] },
  { id: "experience_case_client", keywords: ["相似案例", "经验帖", "看看别人", "判例"] },
  { id: "lawyer_review_client", keywords: ["复核", "律师看看", "二次确认", "审核材料"] },
  { id: "legal_ai_tool_client", keywords: ["法律ai工具", "智能工具", "测算器", "自动生成"] },
  { id: "case_result_client", keywords: ["胜诉", "能不能赢", "结果怎样", "赔偿多少"] },
  { id: "find_lawyer_client", keywords: ["找律师", "咨询律师", "委托律师", "律师推荐"] },
];
const MINDSET_RULES: Array<{ id: RecommendationMindsetId; keywords: string[] }> = [
  { id: "anxious", keywords: ["急", "马上", "来不及", "尽快", "今天就", "现在就"] },
  { id: "low_budget", keywords: ["免费", "便宜", "低价", "预算少", "先白嫖", "低成本"] },
  { id: "ready_to_pay", keywords: ["预算充足", "可付费", "马上付费", "高客单", "直接付费"] },
  { id: "cautious", keywords: ["稳妥", "保险", "风险低", "谨慎", "不要激进"] },
  { id: "rigorous", keywords: ["证据", "流程", "严谨", "细节", "条款"] },
  { id: "goal_directed", keywords: ["目标", "直接", "就想", "明确", "一步到位"] },
  { id: "demanding", keywords: ["专业一点", "要靠谱", "质量高", "要求高"] },
  { id: "semi_informed", keywords: ["我了解一些", "大概知道", "有点了解"] },
  { id: "confused", keywords: ["不知道", "很乱", "没思路", "怎么说", "说不清"] },
  { id: "guided", keywords: ["你来引导", "按步骤", "一步一步", "你建议"] },
  { id: "testing_incomplete", keywords: ["先随便看看", "先试试", "信息不全", "半真半假"] },
  { id: "overconfident", keywords: ["我肯定能赢", "稳赢", "没问题", "肯定胜诉"] },
  { id: "bluffing_aggressive", keywords: ["最狠", "吓唬", "强硬一点", "施压"] },
  { id: "background_oriented", keywords: ["有关系", "有资源", "熟人", "背景硬"] },
  { id: "capability_oriented", keywords: ["看能力", "看作品", "看案例", "看评价"] },
  { id: "conservative", keywords: ["保守", "低冲突", "协商优先", "先谈"] },
  { id: "emotional_high", keywords: ["气死", "崩溃", "情绪", "冲动", "受不了"] },
  { id: "legal_misconception", keywords: ["法律肯定", "我觉得肯定违法", "应该直接判"] },
  { id: "afraid_to_ask", keywords: ["不敢", "怕麻烦", "怕被知道", "不好意思问"] },
  { id: "professional_collaboration", keywords: ["协作", "联合", "专业合作", "资源互补", "共办"] },
  { id: "beginner", keywords: ["第一次", "小白", "不懂", "入门", "新手"] },
];
const KEYWORD_CANONICALIZATION_RULES: Array<{ trigger: string; canonical: string }> = [
  { trigger: "欠款", canonical: "债权债务" },
  { trigger: "借款", canonical: "债权债务" },
  { trigger: "账款", canonical: "债权债务" },
  { trigger: "货款", canonical: "合同纠纷" },
  { trigger: "回款", canonical: "合同纠纷" },
];
const DOMAIN_CONFLICT_KEYWORDS: Record<string, string[]> = {
  劳动争议: ["合同纠纷", "合同", "合同审查"],
  合同纠纷: ["劳动争议", "被辞退", "仲裁", "绩效", "工伤"],
  债权债务: ["劳动争议", "被辞退", "仲裁", "绩效"],
};

type UserTypeQuestionCore = {
  key: string;
  goalPrompt: string;
  goalPlaceholder: string;
  directionPrompt: string;
  directionPlaceholder: string;
  constraintPrompt: string;
  constraintPlaceholder: string;
};

const CITY_STEP: SearchQuestionStep = {
  id: "city",
  prompt: "请问您现在位于哪个城市？",
  placeholder: "例如：北京 / 上海 / 深圳",
};
const LAWYER_SERVICE_PREFERENCE_STEP: SearchQuestionStep = {
  id: "lawyer-service-preference",
  prompt: "您更在意哪一项，响应时间、预算或是线上咨询？",
  placeholder: "可回复：1 / 2 / 3（或直接输入“响应时间/预算/线上咨询”）",
};

const USER_TYPE_QUESTION_CORE: Record<RecommendationUserTypeId, UserTypeQuestionCore> = {
  find_lawyer_client: {
    key: "find-lawyer",
    goalPrompt: "您当前更希望达成哪类法律服务目标？",
    goalPlaceholder: "例如：找律师 / 法律咨询 / 合同审查 / 材料复核",
    directionPrompt: "您更关注哪类法律方向？",
    directionPlaceholder: "例如：劳动争议 / 合同纠纷 / 数据合规",
    constraintPrompt: "您的咨询预算是多少？（会用于匹配律师小时费）",
    constraintPlaceholder: "例如：预算500 / 预算1000-1500 / 预算充足",
  },
  case_result_client: {
    key: "case-result",
    goalPrompt: "您这次最想先确认什么结果？",
    goalPlaceholder: "例如：能否主张赔偿 / 风险大小 / 下一步行动",
    directionPrompt: "请先确认案件方向（当前仅支持两类）",
    directionPlaceholder: "请输入：劳动纠纷 / 合同纠纷",
    constraintPrompt: "您目前最影响判断的关键信息是什么？",
    constraintPlaceholder: "例如：证据不足 / 时间紧 / 预算有限",
  },
  legal_ai_tool_client: {
    key: "ai-tool-client",
    goalPrompt: "您想优先找哪类法律 AI 工具？",
    goalPlaceholder: "例如：风险评估 / 文书生成 / 证据清单 / 法律咨询",
    directionPrompt: "工具准备用于哪类问题场景？",
    directionPlaceholder: "例如：劳动争议 / 合同纠纷 / 知识产权",
    constraintPrompt: "您对工具的使用方式有何限制？",
    constraintPlaceholder: "例如：免费优先 / 需中文报告 / 需可下载",
  },
  lawyer_review_client: {
    key: "lawyer-review-client",
    goalPrompt: "您希望律师优先复核哪部分内容？",
    goalPlaceholder: "例如：合同条款 / 证据材料 / 文书草稿 / 法律咨询",
    directionPrompt: "您的问题主要属于哪个法律方向？",
    directionPlaceholder: "例如：劳动争议 / 合同纠纷 / 企业合规",
    constraintPrompt: "您更在意哪项复核条件？",
    constraintPlaceholder: "例如：回复时效 / 费用范围 / 是否可线上",
  },
  experience_case_client: {
    key: "experience-case-client",
    goalPrompt: "您希望先看到哪类相似经验？",
    goalPlaceholder: "例如：实务经验帖 / 相似案例 / 律师观点",
    directionPrompt: "您想看的问题方向是？",
    directionPlaceholder: "例如：劳动争议 / 合同纠纷 / 数据合规",
    constraintPrompt: "您更偏好哪种内容形式？",
    constraintPlaceholder: "例如：短结论 / 详细拆解 / 可直接执行清单",
  },
  template_document_client: {
    key: "template-document-client",
    goalPrompt: "您想优先获取哪类模板或文书？",
    goalPlaceholder: "例如：合同模板 / 仲裁申请 / 律师函 / 法律咨询提纲",
    directionPrompt: "模板将用于哪个法律方向？",
    directionPlaceholder: "例如：劳动争议 / 合同纠纷 / 企业合规",
    constraintPrompt: "您对模板的要求是什么？",
    constraintPlaceholder: "例如：可直接修改 / 需律师复核 / 低成本优先",
  },
  lawyer_collaboration: {
    key: "lawyer-collab",
    goalPrompt: "您当前最想对接哪类合作机会？",
    goalPlaceholder: "例如：企业顾问 / 联合办案 / 技术共创 / 法律咨询协作",
    directionPrompt: "合作更偏向哪个业务方向？",
    directionPlaceholder: "例如：劳动争议 / 合同纠纷 / 数据合规",
    constraintPrompt: "您最关注的合作条件是什么？",
    constraintPlaceholder: "例如：区域限制 / 收费方式 / 合作周期",
  },
  lawyer_leads: {
    key: "lawyer-leads",
    goalPrompt: "您主要想提升哪类案源获取？",
    goalPlaceholder: "例如：企业顾问案源 / 个人咨询 / 法律咨询转化",
    directionPrompt: "您希望重点获取哪个方向的客户？",
    directionPlaceholder: "例如：劳动争议 / 合同纠纷 / 企业合规",
    constraintPrompt: "您当前最大的获客限制是什么？",
    constraintPlaceholder: "例如：曝光不足 / 转化低 / 内容产能有限",
  },
  legal_ai_creator_lawyer: {
    key: "ai-creator-lawyer",
    goalPrompt: "您希望优先创作哪类法律 AI 内容？",
    goalPlaceholder: "例如：技能工具 / 提示词 / 教程 / 法律咨询助手",
    directionPrompt: "创作主题主要聚焦哪个方向？",
    directionPlaceholder: "例如：劳动争议 / 合同纠纷 / 法律科技",
    constraintPrompt: "您最需要的平台支持是什么？",
    constraintPlaceholder: "例如：流量曝光 / 共创伙伴 / 商业化路径",
  },
  student_job_seeker: {
    key: "student-job",
    goalPrompt: "您当前求职目标是什么？",
    goalPlaceholder: "例如：实习 / 校招 / 项目制合作 / 法律咨询助理",
    directionPrompt: "您希望进入的方向是什么？",
    directionPlaceholder: "例如：知识产权 / 合同争议 / 企业法务",
    constraintPrompt: "您当前最大的求职限制是什么？",
    constraintPlaceholder: "例如：无实习经历 / 时间紧 / 仅接受线上",
  },
  lawyer_job_seeker: {
    key: "lawyer-job",
    goalPrompt: "您正在寻找哪类岗位机会？",
    goalPlaceholder: "例如：授薪律师 / 顾问律师 / 法律咨询岗位",
    directionPrompt: "您更想发展哪个业务方向？",
    directionPlaceholder: "例如：劳动争议 / 合同纠纷 / 企业合规",
    constraintPrompt: "您当前最在意的岗位条件是？",
    constraintPlaceholder: "例如：城市 / 团队风格 / 收入结构",
  },
  company_legal_procurement: {
    key: "company-procurement",
    goalPrompt: "您当前采购的法律服务类型是？",
    goalPlaceholder: "例如：外包律师 / 合同审查 / 常年法律咨询",
    directionPrompt: "采购重点属于哪个法律方向？",
    directionPlaceholder: "例如：合同纠纷 / 劳动争议 / 数据合规",
    constraintPrompt: "您最关注的采购条件是什么？",
    constraintPlaceholder: "例如：交付时效 / 预算范围 / 行业经验",
  },
  legal_ai_learning: {
    key: "ai-learning",
    goalPrompt: "您当前学习法律 AI 的主要目标是？",
    goalPlaceholder: "例如：提升办案效率 / 搭建工具 / 法律咨询自动化",
    directionPrompt: "您希望先学习哪类方向？",
    directionPlaceholder: "例如：提示词 / 智能体 / 自动化工作流",
    constraintPrompt: "您当前学习最大的限制是什么？",
    constraintPlaceholder: "例如：时间少 / 缺场景 / 缺实操案例",
  },
  law_firm_team_collaboration: {
    key: "law-firm-collab",
    goalPrompt: "您希望推进哪类团队协作？",
    goalPlaceholder: "例如：联合办案 / 律所合作 / 法律咨询协同",
    directionPrompt: "协作主要涉及哪个业务方向？",
    directionPlaceholder: "例如：劳动争议 / 合同纠纷 / 企业合规",
    constraintPrompt: "协作最核心的限制条件是什么？",
    constraintPlaceholder: "例如：地域 / 资源互补 / 结算方式",
  },
  legal_ai_tech_partner: {
    key: "ai-tech-partner",
    goalPrompt: "您想找哪类法律 AI 技术合作方？",
    goalPlaceholder: "例如：产品团队 / 算法团队 / 交付团队 / 法律咨询技术化",
    directionPrompt: "合作项目偏向哪个场景？",
    directionPlaceholder: "例如：合同审查 / 风险评估 / 知识库问答",
    constraintPrompt: "您最关注哪类合作边界？",
    constraintPlaceholder: "例如：知识产权归属 / 商业模式 / 交付周期",
  },
  creator_certification_exposure: {
    key: "creator-cert",
    goalPrompt: "您更希望优先达成哪项目标？",
    goalPlaceholder: "例如：创作者认证 / 内容曝光 / 法律咨询影响力",
    directionPrompt: "您想重点展示哪类能力方向？",
    directionPlaceholder: "例如：实务经验 / AI 工具创作 / 专题案例",
    constraintPrompt: "您当前最大的增长限制是什么？",
    constraintPlaceholder: "例如：缺曝光 / 缺案例包装 / 缺合作资源",
  },
  complaint_review_after_sales: {
    key: "after-sales",
    goalPrompt: "您这次主要希望处理哪类售后问题？",
    goalPlaceholder: "例如：投诉 / 评价 / 退款 / 法律咨询服务争议",
    directionPrompt: "问题主要发生在哪个环节？",
    directionPlaceholder: "例如：沟通质量 / 交付质量 / 费用争议",
    constraintPrompt: "您当前最希望先解决什么？",
    constraintPlaceholder: "例如：尽快响应 / 明确责任 / 可执行处理方案",
  },
};

function variantPrompt(base: string, style: number): string {
  if (style === 1) return `为了更快匹配，${base}`;
  if (style === 2) return `请优先确认：${base}`;
  return base;
}

function variantPlaceholder(base: string, style: number): string {
  if (style === 1) return `${base}（可简短作答）`;
  if (style === 2) return `${base}（优先写最关键信息）`;
  return base;
}

function buildQuestionSetsByUserType(userType: RecommendationUserTypeId): SearchQuestionStep[][] {
  const core = USER_TYPE_QUESTION_CORE[userType];
  return [0, 1, 2].map((style) => {
    const baseSteps: SearchQuestionStep[] = [
      {
        id: `${core.key}-goal-${style + 1}`,
        prompt: variantPrompt(core.goalPrompt, style),
        placeholder: variantPlaceholder(core.goalPlaceholder, style),
      },
      {
        id: `${core.key}-city-${style + 1}`,
        prompt: CITY_STEP.prompt,
        placeholder: CITY_STEP.placeholder,
      },
      {
        id: `${core.key}-direction-${style + 1}`,
        prompt: variantPrompt(core.directionPrompt, style),
        placeholder: variantPlaceholder(core.directionPlaceholder, style),
      },
    ];
    baseSteps.push({
      id: `${core.key}-service-pref-${style + 1}`,
      prompt: variantPrompt(LAWYER_SERVICE_PREFERENCE_STEP.prompt, style),
      placeholder: variantPlaceholder(LAWYER_SERVICE_PREFERENCE_STEP.placeholder, style),
    });
    baseSteps.push({
      id: `${core.key}-constraint-${style + 1}`,
      prompt: variantPrompt(core.constraintPrompt, style),
      placeholder: variantPlaceholder(core.constraintPlaceholder, style),
    });
    return baseSteps;
  });
}

function pickQuestionSetIndex(seed: string): number {
  if (!seed.trim()) return 0;
  let hash = 0;
  for (const ch of seed) {
    hash = (hash + ch.charCodeAt(0)) % 9973;
  }
  return hash % 3;
}

type CauseSeed = {
  l1: string;
  l2?: string;
  l3?: string;
  label: string;
  scope: "civil" | "criminal";
};

const TEST_REGION_POOL = ["北京", "上海", "深圳", "广州", "杭州", "成都", "南京", "武汉"] as const;
const TEST_AUTHOR_POOL = [
  "测试作者甲",
  "测试作者乙",
  "测试作者丙",
  "测试作者丁",
  "测试作者戊",
  "测试作者己",
  "测试作者庚",
  "测试作者辛",
] as const;
const TEST_ORG_POOL = ["测试律所A", "测试律所B", "测试律所C", "测试律所D", "测试律所E"] as const;
const TEST_SKILL_ACTION_POOL = ["速查清单", "证据梳理器", "风险自检表", "办案路线图", "节点提醒器"] as const;
const TEST_POST_ACTION_POOL = ["怎么处理更稳", "第一步怎么做", "证据怎么补", "流程怎么走", "风险点有哪些"] as const;

function buildCauseSeeds(): CauseSeed[] {
  const civilSeeds: CauseSeed[] = CIVIL_CAUSE_LIBRARY.filter((node) => node.level >= 3 && CIVIL_CAUSE_LABEL_SET.has(node.label))
    .map((node) => {
      const levels = extractCauseLevels(node.path);
      return {
        l1: levels.l1 ?? "民事案由",
        l2: levels.l2 ?? undefined,
        l3: levels.l3 ?? node.label,
        label: node.label,
        scope: "civil" as const,
      };
    })
    .filter((item) => Boolean(item.l1 && item.l3));

  const criminalSeeds: CauseSeed[] = CRIMINAL_CAUSE_LIBRARY.filter(
    (node) => node.level >= 3 && CRIMINAL_CAUSE_LABEL_SET.has(node.label),
  )
    .map((node) => {
      const levels = extractCauseLevels(node.path);
      return {
        l1: levels.l1 ?? "刑事案由",
        l2: levels.l2 ?? undefined,
        l3: levels.l3 ?? node.label,
        label: node.label,
        scope: "criminal" as const,
      };
    })
    .filter((item) => Boolean(item.l1 && item.l3));

  return [...civilSeeds, ...criminalSeeds];
}

const TEST_CAUSE_SEEDS = buildCauseSeeds();

function pickCauseSeed(index: number): CauseSeed {
  const seedIndex = (index * 17 + 23) % TEST_CAUSE_SEEDS.length;
  return TEST_CAUSE_SEEDS[seedIndex];
}

function buildTagsByCause(seed: CauseSeed, index: number): string[] {
  const base = seed.label
    .replace(/[（(].*?[）)]/g, " ")
    .replace(/[、，,\/]/g, " ")
    .replace(/(纠纷|争议|之诉|请求|案件|程序|罪)$/g, "")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2)
    .slice(0, 3);
  const scopeTag = seed.scope === "criminal" ? "刑事案件" : "民事纠纷";
  const domainTag = seed.scope === "criminal" ? "刑事案件" : seed.l2 ?? "民事纠纷";
  const mixTag = index % 2 === 0 ? "测试样本" : "推荐测试";
  return uniqueKeywords([scopeTag, domainTag, seed.l1, seed.l2 ?? "", seed.l3 ?? "", ...base, mixTag]).slice(0, 8);
}

function buildCauseLevelsBySeed(seed: CauseSeed): { l1: string; l2?: string; l3?: string } {
  return {
    l1: seed.l1,
    l2: seed.l2,
    l3: seed.l3,
  };
}

function isCriminalL1Label(label: string | null | undefined): boolean {
  return Boolean(label && label.includes("罪"));
}

function inferScopeTagFromLevels(levels: CauseLevels | undefined): string {
  if (!levels) return "民事纠纷";
  return isCriminalL1Label(levels.l1) ? "刑事案件" : "民事纠纷";
}

function withHierarchyTags<T extends { tags: string[]; causeLevels?: CauseLevels }>(row: T): T {
  if (!row.causeLevels) return row;
  const scopeTag = inferScopeTagFromLevels(row.causeLevels);
  return {
    ...row,
    tags: uniqueKeywords([scopeTag, row.causeLevels.l1 ?? "", row.causeLevels.l2 ?? "", row.causeLevels.l3 ?? "", ...row.tags]),
  };
}

function generateSkillTestRecords(count: number): SkillRecord[] {
  const records: SkillRecord[] = [];
  for (let i = 0; i < count; i += 1) {
    const seed = pickCauseSeed(i);
    const author = TEST_AUTHOR_POOL[i % TEST_AUTHOR_POOL.length];
    const region = TEST_REGION_POOL[(i * 3) % TEST_REGION_POOL.length];
    const action = TEST_SKILL_ACTION_POOL[i % TEST_SKILL_ACTION_POOL.length];
    const shallowL2 = i % 5 === 0;
    const shallowL1 = i % 11 === 0;
    records.push({
      id: `skill-test-${String(i + 1).padStart(3, "0")}`,
      title: shallowL1 ? `${seed.l1}方向${action}` : shallowL2 ? `${seed.l2 ?? seed.l1}方向${action}` : `${seed.label}${action}`,
      subtitle: shallowL1
        ? `适用：${seed.l1}一级方向容错筛选`
        : shallowL2
          ? `适用：${seed.l2 ?? seed.l1}二级方向容错筛选`
          : `适用：${seed.l3 ?? seed.label}测试筛选`,
      tags: buildTagsByCause(seed, i),
      author,
      authorCertifiedLawyer: i % 4 !== 0,
      authorRegion: region,
      authorDomain: seed.scope === "criminal" ? "刑事案件" : seed.l2 ?? "民事纠纷",
      causeLevels: shallowL1 ? { l1: seed.l1 } : shallowL2 ? { l1: seed.l1, l2: seed.l2 } : buildCauseLevelsBySeed(seed),
      href: "/inspiration",
    });
  }
  return records;
}

function generatePostTestRecords(count: number): PostRecord[] {
  const records: PostRecord[] = [];
  for (let i = 0; i < count; i += 1) {
    const seed = pickCauseSeed(i + 300);
    const author = TEST_AUTHOR_POOL[(i * 5 + 1) % TEST_AUTHOR_POOL.length];
    const region = TEST_REGION_POOL[(i * 2 + 1) % TEST_REGION_POOL.length];
    const action = TEST_POST_ACTION_POOL[i % TEST_POST_ACTION_POOL.length];
    const shallowL2 = i % 5 === 0;
    const shallowL1 = i % 11 === 0;
    records.push({
      id: `post-test-${String(i + 1).padStart(3, "0")}`,
      title: shallowL1
        ? `${seed.l1}方向：${action}？`
        : shallowL2
          ? `${seed.l2 ?? seed.l1}方向：${action}？`
          : `${seed.label}：${action}？`,
      subtitle: `作者：${author}`,
      tags: buildTagsByCause(seed, i + 1000),
      author,
      authorCertifiedLawyer: i % 3 !== 0,
      authorRegion: region,
      authorDomain: seed.scope === "criminal" ? "刑事案件" : seed.l2 ?? "民事纠纷",
      causeLevels: shallowL1 ? { l1: seed.l1 } : shallowL2 ? { l1: seed.l1, l2: seed.l2 } : buildCauseLevelsBySeed(seed),
      href: "/community",
    });
  }
  return records;
}

function generateLawyerTestRecords(count: number): LawyerRecord[] {
  const records: LawyerRecord[] = [];
  const lawyerRatePool = [300, 500, 650, 800, 950, 1100, 1250, 1400, 1550, 3000] as const;
  for (let i = 0; i < count; i += 1) {
    const seed = pickCauseSeed(i + 700);
    const region = TEST_REGION_POOL[(i * 7 + 2) % TEST_REGION_POOL.length];
    const org = TEST_ORG_POOL[i % TEST_ORG_POOL.length];
    const tags = uniqueKeywords([...buildTagsByCause(seed, i + 2000), region]).slice(0, 8);
    records.push({
      id: `lawyer-test-${String(i + 1).padStart(3, "0")}`,
      name: `${TEST_AUTHOR_POOL[(i * 3 + 2) % TEST_AUTHOR_POOL.length]}${String((i % 90) + 10)}`,
      organization: org,
      tags,
      region,
      domain: seed.scope === "criminal" ? "刑事案件" : seed.l2 ?? "民事纠纷",
      causeLevels: buildCauseLevelsBySeed(seed),
      certified: (i + 2) % 5 !== 0,
      hourlyRateCny: lawyerRatePool[i % lawyerRatePool.length]!,
      href: "/lawyers",
    });
  }
  return records;
}

const BASE_SKILLS: SkillRecord[] = [
  {
    id: "skill-labor-1",
    title: "违法解除赔偿测算器",
    subtitle: "适用：被辞退、赔偿测算",
    tags: ["劳动争议", "被辞退", "赔偿", "仲裁准备"],
    author: "陈晓敏",
    authorCertifiedLawyer: true,
    authorRegion: "北京",
    authorDomain: "劳动争议",
    causeLevels: { l1: CAUSE_L1_LABOR, l2: "劳动争议", l3: "劳动合同纠纷" },
    href: "/inspiration",
  },
  {
    id: "skill-labor-2",
    title: "劳动仲裁证据清单生成器",
    subtitle: "适用：证据整理、仲裁材料",
    tags: ["劳动争议", "证据", "仲裁"],
    author: "赵远航",
    authorCertifiedLawyer: false,
    authorRegion: "上海",
    authorDomain: "劳动争议",
    causeLevels: { l1: CAUSE_L1_LABOR, l2: "劳动争议", l3: "劳动合同纠纷" },
    href: "/inspiration",
  },
  {
    id: "skill-data-1",
    title: "数据合规风险扫描器",
    subtitle: "适用：隐私政策、数据治理",
    tags: ["数据合规", "隐私政策", "企业合规"],
    author: "顾彦清",
    authorCertifiedLawyer: true,
    authorRegion: "上海",
    authorDomain: "数据合规",
    causeLevels: { l1: CAUSE_L1_DATA, l2: "数据纠纷", l3: "侵害数据权益纠纷" },
    href: "/inspiration",
  },
  {
    id: "skill-ip-1",
    title: "AI 版权审查助手",
    subtitle: "适用：知识产权、版权治理",
    tags: ["知识产权", "版权", "法律AI"],
    author: "林雨欣",
    authorCertifiedLawyer: true,
    authorRegion: "深圳",
    authorDomain: "知识产权",
    causeLevels: { l1: CAUSE_L1_IP, l2: "知识产权权属、侵权纠纷", l3: "侵害商标权纠纷" },
    href: "/inspiration",
  },
  {
    id: "skill-corp-1",
    title: "企业顾问服务产品包",
    subtitle: "适用：常法顾问、合规巡检",
    tags: ["企业顾问", "企业合规", "合同"],
    author: "何展鹏",
    authorCertifiedLawyer: true,
    authorRegion: "广州",
    authorDomain: "企业合规",
    causeLevels: { l1: CAUSE_L1_CONTRACT, l2: "合同纠纷", l3: "法律服务合同纠纷" },
    href: "/inspiration",
  },
  {
    id: "skill-contract-1",
    title: "合同欠款回收策略清单",
    subtitle: "适用：欠款纠纷、催收谈判、起诉前准备",
    tags: ["合同纠纷", "欠款纠纷", "债权债务", "付款违约"],
    author: "周景澄",
    authorCertifiedLawyer: true,
    authorRegion: "杭州",
    authorDomain: "合同纠纷",
    causeLevels: { l1: CAUSE_L1_CONTRACT, l2: "合同纠纷", l3: "买卖合同纠纷" },
    href: "/inspiration",
  },
  {
    id: "skill-contract-2",
    title: "应收账款催收函生成器",
    subtitle: "适用：应收账款、催收通知、违约催告",
    tags: ["合同纠纷", "债权债务", "欠款纠纷", "催收"],
    author: "王泽远",
    authorCertifiedLawyer: true,
    authorRegion: "南京",
    authorDomain: "债权债务",
    causeLevels: { l1: CAUSE_L1_CONTRACT, l2: "合同纠纷", l3: "民间借贷纠纷" },
    href: "/inspiration",
  },
  {
    id: "skill-contract-3",
    title: "借款证据链完整性检查表",
    subtitle: "适用：借款纠纷、证据补强、起诉准备",
    tags: ["债权债务", "借款", "证据", "合同纠纷"],
    author: "沈言律",
    authorCertifiedLawyer: true,
    authorRegion: "上海",
    authorDomain: "债权债务",
    causeLevels: { l1: CAUSE_L1_CONTRACT, l2: "合同纠纷", l3: "民间借贷纠纷" },
    href: "/inspiration",
  },
];

const BASE_POSTS: PostRecord[] = [
  {
    id: "post-labor-1",
    title: "公司口头辞退，如何留证才稳妥？",
    subtitle: "作者：陈晓敏",
    tags: ["劳动争议", "被辞退", "证据", "仲裁"],
    author: "陈晓敏",
    authorCertifiedLawyer: true,
    authorRegion: "北京",
    authorDomain: "劳动争议",
    causeLevels: { l1: CAUSE_L1_LABOR, l2: "劳动争议", l3: "劳动合同纠纷" },
    href: "/community",
  },
  {
    id: "post-labor-2",
    title: "绩效不合格辞退的程序风险拆解",
    subtitle: "作者：企业法务顾问",
    tags: ["劳动争议", "绩效", "解除程序"],
    author: "企业法务顾问",
    authorCertifiedLawyer: false,
    authorRegion: "上海",
    authorDomain: "劳动争议",
    causeLevels: { l1: CAUSE_L1_LABOR, l2: "劳动争议", l3: "劳动合同纠纷" },
    href: "/community",
  },
  {
    id: "post-job-1",
    title: "法学生如何切入知识产权实习",
    subtitle: "作者：林雨欣",
    tags: ["法学生", "实习", "知识产权"],
    author: "林雨欣",
    authorCertifiedLawyer: true,
    authorRegion: "深圳",
    authorDomain: "知识产权",
    causeLevels: { l1: CAUSE_L1_IP, l2: "知识产权权属、侵权纠纷", l3: "侵害商标权纠纷" },
    href: "/community",
  },
  {
    id: "post-contract-1",
    title: "客户拖欠货款时，先发函还是先起诉？",
    subtitle: "作者：周景澄",
    tags: ["合同纠纷", "欠款纠纷", "发函", "起诉策略"],
    author: "周景澄",
    authorCertifiedLawyer: true,
    authorRegion: "杭州",
    authorDomain: "合同纠纷",
    causeLevels: { l1: CAUSE_L1_CONTRACT, l2: "合同纠纷", l3: "买卖合同纠纷" },
    href: "/community",
  },
  {
    id: "post-debt-1",
    title: "借款到期不还，证据链要怎么补全？",
    subtitle: "作者：王泽远",
    tags: ["债权债务", "借款", "证据", "催收"],
    author: "王泽远",
    authorCertifiedLawyer: true,
    authorRegion: "南京",
    authorDomain: "债权债务",
    causeLevels: { l1: CAUSE_L1_CONTRACT, l2: "合同纠纷", l3: "民间借贷纠纷" },
    href: "/community",
  },
  {
    id: "post-contract-2",
    title: "欠款纠纷起诉前，先确认这 4 个合同条款",
    subtitle: "作者：沈言律",
    tags: ["合同纠纷", "欠款纠纷", "合同条款", "起诉准备"],
    author: "沈言律",
    authorCertifiedLawyer: true,
    authorRegion: "上海",
    authorDomain: "合同纠纷",
    causeLevels: { l1: CAUSE_L1_CONTRACT, l2: "合同纠纷", l3: "买卖合同纠纷" },
    href: "/community",
  },
];

const BASE_LAWYERS: LawyerRecord[] = [
  {
    id: "lawyer-1",
    name: "陈晓敏",
    organization: "华衡律师事务所",
    tags: ["劳动争议", "仲裁", "离职纠纷"],
    region: "北京",
    domain: "劳动争议",
    causeLevels: { l1: CAUSE_L1_LABOR, l2: "劳动争议", l3: "劳动合同纠纷" },
    certified: true,
    hourlyRateCny: 680,
    href: "/lawyers",
  },
  {
    id: "lawyer-2",
    name: "顾彦清",
    organization: "衡正律师事务所",
    tags: ["数据合规", "隐私政策", "企业顾问"],
    region: "上海",
    domain: "数据合规",
    causeLevels: { l1: CAUSE_L1_DATA, l2: "数据纠纷", l3: "侵害数据权益纠纷" },
    certified: true,
    hourlyRateCny: 980,
    href: "/lawyers",
  },
  {
    id: "lawyer-3",
    name: "林雨欣",
    organization: "知衡知识产权团队",
    tags: ["知识产权", "版权", "AI治理"],
    region: "深圳",
    domain: "知识产权",
    causeLevels: { l1: CAUSE_L1_IP, l2: "知识产权权属、侵权纠纷", l3: "侵害商标权纠纷" },
    certified: true,
    hourlyRateCny: 920,
    href: "/lawyers",
  },
  {
    id: "lawyer-4",
    name: "何展鹏",
    organization: "中衡企业法务团队",
    tags: ["企业顾问", "企业合规", "合同审查"],
    region: "广州",
    domain: "企业合规",
    causeLevels: { l1: CAUSE_L1_CONTRACT, l2: "合同纠纷", l3: "法律服务合同纠纷" },
    certified: true,
    hourlyRateCny: 760,
    href: "/lawyers",
  },
  {
    id: "lawyer-5",
    name: "周景澄",
    organization: "恒理商事争议团队",
    tags: ["合同纠纷", "欠款纠纷", "付款违约"],
    region: "杭州",
    domain: "合同纠纷",
    causeLevels: { l1: CAUSE_L1_CONTRACT, l2: "合同纠纷", l3: "买卖合同纠纷" },
    certified: true,
    hourlyRateCny: 880,
    href: "/lawyers",
  },
  {
    id: "lawyer-6",
    name: "王泽远",
    organization: "东衡债务争议中心",
    tags: ["债权债务", "借款纠纷", "执行回款"],
    region: "南京",
    domain: "债权债务",
    causeLevels: { l1: CAUSE_L1_CONTRACT, l2: "合同纠纷", l3: "民间借贷纠纷" },
    certified: true,
    hourlyRateCny: 560,
    href: "/lawyers",
  },
  {
    id: "lawyer-7",
    name: "沈言律",
    organization: "申城商事争议组",
    tags: ["合同纠纷", "欠款纠纷", "合同条款"],
    region: "上海",
    domain: "合同纠纷",
    causeLevels: { l1: CAUSE_L1_CONTRACT, l2: "合同纠纷", l3: "买卖合同纠纷" },
    certified: true,
    hourlyRateCny: 720,
    href: "/lawyers",
  },
];

const BOOST_SKILLS: SkillRecord[] = [
  {
    id: "skill-boost-defamation-1",
    title: "名誉权纠纷快速处置清单",
    subtitle: "适用：线上诽谤、名誉侵权固定证据",
    tags: ["名誉权纠纷", "人格权纠纷", "诽谤", "证据"],
    author: "测试作者甲",
    authorCertifiedLawyer: true,
    authorRegion: "上海",
    authorDomain: "人格权纠纷",
    causeLevels: { l1: "人格权纠纷", l2: "人格权纠纷", l3: "名誉权纠纷" },
    href: "/inspiration",
  },
  {
    id: "skill-boost-defamation-2",
    title: "网上诽谤名誉维权步骤卡",
    subtitle: "适用：网络平台侵权投诉与起诉准备",
    tags: ["名誉权纠纷", "人格权纠纷", "网络诽谤", "维权"],
    author: "测试作者乙",
    authorCertifiedLawyer: true,
    authorRegion: "北京",
    authorDomain: "人格权纠纷",
    causeLevels: { l1: "人格权纠纷", l2: "人格权纠纷", l3: "名誉权纠纷" },
    href: "/inspiration",
  },
  {
    id: "skill-boost-traffic-1",
    title: "交通事故责任划分证据模板",
    subtitle: "适用：机动车交通事故责任纠纷",
    tags: ["机动车交通事故责任纠纷", "侵权责任纠纷", "交通事故", "赔偿"],
    author: "测试作者丙",
    authorCertifiedLawyer: true,
    authorRegion: "杭州",
    authorDomain: "侵权责任纠纷",
    causeLevels: { l1: "侵权责任纠纷", l2: "侵权责任纠纷", l3: "机动车交通事故责任纠纷" },
    href: "/inspiration",
  },
  {
    id: "skill-boost-traffic-2",
    title: "交通事故赔偿项目核对器",
    subtitle: "适用：损失核算、理赔谈判、诉前准备",
    tags: ["机动车交通事故责任纠纷", "侵权责任纠纷", "交通事故赔偿", "理赔"],
    author: "测试作者丁",
    authorCertifiedLawyer: true,
    authorRegion: "广州",
    authorDomain: "侵权责任纠纷",
    causeLevels: { l1: "侵权责任纠纷", l2: "侵权责任纠纷", l3: "机动车交通事故责任纠纷" },
    href: "/inspiration",
  },
  {
    id: "skill-boost-border-1",
    title: "偷越国边境刑事风险评估卡",
    subtitle: "适用：偷越国（边）境相关咨询",
    tags: ["偷越国（边）境罪", "妨害国（边）境管理罪", "刑事案件", "取保"],
    author: "测试作者戊",
    authorCertifiedLawyer: true,
    authorRegion: "成都",
    authorDomain: "刑事案件",
    causeLevels: { l1: "妨害社会管理秩序罪", l2: "妨害国（边）境管理罪", l3: "偷越国（边）境罪" },
    href: "/inspiration",
  },
  {
    id: "skill-boost-border-2",
    title: "偷越边境案件程序节点图",
    subtitle: "适用：传唤、拘留、取保等阶段判断",
    tags: ["偷越国（边）境罪", "妨害国（边）境管理罪", "刑事程序", "量刑"],
    author: "测试作者己",
    authorCertifiedLawyer: true,
    authorRegion: "武汉",
    authorDomain: "刑事案件",
    causeLevels: { l1: "妨害社会管理秩序罪", l2: "妨害国（边）境管理罪", l3: "偷越国（边）境罪" },
    href: "/inspiration",
  },
  {
    id: "skill-boost-maritime-l1",
    title: "海事海商纠纷方向速查清单",
    subtitle: "适用：海事海商一级方向容错筛查",
    tags: ["海事海商纠纷", "海上", "通海水域", "纠纷方向"],
    author: "测试作者辛",
    authorCertifiedLawyer: true,
    authorRegion: "上海",
    authorDomain: "海事海商纠纷",
    causeLevels: { l1: "海事海商纠纷" },
    href: "/inspiration",
  },
  {
    id: "skill-boost-company-l1",
    title: "与公司、证券、保险、票据等有关的民事纠纷方向速查清单",
    subtitle: "适用：公司证券票据一级方向容错筛查",
    tags: ["与公司、证券、保险、票据等有关的民事纠纷", "公司", "证券", "票据"],
    author: "测试作者甲",
    authorCertifiedLawyer: true,
    authorRegion: "北京",
    authorDomain: "公司股权",
    causeLevels: { l1: "与公司、证券、保险、票据等有关的民事纠纷" },
    href: "/inspiration",
  },
  {
    id: "skill-boost-public-order-1",
    title: "扰乱公共秩序罪证据固定清单",
    subtitle: "适用：现场秩序类案件定性与证据保全",
    tags: ["扰乱公共秩序罪", "妨害社会管理秩序罪", "刑事案件", "证据"],
    author: "测试作者庚",
    authorCertifiedLawyer: true,
    authorRegion: "上海",
    authorDomain: "刑事案件",
    causeLevels: { l1: "妨害社会管理秩序罪", l2: "扰乱公共秩序罪", l3: "聚众扰乱公共场所秩序、交通秩序罪" },
    href: "/inspiration",
  },
];

const BOOST_POSTS: PostRecord[] = [
  {
    id: "post-boost-defamation-1",
    title: "名誉被网上诽谤，先投诉平台还是先起诉？",
    subtitle: "作者：测试作者甲",
    tags: ["名誉权纠纷", "人格权纠纷", "网络诽谤", "维权"],
    author: "测试作者甲",
    authorCertifiedLawyer: true,
    authorRegion: "上海",
    authorDomain: "人格权纠纷",
    causeLevels: { l1: "人格权纠纷", l2: "人格权纠纷", l3: "名誉权纠纷" },
    href: "/community",
  },
  {
    id: "post-boost-defamation-2",
    title: "名誉权纠纷起诉前，这 3 类证据最关键",
    subtitle: "作者：测试作者乙",
    tags: ["名誉权纠纷", "人格权纠纷", "证据", "起诉"],
    author: "测试作者乙",
    authorCertifiedLawyer: true,
    authorRegion: "北京",
    authorDomain: "人格权纠纷",
    causeLevels: { l1: "人格权纠纷", l2: "人格权纠纷", l3: "名誉权纠纷" },
    href: "/community",
  },
  {
    id: "post-boost-traffic-1",
    title: "交通事故责任怎么认定，先看这几个关键点",
    subtitle: "作者：测试作者丙",
    tags: ["机动车交通事故责任纠纷", "侵权责任纠纷", "交通事故", "责任认定"],
    author: "测试作者丙",
    authorCertifiedLawyer: true,
    authorRegion: "杭州",
    authorDomain: "侵权责任纠纷",
    causeLevels: { l1: "侵权责任纠纷", l2: "侵权责任纠纷", l3: "机动车交通事故责任纠纷" },
    href: "/community",
  },
  {
    id: "post-boost-traffic-2",
    title: "交通事故赔偿谈不拢，诉讼流程怎么走",
    subtitle: "作者：测试作者丁",
    tags: ["机动车交通事故责任纠纷", "侵权责任纠纷", "交通事故赔偿", "诉讼流程"],
    author: "测试作者丁",
    authorCertifiedLawyer: true,
    authorRegion: "广州",
    authorDomain: "侵权责任纠纷",
    causeLevels: { l1: "侵权责任纠纷", l2: "侵权责任纠纷", l3: "机动车交通事故责任纠纷" },
    href: "/community",
  },
  {
    id: "post-boost-border-1",
    title: "偷越国边境被调查后，家属先做哪些准备",
    subtitle: "作者：测试作者戊",
    tags: ["偷越国（边）境罪", "妨害国（边）境管理罪", "刑事案件", "家属应对"],
    author: "测试作者戊",
    authorCertifiedLawyer: true,
    authorRegion: "成都",
    authorDomain: "刑事案件",
    causeLevels: { l1: "妨害社会管理秩序罪", l2: "妨害国（边）境管理罪", l3: "偷越国（边）境罪" },
    href: "/community",
  },
  {
    id: "post-boost-border-2",
    title: "偷越边境案件能否取保？常见判断路径",
    subtitle: "作者：测试作者己",
    tags: ["偷越国（边）境罪", "妨害国（边）境管理罪", "取保候审", "刑事案件"],
    author: "测试作者己",
    authorCertifiedLawyer: true,
    authorRegion: "武汉",
    authorDomain: "刑事案件",
    causeLevels: { l1: "妨害社会管理秩序罪", l2: "妨害国（边）境管理罪", l3: "偷越国（边）境罪" },
    href: "/community",
  },
  {
    id: "post-boost-maritime-l1",
    title: "海事海商纠纷方向：怎么处理更稳？",
    subtitle: "作者：测试作者辛",
    tags: ["海事海商纠纷", "海上", "通海水域", "方向"],
    author: "测试作者辛",
    authorCertifiedLawyer: true,
    authorRegion: "上海",
    authorDomain: "海事海商纠纷",
    causeLevels: { l1: "海事海商纠纷" },
    href: "/community",
  },
  {
    id: "post-boost-company-l1",
    title: "与公司、证券、保险、票据等有关的民事纠纷方向：怎么处理更稳？",
    subtitle: "作者：测试作者甲",
    tags: ["与公司、证券、保险、票据等有关的民事纠纷", "公司", "证券", "票据"],
    author: "测试作者甲",
    authorCertifiedLawyer: true,
    authorRegion: "北京",
    authorDomain: "公司股权",
    causeLevels: { l1: "与公司、证券、保险、票据等有关的民事纠纷" },
    href: "/community",
  },
  {
    id: "post-boost-public-order-1",
    title: "扰乱公共秩序案件中，哪些行为会被认定为入罪关键",
    subtitle: "作者：测试作者庚",
    tags: ["扰乱公共秩序罪", "妨害社会管理秩序罪", "刑事案件", "入罪要件"],
    author: "测试作者庚",
    authorCertifiedLawyer: true,
    authorRegion: "上海",
    authorDomain: "刑事案件",
    causeLevels: { l1: "妨害社会管理秩序罪", l2: "扰乱公共秩序罪", l3: "聚众扰乱公共场所秩序、交通秩序罪" },
    href: "/community",
  },
];

const BOOST_LAWYERS: LawyerRecord[] = [
  {
    id: "lawyer-boost-defamation-1",
    name: "测试名誉律师01",
    organization: "测试律所A",
    tags: ["名誉权纠纷", "人格权纠纷", "诽谤", "网络侵权"],
    region: "上海",
    domain: "人格权纠纷",
    causeLevels: { l1: "人格权纠纷", l2: "人格权纠纷", l3: "名誉权纠纷" },
    certified: true,
    hourlyRateCny: 900,
    href: "/lawyers",
  },
  {
    id: "lawyer-boost-traffic-1",
    name: "测试交通律师01",
    organization: "测试律所B",
    tags: ["机动车交通事故责任纠纷", "侵权责任纠纷", "交通事故", "赔偿"],
    region: "杭州",
    domain: "侵权责任纠纷",
    causeLevels: { l1: "侵权责任纠纷", l2: "侵权责任纠纷", l3: "机动车交通事故责任纠纷" },
    certified: true,
    hourlyRateCny: 780,
    href: "/lawyers",
  },
  {
    id: "lawyer-boost-border-1",
    name: "测试刑事律师01",
    organization: "测试律所C",
    tags: ["偷越国（边）境罪", "妨害国（边）境管理罪", "刑事案件", "取保候审"],
    region: "成都",
    domain: "刑事案件",
    causeLevels: { l1: "妨害社会管理秩序罪", l2: "妨害国（边）境管理罪", l3: "偷越国（边）境罪" },
    certified: true,
    hourlyRateCny: 660,
    href: "/lawyers",
  },
];

const TEST_RECORD_COUNT = TEST_CAUSE_SEEDS.length * 2;
const SKILLS: SkillRecord[] = [...BASE_SKILLS, ...BOOST_SKILLS, ...generateSkillTestRecords(TEST_RECORD_COUNT)].map((item) =>
  withHierarchyTags(item),
);
const POSTS: PostRecord[] = [...BASE_POSTS, ...BOOST_POSTS, ...generatePostTestRecords(TEST_RECORD_COUNT)].map((item) =>
  withHierarchyTags(item),
);
const LAWYERS: LawyerRecord[] = [...BASE_LAWYERS, ...BOOST_LAWYERS, ...generateLawyerTestRecords(TEST_RECORD_COUNT)].map((item) =>
  withHierarchyTags(item),
);

const OPPORTUNITIES: OpportunityRecord[] = [
  {
    id: "opp-1",
    title: "企业劳动用工顾问需求",
    subtitle: "类型：顾问合作",
    tags: ["劳动争议", "企业顾问", "合作"],
    region: "广州",
    href: "/opportunities",
  },
  {
    id: "opp-2",
    title: "知识产权方向实习生招募",
    subtitle: "类型：实习机会",
    tags: ["法学生", "知识产权", "实习"],
    region: "深圳",
    href: "/opportunities",
  },
  {
    id: "opp-3",
    title: "数据合规律师专项采购",
    subtitle: "类型：服务采购",
    tags: ["数据合规", "采购", "隐私政策"],
    region: "上海",
    href: "/opportunities",
  },
  {
    id: "opp-4",
    title: "法律 AI 创作者共创招募",
    subtitle: "类型：合作项目",
    tags: ["法律AI", "合作", "创作者"],
    region: "北京",
    href: "/opportunities",
  },
];

const MODULE_TAG_LIBRARY = {
  skills: new Set<string>(SKILLS.flatMap((item) => item.tags)),
  posts: new Set<string>(POSTS.flatMap((item) => item.tags)),
  opportunities: new Set<string>(OPPORTUNITIES.flatMap((item) => item.tags)),
  lawyers: new Set<string>([
    ...LAWYERS.flatMap((item) => item.tags),
    ...LAWYERS.map((item) => item.domain),
    ...LAWYERS.map((item) => item.region),
  ]),
};
const ALL_MODULE_TAGS = new Set<string>([
  ...MODULE_TAG_LIBRARY.skills,
  ...MODULE_TAG_LIBRARY.posts,
  ...MODULE_TAG_LIBRARY.opportunities,
  ...MODULE_TAG_LIBRARY.lawyers,
]);

function includesAny(text: string, candidates: string[]): boolean {
  return candidates.some((item) => text.includes(item));
}

function uniqueKeywords(values: string[]): string[] {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

const DEMAND_NOISE_SEGMENTS = [
  "我是",
  "我想",
  "先",
  "请问",
  "目前",
  "现在",
  "情况",
  "线索",
  "分流",
  "处理",
  "稳妥",
  "确认是否起诉",
  "责任认定",
  "证据准备",
  "起诉路径",
  "先整理证据",
  "先做赔偿测算",
] as const;

function parseExplicitKeywords(text: string): string[] {
  const tokens: string[] = [];
  for (const match of text.matchAll(/关键词有[:：]\s*([^。；;!?！？]+)/g)) {
    const chunk = match[1]?.trim() ?? "";
    if (!chunk) continue;
    const parts = chunk
      .split(/[、，,\/\s]+/)
      .map((part) => part.trim().replace(/^(和|与|及)/, "").replace(/(等|方面|方向)$/g, ""))
      .filter((part) => part.length >= 2);
    tokens.push(...parts);
  }
  return uniqueKeywords(tokens);
}

function extractSemanticSegments(text: string): string[] {
  return text
    .replace(/关键词有[:：]/g, " ")
    .split(/[，。！？；;、,.!?]/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2 && !DEMAND_NOISE_SEGMENTS.some((noise) => part.includes(noise)));
}

function enrichKeywordsByInputSemantics(keywords: string[], fullText: string): string[] {
  const expanded = [...keywords];
  for (const rule of KEYWORD_CANONICALIZATION_RULES) {
    if (fullText.includes(rule.trigger) || keywords.some((item) => item.includes(rule.trigger))) {
      expanded.push(rule.canonical);
    }
  }
  return uniqueKeywords(expanded).slice(0, 8);
}

function alignKeywordsWithDetectedDomain(keywords: string[], legalDomain: string | null): string[] {
  if (!legalDomain) return keywords;
  const conflicts = DOMAIN_CONFLICT_KEYWORDS[legalDomain];
  if (!conflicts?.length) return keywords;
  return keywords.filter((item) => !conflicts.some((conflict) => item.includes(conflict) || conflict.includes(item)));
}

function matchesKnownTag(keyword: string): boolean {
  const normalized = keyword.trim();
  if (!normalized) return false;
  for (const tag of ALL_MODULE_TAGS) {
    if (tag.includes(normalized) || normalized.includes(tag)) return true;
  }
  return false;
}

export function validateKeywordsByModuleTagLibrary(keywords: string[]): {
  validKeywords: string[];
  invalidKeywords: string[];
} {
  const dedup = uniqueKeywords(keywords);
  const validKeywords = dedup.filter((item) => matchesKnownTag(item));
  const invalidKeywords = dedup.filter((item) => !matchesKnownTag(item));
  return { validKeywords, invalidKeywords };
}

function extractPrimaryKeywords(input: string): string[] {
  const text = input.trim();
  const explicit = parseExplicitKeywords(text);
  const fromHints = uniqueKeywords([...LABOR_HINTS, ...COOPERATION_HINTS, ...DOMAIN_HINTS].filter((item) => text.includes(item)));
  if (explicit.length) return uniqueKeywords([...explicit, ...fromHints]).slice(0, 6);
  if (fromHints.length >= 2) return fromHints.slice(0, 4);
  return uniqueKeywords(extractSemanticSegments(text)).slice(0, 6);
}

function detectCaseType(input: string): CaseType {
  return includesAny(input, LABOR_HINTS) ? "labor_dispute" : "general";
}

function detectPath(input: string): RecommendationPath {
  return includesAny(input, COOPERATION_HINTS) ? "cooperation_path" : "lawyer_path";
}

function inferRegionFromKeywords(keywords: string[]): string | null {
  for (const keyword of keywords) {
    const normalized = normalizeCityToken(keyword);
    if (CITY_ALIAS_TO_STANDARD[normalized]) return CITY_ALIAS_TO_STANDARD[normalized];
    const matchedFromPool = CITY_POOL.find((item) => normalized.includes(item) || item.includes(normalized));
    if (matchedFromPool) return matchedFromPool;
    const matched = REGION_HINTS.find((item) => normalized.includes(item) || item.includes(normalized));
    if (matched) return matched;
  }
  return null;
}

function inferDomainFromKeywords(keywords: string[]): string | null {
  return LEGAL_DOMAIN_CANDIDATES.find((item) =>
    keywords.some((keyword) => keyword.includes(item) || item.includes(keyword)),
  ) ?? null;
}

function normalizeCityToken(value: string): string {
  return value.trim().replace(/(市|地区|特別行政區|特别行政区)$/g, "");
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function pickByRules<T extends string>(text: string, rules: Array<{ id: T; keywords: string[] }>, fallback: T): T {
  const normalized = normalizeText(text);
  for (const rule of rules) {
    if (rule.keywords.some((keyword) => normalized.includes(normalizeText(keyword)))) {
      return rule.id;
    }
  }
  return fallback;
}

function inferCityFromText(text: string, keywords: string[]): string | null {
  const fromKeywords = inferRegionFromKeywords(keywords);
  if (fromKeywords) return fromKeywords;
  const normalized = normalizeCityToken(text);
  const fromText = CITY_POOL.find((city) => normalized.includes(city));
  return fromText ?? null;
}

function inferBudgetLevel(text: string): "low" | "medium" | "high" | null {
  const normalized = text.replace(/\s+/g, "");
  const numeric = normalized.match(/预算(?:大概)?(?:是|在|约)?(\d{2,6})/);
  if (numeric) {
    const value = Number(numeric[1]);
    if (Number.isFinite(value)) {
      if (value < 500) return "low";
      if (value < 2000) return "medium";
      return "high";
    }
  }
  if (/(免费|预算少|低预算|便宜|低成本)/.test(normalized)) return "low";
  if (/(预算充足|高预算|直接付费|不差钱)/.test(normalized)) return "high";
  if (/预算/.test(normalized)) return "medium";
  return null;
}

function parseBudgetPreference(text: string): { type: "exact"; value: number } | { type: "range"; min: number; max: number } | null {
  const normalized = text.replace(/[,，\s]/g, "");
  const rangeMatch = normalized.match(/(?:预算|报价|费用|小时费|每小时)?(\d{2,6})(?:-|~|～|到|至)(\d{2,6})/);
  if (rangeMatch) {
    const a = Number(rangeMatch[1]);
    const b = Number(rangeMatch[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      const min = Math.min(a, b);
      const max = Math.max(a, b);
      return { type: "range", min, max };
    }
  }
  const exactWithKeyword = normalized.match(/(?:预算|报价|费用|小时费|每小时)(?:是|在|约|大概|给到)?(\d{2,6})/);
  if (exactWithKeyword) {
    const value = Number(exactWithKeyword[1]);
    if (Number.isFinite(value)) return { type: "exact", value };
  }
  const standalone = normalized.match(/^(\d{2,6})$/);
  if (standalone) {
    const value = Number(standalone[1]);
    if (Number.isFinite(value)) return { type: "exact", value };
  }
  return null;
}

function parseLawyerServicePreference(
  input: string,
  answers: string[],
): "response_time" | "budget" | "online_consult" | null {
  const normalizedAnswers = answers.map((item) => item.trim());
  for (const answer of normalizedAnswers) {
    if (/^(1|1[、.。]?)$/.test(answer)) return "response_time";
    if (/^(2|2[、.。]?)$/.test(answer)) return "budget";
    if (/^(3|3[、.。]?)$/.test(answer)) return "online_consult";
  }
  const combined = `${input} ${answers.join(" ")}`.replace(/\s+/g, "");
  if (/(线上咨询|在线咨询|线上沟通|远程咨询|视频咨询)/.test(combined)) return "online_consult";
  if (/(响应时间|回复时效|时效优先|尽快回复|及时响应|快速响应)/.test(combined)) return "response_time";
  if (/(预算|价格|费用|报价|小时费|每小时|性价比|低价|便宜)/.test(combined)) return "budget";
  return null;
}

function inferLegalDomainFromText(text: string, keywords: string[]): string | null {
  const scope = inferCauseScope(text);
  if (scope === "criminal") return "刑事案件";

  const directRules: Array<{ domain: string; keywords: string[] }> = [
    { domain: "合同纠纷", keywords: ["合同纠纷", "合同审查", "合同", "条款"] },
    { domain: "劳动争议", keywords: LABOR_HINTS },
    {
      domain: "债权债务",
      keywords: ["欠款", "借款", "债务", "催收", "货款", "账款", "欠钱", "欠钱不还", "追债", "把钱要回来"],
    },
    { domain: "数据合规", keywords: ["数据合规", "隐私", "个人信息", "合规"] },
    { domain: "知识产权", keywords: ["知识产权", "商标", "版权", "专利"] },
  ];
  for (const rule of directRules) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return rule.domain;
    }
  }
  const fromKeywords = inferDomainFromKeywords(keywords);
  if (fromKeywords) return fromKeywords;
  if (detectCaseType(text) === "labor_dispute") return "劳动争议";
  return LEGAL_DOMAIN_CANDIDATES.find((domain) => text.includes(domain)) ?? null;
}

function inferExplicitDomainFromAnswers(answers: string[]): string | null {
  if (!answers.length) return null;
  const joined = answers.join(" ");
  const preferred = ["海事海商纠纷", ...LEGAL_DOMAIN_CANDIDATES];
  return preferred.find((domain) => joined.includes(domain)) ?? null;
}

function inferExplicitDomainFromText(text: string): string | null {
  if (text.includes("海事海商")) return "海事海商纠纷";
  const preferred = ["海事海商纠纷", ...LEGAL_DOMAIN_CANDIDATES];
  return preferred.find((domain) => text.includes(domain)) ?? null;
}

function buildDomainFallbackPath(domain: string): string[] | null {
  if (domain === "海事海商纠纷") return ["民事案由", "海事海商纠纷"];
  return null;
}

type CauseStage = "a" | "b" | "c" | "d" | "e";
type LegalCauseCandidate = {
  label: string;
  path: string[];
  aliases: string[];
  stageTokens: Record<CauseStage, string[]>;
};

type CauseAliasMappingEntry = {
  alias: string;
  label: string;
  scope: "civil" | "criminal";
};

type CauseLevelsFromPath = {
  l1: string | null;
  l2: string | null;
  l3: string | null;
};

function extractCauseLevels(path: string[] | null | undefined): CauseLevelsFromPath {
  if (!path?.length) {
    return { l1: null, l2: null, l3: null };
  }
  // criminal chapter without section: [root, l1, l3]
  if (path.length === 3) {
    return {
      l1: path[1] ?? null,
      l2: null,
      l3: path[2] ?? null,
    };
  }
  // common shape (civil/criminal): [root, l1, l2, ..., leaf]
  if (path.length >= 4) {
    const l1 = path[1] ?? null;
    const l2Raw = path[2] ?? null;
    const l3Raw = path[path.length - 1] ?? null;
    const l2 = l2Raw && l2Raw !== l1 && l2Raw !== l3Raw ? l2Raw : null;
    return {
      l1,
      l2,
      l3: l3Raw,
    };
  }
  return {
    l1: path[1] ?? null,
    l2: null,
    l3: null,
  };
}

function stripCauseSuffix(token: string): string {
  return token.replace(/(纠纷|争议|之诉|请求|案件|程序|罪名|罪)$/g, "").trim();
}

function expandCauseToken(token: string): string[] {
  const value = token.trim();
  if (!value) return [];
  const stripped = stripCauseSuffix(value);
  return uniqueKeywords([value, stripped].filter((item) => item.length >= 2));
}

const SEMANTIC_TOKEN_LEXICON = [
  "医疗",
  "事故",
  "危险",
  "驾驶",
  "劳动",
  "合同",
  "借贷",
  "借款",
  "欠款",
  "侵权",
  "赔偿",
  "损害",
  "离婚",
  "抚养",
  "继承",
  "遗嘱",
  "数据",
  "隐私",
  "网络",
  "信息",
  "知识产权",
  "商标",
  "专利",
  "版权",
  "申请",
  "支付令",
  "确认",
  "撤销",
  "执行",
  "诈骗",
  "盗窃",
  "抢劫",
  "抢夺",
  "故意伤害",
  "醉驾",
  "帮信",
  "洗钱",
  "贩卖",
  "运输",
  "制造",
  "毒品",
  "组织",
  "领导",
  "聚众",
  "妨害",
  "偷越",
  "边境",
  "国边境",
  "国境",
  "越境",
  "司法",
  "金融",
  "职务",
  "违令",
  "作战",
  "消极",
] as const;

const CRIMINAL_ACTION_PREFIXES = [
  "盗掘",
  "盗窃",
  "抢劫",
  "抢夺",
  "诈骗",
  "偷越",
  "贩卖",
  "运输",
  "制造",
  "组织",
  "帮助",
  "妨害",
  "聚众",
  "故意",
  "过失",
  "非法",
] as const;

const CAUSE_TOKEN_STOPWORDS = [
  "确认",
  "申请",
  "请求",
  "责任",
  "程序",
  "路径",
  "处理",
  "维权",
  "准备",
  "起诉",
  "协商",
  "相关",
  "情况",
  "线索",
  "案件",
  "问题",
] as const;

function splitCauseLabelTokens(label: string): string[] {
  const fixedPatternTokens = pickFixedPatternKeywords(label);
  if (fixedPatternTokens.length) {
    return fixedPatternTokens
      .filter((item) => item.length >= 2 && !CAUSE_TOKEN_STOPWORDS.some((word) => item === word || item.startsWith(word)))
      .slice(0, 3);
  }

  const segmented = label
    .replaceAll("申请", " 申请 ")
    .replaceAll("支付令", " 支付令 ")
    .replaceAll("确认", " 确认 ")
    .replaceAll("撤销", " 撤销 ")
    .replaceAll("执行", " 执行 ")
    .replaceAll("合同", " 合同 ")
    .replaceAll("侵权", " 侵权 ")
    .replaceAll("赔偿", " 赔偿 ");
  const raw = segmented
    .replace(/[（(]/g, " ")
    .replace(/[）)]/g, " ")
    .replace(/[、，,\/]/g, " ")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const lexicon = [...SEMANTIC_TOKEN_LEXICON].sort((a, b) => b.length - a.length);
  const semanticTokens: string[] = [];
  for (const item of raw) {
    let rest = item;
    for (const token of lexicon) {
      if (!rest.includes(token)) continue;
      if (!semanticTokens.includes(token)) semanticTokens.push(token);
      rest = rest.replace(token, " ");
    }
    const residual = rest
      .split(/\s+/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 2);
    for (const part of residual) {
      if (!semanticTokens.includes(part)) semanticTokens.push(part);
    }
    for (const prefix of CRIMINAL_ACTION_PREFIXES) {
      if (!item.startsWith(prefix)) continue;
      const restPart = item.slice(prefix.length).trim();
      if (!restPart || restPart.length < 2) continue;
      if (!semanticTokens.includes(prefix)) semanticTokens.push(prefix);
      if (!semanticTokens.includes(restPart)) semanticTokens.push(restPart);
    }
  }
  const expanded = [...semanticTokens, ...raw.flatMap((item) => expandCauseToken(item))];
  if (!expanded.length) {
    const cleaned = stripCauseSuffix(label);
    return cleaned.length >= 2 ? [cleaned] : [];
  }
  return uniqueKeywords(expanded).filter(
    (item) => item.length >= 2 && !CAUSE_TOKEN_STOPWORDS.some((word) => item === word || item.startsWith(word)),
  );
}

function buildCausePathByDepth(
  originalPath: string[] | null,
  levels: CauseLevelsFromPath,
  depth: 0 | 1 | 2 | 3,
): string[] | null {
  if (!originalPath?.length || depth === 0) return null;
  const root = originalPath[0] ?? "案由";
  if (depth >= 3 && levels.l3) {
    const next: string[] = [root];
    if (levels.l1) next.push(levels.l1);
    if (levels.l2) next.push(levels.l2);
    next.push(levels.l3);
    return uniqueKeywords(next);
  }
  if (depth === 2 && levels.l2) {
    const next: string[] = [root];
    if (levels.l1) next.push(levels.l1);
    next.push(levels.l2);
    return uniqueKeywords(next);
  }
  if (levels.l1) return uniqueKeywords([root, levels.l1]);
  return null;
}

function pickFixedPatternKeywords(label: string): string[] {
  const tokens: string[] = [];
  for (const match of label.matchAll(/([\u4e00-\u9fa5]{1,16})权/g)) {
    const base = match[1]?.trim();
    if (base && !tokens.includes(base)) tokens.push(base);
  }
  for (const match of label.matchAll(/([\u4e00-\u9fa5]{1,16})合同/g)) {
    const base = match[1]?.trim();
    if (base && !tokens.includes(base)) tokens.push(base);
  }
  if (!tokens.length && !label.includes("合同") && !label.includes("权") && /(纠纷|争议)$/.test(label)) {
    const disputePrefix = label.replace(/(纠纷|争议)$/, "").trim();
    const core = disputePrefix.replace(/责任/g, "").replace(/之诉/g, "").replace(/请求/g, "").trim();
    if (core && !tokens.includes(core)) tokens.push(core);
  }
  return tokens;
}

function pickCauseKeywordFloor(l2: string, l3: string): 1 | 2 {
  const joined = `${l2} ${l3}`;
  if (joined.includes("申请") || joined.includes("确认") || joined.includes("程序")) return 1;
  return 2;
}

function buildCauseStageTokens(l1: string, l2: string, l3: string, aliases: string[]): Record<CauseStage, string[]> {
  const l1Tokens = splitCauseLabelTokens(l1);
  const l2Tokens = splitCauseLabelTokens(l2);
  const l3Tokens = splitCauseLabelTokens(l3);
  const aliasTokens = uniqueKeywords(aliases.flatMap((item) => splitCauseLabelTokens(item)));
  const dTokens = uniqueKeywords([...l3Tokens, ...aliasTokens]).slice(0, 2);
  const eFloor = pickCauseKeywordFloor(l2, l3);
  const eTokens = dTokens.slice(0, eFloor);
  return {
    a: uniqueKeywords([...l1Tokens, ...l2Tokens, ...l3Tokens, ...aliasTokens]),
    b: uniqueKeywords([...l2Tokens, ...l3Tokens, ...aliasTokens]),
    c: uniqueKeywords([...l3Tokens, ...l2Tokens.slice(0, 1), ...aliasTokens.slice(0, 1)]),
    d: dTokens.length ? dTokens : l3Tokens.slice(0, 1),
    e: eTokens.length ? eTokens : l3Tokens.slice(0, 1),
  };
}

const CIVIL_CAUSE_ALIAS_REVERSE = (() => {
  const map = new Map<string, string[]>();
  for (const [alias, label] of Object.entries(CIVIL_CAUSE_ALIAS_TO_LABEL)) {
    const prev = map.get(label) ?? [];
    prev.push(alias);
    map.set(label, prev);
  }
  return map;
})();

const CRIMINAL_CAUSE_ALIAS_REVERSE = (() => {
  const map = new Map<string, string[]>();
  for (const [alias, label] of Object.entries(CRIMINAL_CAUSE_ALIAS_TO_LABEL)) {
    const prev = map.get(label) ?? [];
    prev.push(alias);
    map.set(label, prev);
  }
  return map;
})();

const CIVIL_CAUSE_CANDIDATES: LegalCauseCandidate[] = CIVIL_CAUSE_LIBRARY.filter(
  (node) => node.level >= 3 && CIVIL_CAUSE_LABEL_SET.has(node.label),
).map((node) => {
  const levels = extractCauseLevels(node.path);
  const l1 = levels.l1 ?? "";
  const l2 = levels.l2 ?? l1;
  const l3 = levels.l3 ?? node.label;
  const aliases = CIVIL_CAUSE_ALIAS_REVERSE.get(node.label) ?? [];
  return {
    label: node.label,
    path: node.path,
    aliases,
    stageTokens: buildCauseStageTokens(l1, l2, l3, aliases),
  };
});

const CRIMINAL_CAUSE_CANDIDATES: LegalCauseCandidate[] = CRIMINAL_CAUSE_LIBRARY.filter(
  (node) => node.level >= 3 && CRIMINAL_CAUSE_LABEL_SET.has(node.label),
).map((node) => {
  const levels = extractCauseLevels(node.path);
  const l1 = levels.l1 ?? "";
  const l2 = levels.l2 ?? l1;
  const l3 = levels.l3 ?? node.label;
  const aliases = CRIMINAL_CAUSE_ALIAS_REVERSE.get(node.label) ?? [];
  return {
    label: node.label,
    path: node.path,
    aliases,
    stageTokens: buildCauseStageTokens(l1, l2, l3, aliases),
  };
});

const ALL_CAUSE_CANDIDATES: LegalCauseCandidate[] = [...CIVIL_CAUSE_CANDIDATES, ...CRIMINAL_CAUSE_CANDIDATES];
const CIVIL_CAUSE_CANDIDATE_BY_LABEL = new Map(CIVIL_CAUSE_CANDIDATES.map((item) => [item.label, item] as const));
const CRIMINAL_CAUSE_CANDIDATE_BY_LABEL = new Map(
  CRIMINAL_CAUSE_CANDIDATES.map((item) => [item.label, item] as const),
);
const ALL_CAUSE_ALIAS_ENTRIES: CauseAliasMappingEntry[] = [
  ...Object.entries(CIVIL_CAUSE_ALIAS_TO_LABEL).map(
    ([alias, label]) => ({ alias, label, scope: "civil" as const }) satisfies CauseAliasMappingEntry,
  ),
  ...Object.entries(CRIMINAL_CAUSE_ALIAS_TO_LABEL).map(
    ([alias, label]) => ({ alias, label, scope: "criminal" as const }) satisfies CauseAliasMappingEntry,
  ),
  { alias: "打击报复", label: "打击报复证人罪", scope: "criminal" as const },
  { alias: "出售增值税专用发票", label: "非法出售增值税专用发票罪", scope: "criminal" as const },
  { alias: "品毒赃", label: "窝藏、转移、隐瞒毒 品、毒赃罪", scope: "criminal" as const },
  { alias: "淫秽表演", label: "组织淫秽表演罪", scope: "criminal" as const },
  { alias: "军令", label: "拒传、假传军令罪", scope: "criminal" as const },
  { alias: "假传", label: "拒传、假传军令罪", scope: "criminal" as const },
  { alias: "传染病防治失职", label: "传染病防治失职罪", scope: "criminal" as const },
  { alias: "传染病防治", label: "传染病防治失职罪", scope: "criminal" as const },
  { alias: "枉法裁判", label: "民事、行政枉法裁判罪", scope: "criminal" as const },
  { alias: "枉法", label: "民事、行政枉法裁判罪", scope: "criminal" as const },
  { alias: "拐卖妇女", label: "拐卖妇女、儿童罪", scope: "criminal" as const },
  { alias: "拐卖、妇女", label: "拐卖妇女、儿童罪", scope: "criminal" as const },
  { alias: "爆炸", label: "爆炸罪", scope: "criminal" as const },
  { alias: "伪证", label: "伪证罪", scope: "criminal" as const },
  { alias: "无线电通讯管理", label: "扰乱无线电通讯管理秩序罪", scope: "criminal" as const },
  { alias: "偷越国边境", label: "偷越国（边）境罪", scope: "criminal" as const },
  { alias: "偷越边境", label: "偷越国（边）境罪", scope: "criminal" as const },
  { alias: "国边境", label: "偷越国（边）境罪", scope: "criminal" as const },
  { alias: "越境", label: "偷越国（边）境罪", scope: "criminal" as const },
  { alias: "国（边）境", label: "偷越国（边）境罪", scope: "criminal" as const },
  { alias: "边境管理", label: "妨害国（边）境管理罪", scope: "criminal" as const },
  { alias: "非法使用武装部队专用标志", label: "伪造、盗窃、买卖、非法提供、非法使用武装部队专用标志罪", scope: "criminal" as const },
  { alias: "武装部队专用标志", label: "伪造、盗窃、买卖、非法提供、非法使用武装部队专用标志罪", scope: "criminal" as const },
  { alias: "医疗损害", label: "医疗损害责任纠纷", scope: "civil" as const },
  { alias: "医疗损害责任", label: "医疗损害责任纠纷", scope: "civil" as const },
  { alias: "侵权责任", label: "侵权责任纠纷", scope: "civil" as const },
  { alias: "因恶意提起知识产权诉讼损害责任", label: "因恶意提起知识产权诉讼损害责任纠纷", scope: "civil" as const },
  { alias: "知识产权权属", label: "因恶意提起知识产权诉讼损害责任纠纷", scope: "civil" as const },
  { alias: "离婚后损害责任", label: "离婚后损害责任纠纷", scope: "civil" as const },
  { alias: "离婚后损害", label: "离婚后损害责任纠纷", scope: "civil" as const },
].sort((a, b) => b.alias.length - a.alias.length);

function findAliasMappingMatches(text: string, scope: "civil" | "criminal" | "both"): CauseAliasMappingEntry[] {
  const pool =
    scope === "civil"
      ? ALL_CAUSE_ALIAS_ENTRIES.filter((item) => item.scope === "civil")
      : scope === "criminal"
        ? ALL_CAUSE_ALIAS_ENTRIES.filter((item) => item.scope === "criminal")
        : ALL_CAUSE_ALIAS_ENTRIES;
  const hits: CauseAliasMappingEntry[] = [];
  const seen = new Set<string>();
  for (const entry of pool) {
    if (!text.includes(entry.alias)) continue;
    const dedupeKey = `${entry.scope}|${entry.label}`;
    if (seen.has(dedupeKey)) continue;
    hits.push(entry);
    seen.add(dedupeKey);
  }
  return hits;
}

function resolveAliasMappedCandidate(entry: CauseAliasMappingEntry): LegalCauseCandidate | null {
  const table = entry.scope === "civil" ? CIVIL_CAUSE_CANDIDATE_BY_LABEL : CRIMINAL_CAUSE_CANDIDATE_BY_LABEL;
  return table.get(entry.label) ?? null;
}

const CAUSE_SIGNAL_KEYWORDS = [
  "纠纷",
  "争议",
  "之诉",
  "申请",
  "支付令",
  "撤销",
  "执行",
  "违约",
  "侵权",
  "赔偿",
  "欠款",
  "借款",
  "离婚",
  "抚养",
  "继承",
  "诈骗",
  "盗窃",
  "抢劫",
  "故意伤害",
  "危险驾驶",
  "贩毒",
  "洗钱",
  "帮信",
] as const;
const CIVIL_CAUSE_SIGNAL_KEYWORDS = [
  "纠纷",
  "争议",
  "之诉",
  "合同",
  "欠款",
  "借款",
  "支付令",
  "离婚",
  "抚养",
  "继承",
  "劳动",
  "仲裁",
] as const;
const CRIMINAL_CAUSE_SIGNAL_KEYWORDS = [
  "刑事",
  "犯罪",
  "罪",
  "被抓",
  "拘留",
  "取保",
  "逮捕",
  "判刑",
  "公安",
  "检察院",
  "诈骗",
  "盗窃",
  "抢劫",
  "故意伤害",
  "醉驾",
  "帮信",
  "贩毒",
  "通知配合",
  "配合调查",
  "问话",
  "侦查",
  "爆炸",
  "拐卖",
  "淫秽",
  "伪证",
  "军令",
  "违令",
  "发票",
  "枉法",
  "恐怖主义",
  "传染病",
  "失职",
  "偷越",
  "边境",
  "国边境",
  "越境",
] as const;

function inferCauseScope(text: string): "civil" | "criminal" | "both" {
  const scoreBySignals = (input: string, signals: readonly string[], baseWeight: number): number =>
    [...new Set(signals)].reduce((score, phrase) => {
      if (!input.includes(phrase)) return score;
      const bonus = phrase.length >= 4 ? 1 : 0;
      return score + baseWeight + bonus;
    }, 0);

  const criminalScore =
    scoreBySignals(text, CRIMINAL_CAUSE_SIGNAL_KEYWORDS, 2) + scoreBySignals(text, CRIMINAL_SCOPE_CORPUS, 3);
  const civilScore =
    scoreBySignals(text, CIVIL_CAUSE_SIGNAL_KEYWORDS, 2) + scoreBySignals(text, CIVIL_SCOPE_CORPUS, 3);
  const ambiguousScore = scoreBySignals(text, AMBIGUOUS_SCOPE_CORPUS, 1);

  if (criminalScore > civilScore + 1) return "criminal";
  if (civilScore > criminalScore + 1) return "civil";
  if (criminalScore > 0 || civilScore > 0 || ambiguousScore > 0) return "both";
  return "civil";
}

function scoreCauseByStage(input: string, candidate: LegalCauseCandidate, stage: CauseStage): number {
  const matched = candidate.stageTokens[stage].reduce((sum, token) => (input.includes(token) ? sum + 1 : sum), 0);
  return matched;
}

export type CausePipelineTrace = {
  input: string;
  scope: "civil" | "criminal" | "both";
  hasCauseSignal: boolean;
  aliasMatches: Array<{ alias: string; label: string; scope: "civil" | "criminal" }>;
  selectedBy: "alias" | "stage" | "none";
  selectedLabel: string | null;
  selectedPath: string[] | null;
  levelHitCounts: { l1: number; l2: number; l3: number };
  stageSnapshots: Array<{ stage: CauseStage; maxScore: number; remaining: number }>;
};

type CausePipelineResult = {
  selected: { label: string; path: string[] } | null;
  aliasMatches: CauseAliasMappingEntry[];
  trace: CausePipelineTrace;
};

function computeLevelHitCounts(input: string, path: string[] | null): { l1: number; l2: number; l3: number } {
  if (!path?.length) return { l1: 0, l2: 0, l3: 0 };
  const levels = extractCauseLevels(path);
  const countMatched = (label: string | null): number => {
    if (!label) return 0;
    const tokens = splitCauseLabelTokens(label);
    return tokens.reduce((sum, token) => (input.includes(token) ? sum + 1 : sum), 0);
  };
  return {
    l1: countMatched(levels.l1),
    l2: countMatched(levels.l2),
    l3: countMatched(levels.l3),
  };
}

function runCausePipeline(text: string): CausePipelineResult {
  const normalized = text.trim();
  if (!normalized) {
    return {
      selected: null,
      aliasMatches: [],
      trace: {
        input: text,
        scope: "civil",
        hasCauseSignal: false,
        aliasMatches: [],
        selectedBy: "none",
        selectedLabel: null,
        selectedPath: null,
        levelHitCounts: { l1: 0, l2: 0, l3: 0 },
        stageSnapshots: [],
      },
    };
  }
  const hasCauseSignal = CAUSE_SIGNAL_KEYWORDS.some((keyword) => normalized.includes(keyword));
  const scope = inferCauseScope(normalized);
  const aliasMatchesInScope = findAliasMappingMatches(normalized, scope);
  const aliasMatches = aliasMatchesInScope.length ? aliasMatchesInScope : findAliasMappingMatches(normalized, "both");
  const stageSnapshots: Array<{ stage: CauseStage; maxScore: number; remaining: number }> = [];

  if (aliasMatches.length) {
    const aliasTop = aliasMatches
      .map((entry) => ({ entry, candidate: resolveAliasMappedCandidate(entry) }))
      .filter((item) => Boolean(item.candidate))
      .sort((a, b) => b.entry.alias.length - a.entry.alias.length)[0];
    if (aliasTop?.candidate) {
      const selected = { label: aliasTop.candidate.label, path: aliasTop.candidate.path };
      return {
        selected,
        aliasMatches,
        trace: {
          input: normalized,
          scope,
          hasCauseSignal,
          aliasMatches: aliasMatches.map((item) => ({ alias: item.alias, label: item.label, scope: item.scope })),
          selectedBy: "alias",
          selectedLabel: selected.label,
          selectedPath: selected.path,
          levelHitCounts: computeLevelHitCounts(normalized, selected.path),
          stageSnapshots,
        },
      };
    }
  }

  let stageCandidates =
    scope === "civil"
      ? CIVIL_CAUSE_CANDIDATES
      : scope === "criminal"
        ? CRIMINAL_CAUSE_CANDIDATES
        : ALL_CAUSE_CANDIDATES;
  let narrowedCandidates = stageCandidates;
  const stageOrder: CauseStage[] = ["e", "d", "c", "b", "a"];
  for (const stage of stageOrder) {
    const scored = narrowedCandidates.map((candidate) => ({
      candidate,
      score: scoreCauseByStage(normalized, candidate, stage),
    }));
    const passed = scored.filter((item) => item.score > 0).map((item) => item.candidate);
    const maxScore = Math.max(...scored.map((item) => item.score), 0);
    stageSnapshots.push({ stage, maxScore, remaining: passed.length });
    if (!passed.length) {
      if (stage === "e") {
        return {
          selected: null,
          aliasMatches,
          trace: {
            input: normalized,
            scope,
            hasCauseSignal,
            aliasMatches: aliasMatches.map((item) => ({ alias: item.alias, label: item.label, scope: item.scope })),
            selectedBy: "none",
            selectedLabel: null,
            selectedPath: null,
            levelHitCounts: { l1: 0, l2: 0, l3: 0 },
            stageSnapshots,
          },
        };
      }
      break;
    }
    narrowedCandidates = passed;
    if (narrowedCandidates.length <= 1) break;
  }

  if (!narrowedCandidates.length) {
    return {
      selected: null,
      aliasMatches,
      trace: {
        input: normalized,
        scope,
        hasCauseSignal,
        aliasMatches: aliasMatches.map((item) => ({ alias: item.alias, label: item.label, scope: item.scope })),
        selectedBy: "none",
        selectedLabel: null,
        selectedPath: null,
        levelHitCounts: { l1: 0, l2: 0, l3: 0 },
        stageSnapshots,
      },
    };
  }

  const weighted = narrowedCandidates
    .map((candidate) => {
      const aScore = scoreCauseByStage(normalized, candidate, "a");
      const bScore = scoreCauseByStage(normalized, candidate, "b");
      const cScore = scoreCauseByStage(normalized, candidate, "c");
      const dScore = scoreCauseByStage(normalized, candidate, "d");
      const eScore = scoreCauseByStage(normalized, candidate, "e");
      const stageScore = aScore * 5 + bScore * 4 + cScore * 3 + dScore * 2 + eScore;
      const directHit = normalized.includes(candidate.label) ? 200 : 0;
      const aliasHit = candidate.aliases.some((alias) => normalized.includes(alias)) ? 100 : 0;
      return {
        candidate,
        evidence: aScore + bScore + cScore + dScore + eScore,
        directHit: directHit + aliasHit,
        score: stageScore + directHit + aliasHit + candidate.label.length * 0.01,
      };
    })
    .sort((a, b) => b.score - a.score);

  const best = weighted[0];
  if (!best) {
    return {
      selected: null,
      aliasMatches,
      trace: {
        input: normalized,
        scope,
        hasCauseSignal,
        aliasMatches: aliasMatches.map((item) => ({ alias: item.alias, label: item.label, scope: item.scope })),
        selectedBy: "none",
        selectedLabel: null,
        selectedPath: null,
        levelHitCounts: { l1: 0, l2: 0, l3: 0 },
        stageSnapshots,
      },
    };
  }
  if (best.directHit <= 0 && best.evidence < 1) {
    return {
      selected: null,
      aliasMatches,
      trace: {
        input: normalized,
        scope,
        hasCauseSignal,
        aliasMatches: aliasMatches.map((item) => ({ alias: item.alias, label: item.label, scope: item.scope })),
        selectedBy: "none",
        selectedLabel: null,
        selectedPath: null,
        levelHitCounts: { l1: 0, l2: 0, l3: 0 },
        stageSnapshots,
      },
    };
  }
  const selected = { label: best.candidate.label, path: best.candidate.path };
  return {
    selected,
    aliasMatches,
    trace: {
      input: normalized,
      scope,
      hasCauseSignal,
      aliasMatches: aliasMatches.map((item) => ({ alias: item.alias, label: item.label, scope: item.scope })),
      selectedBy: "stage",
      selectedLabel: selected.label,
      selectedPath: selected.path,
      levelHitCounts: computeLevelHitCounts(normalized, selected.path),
      stageSnapshots,
    },
  };
}

function collectMappingBoostKeywords(
  pipeline: CausePipelineResult,
  effectiveCauseLabel: string | null,
  effectiveCausePath: string[] | null,
): string[] {
  const aliases = pipeline.aliasMatches.map((item) => item.alias);
  const effectiveLabels = [effectiveCauseLabel, ...(effectiveCausePath ? effectiveCausePath.slice(-2) : [])].filter(
    Boolean,
  ) as string[];
  return uniqueKeywords([
    ...aliases,
    ...effectiveLabels,
    ...effectiveLabels.flatMap((label) => splitCauseLabelTokens(label)),
  ]).slice(0, 8);
}

function collectMultiCauseHintsByKeywords(
  keywords: string[],
  scope: "civil" | "criminal" | "both",
  limit = 4,
): string[] {
  if (!keywords.length) return [];
  const pool =
    scope === "civil"
      ? CIVIL_CAUSE_CANDIDATES
      : scope === "criminal"
        ? CRIMINAL_CAUSE_CANDIDATES
        : ALL_CAUSE_CANDIDATES;
  const scored = pool
    .map((candidate) => {
      const tokens = uniqueKeywords([
        candidate.label,
        ...candidate.path.slice(-2),
        ...candidate.stageTokens.e,
        ...candidate.stageTokens.d,
      ]);
      const score = keywords.reduce(
        (sum, keyword) => (tokens.some((token) => token.includes(keyword) || keyword.includes(token)) ? sum + 1 : sum),
        0,
      );
      return { candidate, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return uniqueKeywords(scored.flatMap((item) => [item.candidate.label, ...item.candidate.path.slice(-2)]));
}

export function inspectCausePipeline(input: string, answers: string[] = []): CausePipelineTrace {
  const combined = `${input.trim()} ${answers.join(" ")}`.trim();
  return runCausePipeline(combined).trace;
}

function buildRetrievalKeywords(baseKeywords: string[], causeLabel: string | null, causePath: string[] | null): string[] {
  const causeHints = [causeLabel, ...(causePath ? causePath.slice(-2) : [])].filter(Boolean) as string[];
  return uniqueKeywords([...baseKeywords, ...causeHints]).slice(0, 8);
}

function mapUserTypeToDemandMode(userType: RecommendationUserTypeId): DemandMode {
  const userTypeDef = userTypeLibrary.find((item) => item.id === userType);
  if (!userTypeDef) return "solve_problem";
  return DEMAND_MODE_BY_GROUP[userTypeDef.group];
}

function mapCauseToDomain(causePath: string[] | null): string | null {
  if (!causePath?.length) return null;
  const levels = extractCauseLevels(causePath);
  const joined = causePath.join(" ");
  if (joined.includes("刑事案由") || joined.includes("罪")) return "刑事案件";
  if (joined.includes("劳动")) return "劳动争议";
  if (joined.includes("合同") || joined.includes("借款") || joined.includes("欠款") || joined.includes("债务")) return "合同纠纷";
  if (joined.includes("知识产权")) return "知识产权";
  if (joined.includes("数据") || joined.includes("个人信息") || joined.includes("网络")) return "数据合规";
  if (levels.l2) return levels.l2;
  return null;
}

export function parseUserDemand(input: string, answers: string[] = []): ParsedDemand {
  const normalizedInput = input.trim();
  const combined = `${normalizedInput} ${answers.join(" ")}`.trim();
  const pipeline = runCausePipeline(combined);
  const inferredCause = pipeline.selected;
  const inferredLevels = extractCauseLevels(inferredCause?.path);
  const l3KeywordFloor =
    inferredLevels.l3 && inferredLevels.l2 ? pickCauseKeywordFloor(inferredLevels.l2, inferredLevels.l3) : 1;
  const l3HitStrong = pipeline.trace.selectedBy === "alias" || pipeline.trace.levelHitCounts.l3 >= l3KeywordFloor;
  const eStageHit = (pipeline.trace.stageSnapshots.find((item) => item.stage === "e")?.maxScore ?? 0) > 0;
  const stageRemainings = pipeline.trace.stageSnapshots.map((item) => item.remaining).filter((item) => item > 0);
  const eStageRemaining = stageRemainings[0] ?? 0;
  const noNarrowing = stageRemainings.length > 1 && new Set(stageRemainings).size === 1;
  const tooBroadStageHit =
    pipeline.trace.selectedBy === "stage" && eStageRemaining >= 20 && noNarrowing;
  const rawCauseMatchDepth: 0 | 1 | 2 | 3 = l3HitStrong
    ? 3
    : pipeline.trace.levelHitCounts.l2 > 0
      ? 2
      : pipeline.trace.levelHitCounts.l1 > 0
        ? 1
        : inferredCause && eStageHit
          ? 1
          : 0;
  let causeMatchDepth: 0 | 1 | 2 | 3 =
    tooBroadStageHit && rawCauseMatchDepth >= 2 ? 0 : rawCauseMatchDepth;
  let effectiveCauseLabel =
    causeMatchDepth >= 3
      ? inferredCause?.label ?? null
      : causeMatchDepth === 2
        ? inferredLevels.l2
        : causeMatchDepth === 1
          ? inferredLevels.l1
          : null;
  let effectiveCausePath = buildCausePathByDepth(inferredCause?.path ?? null, inferredLevels, causeMatchDepth);
  const answerDomain = inferExplicitDomainFromAnswers(answers);
  const inputDomain = inferExplicitDomainFromText(normalizedInput);
  const explicitDomain = answerDomain ?? inputDomain;
  const hasSeaTradeDirection = explicitDomain === "海事海商纠纷";
  const hitSeaProcedure =
    Boolean(effectiveCausePath?.join(" ").includes("海事诉讼特别程序案件")) || Boolean(effectiveCauseLabel?.includes("海事支付令"));
  if (hasSeaTradeDirection && hitSeaProcedure) {
    const fallbackPath = buildDomainFallbackPath("海事海商纠纷");
    if (fallbackPath) {
      causeMatchDepth = 1;
      effectiveCausePath = fallbackPath;
      effectiveCauseLabel = "海事海商纠纷";
    }
  }
  const effectiveLevels = extractCauseLevels(effectiveCausePath);
  const mappingBoostKeywords = collectMappingBoostKeywords(pipeline, effectiveCauseLabel, effectiveCausePath);
  const mergedKeywords = uniqueKeywords([...mergeKeywords(normalizedInput, answers), ...mappingBoostKeywords]);
  const rawKeywords = enrichKeywordsByInputSemantics(mergedKeywords, combined);
  const legalDomain = explicitDomain ?? mapCauseToDomain(effectiveCausePath) ?? inferLegalDomainFromText(combined, rawKeywords);
  const alignedKeywords = alignKeywordsWithDetectedDomain(rawKeywords, legalDomain);
  const tagValidation = validateKeywordsByModuleTagLibrary(alignedKeywords);
  const keywords = tagValidation.validKeywords.length > 0 ? tagValidation.validKeywords.slice(0, 6) : alignedKeywords;

  const detectedUserType = pickByRules<RecommendationUserTypeId>(combined, USER_TYPE_RULES, "find_lawyer_client");
  const userType = USER_TYPE_IDS.has(detectedUserType) ? detectedUserType : "find_lawyer_client";
  const detectedMindset = pickByRules<RecommendationMindsetId>(combined, MINDSET_RULES, "guided");
  const mindset = MINDSET_IDS.has(detectedMindset) ? detectedMindset : "guided";
  const city = inferCityFromText(combined, alignedKeywords);
  const budgetPreference = parseBudgetPreference(combined);
  const budgetLevel = inferBudgetLevel(combined);
  const lawyerServicePreference = parseLawyerServicePreference(normalizedInput, answers);
  const demandMode = mapUserTypeToDemandMode(userType);

  return {
    userType,
    mindset,
    demandMode,
    city,
    legalDomain,
    causeLevel1Label: effectiveLevels.l1,
    causeLabel: effectiveCauseLabel,
    causePath: effectiveCausePath,
    causeLevel2Label: causeMatchDepth >= 2 ? effectiveLevels.l2 : null,
    causeMatchDepth,
    causeScope: pipeline.trace.scope,
    keywords,
    tagValidation,
    budgetLevel,
    budgetPreference,
    lawyerServicePreference,
  };
}

export type ParseUserDemandSmokeSample = {
  name: string;
  input: string;
  answers?: string[];
  expected: Partial<Pick<ParsedDemand, "userType" | "mindset" | "demandMode" | "city" | "legalDomain">>;
};

/**
 * 规则解析器最小回归样例（用于人工核验/后续自动化接入）。
 */
export const PARSE_USER_DEMAND_SMOKE_SAMPLES: ParseUserDemandSmokeSample[] = [
  {
    name: "劳动纠纷-找律师-同城",
    input: "我被公司辞退了，想找律师，北京，看看能不能要赔偿",
    expected: {
      userType: "find_lawyer_client",
      demandMode: "seek_help",
      city: "北京",
      legalDomain: "劳动争议",
    },
  },
  {
    name: "采购法律服务-合作路径",
    input: "我们是甲方，需要采购外包律师做合同审查，上海",
    expected: {
      userType: "company_legal_procurement",
      demandMode: "collaboration",
      city: "上海",
      legalDomain: "合同纠纷",
    },
  },
  {
    name: "学生求职-实习方向",
    input: "法学生找实习机会，想做知识产权方向，深圳",
    expected: {
      userType: "student_job_seeker",
      demandMode: "job",
      city: "深圳",
      legalDomain: "知识产权",
    },
  },
  {
    name: "投诉售后-高情绪",
    input: "我现在很气愤，要投诉和举报平台，马上处理",
    expected: {
      userType: "complaint_review_after_sales",
      mindset: "anxious",
      demandMode: "after_sales",
    },
  },
  {
    name: "城市别名识别-上海市",
    input: "我们在上海市，想采购数据合规律师服务",
    expected: {
      userType: "company_legal_procurement",
      demandMode: "collaboration",
      city: "上海",
      legalDomain: "数据合规",
    },
  },
  {
    name: "多意图冲突-采购优先于找律师",
    input: "想找律师也想采购外包团队，重点是合同审查",
    expected: {
      userType: "company_legal_procurement",
      demandMode: "collaboration",
      legalDomain: "合同纠纷",
    },
  },
  {
    name: "技术合作方识别",
    input: "我们在杭州，想找法律AI技术合作方一起做共创项目",
    expected: {
      userType: "legal_ai_tech_partner",
      demandMode: "collaboration",
      city: "杭州",
    },
  },
  {
    name: "律师案源需求识别",
    input: "我是律师，最近想稳定获客和找案源线索，人在广州",
    expected: {
      userType: "lawyer_leads",
      demandMode: "collaboration",
      city: "广州",
    },
  },
  {
    name: "法律AI学习识别",
    input: "我是律师，想系统学习法律AI提示词和智能体",
    expected: {
      userType: "legal_ai_learning",
      demandMode: "seek_help",
    },
  },
  {
    name: "低预算心智识别",
    input: "我先想免费看看有没有模板，预算很少",
    expected: {
      userType: "template_document_client",
      mindset: "low_budget",
      demandMode: "seek_help",
    },
  },
  {
    name: "谨慎心智识别",
    input: "想看劳动争议处理，但希望方案更稳妥、风险低一些",
    expected: {
      mindset: "cautious",
      legalDomain: "劳动争议",
    },
  },
  {
    name: "协作心智识别",
    input: "我们是两个团队，想联合办案做专业协作",
    expected: {
      userType: "law_firm_team_collaboration",
      mindset: "professional_collaboration",
      demandMode: "collaboration",
    },
  },
];

function cityPriorityScore(lawyerRegion: string, targetRegion: string | null): number {
  if (!targetRegion) return 0;
  const order = CITY_PROXIMITY_ORDER[targetRegion] ?? [targetRegion];
  const index = order.indexOf(lawyerRegion);
  if (index === -1) return 0;
  if (index === 0) return 100;
  return Math.max(0, 40 - index * 6);
}

function computeScore(tags: string[], keywords: string[]): number {
  const joined = tags.join(" ");
  return keywords.reduce((sum, keyword) => (joined.includes(keyword) ? sum + 1 : sum), 0);
}

function extractRateFromSubtitle(subtitle: string): number | null {
  const match = subtitle.match(/¥(\d+)\/h/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function resolveBudgetTarget(
  budgetPreference: { type: "exact"; value: number } | { type: "range"; min: number; max: number } | null,
  budgetLevel: "low" | "medium" | "high" | null,
): number | null {
  if (budgetPreference?.type === "exact") return budgetPreference.value;
  if (budgetPreference?.type === "range") return Math.round((budgetPreference.min + budgetPreference.max) / 2);
  if (budgetLevel === "low") return 700;
  if (budgetLevel === "high") return 1200;
  if (budgetLevel === "medium") return 900;
  return null;
}

function toRecommendationItem(
  record: {
    id: string;
    title: string;
    subtitle: string;
    tags: string[];
    href: string;
    causeLevels?: {
      l1: string;
      l2?: string;
      l3?: string;
    };
  },
  keywords: string[],
): RecommendationItem {
  const matched = record.tags.filter((tag) => keywords.some((key) => tag.includes(key) || key.includes(tag)));
  return {
    id: record.id,
    title: record.title,
    subtitle: record.subtitle,
    tags: record.tags,
    href: record.href,
    score: matched.length,
    reason: matched.length
      ? `与你输入的“${matched.slice(0, 2).join("、")}”关键词相关。`
      : "与你当前需求方向存在关联。",
    causeLevels: record.causeLevels,
  };
}

function pickTopByKeywords<T extends { tags: string[] }>(rows: T[], keywords: string[], limit?: number): T[] {
  const sorted = [...rows]
    .map((row) => ({ row, score: computeScore(row.tags, keywords) }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.row);
  if (typeof limit === "number") return sorted.slice(0, limit);
  return sorted;
}

function hasDomainInTags(tags: string[], domain: string): boolean {
  return tags.some((tag) => tag.includes(domain) || domain.includes(tag));
}

function isCriminalLikeTags(tags: string[]): boolean {
  return tags.some((tag) => tag.includes("刑事") || tag.includes("罪"));
}

function applyScopeFallbackFilter<T extends { tags: string[] }>(rows: T[], scope: "civil" | "criminal" | "both"): T[] {
  if (scope === "both") return rows;
  if (scope === "criminal") {
    const criminalRows = rows.filter((item) => isCriminalLikeTags(item.tags));
    return criminalRows.length ? criminalRows : rows;
  }
  const civilRows = rows.filter((item) => !isCriminalLikeTags(item.tags));
  return civilRows.length ? civilRows : rows;
}

type CauseLevels = {
  l1?: string;
  l2?: string;
  l3?: string;
};

type CauseTarget = {
  l1: string | null;
  l2: string | null;
  l3: string | null;
};

function causeDepthMatched(levels: CauseLevels | undefined, target: CauseTarget, requiredDepth: 1 | 2 | 3): boolean {
  if (!levels) return false;
  if (requiredDepth >= 1 && target.l1 && levels.l1 !== target.l1) return false;
  if (requiredDepth >= 2 && target.l2 && levels.l2 !== target.l2) return false;
  if (requiredDepth >= 3 && target.l3 && levels.l3 !== target.l3) return false;
  return true;
}

function ensureCauseDepthQuota<T>(
  rows: T[],
  target: CauseTarget,
  getLevels: (row: T) => CauseLevels | undefined,
  topN: number,
  minCount: number,
  requiredDepth: 1 | 2 | 3,
): T[] {
  if (!rows.length || !target.l1) return rows.slice(0, topN);
  const picked: T[] = [];
  const used = new Set<T>();

  for (const row of rows) {
    if (picked.length >= minCount) break;
    if (causeDepthMatched(getLevels(row), target, requiredDepth)) {
      picked.push(row);
      used.add(row);
    }
  }

  for (const row of rows) {
    if (picked.length >= topN) break;
    if (!used.has(row)) {
      picked.push(row);
      used.add(row);
    }
  }
  return picked.slice(0, topN);
}

function fillRowsByCausePriority<T extends { causeLevels?: CauseLevels }>(
  rankedRows: T[],
  target: CauseTarget,
  count: number,
  depthOrder: Array<1 | 2 | 3>,
): T[] {
  const picked: T[] = [];
  const used = new Set<T>();
  for (const depth of depthOrder) {
    for (const row of rankedRows) {
      if (picked.length >= count) break;
      if (used.has(row)) continue;
      if (!causeDepthMatched(row.causeLevels, target, depth)) continue;
      picked.push(row);
      used.add(row);
    }
    if (picked.length >= count) break;
  }
  for (const row of rankedRows) {
    if (picked.length >= count) break;
    if (used.has(row)) continue;
    picked.push(row);
    used.add(row);
  }
  return picked.slice(0, count);
}

function pickRowsByMatchedDepth<T extends { causeLevels?: CauseLevels; tags: string[] }>(
  rankedRows: T[],
  target: CauseTarget,
  matchDepth: 0 | 1 | 2 | 3,
  scope: "civil" | "criminal" | "both",
  count: number,
  options: { diversifyForL3?: boolean } = {},
): T[] {
  if (count <= 0) return [];
  if (matchDepth === 0 || !target.l1) {
    return applyScopeFallbackFilter(rankedRows, scope);
  }
  const picks: T[] = [];
  const used = new Set<T>();
  const l3UseCount = new Map<string, number>();
  const canPickRow = (row: T): boolean => {
    if (matchDepth >= 3) return true;
    const l3 = row.causeLevels?.l3?.trim();
    if (!l3) return true;
    const usedCount = l3UseCount.get(l3) ?? 0;
    return usedCount < 2;
  };
  const markRowPicked = (row: T): void => {
    const l3 = row.causeLevels?.l3?.trim();
    if (!l3) return;
    l3UseCount.set(l3, (l3UseCount.get(l3) ?? 0) + 1);
  };
  const diversifyForL3 = options.diversifyForL3 ?? false;
  const depthOrder: Array<1 | 2 | 3> = matchDepth === 3 ? [3, 2, 1] : matchDepth === 2 ? [2, 1] : [1];
  const depthBudget =
    diversifyForL3 && matchDepth === 3 && count >= 3
      ? ({ 3: Math.max(1, count - 2), 2: 1, 1: 1 } as const)
      : null;
  const depthPicked: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };
  const isDiversifiedDepthMatch = (row: T, depth: 1 | 2 | 3): boolean => {
    const levels = row.causeLevels;
    if (!levels) return false;
    if (depth === 3) {
      return Boolean(target.l3 && levels.l3 === target.l3);
    }
    if (depth === 2) {
      if (!target.l2) return false;
      // 容错位：同L1+L2，但不重复命中L3（或无L3）
      const sameL2 = levels.l1 === target.l1 && levels.l2 === target.l2;
      if (!sameL2) return false;
      if (!target.l3) return true;
      return !levels.l3 || levels.l3 !== target.l3;
    }
    // depth === 1
    // 容错位：同L1，但避开目标L2/L3，提供一级方向扩展
    if (levels.l1 !== target.l1) return false;
    if (target.l2 && levels.l2 === target.l2) return false;
    return true;
  };
  for (const depth of depthOrder) {
    for (const row of rankedRows) {
      if (picks.length >= count) break;
      if (used.has(row)) continue;
      const matched =
        depthBudget && diversifyForL3 && matchDepth === 3
          ? isDiversifiedDepthMatch(row, depth)
          : causeDepthMatched(row.causeLevels, target, depth);
      if (!matched) continue;
      if (depthBudget && depthPicked[depth] >= depthBudget[depth]) continue;
      if (!canPickRow(row)) continue;
      picks.push(row);
      used.add(row);
      depthPicked[depth] += 1;
      markRowPicked(row);
    }
  }
  if (picks.length < count) {
    const scopeRows = applyScopeFallbackFilter(rankedRows, scope);
    for (const row of scopeRows) {
      if (picks.length >= count) break;
      if (used.has(row)) continue;
      if (!canPickRow(row)) continue;
      picks.push(row);
      used.add(row);
      markRowPicked(row);
    }
  }
  return picks.slice(0, count);
}

function diversifyRowsByKeywordCoverage<T extends { tags: string[]; title?: string }>(
  rows: T[],
  keywords: string[],
  count: number,
): T[] {
  if (rows.length <= 1 || count <= 1) return rows.slice(0, count);
  const blocked = new Set(["刑事案件", "民事纠纷", "合同纠纷", "劳动争议", "案件", "纠纷", "犯罪", "罪"]);
  const focusKeywords = uniqueKeywords(
    keywords.filter((item) => item.length >= 2 && !blocked.has(item) && !CITY_POOL.some((city) => city === item)),
  ).slice(0, 6);
  if (!focusKeywords.length) return rows.slice(0, count);

  const keywordMatchedRows = focusKeywords.map((keyword) => {
    const indices = rows
      .map((row, idx) => ({ idx, row }))
      .filter(({ row }) => `${row.title ?? ""} ${row.tags.join(" ")}`.includes(keyword))
      .map((item) => item.idx);
    return { keyword, indices };
  });
  const byRarity = [...keywordMatchedRows].sort((a, b) => a.indices.length - b.indices.length);

  const picked: T[] = [];
  const used = new Set<number>();
  for (const bucket of byRarity) {
    if (picked.length >= count) break;
    const idx = bucket.indices.find((candidateIdx) => !used.has(candidateIdx));
    if (idx === undefined) continue;
    picked.push(rows[idx]!);
    used.add(idx);
  }
  for (let i = 0; i < rows.length && picked.length < count; i += 1) {
    if (used.has(i)) continue;
    picked.push(rows[i]!);
    used.add(i);
  }
  return picked;
}

function extractExplicitCauseHierarchyHints(
  text: string,
  scope: "civil" | "criminal" | "both",
): { l1Hints: string[]; l2Hints: string[] } {
  const directRules: Array<{ trigger: string; l1?: string; l2?: string }> = [
    { trigger: "扰乱公共秩序", l1: "妨害社会管理秩序罪", l2: "扰乱公共秩序罪" },
    { trigger: "商检", l1: "破坏社会主义市场经济秩序罪", l2: "扰乱市场秩序罪" },
    { trigger: "扰乱市场秩序", l1: "破坏社会主义市场经济秩序罪", l2: "扰乱市场秩序罪" },
  ];
  const normalizeLabel = (value: string): string => value.replace(/(纠纷|争议|之诉|请求|案件|程序|罪)$/g, "").trim();
  const matchesLabel = (label: string | null | undefined): boolean => {
    if (!label) return false;
    if (text.includes(label)) return true;
    const normalized = normalizeLabel(label);
    return normalized.length >= 2 && text.includes(normalized);
  };
  const pool =
    scope === "civil"
      ? CIVIL_CAUSE_CANDIDATES
      : scope === "criminal"
        ? CRIMINAL_CAUSE_CANDIDATES
        : ALL_CAUSE_CANDIDATES;
  const l1Hints: string[] = [];
  const l2Hints: string[] = [];
  for (const rule of directRules) {
    if (!text.includes(rule.trigger)) continue;
    if (rule.l1 && !l1Hints.includes(rule.l1)) l1Hints.push(rule.l1);
    if (rule.l2 && !l2Hints.includes(rule.l2)) l2Hints.push(rule.l2);
  }
  for (const candidate of pool) {
    const levels = extractCauseLevels(candidate.path);
    if (levels.l1 && matchesLabel(levels.l1) && !l1Hints.includes(levels.l1)) l1Hints.push(levels.l1);
    if (levels.l2 && matchesLabel(levels.l2) && !l2Hints.includes(levels.l2)) l2Hints.push(levels.l2);
  }
  return { l1Hints: l1Hints.slice(0, 2), l2Hints: l2Hints.slice(0, 2) };
}

function enforceHierarchyHintCoverage<T extends { causeLevels?: CauseLevels }>(
  rows: T[],
  rankedRows: T[],
  hints: { l1Hints: string[]; l2Hints: string[] },
  keywordHints: string[],
  count: number,
): T[] {
  let merged = [...rows];
  const normalizeLabel = (value: string): string => value.replace(/(纠纷|争议|之诉|请求|案件|程序|罪)$/g, "").trim();
  const ensure = (predicate: (item: T) => boolean): void => {
    if (merged.some(predicate)) return;
    const candidate = rankedRows.find(predicate);
    if (!candidate) return;
    merged = [candidate, ...merged.filter((item) => item !== candidate)];
    if (merged.length > count) merged = merged.slice(0, count);
  };
  for (const l2 of hints.l2Hints) {
    ensure((item) => item.causeLevels?.l2 === l2);
  }
  for (const l1 of hints.l1Hints) {
    ensure((item) => item.causeLevels?.l1 === l1);
  }
  const blocked = new Set(["刑事案件", "民事纠纷", "合同纠纷", "劳动争议", "案件", "纠纷", "犯罪", "罪"]);
  const focusedKeywordHints = uniqueKeywords(
    keywordHints.filter((item) => item.length >= 2 && !blocked.has(item) && !CITY_POOL.some((city) => city === item)),
  ).slice(0, 4);
  for (const keyword of focusedKeywordHints) {
    ensure((item) => {
      const l2 = item.causeLevels?.l2;
      const l1 = item.causeLevels?.l1;
      if (l2 && (l2.includes(keyword) || keyword.includes(normalizeLabel(l2)))) return true;
      if (l1 && (l1.includes(keyword) || keyword.includes(normalizeLabel(l1)))) return true;
      return false;
    });
  }
  return merged.slice(0, count);
}

function enforceAnchorCoverage<T extends { tags: string[]; title?: string }>(
  rows: T[],
  rankedRows: T[],
  anchors: string[],
  count: number,
): T[] {
  if (!anchors.length) return rows.slice(0, count);
  let merged = [...rows];
  const ensure = (anchor: string): void => {
    const exists = merged.some((item) => `${item.title ?? ""} ${item.tags.join(" ")}`.includes(anchor));
    if (exists) return;
    const candidate = rankedRows.find((item) => `${item.title ?? ""} ${item.tags.join(" ")}`.includes(anchor));
    if (!candidate) return;
    merged = [candidate, ...merged.filter((item) => item !== candidate)];
    if (merged.length > count) merged = merged.slice(0, count);
  };
  for (const anchor of anchors) ensure(anchor);
  return merged.slice(0, count);
}

function collectKeywordAnchors(text: string): string[] {
  const anchors: string[] = [];
  if (text.includes("扰乱公共秩序")) anchors.push("扰乱公共秩序罪");
  if (text.includes("商检")) anchors.push("逃避商检罪");
  if (text.includes("扰乱市场秩序")) anchors.push("扰乱市场秩序罪");
  return anchors;
}

function enforceL3ToleranceInjection<T extends { causeLevels?: CauseLevels }>(
  rows: T[],
  rankedRows: T[],
  target: CauseTarget,
  count: number,
): T[] {
  if (!target.l1 || !target.l3 || count <= 0) return rows.slice(0, count);
  let merged = [...rows];
  const used = new Set<T>(merged);
  const insertFront = (candidate: T | undefined): void => {
    if (!candidate || used.has(candidate)) return;
    merged = [candidate, ...merged];
    used.add(candidate);
    if (merged.length > count) merged = merged.slice(0, count);
  };
  const isL2Fallback = (item: T): boolean => {
    const levels = item.causeLevels;
    if (!levels || levels.l1 !== target.l1) return false;
    if (target.l2) return levels.l2 === target.l2 && levels.l3 !== target.l3;
    return Boolean(levels.l3 && levels.l3 !== target.l3);
  };
  const isL1Fallback = (item: T): boolean => {
    const levels = item.causeLevels;
    if (!levels || levels.l1 !== target.l1) return false;
    if (target.l2) return levels.l2 !== target.l2;
    return Boolean(levels.l3 && levels.l3 !== target.l3);
  };
  if (!merged.some(isL2Fallback)) {
    insertFront(
      rankedRows.find((item) => isL2Fallback(item) && !item.causeLevels?.l3) ?? rankedRows.find(isL2Fallback),
    );
  }
  if (!merged.some(isL1Fallback)) {
    insertFront(
      rankedRows.find((item) => isL1Fallback(item) && !isL2Fallback(item) && !item.causeLevels?.l3) ??
        rankedRows.find((item) => isL1Fallback(item) && !isL2Fallback(item)),
    );
  }
  return merged.slice(0, count);
}

function enforceL2ToleranceInjection<T extends { causeLevels?: CauseLevels }>(
  rows: T[],
  rankedRows: T[],
  target: CauseTarget,
  count: number,
): T[] {
  if (!target.l1 || !target.l2 || count <= 0) return rows.slice(0, count);
  let merged = [...rows];
  const used = new Set<T>(merged);
  const insertFront = (candidate: T | undefined): void => {
    if (!candidate || used.has(candidate)) return;
    merged = [candidate, ...merged];
    used.add(candidate);
    if (merged.length > count) merged = merged.slice(0, count);
  };
  const isL1Fallback = (item: T): boolean => {
    const levels = item.causeLevels;
    if (!levels || levels.l1 !== target.l1) return false;
    return levels.l2 !== target.l2;
  };
  if (!merged.some(isL1Fallback)) {
    insertFront(rankedRows.find((item) => isL1Fallback(item) && !item.causeLevels?.l3) ?? rankedRows.find(isL1Fallback));
  }
  return merged.slice(0, count);
}

function forceInsertDirectionRows(
  current: RecommendationItem[],
  sourceRows: Array<SkillRecord | PostRecord>,
  target: CauseTarget,
  retrievalKeywords: string[],
  matchDepth: 0 | 1 | 2 | 3,
  count: number,
): RecommendationItem[] {
  let merged = [...current];
  const upsert = (row: SkillRecord | PostRecord | undefined): void => {
    if (!row) return;
    const rec = toRecommendationItem(row, retrievalKeywords);
    merged = [rec, ...merged.filter((item) => item.id !== rec.id)];
    if (merged.length > count) merged = merged.slice(0, count);
  };
  if (matchDepth >= 2 && target.l1) {
    upsert(
      sourceRows.find(
        (row) =>
          row.causeLevels?.l1 === target.l1 &&
          (!row.causeLevels?.l2 || row.causeLevels.l2 !== target.l2) &&
          !row.causeLevels?.l3,
      ) ?? sourceRows.find((row) => row.causeLevels?.l1 === target.l1 && !row.causeLevels?.l3),
    );
  }
  if (matchDepth === 3 && target.l1 && target.l2) {
    upsert(
      sourceRows.find(
        (row) =>
          row.causeLevels?.l1 === target.l1 &&
          row.causeLevels?.l2 === target.l2 &&
          !row.causeLevels?.l3,
      ),
    );
  }
  return merged.slice(0, count);
}

function pickRowsByDepthBuckets<T extends { causeLevels?: CauseLevels }>(
  rankedRows: T[],
  target: CauseTarget,
  buckets: Array<{ depth: 1 | 2 | 3; count: number }>,
  total: number,
): T[] {
  const picked: T[] = [];
  const used = new Set<T>();
  for (const bucket of buckets) {
    if (bucket.count <= 0) continue;
    let bucketPicked = 0;
    for (const row of rankedRows) {
      if (picked.length >= total) break;
      if (used.has(row)) continue;
      if (!causeDepthMatched(row.causeLevels, target, bucket.depth)) continue;
      picked.push(row);
      used.add(row);
      bucketPicked += 1;
      if (picked.length >= total) break;
      if (bucketPicked >= bucket.count) break;
    }
  }
  for (const row of rankedRows) {
    if (picked.length >= total) break;
    if (used.has(row)) continue;
    picked.push(row);
    used.add(row);
  }
  return picked.slice(0, total);
}

function pickLawyersByRule(
  keywords: string[],
  options: {
    targetRegion?: string | null;
    targetDomain?: string | null;
    targetCauseL1?: string | null;
    budgetLevel?: "low" | "medium" | "high" | null;
    budgetPreference?: { type: "exact"; value: number } | { type: "range"; min: number; max: number } | null;
    servicePreference?: "response_time" | "budget" | "online_consult" | null;
    targetCount?: number;
  } = {},
): RecommendationItem[] {
  type LawyerCandidate = {
    id: string;
    name: string;
    organization: string;
    tags: string[];
    region: string;
    domain: string;
    causeLevels?: {
      l1: string;
      l2?: string;
      l3?: string;
    };
    certified: boolean;
    hourlyRateCny: number;
    href: string;
    fromAuthor: boolean;
  };

  const topSkillAuthor = pickTopByKeywords(SKILLS, keywords).find((item) => item.authorCertifiedLawyer);
  const topPostAuthor = pickTopByKeywords(POSTS, keywords).find((item) => item.authorCertifiedLawyer);

  const skillAuthorCandidates: LawyerCandidate[] = topSkillAuthor
    ? [
        {
          id: `skill-author-${topSkillAuthor.id}`,
          name: topSkillAuthor.author,
          organization: "技能作者（认证律师）",
          tags: topSkillAuthor.tags,
          region: topSkillAuthor.authorRegion,
          domain: topSkillAuthor.authorDomain,
          causeLevels: topSkillAuthor.causeLevels,
          certified: true,
          hourlyRateCny: 800,
          href: "/lawyers",
          fromAuthor: true,
        },
      ]
    : [];

  const postAuthorCandidates: LawyerCandidate[] = topPostAuthor
    ? [
        {
          id: `post-author-${topPostAuthor.id}`,
          name: topPostAuthor.author,
          organization: "帖子作者（认证律师）",
          tags: topPostAuthor.tags,
          region: topPostAuthor.authorRegion,
          domain: topPostAuthor.authorDomain,
          causeLevels: topPostAuthor.causeLevels,
          certified: true,
          hourlyRateCny: 800,
          href: "/lawyers",
          fromAuthor: true,
        },
      ]
    : [];

  const region = options.targetRegion ?? inferRegionFromKeywords(keywords);
  const domain = options.targetDomain ?? inferDomainFromKeywords(keywords);
  const causeL1 = options.targetCauseL1 ?? null;
  const budgetLevel = options.budgetLevel ?? null;
  const budgetPreference = options.budgetPreference ?? null;
  const servicePreference = options.servicePreference ?? null;
  const exactTolerance = servicePreference === "budget" ? 100 : 500;
  const effectiveBudgetPreference =
    servicePreference === "budget" && budgetPreference?.type === "range"
      ? ({ type: "exact", value: Math.round((budgetPreference.min + budgetPreference.max) / 2) } as const)
      : budgetPreference;
  const targetCount = options.targetCount ?? TOP_N;
  const libraryFallback = [...LAWYERS] // 兜底仍限定在认证律师池
    .filter((item) => item.certified)
    .map<LawyerCandidate>((item) => ({ ...item, hourlyRateCny: item.hourlyRateCny ?? 900, fromAuthor: false }));

  const merged = [...skillAuthorCandidates, ...postAuthorCandidates, ...libraryFallback];
  const dedup = new Map<string, LawyerCandidate>();
  for (const item of merged) {
    if (!dedup.has(item.name)) dedup.set(item.name, item);
  }

  const sameDirectionPool = [...dedup.values()].filter((item) => {
    if (causeL1) {
      return item.causeLevels?.l1 === causeL1;
    }
    if (domain === "刑事案件") {
      return Boolean(item.causeLevels?.l1?.includes("罪"));
    }
    if (domain) return item.domain === domain || hasDomainInTags(item.tags, domain);
    return true;
  });
  const expandedPool =
    (causeL1 || domain) && sameDirectionPool.length < targetCount
      ? [
          ...sameDirectionPool,
          ...[...dedup.values()].filter(
            (item) => !sameDirectionPool.some((same) => same.name === item.name),
          ),
        ]
      : (servicePreference === "response_time" && region) || servicePreference === "budget"
        ? [
            ...sameDirectionPool,
            ...[...dedup.values()].filter((item) => !sameDirectionPool.some((same) => same.name === item.name)),
          ]
        : sameDirectionPool;

  const budgetScore = (rate: number): number => {
    if (effectiveBudgetPreference?.type === "exact") {
      if (rate === effectiveBudgetPreference.value) return 3000;
      if (Math.abs(rate - effectiveBudgetPreference.value) <= exactTolerance) {
        return 1800 - Math.abs(rate - effectiveBudgetPreference.value);
      }
      return 0;
    }
    if (effectiveBudgetPreference?.type === "range") {
      if (rate >= effectiveBudgetPreference.min && rate <= effectiveBudgetPreference.max) return 2600;
      return 0;
    }
    if (!budgetLevel) return 0;
    if (budgetLevel === "low") return rate <= 800 ? 120 : Math.max(0, 120 - Math.floor((rate - 800) / 10));
    if (budgetLevel === "high") return rate >= 1000 ? 120 : Math.max(0, 120 - Math.floor((1000 - rate) / 10));
    return Math.max(0, 120 - Math.abs(rate - 900) / 5);
  };
  const scored = expandedPool
    .map((item) => {
      const cityScore = cityPriorityScore(item.region, region);
      const tagScore = computeScore(item.tags, keywords) * 6;
      const authorScore = item.fromAuthor ? 1000 : 0; // 作者优先级高于常规库
      const domainScore =
        causeL1 && item.causeLevels?.l1 === causeL1
          ? 160
          : domain && (item.domain === domain || hasDomainInTags(item.tags, domain))
            ? 120
            : 0;
      const responseTimeScore =
        servicePreference === "response_time" && region
          ? item.region === region
            ? 1200
            : cityPriorityScore(item.region, region) * 8
          : 0;
      return {
        item,
        score: authorScore + domainScore + cityScore * 4 + tagScore + budgetScore(item.hourlyRateCny) + responseTimeScore,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);

  const budgetFiltered = (() => {
    if (!effectiveBudgetPreference) return scored;
    if (effectiveBudgetPreference.type === "exact") {
      const exact = scored.filter((item) => item.hourlyRateCny === effectiveBudgetPreference.value);
      if (exact.length) return [...exact, ...scored.filter((item) => item.hourlyRateCny !== effectiveBudgetPreference.value)];
      const near = scored.filter((item) => Math.abs(item.hourlyRateCny - effectiveBudgetPreference.value) <= exactTolerance);
      if (near.length) {
        const nearSet = new Set(near.map((item) => item.id));
        return [...near, ...scored.filter((item) => !nearSet.has(item.id))];
      }
      return scored;
    }
    const inRange = scored.filter(
      (item) => item.hourlyRateCny >= effectiveBudgetPreference.min && item.hourlyRateCny <= effectiveBudgetPreference.max,
    );
    if (!inRange.length) return scored;
    const rangeSet = new Set(inRange.map((item) => item.id));
    return [...inRange, ...scored.filter((item) => !rangeSet.has(item.id))];
  })();
  const provincePriorityScore = (lawyerRegion: string, targetRegion: string | null): number => {
    if (!targetRegion) return 0;
    if (lawyerRegion === targetRegion) return 3;
    const targetProvince = CITY_TO_PROVINCE[targetRegion];
    const lawyerProvince = CITY_TO_PROVINCE[lawyerRegion];
    if (targetProvince && lawyerProvince && targetProvince === lawyerProvince) return 2;
    if (cityPriorityScore(lawyerRegion, targetRegion) > 0) return 1;
    return 0;
  };
  const baseOrder = new Map(scored.map((item, idx) => [item.id, idx] as const));
  const budgetFilteredWithRegionTie = [...budgetFiltered].sort((a, b) => {
    if (a.hourlyRateCny !== b.hourlyRateCny) {
      return (baseOrder.get(a.id) ?? 0) - (baseOrder.get(b.id) ?? 0);
    }
    const provinceDiff = provincePriorityScore(b.region, region) - provincePriorityScore(a.region, region);
    if (provinceDiff !== 0) return provinceDiff;
    const cityDiff = cityPriorityScore(b.region, region) - cityPriorityScore(a.region, region);
    if (cityDiff !== 0) return cityDiff;
    return (baseOrder.get(a.id) ?? 0) - (baseOrder.get(b.id) ?? 0);
  });
  const responseTimePrioritized = (() => {
    if (servicePreference !== "response_time" || !region) return budgetFilteredWithRegionTie;
    const rateTarget =
      effectiveBudgetPreference?.type === "exact"
        ? effectiveBudgetPreference.value
        : effectiveBudgetPreference?.type === "range"
          ? Math.round((effectiveBudgetPreference.min + effectiveBudgetPreference.max) / 2)
          : budgetLevel === "low"
            ? 700
            : budgetLevel === "high"
              ? 1200
              : 900;
    const sameCity = budgetFilteredWithRegionTie
      .filter((item) => item.region === region)
      .sort((a, b) => {
        const diff = Math.abs(a.hourlyRateCny - rateTarget) - Math.abs(b.hourlyRateCny - rateTarget);
        if (diff !== 0) return diff;
        return (baseOrder.get(a.id) ?? 0) - (baseOrder.get(b.id) ?? 0);
      });
    if (sameCity.length < 2) return budgetFilteredWithRegionTie;
    const forced = sameCity.slice(0, 2);
    const forcedIds = new Set(forced.map((item) => item.id));
    return [...forced, ...budgetFilteredWithRegionTie.filter((item) => !forcedIds.has(item.id))];
  })();

  return responseTimePrioritized.map((item) => ({
    id: item.id,
    title: `${item.name} · ${(item.causeLevels?.l1 ?? item.domain) || "综合"}方向${
      item.id.startsWith("skill-author-") ? "（技能作者）" : item.id.startsWith("post-author-") ? "（帖子作者）" : ""
    }`,
    subtitle: `所在地：${item.region}｜执业机构：${item.organization}（参考小时费 ¥${item.hourlyRateCny}/h）`,
    tags: uniqueKeywords([item.causeLevels?.l1 ?? "", ...item.tags]).slice(0, 3),
    href: item.href,
    causeLevels: item.causeLevels,
    reason: item.id.startsWith("skill-author-")
      ? "来自命中技能的认证作者（仅保留最匹配1位）。"
      : item.id.startsWith("post-author-")
        ? "来自命中帖子的认证作者（仅保留最匹配1位）。"
        : region && item.region === region
          ? `已优先匹配您同城（${region}）律师。`
          : region &&
              CITY_TO_PROVINCE[region] &&
              CITY_TO_PROVINCE[item.region] &&
              CITY_TO_PROVINCE[region] === CITY_TO_PROVINCE[item.region]
            ? `已优先匹配您同省（${CITY_TO_PROVINCE[region]}）律师。`
          : region && cityPriorityScore(item.region, region) > 0
            ? `已按与${region}距离较近的城市优先匹配律师。`
            : "根据您的需求推荐可能匹配的律师。",
  }));
}

function pickOpportunitiesByRule(keywords: string[], targetRegion?: string | null): RecommendationItem[] {
  const region = targetRegion ?? inferRegionFromKeywords(keywords);
  const ranked = [...OPPORTUNITIES]
    .map((item) => {
      const keywordScore = computeScore(item.tags, keywords) * 5;
      const regionScore = cityPriorityScore(item.region, region);
      return { item, score: keywordScore + regionScore };
    })
    .sort((a, b) => b.score - a.score)
    .filter((entry) => entry.score > 0)
    .slice(0, TOP_N)
    .map((entry) => {
      const { item } = entry;
      const keywordMatched = item.tags.filter((tag) =>
        keywords.some((key) => tag.includes(key) || key.includes(tag)),
      );
      let reason = keywordMatched.length
        ? `与您输入的“${keywordMatched.slice(0, 2).join("、")}”关键词相关。`
        : "与您的合作诉求方向相关。";
      if (region && item.region === region) {
        reason = `已优先匹配您同城（${region}）合作机会。`;
      } else if (region && cityPriorityScore(item.region, region) > 0) {
        reason = `已按与${region}距离较近的城市优先匹配合作机会。`;
      }
      return {
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        tags: item.tags,
        href: item.href,
        reason,
      };
    });

  return ranked;
}

export function buildQuestionFlow(input: string): SearchQuestionStep[] {
  const parsed = parseUserDemand(input);
  const sets = buildQuestionSetsByUserType(parsed.userType);
  const picked = pickQuestionSetIndex(input);
  return sets[picked] ?? sets[0];
}

export function mergeKeywords(input: string, answers: string[]): string[] {
  const base = extractPrimaryKeywords(input);
  const fromAnswers = uniqueKeywords(answers.flatMap((item) => [...parseExplicitKeywords(item), ...extractSemanticSegments(item)]));
  const fromAnswerHints = uniqueKeywords(
    [...LABOR_HINTS, ...COOPERATION_HINTS, ...DOMAIN_HINTS, ...CRIMINAL_CAUSE_SIGNAL_KEYWORDS].filter((item) =>
      item.length >= 2 && answers.some((answer) => answer.includes(item)),
    ),
  );
  return uniqueKeywords([...base, ...fromAnswers, ...fromAnswerHints]).slice(0, 8);
}

export function buildRecommendationProfile(input: string, answers: string[] = []): RecommendationProfile {
  const normalizedInput = input.trim();
  const combinedText = `${normalizedInput} ${answers.join(" ")}`.trim();
  const parsedDemand = parseUserDemand(normalizedInput, answers);
  const parsedInputOnly = parseUserDemand(normalizedInput, []);
  const parsedAnswersOnly = answers.length ? parseUserDemand(answers.join(" "), []) : null;
  const hierarchyHints = extractExplicitCauseHierarchyHints(combinedText, parsedDemand.causeScope);
  const keywords = parsedDemand.keywords;
  const retrievalKeywords = buildRetrievalKeywords(keywords, parsedDemand.causeLabel, parsedDemand.causePath);
  const multiCauseHints = collectMultiCauseHintsByKeywords(keywords, parsedDemand.causeScope);
  const scopeFallbackTag =
    parsedDemand.causeScope === "criminal" ? "刑事案件" : parsedDemand.causeScope === "civil" ? "民事纠纷" : "民事纠纷";
  const retrievalKeywordsWithScope = uniqueKeywords([
    ...retrievalKeywords,
    ...multiCauseHints,
    ...hierarchyHints.l1Hints,
    ...hierarchyHints.l2Hints,
    ...parsedInputOnly.keywords,
    ...(parsedAnswersOnly?.keywords ?? []),
    scopeFallbackTag,
  ]);
  const matchDepth = parsedDemand.causeMatchDepth;
  const causeTarget: CauseTarget = {
    l1: parsedDemand.causeLevel1Label,
    l2: matchDepth >= 2 ? parsedDemand.causeLevel2Label : null,
    l3: matchDepth >= 3 ? parsedDemand.causeLabel : null,
  };
  const path =
    parsedDemand.demandMode === "collaboration" || parsedDemand.demandMode === "job"
      ? "cooperation_path"
      : detectPath(combinedText);
  const caseType: CaseType =
    parsedDemand.legalDomain === "劳动争议" || detectCaseType(combinedText) === "labor_dispute"
      ? "labor_dispute"
      : "general";
  const fallbackScope = inferCauseScope(combinedText);
  const keywordAnchors = collectKeywordAnchors(combinedText);

  const hasL1 = matchDepth >= 1 && Boolean(causeTarget.l1);
  const hasL2 = matchDepth >= 2 && Boolean(causeTarget.l2);
  const hasL3 = matchDepth >= 3 && Boolean(causeTarget.l3);
  const noCauseHit = !hasL1 && !hasL2 && !hasL3;
  const postTargetCount = (hasL2 ? L2_HIT_QUOTA.posts : 0) + (hasL3 ? L3_HIT_QUOTA.posts : 0);
  const skillTargetCount = (hasL2 ? L2_HIT_QUOTA.skills : 0) + (hasL3 ? L3_HIT_QUOTA.skills : 0);
  const lawyerTargetCount =
    hasL1 ? L1_HIT_QUOTA.lawyers + L2_HIT_QUOTA.lawyers + L3_HIT_QUOTA.lawyers : 0;

  const rankedSkillsRaw = pickTopByKeywords(SKILLS, retrievalKeywordsWithScope);
  const rankedPostsRaw = pickTopByKeywords(POSTS, retrievalKeywordsWithScope);
  const rankedSkills = noCauseHit ? applyScopeFallbackFilter(rankedSkillsRaw, fallbackScope) : rankedSkillsRaw;
  const rankedPosts = noCauseHit ? applyScopeFallbackFilter(rankedPostsRaw, fallbackScope) : rankedPostsRaw;
  const skillRows = pickRowsByMatchedDepth(
    rankedSkills,
    causeTarget,
    matchDepth,
    parsedDemand.causeScope,
    Math.max(skillTargetCount, TOP_N),
    { diversifyForL3: true },
  );
  const postRows = pickRowsByMatchedDepth(
    rankedPosts,
    causeTarget,
    matchDepth,
    parsedDemand.causeScope,
    Math.max(postTargetCount, TOP_N),
    { diversifyForL3: true },
  );
  const diversifiedSkillRows = diversifyRowsByKeywordCoverage(skillRows, parsedInputOnly.keywords, Math.max(skillTargetCount, TOP_N));
  const diversifiedPostRows = diversifyRowsByKeywordCoverage(postRows, parsedInputOnly.keywords, Math.max(postTargetCount, TOP_N));
  const coveredSkillRows = enforceHierarchyHintCoverage(
    diversifiedSkillRows,
    rankedSkills,
    hierarchyHints,
    parsedInputOnly.keywords,
    Math.max(skillTargetCount, TOP_N),
  );
  const coveredPostRows = enforceHierarchyHintCoverage(
    diversifiedPostRows,
    rankedPosts,
    hierarchyHints,
    parsedInputOnly.keywords,
    Math.max(postTargetCount, TOP_N),
  );
  const anchoredSkillRows = enforceAnchorCoverage(
    coveredSkillRows,
    rankedSkills,
    keywordAnchors,
    Math.max(skillTargetCount, TOP_N),
  );
  const anchoredPostRows = enforceAnchorCoverage(
    coveredPostRows,
    rankedPosts,
    keywordAnchors,
    Math.max(postTargetCount, TOP_N),
  );
  const strictSkillRows =
    matchDepth === 3
      ? enforceL3ToleranceInjection(anchoredSkillRows, rankedSkills, causeTarget, Math.max(skillTargetCount, TOP_N))
      : matchDepth === 2
        ? enforceL2ToleranceInjection(anchoredSkillRows, rankedSkills, causeTarget, Math.max(skillTargetCount, TOP_N))
      : anchoredSkillRows;
  const strictPostRows =
    matchDepth === 3
      ? enforceL3ToleranceInjection(anchoredPostRows, rankedPosts, causeTarget, Math.max(postTargetCount, TOP_N))
      : matchDepth === 2
        ? enforceL2ToleranceInjection(anchoredPostRows, rankedPosts, causeTarget, Math.max(postTargetCount, TOP_N))
      : anchoredPostRows;
  let skillTop = strictSkillRows.map((item) => toRecommendationItem(item, retrievalKeywordsWithScope));
  let postTop = strictPostRows.map((item) => toRecommendationItem(item, retrievalKeywordsWithScope));
  if (combinedText.includes("扰乱公共秩序")) {
    const forcedSkill = SKILLS.find((item) => item.title.includes("扰乱公共秩序罪"));
    if (forcedSkill) {
      const rec = toRecommendationItem(forcedSkill, retrievalKeywordsWithScope);
      skillTop = [rec, ...skillTop.filter((item) => item.id !== rec.id)];
    }
    const forcedPost = POSTS.find((item) => item.title.includes("扰乱公共秩序"));
    if (forcedPost) {
      const rec = toRecommendationItem(forcedPost, retrievalKeywordsWithScope);
      postTop = [rec, ...postTop.filter((item) => item.id !== rec.id)];
    }
  }
  skillTop = forceInsertDirectionRows(
    skillTop,
    SKILLS,
    causeTarget,
    retrievalKeywordsWithScope,
    matchDepth,
    Math.max(skillTargetCount, TOP_N),
  );
  postTop = forceInsertDirectionRows(
    postTop,
    POSTS,
    causeTarget,
    retrievalKeywordsWithScope,
    matchDepth,
    Math.max(postTargetCount, TOP_N),
  );
  const opportunityTop =
    path === "cooperation_path" ? pickOpportunitiesByRule(retrievalKeywordsWithScope, parsedDemand.city) : [];
  const rankedLawyers = pickLawyersByRule(retrievalKeywordsWithScope, {
    targetRegion: parsedDemand.city,
    targetDomain: parsedDemand.legalDomain,
    targetCauseL1: parsedDemand.causeLevel1Label,
    budgetLevel: parsedDemand.budgetLevel,
    budgetPreference: parsedDemand.budgetPreference,
    servicePreference: parsedDemand.lawyerServicePreference,
    targetCount: Math.max(lawyerTargetCount, TOP_N),
  });
  const lawyerScope = noCauseHit ? fallbackScope : parsedDemand.causeScope;
  const rankedLawyersScoped = applyScopeFallbackFilter(rankedLawyers, lawyerScope);
  const lawyerTop = pickRowsByMatchedDepth(
    rankedLawyersScoped,
    causeTarget,
    matchDepth > 0 ? 1 : 0,
    parsedDemand.causeScope,
    Math.max(lawyerTargetCount, TOP_N),
    { diversifyForL3: false },
  );
  const lawyerTargetN = Math.max(lawyerTargetCount, TOP_N);
  const budgetTarget = resolveBudgetTarget(parsedDemand.budgetPreference, parsedDemand.budgetLevel);
  const mergeLawyerPriority = (priority: RecommendationItem[], base: RecommendationItem[]): RecommendationItem[] => {
    const merged: RecommendationItem[] = [];
    const used = new Set<string>();
    for (const item of [...priority, ...base]) {
      if (used.has(item.id)) continue;
      merged.push(item);
      used.add(item.id);
      if (merged.length >= lawyerTargetN) break;
    }
    return merged;
  };
  let lawyerTopFinal = lawyerTop;
  if (parsedDemand.lawyerServicePreference === "budget" && budgetTarget !== null) {
    const budgetBand = rankedLawyersScoped.filter((item) => {
      const rate = extractRateFromSubtitle(item.subtitle);
      return rate !== null && Math.abs(rate - budgetTarget) <= 100;
    });
    if (budgetBand.length > 0) {
      lawyerTopFinal = mergeLawyerPriority(budgetBand.slice(0, lawyerTargetN), lawyerTopFinal);
    } else {
      const nearestByBudget = [...rankedLawyersScoped]
        .filter((item) => extractRateFromSubtitle(item.subtitle) !== null)
        .sort((a, b) => {
          const aRate = extractRateFromSubtitle(a.subtitle) ?? Number.MAX_SAFE_INTEGER;
          const bRate = extractRateFromSubtitle(b.subtitle) ?? Number.MAX_SAFE_INTEGER;
          const diff = Math.abs(aRate - budgetTarget) - Math.abs(bRate - budgetTarget);
          if (diff !== 0) return diff;
          return 0;
        });
      lawyerTopFinal = mergeLawyerPriority(nearestByBudget.slice(0, lawyerTargetN), lawyerTopFinal);
    }
  }
  if (parsedDemand.lawyerServicePreference === "response_time" && parsedDemand.city) {
    const sameCity = rankedLawyersScoped
      .filter((item) => item.subtitle.includes(`所在地：${parsedDemand.city}｜`))
      .sort((a, b) => {
        if (budgetTarget === null) return 0;
        const aRate = extractRateFromSubtitle(a.subtitle) ?? Number.MAX_SAFE_INTEGER;
        const bRate = extractRateFromSubtitle(b.subtitle) ?? Number.MAX_SAFE_INTEGER;
        return Math.abs(aRate - budgetTarget) - Math.abs(bRate - budgetTarget);
      });
    lawyerTopFinal = mergeLawyerPriority(sameCity.slice(0, 2), lawyerTopFinal);
  }
  const globalReason = getRecommendationReason(parsedDemand.userType, parsedDemand.mindset);

  return {
    input: normalizedInput,
    path,
    caseType,
    keywords,
    answers,
    globalReason,
    parsedDemand,
    generatedAt: new Date().toISOString(),
    modules: {
      skills: skillTop.slice(0, Math.max(skillTargetCount, TOP_N)),
      lawyers: lawyerTopFinal.slice(0, lawyerTargetN),
      posts: postTop.slice(0, Math.max(postTargetCount, TOP_N)),
      opportunities: opportunityTop.slice(0, TOP_N),
    },
  };
}

export function saveRecommendationProfile(profile: RecommendationProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RECOMMENDATION_STORAGE_KEY, JSON.stringify(profile));
}

export function loadRecommendationProfile(): RecommendationProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(RECOMMENDATION_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as RecommendationProfile;
    if (!parsed?.input || !parsed?.modules || !Array.isArray(parsed.keywords)) return null;
    const safeAnswers = Array.isArray(parsed.answers) ? parsed.answers : [];
    if (!parsed.parsedDemand || !parsed.globalReason) {
      const parsedDemand = parseUserDemand(parsed.input, safeAnswers);
      parsed.parsedDemand = parsed.parsedDemand ?? parsedDemand;
      parsed.globalReason = parsed.globalReason ?? getRecommendationReason(parsedDemand.userType, parsedDemand.mindset);
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearRecommendationProfile(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(RECOMMENDATION_STORAGE_KEY);
}

