import fs from "node:fs";
import path from "node:path";
import { buildQuestionFlow, buildRecommendationProfile, inspectCausePipeline } from "../apps/web/lib/recommendation/recommendation-engine";

type Scope = "civil" | "criminal";

type MappingSeed = {
  scope: Scope;
  l1: string;
  l2: string;
  l3: string;
  keywords: string[];
};

type StressRow = {
  id: string;
  scope: Scope;
  l3: string;
  injectedKeywordCount: number;
  injectedKeywords: string[];
  input: string;
  fixedQuestions: string[];
  randomReplies: string[];
  pipelineScope: "civil" | "criminal" | "both";
  stageSnapshots: Array<{ stage: "a" | "b" | "c" | "d" | "e"; maxScore: number; remaining: number }>;
  routedUserType: string;
  routedDemandMode: string;
  routedLegalDomain: string | null;
  routedCity: string | null;
  routedBudgetLevel: "low" | "medium" | "high" | null;
  routedBudgetPreference: string | null;
  routedServicePreference: "response_time" | "budget" | "online_consult" | null;
  budgetRuleTarget: string | null;
  budgetTop1Hit: boolean;
  budgetTop5AnyHit: boolean;
  budgetTop5HitRatio: number;
  lawyerRates: number[];
  lawyerBudgetMatchFlags: boolean[];
  lawyerBudgetMatchTrace: string[];
  causeHit: boolean;
  selectedBy: "alias" | "stage" | "none";
  causeLabel: string | null;
  recallSkills: string[];
  recallPosts: string[];
  recallLawyers: string[];
  recallLawyersWithRate: string[];
};

function matchesBudgetLevel(budgetLevel: "low" | "medium" | "high" | null, hourlyRate: number): boolean {
  if (!budgetLevel) return false;
  if (budgetLevel === "low") return hourlyRate <= 800;
  if (budgetLevel === "medium") return hourlyRate >= 600 && hourlyRate <= 1300;
  return hourlyRate >= 1000;
}

type BudgetPreference = { type: "exact"; value: number } | { type: "range"; min: number; max: number } | null;

function formatBudgetPreference(preference: BudgetPreference): string | null {
  if (!preference) return null;
  if (preference.type === "exact") return `exact:${preference.value}`;
  return `range:${preference.min}-${preference.max}`;
}

function classifyBudgetMatch(
  hourlyRate: number,
  preference: BudgetPreference,
  budgetLevel: "low" | "medium" | "high" | null,
  servicePreference: "response_time" | "budget" | "online_consult" | null,
): { hit: boolean; reason: string } {
  const tolerance = servicePreference === "budget" ? 100 : 500;
  if (preference?.type === "exact") {
    if (hourlyRate === preference.value) return { hit: true, reason: "同价" };
    if (Math.abs(hourlyRate - preference.value) <= tolerance) return { hit: true, reason: `±${tolerance}` };
    return { hit: false, reason: `超出±${tolerance}` };
  }
  if (preference?.type === "range") {
    if (servicePreference === "budget") {
      const midpoint = Math.round((preference.min + preference.max) / 2);
      if (Math.abs(hourlyRate - midpoint) <= 100) return { hit: true, reason: `中位数±100(${midpoint})` };
      return { hit: false, reason: `偏离中位数±100(${midpoint})` };
    }
    if (hourlyRate >= preference.min && hourlyRate <= preference.max) return { hit: true, reason: "区间内" };
    return { hit: false, reason: "区间外" };
  }
  if (!budgetLevel) return { hit: false, reason: "无预算" };
  return {
    hit: matchesBudgetLevel(budgetLevel, hourlyRate),
    reason: `level:${budgetLevel}`,
  };
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function parseKeywordsFromSemantic(semanticCell: string): string[] {
  const keywordPart = semanticCell.match(/关键词=([^；<]+)/)?.[1] ?? "";
  return keywordPart
    .split(/[\/、]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);
}

function deriveFallbackKeywords(seed: MappingSeed): string[] {
  return Array.from(
    new Set(
      `${seed.l2} ${seed.l3}`
        .replace(/[、，,\/]/g, " ")
        .split(/\s+/)
        .map((item) => item.trim().replace(/(纠纷|争议|罪|案件)$/g, ""))
        .filter((item) => item.length >= 2),
    ),
  );
}

function buildSeedKeywordPool(seed: MappingSeed): string[] {
  const coarse = [seed.l1, seed.l2, seed.l3]
    .flatMap((text) => text.split(/[、，,\/]/))
    .map((item) => item.trim().replace(/(纠纷|争议|罪|案件)$/g, ""))
    .filter((item) => item.length >= 2);
  return Array.from(new Set([...seed.keywords, ...deriveFallbackKeywords(seed), ...coarse]));
}

function extractSeedsFromHtml(htmlPath: string, scope: Scope): MappingSeed[] {
  const html = fs.readFileSync(htmlPath, "utf8");
  const rowMatches = [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)];
  const seeds: MappingSeed[] = [];
  for (const match of rowMatches) {
    const tds = [...match[1].matchAll(/<td>([\s\S]*?)<\/td>/g)].map((m) => stripHtml(m[1]));
    if (tds.length < 6) continue;
    const l1 = tds[1] ?? "";
    const l2 = tds[2] ?? "";
    const l3 = tds[3] ?? "";
    const semantic = tds[4] ?? "";
    if (!l1 || !l3 || !semantic.includes("关键词=")) continue;
    const keywords = parseKeywordsFromSemantic(semantic);
    seeds.push({ scope, l1, l2, l3, keywords });
  }
  return seeds;
}

