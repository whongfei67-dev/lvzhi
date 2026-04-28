/**
 * 律植 (Lvzhi) API 服务入口
 */

import './load-workspace-root-env.js'

import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import multipart from '@fastify/multipart'

// 类型扩展声明（必须在其他导入之前）
import './fastify-types.js'

import authPlugin from './plugins/auth.js'

// 路由
import { healthRoute } from './routes/health.js'
import { authRoute } from './routes/auth.js'
import { agentsRoute } from './routes/agents.js'
import { communityRoute } from './routes/community.js'
import { uploadRoute } from './routes/upload.js'
import { downloadRoute } from './routes/download.js'
import { balanceRoute, orderRoute } from './routes/balance.js'
import { aiRoute } from './routes/ai.js'
import { asyncAiRoute } from './routes/async-ai.js'
import { usersRoutes } from './routes/users.js'
import { ossRoute } from './routes/oss.js'
import { websocketRoute } from './routes/websocket.js'
import { registerMetricsRoutes } from './routes/metrics.js'
import { dataRoute } from './routes/data.js'
import { skillsRoute } from './routes/skills.js'
import { trialsRoute } from './routes/trials.js'
import { ipRoute } from './routes/ip.js'
import { verificationRoute } from './routes/verification.js'
import { adminRoute } from './routes/admin.js'
import { opportunitiesRoute } from './routes/opportunities.js'
import { invitationsRoute } from './routes/invitations.js'
import { workspaceRoute } from './routes/workspace.js'
import { creatorRoute } from './routes/creator.js'
import { lawyersRoute } from './routes/lawyers.js'
import { notificationsRoute } from './routes/notifications.js'

// 安全中间件
import { csrfProtection, ipFilter, botDetection } from './middleware/security.js'

// 创建 Fastify 实例
const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty' }
      : undefined,
  },
})

// ============================================
// 全局中间件和插件
// ============================================

// 安全头
await app.register(helmet, {
  contentSecurityPolicy: false,
})

// CORS（开发环境在 WEB_URL 基础上补充 127.0.0.1，与 CSRF 白名单一致）
await app.register(cors, {
  origin: process.env.WEB_URL
    ? (() => {
        const base = process.env.WEB_URL.split(',').map((url) => url.trim())
        const extras =
          process.env.NODE_ENV === 'production'
            ? []
            : [
                'http://127.0.0.1:3000',
                'http://127.0.0.1:3001',
                'http://127.0.0.1:3100',
                'http://127.0.0.1:3101',
                'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:3100',
                'http://localhost:3101',
              ]
        return [...new Set([...base, ...extras])]
      })()
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        'http://localhost:3100',
        'http://127.0.0.1:3100',
        'http://localhost:3101',
        'http://127.0.0.1:3101',
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Total-Pages'],
})

import { SENSITIVE_ROUTE_LIMITS } from './middleware/security.js'

// ============================================
// 速率限制配置
// ============================================

// 辅助函数：根据路径匹配敏感路由限制
function getSensitiveRouteLimit(url: string): { max: number; timeWindow: string } | null {
  for (const [path, limit] of Object.entries(SENSITIVE_ROUTE_LIMITS)) {
    if (url.startsWith(path)) {
      return limit
    }
  }
  return null
}

await app.register(rateLimit, {
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  timeWindow: '1 minute',
  errorResponseBuilder: (request, context) => ({
    code: 429,
    message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
  }),
  keyGenerator: (request) => {
    return request.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()
      || request.headers['x-real-ip']?.toString()
      || request.ip
  },
  onExceeding: (request, key) => {
    request.log.warn({ key, url: request.url }, 'Approaching rate limit')
  },
  onExceeded: (request, key) => {
    request.log.warn({ key, url: request.url }, 'Rate limit exceeded')
  },
})

// 文件上传支持
await app.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1,
  },
})

// Cookie 解析（JWT 从 httpOnly Cookie 读取时需要）
await app.register(cookie)

// JWT 认证插件（为 app.authenticate / app.authorize 提供实现）
await app.register(authPlugin)

// 请求日志
app.addHook('onRequest', async (request) => {
  const start = Date.now()
  ;(request as unknown as Record<string, unknown>).startTime = start
})

app.addHook('onResponse', async (request, reply) => {
  const req = request as unknown as Record<string, unknown>
  const startTime = req.startTime as number | undefined
  const duration = Date.now() - (startTime || Date.now())
  request.log.info({
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    duration: `${duration}ms`,
    ip: request.ip,
  })
})

// ============================================
// 安全中间件
// ============================================

// IP 黑名单/白名单过滤
await ipFilter(app)

// CSRF 防护（Origin/Referer 检查）
await csrfProtection(app)

// Bot 检测
await botDetection(app)

// ============================================
// AI 服务初始化
// ============================================

import { initAIService } from './ai/index.js'

