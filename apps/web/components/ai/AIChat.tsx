"use client"

import React, { useState, useRef, useEffect } from 'react'
import { api, ApiError, storage } from '@/lib/api/client'
import type { ChatMessage } from '@/lib/api/types'
import { Send, Loader2, AlertCircle } from 'lucide-react'

interface AIChatProps {
  agentId: string
  agentName: string
  isAuthenticated: boolean
  onRequireLogin?: () => void
}

export function AIChat({ agentId, agentName, isAuthenticated, onRequireLogin }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // 添加欢迎消息
    setMessages([
      {
        role: 'assistant',
        content: `您好！我是 ${agentName}，您的专业法律助手。\n\n请描述您遇到的法律问题，我会尽力为您提供参考意见。\n\n⚠️ 提示：本回答仅供参考，不构成法律意见。如需处理重大法律事务，建议咨询专业律师。`,
      },
    ])
  }, [agentName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    if (!isAuthenticated) {
      onRequireLogin?.()
      return
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError(null)

    const allMessages = [...messages, userMessage]

    try {
      const response = await api.ai.chat({
        agent_id: agentId,
        messages: allMessages,
      })

      if (response.message) {
        setMessages(prev => [...prev, response.message])
      }

      if (response.balance_after !== undefined) {
        setBalance(response.balance_after)
      }
    } catch (err) {
      let errorMessage = '发送消息失败'
      if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          errorMessage = '请先登录'
          onRequireLogin?.()
        } else if (err.statusCode === 400 && err.message.includes('balance')) {
          errorMessage = '余额不足，请先充值'
        } else {
          errorMessage = err.message
        }
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[600px] rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
        <div>
          <h3 className="font-semibold text-slate-950">{agentName}</h3>
          <p className="text-xs text-slate-500">法律智能助手</p>
        </div>
        {balance !== null && (
          <div className="text-sm text-slate-600">
            余额：<span className="font-medium text-blue-600">{balance}</span> 积分
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              正在思考...
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isAuthenticated ? '输入您的法律问题...' : '请先登录后提问'}
            disabled={loading || !isAuthenticated}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || !isAuthenticated}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        {!isAuthenticated && (
          <p className="mt-2 text-xs text-slate-400">
            登录后即可与智能体对话
          </p>
        )}
      </form>
    </div>
  )
}

// ============================================
// 流式 AI Chat 组件
// ============================================

interface AIChatStreamProps {
  agentId: string
  agentName: string
  isAuthenticated: boolean
  onRequireLogin?: () => void
}

export function AIChatStream({ agentId, agentName, isAuthenticated, onRequireLogin }: AIChatStreamProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentResponse, setCurrentResponse] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentResponse])

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: `您好！我是 ${agentName}，您的专业法律助手。\n\n请描述您遇到的法律问题，我会尽力为您提供参考意见。`,
      },
    ])
  }, [agentName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    if (!isAuthenticated) {
      onRequireLogin?.()
      return
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError(null)
    setCurrentResponse('')

    try {
      const response = await api.ai.chatStream({
        agent_id: agentId,
        messages: [...messages, userMessage],
      })

      if (!response.ok) {
        const data = await response.json()
        throw new ApiError(data.message || '请求失败', data.code || response.status, response.status)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('无法读取响应')

      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                fullContent += parsed.content
                setCurrentResponse(fullContent)
              }
              if (parsed.error) {
                throw new Error(parsed.error)
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: fullContent }])
      setCurrentResponse('')
    } catch (err) {
      let errorMessage = '发送消息失败'
      if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          errorMessage = '请先登录'
          onRequireLogin?.()
        } else {
          errorMessage = err.message
        }
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col h-[600px] rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center border-b border-slate-100 bg-slate-50 px-6 py-4">
        <h3 className="font-semibold text-slate-950">{agentName}</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
            </div>
          </div>
        ))}

        {loading && currentResponse && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl bg-slate-100 px-4 py-3">
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800">
                {currentResponse}
                <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse" />
              </pre>
            </div>
          </div>
        )}

        {loading && !currentResponse && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              正在思考...
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isAuthenticated ? '输入您的法律问题...' : '请先登录后提问'}
            disabled={loading || !isAuthenticated}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || !isAuthenticated}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
