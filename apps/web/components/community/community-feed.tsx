"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { PaywallModal } from "./paywall-modal";

interface Post {
  id: string;
  title: string;
  content: string | null;
  tags: string[] | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  created_at: string | null;
  is_paid?: boolean | null;
  price?: number | null;
  profiles: {
    display_name: string | null;
    verified: boolean;
    lawyer_verified?: boolean | null;
  } | null;
}

interface LocalComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface CommunityFeedProps {
  posts: Post[];
  user: User | null;
}

function timeAgo(dateStr: string | null | undefined) {
  if (!dateStr) return "刚刚";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "刚刚";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小时前`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} 天前`;
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

// ─── Per-post action bar ──────────────────────────────────────────────────────

function PostActions({
  post,
  user,
  onPaywall,
}: {
  post: Post;
  user: User | null;
  onPaywall: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0);
  const [liking, setLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<LocalComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comment_count ?? 0);

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liking) return;
    if (!user) { window.location.href = "/auth/login"; return; }

    setLiking(true);
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => next ? c + 1 : c - 1);

    try {
      const supabase = createClient();
      await supabase
        .from("community_posts")
        .update({ like_count: next ? likeCount + 1 : likeCount - 1 })
        .eq("id", post.id);
    } catch {
      // revert on failure
      setLiked(!next);
      setLikeCount((c) => !next ? c + 1 : c - 1);
    } finally {
      setLiking(false);
    }
  }, [liked, liking, likeCount, post.id, user]);

  const handleShare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/community#${post.id}`;
    if (navigator.share) {
      navigator.share({ title: post.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [post.id, post.title]);

  const handleCommentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.is_paid && !showComments) { onPaywall(); return; }
    setShowComments((v) => !v);
  }, [post.is_paid, showComments, onPaywall]);

  const handleSubmitComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;
    if (!user) { window.location.href = "/auth/login"; return; }

    setSubmitting(true);
    const text = commentText.trim();
    setCommentText("");

    // Optimistic add
    const local: LocalComment = {
      id: `local-${Date.now()}`,
      author: user.email?.split("@")[0] ?? "我",
      text,
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [...prev, local]);
    setCommentCount((c) => c + 1);

    try {
      const supabase = createClient();
      await supabase.from("community_posts").update({
        comment_count: commentCount + 1,
      }).eq("id", post.id);
    } catch {
      // keep optimistic state
    } finally {
      setSubmitting(false);
    }
  }, [commentText, submitting, user, commentCount, post.id]);

  return (
    <div className="pl-11 space-y-3" onClick={(e) => e.stopPropagation()}>
      {/* Stats + action bar */}
      <div className="flex items-center gap-1 border-t border-slate-100 pt-3">
        {/* Like */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
            liked
              ? "bg-red-50 text-red-500"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          }`}
        >
          <svg className="h-4 w-4" fill={liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          {likeCount > 0 && <span>{likeCount}</span>}
          <span>{liked ? "已点赞" : "点赞"}</span>
        </button>

        {/* Comment */}
        <button
          onClick={handleCommentClick}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
            showComments
              ? "bg-blue-50 text-blue-600"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          {commentCount > 0 && <span>{commentCount}</span>}
          <span>评论</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
            copied
              ? "bg-emerald-50 text-emerald-600"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
          <span>{copied ? "已复制链接" : "转发"}</span>
        </button>

        {/* View count (read-only) */}
        <span className="ml-auto text-xs text-slate-400 flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.641 0-8.574-3.007-9.964-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {post.view_count ?? 0}
        </span>
      </div>

      {/* Inline comment section */}
      {showComments && (
        <div className="space-y-3 pb-1">
          {/* Existing + new comments */}
          {comments.length > 0 && (
            <div className="space-y-2">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <div className="h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                    {c.author[0].toUpperCase()}
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2 text-sm text-slate-700 leading-relaxed">
                    <span className="text-xs font-semibold text-slate-500 mr-1">{c.author}</span>
                    {c.text}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment input */}
          {user ? (
            <form onSubmit={handleSubmitComment} className="flex items-center gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-bold text-white">
                {(user.email ?? "?")[0].toUpperCase()}
              </div>
              <div className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 focus-within:border-blue-400 focus-within:bg-white transition-colors">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="写下你的评论…"
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || submitting}
                  className="shrink-0 rounded-xl bg-blue-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40 hover:bg-blue-700 transition-colors"
                >
                  发送
                </button>
              </div>
            </form>
          ) : (
            <Link
              href="/login"
              className="block rounded-2xl border border-slate-200 bg-slate-50 py-2 text-center text-xs text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              登录后参与评论
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

const DEMO_POSTS: Post[] = [
  {
    id: "demo-1",
    title: "合同审查智能体里，免费版和商用版最大的体验差别是什么？",
    content: "用了几款合同审查智能体，发现免费版在风险条款识别上漏掉了不少细节，商用版的解释更完整，但价格差距有点大，大家怎么看？",
    tags: ["合同", "使用心得"],
    view_count: 1240,
    like_count: 136,
    comment_count: 28,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    profiles: { display_name: "法学生阿木", verified: false },
  },
  {
    id: "demo-paid-1",
    title: "律师用 AI 智能体实现月均 8000+ 被动收入：完整操作路径",
    content: "本文详细介绍了从智能体定位、定价策略到推广运营的全流程方法论，适合有意变现的创作者律师…",
    tags: ["变现", "经验分享"],
    view_count: 3840,
    like_count: 287,
    comment_count: 64,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    is_paid: true,
    price: 9.9,
    profiles: { display_name: "李律师 · 知产专家", verified: true },
  },
  {
    id: "demo-2",
    title: "劳动仲裁前置咨询场景中，哪些问题适合先交给智能体？",
    content: "整理了一下我在劳动争议案件中的经验，发现 AI 在事实梳理和法条检索上很有帮助，但具体策略建议还是需要律师介入。",
    tags: ["劳动法", "实战"],
    view_count: 876,
    like_count: 94,
    comment_count: 19,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    profiles: { display_name: "周律师", verified: true },
  },
  {
    id: "demo-paid-2",
    title: "合同审查智能体的完整提示词工程：从需求拆解到风险识别",
    content: "本文披露了一套经过 3 个月迭代的合同审查提示词框架，涵盖风险识别优先级、条款分类逻辑……",
    tags: ["合同", "提示词"],
    view_count: 2610,
    like_count: 193,
    comment_count: 41,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    is_paid: true,
    price: 19.9,
    profiles: { display_name: "赵老师 · 合同法学者", verified: false },
  },
];

export function CommunityFeed({ posts, user }: CommunityFeedProps) {
  const [paywallPost, setPaywallPost] = useState<Post | null>(null);

  const displayPosts = posts.length > 0 ? posts : DEMO_POSTS;

  if (!displayPosts.length) {
    return (
      <div className="card p-16 text-center space-y-4">
        <div className="text-5xl">💬</div>
        <p className="text-lg font-semibold text-[var(--navy)]">社区还没有内容</p>
        <p className="text-sm text-[var(--muted)]">
          {user ? "成为第一个发帖的人吧！" : "登录后即可发表帖子"}
        </p>
        {user ? (
          <Link href="/community/new" className="inline-flex px-6 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#6366F1] text-white text-sm font-semibold rounded-[10px] hover:-translate-y-px hover:shadow-lg transition-all">
            发表第一篇帖子
          </Link>
        ) : (
          <Link href="/login" className="inline-flex px-6 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#6366F1] text-white text-sm font-semibold rounded-[10px] hover:-translate-y-px hover:shadow-lg transition-all">
            登录
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      {paywallPost && (
        <PaywallModal
          postTitle={paywallPost.title}
          price={paywallPost.price ?? 9.9}
          onClose={() => setPaywallPost(null)}
        />
      )}

      <div className="space-y-3">
        {displayPosts.map((post) => {
          const author = post.profiles;
          const isPaid = post.is_paid;

          return (
            <div
              key={post.id}
              id={post.id}
              className="card p-5 space-y-3 transition-all hover:-translate-y-0.5"
            >
              {/* Author row */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#6366F1] flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                  {(author?.display_name ?? "?")[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[var(--ink)]">
                      {author?.display_name ?? "匿名用户"}
                    </span>
                    {isPaid && (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                        💎 付费
                      </span>
                    )}
                    {isPaid && post.price && (
                      <span className="text-xs font-semibold text-slate-700">¥{post.price}</span>
                    )}
                    <span className="text-xs text-[var(--subtle)]">
                      {timeAgo(post.created_at)}
                    </span>
                  </div>
                  <h3 className="mt-1 text-base font-semibold text-[var(--navy)] leading-snug">
                    {post.title}
                  </h3>
                  {post.content && (
                    <p
                      className={`mt-1 text-sm text-[var(--muted)] leading-relaxed ${
                        isPaid ? "line-clamp-1 blur-[3px] select-none" : "line-clamp-2"
                      }`}
                    >
                      {post.content}
                    </p>
                  )}
                  {isPaid && (
                    <button
                      onClick={() => setPaywallPost(post)}
                      className="mt-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      点击解锁完整内容 →
                    </button>
                  )}
                </div>
              </div>

              {/* Tags */}
              {post.tags && (post.tags as string[]).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pl-11">
                  {(post.tags as string[]).map((tag) => (
                    <Link
                      key={tag}
                      href={`/community/tag/${encodeURIComponent(tag)}`}
                      className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-[var(--accent)] border border-blue-100 hover:bg-blue-100 transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Action bar */}
              <PostActions
                post={post}
                user={user}
                onPaywall={() => setPaywallPost(post)}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
