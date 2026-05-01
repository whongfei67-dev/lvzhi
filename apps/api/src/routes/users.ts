import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { query } from '../lib/database.js'
import { success, paginated } from '../utils/response.js'
import type { JwtPayload } from '../types.js'

/** 工作台 PUT 依赖的列：未跑迁移时自动补齐，避免「创作者/认证申请」等保存 500 */
let profileWorkbenchColumnsEnsured = false

async function ensureProfileWorkbenchColumns(): Promise<void> {
  if (profileWorkbenchColumnsEnsured) return
  const stmts = [
    'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()',
    'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname TEXT',
    'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS work_organization TEXT',
    'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_address TEXT',
    'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS creator_application_reason TEXT',
    'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS requested_role TEXT',
    'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status TEXT',
    'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_attachments TEXT',
    'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT',
    'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title TEXT',
    'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS firm TEXT',
    'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS law_firm TEXT',
    'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS practice_years INTEGER',
    'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialty TEXT[] DEFAULT ARRAY[]::text[]',
    'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clients_label TEXT',
    'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consult_price TEXT',
    'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS consult_unit TEXT',
    'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS firm_address TEXT',
    'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS firm_landline TEXT',
    'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cases_json JSONB',
    'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS work_history_json JSONB',
    'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education_detail JSONB',
    'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS articles_json JSONB',
  ]
  for (const sql of stmts) {
    try {
      await query(sql)
    } catch (err) {
      console.warn('[users] ensureProfileWorkbenchColumns skipped:', sql, err)
    }
  }
  profileWorkbenchColumnsEnsured = true
}

async function requireJwtUser(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify()
  } catch {
    await reply.status(401).send({ code: 401, message: '请先登录' })
    return
  }
  const u = request.user as JwtPayload
  if (!u || u.role === 'visitor' || (!u.user_id && !u.id)) {
    await reply.status(401).send({ code: 401, message: '请先登录' })
    return
  }
}

