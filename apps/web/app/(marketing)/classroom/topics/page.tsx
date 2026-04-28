'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import { MessageSquare, ArrowRight, Users, TrendingUp } from 'lucide-react'

const TOPICS = [
  { name: '合同审查技巧', threads: 256, posts: 1520, icon: '📝' },
  { name: '智能体设计讨论', threads: 189, posts: 1120, icon: '🤖' },
  { name: '劳动争议案例', threads: 145, posts: 980, icon: '⚖️' },
  { name: '创作经验分享', threads: 312, posts: 2150, icon: '💡' },
  { name: '合规风控交流', threads: 98, posts: 640, icon: '🛡️' },
  { name: '法律咨询问答', threads: 423, posts: 2890, icon: '❓' },
]

export default function ClassroomTopicsPage() {
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
            src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1920&q=80"
            alt="学习话题"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <MessageSquare className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">学习话题</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("热门学习话题")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("加入讨论，与同行交流学习心得，共同成长")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {TOPICS.map((topic, idx) => (
              <Link
                key={topic.name}
                href={`/classroom/topics/${encodeURIComponent(topic.name)}`}
                className="card group p-6"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{topic.icon}</span>
                  <div>
                    <h3 className="font-semibold text-[#2C2416]">{topic.name}</h3>
                    <p className="text-sm text-[#9A8B78]">{topic.threads} 个话题</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-[rgba(212,165,116,0.25)]">
                  <span className="flex items-center gap-1 text-sm text-[#9A8B78]">
                    <Users className="w-4 h-4" />{topic.posts} 条回复
                  </span>
                  <span className="flex items-center gap-1 text-sm font-medium text-[#D4A574] group-hover:gap-2 transition-all">
                    进入 <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
