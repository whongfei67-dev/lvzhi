'use client'

import { preferTradForKeShiLu } from "@/lib/keshilu-text";
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api/client'
import { ArrowRight, Star, Flame, TrendingUp } from 'lucide-react'

export default function AgentsFeaturedPage() {
  const [featured, setFeatured] = useState<any[]>([])
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
        setFeatured(result.items.sort((a: any, b: any) => b.favorite_count - a.favorite_count).slice(0, 12))
      } catch (err) {
        console.error('获取精选智能体失败:', err)
        setFeatured([])
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
            alt="精选智能体"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="marketing-hero-photo-overlay" />
        </div>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 w-full">
          <div className="page-header-content animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(212,165,116,0.25)]">
              <Flame className="w-4 h-4 text-[#B8860B]" />
              <span className="text-sm font-medium text-[#D4A574]">精选推荐</span>
            </div>
            <h1 className="page-title">{preferTradForKeShiLu("热门智能体")}</h1>
            <p className="page-desc">{preferTradForKeShiLu("最受欢迎、使用频率最高的智能体，助你高效完成法律工作")}</p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="section-header mb-12">
            <div className="section-label">Featured</div>
            <h2 className="section-title text-[#D4A574]">精选智能体榜单</h2>
            <p className="section-subtitle">
              {preferTradForKeShiLu("根据使用量、收藏数和用户评价综合排序")}
            </p>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-72 rounded-2xl bg-[rgba(212,165,116,0.1)] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((agent, idx) => (
                <Link
                  key={agent.id}
                  href={`/agents/${agent.id}`}
                  className="card group overflow-hidden"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&q=80"
                      alt={agent.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {idx < 3 && (
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D4A574] text-white">
                          TOP {idx + 1}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-[#2C2416] mb-2">{agent.name}</h3>
                    <p className="text-sm text-[#5D4E3A] line-clamp-2 mb-3">{agent.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="tag">{agent.category}</span>
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-[#D4A574]" />
                        <span className="text-sm text-[#D4A574]">{agent.favorite_count} 收藏</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
