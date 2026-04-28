/**
 * 律植 WebSocket 实时通知服务
 *
 * 功能：
 * - WebSocket 连接管理
 * - 用户身份验证
 * - AI 对话流式输出（Server-Sent Events 替代）
 * - 消息推送（通知、实时更新）
 * - Redis Pub/Sub 支持分布式部署
 *
 * 场景：
 * 1. AI 对话流式输出（SSE - Server-Sent Events）
 * 2. 实时通知（新消息、新订单等）
 * 3. 智能体状态更新
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import websocket from '@fastify/websocket'
import { success, errors } from '../utils/response.js'
import type { JwtPayload } from '../types.js'

// ============================================
// WebSocket 消息类型
// ============================================

export type WSMessageType =
  | 'auth'
  | 'auth_ack'
  | 'error'
  | 'ping'
  | 'pong'
  | 'subscribe'
  | 'unsubscribe'
  | 'notification'
  | 'ai_chunk'
  | 'ai_complete'
  | 'ai_error'
  | 'presence'

export interface WSMessage {
  type: WSMessageType
  payload?: unknown
  id?: string
  timestamp?: number
}

export interface WSAuthPayload {
  token: string
}

export interface WSNotificationPayload {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  data?: unknown
}

export interface WSAIChunkPayload {
  sessionId: string
  chunk: string
  isEnd: boolean
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

// ============================================
// WebSocket 客户端管理
// ============================================

import type { WebSocket as WS } from '@fastify/websocket'

interface WSClient {
  id: string
  userId: string
  socket: WS
  subscriptions: Set<string>
  lastPing: number
}

// 存储所有连接的客户端
const clients = new Map<string, WSClient>()

// 订阅主题 -> 客户端 ID 列表
const subscriptions = new Map<string, Set<string>>()

// 生成客户端 ID
function generateClientId(): string {
  return `ws_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

// 添加客户端
function addClient(client: WSClient) {
  clients.set(client.id, client)
}

// 移除客户端
function removeClient(clientId: string) {
  const client = clients.get(clientId)
  if (client) {
    // 取消所有订阅
    client.subscriptions.forEach(topic => {
      const subscribers = subscriptions.get(topic)
      if (subscribers) {
        subscribers.delete(clientId)
        if (subscribers.size === 0) {
          subscriptions.delete(topic)
        }
      }
    })
    clients.delete(clientId)
  }
}

// 订阅主题
function subscribe(clientId: string, topic: string) {
  const client = clients.get(clientId)
  if (!client) return

  client.subscriptions.add(topic)

  if (!subscriptions.has(topic)) {
    subscriptions.set(topic, new Set())
  }
  subscriptions.get(topic)!.add(clientId)
}

// 取消订阅
function unsubscribe(clientId: string, topic: string) {
  const client = clients.get(clientId)
  if (!client) return

  client.subscriptions.delete(topic)

  const subscribers = subscriptions.get(topic)
  if (subscribers) {
    subscribers.delete(clientId)
    if (subscribers.size === 0) {
      subscriptions.delete(topic)
    }
  }
}

// 广播消息到主题
function broadcastToTopic(topic: string, message: WSMessage) {
  const subscribers = subscriptions.get(topic)
  if (!subscribers) return

  const messageStr = JSON.stringify(message)

  subscribers.forEach(clientId => {
    const client = clients.get(clientId)
    if (client && client.socket.readyState === 1) { // OPEN
      client.socket.send(messageStr)
    }
  })
}

// 发送消息给指定用户（所有连接）
function sendToUser(userId: string, message: WSMessage) {
  clients.forEach(client => {
    if (client.userId === userId && client.socket.readyState === 1) {
      client.socket.send(JSON.stringify(message))
    }
  })
}

// ============================================
// 消息处理
// ============================================

async function handleMessage(
  client: WSClient,
  message: WSMessage,
  fastify: FastifyInstance
): Promise<void> {
  switch (message.type) {
    case 'ping':
      client.lastPing = Date.now()
      client.socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
      break

    case 'subscribe':
      if (typeof message.payload === 'string') {
        subscribe(client.id, message.payload)
        client.socket.send(JSON.stringify({
          type: 'subscribe',
          payload: { topic: message.payload, success: true },
          id: message.id,
        }))
      }
      break

    case 'unsubscribe':
      if (typeof message.payload === 'string') {
        unsubscribe(client.id, message.payload)
        client.socket.send(JSON.stringify({
          type: 'unsubscribe',
          payload: { topic: message.payload, success: true },
          id: message.id,
        }))
      }
      break

    case 'presence':
      // 在线状态查询
      const presenceData = {
        online: clients.size,
        userOnline: Array.from(new Set(Array.from(clients.values()).map(c => c.userId))).length,
      }
      client.socket.send(JSON.stringify({
        type: 'presence',
        payload: presenceData,
        id: message.id,
      }))
      break

    default:
      client.socket.send(JSON.stringify({
        type: 'error',
        payload: { message: `Unknown message type: ${message.type}` },
        id: message.id,
      }))
  }
}

// ============================================
// JWT 验证
// ============================================

async function verifyToken(token: string, fastify: FastifyInstance): Promise<JwtPayload | null> {
  try {
    const decoded = await fastify.jwt.verify<JwtPayload>(token)
    return decoded
  } catch {
    return null
  }
}

// ============================================
// SSE 流式输出（替代 WebSocket 用于 AI 对话）
// ============================================

export async function createAIStreamHandler(
  request: {
    sessionId: string
    messages: Array<{ role: string; content: string }>
    model?: string
    userId?: string
  },
  onChunk: (chunk: string) => void,
  onComplete: (usage?: { promptTokens: number; completionTokens: number; totalTokens: number }) => void,
  onError: (error: Error) => void
): Promise<() => void> {
  const { sessionId, messages, model, userId } = request

  // 这里可以接入 AI 服务
  // 暂时返回空实现

  const cleanup = () => {
    console.log(`[SSE] Cleanup stream: ${sessionId}`)
  }

  return cleanup
}

// ============================================
// WebSocket 路由
// ============================================

export const websocketRoute: FastifyPluginAsync = async (app: FastifyInstance) => {

  // 注册 WebSocket 插件
  await app.register(websocket, {
    options: {
      maxPayload: 1024 * 1024, // 1MB
    },
  })

  // ============================================
  // WebSocket 端点
  // ============================================
  app.get('/ws', { websocket: true }, (socket, request) => {
    const clientId = generateClientId()
    const client: WSClient = {
      id: clientId,
      userId: '',
      socket,
      subscriptions: new Set(),
      lastPing: Date.now(),
    }

    addClient(client)

    console.log(`[WS] Client connected: ${clientId}`)

    // 发送连接确认
    socket.send(JSON.stringify({
      type: 'auth',
      payload: { clientId, message: 'Connected. Please authenticate.' },
    }))

    // 处理消息
    socket.on('message', async (data) => {
      try {
        const message: WSMessage = JSON.parse(data.toString())

        // 认证消息单独处理
        if (message.type === 'auth') {
          const payload = message.payload as WSAuthPayload
          if (!payload?.token) {
            socket.send(JSON.stringify({
              type: 'error',
              payload: { message: 'Token required' },
              id: message.id,
            }))
            return
          }

          const user = await verifyToken(payload.token, app)
          if (!user) {
            socket.send(JSON.stringify({
              type: 'error',
              payload: { message: 'Invalid token' },
              id: message.id,
            }))
            return
          }

          // 更新客户端用户信息
          client.userId = user.id
          client.subscriptions.add(`user:${user.id}`) // 自动订阅用户通知

          socket.send(JSON.stringify({
            type: 'auth_ack',
            payload: {
              clientId,
              userId: user.id,
              nickname: user.nickname,
            },
            id: message.id,
          }))

          console.log(`[WS] Client authenticated: ${clientId} -> user:${user.id}`)
          return
        }

        // 其他消息需要先认证
        if (!client.userId) {
          socket.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Not authenticated' },
            id: message.id,
          }))
          return
        }

        await handleMessage(client, message, app)
      } catch (error) {
        console.error('[WS] Message error:', error)
        socket.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Invalid message format' },
        }))
      }
    })

    // 错误处理
    socket.on('error', (error) => {
      console.error(`[WS] Socket error: ${clientId}`, error)
    })

    // 关闭处理
    socket.on('close', () => {
      console.log(`[WS] Client disconnected: ${clientId}`)
      removeClient(clientId)
    })

    // 心跳检测
    const pingInterval = setInterval(() => {
      if (client.socket.readyState === 1) {
        client.socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
      }
    }, 30000)

    socket.on('close', () => {
      clearInterval(pingInterval)
    })
  })

  // ============================================
  // SSE 流式输出端点（用于 AI 对话）
  // ============================================
  app.get('/api/ai/stream/:sessionId', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string }
    const user = request.user as JwtPayload

    // 设置 SSE 头
    reply.raw?.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    })

    // 发送初始连接确认
    reply.raw?.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`)

    // 这里可以接入实际的 AI 流式服务
    // 暂时发送模拟数据

    // 模拟流式输出
    const chunks = ['你', '好', '，', '欢', '迎', '使', '用', '律', '植', '智', '能', '助', '手', '！']
    for (let i = 0; i < chunks.length; i++) {
      const isEnd = i === chunks.length - 1
      reply.raw?.write(`data: ${JSON.stringify({
        type: 'ai_chunk',
        sessionId,
        chunk: chunks[i],
        isEnd,
        usage: isEnd ? {
          promptTokens: 10,
          completionTokens: 13,
          totalTokens: 23,
        } : undefined,
      })}\n\n`)

      await new Promise(resolve => setTimeout(resolve, 100))
    }

    reply.raw?.write(`data: ${JSON.stringify({ type: 'ai_complete', sessionId })}\n\n`)
    reply.raw?.end()
  })

  // ============================================
  // 发送通知到指定用户
  // ============================================
  app.post<{ Body: { userId: string; notification: WSNotificationPayload } }>(
    '/api/notifications/send',
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const { userId, notification } = request.body

      if (!userId || !notification) {
        return errors.badRequest(reply, '缺少 userId 或 notification')
      }

      // 验证权限（只有管理员可以发送通知）
      const user = request.user as JwtPayload
      if (user.role !== 'admin') {
        return errors.forbidden(reply, '需要管理员权限')
      }

      sendToUser(userId, {
        type: 'notification',
        payload: notification,
        timestamp: Date.now(),
      })

      return success(reply, { sent: true, userId })
    }
  )

  // ============================================
  // 广播通知到所有在线用户
  // ============================================
  app.post<{ Body: { notification: WSNotificationPayload; topic?: string } }>(
    '/api/notifications/broadcast',
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const { notification, topic } = request.body

      if (!notification) {
        return errors.badRequest(reply, '缺少 notification')
      }

      // 验证权限
      const user = request.user as JwtPayload
      if (user.role !== 'admin') {
        return errors.forbidden(reply, '需要管理员权限')
      }

      if (topic) {
        // 广播到指定主题
        broadcastToTopic(topic, {
          type: 'notification',
          payload: notification,
          timestamp: Date.now(),
        })
      } else {
        // 广播到所有在线用户
        const message: WSMessage = {
          type: 'notification',
          payload: notification,
          timestamp: Date.now(),
        }

        clients.forEach(client => {
          if (client.socket.readyState === 1) {
            client.socket.send(JSON.stringify(message))
          }
        })
      }

      return success(reply, {
        sent: true,
        onlineClients: clients.size,
      })
    }
  )

  // ============================================
  // 获取在线状态
  // ============================================
  app.get('/api/ws/status', async (request, reply) => {
    const onlineUsers = Array.from(new Set(Array.from(clients.values()).map(c => c.userId)))
    const topics = Array.from(subscriptions.keys())

    return success(reply, {
      totalConnections: clients.size,
      onlineUsers: onlineUsers.length,
      onlineUserIds: onlineUsers.filter(Boolean),
      topics: topics.map(topic => ({
        name: topic,
        subscribers: subscriptions.get(topic)?.size || 0,
      })),
    })
  })
}

// ============================================
// 导出工具函数（供其他模块使用）
// ============================================

export const wsManager = {
  sendToUser,
  broadcastToTopic,
  subscribe,
  unsubscribe,
  getOnlineCount: () => clients.size,
  getOnlineUsers: () => Array.from(new Set(Array.from(clients.values()).map(c => c.userId))),
}

export default websocketRoute
