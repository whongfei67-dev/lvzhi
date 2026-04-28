/**
 * 是否对会话 Cookie 使用 Secure 标志。
 *
 * 本地常见配置：NODE_ENV=production（避免 pino-pretty 等）但 WEB_URL 仍是 http://localhost。
 * 此时若按 NODE_ENV 强制 Secure，浏览器在 HTTP 下会丢弃 Cookie，表现为「登录成功但不跳转 / 一直未登录」。
 *
 * 覆盖方式：
 * - COOKIE_SECURE=true  → 强制 Secure（仅 HTTPS 站点可收 Cookie）
 * - COOKIE_SECURE=false → 强制非 Secure（本地 HTTP 调试用）
 */
export function shouldUseSecureCookies(): boolean {
  if (process.env.COOKIE_SECURE === 'true') return true
  if (process.env.COOKIE_SECURE === 'false') return false

  const web =
    (process.env.WEB_URL || process.env.WEB_BASE_URL || '')
      .split(',')[0]
      ?.trim()
      .toLowerCase() || ''

  if (web.startsWith('https://')) return true
  if (web.startsWith('http://')) return false

  return process.env.NODE_ENV === 'production'
}
