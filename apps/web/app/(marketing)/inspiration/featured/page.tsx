"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import {
  INSPIRATION_DEMO_PRODUCTS,
  type InspirationDemoProduct,
} from "@/lib/inspiration-demo-items";
import { PRACTICE_TAGS, categoryMatchesPracticeTag } from "@/lib/inspiration-practice-tags";
import { withPublicMediaProxy } from "@/lib/media-url";
import { PracticeLawyerBadge } from "@/components/common/practice-lawyer-badge";

/** 顶区头图：创意工作台 / 设计氛围（与灵感广场主头图区分） */
const FEATURED_HERO_IMAGE =
  "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1920&q=80";

type SkillCardItem = {
  id: string;
  slug?: string;
  coverImage?: string;
  title: string;
  description: string;
  category: string;
  creator: string;
  creatorIsLawyer?: boolean;
  mode: "免费" | "付费";
  useCount: number;
  rating: number;
  createdAt: string;
  featured?: boolean;
};

function fallbackCoverImage(item: Pick<SkillCardItem, "id" | "category" | "title">): string {
  const seed = encodeURIComponent(`${item.id}-${item.category || item.title || "skill"}`);
  return `https://picsum.photos/seed/${seed}/640/360`;
}

function toMode(priceType: unknown, price: unknown): "免费" | "付费" {
  if (String(priceType ?? "").toLowerCase() === "free") return "免费";
  const n = Number(price);
  if (Number.isFinite(n) && n <= 0) return "免费";
  return "付费";
}

function fromApiSkill(row: Record<string, unknown>): SkillCardItem {
  const content =
    row.content && typeof row.content === "object" && !Array.isArray(row.content)
      ? (row.content as Record<string, unknown>)
      : {};
  const wb =
    content.workbench && typeof content.workbench === "object" && !Array.isArray(content.workbench)
      ? (content.workbench as Record<string, unknown>)
      : {};
  const coverRaw =
    row.cover_image ??
    row.coverImage ??
    content.cover_image ??
    content.coverImage ??
    wb.cover_image ??
    wb.coverImage;
  return {
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    coverImage: String(coverRaw ?? ""),
    title: String(row.title ?? "未命名 Skills"),
    description: String(row.summary ?? row.description ?? "该作品暂未填写简介"),
    category: String(row.category ?? "通用"),
    creator: String(row.creator_name ?? "平台创作者"),
    creatorIsLawyer:
      Boolean(row.creator_lawyer_verified) ||
      String(row.creator_level ?? "").toLowerCase() === "lawyer",
    mode: toMode(row.price_type, row.price),
    useCount:
      Number(row.download_count ?? 0) +
      Number(row.view_count ?? 0) +
      Number(row.favorite_count ?? 0),
    rating: Number(row.rating ?? 0) || 4.6,
    createdAt: String(row.created_at ?? ""),
    featured: Boolean(row.is_featured),
  };
}

function fromDemoItem(x: InspirationDemoProduct): SkillCardItem {
  return {
    id: x.id,
    slug: x.id,
    coverImage: "",
    title: x.title,
    description: x.description,
    category: x.category,
    creator: x.author,
    creatorIsLawyer: Boolean(x.authorIsLawyer),
    mode: x.price === "免费" ? "免费" : "付费",
    useCount: x.goodReviewCount,
    rating: x.rating,
    createdAt: x.publishedAt,
    featured: x.featured,
  };
}

export const dynamic = "force-dynamic";

