'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import { Briefcase, ArrowRight } from 'lucide-react'

const TYPES = [
  { name: '法律需求', count: 128, desc: '短期项目合作' },
  { name: '法律咨询', count: 96, desc: '一对一专业咨询' },
  { name: '文书撰写', count: 78, desc: '法律文书撰写服务' },
  { name: '诉讼代理', count: 65, desc: '诉讼与仲裁代理' },
  { name: '合规审查', count: 54, desc: '企业合规审查服务' },
  { name: '培训讲座', count: 42, desc: '法律培训与讲座' },
]

export default function OpportunitiesTypePage() {
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
            src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1920&q=80"
            alt="合作类型"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <Briefcase className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">合作类型</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("按类型查找合作")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("选择合作类型，快速找到适合的机会")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {TYPES.map((type, idx) => (
              <Link
                key={type.name}
                href={`/opportunities?type=${encodeURIComponent(type.name)}`}
                className="card group p-6"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[rgba(212,165,116,0.15)] flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-[#D4A574]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#2C2416]">{type.name}</h3>
                    <p className="text-sm text-[#5D4E3A]">{type.desc}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-[rgba(212,165,116,0.25)]">
                  <span className="tag">{type.count} 个机会</span>
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
