'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, ArrowRight, Star, Users, Clock, Play } from 'lucide-react'

const CLASSROOM_CATEGORIES = [
  { name: '全部课程', count: 128, icon: BookOpen },
  { name: '入门基础', count: 45, icon: Play },
  { name: '进阶提升', count: 52, icon: Star },
  { name: '专家精讲', count: 31, icon: Users },
]

export default function ClassroomPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')

  return (
    <div className="min-h-screen marketing-page-shell-tint">
      <section className="page-header" style={{ position: 'relative' }}>
        <div className="page-header-bg" style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 0,
          overflow: 'hidden'
        }}>
          <img
            src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1920&q=80"
            alt="课堂"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <BookOpen className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">课堂</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("在线课堂")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("系统学习法律灵感创作与智能体使用，从入门到精通")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
            {CLASSROOM_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name === '全部课程' ? '' : cat.name)}
                className={`card group p-6 text-center transition-all ${selectedCategory === cat.name || (selectedCategory === '' && cat.name === '全部课程') ? 'border-[rgba(212,165,116,0.4)] ring-2 ring-[rgba(212,165,116,0.2)]' : ''}`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-[rgba(212,165,116,0.15)] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <cat.icon className="w-7 h-7 text-[#D4A574]" />
                </div>
                <h3 className="font-semibold text-[#2C2416] mb-1">{cat.name}</h3>
                <p className="text-sm text-[#9A8B78]">{cat.count} 门课程</p>
              </button>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: '法律灵感创作入门指南', instructor: '张律师', duration: '2小时', lessons: 12, image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80' },
              { title: 'AI 合同审查实战课程', instructor: '王律师', duration: '3.5小时', lessons: 18, image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&q=80' },
              { title: '劳动争议处理全流程', instructor: '陈律师', duration: '4小时', lessons: 24, image: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=400&q=80' },
            ].map((course, idx) => (
              <Link
                key={course.title}
                href={`/classroom/${encodeURIComponent(course.title)}`}
                className="card group overflow-hidden"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/90 text-[#D4A574]">
                      免费
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-[#2C2416] mb-2 line-clamp-2">{course.title}</h3>
                  <p className="text-sm text-[#5D4E3A] mb-3">讲师：{course.instructor}</p>
                  <div className="flex items-center gap-3 text-sm text-[#9A8B78]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />{course.duration}
                    </span>
                    <span>·</span>
                    <span>{course.lessons} 课时</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
