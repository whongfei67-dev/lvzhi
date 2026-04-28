export const dynamic = 'force-dynamic'
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth/server-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const plans = [
  {
    id: "basic",
    name: "基础套餐",
    price: 299,
    period: "月",
    highlight: false,
    features: [
      "创作者列表优先展示",
      "个人主页认证标识",
      "1 个智能体置顶展示",
      "基础数据统计",
    ],
    cta: "选择基础",
  },
  {
    id: "featured",
    name: "精选套餐",
    price: 699,
    period: "月",
    highlight: true,
    badge: "最受欢迎",
    features: [
      "创作者列表首位展示",
      "首页精选创作者栏展示",
      "3 个智能体置顶展示",
      "详细数据分析报告",
      "专属客服支持",
    ],
    cta: "选择精选",
  },
  {
    id: "premium",
    name: "高级套餐",
    price: 1499,
    period: "月",
    highlight: false,
    features: [
      "全平台最优先展示",
      "首页 Banner 轮播",
      "无限智能体置顶",
      "实时数据分析面板",
      "1v1 运营顾问",
      "定制化推广方案",
    ],
    cta: "联系咨询",
  },
];

export default async function PromoPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)] py-6">
      <div className="mx-auto max-w-5xl px-6 space-y-10">
        <div className="flex items-center gap-4">
          <Link href="/creator" className="text-sm text-[#9A8B78] hover:text-[#D4A574]">
            ← 返回工作台
          </Link>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-[#D4A574]">创作者学院</p>
          <h1 className="text-3xl font-bold text-[#2C2416]">选择推广套餐</h1>
          <p className="text-[#9A8B78]">提升曝光度，让更多潜在客户发现你</p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-8 flex flex-col gap-5 relative ${
                plan.highlight
                  ? "border-[#B8860B] border-2 shadow-lg"
                  : ""
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#B8860B] text-white">{plan.badge}</Badge>
                </div>
              )}

              <div className="space-y-1">
                <h2 className="text-lg font-bold text-[#2C2416]">{plan.name}</h2>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#D4A574]">¥{plan.price}</span>
                  <span className="text-sm text-[#9A8B78]">/{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#D4A574]">
                    <span className="text-[#D4A574] shrink-0 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlight ? "primary" : "secondary"}
                className="w-full"
                disabled
              >
                {plan.cta}
                <span className="ml-2 text-xs opacity-60">（即将开放）</span>
              </Button>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-8 text-center space-y-4">
          <h2 className="font-semibold text-[#2C2416]">有疑问？</h2>
          <p className="text-sm text-[#9A8B78]">联系我们了解更多推广方案，或咨询定制化服务</p>
          <Button variant="secondary">联系运营团队</Button>
        </div>
      </div>
    </div>
  );
}