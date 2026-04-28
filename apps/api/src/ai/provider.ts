/**
 * AI Provider 抽象层
 * 
 * 支持多种 AI 服务商：
 * - 智谱 AI (Zhipu GLM)
 * - 阿里云通义千问 (DashScope)
 * - 百度文心一言 (Wenxin)
 * - OpenAI (境外备选)
 */

import type { ChatMessage } from '../types.js'

// ============================================
// 类型定义
// ============================================

export interface AIConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
  maxRetries?: number
}

export interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  top_p?: number
  stream?: boolean
  tools?: AITool[]
}

export interface AIUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface ChatCompletionResponse {
  id: string
  model: string
  choices: AIChoice[]
  usage?: AIUsage
  created: number
  service: string
}

export interface AIChoice {
  index: number
  message: {
    role: 'assistant'
    content: string
  }
  finish_reason: string
}

export interface AITool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: object
  }
}

export interface AIStreamChunk {
  id: string
  delta: {
    content?: string
    role?: string
  }
  finish_reason?: string
  usage?: AIUsage
}

// ============================================
// Provider 接口
// ============================================

export interface AIProvider {
  readonly name: string
  readonly defaultModel: string

  chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>
  chatCompletionStream(request: ChatCompletionRequest): AsyncGenerator<AIStreamChunk>
  listModels(): Promise<string[]>
}

// ============================================
// Provider 工厂
// ============================================

export type ProviderType = 'zhipu' | 'dashscope' | 'wenxin' | 'openai' | 'minimax'

export interface ProviderConfig {
  type: ProviderType
  apiKey: string
  baseUrl?: string
  timeout?: number
}

export function createProvider(config: ProviderConfig): AIProvider {
  switch (config.type) {
    case 'zhipu':
      return new ZhipuProvider(config)
    case 'dashscope':
      return new DashScopeProvider(config)
    case 'wenxin':
      return new WenxinProvider(config)
    case 'openai':
      return new OpenAIProvider(config)
    case 'minimax':
      return new MiniMaxProvider(config)
    default:
      throw new Error(`Unknown provider type: ${config.type}`)
  }
}

// ============================================
// 智谱 AI (Zhipu GLM)
// ============================================

export class ZhipuProvider implements AIProvider {
  readonly name = 'zhipu'
  readonly defaultModel = 'glm-4'

  private apiKey: string
  private baseUrl: string
  private timeout: number
  private maxRetries: number

