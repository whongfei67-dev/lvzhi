"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Scale, Star } from "lucide-react";
import { api } from "@/lib/api/client";
import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { PracticeLawyerBadge } from "@/components/common/practice-lawyer-badge";
import {
  INSPIRATION_DEMO_PRODUCTS,
  type InspirationDemoProduct,
} from "@/lib/inspiration-demo-items";

function matchesKeyword(q: string, item: InspirationDemoProduct): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return false;
  const hay = [
    item.title,
    item.description,
    item.author,
    item.category,
    item.reviewExcerpt,
    item.stats,
    item.price,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
}

interface LawyerHit {
  id: string;
  name: string;
  avatar?: string;
  firm?: string;
  expertise?: string[];
  bio?: string;
  rating?: number;
  review_count?: number;
  lawyer_verified?: boolean;
}

function SearchResultsInner() {
  const searchParams = useSearchParams();
  const sp = useMemo(() => searchParams ?? new URLSearchParams(), [searchParams]);
  const rawQ = sp.get("q") ?? "";
  const q = rawQ.trim();

  const inspirationHits = useMemo(() => {
    if (!q) return [];
    return INSPIRATION_DEMO_PRODUCTS.filter((item) => matchesKeyword(q, item));
  }, [q]);

  const [lawyers, setLawyers] = useState<LawyerHit[]>([]);
  const [lawyersLoading, setLawyersLoading] = useState(false);
  const [lawyersError, setLawyersError] = useState<string | null>(null);

  useEffect(() => {
    if (!q) {
      setLawyers([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLawyersLoading(true);
      setLawyersError(null);
      try {
        const result = await api.lawyers.list({
          page: 1,
          limit: 20,
          search: q,
        });
        if (cancelled) return;
        setLawyers(result.items as unknown as LawyerHit[]);
      } catch {
        if (!cancelled) {
          setLawyersError("律师数据暂时无法加载");
          setLawyers([]);
        }
      } finally {
        if (!cancelled) setLawyersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [q]);

  return (
    <div className="min-h-screen marketing-page-shell-tint">
      <section className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <h1 className="text-2xl font-semibold text-[#5C4033]">{preferTradForKeShiLu("搜索结果")}</h1>
        {!q ? (
          <p className="mt-4 text-[#9A8B78]">在顶部搜索框输入关键词后按回车，即可查看匹配内容。</p>
        ) : (
          <p className="mt-2 text-sm text-[#5D4E3A]">
            关键词「<span className="font-medium text-[#5C4033]">{rawQ}</span>」的匹配结果
          </p>
        )}

        {q ? (
          <>
            <section className="mt-10">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="h-5 w-1 shrink-0 rounded-full bg-[#D4A574]" />
                <h2 className="text-lg font-semibold text-[#D4A574]">{preferTradForKeShiLu("灵感作品")}</h2>
                <span className="text-sm text-[#9A8B78]">（{inspirationHits.length}）</span>
              </div>
              {inspirationHits.length === 0 ? (
                <p className="text-sm text-[#9A8B78]">暂无标题或简介等字段匹配的演示作品。</p>
              ) : (
                <ul className="space-y-3">
                  {inspirationHits.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/inspiration/${item.id}`}
                        className="card block p-4 transition-shadow hover:shadow-md"
                      >
                        <p className="font-medium text-[#2C2416]">{item.title}</p>
                        <p className="mt-1 text-xs text-[#9A8B78]">
                          {item.category} · {item.author}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/inspiration" className="mt-4 inline-block text-sm font-medium text-[#D4A574]">
                {preferTradForKeShiLu("前往灵感广场")} →
              </Link>
            </section>

            <section className="mt-12">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-5 w-1 rounded-full bg-[#D4A574]" />
                <h2 className="text-lg font-semibold text-[#D4A574]">{preferTradForKeShiLu("律师")}</h2>
              </div>
              {lawyersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D4A574] border-t-transparent" />
                </div>
              ) : lawyersError ? (
                <p className="text-sm text-[#D94D4D]">{lawyersError}</p>
              ) : lawyers.length === 0 ? (
                <p className="text-sm text-[#9A8B78]">暂无与接口返回数据匹配的律师（或列表为空）。</p>
              ) : (
                <ul className="space-y-3">
                  {lawyers.map((lawyer) => (
                    <li key={lawyer.id}>
                      <Link
                        href={`/lawyers/${lawyer.id}`}
                        className="card flex flex-col gap-4 p-4 transition-shadow hover:shadow-md sm:flex-row"
                      >
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#D4A574] to-[#B8860B] text-xl font-bold text-white">
                          {lawyer.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={lawyer.avatar}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            lawyer.name?.[0] ?? "律"
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="inline-flex items-center gap-1.5 font-semibold text-[#2C2416]">
                            <span>{lawyer.name}</span>
                            {lawyer.lawyer_verified ? <PracticeLawyerBadge className="!text-[10px]" /> : null}
                          </h3>
                          <p className="mt-0.5 text-sm text-[#5D4E3A]">{lawyer.firm || "独立执业"}</p>
                          {lawyer.expertise && lawyer.expertise.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {lawyer.expertise.slice(0, 5).map((exp, i) => (
                                <span key={i} className="tag text-xs">
                                  {exp}
                                </span>
                              ))}
                            </div>
                          ) : null}
                          {lawyer.bio ? (
                            <p className="mt-2 line-clamp-2 text-sm text-[#5D4E3A]">{lawyer.bio}</p>
                          ) : null}
                        </div>
                        {lawyer.rating != null ? (
                          <div className="flex shrink-0 items-center gap-1 text-sm font-medium text-[#D4A574] sm:flex-col sm:items-end">
                            <Star className="h-4 w-4 fill-current" aria-hidden />
                            {lawyer.rating.toFixed(1)}
                            <span className="text-[#9A8B78]">({lawyer.review_count ?? 0})</span>
                          </div>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/lawyers" className="mt-4 inline-block text-sm font-medium text-[#D4A574]">
                {preferTradForKeShiLu("前往发现律师")} →
              </Link>
            </section>

            {inspirationHits.length === 0 && lawyers.length === 0 && !lawyersLoading && !lawyersError ? (
              <div className="card mt-10 flex flex-col items-center p-10 text-center">
                <Scale className="h-10 w-10 text-[#9A8B78]" aria-hidden />
                <p className="mt-3 text-sm text-[#5D4E3A]">暂时无法搜索到您想要的内容，可换个关键词或到各频道浏览。</p>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FFF8F0]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D4A574] border-t-transparent" />
        </div>
      }
    >
      <SearchResultsInner />
    </Suspense>
  );
}
