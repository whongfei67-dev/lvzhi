/**
 * 上线发布检查清单
 *
 * 用于验证上线前的各项准备工作
 *
 * 使用方法：
 *   npm run deploy:check
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// ============================================
// 配置
// ============================================

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}

interface ChecklistItem {
  id: string
  category: string
  title: string
  description: string
  status: 'pending' | 'checked' | 'na'
  verified?: boolean
  notes?: string
}

interface ChecklistCategory {
  name: string
  items: ChecklistItem[]
}

// ============================================
// 检查清单定义
// ============================================

const checklist: ChecklistCategory[] = [
  {
    name: '📋 代码检查',
    items: [
      {
        id: 'code-1',
        category: '代码检查',
        title: '代码已提交 Git',
        description: '所有更改已提交并推送到远程仓库',
        status: 'pending',
      },
      {
        id: 'code-2',
        category: '代码检查',
        title: '敏感信息已清理',
        description: '.env 文件未提交，API 密钥已从代码中移除',
        status: 'pending',
      },
      {
        id: 'code-3',
        category: '代码检查',
        title: 'DEBUG 日志已关闭',
        description: '生产环境不应有 console.log/DEBUG',
        status: 'pending',
      },
      {
        id: 'code-4',
        category: '代码检查',
        title: 'TypeScript 编译通过',
        description: '无编译错误和警告',
        status: 'pending',
      },
    ],
  },
  {
    name: '🔐 安全配置',
    items: [
      {
        id: 'sec-1',
        category: '安全配置',
        title: 'HTTPS 已启用',
        description: '所有流量通过 HTTPS',
        status: 'pending',
      },
      {
        id: 'sec-2',
        category: '安全配置',
        title: '支付密钥已配置',
        description: '支付宝/微信支付正式商户号已配置',
        status: 'pending',
      },
      {
        id: 'sec-3',
        category: '安全配置',
        title: 'AI API 密钥已配置',
        description: '智谱AI/通义千问/文心一言密钥已配置',
        status: 'pending',
      },
      {
        id: 'sec-4',
        category: '安全配置',
        title: '数据库连接加密',
        description: '生产数据库连接使用 SSL',
        status: 'pending',
      },
      {
        id: 'sec-5',
        category: '安全配置',
        title: 'CORS 配置正确',
        description: '只允许白名单域名',
        status: 'pending',
      },
    ],
  },
  {
    name: '🗄️ 数据库',
    items: [
      {
        id: 'db-1',
        category: '数据库',
        title: '数据库已迁移',
        description: '所有迁移文件已在生产数据库执行',
        status: 'pending',
      },
      {
        id: 'db-2',
        category: '数据库',
        title: '数据已备份',
        description: '上线前已创建完整数据库备份',
        status: 'pending',
      },
      {
        id: 'db-3',
        category: '数据库',
        title: '索引已创建',
        description: '关键查询字段已建索引',
        status: 'pending',
      },
      {
        id: 'db-4',
        category: '数据库',
        title: 'RLS 策略已验证',
        description: '行级安全策略已测试',
        status: 'pending',
      },
    ],
  },
  {
    name: '☁️ 基础设施',
    items: [
      {
        id: 'infra-1',
        category: '基础设施',
        title: '域名已备案',
        description: 'ICP 备案已完成',
        status: 'pending',
      },
      {
        id: 'infra-2',
        category: '基础设施',
        title: 'CDN 已配置',
        description: '静态资源通过 CDN 加速',
        status: 'pending',
      },
      {
        id: 'infra-3',
        category: '基础设施',
        title: 'SSL 证书有效',
        description: 'HTTPS 证书未过期',
        status: 'pending',
      },
      {
        id: 'infra-4',
        category: '基础设施',
        title: 'DNS 已配置',
        description: '域名正确解析到服务器',
        status: 'pending',
      },
    ],
  },
  {
    name: '📊 监控告警',
    items: [
      {
        id: 'mon-1',
        category: '监控告警',
        title: '监控已启用',
        description: 'Prometheus/Grafana 或阿里云 ARMS',
        status: 'pending',
      },
      {
        id: 'mon-2',
        category: '监控告警',
        title: '告警规则已配置',
        description: '错误率、延迟、可用性告警',
        status: 'pending',
      },
      {
        id: 'mon-3',
        category: '监控告警',
        title: '通知渠道已测试',
        description: '邮件/钉钉/Slack 通知已验证',
        status: 'pending',
      },
      {
        id: 'mon-4',
        category: '监控告警',
        title: '日志收集正常',
        description: '结构化日志已发送到日志服务',
        status: 'pending',
      },
    ],
  },
  {
    name: '🚀 部署验证',
    items: [
      {
        id: 'deploy-1',
        category: '部署验证',
        title: 'Docker 镜像构建成功',
        description: '生产镜像无错误构建',
        status: 'pending',
      },
      {
        id: 'deploy-2',
        category: '部署验证',
        title: '容器健康检查通过',
        description: '所有容器状态为 healthy',
        status: 'pending',
      },
      {
        id: 'deploy-3',
        category: '部署验证',
        title: '灰度发布已准备',
        description: '先发布 10% 流量',
        status: 'pending',
      },
      {
        id: 'deploy-4',
        category: '部署验证',
        title: '回滚方案已就绪',
        description: '可快速回滚到上一版本',
        status: 'pending',
      },
    ],
  },
  {
    name: '🧪 功能验证',
    items: [
      {
        id: 'func-1',
        category: '功能验证',
        title: '用户注册/登录',
        description: '邮箱、手机号、微信、支付宝登录',
        status: 'pending',
      },
      {
        id: 'func-2',
        category: '功能验证',
        title: 'AI 对话',
        description: '智能体对话正常扣费',
        status: 'pending',
      },
      {
        id: 'func-3',
        category: '功能验证',
        title: '支付流程',
        description: '充值、支付回调正常',
        status: 'pending',
      },
      {
        id: 'func-4',
        category: '功能验证',
        title: '文件上传',
        description: 'OSS 上传/下载正常',
        status: 'pending',
      },
      {
        id: 'func-5',
        category: '功能验证',
        title: '移动端适配',
        description: 'iOS/Android 浏览器测试',
        status: 'pending',
      },
    ],
  },
  {
    name: '👥 团队准备',
    items: [
      {
        id: 'team-1',
        category: '团队准备',
        title: '值班人员已安排',
        description: '上线后 24 小时值班',
        status: 'pending',
      },
      {
        id: 'team-2',
        category: '团队准备',
        title: '应急响应流程已熟悉',
        description: '故障处理流程已文档化',
        status: 'pending',
      },
      {
        id: 'team-3',
        category: '团队准备',
        title: '联系方式已共享',
        description: '核心人员联系方式已更新',
        status: 'pending',
      },
    ],
  },
]

// ============================================
// 检查函数
// ============================================

function checkGitStatus(): Promise<boolean> {
  return new Promise((resolve) => {
    const { execSync } = require('child_process')
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf-8' })
      resolve(status.trim() === '')
    } catch {
      resolve(false)
    }
  })
}

function checkEnvFiles(): Promise<{ envExists: boolean; env.exampleExists: boolean }> {
  return new Promise((resolve) => {
    try {
      const envExists = fs.existsSync(path.join(process.cwd(), '.env'))
      const envExampleExists = fs.existsSync(path.join(process.cwd(), '.env.example'))
      resolve({ envExists, envExampleExists })
    } catch {
      resolve({ envExists: false, envExampleExists: false })
    }
  })
}

function checkSSL(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const httpsConfig = fs.readFileSync(
        path.join(process.cwd(), 'apps/api/src/index.ts'),
        'utf-8'
      )
      resolve(httpsConfig.includes('https') || httpsConfig.includes('TLS'))
    } catch {
      resolve(false)
    }
  })
}

async function autoCheckItems(): Promise<Map<string, { status: 'checked' | 'na'; verified: boolean; notes?: string }>> {
  const results = new Map()

  // 代码检查
  const gitClean = await checkGitStatus()
  results.set('code-1', {
    status: 'checked',
    verified: gitClean,
    notes: gitClean ? 'Git 工作区干净' : '有未提交的更改',
  })

  const { envExists, envExampleExists } = await checkEnvFiles()
  results.set('code-2', {
    status: 'checked',
    verified: !envExists || envExampleExists,
    notes: envExists ? '⚠️ .env 文件存在（应加入 .gitignore）' : '.env 未提交到 Git',
  })

  // SSL 检查
  const hasSSL = await checkSSL()
  results.set('sec-1', {
    status: 'checked',
    verified: hasSSL,
    notes: hasSSL ? '已配置 HTTPS' : '未检测到 SSL 配置（可能在 Nginx 层配置）',
  })

  return results
}

// ============================================
// 交互式检查
// ============================================

function promptUser(): Promise<void> {
  return new Promise((resolve) => {
    console.log(`\n${colors.bold}请逐项确认检查清单${colors.reset}`)
    console.log('按 y 标记为通过，按 n 标记为未通过，按 s 跳过\n')

    let itemIndex = 0
    const allItems = checklist.flatMap(cat => cat.items)

    function promptNext() {
      if (itemIndex >= allItems.length) {
        resolve()
        return
      }

      const item = allItems[itemIndex]
      console.log(`[${itemIndex + 1}/${allItems.length}] ${item.title}`)
      console.log(`    ${item.description}`)

      process.stdin.resume()
      process.stdin.once('data', (data) => {
        const input = data.toString().trim().toLowerCase()
        process.stdin.pause()

        if (input === 's') {
          item.status = 'na'
          console.log(`    ${colors.yellow}跳过${colors.reset}\n`)
        } else if (input === 'y' || input === '') {
          item.status = 'checked'
          item.verified = true
          console.log(`    ${colors.green}✓ 通过${colors.reset}\n`)
        } else if (input === 'n') {
          item.status = 'pending'
          item.verified = false
          console.log(`    ${colors.red}✗ 未通过${colors.reset}\n`)
        } else {
          console.log(`    ${colors.yellow}无效输入，重新输入${colors.reset}\n`)
          promptNext()
          return
        }

        itemIndex++
        promptNext()
      })
    }

    promptNext()
  })
}

// ============================================
// 生成报告
// ============================================

function generateReport(): void {
  console.log(`\n${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
  console.log(`${colors.bold}上线检查报告${colors.reset}\n`)

  const allItems = checklist.flatMap(cat => cat.items)
  const passed = allItems.filter(i => i.verified === true).length
  const failed = allItems.filter(i => i.verified === false).length
  const skipped = allItems.filter(i => i.status === 'na').length

  // 按类别统计
  for (const category of checklist) {
    const catPassed = category.items.filter(i => i.verified === true).length
    const catTotal = category.items.length
    const catStatus = catPassed === catTotal ? colors.green : catPassed > 0 ? colors.yellow : colors.red

    console.log(`${colors.bold}${category.name}${colors.reset}`)
    console.log(`${catStatus}进度: ${catPassed}/${catTotal} 通过${colors.reset}`)

    for (const item of category.items) {
      if (item.verified === true) {
        console.log(`  ${colors.green}✓${colors.reset} ${item.title}`)
      } else if (item.verified === false) {
        console.log(`  ${colors.red}✗${colors.reset} ${item.title}`)
        if (item.notes) {
          console.log(`      ${colors.yellow}${item.notes}${colors.reset}`)
        }
      } else if (item.status === 'na') {
        console.log(`  ${colors.yellow}○${colors.reset} ${item.title} (跳过)`)
      } else {
        console.log(`  ${colors.gray}?${colors.reset} ${item.title}`)
      }
    }
    console.log()
  }

  console.log(`${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
  console.log(`${colors.bold}总结${colors.reset}\n`)
  console.log(`通过: ${colors.green}${passed}${colors.reset}`)
  console.log(`未通过: ${failed > 0 ? colors.red : ''}${failed}${colors.reset}`)
  console.log(`跳过: ${colors.yellow}${skipped}${colors.reset}`)

  const total = passed + failed
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0'
  console.log(`\n通过率: ${parseFloat(passRate) >= 80 ? colors.green : colors.yellow}${passRate}%${colors.reset}`)

  if (failed === 0) {
    console.log(`\n${colors.green}${colors.bold}🎉 所有检查项已通过，可以上线！${colors.reset}\n`)
  } else if (parseFloat(passRate) >= 80) {
    console.log(`\n${colors.yellow}${colors.bold}⚠️ 大部分检查项已通过，请修复失败的项后再上线${colors.reset}\n`)
  } else {
    console.log(`\n${colors.red}${colors.bold}❌ 检查项通过率较低，建议修复后再上线${colors.reset}\n`)
  }
}

// ============================================
// 主函数
// ============================================

async function main() {
  console.log(`
${colors.bold}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   律植 (Lvzhi) 上线前检查清单                                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}
  `)

  // 自动检查部分项目
  console.log('正在进行自动检查...\n')
  const autoResults = await autoCheckItems()

  // 应用自动检查结果
  for (const [itemId, result] of autoResults) {
    const item = checklist
      .flatMap(c => c.items)
      .find(i => i.id === itemId)

    if (item) {
      item.status = result.status
      item.verified = result.verified
      item.notes = result.notes
    }
  }

  // 交互式检查其余项目
  const args = process.argv.slice(2)
  if (!args.includes('--auto')) {
    await promptUser()
  }

  // 生成报告
  generateReport()

  // 保存报告
  const reportPath = path.join(process.cwd(), 'deploy', 'launch-checklist-report.json')
  fs.mkdirSync(path.dirname(reportPath), { recursive: true })
  fs.writeFileSync(reportPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    checklist: checklist.map(cat => ({
      name: cat.name,
      items: cat.items.map(item => ({
        id: item.id,
        title: item.title,
        status: item.status,
        verified: item.verified,
        notes: item.notes,
      })),
    })),
  }, null, 2))

  console.log(`报告已保存到: ${reportPath}`)
}

main().catch(console.error)
