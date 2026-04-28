'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import { MessageSquare, ArrowRight, Users } from 'lucide-react'

export default function CommunityTopicPage() {
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
            alt="话题"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <MessageSquare className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">话题</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("热门话题")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("参与热门话题讨论，与同行交流")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { name: '合同审查技巧', threads: 256, posts: 1520 },
              { name: '智能体设计讨论', threads: 189, posts: 1120 },
              { name: '劳动争议案例', threads: 145, posts: 980 },
              { name: '创作经验分享', threads: 312, posts: 2150 },
            ].map((topic, idx) => (
              <Link
                key={topic.name}
                href={`/community/topic/${encodeURIComponent(topic.name)}`}
                className="card group p-6"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <h3 className="font-semibold text-[#2C2416] mb-3">{topic.name}</h3>
                <div className="flex items-center gap-4 text-sm text-[#9A8B78]">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />{topic.threads} 话题
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />{topic.posts} 回复
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 text-[#9A8B78] mt-4 group-hover:text-[#D4A574] group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
