"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  Award,
  BookOpen,
  ChevronLeft,
  Clock,
  FileDown,
  LayoutGrid,
  Library,
  MessageSquare,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { GuestGate } from "@/components/common/guest-gate";
import { PracticeLawyerBadge } from "@/components/common/practice-lawyer-badge";
import { ReportCornerButton } from "@/components/common/report-corner-button";
import {
  creatorExperienceYearsSince,
  findInspirationDemoProduct,
  type InspirationDemoProduct,
} from "@/lib/inspiration-demo-items";
import { claimSkillToWorkbenchLocal } from "@/lib/workbench/extra-purchased-skills";
import { getSession } from "@/lib/api/client";
import { withPublicMediaProxy } from "@/lib/media-url";

/** 浅色头图：明亮会议室 / 商务讨论场景（可替换 URL） */
const INSPIRATION_DETAIL_HERO_IMAGE =
  "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1920&q=80";

function segmentSlug(raw: string | string[] | undefined): string {
  if (raw == null) return "";
  return Array.isArray(raw) ? (raw[0] ?? "") : raw;
}

function formatGoodReviewCount(n: number): string {
  if (n >= 10000) return `${Math.round(n / 1000) / 10}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

function formatPublishedDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

function numberFromUnknown(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function textFromUnknown(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return fallback;
}

function mapSkillApiToProduct(row: Record<string, unknown>, slug: string): InspirationProductView {
  const content = row.content && typeof row.content === "object" && !Array.isArray(row.content)
    ? (row.content as Record<string, unknown>)
    : {};
  const wb =
    content.workbench && typeof content.workbench === "object" && !Array.isArray(content.workbench)
      ? (content.workbench as Record<string, unknown>)
      : {};
  const priceType = textFromUnknown(row.price_type, "paid");
  const priceNum = numberFromUnknown(row.price, 0);
  const price =
    textFromUnknown(wb.price_label) ||
    (priceType === "free" ? "免费" : `¥${priceNum.toFixed(2).replace(/\.00$/, "")}`);
  const viewCount = numberFromUnknown(row.view_count, 0);
  const downloadCount = numberFromUnknown(row.download_count, 0);
  const favoriteCount = numberFromUnknown(row.favorite_count, 0);
  const creatorName = textFromUnknown(row.creator_name, "认证创作者");
  const creatorObj =
    row.creator && typeof row.creator === "object" && !Array.isArray(row.creator)
      ? (row.creator as Record<string, unknown>)
      : {};
  const creatorAvatarRaw =
    textFromUnknown(row.creator_avatar) ||
    textFromUnknown(row.creator_avatar_url) ||
    textFromUnknown(creatorObj.avatar_url) ||
    textFromUnknown(creatorObj.avatar) ||
    textFromUnknown(row.avatar_url) ||
    textFromUnknown(row.avatar);
  const creatorId = textFromUnknown(row.creator_id, "");
  const creatorVerified = Boolean(row.creator_verified);
  const creatorIsLawyer =
    Boolean(row.creator_lawyer_verified) || textFromUnknown(row.creator_level, "").toLowerCase() === "lawyer";
  const title = textFromUnknown(row.title, textFromUnknown(row.name, "未命名 Skills"));
  const summary = textFromUnknown(row.summary, "");
  const description = textFromUnknown(row.description, "");
  const createdAt = textFromUnknown(row.created_at, new Date().toISOString());
  const rating = numberFromUnknown(row.rating, 4.8);
  const reviewCount = numberFromUnknown(row.review_count, 0);

  return {
    id: textFromUnknown(row.id, slug),
    title,
    author: creatorName,
    authorAvatar: withPublicMediaProxy(
      creatorAvatarRaw || `https://i.pravatar.cc/96?u=${encodeURIComponent(creatorName || slug)}`
    ),
    authorVerified: creatorVerified,
    authorIsLawyer: creatorIsLawyer,
    lawyerSlug: creatorId || textFromUnknown(wb.lawyer_slug, creatorName || "认证创作者"),
    creatorRegisteredAt: textFromUnknown(row.updated_at, createdAt),
    category: textFromUnknown(row.category, "通用"),
    rating,
    goodReviewCount: reviewCount,
    publishedAt: createdAt,
    stats: `${viewCount} 浏览 · ${downloadCount} 下载 · ${favoriteCount} 收藏`,
    price,
    featured: Boolean(row.is_featured),
    description: summary || description || "该 Skills 暂未填写详细介绍。",
    coverImage: textFromUnknown(row.cover_image, ""),
    reviewExcerpt: textFromUnknown(wb.review_excerpt, "该作品已由创作者更新，欢迎体验后提交评价。"),
    reviewReviewer: textFromUnknown(wb.review_reviewer, "平台用户"),
    source: "api",
    architecture: description || "",
    tools: textFromUnknown(wb.tools, ""),
    scenarios: textFromUnknown(wb.scenarios, ""),
    creatorId,
  };
}

