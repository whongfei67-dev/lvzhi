"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  buildRecommendationProfile,
  clearRecommendationProfile,
  saveRecommendationProfile,
} from "@/lib/recommendation/recommendation-engine";
import {
  AMBIGUOUS_SCOPE_CORPUS,
  CIVIL_SCOPE_CORPUS,
  CRIMINAL_SCOPE_CORPUS,
} from "@/lib/recommendation/config/cause-scope-corpus";

type ScopeMode = "criminal" | "civil" | "mixed";

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function buildRandomInput(mode: ScopeMode): string {
  if (mode === "criminal") {
    return String(pickRandom(CRIMINAL_SCOPE_CORPUS));
  }
  if (mode === "civil") {
    return String(pickRandom(CIVIL_SCOPE_CORPUS));
  }
  const left = String(pickRandom([...CRIMINAL_SCOPE_CORPUS, ...CIVIL_SCOPE_CORPUS]));
  const right = String(pickRandom(AMBIGUOUS_SCOPE_CORPUS));
  return `${left}，${right}`;
}

function buildRandomAnswers(mode: ScopeMode): string[] {
  const common = ["预算中等", "需要尽快处理", "希望先拿到可执行方案"];
  if (mode === "criminal") {
    return [pickRandom(["已被传唤", "还没拘留", "家属代问"]), ...common.slice(0, 2)];
  }
  if (mode === "civil") {
    return [pickRandom(["有转账记录", "有合同文本", "只有聊天记录"]), ...common.slice(0, 2)];
  }
  return [pickRandom(["信息不完整", "先判断方向", "需要先分流"]), ...common.slice(0, 2)];
}

export default function RecommendationRandomTestPage() {
  const [mode, setMode] = useState<ScopeMode>("mixed");
  const [input, setInput] = useState<string>(() => buildRandomInput("mixed"));
  const [answers, setAnswers] = useState<string[]>(() => buildRandomAnswers("mixed"));
  const [status, setStatus] = useState("");

  const profile = useMemo(() => buildRecommendationProfile(input, answers), [input, answers]);

  function reroll(nextMode: ScopeMode = mode): void {
    setMode(nextMode);
    setInput(buildRandomInput(nextMode));
    setAnswers(buildRandomAnswers(nextMode));
    setStatus("");
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] px-4 py-10 text-[#2C2416]">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-[rgba(212,165,116,0.35)] bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#B8860B]">推荐系统随机测试页</p>
          <h1 className="mt-2 text-2xl font-bold text-[#5C4033]">随机推荐回归测试（技能 / 帖子 / 律师）</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#5D4E3A]">
            一键抽取测试语料并生成推荐结果，便于快速验证推荐准确性和稳定性。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/project-test"
              className="rounded-xl border border-[rgba(212,165,116,0.35)] bg-[#FFF8F0] px-3 py-1.5 text-sm text-[#5C4033] hover:border-[#D4A574]"
            >
              返回联调总页
            </Link>
            <Link
              href="/project-test/recommendation-parser"
              className="rounded-xl border border-[rgba(212,165,116,0.35)] bg-[#FFF8F0] px-3 py-1.5 text-sm text-[#5C4033] hover:border-[#D4A574]"
            >
              打开解析测试页
            </Link>
            <Link
              href="/?rec_debug=1"
              className="rounded-xl border border-[rgba(212,165,116,0.35)] bg-[#FFF8F0] px-3 py-1.5 text-sm text-[#5C4033] hover:border-[#D4A574]"
            >
              打开首页（调试）
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-cyan-300/30 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_45%),linear-gradient(130deg,rgba(15,23,42,0.95),rgba(30,41,59,0.9))] p-6 text-slate-100">
          <h2 className="text-lg font-semibold text-cyan-100">随机输入控制台</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => reroll("criminal")}
              className="rounded-full border border-cyan-300/35 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-400/20"
            >
              刑事随机
            </button>
            <button
              type="button"
              onClick={() => reroll("civil")}
              className="rounded-full border border-cyan-300/35 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-400/20"
            >
              民事随机
            </button>
            <button
              type="button"
              onClick={() => reroll("mixed")}
              className="rounded-full border border-cyan-300/35 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-400/20"
            >
              混合随机
            </button>
          </div>
          <div className="mt-4 rounded-xl border border-cyan-300/30 bg-slate-800/50 p-3">
            <p className="text-xs text-cyan-200">当前模式：{mode}</p>
            <p className="mt-2 text-sm text-slate-100">输入：{input}</p>
            <p className="mt-2 text-xs text-slate-300">追问：{answers.join(" / ")}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                saveRecommendationProfile(profile);
                setStatus("已写入随机推荐状态，可去首页查看模块排序与推荐卡。");
              }}
              className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
            >
              写入当前随机结果
            </button>
            <button
              type="button"
              onClick={() => {
                clearRecommendationProfile();
                setStatus("已清除推荐状态。");
              }}
              className="rounded-xl border border-slate-300/30 bg-slate-700/40 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-cyan-300/45"
            >
              清除推荐状态
            </button>
          </div>
          {status ? <p className="mt-2 text-xs text-cyan-100">{status}</p> : null}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[rgba(212,165,116,0.35)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#5C4033]">技能 Top 10</h3>
            <ul className="mt-3 space-y-2 text-xs text-[#2C2416]">
              {profile.modules.skills.slice(0, 10).map((item) => (
                <li key={item.id} className="rounded-lg bg-[#FFF8F0] p-2">
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-[11px] text-[#6E5B45]">{item.id}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[rgba(212,165,116,0.35)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#5C4033]">帖子 Top 10</h3>
            <ul className="mt-3 space-y-2 text-xs text-[#2C2416]">
              {profile.modules.posts.slice(0, 10).map((item) => (
                <li key={item.id} className="rounded-lg bg-[#FFF8F0] p-2">
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-[11px] text-[#6E5B45]">{item.id}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[rgba(212,165,116,0.35)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#5C4033]">律师 Top 10</h3>
            <ul className="mt-3 space-y-2 text-xs text-[#2C2416]">
              {profile.modules.lawyers.slice(0, 10).map((item) => (
                <li key={item.id} className="rounded-lg bg-[#FFF8F0] p-2">
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-[11px] text-[#6E5B45]">{item.id}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
