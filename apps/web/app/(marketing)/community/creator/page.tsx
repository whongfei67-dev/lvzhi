'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Users, MessageSquare, Check } from 'lucide-react'

export default function CommunityCreatorPage() {
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
            alt="创作者社区"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <Users className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">创作者社区</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("创作者社区")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("与其他创作者交流经验，分享技巧，共同成长")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="space-y-6">
            {[
              { title: '如何设计一个好的法律咨询智能体', author: '张律师', replies: 45 },
              { title: 'Skills 创作经验分享：从入门到精通', author: '陈晓敏', replies: 38 },
              { title: '合同审查提示词优化技巧', author: '王律师', replies: 32 },
            ].map((post, idx) => (
              <Link
                key={post.title}
                href={`/community/post/${encodeURIComponent(post.title)}`}
                className="card group p-6"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <h3 className="font-semibold text-[#2C2416] mb-2 group-hover:text-[#D4A574] transition-colors">
                  {post.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-[#9A8B78]">
                  <span>作者：{post.author}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />{post.replies} 回复
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
