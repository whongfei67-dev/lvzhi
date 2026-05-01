/**
 * 认证律师 (Lawyers) API 路由
 * 
 * 律师发现与榜单模块
 * 重要说明：律师是 creator 的认证状态，不是独立角色
 * - 律师 = creator + lawyer_verified = true 或 creator_level = 'lawyer'
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { randomUUID } from 'crypto'
import { query } from '../lib/database.js'
import { success, created, errors, paginated } from '../utils/response.js'
import type { JwtPayload, LawyerListQuery } from '../types.js'
import { isVisitor, applyVisitorLimit } from '../plugins/auth.js'
import { ensureUserSanctionColumns } from '../utils/user-sanctions.js'

/** 律师详情路由：UUID 按 id；否则按展示名精确匹配（与首页/榜单中文链接一致） */
function isLawyerProfileUuid(slug: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
}

export const lawyersRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
  await ensureUserSanctionColumns()
  let lawyerProfileVisibilityColumnsEnsured = false

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
    } catch (err) {
      console.warn('[lawyers] ensureLawyerProfileVisibilityColumns failed:', err)
    }
    lawyerProfileVisibilityColumnsEnsured = true
  }

  await ensureLawyerProfileVisibilityColumns()
  let lawyerReviewsTableEnsured = false

  async function ensureLawyerReviewsTable(): Promise<void> {
    if (lawyerReviewsTableEnsured) return
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
      await query('CREATE INDEX IF NOT EXISTS idx_lawyer_reviews_lawyer_created ON lawyer_reviews(lawyer_id, created_at DESC)')
      await query('CREATE INDEX IF NOT EXISTS idx_lawyer_reviews_reviewer ON lawyer_reviews(reviewer_id, created_at DESC)')
      await query('ALTER TABLE lawyer_reviews ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false')
      await query('ALTER TABLE lawyer_reviews ADD COLUMN IF NOT EXISTS hidden_reason TEXT')
      await query('ALTER TABLE lawyer_reviews ADD COLUMN IF NOT EXISTS hidden_by UUID REFERENCES profiles(id) ON DELETE SET NULL')
      await query('ALTER TABLE lawyer_reviews ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ')
      await query('CREATE INDEX IF NOT EXISTS idx_lawyer_reviews_hidden_created ON lawyer_reviews(is_hidden, created_at DESC)')
    } catch (err) {
      console.warn('[lawyers] ensureLawyerReviewsTable failed:', err)
    }
    lawyerReviewsTableEnsured = true
  }

  await ensureLawyerReviewsTable()

  async function resolveLawyerIdBySlug(slug: string): Promise<string | null> {
    const byId = isLawyerProfileUuid(slug)
    const result = await query<{ id: string }>(
      `SELECT p.id::text AS id
       FROM profiles p
       WHERE p.role = 'creator'
         AND COALESCE(p.lawyer_profile_visible, true) = true
         AND (${byId ? 'p.id = $1::uuid' : 'p.display_name = $1'})
       LIMIT 1`,
      [slug]
    )
    return result.rows[0]?.id ?? null
  }

  // ============================================
  // GET /api/lawyers - 律师列表
  // ============================================
  app.get('/api/lawyers', async (request, reply) => {
    const {
      page = '1',
      page_size = '20',
      city,
      expertise,
      featured,
      verified,
      search,
      sort = 'rating',
    } = request.query as LawyerListQuery

    const pageNum = parseInt(String(page))
    const limitNum = parseInt(String(page_size))
    const offset = (pageNum - 1) * limitNum

    const user = request.user as JwtPayload | undefined
    const userIsVisitor = isVisitor(user)

    try {
      // 律师 = creator + (lawyer_verified=true 或 creator_level='lawyer')
      const conditions: string[] = [
        "p.role = 'creator'",
        "(p.lawyer_verified = true OR p.creator_level = 'lawyer')",
        "COALESCE(p.lawyer_profile_visible, true) = true"
      ]
      const params: unknown[] = []
      let paramIndex = 1

      if (city) {
        conditions.push(`p.law_firm ILIKE $${paramIndex++}`)
        params.push(`%${city}%`)
      }

      if (expertise) {
        conditions.push(`p.specialty @> ARRAY[$${paramIndex++}::text]`)
        params.push(expertise)
      }

      if (featured === 'true') {
        conditions.push(`(p.lawyer_verified = true AND p.creator_level = 'lawyer')`)
        conditions.push(`COALESCE(p.recommendation_suspended_until, '1970-01-01'::timestamptz) <= NOW()`)
      }

      if (search) {
        conditions.push(`(p.display_name ILIKE $${paramIndex} OR p.law_firm ILIKE $${paramIndex} OR p.bio ILIKE $${paramIndex})`)
        params.push(`%${search}%`)
        paramIndex++
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`

      let orderBy = 'p.verified DESC, p.follower_count DESC'
      if (sort === 'reviews') {
        orderBy = 'p.follower_count DESC'
      } else if (sort === 'activity') {
        orderBy = 'p.created_at DESC'
      }

      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM profiles p ${whereClause}`,
        params
      )
      let total = parseInt(countResult.rows[0]?.count || '0')

      params.push(limitNum, offset)
      const result = await query(
        `SELECT 
          p.id,
          p.display_name as name,
          p.avatar_url as avatar,
          p.law_firm,
          p.law_firm as firm,
          p.specialty as expertise,
          p.bio,
          p.lawyer_verified,
          p.creator_level,
          p.follower_count,
          p.verified,
          p.created_at
        FROM profiles p
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
        params
      )

      let items = result.rows

      if (userIsVisitor) {
        items = applyVisitorLimit(items, 0.5, true)
        total = Math.ceil(total * 0.5)
        reply.header('X-Content-Limited', 'true')
        reply.header('X-Visitor-Limited', 'true')
      }

      return paginated(reply, items, total, pageNum, limitNum)

    } catch (err) {
      console.error('Get lawyers error:', err)
      // 返回空列表而不是错误，让前端可以正常显示
      return paginated(reply, [], 0, pageNum, limitNum)
    }
  })

  // ============================================
  // GET /api/lawyers/featured - 精选律师
  // ============================================
  app.get('/api/lawyers/featured', async (request, reply) => {
    try {
      const result = await query(
        `SELECT 
          p.id,
          p.display_name as name,
          p.avatar_url as avatar,
          p.law_firm,
          p.law_firm as firm,
          p.specialty as expertise,
          p.bio
        FROM profiles p
        WHERE p.role = 'creator' 
          AND (p.lawyer_verified = true OR p.creator_level = 'lawyer')
          AND COALESCE(p.lawyer_profile_visible, true) = true
          AND p.verified = true
          AND COALESCE(p.recommendation_suspended_until, '1970-01-01'::timestamptz) <= NOW()
        ORDER BY p.follower_count DESC
        LIMIT 6`
      )

      return success(reply, result.rows)

    } catch (err) {
      console.error('Get featured lawyers error:', err)
      return success(reply, [])
    }
  })

  // ============================================
  // GET /api/lawyers/rankings - 律师榜单
  // ============================================
  app.get('/api/lawyers/rankings', async (request, reply) => {
    const { type, city, expertise, limit = '20' } = request.query as {
      type?: string
      city?: string
      expertise?: string
      limit?: string
    }

    const limitNum = parseInt(String(limit)) || 20

    try {
      const conditions: string[] = [
        "p.role = 'creator'",
        "(p.lawyer_verified = true OR p.creator_level = 'lawyer')",
        "COALESCE(p.lawyer_profile_visible, true) = true",
        "COALESCE(p.ranking_suspended_until, '1970-01-01'::timestamptz) <= NOW()"
      ]
      const params: unknown[] = []
      let paramIndex = 1

      if (city) {
        conditions.push(`p.law_firm ILIKE $${paramIndex++}`)
        params.push(`%${city}%`)
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`

      const result = await query(
        `SELECT 
          p.id,
          p.display_name as name,
          p.avatar_url as avatar,
          p.law_firm,
          p.law_firm as firm,
          p.specialty as expertise,
          p.follower_count,
          p.verified,
          p.lawyer_verified,
          p.creator_level
        FROM profiles p
        ${whereClause}
        ORDER BY p.follower_count DESC, p.verified DESC
        LIMIT $${paramIndex}`,
        [...params, limitNum]
      )

      return success(reply, result.rows.map((row, index) => ({
        ...row,
        ranking_position: index + 1,
      })))

    } catch (err) {
      console.error('Get lawyers rankings error:', err)
      return success(reply, [])
    }
  })

  // ============================================
  // GET /api/lawyers/cities - 获取城市列表
  // ============================================
  app.get('/api/lawyers/cities', async (request, reply) => {
    try {
      const result = await query(
        `SELECT city, COUNT(*) as count
         FROM profiles p
         WHERE p.role = 'creator' 
           AND (p.lawyer_verified = true OR p.creator_level = 'lawyer')
           AND COALESCE(p.lawyer_profile_visible, true) = true
           AND p.law_firm IS NOT NULL
         GROUP BY city
         ORDER BY count DESC`
      )

      return success(reply, result.rows)

    } catch (err) {
      console.error('Get cities error:', err)
      return success(reply, [])
    }
  })

  // ============================================
  // GET /api/lawyers/expertise - 获取专业领域列表
  // ============================================
  app.get('/api/lawyers/expertise', async (request, reply) => {
    try {
      const result = await query(
        `SELECT DISTINCT unnest(specialty) as expertise, COUNT(*) as count
         FROM profiles p
         WHERE p.role = 'creator' 
           AND (p.lawyer_verified = true OR p.creator_level = 'lawyer')
           AND COALESCE(p.lawyer_profile_visible, true) = true
           AND specialty IS NOT NULL
           AND array_length(specialty, 1) > 0
         GROUP BY unnest(specialty)
         ORDER BY count DESC`
      )

      return success(reply, result.rows)

    } catch (err) {
      console.error('Get expertise error:', err)
      return success(reply, [])
    }
  })

  // ============================================
  // GET /api/lawyers/:slug/reviews - 律师评价列表
  // ============================================
  app.get<{ Params: { slug: string }; Querystring: { page?: string; page_size?: string } }>('/api/lawyers/:slug/reviews', async (request, reply) => {
    const { slug } = request.params
    const { page = '1', page_size = '20' } = request.query
    const pageNum = Math.max(parseInt(String(page), 10) || 1, 1)
    const limitNum = Math.min(Math.max(parseInt(String(page_size), 10) || 20, 1), 100)
    const offset = (pageNum - 1) * limitNum

    try {
      const lawyerId = await resolveLawyerIdBySlug(slug)
      if (!lawyerId) {
        return errors.notFound(reply, '律师不存在')
      }

      const [countResult, listResult] = await Promise.all([
        query<{ count: string }>(
          'SELECT COUNT(*)::text AS count FROM lawyer_reviews WHERE lawyer_id = $1 AND COALESCE(is_hidden, false) = false',
          [lawyerId]
        ),
        query<{
          id: string
          lawyer_id: string
          reviewer_id: string
          reviewer_name: string | null
          reviewer_avatar: string | null
          rating: number
          tags: string[] | null
          content: string
          created_at: string
        }>(
          `SELECT
             lr.id::text AS id,
             lr.lawyer_id::text AS lawyer_id,
             lr.reviewer_id::text AS reviewer_id,
             p.display_name AS reviewer_name,
             p.avatar_url AS reviewer_avatar,
             lr.rating,
             lr.tags,
             lr.content,
             lr.created_at::text AS created_at
           FROM lawyer_reviews lr
           LEFT JOIN profiles p ON p.id = lr.reviewer_id
           WHERE lr.lawyer_id = $1
             AND COALESCE(lr.is_hidden, false) = false
           ORDER BY lr.created_at DESC
           LIMIT $2 OFFSET $3`,
          [lawyerId, limitNum, offset]
        ),
      ])

      const total = parseInt(countResult.rows[0]?.count || '0', 10)
      return paginated(reply, listResult.rows, total, pageNum, limitNum)
    } catch (err) {
      console.error('Get lawyer reviews error:', err)
      return paginated(reply, [], 0, pageNum, limitNum)
    }
  })

  // ============================================
  // POST /api/lawyers/:slug/reviews - 提交律师评价
  // ============================================
  app.post<{ Params: { slug: string }; Body: { rating?: number; tags?: string[]; content?: string } }>(
    '/api/lawyers/:slug/reviews',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { slug } = request.params
      const actor = request.user as JwtPayload
      const reviewerId = String(actor?.user_id || actor?.id || '').trim()
      const body = request.body || {}
      const rating = Math.floor(Number(body.rating))
      const content = String(body.content || '').trim()
      const tags = Array.isArray(body.tags)
        ? body.tags.map((x) => String(x || '').trim()).filter(Boolean).slice(0, 8)
        : []

      if (!reviewerId || reviewerId === 'visitor') {
        return errors.unauthorized(reply, '请先登录')
      }
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return errors.badRequest(reply, '评分范围为 1-5')
      }
      if (content.length < 2 || content.length > 1000) {
        return errors.badRequest(reply, '评价内容长度需在 2-1000 字符之间')
      }

      try {
        const lawyerId = await resolveLawyerIdBySlug(slug)
        if (!lawyerId) {
          return errors.notFound(reply, '律师不存在')
        }
        if (reviewerId === lawyerId) {
          return errors.badRequest(reply, '不能给自己评价')
        }

        const id = randomUUID()
        const result = await query<{
          id: string
          lawyer_id: string
          reviewer_id: string
          rating: number
          tags: string[] | null
          content: string
          created_at: string
          updated_at: string
        }>(
          `INSERT INTO lawyer_reviews (id, lawyer_id, reviewer_id, rating, tags, content)
           VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5::text[], $6)
           ON CONFLICT (lawyer_id, reviewer_id)
           DO UPDATE SET
             rating = EXCLUDED.rating,
             tags = EXCLUDED.tags,
             content = EXCLUDED.content,
             updated_at = NOW()
           RETURNING
             id::text AS id,
             lawyer_id::text AS lawyer_id,
             reviewer_id::text AS reviewer_id,
             rating,
             tags,
             content,
             created_at::text AS created_at,
             updated_at::text AS updated_at`,
          [id, lawyerId, reviewerId, rating, tags, content]
        )

        return created(reply, result.rows[0], '评价已提交')
      } catch (err) {
        console.error('Create lawyer review error:', err)
        return errors.internal(reply, '提交评价失败')
      }
    }
  )

  // ============================================
  // GET /api/lawyers/:slug - 律师详情
  // ============================================
  app.get<{ Params: { slug: string } }>('/api/lawyers/:slug', async (request, reply) => {
    const { slug } = request.params
    const byId = isLawyerProfileUuid(slug)

    const user = request.user as JwtPayload | undefined
    const userIsVisitor = isVisitor(user)

    try {
      const result = await query(
        `SELECT 
          p.id,
          p.display_name as name,
          p.avatar_url as avatar,
          p.law_firm,
          p.law_firm as firm,
          p.title,
          p.specialty as expertise,
          p.bio,
          p.city,
          p.practice_years,
          p.clients_label,
          p.consult_price,
          p.consult_unit,
          p.firm_address,
          p.firm_landline,
          p.cases_json,
          p.work_history_json,
          p.education_detail,
          p.articles_json,
          p.lawyer_verified,
          p.creator_level,
          p.follower_count,
          COALESCE((SELECT ROUND(AVG(lr.rating)::numeric, 1) FROM lawyer_reviews lr WHERE lr.lawyer_id = p.id AND COALESCE(lr.is_hidden, false) = false), 0) AS rating,
          COALESCE((SELECT COUNT(*) FROM lawyer_reviews lr WHERE lr.lawyer_id = p.id AND COALESCE(lr.is_hidden, false) = false), 0) AS review_count,
          p.verified,
          p.created_at
        FROM profiles p
        WHERE p.role = 'creator'
          AND COALESCE(p.lawyer_profile_visible, true) = true
          AND (${byId ? 'p.id = $1::uuid' : 'p.display_name = $1'})`,
        [slug]
      )

      if (result.rows.length === 0) {
        return errors.notFound(reply, '律师不存在')
      }

      let lawyer = result.rows[0]

      // 游客不能看联系方式
      if (userIsVisitor) {
        reply.header('X-Content-Limited', 'true')
      }

      return success(reply, lawyer)

    } catch (err) {
      console.error('Get lawyer detail error:', err)
      return errors.notFound(reply, '律师不存在')
    }
  })

  // ============================================
  // GET /api/lawyers/:id/products - 律师的产品（skills + agents）
  // ============================================
  app.get<{ Params: { id: string } }>('/api/lawyers/:id/products', async (request, reply) => {
    const { id } = request.params
    const { page = '1', page_size = '20' } = request.query as {
      page?: string
      page_size?: string
    }

    const pageNum = parseInt(String(page))
    const limitNum = parseInt(String(page_size))
    const offset = (pageNum - 1) * limitNum

    try {
      // 检查是否是律师
      const profileResult = await query(
        `SELECT id, display_name FROM profiles 
         WHERE id = $1 AND role = 'creator' 
           AND (lawyer_verified = true OR creator_level = 'lawyer')
           AND COALESCE(lawyer_profile_visible, true) = true`,
        [id]
      )

      if (profileResult.rows.length === 0) {
        return errors.notFound(reply, '律师不存在')
      }

      // 查询技能包
      const skillsResult = await query(
        `SELECT 
          'skill' as type,
          id,
          title,
          slug,
          cover_image,
          category,
          tags,
          price_type,
          price,
          download_count,
          rating,
          review_count,
          created_at
        FROM skills
        WHERE creator_id = $1 AND status = 'published'
        ORDER BY download_count DESC`,
        [id]
      )

      // 查询智能体
      const agentsResult = await query(
        `SELECT 
          'agent' as type,
          id,
          name,
          description as title,
          slug,
          avatar_url,
          category,
          tags,
          status,
          view_count,
          rating,
          review_count,
          created_at
        FROM agents
        WHERE creator_id = $1 AND status = 'active'
        ORDER BY view_count DESC`,
        [id]
      )

      // 合并结果
      const allProducts = [...skillsResult.rows, ...agentsResult.rows]
      const total = allProducts.length
      const paginatedProducts = allProducts.slice(offset, offset + limitNum)

      return paginated(reply, paginatedProducts, total, pageNum, limitNum)

    } catch (err) {
      console.error('Get lawyer products error:', err)
      return paginated(reply, [], 0, pageNum, limitNum)
    }
  })
}