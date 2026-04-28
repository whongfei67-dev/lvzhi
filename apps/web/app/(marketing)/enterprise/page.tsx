'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Users,
  Shield,
  Scale,
  ArrowRight,
  CheckCircle,
  Handshake,
  Briefcase,
  Globe
} from 'lucide-react'

/**
 * 企业服务（Enterprise）页面 — UI预演方案
 * 视觉方向：琥珀咖啡色系 + 思源宋体 + 丝绒质感
 */

const HERO_IMAGE = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80"

const SERVICES = [
  {
    icon: Scale,
    title: '企业合规咨询',
    desc: '为企业提供全方位的合规审查与风险防控服务',
    features: ['合规体系搭建', '合同审查', '风险评估']
  },
  {
    icon: Shield,
    title: '法律顾问服务',
    desc: '专属法律顾问，7×24小时响应企业法律需求',
    features: ['日常法律咨询', '合同审核', '争议解决']
  },
  {
    icon: Users,
    title: '团队培训',
    desc: '定制化法律培训，提升企业整体法律意识',
    features: ['合规培训', '合同管理', '风险防控']
  },
  {
    icon: Handshake,
    title: '项目合作',
    desc: '与律所、律师深度合作，共建法律服务生态',
    features: ['案源合作', '专长领域', '收益分成']
  }
]

const CASE_STUDIES = [
  {
    company: '某科技公司',
    industry: '互联网',
    issue: '数据合规与隐私保护',
    result: '成功建立合规体系，避免潜在风险',
    icon: CheckCircle
  },
  {
    company: '某制造企业',
    industry: '制造业',
    issue: '劳动用工规范',
    result: '降低劳动争议风险，提升管理效率',
    icon: CheckCircle
  },
  {
    company: '某电商平台',
    industry: '电商',
    issue: '平台规则与商家纠纷',
    result: '优化平台规则，减少纠纷率30%',
    icon: CheckCircle
  }
]

export default function EnterprisePage() {
  const [formData, setFormData] = useState({ company: '', contact: '', phone: '', needs: '' })

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
            alt="企业服务"
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
              <Building2 className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">企业服务</span>
            </div>

            <h1 className="page-title">{preferTradForKeShiLu("为企业提供专业法律服务")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("从合规咨询到法律顾问，从团队培训到项目合作，律植为你提供全方位企业法律解决方案")}</p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/enterprise/contact" className="btn-slide primary">
                <Handshake className="w-5 h-5" />
                联系我们
              </Link>
              <Link href="/enterprise/services" className="btn-slide outline">
                <ArrowRight className="w-5 h-5" />
                了解服务详情
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 服务项目 ── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="section-header mb-12">
            <div className="section-label">Services</div>
            <h2 className="section-title text-[#D4A574]">我们的服务</h2>
            <p className="section-subtitle">
              {preferTradForKeShiLu("专业、高效、可靠，满足企业多样化法律需求")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((service, idx) => (
              <div
                key={service.title}
                className="card group p-6"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-[rgba(212,165,116,0.15)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <service.icon className="w-7 h-7 text-[#D4A574]" />
                </div>
                <h3 className="font-semibold text-[#2C2416] mb-2">{service.title}</h3>
                <p className="text-sm text-[#5D4E3A] mb-4">{service.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {service.features.map(f => (
                    <span key={f} className="tag text-xs">{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 成功案例 ── */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="section-header mb-12">
            <div className="section-label">Case Studies</div>
            <h2 className="section-title text-[#D4A574]">成功案例</h2>
            <p className="section-subtitle">
              {preferTradForKeShiLu("已为多家企业提供专业法律服务，获得广泛认可")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {CASE_STUDIES.map((case_, idx) => (
              <div
                key={case_.company}
                className="card group p-6"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[rgba(212,165,116,0.15)] flex items-center justify-center">
                    <case_.icon className="w-5 h-5 text-[#D4A574]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2C2416]">{case_.company}</h3>
                    <p className="text-xs text-[#9A8B78]">{case_.industry}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-[#5D4E3A]">需求：</span>
                    <span className="text-[#2C2416]">{case_.issue}</span>
                  </div>
                  <div>
                    <span className="text-[#5D4E3A]">成果：</span>
                    <span className="text-[#2C2416]">{case_.result}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-[#D4A574] mb-4">
            让专业法律服务助力企业发展
          </h2>
          <p className="text-lg text-[#5D4E3A] mb-8">
            联系我们的企业服务团队，获取定制化解决方案
          </p>
          <Link href="/enterprise/contact" className="btn-slide primary">
            <Handshake className="w-5 h-5" />
            立即咨询
          </Link>
        </div>
      </section>
    </div>
  )
}
