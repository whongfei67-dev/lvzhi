/**
 * JWT 认证插件
 */

import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import jwt from '@fastify/jwt'
import type { JwtPayload, UserRole } from '../types.js'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: JwtPayload
  }
}

export interface AuthOptions {
  roles?: UserRole[]
}

async function authPlugin(app: FastifyInstance) {
  const jwtSecret = process.env.JWT_SECRET

  // 生产环境必须配置 JWT_SECRET
  if (!jwtSecret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is required in production')
    }
    console.warn('[WARNING] JWT_SECRET not set, using development secret. DO NOT use in production!')
  }

  // 注册 JWT 插件（与登录时写入的 lvzhi_access_token httpOnly Cookie 对齐）
  await app.register(jwt, {
    secret: jwtSecret || 'lvzhi-dev-secret-NOT-FOR-PRODUCTION',
    sign: {
      expiresIn: '7d',
    },
    verify: {
      maxAge: '7d',
    },
    cookie: {
      cookieName: 'lvzhi_access_token',
      signed: false,
    },
  })

  // 认证装饰器 - 验证 JWT 并附加到 request
  // 处理 visitor（未登录用户）的情况
  app.decorate('authenticate', async function (
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      await request.jwtVerify()
    } catch (err) {
      // 未登录用户视为 visitor
      // 将一个虚拟的 visitor 用户附加到 request
      request.user = {
        id: 'visitor',
        user_id: 'visitor',
        email: '',
        role: 'visitor',
        display_name: '游客',
      } as JwtPayload
    }
  })

  // 角色验证装饰器 - 必须登录才能访问
  app.decorate('authorize', function (roles?: string[]) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify()
        const user = request.user as JwtPayload

        // visitor 强制拒绝
        if (user.role === 'visitor') {
          return reply.status(401).send({
            code: 401,
            message: '请先登录',
          })
        }

        if (roles && roles.length > 0 && !roles.includes(user.role as string)) {
          return reply.status(403).send({
            code: 403,
            message: '权限不足',
          })
        }
      } catch (err) {
        return reply.status(401).send({
          code: 401,
          message: 'Unauthorized: Invalid or expired token',
        })
      }
    }
  })

  // 后台硬鉴权：必须是有效 JWT（不允许 visitor 回退）
  app.decorate('authenticateRequired', async function (
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      await request.jwtVerify()
      const user = request.user as JwtPayload
      if (!user?.user_id || user.role === 'visitor') {
        return reply.status(401).send({
          code: 401,
          message: '请先登录',
        })
      }
    } catch (err) {
      return reply.status(401).send({
        code: 401,
        message: 'Unauthorized: Invalid or expired token',
      })
    }
  })

  // 后台 RBAC：仅 admin/superadmin
  app.decorate('authenticateAdmin', async function (
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      await request.jwtVerify()
      const user = request.user as JwtPayload
      if (!user?.user_id || user.role === 'visitor') {
        return reply.status(401).send({
          code: 401,
          message: '请先登录',
        })
      }

      if (user.role !== 'admin' && user.role !== 'superadmin') {
        return reply.status(403).send({
          code: 403,
          message: '无权限访问后台',
        })
      }
    } catch (err) {
      return reply.status(401).send({
        code: 401,
        message: 'Unauthorized: Invalid or expired token',
      })
    }
  })

  // 后台 RBAC：仅 superadmin
  app.decorate('authenticateSuperAdmin', async function (
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      await request.jwtVerify()
      const user = request.user as JwtPayload
      if (!user?.user_id || user.role === 'visitor') {
        return reply.status(401).send({
          code: 401,
          message: '请先登录',
        })
      }

      if (user.role !== 'superadmin') {
        return reply.status(403).send({
          code: 403,
          message: '仅超管可执行该操作',
        })
      }
    } catch (err) {
      return reply.status(401).send({
        code: 401,
        message: 'Unauthorized: Invalid or expired token',
      })
    }
  })

  // 游客限制装饰器 - 对 visitor 应用 50% 内容限制
  app.decorate('visitorLimited', function () {
    return async function (request: FastifyRequest, reply: FastifyReply) {
      const user = request.user as JwtPayload

      // 如果是 visitor，在响应中标记受限
      if (user?.role === 'visitor') {
        reply.header('X-Content-Limited', 'true')
        reply.header('X-Visitor-Limited', 'true')
      }
    }
  })
}

// ============================================
// 权限辅助函数
// ============================================

/**
 * 判断用户是否为游客
 */
export function isVisitor(user: JwtPayload | undefined): boolean {
  return !user || user.role === 'visitor'
}

/**
 * 判断用户是否为登录用户（client 或更高）
 */
export function isAuthenticated(user: JwtPayload | undefined): boolean {
  return !!user && user.role !== 'visitor'
}

/**
 * 判断用户是否为创作者或更高
 */
