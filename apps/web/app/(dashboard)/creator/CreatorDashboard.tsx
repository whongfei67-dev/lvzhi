"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, storage, ApiError } from '@/lib/api/client'
import type { User, Agent, Balance } from '@/lib/api/types'
import { Plus, Bot, Eye, Star, Heart, TrendingUp, DollarSign, MessageSquare } from 'lucide-react'

interface CreatorDashboardProps {}

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

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  pending: '审核中',
  pending_review: '审核中',
  approved: '审核通过已上架',
  active: '审核通过已上架',
  published: '审核通过已上架',
  rejected: '已拒绝',
  hidden: '已下架',
  offline: '已下架',
}

function modeClass(mode: string) {
  if (mode === '免费版') return 'bg-[rgba(212,165,116,0.08)] text-[#D4A574]'
  if (mode === '商用版') return 'bg-[rgba(212,165,116,0.08)] text-[#B8860B]'
  return 'bg-amber-50 text-amber-700'
}

function statusClass(status: string) {
  if (['approved', 'active', 'published'].includes(status)) return 'bg-[rgba(212,165,116,0.08)] text-[#D4A574]'
  if (['pending', 'pending_review'].includes(status)) return 'bg-amber-50 text-amber-700'
  return 'bg-[rgba(212,165,116,0.15)] text-[#5D4E3A]'
}

function agentModeLabel(agent: Agent): string {
  if (agent.price === 0) return '免费版'
  if (agent.is_free_trial) return '免费试用'
  return '商用版'
}

