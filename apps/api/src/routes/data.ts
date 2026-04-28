/**
 * 数据路由 - 支持前端的数据查询需求
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { query } from '../lib/database.js'

export const dataRoute: FastifyPluginAsync = async (app: FastifyInstance) => {

  // ============================================
  // GET /api/data/:table - 查询数据
  // ============================================
  app.get<{ Params: { table: string }; Querystring: Record<string, string> }>(
    '/api/data/:table',
    async (request, reply) => {
      const { table } = request.params
      const { select = '*', limit, offset, order, ...filters } = request.query

      try {
        // 安全检查：只允许特定的表
        const allowedTables = [
          'profiles', 'agents', 'agent_demos', 'agent_favorites', 'agent_ratings',
          'jobs', 'applications', 'community_posts', 'comments', 'likes',
          'orders', 'user_balances', 'balance_transactions', 'coupons', 'user_coupons',
          'subscriptions', 'user_follows', 'api_credentials', 'api_usage_stats',
          'products', 'promo_orders', 'platform_inquiries', 'lawyer_profiles',
          'recruiter_profiles', 'seeker_profiles', 'uploaded_files',
        ]

        if (!allowedTables.includes(table)) {
          return reply.status(403).send({
            success: false,
            message: 'Table not allowed'
          })
        }

        // 构建 WHERE 条件
        const conditions: string[] = []
        const params: unknown[] = []
        let paramIndex = 1

        for (const [key, value] of Object.entries(filters)) {
          if (key.startsWith('filter_')) {
            const column = key.replace('filter_', '')
            conditions.push(`${column} = $${paramIndex}`)
            params.push(value)
            paramIndex++
          }
        }

        // 构建 ORDER BY
        let orderBy = ''
        if (order) {
          const [column, direction] = order.split(':')
          orderBy = `ORDER BY ${column} ${direction === 'desc' ? 'DESC' : 'ASC'}`
        }

        // 构建 LIMIT/OFFSET
        let limitOffset = ''
        if (limit) {
          limitOffset += `LIMIT ${parseInt(limit)}`
          if (offset) {
            limitOffset += ` OFFSET ${parseInt(offset)}`
          }
        }

        const whereClause = conditions.length > 0 
          ? `WHERE ${conditions.join(' AND ')}` 
          : ''

        const sql = `SELECT ${select} FROM ${table} ${whereClause} ${orderBy} ${limitOffset}`.trim()

        const result = await query(sql, params)

        return {
          success: true,
          data: result.rows,
        }

      } catch (err) {
        console.error('Query error:', err)
        return reply.status(500).send({
          success: false,
          message: 'Query failed'
        })
      }
    }
  )

  // ============================================
  // POST /api/data/:table - 插入数据
  // ============================================
  app.post<{ Params: { table: string } }>(
    '/api/data/:table',
    async (request, reply) => {
      const { table } = request.params
      const data = request.body as Record<string, unknown>

      try {
        const allowedTables = [
          'profiles', 'agents', 'agent_demos', 'agent_favorites', 'agent_ratings',
          'jobs', 'applications', 'community_posts', 'comments', 'likes',
          'orders', 'user_balances', 'balance_transactions', 'coupons', 'user_coupons',
          'subscriptions', 'user_follows', 'api_credentials', 'api_usage_stats',
          'products', 'promo_orders', 'platform_inquiries',
        ]

        if (!allowedTables.includes(table)) {
          return reply.status(403).send({
            success: false,
            message: 'Table not allowed'
          })
        }

        const columns = Object.keys(data)
        const values = Object.values(data)
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')

        const sql = `
          INSERT INTO ${table} (${columns.join(', ')})
          VALUES (${placeholders})
          RETURNING *
        `

        const result = await query(sql, values)

        return {
          success: true,
          data: result.rows[0],
        }

      } catch (err) {
        console.error('Insert error:', err)
        return reply.status(500).send({
          success: false,
          message: 'Insert failed'
        })
      }
    }
  )

  // ============================================
  // PATCH /api/data/:table - 更新数据
  // ============================================
  app.patch<{ Params: { table: string }; Querystring: Record<string, string> }>(
    '/api/data/:table',
    async (request, reply) => {
      const { table } = request.params
      const data = request.body as Record<string, unknown>
      const filters = request.query

      try {
        const allowedTables = [
          'profiles', 'agents', 'agent_demos', 'agent_favorites', 'agent_ratings',
          'jobs', 'applications', 'community_posts', 'comments', 'likes',
          'orders', 'user_balances', 'balance_transactions', 'coupons', 'user_coupons',
          'subscriptions', 'user_follows', 'api_credentials', 'api_usage_stats',
          'products', 'promo_orders', 'platform_inquiries',
        ]

        if (!allowedTables.includes(table)) {
          return reply.status(403).send({
            success: false,
            message: 'Table not allowed'
          })
        }

        // 构建 SET 和 WHERE
        const setClause: string[] = []
        const whereClause: string[] = []
        const params: unknown[] = []
        let paramIndex = 1

        for (const [key, value] of Object.entries(data)) {
          setClause.push(`${key} = $${paramIndex}`)
          params.push(value)
          paramIndex++
        }

        for (const [key, value] of Object.entries(filters)) {
          if (key.startsWith('filter_')) {
            const column = key.replace('filter_', '')
            whereClause.push(`${column} = $${paramIndex}`)
            params.push(value)
            paramIndex++
          }
        }

        if (whereClause.length === 0) {
          return reply.status(400).send({
            success: false,
            message: 'Where condition required'
          })
        }

        const sql = `
          UPDATE ${table}
          SET ${setClause.join(', ')}
          WHERE ${whereClause.join(' AND ')}
          RETURNING *
        `

        const result = await query(sql, params)

        return {
          success: true,
          data: result.rows[0],
        }

      } catch (err) {
        console.error('Update error:', err)
        return reply.status(500).send({
          success: false,
          message: 'Update failed'
        })
      }
    }
  )

  // ============================================
  // DELETE /api/data/:table - 删除数据
  // ============================================
  app.delete<{ Params: { table: string }; Querystring: Record<string, string> }>(
    '/api/data/:table',
    async (request, reply) => {
      const { table } = request.params
      const filters = request.query

      try {
        const allowedTables = [
          'agents', 'agent_favorites', 'agent_ratings',
          'jobs', 'applications', 'community_posts', 'comments', 'likes',
          'orders', 'coupons', 'user_coupons',
          'subscriptions', 'user_follows',
        ]

        if (!allowedTables.includes(table)) {
          return reply.status(403).send({
            success: false,
            message: 'Table not allowed'
          })
        }

        const whereClause: string[] = []
        const params: unknown[] = []
        let paramIndex = 1

        for (const [key, value] of Object.entries(filters)) {
          if (key.startsWith('filter_')) {
            const column = key.replace('filter_', '')
            whereClause.push(`${column} = $${paramIndex}`)
            params.push(value)
            paramIndex++
          }
        }

        if (whereClause.length === 0) {
          return reply.status(400).send({
            success: false,
            message: 'Where condition required'
          })
        }

        const sql = `DELETE FROM ${table} WHERE ${whereClause.join(' AND ')} RETURNING *`

        const result = await query(sql, params)

        return {
          success: true,
          data: result.rows[0],
        }

      } catch (err) {
        console.error('Delete error:', err)
        return reply.status(500).send({
          success: false,
          message: 'Delete failed'
        })
      }
    }
  )
}
