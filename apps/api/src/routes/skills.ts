/**
 * Skills 相关 API 路由
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { query } from '../lib/database.js'
import { success, created, errors } from '../utils/response.js'
import { applyVisitorLimit } from '../plugins/auth.js'

export const skillsRoute: FastifyPluginAsync = async (app: FastifyInstance) => {

  // ============================================
  // GET /api/skills - 获取 Skills 列表
  // ============================================
  app.get('/api/skills', async (request, reply) => {
    const { category, status, page = '1', limit = '20' } = request.query as {
      category?: string;
      status?: string;
      page?: string;
      limit?: string;
    }

    const pageNum = parseInt(page) || 1
    const limitNum = Math.min(parseInt(limit) || 20, 100)
    const offset = (pageNum - 1) * limitNum

    // 检查是否为游客
    const user = (request as any).user
    const isVisitor = !user || user.role === 'visitor'

    try {
      let whereClause = 'WHERE 1=1'
      const params: unknown[] = []
      let paramIndex = 1

      if (category) {
        whereClause += ` AND s.category = $${paramIndex++}`
        params.push(category)
      }

      // 默认只显示已上架的
      if (status) {
        whereClause += ` AND s.status = $${paramIndex++}`
        params.push(status)
      } else {
        whereClause += ` AND s.status IN ('active', 'published')`
      }

      // 查询总数
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM skills s ${whereClause}`,
        params
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      // 查询列表
      const listResult = await query(
        `SELECT s.id, s.creator_id, s.title, s.slug, s.summary, s.description, s.category, s.price_type, s.price, s.status,
                s.cover_image,
                s.view_count, s.download_count, s.favorite_count, s.rating, s.review_count, s.is_featured, s.content, s.created_at,
                p.display_name as creator_name,
                p.avatar_url as creator_avatar,
                p.verified as creator_verified,
                p.lawyer_verified as creator_lawyer_verified,
                p.creator_level as creator_level
         FROM skills s
         LEFT JOIN profiles p ON p.id = s.creator_id
         ${whereClause}
         ORDER BY s.created_at DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
        [...params, limitNum, offset]
      )

      // 游客只能看到 50% 内容
      const items = isVisitor ? applyVisitorLimit(listResult.rows) : listResult.rows

      return success(reply, {
        items,
        total: isVisitor ? items.length : total,
        page: pageNum,
        limit: limitNum,
        total_pages: isVisitor ? 1 : Math.ceil(total / limitNum),
        ...(isVisitor && { visitor_limited: true }),
      })
    } catch (err) {
      console.error('Get skills error:', err)
      return errors.internal(reply, 'Failed to get skills')
    }
  })

  // ============================================
  // GET /api/skills/:id - 获取 Skills 详情（支持 id 或 slug）
  // ============================================
  app.get('/api/skills/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    try {
      const result = await query(
        `SELECT s.*, 
                p.display_name as creator_name,
                p.avatar_url as creator_avatar,
                p.verified as creator_verified,
                p.lawyer_verified as creator_lawyer_verified,
                p.creator_level as creator_level,
                (SELECT COUNT(*) FROM skills WHERE creator_id = s.creator_id) as creator_product_count
         FROM skills s
         LEFT JOIN profiles p ON p.id = s.creator_id
         WHERE s.id::text = $1 OR s.slug = $1
         ORDER BY s.updated_at DESC
         LIMIT 1`,
        [id]
      )

      if (result.rows.length === 0) {
        return errors.notFound(reply, 'Skills not found')
      }

      return success(reply, result.rows[0])
    } catch (err) {
      console.error('Get skills detail error:', err)
      return errors.internal(reply, 'Failed to get skills detail')
    }
  })

  // ============================================
  // POST /api/skills - 创建 Skills（需要创作者权限）
  // ============================================
  app.post('/api/skills', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user
    const { name, description, category, price, content } = request.body as {
      name?: string;
      description?: string;
      category?: string;
      price?: number;
      content?: string;
    }

    if (!name || !description) {
      return errors.badRequest(reply, 'Name and description are required')
    }

    try {
      const result = await query(
        `INSERT INTO skills (creator_id, name, description, category, price, content, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending_review')
         RETURNING *`,
        [user.user_id, name, description, category || 'other', price || 0, content]
      )

      return created(reply, result.rows[0], 'Skills created, pending review')
    } catch (err) {
      console.error('Create skills error:', err)
      return errors.internal(reply, 'Failed to create skills')
    }
  })

  // ============================================
  // PUT /api/skills/:id - 更新 Skills
  // ============================================
  app.put('/api/skills/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user
    const { id } = request.params as { id: string }
    const updates = request.body as Record<string, unknown>

    try {
      // 检查所有权
      const existing = await query<{ creator_id: string }>(
        'SELECT creator_id FROM skills WHERE id = $1',
        [id]
      )

      if (existing.rows.length === 0) {
        return errors.notFound(reply, 'Skills not found')
      }

      if (existing.rows[0].creator_id !== user.user_id) {
        return errors.forbidden(reply, 'You do not own this skills')
      }

      // 构建更新语句
      const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'creator_id')
      if (fields.length === 0) {
        return errors.badRequest(reply, 'No fields to update')
      }

      const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ')
      const values = fields.map(f => updates[f])

      const result = await query(
        `UPDATE skills SET ${setClause}, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id, ...values]
      )

      return success(reply, result.rows[0], 'Skills updated')
    } catch (err) {
      console.error('Update skills error:', err)
      return errors.internal(reply, 'Failed to update skills')
    }
  })

  // ============================================
  // DELETE /api/skills/:id - 删除 Skills
  // ============================================
  app.delete('/api/skills/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user
    const { id } = request.params as { id: string }

    try {
      const existing = await query<{ creator_id: string }>(
        'SELECT creator_id FROM skills WHERE id = $1',
        [id]
      )

      if (existing.rows.length === 0) {
        return errors.notFound(reply, 'Skills not found')
      }

      // 检查权限：所有者或管理员
      const isAdmin = ['admin', 'superadmin'].includes(user.role)
      if (existing.rows[0].creator_id !== user.user_id && !isAdmin) {
        return errors.forbidden(reply, 'You do not have permission to delete this skills')
      }

      await query('DELETE FROM skills WHERE id = $1', [id])

      return success(reply, null, 'Skills deleted')
    } catch (err) {
      console.error('Delete skills error:', err)
      return errors.internal(reply, 'Failed to delete skills')
    }
  })

  // ============================================
  // POST /api/skills/:id/favorite - 收藏
  // ============================================
  app.post('/api/skills/:id/favorite', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user
    const { id } = request.params as { id: string }

    try {
      await query(
        `INSERT INTO favorites (user_id, target_type, target_id)
         VALUES ($1, 'skills', $2)
         ON CONFLICT DO NOTHING`,
        [user.user_id, id]
      )

      return success(reply, null, 'Favorited')
    } catch (err) {
      console.error('Favorite skills error:', err)
      return errors.internal(reply, 'Failed to favorite skills')
    }
  })

  // ============================================
  // DELETE /api/skills/:id/favorite - 取消收藏
  // ============================================
  app.delete('/api/skills/:id/favorite', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user
    const { id } = request.params as { id: string }

    try {
      await query(
        `DELETE FROM favorites WHERE user_id = $1 AND target_type = 'skills' AND target_id = $2`,
        [user.user_id, id]
      )

      return success(reply, null, 'Unfavorited')
    } catch (err) {
      console.error('Unfavorite skills error:', err)
      return errors.internal(reply, 'Failed to unfavorite skills')
    }
  })

  // ============================================
  // GET /api/skills/creator/my - 获取我创建的 Skills
  // ============================================
  app.get('/api/skills/creator/my', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user

    try {
      const result = await query(
        `SELECT * FROM skills 
         WHERE creator_id = $1 
         ORDER BY created_at DESC`,
        [user.user_id]
      )

      return success(reply, result.rows)
    } catch (err) {
      console.error('Get my skills error:', err)
      return errors.internal(reply, 'Failed to get my skills')
    }
  })
}
