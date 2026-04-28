"use client";

import Link from "next/link";
import { Star, Users, MessageSquare } from "lucide-react";

export interface AgentCardProps {
  id: string;
  name: string;
  description?: string;
  category?: string;
  creator?: string;
  certified?: boolean;
  mode?: "免费" | "免费试用" | "付费";
  useCount?: number;
}

export function AgentCard({
  id,
  name,
  description,
  category,
  creator,
  certified,
  mode = "免费",
  useCount,
}: AgentCardProps) {
  const modeStyles = {
    "免费": "bg-emerald-50 text-emerald-700",
    "免费试用": "bg-amber-50 text-amber-700",
    "付费": "bg-[#284A3D] text-white",
  };

  return (
    <Link
      href={`/agents/${id}`}
      className="group block rounded-2xl border border-[#DDEAE1] bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-md hover:border-[#284A3D]"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-[#18261F] group-hover:text-[#284A3D]">
            {name}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {category && <span>{category}</span>}
            {creator && <span> · {creator}</span>}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${modeStyles[mode]}`}>
          {mode}
        </span>
      </div>

      {description && (
        <p className="mt-3 text-sm text-slate-600 line-clamp-2">{description}</p>
      )}

      <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
        {useCount !== undefined && (
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {useCount}
          </span>
        )}
        {certified && (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <Star className="h-3.5 w-3.5 fill-current" />
            认证
          </span>
        )}
      </div>
    </Link>
  );
}