type InspirationProductView = InspirationDemoProduct & {
  source?: "api" | "demo";
  coverImage?: string;
  architecture?: string;
  tools?: string;
  scenarios?: string;
  authorIsLawyer?: boolean;
  creatorId?: string;
};

async function hydrateCreatorProfile(product: InspirationProductView): Promise<InspirationProductView> {
  const creatorId = String(product.creatorId || "").trim();
  if (!creatorId) return product;
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(creatorId)}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return product;
    const json = (await res.json().catch(() => ({}))) as {
      code?: number;
      data?: Record<string, unknown>;
    };
    if (json?.code !== 0 || !json.data) return product;
    const p = json.data;
    const avatar = textFromUnknown(p.avatar_url) || textFromUnknown(p.avatar) || "";
    const name = textFromUnknown(p.display_name) || textFromUnknown(p.nickname) || "";
    return {
      ...product,
      authorAvatar: avatar ? withPublicMediaProxy(avatar) : product.authorAvatar,
      author: product.author === "认证创作者" && name ? name : product.author,
      authorVerified: product.authorVerified || Boolean(p.verified),
      authorIsLawyer: product.authorIsLawyer || Boolean(p.lawyer_verified),
      lawyerSlug: creatorId,
    };
  } catch {
    return product;
  }
}

/** 演示用产品架构简图（SVG），登录后通过 GuestGate 展示清晰版 */
function ProductArchitectureDiagram() {
  const arrowMarkerId = useId().replace(/:/g, "_");
  const box = {
    fill: "rgba(255,248,240,0.95)",
    stroke: "rgba(212,165,116,0.55)",
    title: "#5C4033",
    sub: "#8B7355",
  };
  return (
    <div className="overflow-x-auto rounded-xl border border-[rgba(212,165,116,0.2)] bg-[rgba(255,248,240,0.5)] p-4">
      <svg
        viewBox="0 0 520 300"
        className="mx-auto h-auto w-full max-w-[520px]"
        role="img"
        aria-label="产品架构简图：用户触点、编排层与数据能力"
      >
        <defs>
          <marker id={arrowMarkerId} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="rgba(184,134,11,0.85)" />
          </marker>
        </defs>

        <rect x="140" y="16" width="240" height="52" rx="12" fill={box.fill} stroke={box.stroke} strokeWidth="1.5" />
        <text x="260" y="40" textAnchor="middle" fill={box.title} fontSize="13" fontWeight="600">
          用户触点
        </text>
        <text x="260" y="58" textAnchor="middle" fill={box.sub} fontSize="11">
          Web · 工作台 · 协作分享
        </text>

        <line
          x1="260"
          y1="68"
          x2="260"
          y2="92"
          stroke="rgba(184,134,11,0.65)"
          strokeWidth="1.5"
          markerEnd={`url(#${arrowMarkerId})`}
        />

        <rect x="96" y="92" width="328" height="56" rx="12" fill={box.fill} stroke={box.stroke} strokeWidth="1.5" />
        <text x="260" y="118" textAnchor="middle" fill={box.title} fontSize="13" fontWeight="600">
          Skills 编排与交付
        </text>
        <text x="260" y="136" textAnchor="middle" fill={box.sub} fontSize="11">
          流程模板 · 人机协同 · 版本与审计
        </text>

        <line x1="160" y1="148" x2="160" y2="178" stroke="rgba(184,134,11,0.5)" strokeWidth="1.2" />
        <line x1="260" y1="148" x2="260" y2="178" stroke="rgba(184,134,11,0.5)" strokeWidth="1.2" />
        <line x1="360" y1="148" x2="360" y2="178" stroke="rgba(184,134,11,0.5)" strokeWidth="1.2" />

        <rect x="24" y="178" width="148" height="96" rx="12" fill={box.fill} stroke={box.stroke} strokeWidth="1.5" />
        <text x="98" y="206" textAnchor="middle" fill={box.title} fontSize="12" fontWeight="600">
          条款与模板库
        </text>
        <text x="98" y="228" textAnchor="middle" fill={box.sub} fontSize="10">
          合同片段
        </text>
        <text x="98" y="244" textAnchor="middle" fill={box.sub} fontSize="10">
          清单与范例
        </text>

        <rect x="186" y="178" width="148" height="96" rx="12" fill={box.fill} stroke={box.stroke} strokeWidth="1.5" />
        <text x="260" y="206" textAnchor="middle" fill={box.title} fontSize="12" fontWeight="600">
          规则与校验
        </text>
        <text x="260" y="228" textAnchor="middle" fill={box.sub} fontSize="10">
          字段约束
        </text>
        <text x="260" y="244" textAnchor="middle" fill={box.sub} fontSize="10">
          风险提示逻辑
        </text>

        <rect x="348" y="178" width="148" height="96" rx="12" fill={box.fill} stroke={box.stroke} strokeWidth="1.5" />
        <text x="422" y="206" textAnchor="middle" fill={box.title} fontSize="12" fontWeight="600">
          外部数据
        </text>
        <text x="422" y="228" textAnchor="middle" fill={box.sub} fontSize="10">
          公开案例
        </text>
        <text x="422" y="244" textAnchor="middle" fill={box.sub} fontSize="10">
          企业知识（可选）
        </text>
      </svg>
      <p className="mt-2 text-center text-xs text-[#9A8B78]">示意结构，以实际上线版本为准</p>
    </div>
  );
}

