/**
 * AI 请求队列
 * 使用 Redis 实现请求队列削峰
 * 支持：
 * - 请求入队/出队
 * - 优先级队列
 * - 超时处理
 * - 重试机制
 */

import crypto from 'crypto'

// 全局队列类型声明
declare global {
  // eslint-disable-next-line no-var
  var __aiQueue: AIJob[] | undefined
}

// 队列配置
interface QueueConfig {
  maxRetries: number
  retryDelay: number // ms
  jobTimeout: number // ms
  maxConcurrent: number
}

const DEFAULT_CONFIG: QueueConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  jobTimeout: 60000, // 60s
  maxConcurrent: 10,
}

// 任务状态
type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'timeout'

// 任务数据结构
interface AIJob {
  id: string
  user_id: string
  agent_id: string
  messages: Array<{ role: string; content: string }>
  config: {
    model?: string
    temperature?: number
    max_tokens?: number
  }
  priority: number // 0-9, 越高优先级越高
  status: JobStatus
  retries: number
  created_at: number
  started_at?: number
  completed_at?: number
  result?: unknown
  error?: string
}

export class AIQueue {
  private redis: {
    zadd: Function
    zrange: Function
    zrem: Function
    hset: Function
    hget: Function
    hdel: Function
    expire: Function
    zcard: Function
    quit: Function
    on: Function
  } | null = null
  private config: QueueConfig
  private isProcessing = false
  private processingInterval: ReturnType<typeof setInterval> | null = null

