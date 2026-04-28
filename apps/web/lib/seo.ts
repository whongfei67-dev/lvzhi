/**
 * Open Graph Meta 标签配置
 * 
 * 用于 SEO 和社交媒体分享
 */

export const siteConfig = {
  siteName: '律植 (Lvxzhi)',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lvxzhi.com',
  siteDescription: '律植 - 您的智能法律助手。提供法律咨询、合同审查、案例分析等专业法律服务，让法律服务触手可及。',
  siteKeywords: '法律咨询,智能法律,合同审查,劳动纠纷,知识产权,公司法务,律师服务',
  logo: '/logo.jpg',
  twitterHandle: '@lvzhi_legal',
  locale: 'zh_CN',
}

/**
 * 默认 OG 图片配置
 */
export const ogImageConfig = {
  default: '/og-default.jpg',
  agent: '/og-agent.jpg',
  post: '/og-post.jpg',
  lawyer: '/og-lawyer.jpg',
}

/**
 * 页面默认 Meta 配置
 */
export const defaultMeta = {
  title: `${siteConfig.siteName} - 智能法律助手`,
  description: siteConfig.siteDescription,
  keywords: siteConfig.siteKeywords,
  ogType: 'website',
  ogImage: ogImageConfig.default,
  twitterCard: 'summary_large_image',
  twitterSite: siteConfig.twitterHandle,
  robots: 'index, follow',
}

/**
 * 页面特定 Meta 配置
 */
export const pageMeta = {
  home: {
    title: `${siteConfig.siteName} - 您的智能法律助手`,
    description: '律植提供专业的智能法律服务，包括法律咨询、合同审查、案例分析等。让AI帮您解决法律问题。',
    ogType: 'website',
  },
  
  agents: {
    title: `智能体中心 - ${siteConfig.siteName}`,
    description: '探索律植平台上的各类智能法律助手，包括合同审查、劳动纠纷、知识产权等专业领域。',
    ogType: 'website',
  },
  
  community: {
    title: `法律社区 - ${siteConfig.siteName}`,
    description: '加入律植法律社区，与其他用户交流法律问题，分享案例和经验。',
    ogType: 'website',
  },
  
  findLawyer: {
    title: `找律师 - ${siteConfig.siteName}`,
    description: '快速找到合适的专业律师，提供合同审查、劳动纠纷、知识产权、公司法务等多种法律服务。',
    ogType: 'website',
  },
  
  pricing: {
    title: `定价方案 - ${siteConfig.siteName}`,
    description: '了解律植的定价方案，灵活选择适合您的法律服务套餐。',
    ogType: 'website',
  },
  
  login: {
    title: `登录 - ${siteConfig.siteName}`,
    description: '登录律植账户，享受智能法律服务。',
    robots: 'noindex, nofollow',
  },
  
  register: {
    title: `注册 - ${siteConfig.siteName}`,
    description: '注册律植账户，开始您的智能法律之旅。',
    robots: 'noindex, nofollow',
  },
  
  // 动态页面模板
  agentDetail: (name: string, description: string) => ({
    title: `${name} - 智能体详情 - ${siteConfig.siteName}`,
    description: description || `${name} - 专业的智能法律助手，为您提供法律服务。`,
    ogType: 'article',
    ogImage: ogImageConfig.agent,
  }),
  
  postDetail: (title: string, summary?: string) => ({
    title: `${title} - 法律社区 - ${siteConfig.siteName}`,
    description: summary || title,
    ogType: 'article',
    ogImage: ogImageConfig.post,
  }),
  
  lawyerProfile: (name: string, title?: string) => ({
    title: `${name} - ${title || '专业律师'} - ${siteConfig.siteName}`,
    description: `查看${name}的律师资料和服务范围，获取专业法律咨询。`,
    ogType: 'profile',
    ogImage: ogImageConfig.lawyer,
  }),
}

type PageMetaConfig = {
  title: string
  description: string
  ogType?: string
  ogImage?: string
  robots?: string
}

type PageMetaEntry = PageMetaConfig | ((...args: unknown[]) => PageMetaConfig)

interface PageMeta {
  [key: string]: PageMetaEntry
}

/**
 * 生成完整 Meta 标签对象
 */
export function generateMeta(pageName: string, overrides: Record<string, unknown> = {}) {
  const defaultPageMeta = (pageMeta as Record<string, PageMetaEntry>)[pageName] || defaultMeta
  
  // 如果是函数，执行它
  const pageConfig = typeof defaultPageMeta === 'function' 
    ? (defaultPageMeta as (...args: unknown[]) => PageMetaConfig)(...Object.values(overrides)) 
    : defaultPageMeta as PageMetaConfig
  
  const ogImageValue = pageConfig.ogImage || ogImageConfig.default
  const finalOgImage = ogImageValue.startsWith('http') 
    ? ogImageValue 
    : `${siteConfig.siteUrl}${ogImageValue}`
  
  return {
    ...defaultMeta,
    ...pageConfig,
    ...overrides,
    ogImage: finalOgImage,
  }
}

/**
 * Next.js Metadata 对象格式
 */
export function toNextMetadata(pageName: string, overrides: Record<string, unknown> = {}) {
  const meta = generateMeta(pageName, overrides)
  
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    robots: meta.robots,
    openGraph: {
      type: meta.ogType,
      title: meta.title,
      description: meta.description,
      url: siteConfig.siteUrl,
      siteName: siteConfig.siteName,
      images: [
        {
          url: meta.ogImage,
          width: 1200,
          height: 630,
          alt: siteConfig.siteName,
        },
      ],
      locale: siteConfig.locale,
    },
    twitter: {
      card: meta.twitterCard,
      title: meta.title,
      description: meta.description,
      images: [meta.ogImage],
      site: meta.twitterSite,
    },
  }
}

export default {
  siteConfig,
  ogImageConfig,
  defaultMeta,
  pageMeta,
  generateMeta,
  toNextMetadata,
}
