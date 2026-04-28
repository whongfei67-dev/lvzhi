/**
 * 律师详情页展示模型 — 对齐《初稿-律师详情.html》结构。
 * 支持：API 数据与虚构示例合并；无接口或占位 slug 时使用示例文案（后续可替换为真实档案）。
 */

import { findDemoLawyerById, type LawyerListItem } from "@/lib/lawyers-ranking-demo";
import { withPublicMediaProxy } from "@/lib/media-url";

export interface LawyerEducationItem {
  title: string;
  sub: string;
  /** 校徽占位图（可替换为真实校徽 URL） */
  emblemUrl?: string;
}

export interface LawyerWorkItem {
  title: string;
  org: string;
  period: string;
  summary: string;
}

export interface LawyerCaseItem {
  title: string;
  role: string;
  summary: string;
}

export interface LawyerReviewItem {
  id: string;
  author: string;
  rating: number;
  date: string;
  body: string;
  tags: string[];
  avatarUrl: string;
  peerVerified?: boolean;
}

export interface LawyerRelatedItem {
  name: string;
  slug: string;
  desc: string;
  firm: string;
  avatarUrl: string;
}

/** 侧栏「实务文章」条目 */
export interface LawyerSidebarArticle {
  title: string;
  href: string;
  date?: string;
}

/** 侧栏「法律技能库」：律师作为创作者发布的 Skill 或法律产品 */
export interface LawyerSidebarSkill {
  title: string;
  href: string;
  kind: "skill" | "product";
}

export interface LawyerDetailView {
  id: string;
  name: string;
  avatarUrl: string;
  verified: boolean;
  /** 律所 · 职位，单行展示 */
  titleLine: string;
  firm: string;
  jobTitle: string;
  rating: number;
  reviewCount: number;
  city: string;
  practiceYears: number;
  clientsLabel: string;
  tagLabels: string[];
  bio: string[];
  expertise: string[];
  education: LawyerEducationItem[];
  workHistory: LawyerWorkItem[];
  cases: LawyerCaseItem[];
  reviews: LawyerReviewItem[];
  /** 侧栏首卡：关注者、执业年限、常驻城市（顺序固定） */
  sidebarStats: { value: string; label: string }[];
  sidebarArticles: LawyerSidebarArticle[];
  sidebarSkills: LawyerSidebarSkill[];
  /** 律所办公地址（登记展示） */
  firmAddress: string;
  /** 执业机构对外总机 / 座机（可公开展示） */
  firmLandline: string;
  consultPrice: string;
  consultUnit: string;
  followersDisplay: string;
  productsCount: string;
  yearsDisplay: string;
  related: LawyerRelatedItem[];
  /** 纯虚构或未命中后端时提示 */
  showDemoNotice: boolean;
}

export function decodeLawyerSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

/** 接口可能返回非字符串，避免 String([object Object]) 或渲染异常 */
function textFromApi(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") {
    const t = v.trim();
    return t.length ? t : undefined;
  }
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return undefined;
}

/** 接口可能返回 JSON 字符串或已解析数组 */
function parseJsonArray(raw: unknown): unknown[] | null {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    try {
      const v = JSON.parse(raw) as unknown;
      return Array.isArray(v) ? v : null;
    } catch {
      return null;
    }
  }
  return null;
}

function parseCasesFromApi(raw: unknown, fallback: LawyerCaseItem[]): LawyerCaseItem[] {
  if (raw == null || raw === "") return fallback;
  const arr = parseJsonArray(raw);
  if (arr === null) return fallback;
  if (arr.length === 0) return [];
  const out: LawyerCaseItem[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const title = textFromApi(o.title) ?? textFromApi(o.name);
    if (!title) continue;
    out.push({
      title,
      role: textFromApi(o.role) ?? textFromApi(o.position) ?? "—",
      summary:
        textFromApi(o.summary) ??
        textFromApi(o.desc) ??
        textFromApi(o.description) ??
        "",
    });
  }
  return out.length ? out : fallback;
}

function parseWorkFromApi(raw: unknown, fallback: LawyerWorkItem[]): LawyerWorkItem[] {
  if (raw == null || raw === "") return fallback;
  const arr = parseJsonArray(raw);
  if (arr === null) return fallback;
  if (arr.length === 0) return [];
  const out: LawyerWorkItem[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const title = textFromApi(o.title) ?? textFromApi(o.role);
    if (!title) continue;
    out.push({
      title,
      org: textFromApi(o.org) ?? textFromApi(o.organization) ?? textFromApi(o.company) ?? "—",
      period: textFromApi(o.period) ?? textFromApi(o.time) ?? "—",
      summary: textFromApi(o.summary) ?? textFromApi(o.desc) ?? "",
    });
  }
  return out.length ? out : fallback;
}

