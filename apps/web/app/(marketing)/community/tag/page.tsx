'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import { Tag, ArrowRight } from 'lucide-react'

export default function CommunityTagPage() {
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
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&q=80"
            alt="标签"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <Tag className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">标签</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("标签广场")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("选择标签进入标签详情页；与「话题广场」下的版块话题相互独立。")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {['合同审查', '劳动争议', '智能体设计', '提示词优化', '案例分享', '法律咨询', '创作经验', '提问求助'].map((tag, idx) => (
              <Link
                key={tag}
                href={`/community?tag=${encodeURIComponent(tag)}`}
                className="tag-border px-4 py-2"
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
