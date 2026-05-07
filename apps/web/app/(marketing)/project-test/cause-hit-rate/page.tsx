"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { inspectCausePipeline } from "@/lib/recommendation/recommendation-engine";
import {
  AMBIGUOUS_SCOPE_CORPUS,
  CIVIL_SCOPE_CORPUS,
  CRIMINAL_SCOPE_CORPUS,
} from "@/lib/recommendation/config/cause-scope-corpus";

function buildDefaultSamples(): string[] {
  const criminal = Array.from({ length: 20 }).map((_, i) => String(CRIMINAL_SCOPE_CORPUS[(i * 3) % CRIMINAL_SCOPE_CORPUS.length]));
  const civil = Array.from({ length: 20 }).map((_, i) => String(CIVIL_SCOPE_CORPUS[(i * 2 + 1) % CIVIL_SCOPE_CORPUS.length]));
  const mixed = Array.from({ length: 10 }).map((_, i) => {
    const leftPool = i % 2 === 0 ? CRIMINAL_SCOPE_CORPUS : CIVIL_SCOPE_CORPUS;
    const left = String(leftPool[(i * 5 + 2) % leftPool.length]);
    const right = String(AMBIGUOUS_SCOPE_CORPUS[i % AMBIGUOUS_SCOPE_CORPUS.length]);
    return `${left}，${right}`;
  });
  return [...criminal, ...civil, ...mixed];
}

const DEFAULT_TEXT = buildDefaultSamples().join("\n");

type StressRow = {
  id: string;
  scope: "civil" | "criminal";
  pipelineScope: "civil" | "criminal" | "both";
  input: string;
  fixedQuestions: string[];
  randomReplies: string[];
  stageSnapshots: Array<{ stage: "a" | "b" | "c" | "d" | "e"; maxScore: number; remaining: number }>;
  routedUserType: string;
  routedDemandMode: string;
  routedLegalDomain: string | null;
  routedCity: string | null;
  routedBudgetLevel: "low" | "medium" | "high" | null;
  routedServicePreference?: "response_time" | "budget" | "online_consult" | null;
  routedBudgetPreference?: string | null;
  budgetRuleTarget?: string | null;
  budgetTop1Hit?: boolean;
  budgetTop5AnyHit?: boolean;
  budgetTop5HitRatio?: number;
  causeHit: boolean;
  selectedBy: "alias" | "stage" | "none";
  causeLabel: string | null;
  recallSkills: string[];
  recallPosts: string[];
  recallLawyers: string[];
  recallLawyersWithRate?: string[];
  lawyerBudgetMatchTrace?: string[];
};

type StressReport = {
  summary: {
    sampleSize: number;
    hitRate: number;
    aliasRate: number;
    stageRate: number;
    noHitRate: number;
    avgInjectedKeywords: number;
    budgetSampleSize?: number;
    budgetTop1HitRate?: number;
    budgetTop5AnyHitRate?: number;
    budgetTop5AvgHitRatio?: number;
    first50HitRate?: number;
    second50HitRate?: number;
  };
  rows: StressRow[];
};