function sampleWithoutReplacement<T>(arr: readonly T[], count: number, rand: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, count);
}

function pickFrom<T>(arr: readonly T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)] as T;
}

function buildTriadInput(seed: MappingSeed, rand: () => number, minKeywordCount: number): { input: string; injected: string[] } {
  const subjectPool =
    seed.scope === "criminal"
      ? ["我是当事人本人", "我是家属", "我是案件相关人", "我是被通知配合的人"]
      : ["我是当事人本人", "我是权利受影响一方", "我是这起纠纷的相关方", "我是家里在处理这事的人"];
  const scenePool =
    seed.scope === "criminal"
      ? [
          "最近这件事被反复问话",
          "现在信息很碎，我只能说出部分事实",
          "我描述得不完整，细节还在补",
          "很多经过记不清，只能先给关键词",
        ]
      : [
          "最近这件事一直协商不下来",
          "我这边证据和聊天记录都比较零散",
          "目前只能先说出核心事实",
          "我不确定该走起诉还是先协商",
        ];
  const goalPool =
    seed.scope === "criminal"
      ? ["我想先判断风险和下一步程序", "我想知道怎么配合处理更稳妥", "我想先确定先做什么避免被动"]
      : ["我想确认怎么依法维权", "我想先知道起诉和证据怎么准备", "我想先把责任和赔偿边界理清楚"];
  const noiseTailPool = ["细节我可以后面再补", "先按能判断的线索帮我分流", "我先把能确定的词给你", "先别按完整案由理解"];

  const keywordPool = buildSeedKeywordPool(seed);
  const maxInject = keywordPool.length;
  const minInject = maxInject > 0 ? Math.min(minKeywordCount, maxInject) : 0;
  const injectCount = maxInject > 0 ? minInject + Math.floor(rand() * (maxInject - minInject + 1)) : 0;
  const injected = sampleWithoutReplacement(keywordPool, injectCount, rand);
  const keywordSentence = injected.length
    ? `我目前掌握的关键词有：${injected.join("、")}。`
    : "我现在还没整理出明确关键词，只能先描述大概情况。";

  const input = `${pickFrom(subjectPool, rand)}，${pickFrom(scenePool, rand)}。${keywordSentence}${pickFrom(
    goalPool,
    rand,
  )}，${pickFrom(noiseTailPool, rand)}。`;
  return { input, injected };
}

function ensureCombinedKeywordFloor(
  replies: string[],
  injected: string[],
  seed: MappingSeed,
  requiredCount: number,
): string[] {
  if (requiredCount <= injected.length) return replies;
  const pool = buildSeedKeywordPool(seed);
  const missing = pool.filter((item) => !injected.includes(item)).slice(0, Math.max(0, requiredCount - injected.length));
  if (!missing.length) return replies;
  const next = [...replies];
  const anchorIdx = Math.max(0, next.length - 2);
  next[anchorIdx] = `${next[anchorIdx]}，补充线索：${missing.join("、")}`;
  return next;
}

