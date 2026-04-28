/**
 * 律所详情页展示模型 — 布局对齐律师详情页，主栏为活跃创作者与法律科技产品（替代教育背景）。
 */

import type { LawyerCaseItem } from "@/lib/lawyer-detail-view";
import { MOCK_INFLUENCE_FIRMS } from "@/lib/lawyers-ranking-demo";

export interface FirmActiveCreator {
  name: string
  rankTitle: string
  expertise: string[]
  /** 对应 `/lawyers/[slug]` */
  lawyerSlug: string
  avatarUrl: string
}

export interface FirmLegalTechProduct {
  title: string
  kind: "智能体" | "Skills" | "工具"
  href: string
}

export interface FirmDetailView {
  id: string
  name: string
  city: string
  lawyerCount: number
  summary: string
  /** 侧栏与头区副文案 */
  tagline: string
  bio: string[]
  cases: LawyerCaseItem[]
  activeCreators: FirmActiveCreator[]
  legalTechProducts: FirmLegalTechProduct[]
  sidebarStats: { value: string; label: string }[]
  firmAddress: string
  publicPhone: string
  showDemoNotice: boolean
}

const DEFAULT_CASES: LawyerCaseItem[] = [
  {
    title: "某跨国集团跨境并购专项",
    role: "主办律所",
    summary: "协调多法域合规与交割文件，项目周期内完成关键节点（示例）。",
  },
  {
    title: "大型互联网平台用工合规年度项目",
    role: "牵头律所",
    summary: "制度体检、模板迭代与培训落地（示例）。",
  },
]

const FIRM_EXTRAS: Record<
  string,
  {
    tagline: string
    bio: string[]
    cases: LawyerCaseItem[]
    activeCreators: FirmActiveCreator[]
    legalTechProducts: FirmLegalTechProduct[]
    firmAddress: string
    publicPhone: string
    sidebarStats?: { value: string; label: string }[]
  }
