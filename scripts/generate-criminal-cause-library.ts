import fs from "node:fs";
import path from "node:path";

type CriminalCauseNode = {
  id: string;
  level: 1 | 2 | 3;
  chapterIndex?: number;
  sectionIndex?: number;
  itemIndex?: number;
  label: string;
  parentId: string | null;
  path: string[];
};

const SOURCE_TXT_PATH = "/Users/jinbaowang/Desktop/律植项目/标签库/刑法标签库.txt";
const OUTPUT_TS_PATH =
  "/Users/jinbaowang/Desktop/律植项目/律植（新）代码/apps/web/lib/recommendation/config/criminal-cause-library.ts";
const ROOT_LABEL = "刑事案由";

function normalizeLine(input: string): string {
  return input
    .replace(/\u200f/g, "")
    .replace(/\s+$/g, "")
    .trim();
}

function escapeTsString(input: string): string {
  return input.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function isHeaderNoise(line: string): boolean {
  return [
    "序号",
    "罪名",
    "条目",
    "一档",
    "二档",
    "三档",
    "附加刑",
    "同上",
  ].includes(line);
}

function isPenaltyLine(line: string): boolean {
  return /(\d+年|年以下|年以上|年-|\d+个月|无期|死刑|拘役|罚金|没收财产|剥夺政治权利)/.test(line);
}

function parseCriminalCauseNodes(rawText: string): CriminalCauseNode[] {
  const lines = rawText.split(/\r?\n/).map(normalizeLine).filter(Boolean);
  const nodes: CriminalCauseNode[] = [];

  let currentChapter: { id: string; index: number; label: string } | null = null;
  let currentSection: { id: string; index: number; label: string } | null = null;
  let lastItemIndex = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (line.includes("刑法") && line.includes("罪名") && line.includes("一览表")) continue;
    if (isHeaderNoise(line)) continue;

    const chapterMatch = line.match(/^第([一二三四五六七八九十百零〇两]+)章\s+(.+?)(?:（\d+）|\(\d+\))?$/);
    if (chapterMatch) {
      const chapterIndex = nodes.filter((n) => n.level === 1).length + 1;
      const label = chapterMatch[2].trim();
      const id = `criminal-l1-${chapterIndex}`;
      nodes.push({
        id,
        level: 1,
        chapterIndex,
        label,
        parentId: null,
        path: [ROOT_LABEL, label],
      });
      currentChapter = { id, index: chapterIndex, label };
      currentSection = null;
      continue;
    }

    const sectionMatch = line.match(/^第([一二三四五六七八九十百零〇两]+)节\s+(.+?)(?:（\d+）|\(\d+\))?$/);
    if (sectionMatch && currentChapter) {
      const sectionIndex = nodes.filter(
        (n) => n.level === 2 && n.chapterIndex === currentChapter?.index,
      ).length + 1;
      const label = sectionMatch[2].trim();
      const id = `criminal-l2-${currentChapter.index}-${sectionIndex}`;
      nodes.push({
        id,
        level: 2,
        chapterIndex: currentChapter.index,
        sectionIndex,
        label,
        parentId: currentChapter.id,
        path: [ROOT_LABEL, currentChapter.label, label],
      });
      currentSection = { id, index: sectionIndex, label };
      continue;
    }

    if (/^\d+$/.test(line) && currentChapter) {
      let label: string | null = null;
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j += 1) {
        const next = lines[j];
        if (!next || isHeaderNoise(next)) continue;
        if (/^\d+$/.test(next)) break;
        if (/^第[一二三四五六七八九十百零〇两]+[章节]/.test(next)) break;
        if (/^\d+条/.test(next) || next.includes("同上")) continue;
        if (isPenaltyLine(next)) continue;
        label = next;
        break;
      }
      if (!label || !label.includes("罪")) continue;

      const rawItemIndex = Number(line);
      const itemIndex = rawItemIndex <= lastItemIndex ? lastItemIndex + 1 : rawItemIndex;
      const parentId = currentSection?.id ?? currentChapter.id;
      const id = currentSection
        ? `criminal-l3-${currentChapter.index}-${currentSection.index}-${itemIndex}`
        : `criminal-l3-${currentChapter.index}-0-${itemIndex}`;
      const pathParts = [ROOT_LABEL, currentChapter.label];
      if (currentSection) pathParts.push(currentSection.label);
      pathParts.push(label);
      nodes.push({
        id,
        level: 3,
        chapterIndex: currentChapter.index,
        sectionIndex: currentSection?.index,
        itemIndex,
        label,
        parentId,
        path: pathParts,
      });
      lastItemIndex = itemIndex;
      continue;
    }
  }

  const deduped: CriminalCauseNode[] = [];
  const seen = new Set<string>();
  for (const node of nodes) {
    const key = `${node.level}|${node.path.join(">")}|${node.parentId ?? "root"}|${node.itemIndex ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(node);
  }
  return deduped;
}

function renderOutput(nodes: CriminalCauseNode[]): string {
  const rows = nodes
    .map((node) => {
      const pathLiteral = `[${node.path.map((p) => `"${escapeTsString(p)}"`).join(", ")}]`;
      const fields = [
        `id: "${node.id}"`,
        `level: ${node.level}`,
        `label: "${escapeTsString(node.label)}"`,
        `parentId: ${node.parentId ? `"${node.parentId}"` : "null"}`,
        `path: ${pathLiteral}`,
      ];
      if (typeof node.chapterIndex === "number") fields.push(`chapterIndex: ${node.chapterIndex}`);
      if (typeof node.sectionIndex === "number") fields.push(`sectionIndex: ${node.sectionIndex}`);
      if (typeof node.itemIndex === "number") fields.push(`itemIndex: ${node.itemIndex}`);
      return `  { ${fields.join(", ")} }`;
    })
    .join(",\n");

  return `/**
 * Auto-generated from 标签库/刑法标签库.txt.
 * Level mapping:
 * - L1: 第X章
 * - L2: 第X节
 * - L3: 序号+罪名（1. / 序号列）
 * Root label is "${ROOT_LABEL}".
 */
export type CriminalCauseNode = {
  id: string;
  level: 1 | 2 | 3;
  label: string;
  parentId: string | null;
  path: string[];
  chapterIndex?: number;
  sectionIndex?: number;
  itemIndex?: number;
};

export const CRIMINAL_CAUSE_ROOT_LABEL = "${ROOT_LABEL}";

export const CRIMINAL_CAUSE_LIBRARY: CriminalCauseNode[] = [
${rows}
];

export const CRIMINAL_CAUSE_LABEL_SET = new Set(CRIMINAL_CAUSE_LIBRARY.map((item) => item.label));

export const CRIMINAL_CAUSE_LEAF_LABEL_SET = new Set(
  CRIMINAL_CAUSE_LIBRARY.filter((item) => item.level === 3).map((item) => item.label),
);
`;
}

function main(): void {
  const sourceText = fs.readFileSync(SOURCE_TXT_PATH, "utf8");
  const nodes = parseCriminalCauseNodes(sourceText);
  const output = renderOutput(nodes);
  fs.mkdirSync(path.dirname(OUTPUT_TS_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_TS_PATH, output, "utf8");
  console.log(`Generated ${nodes.length} criminal cause nodes -> ${OUTPUT_TS_PATH}`);
}

main();
