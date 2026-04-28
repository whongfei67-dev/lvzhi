import * as React from "react";
import Link from "next/link";
import { Flame, Trophy, BarChart3, Bot } from "lucide-react";

export interface HotAgentItem {
  id: string;
  name: string;
  category: string;
  creator: string;
  mode: "免费版" | "免费试用" | "商用版";
  price: number;
  downloadCount?: number;
  href: string;
}

interface HotAgentsSectionProps {
  agents: HotAgentItem[];
}

const MEDAL_ICONS = [
  <Trophy key="1" className="h-5 w-5 text-amber-500" />,
  <Trophy key="2" className="h-5 w-5 text-slate-400" />,
  <Trophy key="3" className="h-5 w-5 text-amber-700" />,
];

function ModeTag({ mode }: { mode: HotAgentItem["mode"] }) {
  const cls =
    mode === "免费版"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : mode === "免费试用"
      ? "bg-amber-50 text-amber-700 border-amber-100"
      : "bg-blue-50 text-blue-700 border-blue-100";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {mode}
    </span>
  );
}

export function HotAgentsSection({ agents }: HotAgentsSectionProps) {
  if (!agents.length) return null;

  const display = agents.slice(0, 10).map((agent, idx) => ({
    ...agent,
    displayRank: idx + 1,
  }));

  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
              <Flame className="h-4 w-4" />
              热门榜
            </p>
            <h2 className="mt-1 text-3xl font-bold text-slate-950">本周热门智能体</h2>
            <p className="mt-2 text-slate-500">
              根据下载量、评分和用户活跃度综合排列
            </p>
          </div>
          <Link
            href="/agents"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            查看全部智能体 →
          </Link>
        </div>

        {/* Grid: top 3 large + rest as list */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* Left: top items */}
          <div className="space-y-3">
            {display.map((agent, idx) => {
              const rank = agent.displayRank;
              return (
                <Link
                  key={agent.id + idx}
                  href={agent.href}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  {/* Rank / medal */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-lg font-bold">
                    {rank <= 3 ? MEDAL_ICONS[rank - 1] : (
                      <span className="text-sm text-slate-500">{rank}</span>
                    )}
                  </div>

                  {/* Agent icon placeholder */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                    <Bot className="h-6 w-6 text-blue-600" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-950 group-hover:text-blue-600 transition-colors truncate">
                        {agent.name}
                      </span>
                      <ModeTag mode={agent.mode} />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {agent.category} · by {agent.creator}
                    </p>
                  </div>

                  {/* Price / downloads */}
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {agent.price === 0 ? "免费" : `¥${agent.price}`}
                    </p>
                    {agent.downloadCount !== undefined && (
                      <p className="text-xs text-slate-400">{agent.downloadCount} 次下载</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Right: info card */}
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-slate-100 bg-white p-5">
              <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                榜单说明
              </p>
              <p className="text-xs leading-relaxed text-slate-500">
                热门榜综合下载量、用户评分与近期活跃度进行动态排名，每日更新。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
