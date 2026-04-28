"use client";

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Eye, Clock } from "lucide-react";

export interface DiscussionCardPost {
  id: string;
  title: string;
  excerpt?: string;
  authorName: string;
  createdAt: string;
  tags?: string[];
  likeCount?: number;
  viewCount?: number;
  commentCount?: number;
}

interface DiscussionCardProps {
  post: DiscussionCardPost;
  variant?: "default" | "compact";
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "刚刚";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} 天前`;
  return date.toLocaleDateString("zh-CN");
}

const postHref = (id: string) => `/community/post/${encodeURIComponent(id)}`;

export function DiscussionCard({ post, variant = "default" }: DiscussionCardProps) {
  const initials = post.authorName.slice(0, 1);

  if (variant === "compact") {
    return (
      <Link
        href={postHref(post.id)}
        className="block py-3 first:pt-0 last:pb-0 hover:text-emerald-700 transition-colors"
      >
        <h4 className="text-sm font-medium text-slate-700 leading-snug line-clamp-2">
          {post.title}
        </h4>
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
          <span>{post.authorName}</span>
          <span>·</span>
          <span>{formatTimeAgo(post.createdAt)}</span>
        </div>
      </Link>
    );
  }

  return (
    <div className="group block rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      {post.tags && post.tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {post.tags.slice(0, 3).map((tag) => (
            <Link
              key={tag}
              href={`/community/tag/${encodeURIComponent(tag)}`}
              className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}

      <Link href={postHref(post.id)} className="block">
        <h3 className="text-base font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
          {post.title}
        </h3>

        {post.excerpt && (
          <p className="mt-2 text-sm text-slate-500 line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        )}
      </Link>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-slate-600">{post.authorName}</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          {post.likeCount !== undefined && (
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {post.likeCount}
            </span>
          )}
          {post.viewCount !== undefined && (
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {post.viewCount}
            </span>
          )}
          {post.commentCount !== undefined && (
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {post.commentCount}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatTimeAgo(post.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