export default function InspirationProductDetailPage() {
  const router = useRouter();
  const routeParams = useParams<{ slug?: string | string[] }>();
  const slug = segmentSlug(routeParams?.slug).trim();

  const [product, setProduct] = useState<InspirationProductView | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!slug) {
      setProduct(null);
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const tryFetch = async (url: string) => {
          const res = await fetch(url, { credentials: "include", cache: "no-store" });
          if (!res.ok) return null;
          const json = (await res.json()) as {
            code?: number;
            data?: Record<string, unknown> | null;
          };
          if (json?.code !== undefined && json.code !== 0) return null;
          const row = json?.data;
          return row && typeof row === "object" && !Array.isArray(row) ? row : null;
        };
        const encoded = encodeURIComponent(slug);
        const data =
          (await tryFetch(`/api/skills/${encoded}`)) ??
          // 兼容「仅创作者接口可命中」或链接曾用 slug、第二跳需带登录态
          (await tryFetch(`/api/creator/skills/${encoded}`));
        if (!cancelled && data) {
          const mapped = mapSkillApiToProduct(data, slug);
          const hydrated = await hydrateCreatorProfile(mapped);
          if (cancelled) return;
          setProduct(hydrated);
          setNotFound(false);
          setLoading(false);
          return;
        }
      } catch {
        // ignore and fallback to demo
      }

      const found = findInspirationDemoProduct(slug);
      if (!cancelled) {
        if (found) {
          setProduct({ ...(found as InspirationProductView), source: "demo" });
          setNotFound(false);
        } else {
          setProduct(null);
          setNotFound(true);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] pt-20">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-64 rounded-lg bg-[rgba(212,165,116,0.15)]" />
            <div className="h-48 rounded-2xl bg-[rgba(212,165,116,0.12)]" />
            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <div className="h-96 rounded-2xl bg-[rgba(212,165,116,0.1)]" />
              <div className="h-72 rounded-2xl bg-[rgba(212,165,116,0.1)]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] px-6 py-16 pt-20">
        <div className="mx-auto max-w-lg rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white/90 p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-[#5C4033]">未找到该作品</p>
          <p className="mt-2 text-sm text-[#9A8B78]">
            链接可能已失效，或该作品尚未上架。请从灵感广场重新选择。
          </p>
          <Link
            href="/inspiration"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#5C4033] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#8B7355]"
          >
            <ChevronLeft className="h-4 w-4" />
            返回灵感广场
          </Link>
        </div>
      </div>
    );
  }

  const creatorHref = `/professionals/${encodeURIComponent(product.lawyerSlug)}`;
  const authorRoleLabel = product.authorIsLawyer ? "执业律师" : "认证创作者";
  const collaborationMessageHref = `/professionals/${encodeURIComponent(product.lawyerSlug)}/message?${new URLSearchParams({
    intent: "collaboration",
    from: "inspiration",
    productId: product.id,
    productTitle: product.title,
  }).toString()}`;
  const creatorYears = creatorExperienceYearsSince(product.creatorRegisteredAt);
  const isFree = product.price === "免费";
  const scenarioList = (product.scenarios || "")
    .split(/[\n,，、；;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const toolList = (product.tools || "")
    .split(/[\n,，、；;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const rechargeHref = `/recharge?from=inspiration&slug=${encodeURIComponent(slug)}&id=${encodeURIComponent(product.id)}`;
  const downloadProductHref = `/inspiration/${encodeURIComponent(slug)}/download?kind=product`;

  const addFreeToWorkbench = async () => {
    try {
      const session = await getSession();
      if (!session || session.role === "visitor") return;
      claimSkillToWorkbenchLocal(product.id, product.title);
      const studioHref =
        session.role === "creator"
          ? "/creator/workbench/cre-studio"
          : "/workspace/workbench/cli-studio";
      router.push(studioHref);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-screen pb-16 marketing-inspiration-detail-shell">
      {/* Hero — 浅色工作室 / 课堂氛围；背景顶到视口含顶栏区，透明导航可透出 */}
      <section className="relative overflow-hidden bg-[#E8DDD0] pb-10">
        <div className="pointer-events-none absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={INSPIRATION_DETAIL_HERO_IMAGE}
            alt=""
            className="h-full w-full object-cover opacity-[0.68]"
          />
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#F7EEE6]/58 via-[#EFE4D7]/46 to-[#E6D5C4]/36"
            aria-hidden
          />
          <div className="marketing-hero-fade-cream" aria-hidden />
        </div>

        <div className="relative z-[2] mx-auto max-w-6xl px-6 pb-10 pt-20 md:pt-24 lg:px-8">
          <Link
            href="/inspiration"
            className="mb-6 inline-flex items-center gap-1 text-sm text-[#8B7355] transition-colors hover:text-[#5C4033]"
          >
            <ChevronLeft className="h-4 w-4" />
            灵感广场
          </Link>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <div className="relative shrink-0">
              <div className="h-[120px] w-[120px] overflow-hidden rounded-3xl border-[3px] border-[#D4A574] bg-[rgba(255,255,255,0.75)] shadow-md md:h-[140px] md:w-[140px]">
                {product.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={withPublicMediaProxy(product.coverImage)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Sparkles className="h-14 w-14 text-[#D4A574] md:h-16 md:w-16" aria-hidden />
                  </div>
                )}
              </div>
              {product.featured ? (
                <div className="absolute -bottom-1.5 -right-1.5 rounded-full border-[3px] border-white bg-[#D4A574] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                  精选
                </div>
              ) : null}
            </div>

            <div className="min-w-0 flex-1 text-center lg:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <span className="rounded-full border border-[rgba(212,165,116,0.35)] bg-white/85 px-3 py-1 text-xs font-medium text-[#5D4E3A] shadow-sm backdrop-blur-sm">
                  {product.category}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(212,165,116,0.35)] bg-white/85 px-3 py-1 text-xs font-medium text-[#5D4E3A] shadow-sm backdrop-blur-sm">
                  <Star className="h-3.5 w-3.5 fill-[#D4A574] text-[#D4A574]" />
                  {product.rating}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
                    isFree ? "bg-[#D4A574] text-white" : "border border-[rgba(212,165,116,0.4)] bg-white/90 text-[#5C4033]"
                  }`}
                >
                  {product.price}
                </span>
              </div>

              <h1 className="mt-4 font-serif text-2xl font-bold leading-snug tracking-wide text-[#2C2416] md:text-3xl">
                {product.title}
              </h1>

              <p className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-[#6B5B4D] lg:justify-start">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 shrink-0 text-[#D4A574]" />
                  发布 {formatPublishedDate(product.publishedAt)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 shrink-0 text-[#D4A574]" />
                  {formatGoodReviewCount(product.goodReviewCount)} 好评
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Award className="h-4 w-4 shrink-0 text-[#D4A574]" />
                  {product.stats}
                </span>
              </p>

              <p className="mt-6 rounded-xl border border-[rgba(212,165,116,0.28)] bg-white/75 px-4 py-2 text-left text-xs leading-relaxed text-[#6B5B4D] shadow-sm backdrop-blur-sm">
                {product.source === "api"
                  ? "当前内容来自创作者工作台已保存的数据，详情页会随保存结果同步更新。"
                  : "当前为演示作品数据；正式发布后将接入真实商品信息与购买流程。"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <div className="inspiration-detail-hover-card rounded-[20px] border border-[rgba(212,165,116,0.25)] bg-white p-7 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#5C4033]">
                <BookOpen className="h-5 w-5 text-[#D4A574]" />
                产品简介
              </h2>
              <p className="leading-relaxed text-[#5D4E3A]">{product.description}</p>
            </div>

            <div className="inspiration-detail-hover-card rounded-[20px] border border-[rgba(212,165,116,0.25)] bg-white p-7 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#5C4033]">
                <Library className="h-5 w-5 text-[#D4A574]" />
                适用场景
              </h2>
              {scenarioList.length ? (
                <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-[#5D4E3A]">
                  {scenarioList.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              ) : (
                <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-[#5D4E3A]">
                  <li>高频法律业务场景下的标准化交付与团队协作</li>
                  <li>需要快速对齐客户预期、减少沟通成本的售前材料</li>
                  <li>培训新人、沉淀方法论时的参考结构与清单</li>
                </ul>
              )}
            </div>

            <div className="inspiration-detail-hover-card rounded-[20px] border border-[rgba(212,165,116,0.25)] bg-white p-7 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#5C4033]">
                <LayoutGrid className="h-5 w-5 text-[#D4A574]" />
                产品架构简图
              </h2>
              <GuestGate
                action="登录后查看"
                mode="hidden"
                description="登录后可查看完整产品架构简图，了解交付层次与数据关系"
              >
                {product.architecture ? (
                  <div className="mb-3 rounded-xl border border-[rgba(212,165,116,0.2)] bg-[rgba(255,248,240,0.45)] px-3 py-2 text-sm leading-relaxed text-[#5D4E3A]">
                    {product.architecture}
                  </div>
                ) : null}
                {toolList.length ? (
                  <div className="mb-3 rounded-xl border border-[rgba(212,165,116,0.18)] bg-white px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#B8860B]">采用工具</p>
                    <p className="mt-1 text-sm leading-relaxed text-[#5D4E3A]">{toolList.join("、")}</p>
                  </div>
                ) : null}
                <ProductArchitectureDiagram />
              </GuestGate>
            </div>

            <div className="inspiration-detail-hover-card rounded-[20px] border border-[rgba(212,165,116,0.25)] bg-white p-7 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#5C4033]">
                <MessageSquare className="h-5 w-5 text-[#D4A574]" />
                用户评价
              </h2>
              <GuestGate
                action="查看全部评价"
                mode="blur"
                description="登录后可查看完整评价列表并撰写你的使用反馈"
              >
                <div className="space-y-4">
                  <div className="rounded-xl border border-[rgba(212,165,116,0.15)] bg-[rgba(255,248,240,0.65)] p-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-[#D4A574] text-[#D4A574]" />
                      <span className="text-sm font-semibold text-[#2C2416]">精选评价</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[#5D4E3A]">
                      &ldquo;{product.reviewExcerpt}&rdquo;
                    </p>
                    <p className="mt-2 text-xs text-[#9A8B78]">—— {product.reviewReviewer}</p>
                  </div>
                  <p className="text-xs text-[#9A8B78]">更多评价将在登录后展示（演示占位）。</p>
                </div>
              </GuestGate>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="inspiration-detail-hover-card rounded-[20px] border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-[#5C4033]">获取与文档</h3>
              {isFree ? (
                <p className="text-center text-sm leading-relaxed text-[#5D4E3A]">
                  本作品<span className="mx-1 font-semibold text-[#D4A574]">免费</span>
                  ；加入工作台后，可在侧栏「工作画布与文件」的已购技能中自选使用。
                </p>
              ) : (
                <>
                  <p className="text-center text-xs font-medium text-[#9A8B78]">价格</p>
                  <p className="mt-2 text-center text-3xl font-bold text-[#2C2416]">{product.price}</p>
                </>
              )}

              <GuestGate
                action="登录后解锁"
                mode="hidden"
                description="登录后可购买、下载作品包"
              >
                <div className="mt-5 flex flex-col gap-2">
                  {isFree ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void addFreeToWorkbench()}
                        className="flex w-full items-center justify-center rounded-xl bg-[#5C4033] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8B7355]"
                      >
                        加入工作台
                      </button>
                      <a
                        href={downloadProductHref}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(212,165,116,0.35)] bg-[rgba(255,248,240,0.6)] py-2.5 text-sm font-semibold text-[#5C4033] transition-colors hover:border-[#D4A574] hover:bg-[rgba(212,165,116,0.12)]"
                      >
                        <FileDown className="h-4 w-4 shrink-0 text-[#D4A574]" aria-hidden />
                        下载演示包
                      </a>
                    </>
                  ) : (
                    <>
                      <Link
                        href={rechargeHref}
                        className="flex w-full items-center justify-center rounded-xl bg-[#5C4033] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8B7355]"
                      >
                        立即购买
                      </Link>
                      <Link
                        href={rechargeHref}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(212,165,116,0.35)] bg-[rgba(255,248,240,0.6)] py-2.5 text-sm font-semibold text-[#5C4033] transition-colors hover:border-[#D4A574] hover:bg-[rgba(212,165,116,0.12)]"
                      >
                        <FileDown className="h-4 w-4 shrink-0 text-[#D4A574]" aria-hidden />
                        获取产品
                      </Link>
                    </>
                  )}
                  <p className="text-[11px] leading-relaxed text-[#9A8B78]">
                    {isFree
                      ? "「加入工作台」会将本技能记入画布侧已购列表（演示环境本机记录）；亦可单独下载演示包。"
                      : "支付完成后，订单将同步至「已购内容」；进入工作台「工作画布与文件」即可在已购技能中查看与选用。"}
                  </p>
                </div>
              </GuestGate>

              <Link
                href="/inspiration"
                className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl border border-[rgba(212,165,116,0.3)] py-2.5 text-sm font-medium text-[#5D4E3A] transition-colors hover:border-[#D4A574] hover:text-[#D4A574]"
              >
                返回灵感广场
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-[20px] border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-[#5C4033]">关于创作者</h3>
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={withPublicMediaProxy(product.authorAvatar)}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-[rgba(212,165,116,0.25)]"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={creatorHref}
                      className="font-medium text-[#2C2416] transition-colors hover:text-[#B8860B]"
                    >
                      {product.author}
                    </Link>
                    {product.authorIsLawyer ? <PracticeLawyerBadge className="!text-[10px]" /> : null}
                    <span className="tag text-xs">{authorRoleLabel}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[#9A8B78]">
                    {product.authorVerified ? "平台已认证。" : "创作者档案待完善。"}
                    点击姓名进入创作者主页，查看其公开档案与更多作品。
                  </p>
                  <p className="mt-2 text-xs font-medium text-[#5D4E3A]">
                    创作经验
                    <span className="mx-1 text-[#D4A574]">·</span>
                    {creatorYears < 1 ? "不足 1 年" : `${creatorYears} 年`}
                  </p>
                  <Link
                    href={creatorHref}
                    className="mt-2 inline-flex text-xs font-semibold text-[#D4A574] hover:text-[#B8860B]"
                  >
                    进入创作者主页 →
                  </Link>
                </div>
              </div>
              <div className="mt-4 w-full min-w-0">
                <GuestGate
                  action="登录后解锁"
                  mode="hidden"
                  description="登录后可发起合作邀请。留言后创作者将尽快与您联系。"
                  className="min-h-[168px]"
                >
                  <div className="flex justify-end pt-1">
                    <Link
                      href={collaborationMessageHref}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(212,165,116,0.35)] bg-[rgba(255,248,240,0.9)] px-3 py-2 text-xs font-semibold text-[#5C4033] shadow-sm transition-colors hover:border-[#D4A574] hover:bg-[rgba(212,165,116,0.12)]"
                    >
                      <Users className="h-3.5 w-3.5 shrink-0 text-[#D4A574]" aria-hidden />
                      合作邀请
                    </Link>
                  </div>
                </GuestGate>
              </div>
            </div>

            <p className="text-right text-[11px] leading-relaxed text-[#9A8B78]">
              本平台展示的法律技能与智能体等内容由创作者自行提供，仅供信息参考与学习交流，不构成律师对特定事项的法律意见或委托关系。你基于任何内容所作出的判断与行为均由你自行承担；如需正式法律服务，请通过合法途径聘请执业律师并签署书面协议。
            </p>
            <div className="flex justify-end">
              <ReportCornerButton
                targetType="skill"
                targetId={String(product.id || "").trim()}
                cornerLabel="举报此产品"
              />
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
