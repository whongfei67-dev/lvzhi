/**
 * 试用 (Trials) API 路由
 * 
 * 创作者发出的试用邀请
 * sourceType: skill | agent
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { query } from '../lib/database.js'
import { success, created, errors, paginated } from '../utils/response.js'
import type { JwtPayload } from '../types.js'
import { isVisitor, isCreator, checkOwnership } from '../plugins/auth.js'

export const trialsRoute: FastifyPluginAsync = async (app: FastifyInstance) => {

  // ============================================
  // POST /api/trials - 创作者发送试用邀请
  // ============================================
  app.post('/api/trials', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    // 只有创作者可以发送试用邀请
    if (!isCreator(user)) {
      return errors.forbidden(reply, '只有创作者可以发送试用邀请')
    }

    const {
      target_user_id,
      source_type,
      source_id,
      message,
      expires_in_days,
    } = request.body as {
      target_user_id?: string
      source_type?: 'skill' | 'agent'
      source_id?: string
      message?: string
      expires_in_days?: number
    }

    // 验证必填字段
    if (!target_user_id || !source_type || !source_id) {
      return errors.badRequest(reply, '缺少必填字段')
    }

    // 验证来源类型
    if (!['skill', 'agent'].includes(source_type)) {
      return errors.badRequest(reply, '无效的来源类型')
    }

    // 不能给自己发送
    if (target_user_id === user.id || target_user_id === user.user_id) {
      return errors.badRequest(reply, '不能给自己发送试用邀请')
    }

    try {
      // 检查是否是自己的作品
      let ownerCheck: { creator_id: string } | null = null
      if (source_type === 'skill') {
        ownerCheck = await query<{ creator_id: string }>(
          `SELECT creator_id FROM skills WHERE id = $1`,
          [source_id]
        ).then(r => r.rows[0] || null)
      } else if (source_type === 'agent') {
        ownerCheck = await query<{ creator_id: string }>(
          `SELECT creator_id FROM agents WHERE id = $1`,
          [source_id]
        ).then(r => r.rows[0] || null)
      }

      if (!ownerCheck) {
        return errors.notFound(reply, '作品不存在')
      }

      if (ownerCheck.creator_id !== (user.id || user.user_id)) {
        return errors.forbidden(reply, '只能对自己的作品发送试用邀请')
      }

      // 检查是否存在待处理的试用邀请
      const existing = await query<{ id: string }>(
        `SELECT id FROM trials 
         WHERE creator_id = $1 AND target_user_id = $2 AND source_type = $3 AND source_id = $4 AND status = 'pending'`,
        [user.id || user.user_id, target_user_id, source_type, source_id]
      )

      if (existing.rows.length > 0) {
        return errors.conflict(reply, '已存在待处理的试用邀请')
      }

      // 计算过期时间
      const expiresAt = expires_in_days
        ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      // 创建试用邀请
      const result = await query(
        `INSERT INTO trials (
          creator_id, target_user_id, source_type, source_id, message, expires_at, status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')
        RETURNING *`,
        [
          user.id || user.user_id,
          target_user_id,
          source_type,
          source_id,
          message || null,
          expiresAt,
        ]
      )

      // 创���通知
      await query(
        `INSERT INTO notifications (user_id, notification_type, title, content, data)
         VALUES ($1, 'trial_responded', '您收到一个新的试用邀请', $2, $3)`,
        [
          target_user_id,
          `创作者 ${user.display_name} 向您发送了试用邀请`,
          JSON.stringify({ trial_id: result.rows[0].id, source_type, source_id }),
        ]
      )

      return created(reply, result.rows[0], '试用邀请已发送')

    } catch (err) {
      console.error('Create trial error:', err)
      return errors.internal(reply, '发送试用邀请失败')
    }
  })

  // ============================================
  // GET /api/trials/sent - 获取我发出的试用邀请
  // ============================================
  app.get('/api/trials/sent', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    if (!isCreator(user)) {
      return errors.forbidden(reply, '只有创作者可以查看发出的试用邀请')
    }

    const { page = '1', page_size = '20', status } = request.query as {
      page?: string
      page_size?: string
      status?: string
    }

    const pageNum = parseInt(String(page))
    const limitNum = parseInt(String(page_size))
    const offset = (pageNum - 1) * limitNum

    try {
      const conditions: string[] = ['t.creator_id = $1']
      const params: unknown[] = [user.id || user.user_id]
      let paramIndex = 2

      if (status) {
        conditions.push(`t.status = $${paramIndex++}`)
        params.push(status)
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`

      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM trials t ${whereClause}`,
        params
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      params.push(limitNum, offset)
      const result = await query(
        `SELECT 
          t.id,
          t.source_type,
          t.source_id,
          t.message,
          t.status,
          t.expires_at,
          t.responded_at,
          t.created_at,
          p.id as target_user_id,
          p.display_name as target_user_name,
          p.avatar_url as target_user_avatar,
          CASE 
            WHEN t.source_type = 'skill' THEN s.title
            WHEN t.source_type = 'agent' THEN a.name
          END as source_title
        FROM trials t
        LEFT JOIN profiles p ON p.id = t.target_user_id
        LEFT JOIN skills s ON t.source_type = 'skill' AND s.id = t.source_id
        LEFT JOIN agents a ON t.source_type = 'agent' AND a.id = t.source_id
        ${whereClause}
        ORDER BY t.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params
      )

      return paginated(reply, result.rows, total, pageNum, limitNum)

    } catch (err) {
      console.error('Get sent trials error:', err)
      return errors.internal(reply, '获取发出的试用邀请失败')
    }
  })

  // ============================================
  // GET /api/trials/received - 获取我收到的试用邀请
  // ============================================
  app.get('/api/trials/received', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    const { page = '1', page_size = '20', status } = request.query as {
      page?: string
      page_size?: string
      status?: string
    }

    const pageNum = parseInt(String(page))
    const limitNum = parseInt(String(page_size))
    const offset = (pageNum - 1) * limitNum

    try {
      const conditions: string[] = ['t.target_user_id = $1']
      const params: unknown[] = [user.id || user.user_id]
      let paramIndex = 2

      if (status) {
        conditions.push(`t.status = $${paramIndex++}`)
        params.push(status)
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`

      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM trials t ${whereClause}`,
        params
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      params.push(limitNum, offset)
      const result = await query(
        `SELECT 
          t.id,
          t.source_type,
          t.source_id,
          t.message,
          t.status,
          t.expires_at,
          t.responded_at,
          t.created_at,
          p.id as creator_id,
          p.display_name as creator_name,
          p.avatar_url as creator_avatar,
          CASE 
            WHEN t.source_type = 'skill' THEN s.title
            WHEN t.source_type = 'agent' THEN a.name
          END as source_title
        FROM trials t
        LEFT JOIN profiles p ON p.id = t.creator_id
        LEFT JOIN skills s ON t.source_type = 'skill' AND s.id = t.source_id
        LEFT JOIN agents a ON t.source_type = 'agent' AND a.id = t.source_id
        ${whereClause}
        ORDER BY t.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params
      )

      return paginated(reply, result.rows, total, pageNum, limitNum)

    } catch (err) {
      console.error('Get received trials error:', err)
      return errors.internal(reply, '获取收到的试用邀请失败')
    }
  })

  // ============================================
  // PATCH /api/trials/:id/respond - 响应试用邀请
  // ============================================
  app.patch<{ Params: { id: string } }>(
    '/api/trials/:id/respond',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const user = request.user as JwtPayload
      const { id } = request.params

      if (isVisitor(user)) {
        return errors.unauthorized(reply, '请先登录')
      }

      const { status } = request.body as {
        status?: 'accepted' | 'rejected'
      }

      if (!status || !['accepted', 'rejected'].includes(status)) {
        return errors.badRequest(reply, '无效的响应状态')
      }

      try {
        const checkResult = await query<{
          id: string
          creator_id: string
          target_user_id: string
          status: string
          expires_at: string
          source_type: string
          source_id: string
        }>(
          `SELECT id, creator_id, target_user_id, status, expires_at, source_type, source_id 
           FROM trials WHERE id = $1`,
          [id]
        )

        if (checkResult.rows.length === 0) {
          return errors.notFound(reply, '试用邀请不存在')
        }

        const trial = checkResult.rows[0]
        const userId = user.id || user.user_id

        if (trial.target_user_id !== userId) {
          return errors.forbidden(reply, '你只能响应收到的试用邀请')
        }

        if (trial.status !== 'pending') {
          return errors.badRequest(reply, '该试用邀请已处理')
        }

        // 检查是否过期
        if (new Date(trial.expires_at) < new Date()) {
          await query(
            `UPDATE trials SET status = 'expired' WHERE id = $1`,
            [id]
          )
          return errors.badRequest(reply, '该试用邀请已过期')
        }

        // 更新状态
        const result = await query(
          `UPDATE trials 
           SET status = $1, responded_at = NOW(), updated_at = NOW()
           WHERE id = $2
           RETURNING *`,
          [status, id]
        )

        // 通知创作者
        await query(
          `INSERT INTO notifications (user_id, notification_type, title, content, data)
           VALUES ($1, 'trial_responded', '您的试用邀请有了新动态', $2, $3)`,
          [
            trial.creator_id,
            `用户 ${user.display_name} ${status === 'accepted' ? '接受了' : '拒绝了'}您的试用邀请`,
            JSON.stringify({ trial_id: id, response_status: status }),
          ]
        )

        return success(reply, result.rows[0], '响应成功')

      } catch (err) {
        console.error('Respond trial error:', err)
        return errors.internal(reply, '响应试用邀请失败')
      }
    }
  )

  // ============================================
  // GET /api/trials/:id - 获取试用邀请详情
  // ============================================
  app.get<{ Params: { id: string } }>(
    '/api/trials/:id',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const user = request.user as JwtPayload
      const { id } = request.params

      if (isVisitor(user)) {
        return errors.unauthorized(reply, '请先登录')
      }

      try {
        const result = await query(
          `SELECT 
            t.*,
            s.title as skill_title,
            s.cover_image as skill_cover,
            a.name as agent_name,
            a.avatar_url as agent_avatar,
            creator.display_name as creator_name,
            creator.avatar_url as creator_avatar,
            target.display_name as target_user_name,
            target.avatar_url as target_user_avatar
          FROM trials t
          LEFT JOIN skills s ON t.source_type = 'skill' AND s.id = t.source_id
          LEFT JOIN agents a ON t.source_type = 'agent' AND a.id = t.source_id
          LEFT JOIN profiles creator ON creator.id = t.creator_id
          LEFT JOIN profiles target ON target.id = t.target_user_id
          WHERE t.id = $1`,
          [id]
        )

        if (result.rows.length === 0) {
          return errors.notFound(reply, '试用邀请不存在')
        }

        const trial = result.rows[0]
        const userId = user.id || user.user_id

        // 检查查看权限
        if (trial.creator_id !== userId && trial.target_user_id !== userId) {
          return errors.forbidden(reply, '无权限查看')
        }

        return success(reply, trial)

      } catch (err) {
        console.error('Get trial error:', err)
        return errors.internal(reply, '获取试用邀请详情失败')
      }
    }
  )

  // ============================================
  // DELETE /api/trials/:id - 撤回试用邀请
  // ============================================
  app.delete<{ Params: { id: string } }>(
    '/api/trials/:id',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const user = request.user as JwtPayload
      const { id } = request.params

      if (isVisitor(user)) {
        return errors.unauthorized(reply, '请先登录')
      }

      if (!isCreator(user)) {
        return errors.forbidden(reply, '只有创作者可以撤回试用邀请')
      }

      try {
        const checkResult = await query<{ creator_id: string }>(
          `SELECT creator_id FROM trials WHERE id = $1`,
          [id]
        )

        if (checkResult.rows.length === 0) {
          return errors.notFound(reply, '试用邀请不存在')
        }

        const ownership = checkOwnership(user, checkResult.rows[0].creator_id, 'trial')

        if (!ownership.allowed) {
          return errors.forbidden(reply, ownership.reason || '无权限')
        }

        await query(`DELETE FROM trials WHERE id = $1`, [id])

        return success(reply, { id }, '试用邀请已撤回')

      } catch (err) {
        console.error('Delete trial error:', err)
        return errors.internal(reply, '撤回试用邀请失败')
      }
    }
  )
}
