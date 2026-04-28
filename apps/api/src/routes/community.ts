/**
 * 社区 (Community) API 路由
 * 帖子、评论、点赞等
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { query } from '../lib/database.js'
import { success, created, errors, paginated } from '../utils/response.js'
import { createPostSchema, updatePostSchema, createCommentSchema } from '../utils/validation.js'
import type { JwtPayload } from '../types.js'
import { logAdminAction } from '../utils/admin-actions.js'
import { assertNotMuted, ensureUserSanctionColumns } from '../utils/user-sanctions.js'

export const communityRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
  let moderationColumnsEnsured = false
  let reportTableEnsured = false

  async function ensureCommunityModerationColumns() {
    if (moderationColumnsEnsured) return
    await query("ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'")
    await query("ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS risk_level TEXT NOT NULL DEFAULT 'low'")
    await query('ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS reviewed_by UUID')
    await query('ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ')
    await query('ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS review_reason TEXT')
    await query('ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ')
    await query(
      'ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()'
    )
    moderationColumnsEnsured = true
  }

  async function ensureCommunityReportTable() {
    if (reportTableEnsured) return
    await query(`
      CREATE TABLE IF NOT EXISTS community_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        target_type TEXT NOT NULL,
        target_id UUID NOT NULL,
        reason TEXT NOT NULL,
        detail TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        disposition TEXT,
        review_note TEXT,
        reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
        reviewed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await query('CREATE INDEX IF NOT EXISTS idx_community_reports_status_created ON community_reports(status, created_at DESC)')
    await query('CREATE INDEX IF NOT EXISTS idx_community_reports_target ON community_reports(target_type, target_id)')
    await query('CREATE INDEX IF NOT EXISTS idx_community_reports_reporter ON community_reports(reporter_id, created_at DESC)')
    reportTableEnsured = true
  }

  async function ensureCommunityPostLikesTable() {
    await query(`
      CREATE TABLE IF NOT EXISTS community_post_likes (
        post_id UUID NOT NULL,
        user_id UUID NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (post_id, user_id)
      )
    `)
  }

  await ensureCommunityModerationColumns()
  await ensureCommunityReportTable()
  await ensureUserSanctionColumns()

  // ============================================
  // GET /api/community/posts - 获取帖子列表
  // ============================================
  app.get('/api/community/posts', async (request, reply) => {
    const {
      page = '1',
      pageSize = '20',
      tag,
      search,
      author_id,
    } = request.query as {
      page?: string
      pageSize?: string
      tag?: string
      search?: string
      author_id?: string
    }

    const pageNum = parseInt(page)
    const pageSizeNum = parseInt(pageSize)
    const offset = (pageNum - 1) * pageSizeNum

    try {
      const params: unknown[] = []
      let paramIndex = 1

      // 条件片段（用于 COUNT 和 SELECT）
      const whereParts: string[] = []

      if (search) {
        whereParts.push(`(cp.title ILIKE $${paramIndex} OR cp.content ILIKE $${paramIndex})`)
        params.push(`%${search}%`)
        paramIndex++
      }

      whereParts.push(`COALESCE(cp.status, 'published') = 'published'`)

      const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : ''

      // 获取总数
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM community_posts cp ${whereClause}`,
        params
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      // 获取列表
      params.push(pageSizeNum, offset)
      const limitIdx = paramIndex
      const offsetIdx = paramIndex + 1
      const result = await query(
        `SELECT
          cp.id,
          cp.author_id,
          COALESCE(p.display_name, '匿名用户') as author_name,
          p.avatar_url as author_avatar,
          COALESCE(p.lawyer_verified, false) as author_lawyer_verified,
          cp.title,
          cp.content,
          cp.tags,
          cp.like_count,
          cp.comment_count,
          cp.view_count,
          cp.agent_id,
          cp.created_at
        FROM community_posts cp
        LEFT JOIN profiles p ON p.id = cp.author_id
        ${whereClause}
        ORDER BY cp.created_at DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        params
      )

      return paginated(reply, result.rows, total, pageNum, pageSizeNum)

    } catch (err) {
      console.error('Get posts error:', err)
      return errors.internal(reply, 'Failed to get posts')
    }
  })

  // ============================================
  // GET /api/community/posts/:id - 获取帖子详情
  // ============================================
  app.get<{ Params: { id: string } }>('/api/community/posts/:id', async (request, reply) => {
    const { id } = request.params

    try {
      const result = await query(
        `SELECT
          cp.id, 
          cp.author_id, 
          COALESCE(p.display_name, '未知用户') as author_name, 
          p.avatar_url as author_avatar,
          COALESCE(p.lawyer_verified, false) as author_lawyer_verified,
          cp.title, 
          cp.content, 
          cp.tags, 
          cp.like_count, 
          cp.comment_count,
          cp.view_count,
          cp.created_at
        FROM community_posts cp
        LEFT JOIN profiles p ON p.id = cp.author_id
        WHERE cp.id = $1
          AND COALESCE(cp.status, 'published') != 'deleted'`,
        [id]
      )

      if (result.rows.length === 0) {
        return errors.notFound(reply, 'Post not found')
      }

      const post = result.rows[0]

      // 增加浏览量（兼容旧库触发器/列差异：失败不影响详情展示）
      try {
        await query(
          'UPDATE community_posts SET view_count = view_count + 1 WHERE id = $1',
          [id]
        )
      } catch (viewErr) {
        console.warn('[community] view_count update failed, continue with detail response:', viewErr)
      }

      return success(reply, post)

    } catch (err) {
      console.error('Get post error:', err)
      return errors.internal(reply, 'Failed to get post')
    }
  })

  // ============================================
  // POST /api/community/posts - 创建帖子 (需要认证)
  // ============================================
  app.post('/api/community/posts', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const validation = createPostSchema.safeParse(request.body)
    if (!validation.success) {
      return errors.badRequest(reply, validation.error.errors[0].message)
    }

    const user = request.user as JwtPayload
    const userId = String(user?.user_id || user?.id || '').trim()
    if (!userId || userId === 'visitor') {
      return errors.unauthorized(reply, '请先登录后再发布帖子')
    }
    const { title, content, tags } = validation.data

    try {
      await assertNotMuted(userId)
      const result = await query(
        `INSERT INTO community_posts (author_id, title, content, tags, status, risk_level)
         VALUES ($1, $2, $3, $4, 'pending', 'low')
         RETURNING id, author_id, title, content, tags, status, risk_level, like_count, comment_count, created_at`,
        [userId, title, content, tags || []]
      )

      return created(reply, {
        ...result.rows[0],
        tags: typeof result.rows[0].tags === 'string' ? JSON.parse(result.rows[0].tags) : result.rows[0].tags,
      }, 'Post submitted for review')

    } catch (err) {
      console.error('Create post error:', err)
      if (err instanceof Error && err.message.includes('禁言')) {
        return errors.forbidden(reply, err.message)
      }
      const detail = err instanceof Error ? err.message : ''
      return errors.internal(
        reply,
        process.env.NODE_ENV === 'production'
          ? 'Failed to create post'
          : `Failed to create post${detail ? `: ${detail}` : ''}`
      )
    }
  })

  // ============================================
  // PUT /api/community/posts/:id - 更新帖子 (需要认证)
  // ============================================
  app.put<{ Params: { id: string } }>('/api/community/posts/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params
    const validation = updatePostSchema.safeParse(request.body)
    if (!validation.success) {
      return errors.badRequest(reply, validation.error.errors[0].message)
    }

    const user = request.user as JwtPayload
    const data = validation.data

    try {
      // 检查帖子是否存在且属于当前用户
      const existing = await query<{ author_id: string }>(
        'SELECT author_id FROM community_posts WHERE id = $1',
        [id]
      )

      if (existing.rows.length === 0) {
        return errors.notFound(reply, 'Post not found')
      }

      if (existing.rows[0].author_id !== user.user_id) {
        return errors.forbidden(reply, 'You can only edit your own posts')
      }

      // 构建更新
      const updates: string[] = []
      const params: unknown[] = []
      let paramIndex = 1

      if (data.title !== undefined) {
        updates.push(`title = $${paramIndex++}`)
        params.push(data.title)
      }
      if (data.content !== undefined) {
        updates.push(`content = $${paramIndex++}`)
        params.push(data.content)
      }
      if (data.tags !== undefined) {
        updates.push(`tags = $${paramIndex++}`)
        params.push(data.tags)
      }

      if (updates.length === 0) {
        return errors.badRequest(reply, 'No fields to update')
      }

      updates.push(`updated_at = NOW()`)
      params.push(id)

      const result = await query(
        `UPDATE community_posts SET ${updates.join(', ')} WHERE id = $${paramIndex}
         RETURNING id, author_id, title, content, tags, like_count, comment_count, created_at, updated_at`,
        params
      )

      return success(reply, {
        ...result.rows[0],
        tags: typeof result.rows[0].tags === 'string' ? JSON.parse(result.rows[0].tags) : result.rows[0].tags,
      }, 'Post updated successfully')

    } catch (err) {
      console.error('Update post error:', err)
      return errors.internal(reply, 'Failed to update post')
    }
  })

  // ============================================
  // DELETE /api/community/posts/:id - 删除帖子 (需要认证)
  // ============================================
  app.delete<{ Params: { id: string } }>('/api/community/posts/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params
    const user = request.user as JwtPayload

    try {
      // 检查帖子是否存在
      const existing = await query<{ author_id: string }>(
        'SELECT author_id FROM community_posts WHERE id = $1',
        [id]
      )

      if (existing.rows.length === 0) {
        return errors.notFound(reply, 'Post not found')
      }

      // 只有作者或管理员可以删除
      if (
        existing.rows[0].author_id !== user.user_id &&
        user.role !== 'admin' &&
        user.role !== 'superadmin'
      ) {
        return errors.forbidden(reply, 'You can only delete your own posts')
      }

      // 删除帖子（评论会级联删除）
      await query('DELETE FROM community_posts WHERE id = $1', [id])

      return success(reply, null, 'Post deleted successfully')

    } catch (err) {
      console.error('Delete post error:', err)
      return errors.internal(reply, 'Failed to delete post')
    }
  })

  // ============================================
  // POST /api/community/posts/:id/like - 点赞 (需要认证)
  // ============================================
  app.post<{ Params: { id: string } }>('/api/community/posts/:id/like', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params
    const user = request.user as JwtPayload
    const userId = String(user?.user_id || user?.id || '').trim()
    if (!userId || userId === 'visitor') {
      return errors.unauthorized(reply, '请先登录后再点赞')
    }

    try {
      // 检查帖子是否存在
      const post = await query<{ id: string }>(
        'SELECT id FROM community_posts WHERE id = $1',
        [id]
      )

      if (post.rows.length === 0) {
        return errors.notFound(reply, 'Post not found')
      }

      await ensureCommunityPostLikesTable()

      // 检查是否已点赞
      const existing = await query<{ post_id: string }>(
        'SELECT post_id FROM community_post_likes WHERE post_id = $1 AND user_id = $2',
        [id, userId]
      )

      if (existing.rows.length > 0) {
        return success(reply, { is_liked: true }, 'Already liked')
      }

      // 添加点赞（幂等）
      await query(
        'INSERT INTO community_post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT (post_id, user_id) DO NOTHING',
        [id, userId]
      )

      // 兼容旧库触发器异常：计数字段更新失败不影响点赞状态
      try {
        await query(
          'UPDATE community_posts SET like_count = like_count + 1 WHERE id = $1',
          [id]
        )
      } catch (countErr) {
        console.warn('[community] like_count increment failed, continue with like state:', countErr)
      }

      return success(reply, { is_liked: true }, 'Liked')

    } catch (err) {
      console.error('Toggle like error:', err)
      return errors.internal(reply, 'Failed to toggle like')
    }
  })

  // ============================================
  // DELETE /api/community/posts/:id/like - 取消点赞 (需要认证)
  // ============================================
  app.delete<{ Params: { id: string } }>('/api/community/posts/:id/like', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params
    const user = request.user as JwtPayload
    const userId = String(user?.user_id || user?.id || '').trim()
    if (!userId || userId === 'visitor') {
      return errors.unauthorized(reply, '请先登录后再取消点赞')
    }

    try {
      const post = await query<{ id: string }>(
        'SELECT id FROM community_posts WHERE id = $1',
        [id]
      )
      if (post.rows.length === 0) {
        return errors.notFound(reply, 'Post not found')
      }

      await ensureCommunityPostLikesTable()
      await query(
        'DELETE FROM community_post_likes WHERE post_id = $1 AND user_id = $2',
        [id, userId]
      )

      try {
        await query(
          'UPDATE community_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1',
          [id]
        )
      } catch (countErr) {
        console.warn('[community] like_count decrement failed, continue with unlike state:', countErr)
      }

      return success(reply, { is_liked: false }, 'Unliked')
    } catch (err) {
      console.error('Unlike post error:', err)
      return errors.internal(reply, 'Failed to unlike post')
    }
  })

  // ============================================
  // GET /api/community/posts/:id/comments - 获取帖子评论
  // ============================================
  app.get<{ Params: { id: string } }>('/api/community/posts/:id/comments', async (request, reply) => {
    const { id } = request.params
    const { page = '1', pageSize = '20' } = request.query as { page?: string; pageSize?: string }

    const pageNum = parseInt(page)
    const pageSizeNum = parseInt(pageSize)
    const offset = (pageNum - 1) * pageSizeNum

    try {
      // 检查帖子是否存在
      const post = await query<{ id: string }>(
        'SELECT id FROM community_posts WHERE id = $1',
        [id]
      )

      if (post.rows.length === 0) {
        return errors.notFound(reply, 'Post not found')
      }

      // 获取评论总数
      const countResult = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM community_comments WHERE post_id = $1',
        [id]
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      // 获取评论列表
      const result = await query(
        `SELECT
          cc.id, cc.post_id, cc.parent_id, cc.author_id, p.display_name as author_name,
          p.avatar_url as author_avatar, cc.content, COALESCE(cc.likes_count, 0) as like_count, cc.created_at
        FROM community_comments cc
        LEFT JOIN profiles p ON p.id = cc.author_id
        WHERE cc.post_id = $1
        ORDER BY cc.created_at ASC
        LIMIT $2 OFFSET $3`,
        [id, pageSizeNum, offset]
      )

      return paginated(reply, result.rows, total, pageNum, pageSizeNum)

    } catch (err) {
      console.error('Get comments error:', err)
      return errors.internal(reply, 'Failed to get comments')
    }
  })

  // ============================================
  // POST /api/community/comments - 创建评论 (需要认证)
  // ============================================
  app.post('/api/community/comments', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const validation = createCommentSchema.safeParse(request.body)
    if (!validation.success) {
      return errors.badRequest(reply, validation.error.errors[0].message)
    }

    const user = request.user as JwtPayload
    const userId = String(user?.user_id || user?.id || '').trim()
    if (!userId || userId === 'visitor') {
      return errors.unauthorized(reply, '请先登录后再评论')
    }
    const { post_id, content, parent_id } = validation.data

    try {
      await assertNotMuted(userId)
      // 检查帖子是否存在
      const post = await query<{ id: string }>(
        'SELECT id FROM community_posts WHERE id = $1',
        [post_id]
      )

      if (post.rows.length === 0) {
        return errors.notFound(reply, 'Post not found')
      }

      if (parent_id) {
        const parent = await query<{ post_id: string }>(
          'SELECT post_id FROM community_comments WHERE id = $1',
          [parent_id]
        )
        if (parent.rows.length === 0 || parent.rows[0].post_id !== post_id) {
          return errors.badRequest(reply, 'Invalid parent comment for this post')
        }
      }

      // 创建评论
      const result = await query(
        `INSERT INTO community_comments (post_id, author_id, content, parent_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, post_id, author_id, content, parent_id, likes_count as like_count, created_at`,
        [post_id, userId, content, parent_id || null]
      )

      // 更新评论数
      await query(
        'UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = $1',
        [post_id]
      )

      return created(reply, result.rows[0], 'Comment created successfully')

    } catch (err) {
      console.error('Create comment error:', err)
      if (err instanceof Error && err.message.includes('禁言')) {
        return errors.forbidden(reply, err.message)
      }
      return errors.internal(reply, 'Failed to create comment')
    }
  })

  // ============================================
  // POST /api/community/reports - 用户举报
  // ============================================
  app.post('/api/community/reports', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    const reporterId = String(user?.user_id || user?.id || '').trim()
    if (!reporterId || reporterId === 'visitor') {
      return errors.unauthorized(reply, '请先登录后再举报')
    }

    const { target_type, target_id, reason, detail } = request.body as {
      target_type?: 'community_post' | 'community_comment' | 'skill' | 'agent' | 'creator_profile'
      target_id?: string
      reason?: string
      detail?: string
    }

    const normalizedTargetType = String(target_type || '').trim()
    const normalizedTargetId = String(target_id || '').trim()
    const normalizedReason = String(reason || '').trim()
    const normalizedDetail = String(detail || '').trim()

    if (!normalizedTargetType || !normalizedTargetId || !normalizedReason) {
      return errors.badRequest(reply, 'target_type、target_id、reason 为必填项')
    }
    if (!['community_post', 'community_comment', 'skill', 'agent', 'creator_profile'].includes(normalizedTargetType)) {
      return errors.badRequest(reply, '无效 target_type')
    }

    try {
      await ensureCommunityReportTable()

      // 基础存在性校验（存在性失败给明确提示）
      if (normalizedTargetType === 'community_post') {
        const exists = await query('SELECT id FROM community_posts WHERE id = $1 LIMIT 1', [normalizedTargetId])
        if (!exists.rows.length) return errors.notFound(reply, '帖子不存在')
      } else if (normalizedTargetType === 'community_comment') {
        const exists = await query('SELECT id FROM community_comments WHERE id = $1 LIMIT 1', [normalizedTargetId])
        if (!exists.rows.length) return errors.notFound(reply, '评论不存在')
      } else if (normalizedTargetType === 'skill') {
        const exists = await query('SELECT id FROM skills WHERE id = $1 LIMIT 1', [normalizedTargetId])
        if (!exists.rows.length) return errors.notFound(reply, '技能包不存在')
      } else if (normalizedTargetType === 'agent') {
        const exists = await query('SELECT id FROM agents WHERE id = $1 LIMIT 1', [normalizedTargetId])
        if (!exists.rows.length) return errors.notFound(reply, '智能体不存在')
      } else if (normalizedTargetType === 'creator_profile') {
        const exists = await query('SELECT id FROM profiles WHERE id = $1 LIMIT 1', [normalizedTargetId])
        if (!exists.rows.length) return errors.notFound(reply, '创作者不存在')
      }

      // 避免同一用户对同一目标重复提交待处理举报
      const pendingDup = await query(
        `SELECT id FROM community_reports
         WHERE reporter_id = $1 AND target_type = $2 AND target_id = $3 AND status = 'pending'
         LIMIT 1`,
        [reporterId, normalizedTargetType, normalizedTargetId]
      )
      if (pendingDup.rows.length) {
        return errors.conflict(reply, '你已提交过该内容的举报，请等待审核')
      }

      const inserted = await query(
        `INSERT INTO community_reports (
          reporter_id, target_type, target_id, reason, detail, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW())
        RETURNING id, reporter_id, target_type, target_id, reason, detail, status, created_at`,
        [reporterId, normalizedTargetType, normalizedTargetId, normalizedReason, normalizedDetail || null]
      )

      return created(reply, inserted.rows[0], '举报已提交，平台将尽快审核')
    } catch (err) {
      console.error('Create community report error:', err)
      return errors.internal(reply, '提交举报失败')
    }
  })

  // ============================================
  // DELETE /api/community/comments/:id - 删除评论 (需要认证)
  // ============================================
  app.delete<{ Params: { id: string } }>('/api/community/comments/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params
    const user = request.user as JwtPayload

    try {
      // 获取评论信息
      const comment = await query<{ author_id: string; post_id: string }>(
        'SELECT author_id, post_id FROM community_comments WHERE id = $1',
        [id]
      )

      if (comment.rows.length === 0) {
        return errors.notFound(reply, 'Comment not found')
      }

      // 只有作者或管理员可以删除
      if (
        comment.rows[0].author_id !== user.user_id &&
        user.role !== 'admin' &&
        user.role !== 'superadmin'
      ) {
        return errors.forbidden(reply, 'You can only delete your own comments')
      }

      // 删除评论
      await query('DELETE FROM community_comments WHERE id = $1', [id])

      // 更新评论数
      await query(
        'UPDATE community_posts SET comment_count = comment_count - 1 WHERE id = $1',
        [comment.rows[0].post_id]
      )

      return success(reply, null, 'Comment deleted successfully')

    } catch (err) {
      console.error('Delete comment error:', err)
      return errors.internal(reply, 'Failed to delete comment')
    }
  })

  // ============================================
  // GET /api/admin/community/posts - 后台帖子审核列表
  // ============================================
  app.get('/api/admin/community/posts', { preHandler: [app.authenticateAdmin] }, async (request, reply) => {
    const {
      page = '1',
      pageSize = '20',
      status = 'pending',
      risk_level,
      search,
    } = request.query as {
      page?: string
      pageSize?: string
      status?: string
      risk_level?: string
      search?: string
    }

    const pageNum = Math.max(parseInt(page) || 1, 1)
    const pageSizeNum = Math.min(Math.max(parseInt(pageSize) || 20, 1), 100)
    const offset = (pageNum - 1) * pageSizeNum

    try {
      await ensureCommunityModerationColumns()
      const whereParts: string[] = []
      const params: unknown[] = []
      let idx = 1

      if (status && status !== 'all') {
        whereParts.push(`COALESCE(cp.status, 'published') = $${idx++}`)
        params.push(status)
      }
      if (risk_level && risk_level !== 'all') {
        whereParts.push(`COALESCE(cp.risk_level, 'low') = $${idx++}`)
        params.push(risk_level)
      }
      if (search) {
        whereParts.push(`(cp.title ILIKE $${idx} OR cp.content ILIKE $${idx})`)
        params.push(`%${search}%`)
        idx++
      }

      const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : ''
      const countRes = await query<{ count: string }>(
        `SELECT COUNT(*)::text as count FROM community_posts cp ${whereClause}`,
        params
      )
      const total = parseInt(countRes.rows[0]?.count || '0')

      const listParams = [...params, pageSizeNum, offset]
      const rows = await query(
        `SELECT
           cp.id,
           cp.title,
           cp.author_id,
           COALESCE(p.display_name, '匿名用户') as author_name,
           cp.status,
           cp.risk_level,
           cp.like_count,
           cp.comment_count,
           cp.review_reason,
           cp.reviewed_at,
           cp.created_at
         FROM community_posts cp
         LEFT JOIN profiles p ON p.id = cp.author_id
         ${whereClause}
         ORDER BY cp.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        listParams
      )

      return success(reply, {
        items: rows.rows,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
      })
    } catch (err) {
      console.error('Get admin community posts error:', err)
      return errors.internal(reply, 'Failed to get moderation list')
    }
  })

  // ============================================
  // PATCH /api/admin/community/posts/:id/moderate - 后台审核处置
  // ============================================
  app.patch<{ Params: { id: string } }>(
    '/api/admin/community/posts/:id/moderate',
    { preHandler: [app.authenticateAdmin] },
    async (request, reply) => {
      const { id } = request.params
      const user = request.user as JwtPayload
      const { action, reason, risk_level } = request.body as {
        action?: 'approve' | 'take_down' | 'restore' | 'delete'
        reason?: string
        risk_level?: 'low' | 'medium' | 'high'
      }

      if (!action) {
        return errors.badRequest(reply, 'action is required')
      }
      const normalizedReason = String(reason || '').trim()
      if (!normalizedReason) {
        return errors.badRequest(reply, 'reason is required')
      }
      if (risk_level && !['low', 'medium', 'high'].includes(risk_level)) {
        return errors.badRequest(reply, 'invalid risk_level')
      }

      const statusMap: Record<string, string> = {
        approve: 'published',
        take_down: 'hidden',
        restore: 'published',
        delete: 'deleted',
      }
      const nextStatus = statusMap[action]
      if (!nextStatus) {
        return errors.badRequest(reply, 'invalid action')
      }

      try {
        await ensureCommunityModerationColumns()
        const existing = await query<{
          id: string
          author_id: string
          title: string | null
          status: string
          risk_level: string
          review_reason: string | null
          reviewed_by: string | null
        }>(
          `SELECT id, author_id, title, status, risk_level, review_reason, reviewed_by
           FROM community_posts
           WHERE id = $1`,
          [id]
        )
        if (existing.rows.length === 0) {
          return errors.notFound(reply, 'Post not found')
        }

        const previous = existing.rows[0]
        const result = await query(
          `UPDATE community_posts
           SET status = $1,
               risk_level = COALESCE($2, risk_level),
               reviewed_by = $3,
               reviewed_at = NOW(),
               review_reason = $4,
               deleted_at = CASE WHEN $1 = 'deleted' THEN NOW() ELSE deleted_at END,
               updated_at = NOW()
           WHERE id = $5
           RETURNING id, status, risk_level, reviewed_by, reviewed_at, review_reason`,
          [nextStatus, risk_level || null, user.user_id, normalizedReason, id]
        )

        await logAdminAction({
          actorId: user.user_id,
          actionType: `community_${action}`,
          targetType: 'community_post',
          targetId: id,
          beforeSnapshot: previous,
          afterSnapshot: result.rows[0],
          reason: normalizedReason,
        })
        await query(
          `INSERT INTO notifications (user_id, notification_type, title, content, data)
           VALUES ($1, 'community_post_review_result', $2, $3, $4::jsonb)`,
          [
            previous.author_id,
            '社区帖子审核结果',
            `你的帖子「${String(previous.title || '未命名帖子')}」审核状态已更新：${nextStatus === 'published' ? '审核通过并展示' : nextStatus === 'hidden' ? '已下架' : nextStatus === 'deleted' ? '已删除' : '状态已变更'}。${normalizedReason ? ` 说明：${normalizedReason}` : ''}`,
            JSON.stringify({
              post_id: id,
              status: nextStatus,
              action,
            }),
          ]
        )

        return success(reply, result.rows[0], 'Moderation action applied')
      } catch (err) {
        console.error('Moderate community post error:', err)
        return errors.internal(reply, 'Failed to moderate post')
      }
    }
  )

  // ============================================
  // POST /api/admin/community/posts/batch-moderate - 后台批量审核处置
  // ============================================
  app.post(
    '/api/admin/community/posts/batch-moderate',
    { preHandler: [app.authenticateAdmin] },
    async (request, reply) => {
      const user = request.user as JwtPayload
      const { ids, action, reason, risk_level } = request.body as {
        ids?: string[]
        action?: 'approve' | 'take_down' | 'restore' | 'delete'
        reason?: string
        risk_level?: 'low' | 'medium' | 'high'
      }

      if (!Array.isArray(ids) || ids.length === 0) {
        return errors.badRequest(reply, 'ids is required')
      }
      if (!action) {
        return errors.badRequest(reply, 'action is required')
      }
      const normalizedReason = String(reason || '').trim()
      if (!normalizedReason) {
        return errors.badRequest(reply, 'reason is required')
      }
      if (risk_level && !['low', 'medium', 'high'].includes(risk_level)) {
        return errors.badRequest(reply, 'invalid risk_level')
      }

      const statusMap: Record<string, string> = {
        approve: 'published',
        take_down: 'hidden',
        restore: 'published',
        delete: 'deleted',
      }
      const nextStatus = statusMap[action]
      if (!nextStatus) {
        return errors.badRequest(reply, 'invalid action')
      }

      const normalizeBatchError = (reason: string): string => {
        const msg = reason.toLowerCase()
        if (msg.includes('not found')) return '帖子不存在'
        if (msg.includes('already processed')) return '帖子已处理'
        if (msg.includes('permission') || msg.includes('forbidden')) return '无权限执行该操作'
        if (msg.includes('invalid')) return '参数不合法'
        if (msg.includes('required')) return '缺少必填参数'
        if (msg.includes('unknown')) return '未知错误'
        return reason
      }

      try {
        await ensureCommunityModerationColumns()
        let successCount = 0
        const failed: Array<{ id: string; reason: string }> = []

        for (const id of ids) {
          try {
            const existing = await query<{
              id: string
              author_id: string
              title: string | null
              status: string
              risk_level: string
              review_reason: string | null
              reviewed_by: string | null
            }>(
              `SELECT id, author_id, title, status, risk_level, review_reason, reviewed_by
               FROM community_posts
               WHERE id = $1`,
              [id]
            )
            if (existing.rows.length === 0) {
              failed.push({ id, reason: '帖子不存在' })
              continue
            }

            const previous = existing.rows[0]
            const result = await query(
              `UPDATE community_posts
               SET status = $1,
                   risk_level = COALESCE($2, risk_level),
                   reviewed_by = $3,
                   reviewed_at = NOW(),
                   review_reason = $4,
                   deleted_at = CASE WHEN $1 = 'deleted' THEN NOW() ELSE deleted_at END,
                   updated_at = NOW()
               WHERE id = $5
               RETURNING id, status, risk_level, reviewed_by, reviewed_at, review_reason`,
              [nextStatus, risk_level || null, user.user_id, normalizedReason, id]
            )

            await logAdminAction({
              actorId: user.user_id,
              actionType: `community_${action}`,
              targetType: 'community_post',
              targetId: id,
              beforeSnapshot: previous,
              afterSnapshot: result.rows[0],
              reason: `[batch] ${normalizedReason}`,
            })
            await query(
              `INSERT INTO notifications (user_id, notification_type, title, content, data)
               VALUES ($1, 'community_post_review_result', $2, $3, $4::jsonb)`,
              [
                previous.author_id,
                '社区帖子审核结果',
                `你的帖子「${String(previous.title || '未命名帖子')}」审核状态已更新：${nextStatus === 'published' ? '审核通过并展示' : nextStatus === 'hidden' ? '已下架' : nextStatus === 'deleted' ? '已删除' : '状态已变更'}。${normalizedReason ? ` 说明：${normalizedReason}` : ''}`,
                JSON.stringify({
                  post_id: id,
                  status: nextStatus,
                  action,
                  batch: true,
                }),
              ]
            )
            successCount += 1
          } catch (err) {
            failed.push({ id, reason: normalizeBatchError(err instanceof Error ? err.message : '未知错误') })
          }
        }

        return success(reply, {
          total: ids.length,
          success: successCount,
          failed_count: failed.length,
          failed,
        }, 'Batch moderation applied')
      } catch (err) {
        console.error('Batch moderate community posts error:', err)
        return errors.internal(reply, 'Failed to batch moderate posts')
      }
    }
  )

  // ============================================
  // POST /api/community/comments/:id/like - 评论点赞 (需要认证)
  // ============================================
  app.post<{ Params: { id: string } }>('/api/community/comments/:id/like', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params
    const user = request.user as JwtPayload

    try {
      // 检查评论是否存在
      const comment = await query<{ id: string }>(
        'SELECT id FROM community_comments WHERE id = $1',
        [id]
      )

      if (comment.rows.length === 0) {
        return errors.notFound(reply, 'Comment not found')
      }

      // 检查是否已点赞
      const existing = await query<{ id: string }>(
        'SELECT id FROM community_comment_likes WHERE comment_id = $1 AND user_id = $2',
        [id, user.user_id]
      )

      let isLiked: boolean

      if (existing.rows.length > 0) {
        await query(
          'DELETE FROM community_comment_likes WHERE comment_id = $1 AND user_id = $2',
          [id, user.user_id]
        )
        await query(
          'UPDATE community_comments SET like_count = like_count - 1 WHERE id = $1',
          [id]
        )
        isLiked = false
      } else {
        await query(
          'INSERT INTO community_comment_likes (comment_id, user_id) VALUES ($1, $2)',
          [id, user.user_id]
        )
        await query(
          'UPDATE community_comments SET like_count = like_count + 1 WHERE id = $1',
          [id]
        )
        isLiked = true
      }

      return success(reply, { is_liked: isLiked }, isLiked ? 'Liked' : 'Unliked')

    } catch (err) {
      console.error('Toggle comment like error:', err)
      return errors.internal(reply, 'Failed to toggle like')
    }
  })

  // ============================================
  // GET /api/community/tags - 获取热门标签
  // ============================================
  app.get('/api/community/tags', async (request, reply) => {
    const { limit = '20' } = request.query as { limit?: string }
    const limitNum = parseInt(limit)

    try {
      // 获取使用最多的标签
      const result = await query<{ tag: string; count: string }>(
        `SELECT tag, COUNT(*) as count
         FROM community_posts, unnest(tags) as tag
         GROUP BY tag
         ORDER BY count DESC
         LIMIT $1`,
        [limitNum]
      )

      return success(reply, result.rows.map(row => ({
        name: row.tag,
        count: parseInt(row.count),
      })))

    } catch (err) {
      console.error('Get tags error:', err)
      return errors.internal(reply, 'Failed to get tags')
    }
  })
}
