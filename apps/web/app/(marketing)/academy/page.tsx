'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, BookOpen, Users, Award, ArrowRight, Play, CheckCircle, Star } from 'lucide-react'

/**
 * 学习中心（Academy）页面 — UI预演方案
 * 视觉方向：琥珀咖啡色系 + 思源宋体 + 丝绒质感
 */

const HERO_IMAGE = "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1920&q=80"

const COURSE_CATEGORIES = [
  { name: '全部课程', count: 128, icon: BookOpen },
  { name: '入门基础', count: 45, icon: Play },
  { name: '进阶提升', count: 52, icon: Award },
  { name: '专家精讲', count: 31, icon: Star },
]

const FEATURED_COURSES = [
  {
    id: '1',
    title: '法律灵感创作入门指南',
    instructor: '张律师',
    duration: '2小时',
    lessons: 12,
    students: 1280,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80',
    tags: ['创作指南', '新手必看']
  },
  {
    id: '2',
    title: 'AI 合同审查实战课程',
    instructor: '王律师',
    duration: '3.5小时',
    lessons: 18,
    students: 890,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&q=80',
    tags: ['合同审查', 'AI 工具']
  },
  {
    id: '3',
    title: '劳动争议处理全流程',
    instructor: '陈律师',
    duration: '4小时',
    lessons: 24,
    students: 756,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=400&q=80',
    tags: ['劳动争议', '实务操作']
  },
]

const LEARNING_PATHWAYS = [
  {
    title: '新手入门路径',
    desc: '从零开始，系统学习平台使用方法与创作基础',
    courses: 24,
    icon: Play
  },
  {
    title: '专业能力提升',
    desc: '针对特定领域，深入掌握专业技能与实践技巧',
    courses: 42,
    icon: Award
  },
  {
    title: '专家进阶之路',
    desc: '成为认证创作者，建立个人品牌，获得平台收益',
    courses: 18,
    icon: Star
  }
]

export default function AcademyPage() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="min-h-screen marketing-page-shell-tint">
      {/* ── Hero ── */}
      <section className="page-header" style={{ position: 'relative' }}>
        <div className="page-header-bg" style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 0,
          overflow: 'hidden'
        }}>
          <img
            src={HERO_IMAGE}
            alt="学习中心背景"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            {/* 标签 */}
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <BookOpen className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">学习中心</span>
            </div>

            <h1 className="page-title">{preferTradForKeShiLu("系统学习，快速成长")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("从入门到专业，平台提供丰富的课程与学习路径，帮助你掌握法律灵感创作与智能体使用的核心技能")}</p>

            {/* 搜索框 */}
            <div className="mt-8">
              <div className="search-box mx-auto max-w-xl">
                <Search className="text-[#9A8B78]" />
                <input
                  type="text"
                  placeholder="搜索课程、讲师、主题..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-[#2C2416]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 课程分类 ── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="section-header mb-12">
            <div className="section-label">Categories</div>
            <h2 className="section-title text-[#D4A574]">课程分类</h2>
            <p className="section-subtitle">
              {preferTradForKeShiLu("按兴趣与需求，选择适合的学习方向")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {COURSE_CATEGORIES.map((cat, idx) => (
              <Link
                key={cat.name}
                href={`/academy?category=${encodeURIComponent(cat.name)}`}
                className="card group text-center p-8 hover:border-[rgba(212,165,116,0.4)]"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-[rgba(212,165,116,0.15)] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <cat.icon className="w-7 h-7 text-[#D4A574]" />
                  </div>
                </div>
                <h3 className="font-semibold text-[#2C2416] mb-1">{cat.name}</h3>
                <p className="text-sm text-[#9A8B78]">{cat.count} 门课程</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 精选课程 ── */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="section-label">Featured</div>
              <h2 className="section-title text-[#D4A574]">精选课程</h2>
              <p className="section-subtitle mt-2 text-[#5D4E3A]">
                {preferTradForKeShiLu("由认证律师与资深创作者打造的高质量课程")}
              </p>
            </div>
            <Link
              href="/academy/courses"
              className="hidden items-center gap-1 text-sm font-semibold text-[#D4A574] transition-all group-hover:gap-2 sm:flex"
            >
              查看全部 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURED_COURSES.map((course, idx) => (
              <Link
                key={course.id}
                href={`/academy/courses/${course.id}`}
                className="card group overflow-hidden"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {/* 课程封面 */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {course.tags.map(tag => (
                        <span key={tag} className="tag text-xs">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 课程信息 */}
                <div className="p-5">
                  <h3 className="font-semibold text-[#2C2416] mb-2 line-clamp-2 group-hover:text-[#D4A574] transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-[#5D4E3A] mb-3">讲师：{course.instructor}</p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-[#9A8B78]">
                      <span>{course.duration}</span>
                      <span>·</span>
                      <span>{course.lessons} 课时</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#D4A574] font-medium">
                      <Star className="w-4 h-4 fill-[#D4A574] text-[#D4A574]" />
                      {course.rating}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[rgba(212,165,116,0.25)] flex items-center justify-between">
                    <span className="text-sm text-[#9A8B78]">{course.students} 人在学习</span>
                    <span className="text-sm font-medium text-[#D4A574]">免费学习 →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 学习路径 ── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="section-header mb-12">
            <div className="section-label">Learning Paths</div>
            <h2 className="section-title text-[#D4A574]">系统学习路径</h2>
            <p className="section-subtitle">
              {preferTradForKeShiLu("按照阶段规划，循序渐进，高效掌握核心能力")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {LEARNING_PATHWAYS.map((path, idx) => (
              <Link
                key={path.title}
                href={`/academy/pathway/${encodeURIComponent(path.title)}`}
                className="card group p-8 text-center"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="w-16 h-16 rounded-full bg-[rgba(212,165,116,0.15)] flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform">
                  <path.icon className="w-8 h-8 text-[#D4A574]" />
                </div>
                <h3 className="text-xl font-semibold text-[#2C2416] mb-2">{path.title}</h3>
                <p className="text-[#5D4E3A] mb-4">{path.desc}</p>
                <div className="tag">{path.courses} 门课程</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-[#D4A574] mb-4">
            开始你的学习之旅
          </h2>
          <p className="text-lg text-[#5D4E3A] mb-8">
            无论你是初学者还是希望进阶提升，这里都有适合你的课程
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/academy/courses" className="btn-slide primary">
              <BookOpen className="w-5 h-5" />
              浏览课程
            </Link>
            <Link href="/creator-guide" className="btn-slide outline">
              <ArrowRight className="w-5 h-5" />
              创作指南
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
