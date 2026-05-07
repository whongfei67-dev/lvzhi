import { AMBIGUOUS_SCOPE_CORPUS, CIVIL_SCOPE_CORPUS, CRIMINAL_SCOPE_CORPUS } from "./cause-scope-corpus";
import {
  CIVIL_CAUSE_LABEL_SET,
  CIVIL_CAUSE_LIBRARY,
  CIVIL_CAUSE_LEAF_LABEL_SET,
  CIVIL_CAUSE_ROOT_LABEL,
} from "./civil-cause-library";
import {
  CRIMINAL_CAUSE_LABEL_SET,
  CRIMINAL_CAUSE_LIBRARY,
  CRIMINAL_CAUSE_LEAF_LABEL_SET,
  CRIMINAL_CAUSE_ROOT_LABEL,
} from "./criminal-cause-library";
import { CIVIL_CAUSE_ALIAS_TO_LABEL } from "./civil-cause-aliases";
import { CRIMINAL_CAUSE_ALIAS_TO_LABEL } from "./criminal-cause-aliases";

type UserTypeGroup = "solve_help" | "solve_problem" | "collaboration" | "job" | "creator_supply" | "after_sales";

const userTypeLibrary = [
  { id: "find_lawyer_client", group: "solve_help" as const },
  { id: "case_result_client", group: "solve_problem" as const },
  { id: "legal_ai_tool_client", group: "solve_help" as const },
  { id: "lawyer_review_client", group: "solve_help" as const },
  { id: "experience_case_client", group: "solve_help" as const },
  { id: "template_document_client", group: "solve_help" as const },
  { id: "lawyer_collaboration", group: "collaboration" as const },
  { id: "lawyer_leads", group: "collaboration" as const },
  { id: "legal_ai_creator_lawyer", group: "creator_supply" as const },
  { id: "student_job_seeker", group: "job" as const },
  { id: "lawyer_job_seeker", group: "job" as const },
  { id: "company_legal_procurement", group: "collaboration" as const },
  { id: "legal_ai_learning", group: "solve_help" as const },
  { id: "law_firm_team_collaboration", group: "collaboration" as const },
  { id: "legal_ai_tech_partner", group: "collaboration" as const },
  { id: "creator_certification_exposure", group: "creator_supply" as const },
  { id: "complaint_review_after_sales", group: "after_sales" as const },
] as const satisfies ReadonlyArray<{ id: string; group: UserTypeGroup }>;

const userMindsetLibrary = [
  { id: "anxious" },
  { id: "low_budget" },
  { id: "ready_to_pay" },
  { id: "cautious" },
  { id: "rigorous" },
  { id: "goal_directed" },
  { id: "demanding" },
  { id: "semi_informed" },
  { id: "confused" },
  { id: "guided" },
  { id: "testing_incomplete" },
  { id: "overconfident" },
  { id: "bluffing_aggressive" },
  { id: "background_oriented" },
  { id: "capability_oriented" },
  { id: "conservative" },
  { id: "emotional_high" },
  { id: "legal_misconception" },
  { id: "afraid_to_ask" },
  { id: "professional_collaboration" },
  { id: "beginner" },
] as const satisfies ReadonlyArray<{ id: string }>;

const legalDomainTags = [
  "刑事案件",
  "海事海商纠纷",
  "合同纠纷",
  "劳动争议",
  "知识产权",
  "数据合规",
] as const;
const deliveryTags = ["线上咨询", "线下会面", "文书代拟", "全流程代理"] as const;
const locationServiceTags = ["同城", "同省", "异地", "全国"] as const;
const priceTags = ["低价", "中价", "高价", "按小时计费"] as const;
const recommendationTags = ["案由匹配", "预算匹配", "同城优先", "响应时效"] as const;
const riskComplianceTags = ["证据不足", "程序风险", "时效风险", "合规审查"] as const;
const serviceStageTags = ["咨询评估", "证据准备", "方案制定", "执行跟进"] as const;
const scenarioTagGroups = {
  criminal: ["侦查", "审查起诉", "审判"] as const,
  civil: ["诉前", "诉中", "执行"] as const,
} as const;

const recommendationReasonMatrix: Record<string, string> = {
  default: "已结合您的问题方向、预算和城市优先级进行推荐。",
  anxious: "优先给出可立即执行的处理建议，并尽量匹配响应更快的律师。",
  cautious: "优先展示稳妥路径与证据要求更清晰的推荐项。",
  low_budget: "优先纳入预算更友好的方案和律师候选。",
  professional_collaboration: "优先匹配可协作、可分工的专业资源。",
};

function getRecommendationReason(userType: string, mindset: string): string {
  return (
    recommendationReasonMatrix[mindset] ??
    recommendationReasonMatrix[userType] ??
    recommendationReasonMatrix.default
  );
}

export {
  deliveryTags,
  CIVIL_CAUSE_LABEL_SET,
  CIVIL_CAUSE_LEAF_LABEL_SET,
  CIVIL_CAUSE_LIBRARY,
  CIVIL_CAUSE_ROOT_LABEL,
  CIVIL_CAUSE_ALIAS_TO_LABEL,
  CIVIL_SCOPE_CORPUS,
  CRIMINAL_CAUSE_LABEL_SET,
  CRIMINAL_CAUSE_LEAF_LABEL_SET,
  CRIMINAL_CAUSE_LIBRARY,
  CRIMINAL_CAUSE_ROOT_LABEL,
  CRIMINAL_CAUSE_ALIAS_TO_LABEL,
  CRIMINAL_SCOPE_CORPUS,
  AMBIGUOUS_SCOPE_CORPUS,
  getRecommendationReason,
  legalDomainTags,
  locationServiceTags,
  priceTags,
  recommendationReasonMatrix,
  recommendationTags,
  riskComplianceTags,
  scenarioTagGroups,
  serviceStageTags,
  userMindsetLibrary,
  userTypeLibrary,
};

export type RecommendationUserTypeId = (typeof userTypeLibrary)[number]["id"];
export type RecommendationMindsetId = (typeof userMindsetLibrary)[number]["id"];
export type RecommendationUserTypeGroup = (typeof userTypeLibrary)[number]["group"];