/** 返回非空列表，否则 null（由调用方回退到单行 education 字符串等） */
function parseEducationDetailFromApi(raw: unknown): LawyerEducationItem[] | null {
  if (raw == null || raw === "") return null;
  const arr = parseJsonArray(raw);
  if (arr === null) return null;
  if (arr.length === 0) return [];
  const out: LawyerEducationItem[] = [];
  for (const item of arr) {
    if (typeof item === "string") {
      const t = item.trim();
      if (t) out.push({ title: t, sub: "" });
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const title = textFromApi(o.title) ?? textFromApi(o.school);
    if (!title) continue;
    const sub =
      [textFromApi(o.degree), textFromApi(o.major)].filter(Boolean).join("\n") ||
      textFromApi(o.sub) ||
      "";
    out.push({
      title,
      sub,
      emblemUrl: textFromApi(o.emblemUrl) ?? textFromApi(o.emblem),
    });
  }
  return out.length ? out : [];
}

function parseArticlesFromApi(raw: unknown, fallback: LawyerSidebarArticle[]): LawyerSidebarArticle[] {
  if (raw == null || raw === "") return fallback;
  const arr = parseJsonArray(raw);
  if (arr === null) return fallback;
  if (arr.length === 0) return [];
  const out: LawyerSidebarArticle[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const title = textFromApi(o.title);
    if (!title) continue;
    const href = textFromApi(o.href) ?? textFromApi(o.url) ?? "/inspiration";
    out.push({ title, href, date: textFromApi(o.date) });
  }
  return out.length ? out : fallback;
}

function normalizeSidebarSkills(items: LawyerSidebarSkill[]): LawyerSidebarSkill[] {
  return items.map((x) => ({
    title: typeof x.title === "string" ? x.title : String(x.title ?? ""),
    href: typeof x.href === "string" && x.href.trim() ? x.href : "/inspiration/skills",
    kind: x.kind === "product" ? "product" : "skill",
  }));
}

/** 顶部背景：明亮会议室 / 商务会谈场景 */
export const HERO_BG =
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1920&q=80";

const DEFAULT_WORK: LawyerWorkItem[] = [
  {
    title: "高级合伙人",
    org: "北京君合律师事务所",
    period: "2015 — 至今",
    summary: "主管劳动与雇佣业务线，牵头多起集团性用工合规与争议处置（示例）。",
  },
  {
    title: "资深法律顾问",
    org: "某人力资源科技公司",
    period: "2011 — 2015",
    summary: "负责用工制度设计、外包与派遣合规及争议预案（示例）。",
  },
];

const DEFAULT_CASES: LawyerCaseItem[] = [
  {
    title: "某互联网集团用工合规与裁员项目",
    role: "牵头律师",
    summary: "完成法律论证、协商方案与文本交付，协助客户平稳落地（示例）。",
  },
  {
    title: "高管竞业限制与商业秘密系列纠纷",
    role: "代理律师",
    summary: "厘清保密义务边界，协调仲裁与诉讼程序（示例）。",
  },
  {
    title: "制造业企业常年法律顾问",
    role: "主办律师",
    summary: "年度制度体检、集体协商与典型争议处置（示例）。",
  },
];

function schoolEmblemUrl(title: string): string {
  const short = title.replace(/\s+/g, "").slice(0, 4);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(short)}&size=128&background=D4A574&color=ffffff&bold=true`;
}

function educationWithEmblems(items: LawyerEducationItem[]): LawyerEducationItem[] {
  return items.map((e) => ({
    ...e,
    emblemUrl: e.emblemUrl ?? schoolEmblemUrl(e.title),
  }));
}

const RELATED_DEFAULT: LawyerRelatedItem[] = [
  {
    name: "王志强",
    slug: "王志强",
    desc: "合同纠纷 · 公司法务",
    firm: "北京中伦律师事务所",
    avatarUrl: "https://i.pravatar.cc/60?img=5",
  },
  {
    name: "李婉清",
    slug: "李婉清",
    desc: "婚姻家事 · 继承纠纷",
    firm: "上海方达律师事务所",
    avatarUrl: "https://i.pravatar.cc/60?img=8",
  },
];

/** 相关律师不足两条时用于补齐 */
export const LAWYER_RELATED_FALLBACK: LawyerRelatedItem[] = [
  ...RELATED_DEFAULT,
  {
    name: "陈明远",
    slug: "陈明远",
    desc: "劳动争议 · 企业合规",
    firm: "北京君合律师事务所",
    avatarUrl: "https://i.pravatar.cc/60?img=33",
  },
];

const REVIEWS_TEMPLATE = (
  lawyerName: string,
  short: string
): LawyerReviewItem[] => [
  {
    id: "r1",
    author: "张海涛",
    rating: 5,
    date: "2026-04-10",
    body: `${lawyerName}${short}从证据准备到沟通节奏都很清楚，反馈及时。当前评价为示例文案，正式发布后将展示真实用户评价。`,
    tags: ["专业度高", "沟通顺畅"],
    avatarUrl: "https://i.pravatar.cc/40?img=11",
  },
  {
    id: "r2",
    author: "李婉清",
    rating: 5,
    date: "2026-04-02",
    body: `我们团队与${lawyerName}律师有过协作，交付物结构完整，适合作为常年顾问人选。示例评价。`,
    tags: ["交付完整", "值得推荐"],
    avatarUrl: "https://i.pravatar.cc/40?img=14",
  },
  {
    id: "r3",
    author: "王志强",
    rating: 5,
    date: "2026-03-20",
    body: `作为同行，认可${lawyerName}在细分领域的积累与表达。示例评价。`,
    tags: ["同行认可", "经验丰富"],
    avatarUrl: "https://i.pravatar.cc/40?img=20",
    peerVerified: true,
  },
];

function defaultSidebarArticles(lawyerName: string): LawyerSidebarArticle[] {
  return [
    {
      title: `${lawyerName}律师：企业规章制度民主程序的「留痕」清单`,
      href: "/inspiration",
      date: "2026-03-18",
    },
    {
      title: "劳动争议仲裁请求与证据目录的起草思路（实务笔记）",
      href: "/community",
      date: "2026-02-22",
    },
    {
      title: "常年法律顾问服务范围的变更与续签沟通要点",
      href: "/inspiration",
      date: "2026-01-14",
    },
  ];
}

/** 创作者在平台发布的 Skills + 法律产品（示例数据，接入接口后替换） */
function defaultCreatorOfferings(lawyerName: string, tagLabels: string[]): LawyerSidebarSkill[] {
  const tags = tagLabels.length ? tagLabels : ["合同审查", "劳动争议", "企业合规"];
  const skills: LawyerSidebarSkill[] = tags.slice(0, 3).map((title) => ({
    title,
    href: "/inspiration/skills",
    kind: "skill",
  }));
  const products: LawyerSidebarSkill[] = [
    {
      title: `${lawyerName} · 用工合规清单（模板包）`,
      href: "/inspiration",
      kind: "product",
    },
    {
      title: "企业常年法律顾问入门套餐（含答疑）",
      href: "/marketplace",
      kind: "product",
    },
    {
      title: "劳动仲裁申请书智能辅助（工具）",
      href: "/inspiration",
      kind: "product",
    },
  ];
  return [...skills, ...products].slice(0, 6);
}

function baseView(
  partial: Partial<LawyerDetailView> & Pick<LawyerDetailView, "id" | "name">
): LawyerDetailView {
  const name = partial.name;
  const rating = partial.rating ?? 4.9;
  const reviewCount = partial.reviewCount ?? 86;
  const firm = partial.firm ?? "北京君合律师事务所";
  const jobTitle = partial.jobTitle ?? "高级合伙人";
  const city = partial.city ?? "北京市";
  const practiceYears = partial.practiceYears ?? 15;
  const expertise =
    partial.expertise?.length ? partial.expertise : ["劳动争议", "企业合规", "合同纠纷", "公司法务", "知识产权"];
  const bio =
    partial.bio?.length ? partial.bio : [
      `${name}律师，示例律所高级合伙人，本段为初稿级虚构简介，用于版面与流程预演；后续将替换为律师本人维护的真实介绍。`,
      `擅长领域包括：${expertise.slice(0, 4).join("、")}等。以下为示例数据：累计服务客户与案例统计仅供视觉占位。`,
    ];
  const educationRaw =
    partial.education?.length ? partial.education : [
      { title: "中国政法大学 · 法学硕士", sub: "2008 - 2011 · 商法方向" },
      { title: "北京大学 · 法学学士", sub: "2004 - 2008" },
      { title: "注册企业法律顾问", sub: "人力资源与社会保障部认证（示例）" },
    ];
  const education = educationWithEmblems(educationRaw);
  const cases = partial.cases?.length ? partial.cases : DEFAULT_CASES;
  const workHistory = partial.workHistory?.length ? partial.workHistory : DEFAULT_WORK;
  const followersDisplay = partial.followersDisplay ?? "2,841";
  const yearsDisplayRaw = partial.yearsDisplay ?? String(practiceYears);
  const yearsStat = yearsDisplayRaw.includes("年") ? yearsDisplayRaw : `${yearsDisplayRaw}年`;
  const firmAddress =
    partial.firmAddress?.trim() ||
    `${city} · ${firm}（示例：建国门内大街 1 号国贸写字楼 A 座 8F，接入登记信息后替换）`;
  const firmLandline =
    partial.firmLandline?.trim() ||
    `010-8519 3388（${firm} 总机 · 工作日 9:00–18:00 · 示例）`;

  return {
    id: partial.id,
    name,
    avatarUrl: partial.avatarUrl ?? "https://i.pravatar.cc/160?img=33",
    verified: partial.verified ?? false,
    firm,
    jobTitle,
    titleLine: partial.titleLine ?? `${firm} · ${jobTitle}`,
    rating,
    reviewCount,
    city,
    practiceYears,
    clientsLabel: partial.clientsLabel ?? "200+ 客户",
    tagLabels: partial.tagLabels?.length ? partial.tagLabels : expertise,
    bio,
    expertise,
    education,
    workHistory,
    cases,
    reviews: partial.reviews?.length ? partial.reviews : REVIEWS_TEMPLATE(name, "律师"),
    sidebarStats: partial.sidebarStats ?? [
      { value: followersDisplay, label: "关注者" },
      { value: yearsStat, label: "执业年限" },
      { value: city, label: "常驻城市" },
    ],
    sidebarArticles:
      partial.sidebarArticles?.length ? partial.sidebarArticles : defaultSidebarArticles(name),
    sidebarSkills: partial.sidebarSkills?.length
      ? normalizeSidebarSkills(partial.sidebarSkills)
      : defaultCreatorOfferings(name, partial.tagLabels?.length ? partial.tagLabels : expertise),
    firmAddress,
    firmLandline,
    consultPrice: partial.consultPrice ?? "500",
    consultUnit: partial.consultUnit ?? "/ 小时",
    followersDisplay,
    productsCount: partial.productsCount ?? "8",
    yearsDisplay: partial.yearsDisplay ?? String(practiceYears),
    related: partial.related?.length ? partial.related : RELATED_DEFAULT,
    showDemoNotice: partial.showDemoNotice ?? false,
  };
}

type LawyerDetailPreset = Omit<
  LawyerDetailView,
  | "id"
  | "showDemoNotice"
  | "sidebarStats"
  | "sidebarArticles"
  | "sidebarSkills"
  | "firmAddress"
  | "firmLandline"
>;

/** 初稿「陈明远」示例全文（略作标注为示例） */
const PRESET_CHEN_MINGYUAN: LawyerDetailPreset = {
  name: "陈明远",
  avatarUrl: "https://i.pravatar.cc/160?img=33",
  verified: true,
  firm: "北京君合律师事务所",
  jobTitle: "高级合伙人",
  titleLine: "北京君合律师事务所 · 高级合伙人",
  rating: 4.9,
  reviewCount: 86,
  city: "北京市",
  practiceYears: 15,
  clientsLabel: "200+ 客户",
  tagLabels: ["劳动争议", "企业合规", "合同纠纷", "公司法务", "知识产权"],
  expertise: ["劳动争议", "企业合规", "合同纠纷", "公司法务", "竞业限制", "知识产权", "股权激励", "人力资源"],
  bio: [
    "陈明远律师，北京君合律师事务所高级合伙人，专注劳动法领域超过15年。毕业于中国政法大学，曾在多家人力资源公司和知名企业担任法律顾问。以下为初稿示例数据，正式发布后将以律师认证档案为准。",
    "擅长领域包括：企业用工合规体系建设、劳动争议仲裁与诉讼、竞业限制与商业秘密保护、员工股权激励方案设计等。为多家企业客户提供常年法律顾问服务（示例描述）。",
  ],
  education: [
    { title: "中国政法大学 · 法学硕士", sub: "2008 - 2011 · 商法方向" },
    { title: "北京大学 · 法学学士", sub: "2004 - 2008" },
    { title: "注册企业法律顾问", sub: "人力资源与社会保障部认证（示例）" },
  ],
  reviews: [
    {
      id: "cm1",
      author: "张海涛（企业主）",
      rating: 5,
      date: "2026-04-10",
      body: "陈律师帮我们梳理了用工流程与争议预案，材料清单与时间节点都很清楚。本条为初稿示例评价。",
      tags: ["劳动仲裁", "服务态度好"],
      avatarUrl: "https://i.pravatar.cc/40?img=11",
    },
    {
      id: "cm2",
      author: "李婉清（HR总监）",
      rating: 5,
      date: "2026-04-02",
      body: "陈律师为我们做了用工合规体检，提示了若干风险点并给了整改建议。本条为示例评价。",
      tags: ["合规顾问", "专业度高"],
      avatarUrl: "https://i.pravatar.cc/40?img=14",
    },
    {
      id: "cm3",
      author: "王志强（律师同行）",
      rating: 5,
      date: "2026-03-20",
      body: "作为同行，认可陈律师在劳动法领域的积累与表达。本条为示例评价。",
      tags: ["行业专家", "经验丰富"],
      avatarUrl: "https://i.pravatar.cc/40?img=20",
      peerVerified: true,
    },
  ],
  workHistory: DEFAULT_WORK,
  cases: DEFAULT_CASES,
  consultPrice: "500",
  consultUnit: "/ 小时",
  followersDisplay: "2,841",
  productsCount: "8",
  yearsDisplay: "15",
  related: RELATED_DEFAULT,
};

const PRESETS: Record<string, LawyerDetailPreset> = {
  陈明远: PRESET_CHEN_MINGYUAN,
  陈晓敏: {
    ...PRESET_CHEN_MINGYUAN,
    name: "陈晓敏",
    avatarUrl: "https://i.pravatar.cc/160?img=47",
    titleLine: "北京金杜律师事务所 · 合伙人",
    firm: "北京金杜律师事务所",
    jobTitle: "合伙人",
    city: "北京市",
    practiceYears: 9,
    tagLabels: ["劳动争议", "劳动合同", "薪酬绩效", "裁员安置"],
    expertise: ["劳动争议", "劳动合同", "薪酬绩效", "裁员安置", "企业规章制度", "工伤认定"],
    bio: [
      "陈晓敏律师专注劳动争议与企业用工制度设计。本页为初稿级示例内容，后续将接入律师本人维护的真实介绍与数据。",
      "曾为互联网、制造业等多类型企业提供裁员安置与制度修订服务（示例描述）。",
    ],
    reviews: REVIEWS_TEMPLATE("陈晓敏", "律师"),
    yearsDisplay: "9",
  },
  王建国: {
    ...PRESET_CHEN_MINGYUAN,
    name: "王建国",
    avatarUrl: "https://i.pravatar.cc/160?img=12",
    titleLine: "上海大成律师事务所 · 资深律师",
    firm: "上海大成律师事务所",
    jobTitle: "资深律师",
    city: "上海市",
    practiceYears: 12,
    tagLabels: ["企业合规", "合同纠纷", "数据合规", "反垄断"],
    expertise: ["企业合规", "合同纠纷", "数据合规", "反垄断", "投融资", "常年顾问"],
    bio: [
      "王建国律师长期服务企业合规与复杂合同纠纷。当前为示例简介，正式发布后将以认证档案为准。",
      "擅长合规体系建设、交易文件谈判与争议解决策略（示例）。",
    ],
    reviews: REVIEWS_TEMPLATE("王建国", "律师"),
    yearsDisplay: "12",
  },
  林雨欣: {
    ...PRESET_CHEN_MINGYUAN,
    name: "林雨欣",
    avatarUrl: "https://i.pravatar.cc/160?img=45",
    titleLine: "深圳国浩律师事务所 · 律师",
    firm: "深圳国浩律师事务所",
    jobTitle: "律师",
    city: "深圳市",
    practiceYears: 7,
    tagLabels: ["婚姻家事", "遗产继承", "家族财富", "家事调解"],
    expertise: ["婚姻家事", "遗产继承", "家族财富", "家事调解", "涉外婚姻", "子女抚养"],
    bio: [
      "林雨欣律师专注婚姻家事及继承纠纷。本页为示例内容，后续将替换为真实信息。",
      "提供家事调解、协议起草与诉讼代理全流程服务（示例）。",
    ],
    reviews: REVIEWS_TEMPLATE("林雨欣", "律师"),
    yearsDisplay: "7",
  },
  张明远: {
    ...PRESET_CHEN_MINGYUAN,
    name: "张明远",
    avatarUrl: "https://i.pravatar.cc/160?img=15",
    titleLine: "盈科律师事务所 · 高级合伙人",
    firm: "盈科律师事务所",
    jobTitle: "高级合伙人",
    city: "北京市",
    practiceYears: 14,
    tagLabels: ["公司法务", "投融资", "并购", "股权激励"],
    expertise: ["公司法务", "投融资", "并购", "股权激励", "股东争议"],
    bio: [
      "张明远律师专注公司商事领域。示例简介，后续接入真实档案。",
      "为成长型企业提供融资文件、公司治理与争议解决服务（示例）。",
    ],
    reviews: REVIEWS_TEMPLATE("张明远", "律师"),
    yearsDisplay: "14",
  },
  赵敏: {
    ...PRESET_CHEN_MINGYUAN,
    name: "赵敏",
    avatarUrl: "https://i.pravatar.cc/160?img=32",
    titleLine: "君合律师事务所 · 合伙人",
    firm: "君合律师事务所",
    jobTitle: "合伙人",
    city: "北京市",
    practiceYears: 11,
    tagLabels: ["企业合规", "反垄断", "数据合规"],
    expertise: ["企业合规", "反垄断", "数据合规", "跨境交易"],
    bio: ["赵敏律师专注企业合规与反垄断。示例简介。", "为科技企业提供合规体检与申报策略（示例）。"],
    reviews: REVIEWS_TEMPLATE("赵敏", "律师"),
    yearsDisplay: "11",
  },
  张律师: {
    ...PRESET_CHEN_MINGYUAN,
    name: "张律师",
    avatarUrl: "https://i.pravatar.cc/160?img=52",
    titleLine: "示例律师事务所 · 主办律师",
    firm: "示例律师事务所",
    jobTitle: "主办律师",
    city: "北京市",
    practiceYears: 10,
    tagLabels: ["合同法", "常年顾问", "争议解决"],
    expertise: ["合同法", "常年顾问", "争议解决", "商事谈判"],
    bio: ["张律师的认证档案正在完善中，当前为初稿示例介绍。", "擅长合同全生命周期管理与争议解决（示例）。"],
    reviews: REVIEWS_TEMPLATE("张律师", "律师"),
    yearsDisplay: "10",
  },
  李律师: {
    ...PRESET_CHEN_MINGYUAN,
    name: "李律师",
    avatarUrl: "https://i.pravatar.cc/160?img=27",
    titleLine: "示例律师事务所 · 合伙人",
    firm: "示例律师事务所",
    jobTitle: "合伙人",
    city: "杭州市",
    practiceYears: 12,
    tagLabels: ["知识产权", "不正当竞争", "商业秘密"],
    expertise: ["知识产权", "不正当竞争", "商业秘密", "许可交易"],
    bio: ["李律师的认证档案正在完善中，当前为初稿示例介绍。", "专注知识产权维权与许可交易（示例）。"],
    reviews: REVIEWS_TEMPLATE("李律师", "律师"),
    yearsDisplay: "12",
  },
  周律师: {
    ...PRESET_CHEN_MINGYUAN,
    name: "周律师",
    avatarUrl: "https://i.pravatar.cc/160?img=38",
    titleLine: "示例律师事务所 · 资深律师",
    firm: "示例律师事务所",
    jobTitle: "资深律师",
    city: "成都市",
    practiceYears: 8,
    tagLabels: ["公司法", "投融资", "合规"],
    expertise: ["公司法", "投融资", "合规", "股权激励"],
    bio: ["周律师的认证档案正在完善中，当前为初稿示例介绍。", "服务企业融资与股权事务（示例）。"],
    reviews: REVIEWS_TEMPLATE("周律师", "律师"),
    yearsDisplay: "8",
  },
  王志强: {
    ...PRESET_CHEN_MINGYUAN,
    name: "王志强",
    avatarUrl: "https://i.pravatar.cc/60?img=5",
    titleLine: "北京中伦律师事务所 · 合伙人",
    firm: "北京中伦律师事务所",
    jobTitle: "合伙人",
    city: "北京市",
    practiceYears: 13,
    tagLabels: ["合同纠纷", "公司法务"],
    expertise: ["合同纠纷", "公司法务", "商事争议", "常年顾问"],
    bio: ["王志强律师的示例主页，与初稿「相关律师」卡片一致。", "专注商事争议与公司治理（示例）。"],
    reviews: REVIEWS_TEMPLATE("王志强", "律师"),
    yearsDisplay: "13",
    related: [
      {
        name: "陈明远",
        slug: "陈明远",
        desc: "劳动争议 · 企业合规",
        firm: "北京君合律师事务所",
        avatarUrl: "https://i.pravatar.cc/60?img=33",
      },
      {
        name: "李婉清",
        slug: "李婉清",
        desc: "婚姻家事 · 继承纠纷",
        firm: "上海方达律师事务所",
        avatarUrl: "https://i.pravatar.cc/60?img=8",
      },
    ],
  },
  李婉清: {
    ...PRESET_CHEN_MINGYUAN,
    name: "李婉清",
    avatarUrl: "https://i.pravatar.cc/60?img=8",
    titleLine: "上海方达律师事务所 · 合伙人",
    firm: "上海方达律师事务所",
    jobTitle: "合伙人",
    city: "上海市",
    practiceYears: 9,
    tagLabels: ["婚姻家事", "继承纠纷"],
    expertise: ["婚姻家事", "继承纠纷", "家族财富", "涉外婚姻"],
    bio: ["李婉清律师的示例主页，与初稿「相关律师」卡片一致。", "专注婚姻继承与家族财富安排（示例）。"],
    reviews: REVIEWS_TEMPLATE("李婉清", "律师"),
    yearsDisplay: "9",
    related: [
      {
        name: "陈明远",
        slug: "陈明远",
        desc: "劳动争议 · 企业合规",
        firm: "北京君合律师事务所",
        avatarUrl: "https://i.pravatar.cc/60?img=33",
      },
      {
        name: "王志强",
        slug: "王志强",
        desc: "合同纠纷 · 公司法务",
        firm: "北京中伦律师事务所",
        avatarUrl: "https://i.pravatar.cc/60?img=5",
      },
    ],
  },
};

const NUMERIC_ID_NAMES: Record<string, string> = {
  "1": "张明远",
  "2": "赵敏",
  "3": "王建国",
  "4": "刘雅婷",
  "5": "陈志强",
  "6": "赵敏",
};

export function getMockLawyerDetailView(
  slugDecoded: string,
  opts: { showDemoNotice?: boolean } = {}
): LawyerDetailView {
  const key = slugDecoded.trim();
  const nameFromNumeric = NUMERIC_ID_NAMES[key];
  const lookupKey = nameFromNumeric || key;
  const preset = PRESETS[lookupKey];
  const id = key;
  if (preset) {
    return baseView({ id, ...preset, verified: false, showDemoNotice: opts.showDemoNotice ?? false });
  }
  return baseView({
    id,
    name: lookupKey || "认证律师",
    verified: false,
    showDemoNotice: opts.showDemoNotice ?? false,
    titleLine: `${lookupKey || "示例律所"} · 律师（示例）`,
    firm: "示例律师事务所",
    jobTitle: "律师",
  });
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.trim());
}

/** 列表页虚拟律师（demo-* id）→ 详情展示 */
function buildLawyerDetailViewFromDemoListItem(l: LawyerListItem): LawyerDetailView {
  const firm = l.firm?.trim() || "独立执业";
  const jobTitle =
    l.rankTitle?.trim() || (l.creator_level === "lawyer" ? "执业律师" : "认证创作者");
  const fill = getMockLawyerDetailView(l.name);
  return baseView({
    id: l.id,
    name: l.name,
    firm,
    jobTitle,
    titleLine: `${firm} · ${jobTitle}`,
    verified: false,
    rating: typeof l.rating === "number" ? l.rating : fill.rating,
    reviewCount: typeof l.review_count === "number" ? l.review_count : fill.reviewCount,
    tagLabels: l.expertise?.length ? l.expertise : fill.tagLabels,
    expertise: l.expertise?.length ? l.expertise : fill.expertise,
    bio: l.bio ? [l.bio, fill.bio[1] ?? ""] : fill.bio,
    avatarUrl: withPublicMediaProxy(l.avatar ?? `https://i.pravatar.cc/160?u=${encodeURIComponent(l.id)}`),
    followersDisplay: l.follower_count != null ? String(l.follower_count) : fill.followersDisplay,
    showDemoNotice: true,
    reviews: fill.reviews,
    cases: fill.cases,
    workHistory: fill.workHistory,
    education: fill.education,
  });
}

