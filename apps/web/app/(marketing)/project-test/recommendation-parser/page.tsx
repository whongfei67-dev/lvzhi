"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  buildQuestionFlow,
  buildRecommendationProfile,
  clearRecommendationProfile,
  parseUserDemand,
  saveRecommendationProfile,
} from "@/lib/recommendation/recommendation-engine";

const EXAMPLES = [
  "我在上海市，公司想采购外包律师做合同审查",
  "我被公司辞退了，在北京，想找律师看赔偿",
  "我是法学生，想在深圳找知识产权实习",
  "我要投诉平台售后，马上处理",
];

export default function RecommendationParserPage() {
  const [input, setInput] = useState(EXAMPLES[0]);
  const [answersText, setAnswersText] = useState("甲方\n预算充足\n合同审查");
  const [status, setStatus] = useState("");

  const answers = useMemo(
    () =>
      answersText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    [answersText],
  );

  const parsed = useMemo(() => parseUserDemand(input, answers), [input, answers]);
  const profile = useMemo(() => buildRecommendationProfile(input, answers), [input, answers]);
  const questionFlow = useMemo(() => buildQuestionFlow(input), [input]);

  return (
    <div className="min-h-screen bg-[#FFF8F0] px-4 py-10 text-[#2C2416]">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-[rgba(212,165,116,0.35)] bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#B8860B]">推荐系统测试页</p>
          <h1 className="mt-2 text-2xl font-bold text-[#5C4033]">推荐解析测试页（规则引擎）</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#5D4E3A]">
            用于内测解析规则、标签有效性校验与模块输出。可一键写入推荐状态后跳到首页查看真实展示。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/project-test"
              className="rounded-xl border border-[rgba(212,165,116,0.35)] bg-[#FFF8F0] px-3 py-1.5 text-sm text-[#5C4033] hover:border-[#D4A574]"
            >
              返回联调总页
            </Link>
            <Link
              href="/project-test/recommendation-demo"
              className="rounded-xl border border-[rgba(212,165,116,0.35)] bg-[#FFF8F0] px-3 py-1.5 text-sm text-[#5C4033] hover:border-[#D4A574]"
            >
              返回验收页
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-cyan-300/30 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_45%),linear-gradient(130deg,rgba(15,23,42,0.95),rgba(30,41,59,0.9))] p-6 text-slate-100">
          <h2 className="text-lg font-semibold text-cyan-100">输入与回答</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setInput(item)}
                className="rounded-full border border-cyan-300/35 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-400/20"
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs text-slate-300">用户输入</p>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-xl border border-cyan-300/30 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300/60"
              />
            </div>
            <div>
              <p className="mb-1 text-xs text-slate-300">追问回答（每行一条）</p>
              <textarea
                value={answersText}
                onChange={(e) => setAnswersText(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-xl border border-cyan-300/30 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300/60"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                saveRecommendationProfile(profile);
                setStatus("已写入推荐状态，可前往首页查看。");
              }}
              className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
            >
              写入推荐状态
            </button>
            <Link
              href="/?rec_debug=1"
              className="rounded-xl border border-cyan-300/35 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/20"
            >
              打开首页（调试模式）
            </Link>
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

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[rgba(212,165,116,0.35)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#5C4033]">解析结果（parseUserDemand）</h3>
            <pre className="mt-3 max-h-[420px] overflow-auto rounded-lg bg-[#FFF8F0] p-3 text-xs text-[#2C2416]">
              {JSON.stringify(parsed, null, 2)}
            </pre>
          </div>
          <div className="rounded-2xl border border-[rgba(212,165,116,0.35)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#5C4033]">问题流（buildQuestionFlow）</h3>
            <pre className="mt-3 max-h-[420px] overflow-auto rounded-lg bg-[#FFF8F0] p-3 text-xs text-[#2C2416]">
              {JSON.stringify(questionFlow, null, 2)}
            </pre>
          </div>
        </section>

        <section className="rounded-2xl border border-[rgba(212,165,116,0.35)] bg-white p-5">
          <h3 className="text-sm font-semibold text-[#5C4033]">推荐结果（buildRecommendationProfile）</h3>
          <pre className="mt-3 max-h-[520px] overflow-auto rounded-lg bg-[#FFF8F0] p-3 text-xs text-[#2C2416]">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </section>
      </div>
    </div>
  );
}
