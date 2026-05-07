"use client";

import Link from "next/link";
import type { RecommendationItem } from "@/lib/recommendation/recommendation-engine";

type SubpageRecommendationStripProps = {
  title: string;
  items: RecommendationItem[];
};

export function SubpageRecommendationStrip({ title, items }: SubpageRecommendationStripProps) {
  if (items.length === 0) return null;

  return (
    <section className="mx-auto mb-5 max-w-6xl px-6 lg:px-8">
      <div className="rounded-2xl border border-[rgba(34,211,238,0.28)] bg-[linear-gradient(120deg,rgba(15,23,42,0.9),rgba(30,41,59,0.84))] p-4 text-slate-100 shadow-[0_16px_40px_-24px_rgba(14,165,233,0.65)]">
        <h3 className="text-sm font-semibold text-cyan-100">{title}</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {items.slice(0, 3).map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="rounded-xl border border-slate-300/20 bg-slate-700/25 p-3 transition hover:border-cyan-300/40 hover:bg-slate-600/25"
            >
              <p className="text-sm font-semibold text-slate-100">{item.title}</p>
              <p className="mt-1 text-xs text-slate-300">{item.reason}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

