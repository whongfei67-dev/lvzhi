import fs from "node:fs";

import { CIVIL_CAUSE_LIBRARY } from "../apps/web/lib/recommendation/config/civil-cause-library";

type ScenarioPair = {
  s1: string;
  s2: string;
  s3: string;
  s4: string;
  s5: string;
};

type CivilSemanticSplit = {
  structure: string;
  subject?: string;
  predicate?: string;
  adverbial?: string;
  object?: string;
  attributive?: string;
  keywords: string[];
};

const OUTPUT_HTML_PATH =
  "/Users/jinbaowang/Desktop/律植项目/律植（新）代码/apps/web/public/civil-cause-level3-scenarios-v1.html";

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function cleanLabelToken(label: string): string {
  return label
    .replaceAll("纠纷", "")
    .replaceAll("合同", "")
    .replaceAll("争议", "")
    .replaceAll("请求", "")
    .replaceAll("之诉", "")
    .replaceAll("案件", "")
    .trim();
}

function hashSeed(input: string): number {
  let seed = 0;
  for (const ch of input) {
    seed = (seed * 131 + ch.charCodeAt(0)) % 9973;
  }
  return seed;
}

function splitLabelFragments(label: string): string[] {
  const replaced = label
    .replaceAll("申请", " 申请 ")
    .replaceAll("支付令", " 支付令 ")
    .replaceAll("确认", " 确认 ")
    .replaceAll("撤销", " 撤销 ")
    .replaceAll("执行", " 执行 ")
    .replaceAll("合同", " 合同 ")
    .replaceAll("侵权", " 侵权 ")
    .replaceAll("纠纷", " 纠纷 ")
    .replaceAll("争议", " 争议 ")
    .replaceAll("之诉", " 之诉 ")
    .replaceAll("请求", " 请求 ");
  return replaced
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

const SEMANTIC_TOKEN_LEXICON = [
  "劳动",
  "合同",
  "借贷",
  "借款",
  "欠款",
  "货款",
  "侵权",
  "赔偿",
  "损害",
  "离婚",
  "抚养",
  "继承",
  "遗嘱",
  "遗产",
  "数据",
  "网络",
  "隐私",
  "申请",
  "支付令",
  "确认",
  "撤销",
  "执行",
  "股东",
  "公司",
  "票据",
  "破产",
  "清算",
  "海事",
  "船舶",
] as const;

function pickFixedPatternKeywords(label: string): string[] {
  const tokens: string[] = [];

  // "xx权" is treated as a fixed phrase; keep the "xx" part as keyword
  for (const match of label.matchAll(/([\u4e00-\u9fa5]{1,16})权/g)) {
    const base = match[1]?.trim();
    if (base && !tokens.includes(base)) tokens.push(base);
  }

  // "xx合同" is treated as a fixed phrase; keep the "xx" part as keyword
  for (const match of label.matchAll(/([\u4e00-\u9fa5]{1,16})合同/g)) {
    const base = match[1]?.trim();
    if (base && !tokens.includes(base)) tokens.push(base);
  }

  // If there is neither "合同" nor "权", use "xx纠纷/xx争议" prefix as one keyword
  if (!tokens.length && !label.includes("合同") && !label.includes("权") && /(纠纷|争议)$/.test(label)) {
    const disputePrefix = label.replace(/(纠纷|争议)$/, "").trim();
    const core = disputePrefix
      .replace(/责任/g, "")
      .replace(/之诉/g, "")
      .replace(/请求/g, "")
      .trim();
    if (core && !tokens.includes(core)) tokens.push(core);
  }

  return tokens;
}

function semanticSplitTokens(label: string): string[] {
  const fixedPatternTokens = pickFixedPatternKeywords(label);
  if (fixedPatternTokens.length) return fixedPatternTokens.slice(0, 3);

  const cleaned = cleanLabelToken(label);
  const lexicon = [...SEMANTIC_TOKEN_LEXICON].sort((a, b) => b.length - a.length);
  const tokens: string[] = [];
  let rest = cleaned;
  for (const token of lexicon) {
    if (!rest.includes(token)) continue;
    if (!tokens.includes(token)) tokens.push(token);
    rest = rest.replace(token, " ");
  }
  const residual = rest
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);
  for (const item of residual) {
    if (!tokens.includes(item)) tokens.push(item);
  }
  if (!tokens.length && cleaned.length >= 2) tokens.push(cleaned);
  return tokens.slice(0, 3);
}