> = {
  "demo-f1": {
    tagline: "商事争议解决 · 跨境投资",
    bio: [
      "中伦律师事务所在争议解决与跨境投资领域具有广泛市场认知。本页为律植平台示例档案，用于版式与数据占位；接入机构 API 后将展示登记信息。",
      "以下为示例：活跃创作者与法律科技产品数据不代表真实统计。",
    ],
    cases: DEFAULT_CASES,
    activeCreators: [
      {
        name: "周明轩",
        rankTitle: "高级合伙人",
        expertise: ["公司法", "投融资"],
        lawyerSlug: "demo-c-1",
        avatarUrl: "https://i.pravatar.cc/80?u=demo-c-1",
      },
      {
        name: "林静宜",
        rankTitle: "合伙人",
        expertise: ["合同法", "企业合规"],
        lawyerSlug: "demo-c-2",
        avatarUrl: "https://i.pravatar.cc/80?u=demo-c-2",
      },
      {
        name: "顾长风",
        rankTitle: "合伙人 · 法律科技负责人",
        expertise: ["智能体", "产品合规"],
        lawyerSlug: "demo-i-1",
        avatarUrl: "https://i.pravatar.cc/80?u=demo-i-1",
      },
    ],
    legalTechProducts: [
      { title: "中伦 · 合同风险扫描智能体", kind: "智能体", href: "/inspiration" },
      { title: "跨境投资条款库（Skills）", kind: "Skills", href: "/inspiration/skills" },
      { title: "争议案件证据目录生成器", kind: "工具", href: "/inspiration" },
    ],
    firmAddress: "北京市朝阳区建国门外大街甲6号 SK 大厦（示例地址）",
    publicPhone: "010-5957 2288（示例总机）",
  },
  "demo-f2": {
    tagline: "企业合规 · 资本市场",
    bio: [
      "君合律师事务所长期服务企业合规与资本市场业务。当前为平台示例律所主页，正式发布后将接入机构认证数据。",
    ],
    cases: DEFAULT_CASES,
    activeCreators: [
      {
        name: "苏晚晴",
        rankTitle: "资深律师",
        expertise: ["知识产权", "不正当竞争"],
        lawyerSlug: "demo-c-4",
        avatarUrl: "https://i.pravatar.cc/80?u=demo-c-4",
      },
      {
        name: "沈若溪",
        rankTitle: "资本市场业务主管",
        expertise: ["信息披露", "IPO"],
        lawyerSlug: "demo-i-2",
        avatarUrl: "https://i.pravatar.cc/80?u=demo-i-2",
      },
    ],
    legalTechProducts: [
      { title: "君合合规自查清单（Skills）", kind: "Skills", href: "/inspiration/skills" },
      { title: "招股书阅读助手 · 智能体", kind: "智能体", href: "/inspiration" },
      { title: "ESG 披露比对工具", kind: "工具", href: "/inspiration" },
    ],
    firmAddress: "上海市浦东新区陆家嘴环路 1000 号（示例）",
    publicPhone: "021-6043 7888（示例）",
  },
  "demo-f3": {
    tagline: "规模化综合所 · 多领域覆盖",
    bio: [
      "大成律师事务所在全国多城布局，服务领域覆盖争议解决、刑事、公司、金融等。本页为示例数据。",
    ],
    cases: DEFAULT_CASES,
    activeCreators: [
      {
        name: "陆知行",
        rankTitle: "争议解决部顾问",
        expertise: ["仲裁", "诉讼"],
        lawyerSlug: "demo-i-4",
        avatarUrl: "https://i.pravatar.cc/80?u=demo-i-4",
      },
      {
        name: "江予安",
        rankTitle: "数据合规牵头律师",
        expertise: ["数据合规", "网络安全"],
        lawyerSlug: "demo-i-3",
        avatarUrl: "https://i.pravatar.cc/80?u=demo-i-3",
      },
    ],
    legalTechProducts: [
      { title: "大成 · 劳动仲裁流程智能体", kind: "智能体", href: "/inspiration" },
      { title: "常法服务月报模板包", kind: "Skills", href: "/inspiration/skills" },
    ],
    firmAddress: "北京市朝阳区东大桥路 9 号（示例）",
    publicPhone: "400-700-5188（示例客服）",
  },
  "demo-f4": {
    tagline: "跨境 · 金融 · 争议",
    bio: [
      "金杜律师事务所示例主页：突出跨境与金融法律服务能力。数据为虚构，接口就绪后替换。",
    ],
    cases: DEFAULT_CASES,
    activeCreators: [
      {
        name: "周明轩",
        rankTitle: "高级合伙人",
        expertise: ["并购", "投融资"],
        lawyerSlug: "demo-c-1",
        avatarUrl: "https://i.pravatar.cc/80?u=king-demo-1",
      },
      {
        name: "韩博文",
        rankTitle: "主办律师",
        expertise: ["劳动争议"],
        lawyerSlug: "demo-c-3",
        avatarUrl: "https://i.pravatar.cc/80?u=king-demo-2",
      },
    ],
    legalTechProducts: [
      { title: "金杜跨境并购条款助手", kind: "智能体", href: "/inspiration" },
      { title: "银团贷款文件清单（Skills）", kind: "Skills", href: "/inspiration/skills" },
      { title: "金融监管动态订阅工具", kind: "工具", href: "/inspiration" },
    ],
    firmAddress: "北京市朝阳区东三环中路 1 号（示例）",
    publicPhone: "010-5878 5588（示例）",
    sidebarStats: [
      { value: "185+", label: "认证律师（示例）" },
      { value: "30+", label: "境内办公室" },
      { value: "12+", label: "法律科技产品" },
    ],
  },
}

export function findDemoFirmById(id: string) {
  return MOCK_INFLUENCE_FIRMS.find((f) => f.id === id)
}

export function buildFirmDetailView(slug: string): FirmDetailView | null {
  const id = decodeURIComponent(slug.trim())
  const base = findDemoFirmById(id)
  if (!base) return null
  const extra = FIRM_EXTRAS[id] ?? FIRM_EXTRAS["demo-f1"]
  return {
    id: base.id,
    name: base.name,
    city: base.city,
    lawyerCount: base.lawyerCount,
    summary: base.summary,
    tagline: extra.tagline,
    bio: extra.bio,
    cases: extra.cases,
    activeCreators: extra.activeCreators,
    legalTechProducts: extra.legalTechProducts,
    sidebarStats:
      extra.sidebarStats ??
      [
        { value: String(base.lawyerCount), label: "平台认证律师（示例）" },
        { value: "1993", label: "成立年份（示例）" },
        { value: base.city.split("·")[0]?.trim() ?? base.city, label: "总部城市" },
      ],
    firmAddress: extra.firmAddress,
    publicPhone: extra.publicPhone,
    showDemoNotice: true,
  }
}
