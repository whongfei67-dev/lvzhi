/**
 * 在已运行的 API 上创建（或确认）四角色内测账号：客户 / 创作者 / 管理员 / 超管。
 *
 * 用法（API 默认 http://127.0.0.1:4000）：
 *   pnpm test:accounts
 *
 * 管理员与超管：先以 `client` 身份注册，再在本机连库执行 UPDATE（需 DATABASE_URL，与 API 相同库）。
 *
 * 密码（勿用于生产）：
 *   Test@123456
 * 或环境变量：TEST_ACCOUNT_PASSWORD / TEST_ACCOUNTS_PASSWORD
 */

const API_BASE_URL = (process.env.API_BASE_URL || "http://127.0.0.1:4000").replace(/\/$/, "");

const REQUEST_ORIGIN =
  process.env.TEST_ACCOUNTS_ORIGIN || process.env.WEB_URL?.split(",")[0]?.trim() || "http://localhost:3000";

const PASSWORD =
  process.env.TEST_ACCOUNT_PASSWORD || process.env.TEST_ACCOUNTS_PASSWORD || "Test@123456";

type TargetRole = "client" | "creator" | "admin" | "superadmin";

const ACCOUNTS: { email: string; display_name: string; targetRole: TargetRole }[] = [
  { email: "lvzhi-e2e-client@example.com", display_name: "E2E 客户", targetRole: "client" },
  { email: "lvzhi-e2e-creator@example.com", display_name: "E2E 创作者", targetRole: "creator" },
  { email: "lvzhi-e2e-admin@example.com", display_name: "E2E 管理员", targetRole: "admin" },
  { email: "lvzhi-e2e-superadmin@example.com", display_name: "E2E 超管", targetRole: "superadmin" },
];

async function register(body: Record<string, unknown>): Promise<{ ok: boolean; status: number; text: string }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: REQUEST_ORIGIN,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

async function login(email: string, password: string): Promise<{ ok: boolean; status: number; text: string }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: REQUEST_ORIGIN,
    },
    body: JSON.stringify({ email, password }),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

function parseRole(text: string): string | null {
  try {
    const j = JSON.parse(text) as { data?: { user?: { role?: string } } };
    return j.data?.user?.role ?? null;
  } catch {
    return null;
  }
}

/** 公开注册仅允许 client/creator；admin/superadmin 先注册为 client */
function registerPayload(acc: (typeof ACCOUNTS)[0]) {
  const role = acc.targetRole === "creator" ? "creator" : "client";
  return {
    email: acc.email,
    password: PASSWORD,
    display_name: acc.display_name,
    role,
  };
}

async function elevateAdminRolesInDb(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    console.warn(
      "\n[DB] 未设置 DATABASE_URL，跳过将管理员/超管写回数据库。请配置与 API 相同的连接串后重新执行本脚本，或手动 SQL：\n" +
        "  UPDATE profiles SET role = 'admin' WHERE email = 'lvzhi-e2e-admin@example.com';\n" +
        "  UPDATE profiles SET role = 'superadmin' WHERE email = 'lvzhi-e2e-superadmin@example.com';\n",
    );
    return;
  }

  try {
    const { query } = await import("../apps/api/src/lib/database.js");
    for (const acc of ACCOUNTS) {
      if (acc.targetRole !== "admin" && acc.targetRole !== "superadmin") continue;
      const r = await query(`UPDATE profiles SET role = $1::text WHERE email = $2`, [acc.targetRole, acc.email]);
      if (r.rowCount === 0) {
        console.warn(`[DB] 未找到邮箱 ${acc.email}，无法设置 role=${acc.targetRole}（请先完成注册）`);
      } else {
        console.log(`[DB] ${acc.email} → role=${acc.targetRole}`);
      }
    }
  } catch (e) {
    console.warn("[DB] 写库失败（检查 DATABASE_URL 与迁移是否已执行）:", e instanceof Error ? e.message : e);
  }
}

async function main() {
  const health = await fetch(`${API_BASE_URL}/health`).catch(() => null);
  if (!health?.ok) {
    console.error(`无法连接 API：${API_BASE_URL}（请先启动 api 服务）`);
    process.exit(1);
  }

  for (const acc of ACCOUNTS) {
    const reg = await register(registerPayload(acc));

    if (reg.ok) {
      const role = parseRole(reg.text) || registerPayload(acc).role;
      console.log(`[创建] ${acc.email} → 注册角色=${role}（目标=${acc.targetRole}）`);
      continue;
    }

    if (reg.status === 409) {
      const log = await login(acc.email, PASSWORD);
      if (!log.ok) {
        console.error(`[跳过] ${acc.email} 已存在但密码不匹配或无法登录（status=${log.status}）`);
        continue;
      }
      const role = parseRole(log.text);
      console.log(`[已存在] ${acc.email} 可登录 → role=${role ?? "?"}`);
      continue;
    }

    console.error(`[失败] ${acc.email} status=${reg.status} body=${reg.text.slice(0, 500)}`);
  }

  await elevateAdminRolesInDb();

  console.log("\n── 四角色内测账号（邮箱 / 密码）──");
  console.log(`密码（统一）: ${PASSWORD}`);
  for (const acc of ACCOUNTS) {
    const home =
      acc.targetRole === "creator"
        ? "/creator"
        : acc.targetRole === "admin" || acc.targetRole === "superadmin"
          ? "/admin"
          : "/workspace";
    console.log(`  [${acc.targetRole}] ${acc.email}  →  ${home}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