const CIVIL_VERB_CANDIDATES = [
  "申请",
  "确认",
  "撤销",
  "执行",
  "返还",
  "赔偿",
  "分割",
  "给付",
  "支付",
  "变更",
  "解除",
  "停止",
  "排除",
  "恢复",
  "清算",
  "破产",
  "认定",
] as const;

function semanticSplitCivilLabel(label: string): CivilSemanticSplit {
  const raw = label.trim();
  const keywords = semanticSplitTokens(raw);

  if (raw.startsWith("申请")) {
    return {
      structure: "谓语+宾语",
      predicate: "申请",
      object: raw.replace(/^申请/, "").trim() || "相关程序事项",
      keywords,
    };
  }

  if (raw.startsWith("确认")) {
    return {
      structure: "谓语+宾语",
      predicate: "确认",
      object: raw.replace(/^确认/, "").trim() || "相关法律状态",
      keywords,
    };
  }

  if (raw.includes("之诉")) {
    const core = raw.replace(/之诉$/, "").trim();
    const hit = CIVIL_VERB_CANDIDATES.find((verb) => core.includes(verb));
    if (hit) {
      const object = core.replace(hit, "").trim();
      return {
        structure: "谓语+宾语",
        predicate: hit,
        object: object || core,
        keywords,
      };
    }
    return {
      structure: "谓语+宾语",
      predicate: "提起诉讼",
      object: core || raw,
      keywords,
    };
  }

  if (raw.endsWith("纠纷") || raw.endsWith("争议")) {
    return {
      structure: "谓语+宾语",
      predicate: "发生争议",
      object: raw.replace(/(纠纷|争议)$/, "").trim() || raw,
      keywords,
    };
  }

  const verb = CIVIL_VERB_CANDIDATES.find((item) => raw.includes(item));
  if (verb) {
    const object = raw.replace(verb, "").trim();
    return {
      structure: "谓语+宾语",
      predicate: verb,
      object: object || raw,
      keywords,
    };
  }

  return {
    structure: "事项短语",
    object: raw,
    keywords,
  };
}

function formatCivilSemanticSplit(label: string): string {
  const split = semanticSplitCivilLabel(label);
  const parts = [`结构=${split.structure}`];
  if (split.subject) parts.push(`主语=${split.subject}`);
  if (split.predicate) parts.push(`谓语=${split.predicate}`);
  if (split.adverbial) parts.push(`状语=${split.adverbial}`);
  if (split.object) parts.push(`宾语=${split.object}`);
  if (split.attributive) parts.push(`定语=${split.attributive}`);
  parts.push(`关键词=${split.keywords.join("/")}`);
  return parts.join("；");
}

function inferNoisyRole(l2: string, l3: string, salt: string): string {
  const seed = hashSeed(`${salt}|role|${l2}|${l3}`) % 4;
  const combined = `${l2} ${l3}`;
  if (combined.includes("劳动")) return seed % 2 === 0 ? "我这边是员工这方" : "我这边算用工一方";
  if (combined.includes("婚姻") || combined.includes("抚养") || combined.includes("赡养") || combined.includes("监护")) {
    return seed % 2 === 0 ? "我这边是家里当事人" : "我是家属这边的人";
  }
  if (combined.includes("继承") || combined.includes("遗嘱") || combined.includes("遗产")) {
    return seed % 2 === 0 ? "我这边是继承关系里的一方" : "我算家里涉遗产这边";
  }
  if (combined.includes("股东") || combined.includes("公司") || combined.includes("证券") || combined.includes("票据")) {
    return seed % 2 === 0 ? "我这边是公司/投资相关一方" : "我算交易里的一方";
  }
  if (combined.includes("海事") || combined.includes("船舶") || combined.includes("海上")) {
    return seed % 2 === 0 ? "我这边是航运业务相关方" : "我是这票货运这边的人";
  }
  if (combined.includes("数据") || combined.includes("网络")) {
    return seed % 2 === 0 ? "我这边是账号/平台相关一方" : "我算业务系统这边的人";
  }
  return seed % 2 === 0 ? "我这边是当事人一方" : "我是这单里的相关方";
}

