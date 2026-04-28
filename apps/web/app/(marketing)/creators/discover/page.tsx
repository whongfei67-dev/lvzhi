'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import { Users, ArrowRight, Star } from 'lucide-react'

export default function CreatorsDiscoverPage() {
  const CREATORS = [
    { name: '张律师', field: '合同法', fans: '2.3k', rating: 4.9, works: 45 },
    { name: '陈晓敏', field: '劳动争议', fans: '1.8k', rating: 4.9, works: 38 },
    { name: '王建国', field: '企业合规', fans: '1.5k', rating: 4.8, works: 32 },
    { name: '林雨欣', field: '婚姻家事', fans: '1.2k', rating: 4.8, works: 28 },
    { name: '李律师', field: '知识产权', fans: '980', rating: 4.7, works: 24 },
    { name: '周律师', field: '公司法', fans: '850', rating: 4.7, works: 22 },
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
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80"
            alt="发现创作者"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <Users className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">发现创作者</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("优秀创作者")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("发现最具影响力的法律创作者，与他们连接")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CREATORS.map((creator, idx) => (
              <Link
                key={creator.name}
                href={`/creators/${encodeURIComponent(creator.name)}`}
                className="card group p-6 text-center"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="w-20 h-20 rounded-full bg-[rgba(212,165,116,0.2)] flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-[#D4A574] group-hover:scale-105 transition-transform">
                  {creator.name[0]}
                </div>
                <h3 className="font-semibold text-[#2C2416] mb-1">{creator.name}</h3>
                <p className="text-sm text-[#5D4E3A] mb-3">{creator.field}</p>
                <div className="flex items-center justify-center gap-4 text-sm mb-4">
                  <span className="text-[#9A8B78]">{creator.fans} 粉丝</span>
                  <span className="flex items-center gap-1 text-[#D4A574]">
                    <Star className="w-4 h-4 fill-[#D4A574] text-[#D4A574]" />{creator.rating}
                  </span>
                </div>
                <span className="tag">{creator.works} 作品</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
