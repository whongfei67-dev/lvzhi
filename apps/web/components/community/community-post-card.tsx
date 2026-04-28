import Link from "next/link";
import { MessageSquare, ThumbsDown, ThumbsUp, Clock } from "lucide-react";
import { withPublicMediaProxy } from "@/lib/media-url";
import {
  formatPostPublishedAtDisplay,
  postPublishedAtIsoAttribute,
} from "@/lib/community-post-time";
import { PracticeLawyerBadge } from "@/components/common/practice-lawyer-badge";

export type CommunityPostCardModel = {
  id: string;
  author_id?: string;
  title: string;
  content: string;
  topic: string;
  /** ISO 8601 或可解析为 Date 的字符串，用于精确展示与筛选 */
  created_at?: string | null;
  author_name?: string | null;
  author_avatar?: string | null;
  author_lawyer_verified?: boolean | null;
  like_count: number;
  dislike_count: number;
  comment_count: number;
  tags?: string[];
};

export function CommunityPostCard({ post }: { post: CommunityPostCardModel }) {
  const initial = (post.author_name?.trim()?.[0] || "匿").slice(0, 1);
  const createdRaw = post.created_at?.trim() ?? "";
  const publishedLabel = formatPostPublishedAtDisplay(createdRaw);
  const publishedIso = createdRaw ? postPublishedAtIsoAttribute(createdRaw) : "";
  const postPath = `/community/post/${encodeURIComponent(post.id)}`;

  return (
    <div className="marketing-inspiration-skill-card group p-3.5">
      <Link href={postPath} className="block">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-[rgba(212,165,116,0.2)] px-2 py-0.5 text-[11px] font-medium text-[#5C4033]">
            {post.topic}
          </span>
          {post.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[rgba(212,165,116,0.22)] bg-[rgba(255,248,240,0.66)] px-2 py-0.5 text-[11px] text-[#6E5A44]"
            >
              #{tag}
            </span>
          ))}
          <time
            dateTime={publishedIso || undefined}
            title={publishedLabel}
            className="inline-flex items-center gap-1 rounded-full bg-[rgba(212,165,116,0.1)] px-2 py-0.5 text-[11px] tabular-nums text-[#9A8B78]"
          >
            <Clock className="h-3 w-3 shrink-0 text-[#D4A574]" aria-hidden />
            <span className="text-[#5D4E3A]">发布时间 {publishedLabel}</span>
          </time>
        </div>
        <div className="mt-2 flex min-w-0 items-center gap-3 text-[11px] text-[#5D4E3A]">
          <span className="shrink-0 inline-flex items-center gap-1.5">
            {post.author_avatar ? (
              <img
                src={withPublicMediaProxy(post.author_avatar)}
                alt=""
                className="h-5 w-5 shrink-0 rounded-full border border-[rgba(212,165,116,0.35)] bg-white object-cover"
                width={20}
                height={20}
              />
            ) : (
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(212,165,116,0.2)] text-[10px] font-bold text-[#B8860B]">
                {initial}
              </div>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs text-[#5D4E3A]">
              <span>{post.author_name || "匿名用户"}</span>
              {post.author_lawyer_verified ? <PracticeLawyerBadge className="!text-[10px]" /> : null}
            </span>
          </span>
          <h3 className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#2C2416] transition-colors duration-200 group-hover:text-[#B8860B]">
            {post.title}
          </h3>
          <span className="inline-flex shrink-0 items-center gap-1">
            <ThumbsUp className="h-3.5 w-3.5 text-[#D4A574]" aria-hidden />
            {post.like_count}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1">
            <ThumbsDown className="h-3.5 w-3.5 text-[#9A8B78]" aria-hidden />
            {post.dislike_count}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5 text-[#D4A574]" aria-hidden />
            {post.comment_count}
          </span>
        </div>
      </Link>
    </div>
  );
}