function inferNoisyGoal(l2: string, l3: string, salt: string): string {
  const seed = hashSeed(`${salt}|goal|${l2}|${l3}`) % 4;
  const combined = `${l2} ${l3}`;
  if (combined.includes("申请") || combined.includes("确认") || combined.includes("程序")) {
    return seed % 2 === 0 ? "先把流程跑起来，别卡住" : "先知道第一步该申请什么、怎么提";
  }
  if (combined.includes("合同")) {
    return seed % 2 === 0 ? "先把责任和钱这块说清" : "先把违约这条线稳住";
  }
  if (combined.includes("侵权") || combined.includes("损害")) {
    return seed % 2 === 0 ? "先把侵害止住再谈赔偿" : "先固定证据，后面能追责";
  }
  if (combined.includes("劳动")) {
    return seed % 2 === 0 ? "先保住劳动权益这条线" : "先把补偿/关系确认这一步走起来";
  }
  return seed % 2 === 0 ? "先知道第一步做什么更稳" : "先把眼前风险压住，不想走偏";
}

function pickMinimalKeywordFloor(l2: string, l3: string): 1 | 2 {
  const fragments = splitLabelFragments(cleanLabelToken(l3)).filter((item) => item.length >= 2);
  const combined = `${l2} ${l3}`;
  // procedural labels are often described with very sparse terms in real chats
  if (combined.includes("申请") || combined.includes("确认") || combined.includes("程序")) return 1;
  return fragments.length >= 2 ? 2 : 1;
}

function pickMinimalKeywords(l3: string, floor: 1 | 2): string[] {
  const generic = new Set(["纠纷", "争议", "请求", "之诉", "程序", "问题", "案件"]);
  const fragments = semanticSplitTokens(l3)
    .map((item) => item.trim())
    .filter((item) => item && !generic.has(item));
  const uniq: string[] = [];
  for (const item of fragments) {
    if (!uniq.includes(item)) uniq.push(item);
  }
  if (!uniq.length) {
    const fallback = cleanLabelToken(l3) || l3;
    if (fallback.length >= 2) uniq.push(fallback);
  }
  return uniq.slice(0, floor);
}

function buildScenarioC(l2: string, l3: string): string {
  const l2Token = cleanLabelToken(l2) || l2;
  const l3Token = cleanLabelToken(l3) || l3;
  const fragments = splitLabelFragments(l3Token);
  const first = fragments[0] ?? l3Token;
  const second = fragments[1] ?? "";
  const tail = second || fragments[2] || l3Token.slice(Math.max(0, l3Token.length - 3));
  const extra =
    fragments[2] || l3Token.replace(first, "").replace(second, "").trim().slice(0, 2) || l3Token.slice(-2);
  const role = inferNoisyRole(l2, l3, "C");
  const goal = inferNoisyGoal(l2, l3, "C");
  const style = hashSeed(`${l2}|${l3}`) % 6;
  if (style === 0) {
    // only keep one fragment; user wording is incomplete
    return `${role}，我这边只提过“${first}”这个点，另外可能还扯到${tail}，但说不全；我想${goal}。`;
  }
  if (style === 1) {
    // split two fragments apart in different clauses
    return `${role}，现在大方向像是${l2Token}，前面聊到“${first}”，后面又扯到${tail}，但不是连着说的；我想${goal}。`;
  }
  if (style === 2) {
    return `${role}，这事儿我表达得很碎，只能确定跟“${first}”沾边，${tail}这块也有点关系；我想${goal}。`;
  }
  if (style === 3) {
    return `${role}，最近一直被这件事拖着，我可能说到过${first}、${tail}，但没按法律词说完整；我想${goal}。`;
  }
  if (style === 4) {
    return `${role}，我现在只能说个关键词“${first}”，还零碎提到${tail}和${extra}；我想${goal}。`;
  }
  return `${role}，这单像${l2Token}里的问题，我这边说法比较口语，可能只会蹦出“${first}”这种词，偶尔再提到${tail}/${extra}；我想${goal}。`;
}

