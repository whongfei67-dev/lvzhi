'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import { MapPin, ArrowRight, Scale } from 'lucide-react'

const CITIES = [
  { name: '北京', count: 86 },
  { name: '上海', count: 72 },
  { name: '深圳', count: 58 },
  { name: '广州', count: 45 },
  { name: '杭州', count: 38 },
  { name: '成都', count: 32 },
  { name: '南京', count: 28 },
  { name: '武汉', count: 24 },
]

export default function LawyersCityPage() {
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
            alt="城市律师"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <MapPin className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">城市分类</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("按城市查找律师")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("选择你所在的城市，找到身边的认证律师")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CITIES.map((city, idx) => (
              <Link
                key={city.name}
                href={`/lawyers?city=${encodeURIComponent(city.name)}`}
                className="card group p-6 text-center"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <MapPin className="w-8 h-8 text-[#D4A574] mx-auto mb-2" />
                <h3 className="font-semibold text-[#2C2416] mb-1">{city.name}</h3>
                <p className="text-sm text-[#9A8B78]">{city.count} 位律师</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
