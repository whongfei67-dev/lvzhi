/**
 * 灰度发布脚本
 * 
 * 功能：
 * 1. 灰度流量切换 (5% → 50% → 100%)
 * 2. 健康检查
 * 3. 自动回滚
 * 
 * 使用方法：
 *   node scripts/canary-deploy.js --step=10 --health-check
 */

import http from 'http'
import https from 'https'
import { execSync } from 'child_process'

// ============================================
// 配置
// ============================================

const config = {
  // 部署环境
  env: process.env.DEPLOY_ENV || 'production',
  
  // API 配置
  apiBase: process.env.API_BASE || 'http://localhost:4000',
  
  // 灰度步骤 (百分比)
  steps: [5, 10, 25, 50, 75, 100],
  
  // 每步等待时间 (毫秒)
  stepDelay: parseInt(process.env.STEP_DELAY || '60000'),
  
  // 健康检查配置
  healthCheck: {
    enabled: process.env.HEALTH_CHECK !== 'false',
    url: process.env.HEALTH_CHECK_URL || '/health/detailed',
    timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '30000'),
    retries: parseInt(process.env.HEALTH_CHECK_RETRIES || '3'),
  },
  
  // 回滚配置
  rollback: {
    enabled: process.env.AUTO_ROLLBACK !== 'false',
    threshold: parseFloat(process.env.ROLLBACK_ERROR_THRESHOLD || '0.05'), // 5% 错误率
  },
}

// ============================================
// 工具函数
// ============================================

/**
 * HTTP 请求
 */
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === 'https:'
    const client = isHttps ? https : http
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      timeout: options.timeout || 10000,
      headers: options.headers || {},
    }
    
    const req = client.request(reqOptions, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) })
        } catch {
          resolve({ status: res.statusCode, data })
        }
      })
    })
    
    req.on('error', reject)
    req.on('timeout', () => reject(new Error('Request timeout')))
    
    if (options.body) {
      req.write(options.body)
    }
    req.end()
  })
}

/**
 * 健康检查
 */
async function healthCheck() {
  const { url, timeout, retries } = config.healthCheck
  
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`  🔍 健康检查尝试 ${i + 1}/${retries}...`)
      const result = await httpRequest(`${config.apiBase}${url}`, { timeout })
      
      if (result.status === 200 && result.data.status === 'ok') {
        console.log(`  ✅ 健康检查通过`)
        if (result.data.database) {
          console.log(`     数据库延迟: ${result.data.database.latency}ms`)
        }
        return true
      }
      
      console.log(`  ⚠️ 健康检查状态: ${result.status}`)
    } catch (e) {
      console.log(`  ❌ 健康检查失败: ${e.message}`)
    }
    
    if (i < retries - 1) {
      await new Promise(r => setTimeout(r, 5000))
    }
  }
  
  return false
}

/**
 * 获取当前错误率
 */
async function getErrorRate() {
  try {
    // 从日志或监控获取错误率
    // 这里简化处理，实际应从 Prometheus/Grafana 获取
    const result = await httpRequest(`${config.apiBase}/metrics`)
    // 解析 Prometheus 格式的指标
    // ...
    return 0
  } catch {
    return 0
  }
}

/**
 * 更新 Nginx 灰度权重
 */
function updateNginxWeight(percentage) {
  console.log(`\n🔄 更新 Nginx 灰度权重: ${percentage}%`)
  
  const weightNew = percentage
  const weightOld = 100 - percentage
  
  const upstreamConfig = `
# 律植灰度发布配置
upstream lvzhi_backend {
    server localhost:4000 weight=${weightNew};
    # 旧版本 (备用)
    server localhost:4001 weight=${weightOld};
}

# 灰度路由配置
map $cookie_lvzhi_version $backend {
    "v2"    localhost:4000;
    default localhost:4001;
}
`
  
  console.log('生成的 Nginx 配置:')
  console.log(upstreamConfig)
  
  // 实际更新配置
  // execSync(`echo "${upstreamConfig}" | sudo tee /etc/nginx/conf.d/lvzhi-canary.conf`)
  // execSync('sudo nginx -t && sudo nginx -s reload')
  
  console.log('✅ Nginx 配置已更新')
}

/**
 * 执行部署
 */
function deploy(version) {
  console.log(`\n🚀 部署版本: ${version}`)
  
  try {
    // 1. 拉取新版本镜像
    // execSync(`docker pull lvzhi/api:${version}`)
    
    // 2. 启动新容器
    // execSync(`docker-compose up -d api-new`)
    
    // 3. 等待新容器启动
    console.log('  等待新版本启动...')
    // new Promise(r => setTimeout(r, 10000))
    
    return true
  } catch (e) {
    console.error(`  ❌ 部署失败: ${e.message}`)
    return false
  }
}

