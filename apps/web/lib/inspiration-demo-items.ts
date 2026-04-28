/**
 * 灵感广场列表与 /inspiration/[slug] 详情共用的演示数据（接入真实接口后可逐步替换）。
 */

export type InspirationDemoProduct = {
  id: string
  title: string
  author: string
  /** 创作者头像 */
  authorAvatar: string
  authorVerified: boolean
  /** 执业律师认证标识（姓名旁展示） */
  authorIsLawyer?: boolean
  /** 对应律师详情页 slug（与 buildLawyerDetailView 示例档案一致） */
  lawyerSlug: string
  /** 成为平台创作者注册日（ISO），用于展示创作经验年数 */
  creatorRegisteredAt: string
  category: string
  rating: number
  goodReviewCount: number
  publishedAt: string
  stats: string
  price: string
  featured: boolean
  description: string
  reviewExcerpt: string
  reviewReviewer: string
}

export const INSPIRATION_DEMO_PRODUCTS: InspirationDemoProduct[] = [
  {
    id: '1',
    title: '劳动争议处理全流程模板',
    author: '陈律师',
    lawyerSlug: '陈明远',
    creatorRegisteredAt: '2019-05-18T00:00:00.000Z',
    authorAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=96&h=96&fit=crop&q=80',
    authorVerified: true,
    category: '劳动法',
    rating: 4.9,
    goodReviewCount: 2680,
    publishedAt: '2026-01-15T10:00:00.000Z',
    stats: '1.2k 收藏',
    price: '免费',
    featured: true,
    description:
      '覆盖仲裁申请、证据整理、庭审要点与和解谈判的全流程清单与文书模板，可直接嵌入办案工作流，减少重复劳动。',
    reviewExcerpt: '结构非常清楚，我按清单走一遍心里就有底了，省了一整天整理材料的时间。',
    reviewReviewer: '周先生 · 企业人事',
  },
  {
    id: '2',
    title: 'AI 合同风险排查助手',
    author: '张律师',
    lawyerSlug: '王志强',
    creatorRegisteredAt: '2021-02-10T00:00:00.000Z',
    authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&q=80',
    authorVerified: true,
    category: '合同法',
    rating: 4.8,
    goodReviewCount: 1240,
    publishedAt: '2026-02-20T14:30:00.000Z',
    stats: '5.6k 使用',
    price: '¥9.9',
    featured: true,
    description:
      '对上传合同做条款扫描与风险分级，输出修改建议与谈判要点，适合批量初审与对外协同时的快速把关。',
    reviewExcerpt: '风险提示到位，和法务同事对齐效率高多了。',
    reviewReviewer: '林女士 · 法务负责人',
  },
  {
    id: '3',
    title: '企业合规自查清单',
    author: '王律师',
    lawyerSlug: '李婉清',
    creatorRegisteredAt: '2022-08-01T00:00:00.000Z',
    authorAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=96&h=96&fit=crop&q=80',
    authorVerified: false,
    category: '公司法',
    rating: 4.7,
    goodReviewCount: 360,
    publishedAt: '2025-11-05T09:00:00.000Z',
    stats: '980 收藏',
    price: '¥19.9',
    featured: false,
    description:
      '按行业监管要点拆解自查项，附证据留存建议与整改优先级，方便法务与业务负责人在同一套框架下推进。',
    reviewExcerpt: '条目细但不啰嗦，我们两周内跑完第一轮自查。',
    reviewReviewer: '吴先生 · 合规专员',
  },
  {
    id: '4',
    title: '批量合同生成工具',
    author: '李律师',
    lawyerSlug: '王志强',
    creatorRegisteredAt: '2020-11-20T00:00:00.000Z',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&q=80',
    authorVerified: true,
    category: '合同法',
    rating: 4.6,
    goodReviewCount: 2150,
    publishedAt: '2026-03-01T11:20:00.000Z',
    stats: '2.3k 使用',
    price: '免费',
    featured: true,
    description:
      '基于变量表与条款库批量生成多份合同初稿，支持留痕版本对比，适合投融资、采购等高频签约场景。',
    reviewExcerpt: '模板字段设计得很顺手，批量出稿终于不用熬夜。',
    reviewReviewer: '郑律师 · 商事团队',
  },
  {
    id: '5',
    title: '婚姻法财产分割指南',
    author: '赵律师',
    lawyerSlug: '李婉清',
    creatorRegisteredAt: '2023-01-12T00:00:00.000Z',
    authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&h=96&fit=crop&q=80',
    authorVerified: true,
    category: '婚姻家事',
    rating: 4.9,
    goodReviewCount: 920,
    publishedAt: '2025-12-18T16:45:00.000Z',
    stats: '1.5k 收藏',
    price: '¥29.9',
    featured: false,
    description:
      '梳理房产、股权、存款与债务的常见分割路径，附调解话术与举证清单，帮助当事人理性推进谈判与诉讼。',
    reviewExcerpt: '图文结合好懂，我和家人沟通方案时少了很多争执。',
    reviewReviewer: '孙女士 · 当事人',
  },
  {
    id: '6',
    title: '知识产权申请入门',
    author: '孙律师',
    lawyerSlug: '陈明远',
    creatorRegisteredAt: '2024-04-30T00:00:00.000Z',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&q=80',
    authorVerified: true,
    category: '知识产权',
    rating: 4.5,
    goodReviewCount: 410,
    publishedAt: '2025-10-22T08:15:00.000Z',
    stats: '890 收藏',
    price: '免费',
    featured: false,
    description:
      '从商标、专利到著作权的基础流程与材料清单，适合初创团队第一次布局知产时的快速扫盲与分工。',
    reviewExcerpt: '作为非技术背景的创始人也能看懂下一步该找谁、准备什么。',
    reviewReviewer: '何先生 · 创始人',
  },
  {
    id: '7',
    title: '刑事辩护会见与取证清单',
    author: '唐律师',
    lawyerSlug: '王志强',
    creatorRegisteredAt: '2018-09-06T00:00:00.000Z',
    authorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=96&h=96&fit=crop&q=80',
    authorVerified: true,
    category: '刑事辩护',
    rating: 4.8,
    goodReviewCount: 780,
    publishedAt: '2026-03-14T09:20:00.000Z',
    stats: '1.1k 收藏',
    price: '¥39.9',
    featured: false,
    description:
      '围绕会见、阅卷、取证与质证节点整理实战清单，配套风险提示与时间轴，帮助团队快速搭建辩护路径。',
    reviewExcerpt: '节点非常实用，助理也能迅速按清单推进。',
    reviewReviewer: '马先生 · 刑辩团队',
  },
  {
    id: '8',
    title: '公司治理决议文书包',
    author: '周律师',
    lawyerSlug: '李婉清',
    creatorRegisteredAt: '2020-03-22T00:00:00.000Z',
    authorAvatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=96&h=96&fit=crop&q=80',
    authorVerified: true,
    category: '公司法',
    rating: 4.7,
    goodReviewCount: 1320,
    publishedAt: '2026-03-30T13:10:00.000Z',
    stats: '2.0k 使用',
    price: '免费',
    featured: false,
    description:
      '覆盖股东会、董事会、高管任免等高频决议场景，含版本留痕建议与常见程序瑕疵提示。',
    reviewExcerpt: '直接套用后再微调，流程清晰很多。',
    reviewReviewer: '潘女士 · 公司法务',
  },
  {
    id: '9',
    title: '劳动仲裁证据目录自动生成',
    author: '冯律师',
    lawyerSlug: '陈明远',
    creatorRegisteredAt: '2021-07-18T00:00:00.000Z',
    authorAvatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=96&h=96&fit=crop&q=80',
    authorVerified: true,
    category: '劳动法',
    rating: 4.6,
    goodReviewCount: 860,
    publishedAt: '2026-04-02T10:30:00.000Z',
    stats: '1.3k 使用',
    price: '¥15.9',
    featured: false,
    description:
      '根据案件要点自动整理证据目录与证明目的，减少重复排版时间，并附缺失证据提醒。',
    reviewExcerpt: '新人上手很快，材料整理效率提升明显。',
    reviewReviewer: '梁女士 · 律所助理',
  },
  {
    id: '10',
    title: '投资协议关键条款核对表',
    author: '韩律师',
    lawyerSlug: '王志强',
    creatorRegisteredAt: '2019-11-09T00:00:00.000Z',
    authorAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=96&h=96&fit=crop&q=80',
    authorVerified: true,
    category: '合同法',
    rating: 4.9,
    goodReviewCount: 1890,
    publishedAt: '2026-04-06T15:45:00.000Z',
    stats: '2.8k 收藏',
    price: '¥49.0',
    featured: false,
    description:
      '聚焦估值、对赌、优先权与退出机制条款，提供谈判检查清单与红线提示。',
    reviewExcerpt: '开会前过一遍核对表，谈判底气更足。',
    reviewReviewer: '高先生 · 投资经理',
  },
  {
    id: '11',
    title: '商标异议答辩模板套件',
    author: '林律师',
    lawyerSlug: '李婉清',
    creatorRegisteredAt: '2022-02-26T00:00:00.000Z',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&h=96&fit=crop&q=80',
    authorVerified: true,
    category: '知识产权',
    rating: 4.7,
    goodReviewCount: 970,
    publishedAt: '2026-04-10T09:00:00.000Z',
    stats: '1.7k 使用',
    price: '免费',
    featured: false,
    description:
      '覆盖证据组织、答辩结构与常见抗辩思路，适配品牌初创与成熟企业场景。',
    reviewExcerpt: '模板结构专业，直接节省了大量起草时间。',
    reviewReviewer: '程女士 · 品牌法务',
  },
  {
    id: '12',
    title: '股权激励落地实施清单',
    author: '姚律师',
    lawyerSlug: '王志强',
    creatorRegisteredAt: '2020-06-03T00:00:00.000Z',
    authorAvatar: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=96&h=96&fit=crop&q=80',
    authorVerified: false,
    category: '公司法',
    rating: 4.5,
    goodReviewCount: 620,
    publishedAt: '2026-04-12T11:15:00.000Z',
    stats: '950 收藏',
    price: '¥22.8',
    featured: false,
    description:
      '从激励池设置、授予、归属到退出处理全流程拆解，并提供内部宣导口径模板。',
    reviewExcerpt: '步骤清晰，HR 和法务协同效率提升明显。',
    reviewReviewer: '蒋先生 · 人力总监',
  },
  {
    id: '13',
    title: '家事调解沟通话术库',
    author: '邓律师',
    lawyerSlug: '李婉清',
    creatorRegisteredAt: '2023-09-12T00:00:00.000Z',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=96&h=96&fit=crop&q=80',
    authorVerified: true,
    category: '婚姻家事',
    rating: 4.8,
    goodReviewCount: 540,
    publishedAt: '2026-04-15T18:05:00.000Z',
    stats: '780 收藏',
    price: '¥18.8',
    featured: false,
    description:
      '围绕财产、抚养与探望争议提供分场景沟通话术，帮助降低冲突并推进调解。',
    reviewExcerpt: '对当事人沟通非常友好，实操价值高。',
    reviewReviewer: '顾女士 · 调解员',
  },
  {
    id: '14',
    title: '企业合同台账管理模板',
    author: '郑律师',
    lawyerSlug: '陈明远',
    creatorRegisteredAt: '2019-01-20T00:00:00.000Z',
    authorAvatar: 'https://images.unsplash.com/photo-1542204625-de293a06df52?w=96&h=96&fit=crop&q=80',
    authorVerified: true,
    category: '合同法',
    rating: 4.6,
    goodReviewCount: 1440,
    publishedAt: '2026-04-18T14:25:00.000Z',
    stats: '2.1k 使用',
    price: '免费',
    featured: false,
    description:
      '按签署、履约、续约与风险等级维护合同台账，附到期提醒字段与审计留痕建议。',
    reviewExcerpt: '业务同事也能快速维护台账，管理成本降了。',
    reviewReviewer: '赵先生 · 采购负责人',
  },
]

/** 自创作者注册日起算满整年数（展示用） */
export function creatorExperienceYearsSince(iso: string): number {
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) return 0;
  const now = new Date();
  let y = now.getFullYear() - start.getFullYear();
  const m = now.getMonth() - start.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < start.getDate())) y -= 1;
  return Math.max(0, y);
}

export function findInspirationDemoProduct(slug: string): InspirationDemoProduct | undefined {
  const key = (() => {
    try {
      return decodeURIComponent((slug || '').trim())
    } catch {
      return (slug || '').trim()
    }
  })()
  return INSPIRATION_DEMO_PRODUCTS.find((p) => p.id === key)
}
