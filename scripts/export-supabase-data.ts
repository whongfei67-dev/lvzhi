/**
 * Supabase 数据导出脚本
 *
 * 用于导出 Supabase 中的用户数据和文件列表
 * 为迁移到新系统做准备
 *
 * 使用方法：
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_KEY=your_service_role_key \
 *   npx tsx scripts/export-supabase-data.ts
 */

import crypto from 'crypto'

// ============================================
// 配置
// ============================================

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

const OUTPUT_DIR = process.env.OUTPUT_DIR || './migration-data'

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}

function log(type: 'info' | 'success' | 'warn' | 'error', message: string) {
  const prefix = {
    info: `${colors.blue}ℹ${colors.reset}`,
    success: `${colors.green}✓${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
  }[type]
  console.log(`${prefix} ${message}`)
}

// ============================================
// Supabase API 请求
// ============================================

async function supabaseRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<unknown> {
  const response = await fetch(`${SUPABASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`Supabase API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// ============================================
// 数据导出函数
// ============================================

async function exportUsers(): Promise<void> {
  log('info', '导出用户数据...')

  try {
    // 导出 auth.users
    const users = await supabaseRequest('/auth/v1/admin/users')

    const userData = (users as { users: unknown[] }).users.map((user: Record<string, unknown>) => ({
      id: user.id,
      email: user.email,
      phone: user.phone,
      created_at: user.created_at,
      updated_at: user.updated_at,
      email_confirmed_at: user.email_confirmed_at,
      phone_confirmed_at: user.phone_confirmed_at,
      last_sign_in_at: user.last_sign_in_at,
      role: user.role,
      raw_user_meta_data: user.raw_user_meta_data,
      // 不导出 aud 和 instance_id
    }))

    // 导出 profiles（如果有）
    let profiles: Record<string, unknown>[] = []
    try {
      const profilesResponse = await supabaseRequest('/rest/v1/profiles?select=*')
      profiles = profilesResponse as Record<string, unknown>[]
    } catch {
      log('warn', 'profiles 表不存在或无法访问')
    }

    // 生成用户映射表
    const userMapping = userData.map((user) => ({
      old_id: user.id,
      new_id: crypto.randomUUID(), // 预留新 ID
      email: user.email,
      phone: user.phone,
      created_at: user.created_at,
      has_password: !!(user as { factors?: unknown[] }).factors?.length,
      oauth_provider: (user.raw_user_meta_data as Record<string, unknown>)?.provider || null,
    }))

    console.log(`   用户数量: ${userData.length}`)
    console.log(`   导出路径: ${OUTPUT_DIR}/users.json`)
    console.log(`   映射表: ${OUTPUT_DIR}/user-mapping.json`)

  } catch (error) {
    log('error', `导出用户失败: ${error}`)
  }
}

async function exportStorageFiles(): Promise<void> {
  log('info', '导出 Storage 文件列表...')

  try {
    // 获取所有 buckets
    const buckets = await supabaseRequest('/storage/v1/bucket')

    console.log(`   Buckets: ${(buckets as unknown[]).map((b) => (b as { name: string }).name).join(', ')}`)

    // 遍历每个 bucket 获取文件列表
    for (const bucket of buckets as { id: string; name: string }[]) {
      try {
        const files = await supabaseRequest(
          `/storage/v1/admin/object/list/${bucket.id}`
        )

        const fileList = (files as { name: string; id: string; metadata?: Record<string, unknown> }[]).map((file) => ({
          bucket_id: bucket.id,
          bucket_name: bucket.name,
          file_name: file.name,
          file_id: file.id,
          file_size: file.metadata?.size,
          mime_type: file.metadata?.mimetype,
          created_at: file.metadata?.created_at,
          // 新系统 OSS 路径（预留）
          new_oss_path: `${bucket.name}/${file.name}`,
        }))

        console.log(`   ${bucket.name}: ${fileList.length} 个文件`)

      } catch (error) {
        log('warn', `获取 ${bucket.name} 文件列表失败`)
      }
    }

  } catch (error) {
    log('error', `导出 Storage 失败: ${error}`)
  }
}

async function exportTables(): Promise<void> {
  log('info', '导出数据库表数据...')

  const tables = [
    'agents',
    'community_posts',
    'community_comments',
    'balance_transactions',
    'orders',
  ]

  for (const table of tables) {
    try {
      const data = await supabaseRequest(`/rest/v1/${table}?select=*&limit=10000`)

      log('success', `${table}: ${(data as unknown[]).length} 条记录`)
      console.log(`   导出路径: ${OUTPUT_DIR}/${table}.json`)

    } catch (error) {
      log('warn', `${table} 导出失败`)
    }
  }
}

async function generateMigrationSQL(): Promise<void> {
  log('info', '生成迁移 SQL 模板...')

  const sql = `-- 用户迁移 SQL
-- 此文件由 export-supabase-data.ts 自动生成
-- 执行前请检查数据格式

BEGIN;

-- 1. 导入用户数据
-- 注意：需要先在 Supabase 中导出 CSV，然后使用以下格式导入

-- 临时表存储映射关系
CREATE TEMP TABLE user_id_mapping (
    old_id UUID PRIMARY KEY,
    new_id UUID NOT NULL,
    email TEXT,
    phone TEXT,
    oauth_provider TEXT
);

-- 导入映射数据
\\COPY user_id_mapping(old_id, new_id, email, phone, oauth_provider)
FROM 'user-mapping.csv'
WITH (FORMAT csv, HEADER true);

-- 2. 迁移 profiles 表
INSERT INTO profiles (id, email, phone, display_name, avatar_url, role, created_at, updated_at)
SELECT 
    m.new_id,
    m.email,
    m.phone,
    COALESCE(p.display_name, split_part(m.email, '@', 1)),
    p.avatar_url,
    COALESCE(p.role, 'seeker'),
    p.created_at,
    NOW()
FROM user_id_mapping m
LEFT JOIN supabase_profiles p ON p.user_id = m.old_id;

-- 3. 初始化余额
INSERT INTO balances (user_id, balance, frozen)
SELECT new_id, 0, 0
FROM user_id_mapping;

-- 4. 迁移 OAuth 绑定
UPDATE profiles SET
    wechat_unionid = m.unionid,
    wechat_openid = m.openid
FROM (
    SELECT new_id, (raw_meta->>'provider') as provider,
           raw_meta->>'id' as unionid,
           raw_meta->>'open_id' as openid
    FROM user_id_mapping
    CROSS JOIN LATERAL (
        SELECT jsonb_build_object(
            'provider', 
            (raw_user_meta_data->>'provider'),
            'id',
            (raw_user_meta_data->>'id'),
            'open_id',
            (raw_user_meta_data->>'open_id')
        ) as raw_meta
    ) m
    WHERE m.raw_meta->>'provider' IS NOT NULL
) m
WHERE profiles.id = m.new_id;

COMMIT;

-- 验证迁移结果
SELECT 
    '总用户数' as metric,
    COUNT(*) as value FROM profiles
UNION ALL
SELECT 
    '已绑定邮箱' as metric,
    COUNT(*) as value FROM profiles WHERE email IS NOT NULL
UNION ALL
SELECT 
    '已绑定手机' as metric,
    COUNT(*) as value FROM profiles WHERE phone IS NOT NULL
UNION ALL
SELECT 
    'OAuth 用户' as metric,
    COUNT(*) as value FROM profiles 
    WHERE wechat_unionid IS NOT NULL OR alipay_user_id IS NOT NULL;
`

  console.log(`   SQL 路径: ${OUTPUT_DIR}/migration-template.sql`)
}

// ============================================
// 主函数
// ============================================

async function main() {
  console.log(`
${colors.bold}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   Supabase 数据导出工具                                       ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}
  `)

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    log('error', '请设置环境变量: SUPABASE_URL 和 SUPABASE_SERVICE_KEY')
    console.log('\n示例:')
    console.log('  SUPABASE_URL=https://xxx.supabase.co \\')
    console.log('  SUPABASE_SERVICE_KEY=your_key \\')
    console.log('  npx tsx scripts/export-supabase-data.ts\n')
    process.exit(1)
  }

  log('info', `Supabase URL: ${SUPABASE_URL}`)
  log('info', `输出目录: ${OUTPUT_DIR}\n`)

  try {
    await exportUsers()
    await exportStorageFiles()
    await exportTables()
    await generateMigrationSQL()

    console.log(`\n${colors.green}${colors.bold}导出完成！${colors.reset}\n`)
    console.log('下一步:')
    console.log('  1. 检查导出的数据文件')
    console.log('  2. 根据需要修改映射关系')
    console.log('  3. 运行迁移脚本')

  } catch (error) {
    log('error', `导出失败: ${error}`)
    process.exit(1)
  }
}

main()
