"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, Agent } from "@/lib/api/client";
import { GuestGate } from "@/components/common/guest-gate";
import { Bot, Star, User, MessageSquare, ArrowRight, Heart, Share2, Settings } from "lucide-react";

function segmentSlug(raw: string | string[] | undefined): string {
  if (raw == null) return "";
  return Array.isArray(raw) ? (raw[0] ?? "") : raw;
}

function creatorNameFromAgent(agent: Agent): string {
  const row = agent as unknown as Record<string, unknown>;
  const name = row.creator_name;
  return typeof name === "string" && name.trim().length > 0 ? name : "认证创作者";
}

export default function AgentDetailPage() {
  const routeParams = useParams<{ slug?: string | string[] }>();
  const slug = segmentSlug(routeParams?.slug);

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setAgent(null);
      setError(null);
      return;
    }
    fetchAgent();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- slug 变化时重新拉取即可
  }, [slug]);

  const fetchAgent = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.agents.get(slug);
      setAgent(result as unknown as Agent);
    } catch (err) {
      console.error("获取智能体详情失败:", err);
      setError("获取数据失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 rounded bg-[rgba(212,165,116,0.15)]" />
            <div className="h-12 w-3/4 rounded bg-[rgba(212,165,116,0.15)]" />
            <div className="h-64 rounded bg-[rgba(212,165,116,0.15)]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-[rgba(212,165,116,0.08)] flex items-center justify-center">
        <div className="text-center">
          <Bot className="mx-auto h-12 w-12 text-[#9A8B78]" />
          <h2 className="mt-4 text-lg font-semibold text-[#2C2416]">加载失败</h2>
          <p className="mt-2 text-sm text-[#5D4E3A]">{error || "未找到该智能体"}</p>
          <Link href="/inspiration/agents" className="mt-4 inline-block text-sm text-[#D4A574]">
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)]">
      {/* 面包屑 */}
      <section className="inspiration-band-soft">
        <div className="mx-auto max-w-6xl px-6 py-4 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-[#5D4E3A]">
            <Link href="/inspiration" className="hover:text-[#D4A574]">灵感广场</Link>
            <span>/</span>
            <Link href="/inspiration/agents" className="hover:text-[#D4A574]">智能体</Link>
            <span>/</span>
            <span className="text-[#2C2416]">{agent.name}</span>
          </div>
        </div>
      </section>

      {/* 主内容 */}
      <section className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* 左侧对话区 */}
          <div className="space-y-6">
            {/* 智能体介绍卡片 */}
            <div className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4A574] to-[#B8860B]">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold text-[#2C2416]">{agent.name}</h1>
                    {agent.rating && (
                      <span className="flex items-center gap-1 text-sm font-medium text-[#D4A574]">
                        <Star className="h-4 w-4 fill-current" />
                        {agent.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-[#5D4E3A]">{agent.description || "专业的法律 AI 助手"}</p>
                </div>
              </div>
            </div>

            {/* 对话区域 */}
            <div className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white">
              <div className="border-b border-[rgba(212,165,116,0.25)] p-4">
                <h2 className="font-semibold text-[#2C2416]">开始对话</h2>
              </div>

              {/* 消息列表 */}
              <div className="min-h-[400px] max-h-[500px] overflow-y-auto p-4 space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#D4A574] to-[#B8860B]">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 rounded-xl rounded-tl-none bg-[rgba(212,165,116,0.15)] p-4">
                    <p className="text-[#2C2416]">
                      你好！我是 {agent.name}，我可以帮助你处理各种法律相关问题。有什么我可以帮你的吗？
                    </p>
                  </div>
                </div>

                {conversationHistory.map((msg, i) => (
                  <div key={i} className="flex gap-3 justify-end">
                    <div className="flex-1 rounded-xl rounded-tr-none bg-[rgba(212,165,116,0.08)] p-4 text-right">
                      <p className="text-[#2C2416]">{msg}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 输入框 */}
              <div className="border-t border-[rgba(212,165,116,0.25)] p-4">
                <GuestGate action="开始对话" mode="hidden">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="输入你的问题..."
                      className="flex-1 rounded-xl border border-[rgba(212,165,116,0.25)] bg-[rgba(212,165,116,0.08)] px-4 py-3 text-[#2C2416] placeholder:text-[#9A8B78] focus:border-[#D4A574] focus:bg-white focus:outline-none"
                    />
                    <button className="rounded-xl bg-[#D4A574] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B8860B]">
                      发送
                    </button>
                  </div>
                </GuestGate>
              </div>
            </div>
          </div>

          {/* 右侧信息区 */}
          <div className="space-y-4">
            {/* 操作卡片 */}
            <div className="sticky top-24 rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-[#2C2416]">关于 {agent.name}</h3>

              {/* 统计 */}
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#D4A574]">{agent.usage_count || 0}</p>
                  <p className="text-xs text-[#5D4E3A]">对话次数</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#D4A574]">{agent.category || "通用"}</p>
                  <p className="text-xs text-[#5D4E3A]">服务类型</p>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="space-y-2">
                <button className="w-full rounded-xl bg-[#D4A574] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B8860B]">
                  开始使用
                </button>
                <div className="flex gap-2">
                  <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[rgba(212,165,116,0.25)] py-2.5 text-sm font-medium text-[#5D4E3A] transition-colors hover:border-[#D4A574] hover:text-[#D4A574]">
                    <Heart className="h-4 w-4" />
                    收藏
                  </button>
                  <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[rgba(212,165,116,0.25)] py-2.5 text-sm font-medium text-[#5D4E3A] transition-colors hover:border-[#D4A574] hover:text-[#D4A574]">
                    <Share2 className="h-4 w-4" />
                    分享
                  </button>
                </div>
              </div>
            </div>

            {/* 创作者信息 */}
            <div className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-[#2C2416]">创作者</h3>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(212,165,116,0.15)] text-sm font-bold text-[#D4A574]">
                  {creatorNameFromAgent(agent)[0] || "创"}
                </div>
                <div>
                  <p className="font-medium text-[#2C2416]">{creatorNameFromAgent(agent)}</p>
                  <p className="text-xs text-[#9A8B78]">创作于律植</p>
                </div>
              </div>
            </div>

            {/* 分类 */}
            {agent.category && (
              <div className="rounded-xl border border-[rgba(212,165,116,0.25)] bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-[#2C2416]">分类</h3>
                <Link
                  href={`/inspiration/agents/category/${agent.category}`}
                  className="inline-flex items-center gap-1 text-sm text-[#D4A574] transition-colors hover:underline"
                >
                  {agent.category} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="pb-16" />
    </div>
  );
}