export default function FeaturedPage() {
  const [apiItems, setApiItems] = useState<SkillCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [practiceTag, setPracticeTag] = useState<string>("all");
  const [listScope, setListScope] = useState<"featured" | "all">("featured");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/proxy/skills?page=1&limit=200", { credentials: "include" });
        const payload = (await res.json().catch(() => ({}))) as {
          code?: number;
          data?: { items?: Record<string, unknown>[] };
        };
        const items = (payload?.code === 0 ? payload?.data?.items ?? [] : [])
          .map(fromApiSkill)
          .filter((x) => x.id);
        if (!cancelled) setApiItems(items);
      } catch {
        if (!cancelled) setApiItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const allItems = useMemo(() => {
    const merged = [...apiItems, ...INSPIRATION_DEMO_PRODUCTS.map(fromDemoItem)];
    const map = new Map<string, SkillCardItem>();
    for (const item of merged) {
      const key = item.id.trim() || item.title.trim();
      if (!key) continue;
      if (!map.has(key)) map.set(key, item);
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [apiItems]);

  const displayedItems = useMemo(() => {
    return allItems.filter((item) => {
      if (listScope === "featured" && !item.featured) return false;
      return categoryMatchesPracticeTag(item.category, practiceTag);
    });
  }, [allItems, practiceTag, listScope]);

  return (
    <div className="min-h-screen marketing-inspiration-index-shell">
      <section className="relative isolate overflow-hidden pt-20 shadow-[0_28px_64px_-42px_rgba(92,64,51,0.2)]">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={FEATURED_HERO_IMAGE}
            alt=""
            className="h-full min-h-[16rem] w-full object-cover sm:min-h-[18rem]"
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="marketing-hero-bottom-fade--pageheader" aria-hidden />
        <div className="relative z-[3] mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-14">
          <Link
            href="/inspiration"
            className="mb-4 inline-flex items-center gap-2 text-sm text-[#6B5D4A] drop-shadow-sm hover:text-[#D4A574]"
          >
            <ArrowLeft className="h-4 w-4" />
            返回灵感广场
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C2416] drop-shadow-sm sm:text-4xl">
            精选灵感
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-[#5D4E3A] drop-shadow-sm">
            聚合平台灵感与上架 Skills；使用业务类型标签快速定位，可切换「仅精选 / 全部」范围。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[rgba(212,165,116,0.22)] bg-[rgba(255,255,255,0.72)] px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[#B8860B]">
              范围
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setListScope("featured")}
                aria-pressed={listScope === "featured"}
                className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                  listScope === "featured"
                    ? "border-[#D4A574] bg-[rgba(212,165,116,0.15)] text-[#D4A574]"
                    : "border-[rgba(212,165,116,0.3)] text-[#5D4E3A]"
                }`}
              >
                仅精选
              </button>
              <button
                type="button"
                onClick={() => setListScope("all")}
                aria-pressed={listScope === "all"}
                className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                  listScope === "all"
                    ? "border-[#D4A574] bg-[rgba(212,165,116,0.15)] text-[#D4A574]"
                    : "border-[rgba(212,165,116,0.3)] text-[#5D4E3A]"
                }`}
              >
                全部作品
              </button>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-[rgba(212,165,116,0.22)] to-transparent" />
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[#B8860B]">
              业务类型
            </span>
            <div className="flex flex-wrap gap-2">
              {PRACTICE_TAGS.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setPracticeTag(tag.id)}
                  aria-pressed={practiceTag === tag.id}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                    practiceTag === tag.id
                      ? "border-[#D4A574] bg-[rgba(212,165,116,0.15)] text-[#D4A574]"
                      : "border-[rgba(212,165,116,0.3)] text-[#5D4E3A]"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mb-4 text-sm text-[#8A6C4D]">
          {loading ? "加载中..." : `当前列表 ${displayedItems.length} 条（库内共 ${allItems.length} 条）`}
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayedItems.length === 0 ? (
            <p className="col-span-full rounded-2xl border border-dashed border-[rgba(212,165,116,0.35)] bg-[rgba(255,248,240,0.5)] px-6 py-10 text-center text-sm text-[#8A6C4D]">
              当前筛选下暂无作品，可尝试切换「范围」或「业务类型」标签。
            </p>
          ) : (
            displayedItems.map((item) => (
              <Link
                key={item.id}
                href={`/inspiration/${encodeURIComponent(
                  String(item.id ?? "").trim() || String(item.slug ?? "").trim()
                )}`}
                className="group rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-md"
              >
              <div className="mb-3 h-32 overflow-hidden rounded-xl border border-[rgba(212,165,116,0.18)] bg-[rgba(255,248,240,0.5)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.coverImage ? withPublicMediaProxy(item.coverImage) : fallbackCoverImage(item)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-[#2C2416] group-hover:text-[#D4A574]">{item.title}</h3>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-[#9A8B78]">
                      <span>
                        {item.category} · {item.creator}
                      </span>
                      {item.creatorIsLawyer ? <PracticeLawyerBadge className="!text-[10px]" /> : null}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      item.mode === "免费"
                        ? "bg-[rgba(212,165,116,0.08)] text-[#D4A574]"
                        : "bg-[rgba(212,165,116,0.08)] text-[#B8860B]"
                    }`}
                  >
                    {item.mode}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-[#5D4E3A]">{item.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-[#9A8B78]">
                  <span>{item.useCount.toLocaleString()} 热度</span>
                  <span className="flex items-center gap-1 text-amber-600">
                    <Star className="h-3 w-3 fill-current" />
                    {item.rating.toFixed(1)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
