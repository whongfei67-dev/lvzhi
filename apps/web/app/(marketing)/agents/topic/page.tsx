'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api/client'
import { Search, ArrowRight, MessageSquare, HelpCircle, ChevronRight } from 'lucide-react'

export default function AgentsTopicPage() {
  const CATEGORY_LABELS: Record<string, string> = {
    contract: "合同审查",
    litigation: "诉讼仲裁",
    consultation: "法律咨询",
    compliance: "合规风控",
    family: "婚姻家事",
    labor: "劳动仲裁",
    criminal: "刑事辩护",
    ip: "知识产权",
    tax: "税务筹划",
    other: "其他",
  };
  const [topic, setTopic] = useState('')
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

  const TOPICS = [
    { name: '合同审查', icon: '📝', count: 128 },
    { name: '诉讼仲裁', icon: '⚖️', count: 95 },
    { name: '法律咨询', icon: '💬', count: 87 },
    { name: '合规风控', icon: '🛡️', count: 64 },
    { name: '婚姻家事', icon: '💑', count: 52 },
    { name: '劳动仲裁', icon: '👷', count: 48 },
    { name: '刑事辩护', icon: '🔍', count: 41 },
    { name: '知识产权', icon: '💡', count: 35 },
  ]

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
            alt="智能体专题"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <MessageSquare className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">专题智能体</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("按专题浏览")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("选择你感兴趣的法律场景，发现对应的智能体解决方案")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TOPICS.map((t, idx) => (
              <button
                key={t.name}
                onClick={() => setTopic(t.name)}
                className={`card group p-6 text-center transition-all ${topic === t.name ? 'border-[rgba(212,165,116,0.4)] ring-2 ring-[rgba(212,165,116,0.2)]' : ''}`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="text-5xl mb-3">{t.icon}</div>
                <h3 className="font-semibold text-[#2C2416] mb-1">{t.name}</h3>
                <p className="text-sm text-[#9A8B78]">{t.count} 个智能体</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {topic && (
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-semibold text-[#D4A574]">{topic}相关智能体</h2>
                <p className="text-[#5D4E3A] mt-1">精选的{topic}场景智能体</p>
              </div>
              <button
                onClick={() => setTopic('')}
                className="text-sm text-[#D4A574] hover:text-[#2C2416]"
              >
                清除筛选
              </button>
            </div>

            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-64 rounded-2xl bg-[rgba(212,165,116,0.1)] animate-pulse" />
                ))}
              </div>
            ) : agents.filter((a: any) => a.category === Object.keys(CATEGORY_LABELS).find((k) => CATEGORY_LABELS[k] === topic)).length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {agents
                  .filter((a: any) => a.category === Object.keys(CATEGORY_LABELS).find((k) => CATEGORY_LABELS[k] === topic))
                  .map((agent: any) => (
                    <Link key={agent.id} href={`/agents/${agent.id}`} className="card group overflow-hidden">
                      <div className="relative h-40 overflow-hidden">
                        <img
                          src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&q=80"
                          alt={agent.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-5">
                        <h3 className="font-semibold text-[#2C2416] mb-2">{agent.name}</h3>
                        <p className="text-sm text-[#5D4E3A] line-clamp-2">{agent.description}</p>
                      </div>
                    </Link>
                  ))}
              </div>
            ) : (
              <div className="card p-12 text-center">
                <HelpCircle className="mx-auto h-12 w-12 text-[#9A8B78]" />
                <h3 className="mt-4 text-lg font-semibold text-[#2C2416]">暂无相关智能体</h3>
                <p className="mt-2 text-sm text-[#5D4E3A]">该专题下暂无智能体</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
