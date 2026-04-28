/**
 * 创作者认证相关 API 路由
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { query, transaction } from '../lib/database.js'
import { success, created, errors } from '../utils/response.js'
import type { JwtPayload, CreatorLevel } from '../types.js'
import { logAdminAction } from '../utils/admin-actions.js'

export const verificationRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
  let verificationColumnsEnsured = false
  let creatorVerificationEnsured = false
  let lawyerProfileVisibilityColumnsEnsured = false

  async function ensureVerificationColumns(): Promise<void> {
    if (verificationColumnsEnsured) return
    try {
      // 历史迁移里有 UNIQUE(user_id)，会阻止“每次提交生成新记录”。
      await query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE table_name = 'lawyer_verification_applications'
              AND constraint_type = 'UNIQUE'
              AND constraint_name = 'lawyer_verification_applications_user_id_key'
          ) THEN
            ALTER TABLE lawyer_verification_applications
              DROP CONSTRAINT lawyer_verification_applications_user_id_key;
          END IF;
        END $$;
      `)
      await query(
        "ALTER TABLE lawyer_verification_applications ADD COLUMN IF NOT EXISTS reviewed_by UUID"
      )
      await query(
        "ALTER TABLE lawyer_verification_applications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ"
      )
      await query(
        "ALTER TABLE lawyer_verification_applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT"
      )
      await query(
        "ALTER TABLE lawyer_verification_applications ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'"
      )
      await query(
        "ALTER TABLE lawyer_verification_applications ADD COLUMN IF NOT EXISTS certificate_info_url TEXT"
      )
      await query(
        "ALTER TABLE lawyer_verification_applications ADD COLUMN IF NOT EXISTS certificate_stamp_url TEXT"
      )
      await query(
        "ALTER TABLE lawyer_verification_applications ADD COLUMN IF NOT EXISTS application_note TEXT"
      )
      await query(
        "ALTER TABLE lawyer_verification_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()"
      )
    } catch (err) {
      console.warn('[verification] ensureVerificationColumns failed:', err)
    }
    verificationColumnsEnsured = true
  }

  async function ensureCreatorVerificationTable(): Promise<void> {
    if (creatorVerificationEnsured) return
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS creator_verifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          verification_type VARCHAR(50) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          materials JSONB DEFAULT '{}'::jsonb,
          review_note TEXT,
          reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
          reviewed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
      await query('CREATE INDEX IF NOT EXISTS idx_creator_verifications_creator ON creator_verifications(creator_id)')
      await query('CREATE INDEX IF NOT EXISTS idx_creator_verifications_type_status ON creator_verifications(verification_type, status)')
    } catch (err) {
      console.warn('[verification] ensureCreatorVerificationTable failed:', err)
    }
    creatorVerificationEnsured = true
  }

  async function ensureLawyerProfileVisibilityColumns(): Promise<void> {
    if (lawyerProfileVisibilityColumnsEnsured) return
    try {
      await query(
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lawyer_profile_visible BOOLEAN NOT NULL DEFAULT true"
      )
      await query(
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lawyer_profile_hidden_at TIMESTAMPTZ"
      )
      await query(
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lawyer_profile_hidden_reason TEXT"
      )
      await query(
        "CREATE INDEX IF NOT EXISTS idx_profiles_lawyer_visible ON profiles(lawyer_profile_visible)"
      )
    } catch (err) {
      console.warn('[verification] ensureLawyerProfileVisibilityColumns failed:', err)
    }
    lawyerProfileVisibilityColumnsEnsured = true
  }

  await ensureVerificationColumns()
  await ensureCreatorVerificationTable()
  await ensureLawyerProfileVisibilityColumns()

  // ============================================
  // GET /api/verification - 获取当前用户的认证状态
  // ============================================
  app.get('/api/verification', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as JwtPayload

    try {
      // 获取用户信息，包括创作者等级
      const userResult = await query(
        `SELECT p.id, p.display_name, p.avatar_url, p.role, p.verified,
                p.creator_level, p.creator_title, p.lawyer_verified, p.lawyer_verified_at,
                p.bar_number, p.law_firm, p.specialty
         FROM profiles p
         WHERE p.id = $1`,
        [user.user_id]
      )

      if (userResult.rows.length === 0) {
        return errors.notFound(reply, 'User not found')
      }

      const userData = userResult.rows[0]

      // 获取统计数据（用于判断是否符合自动认证条件）
      const stats = await query(
        `SELECT 
            COALESCE((SELECT COUNT(*) FROM orders WHERE user_id = $1), 0)::int as purchase_count,
            COALESCE((SELECT COUNT(*) FROM skills WHERE creator_id = $1 AND status = 'active'), 0)::int as skill_count,
            COALESCE((SELECT COUNT(*) FROM agents WHERE creator_id = $1 AND status = 'active'), 0)::int as agent_count,
            COALESCE((SELECT SUM(download_count) FROM skills WHERE creator_id = $1), 0)::int as total_downloads`,
        [user.user_id]
      )

      return success(reply, {
        ...userData,
        stats: stats.rows[0],
        // 自动认证条件
        auto_eligibility: {
          excellent: stats.rows[0].total_downloads >= 50 || (stats.rows[0].skill_count + stats.rows[0].agent_count) >= 5,
          master: stats.rows[0].total_downloads >= 200 || (stats.rows[0].skill_count + stats.rows[0].agent_count) >= 20,
        }
      })
    } catch (err) {
      console.error('Get verification error:', err)
      return errors.internal(reply, 'Failed to get verification status')
    }
  })

  // ============================================
  // POST /api/verification/lawyer - 申请律师认证
  // ============================================
  app.post('/api/verification/lawyer', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { bar_number, law_firm, specialty, certificate_url, certificate_info_url, certificate_stamp_url, id_card_url, application_note } = request.body as {
      bar_number?: string
      law_firm?: string
      specialty?: string[]
      certificate_url?: string
      certificate_info_url?: string
      certificate_stamp_url?: string
      id_card_url?: string
      application_note?: string
    }

    // 权限检查：只有创作者可以申请律师认证
    if (user.role !== 'creator' && user.role !== 'superadmin') {
      return errors.forbidden(reply, 'Only creators can apply for lawyer verification')
    }

    if (!bar_number || !law_firm) {
      return errors.badRequest(reply, 'bar_number and law_firm are required')
    }

    try {
      // 允许重复提交，便于每次提交都生成独立申请记录（按记录逐条审核）

      // 检查执业证号是否已被其他用户使用
      const barExists = await query(
        `SELECT id FROM lawyer_verification_applications
         WHERE bar_number = $1 AND status = 'approved' AND user_id != $2
         LIMIT 1`,
        [bar_number, user.user_id]
      )

      if (barExists.rows.length > 0) {
        return errors.conflict(reply, 'This bar number is already registered by another user')
      }

      const result = await query(
        `INSERT INTO lawyer_verification_applications 
           (user_id, bar_number, law_firm, specialty, certificate_url, certificate_info_url, certificate_stamp_url, id_card_url, application_note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, status, created_at, updated_at`,
        [user.user_id, bar_number, law_firm, specialty || [], certificate_url, certificate_info_url, certificate_stamp_url, id_card_url, application_note || null]
      )

      return created(reply, result.rows[0], 'Lawyer verification application submitted')
    } catch (err) {
      console.error('Create lawyer verification error:', err)
      return errors.internal(reply, 'Failed to submit lawyer verification application')
    }
  })

  // ============================================
  // PUT /api/verification/lawyer - 更新待审核律师认证申请
  // ============================================
  app.put('/api/verification/lawyer', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { bar_number, law_firm, specialty, certificate_url, certificate_info_url, certificate_stamp_url, id_card_url, application_note } = request.body as {
      bar_number?: string
      law_firm?: string
      specialty?: string[]
      certificate_url?: string
      certificate_info_url?: string
      certificate_stamp_url?: string
      id_card_url?: string
      application_note?: string
    }

    if (user.role !== 'creator' && user.role !== 'superadmin') {
      return errors.forbidden(reply, 'Only creators can update lawyer verification')
    }
    if (!bar_number || !law_firm) {
      return errors.badRequest(reply, 'bar_number and law_firm are required')
    }

    try {
      const existing = await query(
        `SELECT id, status
         FROM lawyer_verification_applications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [user.user_id]
      )
      if (!existing.rows.length) {
        return errors.notFound(reply, 'No lawyer verification application found')
      }
      if (existing.rows[0].status !== 'pending') {
        return errors.conflict(reply, 'Only pending application can be updated')
      }

      const result = await query(
        `UPDATE lawyer_verification_applications
         SET bar_number = $1,
             law_firm = $2,
             specialty = $3,
             certificate_url = $4,
             certificate_info_url = $5,
             certificate_stamp_url = $6,
             id_card_url = $7,
             application_note = $8,
             updated_at = NOW()
         WHERE id = $9
         RETURNING id, status, created_at, updated_at`,
        [
          bar_number,
          law_firm,
          specialty || [],
          certificate_url,
          certificate_info_url,
          certificate_stamp_url,
          id_card_url,
          application_note || null,
          existing.rows[0].id,
        ]
      )

      return success(reply, result.rows[0], 'Lawyer verification application updated')
    } catch (err) {
      console.error('Update lawyer verification error:', err)
      return errors.internal(reply, 'Failed to update lawyer verification application')
    }
  })

  // ============================================
  // POST /api/verification/creator-level - 申请优秀/大师创作者认证
  // ============================================
  app.post('/api/verification/creator-level', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { verification_type, materials } = request.body as {
      verification_type?: 'excellent' | 'master'
      materials?: Record<string, unknown>
    }
    if (user.role !== 'creator' && user.role !== 'superadmin') {
      return errors.forbidden(reply, 'Only creators can apply for creator level verification')
    }
    const type = String(verification_type || '').trim()
    if (!['excellent', 'master'].includes(type)) {
      return errors.badRequest(reply, 'verification_type must be excellent or master')
    }
    try {
      await ensureCreatorVerificationTable()
      const existing = await query(
        `SELECT id FROM creator_verifications
         WHERE creator_id = $1 AND verification_type = $2 AND status IN ('pending', 'approved')
         LIMIT 1`,
        [user.user_id, type]
      )
      if (existing.rows.length) {
        return errors.conflict(reply, 'An active creator verification application already exists')
      }
      const inserted = await query(
        `INSERT INTO creator_verifications (creator_id, verification_type, status, materials, created_at, updated_at)
         VALUES ($1, $2, 'pending', $3::jsonb, NOW(), NOW())
         RETURNING id, creator_id, verification_type, status, materials, created_at`,
        [user.user_id, type, JSON.stringify(materials || {})]
      )
      return created(reply, inserted.rows[0], 'Creator verification application submitted')
    } catch (err) {
      console.error('Create creator level verification error:', err)
      return errors.internal(reply, 'Failed to submit creator level verification application')
    }
  })

  // ============================================
  // GET /api/verification/creator-level - 获取当前用户创作者等级认证申请状态
  // ============================================
  app.get('/api/verification/creator-level', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { verification_type } = request.query as {
      verification_type?: 'excellent' | 'master'
    }
    const type = String(verification_type || '').trim()
    if (type && !['excellent', 'master'].includes(type)) {
      return errors.badRequest(reply, 'verification_type must be excellent or master')
    }

    try {
      await ensureCreatorVerificationTable()
      const params: unknown[] = [user.user_id]
      let whereType = ''
      if (type) {
        whereType = 'AND verification_type = $2'
        params.push(type)
      } else {
        whereType = `AND verification_type IN ('excellent', 'master')`
      }
      const result = await query(
        `SELECT id, creator_id, verification_type, status, materials, review_note, reviewed_by, reviewed_at, created_at, updated_at
         FROM creator_verifications
         WHERE creator_id = $1
         ${whereType}
         ORDER BY COALESCE(updated_at, created_at) DESC`,
        params
      )
      const latestByType: Record<string, Record<string, unknown>> = {}
      for (const row of result.rows as Record<string, unknown>[]) {
        const vt = String(row.verification_type || '')
        if (!vt || latestByType[vt]) continue
        latestByType[vt] = row
      }
      const profile = await query<{ creator_level: string | null; creator_title: string | null }>(
        'SELECT creator_level, creator_title FROM profiles WHERE id = $1 LIMIT 1',
        [user.user_id]
      )
      return success(reply, {
        creator_level: String(profile.rows[0]?.creator_level || ''),
        creator_title: String(profile.rows[0]?.creator_title || ''),
        latest: latestByType,
        items: result.rows,
      })
    } catch (err) {
      console.error('Get creator level verification error:', err)
      return errors.internal(reply, 'Failed to get creator level verification application')
    }
  })

  // ============================================
  // GET /api/verification/lawyer - 获取律师认证申请状态
  // ============================================
  app.get('/api/verification/lawyer', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as JwtPayload

    try {
      const result = await query(
        `SELECT l.*, admin.display_name as reviewer_name
         FROM lawyer_verification_applications l
         LEFT JOIN profiles admin ON admin.id = l.reviewed_by
         WHERE l.user_id = $1
         ORDER BY l.created_at DESC
         LIMIT 1`,
        [user.user_id]
      )

      if (result.rows.length === 0) {
        return success(reply, null)
      }

      return success(reply, result.rows[0])
    } catch (err) {
      console.error('Get lawyer verification error:', err)
      return errors.internal(reply, 'Failed to get lawyer verification status')
    }
  })

  // ============================================
  // GET /api/verification/stats - 获取认证统计数据
  // ============================================
  app.get('/api/verification/stats', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as JwtPayload

    try {
      // 获取创作者的统计数据
      const result = await query(
        `SELECT 
            COALESCE((SELECT SUM(download_count) FROM skills WHERE creator_id = $1), 0)::int as total_downloads,
            COALESCE((SELECT COUNT(*) FROM skills WHERE creator_id = $1 AND status = 'active'), 0)::int as active_skills,
            COALESCE((SELECT COUNT(*) FROM agents WHERE creator_id = $1 AND status = 'active'), 0)::int as active_agents,
            COALESCE((SELECT SUM(total_revenue) FROM creator_earnings WHERE user_id = $1), 0)::numeric as total_revenue`,
        [user.user_id]
      )

      const data = result.rows[0]

      return success(reply, {
        total_downloads: data.total_downloads,
        total_products: data.active_skills + data.active_agents,
        total_revenue: data.total_revenue,
        eligibility: {
          excellent: {
            required_downloads: 50,
            required_products: 5,
            current_downloads: data.total_downloads,
            current_products: data.active_skills + data.active_agents,
            eligible: data.total_downloads >= 50 || (data.active_skills + data.active_agents) >= 5,
          },
          master: {
            required_downloads: 200,
            required_products: 20,
            current_downloads: data.total_downloads,
            current_products: data.active_skills + data.active_agents,
            eligible: data.total_downloads >= 200 || (data.active_skills + data.active_agents) >= 20,
          }
        }
      })
    } catch (err) {
      console.error('Get verification stats error:', err)
      return errors.internal(reply, 'Failed to get verification stats')
    }
  })

  // ============================================
  // 管理员接口：获取待审核的律师认证列表
  // ============================================
  app.get('/api/admin/verification/lawyer', { preHandler: [app.authenticateAdmin] }, async (request, reply) => {
    await ensureVerificationColumns()
    const { status = 'pending', page = '1', pageSize = '20' } = request.query as {
      status?: string
      page?: string
      pageSize?: string
    }

    try {
      const offset = (parseInt(page) - 1) * parseInt(pageSize)

      const statusParams: string[] = []
      let statusSql = ''
      if (status === 'reviewed') {
        statusSql = "WHERE l.status IN ('approved', 'rejected')"
      } else if (status && status !== 'all') {
        statusSql = 'WHERE l.status = $1'
        statusParams.push(status)
      }
      const limitOffsetBase = statusParams.length
      const result = await query(
        `SELECT l.*, p.display_name, p.avatar_url, p.email, admin.display_name as reviewer_name
         FROM lawyer_verification_applications l
         JOIN profiles p ON p.id = l.user_id
         LEFT JOIN profiles admin ON admin.id = l.reviewed_by
         ${statusSql}
         ORDER BY l.created_at ASC
         LIMIT $${limitOffsetBase + 1} OFFSET $${limitOffsetBase + 2}`,
        [...statusParams, parseInt(pageSize), offset]
      )

      const countResult = await query(
        `SELECT COUNT(*)::int as total FROM lawyer_verification_applications l ${statusSql}`,
        statusParams
      )

      return success(reply, {
        items: result.rows,
        total: countResult.rows[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      })
    } catch (err) {
      console.error('Get lawyer applications error:', err)
      return errors.internal(reply, 'Failed to get lawyer verification applications')
    }
  })

  // ============================================
  // 管理员接口：审核律师认证
  // ============================================
  app.put('/api/admin/verification/lawyer/:id', { preHandler: [app.authenticateAdmin] }, async (request, reply) => {
    await ensureVerificationColumns()
    const user = request.user as JwtPayload
    const { id } = request.params as { id: string }
    const { action, reason, rejection_reason } = request.body as {
      action?: 'approve' | 'reject'
      reason?: string
      rejection_reason?: string
    }

    if (!action) {
      return errors.badRequest(reply, 'action is required (approve or reject)')
    }

    const normalizedReason = (reason || rejection_reason || '').trim()
    if (!normalizedReason) {
      return errors.badRequest(reply, 'reason is required')
    }

    try {
      await transaction(async (client) => {
        const before = await client.query(
          `SELECT id, user_id, status, reviewed_by, reviewed_at, rejection_reason
           FROM lawyer_verification_applications
           WHERE id = $1`,
          [id]
        )
        if (before.rows.length === 0) {
          throw new Error('Application not found or already processed')
        }

        // 更新申请状态
        const updateResult = await client.query(
          `UPDATE lawyer_verification_applications
           SET status = $1,
               reviewed_by = $2,
               reviewed_at = NOW(),
               rejection_reason = $3
           WHERE id = $4 AND status = 'pending'
           RETURNING id, user_id, status, reviewed_by, reviewed_at, rejection_reason`,
          [action === 'approve' ? 'approved' : 'rejected', user.user_id, normalizedReason, id]
        )

        if (updateResult.rows.length === 0) {
          throw new Error('Application not found or already processed')
        }

        const userId = updateResult.rows[0].user_id

        // 如果批准，更新用户为律师认证创作者
        if (action === 'approve') {
          // 获取申请信息
          const appResult = await client.query(
            `SELECT bar_number, law_firm, specialty, certificate_url
             FROM lawyer_verification_applications WHERE id = $1`,
            [id]
          )

          const app = appResult.rows[0]

          await client.query(
            `UPDATE profiles
             SET role = 'creator',
                 creator_level = 'lawyer',
                 lawyer_verified = true,
                 lawyer_verified_at = NOW(),
                 lawyer_profile_visible = true,
                 lawyer_profile_hidden_at = NULL,
                 lawyer_profile_hidden_reason = NULL,
                 bar_number = $1,
                 law_firm = $2,
                 specialty = $3,
                 verified = true
             WHERE id = $4`,
            [app.bar_number, app.law_firm, app.specialty, userId]
          )
        }

        await logAdminAction({
          actorId: user.user_id,
          actionType: action === 'approve' ? 'verification_approve' : 'verification_reject',
          targetType: 'lawyer_verification',
          targetId: id,
          beforeSnapshot: before.rows[0],
          afterSnapshot: updateResult.rows[0],
          reason: normalizedReason,
        })
      })

      return success(reply, null, action === 'approve' ? 'Lawyer verification approved' : 'Lawyer verification rejected')
    } catch (err) {
      console.error('Review lawyer verification error:', err)
      return errors.internal(reply, 'Failed to review lawyer verification')
    }
  })

  // ============================================
  // 管理员接口：批量审核律师认证
  // ============================================
  app.post('/api/admin/verification/lawyer/batch-review', { preHandler: [app.authenticateAdmin] }, async (request, reply) => {
    const user = request.user as JwtPayload
    const { ids, action, reason } = request.body as {
      ids?: string[]
      action?: 'approve' | 'reject'
      reason?: string
    }
    const normalizedReason = String(reason || '').trim()
    if (!Array.isArray(ids) || ids.length === 0) {
      return errors.badRequest(reply, 'ids is required')
    }
    if (!action) {
      return errors.badRequest(reply, 'action is required')
    }
    if (!normalizedReason) {
      return errors.badRequest(reply, 'reason is required')
    }

    const normalizeBatchError = (reason: string): string => {
      const msg = reason.toLowerCase()
      if (msg.includes('not found or already processed')) return '申请不存在或已处理'
      if (msg.includes('not found')) return '申请不存在'
      if (msg.includes('already processed')) return '申请已处理'
      if (msg.includes('permission') || msg.includes('forbidden')) return '无权限执行该操作'
      if (msg.includes('invalid')) return '参数不合法'
      if (msg.includes('required')) return '缺少必填参数'
      if (msg.includes('unknown')) return '未知错误'
      return reason
    }

    try {
      await ensureVerificationColumns()
      let successCount = 0
      const failed: Array<{ id: string; reason: string }> = []

      for (const id of ids) {
        try {
          await transaction(async (client) => {
            const before = await client.query(
              `SELECT id, user_id, status, reviewed_by, reviewed_at, rejection_reason
               FROM lawyer_verification_applications
               WHERE id = $1`,
              [id]
            )
            if (before.rows.length === 0) {
              throw new Error('申请不存在')
            }
            if (before.rows[0].status !== 'pending') {
              throw new Error('申请已处理')
            }

            const updateResult = await client.query(
              `UPDATE lawyer_verification_applications
               SET status = $1,
                   reviewed_by = $2,
                   reviewed_at = NOW(),
                   rejection_reason = $3
               WHERE id = $4 AND status = 'pending'
               RETURNING id, user_id, status, reviewed_by, reviewed_at, rejection_reason`,
              [action === 'approve' ? 'approved' : 'rejected', user.user_id, normalizedReason, id]
            )
            if (!updateResult.rows.length) {
              throw new Error('申请不存在或已处理')
            }

            if (action === 'approve') {
              const userId = updateResult.rows[0].user_id
              const appResult = await client.query(
                `SELECT bar_number, law_firm, specialty
                 FROM lawyer_verification_applications WHERE id = $1`,
                [id]
              )
              const appRow = appResult.rows[0]
              await client.query(
                `UPDATE profiles
                 SET role = 'creator',
                     creator_level = 'lawyer',
                     lawyer_verified = true,
                     lawyer_verified_at = NOW(),
                     lawyer_profile_visible = true,
                     lawyer_profile_hidden_at = NULL,
                     lawyer_profile_hidden_reason = NULL,
                     bar_number = $1,
                     law_firm = $2,
                     specialty = $3,
                     verified = true
                 WHERE id = $4`,
                [appRow.bar_number, appRow.law_firm, appRow.specialty, userId]
              )
            }

            await logAdminAction({
              actorId: user.user_id,
              actionType: action === 'approve' ? 'verification_approve' : 'verification_reject',
              targetType: 'lawyer_verification',
              targetId: id,
              beforeSnapshot: before.rows[0],
              afterSnapshot: updateResult.rows[0],
              reason: `[batch] ${normalizedReason}`,
            })
          })
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
      }, 'Batch review completed')
    } catch (err) {
      console.error('Batch review lawyer verification error:', err)
      return errors.internal(reply, 'Failed to batch review lawyer verification')
    }
  })

  // ============================================
  // 管理员接口：统一获取认证申请列表（律师/优秀创作者/大师创作者）
  // ============================================
  app.get('/api/admin/verification/applications', { preHandler: [app.authenticateAdmin] }, async (request, reply) => {
    await ensureVerificationColumns()
    await ensureCreatorVerificationTable()
    const { status = 'pending', verification_type = 'all', page = '1', pageSize = '20' } = request.query as {
      status?: string
      verification_type?: string
      page?: string
      pageSize?: string
    }
    const pageNum = Math.max(parseInt(page) || 1, 1)
    const pageSizeNum = Math.min(Math.max(parseInt(pageSize) || 20, 1), 100)
    const offset = (pageNum - 1) * pageSizeNum
    try {
      const items: any[] = []
      if (verification_type === 'all' || verification_type === 'lawyer') {
        const params: unknown[] = []
        let whereClause = ''
        if (status === 'reviewed') {
          whereClause = "WHERE l.status IN ('approved', 'rejected')"
        } else if (status !== 'all') {
          whereClause = 'WHERE l.status = $1'
          params.push(status)
        }
        const lawyerRows = await query(
          `SELECT
             l.id,
             l.user_id as applicant_id,
             p.display_name,
             p.email,
              COALESCE(p.lawyer_profile_visible, true) as lawyer_profile_visible,
             l.bar_number,
             l.law_firm,
             l.specialty,
             l.certificate_url,
             l.certificate_info_url,
             l.certificate_stamp_url,
             l.id_card_url,
             l.application_note,
             l.status,
             l.created_at,
             l.updated_at,
             l.reviewed_at,
             l.rejection_reason as review_note,
             'lawyer'::text as verification_type
           FROM lawyer_verification_applications l
           JOIN profiles p ON p.id = l.user_id
           ${whereClause}
           ORDER BY COALESCE(l.updated_at, l.created_at) DESC`,
          params
        )
        items.push(...lawyerRows.rows)
      }
      if (verification_type === 'all' || verification_type === 'excellent' || verification_type === 'master') {
        const params: unknown[] = []
        const whereParts: string[] = []
        let idx = 1
        if (status === 'reviewed') {
          whereParts.push("cv.status IN ('approved', 'rejected')")
        } else if (status !== 'all') {
          whereParts.push(`cv.status = $${idx++}`)
          params.push(status)
        }
        if (verification_type !== 'all') {
          whereParts.push(`cv.verification_type = $${idx++}`)
          params.push(verification_type)
        } else {
          whereParts.push("cv.verification_type IN ('excellent', 'master')")
        }
        const creatorWhere = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : ''
        const creatorRows = await query(
          `SELECT
             cv.id,
             cv.creator_id as applicant_id,
             p.display_name,
             p.email,
             NULL::text as bar_number,
             NULL::text as law_firm,
             NULL::text[] as specialty,
             cv.status,
             cv.created_at,
             cv.updated_at,
             cv.reviewed_at,
             cv.review_note,
             cv.verification_type
           FROM creator_verifications cv
           JOIN profiles p ON p.id = cv.creator_id
           ${creatorWhere}
           ORDER BY COALESCE(cv.updated_at, cv.created_at) DESC`,
          params
        )
        items.push(...creatorRows.rows)
      }

      const sorted = items.sort((a, b) => {
        const ta = new Date(a.updated_at || a.created_at).getTime()
        const tb = new Date(b.updated_at || b.created_at).getTime()
        return tb - ta
      })
      const paged = sorted.slice(offset, offset + pageSizeNum)

      return success(reply, {
        items: paged,
        total: sorted.length,
        page: pageNum,
        pageSize: pageSizeNum,
      })
    } catch (err) {
      console.error('Get unified verification applications error:', err)
      return errors.internal(reply, 'Failed to get verification applications')
    }
  })

  // ============================================
  // 管理员接口：统一审核认证申请
  // ============================================
  app.put('/api/admin/verification/applications/:id', { preHandler: [app.authenticateAdmin] }, async (request, reply) => {
    await ensureVerificationColumns()
    await ensureCreatorVerificationTable()
    const user = request.user as JwtPayload
    const { id } = request.params as { id: string }
    const { action, reason, verification_type } = request.body as {
      action?: 'approve' | 'reject'
      reason?: string
      verification_type?: 'lawyer' | 'excellent' | 'master'
    }
    const type = String(verification_type || '').trim()
    if (!action) return errors.badRequest(reply, 'action is required')
    if (!['lawyer', 'excellent', 'master'].includes(type)) {
      return errors.badRequest(reply, 'verification_type is required')
    }
    const normalizedReason = String(reason || '').trim()
    if (!normalizedReason) return errors.badRequest(reply, 'reason is required')

    try {
      await transaction(async (client) => {
        if (type === 'lawyer') {
          const before = await client.query(
            `SELECT id, user_id, status, reviewed_by, reviewed_at, rejection_reason
             FROM lawyer_verification_applications WHERE id = $1`,
            [id]
          )
          if (!before.rows.length) throw new Error('Application not found')
          if (before.rows[0].status !== 'pending') throw new Error('Application already processed')

          const updated = await client.query(
            `UPDATE lawyer_verification_applications
             SET status = $1, reviewed_by = $2, reviewed_at = NOW(), rejection_reason = $3
             WHERE id = $4 AND status = 'pending'
             RETURNING id, user_id, status, reviewed_by, reviewed_at, rejection_reason`,
            [action === 'approve' ? 'approved' : 'rejected', user.user_id, normalizedReason, id]
          )
          if (!updated.rows.length) throw new Error('Application not found or already processed')

          if (action === 'approve') {
            const appResult = await client.query(
              `SELECT bar_number, law_firm, specialty FROM lawyer_verification_applications WHERE id = $1`,
              [id]
            )
            const appRow = appResult.rows[0]
            await client.query(
              `UPDATE profiles
               SET role = 'creator',
                   creator_level = 'lawyer',
                   creator_title = '认证律师创作者',
                   lawyer_verified = true,
                   lawyer_verified_at = NOW(),
                   lawyer_profile_visible = true,
                   lawyer_profile_hidden_at = NULL,
                   lawyer_profile_hidden_reason = NULL,
                   bar_number = $1,
                   law_firm = $2,
                   specialty = $3,
                   verified = true
               WHERE id = $4`,
              [appRow.bar_number, appRow.law_firm, appRow.specialty, updated.rows[0].user_id]
            )
          }

          await logAdminAction({
            actorId: user.user_id,
            actionType: action === 'approve' ? 'verification_approve' : 'verification_reject',
            targetType: 'lawyer_verification',
            targetId: id,
            beforeSnapshot: before.rows[0],
            afterSnapshot: updated.rows[0],
            reason: normalizedReason,
          })
          await client.query(
            `INSERT INTO notifications (user_id, notification_type, title, content, data)
             VALUES ($1, 'verification_review_result', $2, $3, $4::jsonb)`,
            [
              updated.rows[0].user_id,
              '认证审核结果',
              `你的律师认证申请已${action === 'approve' ? '通过' : '驳回'}。${normalizedReason ? ` 说明：${normalizedReason}` : ''}`,
              JSON.stringify({
                verification_type: 'lawyer',
                application_id: id,
                status: updated.rows[0].status,
              }),
            ]
          )
          return
        }

        const before = await client.query(
          `SELECT id, creator_id, verification_type, status, review_note, reviewed_by, reviewed_at
           FROM creator_verifications
           WHERE id = $1 AND verification_type = $2`,
          [id, type]
        )
        if (!before.rows.length) throw new Error('Application not found')
        if (before.rows[0].status !== 'pending') throw new Error('Application already processed')

        const updated = await client.query(
          `UPDATE creator_verifications
           SET status = $1, review_note = $2, reviewed_by = $3, reviewed_at = NOW(), updated_at = NOW()
           WHERE id = $4 AND status = 'pending'
           RETURNING id, creator_id, verification_type, status, review_note, reviewed_by, reviewed_at`,
          [action === 'approve' ? 'approved' : 'rejected', normalizedReason, user.user_id, id]
        )
        if (!updated.rows.length) throw new Error('Application not found or already processed')

        if (action === 'approve') {
          const creatorId = updated.rows[0].creator_id
          const level = type as CreatorLevel
          const title = level === 'master' ? '大师级创作者' : '优秀创作者'
          await client.query(
            `UPDATE profiles
             SET creator_level = CASE
                   WHEN creator_level = 'lawyer' THEN creator_level
                   WHEN creator_level = 'master' THEN creator_level
                   WHEN creator_level = 'excellent' AND $1 = 'master' THEN 'master'
                   ELSE $1
                 END,
                 creator_title = CASE
                   WHEN creator_level = 'lawyer' THEN creator_title
                   WHEN creator_level = 'master' THEN creator_title
                   WHEN creator_level = 'excellent' AND $1 = 'master' THEN '大师级创作者'
                   ELSE $2
                 END,
                 verified = true
             WHERE id = $3`,
            [level, title, creatorId]
          )
        }

        await logAdminAction({
          actorId: user.user_id,
          actionType: action === 'approve' ? 'verification_approve' : 'verification_reject',
          targetType: 'creator_verification',
          targetId: id,
          beforeSnapshot: before.rows[0],
          afterSnapshot: updated.rows[0],
          reason: normalizedReason,
        })
        await client.query(
          `INSERT INTO notifications (user_id, notification_type, title, content, data)
           VALUES ($1, 'verification_review_result', $2, $3, $4::jsonb)`,
          [
            updated.rows[0].creator_id,
            '认证审核结果',
            `你的${type === 'master' ? '大师级创作者' : '优秀创作者'}认证申请已${action === 'approve' ? '通过' : '驳回'}。${normalizedReason ? ` 说明：${normalizedReason}` : ''}`,
            JSON.stringify({
              verification_type: type,
              application_id: id,
              status: updated.rows[0].status,
            }),
          ]
        )
      })

      return success(reply, null, action === 'approve' ? 'Verification approved' : 'Verification rejected')
    } catch (err) {
      console.error('Review unified verification error:', err)
      const message = err instanceof Error ? err.message : String(err)
      if (/already processed/i.test(message)) {
        return errors.badRequest(reply, '该认证申请已处理，无需重复审核')
      }
      if (/application not found/i.test(message)) {
        return errors.notFound(reply, '认证申请不存在')
      }
      return errors.internal(reply, 'Failed to review verification application')
    }
  })

  // ============================================
  // 管理员接口：统一批量审核认证申请
  // ============================================
  app.post('/api/admin/verification/applications/batch-review', { preHandler: [app.authenticateAdmin] }, async (request, reply) => {
    await ensureVerificationColumns()
    await ensureCreatorVerificationTable()
    const user = request.user as JwtPayload
    const { ids, action, reason, verification_type } = request.body as {
      ids?: string[]
      action?: 'approve' | 'reject'
      reason?: string
      verification_type?: 'lawyer' | 'excellent' | 'master'
    }
    if (!Array.isArray(ids) || !ids.length) return errors.badRequest(reply, 'ids is required')
    if (!action) return errors.badRequest(reply, 'action is required')
    const type = String(verification_type || '').trim()
    if (!['lawyer', 'excellent', 'master'].includes(type)) return errors.badRequest(reply, 'verification_type is required')
    const normalizedReason = String(reason || '').trim()
    if (!normalizedReason) return errors.badRequest(reply, 'reason is required')

    let successCount = 0
    const failed: Array<{ id: string; reason: string }> = []
    for (const id of ids) {
      try {
        await transaction(async (client) => {
          if (type === 'lawyer') {
            const before = await client.query(
              `SELECT id, user_id, status, reviewed_by, reviewed_at, rejection_reason
               FROM lawyer_verification_applications WHERE id = $1`,
              [id]
            )
            if (!before.rows.length) throw new Error('申请不存在')
            if (before.rows[0].status !== 'pending') throw new Error('申请已处理')

            const updated = await client.query(
              `UPDATE lawyer_verification_applications
               SET status = $1, reviewed_by = $2, reviewed_at = NOW(), rejection_reason = $3
               WHERE id = $4 AND status = 'pending'
               RETURNING id, user_id, status, reviewed_by, reviewed_at, rejection_reason`,
              [action === 'approve' ? 'approved' : 'rejected', user.user_id, normalizedReason, id]
            )
            if (!updated.rows.length) throw new Error('申请不存在或已处理')

            if (action === 'approve') {
              const appResult = await client.query(
                `SELECT bar_number, law_firm, specialty FROM lawyer_verification_applications WHERE id = $1`,
                [id]
              )
              const appRow = appResult.rows[0]
              await client.query(
                `UPDATE profiles
                 SET role = 'creator',
                     creator_level = 'lawyer',
                     creator_title = '认证律师创作者',
                     lawyer_verified = true,
                     lawyer_verified_at = NOW(),
                     lawyer_profile_visible = true,
                     lawyer_profile_hidden_at = NULL,
                     lawyer_profile_hidden_reason = NULL,
                     bar_number = $1,
                     law_firm = $2,
                     specialty = $3,
                     verified = true
                 WHERE id = $4`,
                [appRow.bar_number, appRow.law_firm, appRow.specialty, updated.rows[0].user_id]
              )
            }

            await logAdminAction({
              actorId: user.user_id,
              actionType: action === 'approve' ? 'verification_approve' : 'verification_reject',
              targetType: 'lawyer_verification',
              targetId: id,
              beforeSnapshot: before.rows[0],
              afterSnapshot: updated.rows[0],
              reason: `[batch] ${normalizedReason}`,
            })
            await client.query(
              `INSERT INTO notifications (user_id, notification_type, title, content, data)
               VALUES ($1, 'verification_review_result', $2, $3, $4::jsonb)`,
              [
                updated.rows[0].user_id,
                '认证审核结果',
                `你的律师认证申请已${action === 'approve' ? '通过' : '驳回'}。${normalizedReason ? ` 说明：${normalizedReason}` : ''}`,
                JSON.stringify({
                  verification_type: 'lawyer',
                  application_id: id,
                  status: updated.rows[0].status,
                  batch: true,
                }),
              ]
            )
            return
          }

          const before = await client.query(
            `SELECT id, creator_id, verification_type, status, review_note, reviewed_by, reviewed_at
             FROM creator_verifications
             WHERE id = $1 AND verification_type = $2`,
            [id, type]
          )
          if (!before.rows.length) throw new Error('申请不存在')
          if (before.rows[0].status !== 'pending') throw new Error('申请已处理')

          const updated = await client.query(
            `UPDATE creator_verifications
             SET status = $1, review_note = $2, reviewed_by = $3, reviewed_at = NOW(), updated_at = NOW()
             WHERE id = $4 AND status = 'pending'
             RETURNING id, creator_id, verification_type, status, review_note, reviewed_by, reviewed_at`,
            [action === 'approve' ? 'approved' : 'rejected', normalizedReason, user.user_id, id]
          )
          if (!updated.rows.length) throw new Error('申请不存在或已处理')

          if (action === 'approve') {
            const creatorId = updated.rows[0].creator_id
            const level = type as CreatorLevel
            const title = level === 'master' ? '大师级创作者' : '优秀创作者'
            await client.query(
              `UPDATE profiles
               SET creator_level = CASE
                     WHEN creator_level = 'lawyer' THEN creator_level
                     WHEN creator_level = 'master' THEN creator_level
                     WHEN creator_level = 'excellent' AND $1 = 'master' THEN 'master'
                     ELSE $1
                   END,
                   creator_title = CASE
                     WHEN creator_level = 'lawyer' THEN creator_title
                     WHEN creator_level = 'master' THEN creator_title
                     WHEN creator_level = 'excellent' AND $1 = 'master' THEN '大师级创作者'
                     ELSE $2
                   END,
                   verified = true
               WHERE id = $3`,
              [level, title, creatorId]
            )
          }

          await logAdminAction({
            actorId: user.user_id,
            actionType: action === 'approve' ? 'verification_approve' : 'verification_reject',
            targetType: 'creator_verification',
            targetId: id,
            beforeSnapshot: before.rows[0],
            afterSnapshot: updated.rows[0],
            reason: `[batch] ${normalizedReason}`,
          })
          await client.query(
            `INSERT INTO notifications (user_id, notification_type, title, content, data)
             VALUES ($1, 'verification_review_result', $2, $3, $4::jsonb)`,
            [
              updated.rows[0].creator_id,
              '认证审核结果',
              `你的${type === 'master' ? '大师级创作者' : '优秀创作者'}认证申请已${action === 'approve' ? '通过' : '驳回'}。${normalizedReason ? ` 说明：${normalizedReason}` : ''}`,
              JSON.stringify({
                verification_type: type,
                application_id: id,
                status: updated.rows[0].status,
                batch: true,
              }),
            ]
          )
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
    }, 'Batch review completed')
  })

  // ============================================
  // 管理员接口：认证律师资料页上下架
  // ============================================
  app.patch('/api/admin/verification/lawyer-profile/:userId/visibility', { preHandler: [app.authenticateAdmin] }, async (request, reply) => {
    await ensureLawyerProfileVisibilityColumns()
    const admin = request.user as JwtPayload
    const { userId } = request.params as { userId: string }
    const { visible, reason } = request.body as { visible?: boolean; reason?: string }
    if (typeof visible !== 'boolean') return errors.badRequest(reply, 'visible is required')
    const normalizedReason = String(reason || '').trim()
    if (!visible && !normalizedReason) {
      return errors.badRequest(reply, 'reason is required when taking down lawyer profile')
    }

    try {
      const before = await query(
        `SELECT id, role, creator_level, lawyer_verified, lawyer_profile_visible, lawyer_profile_hidden_at, lawyer_profile_hidden_reason
         FROM profiles
         WHERE id = $1
         LIMIT 1`,
        [userId]
      )
      if (!before.rows.length) return errors.notFound(reply, 'User not found')
      const row = before.rows[0] as Record<string, unknown>
      const isLawyerLike = row.role === 'creator' && (row.lawyer_verified === true || row.creator_level === 'lawyer')
      if (!isLawyerLike) return errors.badRequest(reply, 'Target user is not a certified lawyer')

      const updated = await query(
        `UPDATE profiles
         SET lawyer_profile_visible = $1,
             lawyer_profile_hidden_at = CASE WHEN $1 THEN NULL ELSE NOW() END,
             lawyer_profile_hidden_reason = CASE WHEN $1 THEN NULL ELSE $2 END
         WHERE id = $3
         RETURNING id, lawyer_profile_visible, lawyer_profile_hidden_at, lawyer_profile_hidden_reason`,
        [visible, normalizedReason || null, userId]
      )

      await logAdminAction({
        actorId: admin.user_id,
        actionType: visible ? 'lawyer_profile_restore' : 'lawyer_profile_take_down',
        targetType: 'lawyer_profile',
        targetId: userId,
        beforeSnapshot: row,
        afterSnapshot: updated.rows[0],
        reason: normalizedReason || (visible ? '恢复认证律师页展示' : '从认证律师页下架'),
      })

      await query(
        `INSERT INTO notifications (user_id, notification_type, title, content, data)
         VALUES ($1, 'lawyer_profile_visibility', $2, $3, $4::jsonb)`,
        [
          userId,
          visible ? '认证律师页恢复展示通知' : '认证律师页下架通知',
          visible
            ? '你的认证律师资料已恢复在找律师页面展示。'
            : `你的认证律师资料已从找律师页面下架。${normalizedReason ? ` 原因：${normalizedReason}` : ''}`,
          JSON.stringify({
            visible,
            reason: normalizedReason || null,
            hidden_at: updated.rows[0]?.lawyer_profile_hidden_at || null,
          }),
        ]
      )

      return success(reply, updated.rows[0], visible ? 'Lawyer profile restored' : 'Lawyer profile taken down')
    } catch (err) {
      console.error('Update lawyer profile visibility error:', err)
      return errors.internal(reply, 'Failed to update lawyer profile visibility')
    }
  })

  // ============================================
  // 管理员接口：获取创作者等级认证列表
  // ============================================
  app.get('/api/admin/verification/creator', { preHandler: [app.authenticateAdmin] }, async (request, reply) => {
    const { level, page = '1', pageSize = '20' } = request.query as {
      level?: string
      page?: string
      pageSize?: string
    }

    try {
      const offset = (parseInt(page) - 1) * parseInt(pageSize)

      let queryStr = `
        SELECT p.id, p.display_name, p.avatar_url, p.creator_level,
               (SELECT SUM(download_count) FROM skills WHERE creator_id = p.id) as total_downloads,
               (SELECT COUNT(*) FROM skills WHERE creator_id = p.id AND status = 'active') +
               (SELECT COUNT(*) FROM agents WHERE creator_id = p.id AND status = 'active') as total_products
        FROM profiles p
        WHERE p.role = 'creator' AND p.creator_level IS NOT NULL`

      const params: unknown[] = []
      let paramIndex = 1

      if (level) {
        queryStr += ` AND p.creator_level = $${paramIndex}`
        params.push(level)
        paramIndex++
      }

      queryStr += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(parseInt(pageSize))
      params.push(offset)

      const result = await query(queryStr, params)

      return success(reply, {
        items: result.rows,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      })
    } catch (err) {
      console.error('Get creator verifications error:', err)
      return errors.internal(reply, 'Failed to get creator verifications')
    }
  })
}
