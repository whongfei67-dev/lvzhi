/**
 * 智能体 (Agents) API 路由
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { query, transaction } from '../lib/database.js'
import { success, created, errors, paginated } from '../utils/response.js'
import { createAgentSchema, updateAgentSchema, paginationSchema, idParamSchema } from '../utils/validation.js'
import type { JwtPayload, AgentListItem } from '../types.js'
import { applyVisitorLimit } from '../plugins/auth.js'

export const agentsRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
  let agentColumnsEnsured = false

  async function ensureAgentColumns(): Promise<void> {
    if (agentColumnsEnsured) return
    try {
      await query('ALTER TABLE agents ADD COLUMN IF NOT EXISTS trial_quota INTEGER NOT NULL DEFAULT 3')
      await query('ALTER TABLE agents ADD COLUMN IF NOT EXISTS avatar_url TEXT')
      await query('ALTER TABLE agents ADD COLUMN IF NOT EXISTS config JSONB')
      await query("ALTER TABLE agents ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]'::jsonb")
      await query('ALTER TABLE agents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()')
      await query('ALTER TABLE agents ADD COLUMN IF NOT EXISTS favorite_count INTEGER NOT NULL DEFAULT 0')
      await query('ALTER TABLE agents ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) NOT NULL DEFAULT 0')
      await query('ALTER TABLE agents ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0')
      await query('ALTER TABLE agents ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0')
      await query('ALTER TABLE agents ADD COLUMN IF NOT EXISTS trial_count INTEGER NOT NULL DEFAULT 0')
    } catch (err) {
      console.warn('[agents] ensureAgentColumns failed:', err)
    }
    agentColumnsEnsured = true
  }

  await ensureAgentColumns()

  // ============================================
  // GET /api/agents - 获取智能体列表
  // ============================================
  app.get('/api/agents', async (request, reply) => {
    const {
      page = '1',
      pageSize = '20',
      category,
      status = 'active',
      search,
      sort = 'latest',
    } = request.query as {
      page?: string
      pageSize?: string
      category?: string
      status?: string
      search?: string
      sort?: string
    }

    const pageNum = parseInt(page)
    const pageSizeNum = parseInt(pageSize)
    const offset = (pageNum - 1) * pageSizeNum

    // 检查是否为游客
    const user = (request as any).user
    const isVisitor = !user || user.role === 'visitor'

    try {
      const conditions: string[] = []
      const params: unknown[] = []
      let paramIndex = 1

      // 只显示已批准的智能体（公开访问）
      conditions.push(`a.status = $${paramIndex++}`)
      params.push('active')

      if (category) {
        conditions.push(`a.category = $${paramIndex++}`)
        params.push(category)
      }

      if (search) {
        conditions.push(`(a.name ILIKE $${paramIndex} OR a.description ILIKE $${paramIndex})`)
        params.push(`%${search}%`)
        paramIndex++
      }

      // 排序
      let orderBy = 'a.created_at DESC'
      if (sort === 'popular') {
        orderBy = 'a.trial_count DESC, a.view_count DESC'
      } else if (sort === 'rating') {
        orderBy = 'a.rating DESC, a.rating_count DESC'
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      // 查询总数
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM agents a ${whereClause}`,
        params
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      // 查询列表 - 适配现有数据库结构
      params.push(pageSizeNum, offset)
      const result = await query(
        `SELECT
          a.id, 
          a.creator_id, 
          COALESCE(p.display_name, '未知用户') as creator_name, 
          p.avatar_url as creator_avatar,
          a.name, 
          a.description, 
          a.category, 
          a.price, 
          a.is_free_trial,
          a.status, 
          a.demo_content as config,
          a.view_count, 
          a.trial_count,
          0 as favorite_count,
          0 as rating,
          0 as rating_count,
          a.tags,
          a.created_at
        FROM agents a
        LEFT JOIN profiles p ON p.id = a.creator_id
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params
      )

      // 游客只能看到 50% 内容
      const items = isVisitor ? applyVisitorLimit(result.rows) : result.rows

      return success(reply, {
        items,
        total: isVisitor ? items.length : total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: isVisitor ? 1 : Math.ceil(total / pageSizeNum),
        ...(isVisitor && { visitor_limited: true }),
      })

    } catch (err) {
      console.error('Get agents error:', err)
      return errors.internal(reply, 'Failed to get agents')
    }
  })

  // ============================================
  // GET /api/agents/:id - 获取智能体详情
  // ============================================
  app.get<{ Params: { id: string } }>('/api/agents/:id', async (request, reply) => {
    const { id } = request.params

    try {
      const result = await query(
        `SELECT
          a.id, 
          a.creator_id, 
          COALESCE(p.display_name, '未知用户') as creator_name, 
          p.avatar_url as creator_avatar,
          a.name, 
          a.description, 
          a.category, 
          a.price, 
          a.is_free_trial,
          a.pricing_model as trial_quota,
          a.status, 
          a.demo_content, 
          a.view_count, 
          a.trial_count,
          0 as favorite_count,
          0 as rating,
          0 as rating_count,
          a.tags,
          a.created_at
        FROM agents a
        LEFT JOIN profiles p ON p.id = a.creator_id
        WHERE a.id = $1`,
        [id]
      )

      if (result.rows.length === 0) {
        return errors.notFound(reply, 'Agent not found')
      }

      const agent = result.rows[0]

      // 增加浏览量
      await query(
        'UPDATE agents SET view_count = view_count + 1 WHERE id = $1',
        [id]
      )

      return success(reply, {
        ...agent,
        trial_quota: agent.trial_quota || 'free',
      })

    } catch (err) {
      console.error('Get agent error:', err)
      return errors.internal(reply, 'Failed to get agent')
    }
  })

  // ============================================
  // POST /api/agents - 创建智能体 (需要认证)
  // ============================================
  app.post('/api/agents', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const validation = createAgentSchema.safeParse(request.body)
    if (!validation.success) {
      return errors.badRequest(reply, validation.error.errors[0].message)
    }

    const user = request.user as JwtPayload
    const data = validation.data

    // 只有 creator 和 admin 可以创建智能体
    if (user.role !== 'creator' && user.role !== 'admin') {
      return errors.forbidden(reply, 'Only creators can create agents')
    }

    try {
      await ensureAgentColumns()
      const result = await query<{
        id: string
        name: string
        description: string
        category: string
        price: number
        status: string
        created_at: string
      }>(
        `INSERT INTO agents (
          creator_id, name, description, category, price,
          is_free_trial, trial_quota, avatar_url, config, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending_review')
        RETURNING id, name, description, category, price, status, created_at`,
        [
          user.user_id,
          data.name,
          data.description,
          data.category,
          data.price,
          data.is_free_trial,
          data.trial_quota || 3,
          data.avatar_url || null,
          data.config ? JSON.stringify(data.config) : null,
        ]
      )

      return created(reply, result.rows[0], 'Agent created successfully')

    } catch (err) {
      console.error('Create agent error:', err)
      return errors.internal(reply, 'Failed to create agent')
    }
  })

  // ============================================
  // PUT /api/agents/:id - 更新智能体 (需要认证)
  // ============================================
  app.put<{ Params: { id: string } }>('/api/agents/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params
    const validation = updateAgentSchema.safeParse(request.body)
    if (!validation.success) {
      return errors.badRequest(reply, validation.error.errors[0].message)
    }

    const user = request.user as JwtPayload
    const data = validation.data

    try {
      // 检查智能体是否存在且属于当前用户
      const existing = await query<{ creator_id: string; status: string }>(
        'SELECT creator_id, status FROM agents WHERE id = $1',
        [id]
      )

      if (existing.rows.length === 0) {
        return errors.notFound(reply, 'Agent not found')
      }

      const agent = existing.rows[0]

      // 只有创建者或管理员/超管可以编辑
      const isAdminEditor = user.role === 'admin' || user.role === 'superadmin'
      if (agent.creator_id !== user.user_id && !isAdminEditor) {
        return errors.forbidden(reply, 'You do not have permission to edit this agent')
      }

      // 构建更新字段
      const updates: string[] = []
      const params: unknown[] = []
      let paramIndex = 1

      if (data.name !== undefined) {
        updates.push(`name = $${paramIndex++}`)
        params.push(data.name)
      }
      if (data.description !== undefined) {
        updates.push(`description = $${paramIndex++}`)
        params.push(data.description)
      }
      if (data.category !== undefined) {
        updates.push(`category = $${paramIndex++}`)
        params.push(data.category)
      }
      if (data.price !== undefined) {
        updates.push(`price = $${paramIndex++}`)
        params.push(data.price)
      }
      if (data.is_free_trial !== undefined) {
        updates.push(`is_free_trial = $${paramIndex++}`)
        params.push(data.is_free_trial)
      }
      if (data.trial_quota !== undefined) {
        updates.push(`trial_quota = $${paramIndex++}`)
        params.push(data.trial_quota)
      }
      if (data.avatar_url !== undefined) {
        updates.push(`avatar_url = $${paramIndex++}`)
        params.push(data.avatar_url)
      }
      if (data.config !== undefined) {
        updates.push(`config = $${paramIndex++}`)
        params.push(JSON.stringify(data.config))
      }
      if (data.tags !== undefined) {
        updates.push(`tags = $${paramIndex++}`)
        params.push(JSON.stringify(data.tags))
      }
      if (data.status !== undefined) {
        if (!isAdminEditor) {
          const requested = String(data.status)
          if (requested === 'active' || requested === 'published' || requested === 'pending_review') {
            // 创作者提交上线请求时统一进入待审核
            updates.push(`status = $${paramIndex++}`)
            params.push('pending_review')
          } else {
            return errors.badRequest(reply, 'Creators can only submit for review')
          }
        } else {
          updates.push(`status = $${paramIndex++}`)
          params.push(data.status)
        }
      }

      if (updates.length === 0) {
        return errors.badRequest(reply, 'No fields to update')
      }

      updates.push(`updated_at = NOW()`)
      params.push(id)

      const result = await query(
        `UPDATE agents SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        params
      )

      return success(reply, result.rows[0], 'Agent updated successfully')

    } catch (err) {
      console.error('Update agent error:', err)
      return errors.internal(reply, 'Failed to update agent')
    }
  })

  // ============================================
  // DELETE /api/agents/:id - 删除智能体 (需要认证)
  // ============================================
  app.delete<{ Params: { id: string } }>('/api/agents/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params
    const user = request.user as JwtPayload

    try {
      // 检查智能体是否存在
      const existing = await query<{ creator_id: string }>(
        'SELECT creator_id FROM agents WHERE id = $1',
        [id]
      )

      if (existing.rows.length === 0) {
        return errors.notFound(reply, 'Agent not found')
      }

      // 只有创建者或管理员可以删除
      if (existing.rows[0].creator_id !== user.user_id && user.role !== 'admin') {
        return errors.forbidden(reply, 'You do not have permission to delete this agent')
      }

      // 删除智能体
      await query('DELETE FROM agents WHERE id = $1', [id])

      return success(reply, null, 'Agent deleted successfully')

    } catch (err) {
      console.error('Delete agent error:', err)
      return errors.internal(reply, 'Failed to delete agent')
    }
  })

  // ============================================
  // GET /api/agents/:id/stats - 获取智能体统计数据
  // ============================================
  app.get<{ Params: { id: string } }>('/api/agents/:id/stats', async (request, reply) => {
    const { id } = request.params

    try {
      const result = await query<{
        view_count: number
        trial_count: number
        favorite_count: number
        rating: number
        rating_count: number
      }>(
        `SELECT view_count, trial_count, favorite_count, rating, rating_count
         FROM agents WHERE id = $1`,
        [id]
      )

      if (result.rows.length === 0) {
        return errors.notFound(reply, 'Agent not found')
      }

      return success(reply, result.rows[0])

    } catch (err) {
      console.error('Get agent stats error:', err)
      return errors.internal(reply, 'Failed to get stats')
    }
  })

  // ============================================
  // POST /api/agents/:id/favorite - 收藏/取消收藏 (需要认证)
  // ============================================
  app.post<{ Params: { id: string } }>('/api/agents/:id/favorite', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params
    const user = request.user as JwtPayload

    try {
      // 检查智能体是否存在
      const agent = await query<{ id: string }>(
        'SELECT id FROM agents WHERE id = $1',
        [id]
      )

      if (agent.rows.length === 0) {
        return errors.notFound(reply, 'Agent not found')
      }

      // 检查是否已收藏
      const existing = await query<{ id: string }>(
        'SELECT id FROM favorites WHERE user_id = $1 AND agent_id = $2',
        [user.user_id, id]
      )

      let isFavorited: boolean

      if (existing.rows.length > 0) {
        // 取消收藏
        await query(
          'DELETE FROM favorites WHERE user_id = $1 AND agent_id = $2',
          [user.user_id, id]
        )
        await query(
          'UPDATE agents SET favorite_count = favorite_count - 1 WHERE id = $1',
          [id]
        )
        isFavorited = false
      } else {
        // 添加收藏
        await query(
          'INSERT INTO favorites (user_id, agent_id) VALUES ($1, $2)',
          [user.user_id, id]
        )
        await query(
          'UPDATE agents SET favorite_count = favorite_count + 1 WHERE id = $1',
          [id]
        )
        isFavorited = true
      }

      return success(reply, { is_favorited: isFavorited }, isFavorited ? 'Favorited' : 'Unfavorited')

    } catch (err) {
      console.error('Toggle favorite error:', err)
      return errors.internal(reply, 'Failed to toggle favorite')
    }
  })

  // ============================================
  // GET /api/agents/creator/my - 获取我的智能体列表 (需要认证)
  // ============================================
  app.get('/api/agents/creator/my', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { page = '1', pageSize = '20' } = request.query as { page?: string; pageSize?: string }

    const pageNum = parseInt(page)
    const pageSizeNum = parseInt(pageSize)
    const offset = (pageNum - 1) * pageSizeNum

    try {
      // 获取总数
      const countResult = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM agents WHERE creator_id = $1',
        [user.user_id]
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      // 获取列表
      const result = await query(
        `SELECT
          id, name, description, category, price, is_free_trial,
          status, avatar_url, view_count, trial_count, favorite_count,
          rating, rating_count, tags, created_at, updated_at
        FROM agents
        WHERE creator_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3`,
        [user.user_id, pageSizeNum, offset]
      )

      const agents = result.rows.map(agent => ({
        ...agent,
        tags: typeof agent.tags === 'string' ? JSON.parse(agent.tags) : agent.tags,
      }))

      return paginated(reply, agents, total, pageNum, pageSizeNum)

    } catch (err) {
      console.error('Get my agents error:', err)
      return errors.internal(reply, 'Failed to get agents')
    }
  })

  // ============================================
  // GET /api/agents/user/favorites - 获取我的收藏 (需要认证)
  // ============================================
  app.get('/api/agents/user/favorites', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { page = '1', pageSize = '20' } = request.query as { page?: string; pageSize?: string }

    const pageNum = parseInt(page)
    const pageSizeNum = parseInt(pageSize)
    const offset = (pageNum - 1) * pageSizeNum

    try {
      // 获取总数
      const countResult = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM favorites WHERE user_id = $1',
        [user.user_id]
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      // 获取收藏列表
      const result = await query<AgentListItem>(
        `SELECT
          a.id, a.creator_id, p.display_name as creator_name, p.avatar_url as creator_avatar,
          a.name, a.description, a.category, a.price, a.is_free_trial,
          a.status, a.avatar_url, a.view_count, a.trial_count,
          a.favorite_count, a.rating, a.rating_count, a.tags, a.created_at
        FROM favorites f
        JOIN agents a ON a.id = f.agent_id
        LEFT JOIN profiles p ON p.id = a.creator_id
        WHERE f.user_id = $1 AND a.status = 'active'
        ORDER BY f.created_at DESC
        LIMIT $2 OFFSET $3`,
        [user.user_id, pageSizeNum, offset]
      )

      const agents = result.rows.map(agent => ({
        ...agent,
        tags: typeof agent.tags === 'string' ? JSON.parse(agent.tags) : agent.tags,
      }))

      return paginated(reply, agents, total, pageNum, pageSizeNum)

    } catch (err) {
      console.error('Get favorites error:', err)
      return errors.internal(reply, 'Failed to get favorites')
    }
  })
}
