/**
 * AI 对话 API 路由
 *
 * 集成：
 * - AI Provider 抽象层
 * - 法律智能体专用工具
 * - 多轮对话会话管理
 * - Redis 缓存支持
 * - API Key 用户绑定校验
 */

import type { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { query, transaction } from '../lib/database.js'
import { success, errors } from '../utils/response.js'
import { chatSchema } from '../utils/validation.js'
import { getAIService } from '../ai/index.js'
import { getCategorySystemPrompt, getLegalTools, executeTool, filterUnsafeContent } from '../ai/index.js'
import { buildContextMessages, addMessage, getSessionMessages } from '../ai/index.js'
import { incrementAPICallCount, cacheAIResponse, getCachedAIResponse } from '../utils/cache.js'
import crypto from 'crypto'
import type { JwtPayload, ChatMessage } from '../types.js'

// ============================================
// API Key 校验中间件
// ============================================
async function validateApiKey(request: FastifyRequest, reply: FastifyReply) {
  const apiKey = request.headers['x-api-key'] as string | undefined
  const apiSecret = request.headers['x-api-secret'] as string | undefined

  // 如果没有 API Key 头，跳过验证（使用 JWT 认证）
  if (!apiKey && !apiSecret) {
    return
  }

  if (!apiKey || !apiSecret) {
    return errors.unauthorized(reply, 'Missing API credentials')
  }

  try {
    // 调用数据库函数验证 API Key
    const result = await query<{
      valid: boolean
      user_id: string
      rate_limit: number
      daily_quota: number
      message: string
    }>(
      'SELECT * FROM validate_api_key($1, $2)',
      [apiKey, apiSecret]
    )

    if (result.rows.length === 0 || !result.rows[0].valid) {
      return errors.unauthorized(reply, result.rows[0]?.message || 'Invalid API credentials')
    }

    const credential = result.rows[0]

    // 检查今日配额
    const todayUsage = await query<{ total_calls: number }>(
      `SELECT COALESCE(SUM(total_calls), 0) as total_calls 
       FROM api_usage_stats 
       WHERE user_id = $1 AND date = CURRENT_DATE`,
      [credential.user_id]
    )

    if (todayUsage.rows[0].total_calls >= credential.daily_quota) {
      return errors.badRequest(reply, `Daily API quota exceeded (${credential.daily_quota} calls/day)`)
    }

    // 将用户信息附加到请求上
    ;(request as FastifyRequest & { user: JwtPayload; apiCredential: { id: string; rateLimit: number } }).user = {
      ...(request.user as JwtPayload),
      id: credential.user_id,
      user_id: credential.user_id,
      role: 'creator',
    }
    ;(request as FastifyRequest & { apiCredential: { id: string; rateLimit: number } }).apiCredential = {
      id: credential.user_id,
      rateLimit: credential.rate_limit,
    }

  } catch (err) {
    console.error('API Key validation error:', err)
    return errors.unauthorized(reply, 'Failed to validate API credentials')
  }
}

// ============================================
// API Key 管理接口（仅创建者和管理员）
// ============================================
async function createApiKeyRoutes(app: FastifyInstance) {

  // GET /api/ai/credentials - 获取用户的 API Key 列表
  app.get('/api/ai/credentials', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (user.role !== 'creator' && user.role !== 'admin') {
      return errors.forbidden(reply, 'Only creators and admins can manage API keys')
    }

    try {
      const result = await query(
        `SELECT id, name, rate_limit, daily_quota, is_active, last_used_at, created_at, expires_at
         FROM api_credentials
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [user.user_id]
      )

      return success(reply, result.rows)
    } catch (err) {
      console.error('Get credentials error:', err)
      return errors.internal(reply, 'Failed to get API keys')
    }
  })

  // POST /api/ai/credentials - 创建新的 API Key
  app.post('/api/ai/credentials', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { name, rate_limit, daily_quota, expires_at } = request.body as {
      name?: string
      rate_limit?: number
      daily_quota?: number
      expires_at?: string
    }

    if (user.role !== 'creator' && user.role !== 'admin') {
      return errors.forbidden(reply, 'Only creators and admins can create API keys')
    }

    try {
      const result = await query<{ api_key: string; api_secret: string }>(
        'SELECT * FROM generate_api_key($1, $2)',
        [user.user_id, name || 'Default']
      )

      if (result.rows.length === 0) {
        return errors.internal(reply, 'Failed to generate API key')
      }

      const newKey = result.rows[0]

      // 更新配额设置
      if (rate_limit || daily_quota || expires_at) {
        await query(
          `UPDATE api_credentials 
           SET rate_limit = COALESCE($1, rate_limit),
               daily_quota = COALESCE($2, daily_quota),
               expires_at = $3
           WHERE api_key = $4 AND user_id = $5`,
          [rate_limit || 1000, daily_quota || 10000, expires_at, newKey.api_key, user.user_id]
        )
      }

      return success(reply, {
        api_key: newKey.api_key,
        api_secret: newKey.api_secret,
        message: 'Store the API secret securely - it will not be shown again'
      }, 'API key created successfully')

    } catch (err) {
      console.error('Create credential error:', err)
      return errors.internal(reply, 'Failed to create API key')
    }
  })

  // DELETE /api/ai/credentials/:id - 删除 API Key
  app.delete<{ Params: { id: string } }>('/api/ai/credentials/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { id } = request.params

    try {
      const result = await query(
        `DELETE FROM api_credentials 
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [id, user.user_id]
      )

      if (result.rowCount === 0) {
        return errors.notFound(reply, 'API key not found')
      }

      return success(reply, null, 'API key deleted successfully')

    } catch (err) {
      console.error('Delete credential error:', err)
      return errors.internal(reply, 'Failed to delete API key')
    }
  })

  // PUT /api/ai/credentials/:id - 更新 API Key 设置
  app.put<{ Params: { id: string } }>('/api/ai/credentials/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { id } = request.params
    const { name, rate_limit, daily_quota, is_active, expires_at } = request.body as {
      name?: string
      rate_limit?: number
      daily_quota?: number
      is_active?: boolean
      expires_at?: string
    }

    try {
      const result = await query(
        `UPDATE api_credentials 
         SET name = COALESCE($1, name),
             rate_limit = COALESCE($2, rate_limit),
             daily_quota = COALESCE($3, daily_quota),
             is_active = COALESCE($4, is_active),
             expires_at = $5
         WHERE id = $6 AND user_id = $7
         RETURNING id`,
        [name, rate_limit, daily_quota, is_active, expires_at, id, user.user_id]
      )

      if (result.rowCount === 0) {
        return errors.notFound(reply, 'API key not found')
      }

      return success(reply, null, 'API key updated successfully')

    } catch (err) {
      console.error('Update credential error:', err)
      return errors.internal(reply, 'Failed to update API key')
    }
  })
}

