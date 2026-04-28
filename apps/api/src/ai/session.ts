/**
 * AI 会话管理器
 * 
 * 功能：
 * - 多轮对话上下文管理
 * - 消息历史存储
 * - 对话摘要（减少 Token 消耗）
 */

import { query } from '../lib/database.js'
import type { ChatMessage } from '../types.js'

// ============================================
// 配置
// ============================================

const MAX_CONTEXT_MESSAGES = 20 // 保留最近 N 条消息
const SUMMARY_THRESHOLD = 15    // 超过此数量开始考虑摘要
const MAX_TOKEN_BUDGET = 3000   // 单次请求最大 Token 数

// ============================================
// 会话管理
// ============================================

export interface Session {
  id: string
  user_id: string
  agent_id: string
  messages: ChatMessage[]
  summary?: string
  created_at: string
  updated_at: string
}

/**
 * 获取或创建会话
 */
export async function getOrCreateSession(
  userId: string,
  agentId: string
): Promise<Session | null> {
  try {
    // 查找最近的活跃会话
    const result = await query<{
      id: string
      user_id: string
      agent_id: string
      summary: string | null
      created_at: string
      updated_at: string
    }>(
      `SELECT id, user_id, agent_id, summary, created_at, updated_at
       FROM agent_sessions
       WHERE user_id = $1 AND agent_id = $2
       ORDER BY updated_at DESC
       LIMIT 1`,
      [userId, agentId]
    )

    if (result.rows.length > 0) {
      const row = result.rows[0]
      return {
        id: row.id,
        user_id: row.user_id,
        agent_id: row.agent_id,
        messages: await getSessionMessages(row.id),
        summary: row.summary || undefined,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }
    }

    return null
  } catch (error) {
    console.error('Get session error:', error)
    return null
  }
}

/**
 * 获取会话消息历史
 */
