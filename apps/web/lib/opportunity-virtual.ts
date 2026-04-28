import type { Opportunity } from '@/lib/api/types'

/** 列表与详情共用的行类型（含可选 `publisher_name`） */
export type OpportunityRow = Opportunity

/** 虚拟展示：招聘、法律需求、业务/技术合作等（与接口数据 id 不冲突） */
export const VIRTUAL_OPPORTUNITIES: OpportunityRow[] = [
  {
    id: 'virtual-hr-01',
    publisher_id: 'demo',
    publisher_role: 'client',
    title: '金融科技团队法务（驻场）',
    slug: 'virtual-hr-01',
    summary:
      '熟悉私募、数据合规与产品评审，配合业务侧合同模板与对外投融资文件，支持业务开发节奏。',
    opportunity_type: 'job',
    location: '上海',
    location_type: 'hybrid',
    status: 'published',
    view_count: 428,
    application_count: 31,
    is_featured: true,
    created_at: '2026-03-12T10:00:00.000Z',
    updated_at: '2026-03-12T10:00:00.000Z',
    publisher_name: '某金融科技公司',
    application_file_requirements: `中文简历（PDF，不超过 5MB）
最近两段工作的项目说明或代表性合同类型（可选）
法律职业资格证书扫描件`,
  },
  {
    id: 'virtual-legal-02',
    publisher_id: 'demo',
    publisher_role: 'client',
    title: '企业常年法律顾问需求征集',
    slug: 'virtual-legal-02',
    summary:
      '制造业集团拟选聘常年顾问，覆盖劳动、合同、合规举报与争议处置，欢迎律所团队联合业务开发对接。',
    opportunity_type: 'collaboration',
    location: '深圳',
    location_type: 'onsite',
    status: 'published',
    view_count: 312,
    application_count: 18,
    is_featured: false,
    created_at: '2026-03-08T09:30:00.000Z',
    updated_at: '2026-03-08T09:30:00.000Z',
    publisher_name: '华南制造业集团',
    application_file_requirements: `律所/团队简介（含主要合伙人及擅长领域）
近三年常年顾问或同类客户服务案例清单（PDF）
报价与服务方案框架（可脱敏）`,
  },
  {
    id: 'virtual-bd-03',
    publisher_id: 'demo',
    publisher_role: 'creator',
    title: '法律科技产品与律所渠道合作',
    slug: 'virtual-bd-03',
    summary:
      'SaaS 产品已进入多家律所试点，寻求区域渠道伙伴与联合方案，共同拓展企业法务与业务开发合作场景。',
    opportunity_type: 'collaboration',
    location: '远程',
    location_type: 'remote',
    status: 'published',
    view_count: 267,
    application_count: 24,
    is_featured: true,
    created_at: '2026-03-05T14:15:00.000Z',
    updated_at: '2026-03-05T14:15:00.000Z',
    publisher_name: '律植科技（演示）',
    application_file_requirements: `公司/机构营业执照或登记证明（复印件加盖公章）
渠道拓展方案或合作意向书（PDF）
联系人名片及常用对接邮箱`,
  },
  {
    id: 'virtual-proj-04',
    publisher_id: 'demo',
    publisher_role: 'client',
    title: '跨境争议解决项目协办',
    slug: 'virtual-proj-04',
    summary:
      '涉港股权纠纷需中英文材料与证据梳理，欢迎有跨境诉讼经验的团队参与项目外包协作。',
    opportunity_type: 'project',
    location: '北京',
    location_type: 'hybrid',
    budget: 180000,
    status: 'published',
    view_count: 198,
    application_count: 9,
    is_featured: false,
    created_at: '2026-02-28T11:00:00.000Z',
    updated_at: '2026-02-28T11:00:00.000Z',
    publisher_name: '某跨境投资机构',
    application_file_requirements: `团队英文简历与中文对照（PDF）
至少 2 件同类跨境争议案例摘要（可匿名）
预计可投入人天与排期说明`,
  },
  {
    id: 'virtual-svc-05',
    publisher_id: 'demo',
    publisher_role: 'client',
    title: '数据合规体系搭建与培训',
    slug: 'virtual-svc-05',
    summary:
      '拟在二季度完成个人信息保护影响评估、制度修订与全员培训，接受服务方联合业务开发投标。',
    opportunity_type: 'service_offer',
    location: '杭州',
    location_type: 'onsite',
    budget: 120000,
    status: 'published',
    view_count: 156,
    application_count: 14,
    is_featured: false,
    created_at: '2026-02-22T08:45:00.000Z',
    updated_at: '2026-02-22T08:45:00.000Z',
    publisher_name: '某互联网平台',
    application_file_requirements: `服务方案与方法论说明（PPT 或 PDF）
PIA/合规制度类项目过往交付物目录（可脱敏）
项目团队名单及资质证明`,
  },
]

export function getVirtualOpportunityBySlug(slug: string): OpportunityRow | undefined {
  return VIRTUAL_OPPORTUNITIES.find((o) => o.slug === slug || o.id === slug)
}
