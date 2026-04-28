import * as React from "react";
import Link from "next/link";
import { Scale, Briefcase, Handshake } from "lucide-react";

interface EntryCard {
  role: string;
  title: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  icon: React.ReactNode;
  bg: string;
  accent: string;
  ctaStyle: string;
}

const ENTRIES: EntryCard[] = [
  {
    role: "客户",
    title: "法律服务与智能体体验",
    description: "使用灵感内容中的 AI 智能体处理日常法律问题，复杂事务可转律师；在合作机会中发布需求。",
    features: ["7×24 在线咨询体验", "灵感与智能体浏览", "合作机会发布与跟进"],
    cta: "进入客户工作台",
    ctaHref: "/workspace",
    icon: <Briefcase className="h-9 w-9 text-amber-600" />,
    bg: "bg-amber-50 border-amber-100",
    accent: "text-amber-700",
    ctaStyle: "bg-amber-500 text-white hover:bg-amber-600",
  },
  {
    role: "创作者",
    title: "发布你的 AI 智能体",
    description: "将专业知识转化为智能体产品，建立数字化品牌并实现收益。",
    features: ["智能体创作工具", "个人品牌主页", "收益实时结算"],
    cta: "进入创作者工作台",
    ctaHref: "/creator",
    icon: <Scale className="h-9 w-9 text-blue-600" />,
    bg: "bg-blue-50 border-blue-100",
    accent: "text-blue-700",
    ctaStyle: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-md",
  },
  {
    role: "合作机会",
    title: "浏览与承接合作需求",
    description: "客户发布合作机会，创作者与法律人才浏览、沟通与承接；不再单独区分「求职/招聘」工作台。",
    features: ["公区列表与筛选", "与双工作台数据衔接", "统一 PolarDB 数据层"],
    cta: "前往合作机会",
    ctaHref: "/opportunities",
    icon: <Handshake className="h-9 w-9 text-emerald-600" />,
    bg: "bg-emerald-50 border-emerald-100",
    accent: "text-emerald-700",
    ctaStyle: "bg-emerald-600 text-white hover:bg-emerald-700",
  },
];

export function EcosystemEntrySection() {
  return (
    <section className="bg-slate-50 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">生态入口</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">你在这里能做什么</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            律植以客户工作台与创作者工作台为核心，合作机会公区连接双方需求。
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ENTRIES.map((entry) => (
            <div
              key={entry.role}
              className={`flex flex-col rounded-3xl border p-6 ${entry.bg}`}
            >
              <div className="leading-none">{entry.icon}</div>
              <p className={`mt-4 text-xs font-semibold uppercase tracking-wider ${entry.accent}`}>
                {entry.role}
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-950">{entry.title}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{entry.description}</p>

              <ul className="mt-4 flex-1 space-y-2">
                {entry.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <svg className="h-3.5 w-3.5 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={entry.ctaHref}
                className={`mt-6 block rounded-2xl px-4 py-2.5 text-center text-sm font-semibold transition-all ${entry.ctaStyle}`}
              >
                {entry.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
