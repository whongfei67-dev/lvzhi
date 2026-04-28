"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSession } from "@/lib/api/client";
import { EmptyState } from "@/components/common/empty-state";
import { Pagination } from "@/components/common/pagination";
import { DiscussionCard } from "@/components/community/discussion-card";
import { Users, Clock, ArrowRight } from "lucide-react";

interface FollowedPost {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_avatar?: string;
  topic: string;
  like_count: number;
  comment_count: number;
  created_at: string;
}

interface SessionUser {
  id: string;
  email: string;
  display_name?: string;
  role: string;
}

export default function FollowingPage() {
  const [posts, setPosts] = useState<FollowedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [session, setSession] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const userSession = await getSession();
      setSession(userSession);

      // Mock 数据
      setPosts([
        { id: "1", title: "分享我设计的劳动争议处理流程图", content: "最近整理了一套劳动争议处理的流程图，希望能帮到大家...", author_name: "陈律师", topic: "创作经验", like_count: 128, comment_count: 45, created_at: "2024-01-15 10:30" },
        { id: "2", title: "求助：合同审查时遇到免责条款如何处理？", content: "最近在审查一份技术服务合同，遇到了一些问题...", author_name: "张律师", topic: "提问求助", like_count: 56, comment_count: 23, created_at: "2024-01-14 16:20" },
        { id: "3", title: "【律师必读】企业合规检查清单分享", content: "分享一份完整的企业合规检查清单...", author_name: "王律师", topic: "资源分享", like_count: 234, comment_count: 67, created_at: "2024-01-13 09:15" },
      ]);
      setTotalPages(3);
    } catch (error) {
      console.error("获取关注动态失败:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
      {/* 页面头部 */}
      <div className="bg-gradient-to-b from-[rgba(212,165,116,0.15)] to-[rgba(212,165,116,0.08)] px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-3 text-sm text-[#5D4E3A]">
            <Link href="/community" className="hover:text-[#D4A574]">社区</Link>
            <span>/</span>
            <span className="text-[#2C2416]">关注动态</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[#2C2416]">关注动态</h1>
          <p className="mt-2 text-[#5D4E3A]">查看你关注的创作者的最新帖子</p>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        {!session ? (
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="请先登录"
            description="登录后才能查看关注动态"
            action={
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-[#D4A574] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B8860B]"
              >
                登录
              </Link>
            }
          />
        ) : loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-[rgba(212,165,116,0.15)]" />
                  <div className="flex-1">
                    <div className="h-6 w-1/2 rounded bg-[rgba(212,165,116,0.15)]" />
                    <div className="mt-2 h-4 w-1/3 rounded bg-[rgba(212,165,116,0.15)]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="暂无关注动态"
            description="你还没有关注任何创作者，或者关注的创作者还没有发布新内容"
            action={
              <Link
                href="/community"
                className="inline-flex items-center gap-2 rounded-xl bg-[#D4A574] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B8860B]"
              >
                发现创作者
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        ) : (
          <>
            <div className="space-y-4">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/community/post/${encodeURIComponent(post.id)}`}
                  className="group block rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#D4A574]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4A574] to-[#B8860B] text-lg font-bold text-white">
                      {post.author_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[#2C2416] transition-colors group-hover:text-[#D4A574]">
                          {post.title}
                        </h3>
                        <span className="shrink-0 rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs font-medium text-[#5D4E3A]">
                          {post.topic}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[#5D4E3A] line-clamp-2">{post.content}</p>
                      <div className="mt-3 flex items-center gap-4 text-sm text-[#9A8B78]">
                        <span className="font-medium text-[#D4A574]">{post.author_name}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.created_at}
                        </span>
                        <span>{post.like_count} 赞</span>
                        <span>{post.comment_count} 评论</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              className="mt-8"
            />
          </>
        )}
      </div>
    </div>
  );
}