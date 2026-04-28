"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api/client'
import type { AgentListItem } from '@/lib/api/types'
import { HeroSection } from '@/components/agent/hero-section'
import { CategoryExploreSection } from '@/components/agent/category-explore-section'
import { CreatorProgramSection } from '@/components/creator/creator-program-section'
import { HotAgentsSection, type HotAgentItem } from '@/components/ranking/hot-agents-section'
import { CommunityStatsSection } from '@/components/community/community-stats-section'
import { BusinessCooperation } from '@/components/common/business-cooperation'

interface HomeClientProps {
  initialAgents?: AgentListItem[]
  initialStats?: {
    agents: number
    creators: number
    users: number
    verifiedLawyers: number
  }
}

export function HomeClient({ initialAgents = [], initialStats }: HomeClientProps) {
  const [agents, setAgents] = useState<AgentListItem[]>(initialAgents)
  const [stats, setStats] = useState(initialStats)
  const [loading, setLoading] = useState(!initialAgents.length)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // 获取智能体列表
        const agentsResult = await api.agents.list({
          page: 1,
          pageSize: 20,
        })
        setAgents((agentsResult.items as unknown as AgentListItem[]) ?? [])

        // 获取统计数据
        await api.health.check()
        setStats({
          agents: agentsResult.total || agentsResult.items.length,
          creators: 0, // 待后端实现
          users: 0,    // 待后端实现
          verifiedLawyers: 0,
        })
      } catch (error) {
        console.error('Failed to fetch homepage data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!initialAgents.length) {
      fetchData()
    }
  }, [])

  const hotAgents: HotAgentItem[] = agents.slice(0, 10).map((a, i) => ({
    id: a.id,
    name: a.name,
    category: a.category,
    creator: a.creator_name || '未知创作者',
    mode: a.price === 0 ? '免费版' : a.is_free_trial ? '免费试用' : '商用版',
    price: a.price,
    downloadCount: Math.max(10, 380 - i * 30),
    href: `/agents/${a.id}`,
  }))

  return (
    <>
      <HeroSection
        stats={[
          { value: `${stats?.agents || 0}+`, label: '法律智能体' },
          { value: `${stats?.verifiedLawyers || 0}+`, label: '执业律师' },
          { value: `${stats?.creators || 0}+`, label: '认证创作者' },
          { value: `${stats?.users || 0}+`, label: '注册用户' },
        ]}
      />

      <CommunityStatsSection
        agentCount={stats?.agents || 0}
        lawyerCount={stats?.creators || 0}
        verifiedLawyerCount={stats?.verifiedLawyers || 0}
        userCount={stats?.users || 0}
        demoCount={50000}
      />

      <CategoryExploreSection />

      <HotAgentsSection agents={hotAgents} />

      <CreatorProgramSection />

      <BusinessCooperation />
    </>
  )
}

// ─── Hot Agent Card (for compact display) ────────────────────────────────────

interface HotAgentCardProps {
  agent: HotAgentItem
  rank: number
}

export function HotAgentCard({ agent, rank }: HotAgentCardProps) {
  const rankColors = [
    'bg-amber-100 text-amber-700',
    'bg-slate-200 text-slate-600',
    'bg-orange-100 text-orange-600',
    'bg-slate-100 text-slate-500',
  ]

  return (
    <Link
      href={agent.href}
      className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50"
    >
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${rankColors[rank] || 'bg-slate-100 text-slate-500'}`}>
        {rank + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{agent.name}</p>
        <p className="text-xs text-slate-400">{agent.category}</p>
      </div>
      <span className="shrink-0 text-xs font-medium text-slate-500">
        {agent.price === 0 ? '免费' : `¥${agent.price}`}
      </span>
    </Link>
  )
}
