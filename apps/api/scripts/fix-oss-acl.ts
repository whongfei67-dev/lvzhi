/**
 * 批量修复 OSS 对象 ACL（public-read）
 *
 * 目标：
 * - uploaded_files.url
 * - profiles.avatar_url
 * - skills.cover_image
 * - agents.avatar_url
 *
 * 用法：
 *   npx tsx scripts/fix-oss-acl.ts
 *   npx tsx scripts/fix-oss-acl.ts --dry-run
 *   npx tsx scripts/fix-oss-acl.ts --limit=200
 */

import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

type Config = {
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  endpoint: string;
  cdnUrl?: string;
  databaseUrl: string;
};

function loadEnv() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const root = path.resolve(__dirname, "../../..");
  dotenv.config({ path: path.join(root, ".env.local") });
  dotenv.config({ path: path.join(root, ".env") });
  dotenv.config({ path: path.join(root, "apps/api/.env") });
}

function getConfig(): Config {
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID || process.env.ALIYUN_OSS_ACCESS_KEY_ID || "";
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET || process.env.ALIYUN_OSS_ACCESS_KEY_SECRET || "";
  const bucket = process.env.OSS_BUCKET || process.env.ALIYUN_OSS_BUCKET || "";
  const endpoint = process.env.OSS_ENDPOINT || process.env.ALIYUN_OSS_ENDPOINT || "";
  const cdnUrl = process.env.OSS_CDN_URL || process.env.ALIYUN_OSS_CDN_URL || "";
  const databaseUrl = String(process.env.DATABASE_URL || "").trim().replace(/^["']|["']$/g, "");

  if (!accessKeyId || !accessKeySecret || !bucket || !endpoint || !databaseUrl) {
    throw new Error("缺少环境变量：OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET / OSS_BUCKET / OSS_ENDPOINT / DATABASE_URL");
  }
  return { accessKeyId, accessKeySecret, bucket, endpoint, cdnUrl: cdnUrl || undefined, databaseUrl };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find((x) => x.startsWith("--limit="));
  const limit = limitArg ? Math.max(1, parseInt(limitArg.slice("--limit=".length), 10) || 0) : 0;
  return { dryRun, limit };
}

function sslFromConnectionString(connectionString: string): undefined | { rejectUnauthorized: boolean } {
  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true") {
    return { rejectUnauthorized: true };
  }
  if (/\bsslmode\s*=\s*(require|verify-ca|verify-full|prefer)\b/i.test(connectionString)) {
    return { rejectUnauthorized: false };
  }
  if (/\bssl\s*=\s*true\b/i.test(connectionString)) {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

function connectionStringWithoutSslmode(connectionString: string): string {
  try {
    const u = new URL(connectionString.replace(/^postgresql:/i, "http:"));
    u.searchParams.delete("sslmode");
    const q = u.searchParams.toString();
    const user = u.username ? decodeURIComponent(u.username) : "";
    const pass = u.password ? decodeURIComponent(u.password) : "";
    const auth = user ? `${encodeURIComponent(user)}:${encodeURIComponent(pass)}@` : "";
    const hostWithPort = u.port ? `${u.hostname}:${u.port}` : u.hostname;
    const base = `postgresql://${auth}${hostWithPort}${u.pathname}`;
    return q ? `${base}?${q}` : base;
  } catch {
    return connectionString.replace(/([?&])sslmode=[^&]*/i, "$1").replace(/\?&/, "?").replace(/\?$/, "");
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return "";
  }
}

function extractObjectKey(url: string, cfg: Config): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("/")) return null;
  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return null;
  }
  const host = u.host.toLowerCase();
  const endpointHost = `${cfg.bucket}.${cfg.endpoint}`.toLowerCase();
  const cdnHost = cfg.cdnUrl ? hostOf(cfg.cdnUrl) : "";
  if (host !== endpointHost && (!cdnHost || host !== cdnHost)) {
    return null;
  }
  const key = u.pathname.replace(/^\/+/, "");
  return key || null;
}