export function isCreator(user: JwtPayload | undefined): boolean {
  return !!user && (user.role === 'creator' || user.role === 'admin' || user.role === 'superadmin')
}

/**
 * 判断用户是否为管理员或超管
 */
export function isAdmin(user: JwtPayload | undefined): boolean {
  return !!user && (user.role === 'admin' || user.role === 'superadmin')
}

/**
 * 判断用户是否为超管
 */
export function isSuperAdmin(user: JwtPayload | undefined): boolean {
  return !!user && user.role === 'superadmin'
}

/**
 * 权限检查结果
 */
export interface PermissionCheck {
  allowed: boolean
  reason?: string
}

/**
 * 检查用户是否拥有特定权限
 */
export function checkPermission(
  user: JwtPayload | undefined,
  action: 'create' | 'read' | 'update' | 'delete' | 'manage',
  resource: 'skill' | 'agent' | 'post' | 'opportunity' | 'invitation' | 'trial' | 'order' | 'admin'
): PermissionCheck {
  // 游客默认只能浏览公开内容
  if (isVisitor(user)) {
    if (action === 'read') {
      return { allowed: true }
    }
    return { allowed: false, reason: '请先登录' }
  }

  const role = user!.role

  // client 权限
  if (role === 'client') {
    const clientAllowed: Record<string, string[]> = {
      read: ['skill', 'agent', 'post', 'opportunity'],
      create: ['post'],
      update: ['post'],
      delete: ['post'],
      manage: [],
    }
    if (clientAllowed[action]?.includes(resource)) {
      return { allowed: true }
    }
    return { allowed: false, reason: '权限不足' }
  }

  // creator 权限
  if (role === 'creator') {
    const creatorAllowed: Record<string, string[]> = {
      read: ['skill', 'agent', 'post', 'opportunity'],
      create: ['skill', 'agent', 'post', 'opportunity', 'invitation', 'trial'],
      update: ['skill', 'agent', 'post', 'opportunity'],
      delete: ['skill', 'agent', 'post', 'opportunity'],
      manage: [],
    }
    if (creatorAllowed[action]?.includes(resource)) {
      return { allowed: true }
    }
    return { allowed: false, reason: '权限不足' }
  }

  // admin 权限
  if (role === 'admin') {
    const adminAllowed: Record<string, string[]> = {
      read: ['skill', 'agent', 'post', 'opportunity', 'order', 'admin'],
      create: ['skill', 'agent', 'post', 'opportunity'],
      update: ['skill', 'agent', 'post', 'opportunity', 'admin'],
      delete: ['skill', 'agent', 'post', 'opportunity', 'admin'],
      manage: ['skill', 'agent', 'post', 'opportunity', 'order'],
    }
    if (adminAllowed[action]?.includes(resource)) {
      return { allowed: true }
    }
    return { allowed: false, reason: '权限不足' }
  }

  // superadmin 拥有全部权限
  if (role === 'superadmin') {
    return { allowed: true }
  }

  return { allowed: false, reason: '未知角色' }
}

/**
 * 对列表应用游客 50% 限制
 */
export function applyVisitorLimit<T>(items: T[], limit: number = 0.5, preferFeatured: boolean = true): T[] {
  const totalItems = items.length
  const limitedCount = Math.ceil(totalItems * limit)

  if (totalItems <= limitedCount) {
    return items
  }

  if (preferFeatured) {
    // 优先返回精选内容
    const featured = items.filter((item: any) => item.is_featured || item.is_pinned)
    if (featured.length >= limitedCount) {
      return featured.slice(0, limitedCount)
    }
    // 补充随机内容
    const nonFeatured = items.filter((item: any) => !item.is_featured && !item.is_pinned)
    const shuffled = [...nonFeatured].sort(() => Math.random() - 0.5)
    return [...featured, ...shuffled].slice(0, limitedCount)
  }

  // 随机抽样
  const shuffled = [...items].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, limitedCount)
}

/**
 * 检查资源所有权
 */
export function checkOwnership(
  user: JwtPayload | undefined,
  ownerId: string,
  resourceType: string
): PermissionCheck {
  if (isVisitor(user)) {
    return { allowed: false, reason: '请先登录' }
  }

  if (user!.id === ownerId || user!.user_id === ownerId) {
    return { allowed: true }
  }

  // admin 和 superadmin 可以管理任何资源
  if (isAdmin(user)) {
    return { allowed: true }
  }

  return { allowed: false, reason: `你不是该 ${resourceType} 的所有者` }
}

export default fp(authPlugin, {
  name: 'auth',
  dependencies: [],
})

// 导出认证函数供路由使用
export function generateTokens(app: FastifyInstance, payload: JwtPayload) {
  const accessToken = app.jwt.sign(payload)
  const refreshToken = app.jwt.sign(payload, { expiresIn: '30d' })

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 7 * 24 * 60 * 60,
  }
}

export function verifyRefreshToken(app: FastifyInstance, token: string): JwtPayload {
  return app.jwt.verify(token)
}
