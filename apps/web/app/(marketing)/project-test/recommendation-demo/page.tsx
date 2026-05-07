"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  buildRecommendationProfile,
  clearRecommendationProfile,
  saveRecommendationProfile,
} from "@/lib/recommendation/recommendation-engine";

const DEMO_INPUT_TAGS = [
  "我被公司辞退了，想知道能不能要赔偿",
  "公司需要数据合规律师",
  "我是律师，想找企业顾问单位",
];

const CHECK_ITEMS = [
  "首页：输入需求后出现“根据你的需求推荐”解析条",
  "首页：新增“社区/经验帖推荐”与“合作机会推荐”模块",
  "首页：每张推荐卡都展示“推荐原因”",
  "首页：点击“清除推荐”后恢复默认排序",
  "灵感广场子页：顶部出现需求置顶提示条",
  "发现律师子页：顶部出现需求置顶提示条",
  "社区子页：顶部出现需求置顶提示条",
  "合作机会子页：顶部出现需求置顶提示条",
  "诉讼风险沙盘页：可填写表单并生成风险结构展示",
];

export default function RecommendationDemoPage() {
  const [customInput, setCustomInput] = useState(DEMO_INPUT_TAGS[0]);
  const [doneMap, setDoneMap] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<string>("");

  const doneCount = useMemo(
    () => Object.values(doneMap).filter(Boolean).length,
    [doneMap],
  );

  function applyDemand(input: string) {
    const normalized = input.trim();
    if (!normalized) return;
    const profile = buildRecommendationProfile(normalized, ["劳动者", "无书面通知", "现有证据是工资流水与聊天记录"]);
    saveRecommendationProfile(profile);
    setStatus(`已写入推荐状态：${normalized}`);
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] px-4 py-10 text-[#2C2416]">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-[rgba(212,165,116,0.35)] bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#B8860B]">推荐系统验收页</p>
          <h1 className="mt-2 text-2xl font-bold text-[#5C4033]">需求推荐 + 诉讼沙盘 Demo 测试页</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#5D4E3A]">
            本页仅用于测试，不影响首页结构。可一键写入推荐状态，再逐页验收展示效果。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/project-test"
              className="rounded-xl border border-[rgba(212,165,116,0.4)] bg-[#FFF8F0] px-3 py-1.5 text-sm text-[#5C4033] hover:border-[#D4A574]"
            >
              返回联调总页
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-[rgba(212,165,116,0.4)] bg-[#FFF8F0] px-3 py-1.5 text-sm text-[#5C4033] hover:border-[#D4A574]"
            >
              打开首页
            </Link>
            <Link
              href="/project-test/recommendation-parser"
              className="rounded-xl border border-[rgba(212,165,116,0.4)] bg-[#FFF8F0] px-3 py-1.5 text-sm text-[#5C4033] hover:border-[#D4A574]"
            >
              打开推荐解析测试页
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-cyan-300/30 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_45%),linear-gradient(130deg,rgba(15,23,42,0.95),rgba(30,41,59,0.9))] p-6 text-slate-100">
          <h2 className="text-lg font-semibold text-cyan-100">1) 先写入一条需求推荐状态</h2>
          <p className="mt-2 text-sm text-slate-300">点击示例标签或输入自定义需求，后续页面会读取同一推荐状态。</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {DEMO_INPUT_TAGS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setCustomInput(item);
                  applyDemand(item);
                }}
                className="rounded-full border border-cyan-300/35 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-400/20"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="w-full rounded-xl border border-cyan-300/30 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300/60"
              placeholder="输入自定义需求"
            />
            <button
              type="button"
              onClick={() => applyDemand(customInput)}
              className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
            >
              写入推荐
            </button>
            <button
              type="button"
              onClick={() => {
                clearRecommendationProfile();
                setStatus("已清除推荐状态");
              }}
              className="rounded-xl border border-slate-300/30 bg-slate-700/40 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-cyan-300/45"
            >
              清除推荐
            </button>
          </div>
          {status ? <p className="mt-3 text-xs text-cyan-100">{status}</p> : null}
        </section>

        <section className="rounded-2xl border border-[rgba(212,165,116,0.35)] bg-white p-6">
          <h2 className="text-lg font-semibold text-[#5C4033]">2) 按顺序打开这些页面验收</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link href="/" className="rounded-xl border border-[rgba(212,165,116,0.35)] px-3 py-2 text-sm hover:bg-[rgba(212,165,116,0.08)]">
              首页（需求推荐主入口）
            </Link>
            <Link href="/inspiration" className="rounded-xl border border-[rgba(212,165,116,0.35)] px-3 py-2 text-sm hover:bg-[rgba(212,165,116,0.08)]">
              灵感广场（置顶提示条）
            </Link>
            <Link href="/lawyers" className="rounded-xl border border-[rgba(212,165,116,0.35)] px-3 py-2 text-sm hover:bg-[rgba(212,165,116,0.08)]">
              发现律师（置顶提示条）
            </Link>
            <Link href="/community" className="rounded-xl border border-[rgba(212,165,116,0.35)] px-3 py-2 text-sm hover:bg-[rgba(212,165,116,0.08)]">
              社区（置顶提示条）
            </Link>
            <Link href="/opportunities" className="rounded-xl border border-[rgba(212,165,116,0.35)] px-3 py-2 text-sm hover:bg-[rgba(212,165,116,0.08)]">
              合作机会（置顶提示条）
            </Link>
            <Link href="/litigation-sandbox" className="rounded-xl border border-[rgba(212,165,116,0.35)] px-3 py-2 text-sm hover:bg-[rgba(212,165,116,0.08)]">
              诉讼风险沙盘（独立 Demo）
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-[rgba(212,165,116,0.35)] bg-white p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#5C4033]">3) 验收清单</h2>
            <span className="rounded-full bg-[rgba(212,165,116,0.16)] px-2.5 py-1 text-xs font-medium text-[#8A6C4D]">
              {doneCount}/{CHECK_ITEMS.length}
            </span>
          </div>
          <ul className="space-y-2">
            {CHECK_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-2 rounded-lg border border-[rgba(212,165,116,0.2)] px-3 py-2">
                <input
                  type="checkbox"
                  checked={Boolean(doneMap[item])}
                  onChange={(e) => setDoneMap((prev) => ({ ...prev, [item]: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 accent-[#B8860B]"
                />
                <span className="text-sm text-[#5D4E3A]">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

