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

/**
 * 「进入个人工作台」按钮专用路径。
 * 与登录落地页分离，避免落到首页。
 */
export function workbenchPathForRole(role: string | null | undefined): string {
  const r = (role || "client").toLowerCase();
  if (r === "admin" || r === "superadmin") return "/admin";
  if (r === "creator") return "/creator/workbench/cre-profile";
  return "/workspace/workbench/cli-profile";
}
