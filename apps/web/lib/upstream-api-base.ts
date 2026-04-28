/**
 * Fastify 上游地址（Next Route Handler / rewrites / 少量服务端请求共用）
 */
export function getUpstreamApiBaseUrl(): string {
  const raw =
    process.env.API_PROXY_TARGET ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:4000";
  return raw.replace(/\/$/, "");
}

/** 生产环境 CSRF 中间件要求带 Origin，与 API 的 WEB_URL / ALLOWED_ORIGINS 对齐 */
export function getUpstreamRequestOrigin(): string {
  return (
    process.env.INTERNAL_APP_URL ||
    process.env.WEB_URL?.split(",")[0]?.trim() ||
    "http://localhost:3000"
  );
}

export function upstreamConnectionErrorPayload(err: unknown) {
  const detail = err instanceof Error ? err.message : String(err);
  return {
    message:
      "无法连接后端：请确认 Fastify API 已启动（工作区根目录执行 pnpm dev 或 pnpm dev:api，默认端口 4000）。若 API 在其他地址，请在仓库根目录或 apps/web 的 .env.local 中设置 API_PROXY_TARGET 或 NEXT_PUBLIC_API_URL。",
    detail,
    upstream: getUpstreamApiBaseUrl(),
  };
}
