"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, storage, ApiError } from '@/lib/api/client'
import type { User as UserType, AIStats, Balance } from '@/lib/api/types'
import { LogOut, User, Bot, MessageSquare, Wallet, Settings } from 'lucide-react'

export default function UserDashboardPage() {
  const [user, setUser] = useState<UserType | null>(null)
  const [balance, setBalance] = useState<Balance | null>(null)
  const [aiStats, setAiStats] = useState<AIStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // 获取用户信息（httpOnly Cookie 无法被 JS 读取，直接请求即可）
        const userData = await api.auth.me()
        setUser(userData)

        // 获取余额
        try {
          const balanceData = await api.balance.get()
          setBalance(balanceData)
        } catch {
          // 用户可能没有余额记录
        }

        // 获取 AI 使用统计
        try {
          const statsData = await api.ai.stats()
          setAiStats(statsData)
        } catch {
          // 用户可能没有 AI 使用记录
        }
      } catch (err: unknown) {
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

  const roleLabels: Record<string, string> = {
    seeker: '人才（合作机会）',
    creator: '创作者',
    recruiter: '企业客户（合作机会）',
    client: '法律需求方',
    admin: '管理员',
  }

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)] text-[#2C2416]">
      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {/* Header */}
        <section className="rounded-[32px] border border-[rgba(212,165,116,0.25)] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#D4A574] to-[#B8860B]">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#B8860B]">{roleLabels[user.role] || user.role}</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#2C2416]">
                  你好，{user.display_name || user.email}
                </h1>
                {user.verified && (
                  <span className="mt-1 inline-flex items-center rounded-full bg-[rgba(212,165,116,0.08)] px-2 py-0.5 text-xs font-medium text-[#D4A574]">
                    已认证
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/profile"
                className="rounded-2xl border border-[rgba(212,165,116,0.25)] bg-white px-4 py-2.5 text-sm font-semibold text-[#D4A574] hover:bg-[rgba(212,165,116,0.08)] transition-colors"
              >
                <Settings className="inline-block h-4 w-4 mr-2" />
                设置
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
              >
                <LogOut className="inline-block h-4 w-4 mr-2" />
                退出
              </button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* 余额 */}
          <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(212,165,116,0.08)]">
                <Wallet className="h-5 w-5 text-[#D4A574]" />
              </div>
              <div>
                <div className="text-sm text-[#9A8B78]">账户余额</div>
                <div className="mt-1 text-2xl font-bold text-[#2C2416]">
                  {balance?.balance ?? 0} <span className="text-sm font-normal text-[#9A8B78]">积分</span>
                </div>
              </div>
            </div>
            <Link
              href="/dashboard/recharge"
              className="mt-4 block w-full rounded-xl bg-gradient-to-r from-[#D4A574] to-[#B8860B] py-2.5 text-center text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              立即充值
            </Link>
          </div>

          {/* AI 使用统计 */}
          <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(212,165,116,0.08)]">
                <Bot className="h-5 w-5 text-[#D4A574]" />
              </div>
              <div>
                <div className="text-sm text-[#9A8B78]">AI 对话次数</div>
                <div className="mt-1 text-2xl font-bold text-[#2C2416]">
                  {aiStats?.total_calls ?? 0} <span className="text-sm font-normal text-[#9A8B78]">次</span>
                </div>
              </div>
            </div>
            <Link
              href="/inspiration/agents"
              className="mt-4 block w-full rounded-xl border border-[rgba(212,165,116,0.25)] py-2.5 text-center text-sm font-semibold text-[#D4A574] hover:bg-[rgba(212,165,116,0.08)] transition-colors"
            >
              探索智能体
            </Link>
          </div>

          {/* 今日使用 */}
          <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(212,165,116,0.08)]">
                <MessageSquare className="h-5 w-5 text-[#D4A574]" />
              </div>
              <div>
                <div className="text-sm text-[#9A8B78]">今日对话</div>
                <div className="mt-1 text-2xl font-bold text-[#2C2416]">
                  {aiStats?.today_calls ?? 0} <span className="text-sm font-normal text-[#9A8B78]">次</span>
                </div>
              </div>
            </div>
            <Link
              href="/user/ai-sessions"
              className="mt-4 block w-full rounded-xl border border-[rgba(212,165,116,0.25)] py-2.5 text-center text-sm font-semibold text-[#D4A574] hover:bg-[rgba(212,165,116,0.08)] transition-colors"
            >
              查看历史
            </Link>
          </div>

          {/* 本月消费 */}
          <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <Wallet className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-[#9A8B78]">本月消费</div>
                <div className="mt-1 text-2xl font-bold text-[#2C2416]">
                  {aiStats?.monthly_consume ?? 0} <span className="text-sm font-normal text-[#9A8B78]">积分</span>
                </div>
              </div>
            </div>
            <Link
              href="/user/balance-transactions"
              className="mt-4 block w-full rounded-xl border border-[rgba(212,165,116,0.25)] py-2.5 text-center text-sm font-semibold text-[#D4A574] hover:bg-[rgba(212,165,116,0.08)] transition-colors"
            >
              查看明细
            </Link>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mt-6 rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#2C2416] mb-4">快捷操作</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/inspiration/agents"
              className="flex items-center gap-3 rounded-xl border border-[rgba(212,165,116,0.25)] p-4 hover:bg-[rgba(212,165,116,0.08)] transition-colors"
            >
              <Bot className="h-6 w-6 text-[#D4A574]" />
              <div>
                <div className="font-medium text-[#2C2416]">探索智能体</div>
                <div className="text-xs text-[#9A8B78]">发现法律 AI 助手</div>
              </div>
            </Link>
            <Link
              href="/community"
              className="flex items-center gap-3 rounded-xl border border-[rgba(212,165,116,0.25)] p-4 hover:bg-[rgba(212,165,116,0.08)] transition-colors"
            >
              <MessageSquare className="h-6 w-6 text-[#D4A574]" />
              <div>
                <div className="font-medium text-[#2C2416]">社区讨论</div>
                <div className="text-xs text-[#9A8B78]">参与话题交流</div>
              </div>
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-xl border border-[rgba(212,165,116,0.25)] p-4 hover:bg-[rgba(212,165,116,0.08)] transition-colors"
            >
              <User className="h-6 w-6 text-[#D4A574]" />
              <div>
                <div className="font-medium text-[#2C2416]">个人资料</div>
                <div className="text-xs text-[#9A8B78]">完善个人信息</div>
              </div>
            </Link>
            <Link
              href="/dashboard/recharge"
              className="flex items-center gap-3 rounded-xl border border-[rgba(212,165,116,0.25)] p-4 hover:bg-[rgba(212,165,116,0.08)] transition-colors"
            >
              <Wallet className="h-6 w-6 text-amber-600" />
              <div>
                <div className="font-medium text-[#2C2416]">充值积分</div>
                <div className="text-xs text-[#9A8B78]">获取更多使用次数</div>
              </div>
            </Link>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="mt-6 rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#2C2416] mb-4">最近使用</h2>
          {aiStats?.top_agents && aiStats.top_agents.length > 0 ? (
            <div className="space-y-3">
              {aiStats.top_agents.map((agent) => (
                <Link
                  key={agent.id}
                  href={`/inspiration/${agent.id}/agent`}
                  className="flex items-center justify-between rounded-xl border border-[rgba(212,165,116,0.2)] p-4 hover:bg-[rgba(212,165,116,0.08)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5 text-[#9A8B78]" />
                    <div>
                      <div className="font-medium text-[#2C2416]">{agent.name}</div>
                      <div className="text-xs text-[#9A8B78]">最近使用</div>
                    </div>
                  </div>
                  <div className="text-sm text-[#9A8B78]">
                    {agent.call_count} 次
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Bot className="mx-auto h-12 w-12 text-[#9A8B78]" />
              <p className="mt-4 text-[#9A8B78]">还没有使用记录</p>
              <Link
                href="/inspiration/agents"
                className="mt-4 inline-block text-[#D4A574] hover:underline"
              >
                去探索智能体
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
