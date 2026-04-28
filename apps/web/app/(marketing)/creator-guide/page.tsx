"use client";

import Link from "next/link";
import { useState } from "react";
import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import {
  BookOpen,
  Video,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Shield,
  Users,
  Rocket,
  Plus,
  Clock,
  Star,
  Quote,
} from "lucide-react";

/**
 * 创作指南首页 — 对齐《律植项目蓝图 v6.4》§7、§17.5（子页面口号 §1.0）
 *
 * 视觉方向：琥珀咖啡色系 + 思源宋体 + 咖啡馆背景
 * 颜色：amber #D4A574 / coffee #D4A574 / cream #FFF8F0
 */

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80";

const GUIDE_CATEGORIES = ["全部", "入门教程", "进阶技巧", "平台规则", "常见问题"];

const TABS = [
  { id: "guide", label: "入门指南", icon: BookOpen },
  { id: "video", label: "教学视频", icon: Video },
  { id: "faq", label: "创作者说", icon: HelpCircle },
];

const GUIDES = [
  {
    id: "getting-started",
    title: "创作入门",
    description: "了解平台基本功能，快速上手 Skills 和智能体创作",
    href: "/creator-guide/getting-started",
    icon: Rocket,
  },
  {
    id: "policies",
    title: "平台规则",
    description: "了解平台规范，确保内容合规，保护创作者权益",
    href: "/creator-guide/policies",
    icon: Shield,
  },
  {
    id: "tutorials",
    title: "教学视频",
    description: "视频教程，手把手教你从零开始创作",
    href: "/creator-guide/tutorials",
    icon: Video,
  },
  {
    id: "faq",
    title: "常见问题",
    description: "解答创作过程中的常见疑问，快速找到答案",
    href: "/creator-guide/faq",
    icon: HelpCircle,
  },
];

const TUTORIALS = [
  {
    id: 1,
    title: "如何设计一个好的提示词",
    duration: "10分钟",
    level: "入门",
    sharerName: "林晚澄",
    creatorName: "周牧之",
    keywords: ["提示词", "Skills", "结构化输出"],
  },
  {
    id: 2,
    title: "法律知识在 Skills 中的应用",
    duration: "15分钟",
    level: "进阶",
    sharerName: "宋知微",
    creatorName: "顾清岚",
    keywords: ["知识切片", "检索增强", "合规"],
  },
  {
    id: 3,
    title: "智能体边界与免责声明设置",
    duration: "8分钟",
    level: "入门",
    sharerName: "沈予安",
    creatorName: "韩叙白",
    keywords: ["免责声明", "边界", "智能体"],
  },
  {
    id: 4,
    title: "如何提升智能体的准确性",
    duration: "12分钟",
    level: "进阶",
    sharerName: "唐见秋",
    creatorName: "江以宁",
    keywords: ["评测集", "迭代", "人机协同"],
  },
];

/** 优秀创作者金句（与「关于创作，他们有话说」区块对应） */
const CREATOR_QUOTES = [
  {
    quote: "好的法律智能体，不是替用户拍板，而是把可验证的依据与步骤摆在桌面上。",
    name: "周牧之",
    role: "争议解决方向创作者",
  },
  {
    quote: "Skills 像乐高：单块要稳，拼起来才是一座能交付的桥。",
    name: "顾清岚",
    role: "常法与合同技能作者",
  },
  {
    quote: "先写清「不做什么」，再谈「能做什么」——边界写明白了，信任才会来。",
    name: "韩叙白",
    role: "智能体合规与风控",
  },
  {
    quote: "每一次用户纠错，都是免费标注；把反馈接进迭代里，比堆参数更值钱。",
    name: "江以宁",
    role: "产品化法律工具作者",
  },
];

const HOT_TAGS = ["入门教程", "进阶技巧", "提示词设计", "法律知识", "平台规则", "案例分析"];

export const dynamic = "force-dynamic";

