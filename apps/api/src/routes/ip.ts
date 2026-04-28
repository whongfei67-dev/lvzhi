/**
 * 知识产权保护相关 API 路由
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { query } from '../lib/database.js'
import { success, created, errors } from '../utils/response.js'
import type { JwtPayload } from '../types.js'

export const ipRoute: FastifyPluginAsync = async (app: FastifyInstance) => {

  // ============================================
  // GET /api/ip - 获取知识产权申请列表
  // ============================================
  app.get('/api/ip', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { status } = request.query as { status?: string }

    try {
      let whereClause = 'WHERE ip.user_id = $1'
      const params: string[] = [user.user_id]

      if (status) {
        whereClause += ' AND ip.status = $2'
        params.push(status)
      }

      const result = await query(
        `SELECT ip.*,
                p.name as product_name,
                p.type as product_type
         FROM ip_protection_applications ip
         LEFT JOIN products p ON p.id = ip.product_id
         ${whereClause}
         ORDER BY ip.created_at DESC`,
        params
      )

      return success(reply, result.rows)
    } catch (err) {
      console.error('Get IP applications error:', err)
      return errors.internal(reply, 'Failed to get IP protection applications')
    }
  })

  // ============================================
  // POST /api/ip - 提交知识产权保护申请
  // ============================================
  app.post('/api/ip', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { product_id, product_type, application_type, description, evidence_urls } = request.body as {
      product_id?: string
      product_type?: 'skill' | 'agent'
      application_type?: 'copyright' | 'trademark' | 'patent'
      description?: string
      evidence_urls?: string[]
    }

    // 权限检查：只有创作者可以申请知产保护
    if (user.role !== 'creator' && user.role !== 'superadmin') {
      return errors.forbidden(reply, 'Only creators can apply for IP protection')
    }

    if (!product_id || !product_type || !application_type) {
      return errors.badRequest(reply, 'product_id, product_type, and application_type are required')
    }

    try {
      // 验证产品是否属于当前创作者
      let ownerCheck
      if (product_type === 'skill') {
        ownerCheck = await query(
          'SELECT id FROM skills WHERE id = $1 AND creator_id = $2',
          [product_id, user.user_id]
        )
      } else {
        ownerCheck = await query(
          'SELECT id FROM agents WHERE id = $1 AND creator_id = $2',
          [product_id, user.user_id]
        )
      }

      if (ownerCheck.rows.length === 0) {
        return errors.forbidden(reply, 'You do not own this product')
      }

      // 检查是否已有待审核的申请
      const existingApplication = await query(
        `SELECT id FROM ip_protection_applications
         WHERE product_id = $1 AND status IN ('pending', 'approved')
         LIMIT 1`,
        [product_id]
      )

      if (existingApplication.rows.length > 0) {
        return errors.conflict(reply, 'An active IP application already exists for this product')
      }

      const result = await query(
        `INSERT INTO ip_protection_applications (user_id, product_id, product_type, application_type, description, evidence_urls)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [user.user_id, product_id, product_type, application_type, description, evidence_urls || []]
      )

      return created(reply, result.rows[0], 'IP protection application submitted')
    } catch (err) {
      console.error('Create IP application error:', err)
      return errors.internal(reply, 'Failed to submit IP protection application')
    }
  })

  // ============================================
  // GET /api/ip/:id - 获取单个申请详情
  // ============================================
  app.get('/api/ip/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { id } = request.params as { id: string }

    try {
      const result = await query(
        `SELECT ip.*,
                p.name as product_name,
                p.type as product_type,
                admin.display_name as reviewer_name
         FROM ip_protection_applications ip
         LEFT JOIN products p ON p.id = ip.product_id
         LEFT JOIN profiles admin ON admin.id = ip.reviewed_by
         WHERE ip.id = $1 AND ip.user_id = $2`,
        [id, user.user_id]
      )

      if (result.rows.length === 0) {
        return errors.notFound(reply, 'IP application not found')
      }

      return success(reply, result.rows[0])
    } catch (err) {
      console.error('Get IP application error:', err)
      return errors.internal(reply, 'Failed to get IP protection application')
    }
  })

  // ============================================
  // PUT /api/ip/:id - 更新申请（撤回或补充材料）
  // ============================================
  app.put('/api/ip/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { id } = request.params as { id: string }
    const { status, evidence_urls } = request.body as {
      status?: 'withdrawn'
      evidence_urls?: string[]
    }

    try {
      // 只能撤回待审核的申请
      const result = await query(
        `UPDATE ip_protection_applications
         SET status = COALESCE($1, status),
             evidence_urls = COALESCE($2, evidence_urls),
             updated_at = NOW()
         WHERE id = $3 AND user_id = $4 AND status = 'pending'
         RETURNING *`,
        [status, evidence_urls, id, user.user_id]
      )

      if (result.rows.length === 0) {
        return errors.notFound(reply, 'IP application not found or cannot be updated')
      }

      return success(reply, result.rows[0], 'IP application updated')
    } catch (err) {
      console.error('Update IP application error:', err)
      return errors.internal(reply, 'Failed to update IP protection application')
    }
  })

  // ============================================
  // DELETE /api/ip/:id - 撤回申请
  // ============================================
  app.delete('/api/ip/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { id } = request.params as { id: string }

    try {
      const result = await query(
        `DELETE FROM ip_protection_applications
         WHERE id = $1 AND user_id = $2 AND status = 'pending'
         RETURNING id`,
        [id, user.user_id]
      )

      if (result.rows.length === 0) {
        return errors.notFound(reply, 'IP application not found or cannot be deleted')
      }

      return success(reply, null, 'IP application withdrawn')
    } catch (err) {
      console.error('Delete IP application error:', err)
      return errors.internal(reply, 'Failed to withdraw IP application')
    }
  })

  // ============================================
  // GET /api/ip/products - 获取可申请知产保护的产品列表
  // ============================================
  app.get('/api/ip/products', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (user.role !== 'creator' && user.role !== 'superadmin') {
      return errors.forbidden(reply, 'Only creators can access this endpoint')
    }

    try {
      // 获取创作者的产品，排除已有待审核或已通过申请的产品
      const skills = await query(
        `SELECT s.id, s.name, 'skill' as type
         FROM skills s
         LEFT JOIN ip_protection_applications ip ON ip.product_id = s.id AND ip.product_type = 'skill'
         WHERE s.creator_id = $1 AND s.status = 'active'
           AND (ip.id IS NULL OR ip.status = 'rejected')
         ORDER BY s.created_at DESC`,
        [user.user_id]
      )

      const agents = await query(
        `SELECT a.id, a.name, 'agent' as type
         FROM agents a
         LEFT JOIN ip_protection_applications ip ON ip.product_id = a.id AND ip.product_type = 'agent'
         WHERE a.creator_id = $1 AND a.status = 'active'
           AND (ip.id IS NULL OR ip.status = 'rejected')
         ORDER BY a.created_at DESC`,
        [user.user_id]
      )

      return success(reply, {
        skills: skills.rows,
        agents: agents.rows,
      })
    } catch (err) {
      console.error('Get products error:', err)
      return errors.internal(reply, 'Failed to get products')
    }
  })
}
