"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, Sparkles, X } from "lucide-react";
import type { RecommendationProfile } from "@/lib/recommendation/recommendation-engine";

type DemandRecommendationBarProps = {
  profile: RecommendationProfile;
  onClear: () => void;
  compact?: boolean;
};

export function DemandRecommendationBar({ profile, onClear, compact = false }: DemandRecommendationBarProps) {
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const demandModeLabelMap: Record<string, string> = {
    solve_problem: "问题解决",
    seek_help: "寻求帮助",
    collaboration: "合作对接",
    job: "求职匹配",
    creator: "创作成长",
    after_sales: "售后反馈",
  };
  const parsedDemand = profile.parsedDemand;
  const globalReason =
    profile.globalReason || "根据您的输入，律植会优先为您推荐相关技能、律师、社区经验和合作机会。";
  const invalidKeywords = parsedDemand?.tagValidation.invalidKeywords ?? [];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const queryDebugEnabled = new URLSearchParams(window.location.search).get("rec_debug") === "1";
    const localDebugEnabled = window.localStorage.getItem("lvzhi:recommendation:debug") === "1";
    setShowDebugPanel(queryDebugEnabled || localDebugEnabled);
  }, []);

  return (
    <div className="rounded-2xl border border-cyan-300/25 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_40%),linear-gradient(140deg,rgba(15,23,42,0.92),rgba(30,41,59,0.88))] p-4 text-slate-100 shadow-[0_18px_50px_-24px_rgba(8,145,178,0.55)] backdrop-blur">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-cyan-300/35 bg-cyan-300/10 text-cyan-200">
            <BrainCircuit className="h-4 w-4" />
          </span>
          <p className="text-sm font-semibold tracking-wide text-cyan-100">根据你的需求推荐</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-400/30 bg-slate-700/30 px-2 py-1 text-xs text-slate-200 transition hover:border-cyan-300/40 hover:text-cyan-100"
        >
          <X className="h-3.5 w-3.5" />
          清除推荐
        </button>
      </div>

      <div className="space-y-2 text-xs leading-relaxed text-slate-200">
        <p>
          <span className="text-slate-300">关键词：</span>
          {profile.keywords.join("、")}
        </p>
        <p>
          <span className="text-slate-300">推荐路由：</span>
          {profile.path === "lawyer_path" ? "找律师路子" : "找合作路子"}
        </p>
        {!compact ? (
          <p>
            <span className="text-slate-300">案件类型：</span>
            {profile.caseType === "labor_dispute" ? "劳动争议" : "通用"}
          </p>
        ) : null}
        {parsedDemand ? (
          <p>
            <span className="text-slate-300">需求方向：</span>
            {demandModeLabelMap[parsedDemand.demandMode] ?? "通用"}
            {parsedDemand.city ? ` · 城市：${parsedDemand.city}` : ""}
            {parsedDemand.legalDomain ? ` · 领域：${parsedDemand.legalDomain}` : ""}
          </p>
        ) : null}
      </div>

      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
        <Sparkles className="h-3.5 w-3.5" />
        {globalReason}
      </p>

      {showDebugPanel && parsedDemand ? (
        <div className="mt-3 rounded-lg border border-amber-300/30 bg-amber-200/10 p-3 text-[11px] leading-relaxed text-amber-100">
          <p>
            <span className="text-amber-200">[debug]</span> userType={parsedDemand.userType}, mindset=
            {parsedDemand.mindset}
          </p>
          <p>
            <span className="text-amber-200">[debug]</span> 有效关键词=
            {parsedDemand.tagValidation.validKeywords.join("、") || "无"}
          </p>
          {invalidKeywords.length > 0 ? (
            <p>
              <span className="text-amber-200">[debug]</span> 无效关键词=
              {invalidKeywords.join("、")}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

