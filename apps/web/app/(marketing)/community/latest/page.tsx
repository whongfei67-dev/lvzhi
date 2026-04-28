"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { CategoryTabs } from "@/components/common/filter-components";
import { Pagination } from "@/components/common/pagination";
import { GuestGate } from "@/components/common/guest-gate";
import { community } from "@/lib/api/client";
import { MessageSquare, TrendingUp, Star, Plus, Clock, Eye, Lock } from "lucide-react";

const TOPICS = [
  { id: "all", label: "全部" },
  { id: "experience", label: "创作经验" },
  { id: "case", label: "案例分析" },
  { id: "help", label: "提问求助" },
  { id: "discussion", label: "讨论交流" },
];

const MOCK_POSTS = [
  {
    id: "1",
    title: "分享我设计的劳动争议处理流程图",
    excerpt: "最近整理了一套劳动争议处理的流程图，包含从入职到离职的全流程...",
    author: "陈律师",
    topic: "创作经验",
    likes: 128,
    comments: 45,
    views: 1234,
    createdAt: "2小时前",
  },
  {
    id: "2",
    title: "求助：合同审查时遇到免责条款如何处理？",
    excerpt: "最近在审查一份技术服务合同，对方提供了免责条款，不知道如何把握...",
    author: "王律师",
    topic: "提问求助",
    likes: 56,
    comments: 23,
    views: 567,
    createdAt: "4小时前",
  },
  {
    id: "3",
    title: "深度解析：新《公司法》对律师业务的影响",
    excerpt: "新公司法将于2024年7月1日正式实施，本文将从律师角度分析其影响...",
    author: "李律师",
    topic: "案例分析",
    likes: 342,
    comments: 89,
    views: 3456,
    createdAt: "1天前",
  },
  {
    id: "4",
    title: "AI 辅助法律研究的实践心得",
    excerpt: "使用 AI 工具辅助法律研究已经半年了，分享一些实用的技巧...",
    author: "张律师",
    topic: "创作经验",
    likes: 256,
    comments: 67,
    views: 2345,
    createdAt: "2天前",
  },
  {
    id: "5",
    title: "关于律师职业发展的几点思考",
    excerpt: "从业十年的一些感悟，希望对年轻律师有所帮助...",
    author: "赵律师",
    topic: "讨论交流",
    likes: 198,
    comments: 34,
    views: 1567,
    createdAt: "3天前",
  },
];

export default function LatestPage() {
  const [activeTopic, setActiveTopic] = useState("all");
  const [page, setPage] = useState(1);

  const filteredPosts = activeTopic === "all"
    ? MOCK_POSTS
    : MOCK_POSTS.filter((p) => p.topic === activeTopic);

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
      <PageHeader
        title="最新帖子"
        description="发现社区最新发布的帖子"
        backHref="/community"
      />

      {/* 话题筛选 */}
      <section className="mx-auto max-w-6xl px-6 py-4 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((topic) => (
            <Link
              key={topic.id}
              href={topic.id === "all" ? "/community/latest" : `/community/topic/${topic.id}`}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                activeTopic === topic.id
                  ? "border-[#D4A574] bg-[#D4A574] text-white"
                  : "border-[rgba(212,165,116,0.25)] bg-white text-[#5D4E3A] hover:border-[#D4A574] hover:text-[#D4A574]"
              }`}
            >
              {topic.label}
            </Link>
          ))}
        </div>
      </section>

      {/* 发帖入口 */}
      <section className="mx-auto max-w-6xl px-6 lg:px-8">
        <GuestGate action="发布帖子" mode="hidden">
          <Link
            href="/community/new"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#D4A574] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B8860B]"
          >
            <Plus className="h-4 w-4" />
            发布新帖子
          </Link>
        </GuestGate>
      </section>

      {/* 帖子列表 */}
      <section className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <Link
              key={post.id}
              href={`/community/post/${encodeURIComponent(post.id)}`}
              className="group block rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#D4A574] hover:shadow-md"
            >
              <span className="mb-2 inline-block rounded-full bg-[rgba(212,165,116,0.15)] px-3 py-1 text-xs font-medium text-[#5D4E3A]">
                {post.topic}
              </span>
              <h3 className="mb-2 text-lg font-medium text-[#2C2416] transition-colors group-hover:text-[#D4A574] line-clamp-2">
                {post.title}
              </h3>
              <p className="mb-4 text-sm text-[#5D4E3A] line-clamp-2">{post.excerpt}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-[#9A8B78]">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(212,165,116,0.15)] text-xs font-medium text-[#D4A574]">
                    {post.author[0]}
                  </div>
                  <span className="text-[#5D4E3A]">{post.author}</span>
                </div>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.createdAt}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {post.views}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {post.comments}
                </span>
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
