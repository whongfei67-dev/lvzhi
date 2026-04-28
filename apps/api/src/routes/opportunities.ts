/**
 * 合作机会 (Opportunities) API 路由
 * 
 * 替代原有的 jobs 路由，支持更丰富的合作机会类型：
 * - job: 职位招聘
 * - collaboration: 合作意向
 * - project: 项目需求
 * - service_offer: 服务提供
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { query, transaction } from '../lib/database.js'
import { COMMUNITY_APPLICATION_FILE_URL } from '../lib/opportunity-applications-schema.js'
import { success, created, errors, paginated } from '../utils/response.js'
import type { JwtPayload, OpportunityListQuery } from '../types.js'
import { 
  isVisitor, 
  isAdmin, 
  checkOwnership, 
  applyVisitorLimit 
} from '../plugins/auth.js'

export const opportunitiesRoute: FastifyPluginAsync = async (app: FastifyInstance) => {

  // ============================================
  // GET /api/opportunities - 获取合作机会列表
  // ============================================
  app.get('/api/opportunities', async (request, reply) => {
    const {
      page = '1',
      page_size = '20',
      type,
      city,
      industry,
      keyword,
      featured,
      status,
      sort = 'latest',
    } = request.query as OpportunityListQuery

    const pageNum = parseInt(String(page))
    const limitNum = parseInt(String(page_size))
    const offset = (pageNum - 1) * limitNum

    // 获取当前用户
    const user = request.user as JwtPayload | undefined
    const userIsVisitor = isVisitor(user)

    try {
      const conditions: string[] = []
      const params: unknown[] = []
      let paramIndex = 1

      // 默认只显示已发布的
      if (!status || status === 'published') {
        conditions.push(`o.status = $${paramIndex++}`)
        params.push('published')
      } else if (status) {
        conditions.push(`o.status = $${paramIndex++}`)
        params.push(status)
      }

      // 筛选条件
      if (type) {
        conditions.push(`o.opportunity_type = $${paramIndex++}`)
        params.push(type)
      }

      if (city) {
        conditions.push(`o.location ILIKE $${paramIndex++}`)
        params.push(`%${city}%`)
        paramIndex++
      }

      if (industry) {
        conditions.push(`o.industry ILIKE $${paramIndex++}`)
        params.push(`%${industry}%`)
        paramIndex++
      }

      if (keyword) {
        conditions.push(`(o.title ILIKE $${paramIndex} OR o.summary ILIKE $${paramIndex} OR o.description ILIKE $${paramIndex})`)
        params.push(`%${keyword}%`)
        paramIndex++
      }

      // 精选筛选
      if (featured === 'true') {
        conditions.push(`o.is_featured = true`)
      }

      // 只有登录用户才能看到所有内容，游客受限制
      if (userIsVisitor) {
        // 游客只能看到部分内容
        conditions.push(`o.is_featured = true OR o.created_at > NOW() - INTERVAL '7 days'`)
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      // 排序
      let orderBy = 'o.created_at DESC'
      if (sort === 'popular') {
        orderBy = 'o.view_count DESC, o.application_count DESC'
      } else if (sort === 'deadline') {
        orderBy = 'o.deadline ASC NULLS LAST'
      }

      // 查询总数
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM opportunities o ${whereClause}`,
        params
      )
      let total = parseInt(countResult.rows[0]?.count || '0')

      // 查询列表
      params.push(limitNum, offset)
      const result = await query(
        `SELECT
          o.id,
          o.title,
          o.slug,
          o.summary,
          o.description,
          o.cover_image,
          o.opportunity_type,
          o.category,
          o.industry,
          o.location,
          o.location_type,
          o.budget,
          o.compensation_type,
          o.deadline,
          o.status,
          o.view_count,
          o.application_count,
          o.is_featured,
          o.created_at,
          o.updated_at,
          o.publisher_id,
          o.publisher_role,
          COALESCE(p.display_name, '匿名用户') as publisher_name,
          p.avatar_url as publisher_avatar,
          p.verified as publisher_verified
        FROM opportunities o
        LEFT JOIN profiles p ON p.id = o.publisher_id
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params
      )

      let items = result.rows

      // 对游客应用 50% 限制
      if (userIsVisitor) {
        items = applyVisitorLimit(items, 0.5, true)
        total = Math.ceil(total * 0.5)
      }

      // 标记游客受限
      if (userIsVisitor) {
        reply.header('X-Content-Limited', 'true')
        reply.header('X-Visitor-Limited', 'true')
      }

      return paginated(reply, items, total, pageNum, limitNum)

    } catch (err) {
      console.error('Get opportunities error:', err)
      return errors.internal(reply, '获取合作机会列表失败')
    }
  })

  // ============================================
  // GET /api/opportunities/featured - 获取精选机会
  // ============================================
  app.get('/api/opportunities/featured', async (request, reply) => {
    try {
      const result = await query(
        `SELECT
          o.id,
          o.title,
          o.slug,
          o.summary,
          o.opportunity_type,
          o.location,
          o.budget,
          o.is_featured,
          o.created_at,
          COALESCE(p.display_name, '匿名用户') as publisher_name,
          p.avatar_url as publisher_avatar
        FROM opportunities o
        LEFT JOIN profiles p ON p.id = o.publisher_id
        WHERE o.status = 'published' AND o.is_featured = true
        ORDER BY o.created_at DESC
        LIMIT 10`
      )

      return success(reply, result.rows)

    } catch (err) {
      console.error('Get featured opportunities error:', err)
      return errors.internal(reply, '获取精选机会失败')
    }
  })

  // ============================================
  // GET /api/opportunities/types - 获取机会类型列表
  // ============================================
  app.get('/api/opportunities/types', async (request, reply) => {
    const types = [
      { value: 'job', label: '职位招聘', description: '全职、兼职、实习等职位' },
      { value: 'collaboration', label: '合作意向', description: '寻求合作伙伴' },
      { value: 'project', label: '项目需求', description: '具体项目外包或合作' },
      { value: 'service_offer', label: '服务提供', description: '提供服务或解决方案' },
    ]

    return success(reply, types)
  })

  // ============================================
  // POST /api/opportunities/:id/applications - 合作投递（上传后提交材料）
  // ============================================
  app.post<{ Params: { id: string } }>(
    '/api/opportunities/:id/applications',
    { onRequest: [app.authenticate, app.authorize(['client', 'creator'])] },
    async (request, reply) => {
      const user = request.user as JwtPayload
      const { id } = request.params

      const body = request.body as {
        file_url?: string
        original_name?: string
        message?: string
        uploaded_file_id?: string
      }

      if (!body?.file_url || typeof body.file_url !== 'string') {
        return errors.badRequest(reply, '请先上传投递文件')
      }

      const fileUrlRaw = body.file_url.trim()
      const isTextOnlyQuickApply = fileUrlRaw === COMMUNITY_APPLICATION_FILE_URL

      if (
        !isTextOnlyQuickApply &&
        !fileUrlRaw.startsWith('http://') &&
        !fileUrlRaw.startsWith('https://')
      ) {
        return errors.badRequest(reply, '无效的文件地址')
      }

      const applicantId = user.user_id || user.id
      const originalName =
        typeof body.original_name === 'string' && body.original_name.trim()
          ? body.original_name.trim().slice(0, 500)
          : null
      const message =
        typeof body.message === 'string' && body.message.trim()
          ? body.message.trim().slice(0, 2000)
          : null

      if (isTextOnlyQuickApply && !message) {
        return errors.badRequest(reply, '一键正文投递请填写合作说明')
      }

      const fileUrl = fileUrlRaw
      const rawFileId =
        typeof body.uploaded_file_id === 'string' && body.uploaded_file_id.trim()
          ? body.uploaded_file_id.trim()
          : null
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const uploadedFileIdParam = rawFileId && uuidRe.test(rawFileId) ? rawFileId : null

      try {
        const oppResult = await query<{
          id: string
          publisher_id: string
          title: string
          slug: string
          status: string
        }>(
          `SELECT id, publisher_id, title, slug, status FROM opportunities
           WHERE slug = $1 OR id::text = $1
           LIMIT 1`,
          [id]
        )

        if (oppResult.rows.length === 0) {
          return errors.notFound(reply, '合作机会不存在')
        }

        const opp = oppResult.rows[0]

        if (opp.status !== 'published') {
          return errors.badRequest(reply, '该机会未开放投递')
        }

        if (opp.publisher_id === applicantId) {
          return errors.badRequest(reply, '不能向自己发布的机会投递')
        }

        const applicantName = user.display_name || '用户'

        const result = await transaction(async (client) => {
          const existing = await client.query<{ id: string }>(
            `SELECT id FROM opportunity_applications
             WHERE opportunity_id = $1 AND applicant_id = $2`,
            [opp.id, applicantId]
          )

          let applicationId: string
          let isNew = false

          if (existing.rows.length > 0) {
            applicationId = existing.rows[0].id
            await client.query(
              `UPDATE opportunity_applications
               SET file_url = $1, original_name = $2, message = $3, uploaded_file_id = $4, updated_at = NOW()
               WHERE id = $5`,
              [fileUrl, originalName, message, uploadedFileIdParam, applicationId]
            )
          } else {
            const ins = await client.query<{ id: string }>(
              `INSERT INTO opportunity_applications (
                opportunity_id, applicant_id, file_url, original_name, message, uploaded_file_id
              ) VALUES ($1, $2, $3, $4, $5, $6)
              RETURNING id`,
              [opp.id, applicantId, fileUrl, originalName, message, uploadedFileIdParam]
            )
            applicationId = ins.rows[0].id
            isNew = true
            await client.query(
              `UPDATE opportunities SET application_count = application_count + 1 WHERE id = $1`,
              [opp.id]
            )
          }

          const notifTitle = isNew ? '收到新的合作投递' : '合作投递材料已更新'
          const notifContent = `${applicantName} 在机会「${opp.title}」${isNew ? '提交了' : '更新了'}投递材料。`

          await client.query(
            `INSERT INTO notifications (user_id, notification_type, title, content, data)
             VALUES ($1, 'opportunity_application', $2, $3, $4::jsonb)`,
            [
              opp.publisher_id,
              notifTitle,
              notifContent,
              JSON.stringify({
                opportunity_id: opp.id,
                opportunity_slug: opp.slug,
                application_id: applicationId,
                applicant_id: applicantId,
                file_url: fileUrl,
                link: '/workspace/opportunity-applications',
              }),
            ]
          )

          return { applicationId, isNew }
        })

        return success(
          reply,
          {
            application_id: result.applicationId,
            is_new: result.isNew,
          },
          result.isNew ? '投递成功' : '材料已更新'
        )
      } catch (err) {
        console.error('Opportunity application error:', err)
        return errors.internal(reply, '投递失败，请稍后重试')
      }
    }
  )

  // ============================================
  // GET /api/opportunities/:id - 获取机会详情
  // ============================================
  app.get<{ Params: { id: string } }>('/api/opportunities/:id', async (request, reply) => {
    const { id } = request.params

    // 获取当前用户
    const user = request.user as JwtPayload | undefined
    const userIsVisitor = isVisitor(user)

    try {
      const result = await query(
        `SELECT
          o.id,
          o.title,
          o.slug,
          o.summary,
          o.description,
          o.cover_image,
          o.opportunity_type,
          o.category,
          o.industry,
          o.location,
          o.location_type,
          o.budget,
          o.compensation_type,
          o.contact_email,
          o.contact_wechat,
          o.application_file_requirements,
          o.deadline,
          o.status,
          o.view_count,
          o.application_count,
          o.is_featured,
          o.created_at,
          o.updated_at,
          o.publisher_id,
          o.publisher_role,
          COALESCE(p.display_name, '匿名用户') as publisher_name,
          p.avatar_url as publisher_avatar,
          p.verified as publisher_verified,
          p.bio as publisher_bio
        FROM opportunities o
        LEFT JOIN profiles p ON p.id = o.publisher_id
        WHERE o.id = $1 OR o.slug = $1`,
        [id]
      )

      if (result.rows.length === 0) {
        return errors.notFound(reply, '合作机会不存在')
      }

      const opportunity = result.rows[0]

      // 检查查看权限
      if (opportunity.status !== 'published' && userIsVisitor) {
        return errors.forbidden(reply, '该内容不可见')
      }

      // 对游客隐藏联系方式
      if (userIsVisitor) {
        opportunity.contact_email = null
        opportunity.contact_wechat = null
        reply.header('X-Content-Limited', 'true')
      }

      // 增加浏览次数
      await query(
        `UPDATE opportunities SET view_count = view_count + 1 WHERE id = $1`,
        [opportunity.id]
      )

      return success(reply, opportunity)

    } catch (err) {
      console.error('Get opportunity error:', err)
      return errors.internal(reply, '获取合作机会详情失败')
    }
  })

  // ============================================
  // POST /api/opportunities - 创建合作机会（需登录）
  // ============================================
  app.post('/api/opportunities', {
    onRequest: [app.authenticate, app.authorize(['client', 'creator'])]
  }, async (request, reply) => {
    const user = request.user as JwtPayload

    const {
      title,
      summary,
      description,
      cover_image,
      opportunity_type,
      category,
      industry,
      location,
      location_type,
      budget,
      compensation_type,
      contact_email,
      contact_wechat,
      application_file_requirements,
      deadline,
    } = request.body as {
      title?: string
      summary?: string
      description?: string
      cover_image?: string
      opportunity_type?: string
      category?: string
      industry?: string
      location?: string
      location_type?: string
      budget?: number
      compensation_type?: string
      contact_email?: string
      contact_wechat?: string
      application_file_requirements?: string
      deadline?: string
    }

    if (!title) {
      return errors.badRequest(reply, '标题不能为空')
    }

    if (!opportunity_type || !['job', 'collaboration', 'project', 'service_offer'].includes(opportunity_type)) {
      return errors.badRequest(reply, '无效的机会类型')
    }

    try {
      // 生成 slug
      const slug = `${title.slice(0, 30)}-${Date.now().toString(36)}`

      const result = await query(
        `INSERT INTO opportunities (
          publisher_id, publisher_role, title, slug, summary, description, cover_image,
          opportunity_type, category, industry, location, location_type,
          budget, compensation_type, contact_email, contact_wechat,
          application_file_requirements, deadline, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'published')
        RETURNING *`,
        [
          user.id,
          user.role,
          title,
          slug,
          summary || null,
          description || null,
          cover_image || null,
          opportunity_type,
          category || null,
          industry || null,
          location || null,
          location_type || 'onsite',
          budget || null,
          compensation_type || null,
          contact_email || null,
          contact_wechat || null,
          application_file_requirements?.trim() || null,
          deadline || null,
        ]
      )

      return created(reply, result.rows[0], '合作机会创建成功，已发布')

    } catch (err) {
      console.error('Create opportunity error:', err)
      return errors.internal(reply, '创建合作机会失败')
    }
  })

  // ============================================
  // PATCH /api/opportunities/:id - 更新合作机会
  // ============================================
  app.patch<{ Params: { id: string } }>(
    '/api/opportunities/:id',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const user = request.user as JwtPayload
      const { id } = request.params

      if (isVisitor(user)) {
        return errors.unauthorized(reply, '请先登录')
      }

      const updates = request.body as Record<string, unknown>

      try {
        // 检查权限
        const checkResult = await query<{ publisher_id: string; status: string }>(
          `SELECT publisher_id, status FROM opportunities WHERE id = $1`,
          [id]
        )

        if (checkResult.rows.length === 0) {
          return errors.notFound(reply, '合作机会不存在')
        }

        const opportunity = checkResult.rows[0]
        const ownership = checkOwnership(user, opportunity.publisher_id, 'opportunity')

        if (!ownership.allowed) {
          return errors.forbidden(reply, ownership.reason || '无权限')
        }

        // 构建更新字段
        const allowedFields = [
          'title', 'summary', 'description', 'cover_image',
          'opportunity_type', 'category', 'industry', 'location', 'location_type',
          'budget', 'compensation_type', 'contact_email', 'contact_wechat',
          'application_file_requirements', 'deadline', 'status'
        ]
        const setClauses: string[] = []
        const params: unknown[] = []
        let paramIndex = 1

        for (const [key, value] of Object.entries(updates)) {
          if (allowedFields.includes(key)) {
            setClauses.push(`${key} = $${paramIndex++}`)
            params.push(value)
          }
        }

        if (setClauses.length === 0) {
          return errors.badRequest(reply, '没有有效字段需要更新')
        }

        const requestedStatus = typeof updates.status === 'string' ? String(updates.status) : null
        if (requestedStatus) {
          const allowedByOwner = ['published', 'paused']
          if (!isAdmin(user) && !allowedByOwner.includes(requestedStatus)) {
            return errors.forbidden(reply, '仅可切换岗位为发布中或已下架')
          }
          const allowedGlobal = ['published', 'paused', 'rejected', 'pending_review']
          if (!allowedGlobal.includes(requestedStatus)) {
            return errors.badRequest(reply, '无效的岗位状态')
          }
        }

        setClauses.push(`updated_at = NOW()`)

        params.push(id)
        const result = await query(
          `UPDATE opportunities SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
          params
        )

        return success(reply, result.rows[0], '更新成功')

      } catch (err) {
        console.error('Update opportunity error:', err)
        return errors.internal(reply, '更新合作机会失败')
      }
    }
  )

  // ============================================
  // DELETE /api/opportunities/:id - 删除合作机会
  // ============================================
  app.delete<{ Params: { id: string } }>(
    '/api/opportunities/:id',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const user = request.user as JwtPayload
      const { id } = request.params

      if (isVisitor(user)) {
        return errors.unauthorized(reply, '请先登录')
      }

      try {
        // 检查权限
        const checkResult = await query<{ publisher_id: string }>(
          `SELECT publisher_id FROM opportunities WHERE id = $1`,
          [id]
        )

        if (checkResult.rows.length === 0) {
          return errors.notFound(reply, '合作机会不存在')
        }

        const ownership = checkOwnership(user, checkResult.rows[0].publisher_id, 'opportunity')

        if (!ownership.allowed) {
          return errors.forbidden(reply, ownership.reason || '无权限')
        }

        await query(`DELETE FROM opportunities WHERE id = $1`, [id])

        return success(reply, { id }, '删除成功')

      } catch (err) {
        console.error('Delete opportunity error:', err)
        return errors.internal(reply, '删除合作机会失败')
      }
    }
  )

  // ============================================
  // GET /api/opportunities/my - 获取我发布的合作机会
  // ============================================
  app.get('/api/opportunities/my', {
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
      const conditions: string[] = ['o.publisher_id = $1']
      const publisherId = user.id || user.user_id
      const params: unknown[] = [publisherId]
      let paramIndex = 2

      if (status) {
        conditions.push(`o.status = $${paramIndex++}`)
        params.push(status)
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`

      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM opportunities o ${whereClause}`,
        params
      )
      const total = parseInt(countResult.rows[0]?.count || '0')

      params.push(limitNum, offset)
      const result = await query(
        `SELECT * FROM opportunities o ${whereClause}
         ORDER BY o.created_at DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params
      )

      return paginated(reply, result.rows, total, pageNum, limitNum)

    } catch (err) {
      console.error('Get my opportunities error:', err)
      return errors.internal(reply, '获取我的合作机会失败')
    }
  })
}
