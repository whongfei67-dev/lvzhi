export const dynamic = 'force-dynamic'
import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/auth/roles";
import { getServerSession } from "@/lib/auth/server-session";
import { admin } from "@/lib/api/client";
function orderStatusClass(status: string) {
  if (status === "completed" || status === "已支付") return "bg-[#E9FAF4] text-[#437365]";
  if (status === "pending" || status === "待支付") return "bg-[#EDF3F6] text-[#55656D]";
  if (status === "refunding" || status === "退款中") return "bg-[#FFF8E1] text-[#C8912A]";
  return "bg-[#EDF3F6] text-[#55656D]";
}

function Panel({ title, action, actionHref, children }: {
  title: string; action?: string; actionHref?: string; children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#DFE9EE] bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#26363D]">{title}</h2>
        {action && actionHref && (
          <Link href={actionHref} className="text-sm font-medium text-[#5C9EEB]">{action}</Link>
        )}
      </div>
      {children}
    </div>
  );
}

export default async function AdminOrdersPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  // 权限检查：只有 admin 和 superadmin 可以访问
  if (!isAdmin(session)) {
    redirect("/workspace");
  }

  const isSuperadmin = session.role === "superadmin";

  // 获取订单数据和统计
  let orderStats = {
    today_orders: 0,
    today_gmv: 0,
    pending_refunds: 0,
    pending_invoices: 0,
  };
  let orders: Record<string, unknown>[] = [];

  try {
    const statsResult = await admin.getOrderStats();
    orderStats = statsResult;
  } catch (error) {
    console.error("Failed to fetch order stats:", error);
  }

  try {
    const ordersResult = await admin.getOrders({ limit: 20 });
    orders = ordersResult.items;
  } catch (error) {
    console.error("Failed to fetch orders:", error);
  }

  return (
    <div className="min-h-screen bg-[#F7FBFE]">
      <main className="mx-auto max-w-7xl px-6 py-6 lg:px-6">
        <div className="min-w-0 space-y-6">
            {/* Header */}
            <section className="rounded-2xl border border-[#DFE9EE] bg-white p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#5C9EEB]">支付与订单</p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#26363D]">订单、退款与发票管理</h1>
                  <p className="mt-3 max-w-2xl text-[#55656D]">
                    统一查看订单状态、支付方式、退款进度与发票申请，支持按智能体、创作者、用户和时间筛选。
                  </p>
                </div>
                <div className="flex gap-3">
                  <button className="rounded-2xl border border-[#DFE9EE] bg-white px-4 py-2.5 text-sm font-semibold text-[#55656D]">
                    导出订单
                  </button>
                  <button className="rounded-2xl bg-[#26363D] px-4 py-2.5 text-sm font-semibold text-white">
                    批量开票
                  </button>
                </div>
              </div>
            </section>

            {/* Stats */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["今日支付订单", orderStats.today_orders.toString(), ""],
                ["今日 GMV", `¥${orderStats.today_gmv.toFixed(2)}`, ""],
                ["退款处理中", orderStats.pending_refunds.toString(), ""],
                ["待开票申请", orderStats.pending_invoices.toString(), ""],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-[#DFE9EE] bg-white p-6">
                  <div className="text-sm text-[#87949B]">{label}</div>
                  <div className="mt-2 text-3xl font-bold tracking-tight text-[#26363D]">{value}</div>
                </div>
              ))}
            </section>

            {/* Filter bar */}
            <section className="rounded-2xl border border-[#DFE9EE] bg-white p-5">
              <div className="flex flex-wrap gap-3">
                <input
                  className="h-12 flex-1 min-w-48 rounded-2xl border border-[#DFE9EE] bg-[#F7FBFE] px-4 text-sm outline-none placeholder:text-[#87949B] focus:border-[#5C9EEB]"
                  placeholder="搜索订单号、用户、智能体、创作者"
                />
                {["全部状态", "全部支付方式", "发票状态", "最近 30 天"].map((item) => (
                  <button key={item} className="h-12 rounded-2xl border border-[#DFE9EE] bg-white px-4 text-sm font-medium text-[#55656D] hover:bg-[#F7FBFE] transition-colors">
                    {item}
                  </button>
                ))}
              </div>
            </section>

            {/* Orders table + refund/invoice panels */}
            <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
              <Panel title="订单列表" action="返回总览" actionHref="/admin">
                {orders.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="text-4xl">📦</div>
                    <p className="mt-4 text-sm text-[#87949B]">暂无订单数据</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-[#F7FBFE] text-[#87949B]">
                        <tr>
                          {["订单号", "用户", "产品", "金额", "状态", "时间"].map((h) => (
                            <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id as string} className="border-t border-[#EDF3F6] hover:bg-[#F7FBFE] transition-colors">
                            <td className="px-4 py-3 text-[#55656D] text-xs">{order.order_no as string ?? (order.id as string)?.slice(0, 8)}</td>
                            <td className="px-4 py-3 text-[#55656D]">{(order.user as { display_name?: string })?.display_name ?? "—"}</td>
                            <td className="px-4 py-3 text-[#55656D] max-w-32 truncate">{order.product_name as string ?? "—"}</td>
                            <td className="px-4 py-3 text-[#26363D] font-semibold">¥{(order.amount as number ?? 0).toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${orderStatusClass(order.status as string)}`}>
                                {order.status === "completed" ? "已支付" : order.status === "pending" ? "待支付" : order.status === "refunding" ? "退款中" : (order.status as string ?? "未知")}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[#87949B] text-xs whitespace-nowrap">
                              {order.created_at ? new Date(order.created_at as string).toLocaleString("zh-CN") : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>

              <div className="min-w-0 space-y-6">
                <Panel title="退款处理" action="查看全部" actionHref="/admin">
                  <ul className="space-y-3 text-sm leading-7 text-[#55656D]">
                    <li>• 暂无待处理退款</li>
                    <li>• 退款将在 1-3 个工作日内原路返回</li>
                  </ul>
                </Panel>

                <Panel title="发票管理">
                  <ul className="space-y-3 text-sm leading-7 text-[#55656D]">
                    <li>• 支持技术服务费、培训费、智能体制作服务费等票面类型。</li>
                    <li>• 建议优先处理已支付且超过 24 小时的开票申请。</li>
                    <li>• 支付系统接入后将展示实时申请数据。</li>
                  </ul>
                </Panel>
              </div>
            </div>
        </div>
      </main>
    </div>
  );
}
