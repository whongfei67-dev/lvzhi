/**
 * 管理后台 API 路由
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { query } from '../lib/database.js'
import { success, paginated } from '../utils/response.js'
import { ensureAdminActionsTable, logAdminAction } from '../utils/admin-actions.js'
import {
  applyUserSanction,
  ensureUserSanctionColumns,
  type SanctionDuration,
  type SanctionScope,
} from '../utils/user-sanctions.js'

export const adminRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
  let withdrawColumnsEnsured = false
  let settlementColumnsEnsured = false
  let policyTableEnsured = false
  let ipApplicationsEnsured = false
  let communityReportTableEnsured = false
  let communityModerationEnsured = false
  let profileContactColumnsEnsured = false
  let ordersPaymentColumnsEnsured = false
  let dataOverviewIndexesEnsured = false
  let lawyerReviewsModerationEnsured = false
  const detailQueryCache = new Map<string, { expiresAt: number; payload: unknown }>()
  const REAL_USER_EMAIL_FILTER = `
    email IS NOT NULL
    AND BTRIM(email) <> ''
    AND POSITION('@' IN email) > 1
    AND lower(email) !~ '^(test|demo|mock|sample|qa|dev|tmp|temp|note_|upd_)'
    AND lower(email) NOT LIKE '%+test@%'
    AND lower(email) NOT LIKE '%+qa@%'
    AND lower(email) NOT LIKE '%+dev@%'
    AND split_part(lower(email), '@', 2) NOT IN (
      'example.com',
      'example.org',
      'example.net',
      'test.com',
      'test.local',
      'localhost',
      'mailinator.com',
      'tempmail.com'
    )
  `

  async function ensureWithdrawColumns() {
    if (withdrawColumnsEnsured) return
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS withdraw_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          amount NUMERIC(12, 2) NOT NULL,
          fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
          actual_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
          account_type TEXT NOT NULL DEFAULT 'alipay',
          account TEXT NOT NULL DEFAULT '',
          account_name TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          rejection_reason TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          processed_at TIMESTAMPTZ
        )
      `)
      await query('CREATE INDEX IF NOT EXISTS idx_withdraw_requests_status_created ON withdraw_requests(status, created_at DESC)')
      await query("ALTER TABLE withdraw_requests ADD COLUMN IF NOT EXISTS processed_by UUID")
      await query('ALTER TABLE withdraw_requests ADD COLUMN IF NOT EXISTS review_reason TEXT')
      await query('ALTER TABLE withdraw_requests ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ')
      await query("ALTER TABLE withdraw_requests ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'")
    } catch (err) {
      console.warn('[admin] ensureWithdrawColumns failed:', err)
    }
    withdrawColumnsEnsured = true
  }

  async function ensureSettlementColumns() {
    if (settlementColumnsEnsured) return
    try {
      await query("ALTER TABLE creator_earnings ADD COLUMN IF NOT EXISTS settlement_status TEXT NOT NULL DEFAULT 'pending'")
      await query('ALTER TABLE creator_earnings ADD COLUMN IF NOT EXISTS settlement_reviewed_by UUID')
      await query('ALTER TABLE creator_earnings ADD COLUMN IF NOT EXISTS settlement_reviewed_at TIMESTAMPTZ')
      await query('ALTER TABLE creator_earnings ADD COLUMN IF NOT EXISTS settlement_review_reason TEXT')
    } catch (err) {
      console.warn('[admin] ensureSettlementColumns failed:', err)
    }
    settlementColumnsEnsured = true
  }

  async function ensureAdminPolicyTable() {
    if (policyTableEnsured) return
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS admin_policies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          policy_key TEXT NOT NULL UNIQUE,
          config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_by UUID,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
      await query('CREATE INDEX IF NOT EXISTS idx_admin_policies_key ON admin_policies(policy_key)')
    } catch (err) {
      console.warn('[admin] ensureAdminPolicyTable failed:', err)
    }
    policyTableEnsured = true
  }

  async function ensureIpApplicationsTable() {
    if (ipApplicationsEnsured) return
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS ip_applications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          source_type VARCHAR(20) NOT NULL,
          source_id UUID NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          materials JSONB DEFAULT '{}'::jsonb,
          review_note TEXT,
          reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
          reviewed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
      await query('CREATE INDEX IF NOT EXISTS idx_ip_creator ON ip_applications(creator_id)')
      await query('CREATE INDEX IF NOT EXISTS idx_ip_source ON ip_applications(source_type, source_id)')
      await query('CREATE INDEX IF NOT EXISTS idx_ip_status ON ip_applications(status)')
    } catch (err) {
      console.warn('[admin] ensureIpApplicationsTable failed:', err)
    }
    ipApplicationsEnsured = true
  }

  async function ensureCommunityReportTable() {
    if (communityReportTableEnsured) return
    try {
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
    } catch (err) {
      console.warn('[admin] ensureCommunityReportTable failed:', err)
    }
    communityReportTableEnsured = true
  }

  async function ensureProfileContactColumns() {
    if (profileContactColumnsEnsured) return
    try {
      await query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT')
      await query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname TEXT')
      await query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_address TEXT')
      await query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS work_organization TEXT')
      await query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status TEXT')
      await query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT')
      await query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT')
      await query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_year INTEGER')
      await query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lawyer_verified BOOLEAN DEFAULT false')
      await query("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS creator_level TEXT DEFAULT 'creator'")
      await query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialty TEXT[] DEFAULT ARRAY[]::text[]')
    } catch (err) {
      console.warn('[admin] ensureProfileContactColumns failed:', err)
    }
    profileContactColumnsEnsured = true
  }

  async function ensureCommunityModerationColumns() {
    if (communityModerationEnsured) return
    try {
      await query("ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'")
      await query("ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS risk_level TEXT NOT NULL DEFAULT 'low'")
      await query('ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS reviewed_by UUID')
      await query('ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ')
      await query('ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS review_reason TEXT')
      await query('ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ')
      await query('ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()')
    } catch (err) {
      console.warn('[admin] ensureCommunityModerationColumns failed:', err)
    }
    communityModerationEnsured = true
  }

  async function ensureOrdersPaymentColumns() {
    if (ordersPaymentColumnsEnsured) return
    try {
      await query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_account TEXT')
      await query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_remark TEXT')
      await query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS biz_type TEXT NOT NULL DEFAULT 'general'")
      await query(`
        UPDATE orders
        SET biz_type = 'promotion'
        WHERE biz_type = 'general'
          AND (
            COALESCE(order_type, '') ILIKE '%promo%'
            OR COALESCE(order_type, '') ILIKE '%promotion%'
          )
      `)
    } catch (err) {
      console.warn('[admin] ensureOrdersPaymentColumns failed:', err)
    }
    ordersPaymentColumnsEnsured = true
  }

  async function ensureDataOverviewIndexes() {
    if (dataOverviewIndexesEnsured) return
    try {
      await query('CREATE INDEX IF NOT EXISTS idx_profiles_role_status_city_created ON profiles(role, status, city, created_at DESC)')
      await query('CREATE INDEX IF NOT EXISTS idx_orders_status_paid_created ON orders(status, paid_at DESC, created_at DESC)')
      await query('CREATE INDEX IF NOT EXISTS idx_orders_biz_type ON orders(biz_type)')
      await query('CREATE INDEX IF NOT EXISTS idx_creator_earnings_settlement_created ON creator_earnings(settlement_status, status, settlement_reviewed_at DESC, created_at DESC)')
      await query('CREATE INDEX IF NOT EXISTS idx_community_posts_status_created_author ON community_posts(status, created_at DESC, author_id)')
      await query('CREATE INDEX IF NOT EXISTS idx_community_comments_created_author ON community_comments(created_at DESC, author_id)')
      await query('CREATE INDEX IF NOT EXISTS idx_opportunities_status_created_publisher ON opportunities(status, created_at DESC, publisher_id)')
      await query('CREATE INDEX IF NOT EXISTS idx_skills_status_category_created_creator ON skills(status, category, created_at DESC, creator_id)')
    } catch (err) {
      console.warn('[admin] ensureDataOverviewIndexes failed:', err)
    }
    dataOverviewIndexesEnsured = true
  }

  async function ensureLawyerReviewsModeration() {
    if (lawyerReviewsModerationEnsured) return
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS lawyer_reviews (
          id UUID PRIMARY KEY,
          lawyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
          tags TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
          content TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(lawyer_id, reviewer_id)
        )
      `)
      await query('ALTER TABLE lawyer_reviews ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false')
      await query('ALTER TABLE lawyer_reviews ADD COLUMN IF NOT EXISTS hidden_reason TEXT')
      await query('ALTER TABLE lawyer_reviews ADD COLUMN IF NOT EXISTS hidden_by UUID REFERENCES profiles(id) ON DELETE SET NULL')
      await query('ALTER TABLE lawyer_reviews ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ')
      await query('CREATE INDEX IF NOT EXISTS idx_lawyer_reviews_lawyer_created ON lawyer_reviews(lawyer_id, created_at DESC)')
      await query('CREATE INDEX IF NOT EXISTS idx_lawyer_reviews_hidden_created ON lawyer_reviews(is_hidden, created_at DESC)')
    } catch (err) {
      console.warn('[admin] ensureLawyerReviewsModeration failed:', err)
    }
    lawyerReviewsModerationEnsured = true
  }

  const DEFAULT_POLICIES = {
    settlement: {
      auto_settle_days: 7,
      min_settle_amount: 1,
      require_manual_review_above: 10000,
    },
    withdraw: {
      min_amount: 10,
      max_amount: 50000,
      fee_rate: 0.05,
      daily_limit_count: 3,
      require_superadmin_above: 20000,
    },
  } as const

  function readNumber(value: unknown, fallback: number): number {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  async function getPoliciesMerged(): Promise<{ settlement: Record<string, unknown>; withdraw: Record<string, unknown> }> {
    await ensureAdminPolicyTable()
    const rows = await query<{ policy_key: string; config_json: Record<string, unknown> }>(
      'SELECT policy_key, config_json FROM admin_policies'
    )
    const merged: { settlement: Record<string, unknown>; withdraw: Record<string, unknown> } = {
      settlement: { ...DEFAULT_POLICIES.settlement },
      withdraw: { ...DEFAULT_POLICIES.withdraw },
    }
    for (const row of rows.rows) {
      if (row.policy_key === 'settlement') {
        merged.settlement = { ...merged.settlement, ...(row.config_json || {}) }
      }
      if (row.policy_key === 'withdraw') {
        merged.withdraw = { ...merged.withdraw, ...(row.config_json || {}) }
      }
    }
    return merged
  }

  async function safeNotifyReviewResult(params: {
    userId?: string | null
    notificationType: string
    title: string
    content: string
    data?: Record<string, unknown>
  }) {
    const userId = String(params.userId || '').trim()
    if (!userId) return
    try {
      await query(
        `INSERT INTO notifications (user_id, notification_type, title, content, data)
         VALUES ($1, $2, $3, $4, $5::jsonb)`,
        [
          userId,
          params.notificationType,
          params.title,
          params.content,
          JSON.stringify(params.data || {}),
        ]
      )
    } catch (err) {
      console.warn('[admin] notify review result failed:', err)
    }
  }

  await ensureAdminActionsTable()
  await ensureWithdrawColumns()
  await ensureSettlementColumns()
  await ensureAdminPolicyTable()
  await ensureIpApplicationsTable()
  await ensureCommunityReportTable()
  await ensureCommunityModerationColumns()
  await ensureOrdersPaymentColumns()
  await ensureDataOverviewIndexes()
  await ensureLawyerReviewsModeration()
  await ensureUserSanctionColumns()

  app.get('/api/admin/actions', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const { target_type, limit = '20', include_snapshots } = request.query as {
      target_type?: string
      limit?: string
      include_snapshots?: string
    }

    const take = Math.min(Math.max(parseInt(limit) || 20, 1), 100)
    const needSnapshots = include_snapshots === '1' || include_snapshots === 'true'

    try {
      const params: unknown[] = []
      let idx = 1
      let where = ''
      if (target_type) {
        where = `WHERE a.target_type = $${idx++}`
        params.push(target_type)
      }
      params.push(take)
      const result = await query(
        `SELECT
           a.id,
           a.action_type,
           a.target_type,
           a.target_id,
           a.reason,
           ${needSnapshots ? 'a.before_snapshot, a.after_snapshot,' : ''}
           a.created_at,
           p.display_name as actor_name
         FROM admin_actions a
         LEFT JOIN profiles p ON p.id = a.actor_id
         ${where}
         ORDER BY a.created_at DESC
         LIMIT $${idx}`,
        params
      )

      return success(reply, { items: result.rows })
    } catch (error) {
      request.log.error('Get admin actions error:', error)
      return reply.status(500).send({ code: 500, message: '获取审计日志失败' })
    }
  })

  // ============================================
  // GET /api/admin/lawyer-reviews - 律师评价审核列表
  // ============================================
  app.get('/api/admin/lawyer-reviews', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const {
      page = '1',
      pageSize = '20',
      status = 'visible',
      q = '',
    } = request.query as {
      page?: string
      pageSize?: string
      status?: 'all' | 'visible' | 'hidden'
      q?: string
    }

    const pageNum = Math.max(parseInt(page) || 1, 1)
    const pageSizeNum = Math.min(Math.max(parseInt(pageSize) || 20, 1), 100)
    const offset = (pageNum - 1) * pageSizeNum
    const normalizedStatus = ['all', 'visible', 'hidden'].includes(String(status))
      ? String(status)
      : 'visible'
    const keyword = String(q || '').trim()

    try {
      await ensureLawyerReviewsModeration()
      const conditions: string[] = []
      const params: unknown[] = []
      let idx = 1
      if (normalizedStatus === 'visible') {
        conditions.push('COALESCE(lr.is_hidden, false) = false')
      } else if (normalizedStatus === 'hidden') {
        conditions.push('COALESCE(lr.is_hidden, false) = true')
      }
      if (keyword) {
        conditions.push(`(
          COALESCE(lr.content, '') ILIKE $${idx}
          OR COALESCE(lawyer.display_name, '') ILIKE $${idx}
          OR COALESCE(reviewer.display_name, '') ILIKE $${idx}
        )`)
        params.push(`%${keyword}%`)
        idx += 1
      }
      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

      const countResult = await query<{ total: string }>(
        `SELECT COUNT(*)::text AS total
         FROM lawyer_reviews lr
         LEFT JOIN profiles lawyer ON lawyer.id = lr.lawyer_id
         LEFT JOIN profiles reviewer ON reviewer.id = lr.reviewer_id
         ${whereClause}`,
        params
      )
      const total = parseInt(countResult.rows[0]?.total || '0')

      const listParams = [...params, pageSizeNum, offset]
      const result = await query(
        `SELECT
           lr.id,
           lr.lawyer_id,
           COALESCE(lawyer.display_name, '未命名律师') AS lawyer_name,
           lr.reviewer_id,
           COALESCE(reviewer.display_name, '匿名用户') AS reviewer_name,
           lr.rating,
           lr.tags,
           lr.content,
           COALESCE(lr.is_hidden, false) AS is_hidden,
           lr.hidden_reason,
           lr.hidden_at,
           COALESCE(hider.display_name, '') AS hidden_by_name,
           lr.created_at,
           lr.updated_at
         FROM lawyer_reviews lr
         LEFT JOIN profiles lawyer ON lawyer.id = lr.lawyer_id
         LEFT JOIN profiles reviewer ON reviewer.id = lr.reviewer_id
         LEFT JOIN profiles hider ON hider.id = lr.hidden_by
         ${whereClause}
         ORDER BY lr.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        listParams
      )

      return success(reply, {
        items: result.rows,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
      })
    } catch (error) {
      request.log.error('Get lawyer reviews error:', error)
      return reply.status(500).send({ code: 500, message: '获取律师评价审核列表失败' })
    }
  })

  // ============================================
  // PATCH /api/admin/lawyer-reviews/:id/moderate - 律师评价审核处置
  // ============================================
  app.patch('/api/admin/lawyer-reviews/:id/moderate', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const actorId = String(request.user?.user_id || request.user?.id || '').trim()
    const { id } = request.params as { id: string }
    const { action, reason } = request.body as {
      action?: 'hide' | 'restore' | 'delete'
      reason?: string
    }
    const normalizedAction = String(action || '').trim()
    const normalizedReason = String(reason || '').trim()
    if (!['hide', 'restore', 'delete'].includes(normalizedAction)) {
      return reply.status(400).send({ code: 400, message: '无效 action 参数' })
    }
    if ((normalizedAction === 'hide' || normalizedAction === 'delete') && !normalizedReason) {
      return reply.status(400).send({ code: 400, message: '该操作需要填写处置理由' })
    }

    try {
      await ensureLawyerReviewsModeration()
      const beforeResult = await query(
        `SELECT
           id, lawyer_id, reviewer_id, rating, tags, content,
           is_hidden, hidden_reason, hidden_by, hidden_at, created_at, updated_at
         FROM lawyer_reviews
         WHERE id = $1`,
        [id]
      )
      if (!beforeResult.rows.length) {
        return reply.status(404).send({ code: 404, message: '评价记录不存在' })
      }
      const before = beforeResult.rows[0] as Record<string, unknown>
      let afterSnapshot: Record<string, unknown> = {}

      if (normalizedAction === 'hide') {
        const updated = await query(
          `UPDATE lawyer_reviews
           SET is_hidden = true,
               hidden_reason = $1,
               hidden_by = $2,
               hidden_at = NOW(),
               updated_at = NOW()
           WHERE id = $3
           RETURNING id, is_hidden, hidden_reason, hidden_by, hidden_at, updated_at`,
          [normalizedReason, actorId || null, id]
        )
        afterSnapshot = updated.rows[0] as Record<string, unknown>
      } else if (normalizedAction === 'restore') {
        const updated = await query(
          `UPDATE lawyer_reviews
           SET is_hidden = false,
               hidden_reason = NULL,
               hidden_by = NULL,
               hidden_at = NULL,
               updated_at = NOW()
           WHERE id = $1
           RETURNING id, is_hidden, hidden_reason, hidden_by, hidden_at, updated_at`,
          [id]
        )
        afterSnapshot = updated.rows[0] as Record<string, unknown>
      } else {
        await query('DELETE FROM lawyer_reviews WHERE id = $1', [id])
        afterSnapshot = {
          id,
          deleted: true,
          deleted_at: new Date().toISOString(),
        }
      }

      await logAdminAction({
        actorId,
        actionType:
          normalizedAction === 'hide'
            ? 'lawyer_review_hide'
            : normalizedAction === 'restore'
              ? 'lawyer_review_restore'
              : 'lawyer_review_delete',
        targetType: 'lawyer_review',
        targetId: id,
        beforeSnapshot: before,
        afterSnapshot,
        reason: normalizedReason || null,
      })

      return success(reply, afterSnapshot, '律师评价审核操作已完成')
    } catch (error) {
      request.log.error('Moderate lawyer review error:', error)
      return reply.status(500).send({ code: 500, message: '律师评价审核操作失败' })
    }
  })

  // ============================================
  // GET /api/admin/users - 获取用户列表
  // ============================================
  app.get('/api/admin/users', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const { page = '1', pageSize = '50' } = request.query as {
      page?: string
      pageSize?: string
    }

    const pageNum = parseInt(page) || 1
    const pageSizeNum = Math.min(parseInt(pageSize) || 50, 100)
    const offset = (pageNum - 1) * pageSizeNum
    const role = String(request.user?.role || '')
    const canViewContact = role === 'superadmin'

    try {
      await ensureProfileContactColumns()
      // 查询总数
      const countResult = await query(`SELECT COUNT(*) as total FROM profiles WHERE ${REAL_USER_EMAIL_FILTER}`)
      const total = parseInt(countResult.rows[0]?.total || '0')

      // 查询用户列表 - 直接从 profiles 表查询
      const result = await query(
        `SELECT
          id,
          display_name,
          email,
          phone,
          contact_address,
          role,
          status,
          created_at,
          avatar_url,
          bio,
          verified
        FROM profiles
        WHERE ${REAL_USER_EMAIL_FILTER}
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2`,
        [pageSizeNum, offset]
      )

      const items = canViewContact
        ? result.rows
        : result.rows.map((row) => ({
            ...row,
            email: null,
            phone: null,
            contact_address: null,
          }))

      return paginated(reply, items, total, pageNum, pageSizeNum)
    } catch (error) {
      request.log.error('Get admin users error:', error)
      return reply.status(500).send({ code: 500, message: '获取用户列表失败' })
    }
  })

  // ============================================
  // PUT /api/admin/users/:id - 更新用户状态
  // ============================================
  app.put('/api/admin/users/:id', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const { id } = request.params
    const { status } = request.body as { status?: string }

    if (!status) {
      return reply.status(400).send({ code: 400, message: '缺少 status 参数' })
    }

    try {
      // 检查用户是否存在
      const checkResult = await query('SELECT id FROM profiles WHERE id = $1', [id])
      if (checkResult.rows.length === 0) {
        return reply.status(404).send({ code: 404, message: '用户不存在' })
      }

      // 更新状态
      await query(
        'UPDATE profiles SET status = $1 WHERE id = $2',
        [status, id]
      )

      return success(reply, { message: '用户状态已更新' })
    } catch (error) {
      request.log.error('Update user status error:', error)
      return reply.status(500).send({ code: 500, message: '更新用户状态失败' })
    }
  })

  // ============================================
  // GET /api/admin/agents - 获取智能体列表
  // ============================================
  app.get('/api/admin/agents', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const {
      page = '1',
      pageSize = '50',
      status,
    } = request.query as {
      page?: string
      pageSize?: string
      status?: string
    }

    const pageNum = parseInt(page) || 1
    const pageSizeNum = Math.min(parseInt(pageSize) || 50, 100)
    const offset = (pageNum - 1) * pageSizeNum

    try {
      const conditions: string[] = [REAL_USER_EMAIL_FILTER]
      const params: unknown[] = []
      let paramIndex = 1

      if (status) {
        conditions.push(`a.status = $${paramIndex++}`)
        params.push(status)
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      // 查询总数
      const countResult = await query(
        `SELECT COUNT(*) as total FROM agents a ${whereClause}`,
        params
      )
      const total = parseInt(countResult.rows[0]?.total || '0')

      // 查询列表
      params.push(pageSizeNum, offset)
      const result = await query(
        `SELECT
          a.id,
          a.name,
          a.description,
          a.category,
          a.price,
          a.status,
          a.is_free_trial,
          a.pricing_model,
          a.created_at,
          p.id as creator_id,
          p.display_name as creator_name,
          p.verified as creator_verified
        FROM agents a
        LEFT JOIN profiles p ON p.id = a.creator_id
        ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params
      )

      // 格式化返回数据
      const items = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category,
        price: row.price,
        status: row.status,
        is_free_trial: row.is_free_trial,
        pricing_model: row.pricing_model,
        created_at: row.created_at,
        creator: row.creator_id ? {
          id: row.creator_id,
          display_name: row.creator_name,
          verified: row.creator_verified,
        } : undefined,
      }))

      return paginated(reply, items, total, pageNum, pageSizeNum)
    } catch (error) {
      request.log.error('Get admin agents error:', error)
      return reply.status(500).send({ code: 500, message: '获取智能体列表失败' })
    }
  })

  // ============================================
  // GET /api/admin/content/submissions - 内容审核列表（技能包/智能体）
  // ============================================
  app.get('/api/admin/content/submissions', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const {
      page = '1',
      pageSize = '20',
      status = 'pending_review',
      content_type = 'all',
    } = request.query as {
      page?: string
      pageSize?: string
      status?: string
      content_type?: 'all' | 'skill' | 'agent'
    }

    const pageNum = Math.max(parseInt(page) || 1, 1)
    const pageSizeNum = Math.min(Math.max(parseInt(pageSize) || 20, 1), 100)
    const offset = (pageNum - 1) * pageSizeNum

    try {
      const params: unknown[] = []
      let idx = 1
      const statusFilter = status && status !== 'all' ? status : null
      const contentType = String(content_type || 'all')

      const canIncludeSkills = contentType === 'all' || contentType === 'skill'
      const canIncludeAgents = contentType === 'all' || contentType === 'agent'

      const unionParts: string[] = []
      if (canIncludeSkills) {
        const statusSql = statusFilter ? `AND s.status = $${idx++}` : ''
        if (statusFilter) params.push(statusFilter)
        unionParts.push(
          `SELECT
             s.id::text as id,
             'skill'::text as content_type,
             COALESCE(s.title, '未命名内容')::text as title,
             COALESCE(s.summary, s.description, '')::text as summary,
             s.category::text as category,
             s.status::text as status,
             s.created_at as created_at,
             s.updated_at as updated_at,
             s.creator_id as creator_id,
             COALESCE(p.display_name, '未知创作者')::text as creator_name,
             jsonb_build_object(
               'title', s.title,
               'summary', s.summary,
               'description', s.description,
               'category', s.category,
               'tags', s.tags,
               'price_type', s.price_type,
               'price', s.price,
               'cover_image', s.cover_image,
               'files', COALESCE(s.files, '[]'::jsonb),
               'workbench', COALESCE(s.content->'workbench', '{}'::jsonb)
             ) as review_payload
           FROM skills s
           LEFT JOIN profiles p ON p.id = s.creator_id
           WHERE 1=1 ${statusSql}`
        )
      }
      if (canIncludeAgents) {
        const statusSql = statusFilter ? `AND a.status = $${idx++}` : ''
        if (statusFilter) params.push(statusFilter)
        unionParts.push(
          `SELECT
             a.id::text as id,
             'agent'::text as content_type,
             COALESCE(a.name, '未命名内容')::text as title,
             COALESCE(a.description, '')::text as summary,
             a.category::text as category,
             a.status::text as status,
             a.created_at as created_at,
             a.updated_at as updated_at,
             a.creator_id as creator_id,
             COALESCE(p.display_name, '未知创作者')::text as creator_name,
             jsonb_build_object(
               'name', a.name,
               'description', a.description,
               'category', a.category,
               'price', a.price,
               'avatar_url', a.avatar_url,
               'config', COALESCE(a.config, '{}'::jsonb)
             ) as review_payload
           FROM agents a
           LEFT JOIN profiles p ON p.id = a.creator_id
           WHERE 1=1 ${statusSql}`
        )
      }

      if (!unionParts.length) {
        return success(reply, { items: [], total: 0, page: pageNum, pageSize: pageSizeNum })
      }

      const baseSql = unionParts.join(' UNION ALL ')
      const countResult = await query<{ total: string }>(
        `SELECT COUNT(*)::text as total FROM (${baseSql}) as merged`,
        params
      )
      const total = parseInt(countResult.rows[0]?.total || '0')

      const listParams = [...params, pageSizeNum, offset]
      const listResult = await query(
        `SELECT *
         FROM (${baseSql}) as merged
         ORDER BY COALESCE(updated_at, created_at) DESC
         LIMIT $${idx++} OFFSET $${idx}`,
        listParams
      )

      return success(reply, {
        items: listResult.rows,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
      })
    } catch (error) {
      request.log.error('Get content submissions error:', error)
      return reply.status(500).send({ code: 500, message: '获取内容审核列表失败' })
    }
  })

  // ============================================
  // PATCH /api/admin/content/submissions/:contentType/:id - 内容审核动作
  // ============================================
  app.patch('/api/admin/content/submissions/:contentType/:id', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const userId = String(request.user?.user_id || request.user?.id || '').trim()
    const { contentType, id } = request.params as { contentType: 'skill' | 'agent'; id: string }
    const { action, reason } = request.body as {
      action?: 'approve' | 'reject' | 'take_down' | 'restore'
      reason?: string
    }

    if (!['skill', 'agent'].includes(String(contentType))) {
      return reply.status(400).send({ code: 400, message: '无效 contentType 参数' })
    }
    if (!action) {
      return reply.status(400).send({ code: 400, message: '缺少 action 参数' })
    }
    const normalizedReason = String(reason || '').trim()
    if (!normalizedReason) {
      return reply.status(400).send({ code: 400, message: '审核理由必填' })
    }

    const statusMap: Record<string, string> = {
      approve: 'active',
      reject: 'rejected',
      take_down: 'hidden',
      restore: 'active',
    }
    const nextStatus = statusMap[action]
    if (!nextStatus) {
      return reply.status(400).send({ code: 400, message: '无效 action 参数' })
    }

    try {
      if (contentType === 'skill') {
        const before = await query(
          `SELECT id, creator_id, status, title, category, updated_at
           FROM skills WHERE id = $1`,
          [id]
        )
        if (!before.rows.length) {
          return reply.status(404).send({ code: 404, message: '技能包不存在' })
        }
        const updated = await query(
          `UPDATE skills
           SET status = $1, updated_at = NOW()
           WHERE id = $2
           RETURNING id, creator_id, status, title, category, updated_at`,
          [nextStatus, id]
        )
        await logAdminAction({
          actorId: userId,
          actionType: `content_${action}`,
          targetType: 'skill_submission',
          targetId: id,
          beforeSnapshot: before.rows[0],
          afterSnapshot: updated.rows[0],
          reason: normalizedReason,
        })
        await safeNotifyReviewResult({
          userId: String(updated.rows[0]?.creator_id || ''),
          notificationType: 'content_review_result',
          title: '内容审核结果',
          content: `你提交的技能包「${String(updated.rows[0]?.title || '')}」审核结果：${nextStatus === 'active' ? '审核通过' : nextStatus === 'rejected' ? '审核未通过' : nextStatus === 'hidden' ? '已下架' : '已恢复展示'}。`,
          data: {
            content_type: 'skill',
            content_id: id,
            status: nextStatus,
            reason: normalizedReason,
          },
        })
        return success(reply, updated.rows[0], '内容审核完成')
      }

      const before = await query(
        `SELECT id, creator_id, status, name, category, updated_at
         FROM agents WHERE id = $1`,
        [id]
      )
      if (!before.rows.length) {
        return reply.status(404).send({ code: 404, message: '智能体不存在' })
      }
      const updated = await query(
        `UPDATE agents
         SET status = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, creator_id, status, name, category, updated_at`,
        [nextStatus, id]
      )
      await logAdminAction({
        actorId: userId,
        actionType: `content_${action}`,
        targetType: 'agent_submission',
        targetId: id,
        beforeSnapshot: before.rows[0],
        afterSnapshot: updated.rows[0],
        reason: normalizedReason,
      })
      await safeNotifyReviewResult({
        userId: String(updated.rows[0]?.creator_id || ''),
        notificationType: 'content_review_result',
        title: '内容审核结果',
        content: `你提交的智能体「${String(updated.rows[0]?.name || '')}」审核结果：${nextStatus === 'active' ? '审核通过' : nextStatus === 'rejected' ? '审核未通过' : nextStatus === 'hidden' ? '已下架' : '已恢复展示'}。`,
        data: {
          content_type: 'agent',
          content_id: id,
          status: nextStatus,
          reason: normalizedReason,
        },
      })
      return success(reply, updated.rows[0], '内容审核完成')
    } catch (error) {
      request.log.error('Review content submission error:', error)
      return reply.status(500).send({ code: 500, message: '内容审核失败' })
    }
  })

  // ============================================
  // PUT /api/admin/agents/:id - 更新智能体状态
  // ============================================
  app.put('/api/admin/agents/:id', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const { id } = request.params
    const { status } = request.body as { status?: string }

    if (!status) {
      return reply.status(400).send({ code: 400, message: '缺少 status 参数' })
    }

    try {
      // 检查智能体是否存在
      const checkResult = await query('SELECT id FROM agents WHERE id = $1', [id])
      if (checkResult.rows.length === 0) {
        return reply.status(404).send({ code: 404, message: '智能体不存在' })
      }

      // 更新状态
      await query(
        'UPDATE agents SET status = $1 WHERE id = $2',
        [status, id]
      )

      return success(reply, { message: '智能体状态已更新' })
    } catch (error) {
      request.log.error('Update agent status error:', error)
      return reply.status(500).send({ code: 500, message: '更新智能体状态失败' })
    }
  })

  // ============================================
  // GET /api/admin/opportunities - 获取岗位审核列表
  // ============================================
  app.get('/api/admin/opportunities', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const { page = '1', limit = '20', status } = request.query as {
      page?: string
      limit?: string
      status?: string
    }

    const pageNum = parseInt(page) || 1
    const pageSizeNum = Math.min(parseInt(limit) || 20, 100)
    const offset = (pageNum - 1) * pageSizeNum

    // 管理端 tab 兼容：active/pending/closed -> published/pending_review/paused
    const mapStatus = (raw?: string) => {
      if (!raw) return undefined
      if (raw === 'active') return 'published'
      if (raw === 'pending') return 'pending_review'
      if (raw === 'closed') return 'paused'
      return raw
    }

    try {
      const conditions: string[] = []
      const params: unknown[] = []
      let paramIndex = 1
      const dbStatus = mapStatus(status)
      if (dbStatus) {
        conditions.push(`o.status = $${paramIndex++}`)
        params.push(dbStatus)
      }
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      const countResult = await query<{ total: string }>(
        `SELECT COUNT(*)::text as total FROM opportunities o ${whereClause}`,
        params
      )
      const total = parseInt(countResult.rows[0]?.total || '0')

      params.push(pageSizeNum, offset)
      const result = await query(
        `SELECT
           o.id,
           o.title,
           o.opportunity_type as type,
           o.location,
           o.status,
           o.view_count,
           o.application_count,
           o.created_at,
           COALESCE(p.display_name, '匿名用户') as publisher_name
         FROM opportunities o
         LEFT JOIN profiles p ON p.id = o.publisher_id
         ${whereClause}
         ORDER BY o.updated_at DESC, o.created_at DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params
      )

      const items = result.rows.map((row) => ({
        ...row,
        status:
          row.status === 'published'
            ? 'active'
            : row.status === 'pending_review'
              ? 'pending'
              : row.status === 'paused'
                ? 'closed'
                : row.status,
      }))

      return paginated(reply, items, total, pageNum, pageSizeNum)
    } catch (error) {
      request.log.error('Get admin opportunities error:', error)
      return reply.status(500).send({ code: 500, message: '获取岗位审核列表失败' })
    }
  })

  // ============================================
  // PUT /api/admin/opportunities/:id - 岗位上下架处置
  // ============================================
  app.put('/api/admin/opportunities/:id', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const userId = String(request.user?.user_id || request.user?.id || '').trim()
    const { id } = request.params
    const { status, reason } = request.body as { status?: string; reason?: string }
    if (!status) {
      return reply.status(400).send({ code: 400, message: '缺少 status 参数' })
    }
    const normalizedReason = String(reason || '').trim()

    const mapped =
      status === 'active'
        ? 'published'
        : status === 'pending'
          ? 'pending_review'
          : status === 'closed'
            ? 'paused'
            : status

    if (!['published', 'pending_review', 'paused', 'rejected'].includes(mapped)) {
      return reply.status(400).send({ code: 400, message: '无效 status 参数' })
    }

    try {
      const check = await query<{ id: string; publisher_id: string; title: string; status: string }>(
        `SELECT id, publisher_id, title, status FROM opportunities WHERE id = $1`,
        [id]
      )
      if (check.rows.length === 0) {
        return reply.status(404).send({ code: 404, message: '岗位不存在' })
      }

      await query(`UPDATE opportunities SET status = $1, updated_at = NOW() WHERE id = $2`, [mapped, id])

      const row = check.rows[0]
      const statusLabel = mapped === 'published' ? '发布中' : mapped === 'paused' ? '已下架' : mapped === 'rejected' ? '已驳回' : '处理中'
      await query(
        `INSERT INTO notifications (user_id, notification_type, title, content, data)
         VALUES ($1, 'opportunity_moderation_result', $2, $3, $4::jsonb)`,
        [
          row.publisher_id,
          '岗位状态通知',
          `你发布的岗位「${row.title}」状态已更新为：${statusLabel}${normalizedReason ? `。原因：${normalizedReason}` : ''}`,
          JSON.stringify({ opportunity_id: id, status: mapped, reason: normalizedReason || null }),
        ]
      )
      await logAdminAction({
        actorId: userId,
        actionType: mapped === 'paused' ? 'opportunity_take_down' : mapped === 'published' ? 'opportunity_restore' : 'opportunity_update',
        targetType: 'opportunity',
        targetId: id,
        beforeSnapshot: row,
        afterSnapshot: { ...row, status: mapped },
        reason: normalizedReason || null,
      })

      return success(reply, { id, status: mapped }, mapped === 'paused' ? '岗位已下架并通知发布者' : '岗位状态已更新并通知发布者')
    } catch (error) {
      request.log.error('Update admin opportunity status error:', error)
      return reply.status(500).send({ code: 500, message: '更新岗位状态失败' })
    }
  })

  // ============================================
  // GET /api/admin/orders - 获取订单列表
  // ============================================
  app.get('/api/admin/orders', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const { page = '1', pageSize = '20' } = request.query as {
      page?: string
      pageSize?: string
    }

    const pageNum = parseInt(page) || 1
    const pageSizeNum = Math.min(parseInt(pageSize) || 20, 100)
    const offset = (pageNum - 1) * pageSizeNum

    try {
      // 查询总数
      const countResult = await query('SELECT COUNT(*) as total FROM orders')
      const total = parseInt(countResult.rows[0]?.total || '0')

      // 查询订单列表
      const result = await query(
        `SELECT
          o.id,
          o.order_no,
          o.amount,
          o.status,
          o.payment_method,
          o.created_at,
          p.display_name as user_name
        FROM orders o
        LEFT JOIN profiles p ON p.id = o.user_id
        ORDER BY o.created_at DESC
        LIMIT $1 OFFSET $2`,
        [pageSizeNum, offset]
      )

      // 格式化返回数据
      const items = result.rows.map(row => ({
        id: row.id,
        order_no: row.order_no,
        amount: row.amount,
        status: row.status === 'completed' ? 'completed' : row.status,
        payment_method: row.payment_method,
        created_at: row.created_at,
        user: { display_name: row.user_name },
      }))

      return paginated(reply, items, total, pageNum, pageSizeNum)
    } catch (error) {
      request.log.error('Get admin orders error:', error)
      return reply.status(500).send({ code: 500, message: '获取订单列表失败' })
    }
  })

  // ============================================
  // GET /api/admin/orders/stats - 获取订单统计
  // ============================================
  app.get('/api/admin/orders/stats', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    try {
      // 今日订单统计
      const todayResult = await query(`
        SELECT
          COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE AND status = 'completed') as today_orders,
          COALESCE(SUM(amount) FILTER (WHERE DATE(created_at) = CURRENT_DATE AND status = 'completed'), 0) as today_gmv,
          COUNT(*) FILTER (WHERE status = 'refunding') as pending_refunds
        FROM orders
      `)

      return success(reply, {
        today_orders: parseInt(todayResult.rows[0]?.today_orders || '0'),
        today_gmv: parseFloat(todayResult.rows[0]?.today_gmv || '0'),
        pending_refunds: parseInt(todayResult.rows[0]?.pending_refunds || '0'),
        pending_invoices: 0, // 待实现
      })
    } catch (error) {
      request.log.error('Get order stats error:', error)
      return reply.status(500).send({ code: 500, message: '获取订单统计失败' })
    }
  })

  // ============================================
  // GET /api/admin/inquiries - 获取咨询列表
  // ============================================
  app.get('/api/admin/inquiries', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const { page = '1', pageSize = '50' } = request.query as {
      page?: string
      pageSize?: string
    }

    const pageNum = parseInt(page) || 1
    const pageSizeNum = Math.min(parseInt(pageSize) || 50, 100)
    const offset = (pageNum - 1) * pageSizeNum

    try {
      // 检查 platform_inquiries 表是否存在
      const tableCheck = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'platform_inquiries'
        ) as exists
      `)

      if (!tableCheck.rows[0]?.exists) {
        return paginated(reply, [], 0, pageNum, pageSizeNum)
      }

      // 查询总数
      const countResult = await query('SELECT COUNT(*) as total FROM platform_inquiries')
      const total = parseInt(countResult.rows[0]?.total || '0')

      // 查询列表
      const result = await query(
        `SELECT
          pi.id,
          pi.type,
          pi.status,
          pi.note,
          pi.created_at,
          p.id as user_id,
          p.display_name as applicant_name
        FROM platform_inquiries pi
        LEFT JOIN profiles p ON p.id = pi.user_id
        ORDER BY pi.created_at DESC
        LIMIT $1 OFFSET $2`,
        [pageSizeNum, offset]
      )

      // 格式化返回数据
      const items = result.rows.map(row => ({
        id: row.id,
        type: row.type,
        status: row.status,
        note: row.note,
        created_at: row.created_at,
        user_id: row.user_id,
        applicant: { display_name: row.applicant_name },
      }))

      return paginated(reply, items, total, pageNum, pageSizeNum)
    } catch (error) {
      request.log.error('Get admin inquiries error:', error)
      return paginated(reply, [], 0, pageNum, pageSizeNum)
    }
  })

  // ============================================
  // PUT /api/admin/inquiries/:id - 更新咨询状态
  // ============================================
  app.put('/api/admin/inquiries/:id', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const { id } = request.params
    const { status } = request.body as { status?: string }

    if (!status) {
      return reply.status(400).send({ code: 400, message: '缺少 status 参数' })
    }

    try {
      await query(
        'UPDATE platform_inquiries SET status = $1 WHERE id = $2',
        [status, id]
      )

      return success(reply, { message: '咨询状态已更新' })
    } catch (error) {
      request.log.error('Update inquiry status error:', error)
      return reply.status(500).send({ code: 500, message: '更新咨询状态失败' })
    }
  })

  // ============================================
  // GET /api/admin/ip-applications - 知产保护申请审核列表
  // ============================================
  app.get('/api/admin/ip-applications', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const {
      page = '1',
      pageSize = '20',
      status = 'pending',
      source_type = 'all',
    } = request.query as {
      page?: string
      pageSize?: string
      status?: string
      source_type?: string
    }
    const pageNum = Math.max(parseInt(page) || 1, 1)
    const pageSizeNum = Math.min(Math.max(parseInt(pageSize) || 20, 1), 100)
    const offset = (pageNum - 1) * pageSizeNum

    try {
      await ensureIpApplicationsTable()
      const conditions: string[] = []
      const params: unknown[] = []
      let idx = 1
      if (status && status !== 'all') {
        conditions.push(`ia.status = $${idx++}`)
        params.push(status)
      }
      if (source_type && source_type !== 'all') {
        conditions.push(`ia.source_type = $${idx++}`)
        params.push(source_type)
      }
      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

      const countRes = await query<{ total: string }>(
        `SELECT COUNT(*)::text as total FROM ip_applications ia ${whereClause}`,
        params
      )
      const total = parseInt(countRes.rows[0]?.total || '0')

      const listParams = [...params, pageSizeNum, offset]
      const rows = await query(
        `SELECT
           ia.id,
           ia.creator_id,
           COALESCE(cp.display_name, '未知创作者') as creator_name,
           ia.source_type,
           ia.source_id,
           ia.status,
           ia.materials,
           ia.review_note,
           ia.reviewed_at,
           ia.created_at,
           COALESCE(rp.display_name, '') as reviewed_by_name
         FROM ip_applications ia
         LEFT JOIN profiles cp ON cp.id = ia.creator_id
         LEFT JOIN profiles rp ON rp.id = ia.reviewed_by
         ${whereClause}
         ORDER BY ia.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        listParams
      )

      return success(reply, {
        items: rows.rows,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
      })
    } catch (error) {
      request.log.error('Get admin ip applications error:', error)
      return reply.status(500).send({ code: 500, message: '获取知产申请审核列表失败' })
    }
  })

  // ============================================
  // PATCH /api/admin/ip-applications/:id/review - 知产保护申请审核
  // ============================================
  app.patch('/api/admin/ip-applications/:id/review', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const userId = String(request.user?.user_id || request.user?.id || '').trim()
    const { id } = request.params as { id: string }
    const { action, reason } = request.body as { action?: 'approve' | 'reject'; reason?: string }
    if (!action) {
      return reply.status(400).send({ code: 400, message: '缺少 action 参数' })
    }
    const normalizedReason = String(reason || '').trim()
    if (!normalizedReason) {
      return reply.status(400).send({ code: 400, message: '审核理由必填' })
    }
    try {
      await ensureIpApplicationsTable()
      const before = await query(
        `SELECT id, creator_id, source_type, source_id, status, review_note, reviewed_at
         FROM ip_applications
         WHERE id = $1`,
        [id]
      )
      if (!before.rows.length) {
        return reply.status(404).send({ code: 404, message: '知产申请不存在' })
      }
      if (before.rows[0].status !== 'pending') {
        return reply.status(400).send({ code: 400, message: '该申请已处理，无需重复审核' })
      }

      const nextStatus = action === 'approve' ? 'approved' : 'rejected'
      const updated = await query(
        `UPDATE ip_applications
         SET status = $1,
             review_note = $2,
             reviewed_by = $3,
             reviewed_at = NOW(),
             updated_at = NOW()
         WHERE id = $4
         RETURNING id, creator_id, source_type, source_id, status, review_note, reviewed_at`,
        [nextStatus, normalizedReason, userId || null, id]
      )

      await logAdminAction({
        actorId: userId,
        actionType: action === 'approve' ? 'ip_application_approve' : 'ip_application_reject',
        targetType: 'ip_application',
        targetId: id,
        beforeSnapshot: before.rows[0],
        afterSnapshot: updated.rows[0],
        reason: normalizedReason,
      })
      await safeNotifyReviewResult({
        userId: String(updated.rows[0]?.creator_id || ''),
        notificationType: 'ip_review_result',
        title: '知识产权保护申请结果',
        content: `你提交的知产保护申请已${nextStatus === 'approved' ? '通过' : '驳回'}。${normalizedReason ? ` 说明：${normalizedReason}` : ''}`,
        data: {
          application_id: id,
          status: nextStatus,
          source_type: updated.rows[0]?.source_type,
          source_id: updated.rows[0]?.source_id,
        },
      })

      return success(reply, updated.rows[0], '知产申请审核完成')
    } catch (error) {
      request.log.error('Review ip application error:', error)
      return reply.status(500).send({ code: 500, message: '知产申请审核失败' })
    }
  })

  // ============================================
  // GET /api/admin/reports - 用户举报审核列表
  // ============================================
  app.get('/api/admin/reports', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const {
      page = '1',
      pageSize = '20',
      status = 'pending',
      target_type = 'all',
    } = request.query as {
      page?: string
      pageSize?: string
      status?: string
      target_type?: string
    }
    const pageNum = Math.max(parseInt(page) || 1, 1)
    const pageSizeNum = Math.min(Math.max(parseInt(pageSize) || 20, 1), 100)
    const offset = (pageNum - 1) * pageSizeNum

    try {
      await ensureCommunityReportTable()
      const conditions: string[] = []
      const params: unknown[] = []
      let idx = 1
      if (status && status !== 'all') {
        conditions.push(`r.status = $${idx++}`)
        params.push(status)
      }
      if (target_type && target_type !== 'all') {
        conditions.push(`r.target_type = $${idx++}`)
        params.push(target_type)
      }
      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

      const countRes = await query<{ total: string }>(
        `SELECT COUNT(*)::text as total FROM community_reports r ${whereClause}`,
        params
      )
      const total = parseInt(countRes.rows[0]?.total || '0')

      const listParams = [...params, pageSizeNum, offset]
      const rows = await query(
        `SELECT
           r.id,
           r.reporter_id,
           COALESCE(reporter.display_name, '匿名用户') as reporter_name,
           r.target_type,
           r.target_id,
           r.reason,
           r.detail,
           r.status,
           r.disposition,
           r.review_note,
           r.reviewed_at,
           r.created_at,
           COALESCE(reviewer.display_name, '') as reviewed_by_name
         FROM community_reports r
         LEFT JOIN profiles reporter ON reporter.id = r.reporter_id
         LEFT JOIN profiles reviewer ON reviewer.id = r.reviewed_by
         ${whereClause}
         ORDER BY r.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        listParams
      )

      return success(reply, {
        items: rows.rows,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
      })
    } catch (error) {
      request.log.error('Get admin reports error:', error)
      return reply.status(500).send({ code: 500, message: '获取举报审核列表失败' })
    }
  })

  // ============================================
  // PATCH /api/admin/reports/:id/review - 举报审核处置
  // ============================================
  app.patch('/api/admin/reports/:id/review', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const userId = String(request.user?.user_id || request.user?.id || '').trim()
    const { id } = request.params as { id: string }
    const { action, reason, disposition } = request.body as {
      action?: 'approve' | 'reject'
      reason?: string
      disposition?: 'none' | 'take_down' | 'delete'
      penalty_duration?: SanctionDuration
      penalty_scope?: SanctionScope
    }
    if (!action) {
      return reply.status(400).send({ code: 400, message: '缺少 action 参数' })
    }
    const normalizedReason = String(reason || '').trim()
    if (!normalizedReason) {
      return reply.status(400).send({ code: 400, message: '审核理由必填' })
    }
    const normalizedDisposition = String(disposition || 'none').trim()
    if (!['none', 'take_down', 'delete'].includes(normalizedDisposition)) {
      return reply.status(400).send({ code: 400, message: '无效 disposition 参数' })
    }
    const normalizedPenaltyDuration = String(request.body?.penalty_duration || 'none') as SanctionDuration
    if (!['none', '48h', '7d', '6m', 'permanent'].includes(normalizedPenaltyDuration)) {
      return reply.status(400).send({ code: 400, message: '无效 penalty_duration 参数' })
    }
    const normalizedPenaltyScope = String(request.body?.penalty_scope || 'full') as SanctionScope
    if (!['full', 'trade_and_mute', 'ranking_only'].includes(normalizedPenaltyScope)) {
      return reply.status(400).send({ code: 400, message: '无效 penalty_scope 参数' })
    }

    try {
      await ensureCommunityReportTable()
      await ensureCommunityModerationColumns()
      await ensureUserSanctionColumns()
      const before = await query(
        `SELECT id, reporter_id, target_type, target_id, status, reason, disposition, review_note
         FROM community_reports
         WHERE id = $1`,
        [id]
      )
      if (!before.rows.length) {
        return reply.status(404).send({ code: 404, message: '举报记录不存在' })
      }
      const reportRow = before.rows[0]
      if (reportRow.status !== 'pending') {
        return reply.status(400).send({ code: 400, message: '该举报已处理，无需重复审核' })
      }

      // 审核通过时可直接联动社区帖处置
      if (action === 'approve' && reportRow.target_type === 'community_post' && normalizedDisposition !== 'none') {
        const postStatus = normalizedDisposition === 'delete' ? 'deleted' : 'hidden'
        await query(
          `UPDATE community_posts
           SET status = $1,
               reviewed_by = $2,
               reviewed_at = NOW(),
               review_reason = $3,
               deleted_at = CASE WHEN $1 = 'deleted' THEN NOW() ELSE deleted_at END,
               updated_at = NOW()
           WHERE id = $4`,
          [postStatus, userId || null, `[举报处置] ${normalizedReason}`, reportRow.target_id]
        )
      }

      let sanctionedUserId: string | null = null
      if (action === 'approve') {
        if (reportRow.target_type === 'community_post') {
          const target = await query<{ author_id: string }>(
            'SELECT author_id FROM community_posts WHERE id = $1 LIMIT 1',
            [reportRow.target_id]
          )
          sanctionedUserId = target.rows[0]?.author_id || null
        } else if (reportRow.target_type === 'community_comment') {
          const target = await query<{ author_id: string }>(
            'SELECT author_id FROM community_comments WHERE id = $1 LIMIT 1',
            [reportRow.target_id]
          )
          sanctionedUserId = target.rows[0]?.author_id || null
        } else if (reportRow.target_type === 'skill') {
          const target = await query<{ creator_id: string }>(
            'SELECT creator_id FROM skills WHERE id = $1 LIMIT 1',
            [reportRow.target_id]
          )
          sanctionedUserId = target.rows[0]?.creator_id || null
        } else if (reportRow.target_type === 'agent') {
          const target = await query<{ creator_id: string }>(
            'SELECT creator_id FROM agents WHERE id = $1 LIMIT 1',
            [reportRow.target_id]
          )
          sanctionedUserId = target.rows[0]?.creator_id || null
        } else if (reportRow.target_type === 'creator_profile') {
          sanctionedUserId = reportRow.target_id
        }
      }

      let sanctionSnapshot: Record<string, unknown> | null = null
      if (action === 'approve' && sanctionedUserId && normalizedPenaltyDuration !== 'none') {
        sanctionSnapshot = (await applyUserSanction({
          userId: sanctionedUserId,
          duration: normalizedPenaltyDuration,
          scope: normalizedPenaltyScope,
          note: `[举报处罚] ${normalizedReason}`,
        })) as Record<string, unknown> | null
      }

      const nextStatus = action === 'approve' ? 'resolved' : 'rejected'
      const updated = await query(
        `UPDATE community_reports
         SET status = $1,
             disposition = $2,
             review_note = $3,
             reviewed_by = $4,
             reviewed_at = NOW(),
             updated_at = NOW()
         WHERE id = $5
         RETURNING id, reporter_id, target_type, target_id, status, disposition, review_note, reviewed_at`,
        [nextStatus, normalizedDisposition, normalizedReason, userId || null, id]
      )

      const afterSnapshot = {
        ...(updated.rows[0] || {}),
        penalty_duration: normalizedPenaltyDuration,
        penalty_scope: normalizedPenaltyScope,
        sanctioned_user_id: sanctionedUserId,
        sanction_snapshot: sanctionSnapshot,
      }
      await logAdminAction({
        actorId: userId,
        actionType: action === 'approve' ? 'report_resolve' : 'report_reject',
        targetType: 'user_report',
        targetId: id,
        beforeSnapshot: before.rows[0],
        afterSnapshot,
        reason: normalizedReason,
      })
      await safeNotifyReviewResult({
        userId: String(updated.rows[0]?.reporter_id || ''),
        notificationType: 'report_review_result',
        title: '举报处理结果',
        content: `你提交的举报已${action === 'approve' ? '受理并处理' : '审核驳回'}。${normalizedReason ? ` 说明：${normalizedReason}` : ''}`,
        data: {
          report_id: id,
          status: nextStatus,
          disposition: normalizedDisposition,
          penalty_duration: normalizedPenaltyDuration,
          penalty_scope: normalizedPenaltyScope,
        },
      })
      if (action === 'approve' && sanctionedUserId) {
        await safeNotifyReviewResult({
          userId: sanctionedUserId,
          notificationType: 'sanction_applied',
          title: '账号处置通知',
          content: `你的账号因违规内容已被平台处置。处罚时长：${normalizedPenaltyDuration}；处罚范围：${normalizedPenaltyScope}。${normalizedReason ? ` 说明：${normalizedReason}` : ''}`,
          data: {
            report_id: id,
            target_type: reportRow.target_type,
            target_id: reportRow.target_id,
            penalty_duration: normalizedPenaltyDuration,
            penalty_scope: normalizedPenaltyScope,
          },
        })
      }

      return success(reply, afterSnapshot, '举报审核完成')
    } catch (error) {
      request.log.error('Review user report error:', error)
      return reply.status(500).send({ code: 500, message: '举报审核失败' })
    }
  })

  // ============================================
  // GET /api/admin/withdrawals - 提现审批列表
  // ============================================
  app.get('/api/admin/withdrawals', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const { page = '1', pageSize = '20', status = 'pending' } = request.query as {
      page?: string
      pageSize?: string
      status?: string
    }
    const pageNum = Math.max(parseInt(page) || 1, 1)
    const pageSizeNum = Math.min(Math.max(parseInt(pageSize) || 20, 1), 100)
    const offset = (pageNum - 1) * pageSizeNum

    try {
      await ensureWithdrawColumns()
      const conditions: string[] = []
      const params: unknown[] = []
      let idx = 1
      if (status && status !== 'all') {
        conditions.push(`wr.status = $${idx++}`)
        params.push(status)
      }
      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
      const count = await query<{ total: string }>(
        `SELECT COUNT(*)::text as total FROM withdraw_requests wr ${whereClause}`,
        params
      )
      const total = parseInt(count.rows[0]?.total || '0')

      const listParams = [...params, pageSizeNum, offset]
      const result = await query(
        `SELECT
           wr.id,
           wr.user_id,
           COALESCE(p.display_name, '未知用户') as user_name,
           wr.amount,
           wr.fee,
           wr.actual_amount,
           wr.account_type,
           wr.account,
           wr.account_name,
           wr.status,
           wr.review_reason,
           wr.created_at,
           wr.processed_at
         FROM withdraw_requests wr
         LEFT JOIN profiles p ON p.id = wr.user_id
         ${whereClause}
         ORDER BY wr.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        listParams
      )

      return success(reply, {
        items: result.rows,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
      })
    } catch (error) {
      request.log.error('Get admin withdrawals error:', error)
      return reply.status(500).send({ code: 500, message: '获取提现审批列表失败' })
    }
  })

  // ============================================
  // PATCH /api/admin/withdrawals/:id - 提现审批动作
  // ============================================
  app.patch('/api/admin/withdrawals/:id', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const userId = String(request.user?.user_id || request.user?.id || '').trim()
    const { id } = request.params as { id: string }
    const { action, reason } = request.body as {
      action?: 'approve' | 'reject'
      reason?: string
    }

    if (!action) {
      return reply.status(400).send({ code: 400, message: '缺少 action 参数' })
    }
    const normalizedReason = String(reason || '').trim()
    if (!normalizedReason) {
      return reply.status(400).send({ code: 400, message: '处置理由必填' })
    }

    try {
      await ensureWithdrawColumns()
      const policies = await getPoliciesMerged()
      const withdrawPolicy = policies.withdraw
      const requireSuperadminAbove = readNumber(withdrawPolicy.require_superadmin_above, 20000)
      const minAmount = readNumber(withdrawPolicy.min_amount, 10)
      const maxAmount = readNumber(withdrawPolicy.max_amount, 50000)
      const before = await query(
        `SELECT id, user_id, amount, status, review_reason, processed_at
         FROM withdraw_requests
         WHERE id = $1`,
        [id]
      )
      if (!before.rows.length) {
        return reply.status(404).send({ code: 404, message: '提现申请不存在' })
      }

      const requestAmount = Number(before.rows[0]?.amount || 0)
      if (action === 'approve') {
        if (requestAmount < minAmount || requestAmount > maxAmount) {
          return reply.status(400).send({ code: 400, message: '不符合当前提现策略阈值' })
        }
        const role = String(request.user?.role || '')
        if (requestAmount > requireSuperadminAbove && role !== 'superadmin') {
          return reply.status(403).send({ code: 403, message: '高额提现仅超管可审批' })
        }
      }

      const nextStatus = action === 'approve' ? 'approved' : 'rejected'
      const updated = await query(
        `UPDATE withdraw_requests
         SET status = $1,
             review_reason = $2,
             processed_by = $3,
             processed_at = NOW()
         WHERE id = $4
         RETURNING id, user_id, amount, status, review_reason, processed_at`,
        [nextStatus, normalizedReason, userId || null, id]
      )

      await logAdminAction({
        actorId: userId,
        actionType: action === 'approve' ? 'withdraw_approve' : 'withdraw_reject',
        targetType: 'withdraw_request',
        targetId: id,
        beforeSnapshot: before.rows[0],
        afterSnapshot: updated.rows[0],
        reason: normalizedReason,
      })
      await safeNotifyReviewResult({
        userId: String(updated.rows[0]?.user_id || ''),
        notificationType: 'withdraw_review_result',
        title: '提现审核结果',
        content: `你的提现申请已${nextStatus === 'approved' ? '通过' : '驳回'}。${normalizedReason ? ` 说明：${normalizedReason}` : ''}`,
        data: {
          withdraw_id: id,
          status: nextStatus,
          amount: updated.rows[0]?.amount,
        },
      })

      return success(reply, updated.rows[0], '提现审批完成')
    } catch (error) {
      request.log.error('Review withdrawal error:', error)
      return reply.status(500).send({ code: 500, message: '提现审批失败' })
    }
  })

  // ============================================
  // POST /api/admin/withdrawals/batch-review - 提现批量审批
  // ============================================
  app.post('/api/admin/withdrawals/batch-review', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const userId = String(request.user?.user_id || request.user?.id || '').trim()
    const role = String(request.user?.role || '')
    const { ids, action, reason } = request.body as {
      ids?: string[]
      action?: 'approve' | 'reject'
      reason?: string
    }
    const normalizedReason = String(reason || '').trim()
    if (!Array.isArray(ids) || ids.length === 0) {
      return reply.status(400).send({ code: 400, message: 'ids 不能为空' })
    }
    if (!action) {
      return reply.status(400).send({ code: 400, message: '缺少 action 参数' })
    }
    if (!normalizedReason) {
      return reply.status(400).send({ code: 400, message: '处置理由必填' })
    }

    try {
      await ensureWithdrawColumns()
      const policies = await getPoliciesMerged()
      const withdrawPolicy = policies.withdraw
      const requireSuperadminAbove = readNumber(withdrawPolicy.require_superadmin_above, 20000)
      const minAmount = readNumber(withdrawPolicy.min_amount, 10)
      const maxAmount = readNumber(withdrawPolicy.max_amount, 50000)

      let successCount = 0
      const failed: Array<{ id: string; reason: string }> = []
      const nextStatus = action === 'approve' ? 'approved' : 'rejected'

      for (const id of ids) {
        try {
          const before = await query(
            `SELECT id, user_id, amount, status, review_reason, processed_at
             FROM withdraw_requests
             WHERE id = $1`,
            [id]
          )
          if (!before.rows.length) {
            failed.push({ id, reason: '不存在' })
            continue
          }
          const requestAmount = Number(before.rows[0]?.amount || 0)
          if (action === 'approve') {
            if (requestAmount < minAmount || requestAmount > maxAmount) {
              failed.push({ id, reason: '不符合策略阈值' })
              continue
            }
            if (requestAmount > requireSuperadminAbove && role !== 'superadmin') {
              failed.push({ id, reason: '高额提现仅超管可审批' })
              continue
            }
          }

          const updated = await query(
            `UPDATE withdraw_requests
             SET status = $1, review_reason = $2, processed_by = $3, processed_at = NOW()
             WHERE id = $4
             RETURNING id, user_id, amount, status, review_reason, processed_at`,
            [nextStatus, normalizedReason, userId || null, id]
          )
          await logAdminAction({
            actorId: userId,
            actionType: action === 'approve' ? 'withdraw_approve' : 'withdraw_reject',
            targetType: 'withdraw_request',
            targetId: id,
            beforeSnapshot: before.rows[0],
            afterSnapshot: updated.rows[0],
            reason: `[batch] ${normalizedReason}`,
          })
          await safeNotifyReviewResult({
            userId: String(updated.rows[0]?.user_id || ''),
            notificationType: 'withdraw_review_result',
            title: '提现审核结果',
            content: `你的提现申请已${nextStatus === 'approved' ? '通过' : '驳回'}。${normalizedReason ? ` 说明：${normalizedReason}` : ''}`,
            data: {
              withdraw_id: id,
              status: nextStatus,
              amount: updated.rows[0]?.amount,
              batch: true,
            },
          })
          successCount += 1
        } catch (err) {
          failed.push({ id, reason: err instanceof Error ? err.message : '未知错误' })
        }
      }

      return success(reply, {
        total: ids.length,
        success: successCount,
        failed_count: failed.length,
        failed,
      }, '批量审批完成')
    } catch (error) {
      request.log.error('Batch review withdrawals error:', error)
      return reply.status(500).send({ code: 500, message: '批量审批失败' })
    }
  })

  // ============================================
  // GET /api/admin/settlements - 结算审批列表
  // ============================================
  app.get('/api/admin/settlements', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const { page = '1', pageSize = '20', status = 'pending' } = request.query as {
      page?: string
      pageSize?: string
      status?: string
    }
    const pageNum = Math.max(parseInt(page) || 1, 1)
    const pageSizeNum = Math.min(Math.max(parseInt(pageSize) || 20, 1), 100)
    const offset = (pageNum - 1) * pageSizeNum

    try {
      await ensureSettlementColumns()
      const conditions: string[] = []
      const params: unknown[] = []
      let idx = 1
      if (status && status !== 'all') {
        conditions.push(`COALESCE(e.settlement_status, 'pending') = $${idx++}`)
        params.push(status)
      }
      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
      const count = await query<{ total: string }>(
        `SELECT COUNT(*)::text as total FROM creator_earnings e ${whereClause}`,
        params
      )
      const total = parseInt(count.rows[0]?.total || '0')

      const listParams = [...params, pageSizeNum, offset]
      const result = await query(
        `SELECT
           e.id,
           e.creator_id,
           COALESCE(p.display_name, '未知创作者') as creator_name,
           e.source_type,
           e.source_id,
           e.order_id,
           e.gross_amount,
           e.platform_fee,
           e.net_amount,
           e.status,
           COALESCE(e.settlement_status, 'pending') as settlement_status,
           e.settlement_review_reason,
           e.created_at,
           e.settlement_reviewed_at
         FROM creator_earnings e
         LEFT JOIN profiles p ON p.id = e.creator_id
         ${whereClause}
         ORDER BY e.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        listParams
      )

      return success(reply, {
        items: result.rows,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
      })
    } catch (error) {
      request.log.error('Get admin settlements error:', error)
      return reply.status(500).send({ code: 500, message: '获取结算审批列表失败' })
    }
  })

  // ============================================
  // PATCH /api/admin/settlements/:id - 结算审批动作
  // ============================================
  app.patch('/api/admin/settlements/:id', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const userId = String(request.user?.user_id || request.user?.id || '').trim()
    const { id } = request.params as { id: string }
    const { action, reason } = request.body as {
      action?: 'approve' | 'reject'
      reason?: string
    }
    if (!action) {
      return reply.status(400).send({ code: 400, message: '缺少 action 参数' })
    }
    const normalizedReason = String(reason || '').trim()
    if (!normalizedReason) {
      return reply.status(400).send({ code: 400, message: '审批理由必填' })
    }

    try {
      await ensureSettlementColumns()
      const policies = await getPoliciesMerged()
      const settlementPolicy = policies.settlement
      const requireManualReviewAbove = readNumber(settlementPolicy.require_manual_review_above, 10000)
      const minSettleAmount = readNumber(settlementPolicy.min_settle_amount, 1)
      const before = await query(
        `SELECT id, creator_id, status, net_amount, settlement_status, settlement_review_reason, settlement_reviewed_at
         FROM creator_earnings
         WHERE id = $1`,
        [id]
      )
      if (!before.rows.length) {
        return reply.status(404).send({ code: 404, message: '结算记录不存在' })
      }
      const netAmount = Number(before.rows[0]?.net_amount || 0)
      if (action === 'approve') {
        if (netAmount < minSettleAmount) {
          return reply.status(400).send({ code: 400, message: '不符合当前结算策略阈值' })
        }
        const role = String(request.user?.role || '')
        if (netAmount > requireManualReviewAbove && role !== 'superadmin') {
          return reply.status(403).send({ code: 403, message: '高额结算仅超管可审批' })
        }
      }

      const approved = action === 'approve'
      const updated = await query(
        `UPDATE creator_earnings
         SET settlement_status = $1,
             settlement_review_reason = $2,
             settlement_reviewed_by = $3,
             settlement_reviewed_at = NOW(),
             status = CASE WHEN $4 THEN 'settled' ELSE status END,
             settled_at = CASE WHEN $4 THEN NOW() ELSE settled_at END
         WHERE id = $5
         RETURNING id, creator_id, status, settlement_status, settlement_review_reason, settlement_reviewed_at`,
        [approved ? 'approved' : 'rejected', normalizedReason, userId || null, approved, id]
      )

      await logAdminAction({
        actorId: userId,
        actionType: approved ? 'settlement_approve' : 'settlement_reject',
        targetType: 'creator_earning',
        targetId: id,
        beforeSnapshot: before.rows[0],
        afterSnapshot: updated.rows[0],
        reason: normalizedReason,
      })
      await safeNotifyReviewResult({
        userId: String(updated.rows[0]?.creator_id || ''),
        notificationType: 'settlement_review_result',
        title: '结算审核结果',
        content: `你的结算申请已${approved ? '通过' : '驳回'}。${normalizedReason ? ` 说明：${normalizedReason}` : ''}`,
        data: {
          settlement_id: id,
          settlement_status: approved ? 'approved' : 'rejected',
        },
      })

      return success(reply, updated.rows[0], '结算审批完成')
    } catch (error) {
      request.log.error('Review settlement error:', error)
      return reply.status(500).send({ code: 500, message: '结算审批失败' })
    }
  })

  // ============================================
  // POST /api/admin/settlements/batch-review - 结算批量审批
  // ============================================
  app.post('/api/admin/settlements/batch-review', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const userId = String(request.user?.user_id || request.user?.id || '').trim()
    const role = String(request.user?.role || '')
    const { ids, action, reason } = request.body as {
      ids?: string[]
      action?: 'approve' | 'reject'
      reason?: string
    }
    const normalizedReason = String(reason || '').trim()
    if (!Array.isArray(ids) || ids.length === 0) {
      return reply.status(400).send({ code: 400, message: 'ids 不能为空' })
    }
    if (!action) {
      return reply.status(400).send({ code: 400, message: '缺少 action 参数' })
    }
    if (!normalizedReason) {
      return reply.status(400).send({ code: 400, message: '审批理由必填' })
    }

    try {
      await ensureSettlementColumns()
      const policies = await getPoliciesMerged()
      const settlementPolicy = policies.settlement
      const requireManualReviewAbove = readNumber(settlementPolicy.require_manual_review_above, 10000)
      const minSettleAmount = readNumber(settlementPolicy.min_settle_amount, 1)

      let successCount = 0
      const failed: Array<{ id: string; reason: string }> = []
      const approved = action === 'approve'

      for (const id of ids) {
        try {
          const before = await query(
            `SELECT id, creator_id, status, net_amount, settlement_status, settlement_review_reason, settlement_reviewed_at
             FROM creator_earnings
             WHERE id = $1`,
            [id]
          )
          if (!before.rows.length) {
            failed.push({ id, reason: '不存在' })
            continue
          }

          const netAmount = Number(before.rows[0]?.net_amount || 0)
          if (approved) {
            if (netAmount < minSettleAmount) {
              failed.push({ id, reason: '不符合策略阈值' })
              continue
            }
            if (netAmount > requireManualReviewAbove && role !== 'superadmin') {
              failed.push({ id, reason: '高额结算仅超管可审批' })
              continue
            }
          }

          const updated = await query(
            `UPDATE creator_earnings
             SET settlement_status = $1,
                 settlement_review_reason = $2,
                 settlement_reviewed_by = $3,
                 settlement_reviewed_at = NOW(),
                 status = CASE WHEN $4 THEN 'settled' ELSE status END,
                 settled_at = CASE WHEN $4 THEN NOW() ELSE settled_at END
             WHERE id = $5
             RETURNING id, creator_id, status, settlement_status, settlement_review_reason, settlement_reviewed_at`,
            [approved ? 'approved' : 'rejected', normalizedReason, userId || null, approved, id]
          )

          await logAdminAction({
            actorId: userId,
            actionType: approved ? 'settlement_approve' : 'settlement_reject',
            targetType: 'creator_earning',
            targetId: id,
            beforeSnapshot: before.rows[0],
            afterSnapshot: updated.rows[0],
            reason: `[batch] ${normalizedReason}`,
          })
          await safeNotifyReviewResult({
            userId: String(updated.rows[0]?.creator_id || ''),
            notificationType: 'settlement_review_result',
            title: '结算审核结果',
            content: `你的结算申请已${approved ? '通过' : '驳回'}。${normalizedReason ? ` 说明：${normalizedReason}` : ''}`,
            data: {
              settlement_id: id,
              settlement_status: approved ? 'approved' : 'rejected',
              batch: true,
            },
          })
          successCount += 1
        } catch (err) {
          failed.push({ id, reason: err instanceof Error ? err.message : '未知错误' })
        }
      }

      return success(reply, {
        total: ids.length,
        success: successCount,
        failed_count: failed.length,
        failed,
      }, '批量审批完成')
    } catch (error) {
      request.log.error('Batch review settlements error:', error)
      return reply.status(500).send({ code: 500, message: '批量审批失败' })
    }
  })

  // ============================================
  // GET /api/admin/policies - 后台策略读取
  // ============================================
  app.get('/api/admin/policies', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    try {
      const merged = await getPoliciesMerged()
      return success(reply, merged)
    } catch (error) {
      request.log.error('Get admin policies error:', error)
      return reply.status(500).send({ code: 500, message: '获取策略失败' })
    }
  })

  // ============================================
  // PUT /api/admin/policies/:key - 后台策略更新（仅超管）
  // ============================================
  app.put('/api/admin/policies/:key', {
    preHandler: [app.authenticateSuperAdmin],
  }, async (request: any, reply) => {
    const userId = String(request.user?.user_id || request.user?.id || '').trim()
    const { key } = request.params as { key: string }
    const { config, reason } = request.body as {
      config?: Record<string, unknown>
      reason?: string
    }
    const normalizedReason = String(reason || '').trim()
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      return reply.status(400).send({ code: 400, message: 'config 必须是对象' })
    }
    if (!normalizedReason) {
      return reply.status(400).send({ code: 400, message: '变更理由必填' })
    }

    try {
      await ensureAdminPolicyTable()
      const before = await query<{ config_json: Record<string, unknown> }>(
        'SELECT config_json FROM admin_policies WHERE policy_key = $1',
        [key]
      )
      const upserted = await query(
        `INSERT INTO admin_policies (policy_key, config_json, updated_by, updated_at)
         VALUES ($1, $2::jsonb, $3, NOW())
         ON CONFLICT (policy_key)
         DO UPDATE SET config_json = EXCLUDED.config_json, updated_by = EXCLUDED.updated_by, updated_at = NOW()
         RETURNING policy_key, config_json, updated_by, updated_at`,
        [key, JSON.stringify(config), userId || null]
      )

      await logAdminAction({
        actorId: userId,
        actionType: 'policy_update',
        targetType: 'admin_policy',
        targetId: null,
        beforeSnapshot: {
          policy_key: key,
          config: before.rows[0]?.config_json || null,
        },
        afterSnapshot: {
          policy_key: key,
          config: upserted.rows[0]?.config_json || null,
        },
        reason: normalizedReason,
      })

      return success(reply, upserted.rows[0], '策略已更新')
    } catch (error) {
      request.log.error('Update admin policy error:', error)
      return reply.status(500).send({ code: 500, message: '更新策略失败' })
    }
  })

  // ============================================
  // GET /api/admin/policies/history - 策略变更历史
  // ============================================
  app.get('/api/admin/policies/history', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    const { key, limit = '20' } = request.query as { key?: string; limit?: string }
    const take = Math.min(Math.max(parseInt(limit) || 20, 1), 100)
    try {
      const params: unknown[] = ['admin_policy']
      let idx = 2
      let keyFilter = ''
      if (key) {
        keyFilter = `AND (a.after_snapshot->>'policy_key' = $${idx} OR a.before_snapshot->>'policy_key' = $${idx})`
        params.push(key)
        idx++
      }
      params.push(take)
      const result = await query(
        `SELECT
           a.id,
           a.action_type,
           a.reason,
           a.before_snapshot,
           a.after_snapshot,
           a.created_at,
           p.display_name as actor_name
         FROM admin_actions a
         LEFT JOIN profiles p ON p.id = a.actor_id
         WHERE a.target_type = $1
           AND a.action_type IN ('policy_update', 'policy_rollback')
           ${keyFilter}
         ORDER BY a.created_at DESC
         LIMIT $${idx}`,
        params
      )
      return success(reply, { items: result.rows })
    } catch (error) {
      request.log.error('Get policy history error:', error)
      return reply.status(500).send({ code: 500, message: '获取策略历史失败' })
    }
  })

  // ============================================
  // POST /api/admin/policies/:key/rollback - 策略回滚（仅超管）
  // ============================================
  app.post('/api/admin/policies/:key/rollback', {
    preHandler: [app.authenticateSuperAdmin],
  }, async (request: any, reply) => {
    const userId = String(request.user?.user_id || request.user?.id || '').trim()
    const { key } = request.params as { key: string }
    const { action_id, reason } = request.body as { action_id?: string; reason?: string }
    const normalizedReason = String(reason || '').trim()
    if (!action_id) {
      return reply.status(400).send({ code: 400, message: '缺少 action_id 参数' })
    }
    if (!normalizedReason) {
      return reply.status(400).send({ code: 400, message: '回滚理由必填' })
    }

    try {
      await ensureAdminPolicyTable()
      const history = await query<{
        id: string
        before_snapshot: Record<string, unknown> | null
        after_snapshot: Record<string, unknown> | null
      }>(
        `SELECT id, before_snapshot, after_snapshot
         FROM admin_actions
         WHERE id = $1
           AND target_type = 'admin_policy'
           AND action_type IN ('policy_update', 'policy_rollback')
         LIMIT 1`,
        [action_id]
      )
      if (!history.rows.length) {
        return reply.status(404).send({ code: 404, message: '历史记录不存在' })
      }

      const rollbackSnapshot = history.rows[0].before_snapshot
      const rollbackConfig =
        rollbackSnapshot &&
        typeof rollbackSnapshot === 'object' &&
        !Array.isArray(rollbackSnapshot) &&
        rollbackSnapshot.policy_key === key &&
        rollbackSnapshot.config &&
        typeof rollbackSnapshot.config === 'object' &&
        !Array.isArray(rollbackSnapshot.config)
          ? (rollbackSnapshot.config as Record<string, unknown>)
          : null
      if (!rollbackConfig) {
        return reply.status(400).send({ code: 400, message: '该历史记录不可回滚' })
      }

      const current = await query<{ config_json: Record<string, unknown> }>(
        'SELECT config_json FROM admin_policies WHERE policy_key = $1',
        [key]
      )
      const upserted = await query(
        `INSERT INTO admin_policies (policy_key, config_json, updated_by, updated_at)
         VALUES ($1, $2::jsonb, $3, NOW())
         ON CONFLICT (policy_key)
         DO UPDATE SET config_json = EXCLUDED.config_json, updated_by = EXCLUDED.updated_by, updated_at = NOW()
         RETURNING policy_key, config_json, updated_by, updated_at`,
        [key, JSON.stringify(rollbackConfig), userId || null]
      )

      await logAdminAction({
        actorId: userId,
        actionType: 'policy_rollback',
        targetType: 'admin_policy',
        targetId: null,
        beforeSnapshot: {
          policy_key: key,
          config: current.rows[0]?.config_json || null,
        },
        afterSnapshot: {
          policy_key: key,
          config: upserted.rows[0]?.config_json || null,
        },
        reason: normalizedReason,
      })

      return success(reply, upserted.rows[0], '策略已回滚')
    } catch (error) {
      request.log.error('Rollback policy error:', error)
      return reply.status(500).send({ code: 500, message: '策略回滚失败' })
    }
  })

  // ============================================
  // GET /api/admin/data-overview - 超管数据总览（含联系方式）
  // ============================================
  app.get('/api/admin/data-overview', {
    preHandler: [app.authenticateSuperAdmin],
  }, async (request: any, reply) => {
    const {
      page = '1',
      pageSize = '50',
      role = 'all',
      status = 'all',
      city = 'all',
      keyword = '',
      register_window = 'all',
    } = request.query as {
      page?: string
      pageSize?: string
      role?: string
      status?: string
      city?: string
      keyword?: string
      register_window?: string
    }

    const pageNum = parseInt(page) || 1
    const pageSizeNum = Math.min(parseInt(pageSize) || 50, 100)
    const offset = (pageNum - 1) * pageSizeNum

    try {
      await ensureProfileContactColumns()
      const conditions: string[] = []
      const params: unknown[] = []
      let paramIndex = 1

      if (role && role !== 'all') {
        conditions.push(`role = $${paramIndex++}`)
        params.push(role)
      }
      if (status && status !== 'all') {
        conditions.push(`status = $${paramIndex++}`)
        params.push(status)
      }
      if (city && city !== 'all') {
        conditions.push(`city = $${paramIndex++}`)
        params.push(city)
      }
      if (keyword && keyword.trim()) {
        conditions.push(`(
          COALESCE(display_name, '') ILIKE $${paramIndex}
          OR COALESCE(email, '') ILIKE $${paramIndex}
          OR COALESCE(phone, '') ILIKE $${paramIndex}
          OR COALESCE(nickname, '') ILIKE $${paramIndex}
          OR COALESCE(city, '') ILIKE $${paramIndex}
        )`)
        params.push(`%${keyword.trim()}%`)
        paramIndex += 1
      }
      const registerWindow = String(register_window || 'all')
      if (registerWindow === '7d') {
        conditions.push(`created_at >= NOW() - INTERVAL '7 days'`)
      } else if (registerWindow === '30d') {
        conditions.push(`created_at >= NOW() - INTERVAL '30 days'`)
      } else if (registerWindow === '90d') {
        conditions.push(`created_at >= NOW() - INTERVAL '90 days'`)
      } else if (registerWindow === '1y') {
        conditions.push(`created_at >= NOW() - INTERVAL '1 year'`)
      }
      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

      const [
        filteredCountResult,
        totalUsersResult,
        usersResult,
        roleStatsResult,
        statusStatsResult,
        verifiedStatsResult,
        genderStatsResult,
        ageStatsResult,
        cityStatsResult,
        incomeStatsResult,
        paymentStatsResult,
        postStatsResult,
        lawyerStatsResult,
        lawyerDomainResult,
        skillsStatsResult,
        skillsCategoryStatsResult,
        platformFinanceStatsResult,
        paymentDetailsResult,
        creatorPayoutDetailsResult,
        communityPostDetailsResult,
        communityActiveUserDetailsResult,
        communityActiveStatsResult,
        opportunitiesStatsResult,
        opportunitiesDetailsResult,
        skillsDetailsResult,
        followerLeaderboardResult,
      ] = await Promise.all([
        query<{ total: string }>(`SELECT COUNT(*) as total FROM profiles ${whereClause}`, params),
        query<{ total: string }>(`SELECT COUNT(*) as total FROM profiles WHERE ${REAL_USER_EMAIL_FILTER}`),
        query(
          `SELECT
             id,
             display_name,
             nickname,
             email,
             phone,
             contact_address,
             work_organization,
             city,
             gender,
             birth_year,
             role,
             status,
             verified,
             verification_status,
             created_at,
             avatar_url
           FROM profiles
           ${whereClause}
           ORDER BY created_at DESC
           LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
          [...params, pageSizeNum, offset]
        ),
        query<{ role: string; total: string }>(`SELECT role, COUNT(*) as total FROM profiles WHERE ${REAL_USER_EMAIL_FILTER} GROUP BY role`),
        query<{ status: string; total: string }>(`SELECT status, COUNT(*) as total FROM profiles WHERE ${REAL_USER_EMAIL_FILTER} GROUP BY status`),
        query<{ verified_total: string }>(`SELECT COUNT(*) as verified_total FROM profiles WHERE ${REAL_USER_EMAIL_FILTER} AND verified = true`),
        query<{ gender: string; total: string }>(`
          SELECT
            COALESCE(NULLIF(BTRIM(gender), ''), 'unknown') AS gender,
            COUNT(*)::text AS total
          FROM profiles
          WHERE ${REAL_USER_EMAIL_FILTER}
          GROUP BY COALESCE(NULLIF(BTRIM(gender), ''), 'unknown')
        `),
        query<{ age_bucket: string; total: string }>(`
          SELECT
            CASE
              WHEN birth_year IS NULL OR birth_year < 1900 OR birth_year > EXTRACT(YEAR FROM CURRENT_DATE)::int THEN 'unknown'
              WHEN EXTRACT(YEAR FROM CURRENT_DATE)::int - birth_year < 18 THEN '<18'
              WHEN EXTRACT(YEAR FROM CURRENT_DATE)::int - birth_year BETWEEN 18 AND 24 THEN '18-24'
              WHEN EXTRACT(YEAR FROM CURRENT_DATE)::int - birth_year BETWEEN 25 AND 34 THEN '25-34'
              WHEN EXTRACT(YEAR FROM CURRENT_DATE)::int - birth_year BETWEEN 35 AND 44 THEN '35-44'
              WHEN EXTRACT(YEAR FROM CURRENT_DATE)::int - birth_year BETWEEN 45 AND 54 THEN '45-54'
              ELSE '55+'
            END AS age_bucket,
            COUNT(*)::text AS total
          FROM profiles
          WHERE ${REAL_USER_EMAIL_FILTER}
          GROUP BY
            CASE
              WHEN birth_year IS NULL OR birth_year < 1900 OR birth_year > EXTRACT(YEAR FROM CURRENT_DATE)::int THEN 'unknown'
              WHEN EXTRACT(YEAR FROM CURRENT_DATE)::int - birth_year < 18 THEN '<18'
              WHEN EXTRACT(YEAR FROM CURRENT_DATE)::int - birth_year BETWEEN 18 AND 24 THEN '18-24'
              WHEN EXTRACT(YEAR FROM CURRENT_DATE)::int - birth_year BETWEEN 25 AND 34 THEN '25-34'
              WHEN EXTRACT(YEAR FROM CURRENT_DATE)::int - birth_year BETWEEN 35 AND 44 THEN '35-44'
              WHEN EXTRACT(YEAR FROM CURRENT_DATE)::int - birth_year BETWEEN 45 AND 54 THEN '45-54'
              ELSE '55+'
            END
        `),
        query<{ city: string; total: string }>(`
          SELECT city, COUNT(*)::text AS total
          FROM profiles
          WHERE ${REAL_USER_EMAIL_FILTER}
            AND city IS NOT NULL AND BTRIM(city) <> ''
          GROUP BY city
          ORDER BY COUNT(*) DESC, city ASC
          LIMIT 200
        `),
        query<{ total_income: string; settled_count: string }>(`
          SELECT
            COALESCE(SUM(COALESCE(net_amount, 0)), 0)::text AS total_income,
            COUNT(*) FILTER (WHERE COALESCE(settlement_status, 'pending') = 'approved' OR status = 'settled')::text AS settled_count
          FROM creator_earnings
        `),
        query<{ paid_amount: string; paid_count: string }>(`
          SELECT
            COALESCE(SUM(COALESCE(amount, 0)), 0)::text AS paid_amount,
            COUNT(*) FILTER (WHERE status IN ('paid', 'completed'))::text AS paid_count
          FROM orders
        `),
        query<{ total_posts: string; published_posts: string }>(`
          SELECT
            COUNT(*)::text AS total_posts,
            COUNT(*) FILTER (WHERE COALESCE(status, 'published') = 'published')::text AS published_posts
          FROM community_posts
        `),
        query<{ total_lawyers: string }>(`
          SELECT COUNT(*)::text AS total_lawyers
          FROM profiles
          WHERE ${REAL_USER_EMAIL_FILTER}
            AND role IN ('creator', 'admin', 'superadmin')
            AND (COALESCE(lawyer_verified, false) = true OR COALESCE(creator_level, '') = 'lawyer')
        `),
        query<{ domain: string; total: string }>(`
          SELECT
            unnest(specialty) AS domain,
            COUNT(*)::text AS total
          FROM profiles
          WHERE ${REAL_USER_EMAIL_FILTER}
            AND role IN ('creator', 'admin', 'superadmin')
            AND (COALESCE(lawyer_verified, false) = true OR COALESCE(creator_level, '') = 'lawyer')
            AND specialty IS NOT NULL
            AND array_length(specialty, 1) > 0
          GROUP BY unnest(specialty)
          ORDER BY COUNT(*) DESC
          LIMIT 20
        `),
        query<{ total_skills_online: string }>(`
          SELECT COUNT(*)::text AS total_skills_online
          FROM skills
          WHERE status IN ('active', 'published')
        `),
        query<{ category: string; total: string }>(`
          SELECT
            COALESCE(NULLIF(BTRIM(category), ''), '未分类') AS category,
            COUNT(*)::text AS total
          FROM skills
          WHERE status IN ('active', 'published')
          GROUP BY COALESCE(NULLIF(BTRIM(category), ''), '未分类')
          ORDER BY COUNT(*) DESC
          LIMIT 20
        `),
        query<{ platform_income: string; platform_expense: string; creator_payout: string; promotion_income: string }>(`
          SELECT
            (SELECT COALESCE(SUM(COALESCE(amount, 0)), 0) FROM orders WHERE status IN ('paid', 'completed'))::text AS platform_income,
            (SELECT COALESCE(SUM(COALESCE(net_amount, 0)), 0) FROM creator_earnings WHERE COALESCE(settlement_status, 'pending') = 'approved' OR status = 'settled')::text AS platform_expense,
            (SELECT COALESCE(SUM(COALESCE(net_amount, 0)), 0) FROM creator_earnings WHERE COALESCE(settlement_status, 'pending') = 'approved' OR status = 'settled')::text AS creator_payout,
            (SELECT COALESCE(SUM(COALESCE(o.amount, 0)), 0)
             FROM orders o
             LEFT JOIN products p ON p.id = o.product_id
             WHERE o.status IN ('paid', 'completed')
               AND (
                 COALESCE(o.biz_type, '') = 'promotion'
                 OR COALESCE(o.order_type, '') ILIKE '%promo%'
                 OR COALESCE(o.order_type, '') ILIKE '%promotion%'
                 OR COALESCE(p.name, '') ILIKE '%推广%'
               )
            )::text AS promotion_income
        `),
        query<{
          id: string
          user_id: string
          payer_name: string | null
          payer_email: string | null
          payer_phone: string | null
          payment_account: string | null
          amount: string
          paid_at: string | null
          created_at: string
          payment_method: string | null
          payment_remark: string | null
          order_type: string | null
          product_name: string | null
        }>(`
          SELECT
            o.id,
            o.user_id,
            p.display_name AS payer_name,
            p.email AS payer_email,
            p.phone AS payer_phone,
            o.payment_account,
            o.amount::text AS amount,
            o.paid_at::text AS paid_at,
            o.created_at::text AS created_at,
            o.payment_method,
            o.payment_remark,
            o.order_type,
            pr.name AS product_name
          FROM orders o
          LEFT JOIN profiles p ON p.id = o.user_id
          LEFT JOIN products pr ON pr.id = o.product_id
          WHERE o.status IN ('paid', 'completed')
          ORDER BY COALESCE(o.paid_at, o.created_at) DESC
          LIMIT 120
        `),
        query<{
          id: string
          creator_id: string
          creator_name: string | null
          net_amount: string
          settlement_status: string | null
          status: string | null
          settlement_review_reason: string | null
          settlement_reviewed_at: string | null
          created_at: string
        }>(`
          SELECT
            e.id,
            e.creator_id,
            p.display_name AS creator_name,
            e.net_amount::text AS net_amount,
            e.settlement_status,
            e.status,
            e.settlement_review_reason,
            e.settlement_reviewed_at::text AS settlement_reviewed_at,
            e.created_at::text AS created_at
          FROM creator_earnings e
          LEFT JOIN profiles p ON p.id = e.creator_id
          WHERE COALESCE(e.settlement_status, 'pending') = 'approved' OR e.status = 'settled'
          ORDER BY COALESCE(e.settlement_reviewed_at, e.created_at) DESC
          LIMIT 120
        `),
        query<{
          post_id: string
          title: string | null
          status: string | null
          author_id: string | null
          author_name: string | null
          like_count: string | null
          comment_count: string | null
          view_count: string | null
          created_at: string
        }>(`
          SELECT
            cp.id::text AS post_id,
            cp.title,
            cp.status,
            cp.author_id::text AS author_id,
            p.display_name AS author_name,
            cp.like_count::text AS like_count,
            cp.comment_count::text AS comment_count,
            cp.view_count::text AS view_count,
            cp.created_at::text AS created_at
          FROM community_posts cp
          LEFT JOIN profiles p ON p.id = cp.author_id
          ORDER BY cp.created_at DESC
          LIMIT 120
        `),
        query<{
          user_id: string
          user_name: string | null
          posts_30d: string
          comments_30d: string
          posts_7d: string
          comments_7d: string
          last_active_at: string | null
        }>(`
          WITH post_events AS (
            SELECT author_id AS user_id, created_at, 'post'::text AS source
            FROM community_posts
          ),
          comment_events AS (
            SELECT author_id AS user_id, created_at, 'comment'::text AS source
            FROM community_comments
          ),
          all_events AS (
            SELECT * FROM post_events
            UNION ALL
            SELECT * FROM comment_events
          )
          SELECT
            ae.user_id::text AS user_id,
            p.display_name AS user_name,
            COUNT(*) FILTER (WHERE ae.source = 'post' AND ae.created_at >= NOW() - INTERVAL '30 days')::text AS posts_30d,
            COUNT(*) FILTER (WHERE ae.source = 'comment' AND ae.created_at >= NOW() - INTERVAL '30 days')::text AS comments_30d,
            COUNT(*) FILTER (WHERE ae.source = 'post' AND ae.created_at >= NOW() - INTERVAL '7 days')::text AS posts_7d,
            COUNT(*) FILTER (WHERE ae.source = 'comment' AND ae.created_at >= NOW() - INTERVAL '7 days')::text AS comments_7d,
            MAX(ae.created_at)::text AS last_active_at
          FROM all_events ae
          LEFT JOIN profiles p ON p.id = ae.user_id
          GROUP BY ae.user_id, p.display_name
          HAVING COUNT(*) FILTER (WHERE ae.created_at >= NOW() - INTERVAL '30 days') > 0
          ORDER BY MAX(ae.created_at) DESC
          LIMIT 120
        `),
        query<{ active_users_7d: string; active_users_30d: string }>(`
          WITH active_users AS (
            SELECT author_id AS uid, created_at FROM community_posts
            UNION ALL
            SELECT author_id AS uid, created_at FROM community_comments
          )
          SELECT
            COUNT(DISTINCT uid) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::text AS active_users_7d,
            COUNT(DISTINCT uid) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::text AS active_users_30d
          FROM active_users
        `),
        query<{ total_opportunities: string; published_opportunities: string; total_applications: string }>(`
          SELECT
            COUNT(*)::text AS total_opportunities,
            COUNT(*) FILTER (WHERE status = 'published')::text AS published_opportunities,
            COALESCE(SUM(COALESCE(application_count, 0)), 0)::text AS total_applications
          FROM opportunities
        `),
        query<{
          id: string
          title: string
          type: string | null
          status: string | null
          publisher_id: string | null
          publisher_name: string | null
          location: string | null
          application_count: string | null
          view_count: string | null
          created_at: string
        }>(`
          SELECT
            o.id::text AS id,
            o.title,
            o.opportunity_type AS type,
            o.status,
            o.publisher_id::text AS publisher_id,
            p.display_name AS publisher_name,
            o.location,
            o.application_count::text AS application_count,
            o.view_count::text AS view_count,
            o.created_at::text AS created_at
          FROM opportunities o
          LEFT JOIN profiles p ON p.id = o.publisher_id
          ORDER BY o.created_at DESC
          LIMIT 120
        `),
        query<{
          id: string
          title: string
          category: string | null
          status: string | null
          creator_id: string | null
          creator_name: string | null
          purchase_count: string | null
          view_count: string | null
          favorite_count: string | null
          created_at: string
        }>(`
          SELECT
            s.id::text AS id,
            s.title,
            s.category,
            s.status,
            s.creator_id::text AS creator_id,
            p.display_name AS creator_name,
            s.purchase_count::text AS purchase_count,
            s.view_count::text AS view_count,
            s.favorite_count::text AS favorite_count,
            s.created_at::text AS created_at
          FROM skills s
          LEFT JOIN profiles p ON p.id = s.creator_id
          WHERE s.status IN ('active', 'published')
          ORDER BY s.created_at DESC
          LIMIT 120
        `),
        query<{
          user_id: string
          display_name: string | null
          role: string | null
          creator_level: string | null
          lawyer_verified: boolean | null
          follower_count: string | null
        }>(`
          SELECT
            p.id::text AS user_id,
            p.display_name,
            p.role,
            p.creator_level,
            p.lawyer_verified,
            p.follower_count::text AS follower_count
          FROM profiles p
          WHERE ${REAL_USER_EMAIL_FILTER}
            AND p.role IN ('creator', 'admin', 'superadmin')
            AND COALESCE(p.follower_count, 0) > 0
          ORDER BY COALESCE(p.follower_count, 0) DESC, p.created_at DESC
          LIMIT 50
        `),
      ])

      const filteredTotal = parseInt(filteredCountResult.rows[0]?.total || '0')
      const totalUsers = parseInt(totalUsersResult.rows[0]?.total || '0')
      const byRole = roleStatsResult.rows.reduce<Record<string, number>>((acc, item) => {
        acc[item.role || 'unknown'] = parseInt(item.total || '0')
        return acc
      }, {})
      const byStatus = statusStatsResult.rows.reduce<Record<string, number>>((acc, item) => {
        acc[item.status || 'unknown'] = parseInt(item.total || '0')
        return acc
      }, {})
      const verifiedTotal = parseInt(verifiedStatsResult.rows[0]?.verified_total || '0')
      const byGender = genderStatsResult.rows.reduce<Record<string, number>>((acc, item) => {
        acc[item.gender || 'unknown'] = parseInt(item.total || '0')
        return acc
      }, {})
      const byAgeBucket = ageStatsResult.rows.reduce<Record<string, number>>((acc, item) => {
        acc[item.age_bucket || 'unknown'] = parseInt(item.total || '0')
        return acc
      }, {})
      const byCity = cityStatsResult.rows
        .map((item) => ({
          city: String(item.city || '').trim(),
          count: parseInt(item.total || '0'),
        }))
        .filter((item) => item.city && item.count > 0)
      const lawyerByDomain = lawyerDomainResult.rows
        .map((item) => ({
          domain: String(item.domain || '').trim(),
          count: parseInt(item.total || '0'),
        }))
        .filter((item) => item.domain && item.count > 0)
      const skillsByCategory = skillsCategoryStatsResult.rows
        .map((item) => ({
          category: String(item.category || '').trim() || '未分类',
          count: parseInt(item.total || '0'),
        }))
        .filter((item) => item.count > 0)
      const paymentDetails = paymentDetailsResult.rows.map((row) => {
        const accountInfo = String(row.payment_account || '').trim()
          || String(row.payer_phone || '').trim()
          || String(row.payer_email || '').trim()
          || '—'
        const remarkParts = [
          row.payment_remark,
          row.order_type ? `类型:${row.order_type}` : '',
          row.product_name ? `产品:${row.product_name}` : '',
          row.payment_method ? `方式:${row.payment_method}` : '',
        ].filter((item) => String(item || '').trim())
        return {
          order_id: row.id,
          user_id: row.user_id,
          payer_name: String(row.payer_name || '').trim() || '未命名用户',
          payment_account: accountInfo,
          amount_cny: parseFloat(row.amount || '0'),
          paid_at: row.paid_at || row.created_at,
          remark: remarkParts.join(' ｜ ') || '—',
        }
      })
      const creatorPayoutDetails = creatorPayoutDetailsResult.rows.map((row) => ({
        earning_id: row.id,
        creator_id: row.creator_id,
        creator_name: String(row.creator_name || '').trim() || '未命名创作者',
        amount_cny: parseFloat(row.net_amount || '0'),
        paid_at: row.settlement_reviewed_at || row.created_at,
        remark: [
          row.settlement_review_reason,
          row.settlement_status ? `结算:${row.settlement_status}` : '',
          row.status ? `状态:${row.status}` : '',
        ].filter((item) => String(item || '').trim()).join(' ｜ ') || '—',
      }))
      const communityPostDetails = communityPostDetailsResult.rows.map((row) => ({
        post_id: row.post_id,
        title: String(row.title || '').trim() || '未命名帖子',
        status: String(row.status || '').trim() || 'published',
        author_id: String(row.author_id || '').trim() || '',
        author_name: String(row.author_name || '').trim() || '未命名用户',
        like_count: parseInt(row.like_count || '0'),
        comment_count: parseInt(row.comment_count || '0'),
        view_count: parseInt(row.view_count || '0'),
        created_at: row.created_at,
      }))
      const communityActiveUserDetails = communityActiveUserDetailsResult.rows.map((row) => ({
        user_id: row.user_id,
        user_name: String(row.user_name || '').trim() || '未命名用户',
        posts_7d: parseInt(row.posts_7d || '0'),
        comments_7d: parseInt(row.comments_7d || '0'),
        posts_30d: parseInt(row.posts_30d || '0'),
        comments_30d: parseInt(row.comments_30d || '0'),
        last_active_at: row.last_active_at || '',
      }))
      const opportunitiesDetails = opportunitiesDetailsResult.rows.map((row) => ({
        id: row.id,
        title: String(row.title || '').trim() || '未命名岗位',
        type: String(row.type || '').trim() || 'job',
        status: String(row.status || '').trim() || 'published',
        publisher_id: String(row.publisher_id || '').trim(),
        publisher_name: String(row.publisher_name || '').trim() || '未命名用户',
        location: String(row.location || '').trim() || '未填写',
        application_count: parseInt(row.application_count || '0'),
        view_count: parseInt(row.view_count || '0'),
        created_at: row.created_at,
      }))
      const skillsDetails = skillsDetailsResult.rows.map((row) => ({
        id: row.id,
        title: String(row.title || '').trim() || '未命名技能',
        category: String(row.category || '').trim() || '未分类',
        status: String(row.status || '').trim() || 'active',
        creator_id: String(row.creator_id || '').trim(),
        creator_name: String(row.creator_name || '').trim() || '未命名创作者',
        purchase_count: parseInt(row.purchase_count || '0'),
        view_count: parseInt(row.view_count || '0'),
        favorite_count: parseInt(row.favorite_count || '0'),
        created_at: row.created_at,
      }))
      const followerLeaderboard = followerLeaderboardResult.rows.map((row) => ({
        user_id: row.user_id,
        display_name: String(row.display_name || '').trim() || '未命名创作者',
        role: String(row.role || '').trim() || 'creator',
        creator_level: String(row.creator_level || '').trim() || 'basic',
        lawyer_verified: Boolean(row.lawyer_verified),
        follower_count: parseInt(row.follower_count || '0'),
      }))

      return success(reply, {
        summary: {
          total_users: totalUsers,
          verified_users: verifiedTotal,
          unverified_users: Math.max(0, totalUsers - verifiedTotal),
          by_role: byRole,
          by_status: byStatus,
          analytics: {
            by_gender: byGender,
            by_age_bucket: byAgeBucket,
            by_city: byCity,
            business: {
              income_total_cny: parseFloat(incomeStatsResult.rows[0]?.total_income || '0'),
              settlements_approved_count: parseInt(incomeStatsResult.rows[0]?.settled_count || '0'),
              payment_total_cny: parseFloat(paymentStatsResult.rows[0]?.paid_amount || '0'),
              payment_count: parseInt(paymentStatsResult.rows[0]?.paid_count || '0'),
              platform_income_cny: parseFloat(platformFinanceStatsResult.rows[0]?.platform_income || '0'),
              platform_expense_cny: parseFloat(platformFinanceStatsResult.rows[0]?.platform_expense || '0'),
              creator_payout_cny: parseFloat(platformFinanceStatsResult.rows[0]?.creator_payout || '0'),
              promotion_income_cny: parseFloat(platformFinanceStatsResult.rows[0]?.promotion_income || '0'),
              payment_details: paymentDetails,
              creator_payout_details: creatorPayoutDetails,
              posts_total: parseInt(postStatsResult.rows[0]?.total_posts || '0'),
              posts_published: parseInt(postStatsResult.rows[0]?.published_posts || '0'),
              practicing_lawyers_total: parseInt(lawyerStatsResult.rows[0]?.total_lawyers || '0'),
              practicing_lawyers_by_domain: lawyerByDomain,
              online_skills_total: parseInt(skillsStatsResult.rows[0]?.total_skills_online || '0'),
              online_skills_by_category: skillsByCategory,
              community_active_users_7d: parseInt(communityActiveStatsResult.rows[0]?.active_users_7d || '0'),
              community_active_users_30d: parseInt(communityActiveStatsResult.rows[0]?.active_users_30d || '0'),
              community_post_details: communityPostDetails,
              community_active_user_details: communityActiveUserDetails,
              opportunities_total: parseInt(opportunitiesStatsResult.rows[0]?.total_opportunities || '0'),
              opportunities_published: parseInt(opportunitiesStatsResult.rows[0]?.published_opportunities || '0'),
              opportunities_applications_total: parseInt(opportunitiesStatsResult.rows[0]?.total_applications || '0'),
              opportunities_details: opportunitiesDetails,
              skills_details: skillsDetails,
              follower_leaderboard: followerLeaderboard,
              refreshed_at: new Date().toISOString(),
              refresh_cycle: 'daily',
            },
          },
          data_source: 'profiles_real_data',
        },
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total: filteredTotal,
          totalPages: Math.ceil(filteredTotal / pageSizeNum),
        },
        items: usersResult.rows,
      })
    } catch (error) {
      request.log.error('Get admin data overview error:', error)
      return reply.status(500).send({ code: 500, message: '获取数据总览失败' })
    }
  })

  // ============================================
  // GET /api/admin/data-overview/details - 明细分页查询
  // ============================================
  app.get('/api/admin/data-overview/details', {
    preHandler: [app.authenticateSuperAdmin],
  }, async (request: any, reply) => {
    const {
      module = 'payment',
      metric = 'payment_total',
      page = '1',
      pageSize = '50',
      time_window = 'all',
    } = request.query as {
      module?: string
      metric?: string
      page?: string
      pageSize?: string
      time_window?: string
    }

    const pageNum = Math.max(1, parseInt(page) || 1)
    const pageSizeNum = Math.min(Math.max(parseInt(pageSize) || 50, 1), 200)
    const offset = (pageNum - 1) * pageSizeNum
    const normalizedWindow = ['all', '7d', '30d', '90d'].includes(String(time_window || 'all'))
      ? String(time_window || 'all')
      : 'all'
    const cacheKey = `${module}|${metric}|${normalizedWindow}|${pageNum}|${pageSizeNum}`
    const cached = detailQueryCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return success(reply, cached.payload as Record<string, unknown>)
    }
    const respond = (payload: Record<string, unknown>) => {
      detailQueryCache.set(cacheKey, {
        expiresAt: Date.now() + 45_000,
        payload,
      })
      return success(reply, payload)
    }
    const recentTimeFilter =
      normalizedWindow === '7d'
        ? `NOW() - INTERVAL '7 days'`
        : normalizedWindow === '30d'
          ? `NOW() - INTERVAL '30 days'`
          : normalizedWindow === '90d'
            ? `NOW() - INTERVAL '90 days'`
            : null

    try {
      if (module === 'payment') {
        if (metric === 'platform_expense' || metric === 'creator_payout' || metric === 'settlement_income') {
          const payoutTimeFilter = recentTimeFilter
            ? `AND COALESCE(e.settlement_reviewed_at, e.created_at) >= ${recentTimeFilter}`
            : ''
          const countResult = await query<{ total: string }>(`
            SELECT COUNT(*)::text AS total
            FROM creator_earnings e
            WHERE (COALESCE(e.settlement_status, 'pending') = 'approved' OR e.status = 'settled')
            ${payoutTimeFilter}
          `)
          const listResult = await query<{
            earning_id: string
            creator_id: string
            creator_name: string | null
            amount_cny: string
            paid_at: string | null
            remark: string | null
            settlement_status: string | null
            status: string | null
          }>(`
            SELECT
              e.id::text AS earning_id,
              e.creator_id::text AS creator_id,
              p.display_name AS creator_name,
              e.net_amount::text AS amount_cny,
              COALESCE(e.settlement_reviewed_at, e.created_at)::text AS paid_at,
              e.settlement_review_reason AS remark,
              e.settlement_status,
              e.status
            FROM creator_earnings e
            LEFT JOIN profiles p ON p.id = e.creator_id
            WHERE (COALESCE(e.settlement_status, 'pending') = 'approved' OR e.status = 'settled')
            ${payoutTimeFilter}
            ORDER BY COALESCE(e.settlement_reviewed_at, e.created_at) DESC
            LIMIT $1 OFFSET $2
          `, [pageSizeNum, offset])
          return respond({
            module,
            metric,
            time_window: normalizedWindow,
            page: pageNum,
            pageSize: pageSizeNum,
            total: parseInt(countResult.rows[0]?.total || '0'),
            items: listResult.rows.map((row) => ({
              key: row.earning_id,
              name: String(row.creator_name || '').trim() || '未命名创作者',
              id: row.creator_id,
              account: row.creator_id,
              amount: parseFloat(row.amount_cny || '0'),
              at: row.paid_at || '',
              remark: [
                row.remark,
                row.settlement_status ? `结算:${row.settlement_status}` : '',
                row.status ? `状态:${row.status}` : '',
              ].filter((item) => String(item || '').trim()).join(' ｜ ') || '—',
            })),
          })
        }

        const promoFilter =
          metric === 'promotion_income'
            ? `AND (
              COALESCE(o.biz_type, '') = 'promotion'
              OR COALESCE(o.order_type, '') ILIKE '%promo%'
              OR COALESCE(o.order_type, '') ILIKE '%promotion%'
              OR COALESCE(pr.name, '') ILIKE '%推广%'
            )`
            : ''
        const paymentTimeFilter = recentTimeFilter
          ? `AND COALESCE(o.paid_at, o.created_at) >= ${recentTimeFilter}`
          : ''
        const countResult = await query<{ total: string }>(`
          SELECT COUNT(*)::text AS total
          FROM orders o
          LEFT JOIN products pr ON pr.id = o.product_id
          WHERE o.status IN ('paid', 'completed')
          ${promoFilter}
          ${paymentTimeFilter}
        `)
        const listResult = await query<{
          order_id: string
          user_id: string
          payer_name: string | null
          payer_email: string | null
          payer_phone: string | null
          payment_account: string | null
          amount_cny: string
          paid_at: string | null
          payment_remark: string | null
          payment_method: string | null
          order_type: string | null
          product_name: string | null
        }>(`
          SELECT
            o.id::text AS order_id,
            o.user_id::text AS user_id,
            p.display_name AS payer_name,
            p.email AS payer_email,
            p.phone AS payer_phone,
            o.payment_account,
            o.amount::text AS amount_cny,
            COALESCE(o.paid_at, o.created_at)::text AS paid_at,
            o.payment_remark,
            o.payment_method,
            o.order_type,
            pr.name AS product_name
          FROM orders o
          LEFT JOIN profiles p ON p.id = o.user_id
          LEFT JOIN products pr ON pr.id = o.product_id
          WHERE o.status IN ('paid', 'completed')
          ${promoFilter}
          ${paymentTimeFilter}
          ORDER BY COALESCE(o.paid_at, o.created_at) DESC
          LIMIT $1 OFFSET $2
        `, [pageSizeNum, offset])
        return respond({
          module,
          metric,
          time_window: normalizedWindow,
          page: pageNum,
          pageSize: pageSizeNum,
          total: parseInt(countResult.rows[0]?.total || '0'),
          items: listResult.rows.map((row) => ({
            key: row.order_id,
            name: String(row.payer_name || '').trim() || '未命名用户',
            id: row.user_id,
            account: String(row.payment_account || '').trim()
              || String(row.payer_phone || '').trim()
              || String(row.payer_email || '').trim()
              || '—',
            amount: parseFloat(row.amount_cny || '0'),
            at: row.paid_at || '',
            remark: [
              row.payment_remark,
              row.order_type ? `类型:${row.order_type}` : '',
              row.product_name ? `产品:${row.product_name}` : '',
              row.payment_method ? `方式:${row.payment_method}` : '',
            ].filter((item) => String(item || '').trim()).join(' ｜ ') || '—',
          })),
        })
      }

      if (module === 'community') {
        if (metric === 'active_7d' || metric === 'active_30d') {
          const windowDays = normalizedWindow === 'all'
            ? (metric === 'active_7d' ? 7 : 30)
            : parseInt(normalizedWindow.replace('d', ''))
          const countResult = await query<{ total: string }>(`
            WITH active_users AS (
              SELECT author_id AS uid FROM community_posts WHERE created_at >= NOW() - INTERVAL '${windowDays} days'
              UNION
              SELECT author_id AS uid FROM community_comments WHERE created_at >= NOW() - INTERVAL '${windowDays} days'
            )
            SELECT COUNT(*)::text AS total FROM active_users
          `)
          const listResult = await query<{
            user_id: string
            user_name: string | null
            posts: string
            comments: string
            last_active_at: string | null
          }>(`
            WITH post_events AS (
              SELECT author_id AS user_id, created_at FROM community_posts WHERE created_at >= NOW() - INTERVAL '${windowDays} days'
            ),
            comment_events AS (
              SELECT author_id AS user_id, created_at FROM community_comments WHERE created_at >= NOW() - INTERVAL '${windowDays} days'
            ),
            all_events AS (
              SELECT user_id, created_at, 'post'::text AS source FROM post_events
              UNION ALL
              SELECT user_id, created_at, 'comment'::text AS source FROM comment_events
            )
            SELECT
              ae.user_id::text AS user_id,
              p.display_name AS user_name,
              COUNT(*) FILTER (WHERE ae.source = 'post')::text AS posts,
              COUNT(*) FILTER (WHERE ae.source = 'comment')::text AS comments,
              MAX(ae.created_at)::text AS last_active_at
            FROM all_events ae
            LEFT JOIN profiles p ON p.id = ae.user_id
            GROUP BY ae.user_id, p.display_name
            ORDER BY MAX(ae.created_at) DESC
            LIMIT $1 OFFSET $2
          `, [pageSizeNum, offset])
          return respond({
            module,
            metric,
            time_window: normalizedWindow,
            page: pageNum,
            pageSize: pageSizeNum,
            total: parseInt(countResult.rows[0]?.total || '0'),
            items: listResult.rows.map((row) => ({
              key: row.user_id,
              user_name: String(row.user_name || '').trim() || '未命名用户',
              user_id: row.user_id,
              posts: parseInt(row.posts || '0'),
              comments: parseInt(row.comments || '0'),
              last_active_at: row.last_active_at || '',
            })),
          })
        }

        const postStatusFilter = metric === 'posts_published' ? `AND COALESCE(cp.status, 'published') = 'published'` : ''
        const postTimeFilter = recentTimeFilter
          ? `AND cp.created_at >= ${recentTimeFilter}`
          : ''
        const countResult = await query<{ total: string }>(`
          SELECT COUNT(*)::text AS total
          FROM community_posts cp
          WHERE 1=1
          ${postStatusFilter}
          ${postTimeFilter}
        `)
        const listResult = await query<{
          post_id: string
          title: string | null
          status: string | null
          author_id: string | null
          author_name: string | null
          like_count: string | null
          comment_count: string | null
          view_count: string | null
          created_at: string
        }>(`
          SELECT
            cp.id::text AS post_id,
            cp.title,
            cp.status,
            cp.author_id::text AS author_id,
            p.display_name AS author_name,
            cp.like_count::text AS like_count,
            cp.comment_count::text AS comment_count,
            cp.view_count::text AS view_count,
            cp.created_at::text AS created_at
          FROM community_posts cp
          LEFT JOIN profiles p ON p.id = cp.author_id
          WHERE 1=1
          ${postStatusFilter}
          ${postTimeFilter}
          ORDER BY cp.created_at DESC
          LIMIT $1 OFFSET $2
        `, [pageSizeNum, offset])
        return respond({
          module,
          metric,
          time_window: normalizedWindow,
          page: pageNum,
          pageSize: pageSizeNum,
          total: parseInt(countResult.rows[0]?.total || '0'),
          items: listResult.rows.map((row) => ({
            key: row.post_id,
            title: String(row.title || '').trim() || '未命名帖子',
            post_id: row.post_id,
            author_name: String(row.author_name || '').trim() || '未命名用户',
            author_id: String(row.author_id || '').trim() || '',
            metrics: `浏览 ${parseInt(row.view_count || '0')} · 点赞 ${parseInt(row.like_count || '0')} · 评论 ${parseInt(row.comment_count || '0')}`,
            created_at: row.created_at,
            status: String(row.status || '').trim() || 'published',
          })),
        })
      }

      if (module === 'opportunity') {
        const statusFilter = metric === 'published' ? `AND o.status = 'published'` : ''
        const appFilter = metric === 'applications' ? `AND COALESCE(o.application_count, 0) > 0` : ''
        const opportunityTimeFilter = recentTimeFilter
          ? `AND o.created_at >= ${recentTimeFilter}`
          : ''
        const countResult = await query<{ total: string }>(`
          SELECT COUNT(*)::text AS total
          FROM opportunities o
          WHERE 1=1
          ${statusFilter}
          ${appFilter}
          ${opportunityTimeFilter}
        `)
        const listResult = await query<{
          id: string
          title: string
          status: string | null
          publisher_id: string | null
          publisher_name: string | null
          location: string | null
          application_count: string | null
          view_count: string | null
          created_at: string
        }>(`
          SELECT
            o.id::text AS id,
            o.title,
            o.status,
            o.publisher_id::text AS publisher_id,
            p.display_name AS publisher_name,
            o.location,
            o.application_count::text AS application_count,
            o.view_count::text AS view_count,
            o.created_at::text AS created_at
          FROM opportunities o
          LEFT JOIN profiles p ON p.id = o.publisher_id
          WHERE 1=1
          ${statusFilter}
          ${appFilter}
          ${opportunityTimeFilter}
          ORDER BY o.created_at DESC
          LIMIT $1 OFFSET $2
        `, [pageSizeNum, offset])
        return respond({
          module,
          metric,
          time_window: normalizedWindow,
          page: pageNum,
          pageSize: pageSizeNum,
          total: parseInt(countResult.rows[0]?.total || '0'),
          items: listResult.rows.map((row) => ({
            id: row.id,
            title: String(row.title || '').trim() || '未命名岗位',
            publisher_name: String(row.publisher_name || '').trim() || '未命名用户',
            publisher_id: String(row.publisher_id || '').trim() || '',
            location: String(row.location || '').trim() || '未填写',
            view_count: parseInt(row.view_count || '0'),
            application_count: parseInt(row.application_count || '0'),
            status: String(row.status || '').trim() || 'published',
            created_at: row.created_at,
          })),
        })
      }

      if (module === 'skill') {
        const skillTimeFilter = recentTimeFilter
          ? `AND s.created_at >= ${recentTimeFilter}`
          : ''
        const countResult = await query<{ total: string }>(`
          SELECT COUNT(*)::text AS total
          FROM skills s
          WHERE s.status IN ('active', 'published')
          ${skillTimeFilter}
        `)
        const listResult = await query<{
          id: string
          title: string
          category: string | null
          status: string | null
          creator_id: string | null
          creator_name: string | null
          purchase_count: string | null
          view_count: string | null
          favorite_count: string | null
          created_at: string
        }>(`
          SELECT
            s.id::text AS id,
            s.title,
            s.category,
            s.status,
            s.creator_id::text AS creator_id,
            p.display_name AS creator_name,
            s.purchase_count::text AS purchase_count,
            s.view_count::text AS view_count,
            s.favorite_count::text AS favorite_count,
            s.created_at::text AS created_at
          FROM skills s
          LEFT JOIN profiles p ON p.id = s.creator_id
          WHERE s.status IN ('active', 'published')
          ${skillTimeFilter}
          ORDER BY ${metric === 'category' ? `COALESCE(s.category, '') ASC, s.created_at DESC` : `s.created_at DESC`}
          LIMIT $1 OFFSET $2
        `, [pageSizeNum, offset])
        return respond({
          module,
          metric,
          time_window: normalizedWindow,
          page: pageNum,
          pageSize: pageSizeNum,
          total: parseInt(countResult.rows[0]?.total || '0'),
          items: listResult.rows.map((row) => ({
            id: row.id,
            title: String(row.title || '').trim() || '未命名技能',
            creator_name: String(row.creator_name || '').trim() || '未命名创作者',
            creator_id: String(row.creator_id || '').trim() || '',
            category: String(row.category || '').trim() || '未分类',
            view_count: parseInt(row.view_count || '0'),
            favorite_count: parseInt(row.favorite_count || '0'),
            purchase_count: parseInt(row.purchase_count || '0'),
            status: String(row.status || '').trim() || 'active',
            created_at: row.created_at,
          })),
        })
      }

      return reply.status(400).send({ code: 400, message: '不支持的明细模块' })
    } catch (error) {
      request.log.error('Get admin data overview details error:', error)
      return reply.status(500).send({ code: 500, message: '获取明细失败' })
    }
  })

  // ============================================
  // 推广合作配置（公开读取 + 后台管理）
  // ============================================
  async function getPromotionConfigRow() {
    await ensureAdminPolicyTable()
    const row = await query<{ config_json: Record<string, unknown> }>(
      `SELECT config_json FROM admin_policies WHERE policy_key = 'promotion_mapping' LIMIT 1`
    )
    const cfg = row.rows[0]?.config_json || {}
    const inspirationSkillIds = Array.isArray(cfg.inspiration_skill_ids)
      ? cfg.inspiration_skill_ids.map((item) => String(item)).filter(Boolean)
      : []
    const lawyerIds = Array.isArray(cfg.lawyer_ids)
      ? cfg.lawyer_ids.map((item) => String(item)).filter(Boolean)
      : []
    const lawyerModeRaw = String(cfg.lawyer_recommend_mode || 'comprehensive')
    const lawyerMode = lawyerModeRaw === 'domain' ? 'domain' : 'comprehensive'
    const lawyerDomain = String(cfg.lawyer_domain || '').trim()
    return {
      inspiration_skill_ids: inspirationSkillIds,
      lawyer_recommend_mode: lawyerMode,
      lawyer_domain: lawyerDomain,
      lawyer_ids: lawyerIds,
      updated_at: String(cfg.updated_at || ''),
      updated_by: String(cfg.updated_by || ''),
    }
  }

  app.get('/api/promotion-config', async (_request, reply) => {
    try {
      const config = await getPromotionConfigRow()
      return success(reply, config)
    } catch (error) {
      console.warn('[admin] get public promotion config failed:', error)
      return success(reply, {
        inspiration_skill_ids: [],
        lawyer_recommend_mode: 'comprehensive',
        lawyer_domain: '',
        lawyer_ids: [],
        updated_at: '',
        updated_by: '',
      })
    }
  })

  app.get('/api/admin/promotion-config', {
    preHandler: [app.authenticateAdmin],
  }, async (_request: any, reply) => {
    try {
      const config = await getPromotionConfigRow()
      return success(reply, config)
    } catch (error) {
      console.error('Get promotion config error:', error)
      return reply.status(500).send({ code: 500, message: '获取推广配置失败' })
    }
  })

  app.put('/api/admin/promotion-config', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    try {
      const actorId = String(request.user?.user_id || request.user?.id || '')
      const body = (request.body || {}) as Record<string, unknown>
      const nextConfig = {
        inspiration_skill_ids: Array.isArray(body.inspiration_skill_ids)
          ? body.inspiration_skill_ids.map((item) => String(item)).filter(Boolean).slice(0, 50)
          : [],
        lawyer_recommend_mode: String(body.lawyer_recommend_mode || 'comprehensive') === 'domain' ? 'domain' : 'comprehensive',
        lawyer_domain: String(body.lawyer_domain || '').trim(),
        lawyer_ids: Array.isArray(body.lawyer_ids)
          ? body.lawyer_ids.map((item) => String(item)).filter(Boolean).slice(0, 50)
          : [],
        updated_at: new Date().toISOString(),
        updated_by: actorId,
      }
      const beforeConfig = await getPromotionConfigRow()
      await query(
        `INSERT INTO admin_policies (policy_key, config_json, updated_by, updated_at)
         VALUES ('promotion_mapping', $1::jsonb, $2, NOW())
         ON CONFLICT (policy_key)
         DO UPDATE SET config_json = EXCLUDED.config_json, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
        [JSON.stringify(nextConfig), actorId || null]
      )
      await logAdminAction({
        actorId,
        actionType: 'promotion_config_update',
        targetType: 'promotion_config',
        targetId: 'global',
        beforeSnapshot: beforeConfig,
        afterSnapshot: nextConfig,
        reason: '更新推广合作映射配置',
      })
      return success(reply, nextConfig, '推广配置已保存')
    } catch (error) {
      console.error('Update promotion config error:', error)
      return reply.status(500).send({ code: 500, message: '保存推广配置失败' })
    }
  })

  app.get('/api/admin/promotion-options', {
    preHandler: [app.authenticateAdmin],
  }, async (_request: any, reply) => {
    try {
      const [skillsResult, lawyersResult] = await Promise.all([
        query<{ id: string; title: string; category: string | null; status: string }>(`
          SELECT id, title, category, status
          FROM skills
          WHERE status IN ('active', 'published')
          ORDER BY COALESCE(updated_at, created_at) DESC
          LIMIT 200
        `),
        query<{ id: string; display_name: string | null; city: string | null; specialty: string[] | null }>(`
          SELECT id, display_name, city, specialty
          FROM profiles
          WHERE ${REAL_USER_EMAIL_FILTER}
            AND role IN ('creator', 'admin', 'superadmin')
            AND (COALESCE(lawyer_verified, false) = true OR COALESCE(creator_level, '') = 'lawyer')
          ORDER BY COALESCE(follower_count, 0) DESC, created_at DESC
          LIMIT 200
        `),
      ])
      return success(reply, {
        skills: skillsResult.rows.map((row) => ({
          id: row.id,
          title: row.title,
          category: row.category || '未分类',
          status: row.status,
        })),
        lawyers: lawyersResult.rows.map((row) => ({
          id: row.id,
          display_name: row.display_name || '未命名律师',
          city: row.city || '未填写',
          specialty: Array.isArray(row.specialty) ? row.specialty : [],
        })),
      })
    } catch (error) {
      console.error('Get promotion options error:', error)
      return reply.status(500).send({ code: 500, message: '加载推广选项失败' })
    }
  })

  // ============================================
  // GET /api/admin/stats - 获取管理后台统计
  // ============================================
  app.get('/api/admin/stats', {
    preHandler: [app.authenticateAdmin],
  }, async (request: any, reply) => {
    try {
      // 并行查询各项统计
      const [usersResult, agentsResult, ordersResult, pendingAgentsResult, pendingPostsResult] = await Promise.all([
        query(`SELECT COUNT(*) as total FROM profiles WHERE ${REAL_USER_EMAIL_FILTER}`),
        query('SELECT COUNT(*) as total FROM agents'),
        query('SELECT COUNT(*) as total FROM orders'),
        query("SELECT COUNT(*) as total FROM agents WHERE status = 'pending_review'"),
        query("SELECT COUNT(*) as total FROM community_posts WHERE status = 'pending'"),
      ])

      const totalRevenue = await query(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM orders
        WHERE status = 'completed'
      `)

      return success(reply, {
        total_users: parseInt(usersResult.rows[0]?.total || '0'),
        total_agents: parseInt(agentsResult.rows[0]?.total || '0'),
        total_orders: parseInt(ordersResult.rows[0]?.total || '0'),
        total_revenue: parseFloat(totalRevenue.rows[0]?.total || '0'),
        pending_agents: parseInt(pendingAgentsResult.rows[0]?.total || '0'),
        pending_posts: parseInt(pendingPostsResult.rows[0]?.total || '0'),
      })
    } catch (error) {
      request.log.error('Get admin stats error:', error)
      return reply.status(500).send({ code: 500, message: '获取统计数据失败' })
    }
  })
}
