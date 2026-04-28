import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PracticeLawyerBadge } from "@/components/common/practice-lawyer-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface RankingRow {
  id: string;
  rank: number;
  name: string;
  /** Sub-label (creator name for agents, firm for lawyers, etc.) */
  sub?: string | null;
  /** Avatar URL */
  avatarUrl?: string | null;
  /** Primary metric (right-aligned, large) */
  primaryValue: string | number;
  primaryLabel: string;
  /** Secondary metric */
  secondaryValue?: string | number;
  secondaryLabel?: string;
  /** href to navigate on row/name click */
  href?: string;
  /** Optional badge text */
  badge?: string;
  badgeClass?: string;
  /** Verified indicator */
  verified?: boolean;
  lawyer_verified?: boolean;
}

interface RankingTableProps {
  rows: RankingRow[];
  /** Show change indicator column */
  className?: string;
}

function Medal({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl leading-none">🥇</span>;
  if (rank === 2) return <span className="text-xl leading-none">🥈</span>;
  if (rank === 3) return <span className="text-xl leading-none">🥉</span>;
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
      {rank}
    </span>
  );
}

export function RankingTable({ rows, className }: RankingTableProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {rows.map((row) => (
        <div
          key={row.id}
          className={cn(
            "flex items-center gap-4 rounded-2xl border border-slate-100 px-4 py-3 transition-colors hover:bg-slate-50",
            row.rank <= 3 && "border-slate-200 bg-white"
          )}
        >
          {/* rank */}
          <div className="flex w-8 shrink-0 items-center justify-center">
            <Medal rank={row.rank} />
          </div>

          {/* avatar */}
          <Avatar size="sm">
            {row.avatarUrl && <AvatarImage src={row.avatarUrl} alt={row.name} />}
            <AvatarFallback>{row.name[0]}</AvatarFallback>
          </Avatar>

          {/* name + sub */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {row.href ? (
                <Link
                  href={row.href}
                  className="truncate text-sm font-semibold text-slate-950 hover:text-blue-700 transition-colors"
                >
                  {row.name}
                </Link>
              ) : (
                <span className="truncate text-sm font-semibold text-slate-950">{row.name}</span>
              )}
              {row.lawyer_verified ? <PracticeLawyerBadge className="!text-[10px]" /> : null}
              {row.badge && (
                <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", row.badgeClass ?? "bg-slate-100 text-slate-600")}>
                  {row.badge}
                </span>
              )}
            </div>
            {row.sub && (
              <p className="mt-0.5 truncate text-xs text-slate-500">{row.sub}</p>
            )}
          </div>

          {/* metrics */}
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-slate-950">{row.primaryValue}</p>
            <p className="text-xs text-slate-400">{row.primaryLabel}</p>
          </div>
          {row.secondaryValue !== undefined && (
            <div className="hidden shrink-0 text-right sm:block">
              <p className="text-sm font-semibold text-slate-700">{row.secondaryValue}</p>
              <p className="text-xs text-slate-400">{row.secondaryLabel}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