export default function CauseHitRatePage() {
  const [inputText, setInputText] = useState(DEFAULT_TEXT);
  const [viewMode, setViewMode] = useState<"all" | "hit" | "miss">("all");
  const [stressData, setStressData] = useState<StressReport | null>(null);
  const [stressLoading, setStressLoading] = useState(false);
  const [stressError, setStressError] = useState("");
  const [stressHint, setStressHint] = useState("");
  const stressSectionRef = useRef<HTMLElement | null>(null);
  const loadStressReport = async (size: 10 | 100): Promise<void> => {
    setStressError("");
    setStressHint(`正在加载${size}条压测结果...`);
    setStressLoading(true);
    try {
      const res = await fetch(`/project-test/cause-hit-rate/stress?size=${size}`, { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as StressReport;
      setStressData(json);
      setStressHint(`加载成功：${json.summary.sampleSize}条压测结果已就绪`);
      requestAnimationFrame(() => {
        stressSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (error) {
      setStressError(error instanceof Error ? error.message : "加载失败");
      setStressHint("");
    } finally {
      setStressLoading(false);
    }
  };

  const rows = useMemo(() => {
    const lines = inputText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    return lines.map((line, idx) => {
      const trace = inspectCausePipeline(line);
      return {
        id: idx + 1,
        input: line,
        hit: Boolean(trace.selectedLabel),
        selectedBy: trace.selectedBy,
        scope: trace.scope,
        cause: trace.selectedLabel ?? "-",
      };
    });
  }, [inputText]);

  const summary = useMemo(() => {
    const total = rows.length;
    const hit = rows.filter((item) => item.hit).length;
    const miss = total - hit;
    const aliasHit = rows.filter((item) => item.selectedBy === "alias").length;
    const stageHit = rows.filter((item) => item.selectedBy === "stage").length;
    const hitRate = total ? ((hit / total) * 100).toFixed(2) : "0.00";
    const criminalScope = rows.filter((item) => item.scope === "criminal").length;
    const civilScope = rows.filter((item) => item.scope === "civil").length;
    const bothScope = rows.filter((item) => item.scope === "both").length;
    return { total, hit, miss, aliasHit, stageHit, hitRate, criminalScope, civilScope, bothScope };
  }, [rows]);

  const visibleRows = useMemo(() => {
    if (viewMode === "hit") return rows.filter((item) => item.hit);
    if (viewMode === "miss") return rows.filter((item) => !item.hit);
    return rows;
  }, [rows, viewMode]);

  const formatStageTrace = (snaps: StressRow["stageSnapshots"]): string => {
    const map = new Map(snaps.map((item) => [item.stage, item] as const));
    return (["e", "d", "c", "b", "a"] as const)
      .map((stage) => {
        const hit = map.get(stage);
        if (!hit) return `${stage.toUpperCase()}-`;
        return `${stage.toUpperCase()}${hit.maxScore > 0 ? "✓" : "✗"}(${hit.remaining})`;
      })
      .join(" → ");
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] px-4 py-10 text-[#2C2416]">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-[rgba(212,165,116,0.35)] bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#B8860B]">推荐系统案由命中测试</p>
          <h1 className="mt-2 text-2xl font-bold text-[#5C4033]">案由命中率测试页</h1>
          <p className="mt-2 text-sm text-[#5D4E3A]">每行一条输入，实时计算命中率、命中来源（alias/stage）和命中案由。</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/project-test"
              className="rounded-xl border border-[rgba(212,165,116,0.35)] bg-[#FFF8F0] px-3 py-1.5 text-sm text-[#5C4033] hover:border-[#D4A574]"
            >
              返回联调总页
            </Link>
            <button
              type="button"
              onClick={() => setInputText(DEFAULT_TEXT)}
              className="rounded-xl border border-[rgba(212,165,116,0.35)] bg-[#FFF8F0] px-3 py-1.5 text-sm text-[#5C4033] hover:border-[#D4A574]"
            >
              重置 50 条样本
            </button>
            <button
              type="button"
              onClick={() => void loadStressReport(10)}
              className="rounded-xl border border-[rgba(212,165,116,0.35)] bg-[#FFF8F0] px-3 py-1.5 text-sm text-[#5C4033] hover:border-[#D4A574]"
            >
              {stressLoading ? "加载中..." : "加载10条压测结果"}
            </button>
            <button
              type="button"
              onClick={() => void loadStressReport(100)}
              className="rounded-xl border border-[rgba(212,165,116,0.35)] bg-[#FFF8F0] px-3 py-1.5 text-sm text-[#5C4033] hover:border-[#D4A574]"
            >
              {stressLoading ? "加载中..." : "加载100条压测结果"}
            </button>
          </div>
          {stressHint ? <p className="mt-2 text-xs text-emerald-700">{stressHint}</p> : null}
          {stressError ? <p className="mt-2 text-xs text-rose-600">{stressError}</p> : null}
        </header>

        <section className="rounded-2xl border border-cyan-300/30 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_45%),linear-gradient(130deg,rgba(15,23,42,0.95),rgba(30,41,59,0.9))] p-6 text-slate-100">
          <h2 className="text-lg font-semibold text-cyan-100">测试输入</h2>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={14}
            className="mt-3 w-full resize-y rounded-xl border border-cyan-300/30 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300/60"
            placeholder="每行一条测试输入"
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-slate-800/60 p-3">
              <p className="text-xs text-slate-300">样本总数</p>
              <p className="mt-1 text-lg font-semibold text-cyan-100">{summary.total}</p>
            </div>
            <div className="rounded-xl bg-slate-800/60 p-3">
              <p className="text-xs text-slate-300">案由命中</p>
              <p className="mt-1 text-lg font-semibold text-cyan-100">{summary.hit}</p>
            </div>
            <div className="rounded-xl bg-slate-800/60 p-3">
              <p className="text-xs text-slate-300">未命中</p>
              <p className="mt-1 text-lg font-semibold text-rose-300">{summary.miss}</p>
            </div>
            <div className="rounded-xl bg-slate-800/60 p-3">
              <p className="text-xs text-slate-300">命中率</p>
              <p className="mt-1 text-lg font-semibold text-cyan-100">{summary.hitRate}%</p>
            </div>
            <div className="rounded-xl bg-slate-800/60 p-3">
              <p className="text-xs text-slate-300">alias / stage</p>
              <p className="mt-1 text-lg font-semibold text-cyan-100">
                {summary.aliasHit} / {summary.stageHit}
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-700/70">
            <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${summary.hitRate}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-300">
            分流：criminal {summary.criminalScope} / civil {summary.civilScope} / both {summary.bothScope}
          </p>
        </section>

        <section className="rounded-2xl border border-[rgba(212,165,116,0.35)] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[#5C4033]">逐条结果</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setViewMode("all")}
                className={`rounded-full px-3 py-1 text-xs ${viewMode === "all" ? "bg-[#5C4033] text-white" : "bg-[#FFF3E3] text-[#5C4033]"}`}
              >
                全部
              </button>
              <button
                type="button"
                onClick={() => setViewMode("hit")}
                className={`rounded-full px-3 py-1 text-xs ${viewMode === "hit" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"}`}
              >
                仅命中
              </button>
              <button
                type="button"
                onClick={() => setViewMode("miss")}
                className={`rounded-full px-3 py-1 text-xs ${viewMode === "miss" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700"}`}
              >
                仅未命中
              </button>
            </div>
          </div>
          <div className="mt-3 max-h-[520px] overflow-auto rounded-xl border border-[rgba(212,165,116,0.2)]">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 bg-[#FFF3E3]">
                <tr>
                  <th className="border border-[rgba(212,165,116,0.2)] p-2 text-left">#</th>
                  <th className="border border-[rgba(212,165,116,0.2)] p-2 text-left">输入</th>
                  <th className="border border-[rgba(212,165,116,0.2)] p-2 text-left">分流</th>
                  <th className="border border-[rgba(212,165,116,0.2)] p-2 text-left">命中来源</th>
                  <th className="border border-[rgba(212,165,116,0.2)] p-2 text-left">命中案由</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={`${row.id}-${row.input}`}>
                    <td className="border border-[rgba(212,165,116,0.2)] p-2">{row.id}</td>
                    <td className="border border-[rgba(212,165,116,0.2)] p-2">{row.input}</td>
                    <td className="border border-[rgba(212,165,116,0.2)] p-2">{row.scope}</td>
                    <td className="border border-[rgba(212,165,116,0.2)] p-2">
                      {row.selectedBy === "none" ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-700">none</span>
                      ) : row.selectedBy === "alias" ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">alias</span>
                      ) : (
                        <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-cyan-700">stage</span>
                      )}
                    </td>
                    <td className="border border-[rgba(212,165,116,0.2)] p-2">{row.cause}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {stressData ? (
          <section ref={stressSectionRef} className="rounded-2xl border border-[rgba(212,165,116,0.35)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#5C4033]">100条压测结果（含召回）</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-11">
              <div className="rounded-xl bg-[#FFF8F0] p-3">
                <p className="text-xs text-[#7A654B]">样本</p>
                <p className="mt-1 text-lg font-semibold text-[#5C4033]">{stressData.summary.sampleSize}</p>
              </div>
              <div className="rounded-xl bg-[#FFF8F0] p-3">
                <p className="text-xs text-[#7A654B]">命中率</p>
                <p className="mt-1 text-lg font-semibold text-[#5C4033]">{(stressData.summary.hitRate * 100).toFixed(2)}%</p>
              </div>
              <div className="rounded-xl bg-[#FFF8F0] p-3">
                <p className="text-xs text-[#7A654B]">alias</p>
                <p className="mt-1 text-lg font-semibold text-[#5C4033]">{(stressData.summary.aliasRate * 100).toFixed(2)}%</p>
              </div>
              <div className="rounded-xl bg-[#FFF8F0] p-3">
                <p className="text-xs text-[#7A654B]">stage</p>
                <p className="mt-1 text-lg font-semibold text-[#5C4033]">{(stressData.summary.stageRate * 100).toFixed(2)}%</p>
              </div>
              <div className="rounded-xl bg-[#FFF8F0] p-3">
                <p className="text-xs text-[#7A654B]">未命中率</p>
                <p className="mt-1 text-lg font-semibold text-[#5C4033]">{(stressData.summary.noHitRate * 100).toFixed(2)}%</p>
              </div>
              <div className="rounded-xl bg-[#FFF8F0] p-3">
                <p className="text-xs text-[#7A654B]">平均注入词</p>
                <p className="mt-1 text-lg font-semibold text-[#5C4033]">{stressData.summary.avgInjectedKeywords.toFixed(2)}</p>
              </div>
              <div className="rounded-xl bg-[#FFF8F0] p-3">
                <p className="text-xs text-[#7A654B]">预算样本</p>
                <p className="mt-1 text-lg font-semibold text-[#5C4033]">{stressData.summary.budgetSampleSize ?? 0}</p>
              </div>
              <div className="rounded-xl bg-[#FFF8F0] p-3">
                <p className="text-xs text-[#7A654B]">预算Top1命中</p>
                <p className="mt-1 text-lg font-semibold text-[#5C4033]">
                  {(((stressData.summary.budgetTop1HitRate ?? 0) as number) * 100).toFixed(2)}%
                </p>
              </div>
              <div className="rounded-xl bg-[#FFF8F0] p-3">
                <p className="text-xs text-[#7A654B]">预算Top5任一命中</p>
                <p className="mt-1 text-lg font-semibold text-[#5C4033]">
                  {(((stressData.summary.budgetTop5AnyHitRate ?? 0) as number) * 100).toFixed(2)}%
                </p>
              </div>
              <div className="rounded-xl bg-[#FFF8F0] p-3">
                <p className="text-xs text-[#7A654B]">前50命中率</p>
                <p className="mt-1 text-lg font-semibold text-[#5C4033]">
                  {(((stressData.summary.first50HitRate ?? 0) as number) * 100).toFixed(2)}%
                </p>
              </div>
              <div className="rounded-xl bg-[#FFF8F0] p-3">
                <p className="text-xs text-[#7A654B]">后50命中率</p>
                <p className="mt-1 text-lg font-semibold text-[#5C4033]">
                  {(((stressData.summary.second50HitRate ?? 0) as number) * 100).toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="mt-3 max-h-[520px] overflow-auto rounded-xl border border-[rgba(212,165,116,0.2)]">
              <table className="w-full border-collapse text-xs">
                <thead className="sticky top-0 bg-[#FFF3E3]">
                  <tr>
                    <th className="border border-[rgba(212,165,116,0.2)] p-2 text-left">#</th>
                    <th className="border border-[rgba(212,165,116,0.2)] p-2 text-left">输入</th>
                  <th className="border border-[rgba(212,165,116,0.2)] p-2 text-left">目标分流</th>
                  <th className="border border-[rgba(212,165,116,0.2)] p-2 text-left">管道分流</th>
                  <th className="border border-[rgba(212,165,116,0.2)] p-2 text-left">E→A轨迹</th>
                  <th className="border border-[rgba(212,165,116,0.2)] p-2 text-left">固定问题</th>
                  <th className="border border-[rgba(212,165,116,0.2)] p-2 text-left">随机回复</th>
                  <th className="border border-[rgba(212,165,116,0.2)] p-2 text-left">路由解析</th>
                    <th className="border border-[rgba(212,165,116,0.2)] p-2 text-left">命中案由</th>
                    <th className="border border-[rgba(212,165,116,0.2)] p-2 text-left">召回技能(Top5)</th>
                    <th className="border border-[rgba(212,165,116,0.2)] p-2 text-left">召回帖子(Top5)</th>
                    <th className="border border-[rgba(212,165,116,0.2)] p-2 text-left">召回律师(Top5,含费率)</th>
                    <th className="border border-[rgba(212,165,116,0.2)] p-2 text-left">预算匹配</th>
                  </tr>
                </thead>
                <tbody>
                  {stressData.rows.map((row, idx) => (
                    <tr key={`${row.id}-${idx}`}>
                      <td className="border border-[rgba(212,165,116,0.2)] p-2">{idx + 1}</td>
                      <td className="border border-[rgba(212,165,116,0.2)] p-2">{row.input}</td>
                      <td className="border border-[rgba(212,165,116,0.2)] p-2">{row.scope}</td>
                      <td className="border border-[rgba(212,165,116,0.2)] p-2">{row.pipelineScope}</td>
                      <td className="border border-[rgba(212,165,116,0.2)] p-2 whitespace-nowrap">{formatStageTrace(row.stageSnapshots)}</td>
                      <td className="border border-[rgba(212,165,116,0.2)] p-2">{row.fixedQuestions.join(" / ")}</td>
                      <td className="border border-[rgba(212,165,116,0.2)] p-2">{row.randomReplies.join(" / ")}</td>
                      <td className="border border-[rgba(212,165,116,0.2)] p-2">
                        {row.routedUserType} / {row.routedDemandMode} / {row.routedLegalDomain ?? "-"} / {row.routedCity ?? "-"} /{" "}
                        {row.routedServicePreference ?? "-"} / {row.routedBudgetPreference ?? row.routedBudgetLevel ?? "-"}
                      </td>
                      <td className="border border-[rgba(212,165,116,0.2)] p-2">{row.causeLabel ?? "-"}</td>
                      <td className="border border-[rgba(212,165,116,0.2)] p-2">{row.recallSkills.join(" / ")}</td>
                      <td className="border border-[rgba(212,165,116,0.2)] p-2">{row.recallPosts.join(" / ")}</td>
                      <td className="border border-[rgba(212,165,116,0.2)] p-2">
                        {(row.recallLawyersWithRate ?? row.recallLawyers).join(" / ")}
                      </td>
                      <td className="border border-[rgba(212,165,116,0.2)] p-2">
                        {row.budgetRuleTarget ?? "-"} / {(row.lawyerBudgetMatchTrace ?? []).join(" / ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