export function CreatorDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [balance, setBalance] = useState<{ balance: number; frozen: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // 获取用户信息（Cookie 会话）
        const userData = await api.auth.me()
        setUser(userData)

        // 获取我的智能体列表
        const agentsResult = await api.agents.myAgents({ page: 1, limit: 20 })
        setAgents((agentsResult.items as unknown as Agent[]) ?? [])

        // 获取余额
        try {
          const balanceData = await api.balance.get()
          setBalance({
            balance: balanceData.balance,
            frozen: balanceData.frozen_balance ?? 0,
          })
        } catch {
          // 可能没有余额
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
        if (err instanceof ApiError && (err.statusCode === 401 || err.statusCode === 403)) {
          window.location.href = '/login'
          return
        }
        setError('获取数据失败')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleLogout = async () => {
    try {
      await api.auth.logout()
    } finally {
      storage.clear()
      window.location.href = '/'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgba(212,165,116,0.08)] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto border-4 border-[#B8860B] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[#9A8B78]">加载中...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-[rgba(212,165,116,0.08)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error || '请先登录'}</p>
          <Link href="/login" className="mt-4 inline-block text-[#D4A574] hover:underline">
            去登录
          </Link>
        </div>
      </div>
    )
  }

  const activeAgents = agents.filter(a => ['approved', 'active', 'published'].includes(a.status))
  const pendingAgents = agents.filter(a => ['pending', 'pending_review'].includes(a.status))
  const totalViews = agents.reduce((sum, a) => sum + a.view_count, 0)
  const totalTrials = agents.reduce((sum, a) => sum + (a.trial_count ?? 0), 0)
  const totalFavorites = agents.reduce((sum, a) => sum + a.favorite_count, 0)

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)] text-[#2C2416]">
      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {/* Header */}
        <section className="rounded-[32px] border border-[rgba(212,165,116,0.25)] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#B8860B]">创作者工作台</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#2C2416]">
                你好，{user.display_name || user.email}
              </h1>
              <p className="mt-3 max-w-2xl text-[#5D4E3A]">
                管理你的法律智能体，跟踪用户使用数据，优化智能体表现。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/creator/agents/new"
                className="rounded-2xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Plus className="inline-block h-4 w-4 mr-2" />
                创建智能体
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
              >
                退出
              </button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(212,165,116,0.08)]">
                <Bot className="h-5 w-5 text-[#D4A574]" />
              </div>
              <div>
                <div className="text-sm text-[#9A8B78]">我的智能体</div>
                <div className="mt-1 text-2xl font-bold text-[#2C2416]">{agents.length}</div>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(212,165,116,0.08)]">
                <TrendingUp className="h-5 w-5 text-[#D4A574]" />
              </div>
              <div>
                <div className="text-sm text-[#9A8B78]">审核通过已上架</div>
                <div className="mt-1 text-2xl font-bold text-[#2C2416]">{activeAgents.length}</div>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <Eye className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-[#9A8B78]">总浏览量</div>
                <div className="mt-1 text-2xl font-bold text-[#2C2416]">{totalViews}</div>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(212,165,116,0.08)]">
                <MessageSquare className="h-5 w-5 text-[#D4A574]" />
              </div>
              <div>
                <div className="text-sm text-[#9A8B78]">总试用量</div>
                <div className="mt-1 text-2xl font-bold text-[#2C2416]">{totalTrials}</div>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                <Heart className="h-5 w-5 text-[#C45555]" />
              </div>
              <div>
                <div className="text-sm text-[#9A8B78]">总收藏</div>
                <div className="mt-1 text-2xl font-bold text-[#2C2416]">{totalFavorites}</div>
              </div>
            </div>
          </div>
        </section>

        {/* My Agents */}
        <section className="mt-6 rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#2C2416]">我的智能体</h2>
            <Link href="/creator/agents/new" className="text-sm font-medium text-[#B8860B]">
              创建新智能体
            </Link>
          </div>

          {agents.length === 0 ? (
            <div className="py-12 text-center">
              <Bot className="mx-auto h-12 w-12 text-[#9A8B78]" />
              <p className="mt-4 text-[#9A8B78]">还没有创建智能体</p>
              <Link
                href="/creator/agents/new"
                className="mt-4 inline-flex items-center gap-2 text-[#D4A574] hover:underline"
              >
                <Plus className="h-4 w-4" />
                创建第一个智能体
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(212,165,116,0.2)] text-left">
                    <th className="pb-3 text-sm font-medium text-[#9A8B78]">智能体</th>
                    <th className="pb-3 text-sm font-medium text-[#9A8B78]">分类</th>
                    <th className="pb-3 text-sm font-medium text-[#9A8B78]">模式</th>
                    <th className="pb-3 text-sm font-medium text-[#9A8B78]">状态</th>
                    <th className="pb-3 text-sm font-medium text-[#9A8B78]">浏览</th>
                    <th className="pb-3 text-sm font-medium text-[#9A8B78]">试用</th>
                    <th className="pb-3 text-sm font-medium text-[#9A8B78]">收藏</th>
                    <th className="pb-3 text-sm font-medium text-[#9A8B78]">评分</th>
                    <th className="pb-3 text-sm font-medium text-[#9A8B78]">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-[rgba(212,165,116,0.08)]">
                      <td className="py-4">
                        <Link href={`/agents/${agent.id}`} className="font-medium text-[#2C2416] hover:text-[#D4A574]">
                          {agent.name}
                        </Link>
                        <div className="text-xs text-[#9A8B78]">{agent.price === 0 ? '免费' : `¥${agent.price}/次`}</div>
                      </td>
                      <td className="py-4 text-sm text-[#5D4E3A]">
                        {CATEGORY_LABELS[agent.category] || agent.category}
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${modeClass(agentModeLabel(agent))}`}>
                          {agentModeLabel(agent)}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClass(agent.status)}`}>
                          {STATUS_LABELS[agent.status] || agent.status}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-[#5D4E3A]">{agent.view_count}</td>
                      <td className="py-4 text-sm text-[#5D4E3A]">{agent.trial_count}</td>
                      <td className="py-4 text-sm text-[#5D4E3A]">{agent.favorite_count}</td>
                      <td className="py-4 text-sm text-[#5D4E3A]">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-500" />
                          {agent.rating > 0 ? agent.rating.toFixed(1) : '-'}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/creator/agents/${agent.id}/edit`}
                            className="text-sm text-[#D4A574] hover:underline"
                          >
                            编辑
                          </Link>
                          <Link
                            href={`/agents/${agent.id}`}
                            className="text-sm text-[#5D4E3A] hover:text-[#2C2416]"
                          >
                            预览
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Pending Review */}
        {pendingAgents.length > 0 && (
          <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="font-medium text-amber-800">审核中的智能体</div>
                <div className="text-sm text-amber-600">
                  {pendingAgents.length} 个智能体正在等待审核，审核通过后会进入灵感广场展示
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
