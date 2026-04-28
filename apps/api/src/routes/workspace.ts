/**
 * 工作台 (Workspace) API 路由
 * 
 * 客户工作台 - 面向 client 和 creator
 * 功能：已购、收藏、邀请、互动、消息
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { query, transaction } from '../lib/database.js'
import { ensureOpportunityApplicationsCommunitySupport } from '../lib/opportunity-applications-schema.js'
import { success, errors, paginated, created } from '../utils/response.js'
import type { JwtPayload } from '../types.js'
import { isVisitor } from '../plugins/auth.js'
import { uploadToOSS } from '../utils/oss.js'

let opportunityApplicationColumnsEnsured = false
async function ensureOpportunityApplicationWorkbenchColumns(): Promise<void> {
  if (opportunityApplicationColumnsEnsured) return
  try {
    await query(
      'ALTER TABLE opportunity_applications ADD COLUMN IF NOT EXISTS publisher_reply TEXT'
    )
    await query(
      'ALTER TABLE opportunity_applications ADD COLUMN IF NOT EXISTS publisher_replied_at TIMESTAMPTZ'
    )
  } catch (err) {
    console.warn('[workspace] ensure opportunity_applications.publisher_reply:', err)
  }
  opportunityApplicationColumnsEnsured = true
}

let skillRunsTableReady = false
async function ensureSkillRunsTable(): Promise<void> {
  if (skillRunsTableReady) return
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS skill_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
        status VARCHAR(24) NOT NULL DEFAULT 'completed',
        input_file_ids UUID[] NOT NULL DEFAULT '{}',
        token_mode VARCHAR(24) NOT NULL DEFAULT 'partner',
        token_provider VARCHAR(64),
        token_source VARCHAR(24) NOT NULL DEFAULT 'platform_partner',
        skill_title_snapshot VARCHAR(500),
        input_names_snapshot TEXT,
        result_text TEXT,
        output_file_id UUID REFERENCES uploaded_files(id) ON DELETE SET NULL,
        error_message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      )`)
    await query(
      `CREATE INDEX IF NOT EXISTS idx_skill_runs_user_created ON skill_runs(user_id, created_at DESC)`
    )
    await query(
      `ALTER TABLE skill_runs ADD COLUMN IF NOT EXISTS token_mode VARCHAR(24) NOT NULL DEFAULT 'partner'`
    )
    await query(
      `ALTER TABLE skill_runs ADD COLUMN IF NOT EXISTS token_provider VARCHAR(64)`
    )
    await query(
      `ALTER TABLE skill_runs ADD COLUMN IF NOT EXISTS token_source VARCHAR(24) NOT NULL DEFAULT 'platform_partner'`
    )
  } catch (err) {
    console.warn('[workspace] ensure skill_runs table:', err)
  }
  skillRunsTableReady = true
}

let workbenchStatsColumnsEnsured = false
async function ensureWorkbenchStatsColumns(): Promise<void> {
  if (workbenchStatsColumnsEnsured) return
  try {
    await query(
      'ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS dislike_count INTEGER NOT NULL DEFAULT 0'
    )
    await query(
      'ALTER TABLE skills ADD COLUMN IF NOT EXISTS download_count INTEGER NOT NULL DEFAULT 0'
    )
  } catch (err) {
    console.warn('[workspace] ensure analytics columns:', err)
  }
  workbenchStatsColumnsEnsured = true
}

export const workspaceRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
  await ensureOpportunityApplicationWorkbenchColumns()
  await ensureOpportunityApplicationsCommunitySupport()
  await ensureSkillRunsTable()
  await ensureWorkbenchStatsColumns()

  // ============================================
  // GET /api/workspace/overview - 工作台概览
  // ============================================
  app.get('/api/workspace/overview', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    const userId = user.id || user.user_id

    try {
      // 获取统计数据
      const stats = await query(
        `SELECT 
          (SELECT COUNT(*) FROM orders WHERE user_id = $1 AND status = 'paid') as purchased_count,
          (SELECT COUNT(*) FROM favorites WHERE user_id = $1) as favorites_count,
          (SELECT COUNT(*) FROM invitations WHERE receiver_id = $1 AND status = 'pending') as invitations_count,
          (SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false) as unread_notifications_count,
          (SELECT COUNT(*) FROM community_posts WHERE author_id = $1) as posts_count,
          (SELECT COALESCE(SUM(COALESCE(comment_count, 0)), 0) FROM community_posts WHERE author_id = $1) as comments_count`,
        [userId]
      )

      // 获取最近活动
      const recentActivity = await query(
        `SELECT 
          'purchase' as type,
          '购买作品' as title,
          o.created_at
        FROM orders o
        WHERE o.user_id = $1
        UNION ALL
        SELECT 
          'favorite' as type,
          '收藏作品' as title,
          f.created_at
        FROM favorites f
        WHERE f.user_id = $1
        UNION ALL
        SELECT 
          'invitation' as type,
          '收到邀请' as title,
          i.created_at
        FROM invitations i
        WHERE i.receiver_id = $1
        ORDER BY created_at DESC
        LIMIT 5`,
        [userId]
      )

      return success(reply, {
        user: {
          id: userId,
          display_name: user.display_name,
          avatar_url: (user as any).avatar_url || null,
          role: user.role,
        },
        stats: stats.rows[0] || {
          purchased_count: 0,
          favorites_count: 0,
          invitations_count: 0,
          unread_notifications_count: 0,
          posts_count: 0,
          comments_count: 0,
        },
        recent_activity: recentActivity.rows || [],
      })

    } catch (err) {
      console.error('Get workspace overview error:', err)
      return errors.internal(reply, '获取工作台概览失败')
    }
  })

  // ============================================
  // GET /api/workspace/purchased - 我的已购
  // ============================================
  app.get('/api/workspace/purchased', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    const { page = '1', page_size = '20' } = request.query as {
      page?: string
      page_size?: string
    }

    const pageNum = parseInt(String(page))
    const limitNum = parseInt(String(page_size))
    const offset = (pageNum - 1) * limitNum
    const userId = user.id || user.user_id

    try {
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM orders WHERE user_id = $1 AND status = 'paid'`,
        [userId]
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      const result = await query(
        `SELECT 
          o.id,
          o.created_at as purchased_at,
          o.amount,
          o.source_type,
          o.source_id,
          s.title as skill_title,
          s.cover_image as skill_cover,
          s.creator_id as skill_creator_id,
          a.name as agent_name,
          a.avatar_url as agent_avatar,
          a.creator_id as agent_creator_id,
          p.display_name as creator_name,
          p.avatar_url as creator_avatar
        FROM orders o
        LEFT JOIN skills s ON o.source_type = 'skill' AND s.id = o.source_id
        LEFT JOIN agents a ON o.source_type = 'agent' AND a.id = o.source_id
        LEFT JOIN profiles p ON p.id = COALESCE(s.creator_id, a.creator_id)
        WHERE o.user_id = $1 AND o.status = 'paid'
        ORDER BY o.created_at DESC
        LIMIT $2 OFFSET $3`,
        [userId, limitNum, offset]
      )

      return paginated(reply, result.rows, total, pageNum, limitNum)

    } catch (err) {
      console.error('Get purchased error:', err)
      return errors.internal(reply, '获取已购列表失败')
    }
  })

  // ============================================
  // GET /api/workspace/favorites - 我的收藏
  // ============================================
  app.get('/api/workspace/favorites', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    const { page = '1', page_size = '20', type } = request.query as {
      page?: string
      page_size?: string
      type?: 'skill' | 'agent' | 'creator' | 'lawyer'
    }

    const pageNum = parseInt(String(page))
    const limitNum = parseInt(String(page_size))
    const offset = (pageNum - 1) * limitNum
    const userId = user.id || user.user_id

    try {
      const conditions: string[] = ['f.user_id = $1']
      const params: unknown[] = [userId]
      let paramIndex = 2

      if (type) {
        conditions.push(`f.favoritable_type = $${paramIndex++}`)
        params.push(type)
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`

      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM favorites f ${whereClause}`,
        params
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      params.push(limitNum, offset)
      const result = await query(
        `SELECT 
          f.id,
          f.favoritable_type,
          f.favoritable_id,
          f.created_at,
          s.title as skill_title,
          s.cover_image as skill_cover,
          s.price as skill_price,
          s.download_count as skill_downloads,
          a.name as agent_name,
          a.avatar_url as agent_avatar,
          a.price as agent_price,
          a.trial_count as agent_trials,
          p.display_name as creator_name,
          p.avatar_url as creator_avatar,
          p.verified as creator_verified
        FROM favorites f
        LEFT JOIN skills s ON f.favoritable_type = 'skill' AND f.favoritable_id = s.id
        LEFT JOIN agents a ON f.favoritable_type = 'agent' AND f.favoritable_id = a.id
        LEFT JOIN profiles p ON p.id = COALESCE(s.creator_id, a.creator_id)
        ${whereClause}
        ORDER BY f.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params
      )

      return paginated(reply, result.rows, total, pageNum, limitNum)

    } catch (err) {
      console.error('Get favorites error:', err)
      return errors.internal(reply, '获取收藏列表失败')
    }
  })

  // ============================================
  // DELETE /api/workspace/favorites/:id - 取消收藏
  // ============================================
  app.delete<{ Params: { id: string } }>(
    '/api/workspace/favorites/:id',
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
          `DELETE FROM favorites WHERE id = $1 AND user_id = $2 RETURNING id`,
          [id, userId]
        )

        if (result.rows.length === 0) {
          return errors.notFound(reply, '收藏不存在或无权限')
        }

        return success(reply, { id }, '已取消收藏')

      } catch (err) {
        console.error('Delete favorite error:', err)
        return errors.internal(reply, '取消收藏失败')
      }
    }
  )

  // ============================================
  // GET /api/workspace/invitations - 我的邀请（收到的）
  // ============================================
  app.get('/api/workspace/invitations', {
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
    const userId = user.id || user.user_id

    try {
      const conditions: string[] = ['i.receiver_id = $1']
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
          p.id as sender_id,
          p.display_name as sender_name,
          p.avatar_url as sender_avatar,
          CASE 
            WHEN i.source_type = 'skill' THEN s.title
            WHEN i.source_type = 'agent' THEN a.name
            WHEN i.source_type = 'opportunity' THEN o.title
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
      console.error('Get workspace invitations error:', err)
      return errors.internal(reply, '获取邀请列表失败')
    }
  })

  // ============================================
  // GET /api/workspace/opportunity-applications - 我发布的机会收到的投递
  // ============================================
  app.get('/api/workspace/opportunity-applications', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    const { page = '1', page_size = '20' } = request.query as {
      page?: string
      page_size?: string
    }

    const pageNum = parseInt(String(page), 10)
    const limitNum = parseInt(String(page_size), 10)
    const offset = (pageNum - 1) * limitNum
    const userId = user.id || user.user_id

    try {
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*)::text as count
         FROM opportunity_applications oa
         LEFT JOIN opportunities o ON o.id = oa.opportunity_id
         LEFT JOIN community_posts cp ON cp.id = oa.community_post_id
         WHERE (oa.opportunity_id IS NOT NULL AND o.publisher_id = $1)
            OR (oa.community_post_id IS NOT NULL AND cp.author_id = $1)`,
        [userId]
      )
      const total = parseInt(countResult.rows[0]?.count || '0', 10)

      const result = await query(
        `SELECT
           oa.id,
           oa.file_url,
           oa.original_name,
           oa.message,
           oa.publisher_reply,
           oa.created_at,
           oa.updated_at,
           oa.community_post_id,
           oa.opportunity_id,
           CASE WHEN oa.community_post_id IS NOT NULL THEN 'community_post' ELSE 'opportunity' END as application_source,
           COALESCE(o.title, cp.title) as opportunity_title,
           COALESCE(o.slug, '') as opportunity_slug,
           COALESCE(o.status, 'published') as opportunity_status,
           oa.applicant_id,
           COALESCE(p.display_name, '用户') as applicant_name
         FROM opportunity_applications oa
         LEFT JOIN opportunities o ON o.id = oa.opportunity_id
         LEFT JOIN community_posts cp ON cp.id = oa.community_post_id
         INNER JOIN profiles p ON p.id = oa.applicant_id
         WHERE (oa.opportunity_id IS NOT NULL AND o.publisher_id = $1)
            OR (oa.community_post_id IS NOT NULL AND cp.author_id = $1)
         ORDER BY oa.updated_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limitNum, offset]
      )

      return paginated(reply, result.rows, total, pageNum, limitNum)
    } catch (err) {
      console.error('Get opportunity applications error:', err)
      return errors.internal(reply, '获取机会投递列表失败')
    }
  })

  // ============================================
  // PATCH /api/workspace/opportunity-applications/:id/reply — 发布方回复投递人
  // ============================================
  app.patch<{ Params: { id: string } }>(
    '/api/workspace/opportunity-applications/:id/reply',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const user = request.user as JwtPayload
      if (isVisitor(user)) {
        return errors.unauthorized(reply, '请先登录')
      }
      const publisherId = user.id || user.user_id
      const { id } = request.params
      const body = request.body as { message?: string }
      const text =
        typeof body?.message === 'string' ? body.message.trim().slice(0, 2000) : ''
      if (!text) {
        return errors.badRequest(reply, '回复内容不能为空')
      }

      try {
        await ensureOpportunityApplicationWorkbenchColumns()
        const check = await query<{
          application_id: string
          publisher_id: string
          applicant_id: string
          opportunity_title: string
          opportunity_id: string | null
          community_post_id: string | null
        }>(
          `SELECT
             oa.id as application_id,
             COALESCE(o.publisher_id, cp.author_id) as publisher_id,
             oa.applicant_id,
             COALESCE(o.title, cp.title) as opportunity_title,
             o.id as opportunity_id,
             oa.community_post_id
           FROM opportunity_applications oa
           LEFT JOIN opportunities o ON o.id = oa.opportunity_id
           LEFT JOIN community_posts cp ON cp.id = oa.community_post_id
           WHERE oa.id = $1`,
          [id]
        )
        if (check.rows.length === 0) {
          return errors.notFound(reply, '投递记录不存在')
        }
        const row = check.rows[0]
        if (row.publisher_id !== publisherId) {
          return errors.forbidden(reply, '仅岗位发布方可回复该投递')
        }

        await query(
          `UPDATE opportunity_applications
           SET publisher_reply = $1, publisher_replied_at = NOW(), updated_at = NOW()
           WHERE id = $2`,
          [text, id]
        )

        const snippet = text.length > 160 ? `${text.slice(0, 160)}…` : text
        const sourceLabel = row.community_post_id ? '社区帖子' : '岗位'
        await query(
          `INSERT INTO notifications (user_id, notification_type, title, content, data)
           VALUES ($1, 'opportunity_application_reply', $2, $3, $4::jsonb)`,
          [
            row.applicant_id,
            '岗位申请回复',
            `「${row.opportunity_title}」${sourceLabel}发布方回复了你的投递：${snippet}`,
            JSON.stringify({
              application_id: id,
              opportunity_id: row.opportunity_id,
              community_post_id: row.community_post_id,
            }),
          ]
        )

        return success(reply, { id }, '回复已发送')
      } catch (err) {
        console.error('Reply opportunity application error:', err)
        return errors.internal(reply, '回复失败')
      }
    }
  )

  // ============================================
  // GET /api/workspace/my-opportunity-submissions — 当前用户发出的投递（求职者侧）
  // ============================================
  app.get('/api/workspace/my-opportunity-submissions', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    const { page = '1', page_size = '20' } = request.query as {
      page?: string
      page_size?: string
    }

    const pageNum = parseInt(String(page), 10)
    const limitNum = parseInt(String(page_size), 10)
    const offset = (pageNum - 1) * limitNum
    const userId = user.id || user.user_id

    try {
      await ensureOpportunityApplicationWorkbenchColumns()
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*)::text as count
         FROM opportunity_applications oa
         WHERE oa.applicant_id = $1`,
        [userId]
      )
      const total = parseInt(countResult.rows[0]?.count || '0', 10)

      const result = await query(
        `SELECT
           oa.id,
           oa.file_url,
           oa.original_name,
           oa.message,
           oa.publisher_reply,
           oa.publisher_replied_at,
           oa.created_at,
           oa.updated_at,
           oa.community_post_id,
           oa.opportunity_id,
           CASE WHEN oa.community_post_id IS NOT NULL THEN 'community_post' ELSE 'opportunity' END as application_source,
           COALESCE(o.title, cp.title) as opportunity_title,
           COALESCE(o.slug, '') as opportunity_slug,
           COALESCE(o.status, 'published') as opportunity_status,
           COALESCE(pub.display_name, cp_author.display_name, '岗位发布方') as publisher_reply_name
         FROM opportunity_applications oa
         LEFT JOIN opportunities o ON o.id = oa.opportunity_id
         LEFT JOIN community_posts cp ON cp.id = oa.community_post_id
         LEFT JOIN profiles pub ON pub.id = o.publisher_id
         LEFT JOIN profiles cp_author ON cp_author.id = cp.author_id
         WHERE oa.applicant_id = $1
         ORDER BY oa.updated_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limitNum, offset]
      )

      return paginated(reply, result.rows, total, pageNum, limitNum)
    } catch (err) {
      console.error('Get my opportunity submissions error:', err)
      return errors.internal(reply, '获取我的投递失败')
    }
  })

  // ============================================
  // DELETE /api/workspace/my-opportunity-submissions/:id — 撤回投递（仅本人）
  // ============================================
  app.delete<{ Params: { id: string } }>(
    '/api/workspace/my-opportunity-submissions/:id',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const user = request.user as JwtPayload
      if (isVisitor(user)) {
        return errors.unauthorized(reply, '请先登录')
      }
      const userId = user.id || user.user_id
      const { id } = request.params

      try {
        const sel = await query<{ id: string; opportunity_id: string | null; applicant_id: string }>(
          `SELECT id, opportunity_id, applicant_id FROM opportunity_applications WHERE id = $1`,
          [id]
        )
        if (sel.rows.length === 0) {
          return errors.notFound(reply, '投递记录不存在')
        }
        const row = sel.rows[0]
        if (row.applicant_id !== userId) {
          return errors.forbidden(reply, '仅可撤回本人投递')
        }

        await transaction(async (client) => {
          await client.query(`DELETE FROM opportunity_applications WHERE id = $1`, [id])
          if (row.opportunity_id) {
            await client.query(
              `UPDATE opportunities
               SET application_count = GREATEST(0, COALESCE(application_count, 0) - 1)
               WHERE id = $1`,
              [row.opportunity_id]
            )
          }
        })

        return success(reply, { id }, '已撤回投递')
      } catch (err) {
        console.error('Delete my opportunity submission error:', err)
        return errors.internal(reply, '撤回投递失败')
      }
    }
  )

  // ============================================
  // GET /api/workspace/post-analytics — 我的帖子汇总（数据分析用）
  // ============================================
  app.get('/api/workspace/post-analytics', {
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const user = request.user as JwtPayload
    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }
    const userId = user.id || user.user_id
    try {
      const agg = await query<{
        post_count: string
        total_views: string
        total_comments: string
        total_likes: string
        total_dislikes: string
        total_skill_downloads: string
      }>(
        `SELECT
           COUNT(*)::text as post_count,
           COALESCE(SUM(COALESCE(view_count, 0)), 0)::text as total_views,
           COALESCE(SUM(COALESCE(comment_count, 0)), 0)::text as total_comments,
           COALESCE(SUM(COALESCE(like_count, 0)), 0)::text as total_likes,
           COALESCE(SUM(COALESCE(dislike_count, 0)), 0)::text as total_dislikes,
           (
             SELECT COALESCE(SUM(COALESCE(s.download_count, 0)), 0)::text
             FROM skills s
             WHERE s.creator_id = $1
           ) as total_skill_downloads
         FROM community_posts
         WHERE author_id = $1`,
        [userId]
      )
      const top = await query(
        `SELECT id, title, view_count, comment_count, like_count, dislike_count, created_at
         FROM community_posts
         WHERE author_id = $1
         ORDER BY COALESCE(view_count, 0) + COALESCE(comment_count, 0) * 2 DESC
         LIMIT 8`,
        [userId]
      )
      const a = agg.rows[0] || {
        post_count: '0',
        total_views: '0',
        total_comments: '0',
        total_likes: '0',
        total_dislikes: '0',
        total_skill_downloads: '0',
      }
      return success(reply, {
        post_count: parseInt(a.post_count, 10) || 0,
        total_views: parseInt(a.total_views, 10) || 0,
        total_comments: parseInt(a.total_comments, 10) || 0,
        total_likes: parseInt(a.total_likes, 10) || 0,
        total_dislikes: parseInt(a.total_dislikes, 10) || 0,
        total_skill_downloads: parseInt(a.total_skill_downloads, 10) || 0,
        top_posts: top.rows,
      })
    } catch (err) {
      console.error('Get post analytics error:', err)
      return errors.internal(reply, '获取帖子统计失败')
    }
  })

  // ============================================
  // GET /api/workspace/community - 我的社区活动
  // ============================================
  app.get('/api/workspace/community', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    const { page = '1', page_size = '20' } = request.query as {
      page?: string
      page_size?: string
    }

    const pageNum = parseInt(String(page))
    const limitNum = parseInt(String(page_size))
    const offset = (pageNum - 1) * limitNum
    const userId = user.id || user.user_id

    try {
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM community_posts WHERE author_id = $1`,
        [userId]
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      const result = await query(
        `SELECT 
          p.id,
          p.title,
          p.content,
          p.tags,
          COALESCE(p.view_count, 0) as view_count,
          COALESCE(p.comment_count, 0) as comment_count,
          COALESCE(p.like_count, 0) as like_count,
          p.created_at
        FROM community_posts p
        WHERE p.author_id = $1
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3`,
        [userId, limitNum, offset]
      )

      return paginated(reply, result.rows, total, pageNum, limitNum)

    } catch (err) {
      console.error('Get workspace community error:', err)
      return errors.internal(reply, '获取社区活动失败')
    }
  })

  // ============================================
  // GET /api/workspace/notifications - 我的通知
  // ============================================
  app.get('/api/workspace/notifications', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    const { page = '1', page_size = '20', is_read, type } = request.query as {
      page?: string
      page_size?: string
      is_read?: string
      type?: string
    }

    const pageNum = parseInt(String(page))
    const limitNum = parseInt(String(page_size))
    const offset = (pageNum - 1) * limitNum
    const userId = user.id || user.user_id

    try {
      const conditions: string[] = ['n.user_id = $1']
      const params: unknown[] = [userId]
      let paramIndex = 2

      if (is_read !== undefined) {
        conditions.push(`n.is_read = $${paramIndex++}`)
        params.push(is_read === 'true')
      }

      if (type) {
        conditions.push(`n.notification_type = $${paramIndex++}`)
        params.push(type)
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
      console.error('Get workspace notifications error:', err)
      return errors.internal(reply, '获取通知列表失败')
    }
  })

  // ============================================
  // PATCH /api/workspace/notifications/:id/read - 标记已读
  // ============================================
  app.patch<{ Params: { id: string } }>(
    '/api/workspace/notifications/:id/read',
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
  // POST /api/workspace/notifications/read-all - 全部标记已读
  // ============================================
  app.post('/api/workspace/notifications/read-all', {
    onRequest: [app.authenticate]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }

    const userId = user.id || user.user_id

    try {
      await query(
        `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
        [userId]
      )

      return success(reply, null, '全部已标记为已读')

    } catch (err) {
      console.error('Mark all notifications read error:', err)
      return errors.internal(reply, '标记全部已读失败')
    }
  })

  // ============================================
  // DELETE /api/workspace/notifications/:id - 删除通知
  // ============================================
  app.delete<{ Params: { id: string } }>(
    '/api/workspace/notifications/:id',
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
  // GET /api/workspace/skill-runs — 技能运行记录（画布闭环）
  // ============================================
  app.get('/api/workspace/skill-runs', { onRequest: [app.authenticate] }, async (request, reply) => {
    const user = request.user as JwtPayload
    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }
    const userId = user.id || user.user_id
    const { page = '1', page_size = '20' } = request.query as { page?: string; page_size?: string }
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(String(page_size), 10) || 20))
    const offset = (pageNum - 1) * limitNum

    try {
      await ensureSkillRunsTable()
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*)::text as count FROM skill_runs WHERE user_id = $1`,
        [userId]
      )
      const total = parseInt(countResult.rows[0]?.count || '0', 10)
      const result = await query(
        `SELECT r.*, uf.url AS output_file_url, uf.original_name AS output_original_name
         FROM skill_runs r
         LEFT JOIN uploaded_files uf ON uf.id = r.output_file_id
         WHERE r.user_id = $1
         ORDER BY r.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limitNum, offset]
      )
      return paginated(reply, result.rows, total, pageNum, limitNum)
    } catch (err) {
      console.error('List skill runs error:', err)
      return errors.internal(reply, '获取运行记录失败')
    }
  })

  // ============================================
  // POST /api/workspace/skill-runs — 执行技能（占位管线：汇总输入 → 生成报告与可下载文件）
  // ============================================
  app.post('/api/workspace/skill-runs', { onRequest: [app.authenticate] }, async (request, reply) => {
    const user = request.user as JwtPayload
    if (isVisitor(user)) {
      return errors.unauthorized(reply, '请先登录')
    }
    const userId = user.id || user.user_id
    const body = (request.body || {}) as {
      skill_id?: string
      input_file_ids?: string[]
      token_policy?: {
        mode?: 'off' | 'partner'
        provider?: string
      }
    }
    const skillId = String(body.skill_id || '').trim()
    const inputIds = Array.isArray(body.input_file_ids) ? body.input_file_ids.map((x) => String(x).trim()).filter(Boolean) : []
    const rawMode = String(body.token_policy?.mode || 'partner').trim().toLowerCase()
    const tokenMode: 'off' | 'partner' = rawMode === 'off' || rawMode === 'partner' ? rawMode : 'partner'
    const tokenProvider = String(body.token_policy?.provider || '').trim().slice(0, 64)
    const tokenSource = tokenMode === 'off' ? 'none' : 'platform_partner'
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    if (!skillId || !uuidRe.test(skillId)) {
      return errors.badRequest(reply, '请提供有效的 skill_id')
    }
    if (inputIds.length === 0 || inputIds.length > 20) {
      return errors.badRequest(reply, '请提供 1～20 个输入文件 id')
    }
    if (!inputIds.every((id) => uuidRe.test(id))) {
      return errors.badRequest(reply, '输入文件 id 格式无效')
    }

    try {
      await ensureSkillRunsTable()

      const skillRes = await query<{
        id: string
        title: string
        creator_id: string
        price: string | null
        price_type: string | null
        status: string | null
      }>(
        `SELECT s.id, s.title, s.creator_id, s.price::text AS price, s.price_type, s.status
         FROM skills s
         WHERE s.id = $1
           AND (
             s.creator_id = $2
             OR (
               COALESCE(s.status, '') IN ('active', 'published')
               AND (
                 LOWER(COALESCE(s.price_type, '')) = 'free'
                 OR (s.price IS NOT NULL AND s.price::numeric <= 0)
                 OR EXISTS (
                   SELECT 1 FROM orders o
                   WHERE o.user_id = $2 AND o.status = 'paid'
                     AND o.source_type = 'skill' AND o.source_id = s.id
                 )
               )
             )
           )
         LIMIT 1`,
        [skillId, userId]
      )

      if (skillRes.rows.length === 0) {
        return errors.forbidden(reply, '无权对该技能发起运行，或技能不可用')
      }

      const skill = skillRes.rows[0]
      const filesRes = await query<{ id: string; original_name: string }>(
        `SELECT id, original_name FROM uploaded_files WHERE user_id = $1 AND id = ANY($2::uuid[])`,
        [userId, inputIds]
      )
      if (filesRes.rows.length !== inputIds.length) {
        return errors.badRequest(reply, '部分输入文件不存在或不属于当前用户')
      }
      const inputNames = filesRes.rows.map((r) => r.original_name || r.id).join('、')
      const nowIso = new Date().toISOString()
      const resultText =
        `【律植 · 技能运行报告】\n` +
        `运行时间：${nowIso}\n` +
        `技能：${skill.title}\n` +
        `Token策略：${tokenMode} / ${tokenSource}${tokenProvider ? ` / ${tokenProvider}` : ''}\n` +
        `输入材料（${filesRes.rows.length} 个）：${inputNames}\n\n` +
        `说明：当前为工作台闭环占位执行管线，已将材料元数据纳入报告。\n` +
        `后续可替换为真实编排（沙箱/队列/LLM/脚本），并将结构化产出写入对象存储。\n`

      const runInsert = await query<{ id: string }>(
        `INSERT INTO skill_runs (
           user_id, skill_id, status, input_file_ids, token_mode, token_provider, token_source, skill_title_snapshot, input_names_snapshot,
           result_text, completed_at
         ) VALUES ($1, $2, 'running', $3::uuid[], $4, $5, $6, $7, $8, $9, NULL)
         RETURNING id`,
        [userId, skillId, inputIds, tokenMode, tokenProvider || null, tokenSource, skill.title.slice(0, 500), inputNames, resultText]
      )
      const runId = runInsert.rows[0]?.id
      if (!runId) {
        return errors.internal(reply, '创建运行记录失败')
      }

      let outputFileId: string | null = null
      const outName = `技能产出-${skill.title.slice(0, 40).replace(/[/\\?%*:|"<>]/g, '_')}-${runId.slice(0, 8)}.txt`
      const uniqueName = `${runId.slice(0, 8)}-output.txt`
      const ossPath = `skill-runs/${userId}/${uniqueName}`

      try {
        const url = await uploadToOSS(ossPath, Buffer.from(resultText, 'utf8'), 'text/plain; charset=utf-8')
        const uf = await query<{ id: string }>(
          `INSERT INTO uploaded_files (user_id, filename, original_name, size, mime_type, url, category)
           VALUES ($1, $2, $3, $4, $5, $6, 'skill_run_output')
           RETURNING id`,
          [userId, uniqueName, outName, Buffer.byteLength(resultText, 'utf8'), 'text/plain', url]
        )
        outputFileId = uf.rows[0]?.id ?? null
      } catch (ossErr) {
        console.warn('[workspace] skill-runs OSS output skipped:', ossErr)
      }

      await query(
        `UPDATE skill_runs
         SET status = 'completed', output_file_id = $2, completed_at = NOW()
         WHERE id = $1`,
        [runId, outputFileId]
      )

      const row = await query(
        `SELECT r.*, uf.url AS output_file_url, uf.original_name AS output_original_name
         FROM skill_runs r
         LEFT JOIN uploaded_files uf ON uf.id = r.output_file_id
         WHERE r.id = $1`,
        [runId]
      )

      return created(reply, row.rows[0] || { id: runId }, '技能运行已完成')
    } catch (err) {
      console.error('Skill run error:', err)
      return errors.internal(reply, '技能运行失败')
    }
  })
}
