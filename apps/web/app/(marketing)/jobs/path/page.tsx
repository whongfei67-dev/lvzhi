'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import { Briefcase, ArrowRight, MapPin, TrendingUp } from 'lucide-react'

export default function JobsPathPage() {
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
            src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1920&q=80"
            alt="职业路径"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <TrendingUp className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">职业路径</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("法律职业发展路径")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("从入门到资深，规划你的法律职业发展")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-8">
            {[
              { title: '法务专员 → 法务主管 → 法务总监', desc: '企业法务职业发展路径', jobs: 245 },
              { title: '律师助理 → 主办律师 → 合伙人', desc: '律师事务所职业发展路径', jobs: 312 },
              { title: '合规专员 → 合规主管 → 首席合规官', desc: '合规风控职业发展路径', jobs: 128 },
              { title: '法律编辑 → 法律主编 → 内容总监', desc: '法律内容职业发展路径', jobs: 86 },
            ].map((path, idx) => (
              <div
                key={path.title}
                className="card p-8"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-[#2C2416]">{path.title}</h3>
                  <span className="tag">{path.jobs} 个职位</span>
                </div>
                <p className="text-[#5D4E3A] mb-4">{path.desc}</p>
                <Link href="/jobs" className="btn-slide outline inline-flex items-center gap-2">
                  查看相关职位 <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
