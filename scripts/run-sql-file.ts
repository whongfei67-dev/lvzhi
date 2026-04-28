/**
 * 在无 psql 时，用 Node pg 执行 .sql 文件（整文件一次提交）。
 *
 * 用法（在项目根目录）：
 *   node --env-file=.env.local --import tsx scripts/run-sql-file.ts supabase/migrations/021_audit_profiles_trigger_fix.sql
 * 或：
 *   DATABASE_URL='postgresql://...' pnpm db:run-sql supabase/migrations/021_audit_profiles_trigger_fix.sql
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

function normalizeDatabaseUrl(raw: string): string {
  return raw.trim().replace(/^["']|["']$/g, "");
}

function poolOptionsFromUrl(connectionString: string): pg.PoolConfig {
  const ssl =
    /\bsslmode\s*=\s*(require|verify-ca|verify-full|prefer)\b/i.test(connectionString) ||
    /\bssl\s*=\s*true\b/i.test(connectionString)
      ? { rejectUnauthorized: false }
      : undefined;

  let conn = connectionString;
  if (ssl) {
    try {
      const u = new URL(connectionString.replace(/^postgresql:/i, "http:"));
      u.searchParams.delete("sslmode");
      const q = u.searchParams.toString();
      const user = u.username ? decodeURIComponent(u.username) : "";
      const pass = u.password ? decodeURIComponent(u.password) : "";
      const auth = user ? `${encodeURIComponent(user)}:${encodeURIComponent(pass)}@` : "";
      const hostWithPort = u.port ? `${u.hostname}:${u.port}` : u.hostname;
      const base = `postgresql://${auth}${hostWithPort}${u.pathname}`;
      conn = q ? `${base}?${q}` : base;
    } catch {
      conn = connectionString.replace(/([?&])sslmode=[^&]*/i, "$1").replace(/\?&/, "?").replace(/\?$/, "");
    }
  }

  return {
    connectionString: conn,
    ssl,
    max: 1,
    connectionTimeoutMillis: 30_000,
  };
}

async function main() {
  const rel = process.argv[2];
  if (!rel) {
    console.error("用法: pnpm db:run-sql <相对或绝对路径.sql>");
    console.error("示例: pnpm db:run-sql supabase/migrations/021_audit_profiles_trigger_fix.sql");
    process.exit(1);
  }

  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    console.error("缺少环境变量 DATABASE_URL。可在项目根执行：");
    console.error("  node --env-file=.env.local --import tsx scripts/run-sql-file.ts " + rel);
    process.exit(1);
  }

  const filePath = path.isAbsolute(rel) ? rel : path.resolve(process.cwd(), rel);
  const sql = await fs.readFile(filePath, "utf8");

  const pool = new pg.Pool(poolOptionsFromUrl(normalizeDatabaseUrl(rawUrl)));
  try {
    await pool.query(sql);
    console.log("执行成功:", filePath);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
