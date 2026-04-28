'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import { GraduationCap, ArrowRight } from 'lucide-react'

export default function CreatorCenterGuidePage() {
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
            alt="创作指南"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <GraduationCap className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">创作指南</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("创作者入门指南")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("从零开始，成为优秀的法律创作者")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: '第一步：了解平台', desc: '认识律植平台与创作生态' },
              { title: '第二步：创建技能包', desc: '学习 Skills 创作基础' },
              { title: '第三步：发布智能体', desc: '了解智能体发布流程' },
              { title: '第四步：获取收益', desc: '了解收益模式与结算' },
              { title: '第五步：运营推广', desc: '如何让作品被更多人使用' },
              { title: '第六步：持续优化', desc: '根据反馈优化作品质量' },
            ].map((step, idx) => (
              <Link
                key={step.title}
                href="/creator-guide"
                className="card group p-6"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="w-10 h-10 rounded-full bg-[rgba(212,165,116,0.2)] flex items-center justify-center mb-4 text-lg font-bold text-[#D4A574]">
                  {idx + 1}
                </div>
                <h3 className="font-semibold text-[#2C2416] mb-2">{step.title}</h3>
                <p className="text-sm text-[#5D4E3A]">{step.desc}</p>
                <ArrowRight className="w-5 h-5 text-[#9A8B78] mt-4 group-hover:text-[#D4A574] group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
