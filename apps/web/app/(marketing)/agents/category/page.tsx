'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api/client'
import { Search, ArrowRight, Tag, Star, Zap } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  contract: '合同审查',
  litigation: '诉讼仲裁',
  consultation: '法律咨询',
  compliance: '合规风控',
  family: '婚姻家事',
  labor: '劳动仲裁',
  criminal: '刑事辩护',
  ip: '知识产权',
  tax: '税务筹划',
  other: '其他',
}

export default function AgentsCategoryPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      try {
        const result = await api.agents.list({
          status: 'approved',
          page: 1,
          pageSize: 20,
        })
        setAgents(result.items)
      } catch (err) {
        console.error('获取智能体失败:', err)
        setAgents([])
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

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
            src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1920&q=80"
            alt="智能体分类"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <Tag className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">智能体分类</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("按分类浏览智能体")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("选择法律领域，发现对应的智能体")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="section-header mb-12">
            <h2 className="section-title text-[#D4A574]">全部分类</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(CATEGORY_LABELS).map(([key, label], idx) => (
              <Link
                key={key}
                href={`/agents?category=${key}`}
                className="card group p-6 text-center"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <h3 className="font-semibold text-[#2C2416] mb-1">{label}</h3>
                <ArrowRight className="w-5 h-5 text-[#9A8B78] mx-auto mt-3 group-hover:text-[#D4A574] group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
