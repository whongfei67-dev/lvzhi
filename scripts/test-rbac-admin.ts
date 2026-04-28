/**
 * 管理后台 RBAC 回归脚本
 *
 * 目标：
 * - 验证管理员接口对 guest/client/admin 的 401/403/200 行为
 * - 验证超管接口对 guest/client/admin/superadmin 的权限边界
 * - 记录环境问题（例如 e2e 超管账号角色不正确）
 *
 * 用法：
 *   API_BASE_URL=http://127.0.0.1:4000 tsx scripts/test-rbac-admin.ts
 */

type RoleKey = 'guest' | 'client' | 'admin' | 'superadmin'

type LoginProfile = {
  email: string
  password: string
}

type CaseDef = {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  body?: unknown
  expected: Partial<Record<RoleKey, number>>
}

type CaseResult = {
  caseId: string
  role: RoleKey
  expected: number | null
  actual: number
  ok: boolean
  message: string
}

type Session = {
  token: string
  role: string
  userId?: string
}

const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:4000'
const TIMEOUT_MS = 30000

const loginProfiles: Record<Exclude<RoleKey, 'guest'>, LoginProfile> = {
  client: {
    email: process.env.CLIENT_EMAIL || 'lvzhi-e2e-client@example.com',
    password: process.env.CLIENT_PASSWORD || 'Test@123456',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'lvzhi-e2e-admin@example.com',
    password: process.env.ADMIN_PASSWORD || 'Test@123456',
  },
  superadmin: {
    email: process.env.SUPERADMIN_EMAIL || 'lvzhi-e2e-superadmin@example.com',
    password: process.env.SUPERADMIN_PASSWORD || 'Test@123456',
  },
}

const adminCases: CaseDef[] = [
  { id: 'admin.users.list', method: 'GET', path: '/api/admin/users?page=1&pageSize=5', expected: { guest: 401, client: 403, admin: 200 } },
  { id: 'admin.actions.list', method: 'GET', path: '/api/admin/actions?limit=5', expected: { guest: 401, client: 403, admin: 200 } },
  { id: 'admin.community.list', method: 'GET', path: '/api/admin/community/posts?page=1&pageSize=5&status=pending', expected: { guest: 401, client: 403, admin: 200 } },
  { id: 'admin.verification.list', method: 'GET', path: '/api/admin/verification/lawyer?page=1&pageSize=5&status=pending', expected: { guest: 401, client: 403, admin: 200 } },
  { id: 'admin.withdrawals.list', method: 'GET', path: '/api/admin/withdrawals?page=1&pageSize=5&status=pending', expected: { guest: 401, client: 403, admin: 200 } },
  { id: 'admin.settlements.list', method: 'GET', path: '/api/admin/settlements?page=1&pageSize=5&status=pending', expected: { guest: 401, client: 403, admin: 200 } },
  { id: 'admin.policies.read', method: 'GET', path: '/api/admin/policies', expected: { guest: 401, client: 403, admin: 200 } },
  { id: 'admin.policies.history', method: 'GET', path: '/api/admin/policies/history?limit=5', expected: { guest: 401, client: 403, admin: 200 } },
  { id: 'admin.stats.read', method: 'GET', path: '/api/admin/stats', expected: { guest: 401, client: 403, admin: 200 } },
]

// 超管接口：对 superadmin 用非法参数触发 400，避免真实策略写入副作用
const superadminCases: CaseDef[] = [
  {
    id: 'superadmin.policy.update.guard',
    method: 'PUT',
    path: '/api/admin/policies/withdraw',
    body: { config: [], reason: 'rbac guard test' },
    expected: { guest: 401, client: 403, admin: 403, superadmin: 400 },
  },
  {
    id: 'superadmin.policy.rollback.guard',
    method: 'POST',
    path: '/api/admin/policies/withdraw/rollback',
    body: { reason: 'rbac guard test' },
    expected: { guest: 401, client: 403, admin: 403, superadmin: 400 },
  },
]

