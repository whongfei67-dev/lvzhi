import * as React from "react";
import Link from "next/link";
import { RankingTable, type RankingRow } from "@/components/ranking/ranking-table";

interface AgentRankingSectionProps {
  rows: RankingRow[];
}

export function AgentRankingSection({ rows }: AgentRankingSectionProps) {
  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.8fr]">
          {/* Left: intro */}
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">智能体排行</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">本周最受欢迎</h2>
            <p className="mt-3 leading-relaxed text-slate-500">
              根据演示次数、用户收藏与转化率综合评定，每周更新一次
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/agents"
                className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-md transition-shadow"
              >
                探索全部智能体
              </Link>
              <Link
                href="/rankings"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                完整排行榜
              </Link>
            </div>
          </div>

          {/* Right: ranking */}
          <div>
            {rows.length > 0 ? (
              <RankingTable rows={rows} />
            ) : (
              <div className="flex items-center justify-center rounded-3xl border border-dashed border-slate-200 py-16 text-sm text-slate-400">
                暂无排行数据
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
