/**
 * 阿里云 PolarDB 数据库连接
 * 
 * 支持两种模式：
 * 1. 直接连接（使用 DATABASE_URL）
 * 2. 独立配置（分别配置各参数）
 */

import pg from 'pg';

const { Pool } = pg;

// 类型别名
type QueryResultRow = pg.QueryResultRow;

// 数据库连接池
let pool: pg.Pool | null = null;

function normalizeDatabaseUrl(raw: string): string {
  return raw.trim().replace(/^["']|["']$/g, '')
}

/**
 * 云数据库连接串常带 sslmode=require；部分 Node/pg 组合仍会校验服务端证书链，
 * 与「分项配置 + DATABASE_SSL=true」行为对齐：默认放宽校验，可通过环境变量强制校验。
 */
function sslFromConnectionString(connectionString: string): undefined | { rejectUnauthorized: boolean } {
  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true') {
    return { rejectUnauthorized: true }
  }
  if (/\bsslmode\s*=\s*(require|verify-ca|verify-full|prefer)\b/i.test(connectionString)) {
    return { rejectUnauthorized: false }
  }
  if (/\bssl\s*=\s*true\b/i.test(connectionString)) {
    return { rejectUnauthorized: false }
  }
  return undefined
}

/** 连接串里的 sslmode 会驱动 libpq 语义；去掉后由 Pool.ssl 统一控制（云库自签证书场景） */
function connectionStringWithoutSslmode(connectionString: string): string {
  try {
    const u = new URL(connectionString.replace(/^postgresql:/i, 'http:'))
    u.searchParams.delete('sslmode')
    const q = u.searchParams.toString()
    const user = u.username ? decodeURIComponent(u.username) : ''
    const pass = u.password ? decodeURIComponent(u.password) : ''
    const auth = user ? `${encodeURIComponent(user)}:${encodeURIComponent(pass)}@` : ''
    const hostWithPort = u.port ? `${u.hostname}:${u.port}` : u.hostname
    const base = `postgresql://${auth}${hostWithPort}${u.pathname}`
    return q ? `${base}?${q}` : base
  } catch {
    return connectionString.replace(/([?&])sslmode=[^&]*/i, '$1').replace(/\?&/, '?').replace(/\?$/, '')
  }
}

/**
 * 获取数据库连接池
 */
export function getPool(): pg.Pool {
  if (!pool) {
    // 支持两种配置方式
    const rawConn = process.env.DATABASE_URL
    const connectionString = rawConn ? normalizeDatabaseUrl(rawConn) : undefined
    
    if (connectionString) {
      const ssl = sslFromConnectionString(connectionString)
      const conn =
        ssl && ssl.rejectUnauthorized === false
          ? connectionStringWithoutSslmode(connectionString)
          : connectionString
      // 方式1: 使用连接字符串
      pool = new Pool({
        connectionString: conn,
        max: parseInt(process.env.DATABASE_POOL_MAX || '10'),
        min: parseInt(process.env.DATABASE_POOL_MIN || '2'),
        idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000'),
        connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '30000'),
        ssl,
      });
    } else {
      // 方式2: 独立参数（禁止内置默认值，避免凭据进入仓库或误连生产）
      const host = process.env.DATABASE_HOST
      const database = process.env.DATABASE_NAME
      const user = process.env.DATABASE_USER
      const password = process.env.DATABASE_PASSWORD ?? ''

      const missing: string[] = []
      if (!host) missing.push('DATABASE_HOST')
      if (!database) missing.push('DATABASE_NAME')
      if (!user) missing.push('DATABASE_USER')

      if (missing.length > 0) {
        throw new Error(
          `[database] 缺少环境变量: ${missing.join(', ')}。请设置 DATABASE_URL，或同时设置上述变量（可选 DATABASE_PASSWORD）。`
        )
      }

      pool = new Pool({
        host,
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        database,
        user,
        password,
        max: parseInt(process.env.DATABASE_POOL_MAX || '10'),
        min: parseInt(process.env.DATABASE_POOL_MIN || '2'),
        idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000'),
        connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '30000'),
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      });
    }

    // 连接池事件
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });

    pool.on('connect', () => {
      console.log('New database connection established');
    });
  }

  return pool;
}

/**
 * 执行查询
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string, 
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  const dbPool = getPool();
  const start = Date.now();
  
  try {
    const result = await dbPool.query<T>(text, params);
    const duration = Date.now() - start;
    
    // 开发环境打印慢查询
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.log(`Slow query (${duration}ms):`, text.substring(0, 100));
    }
    
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * 执行事务
 */
export async function transaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const dbPool = getPool();
  const client = await dbPool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 健康检查
 */
export async function healthCheck(): Promise<{
  status: 'ok' | 'error';
  latency?: number;
  error?: string;
}> {
  const start = Date.now();
  
  try {
    const result = await query<{ health: number }>('SELECT 1 as health');
    const latency = Date.now() - start;
    
    return {
      status: result.rows[0]?.health === 1 ? 'ok' : 'error',
      latency,
    };
  } catch (error) {
    return {
      status: 'error',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 关闭连接池
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database pool closed');
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database pool...');
  await closePool();
  process.exit(0);
});
