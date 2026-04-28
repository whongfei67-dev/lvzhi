import * as React from "react";
import Link from "next/link";
import { PriceCard, type PriceCardPlan } from "@/components/agent/agent-price-card";

const PLANS: PriceCardPlan[] = [
  {
    name: "免费版",
    price: "¥0",
    period: "永久",
    description: "创作者发布免费智能体，用户无限次使用，快速建立影响力",
    features: [
      "无限用户访问",
      "基础演示功能",
      "列表页展示",
      "个人品牌主页",
    ],
    excludedFeatures: ["收费授权", "优先排名", "数据分析"],
    cta: "免费发布",
    ctaHref: "/auth/register",
  },
  {
    name: "免费试用版",
    price: "¥9.9",
    period: "起 / 次",
    description: "提供免费试用入口，用户体验后付费解锁完整功能，转化更自然",
    features: [
      "免费试用吸引流量",
      "付费解锁完整版",
      "自定义定价",
      "收益实时结算",
      "用户使用数据",
    ],
    excludedFeatures: ["优先排名"],
    cta: "开始创作",
    ctaHref: "/auth/register",
    badge: "最受欢迎",
    highlighted: true,
  },
  {
    name: "商用版",
    price: "自定义",
    period: "",
    description: "完全付费模式，适合高价值专业智能体，每次使用均收费",
    features: [
      "按次 / 按月收费",
      "专业定价权",
      "高转化场景",
      "收益实时结算",
      "数据分析看板",
      "优先排名展示",
    ],
    cta: "申请商用",
    ctaHref: "/auth/register",
  },
];

export function PricingModeSection() {
  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">定价模式</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">选择适合你的变现方式</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-500 leading-relaxed">
            律植提供三种发布模式，从建立影响力到商业变现，每个阶段都有对应策略
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <PriceCard key={plan.name} plan={plan} />
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-400">
          平台收取 10% 服务费 · 每月 15 日结算 ·{" "}
          <Link href="/register" className="text-blue-600 hover:underline">
            了解更多
          </Link>
        </p>
      </div>
    </section>
  );
}
