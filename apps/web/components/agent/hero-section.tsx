import * as React from "react";
import Link from "next/link";
import { SmartSearch } from "@/components/common/smart-search";

interface HeroStat {
  value: string;
  label: string;
}

interface HeroSectionProps {
  stats?: HeroStat[];
}

const DEFAULT_STATS: HeroStat[] = [
  { value: "500+", label: "法律智能体" },
  { value: "200+", label: "认证创作者" },
  { value: "10k+", label: "注册用户" },
  { value: "50k+", label: "演示次数" },
];

export function HeroSection({ stats = DEFAULT_STATS }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-white">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 right-0 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 opacity-60 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-blue-50 to-sky-100 opacity-50 blur-3xl" />
      </div>

      <div className="mx-auto max-w-screen-2xl px-3 py-20 lg:px-5 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            中国首个法律 AI 智能体平台
          </div>

          {/* Headline */}
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            让每一位创作者拥有
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              自己的 AI 分身
            </span>
          </h1>

          {/* Sub */}
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-500">
            律植连接法律创作者与 AI 能力，创作者发布智能体、求职者找到机会、客户获得高效法律服务
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center gap-4">
            <SmartSearch className="w-full max-w-xl" placeholder="搜索智能体、创作者…" />
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/agents"
                className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-200"
              >
                探索智能体
              </Link>
              <Link
                href="/register"
                className="rounded-2xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm"
              >
                成为创作者 →
              </Link>
            </div>
          </div>

          {/* Trust bar */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              律师资质认证（可选）
            </span>
            <span className="text-slate-200">·</span>
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              智能体上线前人工审核
            </span>
            <span className="text-slate-200">·</span>
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              免费体验，无需注册
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white px-4 py-5 shadow-sm"
            >
              <span className="text-3xl font-bold text-slate-950">{value}</span>
              <span className="mt-1 text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
