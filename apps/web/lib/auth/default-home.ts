/**
 * 登录成功后的默认落地路径（四角色各进各的工作台）。
 * 与 `UserRole` / Session.role 对齐。
 */
export function defaultHomePathForRole(role: string | null | undefined): string {
  const r = (role || "client").toLowerCase();
  if (r === "admin" || r === "superadmin") return "/admin";
  if (r === "creator") return "/creator";
  // client、visitor、历史别名 seeker 等 → 客户工作台
  return "/workspace";
}
