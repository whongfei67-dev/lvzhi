/**
 * 登录态由 middleware（Cookie）+ 各子区客户端 `getSession()` 承担，
 * 此处不再 `await getServerSession()`，避免每次客户端路由都阻塞在上游会话接口。
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
