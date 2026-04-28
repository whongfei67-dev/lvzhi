/**
 * Sitemap 和 Robots.txt 生成器
 * 
 * 为律植 (Lvzhi) 网站生成 SEO 相关文件
 * 
 * 使用方法:
 *   node scripts/generate-seo.ts
 * 
 * 输出文件:
 *   - public/sitemap.xml
 *   - public/robots.txt
 */

import fs from 'fs'
import path from 'path'

const API_BASE = process.env.API_BASE || 'http://localhost:4000'
const BASE_URL = process.env.BASE_URL || 'https://www.lvxzhi.com'

/**
 * 静态页面列表
 */
const staticPages = [
  { loc: '/', priority: '1.0', changefreq: 'daily' },
  { loc: '/agents', priority: '0.9', changefreq: 'daily' },
  { loc: '/community', priority: '0.8', changefreq: 'daily' },
  { loc: '/find-lawyer', priority: '0.7', changefreq: 'weekly' },
  { loc: '/pricing', priority: '0.7', changefreq: 'weekly' },
  { loc: '/about', priority: '0.6', changefreq: 'monthly' },
  { loc: '/login', priority: '0.5', changefreq: 'monthly' },
  { loc: '/register', priority: '0.5', changefreq: 'monthly' },
]

/**
 * 动态页面类型
 */
const dynamicPageTypes = [
  { type: 'agent', endpoint: '/api/agents', priority: '0.8', changefreq: 'daily' },
  { type: 'post', endpoint: '/api/community/posts', priority: '0.7', changefreq: 'weekly' },
]

/**
 * 生成 sitemap XML
 */
async function generateSitemap() {
  console.log('📄 正在生成 sitemap.xml...')
  
  const urls = [...staticPages]
  
  // 获取动态内容
  for (const pageType of dynamicPageTypes) {
    try {
      const res = await fetch(`${API_BASE}${pageType.endpoint}?limit=1000`)
      if (res.ok) {
        const data = await res.json()
        const items = data.data || data
        
        for (const item of items) {
          let loc = ''
          switch (pageType.type) {
            case 'agent':
              loc = `/agents/${item.id}`
              break
            case 'post':
              loc = `/community/${item.id}`
              break
          }
          
          if (loc) {
            urls.push({
              loc,
              priority: pageType.priority,
              changefreq: pageType.changefreq,
              lastmod: item.updated_at || item.created_at || new Date().toISOString().split('T')[0],
            })
          }
        }
        
        console.log(`  ✅ 获取 ${items.length} 个 ${pageType.type} 页面`)
      }
    } catch (e) {
      console.log(`  ⚠️ 无法获取 ${pageType.type}: ${e.message}`)
    }
  }
  
  // 生成 XML
  const today = new Date().toISOString().split('T')[0]
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                          http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

${urls.map(url => `  <url>
    <loc>${BASE_URL}${url.loc}</loc>
    <lastmod>${url.lastmod || today}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}

</urlset>`

  // 保存文件
  const outputPath = path.join(process.cwd(), 'apps/web/public/sitemap.xml')
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, xml)
  
  console.log(`\n✅ sitemap.xml 已生成: ${urls.length} 个 URL`)
  console.log(`   文件位置: ${outputPath}`)
  
  return urls.length
}

/**
 * 生成 robots.txt
 */
function generateRobots() {
  console.log('\n🤖 正在生成 robots.txt...')
  
  const robots = `#律植 (Lvzhi) robots.txt
#Generated: ${new Date().toISOString()}

User-agent: *
Allow: /

# Disallow sensitive paths
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /creator/
Disallow: /profile/
Disallow: /settings/
Disallow: /oauth/
Disallow: /*/callback
Disallow: /oauth/callback

# Sitemap
Sitemap: ${BASE_URL}/sitemap.xml
Sitemap: https://www.lvxzhi.com/sitemap.xml

# Crawl-delay (optional, be nice to servers)
Crawl-delay: 1
`

  // 保存文件
  const outputPath = path.join(process.cwd(), 'apps/web/public/robots.txt')
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, robots)
  
  console.log(`✅ robots.txt 已生成`)
  console.log(`   文件位置: ${outputPath}`)
}

/**
 * 主函数
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║           律植 (Lvzhi) SEO 文件生成器                         ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝')
  console.log(`\nAPI 地址: ${API_BASE}`)
  console.log(`网站地址: ${BASE_URL}\n`)
  
  // 检查 API 可用性
  try {
    const healthRes = await fetch(`${API_BASE}/health`)
    if (!healthRes.ok) {
      console.log('⚠️ API 服务可能不可用，将只生成静态 sitemap')
    }
  } catch (e) {
    console.log('⚠️ 无法连接 API 服务，将只生成静态 sitemap')
  }
  
  // 生成文件
  const count = await generateSitemap()
  generateRobots()
  
  console.log('\n╔═══════════════════════════════════════════════════════════════╗')
  console.log('║                   SEO 文件生成完成!                           ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝')
  console.log(`\n📋 下一步:`)
  console.log('1. 检查生成的 sitemap.xml 和 robots.txt')
  console.log('2. 提交到 Git 并部署')
  console.log('3. 在 Google Search Console 提交 sitemap')
}

main().catch(console.error)
