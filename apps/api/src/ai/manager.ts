/**
 * AI 服务管理器
 * 
 * 功能：
 * - 根据配置自动选择 AI Provider
 * - 支持多 Provider 负载均衡
 * - 成本追踪与预算控制
 * - 请求重试与降级
 */

import { createProvider, type AIProvider, type ProviderConfig, type ChatCompletionRequest, type ChatCompletionResponse } from './provider.js'

// ============================================
// 配置类型
// ============================================

export interface AIManagerConfig {
  providers: ProviderConfig[]
  defaultProvider?: string
  enableFallback?: boolean // 启用备用 Provider
  costLimitPerUser?: number // 用户每日成本限制
}

interface ProviderStats {
  totalRequests: number
  failedRequests: number
  totalTokens: number
  totalCost: number
  lastUsed?: number
  successRate?: string
}

// ============================================
// AI 服务管理器
// ============================================

export class AIServiceManager {
  private providers: Map<string, AIProvider> = new Map()
  private providerStats: Map<string, ProviderStats> = new Map()
  private config: AIManagerConfig
  private defaultProvider: AIProvider | null = null

  constructor(config: AIManagerConfig) {
    this.config = config
    this.initializeProviders()
  }

  private initializeProviders() {
    for (const providerConfig of this.config.providers) {
      try {
        const provider = createProvider(providerConfig)
        this.providers.set(providerConfig.type, provider)
        this.providerStats.set(providerConfig.type, {
          totalRequests: 0,
          failedRequests: 0,
          totalTokens: 0,
          totalCost: 0,
        })

        // 设置默认 Provider
        if (!this.defaultProvider || providerConfig.type === this.config.defaultProvider) {
          this.defaultProvider = provider
        }
      } catch (error) {
        console.error(`Failed to initialize provider ${providerConfig.type}:`, error)
      }
    }

    if (!this.defaultProvider && this.config.providers.length > 0) {
      // 使用第一个 Provider 作为默认
      const firstConfig = this.config.providers[0]
      this.defaultProvider = this.providers.get(firstConfig.type) || null
    }
  }

  /**
   * 发送聊天请求
   */
  async chat(request: ChatCompletionRequest, providerType?: string): Promise<ChatCompletionResponse> {
    const provider = providerType 
      ? this.providers.get(providerType) 
      : this.selectProvider(request.model)

    if (!provider) {
      throw new Error('No AI provider available')
    }

    // 更新统计
    this.recordRequestStart(provider.name)

    try {
      const response = await provider.chatCompletion(request)

      // 更新统计
      this.recordRequestSuccess(provider.name, response)

      return response
    } catch (error) {
      // 更新错误统计
      this.recordRequestFailure(provider.name)

      // 尝试备用 Provider
      if (this.config.enableFallback && providerType) {
        const fallback = this.selectFallbackProvider(providerType)
        if (fallback) {
          console.log(`Falling back from ${providerType} to ${fallback.name}`)
          return this.chat(request, fallback.name)
        }
      }

      throw error
    }
  }

  /**
   * 流式聊天请求
   */
  async *chatStream(request: ChatCompletionRequest, providerType?: string): AsyncGenerator<{
    chunk: { delta: { content?: string } }
    done: boolean
  }> {
    const provider = providerType 
      ? this.providers.get(providerType) 
      : this.selectProvider(request.model)

    if (!provider) {
      throw new Error('No AI provider available')
    }

    this.recordRequestStart(provider.name)

    try {
      for await (const chunk of provider.chatCompletionStream(request)) {
        yield {
          chunk: {
            delta: {
              content: chunk.delta.content,
            },
          },
          done: !!chunk.finish_reason,
        }
      }

      this.recordRequestSuccess(provider.name, { id: '', model: '', choices: [], created: Date.now(), service: provider.name })
    } catch (error) {
      this.recordRequestFailure(provider.name)

      if (this.config.enableFallback && providerType) {
        const fallback = this.selectFallbackProvider(providerType)
        if (fallback) {
          console.log(`Falling back from ${providerType} to ${fallback.name}`)
          yield* this.chatStream(request, fallback.name)
          return
        }
      }

      throw error
    }
  }

  /**
   * 选择 Provider（基于统计和模型支持）
   */
  private selectProvider(model?: string): AIProvider | null {
    // 优先选择负载最低的 Provider
    let bestProvider: AIProvider | null = null
    let lowestLoad = Infinity

    for (const [type, provider] of this.providers) {
      const stats = this.providerStats.get(type)
      if (!stats) continue

      // 计算负载分数：失败率 + 最近的请求数量
      const failureRate = stats.totalRequests > 0 
        ? stats.failedRequests / stats.totalRequests 
        : 0
      const recentRequests = stats.lastUsed 
        ? Math.floor((Date.now() - stats.lastUsed) / 60000) // 分钟前的请求
        : 0

      const load = failureRate * 10 + recentRequests * 0.1

      if (load < lowestLoad) {
        lowestLoad = load
        bestProvider = provider
      }
    }

    return bestProvider
  }