export function buildLawyerDetailView(
  slug: string,
  api: Record<string, unknown> | null
): LawyerDetailView {
  const decoded = decodeLawyerSlug(slug);

  if (api && typeof api === "object" && api.id != null) {
    const name = String(api.name ?? decoded);
    const firm = String(api.firm ?? api.law_firm ?? "独立执业");
    let expertise = Array.isArray(api.expertise) ? (api.expertise as string[]).map((s) => String(s).trim()).filter(Boolean) : [];
    if (!expertise.length && typeof api.expertise === "string" && api.expertise.trim()) {
      expertise = api.expertise
        .split(/[,，、]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    const rating = typeof api.rating === "number" ? api.rating : 4.8;
    const reviewCount = typeof api.review_count === "number" ? api.review_count : 0;
    const practiceYears = typeof api.practice_years === "number" ? api.practice_years : 8;
    const bioText = api.bio != null ? String(api.bio) : "";
    const preset = PRESETS[name] || PRESETS[decoded];
    const base = preset
      ? { ...preset, name, firm, jobTitle: String(api.title ?? preset.jobTitle) }
      : null;
    const mergedBio = (() => {
      if (!bioText.trim()) return base?.bio ?? getMockLawyerDetailView(name).bio;
      const paras = bioText
        .split(/\n\s*\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      return paras.length ? paras : [bioText.trim()];
    })();
    const fill = getMockLawyerDetailView(name);
    const eduFromJson = parseEducationDetailFromApi(api.education_detail ?? api.education_json);
    const mergedEducation = educationWithEmblems(
      eduFromJson && eduFromJson.length
        ? eduFromJson
        : api.education != null && String(api.education).trim()
          ? [{ title: String(api.education), sub: "" }]
          : base?.education ?? fill.education
    );
    const mergedReviews =
      (base?.reviews && base.reviews.length ? base.reviews : null) ?? fill.reviews;
    const mergedCases = parseCasesFromApi(
      api.cases_json ?? api.cases_detail ?? api.cases,
      base?.cases ?? fill.cases
    );
    const mergedWork = parseWorkFromApi(
      api.work_history_json ?? api.work_history,
      base?.workHistory ?? fill.workHistory
    );
    const py = practiceYears || base?.practiceYears || 8;
    const cityStr = String(api.city ?? base?.city ?? "全国");
    const yearsDisp = String(py);
    const yearsStat = yearsDisp.includes("年") ? yearsDisp : `${yearsDisp}年`;
    const followersStr =
      typeof api.follower_count === "number" && api.follower_count > 0
        ? String(api.follower_count)
        : base?.followersDisplay ?? "1,280";

    return {
      id: String(api.id),
      name,
      avatarUrl: withPublicMediaProxy(
        String(api.avatar ?? api.avatar_url ?? base?.avatarUrl ?? `https://i.pravatar.cc/160?u=${encodeURIComponent(name)}`)
      ),
      verified: Boolean(api.lawyer_verified) || textFromApi(api.creator_level) === "lawyer",
      firm,
      jobTitle: String(api.title ?? base?.jobTitle ?? "律师"),
      titleLine: `${firm} · ${String(api.title ?? base?.jobTitle ?? "律师")}`,
      rating,
      reviewCount: reviewCount || 12,
      city: cityStr,
      practiceYears: py,
      clientsLabel:
        textFromApi(api.clients_label) ?? base?.clientsLabel ?? fill.clientsLabel ?? "100+ 客户",
      tagLabels: expertise.length ? expertise : base?.tagLabels ?? ["常年顾问", "争议解决"],
      expertise: expertise.length ? expertise : base?.expertise ?? ["常年顾问", "争议解决"],
      bio: mergedBio,
      education: mergedEducation,
      workHistory: mergedWork,
      cases: mergedCases,
      reviews: mergedReviews,
      sidebarStats: [
        { value: followersStr, label: "关注者" },
        { value: yearsStat, label: "执业年限" },
        { value: cityStr, label: "常驻城市" },
      ],
      sidebarArticles: parseArticlesFromApi(api.articles_json ?? api.articles, fill.sidebarArticles),
      sidebarSkills: defaultCreatorOfferings(
        name,
        expertise.length ? expertise : base?.tagLabels ?? fill.tagLabels
      ),
      firmAddress:
        textFromApi(api.firm_address) ??
        textFromApi(api.office_address) ??
        fill.firmAddress,
      firmLandline:
        textFromApi(api.firm_landline) ??
        textFromApi(api.office_phone) ??
        textFromApi(api.landline) ??
        textFromApi(api.firm_phone) ??
        fill.firmLandline,
      followersDisplay: followersStr,
      productsCount: base?.productsCount ?? "6",
      yearsDisplay: yearsDisp,
      related: base?.related ?? RELATED_DEFAULT,
      showDemoNotice: false,
      consultPrice: textFromApi(api.consult_price) ?? textFromApi(api.consultPrice) ?? "500",
      consultUnit: textFromApi(api.consult_unit) ?? textFromApi(api.consultUnit) ?? "/ 小时",
    };
  }

  const fromDemoList = findDemoLawyerById(decoded);
  if (fromDemoList) {
    return buildLawyerDetailViewFromDemoListItem(fromDemoList);
  }

  if (!decoded.trim()) {
    return getMockLawyerDetailView("认证律师");
  }
  if (isUuid(decoded)) {
    const v = getMockLawyerDetailView("认证律师");
    return {
      ...v,
      id: decoded,
      name: "认证律师",
      bio: [
        "该链接对应平台用户 ID，当前尚未拉取到完整公开档案。以下为初稿级示例排版与虚构内容，接入数据后将自动替换。",
        v.bio[1] ?? "",
      ],
    };
  }
  return getMockLawyerDetailView(decoded);
}
