/**
 * Fastify 类型扩展声明
 * 此文件必须在应用启动时加载，以确保类型扩展对所有模块可见
 */

import 'fastify'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { JwtPayload } from './types.js'

// 扩展 FastifyInstance 接口
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    authenticateRequired: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    authenticateAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    authenticateSuperAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    authorize: (roles?: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }

  interface FastifyRequest {
    startTime?: number
  }
}

export {}
