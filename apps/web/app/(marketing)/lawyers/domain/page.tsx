'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import { Scale, ArrowRight, MapPin } from 'lucide-react'

export default function LawyersDomainPage() {
  const DOMAINS = [
    { name: '合同法', count: 156, icon: '📝' },
    { name: '劳动法', count: 134, icon: '👷' },
    { name: '公司法', count: 112, icon: '🏢' },
    { name: '婚姻家事', count: 98, icon: '💑' },
    { name: '知识产权', count: 87, icon: '💡' },
    { name: '刑事辩护', count: 76, icon: '⚖️' },
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
            src="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920&q=80"
            alt="领域律师"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <Scale className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">领域律师</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("按领域查找律师")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("选择专业领域，找到对应的认证律师")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {DOMAINS.map((domain, idx) => (
              <Link
                key={domain.name}
                href={`/lawyers?domain=${encodeURIComponent(domain.name)}`}
                className="card group p-6"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl">{domain.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#2C2416]">{domain.name}</h3>
                    <p className="text-sm text-[#9A8B78]">{domain.count} 位律师</p>
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
