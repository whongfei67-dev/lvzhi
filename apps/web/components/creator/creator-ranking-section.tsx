import * as React from "react";
import Link from "next/link";
import { RankingTable, type RankingRow } from "@/components/ranking/ranking-table";

interface CreatorRankingSectionProps {
  rows: RankingRow[];
}

export function CreatorRankingSection({ rows }: CreatorRankingSectionProps) {
  return (
    <section className="bg-slate-50 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.8fr_1fr]">
          {/* Left: ranking */}
          <div>
            {rows.length > 0 ? (
              <RankingTable rows={rows} />
            ) : (
              <div className="flex items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-sm text-slate-400">
                暂无排行数据
              </div>
            )}
          </div>

          {/* Right: intro */}
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">创作者排行</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">创作者榜</h2>
            <p className="mt-3 leading-relaxed text-slate-500">
              按智能体数量、总演示量与用户好评综合排名，认识平台最活跃的创作者
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/creators"
                className="rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-md transition-shadow"
              >
                浏览创作者主页
              </Link>
              <Link
                href="/rankings"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                完整排行榜
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
