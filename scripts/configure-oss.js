/**
 * 阿里云 OSS CORS + Referer 配置脚本
 * 
 * 功能：
 * 1. 配置跨域规则 (CORS)
 * 2. 配置防盗链规则 (Referer)
 * 
 * 使用方法：
 *   1. 安装依赖: npm install ali-oss
 *   2. 设置环境变量或直接填入配置
 *   3. 运行: node scripts/configure-oss.js
 * 
 * 环境变量：
 *   ALIYUN_ACCESS_KEY_ID
 *   ALIYUN_ACCESS_KEY_SECRET
 *   OSS_BUCKET_NAME
 *   OSS_REGION (默认: oss-cn-hangzhou)
 */

import OSS from 'ali-oss'

// ============================================
// 配置
// ============================================

const config = {
  // 阿里云凭证 (建议使用环境变量)
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || '',
  
  // OSS 配置
  bucket: process.env.OSS_BUCKET_NAME || 'lvzhi-assets',
  region: process.env.OSS_REGION || 'oss-cn-hangzhou',
  
  // 允许的来源 (网站域名)
  allowedOrigins: [
    'https://www.lvxzhi.com',
    'https://lvxzhi.com',
    'http://localhost:3000',  // 开发环境
    'http://localhost:3001',  // 开发环境 API
  ],
  
  // 防盗链白名单
  refererWhitelist: [
    'lvxzhi.com',
    'www.lvxzhi.com',
  ],
  
  // 是否允许空 Referer
  allowEmptyReferer: false,
}

// ============================================
// CORS 配置
// ============================================

const corsRules = [
  {
    allowedOrigin: '*',  // 生产环境应改为具体域名
    allowedMethod: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
    allowedHeader: ['*'],
    exposeHeader: ['ETag', 'Content-Length', 'x-oss-request-id'],
    maxAgeSeconds: 3600,
  },
]

// ============================================
// 创建 OSS 客户端
// ============================================

function createClient() {
  if (!config.accessKeyId || !config.accessKeySecret) {
    console.error('❌ 错误: 请设置 ALIYUN_ACCESS_KEY_ID 和 ALIYUN_ACCESS_KEY_SECRET 环境变量')
    console.log('\n或者直接在脚本中修改 config 对象')
    process.exit(1)
  }
  
  return new OSS({
    region: config.region,
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    bucket: config.bucket,
  })
}

// ============================================
// 配置 CORS
// ============================================

async function configureCORS(client) {
  console.log('\n🔧 配置 CORS 跨域规则...')
  
  try {
    // 获取现有 CORS 规则
    const existingRules = await client.getBucketCORS(config.bucket)
    console.log('  现有 CORS 规则:', JSON.stringify(existingRules, null, 2))
  } catch (e) {
    // CORS 可能未配置
  }
  
  try {
    // 设置 CORS 规则
    await client.putBucketCORS(config.bucket, corsRules)
    console.log('  ✅ CORS 配置成功')
    
    // 显示配置
    console.log('\n📋 CORS 配置内容:')
    console.log(JSON.stringify(corsRules, null, 2))
    
  } catch (e) {
    if (e.name === 'AccessDenied') {
      console.error('  ❌ 权限不足，请确保 IAM 用户有以下权限:')
      console.error('     - oss:PutBucketCORS')
      console.error('     - oss:GetBucketCORS')
    }
    throw e
  }
}

// ============================================
// 配置防盗链
// ============================================

async function configureReferer(client) {
  console.log('\n🔒 配置防盗链规则...')
  
  const refererConfig = {
    RefererList: {
      Referer: config.refererWhitelist,
    },
    AllowEmptyReferer: config.allowEmptyReferer,
  }
  
  try {
    // 设置防盗链规则
    await client.putBucketReferer(config.bucket, refererConfig)
    console.log('  ✅ 防盗链配置成功')
    
    // 显示配置
    console.log('\n📋 防盗链配置内容:')
    console.log(JSON.stringify(refererConfig, null, 2))
    
  } catch (e) {
    if (e.name === 'AccessDenied') {
      console.error('  ❌ 权限不足，请确保 IAM 用户有以下权限:')
      console.error('     - oss:PutBucketReferer')
      console.error('     - oss:GetBucketReferer')
    }
    throw e
  }
}

// ============================================
// 验证配置
// ============================================

async function verifyConfiguration(client) {
  console.log('\n🔍 验证配置...')
  
  try {
    // 验证 CORS
    const cors = await client.getBucketCORS(config.bucket)
    console.log('  ✅ CORS 已配置:')
    console.log('    允许来源:', cors.map(r => r.allowedOrigin).join(', '))
    
    // 验证防盗链
    const referer = await client.getBucketReferer(config.bucket)
    console.log('  ✅ 防盗链已配置:')
    console.log('    白名单:', referer.RefererList.Referer.join(', '))
    console.log('    允许空 Referer:', referer.AllowEmptyReferer ? '是' : '否')
    
  } catch (e) {
    console.error('  ⚠️ 验证失败:', e.message)
  }
}

// ============================================
// 手动配置指南
// ============================================

function showManualGuide() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           手动配置指南 (如果脚本执行失败)                   ║
╚═══════════════════════════════════════════════════════════════╝

## 1. CORS 跨域配置 (阿里云控制台)

1. 登录阿里云 OSS 控制台
2. 选择 Bucket → 数据安全 → 跨域设置
3. 创建规则：
   - 来源: https://www.lvxzhi.com, https://lvxzhi.com, http://localhost:3000
   - 允许 Methods: GET, POST, PUT, DELETE, HEAD
   - 允许 Headers: *
   - 暴露 Headers: ETag, Content-Length, x-oss-request-id
   - 缓存时间: 3600

## 2. 防盗链配置 (阿里云控制台)

1. 登录阿里云 OSS 控制台
2. 选择 Bucket → 数据安全 → 防盗链
3. 配置：
   - Referer: https://www.lvxzhi.com, https://lvxzhi.com
   - 允许空 Referer: 否

## 3. Bucket 权限设置

1. 选择 Bucket → 基础设置 → 权限管理
2. 设置为"公共读"或配置 RAM 策略
`)
}

// ============================================
// 主函数
// ============================================

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║           阿里云 OSS 配置脚本                              ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝')
  console.log(`\nBucket: ${config.bucket}`)
  console.log(`Region: ${config.region}`)
  
  // 检查凭证
  if (!config.accessKeyId || !config.accessKeySecret) {
    console.log('\n⚠️ 未设置阿里云凭证，显示手动配置指南...\n')
    showManualGuide()
    return
  }
  
  try {
    const client = createClient()
    
    // 配置 CORS
    await configureCORS(client)
    
    // 配置防盗链
    await configureReferer(client)
    
    // 验证
    await verifyConfiguration(client)
    
    console.log('\n╔═══════════════════════════════════════════════════════════════╗')
    console.log('║                   配置完成!                                ║')
    console.log('╚═══════════════════════════════════════════════════════════════╝')
    
  } catch (e) {
    console.error('\n❌ 配置失败:', e.message)
    console.log('\n显示手动配置指南...\n')
    showManualGuide()
    process.exit(1)
  }
}

main()
