'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import { Handshake, ArrowRight, MessageSquare, Phone } from 'lucide-react'

export default function FindLawyerContactPage() {
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
            alt="联系律师"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <Handshake className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">联系律师</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("联系我们")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("有任何问题或需求，欢迎随时联系")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="card p-8 text-center">
              <MessageSquare className="w-12 h-12 text-[#D4A574] mx-auto mb-4" />
              <h3 className="font-semibold text-[#2C2416] mb-2">在线客服</h3>
              <p className="text-sm text-[#5D4E3A] mb-4">工作日 9:00-18:00</p>
              <button className="btn-slide primary w-full justify-center">
                立即咨询
              </button>
            </div>
            <div className="card p-8 text-center">
              <Phone className="w-12 h-12 text-[#D4A574] mx-auto mb-4" />
              <h3 className="font-semibold text-[#2C2416] mb-2">电话咨询</h3>
              <p className="text-sm text-[#5D4E3A] mb-4">400-888-8888</p>
              <button className="btn-slide outline w-full justify-center">
                拨打热线
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
