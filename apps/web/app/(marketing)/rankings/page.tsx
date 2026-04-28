'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import { Trophy, ArrowRight, Scale, Star } from 'lucide-react'

const RANKINGS = [
  { title: '综合影响力榜', desc: '根据粉丝数、作品数、评价综合排序', count: 50 },
  { title: '热门创作者榜', desc: '按作品使用量和收藏数排序', count: 50 },
  { title: '新锐创作者律师榜', desc: '仅统计年龄35周岁以下的创作者律师', count: 30 },
  { title: '领域专家榜', desc: '各法律领域专业度排名', count: 50 },
]

export default function RankingsPage() {
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
            src="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920&q=80"
            alt="榜单"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <Trophy className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">榜单</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("创作者榜单")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("发现最具影响力的法律创作者与认证律师")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            {RANKINGS.map((ranking, idx) => (
              <Link
                key={ranking.title}
                href={`/rankings/${encodeURIComponent(ranking.title)}`}
                className="card group p-8"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-[#2C2416] mb-2">{ranking.title}</h3>
                    <p className="text-sm text-[#5D4E3A]">{ranking.desc}</p>
                  </div>
                  <Trophy className="w-8 h-8 text-[#D4A574] flex-shrink-0" />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-[rgba(212,165,116,0.25)]">
                  <span className="tag">TOP {ranking.count}</span>
                  <span className="flex items-center gap-1 text-sm font-medium text-[#D4A574] group-hover:gap-2 transition-all">
                    查看榜单 <ArrowRight className="w-4 h-4" />
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
