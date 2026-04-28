'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import { Tag, ArrowRight, Sparkles } from 'lucide-react'

const POPULAR_TAGS = [
  '合同审查', '劳动争议', '婚姻家事', '企业合规', '公司法务',
  '知识产权', '刑事辩护', '交通事故', '房产纠纷', '债务纠纷',
  '遗产继承', '侵权责任', '合同纠纷', '劳动仲裁', '法律咨询'
]

export default function InspirationTagPage() {
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
            alt="灵感标签"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <Tag className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">灵感标签</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("按标签探索")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("通过标签快速找到你感兴趣的法律场景灵感")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="section-header mb-12">
            <h2 className="section-title text-[#D4A574]">热门标签</h2>
            <p className="section-subtitle">
              {preferTradForKeShiLu("点击标签，发现相关内容")}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {POPULAR_TAGS.map((tag, idx) => (
              <Link
                key={tag}
                href={`/inspiration?tag=${encodeURIComponent(tag)}`}
                className="tag-border text-lg px-5 py-3"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
