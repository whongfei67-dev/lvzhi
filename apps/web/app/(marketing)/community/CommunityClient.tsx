"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { community } from "@/lib/api/client";
import { getSession, type Session } from "@/lib/api/client";
import {
  MessageSquare,
  TrendingUp,
  Star,
  Plus,
  Lock,
  ArrowRight,
  Search,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { CommunityPostCard } from "@/components/community/community-post-card";
import {
  GuestMarketingUnlockContentVeil,
  GuestMarketingUnlockViewportCta,
  guestUnlockCardSurfaceClassName,
} from "@/components/common/guest-gate";
import { postPublishedYmdInShanghai, todayYmdInShanghai } from "@/lib/community-post-time";
import { COMMUNITY_HOT_TAGS, COMMUNITY_QUICK_LINKS } from "@/lib/community-sidebar-links";

/**
 * 社区首页 — 对齐《律植项目蓝图 v6.4》§5、§17.3（子页面口号 §1.0）
 * 视觉方向：琥珀咖啡色系 + 思源宋体；主标题书法字栈与首页 Hero 一致
 */

const HERO_IMAGE = "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&q=80";
/** 首页帖子列表一次拉取条数（与列表可视高度配合，减少列表与页脚之间的留白） */
const COMMUNITY_PAGE_LIMIT = 36;

interface CommunityClientProps {
  initialSearchParams?: {
    q?: string;
    tab?: string;
    tag?: string;
    /** 发布时间筛选 YYYY-MM-DD */
    date?: string;
  };
}

type DisplayPost = {
  id: string;
  author_id: string;
  title: string;
  content: string;
  tags: string[];
  topic: string;
  like_count: number;
  dislike_count: number;
  comment_count: number;
  view_count: number;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
  author_lawyer_verified: boolean;
};

function mapRecordToPost(item: Record<string, unknown>): DisplayPost {
  const tags = Array.isArray(item.tags) ? (item.tags as unknown[]).map(String) : [];
  const topic = String(item.topic || tags[0] || "讨论");
  return {
    id: String(item.id ?? ""),
    author_id: String(item.author_id ?? ""),
    title: String(item.title ?? ""),
    content: String(item.content ?? ""),
    tags,
    topic,
    like_count: Number(item.like_count ?? item.likes ?? 0),
    dislike_count: Number(item.dislike_count ?? item.dislikes ?? 0),
    comment_count: Number(item.comment_count ?? item.comments ?? 0),
    view_count: Number(item.view_count ?? item.views ?? 0),
    created_at: String(item.created_at ?? new Date().toISOString()),
    author_name: String(item.author_name ?? item.author ?? ""),
    author_avatar:
      item.author_avatar != null
        ? String(item.author_avatar)
        : item.avatar_url != null
          ? String(item.avatar_url)
          : null,
    author_lawyer_verified: Boolean(item.author_lawyer_verified ?? item.lawyer_verified ?? false),
  };
}

function postMatchesQuery(post: DisplayPost, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  const hay = [post.title, post.content, post.topic, post.author_name, ...post.tags]
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
}

/** 话题（蓝图 §5：/community/topic/*）— slug 与 `topic/[slug]/page` 中 TOPICS.id 对齐 */
const TOPIC_CHIPS: { label: string; slug: string | null }[] = [
  { label: "全部", slug: null },
  { label: "创作经验", slug: "experience" },
  { label: "案例分析", slug: "case" },
  { label: "提问求助", slug: "help" },
  { label: "讨论交流", slug: "discussion" },
];

export function CommunityClient({ initialSearchParams = {} }: CommunityClientProps) {
  const router = useRouter();
  const [rawPosts, setRawPosts] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(initialSearchParams.tab || "latest");
  const [session, setSession] = useState<Session | null>(null);
  const [publishKind, setPublishKind] = useState<"post" | "question">("post");
  const [queryInput, setQueryInput] = useState(initialSearchParams.q ?? "");
  const [publishDateFilter, setPublishDateFilter] = useState(initialSearchParams.date ?? "");
  const listScrollRef = useRef<HTMLDivElement | null>(null);

  const scrollListBy = useCallback((distance: number) => {
    listScrollRef.current?.scrollBy({ top: distance, behavior: "smooth" });
  }, []);

  useEffect(() => {
    getSession().then(setSession).catch(() => setSession(null));
  }, []);

  useEffect(() => {
    setQueryInput(initialSearchParams.q ?? "");
  }, [initialSearchParams.q]);

  useEffect(() => {
    setPublishDateFilter(initialSearchParams.date ?? "");
  }, [initialSearchParams.date]);
  useEffect(() => {
    setTab(initialSearchParams.tab || "latest");
  }, [initialSearchParams.tab]);

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        const result = await community.listPosts({
          page: 1,
          limit: COMMUNITY_PAGE_LIMIT,
          search: initialSearchParams.q,
          tag: initialSearchParams.tag,
        });
        setRawPosts(result.items);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
        setRawPosts([]);
      }
      setLoading(false);
    }
    fetchPosts();
  }, [initialSearchParams.q, initialSearchParams.tag]);

  const mergedPosts = useMemo(() => {
    const mapped = rawPosts.map(mapRecordToPost).filter((p) => p.id);
    const byId = new Map<string, DisplayPost>();
    for (const p of mapped) byId.set(p.id, p);
    const q = (initialSearchParams.q || "").trim();
    return [...byId.values()].filter((p) => postMatchesQuery(p, q));
  }, [rawPosts, initialSearchParams.tag, initialSearchParams.q]);

  const displayPosts = useMemo(() => {
    const d = publishDateFilter.trim();
    return !d ? mergedPosts : mergedPosts.filter((p) => postPublishedYmdInShanghai(p.created_at) === d);
  }, [mergedPosts, publishDateFilter]);
  const tabPosts = useMemo(() => {
    const rows = [...displayPosts];
    if (tab === "hot") {
      rows.sort((a, b) => (b.view_count + b.like_count * 3 + b.comment_count * 2) - (a.view_count + a.like_count * 3 + a.comment_count * 2));
      return rows;
    }
    if (tab === "featured") {
      const featured = rows.filter((p) => p.like_count >= 30 || p.comment_count >= 10);
      if (featured.length > 0) return featured;
    }
    rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return rows;
  }, [displayPosts, tab]);

  function replaceCommunityUrlWithTab(nextTab: string) {
    const sp = new URLSearchParams();
    if (initialSearchParams.tag) sp.set("tag", initialSearchParams.tag);
    if (initialSearchParams.q) sp.set("q", initialSearchParams.q);
    if (publishDateFilter.trim()) sp.set("date", publishDateFilter.trim());
    if (nextTab && nextTab !== "latest") sp.set("tab", nextTab);
    router.replace(sp.toString() ? `/community?${sp}` : "/community");
  }

  function replaceCommunityUrlWithDate(date: string) {
    const sp = new URLSearchParams();
    if (initialSearchParams.tag) sp.set("tag", initialSearchParams.tag);
    if (initialSearchParams.q) sp.set("q", initialSearchParams.q);
    if (date.trim()) sp.set("date", date.trim());
    router.replace(sp.toString() ? `/community?${sp}` : "/community");
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (initialSearchParams.tag) sp.set("tag", initialSearchParams.tag);
    const t = queryInput.trim();
    if (t) sp.set("q", t);
    if (publishDateFilter.trim()) sp.set("date", publishDateFilter.trim());
    const qs = sp.toString();
    router.push(qs ? `/community?${qs}` : "/community");
  }

  const newPostHref = session
    ? `/community/new${publishKind === "question" ? "?intent=question" : ""}`
    : "/login";

  return (
    <div className="min-h-screen marketing-page-shell-tint">
      <section
        className="page-header marketing-hero--inspiration-scale relative overflow-hidden"
        style={{ position: "relative" }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            overflow: "hidden",
          }}
        >
          <img
            src={HERO_IMAGE}
            alt="社区背景"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="relative z-[2] mx-auto w-full max-w-6xl px-6 lg:px-8">
          <div className="page-header-content animate-fade-in-up">
            <h1 className="hero-title">{preferTradForKeShiLu("法路同行 技脉共生")}</h1>
            <p className="marketing-hero-subtitle-serif marketing-subtitle--kai max-w-3xl">
              聚专业之人，聊专业之事，守心底之温
            </p>
            <form className="hero-search-box" onSubmit={submitSearch}>
              <Search className="text-[#9A8B78]" aria-hidden />
              <input
                type="search"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder={preferTradForKeShiLu("搜索关键词，查找帖子标题与内容…")}
                className="text-[#2C2416]"
                name="community-q"
              />
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#9AA59D]">话题</p>
        <div className="flex flex-wrap gap-2">
          {TOPIC_CHIPS.map(({ label, slug }) => (
            <Link
              key={label}
              href={slug ? `/community/topic/${encodeURIComponent(slug)}` : "/community"}
              className="tag-border transition-all hover:border-[#D4A574] hover:bg-[rgba(212,165,116,0.08)] hover:text-[#284A3D]"
            >
              {label}
            </Link>
          ))}
          <Link href="/community/topic" className="tag-border text-sm text-[#5D4E3A] hover:border-[#D4A574]">
            话题广场 →
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-6 flex flex-col gap-3 border-b border-[rgba(212,165,116,0.25)] sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setTab("latest");
                    replaceCommunityUrlWithTab("latest");
                  }}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    tab === "latest"
                      ? "border-[#D4A574] text-[#D4A574]"
                      : "border-transparent text-[#5D4E3A] hover:text-[#2C2416]"
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  最新
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab("hot");
                    replaceCommunityUrlWithTab("hot");
                  }}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    tab === "hot"
                      ? "border-[#D4A574] text-[#D4A574]"
                      : "border-transparent text-[#5D4E3A] hover:text-[#2C2416]"
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  热门
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab("featured");
                    replaceCommunityUrlWithTab("featured");
                  }}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    tab === "featured"
                      ? "border-[#D4A574] text-[#D4A574]"
                      : "border-transparent text-[#5D4E3A] hover:text-[#2C2416]"
                  }`}
                >
                  <Star className="h-4 w-4" />
                  精华
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 pb-2 sm:pb-3">
                <label
                  htmlFor="community-publish-date-filter"
                  className="text-sm font-medium text-[#5D4E3A] whitespace-nowrap"
                >
                  发布时间
                </label>
                <input
                  id="community-publish-date-filter"
                  type="date"
                  value={publishDateFilter}
                  max={todayYmdInShanghai()}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPublishDateFilter(v);
                    replaceCommunityUrlWithDate(v);
                  }}
                  className="rounded-xl border border-[rgba(212,165,116,0.35)] bg-white px-3 py-2 text-sm text-[#2C2416] outline-none focus:border-[#D4A574] focus:ring-2 focus:ring-[#D4A574]/20"
                />
                {publishDateFilter ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPublishDateFilter("");
                      replaceCommunityUrlWithDate("");
                    }}
                    className="text-sm font-medium text-[#D4A574] underline-offset-2 hover:underline"
                  >
                    清除日期
                  </button>
                ) : null}
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse card p-6">
                    <div className="h-5 w-3/4 rounded bg-[rgba(212,165,116,0.1)]" />
                    <div className="mt-2 h-4 w-full rounded bg-[rgba(212,165,116,0.05)]" />
                    <div className="mt-4 flex gap-4">
                      <div className="h-3 w-20 rounded bg-[rgba(212,165,116,0.05)]" />
                      <div className="h-3 w-20 rounded bg-[rgba(212,165,116,0.05)]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayPosts.length === 0 ? (
              <div className="card p-12 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-[#9A8B78]" />
                <h3 className="mt-4 text-lg font-semibold text-[#2C2416]">暂无匹配帖子</h3>
                <p className="mt-2 text-sm text-[#5D4E3A]">
                  {publishDateFilter.trim()
                    ? `该日（${publishDateFilter}）暂无帖子，可更换日期或清除筛选。`
                    : "试试更换关键词或清空筛选。"}
                </p>
                <Link href="/community" className="btn-primary mt-4 inline-flex">
                  返回全部
                </Link>
              </div>
            ) : (
              <div className="relative">
                <div
                  ref={listScrollRef}
                  className={`relative overflow-y-auto py-2 pl-1 pr-[4.75rem] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
                    session
                      ? "max-h-[min(calc(100dvh_-_14rem),min(88vh,52rem))]"
                      : "h-[min(calc(100dvh_-_14rem),min(88vh,52rem))] max-h-[min(calc(100dvh_-_14rem),min(88vh,52rem))] overflow-x-hidden"
                  }`}
                >
                  <div className={session ? "relative" : "relative min-h-full"}>
                    <div className="space-y-2">
                      {tabPosts.map((post) => (
                        <CommunityPostCard key={post.id} post={post} />
                      ))}
                    </div>
                    <div aria-hidden className="h-6" />
                    {!session ? <GuestMarketingUnlockContentVeil /> : null}
                  </div>
                  {!session ? (
                    <GuestMarketingUnlockViewportCta
                      ariaLabel={preferTradForKeShiLu("登录后查看更多精彩讨论")}
                      title={preferTradForKeShiLu("登录后查看更多精彩讨论")}
                      subtitle="点赞、评论、收藏与发布帖子等需要登录后操作。"
                      loginHref={`/login?next=${encodeURIComponent("/community")}`}
                    />
                  ) : null}
                </div>
                <div className="absolute right-2 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2">
                  <button
                    type="button"
                    aria-label="向上滚动帖子列表"
                    onClick={() => scrollListBy(-360)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(212,165,116,0.38)] bg-[rgba(255,251,244,0.95)] text-[#8A6C4D] shadow-sm transition hover:border-[#D4A574] hover:text-[#5C4033]"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="向下滚动帖子列表"
                    onClick={() => scrollListBy(360)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(212,165,116,0.38)] bg-[rgba(255,251,244,0.95)] text-[#8A6C4D] shadow-sm transition hover:border-[#D4A574] hover:text-[#5C4033]"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div
              className={
                session
                  ? `${guestUnlockCardSurfaceClassName} space-y-4 bg-[rgba(255,255,255,0.72)] p-7 text-left backdrop-blur-md`
                  : `${guestUnlockCardSurfaceClassName} space-y-4 bg-[rgba(255,255,255,0.85)] p-6 text-left backdrop-blur-sm`
              }
            >
              <h3 className="flex items-center gap-2 font-semibold text-[#5C4033]">
                <Plus className="h-[18px] w-[18px] shrink-0 text-[#D4A574]" aria-hidden />
                分享你的经验
              </h3>
              <p className="text-sm leading-relaxed text-[#5D4E3A]">
                案例分析、创作经验、法律场景讨论…选择类型后发布帖子。
              </p>
              <div className="space-y-1.5">
                <label htmlFor="community-publish-kind" className="text-xs font-medium text-[#9A8B78]">
                  发布类型
                </label>
                <select
                  id="community-publish-kind"
                  value={publishKind}
                  onChange={(e) => setPublishKind(e.target.value as "post" | "question")}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm text-[#2C2416] outline-none focus:border-[#D4A574] focus:ring-2 focus:ring-[#D4A574]/20 ${
                    session
                      ? "border-[rgba(212,165,116,0.18)] bg-[rgba(255,255,255,0.55)] backdrop-blur-sm"
                      : "border-[rgba(212,165,116,0.35)] bg-white"
                  }`}
                >
                  <option value="post">发布讨论帖子</option>
                  <option value="question">发布提问帖</option>
                </select>
              </div>
              <Link
                href={newPostHref}
                className={`flex w-full items-center justify-center gap-2 ${guestUnlockCardSurfaceClassName} bg-[rgba(255,255,255,0.5)] px-8 py-3 text-sm font-semibold text-[#5C4033] backdrop-blur-md transition-colors hover:border-[rgba(212,165,116,0.32)] hover:bg-[rgba(255,255,255,0.82)] hover:text-[#4E3B2D]`}
              >
                <Plus className="h-4 w-4" />
                {session ? "发布帖子" : "登录后发布"}
              </Link>
              {!session ? (
                <p className="text-center text-xs leading-relaxed text-[#9A8B78]">
                  <Lock className="inline h-3 w-3 align-middle" /> 登录后可选择计划发布日期
                </p>
              ) : null}
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-[#2C2416]">热门标签</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {COMMUNITY_HOT_TAGS.map((tag) => (
                  <Link
                    key={tag}
                    href={`/community/tag/${encodeURIComponent(tag)}`}
                    className="tag transition-all hover:bg-[rgba(212,165,116,0.2)]"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-[#2C2416]">快捷入口</h3>
              <div className="mt-4 space-y-2">
                {COMMUNITY_QUICK_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between rounded-xl bg-[rgba(212,165,116,0.06)] p-3 text-sm text-[#5D4E3A] transition-all hover:bg-[rgba(212,165,116,0.12)] hover:text-[#D4A574]"
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