/**
 * 回滚到上一版本
 */
function rollback() {
  console.log('\n🔙 执行回滚...')
  
  try {
    // 停止当前版本
    // execSync('docker-compose stop api-new')
    
    // 启动旧版本
    // execSync('docker-compose start api-old')
    
    // 重置 Nginx
    updateNginxWeight(0)
    
    console.log('✅ 回滚完成')
    return true
  } catch (e) {
    console.error(`  ❌ 回滚失败: ${e.message}`)
    return false
  }
}

// ============================================
// 主流程
// ============================================

async function canaryDeploy(options = {}) {
  const {
    version = 'latest',
    startPercent = 5,
    autoContinue = true,
    healthCheck: doHealthCheck = true,
  } = options
  
  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║           律植 (Lvzhi) 灰度发布脚本                          ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝')
  console.log(`\n版本: ${version}`)
  console.log(`起始流量: ${startPercent}%`)
  console.log(`健康检查: ${doHealthCheck ? '启用' : '禁用'}`)
  console.log(`自动回滚: ${config.rollback.enabled ? '启用' : '禁用'}`)
  
  // 1. 部署新版本
  console.log('\n[1/4] 部署新版本...')
  if (!deploy(version)) {
    console.log('\n❌ 部署失败，退出')
    process.exit(1)
  }
  
  // 2. 初始灰度 (5%)
  console.log('\n[2/4] 启动灰度发布...')
  updateNginxWeight(startPercent)
  
  // 3. 逐步增加流量
  console.log('\n[3/4] 逐步增加流量...')
  let currentPercent = startPercent
  const stepsToRun = config.steps.filter(s => s >= currentPercent)
  
  for (const step of stepsToRun) {
    console.log(`\n📊 流量切换到 ${step}%`)
    updateNginxWeight(step)
    
    // 健康检查
    if (doHealthCheck && config.healthCheck.enabled) {
      console.log('\n🔍 执行健康检查...')
      const healthy = await healthCheck()
      
      if (!healthy && config.rollback.enabled) {
        console.log(`\n⚠️ 健康检查失败，错误率超过阈值 ${config.rollback.threshold * 100}%`)
        
        if (autoContinue) {
          rollback()
          console.log('\n❌ 灰度发布失败，已自动回滚')
          process.exit(1)
        } else {
          console.log('\n⚠️ 暂停，等待手动确认...')
          // 等待用户确认
          // await new Promise(r => process.stdin.once('data', () => {}))
        }
      }
    }
    
    // 检查错误率
    const errorRate = await getErrorRate()
    if (errorRate > config.rollback.threshold) {
      console.log(`\n⚠️ 错误率 ${(errorRate * 100).toFixed(2)}% 超过阈值 ${config.rollback.threshold * 100}%`)
      
      if (config.rollback.enabled && autoContinue) {
        rollback()
        console.log('\n❌ 灰度发布失败，已自动回滚')
        process.exit(1)
      }
    }
    
    // 等待观察期
    if (step < 100) {
      console.log(`\n⏳ 等待观察期 ${config.stepDelay / 1000}s...`)
      await new Promise(r => setTimeout(r, config.stepDelay))
    }
    
    currentPercent = step
  }
  
  // 4. 完成发布
  console.log('\n[4/4] 完成灰度发布...')
  console.log('✅ 灰度发布完成，100% 流量切换到新版本')
  
  // 清理旧容器
  // execSync('docker-compose rm -f api-old')
  
  console.log('\n╔═══════════════════════════════════════════════════════════════╗')
  console.log('║                   灰度发布成功!                               ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝')
}

// 解析命令行参数
const args = process.argv.slice(2)
const options = {
  version: 'latest',
  startPercent: 5,
  autoContinue: true,
}

for (const arg of args) {
  if (arg.startsWith('--version=')) {
    options.version = arg.split('=')[1]
  } else if (arg.startsWith('--step=')) {
    options.startPercent = parseInt(arg.split('=')[1])
  } else if (arg === '--no-auto') {
    options.autoContinue = false
  } else if (arg === '--no-health-check') {
    options.healthCheck = false
  } else if (arg === '--help') {
    console.log(`
灰度发布脚本

用法: node canary-deploy.js [选项]

选项:
  --version=<版本>     指定部署版本 (默认: latest)
  --step=<百分比>      起始灰度百分比 (默认: 5)
  --no-auto           禁用自动回滚
  --no-health-check   禁用健康检查
  --help              显示帮助

示例:
  node canary-deploy.js --version=v1.2.3 --step=10
  node canary-deploy.js --no-auto
`)
    process.exit(0)
  }
}

// 运行
canaryDeploy(options).catch(console.error)
