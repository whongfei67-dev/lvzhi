'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import { FileText, ArrowRight } from 'lucide-react'

export default function CreatorCenterTemplatePage() {
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
            alt="创作模板"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <FileText className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">创作模板</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("创作者模板库")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("使用模板快速创建高质量作品")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: '技能包模板', desc: '快速创建标准化的技能包' },
              { title: '智能体模板', desc: '一键创建专属智能体' },
              { title: '课程模板', desc: '创建专业的在线课程' },
            ].map((template, idx) => (
              <div
                key={template.title}
                className="card group p-6"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <FileText className="w-12 h-12 text-[#D4A574] mb-4" />
                <h3 className="font-semibold text-[#2C2416] mb-2">{template.title}</h3>
                <p className="text-sm text-[#5D4E3A] mb-4">{template.desc}</p>
                <Link href="/creator-center" className="btn-slide outline inline-flex items-center gap-2">
                  使用模板 <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
