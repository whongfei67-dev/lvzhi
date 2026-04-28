"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/common/pagination";
import { GuestGate } from "@/components/common/guest-gate";
import { buildTwoCommunityAutoPosts } from "@/lib/community-auto-posts";
import { CommunityPostCard } from "@/components/community/community-post-card";

const TOPICS = [
  { id: "experience", label: "创作经验", count: 256 },
  { id: "case", label: "案例分析", count: 189 },
  { id: "help", label: "提问求助", count: 432 },
  { id: "discussion", label: "讨论交流", count: 321 },
  { id: "sharing", label: "资源共享", count: 156 },
  { id: "news", label: "行业资讯", count: 98 },
];

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function TopicPage({ params }: PageProps) {
  const [topicSlug, setTopicSlug] = useState<string>("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    params.then((p) => setTopicSlug(p.slug));
  }, [params]);

  const topicMeta = TOPICS.find((t) => t.id === topicSlug) || {
    id: topicSlug,
    label: topicSlug,
    count: 0,
  };

  const topicPosts =
    topicSlug.length > 0
      ? buildTwoCommunityAutoPosts({
          topicSlug,
          topicLabel: topicMeta.label,
          seed: `topic-${topicSlug}`,
        })
      : [];

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
      {/* 页面头部 */}
      <PageHeader
        title={topicMeta.label}
        description={`浏览所有「${topicMeta.label}」相关的帖子`}
        backHref="/community"
      />

      {/* 话题导航 */}
      <section className="mx-auto max-w-6xl px-6 py-4 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((topic) => (
            <Link
              key={topic.id}
              href={`/community/topic/${topic.id}`}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                topicSlug === topic.id
                  ? "border-[#D4A574] bg-[#D4A574] text-white"
                  : "border-[rgba(212,165,116,0.25)] bg-white text-[#5D4E3A] hover:border-[#D4A574] hover:text-[#D4A574]"
              }`}
            >
              {topic.label}
              <span className={`ml-1.5 text-xs ${topicSlug === topic.id ? "text-white/80" : "text-[#9A8B78]"}`}>
                {topic.count}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 发帖入口 */}
      <section className="mx-auto max-w-6xl px-6 lg:px-8">
        <GuestGate action="发布帖子" mode="hidden">
          <Link
            href="/community/new"
            className="flex items-center justify-center gap-2 rounded-xl border border-[rgba(212,165,116,0.25)] bg-white py-4 text-sm font-medium text-[#5D4E3A] transition-colors hover:border-[#D4A574] hover:text-[#D4A574]"
          >
            发布新帖子
          </Link>
        </GuestGate>
      </section>

      {/* 帖子列表（每页两条示例，围绕当前话题与法律 Skills） */}
      <section className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
        <div className="space-y-4">
          {topicPosts.map((post) => (
            <CommunityPostCard key={post.id} post={post} />
          ))}
        </div>

        <Pagination
          currentPage={page}
          totalPages={1}
          onPageChange={setPage}
          className="mt-8"
        />
      </section>

      {/* 底部留白 */}
      <div className="pb-16" />
    </div>
  );
}
