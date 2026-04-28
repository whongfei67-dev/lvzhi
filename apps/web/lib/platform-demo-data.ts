/**
 * 平台演示数据
 * 提供模拟数据用于开发和演示
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Creator {
  id: string;
  name: string;
  display_name: string;
  bio: string;
  avatar?: string;
  cover_image?: string;
  role: string;
  specialties: string[];
  stats: {
    agents_count: number;
    total_users: number;
    rating: number;
    reviews_count: number;
  };
  verified: boolean;
  joined_at: string;
  // 扩展字段
  publicIdentityLabel?: string;
  creatorDisplayName?: string;
  creatorAlias?: string;
  publicOrganization?: string;
  sanitizedBio?: string;
  avatarSeed?: string;
  specialty?: string[];
  city?: string;
  nextStepCopy?: string;
  invitationStatus?: string;
  organization?: string;
  realName?: string;
  hideRealIdentity?: boolean;
  isEmployedCreator?: boolean;
  identityRevealAfterApproval?: boolean;
  worksPublished?: number;
  agentsPublished?: number;
}

export interface Lawyer {
  id: string;
  name: string;
  displayName?: string;
  avatarSeed?: string;
  firm: string;
  region: string;
  city?: string;
  institution?: string;
  domain: string;
  primaryDomain?: string;
  rating: number;
  reviews_count: number;
  verified: boolean;
  platformSelected?: boolean;
  rankLabel?: string;
  summary?: string;
  tags: string[];
  specialties?: string[];
  bio: string;
  avatar?: string;
  contactButtonLabel?: string;
  contactFlowNote?: string;
}

export interface PolicyPage {
  slug: string;
  title: string;
  description?: string;
  content?: string;
  summary?: string;
  sections?: {
    title: string;
    body: string[];
  }[];
  faq?: {
    question: string;
    answer: string;
  }[];
  ctaHref?: string;
  ctaLabel?: string;
}

function stripDemoLawyerVerified<T extends { verified: boolean }>(item: T): T {
  return { ...item, verified: false };
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const CREATORS: Creator[] = [
  {
    id: "1",
    name: "飞律",
    display_name: "飞律",
    bio: "资深律师，专注于智能法律工具开发",
    role: "creator",
    specialties: ["合同审查", "劳动法"],
    stats: { agents_count: 8, total_users: 12500, rating: 4.8, reviews_count: 256 },
    verified: true,
    joined_at: "2024-01-15",
    // 扩展字段
    publicIdentityLabel: "张律师",
    creatorDisplayName: "飞律",
    creatorAlias: "飞律",
    publicOrganization: "某知名律师事务所",
    sanitizedBio: "专注企业合同管理与风险控制，执业经验丰富",
    avatarSeed: "张",
    specialty: ["企业合规", "公司法务"],
    city: "北京",
    nextStepCopy: "如果您对张律师的作品感兴趣，可以申请获取邀请码联系",
    invitationStatus: "pending",
  },
  {
    id: "2",
    name: "张律师",
    display_name: "张律师",
    bio: "知名律师事务所合伙人，专注企业合规",
    role: "creator",
    specialties: ["企业合规", "公司法务"],
    stats: { agents_count: 12, total_users: 28000, rating: 4.9, reviews_count: 512 },
    verified: true,
    joined_at: "2024-02-01",
    publicIdentityLabel: "王律师",
    creatorDisplayName: "张律师",
    publicOrganization: "知名律所",
    sanitizedBio: "专注企业合规与公司法务领域",
    avatarSeed: "王",
    specialty: ["婚姻家事", "法律咨询"],
    city: "上海",
    nextStepCopy: "王律师擅长婚姻家事领域，可申请联系",
    invitationStatus: "submitted",
  },
  {
    id: "3",
    name: "李同学",
    display_name: "李同学",
    bio: "法学生，热衷于法律科技探索",
    role: "creator",
    specialties: ["婚姻家事", "法律咨询"],
    stats: { agents_count: 5, total_users: 8600, rating: 4.7, reviews_count: 128 },
    verified: false,
    joined_at: "2024-03-10",
    publicIdentityLabel: "李同学",
    creatorDisplayName: "李同学",
    publicOrganization: "法学院",
    sanitizedBio: "法学生，对法律科技有浓厚兴趣",
    avatarSeed: "李",
    specialty: ["法律科普", "入门咨询"],
    city: "广州",
    nextStepCopy: "李同学欢迎大家交流法律科技",
    invitationStatus: "none",
  },
];

const LAWYERS: Lawyer[] = [
  {
    id: "1",
    name: "张律师",
    displayName: "张明律师",
    avatarSeed: "张",
    firm: "某某律师事务所",
    region: "北京",
    city: "北京",
    institution: "某某律师事务所",
    domain: "合同法",
    primaryDomain: "合同法",
    rating: 4.9,
    reviews_count: 328,
    verified: true,
    platformSelected: true,
    rankLabel: "第 3 位",
    summary: "执业20年，专注企业合同管理与风险控制",
    tags: ["合同审查", "商务谈判"],
    specialties: ["合同法", "公司法", "知识产权"],
    bio: "执业20年，专注企业合同管理与风险控制",
  },
  {
    id: "2",
    name: "李律师",
    firm: "知名律所",
    region: "上海",
    domain: "劳动法",
    rating: 4.8,
    reviews_count: 256,
    verified: true,
    tags: ["劳动仲裁", "员工维权"],
    bio: "专注劳动争议解决，代理数百起劳动案件",
  },
  {
    id: "3",
    name: "王律师",
    firm: "专业律所",
    region: "北京",
    domain: "婚姻家事",
    rating: 4.9,
    reviews_count: 412,
    verified: true,
    tags: ["离婚诉讼", "财产分割"],
    bio: "婚姻家事专业律师，处理众多高净值离婚案件",
  },
];

const POLICY_PAGES: PolicyPage[] = [
  {
    slug: "terms",
    title: "用户协议",
    description: "律植平台用户服务协议",
    content: "欢迎使用律植平台...",
  },
  {
    slug: "privacy",
    title: "隐私政策",
    description: "隐私保护政策",
    content: "我们重视您的隐私保护...",
  },
  {
    slug: "copyright",
    title: "版权声明",
    description: "知识产权保护政策",
    content: "关于内容版权的说明...",
  },
];

// ─── Exported Functions ───────────────────────────────────────────────────────

export function getCreatorById(id: string): Creator | undefined {
  const creator = CREATORS.find((c) => c.id === id);
  return creator ? stripDemoLawyerVerified(creator) : undefined;
}

export function getLawyerById(id: string): Lawyer | undefined {
  const lawyer = LAWYERS.find((l) => l.id === id);
  return lawyer ? stripDemoLawyerVerified(lawyer) : undefined;
}

export function getPolicyBySlug(slug: string): PolicyPage | undefined {
  return POLICY_PAGES.find((p) => p.slug === slug);
}

export function getEmployedCreators(): Creator[] {
  return CREATORS.filter((c) => c.verified).map(stripDemoLawyerVerified);
}

export function getAllCreators(): Creator[] {
  return CREATORS.map(stripDemoLawyerVerified);
}

export function getAllLawyers(): Lawyer[] {
  return LAWYERS.map(stripDemoLawyerVerified);
}

export function getAllPolicies(): PolicyPage[] {
  return POLICY_PAGES;
}

export { POLICY_PAGES };

// ─── Classroom Courses ────────────────────────────────────────────────────────

export const CLASSROOM_COURSES = [
  {
    id: "course-1",
    title: "合同审查实务",
    description: "系统学习合同审查的核心要点",
    instructor: "张律师",
    duration: "12 课时",
    enrolled: 156,
    rating: 4.8,
  },
  {
    id: "course-2",
    title: "劳动法基础",
    description: "了解劳动法基本概念与应用",
    instructor: "李律师",
    duration: "8 课时",
    enrolled: 89,
    rating: 4.6,
  },
];

// ─── Lawyer Data ─────────────────────────────────────────────────────────────

export const LAWYER_REGIONS = [
  { value: "beijing", label: "北京" },
  { value: "shanghai", label: "上海" },
  { value: "guangzhou", label: "广州" },
  { value: "shenzhen", label: "深圳" },
  { value: "hangzhou", label: "杭州" },
  { value: "chengdu", label: "成都" },
  { value: "nanjing", label: "南京" },
  { value: "wuhan", label: "武汉" },
  { value: "xian", label: "西安" },
  { value: "tianjin", label: "天津" },
  { value: "chongqing", label: "重庆" },
  { value: "suzhou", label: "苏州" },
];

export const LAWYER_DOMAINS = [
  { value: "contract", label: "合同法" },
  { value: "litigation", label: "诉讼仲裁" },
  { value: "company", label: "公司法务" },
  { value: "ip", label: "知识产权" },
  { value: "family", label: "婚姻家事" },
  { value: "labor", label: "劳动法" },
  { value: "criminal", label: "刑事辩护" },
  { value: "compliance", label: "合规风控" },
];

export const LAWYER_WEIGHT_LABELS = {
  total_income: "总收入",
  total_orders: "总订单",
  total_users: "总用户",
};

export const DEMO_CREATORS = CREATORS.map((c) => ({
  ...c,
  verified: false,
  agentCount: c.stats.agents_count,
  demoCount: c.stats.total_users,
  organization: c.publicOrganization ?? c.city ?? "创作者机构",
  realName: c.display_name,
  hideRealIdentity: false,
  isEmployedCreator: false,
  identityRevealAfterApproval: false,
  worksPublished: Math.max(1, Math.round((c.stats.total_users ?? 0) / 2000)),
  agentsPublished: c.stats.agents_count,
}));

export function normalizeLawyerFilter(
  filter?: string,
  options?: Array<string | { value: string; label: string }>,
  fallback = ""
): string {
  const raw = (filter ?? "").trim();
  if (!options || options.length === 0) {
    return raw.toLowerCase().replace(/\s+/g, "-");
  }
  if (!raw) return fallback;
  const values = options.map((item) => (typeof item === "string" ? item : item.label));
  if (values.includes(raw)) return raw;
  const byValue = options.find(
    (item) => typeof item !== "string" && item.value.toLowerCase() === raw.toLowerCase()
  );
  if (byValue && typeof byValue !== "string") return byValue.label;
  return fallback;
}

export function getLawyerLeaderboard(
  metricOrRegion?: "total_income" | "total_orders" | "total_users" | string,
  domain?: string
): Array<Record<string, unknown>> {
  if (
    metricOrRegion === "total_income" ||
    metricOrRegion === "total_orders" ||
    metricOrRegion === "total_users"
  ) {
    return CREATORS.slice()
      .sort((a, b) => {
        const aVal =
          metricOrRegion === "total_users"
            ? a.stats.total_users
            : metricOrRegion === "total_orders"
              ? a.stats.reviews_count
              : a.stats.agents_count * 100;
        const bVal =
          metricOrRegion === "total_users"
            ? b.stats.total_users
            : metricOrRegion === "total_orders"
              ? b.stats.reviews_count
              : b.stats.agents_count * 100;
        return bVal - aVal;
      })
      .map((creator, index) => ({
        ...creator,
        verified: false,
        rank: index + 1,
        metricValue:
          metricOrRegion === "total_users"
            ? creator.stats.total_users
            : metricOrRegion === "total_orders"
              ? creator.stats.reviews_count
              : creator.stats.agents_count * 100,
        metricLabel: LAWYER_WEIGHT_LABELS[metricOrRegion],
      }));
  }

  const region = (metricOrRegion ?? "").trim();
  const domainText = (domain ?? "").trim();
  return DEMO_CREATORS.filter((creator) => {
    const regionMatch = !region || region === "全国" || (creator.city ?? "").includes(region);
    const domainMatch =
      !domainText ||
      domainText === "全部领域" ||
      (creator.specialty ?? []).some((item) => item.includes(domainText));
    return regionMatch && domainMatch;
  })
    .slice()
    .sort((a, b) => (b.worksPublished ?? 0) - (a.worksPublished ?? 0))
    .map((creator) => ({
      id: creator.id,
      displayName: creator.creatorDisplayName,
      verified: Boolean(creator.verified),
      city: creator.city,
      institution: creator.organization,
      specialties: creator.specialty ?? [],
    }));
}
