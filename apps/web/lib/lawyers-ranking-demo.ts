/**
 * 律师 / 律所榜单虚拟数据 — 接口就绪后由真实 API 替换。
 */

export interface LawyerListItem {
  id: string
  name: string
  /** 对外展示头衔（与详情页 jobTitle 对应） */
  rankTitle?: string
  avatar?: string
  firm?: string
  /** 平台展示地域（与列表页地区筛选一致） */
  city?: string
  /** 平台认证领域（与列表页领域筛选标签一致，可 1～3 项） */
  domains?: string[]
  expertise?: string[]
  bio?: string
  rating?: number
  review_count?: number
  follower_count?: number
  lawyer_verified?: boolean
  creator_level?: string
}

export interface InfluenceFirmItem {
  id: string
  name: string
  city: string
  /** 律所侧重领域（与列表页领域筛选一致） */
  domains?: string[]
  /** 全平台认证口径下的律师约数 */
  lawyerCount: number
  /**
   * 各具体领域下「活跃创作者律师」约数（须小于 lawyerCount；与列表页领域筛选联动展示）
   */
  domainLawyerCounts?: Record<string, number>
  summary: string
}

/** 与 `/lawyers` 页 DOMAINS 筛选器 value 对齐 */
export const LAWYER_LIST_DOMAIN_FILTERS = [
  "合同法",
  "劳动法",
  "婚姻家事",
  "企业法务",
  "知识产权",
  "刑事辩护",
] as const

const DOMAIN_FILTER_SET = new Set<string>(LAWYER_LIST_DOMAIN_FILTERS)

/**
 * 示例律师 id → 地域 / 认证领域（接口数据若带 `city`、`domains` 将直接用于筛选与展示）
 */
const DEMO_LAWYER_PLACE: Record<string, { city: string; domains: string[] }> = {
  "demo-c-1": { city: "北京", domains: ["企业法务"] },
  "demo-c-2": { city: "上海", domains: ["合同法", "企业法务"] },
  "demo-c-3": { city: "深圳", domains: ["劳动法"] },
  "demo-c-4": { city: "杭州", domains: ["知识产权"] },
  "demo-c-5": { city: "北京", domains: ["企业法务"] },
  "demo-c-6": { city: "上海", domains: ["企业法务"] },
  "demo-c-7": { city: "广州", domains: ["合同法"] },
  "demo-c-8": { city: "成都", domains: ["企业法务"] },
  "demo-c-9": { city: "杭州", domains: ["婚姻家事"] },
  "demo-c-10": { city: "深圳", domains: ["企业法务"] },
  "demo-c-11": { city: "北京", domains: ["企业法务"] },
  "demo-c-12": { city: "上海", domains: ["企业法务"] },
  "demo-i-1": { city: "北京", domains: ["知识产权", "企业法务"] },
  "demo-i-2": { city: "上海", domains: ["企业法务"] },
  "demo-i-3": { city: "深圳", domains: ["企业法务"] },
  "demo-i-4": { city: "广州", domains: ["合同法"] },
  "demo-i-5": { city: "杭州", domains: ["知识产权"] },
  "demo-i-6": { city: "成都", domains: ["合同法"] },
  "demo-i-7": { city: "北京", domains: ["知识产权"] },
  "demo-i-8": { city: "上海", domains: ["企业法务"] },
  "demo-i-9": { city: "深圳", domains: ["企业法务"] },
  "demo-i-10": { city: "杭州", domains: ["企业法务"] },
  "demo-i-11": { city: "广州", domains: ["合同法"] },
  "demo-i-12": { city: "成都", domains: ["知识产权"] },
  "demo-n-1": { city: "北京", domains: ["婚姻家事"] },
  "demo-n-2": { city: "上海", domains: ["刑事辩护"] },
  "demo-n-3": { city: "深圳", domains: ["企业法务"] },
  "demo-n-4": { city: "广州", domains: ["知识产权"] },
  "demo-n-5": { city: "杭州", domains: ["合同法"] },
  "demo-n-6": { city: "成都", domains: ["劳动法"] },
  "demo-n-7": { city: "北京", domains: ["合同法"] },
  "demo-n-8": { city: "上海", domains: ["知识产权"] },
  "demo-n-9": { city: "深圳", domains: ["企业法务", "劳动法"] },
  "demo-n-10": { city: "杭州", domains: ["婚姻家事"] },
  "demo-n-11": { city: "广州", domains: ["刑事辩护"] },
  "demo-n-12": { city: "成都", domains: ["合同法"] },
}

