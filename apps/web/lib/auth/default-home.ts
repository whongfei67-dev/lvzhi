/**
 * 登录成功后的默认落地路径。
 * 与 `UserRole` / Session.role 对齐。
 */
export function defaultHomePathForRole(role: string | null | undefined): string {
  const r = (role || "client").toLowerCase();
  if (r === "admin" || r === "superadmin") return "/admin";
  // 非后台账号统一先落到首页，再由用户自主进入工作台
  return "/";
}
