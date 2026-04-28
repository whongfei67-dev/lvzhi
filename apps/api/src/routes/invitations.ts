/**
 * 邀请 (Invitations) API 路由
 * 
 * 邀请是动作，不是展示位
 * - collaboration: 合作邀请
 * - job: 职位邀请
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { query } from '../lib/database.js'
import { success, created, errors, paginated } from '../utils/response.js'
import type { JwtPayload } from '../types.js'
import { isVisitor, checkOwnership, isAdmin } from '../plugins/auth.js'

export const invitationsRoute: FastifyPluginAsync = async (app: FastifyInstance) => {

  // ============================================
  // POST /api/invitations - 创建邀请
  // ============================================
  app.post('/api/invitations', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    const {
      receiver_id,
      receiver_role,
      source_type,
      source_id,
      invitation_type,
      message,
    } = request.body as {
      receiver_id?: string
      receiver_role?: string
      source_type?: 'skill' | 'agent' | 'opportunity' | 'creator_profile'
      source_id?: string
      invitation_type?: 'collaboration' | 'job'
      message?: string
    }

    // 验证必填字段
    if (!receiver_id || !receiver_role || !source_type || !source_id || !invitation_type) {
      return errors.badRequest(reply, '缺少必填字段')
    }

    // 验证邀请类型
    if (!['collaboration', 'job'].includes(invitation_type)) {
      return errors.badRequest(reply, '无效的邀请类型')
    }

    // 验证来源类型
    if (!['skill', 'agent', 'opportunity', 'creator_profile'].includes(source_type)) {
      return errors.badRequest(reply, '无效的来源类型')
    }

    // 不能邀请自己
    if (receiver_id === user.id || receiver_id === user.user_id) {
      return errors.badRequest(reply, '不能邀请自己')
    }

    try {
      // 检查是否存在待处理的邀请
      const existing = await query<{ id: string }>(
        `SELECT id FROM invitations 
         WHERE sender_id = $1 AND receiver_id = $2 AND source_type = $3 AND source_id = $4 AND status = 'pending'`,
        [user.id || user.user_id, receiver_id, source_type, source_id]
      )

      if (existing.rows.length > 0) {
        return errors.conflict(reply, '已存在待处理的邀请')
      }

      // 创建邀请
      const result = await query(
        `INSERT INTO invitations (
          sender_id, sender_role, receiver_id, receiver_role,
          source_type, source_id, invitation_type, message, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
        RETURNING *`,
        [
          user.id || user.user_id,
          user.role,
          receiver_id,
          receiver_role,
          source_type,
          source_id,
          invitation_type,
          message || null,
        ]
      )

      // 创建通知
      await query(
        `INSERT INTO notifications (user_id, notification_type, title, content, data)
         VALUES ($1, 'invitation_responded', '您收到一个新的邀请', $2, $3)`,
        [
          receiver_id,
          `用户 ${user.display_name} 向您发送了邀请`,
          JSON.stringify({ invitation_id: result.rows[0].id, source_type, source_id }),
        ]
      )

      return created(reply, result.rows[0], '邀请已发送')

    } catch (err) {
      console.error('Create invitation error:', err)
      return errors.internal(reply, '创建邀请失败')
    }
  })

  // ============================================
  // GET /api/invitations/sent - 获取我发出的邀请
  // ============================================
  app.get('/api/invitations/sent', {
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
      const conditions: string[] = ['i.sender_id = $1']
      const params: unknown[] = [user.id || user.user_id]
      let paramIndex = 2

      if (status) {
        conditions.push(`i.status = $${paramIndex++}`)
        params.push(status)
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`

      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM invitations i ${whereClause}`,
        params
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      params.push(limitNum, offset)
      const result = await query(
        `SELECT 
          i.id,
          i.invitation_type,
          i.source_type,
          i.source_id,
          i.message,
          i.status,
          i.created_at,
          i.responded_at,
          p.id as receiver_id,
          p.display_name as receiver_name,
          p.avatar_url as receiver_avatar,
          p.verified as receiver_verified,
          CASE 
            WHEN i.source_type = 'skill' THEN s.title
            WHEN i.source_type = 'agent' THEN a.name
            WHEN i.source_type = 'opportunity' THEN o.title
            ELSE '创作者'
          END as source_title
        FROM invitations i
        LEFT JOIN profiles p ON p.id = i.receiver_id
        LEFT JOIN skills s ON i.source_type = 'skill' AND s.id = i.source_id
        LEFT JOIN agents a ON i.source_type = 'agent' AND a.id = i.source_id
        LEFT JOIN opportunities o ON i.source_type = 'opportunity' AND o.id = i.source_id
        ${whereClause}
        ORDER BY i.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params
      )

      return paginated(reply, result.rows, total, pageNum, limitNum)

    } catch (err) {
      console.error('Get sent invitations error:', err)
      return errors.internal(reply, '获取发出的邀请失败')
    }
  })

  // ============================================
  // GET /api/invitations/received - 获取我收到的邀请
  // ============================================
  app.get('/api/invitations/received', {
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
      const conditions: string[] = ['i.receiver_id = $1']
      const params: unknown[] = [user.id || user.user_id]
      let paramIndex = 2

      if (status) {
        conditions.push(`i.status = $${paramIndex++}`)
        params.push(status)
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`

      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM invitations i ${whereClause}`,
        params
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      params.push(limitNum, offset)
      const result = await query(
        `SELECT 
          i.id,
          i.invitation_type,
          i.source_type,
          i.source_id,
          i.message,
          i.status,
          i.created_at,
          i.responded_at,
          p.id as sender_id,
          p.display_name as sender_name,
          p.avatar_url as sender_avatar,
          p.verified as sender_verified,
          CASE 
            WHEN i.source_type = 'skill' THEN s.title
            WHEN i.source_type = 'agent' THEN a.name
            WHEN i.source_type = 'opportunity' THEN o.title
            ELSE '创作者'
          END as source_title
        FROM invitations i
        LEFT JOIN profiles p ON p.id = i.sender_id
        LEFT JOIN skills s ON i.source_type = 'skill' AND s.id = i.source_id
        LEFT JOIN agents a ON i.source_type = 'agent' AND a.id = i.source_id
        LEFT JOIN opportunities o ON i.source_type = 'opportunity' AND o.id = i.source_id
        ${whereClause}
        ORDER BY i.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params
      )

      return paginated(reply, result.rows, total, pageNum, limitNum)

    } catch (err) {
      console.error('Get received invitations error:', err)
      return errors.internal(reply, '获取收到的邀请失败')
    }
  })

  // ============================================
  // PATCH /api/invitations/:id/respond - 响应邀请
  // ============================================
  app.patch<{ Params: { id: string } }>(
    '/api/invitations/:id/respond',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const user = request.user as JwtPayload
      const { id } = request.params

      if (isVisitor(user)) {
        return errors.unauthorized(reply, '请先登录')
      }

      const { status, message } = request.body as {
        status?: 'accepted' | 'rejected' | 'negotiating'
        message?: string
      }

      if (!status || !['accepted', 'rejected', 'negotiating'].includes(status)) {
        return errors.badRequest(reply, '无效的响应状态')
      }

      try {
        // 检查是否是接收者
        const checkResult = await query<{ 
          id: string
          receiver_id: string
          sender_id: string
          status: string
        }>(
          `SELECT id, receiver_id, sender_id, status FROM invitations WHERE id = $1`,
          [id]
        )

        if (checkResult.rows.length === 0) {
          return errors.notFound(reply, '邀请不存在')
        }

        const invitation = checkResult.rows[0]
        const userId = user.id || user.user_id

        if (invitation.receiver_id !== userId) {
          return errors.forbidden(reply, '你只能响应收到的邀请')
        }

        if (invitation.status !== 'pending') {
          return errors.badRequest(reply, '该邀请已处理')
        }

        // 更新状态
        const result = await query(
          `UPDATE invitations 
           SET status = $1, responded_at = NOW(), updated_at = NOW()
           WHERE id = $2
           RETURNING *`,
          [status, id]
        )

        // 通知发送者
        await query(
          `INSERT INTO notifications (user_id, notification_type, title, content, data)
           VALUES ($1, 'invitation_responded', '您的邀请有了新动态', $2, $3)`,
          [
            invitation.sender_id,
            `接收者 ${user.display_name} ${status === 'accepted' ? '接受了' : status === 'rejected' ? '拒绝了' : '正在洽谈'}您的邀请`,
            JSON.stringify({ invitation_id: id, response_status: status }),
          ]
        )

        return success(reply, result.rows[0], '响应成功')

      } catch (err) {
        console.error('Respond invitation error:', err)
        return errors.internal(reply, '响应邀请失败')
      }
    }
  )

  // ============================================
  // GET /api/invitations/:id - 获取邀请详情
  // ============================================
  app.get<{ Params: { id: string } }>(
    '/api/invitations/:id',
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
            i.*,
            s.title as skill_title,
            a.name as agent_name,
            o.title as opportunity_title,
            sender.display_name as sender_name,
            sender.avatar_url as sender_avatar,
            receiver.display_name as receiver_name,
            receiver.avatar_url as receiver_avatar
          FROM invitations i
          LEFT JOIN skills s ON i.source_type = 'skill' AND s.id = i.source_id
          LEFT JOIN agents a ON i.source_type = 'agent' AND a.id = i.source_id
          LEFT JOIN opportunities o ON i.source_type = 'opportunity' AND o.id = i.source_id
          LEFT JOIN profiles sender ON sender.id = i.sender_id
          LEFT JOIN profiles receiver ON receiver.id = i.receiver_id
          WHERE i.id = $1`,
          [id]
        )

        if (result.rows.length === 0) {
          return errors.notFound(reply, '邀请不存在')
        }

        const invitation = result.rows[0]
        const userId = user.id || user.user_id

        // 检查查看权限
        if (invitation.sender_id !== userId && invitation.receiver_id !== userId) {
          if (!isAdmin(user)) {
            return errors.forbidden(reply, '无权限查看')
          }
        }

        return success(reply, invitation)

      } catch (err) {
        console.error('Get invitation error:', err)
        return errors.internal(reply, '获���邀请详情失败')
      }
    }
  )

  // ============================================
  // DELETE /api/invitations/:id - 撤回邀请
  // ============================================
  app.delete<{ Params: { id: string } }>(
    '/api/invitations/:id',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const user = request.user as JwtPayload
      const { id } = request.params

      if (isVisitor(user)) {
        return errors.unauthorized(reply, '请先登录')
      }

      try {
        const checkResult = await query<{ sender_id: string }>(
          `SELECT sender_id FROM invitations WHERE id = $1`,
          [id]
        )

        if (checkResult.rows.length === 0) {
          return errors.notFound(reply, '邀请不存在')
        }

        const ownership = checkOwnership(user, checkResult.rows[0].sender_id, 'invitation')

        if (!ownership.allowed) {
          return errors.forbidden(reply, ownership.reason || '无权限')
        }

        await query(`DELETE FROM invitations WHERE id = $1`, [id])

        return success(reply, { id }, '邀请已撤回')

      } catch (err) {
        console.error('Delete invitation error:', err)
        return errors.internal(reply, '撤回邀请失败')
      }
    }
  )
}
