'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import { Briefcase, ArrowRight, MapPin, Building2 } from 'lucide-react'

const CATEGORIES = [
  { name: '法律需求', count: 128, icon: '💼' },
  { name: '法律咨询', count: 96, icon: '💬' },
  { name: '文书撰写', count: 78, icon: '📝' },
  { name: '诉讼代理', count: 65, icon: '⚖️' },
  { name: '合规审查', count: 54, icon: '🛡️' },
  { name: '培训讲座', count: 42, icon: '🎓' },
]

export default function OpportunitiesCategoryPage() {
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
            alt="合作机会"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <Briefcase className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">合作机会</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("合作机会")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("法律行业招聘、法律需求、商务合作，找到适合的机会")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat, idx) => (
              <Link
                key={cat.name}
                href={`/opportunities?category=${encodeURIComponent(cat.name)}`}
                className="card group p-6"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl">{cat.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#2C2416]">{cat.name}</h3>
                    <p className="text-sm text-[#9A8B78]">{cat.count} 个机会</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#9A8B78] group-hover:text-[#D4A574] group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