function buildRandomReply(
  prompt: string,
  context: { scope: Scope; l2: string; l3: string; injected: string[]; input: string },
  rand: () => number,
): string {
  const cityPool = ["北京", "上海", "深圳", "广州", "杭州", "成都"] as const;
  const budgetPool = ["预算300", "预算800", "预算1500", "预算3000"] as const;
  const servicePrefPool = ["响应时间", "预算", "线上咨询"] as const;
  const directionPool =
    context.scope === "criminal"
      ? ["刑事案件", "涉嫌罪名判断", "侦查阶段应对", "取保方向"]
      : [context.l2 || "民事纠纷", "责任认定", "证据准备", "起诉路径"];
  const goalPool =
    context.scope === "criminal"
      ? ["先看风险", "先判断是否构成犯罪", "先确认程序节点", "先看能否取保"]
      : ["先判断责任边界", "先整理证据", "先确认是否起诉", "先做赔偿测算"];
  const firstKeyword = context.injected[0] ?? context.l3;
  const secondKeyword = context.injected[1] ?? context.l2;
  const constraintPool =
    context.scope === "criminal"
      ? [
          `重点补充${firstKeyword}相关经过`,
          `先围绕${firstKeyword}把时间线说清`,
          `希望线上沟通，先提炼${firstKeyword}关键词`,
          `证据还不完整，先补${secondKeyword}线索`,
        ]
      : [
          `重点补充${firstKeyword}相关证据`,
          `先围绕${firstKeyword}把责任关系说清`,
          `希望线上沟通，先提炼${firstKeyword}关键词`,
          `证据还不完整，先补${secondKeyword}线索`,
        ];
  if (prompt.includes("更在意哪一项")) return pickFrom(servicePrefPool, rand);
  if (prompt.includes("城市")) return pickFrom(cityPool, rand);
  if (prompt.includes("预算")) return pickFrom(budgetPool, rand);
  if (prompt.includes("方向")) return pickFrom(directionPool, rand);
  if (prompt.includes("目标")) return pickFrom(goalPool, rand);
  return pickFrom(constraintPool, rand);
}

function toMarkdownTable(rows: StressRow[]): string {
  const header =
    "| # | 输入 | 目标分流 | 管道分流 | E→A轨迹 | 固定问题 | 随机回复 | 路由解析 | 注入关键词数 | 命中 | 来源 | 命中案由 | 召回技能(Top5) | 召回帖子(Top5) | 召回律师(Top5) | 预算匹配明细 |\n" +
    "|---|---|---|---|---|---|---|---|---:|---|---|---|---|---|---|---|";
  const body = rows
    .map((row, idx) => {
      const safeInput = row.input.replace(/\|/g, "/");
      const cause = (row.causeLabel ?? "-").replace(/\|/g, "/");
      const stageMap = new Map(row.stageSnapshots.map((item) => [item.stage, item] as const));
      const stageTrace = (["e", "d", "c", "b", "a"] as const)
        .map((stage) => {
          const snap = stageMap.get(stage);
          if (!snap) return `${stage.toUpperCase()}-`;
          return `${stage.toUpperCase()}${snap.maxScore > 0 ? "✓" : "✗"}(${snap.remaining})`;
        })
        .join("→");
      const skills = row.recallSkills.join(" / ").replace(/\|/g, "/");
      const posts = row.recallPosts.join(" / ").replace(/\|/g, "/");
      const lawyers = row.recallLawyersWithRate.join(" / ").replace(/\|/g, "/");
      const fixedQuestions = row.fixedQuestions.join(" / ").replace(/\|/g, "/");
      const randomReplies = row.randomReplies.join(" / ").replace(/\|/g, "/");
      const routeSummary = `${row.routedUserType};${row.routedDemandMode};${row.routedLegalDomain ?? "-"};${row.routedCity ?? "-"};${
        row.routedServicePreference ?? "-"
      };${row.routedBudgetPreference ?? row.routedBudgetLevel ?? "-"}`.replace(/\|/g, "/");
      const budgetTrace = `${row.budgetRuleTarget ?? "-"} => ${row.lawyerBudgetMatchTrace.join(" / ")}`.replace(/\|/g, "/");
      return `| ${idx + 1} | ${safeInput} | ${row.scope} | ${row.pipelineScope} | ${stageTrace} | ${fixedQuestions} | ${randomReplies} | ${routeSummary} | ${
        row.injectedKeywordCount
      } | ${row.causeHit ? "是" : "否"} | ${row.selectedBy} | ${cause} | ${skills} | ${posts} | ${lawyers} | ${budgetTrace} |`;
    })
    .join("\n");
  return `${header}\n${body}`;
}

