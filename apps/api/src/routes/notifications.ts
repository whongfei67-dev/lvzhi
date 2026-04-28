/**
 * 通知 (Notifications) API 路由
 * 
 * 通用通知接口 - 同时被 workspace 和 creator 使用
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { query } from '../lib/database.js'
import { success, errors, paginated } from '../utils/response.js'
import type { JwtPayload, NotificationListQuery } from '../types.js'
import { isVisitor, isAdmin } from '../plugins/auth.js'

export const notificationsRoute: FastifyPluginAsync = async (app: FastifyInstance) => {

  // ============================================
  // GET /api/notifications - 获取通知列表
  // ============================================
  app.get('/api/notifications', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    const {
      page = '1',
      page_size = '20',
      type,
      is_read,
    } = request.query as NotificationListQuery

    const pageNum = parseInt(String(page))
    const limitNum = parseInt(String(page_size))
    const offset = (pageNum - 1) * limitNum
    const userId = user.id || user.user_id

    try {
      const conditions: string[] = ['n.user_id = $1']
      const params: unknown[] = [userId]
      let paramIndex = 2

      if (type) {
        conditions.push(`n.notification_type = $${paramIndex++}`)
        params.push(type)
      }

      if (is_read !== undefined) {
        conditions.push(`n.is_read = $${paramIndex++}`)
        params.push(is_read === 'true')
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`

      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM notifications n ${whereClause}`,
        params
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      params.push(limitNum, offset)
      const result = await query(
        `SELECT 
          n.id,
          n.notification_type,
          n.title,
          n.content,
          n.data,
          n.is_read,
          n.created_at
        FROM notifications n
        ${whereClause}
        ORDER BY n.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params
      )

      return paginated(reply, result.rows, total, pageNum, limitNum)

    } catch (err) {
      console.error('Get notifications error:', err)
      return errors.internal(reply, '获取通知列表失败')
    }
  })

  // ============================================
  // GET /api/notifications/count - 获取未读数量
  // ============================================
  app.get('/api/notifications/count', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    const userId = user.id || user.user_id

    try {
      const result = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false`,
        [userId]
      )

      return success(reply, {
        unread_count: parseInt(result.rows[0]?.count || '0'),
      })

    } catch (err) {
      console.error('Get notification count error:', err)
      return errors.internal(reply, '获取未读数量失败')
    }
  })

  // ============================================
  // PATCH /api/notifications/:id/read - 标记单条已读
  // ============================================
  app.patch<{ Params: { id: string } }>(
    '/api/notifications/:id/read',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const user = request.user as JwtPayload
      const { id } = request.params

      if (isVisitor(user)) {
        return errors.unauthorized(reply, '请先登录')
      }

      const userId = user.id || user.user_id

      try {
        const result = await query(
          `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
          [id, userId]
        )

        if (result.rows.length === 0) {
          return errors.notFound(reply, '通知不存在')
        }

        return success(reply, result.rows[0], '已标记为已读')

      } catch (err) {
        console.error('Mark notification read error:', err)
        return errors.internal(reply, '标记已读失败')
      }
    }
  )

  // ============================================
  // POST /api/notifications/read-all - 全部标记已读
  // ============================================
  app.post('/api/notifications/read-all', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    const userId = user.id || user.user_id

    try {
      const result = await query(
        `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false RETURNING id`,
        [userId]
      )

      return success(reply, {
        marked_count: result.rowCount || 0,
      }, '全部已标记为已读')

    } catch (err) {
      console.error('Mark all notifications read error:', err)
      return errors.internal(reply, '标记全部已读失败')
    }
  })

  // ============================================
  // DELETE /api/notifications/:id - 删除通知
  // ============================================
  app.delete<{ Params: { id: string } }>(
    '/api/notifications/:id',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const user = request.user as JwtPayload
      const { id } = request.params

      if (isVisitor(user)) {
        return errors.unauthorized(reply, '请先登录')
      }

      const userId = user.id || user.user_id

      try {
        const result = await query(
          `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id`,
          [id, userId]
        )

        if (result.rows.length === 0) {
          return errors.notFound(reply, '通知不存在')
        }

        return success(reply, { id }, '已删除')

      } catch (err) {
        console.error('Delete notification error:', err)
        return errors.internal(reply, '删除通知失败')
      }
    }
  )

  // ============================================
  // DELETE /api/notifications/clear - 清空已读通知
  // ============================================
  app.delete('/api/notifications/clear', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    const userId = user.id || user.user_id

    try {
      const result = await query(
        `DELETE FROM notifications WHERE user_id = $1 AND is_read = true RETURNING id`,
        [userId]
      )

      return success(reply, {
        deleted_count: result.rowCount || 0,
      }, '已清空')

    } catch (err) {
      console.error('Clear notifications error:', err)
      return errors.internal(reply, '清空通知失败')
    }
  })

  // ============================================
  // GET /api/notifications/types - 获取通知类型列表
  // ============================================
  app.get('/api/notifications/types', async (request, reply) => {
    const types = [
      { value: 'post_replied', label: '帖子回复' },
      { value: 'comment_replied', label: '评论回复' },
      { value: 'post_liked', label: '帖子点赞' },
      { value: 'invitation_responded', label: '邀请回复' },
      { value: 'trial_responded', label: '试用回复' },
      { value: 'system_notice', label: '系统通知' },
      { value: 'verification_result', label: '认证结果' },
      { value: 'new_follower', label: '新粉丝' },
      { value: 'new_purchase', label: '新购买' },
      { value: 'new_review', label: '新评论' },
    ]

    return success(reply, types)
  })
}
