'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight, Star, Heart, Zap } from 'lucide-react'

export default function InspirationCategoryPage() {
  const CATEGORIES = [
    { name: '合同法', count: 328, icon: '📝' },
    { name: '劳动法', count: 256, icon: '👷' },
    { name: '婚姻家事', count: 198, icon: '💑' },
    { name: '公司法', count: 187, icon: '🏢' },
    { name: '知识产权', count: 145, icon: '💡' },
    { name: '刑事辩护', count: 98, icon: '⚖️' },
  ]

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
            src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1920&q=80"
            alt="灵感分类"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <Sparkles className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">灵感分类</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("灵感广场")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("按法律领域探索精选灵感、技能包与智能体")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="section-header mb-12">
            <h2 className="section-title text-[#D4A574]">按领域浏览</h2>
            <p className="section-subtitle">
              {preferTradForKeShiLu("选择感兴趣的法律领域，发现对应灵感")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat, idx) => (
              <Link
                key={cat.name}
                href={`/inspiration?category=${encodeURIComponent(cat.name)}`}
                className="card group p-6"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-5xl">{cat.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#2C2416] mb-1">{cat.name}</h3>
                    <p className="text-sm text-[#9A8B78]">{cat.count} 个灵感</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#9A8B78] group-hover:text-[#D4A574] group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