  // Redis 连接池（通过环境变量配置）
  private redisUrl: string | null = null

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST
      ? `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
      : null
  }

  // 初始化 Redis 连接
  async init(): Promise<void> {
    if (!this.redisUrl) {
      console.warn('[AIQueue] Redis not configured, running in memory mode')
      return
    }

    try {
      // @ts-expect-error - ioredis types not installed but module is available
      const { default: Redis } = await import('ioredis')
      const redis = new Redis(this.redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => Math.min(times * 100, 3000),
      })

      redis.on('error', (err: Error) => {
        console.error('[AIQueue] Redis error:', err)
      })

      this.redis = redis
      console.log('[AIQueue] Connected to Redis')
    } catch (err) {
      console.warn('[AIQueue] Failed to connect to Redis, running in memory mode')
      this.redis = null
    }
  }

  // 生成任务 ID
  private generateJobId(): string {
    return `ai:${Date.now()}:${crypto.randomBytes(4).toString('hex')}`
  }

  // 入队
  async enqueue(
    userId: string,
    agentId: string,
    messages: Array<{ role: string; content: string }>,
    config: AIJob['config'] = {},
    priority: number = 5
  ): Promise<string> {
    const jobId = this.generateJobId()

    const job: AIJob = {
      id: jobId,
      user_id: userId,
      agent_id: agentId,
      messages,
      config,
      priority: Math.max(0, Math.min(9, priority)),
      status: 'pending',
      retries: 0,
      created_at: Date.now(),
    }

    if (this.redis) {
      // Redis 模式：使用有序集合存储任务
      const score = Date.now() + (10 - job.priority) * 1000 // 优先级越高，分数越低（越先处理）
      await this.redis.zadd('ai_queue', score, JSON.stringify(job))
      await this.redis.hset(`ai_job:${jobId}`, job as unknown as Record<string, string>)
      await this.redis.expire(`ai_job:${jobId}`, 3600) // 1小时后自动清理
    } else {
      // 内存模式：存储到全局队列
      global.__aiQueue = global.__aiQueue || []
      global.__aiQueue.push(job)
    }

    console.log(`[AIQueue] Job ${jobId} enqueued, priority: ${priority}`)
    return jobId
  }

  // 出队（获取下一个待处理任务）
  async dequeue(): Promise<AIJob | null> {
    if (this.redis) {
      // Redis 模式：从有序集合获取任务
      const items = await this.redis.zrange('ai_queue', 0, 0)
      if (items.length === 0) return null

      const jobStr = items[0]
      const job: AIJob = JSON.parse(jobStr)

      // 原子性：移除并标记为处理中
      const removed = await this.redis.zrem('ai_queue', jobStr)
      if (removed === 0) {
        // 已被其他进程获取
        return null
      }

      job.status = 'processing'
      job.started_at = Date.now()
      await this.redis.hset(`ai_job:${job.id}`, job as unknown as Record<string, string>)

      return job
    } else {
      // 内存模式
      global.__aiQueue = global.__aiQueue || []
      const now = Date.now()

      // 按优先级排序
      const pending = global.__aiQueue
        .filter(j => j.status === 'pending' && (now - j.created_at < this.config.jobTimeout))
        .sort((a, b) => b.priority - a.priority || a.created_at - b.created_at)

      if (pending.length === 0) return null

      const job = pending[0]
      job.status = 'processing'
      job.started_at = now

      return job
    }
  }

  // 完成任务
  async complete(jobId: string, result: unknown): Promise<void> {
    if (this.redis) {
      const jobStr = await this.redis.hget(`ai_job:${jobId}`)
      if (!jobStr) return

      const job: AIJob = JSON.parse(jobStr)
      job.status = 'completed'
      job.completed_at = Date.now()
      job.result = result

      await this.redis.hset(`ai_job:${jobId}`, job as unknown as Record<string, string>)
      await this.redis.expire(`ai_job:${jobId}`, 3600)
    } else {
      global.__aiQueue = global.__aiQueue || []
      const job = global.__aiQueue.find(j => j.id === jobId)
      if (job) {
        job.status = 'completed'
        job.completed_at = Date.now()
        job.result = result
      }
    }

    console.log(`[AIQueue] Job ${jobId} completed`)
  }

  // 任务失败
  async fail(jobId: string, error: string, canRetry: boolean = true): Promise<boolean> {
    if (this.redis) {
      const jobStr = await this.redis.hget(`ai_job:${jobId}`)
      if (!jobStr) return false

      const job: AIJob = JSON.parse(jobStr)

      if (canRetry && job.retries < this.config.maxRetries) {
        // 重试
        job.retries++
        job.status = 'pending'
        job.started_at = undefined

        const score = Date.now() + this.config.retryDelay + (10 - job.priority) * 1000
        await this.redis.zadd('ai_queue', score, JSON.stringify(job))
        await this.redis.hdel(`ai_job:${jobId}`)

        console.log(`[AIQueue] Job ${jobId} scheduled for retry (${job.retries}/${this.config.maxRetries})`)
        return true
      } else {
        // 最终失败
        job.status = 'failed'
        job.error = error
        job.completed_at = Date.now()

        await this.redis.hset(`ai_job:${jobId}`, job as unknown as Record<string, string>)
        console.log(`[AIQueue] Job ${jobId} failed: ${error}`)
        return false
      }
    } else {
      global.__aiQueue = global.__aiQueue || []
      const job = global.__aiQueue.find(j => j.id === jobId)

      if (!job) return false

      if (canRetry && job.retries < this.config.maxRetries) {
        job.retries++
        job.status = 'pending'
        job.started_at = undefined
        console.log(`[AIQueue] Job ${jobId} scheduled for retry (${job.retries}/${this.config.maxRetries})`)
        return true
      } else {
        job.status = 'failed'
        job.error = error
        job.completed_at = Date.now()
        console.log(`[AIQueue] Job ${jobId} failed: ${error}`)
        return false
      }
    }
  }

  // 获取任务状态
  async getStatus(jobId: string): Promise<AIJob | null> {
    if (this.redis) {
      const jobStr = await this.redis.hget(`ai_job:${jobId}`)
      return jobStr ? JSON.parse(jobStr) : null
    } else {
      global.__aiQueue = global.__aiQueue || []
      return global.__aiQueue.find(j => j.id === jobId) || null
    }
  }

  // 获取队列长度
  async getQueueLength(): Promise<number> {
    if (this.redis) {
      return this.redis.zcard('ai_queue')
    } else {
      global.__aiQueue = global.__aiQueue || []
      return global.__aiQueue.filter(j => j.status === 'pending').length
    }
  }

  // 启动队列处理器
  async startProcessor(
    processor: (job: AIJob) => Promise<unknown>,
    concurrency: number = 5
  ): Promise<void> {
    if (this.isProcessing) {
      console.warn('[AIQueue] Processor already running')
      return
    }

    this.isProcessing = true
    const runningJobs = new Set<string>()

    this.processingInterval = setInterval(async () => {
      // 检查是否有空闲槽位
      if (runningJobs.size >= concurrency) {
        return
      }

      // 出队
      const job = await this.dequeue()
      if (!job) return

      // 如果任务已超时，直接失败
      if (job.started_at && Date.now() - job.started_at > this.config.jobTimeout) {
        await this.fail(job.id, 'Job timeout', false)
        return
      }

      runningJobs.add(job.id)

      // 处理任务
      try {
        const result = await Promise.race([
          processor(job),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Job timeout')), this.config.jobTimeout)
          ),
        ])

        await this.complete(job.id, result)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        await this.fail(job.id, errorMsg, true)
      } finally {
        runningJobs.delete(job.id)
      }
    }, 100) // 每 100ms 检查一次

    console.log(`[AIQueue] Processor started with concurrency: ${concurrency}`)
  }

  // 停止队列处理器
  async stopProcessor(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
    this.isProcessing = false
    console.log('[AIQueue] Processor stopped')
  }

  // 关闭连接
  async close(): Promise<void> {
    await this.stopProcessor()
    if (this.redis) {
      await this.redis.quit()
      this.redis = null
    }
  }
}

// 全局队列实例
let globalQueue: AIQueue | null = null

export function getAIQueue(): AIQueue {
  if (!globalQueue) {
    globalQueue = new AIQueue()
  }
  return globalQueue
}

// 初始化队列
export async function initAIQueue(): Promise<void> {
  const queue = getAIQueue()
  await queue.init()
}
