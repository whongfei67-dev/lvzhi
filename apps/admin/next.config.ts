import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

loadEnvConfig(path.join(__dirname, "../.."));

function upstreamApiBase(): string {
  const raw =
    process.env.ADMIN_API_PROXY_TARGET ||
    process.env.API_PROXY_TARGET ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:4000";
  return raw.replace(/\/$/, "");
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  basePath: "/admin",
  outputFileTracingRoot: path.join(__dirname, "../../"),
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
