/**
 * 安全中间件
 * - CSRF 防护
 * - IP 黑名单/白名单
 * - 请求来源校验
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { query } from '../lib/database.js'

// ============================================
// CSRF 防护
// ============================================

function splitOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) return []
  return raw.split(',').map((o) => o.trim()).filter(Boolean)
}

/**
 * 与 CORS（WEB_URL）及本地多端口开发对齐；localhost 与 127.0.0.1 视为不同 Origin，需同时放行。
 */
function getCsrfAllowedOrigins(): string[] {
  const devDefaults = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:3100',
    'http://127.0.0.1:3100',
    'http://localhost:3101',
    'http://127.0.0.1:3101',
  ]
  const explicit = splitOrigins(process.env.ALLOWED_ORIGINS)
  const webUrls = splitOrigins(process.env.WEB_URL)
  let merged = [...new Set([...explicit, ...webUrls])]
  if (process.env.NODE_ENV !== 'production') {
    merged = [...new Set([...merged, ...devDefaults])]
  }
  if (merged.length === 0) {
    merged = devDefaults
  }
  return merged
}

function originAllowed(origin: string, allowedOrigins: string[]): boolean {
  const o = origin.replace(/\/$/, '')
  return allowedOrigins.some((allowed) => {
    const a = allowed.replace(/\/$/, '')
    return o === a || o.startsWith(`${a}/`)
  })
}

/**
 * CSRF 校验中间件
 * 检查 Origin 和 Referer header
 */
export function csrfProtection(fastify: FastifyInstance) {
  // 为所有需要 CSRF 保护的 POST/PUT/DELETE 请求添加 preHandler
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // 只对修改型请求进行校验
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const origin = request.headers.origin
      const referer = request.headers.referer
      const allowedOrigins = getCsrfAllowedOrigins()

      // 检查 Origin
      if (origin) {
        const isAllowedOrigin = originAllowed(origin, allowedOrigins)

        if (!isAllowedOrigin) {
          // 允许 OPTIONS 预检请求通过
          if (request.method !== 'OPTIONS') {
            request.log.warn({ origin, allowedOrigins }, 'CSRF: Origin not allowed')
            return reply.status(403).send({
              code: 403,
              message: 'Request origin not allowed',
            })
          }
        }
      } else if (referer) {
        // 检查 Referer：用完整 origin（协议+host）与白名单比对，避免仅比 hostname 漏掉端口
        let refererOrigin: string
        try {
          const refererUrl = new URL(referer)
          refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`
        } catch {
          request.log.warn({ referer }, 'CSRF: Invalid referer URL')
          return reply.status(403).send({
            code: 403,
            message: 'Request referer not allowed',
          })
        }
        const isAllowedReferer = originAllowed(refererOrigin, allowedOrigins)

        if (!isAllowedReferer) {
          request.log.warn({ referer }, 'CSRF: Referer not allowed')
          return reply.status(403).send({
            code: 403,
            message: 'Request referer not allowed',
          })
        }
      } else if (process.env.NODE_ENV === 'production') {
        // 生产环境必须有 origin 或 referer
        request.log.warn('CSRF: Missing origin/referer')
        return reply.status(403).send({
          code: 403,
          message: 'Missing request origin',
        })
      }
    }
  })
}

// ============================================
// IP 黑名单/白名单
// ============================================

interface IPConfig {
  blacklist: Set<string>
  whitelist: Set<string>
  useDatabase: boolean
}

const ipConfig: IPConfig = {
  blacklist: new Set(),
  whitelist: new Set(),
  useDatabase: true,
}

/**
 * 从数据库加载 IP 黑名单
 */
async function loadIPBlacklist() {
  try {
    const result = await query<{ ip_address: string }>(
      'SELECT ip_address FROM ip_blacklist WHERE expires_at IS NULL OR expires_at > NOW()'
    )
    ipConfig.blacklist = new Set(result.rows.map((r: { ip_address: string }) => r.ip_address))
    console.log(`[Security] Loaded ${ipConfig.blacklist.size} IPs to blacklist`)
  } catch (error) {
    console.error('[Security] Failed to load IP blacklist:', error)
  }
}

/**
 * 从数据库加载 IP 白名单
 */
async function loadIPWhitelist() {
  try {
    const result = await query<{ ip_address: string }>(
      'SELECT ip_address FROM ip_whitelist'
    )
    ipConfig.whitelist = new Set(result.rows.map((r: { ip_address: string }) => r.ip_address))
    console.log(`[Security] Loaded ${ipConfig.whitelist.size} IPs to whitelist`)
  } catch (error) {
    console.error('[Security] Failed to load IP whitelist:', error)
  }
}

/**
 * 获取客户端 IP
 */
function getClientIP(request: FastifyRequest): string {
  return request.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()
    || request.headers['x-real-ip']?.toString()
    || request.ip
}

/**
 * IP 过滤中间件
 */
export async function ipFilter(fastify: FastifyInstance) {
  // 初始加载
  if (ipConfig.useDatabase) {
    await loadIPBlacklist()
    await loadIPWhitelist()

    // 每 5 分钟刷新一次
    setInterval(async () => {
      await loadIPBlacklist()
      await loadIPWhitelist()
    }, 5 * 60 * 1000)
  }

  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const clientIP = getClientIP(request)

    // 白名单直接通过
    if (ipConfig.whitelist.has(clientIP)) {
      return
    }

    // 检查黑名单
    if (ipConfig.blacklist.has(clientIP)) {
      request.log.warn({ ip: clientIP }, 'Blocked IP from blacklist')
      return reply.status(403).send({
        code: 403,
        message: 'Access denied',
      })
    }

    // 检查 CIDR 格式的黑名单（简化版，只支持 /24）
    for (const blockedIP of ipConfig.blacklist) {
      if (blockedIP.includes('/24')) {
        const [baseIP] = blockedIP.split('/')
        const clientBaseIP = clientIP.split('.').slice(0, 3).join('.')
        if (baseIP === clientBaseIP) {
          request.log.warn({ ip: clientIP, blockedIP }, 'Blocked IP from CIDR blacklist')
          return reply.status(403).send({
            code: 403,
            message: 'Access denied',
          })
        }
      }
    }
  })
}

// ============================================
// 敏感操作日志
// ============================================

/**
 * 记录敏感操作
 */
export async function logSecurityEvent(
  type: 'login' | 'logout' | 'register' | 'password_change' | 'withdraw' | 'delete' | 'admin_action',
  userId: string | null,
  ip: string,
  userAgent: string,
  details: Record<string, unknown>
) {
  try {
    await query(
      `INSERT INTO security_logs (event_type, user_id, ip_address, user_agent, details, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [type, userId, ip, userAgent, JSON.stringify(details)]
    )
  } catch (error) {
    console.error('[Security] Failed to log security event:', error)
  }
}

// ============================================
// Bot 检测（阻止可疑 Bot）
// ============================================

const SUSPICIOUS_PATTERNS = [
  /crawler/i,
  /spider/i,
  /scraper/i,
  /python-requests/i,
  /httpclient/i,
  /java\//i,
  /go-http-client/i,
]

// 已知恶意的 User-Agent 模式（直接阻止）
const BLOCKED_USER_AGENT_PATTERNS: RegExp[] = [
  /^(python|urllib|httpie|axios|node-fetch|got|request|superagent|mechanize)/i,
  /^(masscan|nmap|masscan)/i,
  /^(wpscan|sqlmap|nikto)/i,
]

/**
 * Bot 检测中间件
 * 阻止已知的恶意爬虫和工具
 */
export function botDetection(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const userAgent = request.headers['user-agent'] || ''
    const clientIP = getClientIP(request)

    // 检查已知的恶意 User-Agent（直接阻止）
    if (BLOCKED_USER_AGENT_PATTERNS.some(pattern => pattern.test(userAgent))) {
      request.log.warn({ ip: clientIP, userAgent }, 'Blocked malicious user agent')
      return reply.status(403).send({
        code: 403,
        message: 'Access denied',
      })
    }

    // 检查可疑爬虫模式（仅阻止非常明确的爬虫特征）
    const isLikelyBot = SUSPICIOUS_PATTERNS.some(pattern => pattern.test(userAgent)) &&
      !hasLegitimateBotIndicators(userAgent)

    if (isLikelyBot && process.env.NODE_ENV === 'production') {
      // 生产环境阻止可疑爬虫
      request.log.warn({ ip: clientIP, userAgent }, 'Blocked likely bot')
      return reply.status(403).send({
        code: 403,
        message: 'Access denied',
      })
    }
  })
}

