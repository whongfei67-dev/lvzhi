"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { GuestGate } from "@/components/common/guest-gate";
import { Pagination } from "@/components/common/pagination";
import { MessageSquare, TrendingUp, Clock, Eye, Flame, Star } from "lucide-react";

const MOCK_HOT_POSTS = [
  {
    id: "1",
    title: "深度解析：新《公司法》对律师业务的影响",
    excerpt: "新公司法将于2024年7月1日正式实施，本文将从律师角度分析其影响...",
    author: "李律师",
    topic: "案例分析",
    likes: 342,
    comments: 89,
    views: 3456,
    createdAt: "1天前",
    hotIndex: 98,
  },
  {
    id: "2",
    title: "分享我设计的劳动争议处理流程图",
    excerpt: "最近整理了一套劳动争议处理的流程图，包含从入职到离职的全流程...",
    author: "陈律师",
    topic: "创作经验",
    likes: 128,
    comments: 45,
    views: 1234,
    createdAt: "2小时前",
    hotIndex: 85,
  },
  {
    id: "3",
    title: "AI 辅助法律研究的实践心得",
    excerpt: "使用 AI 工具辅助法律研究已经半年了，分享一些实用的技巧...",
    author: "张律师",
    topic: "创作经验",
    likes: 256,
    comments: 67,
    views: 2345,
    createdAt: "2天前",
    hotIndex: 82,
  },
  {
    id: "4",
    title: "关于律师职业发展的几点思考",
    excerpt: "从业十年的一些感悟，希望对年轻律师有所帮助...",
    author: "赵律师",
    topic: "讨论交流",
    likes: 198,
    comments: 34,
    views: 1567,
    createdAt: "3天前",
    hotIndex: 75,
  },
  {
    id: "5",
    title: "企业合规审查清单分享",
    excerpt: "整理了一份企业合规审查的清单，涵盖了主要的合规风险点...",
    author: "王律师",
    topic: "创作经验",
    likes: 167,
    comments: 28,
    views: 1234,
    createdAt: "4天前",
    hotIndex: 68,
  },
];

export default function HotPage() {
  const [page, setPage] = useState(1);

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
      <PageHeader
        title="热门帖子"
        description="发现社区最受欢迎的讨论"
        backHref="/community"
      />

      {/* 热门说明 */}
      <section className="mx-auto max-w-6xl px-6 py-4 lg:px-8">
        <div className="flex items-center gap-3 rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
            <Flame className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="font-medium text-[#2C2416]">热门榜单基于综合热度计算</p>
            <p className="text-sm text-[#5D4E3A]">综合考虑阅读量、点赞数、评论数等因素</p>
          </div>
        </div>
      </section>

      {/* 帖子列表 */}
      <section className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
        <div className="space-y-3">
          {MOCK_HOT_POSTS.map((post, index) => (
            <Link
              key={post.id}
              href={`/community/post/${encodeURIComponent(post.id)}`}
              className="group flex items-start gap-4 rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#D4A574] hover:shadow-md"
            >
              {/* 热度排名 */}
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
                index === 0 ? "bg-amber-100 text-amber-700" :
                index === 1 ? "bg-[rgba(212,165,116,0.15)] text-[#5D4E3A]" :
                index === 2 ? "bg-orange-50 text-orange-600" :
                "bg-[rgba(212,165,116,0.15)] text-[#5D4E3A]"
              }`}>
                <Flame className="h-5 w-5" />
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="rounded-full bg-[rgba(212,165,116,0.15)] px-2.5 py-0.5 text-xs font-medium text-[#5D4E3A]">
                    {post.topic}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-amber-600">
                    <TrendingUp className="h-3 w-3" />
                    热度 {post.hotIndex}
                  </span>
                </div>
                <h3 className="font-medium text-[#2C2416] transition-colors group-hover:text-[#D4A574] line-clamp-1">
                  {post.title}
                </h3>
                <p className="mt-1 text-sm text-[#5D4E3A] line-clamp-1">{post.excerpt}</p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#9A8B78]">
                  <span className="flex items-center gap-1">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(212,165,116,0.15)] text-[10px] font-medium text-[#D4A574]">
                      {post.author[0]}
                    </div>
                    {post.author}
                  </span>
                  <span>{post.createdAt}</span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {post.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {post.comments}
                  </span>
                </div>
              </div>

              {/* 点赞数 */}
              <div className="shrink-0 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(212,165,116,0.15)] text-sm font-bold text-[#D4A574]">
                  {post.likes}
                </div>
                <span className="mt-1 text-xs text-[#9A8B78]">点赞</span>
              </div>
            </Link>
          ))}
        </div>

        <Pagination currentPage={page} totalPages={5} onPageChange={setPage} className="mt-8" />
      </section>

      <div className="pb-16" />
    </div>
  );
}
