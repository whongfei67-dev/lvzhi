/**
 * 创作者中心 (Creator) API 路由
 * 
 * 创作者后台 - 面向 creator
 * 功能：技能包管理、智能体管理、收益、邀请、试用、认证、知产、统计
 */

import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { query } from '../lib/database.js'
import { success, created, errors, paginated } from '../utils/response.js'
import type { JwtPayload } from '../types.js'
import { isVisitor, isCreator, isAdmin, checkOwnership } from '../plugins/auth.js'

export const creatorRoute: FastifyPluginAsync = async (app: FastifyInstance) => {

  // ============================================
  // GET /api/creator/overview - 创作者中心概览
  // ============================================
  app.get('/api/creator/overview', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    if (!isCreator(user)) {
      return errors.forbidden(reply, '只有创作者可以访问')
    }

    const userId = user.id || user.user_id

    try {
      // 获取统计数据
      const stats = await query(
        `SELECT 
          (SELECT COUNT(*) FROM skills WHERE creator_id = $1 AND status IN ('published', 'active')) as skills_count,
          (SELECT COUNT(*) FROM agents WHERE creator_id = $1 AND status = 'active') as agents_count,
          (SELECT COALESCE(SUM(net_amount), 0) FROM creator_earnings WHERE creator_id = $1 AND status = 'settled') as total_earnings,
          (SELECT COALESCE(SUM(net_amount), 0) FROM creator_earnings WHERE creator_id = $1 AND status = 'pending') as pending_earnings,
          (SELECT COUNT(*) FROM invitations WHERE sender_id = $1 AND status = 'pending') as pending_invitations_count,
          (SELECT COUNT(*) FROM trials WHERE creator_id = $1 AND status = 'pending') as pending_trials_count,
          (SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false) as unread_notifications_count`,
        [userId]
      )

      // 获取本月收益
      const thisMonth = await query<{ total: string }>(
        `SELECT COALESCE(SUM(net_amount), 0) as total 
         FROM creator_earnings 
         WHERE creator_id = $1 AND status = 'settled' 
         AND created_at >= DATE_TRUNC('month', CURRENT_DATE)`,
        [userId]
      )

      // 获取上月收益
      const lastMonth = await query<{ total: string }>(
        `SELECT COALESCE(SUM(net_amount), 0) as total 
         FROM creator_earnings 
         WHERE creator_id = $1 AND status = 'settled' 
         AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
         AND created_at < DATE_TRUNC('month', CURRENT_DATE)`,
        [userId]
      )

      const thisMonthNum = parseFloat(thisMonth.rows[0]?.total || '0')
      const lastMonthNum = parseFloat(lastMonth.rows[0]?.total || '0')
      const growthRate = lastMonthNum > 0 ? ((thisMonthNum - lastMonthNum) / lastMonthNum * 100).toFixed(2) : '0'

      // 获取待处理事项
      const pendingItems = await query(
        `SELECT 
          'invitation' as type,
          (SELECT COUNT(*) FROM invitations WHERE sender_id = $1 AND status = 'pending') as count,
          '待处理邀请' as title
        UNION ALL
        SELECT 
          'trial' as type,
          (SELECT COUNT(*) FROM trials WHERE creator_id = $1 AND status = 'pending') as count,
          '待处理试用' as title
        UNION ALL
        SELECT 
          'verification' as type,
          (SELECT COUNT(*) FROM creator_verifications WHERE creator_id = $1 AND status = 'pending') as count,
          '认证申请' as title
        UNION ALL
        SELECT 
          'ip' as type,
          (SELECT COUNT(*) FROM ip_applications WHERE creator_id = $1 AND status = 'pending') as count,
          '知产申请' as title`,
        [userId]
      )

      return success(reply, {
        user: {
          id: userId,
          display_name: user.display_name,
          avatar_url: (user as any).avatar_url || null,
          creator_level: (user as any).creator_level || 'basic',
          lawyer_verified: (user as any).lawyer_verified || false,
        },
        stats: stats.rows[0] || {
          skills_count: 0,
          agents_count: 0,
          total_earnings: 0,
          pending_earnings: 0,
          pending_invitations_count: 0,
          pending_trials_count: 0,
          unread_notifications_count: 0,
        },
        earnings_summary: {
          this_month: thisMonthNum,
          last_month: lastMonthNum,
          growth_rate: parseFloat(String(growthRate)),
        },
        pending_items: pendingItems.rows || [],
      })

    } catch (err) {
      console.error('Get creator overview error:', err)
      return errors.internal(reply, '获取创作者中心概览失败')
    }
  })

  // ============================================
  // GET /api/creator/skills - 我的技能包
  // ============================================
  app.get('/api/creator/skills', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    if (!isCreator(user)) {
      return errors.forbidden(reply, '只有创作者可以访问')
    }

    const { page = '1', page_size = '20', status } = request.query as {
      page?: string
      page_size?: string
      status?: string
    }

    const pageNum = parseInt(String(page))
    const limitNum = parseInt(String(page_size))
    const offset = (pageNum - 1) * limitNum
    const userId = user.id || user.user_id

    try {
      const conditions: string[] = ['s.creator_id = $1']
      const params: unknown[] = [userId]
      let paramIndex = 2

      if (status) {
        conditions.push(`s.status = $${paramIndex++}`)
        params.push(status)
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`

      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM skills s ${whereClause}`,
        params
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      params.push(limitNum, offset)
      const result = await query(
        `SELECT 
          s.id,
          s.title,
          s.slug,
          s.summary,
          s.description,
          s.content,
          s.cover_image,
          s.category,
          s.tags,
          s.price_type,
          s.price,
          s.status,
          s.view_count,
          s.download_count,
          s.favorite_count,
          s.purchase_count,
          s.rating,
          s.review_count,
          s.is_featured,
          s.created_at,
          s.updated_at
        FROM skills s
        ${whereClause}
        ORDER BY s.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params
      )

      return paginated(reply, result.rows, total, pageNum, limitNum)

    } catch (err) {
      console.error('Get creator skills error:', err)
      return errors.internal(reply, '获取技能包列表失败')
    }
  })

  // ============================================
  // GET /api/creator/skills/:id - 单个技能包（工作台编辑用）
  // ============================================
  app.get('/api/creator/skills/:id', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    if (!isCreator(user)) {
      return errors.forbidden(reply, '只有创作者可以访问')
    }

    const userId = user.id || user.user_id
    const { id } = request.params as { id: string }

    try {
      const result = await query(
        `SELECT * FROM skills WHERE creator_id = $1 AND (id::text = $2 OR slug = $2) LIMIT 1`,
        [userId, id]
      )

      if (result.rows.length === 0) {
        return errors.notFound(reply, '技能不存在或无权查看')
      }

      return success(reply, result.rows[0])
    } catch (err) {
      console.error('Get creator skill detail error:', err)
      return errors.internal(reply, '获取技能详情失败')
    }
  })

  // ============================================
  // POST /api/creator/skills - 新建草稿技能包
  // ============================================
  app.post('/api/creator/skills', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    if (!isCreator(user)) {
      return errors.forbidden(reply, '只有创作者可以访问')
    }

    const userId = user.id || user.user_id
    const body = (request.body || {}) as { title?: string }
    const title = (body.title && String(body.title).trim()) || '未命名 Skills'
    const slug = `skill-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

    try {
      const result = await query(
        `INSERT INTO skills (
          creator_id, title, slug, summary, description, category, tags, price_type, price, content, status
        ) VALUES (
          $1, $2, $3, '', '', 'other', ARRAY[]::text[], 'free', 0, '{}'::jsonb, 'draft'
        ) RETURNING *`,
        [userId, title, slug]
      )

      return created(reply, result.rows[0], '已创建草稿')
    } catch (err) {
      console.error('Create creator skill error:', err)
      return errors.internal(reply, '创建技能失败')
    }
  })

  // PATCH / PUT /api/creator/skills/:id - 更新技能包（工作台；PUT 兼容部分环境对 PATCH 支持不佳）
  const handleCreatorSkillUpdate = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    if (!isCreator(user)) {
      return errors.forbidden(reply, '只有创作者可以访问')
    }

    const userId = user.id || user.user_id
    const { id } = request.params as { id: string }
    const body = (request.body || {}) as {
      title?: string
      summary?: string
      description?: string
      status?: string
      category?: string
      cover_image?: string
      files?: unknown[]
      workbench?: Record<string, unknown>
    }

    try {
      const existing = await query<Record<string, unknown>>(
        `SELECT * FROM skills WHERE id = $1 AND creator_id = $2`,
        [id, userId]
      )

      if (existing.rows.length === 0) {
        return errors.notFound(reply, '技能不存在或无权修改')
      }

      const row = existing.rows[0]
      let contentObj: Record<string, unknown> = {}
      if (row.content && typeof row.content === 'object' && !Array.isArray(row.content)) {
        contentObj = { ...(row.content as Record<string, unknown>) }
      }

      if (body.workbench && typeof body.workbench === 'object') {
        const prevWb =
          contentObj.workbench && typeof contentObj.workbench === 'object' && !Array.isArray(contentObj.workbench)
            ? { ...(contentObj.workbench as Record<string, unknown>) }
            : {}
        contentObj.workbench = { ...prevWb, ...body.workbench }
      }

      const nextTitle = typeof body.title === 'string' ? body.title.trim() : String(row.title ?? '')
      if (!nextTitle) {
        return errors.badRequest(reply, '标题不能为空')
      }

      let nextStatus = String(row.status ?? 'draft')
      if (body.status === 'draft') {
        nextStatus = 'draft'
      } else if (body.status === 'published' || body.status === 'pending_review') {
        // 创作者提交“发布”时统一进入待审核，避免直接出现在灵感广场
        nextStatus = 'pending_review'
      }

      const nextSummary = typeof body.summary === 'string' ? body.summary : String(row.summary ?? '')
      const nextDescription =
        typeof body.description === 'string' ? body.description : String(row.description ?? '')
      const normalizeCategory = (raw: string): string => {
        const s = raw.trim()
        if (s === 'legal_module' || s === 'compliance_tool' || s === 'ai_skill' || s === 'agent' || s === 'other') {
          return s
        }
        // 兼容历史值
        if (s === 'skill_pack') return 'legal_module'
        if (s === 'template') return 'compliance_tool'
        if (s === 'code') return 'ai_skill'
        return 'other'
      }
      const nextCategory = typeof body.category === 'string' && body.category.trim()
        ? normalizeCategory(body.category)
        : normalizeCategory(String(row.category ?? 'other'))
      const nextCoverImage =
        typeof body.cover_image === 'string'
          ? body.cover_image.trim() || null
          : (row.cover_image ? String(row.cover_image) : null)
      const nextFiles =
        Array.isArray(body.files)
          ? body.files
          : Array.isArray(row.files)
            ? row.files
            : []

      const result = await query(
        `UPDATE skills SET
          title = $2,
          summary = $3,
          description = $4,
          status = $5,
          category = $6,
          content = $7::jsonb,
          cover_image = $8,
          files = $9::jsonb,
          updated_at = NOW()
        WHERE id = $1 AND creator_id = $10
        RETURNING *`,
        [id, nextTitle, nextSummary, nextDescription, nextStatus, nextCategory, JSON.stringify(contentObj), nextCoverImage, JSON.stringify(nextFiles), userId]
      )

      if (!result.rows.length) {
        return errors.notFound(reply, '技能不存在或无权保存')
      }

      return success(reply, result.rows[0], '已保存')
    } catch (err) {
      console.error('Update creator skill error:', err)
      return errors.internal(reply, '更新技能失败')
    }
  }

  app.patch('/api/creator/skills/:id', { onRequest: [app.authenticate] }, handleCreatorSkillUpdate)
  app.put('/api/creator/skills/:id', { onRequest: [app.authenticate] }, handleCreatorSkillUpdate)

  // ============================================
  // GET /api/creator/agents - 我的智能体
  // ============================================
  app.get('/api/creator/agents', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    if (!isCreator(user)) {
      return errors.forbidden(reply, '只有创作者可以访问')
    }

    const { page = '1', page_size = '20', status } = request.query as {
      page?: string
      page_size?: string
      status?: string
    }

    const pageNum = parseInt(String(page))
    const limitNum = parseInt(String(page_size))
    const offset = (pageNum - 1) * limitNum
    const userId = user.id || user.user_id

    try {
      const conditions: string[] = ['a.creator_id = $1']
      const params: unknown[] = [userId]
      let paramIndex = 2

      if (status) {
        conditions.push(`a.status = $${paramIndex++}`)
        params.push(status)
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`

      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM agents a ${whereClause}`,
        params
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      params.push(limitNum, offset)
      const result = await query(
        `SELECT 
          a.id,
          a.name,
          a.description,
          a.avatar_url,
          a.category,
          a.tags,
          a.status,
          a.view_count,
          a.trial_count,
          a.favorite_count,
          a.rating,
          a.review_count,
          a.is_featured,
          a.created_at,
          a.updated_at
        FROM agents a
        ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params
      )

      return paginated(reply, result.rows, total, pageNum, limitNum)

    } catch (err) {
      console.error('Get creator agents error:', err)
      return errors.internal(reply, '获取智能体列表失败')
    }
  })

  // ============================================
  // GET /api/creator/earnings - 收益概览
  // ============================================
  app.get('/api/creator/earnings', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    if (!isCreator(user)) {
      return errors.forbidden(reply, '只有创作者可以访问')
    }

    const { page = '1', page_size = '20', status } = request.query as {
      page?: string
      page_size?: string
      status?: string
    }

    const pageNum = parseInt(String(page))
    const limitNum = parseInt(String(page_size))
    const offset = (pageNum - 1) * limitNum
    const userId = user.id || user.user_id

    try {
      const conditions: string[] = ['e.creator_id = $1']
      const params: unknown[] = [userId]
      let paramIndex = 2

      if (status) {
        conditions.push(`e.status = $${paramIndex++}`)
        params.push(status)
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`

      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM creator_earnings e ${whereClause}`,
        params
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      params.push(limitNum, offset)
      const result = await query(
        `SELECT 
          e.id,
          e.source_type,
          e.source_id,
          e.order_id,
          e.gross_amount,
          e.platform_fee,
          e.net_amount,
          e.status,
          e.settled_at,
          e.created_at,
          CASE 
            WHEN e.source_type = 'skill' THEN s.title
            WHEN e.source_type = 'agent' THEN a.name
          END as source_title
        FROM creator_earnings e
        LEFT JOIN skills s ON e.source_type = 'skill' AND s.id = e.source_id
        LEFT JOIN agents a ON e.source_type = 'agent' AND a.id = e.source_id
        ${whereClause}
        ORDER BY e.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params
      )

      return paginated(reply, result.rows, total, pageNum, limitNum)

    } catch (err) {
      console.error('Get creator earnings error:', err)
      return errors.internal(reply, '获取收益列表失败')
    }
  })

  // ============================================
  // GET /api/creator/invitations - 我发出的邀请
  // ============================================
  app.get('/api/creator/invitations', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    if (!isCreator(user)) {
      return errors.forbidden(reply, '只有创作者可以访问')
    }

    const { page = '1', page_size = '20', status } = request.query as {
      page?: string
      page_size?: string
      status?: string
    }

    const pageNum = parseInt(String(page))
    const limitNum = parseInt(String(page_size))
    const offset = (pageNum - 1) * limitNum
    const userId = user.id || user.user_id

    try {
      const conditions: string[] = ['i.sender_id = $1']
      const params: unknown[] = [userId]
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
          CASE 
            WHEN i.source_type = 'skill' THEN s.title
            WHEN i.source_type = 'agent' THEN a.name
          END as source_title
        FROM invitations i
        LEFT JOIN profiles p ON p.id = i.receiver_id
        LEFT JOIN skills s ON i.source_type = 'skill' AND s.id = i.source_id
        LEFT JOIN agents a ON i.source_type = 'agent' AND a.id = i.source_id
        ${whereClause}
        ORDER BY i.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params
      )

      return paginated(reply, result.rows, total, pageNum, limitNum)

    } catch (err) {
      console.error('Get creator invitations error:', err)
      return errors.internal(reply, '获取邀请列表失败')
    }
  })

  // ============================================
  // GET /api/creator/trials - 我发出的试用邀请
  // ============================================
  app.get('/api/creator/trials', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    if (!isCreator(user)) {
      return errors.forbidden(reply, '只有创作者可以访问')
    }

    const { page = '1', page_size = '20', status } = request.query as {
      page?: string
      page_size?: string
      status?: string
    }

    const pageNum = parseInt(String(page))
    const limitNum = parseInt(String(page_size))
    const offset = (pageNum - 1) * limitNum
    const userId = user.id || user.user_id

    try {
      const conditions: string[] = ['t.creator_id = $1']
      const params: unknown[] = [userId]
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
      console.error('Get creator trials error:', err)
      return errors.internal(reply, '获取试用邀请列表失败')
    }
  })

  // ============================================
  // GET /api/creator/verification - 我的认证状态
  // ============================================
  app.get('/api/creator/verification', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    if (!isCreator(user)) {
      return errors.forbidden(reply, '只有创作者可以访问')
    }

    const userId = user.id || user.user_id

    try {
      const result = await query(
        `SELECT 
          v.id,
          v.verification_type,
          v.status,
          v.materials,
          v.review_note,
          v.reviewed_at,
          v.created_at,
          r.display_name as reviewed_by_name
        FROM creator_verifications v
        LEFT JOIN profiles r ON r.id = v.reviewed_by
        WHERE v.creator_id = $1
        ORDER BY v.created_at DESC`,
        [userId]
      )

      return success(reply, result.rows)

    } catch (err) {
      console.error('Get creator verification error:', err)
      return errors.internal(reply, '获取认证状态失败')
    }
  })

  // ============================================
  // GET /api/creator/ip - 我的知产申请
  // ============================================
  app.get('/api/creator/ip', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    if (!isCreator(user)) {
      return errors.forbidden(reply, '只有创作者可以访问')
    }

    const { page = '1', page_size = '20', status } = request.query as {
      page?: string
      page_size?: string
      status?: string
    }

    const pageNum = parseInt(String(page))
    const limitNum = parseInt(String(page_size))
    const offset = (pageNum - 1) * limitNum
    const userId = user.id || user.user_id

    try {
      const conditions: string[] = ['i.creator_id = $1']
      const params: unknown[] = [userId]
      let paramIndex = 2

      if (status) {
        conditions.push(`i.status = $${paramIndex++}`)
        params.push(status)
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`

      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ip_applications i ${whereClause}`,
        params
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      params.push(limitNum, offset)
      const result = await query(
        `SELECT 
          i.id,
          i.source_type,
          i.source_id,
          i.status,
          i.materials,
          i.review_note,
          i.reviewed_at,
          i.created_at,
          CASE 
            WHEN i.source_type = 'skill' THEN s.title
            WHEN i.source_type = 'agent' THEN a.name
          END as source_title
        FROM ip_applications i
        LEFT JOIN skills s ON i.source_type = 'skill' AND s.id = i.source_id
        LEFT JOIN agents a ON i.source_type = 'agent' AND a.id = i.source_id
        ${whereClause}
        ORDER BY i.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params
      )

      return paginated(reply, result.rows, total, pageNum, limitNum)

    } catch (err) {
      console.error('Get creator ip error:', err)
      return errors.internal(reply, '获取知产申请列表失败')
    }
  })

  // ============================================
  // POST /api/creator/ip/apply - 一键提交知产保护申请
  // ============================================
  app.post('/api/creator/ip/apply', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }
    if (!isCreator(user)) {
      return errors.forbidden(reply, '只有创作者可以访问')
    }

    const userId = user.id || user.user_id
    const { source_type, source_id, materials } = request.body as {
      source_type?: 'skill' | 'agent'
      source_id?: string
      materials?: Record<string, unknown>
    }
    const normalizedSourceType = String(source_type || '').trim()
    const normalizedSourceId = String(source_id || '').trim()
    if (!normalizedSourceType || !normalizedSourceId) {
      return errors.badRequest(reply, 'source_type、source_id 为必填项')
    }
    if (!['skill', 'agent'].includes(normalizedSourceType)) {
      return errors.badRequest(reply, 'source_type 仅支持 skill 或 agent')
    }

    try {
      // 仅允许申请自己的内容
      if (normalizedSourceType === 'skill') {
        const own = await query(
          'SELECT id FROM skills WHERE id = $1 AND creator_id = $2 LIMIT 1',
          [normalizedSourceId, userId]
        )
        if (!own.rows.length) {
          return errors.forbidden(reply, '仅可为自己的技能包申请知产保护')
        }
      } else {
        const own = await query(
          'SELECT id FROM agents WHERE id = $1 AND creator_id = $2 LIMIT 1',
          [normalizedSourceId, userId]
        )
        if (!own.rows.length) {
          return errors.forbidden(reply, '仅可为自己的智能体申请知产保护')
        }
      }

      // 防止重复待审申请
      const existed = await query(
        `SELECT id, status
         FROM ip_applications
         WHERE creator_id = $1 AND source_type = $2 AND source_id = $3
           AND status IN ('pending', 'approved')
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId, normalizedSourceType, normalizedSourceId]
      )
      if (existed.rows.length) {
        return errors.conflict(reply, '该内容已有待审核/已通过的知产申请')
      }

      const inserted = await query(
        `INSERT INTO ip_applications (
          creator_id, source_type, source_id, status, materials, created_at, updated_at
        ) VALUES (
          $1, $2, $3, 'pending', $4::jsonb, NOW(), NOW()
        )
        RETURNING id, creator_id, source_type, source_id, status, materials, review_note, reviewed_at, created_at`,
        [userId, normalizedSourceType, normalizedSourceId, JSON.stringify(materials || {})]
      )

      return created(reply, inserted.rows[0], '知产保护申请已提交')
    } catch (err) {
      console.error('Apply creator IP protection error:', err)
      return errors.internal(reply, '提交知产保护申请失败')
    }
  })

  // ============================================
  // GET /api/creator/stats - 创作数据统计
  // ============================================
  app.get('/api/creator/stats', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    if (!isCreator(user)) {
      return errors.forbidden(reply, '只有创作者可以访问')
    }

    const userId = user.id || user.user_id

    try {
      // 技能包统计
      const skillsStats = await query(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status IN ('published', 'active') THEN 1 ELSE 0 END) as published,
          SUM(download_count) as total_downloads,
          SUM(favorite_count) as total_favorites,
          SUM(purchase_count) as total_purchases,
          AVG(rating) as avg_rating
        FROM skills WHERE creator_id = $1`,
        [userId]
      )

      // 智能体统计
      const agentsStats = await query(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(view_count) as total_views,
          SUM(trial_count) as total_trials,
          SUM(favorite_count) as total_favorites,
          AVG(rating) as avg_rating
        FROM agents WHERE creator_id = $1`,
        [userId]
      )

      // 收益统计
      const earningsStats = await query(
        `SELECT 
          COALESCE(SUM(net_amount), 0) as total_earnings,
          COALESCE(SUM(CASE WHEN status = 'pending' THEN net_amount ELSE 0 END), 0) as pending_earnings,
          COALESCE(SUM(CASE WHEN status = 'settled' THEN net_amount ELSE 0 END), 0) as settled_earnings,
          COUNT(*) as total_transactions
        FROM creator_earnings WHERE creator_id = $1`,
        [userId]
      )

      return success(reply, {
        skills: skillsStats.rows[0] || {},
        agents: agentsStats.rows[0] || {},
        earnings: earningsStats.rows[0] || {},
      })

    } catch (err) {
      console.error('Get creator stats error:', err)
      return errors.internal(reply, '获取统计数据失败')
    }
  })
}