/**
 * 检查 User-Agent 是否有合法浏览器特征
 */
function hasLegitimateBotIndicators(userAgent: string): boolean {
  // 有 Chrome/Firefox/Safari 等浏览器特征的一般是正常用户
  const browserIndicators = [
    /Chrome\/[\d.]+\s+Safari\/[\d.]+\s+\(Windows|Macintosh|Linux/i,
    /Firefox\/[\d.]+/i,
    /Safari\/[\d.]+\s+Version\/[\d.]+\s+Chrome\/[\d.]+/i,
    / Edg\/[\d.]+/i,
  ]
  return browserIndicators.some(pattern => pattern.test(userAgent))
}

// ============================================
// 速率限制增强（敏感路由）
// ============================================

/**
 * 敏感路由速率限制配置
 * 建议在 @fastify/rate-limit 配置中使用 getSensitiveRouteLimit 函数
 * 或在路由的 config 中直接指定
 */
export const SENSITIVE_ROUTE_LIMITS = {
  // 登录：5次/分钟（防止暴力破解）
  '/api/auth/login': { max: 5, timeWindow: '1 minute' },
  // 短信发送：3次/分钟（防止短信轰炸）
  '/api/auth/sms/send': { max: 3, timeWindow: '1 minute' },
  // 注册：3次/小时（防止批量注册）
  '/api/auth/register': { max: 3, timeWindow: '1 hour' },
  // 提现：2次/天（防止恶意提现）
  '/api/balance/withdraw': { max: 2, timeWindow: '1 day' },
  // 支付：10次/分钟
  '/api/payments/alipay': { max: 10, timeWindow: '1 minute' },
  '/api/payments/wechat': { max: 10, timeWindow: '1 minute' },
  // 文件上传：20次/分钟
  '/api/upload': { max: 20, timeWindow: '1 minute' },
  // 密码重置：3次/小时（防止恶意重置）
  '/api/auth/forgot-password': { max: 3, timeWindow: '1 hour' },
}

/**
 * 根据路径匹配敏感路由限制
 */
export function getSensitiveRouteLimit(url: string): { max: number; timeWindow: string } | null {
  for (const [path, limit] of Object.entries(SENSITIVE_ROUTE_LIMITS)) {
    if (url.startsWith(path)) {
      return limit
    }
  }
  return null
}
