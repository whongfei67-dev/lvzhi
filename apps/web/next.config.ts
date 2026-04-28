import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// 与工作区根目录 `.env*` 对齐：仅 apps/web 时默认读不到上级目录的环境变量，会导致代理仍指向默认 4000 而实际 API 地址在根 .env.local。
loadEnvConfig(path.join(__dirname, "../.."));

function upstreamApiBase(): string {
  const raw =
    process.env.API_PROXY_TARGET ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:4000";
  return raw.replace(/\/$/, "");
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 修复工作区根目录警告
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // 同源 /api：先走 app/api 下 Route Handlers；未实现的 path 再由 fallback 代理到 Fastify。
  // 数组形式的 rewrites 属于 afterFiles，会在动态 Route Handler 之前匹配，曾导致 /api/auth/me 永远直连上游。
  async rewrites() {
    const upstream = upstreamApiBase();
    return {
      fallback: [
        {
          source: "/api/:path*",
          destination: `${upstream}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
