import * as React from "react";
import Link from "next/link";
import { AgentCard, type AgentCardProps } from "@/components/agent/agent-card";

type AgentItem = AgentCardProps & { id: string };

interface LatestAgentsSectionProps {
  agents: AgentItem[];
}

export function LatestAgentsSection({ agents }: LatestAgentsSectionProps) {
  const visible = agents.slice(0, 8);

  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">最新发布</p>
            <h2 className="mt-1 text-3xl font-bold text-slate-950">新上线智能体</h2>
            <p className="mt-2 text-slate-500">创作者最新发布，抢先体验最前沿的法律 AI</p>
          </div>
          <Link
            href="/agents"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            查看全部 →
          </Link>
        </div>

        {visible.length === 0 ? (
          <div className="flex items-center justify-center rounded-3xl border border-dashed border-slate-200 py-16 text-sm text-slate-400">
            暂无智能体数据
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((agent) => (
              <AgentCard key={agent.id} {...agent} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