async function readUrls(client: pg.Client, limit: number): Promise<string[]> {
  const sources: Array<{ label: string; sql: string }> = [
    { label: "uploaded_files.url", sql: "SELECT url FROM uploaded_files WHERE url IS NOT NULL AND url <> ''" },
    { label: "profiles.avatar_url", sql: "SELECT avatar_url AS url FROM profiles WHERE avatar_url IS NOT NULL AND avatar_url <> ''" },
    { label: "skills.cover_image", sql: "SELECT cover_image AS url FROM skills WHERE cover_image IS NOT NULL AND cover_image <> ''" },
    { label: "agents.avatar_url", sql: "SELECT avatar_url AS url FROM agents WHERE avatar_url IS NOT NULL AND avatar_url <> ''" },
  ];
  const out = new Set<string>();
  for (const s of sources) {
    try {
      const r = await client.query<{ url: string }>(s.sql);
      for (const row of r.rows) {
        const v = String(row.url || "").trim();
        if (v) out.add(v);
      }
      console.log(`- ${s.label}: ${r.rowCount ?? 0} 条`);
    } catch (err) {
      console.warn(`- ${s.label}: 跳过（${err instanceof Error ? err.message : String(err)}）`);
    }
  }
  const arr = Array.from(out);
  return limit > 0 ? arr.slice(0, limit) : arr;
}

function signAclRequest(cfg: Config, objectKey: string, date: string): string {
  const canonicalHeaders = "x-oss-object-acl:public-read\n";
  const canonicalResource = `/${cfg.bucket}/${objectKey}?acl`;
  const stringToSign = `PUT\n\n\n${date}\n${canonicalHeaders}${canonicalResource}`;
  return crypto.createHmac("sha1", cfg.accessKeySecret).update(stringToSign).digest("base64");
}

async function setPublicRead(cfg: Config, objectKey: string): Promise<void> {
  const date = new Date().toUTCString();
  const signature = signAclRequest(cfg, objectKey, date);
  const url = `https://${cfg.bucket}.${cfg.endpoint}/${objectKey}?acl`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Date: date,
      "x-oss-object-acl": "public-read",
      Authorization: `OSS ${cfg.accessKeyId}:${signature}`,
    },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`OSS ACL 设置失败 ${res.status}: ${txt.slice(0, 180)}`);
  }
}

async function main() {
  loadEnv();
  const cfg = getConfig();
  const { dryRun, limit } = parseArgs();
  const ssl = sslFromConnectionString(cfg.databaseUrl);
  const conn = ssl && ssl.rejectUnauthorized === false ? connectionStringWithoutSslmode(cfg.databaseUrl) : cfg.databaseUrl;
  const client = new pg.Client({ connectionString: conn, ssl });
  await client.connect();
  try {
    console.log("读取 URL 来源...");
    const urls = await readUrls(client, limit);
    const keys = Array.from(
      new Set(
        urls
          .map((u) => extractObjectKey(u, cfg))
          .filter((v): v is string => !!v)
      )
    );
    console.log(`待处理对象: ${keys.length} 个${dryRun ? "（dry-run）" : ""}`);

    let ok = 0;
    let fail = 0;
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i]!;
      if (dryRun) {
        console.log(`[dry-run ${i + 1}/${keys.length}] ${key}`);
        ok += 1;
        continue;
      }
      try {
        await setPublicRead(cfg, key);
        ok += 1;
        if ((i + 1) % 20 === 0 || i === keys.length - 1) {
          console.log(`进度 ${i + 1}/${keys.length}（成功 ${ok}，失败 ${fail}）`);
        }
      } catch (err) {
        fail += 1;
        console.error(`[失败] ${key} -> ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    console.log(`完成：成功 ${ok}，失败 ${fail}`);
    if (fail > 0) process.exitCode = 2;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

