"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api/client";
import { Bot } from "lucide-react";

export default function AiSessionsPage() {
  const [stats, setStats] = useState<{ total_calls: number; today_calls: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const s = await api.ai.stats();
        if (!cancelled) setStats({ total_calls: s.total_calls, today_calls: s.today_calls });
      } catch (e) {
        if (e instanceof ApiError && (e.statusCode === 401 || e.statusCode === 403)) {
          window.location.href = "/login";
          return;
        }
        if (!cancelled) setError("暂时无法加载 AI 使用概况");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[rgba(212,165,116,0.08)] text-[#2C2416]">
      <main className="mx-auto max-w-3xl px-6 py-10 lg:px-8 space-y-6">
        <Link href="/user" className="text-sm text-[#9A8B78] hover:text-[#D4A574]">
          ← 返回个人中心
        </Link>
        <div className="rounded-3xl border border-[rgba(212,165,116,0.25)] bg-white p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(212,165,116,0.12)]">
              <Bot className="h-5 w-5 text-[#D4A574]" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI 对话历史</h1>
              <p className="text-sm text-[#9A8B78]">内测 · 会话级时间轴即将接入</p>
            </div>
          </div>
          {loading && <p className="text-sm text-[#9A8B78]">加载中…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && stats && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[rgba(212,165,116,0.2)] p-4">
                <div className="text-xs text-[#9A8B78]">累计对话</div>
                <div className="mt-1 text-2xl font-semibold">{stats.total_calls}</div>
              </div>
              <div className="rounded-2xl border border-[rgba(212,165,116,0.2)] p-4">
                <div className="text-xs text-[#9A8B78]">今日对话</div>
                <div className="mt-1 text-2xl font-semibold">{stats.today_calls}</div>
              </div>
            </div>
          )}
          <p className="text-sm leading-relaxed text-[#5D4E3A]">
            完整「按智能体 / 按时间」浏览与导出将在内测后期开放。当前请从
            <Link href="/inspiration/agents" className="mx-1 text-[#D4A574] hover:underline">
              灵感广场
            </Link>
            继续体验对话能力。
          </p>
        </div>
      </main>
    </div>
  );
}