const aiConfig = {
  providers: [
    ...(process.env.MINIMAX_API_KEY ? [{
      type: 'minimax' as const,
      apiKey: process.env.MINIMAX_API_KEY,
      baseUrl: process.env.MINIMAX_API_BASE,
      timeout: 60000,
    }] : []),
    ...(process.env.ZHIPU_API_KEY ? [{
      type: 'zhipu' as const,
      apiKey: process.env.ZHIPU_API_KEY,
      timeout: 60000,
    }] : []),
    ...(process.env.DASHSCOPE_API_KEY ? [{
      type: 'dashscope' as const,
      apiKey: process.env.DASHSCOPE_API_KEY,
      timeout: 60000,
    }] : []),
    ...(process.env.WENXIN_API_KEY && process.env.WENXIN_SECRET_KEY ? [{
      type: 'wenxin' as const,
      apiKey: process.env.WENXIN_API_KEY,
      secretKey: process.env.WENXIN_SECRET_KEY,
      timeout: 60000,
    }] : []),
    ...(process.env.OPENAI_API_KEY ? [{
      type: 'openai' as const,
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: process.env.OPENAI_BASE_URL,
      timeout: 60000,
    }] : []),
  ],
  defaultProvider: (process.env.DEFAULT_AI_PROVIDER || 'minimax') as 'minimax' | 'zhipu' | 'dashscope' | 'wenxin' | 'openai',
  enableFallback: true,
  costLimitPerUser: 100, // 每日限额
}

if (aiConfig.providers.length > 0) {
  initAIService(aiConfig)
  app.log.info(`AI 服务初始化完成，共 ${aiConfig.providers.length} 个 Provider`)
} else {
  app.log.warn('未配置任何 AI Provider，AI 功能将不可用')
}

// ============================================
// 注册路由
// ============================================

// 健康检查（无前缀）
await app.register(healthRoute)

// 认证相关
await app.register(authRoute)

// 智能体相关
await app.register(agentsRoute)

// 社区相关
await app.register(communityRoute)

// 文件上传
await app.register(uploadRoute)

// 余额与订单
await app.register(balanceRoute)
await app.register(orderRoute)

// AI 对话
await app.register(aiRoute)

// 异步 AI 对话（队列削峰）
await app.register(asyncAiRoute)

// 用户/律师相关
await app.register(usersRoutes)

// OSS 存储相关（前端直传凭证）
await app.register(ossRoute)

// WebSocket 实时通知
await app.register(websocketRoute)

// 监控指标端点（Prometheus 采集）
await registerMetricsRoutes(app)

// 数据路由（支持前端的数据查询）
await app.register(dataRoute)

// Skills 和邀请路由
await app.register(skillsRoute)

// 试用邀请路由
await app.register(trialsRoute)

// 知识产权保护路由
await app.register(ipRoute)

// 创作者认证路由
await app.register(verificationRoute)

// 管理后台路由
await app.register(adminRoute)

// 新增路由
await app.register(opportunitiesRoute)
await app.register(invitationsRoute)
await app.register(workspaceRoute)
await app.register(creatorRoute)
await app.register(lawyersRoute)
await app.register(notificationsRoute)

// ============================================
// 全局错误处理
// ============================================

// 404 处理
app.setNotFoundHandler((request, reply) => {
  reply.status(404).send({
    code: 404,
    message: `Route ${request.method} ${request.url} not found`,
  })
})

// 错误处理（生产环境不暴露堆栈）
app.setErrorHandler((error, request, reply) => {
  // 记录错误日志
  request.log.error({
    err: error,
    method: request.method,
    url: request.url,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
  })

  // 验证错误
  if (error.validation) {
    return reply.status(400).send({
      code: 400,
      message: 'Invalid request parameters',
      errors: error.validation,
    })
  }

  // 速率限制错误
  if (error.statusCode === 429) {
    return reply.status(429).send({
      code: 429,
      message: 'Too many requests, please try again later',
    })
  }

  // JWT 错误
  if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER' ||
      error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
    return reply.status(401).send({
      code: 401,
      message: 'Invalid or missing authorization token',
    })
  }

  // 文件上传错误
  if (error.code === 'FST_REQ_FILE_TOO_LARGE') {
    return reply.status(413).send({
      code: 413,
      message: 'File size exceeds limit (max 50MB)',
    })
  }

  // 未知错误 - 生产环境返回通用错误消息
  const statusCode = error.statusCode || 500
  const isProduction = process.env.NODE_ENV === 'production'

  return reply.status(statusCode).send({
    code: statusCode,
    message: isProduction
      ? 'Internal server error'
      : error.message,
    ...(isProduction && statusCode === 500 ? { errorId: request.id } : {}),
  })
})

// ============================================
// 启动服务器
// ============================================

const port = Number(process.env.PORT ?? 4000)
const host = process.env.HOST || '0.0.0.0'

try {
  await app.listen({ port, host })
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 律植 API 服务已启动                                        ║
║                                                               ║
║   📍 地址: http://${host}:${port}                              ║
║   📦 环境: ${process.env.NODE_ENV || 'development'}                          ║
║                                                               ║
║   📋 健康检查: http://${host}:${port}/health                    ║
║   📋 详细健康: http://${host}:${port}/health/detailed          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}

// 优雅关闭
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']
signals.forEach((signal) => {
  process.on(signal, async () => {
    console.log(`\n${signal} received, shutting down gracefully...`)
    await app.close()
    process.exit(0)
  })
})
