'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import { Users, Handshake, ArrowRight, Briefcase, MessageSquare } from 'lucide-react'

/**
 * 合作页面 — UI预演方案
 * 视觉方向：琥珀咖啡色系 + 思源宋体
 */

const HERO_IMAGE = "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1920&q=80"

const COOPERATION_TYPES = [
  {
    icon: Briefcase,
    title: '项目合作',
    desc: '法律行业招聘、法律需求、商务合作，找到适合的合作机会。',
    href: '/opportunities',
    cta: '查看机会'
  },
  {
    icon: Users,
    title: '律师入驻',
    desc: '成为平台认证律师，享受平台流量与专业背书，获取更多案源与合作机会。',
    href: '/lawyers/verified',
    cta: '立即入驻'
  },
  {
    icon: Handshake,
    title: '机构合作',
    desc: '与律所、法律科技公司、法律媒体等机构建立深度合作，共建法律服务生态。',
    href: '/enterprise',
    cta: '联系我们'
  }
]

export default function CooperationPage() {
  return (
    <div className="min-h-screen marketing-page-shell-tint">
      {/* ── Hero ── */}
      <section className="page-header" style={{ position: 'relative' }}>
        <div className="page-header-bg" style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 0,
          overflow: 'hidden'
        }}>
          <img
            src={HERO_IMAGE}
            alt="合作"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <Handshake className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">合作</span>
            </div>

            <h1 className="page-title">{preferTradForKeShiLu("连接法律行业，共享发展机遇")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("无论你是律师、律所还是法律科技公司，律植都为你提供广阔的合作平台与发展机遇")}</p>
          </div>
        </div>
      </section>

      {/* ── 合作类型 ── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="section-header mb-12">
            <div className="section-label">Cooperation</div>
            <h2 className="section-title text-[#D4A574]">合作方式</h2>
            <p className="section-subtitle">
              {preferTradForKeShiLu("选择适合你的合作方式，开启律植之旅")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {COOPERATION_TYPES.map((type, idx) => (
              <Link
                key={type.title}
                href={type.href}
                className="card group p-8"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="w-16 h-16 rounded-2xl bg-[rgba(212,165,116,0.15)] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <type.icon className="w-8 h-8 text-[#D4A574]" />
                </div>
                <h3 className="text-xl font-semibold text-[#2C2416] mb-3 text-center">{type.title}</h3>
                <p className="text-[#5D4E3A] text-center mb-6">{type.desc}</p>
                <div className="text-center">
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-[#D4A574] group-hover:gap-2 transition-all">
                    {type.cta} <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-[#D4A574] mb-4">
            开启合作，共创未来
          </h2>
          <p className="text-lg text-[#5D4E3A] mb-8">
            无论你有任何合作意向，欢迎联系我们
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/find-lawyer/contact" className="btn-slide primary">
              <MessageSquare className="w-5 h-5" />
              联系我们
            </Link>
            <Link href="/opportunities" className="btn-slide outline">
              <Briefcase className="w-5 h-5" />
              浏览合作机会
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
