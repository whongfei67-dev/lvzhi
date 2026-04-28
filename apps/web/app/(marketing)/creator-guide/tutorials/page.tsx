"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Video, Play, Clock, ArrowRight } from "lucide-react";
import {
  CREATOR_GUIDE_CLASSROOM_HERO_IMAGE,
  CREATOR_GUIDE_HERO_IMAGE_ALT,
} from "@/lib/creator-guide-hero";

const TUTORIALS = [
  {
    id: "1",
    title: "如何设计一个好的提示词",
    excerpt: "深入了解提示词设计的核心技巧和最佳实践",
    duration: "15分钟",
    level: "入门",
    videoUrl: null,
  },
  {
    id: "2",
    title: "法律知识在 Skills 中的应用",
    excerpt: "如何将法律专业知识转化为实用的 Skills",
    duration: "20分钟",
    level: "进阶",
    videoUrl: null,
  },
  {
    id: "3",
    title: "智能体边界与免责声明设置",
    excerpt: "正确设置智能体边界，保护自己和用户",
    duration: "12分钟",
    level: "入门",
    videoUrl: null,
  },
  {
    id: "4",
    title: "如何提升智能体的准确性",
    excerpt: "优化智能体回答质量的实用技巧",
    duration: "18分钟",
    level: "进阶",
    videoUrl: null,
  },
  {
    id: "5",
    title: "内容定价策略指南",
    excerpt: "如何为你的 Skills 和智能体设定合理价格",
    duration: "10分钟",
    level: "入门",
    videoUrl: null,
  },
  {
    id: "6",
    title: "案例：劳动争议处理 Skills 实战",
    excerpt: "从零开始构建一个完整的劳动争议处理 Skills",
    duration: "30分钟",
    level: "进阶",
    videoUrl: null,
  },
];

export default function TutorialsPage() {
  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <PageHeader
        title="教学视频"
        description="视频教程，手把手教你从零开始创作"
        backHref="/creator-guide"
        heroImage={CREATOR_GUIDE_CLASSROOM_HERO_IMAGE}
        heroImageAlt={CREATOR_GUIDE_HERO_IMAGE_ALT}
      />

      {/* 教程筛选 */}
      <section className="mx-auto max-w-6xl px-6 py-4 lg:px-8">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-[#D4A574] bg-[#D4A574] px-4 py-2 text-sm font-medium text-white">
            全部
          </span>
          <span className="rounded-full border border-[rgba(212,165,116,0.25)] bg-white px-4 py-2 text-sm font-medium text-[#5D4E3A]">
            入门
          </span>
          <span className="rounded-full border border-[rgba(212,165,116,0.25)] bg-white px-4 py-2 text-sm font-medium text-[#5D4E3A]">
            进阶
          </span>
        </div>
      </section>

      {/* 教程列表 */}
      <section className="mx-auto max-w-6xl px-6 py-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {TUTORIALS.map((tutorial) => (
            <Link
              key={tutorial.id}
              href={`/creator-guide/${tutorial.id}`}
              className="group flex gap-5 rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-5 transition-all hover:-translate-y-1 hover:border-[#D4A574] hover:shadow-md"
            >
              {/* 视频预览区 */}
              <div className="relative flex h-28 w-40 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4A574] to-[#B8860B]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <Play className="h-6 w-6 text-white" />
                </div>
                <div className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">
                  {tutorial.duration}
                </div>
              </div>

              {/* 内容 */}
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      tutorial.level === "入门" ? "bg-[rgba(212,165,116,0.08)] text-[#D4A574]" : "bg-amber-50 text-amber-600"
                    }`}>
                      {tutorial.level}
                    </span>
                  </div>
                  <h3 className="font-medium text-[#2C2416] transition-colors group-hover:text-[#D4A574]">
                    {tutorial.title}
                  </h3>
                  <p className="mt-1 text-sm text-[#5D4E3A] line-clamp-2">{tutorial.excerpt}</p>
                </div>
                <div className="mt-3 flex items-center gap-1 text-sm text-[#D4A574]">
                  <Video className="h-4 w-4" />
                  <span>观看教程</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="pb-16" />
    </div>
  );
}