function buildScenarioD(l2: string, l3: string): string {
  const l2Token = cleanLabelToken(l2) || l2;
  const l3Token = cleanLabelToken(l3) || l3;
  const fragments = splitLabelFragments(l3Token);
  const first = fragments[0] ?? l3Token.slice(0, 2);
  const second = fragments[1] ?? l3Token.slice(Math.max(0, l3Token.length - 2));
  const role = inferNoisyRole(l2, l3, "D");
  const goal = inferNoisyGoal(l2, l3, "D");
  const style = hashSeed(`D|${l2}|${l3}`) % 5;
  if (style === 0) {
    return `${role}，我可能就说得出“${first}”，别的都讲不顺，记录也不齐；我想${goal}。`;
  }
  if (style === 1) {
    return `${role}，大概是${l2Token}这类，前面提过${first}，隔了很久又提到${second}，中间很多细节想不起来；我想${goal}。`;
  }
  if (style === 2) {
    return `${role}，事情有点乱，聊天里只零散出现过${first}/${second}，我不确定这算不算同一件法律问题；我想${goal}。`;
  }
  if (style === 3) {
    return `${role}，我现在说法很口语，可能只是“${first}那个事”这种表达，证据也东一块西一块；我想${goal}。`;
  }
  return `${role}，先给你两个词：${first}、${second}。我这边其他信息不完整；我想${goal}。`;
}

function buildScenarioE(l2: string, l3: string): string {
  const role = inferNoisyRole(l2, l3, "E");
  const goal = inferNoisyGoal(l2, l3, "E");
  const floor = pickMinimalKeywordFloor(l2, l3);
  const keywords = pickMinimalKeywords(l3, floor);
  const style = hashSeed(`E|${l2}|${l3}`) % 3;
  if (style === 0) {
    return `${role}，我现在只能稳定描述${keywords.join("、")}这${keywords.length}个点，其他信息都不太完整；我想${goal}。`;
  }
  if (style === 1) {
    return `${role}，聊天里能确定的词就${keywords.join("、")}（数量下限=${keywords.length}），其余细节有缺口；我想${goal}。`;
  }
  return `${role}，我先给到最小可判断线索：${keywords.join(" / ")}，别的信息可能后补；我想${goal}。`;
}

