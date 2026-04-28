'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import { FileText, ArrowRight, Check, Clock } from 'lucide-react'

const POLICIES = [
  { title: '创作规范', desc: '了解平台内容创作的基本规范与要求', icon: '📋' },
  { title: '审核规则', desc: '了解作品审核的标准与流程', icon: '✅' },
  { title: '收益政策', desc: '了解创作者收益分成与结算规则', icon: '💰' },
  { title: '违规处理', desc: '了解违规行为的处理方式', icon: '⚠️' },
  { title: '隐私政策', desc: '了解平台隐私保护政策', icon: '🔒' },
  { title: '用户协议', desc: '了解平台用户服务协议', icon: '📜' },
]

export default function CreatorsPolicyPage() {
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
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80"
            alt="创作者政策"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <FileText className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">创作者政策</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("平台政策")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("了解平台创作者相关的规范与政策")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {POLICIES.map((policy, idx) => (
              <Link
                key={policy.title}
                href={`/creators/policy/${encodeURIComponent(policy.title)}`}
                className="card group p-6"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl">{policy.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#2C2416]">{policy.title}</h3>
                    <p className="text-sm text-[#5D4E3A]">{policy.desc}</p>
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
