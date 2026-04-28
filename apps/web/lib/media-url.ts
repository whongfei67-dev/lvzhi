function ossEndpointHost(): string {
  const endpoint =
    process.env.NEXT_PUBLIC_OSS_ENDPOINT ||
    process.env.OSS_ENDPOINT ||
    process.env.ALIYUN_OSS_ENDPOINT ||
    "";
  const bucket =
    process.env.NEXT_PUBLIC_OSS_BUCKET ||
    process.env.OSS_BUCKET ||
    process.env.ALIYUN_OSS_BUCKET ||
    "";
  if (!endpoint || !bucket) return "";
  return `${bucket}.${endpoint}`.toLowerCase();
}

function cdnHost(): string {
  const raw =
    process.env.NEXT_PUBLIC_OSS_CDN_URL ||
    process.env.OSS_CDN_URL ||
    process.env.ALIYUN_OSS_CDN_URL ||
    "";
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

export function withPublicMediaProxy(url: string): string {
  const raw = String(url || "").trim();
  if (!raw) return "";
  if (!/^https?:\/\//i.test(raw)) return raw;
  try {
    const u = new URL(raw);
    const h = u.host.toLowerCase();
    const endpointHost = ossEndpointHost();
    const cdn = cdnHost();
    if (endpointHost && h === endpointHost) {
      return `/api/media?url=${encodeURIComponent(raw)}`;
    }
    if (cdn && h === cdn) {
      return `/api/media?url=${encodeURIComponent(raw)}`;
    }
    // 兼容前端未注入 NEXT_PUBLIC_OSS_* 的场景：只要是阿里云 OSS 域名，就走同源媒体代理。
    if (isAliyunOssHost(h)) {
      return `/api/media?url=${encodeURIComponent(raw)}`;
    }
    return raw;
  } catch {
    return raw;
  }
}

