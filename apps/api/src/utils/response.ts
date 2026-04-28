/**
 * 通用响应格式工具
 */

import type { FastifyReply } from 'fastify'
import type { ApiResponse } from '../types.js'

/**
 * 成功响应
 */
export function success<T>(reply: FastifyReply, data?: T, message = 'Success'): FastifyReply {
  return reply.status(200).send({
    code: 0,
    message,
    data,
  } as Record<string, unknown>)
}

/**
 * 创建成功响应（用于需要返回 201 的场景）
 */
export function created<T>(reply: FastifyReply, data?: T, message = 'Created'): FastifyReply {
  return reply.status(201).send({
    code: 0,
    message,
    data,
  } as Record<string, unknown>)
}

/**
 * 错误响应
 */
export function error(
  reply: FastifyReply,
  code: number,
  message: string,
  statusCode = 400
): FastifyReply {
  return reply.status(statusCode).send({
    code,
    message,
  })
}

/**
 * 常用错误响应快捷方法
 */
export const errors = {
  badRequest: (reply: FastifyReply, message = 'Bad Request') =>
    error(reply, 400, message, 400),

  unauthorized: (reply: FastifyReply, message = 'Unauthorized') =>
    error(reply, 401, message, 401),

  forbidden: (reply: FastifyReply, message = 'Forbidden') =>
    error(reply, 403, message, 403),

  notFound: (reply: FastifyReply, message = 'Not Found') =>
    error(reply, 404, message, 404),

  conflict: (reply: FastifyReply, message = 'Conflict') =>
    error(reply, 409, message, 409),

  tooManyRequests: (reply: FastifyReply, message = 'Too Many Requests') =>
    error(reply, 429, message, 429),

  internal: (reply: FastifyReply, message = 'Internal Server Error') =>
    error(reply, 500, message, 500),
}

/**
 * 分页响应
 */
export function paginated<T>(
  reply: FastifyReply,
  items: T[],
  total: number,
  page: number,
  pageSize: number
) {
  return reply.status(200).send({
    code: 0,
    message: 'Success',
    data: {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  })
}
