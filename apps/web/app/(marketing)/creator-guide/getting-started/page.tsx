"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { BookOpen, Rocket, ArrowRight } from "lucide-react";
import {
  CREATOR_GUIDE_CLASSROOM_HERO_IMAGE,
  CREATOR_GUIDE_HERO_IMAGE_ALT,
} from "@/lib/creator-guide-hero";

const ARTICLES = [
  {
    id: "1",
    title: "律植平台介绍",
    excerpt: "了解律植平台的基本概念和核心功能",
    category: "getting-started",
    readTime: "5分钟",
  },
  {
    id: "2",
    title: "如何注册账号",
    excerpt: "详细的账号注册流程和注意事项",
    category: "getting-started",
    readTime: "3分钟",
  },
  {
    id: "3",
    title: "账号设置与个人资料",
    excerpt: "完善个人资料，提升可信度",
    category: "getting-started",
    readTime: "2分钟",
  },
  {
    id: "4",
    title: "首次登录与界面概览",
    excerpt: "熟悉律植平台的操作界面",
    category: "getting-started",
    readTime: "5分钟",
  },
  {
    id: "5",
    title: "什么是 Skills",
    excerpt: "深入了解 Skills 的定义和使用场景",
    category: "getting-started",
    readTime: "4分钟",
  },
  {
    id: "6",
    title: "什么是智能体",
    excerpt: "了解律植智能体的功能和特点",
    category: "getting-started",
    readTime: "4分钟",
  },
];

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <PageHeader
        title="创作入门"
        description="快速了解律植平台，开始你的创作之旅"
        backHref="/creator-guide"
        heroImage={CREATOR_GUIDE_CLASSROOM_HERO_IMAGE}
        heroImageAlt={CREATOR_GUIDE_HERO_IMAGE_ALT}
      />

      {/* 简介 */}
      <section className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
        <div className="rounded-xl border border-[#C4DBCB] bg-[rgba(212,165,116,0.15)] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white">
              <Rocket className="h-6 w-6 text-[#D4A574]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#2C2416]">欢迎开始创作之旅</h2>
              <p className="mt-2 text-sm text-[#5D4E3A]">
                律植是一个面向法律从业者的灵感与实践平台。在这里，你可以分享自己的专业知识，创建实用的 Skills 和智能体，与同行交流经验，并获得应有的回报。本指南将帮助你快速上手。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 文章列表 */}
      <section className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
        <div className="space-y-4">
          {ARTICLES.map((article) => (
            <Link
              key={article.id}
              href={`/creator-guide/${article.id}`}
              className="group flex items-center gap-4 rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#D4A574] hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[rgba(212,165,116,0.15)] text-[#D4A574]">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-[#2C2416] transition-colors group-hover:text-[#D4A574]">
                  {article.title}
                </h3>
                <p className="mt-1 text-sm text-[#5D4E3A] line-clamp-1">{article.excerpt}</p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className="text-xs text-[#9A8B78]">{article.readTime}</span>
                <ArrowRight className="h-4 w-4 text-[#9A8B78] transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 底部CTA */}
      <section className="mx-auto max-w-6xl px-6 py-8 pb-16 lg:px-8">
        <div className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-6 text-center">
          <h3 className="font-semibold text-[#2C2416]">准备好开始创作了吗？</h3>
          <p className="mt-2 text-sm text-[#5D4E3A]">只需 5 分钟，你就能创建第一个 Skills 或智能体</p>
          <Link
            href="/workspace"
            className="mt-4 inline-block rounded-xl bg-[#D4A574] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B8860B]"
          >
            进入工作台
          </Link>
        </div>
      </section>
    </div>
  );
}
