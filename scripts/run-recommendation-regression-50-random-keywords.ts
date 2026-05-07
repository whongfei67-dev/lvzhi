import fs from "node:fs";
import path from "node:path";
import { inspectCausePipeline } from "../apps/web/lib/recommendation/recommendation-engine";
import {
  AMBIGUOUS_SCOPE_CORPUS,
  CIVIL_SCOPE_CORPUS,
  CRIMINAL_SCOPE_CORPUS,
} from "../apps/web/lib/recommendation/config/cause-scope-corpus";

type Bucket = "criminal" | "civil" | "mixed";

type TestRow = {
  id: string;
  bucket: Bucket;
  baseInput: string;
  injectedKeywords: string[];
  finalInput: string;
  causeHit: boolean;
  selectedBy: "alias" | "stage" | "none";
  causeLabel: string | null;
  scope: "civil" | "criminal" | "both";
};

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickSeries(pool: readonly string[], count: number, step: number, offset: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(String(pool[(offset + i * step) % pool.length]));
  }
  return out;
}

function sampleWithoutReplacement<T>(arr: readonly T[], count: number, rand: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, count);
}

const CRIMINAL_AUGMENT_POOL = [
  "诈骗",
  "盗窃",
  "危险驾驶",
  "帮信",
  "偷越国边境",
  "诽谤",
  "取保候审",
  "刑事拘留",
  "审查起诉",
  "认罪认罚",
] as const;

const CIVIL_AUGMENT_POOL = [
  "名誉权纠纷",
  "机动车交通事故责任纠纷",
  "交通事故赔偿",
  "民间借贷纠纷",
  "买卖合同纠纷",
  "劳动合同纠纷",
  "抚养费",
  "财产分割",
  "申请强制执行",
  "侵权责任纠纷",
] as const;

function buildBaseCases(): Array<{ id: string; bucket: Bucket; input: string }> {
  const criminal = pickSeries(CRIMINAL_SCOPE_CORPUS, 20, 3, 0).map((input, idx) => ({
    id: `C-${String(idx + 1).padStart(2, "0")}`,
    bucket: "criminal" as const,
    input,
  }));
  const civil = pickSeries(CIVIL_SCOPE_CORPUS, 20, 2, 1).map((input, idx) => ({
    id: `M-${String(idx + 1).padStart(2, "0")}`,
    bucket: "civil" as const,
    input,
  }));
  const mixed = Array.from({ length: 10 }).map((_, idx) => {
    const leftPool = idx % 2 === 0 ? CRIMINAL_SCOPE_CORPUS : CIVIL_SCOPE_CORPUS;
    const left = String(leftPool[(idx * 5 + 2) % leftPool.length]);
    const right = String(AMBIGUOUS_SCOPE_CORPUS[idx % AMBIGUOUS_SCOPE_CORPUS.length]);
    return {
      id: `X-${String(idx + 1).padStart(2, "0")}`,
      bucket: "mixed" as const,
      input: `${left}，${right}`,
    };
  });
  return [...criminal, ...civil, ...mixed];
}

function augmentInput(base: string, bucket: Bucket, rand: () => number): { finalInput: string; injectedKeywords: string[] } {
  const pool = bucket === "criminal" ? CRIMINAL_AUGMENT_POOL : bucket === "civil" ? CIVIL_AUGMENT_POOL : [...CRIMINAL_AUGMENT_POOL, ...CIVIL_AUGMENT_POOL];
  const injectCount = Math.floor(rand() * (pool.length + 1)); // 0..all
  const injected = sampleWithoutReplacement(pool, injectCount, rand);
  if (!injected.length) return { finalInput: base, injectedKeywords: [] };
  return { finalInput: `${base}，${injected.join("，")}`, injectedKeywords: injected };
}

function evaluate(seed: number): { rows: TestRow[]; metrics: Record<string, number>; signature: string } {
  const rand = mulberry32(seed);
  const baseCases = buildBaseCases();
  const rows: TestRow[] = [];
  let sig = "";
  for (const item of baseCases) {
    const augmented = augmentInput(item.input, item.bucket, rand);
    const trace = inspectCausePipeline(augmented.finalInput);
    rows.push({
      id: item.id,
      bucket: item.bucket,
      baseInput: item.input,
      injectedKeywords: augmented.injectedKeywords,
      finalInput: augmented.finalInput,
      causeHit: Boolean(trace.selectedLabel),
      selectedBy: trace.selectedBy,
      causeLabel: trace.selectedLabel,
      scope: trace.scope,
    });
    sig += `|${item.id}:${trace.selectedBy}:${trace.selectedLabel ?? "-"}`;
  }
  const total = rows.length;
  const hit = rows.filter((r) => r.causeHit).length;
  const aliasHit = rows.filter((r) => r.selectedBy === "alias").length;
  const stageHit = rows.filter((r) => r.selectedBy === "stage").length;
  const avgInjected = rows.reduce((sum, r) => sum + r.injectedKeywords.length, 0) / total;
  const metrics = {
    sampleSize: total,
    hitRate: hit / total,
    aliasRate: aliasHit / total,
    stageRate: stageHit / total,
    avgInjectedKeywords: avgInjected,
  };
  return { rows, metrics, signature: sig };
}

function main(): void {
  const seed = 20260506;
  const round1 = evaluate(seed);
  const round2 = evaluate(seed);
  const stable = round1.signature === round2.signature && JSON.stringify(round1.metrics) === JSON.stringify(round2.metrics);

  const output = {
    generatedAt: new Date().toISOString(),
    seed,
    stable,
    metrics: round1.metrics,
    rows: round1.rows,
  };

  const outputPath = path.resolve(
    "/Users/jinbaowang/Desktop/律植项目/律植（新）代码/data-exports/recommendation-regression-50-random-keywords.json",
  );
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");
  console.log(`Random-keyword regression finished. stable=${stable}`);
  console.log(`metrics=${JSON.stringify(round1.metrics)}`);
  console.log(`output=${outputPath}`);
}

main();