// GET /api/users - 搜索用户（律师）
export async function usersRoutes(fastify: FastifyInstance) {
  // 搜索用户列表
  fastify.get('/api/users', async (request: FastifyRequest, reply: FastifyReply) => {
    const { q, role, page = '1', pageSize = '20' } = request.query as {
      q?: string
      role?: string
      page?: string
      pageSize?: string
    }

    const pageNum = parseInt(page) || 1
    const pageSizeNum = Math.min(parseInt(pageSize) || 20, 100)
    const offset = (pageNum - 1) * pageSizeNum

    try {
      let whereClause = 'WHERE 1=1'
      const params: (string | number)[] = []
      let paramIndex = 1

      if (q) {
        whereClause += ` AND (p.display_name ILIKE $${paramIndex} OR p.bio ILIKE $${paramIndex})`
        params.push(`%${q}%`)
        paramIndex++
      }

      if (role) {
        whereClause += ` AND p.role = $${paramIndex}`
        params.push(role)
        paramIndex++
      }

      // 查询总数（与 auth 一致：主数据在 profiles，无独立 public.users 表）
      const countResult = await query(
        `SELECT COUNT(*)::int as total FROM profiles p
         ${whereClause}`,
        params
      )
      const total = parseInt(String(countResult.rows[0].total), 10)

      // 查询用户列表
      const usersParams = [...params, pageSizeNum, offset]
      const result = await query(
        `SELECT
           p.id,
           p.email,
           p.role,
           p.verified,
           p.created_at,
           p.display_name,
           p.avatar_url,
           p.bio,
           p.follower_count,
           p.following_count,
           COALESCE((SELECT COUNT(*) FROM agents a WHERE a.creator_id = p.id AND a.status = 'active'), 0) as agent_count
         FROM profiles p
         ${whereClause}
         ORDER BY COALESCE(p.follower_count, 0) DESC NULLS LAST, p.created_at DESC NULLS LAST
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        usersParams
      )

      return paginated(reply, result.rows, total, pageNum, pageSizeNum)
    } catch (error) {
      console.error('Search users error:', error)
      return reply.status(500).send({ code: 500, message: '搜索用户失败' })
    }
  })

  // 必须在 /api/users/:id 之前注册，否则 "lawyers" 会被当成 id
  fastify.get('/api/users/lawyers/top', async (request: FastifyRequest, reply: FastifyReply) => {
    const { region = '全国', domain = 'all', limit = '5' } = request.query as {
      region?: string
      domain?: string
      limit?: string
    }

    const limitNum = Math.min(parseInt(limit) || 5, 20)

    try {
      const fullTop = `SELECT
           p.id,
           p.role,
           p.verified,
           p.display_name,
           p.avatar_url,
           p.bio,
           COALESCE(p.follower_count, 0) as follower_count,
           COALESCE(p.is_verified, false) as is_verified,
           COALESCE((SELECT COUNT(*) FROM agents a WHERE a.creator_id = p.id AND a.status = 'active'), 0) as agent_count
         FROM profiles p
         WHERE p.role IN ('creator', 'admin')
           AND (COALESCE(p.is_verified, false) = true OR COALESCE(p.follower_count, 0) > 0)
           AND COALESCE(p.is_banned, false) IS NOT TRUE
           AND (p.status IS NULL OR p.status = 'active')
         ORDER BY COALESCE(p.follower_count, 0) DESC NULLS LAST
         LIMIT $1`
      const simpleTop = `SELECT
           p.id,
           p.role,
           p.verified,
           p.display_name,
           p.avatar_url,
           p.bio,
           COALESCE(p.follower_count, 0) as follower_count,
           COALESCE(p.is_verified, false) as is_verified,
           COALESCE((SELECT COUNT(*) FROM agents a WHERE a.creator_id = p.id AND a.status = 'active'), 0) as agent_count
         FROM profiles p
         WHERE p.role IN ('creator', 'admin')
         ORDER BY COALESCE(p.follower_count, 0) DESC NULLS LAST
         LIMIT $1`
      let result
      try {
        result = await query(fullTop, [limitNum])
      } catch (e) {
        console.warn('[users] lawyers/top full query failed, retry simple:', e)
        result = await query(simpleTop, [limitNum])
      }

      return success(reply, result.rows as unknown[])
    } catch (error) {
      console.error('Get top lawyers error:', error)
      return reply.status(500).send({ code: 500, message: '获取榜单失败' })
    }
  })

  // 获取单个用户详情
  fastify.get('/api/users/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return reply.status(400).send({ code: 400, message: '无效的用户 ID' })
    }

    try {
      const fullSql = `SELECT
           p.id,
           p.email,
           p.role,
           p.verified,
           p.creator_level,
           p.lawyer_verified,
           p.created_at,
           p.display_name,
           p.phone,
           p.avatar_url,
           p.bio,
           p.city,
           p.title,
           p.firm,
           p.law_firm,
           p.practice_years,
           p.specialty as expertise,
           p.clients_label,
           p.consult_price,
           p.consult_unit,
           p.firm_address,
           p.firm_landline,
           p.cases_json,
           p.work_history_json,
           p.education_detail,
           p.articles_json,
           p.follower_count,
           p.following_count,
           p.is_verified,
           p.is_banned,
           p.banned_until,
           p.banned_reason,
           p.status
         FROM profiles p
         WHERE p.id = $1`
      const minimalSql = `SELECT
           p.id,
           p.email,
           p.role,
           p.verified,
           p.creator_level,
           p.lawyer_verified,
           p.created_at,
           p.display_name,
           p.phone,
           p.avatar_url,
           p.bio,
           p.city,
           p.title,
           p.firm,
           p.law_firm,
           p.practice_years,
           p.specialty as expertise,
           p.clients_label,
           p.consult_price,
           p.consult_unit,
           p.firm_address,
           p.firm_landline,
           p.cases_json,
           p.work_history_json,
           p.education_detail,
           p.articles_json
         FROM profiles p
         WHERE p.id = $1`

      let result
      try {
        result = await query(fullSql, [id])
      } catch (e) {
        console.warn('[users] GET /api/users/:id full profile columns missing, retry minimal:', e)
        result = await query(minimalSql, [id])
      }

      if (result.rows.length === 0) {
        return reply.status(404).send({ code: 404, message: '用户不存在' })
      }

      // 获取该用户的智能体
      let agentsRows: unknown[] = []
      try {
        const agentsResult = await query(
          `SELECT id, name, description, category, price, status, view_count, favorite_count, rating
           FROM agents
           WHERE creator_id = $1 AND status = 'active'
           ORDER BY view_count DESC
           LIMIT 10`,
          [id]
        )
        agentsRows = agentsResult.rows
      } catch (e) {
        // 兼容 agents 表列不齐（如 rating/favorite_count 未迁移）
        console.warn('[users] agents full query failed, fallback to minimal:', e)
        try {
          const agentsFallback = await query(
            `SELECT id, name, description, category, price, status, view_count
             FROM agents
             WHERE creator_id = $1 AND status = 'active'
             ORDER BY view_count DESC
             LIMIT 10`,
            [id]
          )
          agentsRows = agentsFallback.rows
        } catch (e2) {
          console.warn('[users] agents fallback query failed, continue without agents:', e2)
          agentsRows = []
        }
      }

      const user = result.rows[0]
      let workbenchExtras: Record<string, string | null> = {}
      try {
        const ex = await query<{
          nickname: string | null
          work_organization: string | null
          contact_address: string | null
          verification_attachments: string | null
        }>(
          'SELECT nickname, work_organization, contact_address, verification_attachments FROM profiles WHERE id = $1',
          [id]
        )
        if (ex.rows[0]) workbenchExtras = ex.rows[0] as Record<string, string | null>
      } catch {
        try {
          const ex2 = await query<{
            nickname: string | null
            work_organization: string | null
            contact_address: string | null
          }>('SELECT nickname, work_organization, contact_address FROM profiles WHERE id = $1', [id])
          if (ex2.rows[0]) workbenchExtras = ex2.rows[0] as Record<string, string | null>
        } catch {
          /* 忽略 */
        }
      }

      return success(reply, {
        ...user,
        ...workbenchExtras,
        agents: agentsRows,
      } as Record<string, unknown>)
    } catch (error) {
      console.error('Get user error:', error)
      return reply.status(500).send({ code: 500, message: '获取用户信息失败' })
    }
  })

  // 当前用户更新本人资料（工作台个人资料、创作者/律师认证申请等）
  fastify.put(
    '/api/users/:id',
    { preHandler: [requireJwtUser] },
    async (request: FastifyRequest<{ Params: { id: string }; Body: Record<string, unknown> }>, reply: FastifyReply) => {
    if (reply.sent) return
    const jwt = request.user as JwtPayload
    const selfId = String(jwt.user_id || jwt.id || '')
    const { id } = request.params
    if (!selfId || id !== selfId) {
      return reply.status(403).send({ code: 403, message: '只能编辑本人资料' })
    }

    await ensureProfileWorkbenchColumns()

    const body = (request.body || {}) as Record<string, unknown>
    const allowed = [
      'display_name',
      'bio',
      'phone',
      'nickname',
      'work_organization',
      'contact_address',
      'creator_application_reason',
      'requested_role',
      'verification_status',
      'verification_attachments',
      'city',
      'title',
      'firm',
      'law_firm',
      'practice_years',
      'expertise',
      'clients_label',
      'consult_price',
      'consult_unit',
      'firm_address',
      'firm_landline',
      'cases_json',
      'work_history_json',
      'education_detail',
      'articles_json',
    ] as const

    const sets: string[] = []
    const vals: unknown[] = []
    let i = 1
    for (const key of allowed) {
      if (!Object.prototype.hasOwnProperty.call(body, key)) continue
      const raw = body[key]
      let v: string | null
      if (key === 'expertise') {
        if (raw === null || raw === undefined) {
          sets.push(`specialty = $${i++}`)
          vals.push([])
        } else if (Array.isArray(raw)) {
          const list = raw.map((x) => String(x).trim()).filter(Boolean)
          sets.push(`specialty = $${i++}`)
          vals.push(list)
        } else {
          const list = String(raw)
            .split(/[,，、]/)
            .map((s) => s.trim())
            .filter(Boolean)
          sets.push(`specialty = $${i++}`)
          vals.push(list)
        }
        continue
      }
      if (raw === null || raw === undefined) {
        v = null
      } else if ((key === 'verification_attachments' || key === 'cases_json' || key === 'work_history_json' || key === 'education_detail' || key === 'articles_json') && typeof raw === 'object') {
        v = JSON.stringify(raw)
      } else if (key === 'practice_years') {
        const n = Number(raw)
        v = Number.isFinite(n) ? String(Math.max(0, Math.floor(n))) : null
      } else {
        v = String(raw)
      }
      sets.push(`${key} = $${i++}`)
      vals.push(v)
    }

    if (sets.length === 0) {
      return success(reply, { updated: false } as Record<string, unknown>)
    }

    try {
      sets.push('updated_at = NOW()')
      vals.push(selfId)
      const sql = `UPDATE profiles SET ${sets.join(', ')} WHERE id = $${i}`
      await query(sql, vals)
      return success(reply, { updated: true } as Record<string, unknown>)
    } catch (error) {
      console.error('Update user profile error:', error)
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.includes('updated_at')) {
        try {
          const setsNoTs = sets.filter((s) => !s.includes('updated_at'))
          const valsNoTs = vals.slice(0, -1)
          const j = valsNoTs.length + 1
          valsNoTs.push(selfId)
          const sql2 = `UPDATE profiles SET ${setsNoTs.join(', ')} WHERE id = $${j}`
          await query(sql2, valsNoTs)
          return success(reply, { updated: true } as Record<string, unknown>)
        } catch (e2) {
          console.error('Update user profile retry error:', e2)
        }
      }
      return reply.status(500).send({ code: 500, message: '更新资料失败' })
    }
  },
  )

  // 关注/取消关注用户
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fastify.post('/api/users/:id/follow', {
    preHandler: [(fastify as any).authenticate],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const currentUserId = request.user.id
    const { id: targetUserId } = request.params
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId)) {
      return reply.status(400).send({ code: 400, message: '无效的用户 ID' })
    }

    if (currentUserId === targetUserId) {
      return reply.status(400).send({ code: 400, message: '不能关注自己' })
    }

    try {
      // 检查是否已关注
      const existingResult = await query(
        'SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2',
        [currentUserId, targetUserId]
      )

      if (existingResult.rows.length > 0) {
        // 取消关注
        await query(
          'DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2',
          [currentUserId, targetUserId]
        )
        await query(
          'UPDATE profiles SET following_count = following_count - 1 WHERE id = $1',
          [currentUserId]
        )
        await query(
          'UPDATE profiles SET follower_count = follower_count - 1 WHERE id = $1',
          [targetUserId]
        )
        return success(reply, { is_following: false } as Record<string, unknown>)
      } else {
        // 添加关注
        await query(
          'INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2)',
          [currentUserId, targetUserId]
        )
        await query(
          'UPDATE profiles SET following_count = following_count + 1 WHERE id = $1',
          [currentUserId]
        )
        await query(
          'UPDATE profiles SET follower_count = follower_count + 1 WHERE id = $1',
          [targetUserId]
        )
        return success(reply, { is_following: true } as Record<string, unknown>)
      }
    } catch (error) {
      console.error('Follow user error:', error)
      return reply.status(500).send({ code: 500, message: '操作失败' })
    }
  })

  // 获取当前用户对目标用户的关注状态
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fastify.get('/api/users/:id/follow-status', {
    preHandler: [(fastify as any).authenticate],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const currentUserId = request.user.id
    const { id: targetUserId } = request.params
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId)) {
      return reply.status(400).send({ code: 400, message: '无效的用户 ID' })
    }

    try {
      const result = await query<{ id: string }>(
        'SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2 LIMIT 1',
        [currentUserId, targetUserId]
      )
      return success(reply, {
        is_following: result.rows.length > 0,
      } as Record<string, unknown>)
    } catch (error) {
      console.error('Get follow status error:', error)
      return reply.status(500).send({ code: 500, message: '获取关注状态失败' })
    }
  })

  // 获取某用户的粉丝列表（本人或管理员可见）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fastify.get('/api/users/:id/followers', {
    preHandler: [(fastify as any).authenticate],
  }, async (request: FastifyRequest<{ Params: { id: string }; Querystring: { page?: string; pageSize?: string } }>, reply: FastifyReply) => {
    const currentUserId = request.user.id
    const currentRole = String(request.user.role || '')
    const { id: targetUserId } = request.params
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId)) {
      return reply.status(400).send({ code: 400, message: '无效的用户 ID' })
    }
    const { page = '1', pageSize = '20' } = request.query
    const pageNum = Math.max(parseInt(page, 10) || 1, 1)
    const pageSizeNum = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100)
    const offset = (pageNum - 1) * pageSizeNum
    const canRead =
      currentUserId === targetUserId || currentRole === 'admin' || currentRole === 'superadmin'
    if (!canRead) {
      return reply.status(403).send({ code: 403, message: '无权查看他人的粉丝列表' })
    }

    try {
      const [countResult, listResult] = await Promise.all([
        query<{ total: string }>(
          'SELECT COUNT(*)::text AS total FROM user_follows WHERE following_id = $1',
          [targetUserId]
        ),
        query<{
          follower_id: string
          display_name: string | null
          email: string | null
          avatar_url: string | null
          role: string | null
          lawyer_verified: boolean | null
          creator_level: string | null
          followed_at: string
        }>(
          `SELECT
             uf.follower_id::text AS follower_id,
             p.display_name,
             p.email,
             p.avatar_url,
             p.role,
             p.lawyer_verified,
             p.creator_level,
             uf.created_at::text AS followed_at
           FROM user_follows uf
           LEFT JOIN profiles p ON p.id = uf.follower_id
           WHERE uf.following_id = $1
           ORDER BY uf.created_at DESC
           LIMIT $2 OFFSET $3`,
          [targetUserId, pageSizeNum, offset]
        ),
      ])

      return success(reply, {
        page: pageNum,
        pageSize: pageSizeNum,
        total: parseInt(String(countResult.rows[0]?.total || '0'), 10),
        items: listResult.rows,
      } as Record<string, unknown>)
    } catch (error) {
      console.error('Get followers list error:', error)
      return reply.status(500).send({ code: 500, message: '获取粉丝列表失败' })
    }
  })

  // 获取某用户关注的人列表（本人或管理员可见）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fastify.get('/api/users/:id/following', {
    preHandler: [(fastify as any).authenticate],
  }, async (request: FastifyRequest<{ Params: { id: string }; Querystring: { page?: string; pageSize?: string } }>, reply: FastifyReply) => {
    const currentUserId = request.user.id
    const currentRole = String(request.user.role || '')
    const { id: targetUserId } = request.params
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId)) {
      return reply.status(400).send({ code: 400, message: '无效的用户 ID' })
    }
    const { page = '1', pageSize = '20' } = request.query
    const pageNum = Math.max(parseInt(page, 10) || 1, 1)
    const pageSizeNum = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100)
    const offset = (pageNum - 1) * pageSizeNum
    const canRead =
      currentUserId === targetUserId || currentRole === 'admin' || currentRole === 'superadmin'
    if (!canRead) {
      return reply.status(403).send({ code: 403, message: '无权查看他人的关注列表' })
    }

    try {
      const [countResult, listResult] = await Promise.all([
        query<{ total: string }>(
          'SELECT COUNT(*)::text AS total FROM user_follows WHERE follower_id = $1',
          [targetUserId]
        ),
        query<{
          following_id: string
          display_name: string | null
          email: string | null
          avatar_url: string | null
          role: string | null
          lawyer_verified: boolean | null
          creator_level: string | null
          followed_at: string
        }>(
          `SELECT
             uf.following_id::text AS following_id,
             p.display_name,
             p.email,
             p.avatar_url,
             p.role,
             p.lawyer_verified,
             p.creator_level,
             uf.created_at::text AS followed_at
           FROM user_follows uf
           LEFT JOIN profiles p ON p.id = uf.following_id
           WHERE uf.follower_id = $1
           ORDER BY uf.created_at DESC
           LIMIT $2 OFFSET $3`,
          [targetUserId, pageSizeNum, offset]
        ),
      ])

      return success(reply, {
        page: pageNum,
        pageSize: pageSizeNum,
        total: parseInt(String(countResult.rows[0]?.total || '0'), 10),
        items: listResult.rows,
      } as Record<string, unknown>)
    } catch (error) {
      console.error('Get following list error:', error)
      return reply.status(500).send({ code: 500, message: '获取关注列表失败' })
    }
  })
}