function buildScenarios(level2Label: string, level3Label: string): ScenarioPair {
  const label = level3Label;
  const uniqueC = buildScenarioC(level2Label, level3Label);
  const uniqueD = buildScenarioD(level2Label, level3Label);
  const uniqueE = buildScenarioE(level2Label, level3Label);
  if (label.includes("合同")) {
    return {
      s1: `我是合同一方当事人，碰到${label}相关争议，想确认合同责任并主张继续履行或解除。`,
      s2: `我是交易相对方，碰到${label}导致损失，想固定证据后主张违约赔偿。`,
      s3: uniqueC,
      s4: uniqueD,
      s5: uniqueE,
    };
  }
  if (label.includes("侵权") || label.includes("损害")) {
    return {
      s1: `我是权利人，碰到${label}行为，想要求停止侵害并赔偿损失。`,
      s2: `我是受害方，碰到${label}后果，想追究责任主体并恢复权益。`,
      s3: uniqueC,
      s4: uniqueD,
      s5: uniqueE,
    };
  }
  if (label.includes("劳动")) {
    return {
      s1: `我是劳动者，碰到${label}争议，想确认用工关系并主张劳动权益。`,
      s2: `我是用人单位，碰到${label}纠纷，想明确责任边界并依法处理。`,
      s3: uniqueC,
      s4: uniqueD,
      s5: uniqueE,
    };
  }
  if (label.includes("继承") || label.includes("遗嘱") || label.includes("遗产")) {
    return {
      s1: `我是继承人，碰到${label}分配争议，想确认继承份额和处理方案。`,
      s2: `我是利害关系人，碰到${label}冲突，想通过诉讼明确遗产处置规则。`,
      s3: uniqueC,
      s4: uniqueD,
      s5: uniqueE,
    };
  }
  if (label.includes("婚姻") || label.includes("抚养") || label.includes("赡养") || label.includes("监护")) {
    return {
      s1: `我是家庭成员，碰到${label}问题，想确认权利义务并调整家庭安排。`,
      s2: `我是当事人，碰到${label}争议，想依法主张财产或人身权益。`,
      s3: uniqueC,
      s4: uniqueD,
      s5: uniqueE,
    };
  }
  if (label.includes("股东") || label.includes("公司") || label.includes("证券") || label.includes("票据")) {
    return {
      s1: `我是投资人/股东，碰到${label}争议，想确认公司治理或交易权益。`,
      s2: `我是交易参与方，碰到${label}风险，想追究责任并挽回损失。`,
      s3: uniqueC,
      s4: uniqueD,
      s5: uniqueE,
    };
  }
  if (label.includes("破产") || label.includes("清算")) {
    return {
      s1: `我是债权人，碰到${label}程序问题，想确认受偿顺位并维护债权。`,
      s2: `我是企业相关方，碰到${label}争议，想推动程序合规并保障分配。`,
      s3: uniqueC,
      s4: uniqueD,
      s5: uniqueE,
    };
  }
  if (label.includes("海事") || label.includes("船舶") || label.includes("海上")) {
    return {
      s1: `我是海运业务参与方，碰到${label}争议，想确认责任并主张赔偿。`,
      s2: `我是航运经营方，碰到${label}纠纷，想明确合同履行和风险承担。`,
      s3: uniqueC,
      s4: uniqueD,
      s5: uniqueE,
    };
  }
  if (label.includes("数据") || label.includes("网络")) {
    return {
      s1: `我是平台/用户，碰到${label}争议，想确认数据或虚拟财产权益归属。`,
      s2: `我是业务方，碰到${label}风险，想停止侵害并主张经济损失。`,
      s3: uniqueC,
      s4: uniqueD,
      s5: uniqueE,
    };
  }
  if (label.includes("申请") || label.includes("确认") || label.includes("程序")) {
    return {
      s1: `我是申请人，碰到${label}场景，想通过法院程序快速确认权利状态。`,
      s2: `我是利害关系人，碰到${label}流程争议，想申请司法审查或救济。`,
      s3: uniqueC,
      s4: uniqueD,
      s5: uniqueE,
    };
  }
  return {
    s1: `我是当事人，碰到${label}相关问题，想先确认法律关系与责任边界。`,
    s2: `我是权利受影响一方，碰到${label}争议，想通过法律程序实现救济。`,
    s3: uniqueC,
    s4: uniqueD,
    s5: uniqueE,
  };
}

function ensureUniqueScenarioText(base: string, l3: string, used: Set<string>): string {
  if (!used.has(base)) return base;
  const fragments = splitLabelFragments(cleanLabelToken(l3));
  let candidate = base;
  for (const frag of fragments) {
    if (!frag || candidate.includes(frag)) continue;
    candidate = `${base} 另外可能提到“${frag}”。`;
    if (!used.has(candidate)) return candidate;
  }
  let i = 1;
  while (used.has(candidate)) {
    candidate = `${base}（线索${i}）`;
    i += 1;
  }
  return candidate;
}

