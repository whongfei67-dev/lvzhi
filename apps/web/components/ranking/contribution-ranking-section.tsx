import * as React from "react";
import Link from "next/link";
import { RankingTable, type RankingRow } from "@/components/ranking/ranking-table";

interface ContributionRankingSectionProps {
  rows: RankingRow[];
}

const BADGES = [
  { min: 1,  max: 1,  label: "传奇贡献者", cls: "bg-amber-100 text-amber-700" },
  { min: 2,  max: 3,  label: "顶级创作者", cls: "bg-slate-200 text-slate-700" },
  { min: 4,  max: 10, label: "活跃创作者", cls: "bg-blue-50 text-blue-700" },
];

function withBadge(rows: RankingRow[]): RankingRow[] {
  return rows.map((r) => {
    const tier = BADGES.find((b) => r.rank >= b.min && r.rank <= b.max);
    return tier ? { ...r, badge: tier.label, badgeClass: tier.cls } : r;
  });
}

export function ContributionRankingSection({ rows }: ContributionRankingSectionProps) {
  const ranked = withBadge(rows);

  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">贡献榜</p>
            <h2 className="mt-1 text-3xl font-bold text-slate-950">月度贡献排行</h2>
            <p className="mt-2 text-slate-500">综合智能体发布量、演示总量和用户评价三项指标</p>
          </div>
          <Link
            href="/rankings"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            查看完整榜单 →
          </Link>
        </div>

        {/* Legend */}
        <div className="mb-6 flex flex-wrap gap-3">
          {BADGES.map((b) => (
            <span key={b.label} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${b.cls}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
              {b.label}
            </span>
          ))}
        </div>

        {ranked.length > 0 ? (
          <RankingTable rows={ranked} />
        ) : (
          <div className="flex items-center justify-center rounded-3xl border border-dashed border-slate-200 py-16 text-sm text-slate-400">
            暂无贡献数据
          </div>
        )}
      </div>
    </section>
  );
}