function applyDemoLawyerPlaceholders(items: LawyerListItem[]): LawyerListItem[] {
  return items.map((l) => {
    const extra = DEMO_LAWYER_PLACE[l.id]
    return extra ? { ...l, city: l.city ?? extra.city, domains: l.domains?.length ? l.domains : extra.domains } : l
  })
}

export const MOCK_LAWYERS_COMPREHENSIVE: LawyerListItem[] = [
  {
    id: "demo-c-1",
    name: "周明轩",
    rankTitle: "高级合伙人",
    firm: "金杜律师事务所",
    expertise: ["公司法", "投融资", "并购"],
    bio: "十年以上商事争议与公司治理经验，综合推荐示例。",
    rating: 4.9,
    review_count: 186,
    follower_count: 3200,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-c-2",
    name: "林静宜",
    rankTitle: "合伙人",
    firm: "中伦律师事务所",
    expertise: ["合同法", "企业合规"],
    bio: "常年服务企业客户，合同与合规一体化服务。",
    rating: 4.8,
    review_count: 142,
    follower_count: 2100,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-c-3",
    name: "韩博文",
    rankTitle: "主办律师",
    firm: "独立执业",
    expertise: ["劳动争议", "仲裁诉讼"],
    bio: "专注劳动争议与仲裁，响应迅速。",
    rating: 4.7,
    review_count: 98,
    follower_count: 890,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-c-4",
    name: "苏晚晴",
    rankTitle: "资深律师",
    firm: "君合律师事务所",
    expertise: ["知识产权", "不正当竞争"],
    bio: "知识产权布局与维权，科技与制造业客户较多。",
    rating: 4.85,
    review_count: 121,
    follower_count: 1780,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-c-5",
    name: "程予安",
    rankTitle: "合伙人",
    firm: "海问律师事务所",
    expertise: ["跨境投资", "并购"],
    bio: "跨境交易与监管沟通经验丰富（示例）。",
    rating: 4.83,
    review_count: 104,
    follower_count: 1520,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-c-6",
    name: "方景行",
    rankTitle: "主办律师",
    firm: "方达律师事务所",
    expertise: ["证券合规", "信息披露"],
    bio: "上市公司常年法律顾问（示例）。",
    rating: 4.8,
    review_count: 88,
    follower_count: 1340,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-c-7",
    name: "白若溪",
    rankTitle: "资深律师",
    firm: "竞天公诚律师事务所",
    expertise: ["争议解决", "仲裁"],
    bio: "商事仲裁与诉讼双轨办案（示例）。",
    rating: 4.78,
    review_count: 76,
    follower_count: 1120,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-c-8",
    name: "谢知远",
    rankTitle: "顾问律师",
    firm: "独立执业",
    expertise: ["数据合规", "个人信息保护"],
    bio: "互联网与金融科技合规专项（示例）。",
    rating: 4.72,
    review_count: 64,
    follower_count: 980,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-c-9",
    name: "孟清和",
    rankTitle: "执业律师",
    firm: "某精品所",
    expertise: ["婚姻家事", "财富传承"],
    bio: "高净值家庭资产安排与家事纠纷（示例）。",
    rating: 4.7,
    review_count: 55,
    follower_count: 760,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-c-10",
    name: "陶思齐",
    rankTitle: "主办律师",
    firm: "大成律师事务所",
    expertise: ["房地产", "建设工程"],
    bio: "工程索赔与地产并购尽调（示例）。",
    rating: 4.68,
    review_count: 49,
    follower_count: 640,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-c-11",
    name: "顾言蹊",
    rankTitle: "合伙人",
    firm: "汉坤律师事务所",
    expertise: ["私募股权", "风险投资"],
    bio: "早期与成长期项目投融资文件与谈判（示例）。",
    rating: 4.66,
    review_count: 44,
    follower_count: 580,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-c-12",
    name: "夏知微",
    rankTitle: "资深律师",
    firm: "通商律师事务所",
    expertise: ["反垄断", "经营者集中"],
    bio: "经营者集中申报与合规辅导（示例）。",
    rating: 4.64,
    review_count: 38,
    follower_count: 520,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
]

export const MOCK_LAWYERS_INFLUENCE: LawyerListItem[] = [
  {
    id: "demo-i-1",
    name: "顾长风",
    rankTitle: "合伙人 · 法律科技负责人",
    firm: "大成律师事务所",
    expertise: ["智能体", "法律科技", "产品合规"],
    bio: "平台创作活跃度高，Skills 与智能体使用量领先（示例）。",
    rating: 4.95,
    review_count: 412,
    follower_count: 12800,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-i-2",
    name: "沈若溪",
    rankTitle: "资本市场业务主管",
    firm: "方达律师事务所",
    expertise: ["资本市场", "信息披露"],
    bio: "多篇实务文章与模板被高频收藏，创作影响力示例。",
    rating: 4.9,
    review_count: 356,
    follower_count: 9600,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-i-3",
    name: "江予安",
    rankTitle: "数据合规牵头律师",
    firm: "海问律师事务所",
    expertise: ["数据合规", "网络安全"],
    bio: "跨境数据与算法合规专题持续更新。",
    rating: 4.88,
    review_count: 267,
    follower_count: 7400,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-i-4",
    name: "陆知行",
    rankTitle: "争议解决部顾问",
    firm: "竞天公诚律师事务所",
    expertise: ["争议解决", "仲裁"],
    bio: "案例复盘与办案手记系列阅读量高（示例）。",
    rating: 4.82,
    review_count: 198,
    follower_count: 6200,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-i-5",
    name: "纪云开",
    rankTitle: "数字法务负责人",
    firm: "金杜律师事务所",
    expertise: ["法律科技", "智能合规"],
    bio: "智能体与模板工具链在平台使用量居前（示例）。",
    rating: 4.9,
    review_count: 289,
    follower_count: 8100,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-i-6",
    name: "乔晚澄",
    rankTitle: "争议解决合伙人",
    firm: "中伦律师事务所",
    expertise: ["商事诉讼", "调解谈判"],
    bio: "实务短视频与办案清单被大量收藏（示例）。",
    rating: 4.87,
    review_count: 241,
    follower_count: 6900,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-i-7",
    name: "裴照野",
    rankTitle: "知识产权合伙人",
    firm: "汉坤律师事务所",
    expertise: ["专利诉讼", "技术许可"],
    bio: "硬科技客户专利组合与许可谈判活跃（示例）。",
    rating: 4.86,
    review_count: 228,
    follower_count: 6500,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-i-8",
    name: "苏砚舟",
    rankTitle: "金融合规主管",
    firm: "通商律师事务所",
    expertise: ["银行合规", "资管产品"],
    bio: "监管报送与产品说明书模板使用量高（示例）。",
    rating: 4.84,
    review_count: 205,
    follower_count: 5800,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-i-9",
    name: "贺星阑",
    rankTitle: "反垄断业务负责人",
    firm: "金杜律师事务所",
    expertise: ["反垄断申报", "合规调查"],
    bio: "经营者集中与垄断协议专题更新频繁（示例）。",
    rating: 4.85,
    review_count: 218,
    follower_count: 6100,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-i-10",
    name: "秦望舒",
    rankTitle: "资本市场合伙人",
    firm: "君合律师事务所",
    expertise: ["IPO", "再融资"],
    bio: "招股书拆解与监管问询回复系列受关注（示例）。",
    rating: 4.89,
    review_count: 312,
    follower_count: 8800,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-i-11",
    name: "傅清川",
    rankTitle: "争议解决顾问",
    firm: "方达律师事务所",
    expertise: ["国际仲裁", "跨境执行"],
    bio: "跨境裁决承认与执行办案手记传播广（示例）。",
    rating: 4.81,
    review_count: 176,
    follower_count: 5400,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-i-12",
    name: "洛宁川",
    rankTitle: "法律科技顾问",
    firm: "独立执业",
    expertise: ["智能合同", "流程自动化"],
    bio: "低代码合规工作流与智能体模板下载量居前（示例）。",
    rating: 4.79,
    review_count: 164,
    follower_count: 4900,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
]

export const MOCK_LAWYERS_NEWCOMER: LawyerListItem[] = [
  {
    id: "demo-n-1",
    name: "宋以宁",
    rankTitle: "执业律师",
    firm: "某精品所",
    expertise: ["婚姻家事", "继承"],
    bio: "新认证执业律师，专注家事调解与诉讼（示例）。",
    rating: 4.6,
    review_count: 28,
    follower_count: 320,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-n-2",
    name: "唐予白",
    rankTitle: "新锐主办律师",
    firm: "某地方律所",
    expertise: ["刑事辩护", "取保候审"],
    bio: "近期入驻，刑事案件办理流程透明（示例）。",
    rating: 4.55,
    review_count: 19,
    follower_count: 210,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-n-3",
    name: "许清和",
    rankTitle: "企业法务顾问",
    firm: "某联营所",
    expertise: ["企业法务", "常法顾问"],
    bio: "新锐创作者律师，中小企业常年法律顾问（示例）。",
    rating: 4.5,
    review_count: 15,
    follower_count: 156,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-n-4",
    name: "叶知秋",
    rankTitle: "认证创作者",
    firm: "独立执业",
    expertise: ["交通事故", "人损理赔"],
    bio: "新认证创作者，理赔谈判与诉讼（示例）。",
    rating: 4.48,
    review_count: 12,
    follower_count: 98,
    lawyer_verified: false,
    creator_level: "creator",
  },
  {
    id: "demo-n-5",
    name: "沈听澜",
    rankTitle: "执业律师",
    firm: "某地方律所",
    expertise: ["民间借贷", "执行"],
    bio: "新锐创作者律师，执行与保全流程可视化笔记（示例）。",
    rating: 4.52,
    review_count: 22,
    follower_count: 180,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-n-6",
    name: "温以宁",
    rankTitle: "执业律师",
    firm: "某精品所",
    expertise: ["劳动仲裁", "竞业限制"],
    bio: "近期高频更新劳动仲裁办案清单（示例）。",
    rating: 4.46,
    review_count: 17,
    follower_count: 142,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-n-7",
    name: "江予墨",
    rankTitle: "执业律师",
    firm: "某地方律所",
    expertise: ["合同纠纷", "债权保全"],
    bio: "合同审查清单与保全申请书模板获收藏（示例）。",
    rating: 4.44,
    review_count: 14,
    follower_count: 118,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-n-8",
    name: "陆星遥",
    rankTitle: "认证创作者",
    firm: "独立执业",
    expertise: ["知识产权", "商标异议"],
    bio: "商标异议与无效宣告流程图解系列（示例）。",
    rating: 4.42,
    review_count: 11,
    follower_count: 96,
    lawyer_verified: false,
    creator_level: "creator",
  },
  {
    id: "demo-n-9",
    name: "周予安",
    rankTitle: "执业律师",
    firm: "某联营所",
    expertise: ["企业常法", "劳动用工"],
    bio: "中小企业用工手册与制度模板（示例）。",
    rating: 4.4,
    review_count: 13,
    follower_count: 108,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-n-10",
    name: "顾清让",
    rankTitle: "执业律师",
    firm: "某精品所",
    expertise: ["婚姻家事", "调解"],
    bio: "家事调解沟通脚本与案例复盘（示例）。",
    rating: 4.38,
    review_count: 10,
    follower_count: 88,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-n-11",
    name: "沈栖迟",
    rankTitle: "执业律师",
    firm: "某地方律所",
    expertise: ["交通事故", "保险理赔"],
    bio: "理赔计算与调解谈判要点速查（示例）。",
    rating: 4.36,
    review_count: 9,
    follower_count: 82,
    lawyer_verified: true,
    creator_level: "lawyer",
  },
  {
    id: "demo-n-12",
    name: "林见深",
    rankTitle: "认证创作者",
    firm: "独立执业",
    expertise: ["债务催收", "执行和解"],
    bio: "执行和解协议范本与谈判话术（示例）。",
    rating: 4.34,
    review_count: 8,
    follower_count: 74,
    lawyer_verified: false,
    creator_level: "creator",
  },
]

export const MOCK_INFLUENCE_FIRMS: InfluenceFirmItem[] = [
  {
    id: "demo-f1",
    name: "中伦律师事务所",
    city: "北京",
    domains: ["合同法", "企业法务", "知识产权"],
    lawyerCount: 128,
    domainLawyerCounts: { 合同法: 46, 企业法务: 68, 知识产权: 52 },
    summary: "商事争议、跨境投资领域平台活跃度高",
  },
  {
    id: "demo-f2",
    name: "君合律师事务所",
    city: "上海",
    domains: ["企业法务", "知识产权"],
    lawyerCount: 96,
    domainLawyerCounts: { 企业法务: 58, 知识产权: 41 },
    summary: "企业合规与资本市场综合服务影响力突出",
  },
  {
    id: "demo-f3",
    name: "大成律师事务所",
    city: "全国多城",
    domains: ["合同法", "劳动法", "刑事辩护", "知识产权"],
    lawyerCount: 210,
    domainLawyerCounts: { 合同法: 52, 劳动法: 44, 刑事辩护: 38, 知识产权: 61 },
    summary: "规模化律所，多领域律师入驻与创作活跃",
  },
  {
    id: "demo-f4",
    name: "金杜律师事务所",
    city: "北京 / 上海 / 深圳",
    domains: ["企业法务", "知识产权", "婚姻家事"],
    lawyerCount: 185,
    domainLawyerCounts: { 企业法务: 72, 知识产权: 59, 婚姻家事: 36 },
    summary: "全所联动与跨境项目曝光度高，示例榜单数据",
  },
]

/** 律所卡片：全部领域用 lawyerCount；具体领域用 domainLawyerCounts（缺省时按总数比例估算，保证小于总数） */
export function getFirmDisplayLawyerCount(firm: InfluenceFirmItem, selectedDomain: string): number {
  if (!selectedDomain) return firm.lawyerCount
  const mapped = firm.domainLawyerCounts?.[selectedDomain]
  if (mapped != null) return Math.min(mapped, firm.lawyerCount - 1 || 1)
  const fallback = Math.max(1, Math.floor(firm.lawyerCount * 0.32))
  return Math.min(fallback, firm.lawyerCount - 1 || 1)
}

export function filterLawyersByRegionDomain(
  lawyers: LawyerListItem[],
  region: string,
  domain: string
): LawyerListItem[] {
  if (!region && !domain) return lawyers
  return lawyers.filter((l) => {
    if (region) {
      if (l.city && l.city !== region) return false
    }
    if (domain) {
      const fromDomains = (l.domains ?? []).filter((d) => DOMAIN_FILTER_SET.has(d))
      const fromExpertise = (l.expertise ?? []).filter((e) => DOMAIN_FILTER_SET.has(e))
      const hit = new Set([...fromDomains, ...fromExpertise])
      if (!hit.has(domain)) return false
    }
    return true
  })
}

export function filterInfluenceFirms(
  firms: InfluenceFirmItem[],
  region: string,
  domain: string
): InfluenceFirmItem[] {
  if (!region && !domain) return firms
  return firms.filter((f) => {
    if (region && !f.city.includes(region)) return false
    if (domain) {
      const ds = f.domains ?? []
      if (ds.length > 0 && !ds.includes(domain)) return false
    }
    return true
  })
}

/** `/lawyers`：综合推荐用接口数据，失败或空则回落示例；其余律师 Tab 暂为独立示例列表 */
export function getDisplayLawyers(activeRanking: string, apiLawyers: LawyerListItem[]): LawyerListItem[] {
  if (activeRanking === "influence") return applyDemoLawyerPlaceholders(MOCK_LAWYERS_INFLUENCE)
  if (activeRanking === "newcomer") return applyDemoLawyerPlaceholders(MOCK_LAWYERS_NEWCOMER)
  if (activeRanking === "comprehensive" && apiLawyers.length > 0) return apiLawyers
  return applyDemoLawyerPlaceholders(MOCK_LAWYERS_COMPREHENSIVE)
}

export function isShowingMockLawyers(activeRanking: string, apiLawyers: LawyerListItem[]): boolean {
  if (activeRanking === "influence" || activeRanking === "newcomer") return true
  return activeRanking === "comprehensive" && apiLawyers.length === 0
}

/** `/lawyers/rankings`：各律师 Tab 独立示例列表 */
export function getMockLawyersForRankingsTab(
  tab: "comprehensive" | "influence" | "newcomer"
): LawyerListItem[] {
  if (tab === "influence") return applyDemoLawyerPlaceholders(MOCK_LAWYERS_INFLUENCE)
  if (tab === "newcomer") return applyDemoLawyerPlaceholders(MOCK_LAWYERS_NEWCOMER)
  return applyDemoLawyerPlaceholders(MOCK_LAWYERS_COMPREHENSIVE)
}

const ALL_DEMO_LAWYERS: LawyerListItem[] = [
  ...MOCK_LAWYERS_COMPREHENSIVE,
  ...MOCK_LAWYERS_INFLUENCE,
  ...MOCK_LAWYERS_NEWCOMER,
]

/** 列表页虚拟律师 id → 详情页 `/lawyers/[slug]` 数据源 */
export function findDemoLawyerById(id: string): LawyerListItem | undefined {
  const l = ALL_DEMO_LAWYERS.find((x) => x.id === id)
  if (!l) return undefined
  const extra = DEMO_LAWYER_PLACE[l.id]
  return extra ? { ...l, city: l.city ?? extra.city, domains: l.domains?.length ? l.domains : extra.domains } : l
}