function main(): void {
  const rows = new Map<string, { l1: string; l2: string; l3: string }>();
  const scenarioCUsed = new Set<string>();
  const scenarioDUsed = new Set<string>();
  const scenarioEUsed = new Set<string>();

  for (const node of CIVIL_CAUSE_LIBRARY) {
    if (node.level !== 3) continue;
    const l1 = node.path[1] ?? "";
    const l2 = node.path[2] ?? "";
    const l3 = node.path[3] ?? "";
    if (!l1 || !l2 || !l3) continue;
    const key = `${l1}|${l2}|${l3}`;
    if (!rows.has(key)) rows.set(key, { l1, l2, l3 });
  }

  const ordered = [...rows.values()].sort((a, b) => {
    const c1 = a.l1.localeCompare(b.l1, "zh-CN");
    if (c1 !== 0) return c1;
    const c2 = a.l2.localeCompare(b.l2, "zh-CN");
    if (c2 !== 0) return c2;
    return a.l3.localeCompare(b.l3, "zh-CN");
  });

  const tableRows = ordered
    .map((item, idx) => {
      const scenarios = buildScenarios(item.l2, item.l3);
      scenarios.s3 = ensureUniqueScenarioText(scenarios.s3, item.l3, scenarioCUsed);
      if (scenarioCUsed.has(scenarios.s3)) {
        throw new Error(`Unable to dedupe C scenario for l3=${item.l3}: ${scenarios.s3}`);
      }
      scenarioCUsed.add(scenarios.s3);
      scenarios.s4 = ensureUniqueScenarioText(scenarios.s4, item.l3, scenarioDUsed);
      if (scenarioDUsed.has(scenarios.s4)) {
        throw new Error(`Unable to dedupe D scenario for l3=${item.l3}: ${scenarios.s4}`);
      }
      scenarioDUsed.add(scenarios.s4);
      scenarios.s5 = ensureUniqueScenarioText(scenarios.s5, item.l3, scenarioEUsed);
      if (scenarioEUsed.has(scenarios.s5)) {
        throw new Error(`Unable to dedupe E scenario for l3=${item.l3}: ${scenarios.s5}`);
      }
      scenarioEUsed.add(scenarios.s5);
      return `<tr>
  <td>${idx + 1}</td>
  <td>${escapeHtml(item.l1)}</td>
  <td>${escapeHtml(item.l2)}</td>
  <td>${escapeHtml(item.l3)}</td>
  <td>${escapeHtml(formatCivilSemanticSplit(item.l3))}</td>
  <td>${escapeHtml(scenarios.s1)}</td>
  <td>${escapeHtml(scenarios.s2)}</td>
  <td>${escapeHtml(scenarios.s3)}</td>
  <td>${escapeHtml(scenarios.s4)}</td>
  <td>${escapeHtml(scenarios.s5)}</td>
</tr>`;
    })
    .join("\n");

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>民事三级案由典型情境 v1</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; margin: 0; padding: 20px; color: #1f2937; }
    h1 { margin: 0 0 8px; font-size: 24px; }
    p { margin: 0 0 14px; color: #4b5563; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; vertical-align: top; }
    th { position: sticky; top: 0; background: #f9fafb; z-index: 1; }
    .wrap { max-height: calc(100vh - 120px); overflow: auto; border: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <h1>民事三级案由典型情境 v1</h1>
  <p>共 ${ordered.length} 个三级案由。每个三级案由提供 5 种典型情境（主语 + 碰到什么事儿 + 想做什么），其中 C/D 更口语化，E 为“最小关键词下限”版。</p>
  <div class="wrap">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>一级案由</th>
          <th>二级案由</th>
          <th>三级案由</th>
          <th>语义拆分结果</th>
          <th>典型情境A</th>
          <th>典型情境B</th>
          <th>典型情境C（口语版）</th>
          <th>典型情境D（碎片噪声版）</th>
          <th>典型情境E（最小关键词下限版）</th>
        </tr>
      </thead>
      <tbody>
${tableRows}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  fs.writeFileSync(OUTPUT_HTML_PATH, html, "utf8");
  console.log(`Generated ${ordered.length} level-3 scenario rows -> ${OUTPUT_HTML_PATH}`);
}

main();
