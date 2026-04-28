/**
 * 异步 AI 对话 API 路由
 * 使用队列处理高并发 AI 请求
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { getAIQueue } from '../utils/queue.js'
import { success, errors } from '../utils/response.js'
import type { JwtPayload } from '../types.js'

export const asyncAiRoute: FastifyPluginAsync = async (app: FastifyInstance) => {

  // ============================================
  // POST /api/ai/async/chat - 异步 AI 对话（入队）
  // ============================================
  app.post('/api/ai/async/chat', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { agent_id, messages, priority } = request.body as {
      agent_id?: string
      messages?: Array<{ role: string; content: string }>
      priority?: number
    }

    if (!agent_id || !messages || messages.length === 0) {
      return errors.badRequest(reply, 'agent_id and messages are required')
    }

    try {
      const queue = getAIQueue()
      const jobId = await queue.enqueue(
        user.user_id,
        agent_id,
        messages,
        {},
        priority || 5 // 默认优先级
      )

      return success(reply, {
        job_id: jobId,
        status: 'queued',
        message: 'Your request has been queued and will be processed shortly',
      }, 'Request queued successfully')

    } catch (err) {
      console.error('Async chat queue error:', err)
      return errors.internal(reply, 'Failed to queue request')
    }
  })

  // ============================================
  // GET /api/ai/async/status/:jobId - 查询异步任务状态
  // ============================================
  app.get<{ Params: { jobId: string } }>('/api/ai/async/status/:jobId', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { jobId } = request.params

    try {
      const queue = getAIQueue()
      const job = await queue.getStatus(jobId)

      if (!job) {
        return errors.notFound(reply, 'Job not found or expired')
      }

      // 检查用户权限
      if (job.user_id !== user.user_id && user.role !== 'admin') {
        return errors.forbidden(reply, 'Access denied')
      }

      const response: Record<string, unknown> = {
        job_id: job.id,
        status: job.status,
        created_at: new Date(job.created_at).toISOString(),
      }

      if (job.started_at) {
        response.started_at = new Date(job.started_at).toISOString()
      }

      if (job.completed_at) {
        response.completed_at = new Date(job.completed_at).toISOString()
        response.processing_time_ms = job.completed_at - (job.started_at || job.created_at)
      }

      if (job.status === 'completed' && job.result) {
        response.result = job.result
      }

      if (job.status === 'failed') {
        response.error = job.error
      }

      if (job.retries > 0) {
        response.retries = job.retries
      }

      return success(reply, response)

    } catch (err) {
      console.error('Get job status error:', err)
      return errors.internal(reply, 'Failed to get job status')
    }
  })

  // ============================================
  // GET /api/ai/async/queue - 获取队列状态（管理员）
  // ============================================
  app.get('/api/ai/async/queue', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (user.role !== 'admin') {
      return errors.forbidden(reply, 'Admin access required')
    }

    try {
      const queue = getAIQueue()
      const queueLength = await queue.getQueueLength()

      return success(reply, {
        queue_length: queueLength,
        status: queueLength > 100 ? 'busy' : queueLength > 50 ? 'moderate' : 'normal',
      })

    } catch (err) {
      console.error('Get queue status error:', err)
      return errors.internal(reply, 'Failed to get queue status')
    }
  })

  // ============================================
  // DELETE /api/ai/async/cancel/:jobId - 取消异步任务
  // ============================================
  app.delete<{ Params: { jobId: string } }>('/api/ai/async/cancel/:jobId', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { jobId } = request.params

    try {
      const queue = getAIQueue()
      const job = await queue.getStatus(jobId)

      if (!job) {
        return errors.notFound(reply, 'Job not found or already completed')
      }

      if (job.user_id !== user.user_id && user.role !== 'admin') {
        return errors.forbidden(reply, 'Access denied')
      }

      if (job.status !== 'pending') {
        return errors.badRequest(reply, 'Can only cancel pending jobs')
      }

      // 标记为失败（取消）
      await queue.fail(jobId, 'Cancelled by user', false)

      return success(reply, null, 'Job cancelled successfully')

    } catch (err) {
      console.error('Cancel job error:', err)
      return errors.internal(reply, 'Failed to cancel job')
    }
  })
}
