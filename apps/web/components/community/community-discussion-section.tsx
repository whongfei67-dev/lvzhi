import * as React from "react";
import Link from "next/link";
import { DiscussionCard, type DiscussionCardPost } from "@/components/community/discussion-card";

interface CommunityDiscussionSectionProps {
  posts: DiscussionCardPost[];
}

export function CommunityDiscussionSection({ posts }: CommunityDiscussionSectionProps) {
  const visible = posts.slice(0, 6);

  return (
    <section className="bg-slate-50 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">社区</p>
            <h2 className="mt-1 text-3xl font-bold text-slate-950">大家在讨论什么</h2>
            <p className="mt-2 text-slate-500">法律 AI 领域最热门的话题与经验分享</p>
          </div>
          <Link
            href="/community"
            className="rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-md transition-shadow"
          >
            前往社区 →
          </Link>
        </div>

        {visible.length === 0 ? (
          <div className="flex items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-sm text-slate-400">
            暂无社区内容
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((post) => (
              <DiscussionCard key={post.id} post={post} variant="default" />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-slate-500">还有更多精彩讨论在等你</p>
          <Link
            href="/community/new"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            发起一个话题
          </Link>
        </div>
      </div>
    </section>
  );
}
