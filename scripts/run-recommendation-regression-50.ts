import fs from "node:fs";
import path from "node:path";
import {
  buildRecommendationProfile,
  inspectCausePipeline,
} from "../apps/web/lib/recommendation/recommendation-engine";
import {
  AMBIGUOUS_SCOPE_CORPUS,
  CIVIL_SCOPE_CORPUS,
  CRIMINAL_SCOPE_CORPUS,
} from "../apps/web/lib/recommendation/config/cause-scope-corpus";

type ModuleName = "skills" | "posts" | "lawyers";

type RegressionCase = {
  id: string;
  input: string;
  bucket: "criminal" | "civil" | "mixed";
};

function pickSeries(pool: readonly string[], count: number, step: number, offset: number): string[] {
  const list: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const idx = (offset + i * step) % pool.length;
    list.push(String(pool[idx]));
  }
  return list;
}

function buildCases(): RegressionCase[] {
  const criminal = pickSeries(CRIMINAL_SCOPE_CORPUS, 20, 3, 0).map((input, idx) => ({
    id: `C-${String(idx + 1).padStart(2, "0")}`,
    input,
    bucket: "criminal" as const,
  }));
  const civil = pickSeries(CIVIL_SCOPE_CORPUS, 20, 2, 1).map((input, idx) => ({
    id: `M-${String(idx + 1).padStart(2, "0")}`,
    input,
    bucket: "civil" as const,
  }));
  const mixed = Array.from({ length: 10 }).map((_, idx) => {
    const leftPool = idx % 2 === 0 ? CRIMINAL_SCOPE_CORPUS : CIVIL_SCOPE_CORPUS;
    const left = String(leftPool[(idx * 5 + 2) % leftPool.length]);
    const right = String(AMBIGUOUS_SCOPE_CORPUS[idx % AMBIGUOUS_SCOPE_CORPUS.length]);
    return {
      id: `X-${String(idx + 1).padStart(2, "0")}`,
      input: `${left}，${right}`,
      bucket: "mixed" as const,
    };
  });
  return [...criminal, ...civil, ...mixed];
}

function hash(value: string): number {
  let h = 0;
  for (const ch of value) h = (h * 131 + ch.charCodeAt(0)) % 2147483647;
  return h;
}

function hitAtDepth(
  itemLevels: { l1?: string; l2?: string; l3?: string } | undefined,
  targetLevels: { l1: string | null; l2: string | null; l3: string | null },
): boolean {
  if (!itemLevels) return false;
  if (targetLevels.l3) return itemLevels.l3 === targetLevels.l3;
  if (targetLevels.l2) return itemLevels.l2 === targetLevels.l2;
  if (targetLevels.l1) return itemLevels.l1 === targetLevels.l1;
  return false;
}

function evaluateOnce(cases: RegressionCase[]) {
  let causeHit = 0;
  let aliasSelected = 0;
  let stageSelected = 0;
  let l1HitPositive = 0;
  let l2HitPositive = 0;
  let l3HitPositive = 0;
  const moduleRelevantHit: Record<ModuleName, number> = { skills: 0, posts: 0, lawyers: 0 };
  const moduleTotal: Record<ModuleName, number> = { skills: 0, posts: 0, lawyers: 0 };
  const caseRows: Array<Record<string, unknown>> = [];
  let signatureText = "";

  for (const row of cases) {
    const trace = inspectCausePipeline(row.input);
    const profile = buildRecommendationProfile(row.input);
    const targetLevels = {
      l1: profile.parsedDemand?.causeLevel1Label ?? null,
      l2: profile.parsedDemand?.causeLevel2Label ?? null,
      l3: profile.parsedDemand?.causeLabel ?? null,
    };
    if (trace.selectedLabel) causeHit += 1;
    if (trace.selectedBy === "alias") aliasSelected += 1;
    if (trace.selectedBy === "stage") stageSelected += 1;
    if (trace.levelHitCounts.l1 > 0) l1HitPositive += 1;
    if (trace.levelHitCounts.l2 > 0) l2HitPositive += 1;
    if (trace.levelHitCounts.l3 > 0) l3HitPositive += 1;

    (["skills", "posts", "lawyers"] as const).forEach((moduleName) => {
      const top5 = profile.modules[moduleName].slice(0, 5);
      moduleTotal[moduleName] += top5.length;
      const matched = top5.filter((item) => hitAtDepth(item.causeLevels, targetLevels)).length;
      moduleRelevantHit[moduleName] += matched;
      signatureText += `|${row.id}:${moduleName}:${top5.map((item) => item.id).join(",")}`;
    });

    caseRows.push({
      id: row.id,
      bucket: row.bucket,
      input: row.input,
      scope: trace.scope,
      selectedBy: trace.selectedBy,
      causeLabel: trace.selectedLabel,
      causePath: trace.selectedPath,
      levelHitCounts: trace.levelHitCounts,
      topIds: {
        skills: profile.modules.skills.slice(0, 5).map((item) => item.id),
        posts: profile.modules.posts.slice(0, 5).map((item) => item.id),
        lawyers: profile.modules.lawyers.slice(0, 5).map((item) => item.id),
      },
    });
  }

  return {
    metrics: {
      sampleSize: cases.length,
      causeHitRate: causeHit / cases.length,
      aliasSelectionRate: aliasSelected / cases.length,
      stageSelectionRate: stageSelected / cases.length,
      l1TokenHitRate: l1HitPositive / cases.length,
      l2TokenHitRate: l2HitPositive / cases.length,
      l3TokenHitRate: l3HitPositive / cases.length,
      skillsRelevantRate: moduleTotal.skills ? moduleRelevantHit.skills / moduleTotal.skills : 0,
      postsRelevantRate: moduleTotal.posts ? moduleRelevantHit.posts / moduleTotal.posts : 0,
      lawyersRelevantRate: moduleTotal.lawyers ? moduleRelevantHit.lawyers / moduleTotal.lawyers : 0,
    },
    signature: hash(signatureText),
    cases: caseRows,
  };
}

function main(): void {
  const cases = buildCases();
  const rounds = [evaluateOnce(cases), evaluateOnce(cases), evaluateOnce(cases)];
  const stable =
    rounds[0].signature === rounds[1].signature &&
    rounds[1].signature === rounds[2].signature &&
    JSON.stringify(rounds[0].metrics) === JSON.stringify(rounds[1].metrics) &&
    JSON.stringify(rounds[1].metrics) === JSON.stringify(rounds[2].metrics);

  const output = {
    generatedAt: new Date().toISOString(),
    stable,
    roundCount: rounds.length,
    signatures: rounds.map((item) => item.signature),
    metrics: rounds[0].metrics,
    cases: rounds[0].cases,
  };

  const outputPath = path.resolve(
    "/Users/jinbaowang/Desktop/律植项目/律植（新）代码/data-exports/recommendation-regression-50.json",
  );
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");

  console.log(`Regression finished. stable=${stable}`);
  console.log(`metrics=${JSON.stringify(rounds[0].metrics)}`);
  console.log(`output=${outputPath}`);
}

main();
