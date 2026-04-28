'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import { MessageSquare, ArrowRight, Heart, Eye } from 'lucide-react'

export default function CommunityPostPage() {
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
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&q=80"
            alt="帖子详情"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <h1 className="page-title">{preferTradForKeShiLu("帖子详情")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("查看帖子详细内容")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="card p-8 mb-8">
            <h2 className="text-2xl font-semibold text-[#2C2416] mb-4">帖子标题</h2>
            <p className="text-[#5D4E3A] mb-6">帖子内容在这里...</p>
            <div className="flex items-center gap-6 text-sm text-[#9A8B78]">
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />128
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />32
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />1.2k
              </span>
            </div>
          </div>

          <div className="section-header mb-8">
            <h3 className="section-title text-[#D4A574]">评论</h3>
          </div>

          <div className="space-y-4">
            <div className="card p-6">
              <p className="text-[#5D4E3A]">评论内容...</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
