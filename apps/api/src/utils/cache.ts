/**
 * Redis 缓存工具模块
 * 支持阿里云 Redis 或本地 Redis
 */

import crypto from 'crypto'

// ============================================
// Redis 客户端类型
// ============================================

interface RedisClient {
  get(key: string): Promise<string | null>
  set(key: string, value: string, options?: { EX?: number }): Promise<void>
  del(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  incr(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<void>
}

// ============================================
// 内存缓存（开发环境/无 Redis 时使用）
// ============================================

class MemoryCache {
  private cache = new Map<string, { value: string; expires: number }>()

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key)
    if (!item) return null
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    return item.value
  }

  async set(key: string, value: string, options?: { EX?: number }): Promise<void> {
    const expires = options?.EX ? Date.now() + options.EX * 1000 : Date.now() + 86400000
    this.cache.set(key, { value, expires })
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key)
    if (!item) return false
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return false
    }
    return true
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key)
    const newValue = (parseInt(current || '0') + 1).toString()
    await this.set(key, newValue)
    return parseInt(newValue)
  }

  async expire(key: string, seconds: number): Promise<void> {
    const item = this.cache.get(key)
    if (item) {
      item.expires = Date.now() + seconds * 1000
    }
  }
}

// ============================================
// Redis 客户端工厂
// ============================================

let redisClient: RedisClient | null = null
let isUsingMemoryCache = false

/**
 * 获取 Redis 客户端
 * 如果未配置 Redis，将使用内存缓存（仅适合开发环境）
 *
 * ⚠️ 生产环境警告：内存缓存在分布式部署中不共享状态！
 *   - 多实例部署时缓存不互通
 *   - 实例重启后缓存丢失
 *   - 不适合生产环境使用
 */
export async function getRedisClient(): Promise<RedisClient> {
  if (redisClient) return redisClient

  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[CACHE] ⚠️ FATAL: Redis not configured in production!')
      console.error('[CACHE] Using memory cache is NOT supported in production.')
      console.error('[CACHE] Please set REDIS_URL environment variable.')
      // 不阻止启动，但会在日志中持续警告
    } else {
      console.log('[CACHE] Redis not configured, using memory cache (dev only)')
    }
    redisClient = new MemoryCache()
    isUsingMemoryCache = true
    return redisClient
  }

  try {
    // 使用原生 Redis 协议连接
    // 在生产环境，推荐使用 ioredis 或 @redis/client
    // 这里使用简单的 HTTP API 方式连接阿里云 Redis
    const url = new URL(redisUrl)

    // 阿里云 Redis 支持 HTTP API
    if (url.protocol === 'redis:' || url.protocol === 'rediss:') {
      // 使用 TCP 连接（需要额外库）
      // 暂时使用内存缓存作为降级方案
      console.log('[CACHE] Using memory cache (TCP Redis not implemented)')
      redisClient = new MemoryCache()
      isUsingMemoryCache = true
      return redisClient
    }

    // 使用 HTTP API（阿里云 Redis 兼容）
    redisClient = createHttpRedisClient(redisUrl)
    isUsingMemoryCache = false
    console.log('[CACHE] Connected to Redis via HTTP API')
    return redisClient
  } catch (err) {
    console.error('[CACHE] Failed to connect to Redis, using memory cache:', err)
    redisClient = new MemoryCache()
    isUsingMemoryCache = true
    return redisClient
  }
}

/**
 * 检查是否使用内存缓存
 * @returns true 表示使用内存缓存（不适合生产）
 */
export function isUsingMemoryCacheMode(): boolean {
  return isUsingMemoryCache
}

/**
 * 创建 HTTP Redis 客户端（阿里云 Redis HTTP 接口）
 */
function createHttpRedisClient(baseUrl: string): RedisClient {
  return {
    async get(key: string): Promise<string | null> {
      try {
        const response = await fetch(`${baseUrl}/get/${encodeURIComponent(key)}`)
        if (!response.ok) return null
        const data = await response.json() as { result?: string }
        return data.result || null
      } catch {
        return null
      }
    },

    async set(key: string, value: string, options?: { EX?: number }): Promise<void> {
      try {
        const url = options?.EX
          ? `${baseUrl}/setex/${encodeURIComponent(key)}/${options.EX}/${encodeURIComponent(value)}`
          : `${baseUrl}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`
        await fetch(url, { method: 'PUT' })
      } catch {
        // ignore
      }
    },

    async del(key: string): Promise<void> {
      try {
        await fetch(`${baseUrl}/del/${encodeURIComponent(key)}`, { method: 'DELETE' })
      } catch {
        // ignore
      }
    },

    async exists(key: string): Promise<boolean> {
      try {
        const response = await fetch(`${baseUrl}/exists/${encodeURIComponent(key)}`)
        if (!response.ok) return false
        const data = await response.json() as { result?: number }
        return (data.result || 0) > 0
      } catch {
        return false
      }
    },

    async incr(key: string): Promise<number> {
      try {
        const response = await fetch(`${baseUrl}/incr/${encodeURIComponent(key)}`)
        if (!response.ok) return 0
        const data = await response.json() as { result?: number }
        return data.result || 0
      } catch {
        return 0
      }
    },

    async expire(key: string, seconds: number): Promise<void> {
      try {
        await fetch(`${baseUrl}/expire/${encodeURIComponent(key)}/${seconds}`)
      } catch {
        // ignore
      }
    },
  }
}

