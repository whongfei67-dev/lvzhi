'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import { Shield, ArrowRight, Scale, Star } from 'lucide-react'

export default function LawyersVerifiedPage() {
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
            alt="认证律师"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <Shield className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">认证律师</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("已认证律师")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("320+ 位通过平台认证的专业律师")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: '张律师', field: '合同法', region: '北京', years: 12 },
              { name: '陈晓敏', field: '劳动争议', region: '上海', years: 9 },
              { name: '王建国', field: '企业合规', region: '深圳', years: 15 },
              { name: '林雨欣', field: '婚姻家事', region: '广州', years: 7 },
              { name: '李律师', field: '知识产权', region: '杭州', years: 10 },
              { name: '周律师', field: '公司法', region: '成都', years: 8 },
            ].map((lawyer, idx) => (
              <Link
                key={lawyer.name}
                href={`/lawyers/${encodeURIComponent(lawyer.name)}`}
                className="card group p-6"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-[rgba(212,165,116,0.2)] flex items-center justify-center text-xl font-bold text-[#D4A574]">
                    {lawyer.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#2C2416]">{lawyer.name}</h3>
                      <Shield className="w-4 h-4 text-[#D4A574]" />
                    </div>
                    <p className="text-sm text-[#5D4E3A]">{lawyer.field} · 执业{lawyer.years}年</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-[rgba(212,165,116,0.25)]">
                  <span className="text-sm text-[#9A8B78]">{lawyer.region}</span>
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