  /**
   * 选择备用 Provider
   */
  private selectFallbackProvider(currentType: string): AIProvider | null {
    for (const [type, provider] of this.providers) {
      if (type !== currentType) {
        const stats = this.providerStats.get(type)
        if (stats && stats.failedRequests < stats.totalRequests * 0.5) {
          return provider
        }
      }
    }
    return this.defaultProvider
  }

  /**
   * 记录请求开始
   */
  private recordRequestStart(providerType: string) {
    const stats = this.providerStats.get(providerType)
    if (stats) {
      stats.totalRequests++
    }
  }

  /**
   * 记录请求成功
   */
  private recordRequestSuccess(providerType: string, response: ChatCompletionResponse) {
    const stats = this.providerStats.get(providerType)
    if (stats) {
      stats.lastUsed = Date.now()
      if (response.usage) {
        stats.totalTokens += response.usage.total_tokens
        // 估算成本（各 Provider 价格不同，这里用简化模型）
        const costPerToken = this.getCostPerToken(providerType)
        stats.totalCost += response.usage.total_tokens * costPerToken
      }
    }
  }

  /**
   * 记录请求失败
   */
  private recordRequestFailure(providerType: string) {
    const stats = this.providerStats.get(providerType)
    if (stats) {
      stats.failedRequests++
    }
  }

  /**
   * 获取每 Token 成本（简化估算）
   */
  private getCostPerToken(providerType: string): number {
    // 各 Provider 价格（仅供参考）
    const costs: Record<string, number> = {
      'zhipu': 0.0001,      // 智谱 GLM-4 $0.1/千token
      'dashscope': 0.0002,  // 通义千问
      'wenxin': 0.00015,    // 文心一言
      'openai': 0.0005,     // GPT-4
    }
    return costs[providerType] || 0.0001
  }

  /**
   * 获取 Provider 统计信息
   */
  getStats() {
    const stats: Record<string, ProviderStats> = {}
    for (const [type, stat] of this.providerStats) {
      stats[type] = {
        ...stat,
        successRate: stat.totalRequests > 0 
          ? ((stat.totalRequests - stat.failedRequests) / stat.totalRequests * 100).toFixed(2) + '%'
          : 'N/A',
      }
    }
    return stats
  }

  /**
   * 获取可用模型列表
   */
  async listModels(): Promise<Record<string, string[]>> {
    const models: Record<string, string[]> = {}
    for (const [type, provider] of this.providers) {
      try {
        models[type] = await provider.listModels()
      } catch {
        models[type] = []
      }
    }
    return models
  }

  /**
   * 检查用户成本限制
   */
  checkCostLimit(userId: string, newCost: number): boolean {
    if (!this.config.costLimitPerUser) return true
    // 这里应该查询用户当日消费，但简化实现返回 true
    // 实际使用时应该查询数据库
    return true
  }
}

// ============================================
// 单例管理
// ============================================

let aiManager: AIServiceManager | null = null

export function initAIService(config: AIManagerConfig): AIServiceManager {
  aiManager = new AIServiceManager(config)
  return aiManager
}

export function getAIService(): AIServiceManager {
  if (!aiManager) {
    // 使用环境变量初始化默认配置
    const providers: ProviderConfig[] = []

    // Helper to check if API key is valid (not placeholder)
    const isValidApiKey = (key: string | undefined): boolean => {
      return !!key && key !== 'your_zhipu_api_key' && key !== 'your_api_key' && !key.startsWith('sk-or-')
    }

    if (isValidApiKey(process.env.ZHIPU_API_KEY)) {
      providers.push({
        type: 'zhipu',
        apiKey: process.env.ZHIPU_API_KEY!,
        timeout: 60000,
      })
    }

    if (isValidApiKey(process.env.DASHSCOPE_API_KEY)) {
      providers.push({
        type: 'dashscope',
        apiKey: process.env.DASHSCOPE_API_KEY!,
        timeout: 60000,
      })
    }

    if (isValidApiKey(process.env.WENXIN_API_KEY)) {
      providers.push({
        type: 'wenxin',
        apiKey: process.env.WENXIN_API_KEY!,
        timeout: 60000,
      })
    }

    if (isValidApiKey(process.env.OPENAI_API_KEY)) {
      providers.push({
        type: 'openai',
        apiKey: process.env.OPENAI_API_KEY!,
        baseUrl: process.env.OPENAI_BASE_URL,
        timeout: 60000,
      })
    }

    if (isValidApiKey(process.env.MINIMAX_API_KEY)) {
      providers.push({
        type: 'minimax',
        apiKey: process.env.MINIMAX_API_KEY!,
        baseUrl: process.env.MINIMAX_API_BASE,
        timeout: 60000,
      })
    }

    if (providers.length === 0) {
      throw new Error('No AI providers configured. Set MINIMAX_API_KEY, ZHIPU_API_KEY, DASHSCOPE_API_KEY, or WENXIN_API_KEY')
    }

    aiManager = new AIServiceManager({
      providers,
      enableFallback: true,
    })
  }

  return aiManager
}