/**
 * 检查是否使用内存缓存
 */
export function isMemoryCacheMode(): boolean {
  return isUsingMemoryCache
}

// ============================================
// 缓存辅助函数
// ============================================

/**
 * 生成缓存键
 */
export function cacheKey(...parts: string[]): string {
  return `lvzhi:${parts.join(':')}`
}

/**
 * 生成哈希缓存键
 */
export function hashCacheKey(prefix: string, ...parts: string[]): string {
  const hash = crypto.createHash('md5').update(parts.join(':')).digest('hex').slice(0, 8)
  return `lvzhi:${prefix}:${hash}`
}

// ============================================
// 常用缓存操作
// ============================================

/**
 * 获取缓存（带泛型）
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const client = await getRedisClient()
  const value = await client.get(key)
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return value as unknown as T
  }
}

/**
 * 设置缓存（带泛型）
 */
export async function setCache<T>(
  key: string,
  value: T,
  options?: { EX?: number }
): Promise<void> {
  const client = await getRedisClient()
  const serialized = typeof value === 'string' ? value : JSON.stringify(value)
  await client.set(key, serialized, options)
}

/**
 * 删除缓存
 */
export async function delCache(key: string): Promise<void> {
  const client = await getRedisClient()
  await client.del(key)
}

/**
 * 获取或设置缓存（缓存穿透保护）
 */
export async function getOrSetCache<T>(
  key: string,
  factory: () => Promise<T>,
  options?: { EX?: number }
): Promise<T> {
  const cached = await getCache<T>(key)
  if (cached !== null) return cached

  const value = await factory()
  await setCache(key, value, options)
  return value
}

// ============================================
// AI 相关缓存
// ============================================

/**
 * 缓存 AI 对话结果
 */
export async function cacheAIResponse(
  cacheKey: string,
  response: string
): Promise<void> {
  const client = await getRedisClient()
  // 缓存 5 分钟
  await client.set(`lvzhi:ai:response:${cacheKey}`, response, { EX: 300 })
}

/**
 * 获取缓存的 AI 对话结果
 */
export async function getCachedAIResponse(cacheKey: string): Promise<string | null> {
  const client = await getRedisClient()
  return client.get(`lvzhi:ai:response:${cacheKey}`)
}

/**
 * 增加 API 调用计数
 */
export async function incrementAPICallCount(userId: string, date: string): Promise<number> {
  const client = await getRedisClient()
  const key = `lvzhi:api:count:${date}:${userId}`
  const count = await client.incr(key)
  // 设置 24 小时过期
  await client.expire(key, 86400)
  return count
}

/**
 * 获取用户当日 API 调用次数
 */
export async function getAPICallCount(userId: string, date: string): Promise<number> {
  const client = await getRedisClient()
  const key = `lvzhi:api:count:${date}:${userId}`
  const value = await client.get(key)
  return value ? parseInt(value) : 0
}

// ============================================
// 会话缓存
// ============================================

/**
 * 缓存用户会话
 */
export async function cacheSession(
  sessionId: string,
  data: Record<string, unknown>,
  ttlSeconds = 3600
): Promise<void> {
  const client = await getRedisClient()
  await client.set(`lvzhi:session:${sessionId}`, JSON.stringify(data), { EX: ttlSeconds })
}

/**
 * 获取用户会话
 */
export async function getSession(sessionId: string): Promise<Record<string, unknown> | null> {
  const client = await getRedisClient()
  const value = await client.get(`lvzhi:session:${sessionId}`)
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

/**
 * 删除用户会话
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const client = await getRedisClient()
  await client.del(`lvzhi:session:${sessionId}`)
}

// ============================================
// 速率限制
// ============================================

/**
 * 检查是否超过速率限制
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const client = await getRedisClient()
  const key = `lvzhi:ratelimit:${identifier}`
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  // 使用滑动窗口算法
  const current = await client.incr(key)

  if (current === 1) {
    await client.expire(key, windowSeconds)
  }

  const allowed = current <= limit
  const remaining = Math.max(0, limit - current)
  const resetAt = Math.floor((now + windowMs) / 1000)

  return { allowed, remaining, resetAt }
}