function main(): void {
  const sampleSizeArg = Number(process.argv[2] ?? "100");
  const sampleSize = Number.isFinite(sampleSizeArg) && sampleSizeArg > 0 ? Math.floor(sampleSizeArg) : 100;
  const criminalSeeds = extractSeedsFromHtml(
    "/Users/jinbaowang/Desktop/律植项目/律植（新）代码/apps/web/public/criminal-cause-mapping-scenarios-v1.html",
    "criminal",
  );
  const civilSeeds = extractSeedsFromHtml(
    "/Users/jinbaowang/Desktop/律植项目/律植（新）代码/apps/web/public/civil-cause-level3-scenarios-v1.html",
    "civil",
  );
  const rand = mulberry32(20260506);
  const rows: StressRow[] = [];
  const firstBucketSize = Math.max(1, Math.floor(sampleSize / 2));
  for (let i = 0; i < sampleSize; i += 1) {
    const scope: Scope = i % 2 === 0 ? "criminal" : "civil";
    const pool = scope === "criminal" ? criminalSeeds : civilSeeds;
    const seed = pickFrom(pool, rand);
    const minKeywordCount = i < firstBucketSize ? 1 : 2;
    const built = buildTriadInput(seed, rand, minKeywordCount);
    const fixedQuestions = buildQuestionFlow(built.input).map((item) => item.prompt);
    const randomReplies = fixedQuestions.map((prompt) =>
      buildRandomReply(
        prompt,
        { scope, l2: seed.l2, l3: seed.l3, injected: built.injected, input: built.input },
        rand,
      ),
    );
    const normalizedReplies = ensureCombinedKeywordFloor(randomReplies, built.injected, seed, minKeywordCount);
    const trace = inspectCausePipeline(built.input, normalizedReplies);
    const profile = buildRecommendationProfile(built.input, normalizedReplies);
    const parsedDemand = profile.parsedDemand;
    const topLawyers = profile.modules.lawyers.slice(0, 5);
    const rates = topLawyers
      .map((item) => {
        const match = item.subtitle.match(/¥(\d+)\/h/);
        return match ? Number(match[1]) : null;
      })
      .filter((item): item is number => Number.isFinite(item));
    const budgetLevel = parsedDemand?.budgetLevel ?? null;
    const budgetPreference = (parsedDemand?.budgetPreference ?? null) as BudgetPreference;
    const servicePreference = parsedDemand?.lawyerServicePreference ?? null;
    const budgetRuleTarget =
      servicePreference === "budget" && budgetPreference?.type === "range"
        ? `midpoint=${Math.round((budgetPreference.min + budgetPreference.max) / 2)}`
        : budgetPreference?.type === "exact"
          ? `exact=${budgetPreference.value}`
          : budgetPreference?.type === "range"
            ? `range=${budgetPreference.min}-${budgetPreference.max}`
          : budgetLevel
            ? `level=${budgetLevel}`
            : null;
    const budgetDetails = rates.map((rate) => classifyBudgetMatch(rate, budgetPreference, budgetLevel, servicePreference));
    const budgetMatches = budgetDetails.map((item) => item.hit);
    const budgetTop1Hit = budgetMatches[0] ?? false;
    const budgetTop5AnyHit = budgetMatches.some(Boolean);
    const budgetTop5HitRatio = budgetMatches.length
      ? Number((budgetMatches.filter(Boolean).length / budgetMatches.length).toFixed(4))
      : 0;
    rows.push({
      id: `${scope[0].toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
      scope,
      l3: seed.l3,
      injectedKeywordCount: built.injected.length,
      injectedKeywords: built.injected,
      input: built.input,
      fixedQuestions,
      randomReplies: normalizedReplies,
      pipelineScope: trace.scope,
      stageSnapshots: trace.stageSnapshots,
      routedUserType: parsedDemand?.userType ?? "unknown",
      routedDemandMode: parsedDemand?.demandMode ?? "unknown",
      routedLegalDomain: parsedDemand?.legalDomain ?? null,
      routedCity: parsedDemand?.city ?? null,
      routedBudgetLevel: budgetLevel,
      routedBudgetPreference: formatBudgetPreference(budgetPreference),
      routedServicePreference: servicePreference,
      budgetRuleTarget,
      budgetTop1Hit,
      budgetTop5AnyHit,
      budgetTop5HitRatio,
      lawyerRates: rates,
      lawyerBudgetMatchFlags: budgetMatches,
      lawyerBudgetMatchTrace: rates.map((rate, idx) => `${rate}${budgetMatches[idx] ? "✓" : "✗"}(${budgetDetails[idx]?.reason ?? "-"})`),
      causeHit: (parsedDemand?.causeMatchDepth ?? 0) > 0,
      selectedBy: (parsedDemand?.causeMatchDepth ?? 0) > 0 ? trace.selectedBy : "none",
      causeLabel: parsedDemand?.causeLabel ?? null,
      recallSkills: profile.modules.skills.slice(0, 5).map((item) => item.title),
      recallPosts: profile.modules.posts.slice(0, 5).map((item) => item.title),
      recallLawyers: topLawyers.map((item) => item.title),
      recallLawyersWithRate: topLawyers.map((item) => `${item.title} | ${item.subtitle}`),
    });
  }

  const total = rows.length;
  const hit = rows.filter((item) => item.causeHit).length;
  const alias = rows.filter((item) => item.selectedBy === "alias").length;
  const stage = rows.filter((item) => item.selectedBy === "stage").length;
  const noHit = rows.filter((item) => item.selectedBy === "none").length;
  const avgInjected = rows.reduce((sum, row) => sum + row.injectedKeywordCount, 0) / total;
  const budgetRows = rows.filter((item) => item.budgetRuleTarget !== null);
  const budgetTop1HitRate = budgetRows.length ? budgetRows.filter((item) => item.budgetTop1Hit).length / budgetRows.length : 0;
  const budgetTop5AnyHitRate = budgetRows.length
    ? budgetRows.filter((item) => item.budgetTop5AnyHit).length / budgetRows.length
    : 0;
  const budgetTop5AvgHitRatio = budgetRows.length
    ? budgetRows.reduce((sum, row) => sum + row.budgetTop5HitRatio, 0) / budgetRows.length
    : 0;
  const summary = {
    sampleSize: total,
    hitRate: hit / total,
    aliasRate: alias / total,
    stageRate: stage / total,
    noHitRate: noHit / total,
    avgInjectedKeywords: avgInjected,
    budgetSampleSize: budgetRows.length,
    budgetTop1HitRate,
    budgetTop5AnyHitRate,
    budgetTop5AvgHitRatio,
    first50HitRate:
      rows.slice(0, firstBucketSize).filter((item) => item.causeHit).length / Math.max(1, firstBucketSize),
    second50HitRate:
      rows.slice(firstBucketSize).filter((item) => item.causeHit).length / Math.max(1, rows.length - firstBucketSize),
  };

  const jsonOutput = {
    generatedAt: new Date().toISOString(),
    summary,
    rows,
  };

  const jsonPath = path.resolve(
    `/Users/jinbaowang/Desktop/律植项目/律植（新）代码/data-exports/recommendation-stress-${sampleSize}.json`,
  );
  fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2), "utf8");

  const md = [
    "# 推荐链路压测（100条）",
    "",
    `- 样本数: ${summary.sampleSize}`,
    `- 案由命中率: ${(summary.hitRate * 100).toFixed(2)}%`,
    `- alias 命中率: ${(summary.aliasRate * 100).toFixed(2)}%`,
    `- stage 命中率: ${(summary.stageRate * 100).toFixed(2)}%`,
    `- 未命中率: ${(summary.noHitRate * 100).toFixed(2)}%`,
    `- 平均注入关键词数: ${summary.avgInjectedKeywords.toFixed(2)}`,
    `- 预算样本数: ${summary.budgetSampleSize}`,
    `- 预算匹配Top1命中率: ${(summary.budgetTop1HitRate * 100).toFixed(2)}%`,
    `- 预算匹配Top5任一命中率: ${(summary.budgetTop5AnyHitRate * 100).toFixed(2)}%`,
    `- 预算匹配Top5平均命中占比: ${(summary.budgetTop5AvgHitRatio * 100).toFixed(2)}%`,
    `- 前${firstBucketSize}（输入+回复至少1关键词）命中率: ${(summary.first50HitRate * 100).toFixed(2)}%`,
    `- 后${Math.max(0, sampleSize - firstBucketSize)}（输入+回复至少2关键词）命中率: ${(summary.second50HitRate * 100).toFixed(2)}%`,
    "",
    "## 逐条结果（含召回）",
    "",
    toMarkdownTable(rows),
    "",
  ].join("\n");

  const mdPath = path.resolve(`/Users/jinbaowang/Desktop/律植项目/律植（新）代码/data-exports/recommendation-stress-${sampleSize}.md`);
  fs.writeFileSync(mdPath, md, "utf8");

  console.log(`Stress run finished. summary=${JSON.stringify(summary)}`);
  console.log(`json=${jsonPath}`);
  console.log(`md=${mdPath}`);
}

main();
