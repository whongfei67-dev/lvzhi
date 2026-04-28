'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Users,
  Briefcase,
  Handshake,
  ArrowRight,
  Star,
  CheckCircle,
  Shield,
  Rocket
} from 'lucide-react'

/**
 * 创作者中心（Creator Center）页面 — UI预演方案
 * 视觉方向：琥珀咖啡色系 + 思源宋体 + 丝绒质感
 */

const HERO_IMAGE = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80"

const CREATOR_BENEFITS = [
  {
    icon: Users,
    title: '连接社区',
    desc: '与5000+法律从业者互动交流，建立专业网络'
  },
  {
    icon: Briefcase,
    title: '项目合作',
    desc: '获取优质项目机会，拓展业务渠道'
  },
  {
    icon: Handshake,
    title: '收益分成',
    desc: '通过Skills、智能体等获得持续收益'
  },
  {
    icon: Shield,
    title: '品牌认证',
    desc: '平台认证标识，提升个人专业影响力'
  }
]

const CREATOR_TOOLS = [
  {
    name: 'Skills 创作工具',
    desc: '在线编辑器，轻松创建可复用的法律技能包',
    href: '/creator/skills',
    icon: '🛠️'
  },
  {
    name: '智能体发布',
    desc: '发布 AI 智能体，提供自动化法律服务',
    href: '/creator/agents',
    icon: '🤖'
  },
  {
    name: '作品管理',
    desc: '统一管理你的所有发布内容与数据',
    href: '/workspace',
    icon: '📊'
  },
  {
    name: '收益中心',
    desc: '查看收入明细、提现记录与收益分析',
    href: '/creator/earnings',
    icon: '💰'
  }
]

const TOP_CREATORS = [
  { name: '张律师', field: '合同法', fans: '2.3k', rating: 4.9 },
  { name: '陈晓敏', field: '劳动争议', fans: '1.8k', rating: 4.9 },
  { name: '王建国', field: '企业合规', fans: '1.5k', rating: 4.8 },
  { name: '林雨欣', field: '婚姻家事', fans: '1.2k', rating: 4.8 },
]

export default function CreatorCenterPage() {
  const [email, setEmail] = useState('')

  return (
    <div className="min-h-screen marketing-page-shell-tint">
      {/* ── Hero ── */}
      <section className="page-header" style={{ position: 'relative' }}>
        <div className="page-header-bg" style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 0,
          overflow: 'hidden'
        }}>
          <img
            src={HERO_IMAGE}
            alt="创作者中心"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <Users className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">创作者中心</span>
            </div>

            <h1 className="page-title">{preferTradForKeShiLu("成为创作者，分享你的专业价值")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("将你的法律专业知识转化为 Skills、智能体、模板与工具，帮助更多人，同时获得收益回报")}</p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/register" className="btn-slide primary">
                <Rocket className="w-5 h-5" />
                立即加入
              </Link>
              <Link href="/creator-guide" className="btn-slide outline">
                <ArrowRight className="w-5 h-5" />
                了解创作指南
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 创作者权益 ── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="section-header mb-12">
            <div className="section-label">Benefits</div>
            <h2 className="section-title text-[#D4A574]">创作者权益</h2>
            <p className="section-subtitle">
              {preferTradForKeShiLu("平台提供全方位支持，助力你的创作之路")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {CREATOR_BENEFITS.map((benefit, idx) => (
              <div
                key={benefit.title}
                className="card group p-6 text-center"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-[rgba(212,165,116,0.15)] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <benefit.icon className="w-7 h-7 text-[#D4A574]" />
                </div>
                <h3 className="font-semibold text-[#2C2416] mb-2">{benefit.title}</h3>
                <p className="text-sm text-[#5D4E3A]">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 创作工具 ── */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="section-header mb-12">
            <div className="section-label">Tools</div>
            <h2 className="section-title text-[#D4A574]">创作者工具箱</h2>
            <p className="section-subtitle">
              {preferTradForKeShiLu("多样化创作工具，满足不同创作需求")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {CREATOR_TOOLS.map((tool, idx) => (
              <Link
                key={tool.name}
                href={tool.href}
                className="card group p-6"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="text-4xl mb-4">{tool.icon}</div>
                <h3 className="font-semibold text-[#2C2416] mb-2">{tool.name}</h3>
                <p className="text-sm text-[#5D4E3A] mb-4">{tool.desc}</p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-[#D4A574] group-hover:gap-2 transition-all">
                  前往使用 <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 头部创作者展示 ── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="section-label">Top Creators</div>
              <h2 className="section-title text-[#D4A574]">优秀创作者</h2>
              <p className="section-subtitle mt-2 text-[#5D4E3A]">
                {preferTradForKeShiLu("他们已经在平台上获得了广泛认可")}
              </p>
            </div>
            <Link
              href="/creators"
              className="hidden items-center gap-1 text-sm font-semibold text-[#D4A574] transition-all group-hover:gap-2 sm:flex"
            >
              查看全部 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {TOP_CREATORS.map((creator, idx) => (
              <Link
                key={creator.name}
                href={`/creators/${encodeURIComponent(creator.name)}`}
                className="card group p-6 text-center"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="w-20 h-20 rounded-full bg-[rgba(212,165,116,0.2)] flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-[#D4A574] group-hover:scale-105 transition-transform">
                  {creator.name[0]}
                </div>
                <h3 className="font-semibold text-[#2C2416] mb-1">{creator.name}</h3>
                <p className="text-sm text-[#5D4E3A] mb-2">{creator.field}</p>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-[#9A8B78]">
                    <Users className="w-4 h-4" />{creator.fans}
                  </span>
                  <span className="flex items-center gap-1 text-[#D4A574]">
                    <Star className="w-4 h-4 fill-[#D4A574] text-[#D4A574]" />{creator.rating}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-[#D4A574] mb-4">
            准备好开始创作了吗？
          </h2>
          <p className="text-lg text-[#5D4E3A] mb-8">
            加入380+创作者行列，分享你的专业知识，获得应有回报
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-slide primary">
              <Rocket className="w-5 h-5" />
              立即注册
            </Link>
            <Link href="/creator-guide" className="btn-slide outline">
              <ArrowRight className="w-5 h-5" />
              阅读创作指南
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
