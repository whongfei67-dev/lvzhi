/**
 * 需在 Edge 层具备登录 Cookie 的路径（与 `(dashboard)` 下需登录页面一致）。
 * 具体角色仍由各工作台客户端用 `getSession()` 校验。
 */
const PROTECTED_PREFIXES = ["/workspace", "/creator", "/user", "/profile"] as const;

const PROTECTED_EXACT = new Set<string>(["/recharge", "/verify"]);

export function isProtectedAppPath(pathname: string): boolean {
  if (PROTECTED_EXACT.has(pathname)) return true;
  for (const p of PROTECTED_PREFIXES) {
    if (pathname === p || pathname.startsWith(`${p}/`)) return true;
  }
  return false;
}

export const AUTH_ACCESS_COOKIE_NAME = "lvzhi_access_token";
