"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { EmptyState } from "@/components/common/empty-state";
import { Pagination } from "@/components/common/pagination";
import { FileText, MessageSquare, Eye, Clock, Edit, Trash2 } from "lucide-react";

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  topic: string;
  tags: string[];
  like_count: number;
  comment_count: number;
  view_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const result = await api.workspace.getPosts({ page, limit: 10 });
      setPosts((result.items as unknown as Post[]) || []);
      setTotalPages(Math.ceil(result.total / 10));
    } catch (error) {
      console.error("获取帖子失败:", error);
      // Mock 数据
      setPosts([
        { id: "1", title: "分享我设计的劳动争议处理流程图", content: "最近整理了一套劳动争议处理的流程图，欢迎交流。", excerpt: "最近整理了一套劳动争议处理的流程图...", topic: "创作经验", tags: ["劳动法", "模板"], like_count: 128, comment_count: 45, view_count: 1234, is_published: true, created_at: "2024-01-15", updated_at: "2024-01-15" },
        { id: "2", title: "求助：合同审查时遇到免责条款如何处理？", content: "最近在审查一份技术服务合同，免责条款边界不好判断。", excerpt: "最近在审查一份技术服务合同...", topic: "提问求助", tags: ["合同法"], like_count: 56, comment_count: 23, view_count: 567, is_published: true, created_at: "2024-01-14", updated_at: "2024-01-14" },
        { id: "3", title: "草稿：企业合规审查清单", content: "企业合规审查清单草稿，待补充细项。", excerpt: "", topic: "创作经验", tags: ["合规"], like_count: 0, comment_count: 0, view_count: 0, is_published: false, created_at: "2024-01-13", updated_at: "2024-01-13" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      {/* 页面标题 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2C2416]">我的帖子</h1>
          <p className="mt-2 text-[#5D4E3A]">管理你发布的所有帖子</p>
        </div>
        <Link
          href="/community/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#D4A574] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B8860B]"
        >
          发布新帖子
        </Link>
      </div>

      {/* 帖子列表 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-6">
              <div className="h-6 w-1/2 rounded bg-[rgba(212,165,116,0.15)]" />
              <div className="mt-2 h-4 w-3/4 rounded bg-[rgba(212,165,116,0.15)]" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="暂无帖子"
          description="开始你的第一次分享吧"
          action={
            <Link
              href="/community/new"
              className="inline-flex items-center gap-2 rounded-xl bg-[#D4A574] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B8860B]"
            >
              发布新帖子
            </Link>
          }
        />
      ) : (
        <>
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/community/post/${encodeURIComponent(post.id)}`}
                        className="font-semibold text-[#2C2416] transition-colors hover:text-[#D4A574]"
                      >
                        {post.title}
                      </Link>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        post.is_published
                          ? "bg-[rgba(212,165,116,0.15)] text-[#D4A574]"
                          : "bg-[rgba(212,165,116,0.08)] text-[#5D4E3A]"
                      }`}>
                        {post.is_published ? "已发布" : "草稿"}
                      </span>
                    </div>
                    {post.excerpt && (
                      <p className="mt-2 text-sm text-[#5D4E3A] line-clamp-2">{post.excerpt}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#9A8B78]">
                      <span className="flex items-center gap-1">
                        <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2 py-0.5 text-xs">{post.topic}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.created_at}
                      </span>
                      {post.is_published && (
                        <>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.view_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {post.comment_count}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex gap-2">
                    <Link
                      href={`/community/${post.id}/edit`}
                      className="rounded-lg border border-[rgba(212,165,116,0.25)] p-2 text-[#5D4E3A] transition-colors hover:border-[#D4A574] hover:text-[#D4A574]"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      className="rounded-lg border border-[rgba(212,165,116,0.25)] p-2 text-[#5D4E3A] transition-colors hover:border-red-300 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
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
  );
}
