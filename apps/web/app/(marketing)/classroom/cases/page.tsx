'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Users, Star, Clock, BookOpen } from 'lucide-react'

export default function ClassroomCasesPage() {
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
            src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1920&q=80"
            alt="案例课程"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <BookOpen className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">案例课程</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("实战案例课程")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("通过真实案例学习，快速掌握法律灵感创作与智能体应用")}</p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: '合同审查实战案例', instructor: '张律师', lessons: 16, students: 856 },
              { title: '劳动争议处理案例', instructor: '陈律师', lessons: 20, students: 624 },
              { title: '企业合规自查案例', instructor: '王律师', lessons: 12, students: 542 },
            ].map((course, idx) => (
              <Link
                key={course.title}
                href={`/classroom/cases/${encodeURIComponent(course.title)}`}
                className="card group p-6"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="w-full h-32 rounded-xl bg-[rgba(212,165,116,0.1)] mb-4 flex items-center justify-center text-4xl">
                  📋
                </div>
                <h3 className="font-semibold text-[#2C2416] mb-2">{course.title}</h3>
                <p className="text-sm text-[#5D4E3A] mb-3">讲师：{course.instructor}</p>
                <div className="flex items-center justify-between text-sm text-[#9A8B78]">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />{course.lessons} 课时
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />{course.students} 人学习
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
