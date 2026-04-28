"use client";

import Link from "next/link";
import { Star } from "lucide-react";

interface CreatorCardProps {
  id: string;
  name: string;
  bio?: string;
  specialties?: string[];
  stats?: {
    agents_count?: number;
    total_users?: number;
    rating?: number;
  };
  verified?: boolean;
}

export interface CreatorCardCreator {
  id: string;
  displayName: string;
  publicLabel?: string;
  bio?: string;
  lawFirm?: string;
  specialty?: string[];
  verified?: boolean;
  agentCount?: number;
  demoCount?: number;
  isEmployedCreator?: boolean;
  hideRealIdentity?: boolean;
  rank?: number;
}

type LegacyCreatorCardProps = {
  creator: CreatorCardCreator;
  layout?: "grid" | "list";
};

export function CreatorCard(props: CreatorCardProps | LegacyCreatorCardProps) {
  const normalized =
    "creator" in props
      ? {
          id: props.creator.id,
          name: props.creator.publicLabel ?? props.creator.displayName,
          bio: props.creator.bio,
          specialties: props.creator.specialty ?? [],
          stats: {
            agents_count: props.creator.agentCount,
            total_users: props.creator.demoCount,
          },
          verified: props.creator.verified,
        }
      : props;

  const { id, name, bio, specialties = [], stats, verified } = normalized;
  return (
    <Link
      href={`/creators/${id}`}
      className="group block rounded-2xl border border-[#DDEAE1] bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#284A3D] to-[#3A6354] text-xl font-bold text-white">
          {name[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#18261F] group-hover:text-[#284A3D]">
              {name}
            </h3>
            {verified && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <Star className="mr-1 h-3 w-3 fill-current" />
                认证
              </span>
            )}
          </div>
          {bio && <p className="mt-1 text-sm text-slate-500">{bio}</p>}
        </div>
      </div>

      {specialties.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {specialties.slice(0, 3).map((s) => (
            <span
              key={s}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {stats && (
        <div className="mt-4 flex gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
          {stats.agents_count !== undefined && (
            <span>智能体 {stats.agents_count}</span>
          )}
          {stats.total_users !== undefined && (
            <span>用户 {stats.total_users}</span>
          )}
          {stats.rating !== undefined && (
            <span className="text-amber-600">
              <Star className="mr-0.5 inline h-3 w-3 fill-current" />
              {stats.rating}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
