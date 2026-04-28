import Link from "next/link";
import { ArrowLeft, MessageSquare, ThumbsUp, Eye, Edit } from "lucide-react";

const MOCK_POSTS = [
  { id: "post-1", title: "如何设计一个好的法律智能体边界", status: "已发布", publishTime: "3天前", likes: 128, comments: 45, views: 2560 },
  { id: "post-2", title: "青年律师如何开始创作之路", status: "已发布", publishTime: "5天前", likes: 256, comments: 89, views: 4120 },
];

export const dynamic = "force-dynamic";

export default function MyPostsPage() {
  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
      {/* Hero */}
      <section className="bg-white border-b border-[rgba(212,165,116,0.25)]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <Link
            href="/community"
            className="inline-flex items-center gap-2 text-sm text-[#9A8B78] hover:text-[#D4A574] mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            返回社区
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C2416] sm:text-4xl">
            我的帖子
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[#5D4E3A]">
            管理你发布的所有帖子
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/community/create"
            className="rounded-xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-6 py-2.5 font-medium text-white hover:shadow-md"
          >
            发布新帖子
          </Link>
        </div>

        <div className="space-y-4">
          {MOCK_POSTS.map((post) => (
            <div
              key={post.id}
              className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Link
                    href={`/community/post/${post.id}`}
                    className="text-lg font-semibold text-[#2C2416] hover:text-[#D4A574] mb-2 block"
                  >
                    {post.title}
                  </Link>
                  <div className="flex items-center gap-4 text-sm text-[#9A8B78]">
                    <span className="rounded-full bg-[rgba(212,165,116,0.08)] px-2.5 py-0.5 text-xs font-medium text-[#D4A574]">
                      {post.status}
                    </span>
                    <span>{post.publishTime}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-[#9A8B78]">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    {post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {post.comments}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {post.views}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[rgba(212,165,116,0.2)]">
                <button className="flex items-center gap-2 text-sm text-[#5D4E3A] hover:text-[#D4A574]">
                  <Edit className="h-4 w-4" />
                  编辑
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
