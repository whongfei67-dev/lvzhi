import * as React from "react";
import Link from "next/link";
import { FileText, Scale, MessageCircle, Shield, Users, Building2, Lock, Lightbulb, BarChart3, Sparkles } from "lucide-react";

interface CategoryItem {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  count?: number;
  color: string;
  hoverColor: string;
}

const CATEGORIES: CategoryItem[] = [
  { key: "contract",     label: "合同审查",  description: "合同起草、审查与风险识别",     icon: <FileText className="h-7 w-7" />, count: undefined, color: "bg-blue-50 border-blue-100 text-blue-600",     hoverColor: "hover:border-blue-300 hover:bg-blue-100" },
  { key: "litigation",   label: "诉讼仲裁",  description: "诉讼策略、庭审准备与文书",     icon: <Scale className="h-7 w-7" />, count: undefined, color: "bg-indigo-50 border-indigo-100 text-indigo-600",  hoverColor: "hover:border-indigo-300 hover:bg-indigo-100" },
  { key: "consultation", label: "法律咨询",  description: "快速解答法律疑问与方案建议",   icon: <MessageCircle className="h-7 w-7" />, count: undefined, color: "bg-violet-50 border-violet-100 text-violet-600",  hoverColor: "hover:border-violet-300 hover:bg-violet-100" },
  { key: "compliance",   label: "合规风控",  description: "企业合规体系与风险管理",       icon: <Shield className="h-7 w-7" />, count: undefined, color: "bg-emerald-50 border-emerald-100 text-emerald-600", hoverColor: "hover:border-emerald-300 hover:bg-emerald-100" },
  { key: "family",       label: "婚姻家事",  description: "婚姻、继承与家庭纠纷",         icon: <Users className="h-7 w-7" />, count: undefined, color: "bg-pink-50 border-pink-100 text-pink-600",     hoverColor: "hover:border-pink-300 hover:bg-pink-100" },
  { key: "labor",        label: "劳动仲裁",  description: "劳动合同、薪资与工伤权益",     icon: <Building2 className="h-7 w-7" />, count: undefined, color: "bg-amber-50 border-amber-100 text-amber-600",   hoverColor: "hover:border-amber-300 hover:bg-amber-100" },
  { key: "criminal",     label: "刑事辩护",  description: "刑事案件咨询与辩护策略",       icon: <Lock className="h-7 w-7" />, count: undefined, color: "bg-red-50 border-red-100 text-red-600",       hoverColor: "hover:border-red-300 hover:bg-red-100" },
  { key: "ip",           label: "知识产权",  description: "专利、商标与版权保护",         icon: <Lightbulb className="h-7 w-7" />, count: undefined, color: "bg-yellow-50 border-yellow-100 text-yellow-600",  hoverColor: "hover:border-yellow-300 hover:bg-yellow-100" },
  { key: "tax",          label: "税务筹划",  description: "企业与个人税务合规优化",       icon: <BarChart3 className="h-7 w-7" />, count: undefined, color: "bg-cyan-50 border-cyan-100 text-cyan-600",     hoverColor: "hover:border-cyan-300 hover:bg-cyan-100" },
  { key: "other",        label: "更多场景",  description: "行政、金融、房产等其他领域",   icon: <Sparkles className="h-7 w-7" />, count: undefined, color: "bg-slate-50 border-slate-200 text-slate-600",   hoverColor: "hover:border-slate-400 hover:bg-slate-100" },
];

interface CategoryExploreSectionProps {
  counts?: Record<string, number>;
}

export function CategoryExploreSection({ counts }: CategoryExploreSectionProps) {
  return (
    <section className="bg-slate-50 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">场景分类</p>
            <h2 className="mt-1 text-3xl font-bold text-slate-950">按法律场景探索</h2>
            <p className="mt-2 text-slate-500">覆盖企业与个人的全部主流法律场景</p>
          </div>
          <Link
            href="/agents"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            查看全部智能体 →
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((cat) => {
            const count = counts?.[cat.key];
            return (
              <Link
                key={cat.key}
                href={`/agents?category=${cat.key}`}
                className={`group flex flex-col gap-3 rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md ${cat.color} ${cat.hoverColor}`}
              >
                <div className="leading-none">{cat.icon}</div>
                <div>
                  <p className="font-semibold text-slate-900">{cat.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{cat.description}</p>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  {count !== undefined && (
                    <span className="text-xs text-slate-400">{count} 个</span>
                  )}
                  <svg className="ml-auto h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