  constructor(config: AIConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || 'https://open.bigmodel.cn/api/paas/v4'
    this.timeout = config.timeout || 60000
    this.maxRetries = config.maxRetries || 3
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const url = `${this.baseUrl}/chat/completions`
    
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        top_p: request.top_p,
        stream: false,
      }),
    })

    const data = await response.json()
    
    return {
      id: data.id || `zhipu-${Date.now()}`,
      model: data.model || request.model,
      choices: data.choices?.map((choice: { index: number; message: { role: string; content: string }; finish_reason: string }) => ({
        index: choice.index,
        message: {
          role: 'assistant' as const,
          content: choice.message.content,
        },
        finish_reason: choice.finish_reason,
      })) || [],
      usage: data.usage ? {
        prompt_tokens: data.usage.prompt_tokens,
        completion_tokens: data.usage.completion_tokens,
        total_tokens: data.usage.total_tokens,
      } : undefined,
      created: data.created || Date.now(),
      service: 'zhipu',
    }
  }

  async *chatCompletionStream(request: ChatCompletionRequest): AsyncGenerator<AIStreamChunk> {
    const url = `${this.baseUrl}/chat/completions`
    
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        top_p: request.top_p,
        stream: true,
      }),
    })

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') return

            try {
              const parsed = JSON.parse(data)
              yield {
                id: parsed.id || '',
                delta: {
                  content: parsed.choices?.[0]?.delta?.content,
                  role: parsed.choices?.[0]?.delta?.role,
                },
                finish_reason: parsed.choices?.[0]?.finish_reason,
                usage: parsed.usage ? {
                  prompt_tokens: parsed.usage.prompt_tokens,
                  completion_tokens: parsed.usage.completion_tokens,
                  total_tokens: parsed.usage.total_tokens,
                } : undefined,
              }
            } catch {
              // Ignore parse errors for malformed chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async listModels(): Promise<string[]> {
    return [
      'glm-4',
      'glm-4-plus',
      'glm-4-air',
      'glm-4-flash',
      'glm-3-turbo',
    ]
  }

  private async fetchWithRetry(url: string, options: RequestInit, retries = 0): Promise<Response> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok && retries < this.maxRetries) {
        await this.delay(Math.pow(2, retries) * 1000)
        return this.fetchWithRetry(url, options, retries + 1)
      }

      return response
    } catch (error) {
      if (retries < this.maxRetries) {
        await this.delay(Math.pow(2, retries) * 1000)
        return this.fetchWithRetry(url, options, retries + 1)
      }
      throw error
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ============================================
// 阿里云通义千问 (DashScope)
// ============================================

export class DashScopeProvider implements AIProvider {
  readonly name = 'dashscope'
  readonly defaultModel = 'qwen-turbo'

  private apiKey: string
  private baseUrl: string
  private timeout: number
  private maxRetries: number

  constructor(config: AIConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation'
    this.timeout = config.timeout || 60000
    this.maxRetries = config.maxRetries || 3
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    // DashScope 使用不同的 API 格式
    const messages = request.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      name: msg.name,
    }))

    const response = await this.fetchWithRetry('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        top_p: request.top_p,
        stream: false,
      }),
    })

    const data = await response.json()
    
    return {
      id: data.id || `dashscope-${Date.now()}`,
      model: data.model || request.model,
      choices: data.choices?.map((choice: { index: number; message: { role: string; content: string }; finish_reason: string }) => ({
        index: choice.index,
        message: {
          role: 'assistant' as const,
          content: choice.message.content,
        },
        finish_reason: choice.finish_reason,
      })) || [],
      usage: data.usage ? {
        prompt_tokens: data.usage.prompt_tokens,
        completion_tokens: data.usage.completion_tokens,
        total_tokens: data.usage.total_tokens,
      } : undefined,
      created: data.created || Date.now(),
      service: 'dashscope',
    }
  }

  async *chatCompletionStream(request: ChatCompletionRequest): AsyncGenerator<AIStreamChunk> {
    const messages = request.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      name: msg.name,
    }))

    const response = await this.fetchWithRetry('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        top_p: request.top_p,
        stream: true,
      }),
    })

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') return

            try {
              const parsed = JSON.parse(data)
              yield {
                id: parsed.id || '',
                delta: {
                  content: parsed.choices?.[0]?.delta?.content,
                  role: parsed.choices?.[0]?.delta?.role,
                },
                finish_reason: parsed.choices?.[0]?.finish_reason,
                usage: parsed.usage ? {
                  prompt_tokens: parsed.usage.prompt_tokens,
                  completion_tokens: parsed.usage.completion_tokens,
                  total_tokens: parsed.usage.total_tokens,
                } : undefined,
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async listModels(): Promise<string[]> {
    return [
      'qwen-plus',
      'qwen-turbo',
      'qwen-max',
      'qwen-long',
      'qwen-max-longcontext',
    ]
  }

  private async fetchWithRetry(url: string, options: RequestInit, retries = 0): Promise<Response> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok && retries < this.maxRetries) {
        await this.delay(Math.pow(2, retries) * 1000)
        return this.fetchWithRetry(url, options, retries + 1)
      }

      return response
    } catch (error) {
      if (retries < this.maxRetries) {
        await this.delay(Math.pow(2, retries) * 1000)
        return this.fetchWithRetry(url, options, retries + 1)
      }
      throw error
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ============================================
// 百度文心一言 (Wenxin)
// ============================================

export class WenxinProvider implements AIProvider {
  readonly name = 'wenxin'
  readonly defaultModel = 'ernie-4.0-8k-latest'

  private apiKey: string
  private secretKey: string
  private accessToken?: string
  private tokenExpiry?: number
  private timeout: number

  constructor(config: AIConfig) {
    this.apiKey = config.apiKey
    this.secretKey = config.apiKey // 百度使用 apiKey + secretKey
    this.timeout = config.timeout || 60000
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    const response = await fetch(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.secretKey}`,
      { method: 'POST' }
    )

    const data = await response.json()
    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000

    return this.accessToken!
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const accessToken = await this.getAccessToken()

    const messages = request.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }))

    const response = await fetch(
      `https://qianfan.baidubce.com/v2/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          model: request.model,
          messages,
          temperature: request.temperature,
          max_output_tokens: request.max_tokens,
          stream: false,
        }),
      }
    )

    const data = await response.json()
    
    return {
      id: data.id || `wenxin-${Date.now()}`,
      model: data.model || request.model,
      choices: data.choices?.map((choice: { index: number; message: { role: string; content: string }; finish_reason: string }) => ({
        index: choice.index,
        message: {
          role: 'assistant' as const,
          content: choice.message.content,
        },
        finish_reason: choice.finish_reason,
      })) || [],
      usage: data.usage ? {
        prompt_tokens: data.usage.prompt_tokens,
        completion_tokens: data.usage.completion_tokens,
        total_tokens: data.usage.total_tokens,
      } : undefined,
      created: data.created || Date.now(),
      service: 'wenxin',
    }
  }

  async *chatCompletionStream(request: ChatCompletionRequest): AsyncGenerator<AIStreamChunk> {
    const accessToken = await this.getAccessToken()

    const messages = request.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }))

    const response = await fetch(
      `https://qianfan.baidubce.com/v2/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          model: request.model,
          messages,
          temperature: request.temperature,
          max_output_tokens: request.max_tokens,
          stream: true,
        }),
      }
    )

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') return

            try {
              const parsed = JSON.parse(data)
              yield {
                id: parsed.id || '',
                delta: {
                  content: parsed.choices?.[0]?.delta?.content,
                },
                finish_reason: parsed.choices?.[0]?.finish_reason,
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async listModels(): Promise<string[]> {
    return [
      'ernie-4.0-8k-latest',
      'ernie-4.0-32k-latest',
      'ernie-3.5-8k-v2',
      'ernie-3.5-8k',
      'ernie-lite-8k',
    ]
  }
}

// ============================================
// OpenAI (境外备选)
// ============================================

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai'
  readonly defaultModel = 'gpt-4o'

  private apiKey: string
  private baseUrl: string
  private timeout: number
  private maxRetries: number

  constructor(config: AIConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1'
    this.timeout = config.timeout || 120000
    this.maxRetries = config.maxRetries || 3
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const url = `${this.baseUrl}/chat/completions`

    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        top_p: request.top_p,
        stream: false,
        tools: request.tools,
      }),
    })

    const data = await response.json()

    return {
      id: data.id,
      model: data.model,
      choices: data.choices?.map((choice: { index: number; message: { role: string; content: string }; finish_reason: string }) => ({
        index: choice.index,
        message: {
          role: 'assistant' as const,
          content: choice.message.content,
        },
        finish_reason: choice.finish_reason,
      })) || [],
      usage: data.usage ? {
        prompt_tokens: data.usage.prompt_tokens,
        completion_tokens: data.usage.completion_tokens,
        total_tokens: data.usage.total_tokens,
      } : undefined,
      created: data.created,
      service: 'openai',
    }
  }

  async *chatCompletionStream(request: ChatCompletionRequest): AsyncGenerator<AIStreamChunk> {
    const url = `${this.baseUrl}/chat/completions`

    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        top_p: request.top_p,
        stream: true,
        tools: request.tools,
      }),
    })

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') return

            try {
              const parsed = JSON.parse(data)
              yield {
                id: parsed.id || '',
                delta: {
                  content: parsed.choices?.[0]?.delta?.content,
                  role: parsed.choices?.[0]?.delta?.role,
                },
                finish_reason: parsed.choices?.[0]?.finish_reason,
                usage: parsed.usage ? {
                  prompt_tokens: parsed.usage.prompt_tokens,
                  completion_tokens: parsed.usage.completion_tokens,
                  total_tokens: parsed.usage.total_tokens,
                } : undefined,
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    })

    const data = await response.json()
    return data.data?.map((model: { id: string }) => model.id) || []
  }

  private async fetchWithRetry(url: string, options: RequestInit, retries = 0): Promise<Response> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok && retries < this.maxRetries) {
        await this.delay(Math.pow(2, retries) * 1000)
        return this.fetchWithRetry(url, options, retries + 1)
      }

      return response
    } catch (error) {
      if (retries < this.maxRetries) {
        await this.delay(Math.pow(2, retries) * 1000)
        return this.fetchWithRetry(url, options, retries + 1)
      }
      throw error
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ============================================
// MiniMax（海螺AI）
// ============================================

export class MiniMaxProvider implements AIProvider {
  readonly name = 'minimax'
  readonly defaultModel = 'abab6.5s-chat'

  private apiKey: string
  private baseUrl: string
  private timeout: number
  private maxRetries: number

  constructor(config: AIConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || 'https://api.minimax.chat/v1'
    this.timeout = config.timeout || 120000
    this.maxRetries = config.maxRetries || 3
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const url = `${this.baseUrl}/text/chatcompletion_v2`

    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        stream: false,
      }),
    })

    const data = await response.json()

    return {
      id: data.id || '',
      model: data.model || request.model,
      choices: data.choices?.map((choice: { index: number; message: { role: string; content: string }; finish_reason: string }) => ({
        index: choice.index,
        message: {
          role: 'assistant' as const,
          content: choice.message.content,
        },
        finish_reason: choice.finish_reason,
      })) || [],
      usage: data.usage ? {
        prompt_tokens: data.usage.prompt_tokens || 0,
        completion_tokens: data.usage.completion_tokens || 0,
        total_tokens: data.usage.total_tokens || 0,
      } : undefined,
      created: data.created || Date.now(),
      service: 'minimax',
    }
  }

  async *chatCompletionStream(request: ChatCompletionRequest): AsyncGenerator<AIStreamChunk> {
    const url = `${this.baseUrl}/text/chatcompletion_v2`

    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        stream: true,
      }),
    })

    if (!response.body) {
      throw new Error('Response body is null')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              yield { id: '', delta: { content: '' }, finish_reason: 'stop' }
              break
            }

            try {
              const parsed = JSON.parse(data)
              yield {
                id: parsed.id || '',
                delta: {
                  content: parsed.choices?.[0]?.delta?.content || '',
                },
                finish_reason: parsed.choices?.[0]?.finish_reason,
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async listModels(): Promise<string[]> {
    return [
      'abab6.5s-chat',
      'abab6.5-chat',
      'abab5.5-chat',
      'abab5s-chat',
    ]
  }

  private async fetchWithRetry(url: string, options: RequestInit, retries = 0): Promise<Response> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok && retries < this.maxRetries) {
        await this.delay(Math.pow(2, retries) * 1000)
        return this.fetchWithRetry(url, options, retries + 1)
      }

      return response
    } catch (error) {
      if (retries < this.maxRetries) {
        await this.delay(Math.pow(2, retries) * 1000)
        return this.fetchWithRetry(url, options, retries + 1)
      }
      throw error
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