export const aiRoute: FastifyPluginAsync = async (app: FastifyInstance) => {

  // 注册 API Key 管理路由
  await createApiKeyRoutes(app)

  // ============================================
  // POST /api/ai/chat - AI 对话 (需要认证)
  // ============================================
  app.post('/api/ai/chat', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const validation = chatSchema.safeParse(request.body)
    if (!validation.success) {
      return errors.badRequest(reply, validation.error.errors[0].message)
    }

    const user = request.user as JwtPayload
    const { agent_id, messages, stream } = validation.data

    // 安全过滤
    const lastMessage = messages[messages.length - 1]?.content || ''
    const { safe } = filterUnsafeContent(lastMessage)
    if (!safe) {
      return errors.badRequest(reply, 'Content contains prohibited topics')
    }

    try {
      // 获取智能体信息
      const agent = await query<{
        id: string
        name: string
        price: number
        is_free_trial: boolean
        trial_quota: number
        status: string
        config: object
        category: string
      }>(
        'SELECT id, name, price, is_free_trial, trial_quota, status, config, category FROM agents WHERE id = $1',
        [agent_id]
      )

      if (agent.rows.length === 0) {
        return errors.notFound(reply, 'Agent not found')
      }

      const agentData = agent.rows[0]

      if (agentData.status !== 'active' && agentData.status !== 'offline') {
        return errors.forbidden(reply, 'Agent is not available')
      }

      // 解析配置
      const config = typeof agentData.config === 'string'
        ? JSON.parse(agentData.config)
        : (agentData.config || {})

      // 检查免费试用
      let useFreeTrial = false
      let cost = 0

      if (agentData.is_free_trial) {
        const trialUsage = await query<{ count: string }>(
          `SELECT COUNT(*) as count FROM agent_sessions
           WHERE user_id = $1 AND agent_id = $2 AND used_free_trial = true`,
          [user.user_id, agent_id]
        )

        if (parseInt(trialUsage.rows[0]?.count || '0') < agentData.trial_quota) {
          useFreeTrial = true
        }
      }

      if (!useFreeTrial && agentData.price > 0) {
        const balance = await query<{ balance: number }>(
          'SELECT balance FROM user_balances WHERE user_id = $1',
          [user.user_id]
        )

        if (balance.rows.length === 0 || balance.rows[0].balance < agentData.price) {
          return errors.badRequest(reply, 'Insufficient balance')
        }

        cost = agentData.price
      }

      // 创建或获取会话
      let sessionId: string
      const existingSession = await query<{ id: string }>(
        `SELECT id FROM agent_sessions
         WHERE user_id = $1 AND agent_id = $2
         ORDER BY updated_at DESC LIMIT 1`,
        [user.user_id, agent_id]
      )

      if (existingSession.rows.length > 0) {
        sessionId = existingSession.rows[0].id
      } else {
        const newSession = await query<{ id: string }>(
          `INSERT INTO agent_sessions (user_id, agent_id, used_free_trial)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [user.user_id, agent_id, useFreeTrial]
        )
        sessionId = newSession.rows[0].id
      }

      // 构建系统提示
      const systemPrompt = getCategorySystemPrompt(agentData.category, agentData.name)

      // 检查缓存（对于非流式请求，可以缓存热点问题的答案）
      const cacheKey = crypto.createHash('md5')
        .update(`${agent_id}:${lastMessage}`)
        .digest('hex')

      // 尝试从缓存获取（仅对首轮对话且非免费试用生效）
      if (!stream && useFreeTrial) {
        const cachedResponse = await getCachedAIResponse(cacheKey)
        if (cachedResponse) {
          console.log('[CACHE] Returning cached AI response')

          // 记录缓存命中
          await incrementAPICallCount(user.user_id, new Date().toISOString().split('T')[0])

          return success(reply, {
            session_id: sessionId,
            message: {
              role: 'assistant',
              content: cachedResponse,
            },
            cached: true,
            usage: null,
          })
        }
      }

      // 构建带上下文的请求
      const userMessage: ChatMessage = {
        role: 'user',
        content: lastMessage,
      }

      const requestMessages = await buildContextMessages(
        sessionId,
        systemPrompt,
        userMessage
      )

      // 调用 AI 服务
      const aiManager = getAIService()
      const aiResponse = await aiManager.chat({
        model: config.model || 'glm-4',
        messages: requestMessages,
        temperature: config.temperature || 0.7,
        max_tokens: config.max_tokens || 2000,
        tools: config.tools ? getLegalTools() : undefined,
      })

      // 获取 AI 回复
      const assistantContent = aiResponse.choices[0]?.message?.content || ''

      // 缓存 AI 回复（5分钟热点缓存）
      if (!stream && assistantContent) {
        await cacheAIResponse(cacheKey, assistantContent)
      }

      // 记录消息
      await addMessage(sessionId, userMessage)
      await addMessage(sessionId, {
        role: 'assistant',
        content: assistantContent,
      })

      // 更新会话
      if (useFreeTrial) {
        await query(
          'UPDATE agents SET trial_count = trial_count + 1 WHERE id = $1',
          [agent_id]
        )
      }

      // 扣费
      let balanceBefore = 0
      let balanceAfter = 0

      if (cost > 0) {
        const balanceResult = await transaction(async (client) => {
          await client.query(
            'UPDATE user_balances SET balance = balance - $1 WHERE user_id = $2',
            [cost, user.user_id]
          )

          const currentBalance = await client.query<{ balance: number }>(
            'SELECT balance FROM user_balances WHERE user_id = $1',
            [user.user_id]
          )

          const newBalance = currentBalance.rows[0]?.balance || 0
          const oldBalance = newBalance + cost

          await client.query(
            `INSERT INTO balance_transactions (user_id, type, amount, balance_before, balance_after, status, description)
             VALUES ($1, 'consume', $2, $3, $4, 'completed', $5)`,
            [user.user_id, cost, oldBalance, newBalance, `使用智能体: ${agentData.name}`]
          )

          // 记录 API 调用
          await client.query(
            `INSERT INTO api_call_logs (user_id, agent_id, session_id, model, tokens_used, cost, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'success')`,
            [user.user_id, agent_id, sessionId, config.model || 'glm-4', aiResponse.usage?.total_tokens || 0, cost]
          )

          // 更新每日统计
          const today = new Date().toISOString().split('T')[0]
          await client.query(
            `INSERT INTO api_usage_stats (user_id, date, total_calls, total_tokens, total_cost)
             VALUES ($1, $2, 1, $3, $4)
             ON CONFLICT (user_id, date) DO UPDATE
             SET total_calls = api_usage_stats.total_calls + 1,
                 total_tokens = api_usage_stats.total_tokens + $3,
                 total_cost = api_usage_stats.total_cost + $4`,
            [user.user_id, today, aiResponse.usage?.total_tokens || 0, cost]
          )

          return { balanceBefore: oldBalance, balanceAfter: newBalance }
        })

        balanceBefore = balanceResult.balanceBefore
        balanceAfter = balanceResult.balanceAfter
      }

      return success(reply, {
        session_id: sessionId,
        message: {
          role: 'assistant',
          content: assistantContent,
        },
        usage: aiResponse.usage,
        balance_before: balanceBefore || undefined,
        balance_after: balanceAfter || undefined,
      })

    } catch (err) {
      console.error('Chat error:', err)

      // 记录失败的调用
      await query(
        `INSERT INTO api_call_logs (user_id, agent_id, error_message, status)
         VALUES ($1, $2, $3, 'failed')`,
        [user.user_id, agent_id, err instanceof Error ? err.message : 'Unknown error']
      )

      return errors.internal(reply, 'Failed to process chat')
    }
  })

  // ============================================
  // POST /api/ai/chat/stream - AI 对话 (流式) (需要认证)
  // ============================================
  app.post('/api/ai/chat/stream', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const validation = chatSchema.safeParse(request.body)
    if (!validation.success) {
      return errors.badRequest(reply, validation.error.errors[0].message)
    }

    const user = request.user as JwtPayload
    const { agent_id, messages } = validation.data

    // 安全过滤
    const lastMessage = messages[messages.length - 1]?.content || ''
    const { safe } = filterUnsafeContent(lastMessage)
    if (!safe) {
      return errors.badRequest(reply, 'Content contains prohibited topics')
    }

    try {
      const agent = await query<{
        id: string
        name: string
        price: number
        is_free_trial: boolean
        trial_quota: number
        status: string
        config: object
        category: string
      }>(
        'SELECT id, name, price, is_free_trial, trial_quota, status, config, category FROM agents WHERE id = $1',
        [agent_id]
      )

      if (agent.rows.length === 0) {
        return errors.notFound(reply, 'Agent not found')
      }

      const agentData = agent.rows[0]

      if (agentData.status !== 'active' && agentData.status !== 'offline') {
        return errors.forbidden(reply, 'Agent is not available')
      }

      const config = typeof agentData.config === 'string'
        ? JSON.parse(agentData.config)
        : (agentData.config || {})

      // 设置流式响应
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      })

      // 获取 AI 服务并流式输出
      const aiManager = getAIService()
      const userMessage: ChatMessage = {
        role: 'user',
        content: lastMessage,
      }

      const systemPrompt = getCategorySystemPrompt(agentData.category, agentData.name)
      const requestMessages = await buildContextMessages(
        agent_id, // 使用 agent_id 作为会话标识
        systemPrompt,
        userMessage
      )

      let fullContent = ''
      let totalTokens = 0

      for await (const { chunk, done } of aiManager.chatStream({
        model: config.model || 'glm-4',
        messages: requestMessages,
        temperature: config.temperature || 0.7,
        max_tokens: config.max_tokens || 2000,
      })) {
        if (chunk.delta.content) {
          fullContent += chunk.delta.content
          reply.raw.write(`data: ${JSON.stringify({ content: chunk.delta.content })}\n\n`)
        }

        if (done) {
          totalTokens = 200 // 简化估算
        }
      }

      reply.raw.write('data: [DONE]\n\n')
      reply.raw.end()

      // 后置处理：保存消息和扣费（必须等待完成）
      try {
        await transaction(async (client) => {
          // 获取或创建会话
          let sessionId = agent_id
          const existingSession = await client.query<{ id: string }>(
            `SELECT id FROM agent_sessions
             WHERE user_id = $1 AND agent_id = $2
             ORDER BY updated_at DESC LIMIT 1`,
            [user.user_id, agent_id]
          )

          if (existingSession.rows.length > 0) {
            sessionId = existingSession.rows[0].id
          } else {
            const newSession = await client.query<{ id: string }>(
              `INSERT INTO agent_sessions (user_id, agent_id)
               VALUES ($1, $2)
               RETURNING id`,
              [user.user_id, agent_id]
            )
            sessionId = newSession.rows[0].id
          }

          // 保存消息
          await client.query(
            `INSERT INTO agent_session_messages (session_id, role, content)
             VALUES ($1, 'user', $2), ($1, 'assistant', $3)`,
            [sessionId, lastMessage, fullContent]
          )

          await client.query(
            'UPDATE agent_sessions SET updated_at = NOW() WHERE id = $1',
            [sessionId]
          )

          // 记录 API 调用
          await client.query(
            `INSERT INTO api_call_logs (user_id, agent_id, session_id, model, tokens_used, status)
             VALUES ($1, $2, $3, $4, $5, 'success')`,
            [user.user_id, agent_id, sessionId, config.model || 'glm-4', totalTokens]
          )
        })
      } catch (postProcessError) {
        // 后置处理失败不应该影响已完成的流式响应
        console.error('Stream post-processing failed:', postProcessError)
      }

    } catch (err) {
      console.error('Stream chat error:', err)
      reply.raw.write(`data: ${JSON.stringify({ error: 'Failed to process chat' })}\n\n`)
      reply.raw.end()
    }
  })

  // ============================================
  // GET /api/ai/sessions - 获取会话历史 (需要认证)
  // ============================================
  app.get('/api/ai/sessions', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    const {
      page = '1',
      pageSize = '20',
      agent_id,
    } = request.query as {
      page?: string
      pageSize?: string
      agent_id?: string
    }

    const pageNum = parseInt(page)
    const pageSizeNum = parseInt(pageSize)
    const offset = (pageNum - 1) * pageSizeNum

    try {
      const conditions: string[] = ['s.user_id = $1']
      const params: unknown[] = [user.user_id]
      let paramIndex = 2

      if (agent_id) {
        conditions.push(`s.agent_id = $${paramIndex++}`)
        params.push(agent_id)
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`

      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM agent_sessions s ${whereClause}`,
        params
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      params.push(pageSizeNum, offset)
      const result = await query(
        `SELECT s.id, s.agent_id, a.name as agent_name, a.avatar_url as agent_avatar,
                s.used_free_trial, s.created_at, s.summary,
                (SELECT COUNT(*) FROM agent_session_messages WHERE session_id = s.id) as message_count
         FROM agent_sessions s
         JOIN agents a ON a.id = s.agent_id
         ${whereClause}
         ORDER BY s.updated_at DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params
      )

      return success(reply, {
        items: result.rows,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(total / pageSizeNum),
      })

    } catch (err) {
      console.error('Get sessions error:', err)
      return errors.internal(reply, 'Failed to get sessions')
    }
  })

  // ============================================
  // GET /api/ai/sessions/:id - 获取会话详情 (需要认证)
  // ============================================
  app.get<{ Params: { id: string } }>('/api/ai/sessions/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params
    const user = request.user as JwtPayload

    try {
      const session = await query(
        `SELECT s.id, s.agent_id, s.user_id, s.used_free_trial, s.created_at, s.summary,
                a.name as agent_name, a.avatar_url as agent_avatar
         FROM agent_sessions s
         JOIN agents a ON a.id = s.agent_id
         WHERE s.id = $1 AND s.user_id = $2`,
        [id, user.user_id]
      )

      if (session.rows.length === 0) {
        return errors.notFound(reply, 'Session not found')
      }

      const messages = await getSessionMessages(id)

      return success(reply, {
        ...session.rows[0],
        messages,
      })

    } catch (err) {
      console.error('Get session error:', err)
      return errors.internal(reply, 'Failed to get session')
    }
  })

  // ============================================
  // DELETE /api/ai/sessions/:id - 删除会话 (需要认证)
  // ============================================
  app.delete<{ Params: { id: string } }>('/api/ai/sessions/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params
    const user = request.user as JwtPayload

    try {
      const result = await query(
        `DELETE FROM agent_sessions
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [id, user.user_id]
      )

      if (result.rowCount === 0) {
        return errors.notFound(reply, 'Session not found')
      }

      return success(reply, null, 'Session deleted')

    } catch (err) {
      console.error('Delete session error:', err)
      return errors.internal(reply, 'Failed to delete session')
    }
  })

  // ============================================
  // GET /api/ai/stats - 获取 AI 使用统计 (需要认证)
  // ============================================
  app.get('/api/ai/stats', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    try {
      const [totalCalls, totalConsume, todayCalls, monthlyConsume] = await Promise.all([
        query<{ count: string }>(
          'SELECT COUNT(*) as count FROM agent_sessions WHERE user_id = $1',
          [user.user_id]
        ),
        query<{ total: string }>(
          `SELECT COALESCE(SUM(amount), 0) as total FROM balance_transactions
           WHERE user_id = $1 AND type = 'consume' AND status = 'completed'`,
          [user.user_id]
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM agent_sessions
           WHERE user_id = $1 AND created_at >= CURRENT_DATE`,
          [user.user_id]
        ),
        query<{ total: string }>(
          `SELECT COALESCE(SUM(amount), 0) as total FROM balance_transactions
           WHERE user_id = $1 AND type = 'consume' AND status = 'completed'
           AND created_at >= DATE_TRUNC('month', CURRENT_DATE)`,
          [user.user_id]
        ),
      ])

      // 获取各智能体使用统计
      const agentUsage = await query(
        `SELECT a.id, a.name, COUNT(*) as call_count
         FROM agent_sessions s
         JOIN agents a ON a.id = s.agent_id
         WHERE s.user_id = $1
         GROUP BY a.id, a.name
         ORDER BY call_count DESC
         LIMIT 5`,
        [user.user_id]
      )

      return success(reply, {
        total_calls: parseInt(totalCalls.rows[0]?.count || '0'),
        total_consume: parseInt(totalConsume.rows[0]?.total || '0'),
        today_calls: parseInt(todayCalls.rows[0]?.count || '0'),
        monthly_consume: parseInt(monthlyConsume.rows[0]?.total || '0'),
        top_agents: agentUsage.rows,
      })

    } catch (err) {
      console.error('Get AI stats error:', err)
      return errors.internal(reply, 'Failed to get stats')
    }
  })

  // ============================================
  // 模型列表 (公开接口)
  // ============================================
  app.get('/api/ai/models', async (request, reply) => {
    try {
      const aiManager = getAIService()
      const models = await aiManager.listModels()
      return success(reply, models)
    } catch (err) {
      // 如果没有配置 AI Provider，返回空列表
      console.warn('AI providers not configured:', err instanceof Error ? err.message : err)
      return success(reply, {})
    }
  })

  // ============================================
  // GET /api/ai/health - AI 服务健康检查
  // ============================================
  app.get('/api/ai/health', async (request, reply) => {
    try {
      const aiManager = getAIService()
      const stats = aiManager.getStats()
      return success(reply, {
        providers: Object.keys(stats),
        stats,
      })
    } catch (err) {
      console.warn('AI providers not configured:', err instanceof Error ? err.message : err)
      return success(reply, {
        providers: [],
        stats: {},
      })
    }
  })
}