export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  try {
    const result = await query<{ role: string; content: string }>(
      `SELECT role, content
       FROM agent_session_messages
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [sessionId]
    )

    return result.rows.map(row => ({
      role: row.role as 'system' | 'user' | 'assistant',
      content: row.content,
    }))
  } catch (error) {
    console.error('Get session messages error:', error)
    return []
  }
}

/**
 * 添加消息到会话
 */
export async function addMessage(
  sessionId: string,
  message: ChatMessage
): Promise<void> {
  try {
    await query(
      `INSERT INTO agent_session_messages (session_id, role, content)
       VALUES ($1, $2, $3)`,
      [sessionId, message.role, message.content]
    )

    // 更新会话时间
    await query(
      `UPDATE agent_sessions SET updated_at = NOW() WHERE id = $1`,
      [sessionId]
    )
  } catch (error) {
    console.error('Add message error:', error)
    throw error
  }
}

/**
 * 构建带上下文的请求消息
 * 
 * 如果消息数量超过阈值，会使用摘要来减少 Token
 */
export async function buildContextMessages(
  sessionId: string,
  systemPrompt: string,
  newMessage: ChatMessage
): Promise<ChatMessage[]> {
  const messages: ChatMessage[] = []

  // 添加系统提示
  messages.push({
    role: 'system',
    content: systemPrompt,
  })

  // 获取历史消息
  const history = await getSessionMessages(sessionId)

  if (history.length >= SUMMARY_THRESHOLD) {
    // 需要摘要：只保留最近的消息 + 摘要
    const recentMessages = history.slice(-MAX_CONTEXT_MESSAGES)
    
    // 获取会话摘要
    const summary = await getSessionSummary(sessionId)
    
    if (summary) {
      messages.push({
        role: 'system',
        content: `[对话摘要] ${summary}`,
      })
    }

    messages.push(...recentMessages)
  } else {
    messages.push(...history)
  }

  // 添加新消息
  messages.push(newMessage)

  return messages
}

/**
 * 生成会话摘要
 * 使用 AI 来总结对话要点
 */
export async function generateSessionSummary(
  sessionId: string,
  aiCall: (messages: ChatMessage[]) => Promise<string>
): Promise<string | null> {
  try {
    const history = await getSessionMessages(sessionId)
    
    if (history.length < SUMMARY_THRESHOLD) {
      return null
    }

    const summaryPrompt: ChatMessage[] = [
      {
        role: 'system',
        content: `请用简洁的语言总结以下对话的要点，控制在100字以内：
        
格式：
- 讨论主题：[主题]
- 关键问题：[问题]
- 当前进展：[进展]

对话内容：
${history.map(m => `${m.role}: ${m.content}`).join('\n')}`,
      },
    ]

    const summary = await aiCall(summaryPrompt)

    // 保存摘要
    await query(
      `UPDATE agent_sessions SET summary = $1 WHERE id = $2`,
      [summary, sessionId]
    )

    return summary
  } catch (error) {
    console.error('Generate summary error:', error)
    return null
  }
}

async function getSessionSummary(sessionId: string): Promise<string | null> {
  try {
    const result = await query<{ summary: string | null }>(
      `SELECT summary FROM agent_sessions WHERE id = $1`,
      [sessionId]
    )
    return result.rows[0]?.summary || null
  } catch {
    return null
  }
}

/**
 * 计算消息的 Token 数（简化估算）
 */
export function estimateTokens(messages: ChatMessage[]): number {
  // 简化估算：中文按字符数/2，英文按单词数
  let total = 0
  
  for (const msg of messages) {
    const content = msg.content || ''
    // 粗略估算
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (content.match(/[a-zA-Z]+/g) || []).length
    
    // 每个中文字符约 1.5 Token，每个英文单词约 1.3 Token
    total += chineseChars * 1.5 + englishWords * 1.3
    
    // 加上角色标记开销
    total += 4
  }

  // 加上系统开销
  total += 3

  return Math.ceil(total)
}

/**
 * 检查是否超出 Token 预算
 */
export function exceedsTokenBudget(messages: ChatMessage[], maxTokens = MAX_TOKEN_BUDGET): boolean {
  return estimateTokens(messages) > maxTokens
}

/**
 * 截断消息以适应 Token 预算
 */
export function truncateMessagesToBudget(
  messages: ChatMessage[],
  maxTokens = MAX_TOKEN_BUDGET
): ChatMessage[] {
  if (!exceedsTokenBudget(messages, maxTokens)) {
    return messages
  }

  // 保留系统提示 + 最近的对话
  const systemMessages = messages.filter(m => m.role === 'system')
  const otherMessages = messages.filter(m => m.role !== 'system')

  let result = [...systemMessages]
  
  // 从最新的消息开始添加
  for (let i = otherMessages.length - 1; i >= 0; i--) {
    result.push(otherMessages[i])
    if (exceedsTokenBudget(result, maxTokens)) {
      result.pop()
      break
    }
  }

  return result
}

/**
 * 清理过期会话
 * 建议定时任务调用
 */
export async function cleanupExpiredSessions(daysOld = 30): Promise<number> {
  try {
    const result = await query(
      `DELETE FROM agent_sessions
       WHERE updated_at < NOW() - INTERVAL '${daysOld} days'
       RETURNING id`,
      []
    )

    return result.rowCount || 0
  } catch (error) {
    console.error('Cleanup sessions error:', error)
    return 0
  }
}

/**
 * 获取用户会话列表
 */
export async function getUserSessions(
  userId: string,
  agentId?: string,
  limit = 10,
  offset = 0
): Promise<Session[]> {
  try {
    const conditions = ['user_id = $1']
    const params: unknown[] = [userId]
    let paramIndex = 2

    if (agentId) {
      conditions.push(`agent_id = $${paramIndex++}`)
      params.push(agentId)
    }

    const result = await query<{
      id: string
      user_id: string
      agent_id: string
      summary: string | null
      created_at: string
      updated_at: string
    }>(
      `SELECT id, user_id, agent_id, summary, created_at, updated_at
       FROM agent_sessions
       WHERE ${conditions.join(' AND ')}
       ORDER BY updated_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    )

    return result.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      agent_id: row.agent_id,
      messages: [], // 不加载完整消息
      summary: row.summary || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))
  } catch (error) {
    console.error('Get user sessions error:', error)
    return []
  }
}