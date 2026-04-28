import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

let envFileCache: Record<string, string> | null = null;

function loadEnvFileFallback(): Record<string, string> {
  if (envFileCache) return envFileCache;
  const files = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), "../.env.local"),
    path.resolve(process.cwd(), "../../.env.local"),
    path.resolve(process.cwd(), "apps/api/.env"),
    path.resolve(process.cwd(), "../apps/api/.env"),
    path.resolve(process.cwd(), "../../apps/api/.env"),
  ];
  const map: Record<string, string> = {};
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const s = line.trim();
      if (!s || s.startsWith("#")) continue;
      const idx = s.indexOf("=");
      if (idx <= 0) continue;
      const k = s.slice(0, idx).trim();
      const v = s.slice(idx + 1).trim();
      if (!k || map[k] !== undefined) continue;
      map[k] = v.replace(/^['"]|['"]$/g, "");
    }
  }
  envFileCache = map;
  return map;
}

function readEnv(key: string): string {
  const direct = process.env[key];
  if (direct && direct.trim()) return direct.trim();
  return loadEnvFileFallback()[key]?.trim() || "";
}

function configuredOssEndpointHost(): string {
  const endpoint = readEnv("NEXT_PUBLIC_OSS_ENDPOINT") || readEnv("OSS_ENDPOINT") || readEnv("ALIYUN_OSS_ENDPOINT");
  const bucket = readEnv("NEXT_PUBLIC_OSS_BUCKET") || readEnv("OSS_BUCKET") || readEnv("ALIYUN_OSS_BUCKET");
  if (!endpoint || !bucket) return "";
  return `${bucket}.${endpoint}`.toLowerCase();
}

function configuredOssEndpoint(): string {
  return (readEnv("NEXT_PUBLIC_OSS_ENDPOINT") || readEnv("OSS_ENDPOINT") || readEnv("ALIYUN_OSS_ENDPOINT")).toLowerCase();
}

function configuredOssBucket(): string {
  return (readEnv("NEXT_PUBLIC_OSS_BUCKET") || readEnv("OSS_BUCKET") || readEnv("ALIYUN_OSS_BUCKET")).toLowerCase();
}

function configuredOssAccessKeyId(): string {
  return readEnv("OSS_ACCESS_KEY_ID") || readEnv("ALIYUN_OSS_ACCESS_KEY_ID");
}

function configuredOssAccessKeySecret(): string {
  return readEnv("OSS_ACCESS_KEY_SECRET") || readEnv("ALIYUN_OSS_ACCESS_KEY_SECRET");
}

function configuredCdnHost(): string {
  const raw = readEnv("NEXT_PUBLIC_OSS_CDN_URL") || readEnv("OSS_CDN_URL") || readEnv("ALIYUN_OSS_CDN_URL");
  if (!raw) return "";
  try {
    return new URL(raw).host.toLowerCase();
  } catch {
    return "";
  }
}

function isAliyunOssHost(host: string): boolean {
  const h = host.toLowerCase();
  return h === "aliyuncs.com" || h.endsWith(".aliyuncs.com");
}

function isAllowedRemoteHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  const endpointHost = configuredOssEndpointHost();
  const cdnHost = configuredCdnHost();
  return Boolean((endpointHost && host === endpointHost) || (cdnHost && host === cdnHost) || isAliyunOssHost(host));
}

function pickRequestOrigin(req: NextRequest): string {
  const explicit = process.env.WEB_URL?.split(",")[0]?.trim();
  return explicit || req.nextUrl.origin || "http://localhost:3000";
}

function signedOssGetHeaders(target: URL): Record<string, string> | null {
  const fromHost = (() => {
    const h = target.host.toLowerCase();
    const m = h.match(/^([^.]+)\.(oss-[^.]+\.aliyuncs\.com)$/);
    if (!m) return null;
    return { bucket: m[1], endpoint: m[2] };
  })();

  const bucket = configuredOssBucket() || fromHost?.bucket || "";
  const endpoint = configuredOssEndpoint() || fromHost?.endpoint || "";
  const keyId = configuredOssAccessKeyId();
  const keySecret = configuredOssAccessKeySecret();
  if (!bucket || !endpoint || !keyId || !keySecret) return null;
  const expectedHost = `${bucket}.${endpoint}`;
  if (target.host.toLowerCase() !== expectedHost) return null;

  const date = new Date().toUTCString();
  const canonicalPath = target.pathname || "/";
  const canonicalString = `GET\n\n\n${date}\n/${bucket}${canonicalPath}`;
  const signature = crypto.createHmac("sha1", keySecret).update(canonicalString).digest("base64");

  return {
    Authorization: `OSS ${keyId}:${signature}`,
    Date: date,
  };
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url")?.trim() || "";
  if (!raw) {
    return NextResponse.json({ message: "Missing media url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ message: "Invalid media url" }, { status: 400 });
  }

  if (!/^https?:$/i.test(target.protocol)) {
    return NextResponse.json({ message: "Unsupported protocol" }, { status: 400 });
  }
  if (!isAllowedRemoteHost(target.host)) {
    return NextResponse.json({ message: "Media host is not allowed" }, { status: 403 });
  }

  let upstream: Response;
  let usedSignedHeaders = false;
  try {
    const signHeaders = signedOssGetHeaders(target);
    usedSignedHeaders = Boolean(signHeaders);
    upstream = await fetch(target.toString(), {
      method: "GET",
      headers: {
        // 兼容 OSS 防盗链（按业务白名单域名透传）
        Referer: pickRequestOrigin(request),
        Origin: pickRequestOrigin(request),
        ...(signHeaders || {}),
      },
      cache: "no-store",
    });
  } catch (e) {
    return NextResponse.json(
      { message: "Failed to fetch media", detail: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    const payload: Record<string, unknown> = {
      message: "Upstream media request failed",
      status: upstream.status,
    };
    if (process.env.NODE_ENV !== "production") {
      payload.signed_request = usedSignedHeaders;
    }
    return NextResponse.json(
      payload,
      { status: upstream.status }
    );
  }

  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("content-length", contentLength);
  headers.set("cache-control", "public, max-age=600, stale-while-revalidate=86400");

  return new NextResponse(upstream.body, {
    status: 200,
    headers,
  });
}