export default function CreatorGuidePage() {
  const [activeTab, setActiveTab] = useState("guide");
  const [activeCategory, setActiveCategory] = useState("全部");

  return (
    <div className="min-h-screen marketing-page-shell-tint">
      {/* Hero 区域 - 咖啡馆背景 */}
      <section
        className="page-header marketing-hero--inspiration-scale relative overflow-hidden"
        style={{ position: 'relative' }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 0,
            overflow: 'hidden'
          }}
        >
          <img
            src={HERO_IMAGE}
            alt="咖啡馆讨论背景"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="relative z-[2] mx-auto w-full max-w-6xl px-6 lg:px-8">
          <div className="page-header-content animate-fade-in-up">
            <h1 className="hero-title hero-title--single-brush-line">
              {preferTradForKeShiLu("循法造技 步步有道")}
            </h1>
            <p lang="zh-CN" className="marketing-hero-subtitle-serif marketing-subtitle--kai mb-6 max-w-3xl">
              深耕专业表达，让每一份思考都有章法
            </p>

            {/* 分类标签 */}
            <div className="flex flex-wrap gap-2">
              {GUIDE_CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`tag-border ${activeCategory === category ? "active" : ""}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 主内容区 */}
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="main-grid">
            {/* 左侧：指南列表 */}
            <div>
              {/* Tab 切换 */}
              <div className="tab-bar">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              <Link
                  href="/creator-guide/contribute"
                  className="tab-btn"
                  style={{ marginLeft: "auto", background: "var(--coffee)", color: "white" }}
                >
                  <Plus className="w-4 h-4" />
                  投稿
                </Link>
              </div>

              {/* 四大内容入口 */}
              <div className="guide-grid">
                {GUIDES.map((guide) => (
                  <Link
                    key={guide.id}
                    href={guide.href}
                    className="guide-card"
                  >
                    <div className="guide-card-inner">
                      <div className="guide-card-icon">
                        <guide.icon className="w-5 h-5" />
                      </div>
                      <div className="guide-card-content">
                        <h3 className="guide-card-title">{guide.title}</h3>
                        <p className="guide-card-desc">{guide.description}</p>
                      </div>
                      <div className="guide-card-arrow">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* 推荐教程 */}
              <div className="mt-10">
                <h2 className="text-xl font-semibold text-[#2C2416] mb-5 flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#D4A574]" />
                  推荐教程
                </h2>
                <div className="tutorial-list">
                  {TUTORIALS.map((tutorial) => (
                    <Link
                      key={tutorial.id}
                      href="/creator-guide/tutorials"
                      className="tutorial-item"
                    >
                      <div className="tutorial-num">{tutorial.id}</div>
                      <div className="tutorial-content min-w-0">
                        <h3 className="tutorial-title">{tutorial.title}</h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-[#9A8B78]">
                          <span className="text-[#5D4E3A]">分享者</span> · {tutorial.sharerName}
                          <span className="mx-2 text-[rgba(212,165,116,0.45)]">|</span>
                          <span className="text-[#5D4E3A]">创作者</span> · {tutorial.creatorName}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {tutorial.keywords.map((kw) => (
                            <span
                              key={kw}
                              className="rounded-full border border-[rgba(212,165,116,0.28)] bg-[rgba(212,165,116,0.08)] px-2 py-0.5 text-[11px] font-medium text-[#8B7355]"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                        <div className="tutorial-meta mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            {tutorial.duration}
                          </span>
                          <span className={`tutorial-level ${tutorial.level === "进阶" ? "advanced" : ""}`}>
                            {tutorial.level}
                          </span>
                        </div>
                      </div>
                      <div className="tutorial-icon pt-1">
                        <Video className="w-4 h-4" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* 优秀创作者金句 */}
              <div className="mt-10">
                <h2 className="text-xl font-semibold text-[#2C2416] mb-2 flex items-center gap-2">
                  <Quote className="h-5 w-5 shrink-0 text-[#D4A574]" aria-hidden />
                  关于创作，他们有话说
                </h2>
                <p className="mb-5 text-sm text-[#9A8B78]">来自平台优秀创作者的真实创作观，愿为你的下一程提供一点光亮。</p>
                <div className="tutorial-list">
                  {CREATOR_QUOTES.map((item, i) => (
                    <blockquote key={i} tabIndex={0} className="creator-guide-quote-card">
                      <p className="tutorial-title mb-0 leading-relaxed text-[#5C4033]">「{item.quote}」</p>
                      <footer className="tutorial-meta mt-3 flex-wrap">
                        <span className="font-semibold text-[var(--coffee)]">{item.name}</span>
                        <span className="text-xs">{item.role}</span>
                      </footer>
                    </blockquote>
                  ))}
                </div>
                <Link
                  href="/creator-guide/faq"
                  className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[#D4A574] hover:text-[#B8860B]"
                >
                  仍需系统问答？查看常见问题
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>

            {/* 右侧：侧边栏 */}
            <div className="flex flex-col gap-6">
              {/* 开始创作 CTA */}
              <div className="cta-card">
                <h3 className="text-white">
                  <Sparkles className="w-5 h-5 inline-block mr-1" />
                  准备好开始创作了吗？
                </h3>
                <p>只需 5 分钟，你就能创建第一个 Skills 或智能体</p>
                <Link href="/creator/agents/new" className="btn-slide amber">
                  <ArrowRight className="w-4 h-4" />
                  开始创作
                </Link>
              </div>

              {/* 热门分类 */}
              <div className="sidebar-card">
                <h3 className="sidebar-card-title">
                  <Rocket className="w-4 h-4" />
                  热门分类
                </h3>
                <div className="flex flex-wrap gap-2">
                  {HOT_TAGS.map((tag) => (
                    <Link
                      key={tag}
                      href={`/creator-guide?t=${encodeURIComponent(tag)}`}
                      className="tag"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>

              {/* 快捷入口 */}
              <div className="sidebar-card">
                <h3 className="sidebar-card-title">
                  <BookOpen className="w-4 h-4" />
                  快捷入口
                </h3>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/workspace/favorites"
                    className="flex items-center justify-between p-3 rounded-lg bg-[rgba(255,248,240,0.6)] text-[#5D4E3A] hover:bg-[rgba(212,165,116,0.15)] hover:text-[#D4A574] transition-all"
                  >
                    <span className="text-sm font-medium">我的收藏</span>
                    <ArrowRight className="w-4 h-4 text-[#9A8B78]" />
                  </Link>
                  <Link
                    href="/workspace/purchased"
                    className="flex items-center justify-between p-3 rounded-lg bg-[rgba(255,248,240,0.6)] text-[#5D4E3A] hover:bg-[rgba(212,165,116,0.15)] hover:text-[#D4A574] transition-all"
                  >
                    <span className="text-sm font-medium">我的投稿</span>
                    <ArrowRight className="w-4 h-4 text-[#9A8B78]" />
                  </Link>
                  <Link
                    href="/creator"
                    className="flex items-center justify-between p-3 rounded-lg bg-[rgba(255,248,240,0.6)] text-[#5D4E3A] hover:bg-[rgba(212,165,116,0.15)] hover:text-[#D4A574] transition-all"
                  >
                    <span className="text-sm font-medium">创作者中心</span>
                    <ArrowRight className="w-4 h-4 text-[#9A8B78]" />
                  </Link>
                </div>
              </div>

              {/* 创作者社区入口 */}
              <div className="community-card">
                <div className="community-icon">
                  <Users className="w-5 h-5" />
                </div>
                <div className="community-content">
                  <h3 className="community-title">创作者社区</h3>
                  <p className="community-desc">与其他创作者交流经验</p>
                </div>
                <Link
                  href="/community"
                  className="btn-slide primary"
                  style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