async function request(
  method: string,
  path: string,
  opts: { token?: string; body?: unknown } = {}
): Promise<{ status: number; json: unknown }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const headers: Record<string, string> = {}
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
    if (opts.token) headers.Authorization = `Bearer ${opts.token}`
    const resp = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    })
    const json = await resp.json().catch(() => ({}))
    return { status: resp.status, json }
  } finally {
    clearTimeout(timer)
  }
}

async function login(profile: LoginProfile): Promise<Session | null> {
  const result = await request('POST', '/api/auth/login', { body: profile })
  if (result.status !== 200) return null
  const data = result.json as {
    data?: {
      access_token?: string
      user?: { role?: string; id?: string }
    }
  }
  const token = data?.data?.access_token
  const role = data?.data?.user?.role
  if (!token || !role) return null
  return { token, role, userId: data?.data?.user?.id }
}

function formatSummary(results: CaseResult[]) {
  const total = results.length
  const passed = results.filter((r) => r.ok).length
  const failed = results.filter((r) => !r.ok)
  return { total, passed, failed }
}

async function runCaseForRole(role: RoleKey, session: Session | null, c: CaseDef): Promise<CaseResult> {
  const expected = c.expected[role] ?? null
  const res = await request(c.method, c.path, {
    token: session?.token,
    body: c.body,
  })
  const ok = expected === null ? true : res.status === expected
  return {
    caseId: c.id,
    role,
    expected,
    actual: res.status,
    ok,
    message: ok ? 'ok' : `expected ${expected}, got ${res.status}`,
  }
}

async function main() {
  console.log(`RBAC regression start: ${new Date().toISOString()}`)
  console.log(`API_BASE_URL=${API_BASE_URL}`)

  const issues: string[] = []
  const sessions: Partial<Record<Exclude<RoleKey, 'guest'>, Session | null>> = {}

  for (const key of Object.keys(loginProfiles) as Array<Exclude<RoleKey, 'guest'>>) {
    const profile = loginProfiles[key]
    const session = await login(profile)
    sessions[key] = session
    if (!session) {
      issues.push(`账号登录失败: ${key} (${profile.email})`)
      continue
    }
    if (session.role !== key) {
      issues.push(`账号角色不匹配: ${profile.email} 期望=${key} 实际=${session.role}`)
    }
  }

  const activeRoles: RoleKey[] = ['guest', 'client', 'admin']
  if (sessions.superadmin && sessions.superadmin.role === 'superadmin') {
    activeRoles.push('superadmin')
  } else {
    issues.push('未检测到可用 superadmin 会话，超管正向校验仅做拒绝验证')
  }

  const results: CaseResult[] = []
  for (const c of adminCases) {
    for (const role of ['guest', 'client', 'admin'] as RoleKey[]) {
      const session =
        role === 'guest'
          ? null
          : role === 'client'
            ? (sessions.client ?? null)
            : (sessions.admin ?? null)
      if (role !== 'guest' && !session) continue
      results.push(await runCaseForRole(role, session, c))
    }
  }

  for (const c of superadminCases) {
    for (const role of ['guest', 'client', 'admin', 'superadmin'] as RoleKey[]) {
      if (!activeRoles.includes(role)) continue
      const session =
        role === 'guest'
          ? null
          : role === 'client'
            ? (sessions.client ?? null)
            : role === 'admin'
              ? (sessions.admin ?? null)
              : (sessions.superadmin ?? null)
      if (role !== 'guest' && !session) continue
      results.push(await runCaseForRole(role, session, c))
    }
  }

  const summary = formatSummary(results)
  console.log(`RBAC cases: ${summary.passed}/${summary.total} passed`)
  for (const row of results.filter((r) => !r.ok)) {
    console.log(`FAIL ${row.caseId} [${row.role}] -> ${row.message}`)
  }

  if (issues.length) {
    console.log('Environment issues:')
    for (const issue of issues) console.log(`- ${issue}`)
  }

  if (summary.failed.length > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('RBAC regression crashed:', err)
  process.exit(1)
})
