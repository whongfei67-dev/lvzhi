'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import { Trophy, ArrowRight } from 'lucide-react'

export default function LawyersRankingPage() {
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
            alt="律师榜单"
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
            <h1 className="page-title">{preferTradForKeShiLu("律师榜单")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("发现最具影响力的认证律师")}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-8 lg:px-8">
        <p className="text-sm font-medium text-[#5D4E3A]">蓝图子榜单入口</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ["综合推荐榜", "/lawyers/ranking/comprehensive"],
            ["创作影响力榜", "/lawyers/ranking/influence"],
            ["新锐创作者律师榜", "/lawyers/ranking/newcomer"],
            ["影响力律所榜", "/lawyers/ranking/firm_influence"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-full border border-[rgba(212,165,116,0.35)] bg-white px-4 py-2 text-sm text-[#5C4033] transition-colors hover:border-[#D4A574] hover:text-[#D4A574]"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/lawyers/rankings"
            className="rounded-full border border-[#284A3D] bg-[#284A3D] px-4 py-2 text-sm text-white transition-opacity hover:opacity-90"
          >
            完整榜单页
          </Link>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="space-y-4">
            {[
              { name: '张律师', field: '合同法', followers: 2340, rating: 4.9 },
              { name: '陈晓敏', field: '劳动争议', followers: 1890, rating: 4.9 },
              { name: '王建国', field: '企业合规', followers: 1560, rating: 4.8 },
              { name: '林雨欣', field: '婚姻家事', followers: 1230, rating: 4.8 },
            ].map((lawyer, idx) => (
              <Link
                key={lawyer.name}
                href={`/lawyers/${encodeURIComponent(lawyer.name)}`}
                className="card group p-6 flex items-center justify-between"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    idx === 0 ? 'bg-[rgba(212,165,116,0.25)] text-[#D4A574]'
                    : idx === 1 ? 'bg-[rgba(212,165,116,0.2)] text-[#B8860B]'
                    : idx === 2 ? 'bg-[rgba(212,165,116,0.15)] text-[#B8860B]'
                    : 'bg-[rgba(212,165,116,0.1)] text-[#9A8B78]'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2C2416]">{lawyer.name}</h3>
                    <p className="text-sm text-[#5D4E3A]">{lawyer.field}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm text-[#9A8B78]">{lawyer.followers} 粉丝</span>
                  <span className="text-sm text-[#D4A574]">评分 {lawyer.rating}</span>
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
